// ADR-002 P1b B1 (migration 010): property registry tables, `custom` storage, owner-only seed, PUBLIC-EXECUTE guard. Real PostgreSQL.
// Tenant-scoped statements run as crm_runtime (RLS enforced) through transaction(); fixtures/catalog checks use the admin connection.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { seed } from "../scripts/seed.js";
import { crmRequest, type Body } from "../src/crm.js";
import { Fault, pool, transaction, type Context } from "../src/db.js";

const admin = new pg.Client({
	connectionString: process.env.ADMIN_DATABASE_URL,
});
let f: Awaited<ReturnType<typeof seed>>, a: Context, b: Context;
before(async () => {
	await admin.connect();
});
after(async () => {
	await admin.end();
	await pool.end();
});
async function fresh() {
	f = await seed(admin);
	a = { tenant: f.ids.a, token: f.tokens.manager };
	b = { tenant: f.ids.b, token: f.tokens.agency };
}
// One statement per runtime transaction (an error aborts the transaction).
const rt = (c: Context, sql: string, args: unknown[] = []) =>
	transaction(c, (db) => db.query(sql, args));
const sqlstate = (code: string) => (e: unknown) =>
	(e as { code?: string }).code === code;
const L = (en: string) => JSON.stringify({ en, ar: `${en} ع` });
const one = async (sql: string, args: unknown[] = []) =>
	(await admin.query(sql, args)).rows[0];
const REG = [
	"object_type",
	"property_group",
	"property_definition",
	"property_option",
];
const OBJECTS = ["contact", "lead", "deal", "task"];

test("P1B-B1 registry tables: ENABLE+FORCE RLS with the initplan tenant policy, no DELETE/DDL for runtime", async () => {
	for (const t of REG) {
		const r = await one(
			`SELECT c.relrowsecurity rls, c.relforcerowsecurity forced,
			 (SELECT pg_get_expr(polqual,polrelid) FROM pg_policy WHERE polrelid=c.oid AND polname='tenant_boundary') pol,
			 has_table_privilege('crm_runtime',c.oid,'DELETE') del, has_table_privilege('crm_runtime',c.oid,'TRUNCATE') trunc,
			 has_table_privilege('crm_runtime',c.oid,'INSERT') ins_table, has_table_privilege('crm_runtime',c.oid,'UPDATE') upd_table,
			 has_table_privilege('crm_runtime',c.oid,'REFERENCES') ref, has_table_privilege('crm_runtime',c.oid,'TRIGGER') trig
			 FROM pg_class c WHERE c.oid=$1::regclass`,
			[`crm.${t}`],
		);
		assert.equal(r.rls, true, t);
		assert.equal(r.forced, true, t);
		assert.match(
			r.pol,
			/\(tenant_id = \( SELECT crm\.context_tenant_if_allowed\(\) AS context_tenant_if_allowed\)\)/,
			`${t} initplan form`,
		);
		assert.deepEqual(
			[r.del, r.trunc, r.ins_table, r.upd_table, r.ref, r.trig],
			[false, false, false, false, false, false],
			`${t} no table-wide write/DELETE/TRUNCATE/REFERENCES/TRIGGER`,
		);
	}
	// column-level only: key/type/is_system/storage/column_name are not writable by runtime
	for (const col of [
		"key",
		"type",
		"object_type",
		"storage",
		"column_name",
		"is_system",
		"tenant_id",
		"id",
	])
		assert.equal(
			(
				await one(
					"SELECT has_column_privilege('crm_runtime','crm.property_definition',$1,'UPDATE') u",
					[col],
				)
			).u,
			false,
			`UPDATE ${col}`,
		);
	for (const col of ["storage", "column_name", "is_system"])
		assert.equal(
			(
				await one(
					"SELECT has_column_privilege('crm_runtime','crm.property_definition',$1,'INSERT') u",
					[col],
				)
			).u,
			false,
			`INSERT ${col}`,
		);
	for (const col of ["label", "archived_at", "position", "version"])
		assert.equal(
			(
				await one(
					"SELECT has_column_privilege('crm_runtime','crm.property_definition',$1,'UPDATE') u",
					[col],
				)
			).u,
			true,
			`UPDATE ${col}`,
		);
	assert.equal(
		(
			await one(
				"SELECT has_column_privilege('crm_runtime','crm.property_option','value','UPDATE') u",
			)
		).u,
		false,
	);
	assert.equal(
		(
			await one(
				"SELECT has_column_privilege('crm_runtime','crm.object_type','schema_rev','UPDATE') u",
			)
		).u,
		true,
	);
	assert.equal(
		(
			await one(
				"SELECT has_table_privilege('crm_runtime','crm.object_type','INSERT') u",
			)
		).u,
		false,
	);
});

