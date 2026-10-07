// AUTH_PLAN v2 B2 (migrations 015-016): projection triggers auth.* -> crm.*, the session bridge crm.actor(), the mfa switch.
// Real PostgreSQL. Better-Auth-shaped rows are written by SQL (no better-auth package here, that is B3).
// Most tests run inside a transaction that is always rolled back; the concurrency test commits and cleans up after itself.
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
const one = async (sql: string, args: unknown[] = []) => (await admin.query(sql, args)).rows[0];
// Helpers reused from tests/auth-b1.test.ts (not importable: that file registers its own tests).
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

const email = () => `u${randomUUID()}@example.test`;
async function mkUser(name = "T", tf: boolean | null = null) {
	const id = randomUUID();
	await admin.query(`INSERT INTO auth."user"(id,name,email,"emailVerified","twoFactorEnabled") VALUES($1,$2,$3,true,$4)`, [id, name, email(), tf]);
	return id;
}
async function mkOrg(name = "O") {
	const id = randomUUID();
	await admin.query(`INSERT INTO auth.organization(id,name,slug,"createdAt") VALUES($1,$2,$3,now())`, [id, name, `o-${id}`]);
	return id;
}
async function mkMember(org: string, user: string, role: string) {
	const id = randomUUID();
	await admin.query(`INSERT INTO auth.member(id,"organizationId","userId",role,"createdAt") VALUES($1,$2,$3,$4,now())`, [id, org, user, role]);
	return id;
}
const memberships = async (org: string) =>
	(await admin.query("SELECT id,principal_id,role,active FROM crm.membership WHERE tenant_id=$1 ORDER BY principal_id", [org])).rows;
// A Better-Auth-shaped session row. Offsets are SQL intervals relative to now().
async function mkSession(user: string, o: { expires?: string; created?: string } = {}) {
	const token = `ba${randomUUID().replaceAll("-", "")}`;
	await admin.query(
		`INSERT INTO auth.session("expiresAt",token,"createdAt","updatedAt","userId") VALUES(now()+$1::interval,$2,now()-$3::interval,now(),$4)`,
		[o.expires ?? "8 hours", token, o.created ?? "1 minute", user],
	);
	return token;
}
async function setToken(token: string | null, tenant?: string) {
	await admin.query("SELECT set_config('crm.token',$1,true)", [token ?? ""]);
	if (tenant) await admin.query("SELECT set_config('crm.tenant',$1,true)", [tenant]);
}
const actor = async () => (await one("SELECT crm.actor() a")).a as string | null;
const mfaOk = async (p: string, t: string) => (await one("SELECT crm.mfa_ok($1,$2) ok", [p, t])).ok as boolean;
const setFlag = (on: boolean) => admin.query("UPDATE crm.platform_flag SET enabled=$1 WHERE name='mfa_required'", [on]);
// Run `fn` as crm_runtime (the real API role).
async function asRuntime<T>(fn: () => Promise<T>): Promise<T> {
	await admin.query("SET LOCAL ROLE crm_runtime");
	try {
		return await fn();
	} finally {
		await admin.query("RESET ROLE");
	}
}

test("B2 migrations 015 and 016 are recorded", async () => {
	const r = await admin.query("SELECT version FROM public.crm_migrations WHERE version IN (15,16) ORDER BY version");
	assert.deepEqual(r.rows.map((x) => x.version), [15, 16]);
});

test("B2 user -> principal: same uuid, rename follows, id immutable, DELETE refused, principal survives", async () => {
	await tx(async () => {
		const u = await mkUser("Alice");
		assert.deepEqual((await one("SELECT id,name FROM crm.principal WHERE id=$1", [u])), { id: u, name: "Alice" });
		await admin.query(`UPDATE auth."user" SET name='Alice B' WHERE id=$1`, [u]);
		assert.equal((await one("SELECT name FROM crm.principal WHERE id=$1", [u])).name, "Alice B");
		await admin.query(`UPDATE auth."user" SET email=$2 WHERE id=$1`, [u, email()]); // other columns: no effect, no error
		await denied("23514", `UPDATE auth."user" SET id=$2 WHERE id=$1`, [u, randomUUID()]);
		await denied("23514", `DELETE FROM auth."user" WHERE id=$1`, [u]);
		assert.equal((await one("SELECT count(*)::int n FROM crm.principal WHERE id=$1", [u])).n, 1);
	});
});

