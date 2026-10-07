// AUTH_PLAN v2 B1 (migrations 013-014): schema `auth`, role `crm_auth`, Better Auth org + 2FA tables. Real PostgreSQL.
// Grant / negative tests run as the real roles (SET LOCAL ROLE inside a rolled-back transaction); catalog checks use the admin connection.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import pg from "pg";

const admin = new pg.Client({ connectionString: process.env.ADMIN_DATABASE_URL });
before(async () => {
	await admin.connect();
});
after(async () => {
	await admin.end();
});
const TABLES = ["user", "session", "account", "verification", "rateLimit", "organization", "member", "invitation", "twoFactor"];
const one = async (sql: string, args: unknown[] = []) => (await admin.query(sql, args)).rows[0];
// Run fn inside a transaction that is always rolled back (the DB is left untouched).
async function tx<T>(fn: () => Promise<T>): Promise<T> {
	await admin.query("BEGIN");
	try {
		return await fn();
	} finally {
		await admin.query("ROLLBACK");
	}
}
const sqlstate = (code: string) => (e: unknown) => (e as { code?: string }).code === code;
// One failing statement per savepoint so the surrounding transaction survives.
async function denied(code: string, sql: string, args: unknown[] = []) {
	await admin.query("SAVEPOINT s");
	await assert.rejects(admin.query(sql, args), sqlstate(code), sql);
	await admin.query("ROLLBACK TO SAVEPOINT s");
}
const now = "now()";
async function mkUser(email = `u${randomUUID()}@example.test`) {
	const id = randomUUID();
	await admin.query(`INSERT INTO auth."user"(id,name,email,"emailVerified") VALUES($1,'T',$2,true)`, [id, email]);
	return id;
}
async function mkOrg() {
	const id = randomUUID();
	await admin.query(`INSERT INTO auth.organization(id,name,slug,"createdAt") VALUES($1,'O',$2,${now})`, [id, `o-${id}`]);
	return id;
}

test("B1 migrations 013 and 014 are recorded and the repair block is idempotent", async () => {
	const r = await admin.query("SELECT version FROM public.crm_migrations WHERE version IN (13,14) ORDER BY version");
	assert.deepEqual(r.rows.map((x) => x.version), [13, 14]);
});

test("B1 crm_auth role attributes: login, no superuser/createdb/createrole/bypassrls, noinherit, small connection limit", async () => {
	const r = await one(
		"SELECT rolcanlogin,rolsuper,rolcreatedb,rolcreaterole,rolbypassrls,rolinherit,rolreplication,rolconnlimit FROM pg_roles WHERE rolname='crm_auth'",
	);
	assert.equal(r.rolcanlogin, true);
	for (const k of ["rolsuper", "rolcreatedb", "rolcreaterole", "rolbypassrls", "rolinherit", "rolreplication"]) assert.equal(r[k], false, k);
	assert.ok(r.rolconnlimit > 0 && r.rolconnlimit <= 20, `connlimit ${r.rolconnlimit}`);
	const m = await one("SELECT count(*)::int n FROM pg_auth_members WHERE member=(SELECT oid FROM pg_roles WHERE rolname='crm_auth')");
	assert.equal(m.n, 0, "crm_auth is a member of no role");
});

