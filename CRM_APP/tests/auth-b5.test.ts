// B5 acceptance through real HTTP + PostgreSQL, isolated lane and committed fixture cleanup.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import pg from "pg";
import { createStubMailer } from "../src/auth/mailer.js";
import { resetIdentifier, resetRegistry } from "../src/auth/reset.js";
import { server } from "../src/api.js";
import { pool } from "../src/db.js";
import { createAuthRuntime, type AuthRuntime } from "../src/auth/ba.js";
import {
	createPasswordService,
	PRODUCTION_SCRYPT_PARAMS,
} from "../src/auth/password.js";
import { createTenantAdmin } from "../scripts/create-tenant-admin.js";

const ORIGIN = "http://localhost:4331";
const PW = "correct horse battery 42";
const admin = new pg.Client({
	connectionString: process.env.ADMIN_DATABASE_URL,
});
const passwords = createPasswordService({
	keyring: {
		activeId: "b4",
		keys: new Map([["b4", randomBytes(32)]]),
		ephemeral: false,
	},
	params: { ...PRODUCTION_SCRYPT_PARAMS, N: 2 ** 10 },
});
const users: string[] = [],
	orgs: string[] = [];
let rt: AuthRuntime,
	authPool: pg.Pool,
	app: ReturnType<typeof server>,
	base = "";
before(async () => {
	console.error = (...args: unknown[]) =>
		errorLogs.push(args.map(String).join(" "));
	await admin.connect();
	const password = randomBytes(24).toString("hex");
	await admin.query(`ALTER ROLE crm_auth PASSWORD '${password}'`);
	const url = new URL(process.env.ADMIN_DATABASE_URL as string);
	url.username = "crm_auth";
	url.password = password;
	assert.equal(
		url.pathname,
		"/crm_lane_auth",
		"B5 must run on isolated auth lane",
	);
	authPool = new pg.Pool({ connectionString: url.toString() });
	rt = createAuthRuntime({
		mailer,
		passwords,
		pool: authPool,
		config: {
			databaseUrl: url.toString(),
			secret: randomBytes(32).toString("hex"),
			publicOrigin: ORIGIN,
			trustedOrigins: [ORIGIN],
			production: false,
			trustProxy: false,
			rateLimitEnabled: false,
		},
	});
	app = server({ auth: rt });
	await new Promise<void>((resolve) => app.listen(0, "127.0.0.1", resolve));
	base = `http://127.0.0.1:${(app.address() as { port: number }).port}`;
});
after(async () => {
	if (app) await new Promise((resolve) => app.close(resolve));
	await admin.query("BEGIN");
	try {
		await admin.query("SET LOCAL session_replication_role=replica");
		await admin.query(
			"DELETE FROM auth.verification WHERE identifier=ANY($1::text[]) OR id=ANY($2::uuid[])",
			[[...hashes], verificationIds],
		);
		await admin.query(
			"DELETE FROM auth.password_reset_latest WHERE user_id=ANY($1::uuid[])",
			[users],
		);
		// Standard properties seeded by bootstrap must leave with the committed test tenants.
		const tables = await admin.query(
			`SELECT table_name FROM information_schema.columns WHERE table_schema='crm' AND column_name='tenant_id'`,
		);
		for (const { table_name } of tables.rows)
			await admin.query(
				`DELETE FROM crm."${table_name.replaceAll('"', '""')}" WHERE tenant_id=ANY($1::uuid[])`,
				[orgs],
			);
		await admin.query(
			`DELETE FROM auth.invitation WHERE "organizationId"=ANY($1::uuid[])`,
			[orgs],
		);
		await admin.query(
			`DELETE FROM auth.member WHERE "organizationId"=ANY($1::uuid[])`,
			[orgs],
		);
		await admin.query(
			`DELETE FROM auth.session WHERE "userId"=ANY($1::uuid[])`,
			[users],
		);
		await admin.query(
			`DELETE FROM auth.account WHERE "userId"=ANY($1::uuid[])`,
			[users],
		);
		await admin.query(
			`DELETE FROM auth.organization WHERE id=ANY($1::uuid[])`,
			[orgs],
		);
		await admin.query(`DELETE FROM auth."user" WHERE id=ANY($1::uuid[])`, [
			users,
		]);
		await admin.query(
			"DELETE FROM crm.session WHERE principal_id=ANY($1::uuid[])",
			[users],
		);
		await admin.query("DELETE FROM crm.tenant WHERE id=ANY($1::uuid[])", [
			orgs,
		]);
		await admin.query("DELETE FROM crm.principal WHERE id=ANY($1::uuid[])", [
			users,
		]);
		await admin.query("COMMIT");
	} catch (error) {
		await admin.query("ROLLBACK");
		throw error;
	} finally {
		console.error = originalError;
		await rt?.close();
		await authPool?.end();
		await admin.end();
		await pool.end();
	}
});
type Reply = {
	headers: Headers;
	status: number;
	// biome-ignore lint/suspicious/noExplicitAny: real HTTP JSON assertions, not a mocked contract
	body: any;
	cookie: string;
	text: string;
};
async function req(
	method: string,
	path: string,
	body?: unknown,
	cookie = "",
	tenant = "",
	origin = ORIGIN,
): Promise<Reply> {
	const response = await fetch(base + path, {
		method,
		headers: {
			origin,
			cookie,
			"content-type": "application/json",
			"idempotency-key": randomUUID(),
			...(tenant ? { "x-tenant-id": tenant } : {}),
		},
		...(body === undefined ? {} : { body: JSON.stringify(body) }),
	});
	const text = await response.text();
	for (const cookie of response.headers.getSetCookie()) {
		const value = cookie.split(";")[0];
		if (
			value.startsWith("crm_session=") ||
			value.startsWith("__Host-crm_session=")
		) {
			const token = decodeURIComponent(
				value.split("=").slice(1).join("="),
			).split(".")[0];
			if (token) seenSessionTokens.add(token);
		}
	}
	return {
		headers: response.headers,
		status: response.status,
		body: text ? JSON.parse(text) : null,
		cookie: (response.headers.getSetCookie()[0] ?? "").split(";")[0],
		text,
	};
}
const one = async (sql: string, args: unknown[] = []) =>
	(await admin.query(sql, args)).rows[0];