test("B2 an existing seeded principal/tenant with the same id is adopted (upsert), not duplicated", async () => {
	await tx(async () => {
		const id = randomUUID();
		await admin.query("INSERT INTO crm.principal VALUES($1,'Seeded')", [id]);
		await admin.query("INSERT INTO crm.tenant VALUES($1,'Seeded')", [id]);
		await admin.query(`INSERT INTO auth."user"(id,name,email,"emailVerified") VALUES($1,'Real',$2,true)`, [id, email()]);
		await admin.query(`INSERT INTO auth.organization(id,name,slug,"createdAt") VALUES($1,'Real Org',$2,now())`, [id, `o-${id}`]);
		assert.equal((await one("SELECT name FROM crm.principal WHERE id=$1", [id])).name, "Real");
		assert.equal((await one("SELECT name FROM crm.tenant WHERE id=$1", [id])).name, "Real Org");
	});
});

test("B2 organization -> tenant: same uuid, rename follows, id immutable", async () => {
	await tx(async () => {
		const o = await mkOrg("Acme");
		assert.deepEqual(await one("SELECT id,name FROM crm.tenant WHERE id=$1", [o]), { id: o, name: "Acme" });
		await admin.query("UPDATE auth.organization SET name='Acme 2' WHERE id=$1", [o]);
		assert.equal((await one("SELECT name FROM crm.tenant WHERE id=$1", [o])).name, "Acme 2");
		await denied("23514", "UPDATE auth.organization SET id=$2 WHERE id=$1", [o, randomUUID()]);
	});
});

test("B2 member -> membership: same ids, role update, removal sets active=false (row kept), re-add reuses the row", async () => {
	await tx(async () => {
		const o = await mkOrg();
		const [m, r, d] = [await mkUser(), await mkUser(), await mkUser()];
		const mm = await mkMember(o, m, "manager");
		const rm = await mkMember(o, r, "rep");
		await mkMember(o, d, "reader");
		const rows = await memberships(o);
		assert.equal(rows.length, 3);
		const by = Object.fromEntries(rows.map((x) => [x.principal_id, x]));
		assert.deepEqual([by[m].id, by[m].role, by[m].active], [mm, "manager", true]);
		assert.deepEqual([by[r].id, by[r].role, by[r].active], [rm, "rep", true]);
		assert.deepEqual([by[d].role, by[d].active], ["reader", true]);
		await admin.query(`UPDATE auth.member SET role='reader' WHERE id=$1`, [rm]);
		assert.equal((await memberships(o)).find((x) => x.principal_id === r)?.role, "reader");
		await admin.query("DELETE FROM auth.member WHERE id=$1", [rm]);
		const after = (await memberships(o)).find((x) => x.principal_id === r);
		assert.deepEqual([after?.id, after?.active], [rm, false], "row kept, inactive, same id");
		const again = await mkMember(o, r, "rep");
		const back = (await memberships(o)).filter((x) => x.principal_id === r);
		assert.equal(back.length, 1, "no duplicate membership");
		assert.deepEqual([back[0].id, back[0].role, back[0].active], [rm, "rep", true]);
		assert.notEqual(again, rm);
		await denied("23514", `UPDATE auth.member SET "userId"=$2 WHERE id=$1`, [mm, await mkUser()]);
		await denied("23514", `UPDATE auth.member SET "organizationId"=$2 WHERE id=$1`, [mm, await mkOrg()]);
	});
});