test("P1B-B1 seed: every tenant has the 4 standard objects, general group, system properties and select options", async () => {
	await fresh();
	for (const t of [f.ids.a, f.ids.b]) {
		assert.deepEqual(
			(
				await admin.query(
					"SELECT key FROM crm.object_type WHERE tenant_id=$1 AND kind='standard' ORDER BY key",
					[t],
				)
			).rows.map((r) => r.key),
			["contact", "deal", "lead", "task"],
		);
		assert.equal(
			Number(
				(
					await one(
						"SELECT count(*) n FROM crm.property_group WHERE tenant_id=$1 AND key='general'",
						[t],
					)
				).n,
			),
			4,
		);
		const props = (
			await admin.query(
				"SELECT object_type,key,storage,column_name,is_system,type FROM crm.property_definition WHERE tenant_id=$1",
				[t],
			)
		).rows;
		assert.equal(props.length, 26);
		for (const p of props) {
			assert.equal(p.is_system, true);
			assert.equal(p.storage, "column");
			assert.equal(p.column_name, p.key);
		}
		// every column-mapped property really is a column of its table (no dangling mapping)
		for (const p of props)
			assert.ok(
				(
					await one(
						"SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='crm' AND table_name=$1 AND column_name=$2) e",
						[p.object_type, p.column_name],
					)
				).e,
				`${p.object_type}.${p.column_name}`,
			);
		assert.deepEqual(
			(
				await admin.query(
					"SELECT d.object_type||'.'||d.key||'='||o.value v FROM crm.property_option o JOIN crm.property_definition d ON d.tenant_id=o.tenant_id AND d.id=o.property_id WHERE o.tenant_id=$1 ORDER BY 1",
					[t],
				)
			).rows.map((r) => r.v),
			[
				"lead.status=closed",
				"lead.status=open",
				"lead.status=qualified",
				"task.status=completed",
				"task.status=open",
			],
		);
	}
	// no tenant in the database is left unseeded by the migration (4 objects each)
	assert.equal(
		Number(
			(
				await one(
					"SELECT count(*) n FROM crm.tenant t WHERE (SELECT count(*) FROM crm.object_type o WHERE o.tenant_id=t.id)<>4",
				)
			).n,
		),
		0,
	);
});

test("P1B-B1 seed is idempotent, never overwrites edits, re-adds missing rows; owner-only", async () => {
	await fresh();
	const counts = async () =>
		await one(
			"SELECT (SELECT count(*) FROM crm.object_type WHERE tenant_id=$1) o,(SELECT count(*) FROM crm.property_group WHERE tenant_id=$1) g,(SELECT count(*) FROM crm.property_definition WHERE tenant_id=$1) d,(SELECT count(*) FROM crm.property_option WHERE tenant_id=$1) p",
			[f.ids.a],
		);
	const before = await counts();
	await admin.query(
		"UPDATE crm.property_definition SET label=$2,show_default=false WHERE tenant_id=$1 AND object_type='contact' AND key='source'",
		[f.ids.a, L("Edited")],
	);
	await admin.query("SELECT crm.seed_system_properties($1)", [f.ids.a]);
	await admin.query("SELECT crm.seed_system_properties($1)", [f.ids.a]);
	assert.deepEqual(await counts(), before);
	const kept = await one(
		"SELECT label#>>'{}' en,show_default FROM crm.property_definition WHERE tenant_id=$1 AND object_type='contact' AND key='source'",
		[f.ids.a],
	);
	assert.deepEqual(kept, { en: "Edited", show_default: false });
	// a deleted row (owner only; runtime cannot DELETE) comes back
	await admin.query(
		"DELETE FROM crm.property_definition WHERE tenant_id=$1 AND object_type='task' AND key='outcome'",
		[f.ids.a],
	);
	await admin.query("SELECT crm.seed_system_properties($1)", [f.ids.a]);
	assert.deepEqual(await counts(), before);
	// the other tenant is untouched by seeding tenant A
	assert.equal(
		Number(
			(
				await one(
					"SELECT count(*) n FROM crm.property_definition WHERE tenant_id=$1",
					[f.ids.b],
				)
			).n,
		),
		26,
	);
	await assert.rejects(
		admin.query("SELECT crm.seed_system_properties($1)", [randomUUID()]),
		/TENANT_NOT_FOUND/,
	);
	// runtime cannot execute it (nor the limits trigger function), PUBLIC cannot either
	for (const fn of [
		"crm.seed_system_properties(uuid)",
		"crm.enforce_registry_limits()",
	])
		assert.equal(
			(
				await one(
					"SELECT has_function_privilege('crm_runtime',$1::regprocedure,'EXECUTE') x",
					[fn],
				)
			).x,
			false,
			fn,
		);
	await assert.rejects(
		rt(a, "SELECT crm.seed_system_properties($1)", [f.ids.a]),
		sqlstate("42501"),
	);
	await assert.rejects(
		rt(a, "SELECT crm.seed_system_properties($1)", [f.ids.b]),
		sqlstate("42501"),
	);
});

