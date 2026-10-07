// B4 acceptance through real HTTP + PostgreSQL, isolated lane and committed fixture cleanup.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";
import { server } from "../src/api.js";
import { pool } from "../src/db.js";
import { createAuthRuntime, type AuthRuntime } from "../src/auth/ba.js";
import {
	createPasswordService,
	PRODUCTION_SCRYPT_PARAMS,
} from "../src/auth/password.js";
import { createTenantAdmin } from "../scripts/create-tenant-admin.js";

const ORIGIN = "http://localhost:4329";
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
	await admin.connect();
	const password = randomBytes(24).toString("hex");
	await admin.query(`ALTER ROLE crm_auth PASSWORD '${password}'`);
	const url = new URL(process.env.ADMIN_DATABASE_URL as string);
	url.username = "crm_auth";
	url.password = password;
	assert.equal(
		url.pathname,
		"/crm_lane_auth",
		"B4 must run on isolated auth lane",
	);
	authPool = new pg.Pool({ connectionString: url.toString() });
	rt = createAuthRuntime({
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
		await rt?.close();
		await authPool?.end();
		await admin.end();
		await pool.end();
	}
});
// biome-ignore lint/suspicious/noExplicitAny: real HTTP JSON assertions, not a mocked contract
type Reply = { status: number; body: any; cookie: string; text: string };
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
	return {
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
			tenantName: "B4 tenant",
			slug: `b4-${randomUUID()}`,
			name: "B4 manager",
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
		`INSERT INTO auth."user"(id,name,email,"emailVerified") VALUES($1,'B4 member',$2,false)`,
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
test("B4 bootstrap creates credential/manager projections and seeds all four standard objects; failure rolls back", async () => {
	const m = await bootstrap();
	assert.equal(
		(
			await one(
				"SELECT count(*)::int n FROM crm.object_type WHERE tenant_id=$1 AND kind='standard'",
				[m.tenant],
			)
		).n,
		4,
	);
	assert.ok(
		(
			await one(
				"SELECT count(*)::int n FROM crm.property_definition WHERE tenant_id=$1 AND is_system",
				[m.tenant],
			)
		).n > 20,
	);
	assert.equal(
		(
			await one(
				"SELECT role FROM crm.membership WHERE tenant_id=$1 AND principal_id=$2",
				[m.tenant, m.user],
			)
		).role,
		"manager",
	);
	const credential = await one(
		`SELECT "accountId","providerId",password FROM auth.account WHERE "userId"=$1`,
		[m.user],
	);
	assert.equal(credential.accountId, m.user);
	assert.equal(credential.providerId, "credential");
	assert.equal((await passwords.verify(PW, credential.password)).ok, true);
	const failEmail = email(),
		tenantId = randomUUID();
	await assert.rejects(
		createTenantAdmin(
			admin,
			{
				tenantId,
				tenantName: "collision",
				slug: (
					await one("SELECT slug FROM auth.organization WHERE id=$1", [
						m.tenant,
					])
				).slug,
				name: "B4",
				email: failEmail,
				password: PW,
			},
			passwords,
		),
	);
	assert.equal(
		(
			await one(`SELECT count(*)::int n FROM auth."user" WHERE email=$1`, [
				failEmail,
			])
		).n,
		0,
	);
	assert.equal(
		(
			await one("SELECT count(*)::int n FROM crm.tenant WHERE id=$1", [
				tenantId,
			])
		).n,
		0,
	);
});
test("B4 U6 five cases: no id, another email's id, valid, expired, replay; signup never auto-signs in", async () => {
	const m = await bootstrap(),
		e = email();
	const invite = await req(
		"POST",
		"/v1/invites",
		{ email: e, role: "rep" },
		m.cookie,
		m.tenant,
	);
	assert.equal(invite.status, 201);
	const id = invite.body.data.invitation.id;
	assert.equal(new URL(invite.body.data.link).search, "");
	assert.ok(new URL(invite.body.data.link).hash.includes(id));
	const signup = (mail: string, invitationId?: string, password = PW) =>
		req("POST", "/v1/auth/sign-up/email", {
			email: mail,
			name: "Invited",
			password,
			...(invitationId ? { invitationId } : {}),
		});
	assert.equal((await signup(e)).body.code, "AUTH_INVITATION_INVALID");
	assert.equal(
		(await signup(e, "-".repeat(36))).body.code,
		"AUTH_INVITATION_INVALID",
	);
	assert.equal(
		(await signup(email(), id)).body.code,
		"AUTH_INVITATION_INVALID",
	);
	assert.equal(
		(await signup(e, id, "password1234")).body.code,
		"AUTH_PASSWORD_POLICY",
	);
	await admin.query(
		`UPDATE auth.invitation SET "expiresAt"=now()-interval '1 second' WHERE id=$1`,
		[id],
	);
	assert.equal((await signup(e, id)).body.code, "AUTH_INVITATION_INVALID");
	await admin.query(
		`UPDATE auth.invitation SET "expiresAt"=now()+interval '1 day' WHERE id=$1`,
		[id],
	);
	const valid = await signup(e, id);
	assert.equal(valid.status, 200);
	assert.equal(valid.cookie, "");
	assert.ok(!("token" in valid.body));
	users.push(valid.body.user.id);
	const signed = await req("POST", "/v1/auth/sign-in/email", {
		email: e,
		password: PW,
	});
	const accepted = await req(
		"POST",
		"/v1/auth/organization/accept-invitation",
		{ invitationId: id },
		signed.cookie,
	);
	assert.equal(accepted.status, 200);
	assert.equal(
		(
			await one(
				"SELECT role FROM crm.membership WHERE tenant_id=$1 AND principal_id=$2",
				[m.tenant, valid.body.user.id],
			)
		).role,
		"rep",
	);
	assert.equal((await signup(e, id)).body.code, "AUTH_INVITATION_INVALID");
	assert.ok(
		(
			await req(
				"POST",
				"/v1/auth/organization/accept-invitation",
				{ invitationId: id },
				signed.cookie,
			)
		).status >= 400,
	);
});
test("B4 invite/users endpoints deny unauthenticated, rep/reader, foreign tenant and foreign object ids", async () => {
	const a = await bootstrap(),
		b = await bootstrap();
	const target = await member(a.tenant, "rep");
	for (const role of ["rep", "reader"]) {
		const r = role === "rep" ? target : await member(a.tenant, role);
		for (const path of ["/v1/invites", "/v1/users"])
			assert.equal(
				(await req("GET", path, undefined, r.cookie, a.tenant)).status,
				403,
			);
		assert.equal(
			(
				await req(
					"POST",
					"/v1/invites",
					{ email: email(), role: "rep" },
					r.cookie,
					a.tenant,
				)
			).status,
			403,
		);
		assert.equal(
			(
				await req(
					"PATCH",
					`/v1/users/${target.id}`,
					{ role: "manager" },
					r.cookie,
					a.tenant,
				)
			).status,
			403,
		);
		assert.equal(
			(await req("DELETE", `/v1/users/${target.id}`, {}, r.cookie, a.tenant))
				.status,
			403,
		);
	}
	assert.equal(
		(await req("GET", "/v1/users", undefined, "", a.tenant)).status,
		401,
	);
	const listed = await req("GET", "/v1/users", undefined, a.cookie, a.tenant);
	assert.equal(listed.status, 200);
	assert.ok(listed.text.includes(target.email));
	const page = await req(
		"GET",
		"/v1/users?limit=1&offset=1",
		undefined,
		a.cookie,
		a.tenant,
	);
	assert.equal(page.status, 200);
	assert.equal(page.body.data.members.length, 1);
	assert.equal(page.body.data.total, listed.body.data.total);
	for (const query of ["limit=101", "offset=-1", `organizationId=${b.tenant}`])
		assert.equal(
			(await req("GET", `/v1/users?${query}`, undefined, a.cookie, a.tenant))
				.status,
			422,
		);
	assert.equal(
		(await req("GET", "/v1/invites", undefined, b.cookie, a.tenant)).status,
		403,
	);
	const invite = await req(
		"POST",
		"/v1/invites",
		{ email: email(), role: "reader" },
		a.cookie,
		a.tenant,
	);
	assert.equal(invite.status, 201);
	const id = invite.body.data.invitation.id;
	const list = await req("GET", "/v1/invites", undefined, b.cookie, b.tenant);
	assert.equal(list.status, 200);
	assert.ok(!list.text.includes(id));
	assert.equal(
		(await req("DELETE", `/v1/invites/${id}`, {}, b.cookie, b.tenant)).status,
		404,
	);
	assert.equal(
		(
			await req(
				"PATCH",
				`/v1/users/${target.id}`,
				{ role: "reader" },
				b.cookie,
				b.tenant,
			)
		).status,
		404,
	);
	assert.equal(
		(await req("DELETE", `/v1/users/${target.id}`, {}, b.cookie, b.tenant))
			.status,
		404,
	);
	assert.equal(
		(await one("SELECT status FROM auth.invitation WHERE id=$1", [id])).status,
		"pending",
	);
	assert.equal(
		(await req("DELETE", `/v1/invites/${id}`, {}, a.cookie, a.tenant)).status,
		200,
	);
	assert.equal(
		(await one("SELECT status FROM auth.invitation WHERE id=$1", [id])).status,
		"canceled",
	);
	for (const role of ["worker", "owner", "admin", "member", "manager,rep"]) {
		assert.equal(
			(
				await req(
					"POST",
					"/v1/invites",
					{ email: email(), role },
					a.cookie,
					a.tenant,
				)
			).status,
			422,
		);
		assert.equal(
			(
				await req(
					"PATCH",
					`/v1/users/${target.id}`,
					{ role },
					a.cookie,
					a.tenant,
				)
			).status,
			422,
		);
	}
	assert.equal(
		(
			await req(
				"POST",
				"/v1/invites",
				{ email: email(), role: "rep", organizationId: b.tenant },
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
				"/v1/invites",
				{ email: email(), role: "rep" },
				a.cookie,
				a.tenant,
				"https://evil.test",
			)
		).status,
		403,
	);
	for (const path of [
		"create",
		"list-members",
		"list-invitations",
		"invite-member",
		"update-member-role",
		"remove-member",
		"cancel-invitation",
	])
		assert.equal(
			(await req("POST", `/v1/auth/organization/${path}`, {}, a.cookie)).status,
			404,
		);
});
test("B4 existing-account accept needs matching login; expired/revoked invites cannot be accepted", async () => {
	const a = await bootstrap(),
		b = await bootstrap();
	const malformed = await req(
		"POST",
		"/v1/auth/organization/accept-invitation",
		{ invitationId: "-".repeat(36) },
		b.cookie,
	);
	assert.equal(malformed.status, 403);
	assert.equal(malformed.body.code, "AUTH_INVITATION_INVALID");
	const invite = await req(
		"POST",
		"/v1/invites",
		{ email: b.email, role: "reader" },
		a.cookie,
		a.tenant,
	);
	const id = invite.body.data.invitation.id;
	assert.equal(
		(
			await req("POST", "/v1/auth/organization/accept-invitation", {
				invitationId: id,
			})
		).status,
		401,
	);
	assert.ok(
		(
			await req(
				"POST",
				"/v1/auth/organization/accept-invitation",
				{ invitationId: id },
				a.cookie,
			)
		).status >= 400,
	);
	await admin.query(
		`UPDATE auth.invitation SET "expiresAt"=now()-interval '1 second' WHERE id=$1`,
		[id],
	);
	assert.ok(
		(
			await req(
				"POST",
				"/v1/auth/organization/accept-invitation",
				{ invitationId: id },
				b.cookie,
			)
		).status >= 400,
	);
	await admin.query(
		`UPDATE auth.invitation SET "expiresAt"=now()+interval '1 day' WHERE id=$1`,
		[id],
	);
	assert.equal(
		(
			await req(
				"POST",
				"/v1/auth/organization/accept-invitation",
				{ invitationId: id },
				b.cookie,
			)
		).status,
		200,
	);
	assert.equal(
		(await req("GET", "/v1/users", undefined, b.cookie, a.tenant)).status,
		403,
	);
	const revoked = await req(
		"POST",
		"/v1/invites",
		{ email: email(), role: "rep" },
		a.cookie,
		a.tenant,
	);
	await req(
		"DELETE",
		`/v1/invites/${revoked.body.data.invitation.id}`,
		{},
		a.cookie,
		a.tenant,
	);
	assert.equal(
		(
			await req("POST", "/v1/auth/sign-up/email", {
				email: revoked.body.data.invitation.email,
				name: "Revoked",
				password: PW,
				invitationId: revoked.body.data.invitation.id,
			})
		).body.code,
		"AUTH_INVITATION_INVALID",
	);
});
test("B4 last-manager guard is 409; demotion/deactivation removes scope on the next request without deleting projection", async () => {
	const m = await bootstrap();
	const id = (
		await one(
			`SELECT id FROM auth.member WHERE "organizationId"=$1 AND "userId"=$2`,
			[m.tenant, m.user],
		)
	).id;
	for (const method of ["PATCH", "DELETE"]) {
		const r = await req(
			method,
			`/v1/users/${id}`,
			method === "PATCH" ? { role: "reader" } : {},
			m.cookie,
			m.tenant,
		);
		assert.equal(r.status, 409);
		assert.equal(r.body.code, "LAST_MANAGER_REQUIRED");
	}
	const other = await member(m.tenant, "manager");
	assert.equal(
		(
			await req(
				"PATCH",
				`/v1/users/${id}`,
				{ role: "reader" },
				other.cookie,
				m.tenant,
			)
		).status,
		200,
	);
	assert.equal(
		(await req("GET", "/v1/users", undefined, m.cookie, m.tenant)).status,
		403,
	);
	assert.equal(
		(
			await one(
				"SELECT role FROM crm.membership WHERE tenant_id=$1 AND principal_id=$2",
				[m.tenant, m.user],
			)
		).role,
		"reader",
	);
	assert.equal(
		(await req("DELETE", `/v1/users/${id}`, {}, other.cookie, m.tenant)).status,
		200,
	);
	assert.equal(
		(
			await one(
				"SELECT active FROM crm.membership WHERE tenant_id=$1 AND principal_id=$2",
				[m.tenant, m.user],
			)
		).active,
		false,
	);
	assert.equal(
		(await req("GET", "/v1/session", undefined, m.cookie, m.tenant)).status,
		403,
	);
	assert.equal(
		(await one(`SELECT count(*)::int n FROM auth."user" WHERE id=$1`, [m.user]))
			.n,
		1,
	);
});

test("B4 user-create hook rechecks the invite after hashing, so cancellation during signup creates no account", async () => {
	const m = await bootstrap(),
		e = email();
	const created = await req(
		"POST",
		"/v1/invites",
		{ email: e, role: "reader" },
		m.cookie,
		m.tenant,
	);
	const id = created.body.data.invitation.id;
	const guarded = createAuthRuntime({
		config: rt.config,
		pool: authPool,
		passwords: {
			...passwords,
			hash: async (password) => {
				const hash = await passwords.hash(password);
				await admin.query(
					"UPDATE auth.invitation SET status='canceled' WHERE id=$1",
					[id],
				);
				return hash;
			},
		},
	});
	const temporary = server({ auth: guarded });
	await new Promise<void>((resolve) =>
		temporary.listen(0, "127.0.0.1", resolve),
	);
	try {
		const port = (temporary.address() as { port: number }).port;
		const response = await fetch(
			`http://127.0.0.1:${port}/v1/auth/sign-up/email`,
			{
				method: "POST",
				headers: { origin: ORIGIN, "content-type": "application/json" },
				body: JSON.stringify({
					email: e,
					name: e,
					password: PW,
					invitationId: id,
				}),
			},
		);
		assert.equal(response.status, 403);
		assert.equal((await response.json()).code, "AUTH_INVITATION_INVALID");
		const found = await admin.query(
			`SELECT id FROM auth."user" WHERE email=$1`,
			[e],
		);
		users.push(...found.rows.map((row) => row.id));
		assert.equal(found.rowCount, 0);
		assert.equal(
			(
				await one("SELECT count(*)::int n FROM crm.principal WHERE name=$1", [
					e,
				])
			).n,
			0,
		);
		for (const table of ["account", "session"])
			assert.equal(
				(
					await one(
						`SELECT count(*)::int n FROM auth."${table}" a JOIN auth."user" u ON u.id=a."userId" WHERE u.email=$1`,
						[e],
					)
				).n,
				0,
			);
	} finally {
		await new Promise((resolve) => temporary.close(resolve));
		await guarded.close();
	}
});