test("B2 role mapping lives in the function too: owner -> manager, anything else refused (CHECK relaxed inside the rolled-back tx)", async () => {
	await tx(async () => {
		const c = await one("SELECT conname FROM pg_constraint WHERE conrelid='auth.member'::regclass AND contype='c'");
		await admin.query(`ALTER TABLE auth.member DROP CONSTRAINT "${c.conname}"`);
		const o = await mkOrg();
		const u = await mkUser();
		await mkMember(o, u, "owner");
		assert.equal((await memberships(o))[0].role, "manager");
		for (const bad of ["admin", "member", "worker", "manager,rep", ""])
			await denied("23514", `INSERT INTO auth.member("organizationId","userId",role,"createdAt") VALUES($1,$2,$3,now())`, [o, await mkUser(), bad]);
	});
});

test("B2 worker memberships are never touched: Better Auth cannot take one over or deactivate it", async () => {
	await tx(async () => {
		const o = await mkOrg();
		const u = await mkUser();
		await admin.query("INSERT INTO crm.membership(tenant_id,id,principal_id,role) VALUES($1,$2,$3,'worker')", [o, randomUUID(), u]);
		await denied("23514", `INSERT INTO auth.member("organizationId","userId",role,"createdAt") VALUES($1,$2,'manager',now())`, [o, u]);
		const w = (await memberships(o))[0];
		assert.deepEqual([w.role, w.active], ["worker", true]);
	});
});

test("B2 last-manager guard: removing or demoting the only manager is refused, with another manager it is allowed", async () => {
	await tx(async () => {
		const o = await mkOrg();
		const [a, b, c] = [await mkUser(), await mkUser(), await mkUser()];
		const ma = await mkMember(o, a, "manager");
		const mc = await mkMember(o, c, "rep");
		await denied("23514", "DELETE FROM auth.member WHERE id=$1", [ma]);
		await denied("23514", `UPDATE auth.member SET role='rep' WHERE id=$1`, [ma]);
		await denied("23514", `UPDATE auth.member SET role='reader' WHERE id=$1`, [ma]);
		// the refused change left the projection untouched
		assert.deepEqual((await memberships(o)).find((x) => x.principal_id === a), { id: ma, principal_id: a, role: "manager", active: true });
		await admin.query("DELETE FROM auth.member WHERE id=$1", [mc]); // a rep may always be removed
		const mb = await mkMember(o, b, "manager");
		await admin.query(`UPDATE auth.member SET role='rep' WHERE id=$1`, [ma]); // b is still a manager
		await denied("23514", "DELETE FROM auth.member WHERE id=$1", [mb]);
		await admin.query(`UPDATE auth.member SET role='manager' WHERE id=$1`, [ma]);
		await admin.query("DELETE FROM auth.member WHERE id=$1", [mb]);
		// deleting the organization removes its members without tripping the guard
		await admin.query("DELETE FROM auth.organization WHERE id=$1", [o]);
		assert.ok((await memberships(o)).every((x) => x.active === false));
	});
});

test("B2 last-manager guard under concurrency: two managers demoted at once, the second is refused after the first commits", async () => {
	const b = new pg.Client({ connectionString: process.env.ADMIN_DATABASE_URL });
	await b.connect();
	const o = randomUUID();
	const [u1, u2, u3] = [randomUUID(), randomUUID(), randomUUID()];
	try {
		await admin.query("BEGIN");
		await admin.query(`INSERT INTO auth.organization(id,name,slug,"createdAt") VALUES($1,'C',$2,now())`, [o, `o-${o}`]);
		for (const u of [u1, u2, u3]) await admin.query(`INSERT INTO auth."user"(id,name,email,"emailVerified") VALUES($1,'C',$2,true)`, [u, email()]);
		const m1 = await mkMember(o, u1, "manager");
		const m2 = await mkMember(o, u2, "manager");
		await mkMember(o, u3, "rep");
		await admin.query("COMMIT");
		await admin.query("BEGIN");
		await b.query("BEGIN");
		await admin.query(`UPDATE auth.member SET role='rep' WHERE id=$1`, [m1]);
		const second = b.query(`UPDATE auth.member SET role='rep' WHERE id=$1`, [m2]).then(
			() => "ok",
			(e: { code?: string }) => e.code ?? "error",
		);
		const raced = await Promise.race([second, new Promise((r) => setTimeout(() => r("blocked"), 500))]);
		assert.equal(raced, "blocked", "second demotion waits on the tenant lock");
		await admin.query("COMMIT");
		assert.equal(await second, "23514");
		await b.query("ROLLBACK");
		assert.deepEqual((await memberships(o)).map((x) => x.role).sort(), ["manager", "rep", "rep"]);
	} finally {
		await admin.query("ROLLBACK").catch(() => {});
		await b.query("ROLLBACK").catch(() => {});
		await b.end();
		// cleanup of committed rows: users are normally undeletable, so lift the trigger inside one transaction
		await admin.query("BEGIN");
		await admin.query("DELETE FROM auth.organization WHERE id=$1", [o]);
		await admin.query(`ALTER TABLE auth."user" DISABLE TRIGGER refuse_user_delete`);
		await admin.query(`DELETE FROM auth."user" WHERE id=ANY($1)`, [[u1, u2, u3]]);
		await admin.query(`ALTER TABLE auth."user" ENABLE TRIGGER refuse_user_delete`);
		await admin.query("DELETE FROM crm.membership WHERE tenant_id=$1", [o]);
		await admin.query("DELETE FROM crm.tenant WHERE id=$1", [o]);
		await admin.query("DELETE FROM crm.principal WHERE id=ANY($1)", [[u1, u2, u3]]);
		await admin.query("COMMIT");
	}
});