const email = () => `b4-${randomUUID()}@example.test`;
async function bootstrap() {
	const e = email();
	const result = await createTenantAdmin(
		admin,
		{
			tenantName: "B5 tenant",
			slug: `b4-${randomUUID()}`,
			name: "B5 manager",
			email: e,
			password: PW,
		},
		passwords,
	);
	users.push(result.user);
	orgs.push(result.tenant);
	const signin = await req("POST", "/v1/auth/sign-in/email", {
		email: e,
		password: PW,
	});
	assert.equal(signin.status, 200);
	return { ...result, email: e, cookie: signin.cookie };
}
async function member(tenant: string, role: string) {
	const user = randomUUID(),
		e = email();
	users.push(user);
	await admin.query(
		`INSERT INTO auth."user"(id,name,email,"emailVerified") VALUES($1,'B5 member',$2,false)`,
		[user, e],
	);
	await admin.query(
		`INSERT INTO auth.account("accountId","providerId","userId",password,"updatedAt") VALUES($1::text,'credential',$1::uuid,$2,now())`,
		[user, await passwords.hash(PW)],
	);
	const row = await one(
		`INSERT INTO auth.member("organizationId","userId",role,"createdAt") VALUES($1,$2,$3,now()) RETURNING id`,
		[tenant, user, role],
	);
	const signin = await req("POST", "/v1/auth/sign-in/email", {
		email: e,
		password: PW,
	});
	assert.equal(signin.status, 200);
	return { user, email: e, id: row.id as string, cookie: signin.cookie };
}

const NEWPW = "updated horse caravan 2026!";
const NEWPW2 = "second safe caravan password 2026!";
const rawResetTokens = new Set<string>(),
	seenSessionTokens = new Set<string>();
const hashes = new Set<string>(),
	verificationIds: string[] = [];
const mailLogs: string[] = [],
	errorLogs: string[] = [];