test("P1B-B1 catalog guard: NO function in schema crm is EXECUTE-able by PUBLIC; runtime keeps its explicit grants", async () => {
	const open = (
		await admin.query(
			`SELECT p.oid::regprocedure::text fn FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
			 WHERE n.nspname='crm' AND EXISTS(SELECT 1 FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a WHERE a.grantee=0 AND a.privilege_type='EXECUTE')`,
		)
	).rows.map((r) => r.fn);
	assert.deepEqual(open, [], "functions executable by PUBLIC");
	// the schema must actually contain functions (the guard cannot pass vacuously)
	assert.ok(
		Number(
			(
				await one(
					"SELECT count(*) n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='crm'",
				)
			).n,
		) > 20,
	);
	for (const fn of [
		"crm.actor()",
		"crm.context_tenant()",
		"crm.tenant_access(uuid)",
		"crm.can_action(text,uuid,uuid)",
		"crm.job_authorized(uuid)",
		"crm.can_object(text,text,uuid,uuid)",
		"crm.assignment_ok(uuid)",
		"crm.encrypt_identifier(text)",
		"crm.identifier_digest(text)",
		"crm.identifier_value(uuid)",
		"crm.assignees()",
		"crm.assert_identifier_configuration()",
		"crm.collect_event(uuid,text,jsonb)",
		"crm.attribution_job_allowed(uuid)",
		"crm.collection_origin_allowed(text)",
		"crm.context_tenant_if_allowed()",
		"crm.object_scope(text,uuid)",
		"crm.owner_names(uuid[])",
		"crm.normalize_search(text)",
	])
		assert.equal(
			(
				await one(
					"SELECT has_function_privilege('crm_runtime',$1::regprocedure,'EXECUTE') x",
					[fn],
				)
			).x,
			true,
			fn,
		);
	// provisioning/secret helpers stay closed to runtime (005 pattern)
	for (const fn of [
		"crm.identifier_key(uuid)",
		"crm.provision_identifier_key(uuid)",
		"crm.seed_system_properties(uuid)",
	])
		assert.equal(
			(
				await one(
					"SELECT has_function_privilege('crm_runtime',$1::regprocedure,'EXECUTE') x",
					[fn],
				)
			).x,
			false,
			fn,
		);
});