test("B2 the projection works when Better Auth connects as crm_auth (no privilege on schema crm)", async () => {
	await tx(async () => {
		await admin.query("SET LOCAL ROLE crm_auth");
		const [u, o] = [randomUUID(), randomUUID()];
		await admin.query(`INSERT INTO auth."user"(id,name,email,"emailVerified") VALUES($1,'Via BA',$2,true)`, [u, email()]);
		await admin.query(`INSERT INTO auth.organization(id,name,slug,"createdAt") VALUES($1,'BA Org',$2,now())`, [o, `o-${o}`]);
		await admin.query(`INSERT INTO auth.member("organizationId","userId",role,"createdAt") VALUES($1,$2,'manager',now())`, [o, u]);
		await admin.query("RESET ROLE");
		assert.equal((await one("SELECT name FROM crm.principal WHERE id=$1", [u])).name, "Via BA");
		assert.equal((await one("SELECT name FROM crm.tenant WHERE id=$1", [o])).name, "BA Org");
		assert.equal((await memberships(o))[0].role, "manager");
		await admin.query("SET LOCAL ROLE crm_auth");
		await denied("42501", "SELECT * FROM crm.membership");
		await denied("42501", "SELECT auth.project_member()"); // trigger functions are not callable by anyone
	});
});

test("B2 invariant: every auth.member has a matching crm.membership; no active reader/rep/manager crm.membership of an auth tenant lacks an auth.member", async () => {
	await tx(async () => {
		const o = await mkOrg();
		const [a, b] = [await mkUser(), await mkUser()];
		await mkMember(o, a, "manager");
		const mb = await mkMember(o, b, "rep");
		await admin.query("DELETE FROM auth.member WHERE id=$1", [mb]);
		const missing = await admin.query(
			`SELECT m.id FROM auth.member m WHERE NOT EXISTS(SELECT 1 FROM crm.membership c WHERE c.tenant_id=m."organizationId" AND c.principal_id=m."userId" AND c.active AND c.role=m.role)`,
		);
		assert.deepEqual(missing.rows, []);
		const orphan = await admin.query(
			`SELECT c.id FROM crm.membership c JOIN auth.organization o ON o.id=c.tenant_id
			 WHERE c.active AND c.role IN ('manager','rep','reader')
			 AND NOT EXISTS(SELECT 1 FROM auth.member m WHERE m."organizationId"=c.tenant_id AND m."userId"=c.principal_id)`,
		);
		assert.deepEqual(orphan.rows, []);
	});
});