const originalError = console.error;
const mailer = createStubMailer({
	production: false,
	env: {},
	log: (line) => mailLogs.push(line),
});
const tokenOf = (link: string) => {
	const url = new URL(link);
	assert.equal(url.search, "");
	const token = new URLSearchParams(url.hash.slice(1)).get("token") as string;
	assert.ok(token);
	hashes.add(resetIdentifier(token));
	rawResetTokens.add(token);
	return token;
};
const idOf = async (tenant: string, user: string) =>
	(
		await one(
			`SELECT id FROM auth.member WHERE "organizationId"=$1 AND "userId"=$2`,
			[tenant, user],
		)
	).id as string;
async function copy(
	manager: Awaited<ReturnType<typeof bootstrap>>,
	target: string,
) {
	const response = await req(
		"POST",
		`/v1/users/${target}/reset-password`,
		{},
		manager.cookie,
		manager.tenant,
	);
	assert.equal(response.status, 200);
	assert.equal(response.headers.get("cache-control"), "no-store");
	assert.equal(response.headers.get("referrer-policy"), "no-referrer");
	assert.ok(response.body.data.link.startsWith(`${ORIGIN}/app/reset#`));
	return { token: tokenOf(response.body.data.link), response };
}
const reset = (token: string, newPassword = NEWPW) =>
	req("POST", "/v1/auth/reset-password", { token, newPassword });
const crmSession = (cookie: string, tenant: string) =>
	req("GET", "/v1/session", undefined, cookie, tenant);