test("P1B-B1 isolation: two tenants, per new table (read, insert, update, cross-tenant FK)", async () => {
	await fresh();
	// --- read
	for (const t of REG) {
		const own = (await rt(a, `SELECT tenant_id FROM crm.${t}`)).rows;
		assert.ok(own.length > 0, t);
		assert.ok(
			own.every((r) => r.tenant_id === f.ids.a),
			`${t} only tenant A rows`,
		);
		assert.equal(
			(
				await rt(a, `SELECT count(*) n FROM crm.${t} WHERE tenant_id=$1`, [
					f.ids.b,
				])
			).rows[0].n,
			"0",
			`${t} B hidden from A`,
		);
		assert.ok(
			(await rt(b, `SELECT tenant_id FROM crm.${t}`)).rows.every(
				(r) => r.tenant_id === f.ids.b,
			),
			`${t} only tenant B rows`,
		);
	}
	const aGroup = (
		await one(
			"SELECT id FROM crm.property_group WHERE tenant_id=$1 AND object_type='contact'",
			[f.ids.a],
		)
	).id;
	const bGroup = (
		await one(
			"SELECT id FROM crm.property_group WHERE tenant_id=$1 AND object_type='contact'",
			[f.ids.b],
		)
	).id;
	const bProp = (
		await one(
			"SELECT id FROM crm.property_definition WHERE tenant_id=$1 AND object_type='lead' AND key='status'",
			[f.ids.b],
		)
	).id;
	const aProp = (
		await one(
			"SELECT id FROM crm.property_definition WHERE tenant_id=$1 AND object_type='lead' AND key='status'",
			[f.ids.a],
		)
	).id;
	const defSql =
		"INSERT INTO crm.property_definition(tenant_id,id,object_type,key,type,label,group_id) VALUES($1,$2,'contact',$3,'text',$4,$5)";
	// --- insert: own tenant ok; other tenant's tenant_id fails RLS WITH CHECK
	await rt(a, defSql, [
		f.ids.a,
		randomUUID(),
		"custom_a",
		L("Custom A"),
		aGroup,
	]);
	await assert.rejects(
		rt(a, defSql, [f.ids.b, randomUUID(), "custom_x", L("X"), bGroup]),
		sqlstate("42501"),
	);
	await assert.rejects(
		rt(
			a,
			"INSERT INTO crm.property_group(tenant_id,id,object_type,key,label) VALUES($1,$2,'contact','g_x',$3)",
			[f.ids.b, randomUUID(), L("G")],
		),
		sqlstate("42501"),
	);
	await assert.rejects(
		rt(
			a,
			"INSERT INTO crm.property_option(tenant_id,property_id,value,label) VALUES($1,$2,'x',$3)",
			[f.ids.b, bProp, L("X")],
		),
		sqlstate("42501"),
	);
	// --- cross-tenant FK: tenant A row pointing at tenant B's group / property / object_type is rejected by the composite FK
	await assert.rejects(
		rt(a, defSql, [f.ids.a, randomUUID(), "custom_fk", L("FK"), bGroup]),
		sqlstate("23503"),
	);
	await assert.rejects(
		rt(
			a,
			"INSERT INTO crm.property_option(tenant_id,property_id,value,label) VALUES($1,$2,'x',$3)",
			[f.ids.a, bProp, L("X")],
		),
		sqlstate("23503"),
	);
	await assert.rejects(
		rt(
			a,
			"INSERT INTO crm.property_group(tenant_id,id,object_type,key,label) VALUES($1,$2,'no_such_object','g_y',$3)",
			[f.ids.a, randomUUID(), L("G")],
		),
		sqlstate("23503"),
	);
	// a group of another OBJECT in the same tenant is rejected too (composite (tenant,object_type,group))
	const aLeadGroup = (
		await one(
			"SELECT id FROM crm.property_group WHERE tenant_id=$1 AND object_type='lead'",
			[f.ids.a],
		)
	).id;
	await assert.rejects(
		rt(a, defSql, [f.ids.a, randomUUID(), "custom_og", L("OG"), aLeadGroup]),
		sqlstate("23503"),
	);
	// --- update/delete: other tenant's rows are invisible (0 rows), DELETE is not granted
	assert.equal(
		(
			await rt(
				a,
				"UPDATE crm.property_definition SET label=$2 WHERE tenant_id=$1",
				[f.ids.b, L("hijack")],
			)
		).rowCount,
		0,
	);
	assert.equal(
		(
			await rt(
				a,
				"UPDATE crm.property_option SET archived=true WHERE tenant_id=$1",
				[f.ids.b],
			)
		).rowCount,
		0,
	);
	assert.equal(
		(
			await rt(
				a,
				"UPDATE crm.object_type SET schema_rev=schema_rev+1 WHERE tenant_id=$1",
				[f.ids.b],
			)
		).rowCount,
		0,
	);
	assert.equal(
		(
			await rt(
				a,
				"UPDATE crm.object_type SET schema_rev=schema_rev+1 WHERE tenant_id=$1",
				[f.ids.a],
			)
		).rowCount,
		4,
	);
	assert.equal(
		Number(
			(
				await one(
					"SELECT count(*) n FROM crm.property_definition WHERE tenant_id=$1 AND label#>>'{}'='hijack'",
					[f.ids.b],
				)
			).n,
		),
		0,
	);
	for (const t of REG)
		await assert.rejects(
			rt(a, `DELETE FROM crm.${t} WHERE tenant_id=$1`, [f.ids.a]),
			sqlstate("42501"),
			`DELETE ${t}`,
		);
	// option insert for an own property works, value is immutable for runtime
	await rt(
		a,
		"INSERT INTO crm.property_option(tenant_id,property_id,value,label,color) VALUES($1,$2,'vip',$3,'blue')",
		[f.ids.a, aProp, L("VIP")],
	);
	await assert.rejects(
		rt(
			a,
			"UPDATE crm.property_option SET value='vip2' WHERE tenant_id=$1 AND value='vip'",
			[f.ids.a],
		),
		sqlstate("42501"),
	);
	// a caller with no access to the tenant (tenant A's manager asking for tenant B) never reaches the tables
	await assert.rejects(
		rt({ tenant: f.ids.b, token: f.tokens.manager }, "SELECT 1"),
		(e) => e instanceof Fault && e.status === 403,
	);
});