test("B2 bridge: crm.actor() accepts a live Better Auth session and nothing else", async () => {
	await tx(async () => {
		const u = await mkUser();
		const t = await mkSession(u);
		await asRuntime(async () => {
			await setToken(t);
			assert.equal(await actor(), u);
			await setToken(`${t}x`);
			assert.equal(await actor(), null, "wrong token");
			await setToken("");
			assert.equal(await actor(), null, "empty token");
			await admin.query("SELECT set_config('crm.token',NULL,true)");
			assert.equal(await actor(), null, "no token");
		});
		// the hashed value of a legacy session is not a credential
		const dev = `dev-${randomUUID()}`;
		await admin.query("INSERT INTO crm.session(token_hash,principal_id,expires_at,mfa_verified) VALUES(encode(public.digest($1,'sha256'),'hex'),$2,now()+interval '1 day',false)", [dev, u]);
		const hash = (await one("SELECT token_hash h FROM crm.session WHERE principal_id=$1", [u])).h;
		await setToken(hash);
		assert.equal(await actor(), null, "stored hash is not a token");
		await setToken(dev);
		assert.equal(await actor(), u, "dev/test session-token path still works");
		assert.equal((await one("SELECT kind FROM crm.session WHERE principal_id=$1", [u])).kind, "dev");
	});
});

test("B2 bridge: expired, revoked (deleted), over-age and over-long-idle sessions are not actors (D3: idle 8h, absolute 14 days)", async () => {
	await tx(async () => {
		const u = await mkUser();
		const live = await mkSession(u);
		const expired = await mkSession(u, { expires: "-1 second" });
		const day13 = await mkSession(u, { created: "13 days", expires: "1 hour" });
		const day15 = await mkSession(u, { created: "15 days", expires: "1 hour" });
		const idle8 = await mkSession(u, { expires: "8 hours" });
		const idle7d = await mkSession(u, { expires: "7 days" }); // Better Auth default expiresIn: refused, B3 must configure 8h
		const cases: Array<[string, string | null]> = [[live, u], [expired, null], [day13, u], [day15, null], [idle8, u], [idle7d, null]];
		for (const [tok, want] of cases) {
			await setToken(tok);
			assert.equal(await actor(), want, tok.slice(0, 6));
		}
		await admin.query("DELETE FROM auth.session WHERE token=$1", [live]); // revocation = row deletion (B0 U10)
		await setToken(live);
		assert.equal(await actor(), null, "revoked at once");
		// a session that keeps being refreshed still dies at 14 days from creation
		await mkSession(u, { created: "14 days 1 minute", expires: "8 hours" }).then(async (t) => {
			await setToken(t);
			assert.equal(await actor(), null);
		});
	});
});

test("B2 bridge: tenant crossing is 403 (tenant_access false), removed member loses access, RLS role cannot read auth", async () => {
	await tx(async () => {
		const [u, v] = [await mkUser(), await mkUser()];
		const [ta, tb] = [await mkOrg("A"), await mkOrg("B")];
		await mkMember(ta, u, "rep");
		await mkMember(tb, v, "manager");
		const mu = await mkMember(ta, await mkUser(), "manager");
		const token = await mkSession(u);
		await asRuntime(async () => {
			await setToken(token, ta);
			assert.equal((await one("SELECT crm.tenant_access($1) ok", [ta])).ok, true);
			assert.equal((await one("SELECT crm.tenant_access($1) ok", [tb])).ok, false, "other tenant");
			await setToken(token, tb);
			assert.equal((await one("SELECT crm.tenant_access($1) ok", [tb])).ok, false, "tenant B with A's user");
			assert.equal((await one("SELECT crm.tenant_access($1) ok", [ta])).ok, false, "context tenant must match");
			await denied("42501", "SELECT * FROM auth.session");
			await denied("42501", "SELECT auth.live_session_user()");
		});
		await admin.query(`DELETE FROM auth.member WHERE "organizationId"=$1 AND "userId"=$2`, [ta, u]);
		await asRuntime(async () => {
			await setToken(token, ta);
			assert.equal(await actor(), u, "still authenticated");
			assert.equal((await one("SELECT crm.tenant_access($1) ok", [ta])).ok, false, "member removed -> inactive -> 403");
		});
		assert.ok(mu);
	});
});

