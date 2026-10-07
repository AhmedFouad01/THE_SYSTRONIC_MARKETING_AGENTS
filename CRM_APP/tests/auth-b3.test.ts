// AUTH_PLAN v2 B3: Better Auth 1.7.7 headless server + cookie sign-in, through the real HTTP server and PostgreSQL.
// Users/orgs are SQL-seeded (the bootstrap script is B4); passwords are hashed by A1 with a cheap scrypt N for speed.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import pg from "pg";
import { server } from "../src/api.js";
import { pool } from "../src/db.js";
import {
	ALLOWED_ENDPOINTS,
	type AuthConfig,
	type AuthRuntime,
	assertAuthEnvironment,
	createAuthRuntime,
	devBearerEnabled,
	lockoutKey,
} from "../src/auth/ba.js";
import { PRODUCTION_SCRYPT_PARAMS, createPasswordService } from "../src/auth/password.js";

const admin = new pg.Client({ connectionString: process.env.ADMIN_DATABASE_URL });
const passwords = createPasswordService({
	keyring: { activeId: "t", keys: new Map([["t", randomBytes(32)]]), ephemeral: false },
	params: { ...PRODUCTION_SCRYPT_PARAMS, N: 2 ** 10 },
});
const ORIGIN = "http://localhost:4317";
const PW = "correct horse battery 42";
let authUrl = "";
const runtimes: AuthRuntime[] = [];
const servers: ReturnType<typeof server>[] = [];
const authPool = () => new pg.Pool({ connectionString: authUrl, max: 3 });
const baseConfig = (o: Partial<AuthConfig> = {}): AuthConfig => ({
	databaseUrl: authUrl,
	secret: randomBytes(32).toString("base64url"),
	publicOrigin: ORIGIN,
	trustedOrigins: [ORIGIN],
	production: false,
	trustProxy: false,
	rateLimitEnabled: false,
	...o,
});
async function boot(o: Partial<AuthConfig> = {}) {
	const rt = createAuthRuntime({ config: baseConfig(o), passwords, pool: authPool() });
	const app = server({ auth: rt });
	await new Promise<void>((r) => app.listen(0, "127.0.0.1", r));
	runtimes.push(rt);
	servers.push(app);
	return { rt, base: `http://127.0.0.1:${(app.address() as { port: number }).port}` };
}
let base = "";
before(async () => {
	await admin.connect();
	// crm_auth is created by migration 013 without a password; AUTH_DATABASE_URL (if set) carries the real one.
	if (process.env.AUTH_DATABASE_URL) authUrl = process.env.AUTH_DATABASE_URL;
	else {
		const pw = randomBytes(18).toString("hex");
		await admin.query(`ALTER ROLE crm_auth PASSWORD '${pw}'`);
		const u = new URL(process.env.ADMIN_DATABASE_URL as string);
		u.username = "crm_auth";
		u.password = pw;
		authUrl = u.toString();
	}
	({ base } = await boot());
});
after(async () => {
	await cleanup();
	for (const s of servers) await new Promise((r) => s.close(r));
	for (const r of runtimes) await r.close();
	await admin.end();
	await pool.end();
});