test("P1B-B1 runtime cannot create system/column-mapped rows or change key/type; seed-only fields stay immutable", async () => {
	await fresh();
	const g = (
		await one(
			"SELECT id FROM crm.property_group WHERE tenant_id=$1 AND object_type='contact'",
			[f.ids.a],
		)
	).id;
	const base = (cols: string, vals: string) =>
		`INSERT INTO crm.property_definition(tenant_id,id,object_type,key,type,label,group_id,${cols}) VALUES($1,$2,'contact','k_${cols.length}','text',$3,$4,${vals})`;
	for (const [cols, vals] of [
		["is_system", "true"],
		["storage", "'column'"],
		["column_name", "'owner_id'"],
	])
		await assert.rejects(
			rt(a, base(cols, vals), [f.ids.a, randomUUID(), L("x"), g]),
			sqlstate("42501"),
			cols,
		);
	await rt(
		a,
		"INSERT INTO crm.property_definition(tenant_id,id,object_type,key,type,label) VALUES($1,$2,'contact','plain','text',$3)",
		[f.ids.a, randomUUID(), L("Plain")],
	);
	const row = await one(
		"SELECT storage,column_name,is_system FROM crm.property_definition WHERE tenant_id=$1 AND key='plain'",
		[f.ids.a],
	);
	assert.deepEqual(row, {
		storage: "custom",
		column_name: null,
		is_system: false,
	});
	for (const col of [
		"key",
		"type",
		"object_type",
		"is_system",
		"storage",
		"column_name",
	])
		await assert.rejects(
			rt(
				a,
				`UPDATE crm.property_definition SET ${col}=${col} WHERE tenant_id=$1 AND key='plain'`,
				[f.ids.a],
			),
			sqlstate("42501"),
			col,
		);
	assert.equal(
		(
			await rt(
				a,
				"UPDATE crm.property_definition SET archived_at=now(),version=version+1 WHERE tenant_id=$1 AND key='plain'",
				[f.ids.a],
			)
		).rowCount,
		1,
	);
});

test("P1B-B1 constraints: key regex, type list, label shape, currency pairing, column uniqueness, sizes", async () => {
	await fresh();
	const ins = (key: string, type = "text", label = L("L"), extra = "") =>
		admin.query(
			`INSERT INTO crm.property_definition(tenant_id,id,object_type,key,type,label${extra ? ",currency" : ""}) VALUES($1,$2,'contact',$3,$4,$5${extra ? `,${extra}` : ""})`,
			[f.ids.a, randomUUID(), key, type, label],
		);
	await ins("good_key1");
	for (const key of [
		"Bad",
		"1abc",
		"a-b",
		"a b",
		"",
		"a".repeat(64),
		"اسم",
		"a;b",
	])
		await assert.rejects(ins(key), sqlstate("23514"), `key ${key}`);
	await ins("a".repeat(63), "text", L("max"));
	await assert.rejects(ins("bad_type", "reference"), sqlstate("23514"));
	await assert.rejects(ins("no_label", "text", "{}"), sqlstate("23514"));
	await assert.rejects(ins("arr_label", "text", "[]"), sqlstate("23514"));
	await assert.rejects(
		ins("empty_label", "text", JSON.stringify({ en: "", ar: "" })),
		sqlstate("23514"),
	);
	await ins("ar_only", "text", JSON.stringify({ ar: "اسم" }));
	await assert.rejects(
		ins("big_label", "text", JSON.stringify({ en: "x".repeat(3000) })),
		sqlstate("23514"),
	);
	await assert.rejects(ins("cur_missing", "currency"), sqlstate("23514"));
	await ins("cur_ok", "currency", L("Cur"), "'EGP'");
	await assert.rejects(
		ins("cur_bad", "currency", L("Cur"), "'egp'"),
		sqlstate("23514"),
	);
	await assert.rejects(
		ins("cur_on_text", "text", L("Cur"), "'EGP'"),
		sqlstate("23514"),
	);
	// duplicate key per object, but same key on another object is fine
	await assert.rejects(ins("good_key1"), sqlstate("23505"));
	await assert.rejects(
		ins("display_name"),
		sqlstate("23505"),
		"custom key must not collide with a system key",
	);
	// storage/column_name pairing and one property per column
	await assert.rejects(
		admin.query(
			"INSERT INTO crm.property_definition(tenant_id,id,object_type,key,type,label,storage) VALUES($1,$2,'contact','col1','text',$3,'column')",
			[f.ids.a, randomUUID(), L("c")],
		),
		sqlstate("23514"),
	);
	await assert.rejects(
		admin.query(
			"INSERT INTO crm.property_definition(tenant_id,id,object_type,key,type,label,storage,column_name,is_system) VALUES($1,$2,'contact','dup_col','text',$3,'column','display_name',true)",
			[f.ids.a, randomUUID(), L("c")],
		),
		sqlstate("23505"),
	);
	await assert.rejects(
		admin.query(
			"INSERT INTO crm.property_definition(tenant_id,id,object_type,key,type,label,is_system) VALUES($1,$2,'contact','sys_custom','text',$3,true)",
			[f.ids.a, randomUUID(), L("c")],
		),
		sqlstate("23514"),
	);
	// option value / color
	const pid = (
		await one(
			"SELECT id FROM crm.property_definition WHERE tenant_id=$1 AND key='good_key1'",
			[f.ids.a],
		)
	).id;
	const opt = (value: string, color: string | null = null) =>
		admin.query(
			"INSERT INTO crm.property_option(tenant_id,property_id,value,label,color) VALUES($1,$2,$3,$4,$5)",
			[f.ids.a, pid, value, L("o"), color],
		);
	await opt("ok_value", "blue");
	await opt("اختيار");
	for (const v of ["", "x".repeat(65), "a\tb"])
		await assert.rejects(
			opt(v),
			sqlstate("23514"),
			`option ${JSON.stringify(v)}`,
		);
	for (const c of ["#ff0000", "Blue", "url(x)", "a".repeat(33)])
		await assert.rejects(
			opt(`c${c.length}${c.charCodeAt(0)}`, c),
			sqlstate("23514"),
			`color ${c}`,
		);
	await assert.rejects(opt("ok_value"), sqlstate("23505"));
});