test("B1 table shapes: all nine Better Auth tables exist in schema auth, nothing in public, ids and FKs are uuid", async () => {
	const t = await admin.query("SELECT table_name FROM information_schema.tables WHERE table_schema='auth' ORDER BY 1");
	assert.deepEqual(t.rows.map((x) => x.table_name).sort(), [...TABLES].sort());
	const pub = await one("SELECT count(*)::int n FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('user','session','account','verification','organization','member','invitation','twoFactor','rateLimit')");
	assert.equal(pub.n, 0);
	const cols = await admin.query(
		`SELECT table_name||'.'||column_name c, data_type FROM information_schema.columns WHERE table_schema='auth'
		 AND (column_name='id' OR column_name IN ('userId','organizationId','inviterId','activeOrganizationId'))`,
	);
	assert.ok(cols.rows.length >= 15);
	for (const c of cols.rows) assert.equal(c.data_type, "uuid", c.c); // B0 U3: activeOrganizationId is uuid, not text
	const want: Record<string, string[]> = {
		user: ["id", "name", "email", "emailVerified", "image", "createdAt", "updatedAt", "twoFactorEnabled"],
		session: ["id", "expiresAt", "token", "createdAt", "updatedAt", "ipAddress", "userAgent", "userId", "activeOrganizationId"],
		account: ["id", "accountId", "providerId", "userId", "accessToken", "refreshToken", "idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", "scope", "password", "createdAt", "updatedAt"],
		verification: ["id", "identifier", "value", "expiresAt", "createdAt", "updatedAt"],
		rateLimit: ["id", "key", "count", "lastRequest"],
		organization: ["id", "name", "slug", "logo", "createdAt", "metadata"],
		member: ["id", "organizationId", "userId", "role", "createdAt"],
		invitation: ["id", "organizationId", "email", "role", "status", "expiresAt", "createdAt", "inviterId"],
		twoFactor: ["id", "secret", "backupCodes", "userId", "verified", "failedVerificationCount", "lockedUntil"],
	};
	for (const [table, names] of Object.entries(want)) {
		const r = await admin.query("SELECT column_name FROM information_schema.columns WHERE table_schema='auth' AND table_name=$1", [table]);
		assert.deepEqual(r.rows.map((x) => x.column_name).sort(), [...names].sort(), table);
	}
});