test("B5 019 registry is auth-only with RLS/ACLs; max-one pool failure rolls back and releases its connection", async () => {
	assert.equal(
		(
			await one(
				"SELECT count(*)::int n FROM public.crm_migrations WHERE version=19",
			)
		).n,
		1,
	);
	const shape =
		await one(`SELECT c.relrowsecurity rls,c.relforcerowsecurity forced,
		has_table_privilege('crm_auth',c.oid,'SELECT,INSERT,UPDATE,DELETE') ba,
		has_table_privilege('crm_runtime',c.oid,'SELECT') rt
		FROM pg_class c WHERE c.oid='auth.password_reset_latest'::regclass`);
	assert.deepEqual(shape, { rls: true, forced: false, ba: true, rt: false });
	assert.equal(
		(
			await one(
				`SELECT count(*)::int n FROM pg_class c,LATERAL aclexplode(c.relacl) a WHERE c.oid='auth.password_reset_latest'::regclass AND a.grantee=0`,
			)
		).n,
		0,
	);
	const m = await bootstrap();
	const valid = await copy(m, await idOf(m.tenant, m.user));
	const tiny = new pg.Pool({ connectionString: rt.config.databaseUrl, max: 1 });
	try {
		await assert.rejects(
			resetRegistry(tiny).replace(m.user, "missing-token-12345678901"),
			/AUTH_RESET_ISSUANCE_FAILED/,
		);
		assert.equal((await tiny.query("SELECT 1 AS n")).rows[0].n, 1);
		assert.equal(
			(
				await one(
					"SELECT count(*)::int n FROM auth.verification WHERE identifier=$1",
					[resetIdentifier(valid.token)],
				)
			).n,
			1,
		);
	} finally {
		await tiny.end();
	}
});
test("B5 manager copy-link is tenant scoped; anonymous reset-by-email is identical for known/unknown and stays OFF", async () => {
	const a = await bootstrap(),
		b = await bootstrap(),
		target = await member(a.tenant, "rep");
	for (const role of ["rep", "reader"]) {
		const actor = role === "rep" ? target : await member(a.tenant, role);
		assert.equal(
			(
				await req(
					"POST",
					`/v1/users/${target.id}/reset-password`,
					{},
					actor.cookie,
					a.tenant,
				)
			).status,
			403,
		);
	}
	assert.equal(
		(
			await req(
				"POST",
				`/v1/users/${target.id}/reset-password`,
				{},
				"",
				a.tenant,
			)
		).status,
		401,
	);
	assert.equal(
		(
			await req(
				"POST",
				`/v1/users/${target.id}/reset-password`,
				{},
				b.cookie,
				b.tenant,
			)
		).status,
		404,
	);
	assert.equal(
		(
			await req(
				"POST",
				`/v1/users/${target.id}/reset-password`,
				{},
				b.cookie,
				a.tenant,
			)
		).status,
		403,
	);
	assert.equal(
		(
			await req(
				"POST",
				`/v1/users/${target.id}/reset-password`,
				{ email: b.email },
				a.cookie,
				a.tenant,
			)
		).status,
		422,
	);
	assert.equal(
		(
			await req(
				"POST",
				`/v1/users/${target.id}/reset-password`,
				{},
				a.cookie,
				a.tenant,
				"https://evil.test",
			)
		).status,
		403,
	);
	const unknown = await req("POST", "/v1/auth/request-password-reset", {
		email: email(),
	});
	const known = await req("POST", "/v1/auth/request-password-reset", {
		email: a.email,
	});
	assert.equal(known.status, 404);
	assert.equal(unknown.status, 404);
	assert.deepEqual(
		{ ...known.body, request_id: "x" },
		{ ...unknown.body, request_id: "x" },
	);
	const issued = await copy(a, target.id);
	const row = await one(
		`SELECT identifier,"expiresAt">now()+interval '59 minutes' AND "expiresAt"<=now()+interval '61 minutes' lifetime FROM auth.verification WHERE identifier=$1`,
		[resetIdentifier(issued.token)],
	);
	assert.equal(row.identifier, resetIdentifier(issued.token));
	assert.equal(row.lifetime, true);
	assert.ok(!row.identifier.includes(issued.token));
	assert.equal(
		(await req("GET", `/v1/auth/reset-password/${issued.token}`)).status,
		404,
	);
});
test("B5 reset enforces policy before consume, is single-use, changes credential and revokes every session immediately", async () => {
	const m = await bootstrap(),
		target = await member(m.tenant, "rep");
	const second = await req("POST", "/v1/auth/sign-in/email", {
		email: target.email,
		password: PW,
	});
	const { token } = await copy(m, target.id);
	assert.equal(
		(await reset(token, "password1234")).body.code,
		"AUTH_PASSWORD_POLICY",
	);
	assert.equal(
		(await reset(token, target.email)).body.code,
		"AUTH_PASSWORD_POLICY",
	);
	assert.equal((await reset(token)).status, 200);
	assert.equal(
		(
			await one(`SELECT count(*)::int n FROM auth.session WHERE "userId"=$1`, [
				target.user,
			])
		).n,
		0,
	);
	assert.equal((await crmSession(target.cookie, m.tenant)).status, 401);
	assert.equal((await crmSession(second.cookie, m.tenant)).status, 401);
	assert.equal((await reset(token)).body.code, "AUTH_RESET_INVALID");
	assert.equal(
		(
			await req("POST", "/v1/auth/sign-in/email", {
				email: target.email,
				password: PW,
			})
		).status,
		401,
	);
	assert.equal(
		(
			await req("POST", "/v1/auth/sign-in/email", {
				email: target.email,
				password: NEWPW,
			})
		).status,
		200,
	);
	const account = await one(
		`SELECT password FROM auth.account WHERE "userId"=$1 AND "providerId"='credential'`,
		[target.user],
	);
	assert.equal((await passwords.verify(NEWPW, account.password)).ok, true);
});
test("B5 expiry and newer issuance deny old tokens without deleting 2FA/trust verification values", async () => {
	const m = await bootstrap(),
		target = await member(m.tenant, "reader");
	const sentinels: string[] = [];
	for (const prefix of ["2fa-", "trust-device-"]) {
		const identifier = createHash("sha256")
			.update(prefix + randomUUID())
			.digest("base64url");
		const row = await one(
			`INSERT INTO auth.verification(identifier,value,"expiresAt") VALUES($1,$2,now()+interval '1 day') RETURNING id`,
			[identifier, target.user],
		);
		verificationIds.push(row.id);
		sentinels.push(row.id);
	}
	const first = await copy(m, target.id);
	await admin.query(
		`UPDATE auth.verification SET "expiresAt"=now()-interval '1 second' WHERE identifier=$1`,
		[resetIdentifier(first.token)],
	);
	assert.equal((await reset(first.token)).body.code, "AUTH_RESET_INVALID");
	const second = await copy(m, target.id),
		third = await copy(m, target.id);
	assert.equal(
		(
			await one(
				"SELECT count(*)::int n FROM auth.verification WHERE identifier=$1",
				[resetIdentifier(second.token)],
			)
		).n,
		0,
	);
	assert.equal((await reset(second.token)).body.code, "AUTH_RESET_INVALID");
	assert.equal((await reset(third.token)).status, 200);
	assert.equal(
		(
			await one(
				"SELECT count(*)::int n FROM auth.verification WHERE id=ANY($1::uuid[]) AND value=$2",
				[sentinels, target.user],
			)
		).n,
		2,
	);
});