test("P1B-B1 limits: 100 active custom properties per object, 200 active options per property (archived and system do not count)", async () => {
	await fresh();
	await admin.query(
		"INSERT INTO crm.property_definition(tenant_id,id,object_type,key,type,label) SELECT $1,gen_random_uuid(),'deal','p'||i,'text',$2 FROM generate_series(1,100) i",
		[f.ids.a, L("p")],
	);
	const add = (key: string) =>
		rt(
			a,
			"INSERT INTO crm.property_definition(tenant_id,id,object_type,key,type,label) VALUES($1,$2,'deal',$3,'text',$4)",
			[f.ids.a, randomUUID(), key, L("p")],
		);
	await assert.rejects(
		add("p101"),
		(e: Error) =>
			/PROPERTY_LIMIT_EXCEEDED/.test(e.message) && sqlstate("23514")(e),
	);
	// another object is unaffected by deal's count
	await rt(
		a,
		"INSERT INTO crm.property_definition(tenant_id,id,object_type,key,type,label) VALUES($1,$2,'lead',$3,'text',$4)",
		[f.ids.a, randomUUID(), "lead_extra", L("p")],
	);
	// archive one -> room for one; unarchiving past the limit is refused
	assert.equal(
		(
			await rt(
				a,
				"UPDATE crm.property_definition SET archived_at=now() WHERE tenant_id=$1 AND object_type='deal' AND key='p1'",
				[f.ids.a],
			)
		).rowCount,
		1,
	);
	await add("p102_fits");
	await assert.rejects(
		rt(
			a,
			"UPDATE crm.property_definition SET archived_at=NULL WHERE tenant_id=$1 AND object_type='deal' AND key='p1'",
			[f.ids.a],
		),
		/PROPERTY_LIMIT_EXCEEDED/,
	);
	// the other tenant has its own count
	await rt(
		b,
		"INSERT INTO crm.property_definition(tenant_id,id,object_type,key,type,label) VALUES($1,$2,'deal','p1','text',$3)",
		[f.ids.b, randomUUID(), L("p")],
	);
	// options
	const pid = (
		await one(
			"SELECT id FROM crm.property_definition WHERE tenant_id=$1 AND object_type='deal' AND key='p2'",
			[f.ids.a],
		)
	).id;
	await admin.query(
		"INSERT INTO crm.property_option(tenant_id,property_id,value,label) SELECT $1,$2,'o'||i,$3 FROM generate_series(1,200) i",
		[f.ids.a, pid, L("o")],
	);
	const addOpt = (v: string) =>
		rt(
			a,
			"INSERT INTO crm.property_option(tenant_id,property_id,value,label) VALUES($1,$2,$3,$4)",
			[f.ids.a, pid, v, L("o")],
		);
	await assert.rejects(addOpt("o201"), /OPTION_LIMIT_EXCEEDED/);
	await rt(
		a,
		"UPDATE crm.property_option SET archived=true WHERE tenant_id=$1 AND property_id=$2 AND value='o1'",
		[f.ids.a, pid],
	);
	await addOpt("o201");
	await assert.rejects(
		rt(
			a,
			"UPDATE crm.property_option SET archived=false WHERE tenant_id=$1 AND property_id=$2 AND value='o1'",
			[f.ids.a, pid],
		),
		/OPTION_LIMIT_EXCEEDED/,
	);
	// system rows are not counted against the 100 (26 system rows exist next to the 100 custom ones)
	assert.equal(
		Number(
			(
				await one(
					"SELECT count(*) n FROM crm.property_definition WHERE tenant_id=$1 AND object_type='deal' AND is_system",
					[f.ids.a],
				)
			).n,
		),
		6,
	);
	// concurrent inserts at 99 never exceed 100 (parent row lock serialises the count)
	await fresh();
	await admin.query(
		"INSERT INTO crm.property_definition(tenant_id,id,object_type,key,type,label) SELECT $1,gen_random_uuid(),'task','p'||i,'text',$2 FROM generate_series(1,99) i",
		[f.ids.a, L("p")],
	);
	const race = await Promise.allSettled(
		Array.from({ length: 6 }, (_, i) =>
			rt(
				a,
				"INSERT INTO crm.property_definition(tenant_id,id,object_type,key,type,label) VALUES($1,$2,'task',$3,'text',$4)",
				[f.ids.a, randomUUID(), `r${i}`, L("r")],
			),
		),
	);
	assert.equal(race.filter((r) => r.status === "fulfilled").length, 1);
	assert.equal(
		Number(
			(
				await one(
					"SELECT count(*) n FROM crm.property_definition WHERE tenant_id=$1 AND object_type='task' AND NOT is_system AND archived_at IS NULL",
					[f.ids.a],
				)
			).n,
		),
		100,
	);
});

