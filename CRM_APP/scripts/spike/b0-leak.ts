// THROWAWAY: RLS x leakproof experiment (admin = superuser bypasses RLS; role = measured under RLS).
import { randomBytes } from "node:crypto";
import pg from "pg";
import { SPIKE_ROLE, adminClient, roleUrl } from "./b0-lib.js";
const admin = adminClient(); await admin.connect();
const out: any = {};
const q = async (s: string, p: unknown[] = []) => (await admin.query(s, p)).rows;
out.leakproof = await q("select proname, proleakproof from pg_proc where proname in ('jsonb_contains','jsonb_object_field_text','jsonb_object_field','texteq','numeric_eq','numeric_le','numeric_lt','textlike','texticlike','array_overlap','arraycontains','jsonb_exists','jsonb_typeof','text_ge','text_le','int4eq','booleq','uuid_eq','timestamptz_lt') order by 1");
const w = JSON.parse((await q("select v from spike.meta where k='whales'"))[0].v).find((x: any) => x.name === "W1M");
const pw = randomBytes(18).toString("hex");
await admin.query(`ALTER ROLE ${SPIKE_ROLE} PASSWORD '${pw}'`);
// leakproof wrapper functions (superuser-created); plpgsql so they are never inlined
await admin.query(`CREATE OR REPLACE FUNCTION spike.jtxt(c jsonb, k text) RETURNS text LANGUAGE plpgsql IMMUTABLE LEAKPROOF PARALLEL SAFE AS $$ BEGIN RETURN CASE WHEN jsonb_typeof(c->k)='string' THEN c->>k END; END $$`);
await admin.query(`CREATE OR REPLACE FUNCTION spike.jnum(c jsonb, k text) RETURNS numeric LANGUAGE plpgsql IMMUTABLE LEAKPROOF PARALLEL SAFE AS $$ BEGIN RETURN CASE WHEN jsonb_typeof(c->k)='number' THEN (c->>k)::numeric END; END $$`);
await admin.query(`GRANT EXECUTE ON FUNCTION spike.jtxt(jsonb,text), spike.jnum(jsonb,numeric) TO ${SPIKE_ROLE}`).catch(() => {});
await admin.query(`GRANT EXECUTE ON FUNCTION spike.jtxt(jsonb,text), spike.jnum(jsonb,text) TO ${SPIKE_ROLE}`);
const tmr = async (c: pg.Client, sql: string, p: unknown[], n = 8, ctx = true) => {
	const ms: number[] = []; let plan = "";
	for (let i = 0; i < n + 1; i++) {
		const t = performance.now();
		await c.query("BEGIN");
		if (ctx) await c.query("SELECT set_config('crm.tenant',$1,true),set_config('crm.token',$2,true),set_config('statement_timeout','20000',true)", [w.id, w.mgrToken]);
		if (i === n) plan = (await c.query(`EXPLAIN (ANALYZE, BUFFERS) ${sql}`, p)).rows.map((r) => r["QUERY PLAN"]).join("\n");
		else await c.query(sql, p);
		await c.query("ROLLBACK");
		if (i < n && i > 0) ms.push(performance.now() - t);
	}
	ms.sort((a, b) => a - b);
	return { p50: Math.round(ms[Math.floor(ms.length / 2)] * 10) / 10, max: Math.round(ms[ms.length - 1]), plan: plan.split("\n").filter((l) => /Scan|Execution|Index Cond|Filter|Recheck/.test(l)).join("\n") };
};
const role = new pg.Client({ connectionString: roleUrl(pw) }); await role.connect();
const cnt = `SELECT count(*)::int n FROM (SELECT 1 FROM crm.contact WHERE tenant_id=$1 AND merged_into_id IS NULL AND custom @> $2::jsonb LIMIT 10001) c`;
out.admin_superuser_count_rare = await tmr(admin, cnt, [w.id, '{"s1":"o019"}'], 5, false);
out.role_rls_count_rare = await tmr(role, cnt, [w.id, '{"s1":"o019"}'], 3);
const lst = `SELECT id,created_at FROM crm.contact WHERE tenant_id=$1 AND merged_into_id IS NULL AND custom @> $2::jsonb ORDER BY created_at DESC,id DESC LIMIT 51`;
out.admin_superuser_list_veryrare = await tmr(admin, lst, [w.id, '{"s5":"o199"}'], 5, false);
out.role_rls_list_veryrare = await tmr(role, lst, [w.id, '{"s5":"o199"}'], 5);
// leakproof wrapper + partial expression index (select equality)
await admin.query(`CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_c_s1_lp_w1m ON crm.contact ((spike.jtxt(custom,'s1')), created_at DESC, id DESC) WHERE tenant_id='${w.id}'`);
await admin.query("ANALYZE crm.contact");
const cnt2 = `SELECT count(*)::int n FROM (SELECT 1 FROM crm.contact WHERE tenant_id=$1 AND merged_into_id IS NULL AND spike.jtxt(custom,'s1')=$2::text LIMIT 10001) c`;
out.role_leakproof_wrapper_count_rare = await tmr(role, cnt2, [w.id, "o019"], 8);
const lst2 = `SELECT id,created_at FROM crm.contact WHERE tenant_id=$1 AND merged_into_id IS NULL AND spike.jtxt(custom,'s1')=$2::text ORDER BY created_at DESC,id DESC LIMIT 51`;
out.role_leakproof_wrapper_list_rare = await tmr(role, lst2, [w.id, "o019"], 8);
console.log(JSON.stringify(out, null, 1));
await role.end(); await admin.end();