const made = { users: [] as string[], orgs: [] as string[] };
// These rows are committed (the server uses its own connections), so remove them: a tenant without its standard objects
// and protected key would break the other suites. Triggers are off for this one transaction (users are never deleted otherwise).
async function cleanup() {
	await admin.query("BEGIN");
	try {
		await admin.query("SET LOCAL session_replication_role=replica");
		await admin.query("DELETE FROM crm.session WHERE principal_id=ANY($1)", [made.users]);
		await admin.query("DELETE FROM crm.membership WHERE tenant_id=ANY($1) OR principal_id=ANY($2)", [made.orgs, made.users]);
		await admin.query(`DELETE FROM auth.member WHERE "organizationId"=ANY($1) OR "userId"=ANY($2)`, [made.orgs, made.users]);
		await admin.query("DELETE FROM auth.organization WHERE id=ANY($1)", [made.orgs]);
		await admin.query("DELETE FROM crm.tenant WHERE id=ANY($1)", [made.orgs]);
		await admin.query(`DELETE FROM auth.session WHERE "userId"=ANY($1)`, [made.users]);
		await admin.query(`DELETE FROM auth.account WHERE "userId"=ANY($1)`, [made.users]);
		await admin.query(`DELETE FROM auth."user" WHERE id=ANY($1)`, [made.users]);
		await admin.query("DELETE FROM crm.principal WHERE id=ANY($1)", [made.users]);
		await admin.query("DELETE FROM auth.auth_event");
		await admin.query("DELETE FROM auth.login_throttle");
		await admin.query(`DELETE FROM auth."rateLimit"`);
		await admin.query("COMMIT");
	} catch (e) {
		await admin.query("ROLLBACK");
		throw e;
	}
}
const one = async (sql: string, args: unknown[] = []) => (await admin.query(sql, args)).rows[0];
type Seeded = { user: string; email: string; org: string };
async function seedUser(email = `u${randomUUID()}@example.test`, org?: string, role = "manager"): Promise<Seeded> {
	const user = randomUUID();
	made.users.push(user);
	await admin.query(`INSERT INTO auth."user"(id,name,email,"emailVerified") VALUES($1,'B3 User',$2,true)`, [user, email]);
	await admin.query(`INSERT INTO auth.account("accountId","providerId","userId",password,"updatedAt") VALUES($1::text,'credential',$1::uuid,$2,now())`, [
		user,
		await passwords.hash(PW),
	]);
	if (!org) {
		org = randomUUID();
		made.orgs.push(org);
		await admin.query(`INSERT INTO auth.organization(id,name,slug,"createdAt") VALUES($1,'B3 Org',$2,now())`, [org, `o-${org}`]);
	}
	await admin.query(`INSERT INTO auth.member("organizationId","userId",role,"createdAt") VALUES($1,$2,$3,now())`, [org, user, role]);
	return { user, email, org };
}
// biome-ignore lint/suspicious/noExplicitAny: loosely typed JSON in a test helper
type R = { status: number; headers: Headers; text: string; body: any; cookies: string[] };
async function req(b: string, method: string, path: string, o: { headers?: Record<string, string>; body?: unknown } = {}): Promise<R> {
	const r = await fetch(`${b}${path}`, {
		method,
		headers: { ...(o.body !== undefined ? { "content-type": "application/json" } : {}), ...o.headers },
		body: o.body === undefined ? undefined : JSON.stringify(o.body),
	});
	const text = await r.text();
	// biome-ignore lint/suspicious/noExplicitAny: loosely typed JSON in a test helper
	let body: any = null;
	try {
		body = JSON.parse(text);
	} catch {}
	return { status: r.status, headers: r.headers, text, body, cookies: r.headers.getSetCookie() };
}
const signIn = (email: string, password = PW, b = base, extra: Record<string, string> = {}) =>
	req(b, "POST", "/v1/auth/sign-in/email", { headers: { origin: ORIGIN, ...extra }, body: { email, password } });
const cookieOf = (r: R) => (r.cookies[0] ?? "").split(";")[0];
const crmGet = (cookie: string, tenant: string, b = base, headers: Record<string, string> = {}) =>
	req(b, "GET", "/v1/session", { headers: { cookie, "x-tenant-id": tenant, ...headers } });
const rawToken = async (user: string) => (await one(`SELECT token FROM auth.session WHERE "userId"=$1 ORDER BY "createdAt" DESC LIMIT 1`, [user])).token as string;

test("B3 017 is recorded; the three throttle functions are definers executable by crm_auth only; tables are closed", async () => {
	assert.equal((await one("SELECT count(*)::int n FROM public.crm_migrations WHERE version=17")).n, 1);
	const f = await admin.query(
		`SELECT p.proname,p.prosecdef,has_function_privilege('crm_auth',p.oid,'EXECUTE') ba,has_function_privilege('crm_runtime',p.oid,'EXECUTE') rt
		 FROM pg_proc p WHERE p.pronamespace='auth'::regnamespace AND p.proname LIKE 'login\\_%' ORDER BY 1`,
	);
	assert.deepEqual(f.rows.map((x) => [x.proname, x.prosecdef, x.ba, x.rt]), [
		["login_failed", true, true, false],
		["login_gate", true, true, false],
		["login_succeeded", true, true, false],
	]);
	for (const t of ["login_throttle", "auth_event"])
		for (const role of ["crm_auth", "crm_runtime"]) {
			const r = await one(
				`SELECT bool_or(has_table_privilege($1,$2::regclass,p)) x FROM unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE']) p`,
				[role, `auth.${t}`],
			);
			assert.equal(r.x, false, `${role} on auth.${t}`);
		}
	await admin.query("SELECT auth.login_succeeded($1)", ["a".repeat(64)]); // a row must exist for the row triggers to fire
	await assert.rejects(admin.query("UPDATE auth.auth_event SET event='signin_ok'"), (e: { code?: string }) => e.code === "23514");
	await assert.rejects(admin.query("DELETE FROM auth.auth_event"), (e: { code?: string }) => e.code === "23514");
	await assert.rejects(admin.query("TRUNCATE auth.auth_event"), (e: { code?: string }) => e.code === "23514");
});