test("P1B-B1 custom/custom_search: defaults, no backfill, shape/size CHECKs validated, never in API output", async () => {
	await fresh();
	// the migration itself never writes a row of an object table
	const { readFile } = await import("node:fs/promises");
	const mig = await readFile(
		new URL("../migrations/010_property_registry.sql", import.meta.url),
		"utf8",
	);
	assert.doesNotMatch(
		mig,
		/\b(UPDATE|INSERT\s+INTO|DELETE\s+FROM)\s+crm\.(contact|lead|deal|task)\b/i,
	);
	assert.doesNotMatch(
		mig,
		/USING\s+gin|jsonb_path_ops|CREATE\s+INDEX[^;]*custom/i,
	);
	for (const t of OBJECTS) {
		const col = await one(
			"SELECT (SELECT data_type||':'||is_nullable||':'||column_default FROM information_schema.columns WHERE table_schema='crm' AND table_name=$1 AND column_name='custom') c,(SELECT data_type||':'||is_nullable||':'||column_default FROM information_schema.columns WHERE table_schema='crm' AND table_name=$1 AND column_name='custom_search') s",
			[t],
		);
		assert.equal(col.c, "jsonb:NO:'{}'::jsonb", t);
		assert.equal(col.s, "text:NO:''::text", t);
		// no backfill: every row written without `properties` still holds the defaults (B3 writes custom only through the API, so
		// the fixture tenants of this test are checked; other tenants of a persistent dev DB may hold B3 test data)
		assert.equal(
			Number(
				(
					await one(
						`SELECT count(*) n FROM crm.${t} WHERE tenant_id=ANY($1::uuid[]) AND (custom<>'{}'::jsonb OR custom_search<>'')`,
						[[f.ids.a, f.ids.b]],
					)
				).n,
			),
			0,
			t,
		);
		// both CHECKs exist and are VALIDATED (not left NOT VALID)
		const cons = (
			await admin.query(
				"SELECT conname,convalidated FROM pg_constraint WHERE conrelid=$1::regclass AND conname IN ($2,$3) ORDER BY conname",
				[`crm.${t}`, `${t}_custom_shape`, `${t}_custom_search_size`],
			)
		).rows;
		assert.equal(cons.length, 2, t);
		assert.ok(
			cons.every((c) => c.convalidated),
			`${t} validated`,
		);
		// no GIN (decision 7) and no index on the new columns
		assert.equal(
			Number(
				(
					await one(
						"SELECT count(*) n FROM pg_indexes WHERE schemaname='crm' AND tablename=$1 AND (indexdef ILIKE '%custom%' OR indexdef ILIKE '% gin %')",
						[t],
					)
				).n,
			),
			0,
			`${t} no GIN/custom index`,
		);
	}
	// CHECKs bite: array / scalar / oversize custom, oversize search text
	const c =
		(
			await admin.query(
				"SELECT tenant_id,id FROM crm.contact WHERE tenant_id=$1 LIMIT 1",
				[f.ids.a],
			)
		).rows[0] ??
		(await (async () => {
			const id = randomUUID();
			await admin.query(
				"INSERT INTO crm.contact(tenant_id,id,display_name) VALUES($1,$2,'c')",
				[f.ids.a, id],
			);
			return { tenant_id: f.ids.a, id };
		})());
	for (const bad of ["[]", "1", '"s"', "null"])
		await assert.rejects(
			admin.query(
				"UPDATE crm.contact SET custom=$3::jsonb WHERE tenant_id=$1 AND id=$2",
				[c.tenant_id, c.id, bad],
			),
			sqlstate("23514"),
			bad,
		);
	await assert.rejects(
		admin.query(
			"UPDATE crm.contact SET custom=jsonb_build_object('k',(SELECT string_agg(md5(i::text),'') FROM generate_series(1,1500) i)) WHERE tenant_id=$1 AND id=$2",
			[c.tenant_id, c.id],
		),
		sqlstate("23514"),
	);
	await assert.rejects(
		admin.query(
			"UPDATE crm.contact SET custom_search=repeat('x',8193) WHERE tenant_id=$1 AND id=$2",
			[c.tenant_id, c.id],
		),
		sqlstate("23514"),
	);
	await admin.query(
		"UPDATE crm.contact SET custom='{\"k\":\"v\"}',custom_search=repeat('x',8192) WHERE tenant_id=$1 AND id=$2",
		[c.tenant_id, c.id],
	);
	await admin.query(
		"UPDATE crm.contact SET custom='{}',custom_search='' WHERE tenant_id=$1 AND id=$2",
		[c.tenant_id, c.id],
	);
});