test("B5 concurrent issuance serializes across runtimes and only the final tracked token remains usable", async () => {
	const m = await bootstrap(),
		target = await member(m.tenant, "reader");
	const independent = createAuthRuntime({
		config: rt.config,
		pool: authPool,
		mailer,
		passwords,
	});
	const temporary = server({ auth: independent });
	await new Promise<void>((resolve) =>
		temporary.listen(0, "127.0.0.1", resolve),
	);
	try {
		const remoteCopy = async () => {
			const response = await fetch(
				`http://127.0.0.1:${(temporary.address() as { port: number }).port}/v1/users/${target.id}/reset-password`,
				{
					method: "POST",
					headers: {
						origin: ORIGIN,
						cookie: m.cookie,
						"x-tenant-id": m.tenant,
						"content-type": "application/json",
						"idempotency-key": randomUUID(),
					},
					body: "{}",
				},
			);
			assert.equal(response.status, 200);
			return { token: tokenOf((await response.json()).data.link) };
		};
		const [a, b] = await Promise.all([copy(m, target.id), remoteCopy()]);
		assert.notEqual(a.token, b.token);
		const latest = (
			await one(
				"SELECT identifier FROM auth.password_reset_latest WHERE user_id=$1",
				[target.user],
			)
		).identifier;
		const valid = resetIdentifier(a.token) === latest ? a : b,
			old = valid === a ? b : a;
		assert.equal(
			(
				await one(
					"SELECT count(*)::int n FROM auth.verification WHERE identifier=ANY($1::text[])",
					[[resetIdentifier(a.token), resetIdentifier(b.token)]],
				)
			).n,
			1,
		);
		assert.equal((await reset(old.token)).body.code, "AUTH_RESET_INVALID");
		assert.equal((await reset(valid.token)).status, 200);
	} finally {
		await new Promise((resolve) => temporary.close(resolve));
		await independent.close();
	}
});
test("B5 consumed reset may finish after newer issuance; scoped completion preserves the newer pending token", async () => {
	const m = await bootstrap(),
		target = await member(m.tenant, "rep"),
		first = await copy(m, target.id);
	let signal: () => void = () => {},
		release: () => void = () => {};
	const entered = new Promise<void>((resolve) => {
		signal = resolve;
	});
	const proceed = new Promise<void>((resolve) => {
		release = resolve;
	});
	const paused = createAuthRuntime({
		config: rt.config,
		pool: authPool,
		mailer,
		passwords: {
			...passwords,
			hash: async (password) => {
				if (password === NEWPW) {
					signal();
					await proceed;
				}
				return passwords.hash(password);
			},
		},
	});
	const temporary = server({ auth: paused });
	await new Promise<void>((resolve) =>
		temporary.listen(0, "127.0.0.1", resolve),
	);
	try {
		const pending = fetch(
			`http://127.0.0.1:${(temporary.address() as { port: number }).port}/v1/auth/reset-password`,
			{
				method: "POST",
				headers: { origin: ORIGIN, "content-type": "application/json" },
				body: JSON.stringify({ token: first.token, newPassword: NEWPW }),
			},
		);
		await entered;
		assert.equal(
			(
				await one(
					"SELECT count(*)::int n FROM auth.verification WHERE identifier=$1",
					[resetIdentifier(first.token)],
				)
			).n,
			0,
		);
		const newer = await copy(m, target.id);
		release();
		assert.equal((await pending).status, 200);
		assert.equal(
			(
				await one(
					"SELECT identifier FROM auth.password_reset_latest WHERE user_id=$1",
					[target.user],
				)
			).identifier,
			resetIdentifier(newer.token),
		);
		assert.equal((await reset(newer.token, NEWPW2)).status, 200);
	} finally {
		release();
		await new Promise((resolve) => temporary.close(resolve));
		await paused.close();
	}
});
test("B5 own-session listing uses ids, strips tokens, and cannot revoke another user's known session", async () => {
	const a = await bootstrap(),
		b = await bootstrap();
	const second = await req("POST", "/v1/auth/sign-in/email", {
		email: a.email,
		password: PW,
	});
	const listed = await req(
		"GET",
		"/v1/auth/list-sessions",
		undefined,
		a.cookie,
	);
	assert.equal(listed.status, 200);
	assert.equal(listed.body.length, 2);
	for (const row of listed.body) {
		assert.ok(row.id);
		assert.ok(!("token" in row));
	}
	const bSession = await one(
		`SELECT id,token FROM auth.session WHERE "userId"=$1`,
		[b.user],
	);
	assert.equal(
		(
			await req(
				"POST",
				"/v1/auth/revoke-session",
				{ sessionId: bSession.id },
				a.cookie,
			)
		).status,
		404,
	);
	assert.equal(
		(
			await req(
				"POST",
				"/v1/auth/revoke-session",
				{ token: bSession.token },
				a.cookie,
			)
		).status,
		422,
	);
	assert.equal((await crmSession(b.cookie, b.tenant)).status, 200);
	const aSessions = (
		await admin.query(
			`SELECT id,token FROM auth.session WHERE "userId"=$1 ORDER BY "createdAt"`,
			[a.user],
		)
	).rows;
	for (const row of aSessions) assert.ok(!listed.text.includes(row.token));
	assert.equal(
		(
			await req(
				"POST",
				"/v1/auth/revoke-session",
				{ sessionId: aSessions[0].id },
				second.cookie,
			)
		).status,
		200,
	);
	assert.equal((await crmSession(a.cookie, a.tenant)).status, 401);
	await req("POST", "/v1/auth/sign-in/email", { email: a.email, password: PW });
	assert.equal(
		(await req("POST", "/v1/auth/revoke-other-sessions", {}, second.cookie))
			.status,
		200,
	);
	assert.equal(
		(
			await one(`SELECT count(*)::int n FROM auth.session WHERE "userId"=$1`, [
				a.user,
			])
		).n,
		1,
	);
	assert.equal(
		(await req("POST", "/v1/auth/revoke-sessions", {}, second.cookie)).status,
		200,
	);
	assert.equal((await crmSession(second.cookie, a.tenant)).status, 401);
});
test("B5 change-password requires current password, enforces A1 policy and rotates cookie while revoking old sessions", async () => {
	const m = await bootstrap(),
		second = await req("POST", "/v1/auth/sign-in/email", {
			email: m.email,
			password: PW,
		});
	const change = (body: unknown) =>
		req("POST", "/v1/auth/change-password", body, m.cookie);
	assert.equal(
		(await change({ currentPassword: PW, newPassword: "password1234" })).body
			.code,
		"AUTH_PASSWORD_POLICY",
	);
	assert.equal(
		(
			await change({
				currentPassword: "wrong password is wrong",
				newPassword: NEWPW,
			})
		).body.code,
		"AUTH_INVALID_CREDENTIALS",
	);
	assert.equal(
		(
			await change({
				currentPassword: PW,
				newPassword: NEWPW,
				revokeOtherSessions: false,
			})
		).status,
		422,
	);
	const changed = await change({ currentPassword: PW, newPassword: NEWPW });
	assert.equal(changed.status, 200);
	assert.ok(changed.cookie);
	assert.ok(!("token" in changed.body));
	assert.equal((await crmSession(m.cookie, m.tenant)).status, 401);
	assert.equal((await crmSession(second.cookie, m.tenant)).status, 401);
	assert.equal((await crmSession(changed.cookie, m.tenant)).status, 200);
	assert.equal(
		(
			await req("POST", "/v1/auth/sign-in/email", {
				email: m.email,
				password: NEWPW,
			})
		).status,
		200,
	);
});

