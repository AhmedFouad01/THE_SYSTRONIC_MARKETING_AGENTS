// THROWAWAY (P1b B0 spike). Creates the disposable DB crm_spike_b0 + spike-only role, applies the REAL migrations 001-009
// (scratch copy, real RLS policies / definer functions / P1a indexes), adds the B1-shaped columns, seeds data.
// Usage: tsx --env-file=.env scripts/spike/b0-setup.ts [--whale=1000000] [--w50=50000] [--small=50] [--smallrows=20000] [--deal=500000]
import { randomUUID, randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import pg from "pg";
import { SPIKE_DB, SPIKE_ROLE, adminClient, adminUrl } from "./b0-lib.js";

const arg = (k: string, d: number) => {
	const a = process.argv.find((x) => x.startsWith(`--${k}=`));
	return a ? Number(a.split("=")[1]) : d;
};
const WHALE = arg("whale", 1_000_000);
const W50 = arg("w50", 50_000);
const SMALL = arg("small", 50);
const SMALLROWS = arg("smallrows", 20_000);
const DEAL = arg("deal", 500_000);
const DEAL50 = arg("deal50", 50_000);
const BATCH = 50_000;
const t0 = Date.now();
const log = (m: string) => console.log(`[${((Date.now() - t0) / 1000).toFixed(0)}s] ${m}`);

// ---- 1. database + role (spike-only names) ----
const root = new pg.Client({ connectionString: adminUrl("postgres") });
await root.connect();
await root.query(`DROP DATABASE IF EXISTS ${SPIKE_DB} WITH (FORCE)`);
await root.query(`DROP ROLE IF EXISTS ${SPIKE_ROLE}`);
await root.query(`CREATE DATABASE ${SPIKE_DB}`);
const pw = randomBytes(18).toString("hex");
await root.query(
	`CREATE ROLE ${SPIKE_ROLE} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS PASSWORD '${pw}'`,
);
await root.query(`GRANT crm_runtime TO ${SPIKE_ROLE} WITH INHERIT TRUE`);
await root.end();
log("db + role created");

const db = adminClient();
await db.connect();
// ---- 2. real migrations 001-009 (scratch copy; no ALTER ROLE crm_runtime) ----
await db.query("BEGIN");
for (const f of [
	"001_foundation", "002_crm_core", "003_object_integrity", "004_relationship_authority", "005_protected_key_configuration",
	"006_journey_reporting", "007_collect_event_canonical_id", "008_list_query_timestamps_scope", "009_arabic_search",
])
	await db.query(await readFile(new URL(`../../migrations/${f}.sql`, import.meta.url), "utf8"));
await db.query("COMMIT");
log("migrations 001-009 applied in spike DB");

// ---- 3. B1-shaped scratch columns (what 010 would add) ----
await db.query(`
ALTER TABLE crm.contact ADD COLUMN custom jsonb NOT NULL DEFAULT '{}', ADD COLUMN custom_search text NOT NULL DEFAULT '';
ALTER TABLE crm.deal    ADD COLUMN custom jsonb NOT NULL DEFAULT '{}', ADD COLUMN custom_search text NOT NULL DEFAULT '';
ALTER TABLE crm.contact ADD CONSTRAINT contact_custom_ck CHECK (jsonb_typeof(custom)='object' AND pg_column_size(custom)<=32768) NOT VALID;
ALTER TABLE crm.deal    ADD CONSTRAINT deal_custom_ck    CHECK (jsonb_typeof(custom)='object' AND pg_column_size(custom)<=32768) NOT VALID;
CREATE SCHEMA spike;
CREATE TABLE spike.meta(k text PRIMARY KEY, v text NOT NULL);
-- Scratch registry table for the schema-change / schema-GET rows (RLS policy text copied from 008).
CREATE TABLE spike.prop_def(tenant_id uuid NOT NULL, id uuid NOT NULL, object text NOT NULL, key text NOT NULL, type text NOT NULL,
  label_en text, label_ar text, flags jsonb NOT NULL DEFAULT '{}', options jsonb NOT NULL DEFAULT '[]', version int NOT NULL DEFAULT 1, archived boolean NOT NULL DEFAULT false,
  PRIMARY KEY(tenant_id,id), UNIQUE(tenant_id,object,key));
CREATE TABLE spike.schema_rev(tenant_id uuid NOT NULL, object text NOT NULL, rev int NOT NULL DEFAULT 1, PRIMARY KEY(tenant_id,object));
ALTER TABLE spike.prop_def ENABLE ROW LEVEL SECURITY; ALTER TABLE spike.prop_def FORCE ROW LEVEL SECURITY;
ALTER TABLE spike.schema_rev ENABLE ROW LEVEL SECURITY; ALTER TABLE spike.schema_rev FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_boundary ON spike.prop_def USING (tenant_id=(SELECT crm.context_tenant_if_allowed())) WITH CHECK (tenant_id=(SELECT crm.context_tenant_if_allowed()));
CREATE POLICY tenant_boundary ON spike.schema_rev USING (tenant_id=(SELECT crm.context_tenant_if_allowed())) WITH CHECK (tenant_id=(SELECT crm.context_tenant_if_allowed()));
GRANT USAGE ON SCHEMA spike TO ${SPIKE_ROLE};
GRANT SELECT,INSERT,UPDATE ON spike.prop_def, spike.schema_rev TO ${SPIKE_ROLE};
`);

// ---- 4. data generators (scratch; volatile random()) ----
await db.query(`
CREATE FUNCTION spike.zipf(n int, p float8 DEFAULT 2.0) RETURNS int LANGUAGE sql VOLATILE AS $$ SELECT 1+floor(n*power(random(),p))::int $$;
CREATE FUNCTION spike.words(n int) RETURNS text LANGUAGE plpgsql VOLATILE AS $$
DECLARE
 ar text[] := ARRAY['أحمد','محمد','إبراهيم','آمنة','فاطمة','مصطفى','عائشة','يوسف','خالد','علي','حسن','حسين','محمود','عمر','سارة','منى','هدى','ليلى','نور','كريم','طارق','سمير','رانيا','دعاء','إيمان','أمل','ياسمين','شركة','مؤسسة','مكتب','مصر','القاهرة','الإسكندرية','الجيزة','للتجارة','والتوريدات','الهندسية','العقارية','للاستشارات','الطبية','التعليمية','للسياحة','الحديثة','المتحدة','الدولية','الذهبية','النيل','الأهرام','الفجر','المستقبل','التميز','الصفوة','النخبة','الرواد','البركة','الأمل','السلام','الوفاء','الإبداع'];
 en text[] := ARRAY['Ahmed','Mohamed','Ibrahim','Amina','Fatma','Mostafa','Aisha','Youssef','Khaled','Ali','Hassan','Hussein','Mahmoud','Omar','Sara','Mona','Hoda','Layla','Nour','Karim','Tarek','Samir','Rania','Doaa','Iman','Amal','Yasmin','Company','Trading','Office','Egypt','Cairo','Alexandria','Giza','Supplies','Engineering','Real','Estate','Consulting','Medical','Education','Travel','Modern','United','International','Golden','Nile','Pyramids','Dawn','Future','Excellence','Elite','Pioneers','Baraka','Hope','Peace','Loyalty','Creativity','Group'];
 r float8 := random(); mode int; out text := ''; i int; w text;
BEGIN
 mode := CASE WHEN r<0.45 THEN 1 WHEN r<0.90 THEN 2 ELSE 3 END;  -- 1 Arabic, 2 English, 3 mixed
 FOR i IN 1..n LOOP
  IF mode=1 OR (mode=3 AND random()<0.5) THEN w := ar[spike.zipf(array_length(ar,1),1.6)]; ELSE w := en[spike.zipf(array_length(en,1),1.6)]; END IF;
  out := out || CASE WHEN i>1 THEN ' ' ELSE '' END || w;
 END LOOP;
 RETURN out;
END $$;
CREATE FUNCTION spike.cname() RETURNS text LANGUAGE sql VOLATILE AS $$
 SELECT spike.words(2+(random()<0.3)::int) || CASE WHEN random()<0.1 THEN ' '||substr(md5(random()::text),1,6) ELSE '' END $$;
-- 20 custom properties, 60% fill. t1..t5 text; s1..s5 select; n1..n3 number; d1..d3 date; c1,c2 checkbox; m1,m2 multi.
-- Searchable text properties (feed custom_search): t1,t3,t5. t2,t4 are long free-text (not searchable) -- assumption recorded in the doc.
CREATE FUNCTION spike.mk_custom(seed int, OUT custom jsonb, OUT srch text) LANGUAGE plpgsql VOLATILE AS $$
DECLARE t1 text; t2 text; t3 text; t4 text; t5 text; f float8 := 0.6;
BEGIN
 t1 := CASE WHEN random()<f THEN spike.words(3) END;
 t2 := CASE WHEN random()<f THEN spike.words(220) END;
 t3 := CASE WHEN random()<f THEN spike.words(25) END;
 t4 := CASE WHEN random()<f THEN spike.words(130) END;
 t5 := CASE WHEN random()<f THEN spike.words(40) END;
 custom := jsonb_strip_nulls(jsonb_build_object(
  't1',t1,'t2',t2,'t3',t3,'t4',t4,'t5',t5,
  's1',CASE WHEN random()<f THEN 'o'||lpad(spike.zipf(20,2.5)::text,3,'0') END,
  's2',CASE WHEN random()<f THEN 'o'||lpad(spike.zipf(20,2.5)::text,3,'0') END,
  's3',CASE WHEN random()<f THEN 'o'||lpad(spike.zipf(12,1.5)::text,3,'0') END,
  's4',CASE WHEN random()<f THEN 'o'||lpad(spike.zipf(12,1.5)::text,3,'0') END,
  's5',CASE WHEN random()<f THEN 'o'||lpad(spike.zipf(200,2.0)::text,3,'0') END,
  'n1',CASE WHEN random()<f THEN floor(power(10,random()*6))::int END,
  'n2',CASE WHEN random()<f THEN round((random()*100000)::numeric,2) END,
  'n3',CASE WHEN random()<f THEN 1+floor(random()*100)::int END,
  'd1',CASE WHEN random()<f THEN to_char(date '2022-01-01'+floor(random()*1826)::int,'YYYY-MM-DD') END,
  'd2',CASE WHEN random()<f THEN to_char(date '2026-12-31'-floor(power(random(),3)*1826)::int,'YYYY-MM-DD') END,
  'd3',CASE WHEN random()<f THEN to_char(timestamptz '2022-01-01 00:00:00+00'+random()*interval '1826 days','YYYY-MM-DD"T"HH24:MI:SS"Z"') END,
  'c1',CASE WHEN random()<f THEN (random()<0.3) END,
  'c2',CASE WHEN random()<f THEN (random()<0.05) END,
  'm1',CASE WHEN random()<f THEN (SELECT jsonb_agg(DISTINCT 'o'||lpad(x::text,3,'0')) FROM (SELECT spike.zipf(12,1.5) x FROM generate_series(1,1+floor(random()*3)::int)) q) END,
  'm2',CASE WHEN random()<f THEN (SELECT jsonb_agg(DISTINCT 'o'||lpad(x::text,3,'0')) FROM (SELECT spike.zipf(12,1.5) x FROM generate_series(1,1+floor(random()*3)::int)) q) END
 ));
 srch := crm.normalize_search(concat_ws(' ',t1,t3,t5));
END $$;
`);

// ---- 5. tenants, principals, sessions ----
type Whale = { id: string; name: string; manager: string; rep: string; owners: string[]; mgrToken: string; repToken: string };
const mkWhale = (name: string): Whale => ({
	id: randomUUID(), name, manager: randomUUID(), rep: randomUUID(),
	owners: Array.from({ length: 20 }, () => randomUUID()), mgrToken: `spike-mgr-${name}-${randomBytes(6).toString("hex")}`, repToken: `spike-rep-${name}-${randomBytes(6).toString("hex")}`,
});
const whales = [mkWhale("W50"), mkWhale("W1M")];
whales[0].owners[0] = whales[0].rep; whales[1].owners[0] = whales[1].rep; // the rep owns ~5% of the whale's rows
const smallOwner = randomUUID();
const smalls = Array.from({ length: SMALL }, () => randomUUID());
await db.query("INSERT INTO crm.principal(id,name) VALUES($1,'small-owner')", [smallOwner]);
for (const w of whales) {
	for (const p of [w.manager, ...w.owners]) await db.query("INSERT INTO crm.principal(id,name) VALUES($1,$2) ON CONFLICT DO NOTHING", [p, `p-${p.slice(0, 6)}`]);
	await db.query("INSERT INTO crm.tenant(id,name) VALUES($1,$2)", [w.id, w.name]);
	await db.query("INSERT INTO crm.membership(tenant_id,id,principal_id,role) VALUES($1,$2,$3,'manager'),($1,$4,$5,'rep')", [w.id, randomUUID(), w.manager, randomUUID(), w.rep]);
	for (const [tok, pr] of [[w.mgrToken, w.manager], [w.repToken, w.rep]])
		await db.query("INSERT INTO crm.session(token_hash,principal_id,expires_at,mfa_verified) VALUES(encode(public.digest($1,'sha256'),'hex'),$2,now()+interval '3 days',true)", [tok, pr]);
	const pipe = randomUUID();
	await db.query("INSERT INTO crm.pipeline(tenant_id,id,name) VALUES($1,$2,'p')", [w.id, pipe]);
	for (let s = 0; s < 6; s++) await db.query("INSERT INTO crm.stage(tenant_id,id,pipeline_id,name,position) VALUES($1,$2,$3,$4,$5)", [w.id, randomUUID(), pipe, `s${s}`, s]);
}
for (const t of smalls) await db.query("INSERT INTO crm.tenant(id,name) VALUES($1,'small')", [t]);
await db.query("INSERT INTO spike.meta VALUES('whales',$1)", [JSON.stringify(whales)]);
log("tenants/principals/sessions/pipelines created");

// ---- 6. contacts (parallel batches; FK/trigger checks skipped via replica role for the bulk seed only) ----
const jobs: { tenant: string; owners: string[]; a: number; b: number }[] = [];
const plan = (tenant: string, owners: string[], n: number) => { for (let a = 1; a <= n; a += BATCH) jobs.push({ tenant, owners, a, b: Math.min(n, a + BATCH - 1) }); };
plan(whales[0].id, whales[0].owners, W50);
plan(whales[1].id, whales[1].owners, WHALE);
for (const t of smalls) plan(t, [smallOwner], SMALLROWS);
let next = 0, done = 0;
async function worker() {
	const c = adminClient(); await c.connect(); await c.query("SET session_replication_role=replica; SET synchronous_commit=off");
	for (;;) {
		const j = jobs[next++]; if (!j) break;
		const own = `ARRAY[${j.owners.map((o) => `'${o}'::uuid`).join(",")}]`;
		await c.query(`INSERT INTO crm.contact(tenant_id,id,display_name,owner_id,version,source,created_at,updated_at,custom,custom_search)
		 SELECT '${j.tenant}',gen_random_uuid(),spike.cname()||repeat('',ts.i*0),(${own})[1+(ts.i::bigint*7919)%${j.owners.length}],0,
		  (ARRAY['manual','import','web','referral','ads'])[spike.zipf(5,2.0)+ts.i*0],
		  ts.t,ts.t,m.custom,m.srch
		 FROM (SELECT i, now()-random()*interval '730 days'+i*interval '0 s' AS t FROM generate_series(${j.a},${j.b}) i) ts
		 CROSS JOIN LATERAL spike.mk_custom(ts.i) m`);
		if (++done % 10 === 0) log(`contact batches ${done}/${jobs.length}`);
	}
	await c.end();
}
await Promise.all(Array.from({ length: 8 }, worker));
log("contacts seeded");

// ---- 7. deals for the whales (one deal per contact for the first N contacts) ----
for (const [w, n] of [[whales[0], DEAL50], [whales[1], DEAL]] as const) {
	await db.query("SET session_replication_role=replica");
	await db.query(`CREATE TABLE spike.cid_${w.name} AS SELECT row_number() OVER () rn,id FROM (SELECT id FROM crm.contact WHERE tenant_id='${w.id}' LIMIT ${n}) q`);
	await db.query(`CREATE UNIQUE INDEX ON spike.cid_${w.name}(rn)`);
	const pipe = (await db.query("SELECT pipeline_id,array_agg(id ORDER BY position) st FROM crm.stage WHERE tenant_id=$1 GROUP BY 1", [w.id])).rows[0];
	for (let a = 1; a <= n; a += 100_000) {
		await db.query(`INSERT INTO crm.deal(tenant_id,id,contact_id,pipeline_id,stage_id,owner_id,version,title,amount_minor,currency,created_at,updated_at,custom,custom_search)
		 SELECT '${w.id}',gen_random_uuid(),c.id,'${pipe.pipeline_id}',(ARRAY[${pipe.st.map((s: string) => `'${s}'::uuid`).join(",")}])[spike.zipf(6,1.5)+ts.i*0],
		  (ARRAY[${w.owners.map((o) => `'${o}'::uuid`).join(",")}])[1+(ts.i::bigint*7919)%20],0,spike.words(3),(random()*10000000)::bigint,'EGP',ts.t,ts.t,m.custom,m.srch
		 FROM (SELECT i, now()-random()*interval '730 days'+i*interval '0 s' AS t FROM generate_series(${a},${Math.min(n, a + 99_999)}) i) ts JOIN spike.cid_${w.name} c ON c.rn=ts.i
		 CROSS JOIN LATERAL spike.mk_custom(ts.i) m`);
	}
	log(`deals seeded for ${w.name}: ${n}`);
}
await db.query("RESET session_replication_role");

// ---- 8. wide variant (100 properties, ~8 KB) in a scratch table, 50k rows ----
await db.query(`CREATE TABLE spike.contact_wide(tenant_id uuid NOT NULL, id uuid NOT NULL DEFAULT gen_random_uuid(), created_at timestamptz NOT NULL DEFAULT now(), custom jsonb NOT NULL, PRIMARY KEY(tenant_id,id))`);
await db.query(`INSERT INTO spike.contact_wide(tenant_id,custom)
 SELECT '${whales[0].id}', (SELECT jsonb_object_agg('p'||k,
   CASE k%5 WHEN 0 THEN to_jsonb(spike.words(150)||repeat('',i*0)) WHEN 1 THEN to_jsonb('o'||lpad(spike.zipf(20,2.5)::text,3,'0')) WHEN 2 THEN to_jsonb(floor(random()*100000)::int) WHEN 3 THEN to_jsonb(to_char(date '2022-01-01'+floor(random()*1826)::int,'YYYY-MM-DD')) ELSE to_jsonb(random()<0.3) END)
   FROM generate_series(1,100) k WHERE random()<0.6 AND i>0)
 FROM generate_series(1,50000) i`);
log("wide variant seeded");

// ---- 9. stats ----
await db.query("RESET ALL");
for (const t of ["crm.contact", "crm.deal", "spike.contact_wide"]) await db.query(`VACUUM (ANALYZE) ${t}`);
await db.query("CHECKPOINT");
const sz = await db.query(`SELECT relname, reltuples::bigint rows, pg_size_pretty(pg_table_size(oid)) tbl, pg_size_pretty(pg_indexes_size(oid)) idx FROM pg_class WHERE oid IN ('crm.contact'::regclass,'crm.deal'::regclass,'spike.contact_wide'::regclass)`);
console.table(sz.rows);
log("DONE setup");
await db.end();