test("B2 mfa switch: default OFF (BA sessions need no TOTP); ON requires live twoFactorEnabled; fail-closed without the row", async () => {
	await tx(async () => {
		assert.deepEqual(await one("SELECT name,enabled FROM crm.platform_flag"), { name: "mfa_required", enabled: false }, "single flag, default OFF");
		const o = await mkOrg();
		const mgr = await mkUser("M", null);
		const mgr2 = await mkUser("M2", true);
		const rep = await mkUser("R", null);
		await mkMember(o, mgr, "manager");
		await mkMember(o, mgr2, "manager");
		await mkMember(o, rep, "rep");
		const [tMgr, tMgr2, tRep] = [await mkSession(mgr), await mkSession(mgr2), await mkSession(rep)];
		// OFF
		await setToken(tMgr);
		assert.equal(await mfaOk(mgr, o), true, "OFF: manager without TOTP passes");
		// ON
		await setFlag(true);
		assert.equal(await mfaOk(mgr, o), false, "ON: manager without TOTP has no manager scope");
		await setToken(tMgr2);
		assert.equal(await mfaOk(mgr2, o), true, "ON: manager with TOTP");
		await admin.query(`UPDATE auth."user" SET "twoFactorEnabled"=false WHERE id=$1`, [mgr2]);
		assert.equal(await mfaOk(mgr2, o), false, "ON: disabling 2FA drops scope on the next call");
		await setToken(tRep);
		assert.equal(await mfaOk(rep, o), true, "non-managers never need it");
		// the token must belong to the principal being asked about
		await setToken(tMgr2);
		await admin.query(`UPDATE auth."user" SET "twoFactorEnabled"=true WHERE id=$1`, [mgr2]);
		assert.equal(await mfaOk(mgr, o), false, "someone else's strong session does not vouch for mgr");
		assert.equal(await mfaOk(mgr2, o), true);
		// fail closed
		await setFlag(false);
		await setToken(tMgr);
		assert.equal(await mfaOk(mgr, o), true);
		await admin.query("DELETE FROM crm.platform_flag");
		assert.equal(await mfaOk(mgr, o), false, "missing flag row = ON");
		// an expired BA session never satisfies mfa
		await admin.query("INSERT INTO crm.platform_flag VALUES('mfa_required',false)");
		await setToken(await mkSession(mgr, { expires: "-1 minute" }));
		assert.equal(await mfaOk(mgr, o), false, "expired session");
	});
});

test("B2 mfa switch does not weaken legacy dev/service sessions: they keep their own mfa_verified, flag OFF or ON", async () => {
	await tx(async () => {
		const o = await mkOrg();
		const m = await mkUser();
		await mkMember(o, m, "manager");
		const [weak, strong] = [`dev-${randomUUID()}`, `dev-${randomUUID()}`];
		for (const [tok, v] of [[weak, false], [strong, true]] as const)
			await admin.query("INSERT INTO crm.session(token_hash,principal_id,expires_at,mfa_verified) VALUES(encode(public.digest($1,'sha256'),'hex'),$2,now()+interval '1 day',$3) ON CONFLICT DO NOTHING", [tok, m, v]);
		for (const on of [false, true]) {
			await setFlag(on);
			await setToken(weak);
			assert.equal(await mfaOk(m, o), false, `weak legacy session, flag ${on}`);
			await setToken(strong);
			assert.equal(await mfaOk(m, o), true, `strong legacy session, flag ${on}`);
		}
	});
});

test("B2 platform_flag is private: no privilege for PUBLIC, crm_runtime or crm_auth", async () => {
	for (const role of ["crm_runtime", "crm_auth"]) {
		const r = await one(
			`SELECT bool_or(has_table_privilege($1,'crm.platform_flag'::regclass,p)) x FROM unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) p`,
			[role],
		);
		assert.equal(r.x, false, role);
	}
	const pub = await one(`SELECT count(*)::int n FROM aclexplode(coalesce((SELECT relacl FROM pg_class WHERE oid='crm.platform_flag'::regclass),acldefault('r',(SELECT relowner FROM pg_class WHERE oid='crm.platform_flag'::regclass)))) a WHERE a.grantee=0`);
	assert.equal(pub.n, 0);
	await tx(async () => {
		await asRuntime(async () => {
			await denied("42501", "SELECT * FROM crm.platform_flag");
			await denied("42501", "UPDATE crm.platform_flag SET enabled=true");
		});
	});
});