test("B5 metadata cleanup failure cannot prevent reset credential change or mandatory session revocation", async () => {
	const m = await bootstrap(),
		target = await member(m.tenant, "rep"),
		issued = await copy(m, target.id);
	await admin.query(`CREATE FUNCTION auth.b5_fail_reset_cleanup() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
		BEGIN RAISE EXCEPTION 'test metadata cleanup failure'; END $$;
		REVOKE ALL ON FUNCTION auth.b5_fail_reset_cleanup() FROM PUBLIC;
		CREATE TRIGGER b5_fail_reset_cleanup BEFORE DELETE ON auth.password_reset_latest FOR EACH ROW
		WHEN (OLD.user_id='${target.user}'::uuid) EXECUTE FUNCTION auth.b5_fail_reset_cleanup()`);
	try {
		assert.equal((await reset(issued.token)).status, 200);
		assert.equal(
			(
				await one(
					`SELECT count(*)::int n FROM auth.session WHERE "userId"=$1`,
					[target.user],
				)
			).n,
			0,
		);
		assert.equal((await crmSession(target.cookie, m.tenant)).status, 401);
		assert.equal((await reset(issued.token)).body.code, "AUTH_RESET_INVALID");
		const credential = await one(
			`SELECT password FROM auth.account WHERE "userId"=$1 AND "providerId"='credential'`,
			[target.user],
		);
		assert.equal((await passwords.verify(NEWPW, credential.password)).ok, true);
		assert.ok(
			errorLogs.some((line) => line.includes("AUTH_RESET_CLEANUP_FAILED")),
		);
	} finally {
		await admin.query(
			"DROP TRIGGER IF EXISTS b5_fail_reset_cleanup ON auth.password_reset_latest; DROP FUNCTION IF EXISTS auth.b5_fail_reset_cleanup()",
		);
	}
});