test("P1B-B1 API output never carries custom/custom_search (get + list, all four objects), and bodies cannot write them", async () => {
	await fresh();
	const ctx = a;
	const req = (path: string, method = "GET", body: Body = {}) => {
		const u = new URL(`/v1/${path}`, "http://localhost");
		return crmRequest(
			ctx,
			method,
			u.pathname,
			u.searchParams,
			body,
			randomUUID(),
			randomUUID(),
		);
	};
	const created = async (path: string, body: Body) =>
		(await req(path, "POST", { command_id: randomUUID(), ...body }))
			.data as pg.QueryResultRow;
	const contact = await created("contacts", { display_name: "B1 Contact" });
	const lead = await created("leads", {
		contact_id: contact.id,
		title: "B1 Lead",
		source_evidence: "synthetic",
	});
	const pipeline = await created("pipelines", {
		name: "B1",
		stages: [{ name: "New" }, { name: "Won", outcome: "won" }],
		transitions: [[0, 1]],
	});
	const stage = ((await req("pipelines")).data as pg.QueryResultRow[]).find(
		(p) => p.id === pipeline.id,
	)?.stages[0].id;
	const deal = await created("deals", {
		contact_id: contact.id,
		pipeline_id: pipeline.id,
		stage_id: stage,
		title: "B1 Deal",
		amount_minor: 100,
	});
	const task = await created("tasks", {
		contact_id: contact.id,
		title: "B1 Task",
		due_at: new Date(Date.now() + 3600e3).toISOString(),
	});
	// put real values into the columns: they must still not be projected
	for (const [t, id] of [
		["contact", contact.id],
		["lead", lead.id],
		["deal", deal.id],
		["task", task.id],
	])
		await admin.query(
			`UPDATE crm.${t} SET custom='{"secret":"leak"}',custom_search='leak' WHERE tenant_id=$1 AND id=$2`,
			[f.ids.a, id],
		);
	const leaks = (v: unknown) => JSON.stringify(v).match(/custom|leak|secret/);
	try {
		for (const [path, id] of [
			["contacts", contact.id],
			["leads", lead.id],
			["deals", deal.id],
			["tasks", task.id],
		]) {
			assert.equal(
				leaks((await req(`${path}/${id}`)).data),
				null,
				`${path} get`,
			);
			const page = await req(path);
			assert.equal(leaks(page), null, `${path} list`);
			assert.equal(
				leaks(await req(`${path}?sort=-created_at&limit=2`)),
				null,
				`${path} list sorted`,
			);
		}
		// request bodies cannot reach the new columns
		await assert.rejects(
			req("contacts", "POST", {
				command_id: randomUUID(),
				display_name: "X",
				custom: { a: 1 },
			}),
			(e) => e instanceof Fault && e.status >= 400 && e.status < 500,
		);
		await assert.rejects(
			req(`contacts/${contact.id}`, "PATCH", {
				command_id: randomUUID(),
				expected_version: contact.version,
				custom_search: "x",
			}),
			(e) => e instanceof Fault && e.status >= 400 && e.status < 500,
		);
		assert.equal(
			(
				await one(
					"SELECT custom::text c FROM crm.contact WHERE tenant_id=$1 AND id=$2",
					[f.ids.a, contact.id],
				)
			).c,
			'{"secret": "leak"}',
		);
	} finally {
		// leave the shared dev DB at the defaults (the no-backfill test asserts every row still holds them)
		for (const t of OBJECTS)
			await admin.query(
				`UPDATE crm.${t} SET custom='{}',custom_search='' WHERE tenant_id=$1`,
				[f.ids.a],
			);
	}
});