test("B2 role_permission: manager gets user.read/invite/manage (tenant scope); rep, reader, worker get none", async () => {
	const r = await admin.query("SELECT role,action,scope FROM crm.role_permission WHERE action LIKE 'user.%' ORDER BY action,role");
	assert.deepEqual(r.rows, [
		{ role: "manager", action: "user.invite", scope: "tenant" },
		{ role: "manager", action: "user.manage", scope: "tenant" },
		{ role: "manager", action: "user.read", scope: "tenant" },
	]);
});

test("B2 session.kind: dev by default, only dev/service allowed", async () => {
	await tx(async () => {
		const p = await mkUser();
		await admin.query("INSERT INTO crm.session(token_hash,principal_id,expires_at) VALUES('k1',$1,now())", [p]);
		assert.equal((await one("SELECT kind FROM crm.session WHERE token_hash='k1'")).kind, "dev");
		await admin.query("INSERT INTO crm.session(token_hash,principal_id,expires_at,kind) VALUES('k2',$1,now(),'service')", [p]);
		await denied("23514", "INSERT INTO crm.session(token_hash,principal_id,expires_at,kind) VALUES('k3',$1,now(),'human')", [p]);
	});
});

test("B2 catalog: every definer in auth and crm has a fixed search_path and no PUBLIC EXECUTE; crm_runtime/crm_auth cannot execute auth functions", async () => {
	const open = await admin.query(
		`SELECT p.oid::regprocedure::text fn FROM pg_proc p WHERE p.pronamespace IN ('auth'::regnamespace,'crm'::regnamespace)
		 AND EXISTS(SELECT 1 FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a WHERE a.grantee=0 AND a.privilege_type='EXECUTE')`,
	);
	assert.deepEqual(open.rows, [], "PUBLIC EXECUTE");
	const loose = await admin.query(
		`SELECT p.oid::regprocedure::text fn FROM pg_proc p WHERE p.pronamespace IN ('auth'::regnamespace,'crm'::regnamespace)
		 AND p.prosecdef AND NOT EXISTS(SELECT 1 FROM unnest(coalesce(p.proconfig,'{}')) c WHERE c LIKE 'search_path=%')`,
	);
	assert.deepEqual(loose.rows, [], "definer without fixed search_path");
	const authFns = await admin.query(`SELECT p.oid::regprocedure::text fn, p.prosecdef, has_function_privilege('crm_runtime',p.oid,'EXECUTE') rt, has_function_privilege('crm_auth',p.oid,'EXECUTE') ba FROM pg_proc p WHERE p.pronamespace='auth'::regnamespace`);
	assert.deepEqual(
		authFns.rows.map((x) => x.fn).sort(),
		["auth.assert_tenant_has_manager(uuid)", "auth.auth_event_append_only()", "auth.live_session_user()", "auth.login_failed(text)", "auth.login_gate(text)", "auth.login_succeeded(text)", "auth.project_member()", "auth.project_organization()", "auth.project_user()", "auth.refuse_user_delete()"],
	);
	// 017: the three login throttle functions are the only auth functions crm_auth may execute.
	const baOk = new Set(["auth.login_gate(text)", "auth.login_failed(text)", "auth.login_succeeded(text)"]);
	for (const f of authFns.rows) assert.deepEqual([f.prosecdef, f.rt, f.ba], [true, false, baOk.has(f.fn)], f.fn);
	for (const sig of ["crm.actor()", "crm.mfa_ok(uuid,uuid)"]) {
		const r = await one(`SELECT p.prosecdef, has_function_privilege('crm_auth',p.oid,'EXECUTE') ba FROM pg_proc p WHERE p.oid=$1::regprocedure`, [sig]);
		assert.deepEqual([r.prosecdef, r.ba], [true, false], sig);
	}
	assert.equal((await one("SELECT has_function_privilege('crm_runtime','crm.actor()','EXECUTE') x")).x, true, "runtime keeps its grant on actor()");
});