test("B5 default stub captures invitation/reset delivery with id and recipient hash; errors and mail logs contain no secrets", async () => {
	const m = await bootstrap(),
		e = email();
	const invited = await req(
		"POST",
		"/v1/invites",
		{ email: e, role: "rep" },
		m.cookie,
		m.tenant,
	);
	assert.equal(invited.status, 201);
	await copy(m, await idOf(m.tenant, m.user));
	assert.ok(mailLogs.some((line) => JSON.parse(line).kind === "invitation"));
	assert.ok(
		mailLogs.some((line) => JSON.parse(line).kind === "password-reset"),
	);
	for (const line of mailLogs) {
		const record = JSON.parse(line);
		assert.match(record.id, /^[0-9a-f-]{36}$/);
		assert.match(record.recipient_hash, /^[0-9a-f]{64}$/);
		assert.ok(!record.link);
	}
	const sessionTokens = (
		await admin.query(
			`SELECT token FROM auth.session WHERE "userId"=ANY($1::uuid[])`,
			[users],
		)
	).rows.map((row) => row.token as string);
	const output = [...mailLogs, ...errorLogs].join("\n");
	const recipients = (
		await admin.query(
			`SELECT email FROM auth."user" WHERE id=ANY($1::uuid[])`,
			[users],
		)
	).rows.map((row) => row.email as string);
	for (const secret of [...rawResetTokens, ...seenSessionTokens, ...recipients])
		assert.ok(
			!output.includes(secret),
			"actual secret/recipient must not be logged",
		);
	for (const value of [PW, NEWPW, NEWPW2, e, m.email, ...sessionTokens])
		assert.ok(!output.includes(value), "sensitive material must not be logged");
	for (const identifier of hashes) {
		// Raw tokens aren't derivable from their hashes. Captured reset bodies/links were never logged.
		assert.ok(!output.includes(`reset-password:${identifier}`));
	}
	assert.doesNotMatch(output, /[?#]token=|crm_session=|scrypt\$v1\$/);
});