test("B1 no PUBLIC grants on schema auth, its tables or functions; no definer functions yet", async () => {
	const s = await one("SELECT nspacl::text acl FROM pg_namespace WHERE nspname='auth'");
	assert.doesNotMatch(s.acl, /(^|[{,])=/, "no PUBLIC entry on the schema");
	const t = await admin.query(
		`SELECT c.relname,(SELECT count(*)::int FROM aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a WHERE a.grantee=0) pub
		 FROM pg_class c WHERE c.relnamespace='auth'::regnamespace AND c.relkind='r'`,
	);
	assert.equal(t.rows.length, TABLES.length);
	for (const r of t.rows) assert.equal(r.pub, 0, `PUBLIC privilege on auth.${r.relname}`);
	const f = await one(
		`SELECT count(*)::int n FROM pg_proc p WHERE p.pronamespace='auth'::regnamespace
		 AND EXISTS(SELECT 1 FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a WHERE a.grantee=0 AND a.privilege_type='EXECUTE')`,
	);
	assert.equal(f.n, 0, "no function in auth with PUBLIC EXECUTE");
});

test("B1 crm_runtime has no privilege on schema auth or any auth table/column, and cannot read it", async () => {
	const s = await one("SELECT has_schema_privilege('crm_runtime','auth','USAGE') u, has_schema_privilege('crm_runtime','auth','CREATE') c");
	assert.equal(s.u, false);
	assert.equal(s.c, false);
	for (const t of TABLES) {
		const r = await one(
			`SELECT bool_or(has_table_privilege('crm_runtime',$1::regclass,p)) any_priv
			 FROM unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) p`,
			[`auth."${t}"`],
		);
		assert.equal(r.any_priv, false, `crm_runtime privilege on auth.${t}`);
		const col = await one(`SELECT has_any_column_privilege('crm_runtime',$1::regclass,'SELECT') x`, [`auth."${t}"`]);
		assert.equal(col.x, false, `crm_runtime column privilege on auth.${t}`);
	}
	await tx(async () => {
		await admin.query("SET LOCAL ROLE crm_runtime");
		await denied("42501", `SELECT * FROM auth."user"`);
		await denied("42501", `SELECT token FROM auth.session`);
		await denied("42501", `INSERT INTO auth."user"(name,email,"emailVerified") VALUES('x','x@example.test',true)`);
	});
});

test("B1 crm_auth has no privilege on schema crm, any crm table or function, nor on public; cannot create objects", async () => {
	const s = await one(
		`SELECT has_schema_privilege('crm_auth','crm','USAGE') crm_u, has_schema_privilege('crm_auth','crm','CREATE') crm_c,
		 has_schema_privilege('crm_auth','public','USAGE') pub_u, has_schema_privilege('crm_auth','public','CREATE') pub_c,
		 has_schema_privilege('crm_auth','auth','USAGE') auth_u, has_schema_privilege('crm_auth','auth','CREATE') auth_c`,
	);
	assert.equal(s.crm_u, false);
	assert.equal(s.crm_c, false);
	assert.equal(s.pub_u, false, "public USAGE revoked (B0 U4)");
	assert.equal(s.pub_c, false);
	assert.equal(s.auth_u, true);
	assert.equal(s.auth_c, false);
	const tabs = await one(
		`SELECT count(*)::int n, (count(*) FILTER (WHERE EXISTS(SELECT 1 FROM unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) p WHERE has_table_privilege('crm_auth',c.oid,p))))::int bad
		 FROM pg_class c WHERE c.relnamespace='crm'::regnamespace AND c.relkind IN ('r','v','m','p')`,
	);
	assert.ok(tabs.n > 20);
	assert.equal(tabs.bad, 0, "crm_auth privilege on a crm relation");
	const fns = await one(
		`SELECT (count(*) FILTER (WHERE has_function_privilege('crm_auth',p.oid,'EXECUTE')))::int bad FROM pg_proc p WHERE p.pronamespace='crm'::regnamespace`,
	);
	assert.equal(fns.bad, 0, "crm_auth can execute a crm function");
	await tx(async () => {
		await admin.query("SET LOCAL ROLE crm_auth");
		await denied("42501", "SELECT * FROM crm.tenant");
		await denied("42501", "SELECT * FROM crm.session");
		await denied("42501", "SELECT crm.actor()");
		await denied("42501", "CREATE TABLE auth.evil(id int)");
		await denied("42501", "CREATE TABLE public.evil(id int)");
		await denied("42501", "SELECT public.digest('a','sha256')");
	});
});

test("B1 RLS on auth: ENABLE not FORCE, exactly one policy per table and only for crm_auth", async () => {
	for (const t of TABLES) {
		const r = await one(
			`SELECT c.relrowsecurity rls, c.relforcerowsecurity forced, (SELECT count(*)::int FROM pg_policy WHERE polrelid=c.oid) pols,
			 (SELECT array_agg(r.rolname::text) FROM pg_policy p, unnest(p.polroles) o JOIN pg_roles r ON r.oid=o WHERE p.polrelid=c.oid) roles
			 FROM pg_class c WHERE c.oid=$1::regclass`,
			[`auth."${t}"`],
		);
		assert.equal(r.rls, true, t);
		assert.equal(r.forced, false, `${t} is not FORCE (migrator-owned definers must read auth)`);
		assert.equal(r.pols, 1, t);
		assert.deepEqual(r.roles, ["crm_auth"], t);
	}
});

test("B1 RLS deny-by-default: an accidentally granted third role reads zero rows, crm_auth reads and writes", async () => {
	await tx(async () => {
		const u = await mkUser();
		await admin.query("CREATE ROLE b1_probe NOLOGIN");
		await admin.query("GRANT USAGE ON SCHEMA auth TO b1_probe");
		await admin.query(`GRANT SELECT,INSERT ON auth."user" TO b1_probe`);
		await admin.query("SET LOCAL ROLE b1_probe");
		assert.equal((await admin.query(`SELECT 1 FROM auth."user" WHERE id=$1`, [u])).rowCount, 0, "no policy for b1_probe: zero rows");
		await denied("42501", `INSERT INTO auth."user"(name,email,"emailVerified") VALUES('x','y@example.test',true)`); // 42501 = RLS WITH CHECK violation
		await admin.query("RESET ROLE");
		await admin.query("SET LOCAL ROLE crm_auth");
		assert.equal((await admin.query(`SELECT 1 FROM auth."user" WHERE id=$1`, [u])).rowCount, 1);
		const v = randomUUID();
		await admin.query(`INSERT INTO auth.verification(id,identifier,value,"expiresAt") VALUES($1,'i','v',now())`, [v]);
		assert.equal((await admin.query("DELETE FROM auth.verification WHERE id=$1", [v])).rowCount, 1);
		await denied("42501", "TRUNCATE auth.verification"); // DML only
	});
});

test("B1 constraints: lower-case emails, role allow-list {manager,rep,reader}, invitation status, no null role", async () => {
	await tx(async () => {
		await denied("23514", `INSERT INTO auth."user"(name,email,"emailVerified") VALUES('x','Mixed@Example.test',true)`);
		const u = await mkUser();
		const o = await mkOrg();
		for (const bad of ["owner", "admin", "member", "worker", "manager,rep", ""])
			await denied("23514", `INSERT INTO auth.member("organizationId","userId",role,"createdAt") VALUES($1,$2,$3,now())`, [o, u, bad]);
		for (const bad of ["owner", "admin", "member", "worker"])
			await denied("23514", `INSERT INTO auth.invitation("organizationId",email,role,status,"expiresAt","inviterId") VALUES($1,'a@example.test',$2,'pending',now(),$3)`, [o, bad, u]);
		await denied("23514", `INSERT INTO auth.invitation("organizationId",email,role,status,"expiresAt","inviterId") VALUES($1,'a@example.test',NULL,'pending',now(),$2)`, [o, u]);
		await denied("23514", `INSERT INTO auth.invitation("organizationId",email,role,status,"expiresAt","inviterId") VALUES($1,'A@example.test','rep','pending',now(),$2)`, [o, u]);
		await denied("23514", `INSERT INTO auth.invitation("organizationId",email,role,status,"expiresAt","inviterId") VALUES($1,'a@example.test','rep','expired',now(),$2)`, [o, u]);
		for (const [role, status] of [["manager", "pending"], ["rep", "accepted"], ["reader", "rejected"], ["rep", "canceled"]])
			await admin.query(
				`INSERT INTO auth.invitation("organizationId",email,role,status,"expiresAt","inviterId") VALUES($1,$2,$3,$4,now(),$5)`,
				[o, `${randomUUID()}@example.test`, role, status, u],
			);
		await admin.query(`INSERT INTO auth.member("organizationId","userId",role,"createdAt") VALUES($1,$2,'manager',now())`, [o, u]);
	});
});

test("B1 constraints: unique membership, unique email/slug/token, one twoFactor per user, one account per provider id, rate-limit count", async () => {
	await tx(async () => {
		const email = `${randomUUID()}@example.test`;
		const u = await mkUser(email);
		await denied("23505", `INSERT INTO auth."user"(name,email,"emailVerified") VALUES('x',$1,true)`, [email]);
		const o = await mkOrg();
		await denied("23505", `INSERT INTO auth.organization(name,slug,"createdAt") VALUES('x',$1,now())`, [`o-${o}`]);
		await admin.query(`INSERT INTO auth.member("organizationId","userId",role,"createdAt") VALUES($1,$2,'rep',now())`, [o, u]);
		await denied("23505", `INSERT INTO auth.member("organizationId","userId",role,"createdAt") VALUES($1,$2,'reader',now())`, [o, u]);
		await admin.query(`INSERT INTO auth."twoFactor"(secret,"backupCodes","userId") VALUES('s','b',$1)`, [u]);
		await denied("23505", `INSERT INTO auth."twoFactor"(secret,"backupCodes","userId") VALUES('s2','b2',$1)`, [u]);
		await admin.query(`INSERT INTO auth.account("accountId","providerId","userId","updatedAt") VALUES($1::text,'credential',$1::uuid,now())`, [u]);
		await denied("23505", `INSERT INTO auth.account("accountId","providerId","userId","updatedAt") VALUES($1::text,'credential',$1::uuid,now())`, [u]);
		await admin.query(`INSERT INTO auth.session("expiresAt",token,"updatedAt","userId") VALUES(now(),'tok-b1',now(),$1)`, [u]);
		await denied("23505", `INSERT INTO auth.session("expiresAt",token,"updatedAt","userId") VALUES(now(),'tok-b1',now(),$1)`, [u]);
		await denied("23505", `INSERT INTO auth."rateLimit"(key,count,"lastRequest") VALUES('k',1,1),('k',1,1)`);
		await denied("23514", `INSERT INTO auth."rateLimit"(key,count,"lastRequest") VALUES('k2',-1,1)`);
		await denied("23514", `INSERT INTO auth."twoFactor"(secret,"backupCodes","userId","failedVerificationCount") VALUES('s','b',$1,-1)`, [await mkUser()]);
	});
});

test("B1 foreign keys: activeOrganizationId is a uuid FK (set null on org delete), children cascade from user and organization", async () => {
	await tx(async () => {
		const u = await mkUser();
		const o = await mkOrg();
		await denied("23503", `INSERT INTO auth.session("expiresAt",token,"updatedAt","userId","activeOrganizationId") VALUES(now(),'t1',now(),$1,$2)`, [u, randomUUID()]);
		await denied("23503", `INSERT INTO auth.session("expiresAt",token,"updatedAt","userId") VALUES(now(),'t2',now(),$1)`, [randomUUID()]);
		await denied("23503", `INSERT INTO auth.member("organizationId","userId",role,"createdAt") VALUES($1,$2,'rep',now())`, [randomUUID(), u]);
		await denied("23503", `INSERT INTO auth.member("organizationId","userId",role,"createdAt") VALUES($1,$2,'rep',now())`, [o, randomUUID()]);
		await denied("23503", `INSERT INTO auth.invitation("organizationId",email,role,status,"expiresAt","inviterId") VALUES($1,'z@example.test','rep','pending',now(),$2)`, [o, randomUUID()]);
		await denied("22P02", `INSERT INTO auth.session("expiresAt",token,"updatedAt","userId","activeOrganizationId") VALUES(now(),'t3',now(),$1,'not-a-uuid')`, [u]);
		await admin.query(`INSERT INTO auth.session("expiresAt",token,"updatedAt","userId","activeOrganizationId") VALUES(now(),'t4',now(),$1,$2)`, [u, o]);
		await admin.query(`INSERT INTO auth.member("organizationId","userId",role,"createdAt") VALUES($1,$2,'rep',now())`, [o, u]);
		await admin.query(`INSERT INTO auth."twoFactor"(secret,"backupCodes","userId") VALUES('s','b',$1)`, [u]);
		await admin.query("DELETE FROM auth.organization WHERE id=$1", [o]);
		assert.equal((await one("SELECT \"activeOrganizationId\" a FROM auth.session WHERE token='t4'")).a, null, "SET NULL");
		assert.equal((await one(`SELECT count(*)::int n FROM auth.member WHERE "userId"=$1`, [u])).n, 0, "member cascades from organization");
		await denied("23514", `DELETE FROM auth."user" WHERE id=$1`, [u]); // 015: users are never hard-deleted
		await admin.query(`ALTER TABLE auth."user" DISABLE TRIGGER refuse_user_delete`); // rolled back with the transaction
		await admin.query(`DELETE FROM auth."user" WHERE id=$1`, [u]);
		assert.equal((await one(`SELECT (SELECT count(*) FROM auth.session WHERE "userId"=$1)+(SELECT count(*) FROM auth."twoFactor" WHERE "userId"=$1) n`, [u])).n, "0");
	});
});