test("B3 sign-in: cookie flags exact, session row, no token in the body, same body for wrong password and unknown email", async () => {
	const s = await seedUser();
	const ok = await signIn(s.email);
	assert.equal(ok.status, 200);
	assert.equal(ok.body.user.email, s.email);
	const token = await rawToken(s.user);
	assert.ok(token.length >= 16);
	assert.ok(!ok.text.includes(token), "raw token absent from the body");
	assert.ok(!("token" in ok.body), "no token key");
	const c = ok.cookies.find((x) => x.startsWith("crm_session="));
	assert.ok(c, "session cookie");
	assert.match(c, /HttpOnly/i);
	assert.match(c, /SameSite=Lax/i);
	assert.match(c, /Path=\//i);
	assert.match(c, /Max-Age=28800/i);
	assert.doesNotMatch(c, /Secure/i, "Secure only in production");
	assert.doesNotMatch(c, /Domain=/i);
	const row = await one(`SELECT "expiresAt">now()+interval '7 hours 50 minutes' AND "expiresAt"<=now()+interval '8 hours 1 minute' ok FROM auth.session WHERE token=$1`, [token]);
	assert.equal(row.ok, true, "idle window = 8h");
	// enumeration: identical status and body (request_id differs by design)
	const wrong = await signIn(s.email, "this is not the password 1");
	const unknown = await signIn(`nobody-${randomUUID()}@example.test`, "this is not the password 1");
	assert.equal(wrong.status, 401);
	assert.equal(unknown.status, 401);
	const norm = (r: R) => ({ ...r.body, request_id: "x" });
	assert.deepEqual(norm(wrong), norm(unknown));
	assert.equal(wrong.body.code, "AUTH_INVALID_CREDENTIALS");
	assert.ok(!wrong.text.toLowerCase().includes("invalid email"), "Better Auth English text is not forwarded");
	assert.equal(wrong.cookies.length, 0);
});

test("B3 the session cookie authorises the CRM API through crm.actor(); tenant crossing, origin and fixation are refused", async () => {
	const s = await seedUser();
	const cookie = cookieOf(await signIn(s.email));
	const ok = await crmGet(cookie, s.org);
	assert.equal(ok.status, 200);
	assert.equal((await crmGet("", s.org)).status, 401, "no credential");
	assert.equal((await crmGet(cookie, randomUUID())).status, 403, "other tenant");
	// the DB sees the raw token, not the cookie value
	assert.equal((await one("SELECT count(*)::int n FROM auth.session WHERE token=$1", [await rawToken(s.user)])).n, 1);
	// T3: cookie + state change from a foreign (or missing) origin is refused before anything runs
	for (const origin of [{ origin: "https://evil.example" }, {} as Record<string, string>]) {
		const bad = await req(base, "POST", "/v1/contacts", { headers: { cookie, "x-tenant-id": s.org, "idempotency-key": randomUUID(), ...origin }, body: {} });
		assert.equal(bad.status, 403);
		assert.equal(bad.body.code, "AUTH_ORIGIN_NOT_ALLOWED");
	}
	// forged / planted cookies never become a session (fixation)
	assert.equal((await crmGet("crm_session=planted.value", s.org)).status, 401);
	const planted = `crm_session=${randomBytes(16).toString("hex")}.abc`;
	const again = await signIn(s.email, PW, base, { cookie: planted });
	assert.equal(again.status, 200);
	assert.notEqual(cookieOf(again), planted);
	assert.equal((await crmGet(planted, s.org)).status, 401);
	// foreign origin on sign-in and sign-out: 403, nothing created
	const before = (await one("SELECT count(*)::int n FROM auth.session WHERE \"userId\"=$1", [s.user])).n;
	const foreign = await req(base, "POST", "/v1/auth/sign-in/email", { headers: { origin: "https://evil.example" }, body: { email: s.email, password: PW } });
	assert.equal(foreign.status, 403);
	assert.equal(foreign.body.code, "AUTH_ORIGIN_NOT_ALLOWED");
	const noOrigin = await req(base, "POST", "/v1/auth/sign-in/email", { body: { email: s.email, password: PW } });
	assert.equal(noOrigin.status, 403);
	assert.equal((await one("SELECT count(*)::int n FROM auth.session WHERE \"userId\"=$1", [s.user])).n, before);
});

test("B3 get-session returns the user without any token; sign-out revokes the session at once (U10)", async () => {
	const s = await seedUser();
	const cookie = cookieOf(await signIn(s.email));
	const token = await rawToken(s.user);
	const gs = await req(base, "GET", "/v1/auth/get-session", { headers: { cookie } });
	assert.equal(gs.status, 200);
	assert.equal(gs.body.user.email, s.email);
	assert.ok(!gs.text.includes(token) && !("token" in gs.body.session), "no token in get-session");
	assert.equal((await crmGet(cookie, s.org)).status, 200);
	const out = await req(base, "POST", "/v1/auth/sign-out", { headers: { cookie, origin: ORIGIN } });
	assert.equal(out.status, 200);
	assert.ok(!out.text.includes(token));
	assert.match(out.cookies.join(";"), /crm_session=;/);
	assert.equal((await one("SELECT count(*)::int n FROM auth.session WHERE token=$1", [token])).n, 0, "row deleted");
	assert.equal((await crmGet(cookie, s.org)).status, 401, "the old cookie is dead immediately");
	const gs2 = await req(base, "GET", "/v1/auth/get-session", { headers: { cookie } });
	assert.equal(gs2.body, null);
});

test("B3 only the allow-list is reachable: everything else under /v1/auth is 404", async () => {
	assert.deepEqual([...ALLOWED_ENDPOINTS].sort(), ["GET /get-session", "GET /list-sessions", "POST /change-password", "POST /organization/accept-invitation", "POST /reset-password", "POST /revoke-other-sessions", "POST /revoke-session", "POST /revoke-sessions", "POST /sign-in/email", "POST /sign-out", "POST /sign-up/email"]);
	const probes: [string, string][] = [
		["GET", "/v1/auth/ok"],
		["GET", "/v1/auth/reference"],
		["POST", "/v1/auth/request-password-reset"],
		["GET", "/v1/auth/organization/list"],
		["POST", "/v1/auth/organization/create"],
		["POST", "/v1/auth/two-factor/enable"],
		["GET", "/v1/auth/sign-in/email"],
		["GET", "/v1/auth/sign-out"],
		["GET", "/v1/auth"],
		["GET", "/v1/auth/"],
		["POST", "/v1/auth/sign-in/email/"],
		["GET", "/v1/auth/get-session/extra"],
	];
	for (const [m, p] of probes) {
		const r = await req(base, m, p, { headers: { origin: ORIGIN }, body: m === "POST" ? {} : undefined });
		assert.equal(r.status, 404, `${m} ${p}`);
		assert.equal(r.body.code, "NOT_FOUND", `${m} ${p}`);
	}
	// unknown body keys (callbackURL redirects, etc.) are refused
	const s = await seedUser();
	const extra = await req(base, "POST", "/v1/auth/sign-in/email", { headers: { origin: ORIGIN }, body: { email: s.email, password: PW, callbackURL: "https://evil.example" } });
	assert.equal(extra.status, 422);
	// not configured: 503 for allow-listed, no cookie handling
	const none = server({ auth: null });
	await new Promise<void>((r) => none.listen(0, "127.0.0.1", r));
	const nb = `http://127.0.0.1:${(none.address() as { port: number }).port}`;
	assert.equal((await req(nb, "GET", "/v1/auth/get-session")).status, 503);
	assert.equal((await crmGet("crm_session=x.y", randomUUID(), nb)).status, 401);
	await new Promise((r) => none.close(r));
});

test("B3 dev Bearer: honoured while the gate is open, refused when CRM_DEV_BEARER=0 or NODE_ENV=production; raw Better Auth token is never a Bearer", async () => {
	const s = await seedUser();
	const dev = randomBytes(32).toString("hex");
	await admin.query("INSERT INTO crm.session(token_hash,principal_id,expires_at,mfa_verified) VALUES($1,$2,now()+interval '1 day',true)", [
		createHash("sha256").update(dev).digest("hex"),
		s.user,
	]);
	const bearer = (t: string) => req(base, "GET", "/v1/session", { headers: { authorization: `Bearer ${t}`, "x-tenant-id": s.org } });
	const saved = { b: process.env.CRM_DEV_BEARER, n: process.env.NODE_ENV };
	try {
		delete process.env.CRM_DEV_BEARER;
		assert.equal((await bearer(dev)).status, 200, "default outside production");
		process.env.CRM_DEV_BEARER = "0";
		assert.equal(devBearerEnabled(), false);
		assert.equal((await bearer(dev)).status, 401, "gate off");
		// the raw session token as Bearer, gate off: refused
		await signIn(s.email);
		assert.equal((await bearer(await rawToken(s.user))).status, 401);
		// the cookie path still works with the gate off
		assert.equal((await crmGet(cookieOf(await signIn(s.email)), s.org)).status, 200);
		process.env.CRM_DEV_BEARER = "1";
		assert.equal(devBearerEnabled(), true);
		process.env.NODE_ENV = "production";
		assert.equal(devBearerEnabled(), false, "never in production");
		assert.throws(() => assertAuthEnvironment({ NODE_ENV: "production", CRM_DEV_BEARER: "1" } as NodeJS.ProcessEnv), /CRM_DEV_BEARER/);
		assert.throws(() => assertAuthEnvironment({ NODE_ENV: "production" } as NodeJS.ProcessEnv), /AUTH_DATABASE_URL/);
		assert.throws(
			() => assertAuthEnvironment({ NODE_ENV: "production", AUTH_DATABASE_URL: "x", BETTER_AUTH_SECRET: "short" } as NodeJS.ProcessEnv),
			/BETTER_AUTH_SECRET/,
		);
	} finally {
		if (saved.b === undefined) delete process.env.CRM_DEV_BEARER;
		else process.env.CRM_DEV_BEARER = saved.b;
		if (saved.n === undefined) delete process.env.NODE_ENV;
		else process.env.NODE_ENV = saved.n;
	}
});

test("B3 session lifetime: idle refresh survives past 8h from creation; expired = 401; the 14-day absolute cap holds (rows shifted)", async () => {
	const s = await seedUser();
	const cookie = cookieOf(await signIn(s.email));
	const token = await rawToken(s.user);
	const shift = (created: string, expires: string) =>
		admin.query(`UPDATE auth.session SET "createdAt"=now()-$2::interval,"updatedAt"=now()-$2::interval,"expiresAt"=now()+$3::interval WHERE token=$1`, [token, created, expires]);
	// 7h30m after creation, 30m of idle window left: the request refreshes it back to 8h
	await shift("7 hours 30 minutes", "30 minutes");
	const r1 = await crmGet(cookie, s.org);
	assert.equal(r1.status, 200);
	assert.ok(r1.cookies.some((c) => c.startsWith("crm_session=") && /Max-Age=28800/i.test(c)), "refreshed cookie is forwarded on a CRM call");
	const e1 = await one(`SELECT "expiresAt">now()+interval '7 hours 55 minutes' ok FROM auth.session WHERE token=$1`, [token]);
	assert.equal(e1.ok, true, "sliding expiry moved forward");
	// 4h later (11h30m after creation, 4h idle left): still alive although older than 8h
	await shift("11 hours 30 minutes", "4 hours");
	assert.equal((await crmGet(cookie, s.org)).status, 200, "alive past 8h from creation");
	// 13 days old, being used: alive
	await shift("13 days", "10 minutes");
	assert.equal((await crmGet(cookie, s.org)).status, 200, "13 days");
	// past the cap: dead although the idle window is fresh
	await shift("14 days 1 minute", "8 hours");
	assert.equal((await crmGet(cookie, s.org)).status, 401, "14-day cap");
	// idle expiry
	await shift("1 hour", "-1 minute");
	assert.equal((await crmGet(cookie, s.org)).status, 401, "idle expired");
});

test("B3 per-account lockout (017): 5 wrong passwords lock the account for the correct one too; unknown emails lock identically; unlock after the window", async () => {
	const s = await seedUser();
	const key = lockoutKey(s.email);
	for (let i = 0; i < 5; i++) assert.equal((await signIn(s.email, "wrong password number 1")).status, 401);
	const locked = await signIn(s.email, PW);
	assert.equal(locked.status, 429);
	assert.equal(locked.body.code, "AUTH_TOO_MANY_ATTEMPTS");
	assert.match(locked.headers.get("retry-after") ?? "", /^\d+$/);
	assert.ok(Number(locked.headers.get("retry-after")) > 800);
	assert.equal(locked.cookies.length, 0);
	const ghost = `ghost-${randomUUID()}@example.test`;
	for (let i = 0; i < 5; i++) await signIn(ghost, "wrong password number 1");
	const ghostLocked = await signIn(ghost, PW);
	assert.equal(ghostLocked.status, 429);
	assert.deepEqual({ ...ghostLocked.body, request_id: "x" }, { ...locked.body, request_id: "x" }, "no enumeration through the lock");
	const ev = await admin.query("SELECT event,count(*)::int n FROM auth.auth_event WHERE key=$1 GROUP BY 1 ORDER BY 1", [key]);
	assert.deepEqual(ev.rows.map((x) => [x.event, x.n]), [["lock_started", 1], ["signin_fail", 5], ["signin_refused_locked", 1]]);
	assert.doesNotMatch(JSON.stringify((await admin.query("SELECT * FROM auth.auth_event WHERE key=$1", [key])).rows), /example\.test|password/i, "no address or password in the audit");
	// time passes: the lock and the window are 15+ minutes old
	await admin.query("UPDATE auth.login_throttle SET locked_until=now()-interval '1 second',window_start=now()-interval '16 minutes' WHERE key=$1", [key]);
	const ok = await signIn(s.email, PW);
	assert.equal(ok.status, 200);
	assert.equal((await admin.query("SELECT 1 FROM auth.login_throttle WHERE key=$1", [key])).rowCount, 0, "success clears the counter");
	// failures below the threshold do not lock
	for (let i = 0; i < 4; i++) await signIn(s.email, "wrong password number 1");
	assert.equal((await signIn(s.email, PW)).status, 200);
});

test("B3 Better Auth IP rate limit (stored in the database): 429 with Retry-After and our envelope; client IP comes from the trusted proxy hop only", async () => {
	const { base: b } = await boot({ rateLimitEnabled: true, trustProxy: true });
	const ip = `203.0.113.${1 + Math.floor(Math.random() * 250)}`;
	const email = `rl-${randomUUID()}@example.test`;
	const codes: number[] = [];
	let last!: R;
	for (let i = 0; i < 5; i++) {
		// a client-supplied left-most entry must not change the identity: only the proxy-appended right-most one counts
		last = await signIn(email, "wrong password number 1", b, { "x-forwarded-for": `198.51.100.${i}, ${ip}` });
		codes.push(last.status);
	}
	assert.deepEqual(codes.slice(0, 3), [401, 401, 401]);
	assert.equal(last.status, 429);
	assert.equal(last.body.code, "AUTH_RATE_LIMITED");
	assert.match(last.headers.get("retry-after") ?? "", /^\d+$/);
	assert.ok((await one(`SELECT count(*)::int n FROM auth."rateLimit" WHERE key LIKE $1`, [`${ip}%`])).n >= 1, "limiter state lives in auth.rateLimit");
	// another proxy-reported client is not affected
	assert.equal((await signIn(email, "wrong password number 1", b, { "x-forwarded-for": "192.0.2.77" })).status, 401);
});

test("B3 production mode: __Host- cookie, Secure, no Domain, Path=/, HttpOnly, SameSite=Lax; cookie works on the CRM API", async () => {
	const pub = "https://crm.example.test";
	const { base: b } = await boot({ production: true, publicOrigin: pub, trustedOrigins: [pub] });
	const s = await seedUser();
	const r = await signIn(s.email, PW, b, { origin: pub });
	assert.equal(r.status, 200);
	const c = r.cookies.find((x) => x.startsWith("__Host-crm_session="));
	assert.ok(c, `cookie name: ${r.cookies.map((x) => x.split("=")[0])}`);
	assert.match(c, /; Secure/i);
	assert.match(c, /HttpOnly/i);
	assert.match(c, /SameSite=Lax/i);
	assert.match(c, /Path=\//i);
	assert.doesNotMatch(c, /Domain=/i);
	assert.equal((await crmGet(cookieOf(r), s.org, b)).status, 200);
	assert.equal((await signIn(s.email, PW, b, { origin: ORIGIN })).status, 403, "only the public origin is trusted");
});

test("B3 headers: frame denial and no-referrer on every response", async () => {
	const r = await req(base, "GET", "/v1/auth/get-session");
	assert.equal(r.headers.get("x-frame-options"), "DENY");
	assert.match(r.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
	assert.equal(r.headers.get("referrer-policy"), "no-referrer");
});
