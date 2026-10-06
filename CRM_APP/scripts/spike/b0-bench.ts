// THROWAWAY (P1b B0 spike). Not promoted, not in `npm test`. Measures the exact SQL shapes the B4 compiler would emit
// (hand-written) against the disposable DB crm_spike_b0, as the NOSUPERUSER/NOBYPASSRLS spike role, under FORCE RLS.
// Usage: tsx --env-file=.env scripts/spike/b0-bench.ts --phase=A|B|C|D|E|F|G [--tiers=W50,W1M] [--n=100]
// Results: audits/2026-10-07/spike-b0/results.json (merged per phase) and plans_<phase>.txt. Prints no connection data.
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, appendFile } from "node:fs/promises";
import os from "node:os";
import pg from "pg";
import { SPIKE_ROLE, adminClient, median, pct, roleUrl } from "./b0-lib.js";

const arg = (k: string, d: string) => process.argv.find((x) => x.startsWith(`--${k}=`))?.split("=")[1] ?? d;
const PHASE = arg("phase", "A");
const TIERS = arg("tiers", "W50,W1M").split(",");
const NRUN = Number(arg("n", "100"));
const ROUNDS = 3;
const OUT = new URL("../../audits/2026-10-07/spike-b0/", import.meta.url);
await mkdir(OUT, { recursive: true });
const RES = new URL("results.json", OUT);
const PLANS = new URL(`plans_${PHASE}.txt`, OUT);
const log = (m: string) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${m}`);

// ---------- setup: spike role password (spike-only), admin handle, metadata ----------
const admin = adminClient();
await admin.connect();
const pw = randomBytes(18).toString("hex");
await admin.query(`ALTER ROLE ${SPIKE_ROLE} PASSWORD '${pw}'`); // spike-only role
const whales: Record<string, { id: string; name: string; manager: string; rep: string; owners: string[]; mgrToken: string; repToken: string }> = {};
for (const w of JSON.parse((await admin.query("SELECT v FROM spike.meta WHERE k='whales'")).rows[0].v)) whales[w.name] = w;
const aq = async (sql: string, p: unknown[] = []) => (await admin.query(sql, p)).rows;

async function results(): Promise<Record<string, any>> {
	try { return JSON.parse(await readFile(RES, "utf8")); } catch { return {}; }
}
async function save(key: string, val: unknown) {
	const r = await results();
	r[`${PHASE}:${key}`] = val;
	await writeFile(RES, JSON.stringify(r, null, 1));
}
const connect = async () => { const c = new pg.Client({ connectionString: roleUrl(pw) }); await c.connect(); return c; };

// ---------- request envelope (same statements as src/db.ts transaction + src/list.ts) ----------
type Q = { sql: string; params?: unknown[] };
let PRE: string[] = [];
async function preamble(c: pg.Client, w: (typeof whales)[string], who: "mgr" | "rep") {
	await c.query("BEGIN");
	await c.query("SELECT set_config('crm.tenant',$1,true),set_config('crm.token',$2,true)", [w.id, who === "mgr" ? w.mgrToken : w.repToken]);
	const { rows: [a] } = await c.query("SELECT crm.actor() actor,crm.tenant_access($1) allowed", [w.id]);
	if (!a.actor || !a.allowed) throw new Error("auth failed in spike harness");
	await c.query("SELECT set_config('statement_timeout','5000',true)");
	const { rows: [s] } = await c.query("SELECT mode,actor FROM crm.object_scope('crm.read')");
	for (const x of PRE) await c.query(x); // planner diagnostics only (SET LOCAL); empty in normal runs
	return s as { mode: string; actor: string };
}
async function oneRequest(c: pg.Client, w: (typeof whales)[string], who: "mgr" | "rep", qs: Q[]) {
	const t = performance.now();
	let rows = 0;
	try {
		await preamble(c, w, who);
		for (const q of qs) { const r = await c.query(q.sql, q.params ?? []); rows = r.rowCount ?? 0; }
		await c.query("COMMIT");
	} catch (e) {
		await c.query("ROLLBACK").catch(() => {});
		const ee = e as { code?: string; message?: string };
		if (!(globalThis as any).__shown) { (globalThis as any).__shown = 1; console.log("first error:", ee.code, (ee.message ?? "").slice(0, 160)); }
		return { ms: performance.now() - t, err: ee.code ?? String(e), rows };
	}
	return { ms: performance.now() - t, err: null as string | null, rows };
}

type Stat = { p50: number; p95: number; max: number };
const stat = (a: number[]): Stat => ({ p50: pct(a, 50), p95: pct(a, 95), max: Math.max(...a) });
const r1 = (n: number) => Math.round(n * 10) / 10;
const rows: any[] = [];
async function measure(name: string, tier: string, gen: (i: number) => Q[], o: { who?: "mgr" | "rep"; n?: number; explain?: boolean; note?: string } = {}) {
	const w = whales[tier];
	const c = await connect();
	const who = o.who ?? "mgr";
	// probe cost
	const probe: number[] = [];
	let cold = -1, errs = 0, timeouts = 0, lastRows = 0;
	for (let i = 0; i < 2; i++) { const r = await oneRequest(c, w, who, gen(i)); if (i === 0) cold = r.ms; probe.push(r.ms); if (r.err) { errs++; if (r.err === "57014") timeouts++; } lastRows = r.rows; }
	const avg = (probe[0] + probe[1]) / 2;
	let n = o.n ?? NRUN;
	if (avg > 3000) n = Math.min(n, 5); else if (avg > 1000) n = Math.min(n, 15); else if (avg > 300) n = Math.min(n, 40);
	const rounds: Stat[] = [];
	for (let r = 0; r < ROUNDS; r++) {
		const ms: number[] = [];
		for (let i = 0; i < n; i++) {
			const x = await oneRequest(c, w, who, gen(r * n + i + 2));
			ms.push(x.ms); lastRows = x.rows;
			if (x.err) { errs++; if (x.err === "57014") timeouts++; }
		}
		rounds.push(stat(ms));
	}
	if (o.explain !== false) {
		try {
			let plan = "";
			for (let k = 0; k < 2; k++) {
				await preamble(c, w, who);
				const q = gen(7777 + k)[gen(0).length - 1];
				plan = (await c.query(`EXPLAIN (ANALYZE, BUFFERS) ${q.sql}`, q.params ?? [])).rows.map((x) => x["QUERY PLAN"]).join("\n");
				await c.query("ROLLBACK");
			}
			const q = gen(7777)[gen(0).length - 1];
			await appendFile(PLANS, `\n===== ${tier} ${name} (phase ${PHASE}) =====\n${q.sql}\nparams: ${JSON.stringify(q.params ?? []).slice(0, 300)}\n${plan}\n`);
		} catch (e) { await c.query("ROLLBACK").catch(() => {}); await appendFile(PLANS, `\n===== ${tier} ${name}: EXPLAIN failed: ${(e as Error).message}\n`); }
	}
	await c.end();
	const out = { tier, name, runs: n * ROUNDS, rounds: rounds.map((s) => ({ p50: r1(s.p50), p95: r1(s.p95), max: r1(s.max) })), p50: r1(median(rounds.map((s) => s.p50))), p95: r1(median(rounds.map((s) => s.p95))), max: r1(Math.max(...rounds.map((s) => s.max))), cold: r1(cold), errors: errs, timeouts, rows: lastRows, note: o.note };
	await save(`${tier}:${name}`, out);
	log(`${tier} ${name}: p50=${out.p50} p95=${out.p95} max=${out.max} n=${out.runs} cold=${out.cold} err=${errs}/${timeouts}to rows=${lastRows}`);
	rows.push(out);
	return out;
}

// ---------- sampled values (admin) ----------
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const TS = `to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`;
type Samp = { cursors: { ts: string; id: string }[]; deep: { ts: string; id: string }[]; ids: string[]; tokens: string[]; dcursors: { ts: string; id: string }[]; ddeep: { ts: string; id: string }[]; dids: string[]; nCount: number; dCount: number };
const samples: Record<string, Samp> = {};
async function sample(tier: string) {
	const w = whales[tier];
	const total = Number((await aq("SELECT count(*) n FROM crm.contact WHERE tenant_id=$1", [w.id]))[0].n);
	const dtotal = Number((await aq("SELECT count(*) n FROM crm.deal WHERE tenant_id=$1", [w.id]))[0].n);
	const cur = async (t: string) => aq(`SELECT ${TS} ts,id FROM crm.${t} WHERE tenant_id=$1 ORDER BY random() LIMIT 400`, [w.id]);
	const deepAt = async (t: string, n: number) => {
		const out = [];
		for (const f of [0.46, 0.48, 0.5, 0.52, 0.54]) out.push((await aq(`SELECT ${TS} ts,id FROM crm.${t} WHERE tenant_id=$1 ORDER BY created_at DESC,id DESC OFFSET $2 LIMIT 1`, [w.id, Math.floor(n * f)]))[0]);
		return out;
	};
	samples[tier] = {
		cursors: await cur("contact"), deep: await deepAt("contact", total), dcursors: await cur("deal"), ddeep: await deepAt("deal", dtotal),
		ids: (await aq("SELECT id FROM crm.contact WHERE tenant_id=$1 ORDER BY random() LIMIT 6000", [w.id])).map((r) => r.id),
		dids: (await aq("SELECT id FROM crm.deal WHERE tenant_id=$1 ORDER BY random() LIMIT 1000", [w.id])).map((r) => r.id),
		tokens: (await aq("SELECT substring(display_name from ' ([0-9a-f]{6})$') t FROM crm.contact WHERE tenant_id=$1 AND display_name ~ ' [0-9a-f]{6}$' ORDER BY random() LIMIT 400", [w.id])).map((r) => r.t),
		nCount: total, dCount: dtotal,
	};
}

// ---------- SQL builders (shapes the B4 compiler would emit) ----------
const PCON = "tenant_id,id,display_name,owner_id,version,source,merged_into_id,created_at,updated_at";
const PDEAL = "tenant_id,id,contact_id,pipeline_id,stage_id,owner_id,version,lead_id,title,amount_minor,currency,created_at,updated_at";
const PROJ = (k: string) => (k === "contact" ? PCON : PDEAL);
const PROPS = "custom->'s1' AS p_s1,custom->'n1' AS p_n1,custom->'t1' AS p_t1"; // props= projection of 3 requested keys only
const KEY0 = `${TS} AS _k0`;
// A/B/B2/B3 use raw casts (non-leakproof under RLS); C and later use LEAKPROOF wrappers (see leakproof_experiment.json).
let LP = false;
const num = (k: string) => (LP ? `spike.jnum8(custom,'${k}')` : `(CASE WHEN jsonb_typeof(custom->'${k}')='number' THEN (custom->>'${k}')::numeric END)`);
const str = (k: string) => (LP ? `spike.jtxt(custom,'${k}')` : `(CASE WHEN jsonb_typeof(custom->'${k}')='string' THEN custom->>'${k}' END)`);
const bool = (k: string) => `spike.jbool(custom,'${k}')`;
const O = (i: number) => `o${String(i).padStart(3, "0")}`;
const base = (k: string, w: (typeof whales)[string], scope?: { actor: string }) => {
	const params: unknown[] = [w.id];
	let where = "tenant_id=$1" + (k === "contact" ? " AND merged_into_id IS NULL" : "");
	if (scope) { params.push(scope.actor); where += ` AND owner_id=$${params.length}::uuid`; }
	return { params, where };
};
// keyset on created_at DESC: the P1a OR-chain (as emitted today) and the row-value form
const orChain = (params: unknown[], cur: { ts: string; id: string }) => {
	params.push(cur.ts, cur.id);
	return ` AND ((created_at < $${params.length - 1}::timestamptz) OR (created_at = $${params.length - 1}::timestamptz AND id < $${params.length}::uuid))`;
};
const rowVal = (params: unknown[], cur: { ts: string; id: string }) => {
	params.push(cur.ts, cur.id);
	return ` AND (created_at,id) < ($${params.length - 1}::timestamptz,$${params.length}::uuid)`;
};
const ORDER = "ORDER BY created_at DESC,id DESC LIMIT 51";
const listSql = (k: string, where: string, tail = ORDER, extra = "") => `SELECT ${PROJ(k)},${KEY0}${extra} FROM crm.${k} WHERE ${where} ${tail}`;
const like = (s: string) => s.replace(/[\\%_]/g, "\\$&");
const qCond = (params: unknown[], q: string, mode: "contains" | "prefix", cols: string[]) => {
	params.push(mode === "contains" ? `%${like(q)}%` : `${like(q)}%`);
	const pat = `crm.normalize_search($${params.length}::text)`;
	return ` AND (${cols.map((c) => `${c} LIKE ${pat} ESCAPE '\\'`).join(" OR ")})`;
};
const OPTS20 = Array.from({ length: 20 }, (_, i) => O(i + 1));
const OPTS12 = Array.from({ length: 12 }, (_, i) => O(i + 1));
const js = (o: unknown) => JSON.stringify(o);

async function indexReport(tag: string) {
	const idx = await aq(`SELECT c.relname, pg_relation_size(c.oid) bytes, pg_size_pretty(pg_relation_size(c.oid)) pretty, t.relname tbl FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid JOIN pg_class t ON t.oid=i.indrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname='crm' AND t.relname IN ('contact','deal') ORDER BY t.relname,c.relname`);
	const heap = await aq(`SELECT relname, pg_relation_size(oid) heap, pg_total_relation_size(oid)-pg_relation_size(oid)-pg_indexes_size(oid) toast, pg_indexes_size(oid) idx, n_live FROM (SELECT c.*, 0 n_live FROM pg_class c WHERE oid IN ('crm.contact'::regclass,'crm.deal'::regclass)) q`);
	await save(`indexes:${tag}`, { idx, heap });
	log(`index report ${tag}: ${idx.length} indexes; heap ${JSON.stringify(heap.map((h) => [h.relname, h.heap, h.toast, h.idx]))}`);
}
async function timed<T>(name: string, fn: () => Promise<T>) { const t = performance.now(); const v = await fn(); const ms = performance.now() - t; await save(`timing:${name}`, { ms: Math.round(ms) }); log(`${name}: ${(ms / 1000).toFixed(1)} s`); return v; }

// ---------- environment record ----------
async function envRecord() {
	const s = await aq("select name,setting,unit from pg_settings where name in ('shared_buffers','work_mem','maintenance_work_mem','effective_cache_size','max_parallel_workers_per_gather','random_page_cost','jit','synchronous_commit','max_wal_size','gin_pending_list_limit','fsync')");
	const me = await aq("select current_user cu, rolsuper, rolbypassrls from pg_roles where rolname=current_user");
	const c = await connect(); const who = (await c.query("select current_user cu, (select rolsuper from pg_roles where rolname=current_user) su, (select rolbypassrls from pg_roles where rolname=current_user) byp, (select relforcerowsecurity from pg_class where oid='crm.contact'::regclass) force_rls")).rows[0]; await c.end();
	const act = await aq("select count(*) n from pg_stat_activity where datname is not null and datname<>'crm_spike_b0'");
	const ver = (await aq("select version()"))[0].version;
	const coll = await aq("select datcollate, datctype from pg_database where datname='crm_spike_b0'");
	await save("env", { ver, cpus: os.cpus().length, cpu: os.cpus()[0].model, ram_gb: Math.round(os.totalmem() / 2 ** 30), settings: s, measured_as: who, other_db_sessions: act[0].n, collation: coll[0], node: process.version, date: new Date().toISOString() });
	log(`env: measured as ${JSON.stringify(who)}; other-db sessions=${act[0].n}`);
}

// ======================= PHASES =======================
async function listSuite(tier: string, phase: string) {
	const w = whales[tier], S = samples[tier];
	const contact = (name: string, g: (i: number) => { sql: string; params: unknown[] }, o: any = {}) => measure(name, tier, (i) => [g(i)], o);
	// --- L1 default list
	await contact("L1_default_first", () => { const b = base("contact", w); return { sql: listSql("contact", b.where), params: b.params }; });
	await contact("L1_default_cursor_orchain", (i) => { const b = base("contact", w); const wh = b.where + orChain(b.params, S.cursors[i % S.cursors.length]); return { sql: listSql("contact", wh), params: b.params }; });
	await contact("L1_default_cursor_deep_orchain", (i) => { const b = base("contact", w); const wh = b.where + orChain(b.params, S.deep[i % S.deep.length]); return { sql: listSql("contact", wh), params: b.params }; });
	await contact("L1_default_cursor_deep_rowvalue", (i) => { const b = base("contact", w); const wh = b.where + rowVal(b.params, S.deep[i % S.deep.length]); return { sql: listSql("contact", wh), params: b.params }; });
	// --- L2 system filters + rep scope
	await contact("L2_contact_owner_source", (i) => { const b = base("contact", w); b.params.push(w.owners[i % 20], pick(["manual", "import", "web", "referral", "ads"])); return { sql: listSql("contact", `${b.where} AND owner_id=$2::uuid AND source=$3::text`), params: b.params }; });
	await contact("L2_rep_scope_default", () => { const b = base("contact", w, { actor: w.rep }); return { sql: listSql("contact", b.where), params: b.params }; }, { who: "rep" });
	await measure("L2_deal_stage_owner", tier, (i) => { const b = base("deal", w); b.params.push(samples[tier] && deals[tier].stages[i % 6], w.owners[i % 20]); return [{ sql: listSql("deal", `${b.where} AND stage_id=$2::uuid AND owner_id=$3::uuid`), params: b.params }]; });
	await measure("L1_deal_default_first", tier, () => { const b = base("deal", w); return [{ sql: listSql("deal", b.where), params: b.params }]; });
	await measure("L2_deal_rep_scope", tier, () => { const b = base("deal", w, { actor: w.rep }); return [{ sql: listSql("deal", b.where), params: b.params }]; }, { who: "rep" });
	// --- L7 totals (capped 10001)
	const tot = (k: string, wh: string, p: unknown[]) => ({ sql: `SELECT count(*)::int n FROM (SELECT 1 FROM crm.${k} WHERE ${wh} LIMIT 10001) c`, params: p });
	await contact("L7_total_unfiltered", () => { const b = base("contact", w); return tot("contact", b.where, b.params); });
	return phase;
}
const deals: Record<string, { stages: string[] }> = {};

// custom filters (GIN-shaped containment) -- contact + deal
async function customFilters(tier: string) {
	const w = whales[tier];
	const sel = (k: string, name: string, val: (i: number) => string, key = "s1", sort = ORDER) =>
		measure(name, tier, (i) => { const b = base(k, w); b.params.push(js({ [key]: val(i) })); return [{ sql: listSql(k, `${b.where} AND custom @> $${b.params.length}::jsonb`, sort, `,${PROPS}`), params: b.params }]; });
	await sel("contact", "L3_select_eq_random", () => pick(OPTS20));
	await sel("contact", "L3_select_eq_common", () => "o001");
	await sel("contact", "L3_select_eq_rare", () => "o019");
	await measure("L3_multi_has_any", tier, (i) => { const b = base("contact", w); const a = pick(OPTS12), c = pick(OPTS12); b.params.push(js({ m1: [a] }), js({ m1: [c] })); return [{ sql: listSql("contact", `${b.where} AND (custom @> $2::jsonb OR custom @> $3::jsonb)`, ORDER, `,${PROPS}`), params: b.params }]; });
	await measure("L3_multi_has_all", tier, () => { const b = base("contact", w); const a = pick(OPTS12), c = pick(OPTS12); b.params.push(js({ m1: a === c ? [a] : [a, c] })); return [{ sql: listSql("contact", `${b.where} AND custom @> $2::jsonb`, ORDER, `,${PROPS}`), params: b.params }]; });
	await measure("L3_checkbox_c1_true", tier, () => { const b = base("contact", w); b.params.push(js({ c1: true })); return [{ sql: listSql("contact", `${b.where} AND custom @> $2::jsonb`, ORDER, `,${PROPS}`), params: b.params }]; });
	await measure("L3_checkbox_c2_true_rare", tier, () => { const b = base("contact", w); b.params.push(js({ c2: true })); return [{ sql: listSql("contact", `${b.where} AND custom @> $2::jsonb`, ORDER, `,${PROPS}`), params: b.params }]; });
	await measure("L3_two_conditions_s1_and_c2", tier, () => { const b = base("contact", w); b.params.push(js({ s1: pick(OPTS20), c2: true })); return [{ sql: listSql("contact", `${b.where} AND custom @> $2::jsonb`, ORDER, `,${PROPS}`), params: b.params }]; });
	await measure("L3_multi_has_any_questionbar_NOT_INDEXABLE", tier, () => { const b = base("contact", w); b.params.push([pick(OPTS12), pick(OPTS12)]); return [{ sql: listSql("contact", `${b.where} AND custom->'m1' ?| $2::text[]`, ORDER, `,${PROPS}`), params: b.params }]; }, { n: 30 });
	await measure("L3_deal_select_eq_random", tier, () => { const b = base("deal", w); b.params.push(js({ s1: pick(OPTS20) })); return [{ sql: listSql("deal", `${b.where} AND custom @> $2::jsonb`, ORDER, `,${PROPS}`), params: b.params }]; });
	// totals with a custom filter
	const tot = (wh: string, p: unknown[]) => ({ sql: `SELECT count(*)::int n FROM (SELECT 1 FROM crm.contact WHERE ${wh} LIMIT 10001) c`, params: p });
	await measure("L7_total_select_eq_common", tier, () => { const b = base("contact", w); b.params.push(js({ s1: "o001" })); return [tot(`${b.where} AND custom @> $2::jsonb`, b.params)]; });
	await measure("L7_total_select_eq_rare", tier, () => { const b = base("contact", w); b.params.push(js({ s1: "o019" })); return [tot(`${b.where} AND custom @> $2::jsonb`, b.params)]; });
}

// custom sorts (unindexed in A/B; indexed in C)
async function customSorts(tier: string, tag: string, indexed: boolean) {
	const w = whales[tier];
	const srt = (name: string, expr: string, dir: string, extraWhere = "", extraParams: () => unknown[] = () => []) =>
		measure(`${name}_${tag}`, tier, () => { const b = base("contact", w); const ep = extraParams(); b.params.push(...ep); return [{ sql: listSql("contact", b.where + extraWhere.replace(/\$X/g, `$${b.params.length}`), `ORDER BY ${expr} ${dir},id ${dir.startsWith("DESC") ? "DESC" : "ASC"} LIMIT 51`, `,${PROPS}`), params: b.params }]; }, { n: indexed ? NRUN : 15 });
	await srt("L4_sort_n1_asc", num("n1"), "ASC NULLS LAST");
	await srt("L4_sort_n1_desc_nullslast_compilerform", num("n1"), "DESC NULLS LAST");
	await srt("L4_sort_d1_asc", str("d1"), "ASC NULLS LAST");
	await srt("L4_sort_t1_asc", str("t1"), "ASC NULLS LAST");
	if (indexed) {
		await srt("L4_sort_n1_desc_default_nulls", num("n1"), "DESC");
		await srt("L4_sort_n1_asc_with_filter_s1", num("n1"), "ASC NULLS LAST", ` AND ${str("s1")}=$X::text`, () => ["o001"]);
		await srt("L5_filter_s1_rare_sort_n1", num("n1"), "ASC NULLS LAST", ` AND ${str("s1")}=$X::text`, () => ["o019"]);
		await srt("L5_filter_s1_random_sort_n1", num("n1"), "ASC NULLS LAST", ` AND ${str("s1")}=$X::text`, () => [pick(OPTS20)]);
		await srt("L5_filter_c2_rare_sort_d1", str("d1"), "ASC NULLS LAST", ` AND ${bool("c2")}=true`, () => []);
		await srt("L4b_range_n1_between", num("n1"), "ASC NULLS LAST", ` AND ${num("n1")} BETWEEN $X::float8 AND ($X::float8+500)`, () => [Math.floor(Math.random() * 900000)]);
		await srt("L4b_range_d1_between", str("d1"), "ASC NULLS LAST", ` AND ${str("d1")} BETWEEN $X::text AND '2023-12-31'`, () => ["2023-01-01"]);
	} else {
		await measure(`L4_sort_s1_option_position_${tag}`, tier, () => { const b = base("contact", w); b.params.push(OPTS20); return [{ sql: listSql("contact", b.where, `ORDER BY array_position($2::text[], custom->>'s1') ASC NULLS LAST,id ASC LIMIT 51`, `,${PROPS}`), params: b.params }]; }, { n: 15 });
		await measure(`L4b_range_n1_between_${tag}`, tier, () => { const b = base("contact", w); b.params.push(Math.floor(Math.random() * 900000)); return [{ sql: listSql("contact", `${b.where} AND ${num("n1")} BETWEEN $2::float8 AND ($2::float8+500)`, ORDER, `,${PROPS}`), params: b.params }]; }, { n: 15 });
	}
	await measure(`L4_sort_deal_n1_asc_${tag}`, tier, () => { const b = base("deal", w); return [{ sql: listSql("deal", b.where, `ORDER BY ${num("n1")} ASC NULLS LAST,id ASC LIMIT 51`, `,${PROPS}`), params: b.params }]; }, { n: indexed ? NRUN : 15 });
	// keyset on a custom sort: compiler OR-chain vs row-value form (indexed only, mid-position cursor)
	if (indexed) {
		const mid = await aq(`SELECT (custom->>'n1')::numeric v, id FROM crm.contact WHERE tenant_id=$1 AND custom ? 'n1' ORDER BY random() LIMIT 50`, [w.id]);
		await measure(`L4_sort_n1_cursor_orchain_${tag}`, tier, (i) => { const b = base("contact", w); const m = mid[i % mid.length]; b.params.push(m.v, m.id); return [{ sql: listSql("contact", `${b.where} AND ((${num("n1")} > $2::float8 OR ${num("n1")} IS NULL) OR (${num("n1")} = $2::float8 AND id > $3::uuid))`, `ORDER BY ${num("n1")} ASC NULLS LAST,id ASC LIMIT 51`, `,${PROPS}`), params: b.params }]; });
		await measure(`L4_sort_n1_cursor_rowvalue_${tag}`, tier, (i) => { const b = base("contact", w); const m = mid[i % mid.length]; b.params.push(m.v, m.id); return [{ sql: listSql("contact", `${b.where} AND (${num("n1")},id) > ($2::float8,$3::uuid)`, `ORDER BY ${num("n1")} ASC NULLS LAST,id ASC LIMIT 51`, `,${PROPS}`), params: b.params }]; });
	}
}

async function qSuite(tier: string, tag: string) {
	const w = whales[tier], S = samples[tier];
	const terms: Record<string, () => string> = {
		common_en: () => "ahmed", common_ar: () => "أحمد", mid_en: () => "cairo", mid_ar: () => "القاهرة",
		rare_token: () => pick(S.tokens), short3: () => "ahm", short2: () => "ah", ar3: () => "احم",
	};
	for (const [tn, tf] of Object.entries(terms)) {
		for (const [shape, cols] of [["display_only_P1a", ["search_normalized"]], ["display_plus_custom_search", ["search_normalized", "custom_search"]]] as const) {
			if (tag.startsWith("tri") && shape === "display_only_P1a" && !["common_en", "rare_token", "short3"].includes(tn)) continue;
			if (tn === "short2" && shape === "display_only_P1a") continue;
			await measure(`L6_q_${tn}_${shape}_${tag}`, tier, () => { const b = base("contact", w); const wh = b.where + qCond(b.params, tf(), "contains", [...cols]); return [{ sql: listSql("contact", wh, ORDER, `,${PROPS}`), params: b.params }]; }, { n: tag.startsWith("tri") ? NRUN : 15 });
		}
	}
	await measure(`L6_q_prefix_common_${tag}`, tier, () => { const b = base("contact", w); const wh = b.where + qCond(b.params, "ahm", "prefix", ["search_normalized", "custom_search"]); return [{ sql: listSql("contact", wh, ORDER, `,${PROPS}`), params: b.params }]; }, { n: tag.startsWith("tri") ? NRUN : 15 });
	await measure(`L7_total_q_common_${tag}`, tier, () => { const b = base("contact", w); const wh = b.where + qCond(b.params, "ahmed", "contains", ["search_normalized", "custom_search"]); return [{ sql: `SELECT count(*)::int n FROM (SELECT 1 FROM crm.contact WHERE ${wh} LIMIT 10001) c`, params: b.params }]; }, { n: tag.startsWith("tri") ? NRUN : 15 });
	await measure(`L7_total_q_rare_${tag}`, tier, () => { const b = base("contact", w); const wh = b.where + qCond(b.params, pick(S.tokens), "contains", ["search_normalized", "custom_search"]); return [{ sql: `SELECT count(*)::int n FROM (SELECT 1 FROM crm.contact WHERE ${wh} LIMIT 10001) c`, params: b.params }]; }, { n: tag.startsWith("tri") ? NRUN : 15 });
	// deal q (title) -- related_search subselect as in P1a
	await measure(`L6_deal_q_common_${tag}`, tier, () => { const b = base("deal", w); b.params.push("%ahmed%"); const pat = "crm.normalize_search($2::text)"; return [{ sql: `SELECT ${PDEAL},${KEY0} FROM (SELECT b.*,(SELECT c.search_normalized FROM crm.contact c WHERE c.tenant_id=b.tenant_id AND c.id=b.contact_id AND c.merged_into_id IS NULL) AS related_search FROM crm.deal b) records WHERE ${b.where} AND (search_normalized LIKE ${pat} ESCAPE '\\' OR related_search LIKE ${pat} ESCAPE '\\' OR custom_search LIKE ${pat} ESCAPE '\\') ${ORDER}`, params: b.params }]; }, { n: tag.startsWith("tri") ? NRUN : 10 });
}

async function recordOps(tier: string, tag: string) {
	const w = whales[tier], S = samples[tier];
	await measure(`R_get_with_properties_${tag}`, tier, (i) => {
		const id = S.ids[i % S.ids.length];
		return [
			{ sql: `SELECT ${PCON},custom FROM crm.contact WHERE tenant_id=$1 AND id=$2`, params: [w.id, id] },
			{ sql: "SELECT crm.can_object('crm.read','contact',$1,NULL) allowed", params: [id] },
			{ sql: "SELECT id,kind,crm.identifier_value(id) value,provenance,original_contact_id FROM crm.contact_identifier WHERE tenant_id=$1 AND contact_id=$2 AND crm.can_object('sensitive.read','contact',contact_id,$3)", params: [w.id, id, null] },
		];
	}, { explain: false });
	const patchReq = (id: string, ver: number, i: number): Q[] => {
		const patch = { t1: `${pick(["أحمد", "Ahmed", "شركة", "Company"])} ${i} ${pick(["محمد", "Cairo"])}`, s1: pick(OPTS20), n1: Math.floor(Math.random() * 1000000), d1: "2025-06-15", c1: Math.random() < 0.5 };
		const reqId = randomUUID();
		return [
			{ sql: `SELECT ${PCON} FROM crm.contact WHERE tenant_id=$1 AND id=$2 FOR UPDATE`, params: [w.id, id] },
			{ sql: "SELECT crm.can_object('crm.write','contact',$1,NULL) allowed", params: [id] },
			{ sql: `UPDATE crm.contact c SET custom=m.c, custom_search=crm.normalize_search(concat_ws(' ',m.c->>'t1',m.c->>'t3',m.c->>'t5')), version=c.version+1 FROM (SELECT custom||$3::jsonb c FROM crm.contact WHERE tenant_id=$1 AND id=$2) m WHERE c.tenant_id=$1 AND c.id=$2 AND c.version>=0`, params: [w.id, id, js(patch)] },
			{ sql: "INSERT INTO crm.audit_log(tenant_id,id,actor_id,grant_id,action,request_id,object_kind,object_id,changed_fields) VALUES($1,$2,crm.actor(),NULL,'contact.updated',$3,'contact',$4,$5)", params: [w.id, randomUUID(), reqId, id, ["custom:t1", "custom:s1", "custom:n1", "custom:d1", "custom:c1"]] },
			{ sql: "WITH e AS (INSERT INTO crm.business_event(tenant_id,id,name,object_kind,object_id) VALUES($1,$2,'contact.updated','contact',$3) RETURNING id) INSERT INTO crm.outbox(tenant_id,id,event_id,actor_id,grant_id,deal_id,object_kind,object_id) SELECT $1,$4,e.id,crm.actor(),NULL,NULL,'contact',$3 FROM e", params: [w.id, randomUUID(), id, randomUUID()] },
		];
	};
	await measure(`R_patch_5props_${tag}`, tier, (i) => patchReq(S.ids[(i * 7) % S.ids.length], 0, i), { explain: false });
	// 20 concurrent writers on distinct rows
	const lat: number[] = []; let errs = 0;
	const writers = Array.from({ length: 20 }, async (_, wi) => {
		const c = await connect();
		for (let k = 0; k < 30; k++) { const x = await oneRequest(c, w, "mgr", patchReq(S.ids[3000 + wi * 30 + k], 0, k)); lat.push(x.ms); if (x.err) errs++; }
		await c.end();
	});
	const t = performance.now(); await Promise.all(writers); const wall = performance.now() - t;
	const out = { tier, name: `R_patch_20_concurrent_${tag}`, runs: lat.length, p50: r1(pct(lat, 50)), p95: r1(pct(lat, 95)), max: r1(Math.max(...lat)), errors: errs, throughput_per_s: r1(lat.length / (wall / 1000)) };
	await save(`${tier}:R_patch_20_concurrent_${tag}`, out); log(`${tier} R_patch_20_concurrent_${tag}: ${JSON.stringify(out)}`);
}

async function insertThroughput(tag: string) {
	const w = whales.W1M;
	await aq(`CREATE TABLE IF NOT EXISTS spike.ins_src AS SELECT * FROM crm.contact WHERE tenant_id='${w.id}' LIMIT 100000`);
	const tn = randomUUID();
	await aq("INSERT INTO crm.tenant(id,name) VALUES($1,'ins')", [tn]);
	const t = performance.now();
	await aq("INSERT INTO crm.contact(tenant_id,id,display_name,owner_id,version,source,created_at,updated_at,custom,custom_search) SELECT $1,gen_random_uuid(),display_name,owner_id,version,source,created_at,updated_at,custom,custom_search FROM spike.ins_src", [tn]);
	const ms = performance.now() - t;
	await save(`insert_throughput:${tag}`, { rows: 100000, ms: Math.round(ms), rows_per_s: Math.round(100000 / (ms / 1000)) });
	log(`insert throughput ${tag}: ${Math.round(100000 / (ms / 1000))} rows/s`);
	// NOTE: a plain DELETE here took > 3 min for 100k rows: the self-FK (tenant_id,merged_into_id) has no index, so every
	// referenced-row delete seq-scans the table (finding recorded in the doc). Cleanup uses replica role (skips RI triggers).
	await admin.query("SET session_replication_role=replica");
	await aq("DELETE FROM crm.contact WHERE tenant_id=$1", [tn]);
	await aq("DELETE FROM crm.tenant WHERE id=$1", [tn]);
	await admin.query("RESET session_replication_role");
	await admin.query("VACUUM crm.contact");
}

async function pgStats(tag: string) {
	const s = await aq("select relname,n_live_tup,n_dead_tup,n_tup_upd,n_tup_hot_upd from pg_stat_user_tables where relname in ('contact','deal')");
	await save(`tablestats:${tag}`, s);
}

// ======================= RUN =======================
await envRecord();
for (const t of TIERS) await sample(t);
for (const t of TIERS) deals[t] = { stages: (await aq("SELECT id FROM crm.stage WHERE tenant_id=$1 ORDER BY position", [whales[t].id])).map((r) => r.id) };
await writeFile(PLANS, `# EXPLAIN (ANALYZE, BUFFERS) plans, phase ${PHASE}, spike DB crm_spike_b0, measured as NOSUPERUSER role under FORCE RLS\n`);

if (PHASE === "A") {
	await indexReport("A_baseline");
	await timed("validate_contact_custom_check_2M", async () => aq("ALTER TABLE crm.contact VALIDATE CONSTRAINT contact_custom_ck"));
	await timed("validate_deal_custom_check", async () => aq("ALTER TABLE crm.deal VALIDATE CONSTRAINT deal_custom_ck"));
	await insertThroughput("A_baseline_P1a_indexes_only");
	for (const t of TIERS) { await listSuite(t, "A"); await customFilters(t); await customSorts(t, "noidx", false); await qSuite(t, "notri"); await recordOps(t, "baseline"); }
	await pgStats("after_A");
} else if (PHASE === "B") {
	await admin.query("SET maintenance_work_mem='1GB'");
	await timed("create_gin_jsonb_path_ops_contact", () => aq("CREATE INDEX contact_custom_gin ON crm.contact USING gin (custom jsonb_path_ops)"));
	await timed("create_gin_jsonb_path_ops_deal", () => aq("CREATE INDEX deal_custom_gin ON crm.deal USING gin (custom jsonb_path_ops)"));
	await aq("ANALYZE crm.contact"); await aq("ANALYZE crm.deal");
	await indexReport("B_gin");
	for (const t of TIERS) await customFilters(t);
} else if (PHASE === "B2") {
	// Diagnostics: why GIN is not picked, forced-bitmap timings, and the (tenant_id, custom) composite GIN via btree_gin.
	await admin.query("SET maintenance_work_mem='1GB'");
	const w1 = (t: string) => whales[t];
	const veryrare = async (t: string, tag: string) => {
		const w = w1(t);
		await measure(`B2_select_eq_veryrare_s5_${tag}`, t, () => { const b = base("contact", w); b.params.push(js({ s5: pick(["o199", "o200", "o198"]) })); return [{ sql: listSql("contact", `${b.where} AND custom @> $2::jsonb`, ORDER, `,${PROPS}`), params: b.params }]; }, { n: 30 });
		await measure(`B2_total_select_eq_rare_s1o019_${tag}`, t, () => { const b = base("contact", w); b.params.push(js({ s1: "o019" })); return [{ sql: `SELECT count(*)::int n FROM (SELECT 1 FROM crm.contact WHERE ${b.where} AND custom @> $2::jsonb LIMIT 10001) c`, params: b.params }]; }, { n: 15 });
		await measure(`B2_two_cond_s1_c2_${tag}`, t, () => { const b = base("contact", w); b.params.push(js({ s1: pick(OPTS20), c2: true })); return [{ sql: listSql("contact", `${b.where} AND custom @> $2::jsonb`, ORDER, `,${PROPS}`), params: b.params }]; }, { n: 30 });
	};
	for (const t of TIERS) await veryrare(t, "plain_gin_planner");
	PRE = ["SET LOCAL enable_seqscan=off", "SET LOCAL enable_indexscan=off"];
	for (const t of TIERS) await veryrare(t, "plain_gin_forced_bitmap");
	PRE = [];
	await timed("create_extension_btree_gin", () => aq("CREATE EXTENSION IF NOT EXISTS btree_gin"));
	await aq("DROP INDEX crm.contact_custom_gin");
	await timed("create_gin_tenant_custom_composite", () => aq("CREATE INDEX contact_tenant_custom_gin ON crm.contact USING gin (tenant_id, custom jsonb_path_ops)"));
	await aq("ANALYZE crm.contact");
	await save("composite_gin_size", (await aq("select pg_relation_size('crm.contact_tenant_custom_gin') b"))[0]);
	for (const t of TIERS) await veryrare(t, "composite_gin_planner");
	for (const t of TIERS) { await measure(`B2_select_eq_random_composite`, t, () => { const b = base("contact", whales[t]); b.params.push(js({ s1: pick(OPTS20) })); return [{ sql: listSql("contact", `${b.where} AND custom @> $2::jsonb`, ORDER, `,${PROPS}`), params: b.params }]; }); }
} else if (PHASE === "B3") {
	// Per-tenant partial indexes for the big tenants: partial GIN (jsonb_path_ops) and a partial expression btree for select equality.
	await admin.query("SET maintenance_work_mem='1GB'");
	await aq("DROP INDEX IF EXISTS crm.contact_tenant_custom_gin");
	for (const t of TIERS) {
		const id = whales[t].id;
		await timed(`cic_partial_gin_${t}`, () => aq(`CREATE INDEX CONCURRENTLY ix_c_gin_${t} ON crm.contact USING gin (custom jsonb_path_ops) WHERE tenant_id='${id}'`));
		await timed(`cic_expr_s1_created_${t}`, () => aq(`CREATE INDEX CONCURRENTLY ix_c_s1_${t} ON crm.contact ((custom->>'s1'), created_at DESC, id DESC) WHERE tenant_id='${id}'`));
	}
	await aq("ANALYZE crm.contact");
	await save("partial_index_sizes", await aq("select c.relname, pg_relation_size(c.oid) b from pg_class c where relname like 'ix_c_gin_%' or relname like 'ix_c_s1_%'"));
	const sets: [string, (t: string) => Q[]][] = [
		["B3_gin_veryrare_s5", (t) => { const b = base("contact", whales[t]); b.params.push(js({ s5: pick(["o199", "o200", "o198"]) })); return [{ sql: listSql("contact", `${b.where} AND custom @> $2::jsonb`, ORDER, `,${PROPS}`), params: b.params }]; }],
		["B3_gin_total_rare_s1o019", (t) => { const b = base("contact", whales[t]); b.params.push(js({ s1: "o019" })); return [{ sql: `SELECT count(*)::int n FROM (SELECT 1 FROM crm.contact WHERE ${b.where} AND custom @> $2::jsonb LIMIT 10001) c`, params: b.params }]; }],
		["B3_gin_two_cond_s1_c2", (t) => { const b = base("contact", whales[t]); b.params.push(js({ s1: pick(OPTS20), c2: true })); return [{ sql: listSql("contact", `${b.where} AND custom @> $2::jsonb`, ORDER, `,${PROPS}`), params: b.params }]; }],
		["B3_expr_s1_eq_random", (t) => { const b = base("contact", whales[t]); b.params.push(pick(OPTS20)); return [{ sql: listSql("contact", `${b.where} AND (custom->>'s1')=$2::text`, ORDER, `,${PROPS}`), params: b.params }]; }],
		["B3_expr_s1_eq_rare_o019", (t) => { const b = base("contact", whales[t]); b.params.push("o019"); return [{ sql: listSql("contact", `${b.where} AND (custom->>'s1')=$2::text`, ORDER, `,${PROPS}`), params: b.params }]; }],
		["B3_expr_total_s1_o019", (t) => { const b = base("contact", whales[t]); b.params.push("o019"); return [{ sql: `SELECT count(*)::int n FROM (SELECT 1 FROM crm.contact WHERE ${b.where} AND (custom->>'s1')=$2::text LIMIT 10001) c`, params: b.params }]; }],
		["B3_expr_s1_and_c2", (t) => { const b = base("contact", whales[t]); b.params.push(pick(OPTS20), js({ c2: true })); return [{ sql: listSql("contact", `${b.where} AND (custom->>'s1')=$2::text AND custom @> $3::jsonb`, ORDER, `,${PROPS}`), params: b.params }]; }],
	];
	for (const t of TIERS) for (const [n, g] of sets) await measure(n, t, () => g(t), { n: 30 });
} else if (PHASE === "C") {
	LP = true;
	await admin.query("SET maintenance_work_mem='1GB'");
	for (const r of await aq("select indexname from pg_indexes where schemaname='crm' and (indexname like 'ix_c_gin_%' or indexname like 'ix_c_s1_%' or indexname like 'ix_c_n2_%')")) await aq(`DROP INDEX crm.${r.indexname}`);
	// leakproof wrappers: required so that predicates on custom values can be index quals under RLS (finding F1)
	await aq(`CREATE OR REPLACE FUNCTION spike.jtxt(c jsonb, k text) RETURNS text LANGUAGE plpgsql IMMUTABLE LEAKPROOF PARALLEL SAFE AS $$ BEGIN RETURN CASE WHEN jsonb_typeof(c->k)='string' THEN c->>k END; END $$`);
	await aq(`CREATE OR REPLACE FUNCTION spike.jnum8(c jsonb, k text) RETURNS float8 LANGUAGE plpgsql IMMUTABLE LEAKPROOF PARALLEL SAFE AS $$ BEGIN RETURN CASE WHEN jsonb_typeof(c->k)='number' THEN (c->>k)::float8 END; END $$`);
	await aq(`CREATE OR REPLACE FUNCTION spike.jbool(c jsonb, k text) RETURNS boolean LANGUAGE plpgsql IMMUTABLE LEAKPROOF PARALLEL SAFE AS $$ BEGIN RETURN CASE WHEN jsonb_typeof(c->k)='boolean' THEN (c->>k)::boolean END; END $$`);
	await aq(`GRANT EXECUTE ON FUNCTION spike.jtxt(jsonb,text), spike.jnum8(jsonb,text), spike.jbool(jsonb,text) TO ${SPIKE_ROLE}`);
	// per-tenant partial expression indexes (<= 5 per object per tenant)
	for (const t of TIERS) {
		const id = whales[t].id;
		await timed(`cic_n1_${t}`, () => aq(`CREATE INDEX CONCURRENTLY ix_c_n1_${t} ON crm.contact (${num("n1")}, id) WHERE tenant_id='${id}'`));
		await timed(`cic_d1_${t}`, () => aq(`CREATE INDEX CONCURRENTLY ix_c_d1_${t} ON crm.contact (${str("d1")}, id) WHERE tenant_id='${id}'`));
		await timed(`cic_t1_${t}`, () => aq(`CREATE INDEX CONCURRENTLY ix_c_t1_${t} ON crm.contact (${str("t1")}, id) WHERE tenant_id='${id}'`));
		await timed(`cic_s1_created_${t}`, () => aq(`CREATE INDEX CONCURRENTLY ix_c_s1_${t} ON crm.contact (${str("s1")}, created_at DESC, id DESC) WHERE tenant_id='${id}'`));
		await timed(`cic_c2_created_${t}`, () => aq(`CREATE INDEX CONCURRENTLY ix_c_c2_${t} ON crm.contact (${bool("c2")}, created_at DESC, id DESC) WHERE tenant_id='${id}'`));
		await timed(`cic_deal_n1_${t}`, () => aq(`CREATE INDEX CONCURRENTLY ix_d_n1_${t} ON crm.deal (${num("n1")}, id) WHERE tenant_id='${id}'`));
		await timed(`cic_deal_s1_${t}`, () => aq(`CREATE INDEX CONCURRENTLY ix_d_s1_${t} ON crm.deal (${str("s1")}, created_at DESC, id DESC) WHERE tenant_id='${id}'`));
	}
	await aq("ANALYZE crm.contact"); await aq("ANALYZE crm.deal");
	await indexReport("C_expr");
	for (const t of TIERS) {
		const w = whales[t];
		await customSorts(t, "idx", true);
		const f = (name: string, where: (b: ReturnType<typeof base>) => string, vals: () => unknown[], extra = ORDER) => measure(name, t, () => { const b = base("contact", w); b.params.push(...vals()); return [{ sql: listSql("contact", `${b.where} AND ${where(b)}`, extra, `,${PROPS}`), params: b.params }]; });
		await f("LP_select_eq_random", () => `${str("s1")}=$2::text`, () => [pick(OPTS20)]);
		await f("LP_select_eq_common", () => `${str("s1")}=$2::text`, () => ["o001"]);
		await f("LP_select_eq_rare_o019", () => `${str("s1")}=$2::text`, () => ["o019"]);
		await f("LP_checkbox_c2_true_rare", () => `${bool("c2")}=true`, () => []);
		await f("LP_s1_and_c2", () => `${str("s1")}=$2::text AND ${bool("c2")}=true`, () => [pick(OPTS20)]);
		await f("LP_s1_in_3_values", () => `${str("s1")}=ANY($2::text[])`, () => [[pick(OPTS20), pick(OPTS20), pick(OPTS20)]]);
		await measure("LP_total_s1_rare_o019", t, () => { const b = base("contact", w); b.params.push("o019"); return [{ sql: `SELECT count(*)::int n FROM (SELECT 1 FROM crm.contact WHERE ${b.where} AND ${str("s1")}=$2::text LIMIT 10001) c`, params: b.params }]; });
		await measure("LP_total_s1_common_o001", t, () => { const b = base("contact", w); b.params.push("o001"); return [{ sql: `SELECT count(*)::int n FROM (SELECT 1 FROM crm.contact WHERE ${b.where} AND ${str("s1")}=$2::text LIMIT 10001) c`, params: b.params }]; });
		await measure("LP_deal_select_eq_random", t, () => { const b = base("deal", w); b.params.push(pick(OPTS20)); return [{ sql: listSql("deal", `${b.where} AND ${str("s1")}=$2::text`, ORDER, `,${PROPS}`), params: b.params }]; });
		// non-indexed property filter (s2 has no index): worst case, expect 5 s clean timeout at 1M
		await measure("LP_unindexed_s2_eq_rare", t, () => { const b = base("contact", w); b.params.push("o019"); return [{ sql: listSql("contact", `${b.where} AND ${str("s2")}=$2::text`, ORDER, `,${PROPS}`), params: b.params }]; }, { n: 10 });
	}
} else if (PHASE === "D") {
	LP = true;
	await admin.query("SET maintenance_work_mem='1GB'");
	await timed("create_extension_pg_trgm", () => aq("CREATE EXTENSION IF NOT EXISTS pg_trgm"));
	await timed("create_trgm_contact_search_normalized", () => aq("CREATE INDEX contact_search_trgm ON crm.contact USING gin (search_normalized gin_trgm_ops)"));
	await timed("create_trgm_contact_custom_search", () => aq("CREATE INDEX contact_custom_search_trgm ON crm.contact USING gin (custom_search gin_trgm_ops)"));
	await timed("create_trgm_deal_search_normalized", () => aq("CREATE INDEX deal_search_trgm ON crm.deal USING gin (search_normalized gin_trgm_ops)"));
	await timed("create_trgm_deal_custom_search", () => aq("CREATE INDEX deal_custom_search_trgm ON crm.deal USING gin (custom_search gin_trgm_ops)"));
	await aq("ANALYZE crm.contact"); await aq("ANALYZE crm.deal");
	await indexReport("D_all_indexes");
	await insertThroughput("D_all_indexes_gin_trgm_expr");
	for (const t of TIERS) await qSuite(t, "tri"); // trigram present, textlike NOT leakproof (as shipped): expected unusable under RLS
	// Hypothetical only (spike DB catalog; pg_proc is per-database): mark textlike/texticlike LEAKPROOF to see what trigram would give
	await aq("ALTER FUNCTION pg_catalog.textlike(text,text) LEAKPROOF");
	await aq("ALTER FUNCTION pg_catalog.texticlike(text,text) LEAKPROOF");
	for (const t of TIERS) await qSuite(t, "trilp");
	for (const t of TIERS) await recordOps(t, "allidx");
	await pgStats("after_D");
} else if (PHASE === "E") {
	LP = true;
	// CREATE INDEX CONCURRENTLY on the 1M whale while 4 writers patch rows (property flip). Baseline p95 first.
	const w = whales.W1M, S = samples.W1M;
	const patchOnce = (c: pg.Client, i: number) => oneRequest(c, w, "mgr", [
		{ sql: `SELECT ${PCON} FROM crm.contact WHERE tenant_id=$1 AND id=$2 FOR UPDATE`, params: [w.id, S.ids[i % 3000]] },
		{ sql: `UPDATE crm.contact c SET custom=custom||$3::jsonb, version=version+1 WHERE tenant_id=$1 AND id=$2`, params: [w.id, S.ids[i % 3000], js({ n2: Math.round(Math.random() * 100000) / 100, c1: Math.random() < 0.5 })] },
	]);
	const writers = async (ms: number) => {
		const lat: number[] = []; let errs = 0; const stop = performance.now() + ms;
		await Promise.all(Array.from({ length: 4 }, async (_, k) => { const c = await connect(); let i = k * 700; while (performance.now() < stop) { const x = await patchOnce(c, i++); lat.push(x.ms); if (x.err) errs++; } await c.end(); }));
		return { n: lat.length, p50: r1(pct(lat, 50)), p95: r1(pct(lat, 95)), max: r1(Math.max(...lat)), errs };
	};
	const baseline = await writers(20000);
	log(`baseline writers: ${JSON.stringify(baseline)}`);
	await admin.query("SET maintenance_work_mem='64MB'"); // default-like for the flip
	let during: any; let buildMs = 0;
	const t = performance.now();
	let finished = false;
	const build = admin.query(`CREATE INDEX CONCURRENTLY ix_c_n2_flip ON crm.contact (${num("n2")}, id) WHERE tenant_id='${w.id}'`).then(() => { finished = true; buildMs = performance.now() - t; });
	const lat: number[] = []; let errs = 0;
	await Promise.all([build, ...Array.from({ length: 4 }, async (_, k) => { const c = await connect(); let i = k * 700; while (!finished) { const x = await patchOnce(c, i++); lat.push(x.ms); if (x.err) errs++; } await c.end(); })]);
	during = { n: lat.length, p50: r1(pct(lat, 50)), p95: r1(pct(lat, 95)), max: r1(Math.max(...lat)), errs };
	await save("cic_flip_W1M", { build_ms: Math.round(buildMs), baseline, during, ratio_p95: r1(during.p95 / baseline.p95), index_bytes: (await aq("select pg_relation_size('crm.ix_c_n2_flip') b"))[0].b });
	log(`CIC flip: build ${(buildMs / 1000).toFixed(1)} s; baseline p95=${baseline.p95}, during p95=${during.p95}`);
	// same flip on the 50k whale
	const t2 = performance.now();
	await admin.query(`CREATE INDEX CONCURRENTLY ix_c_n2_flip50 ON crm.contact (${num("n2")}, id) WHERE tenant_id='${whales.W50.id}'`);
	await save("cic_flip_W50", { build_ms: Math.round(performance.now() - t2) });
	await aq("ANALYZE crm.contact");
} else if (PHASE === "F") {
	// registry rows / schema ops (scratch prop_def) at both whales; wide variant; bloat
	for (const tier of TIERS) {
		const w = whales[tier];
		await aq(`INSERT INTO spike.prop_def(tenant_id,id,object,key,type,label_en,label_ar,options,flags)
		 SELECT $1,gen_random_uuid(),'contact','k'||k,(ARRAY['text','select','number','date','checkbox','multi_select'])[1+k%6],'Label '||k,'عنوان '||k,
		  (SELECT coalesce(jsonb_agg(jsonb_build_object('value','o'||x,'label_en','Option '||x,'label_ar','خيار '||x,'color','c'||(x%8))),'[]'::jsonb) FROM generate_series(1,CASE WHEN k%6 IN (1,5) THEN 20 ELSE 0 END) x),
		  '{"required":false,"indexed":false}'::jsonb FROM generate_series(1,100) k ON CONFLICT DO NOTHING`, [w.id]);
		await aq(`INSERT INTO spike.schema_rev(tenant_id,object) VALUES($1,'contact') ON CONFLICT DO NOTHING`, [w.id]);
		const ids = (await aq("SELECT id FROM spike.prop_def WHERE tenant_id=$1 AND object='contact' ORDER BY key", [w.id])).map((r) => r.id);
		await measure("S_schema_get_100props", tier, () => [{ sql: "SELECT id,key,type,label_en,label_ar,flags,options,version,archived FROM spike.prop_def WHERE tenant_id=$1 AND object='contact' AND NOT archived ORDER BY key", params: [w.id] }, { sql: "SELECT rev FROM spike.schema_rev WHERE tenant_id=$1 AND object='contact'", params: [w.id] }], { explain: false });
		const sizeKb = (await aq("SELECT pg_column_size(jsonb_agg(to_jsonb(p)))/1024.0 kb FROM spike.prop_def p WHERE tenant_id=$1", [w.id]))[0].kb;
		await save(`${tier}:schema_json_kb`, { kb: Number(sizeKb) });
		const evidenceQs = (id: string): Q[] => [
			{ sql: "INSERT INTO crm.audit_log(tenant_id,id,actor_id,grant_id,action,request_id,object_kind,object_id,changed_fields) VALUES($1,$2,crm.actor(),NULL,'property.updated',$3,'contact',$4,$5)", params: [w.id, randomUUID(), randomUUID(), samples[tier].ids[0], ["label"]] },
			{ sql: "WITH e AS (INSERT INTO crm.business_event(tenant_id,id,name,object_kind,object_id) VALUES($1,$2,'property.updated','contact',$3) RETURNING id) INSERT INTO crm.outbox(tenant_id,id,event_id,actor_id,grant_id,deal_id,object_kind,object_id) SELECT $1,$4,e.id,crm.actor(),NULL,NULL,'contact',$3 FROM e", params: [w.id, randomUUID(), samples[tier].ids[0], randomUUID()] },
		];
		await measure("S_property_edit", tier, (i) => [{ sql: "SELECT id FROM spike.prop_def WHERE tenant_id=$1 AND id=$2 FOR UPDATE", params: [w.id, ids[i % 100]] }, { sql: "UPDATE spike.prop_def SET label_en=$3,version=version+1 WHERE tenant_id=$1 AND id=$2", params: [w.id, ids[i % 100], `Label edit ${i}`] }, { sql: "UPDATE spike.schema_rev SET rev=rev+1 WHERE tenant_id=$1 AND object='contact'", params: [w.id] }, ...evidenceQs(ids[i % 100])], { explain: false });
		await measure("S_property_create", tier, (i) => { const id = randomUUID(); return [{ sql: "INSERT INTO spike.prop_def(tenant_id,id,object,key,type,label_en,label_ar,options) VALUES($1,$2,'contact',$3,'select','New','جديد',$4::jsonb)", params: [w.id, id, `n${randomUUID().slice(0, 12)}${i}`, js(Array.from({ length: 20 }, (_, x) => ({ value: `o${x}`, label_en: `Option ${x}`, label_ar: `خيار ${x}` })))] }, { sql: "UPDATE spike.schema_rev SET rev=rev+1 WHERE tenant_id=$1 AND object='contact'", params: [w.id] }, ...evidenceQs(id)]; }, { n: 50, explain: false });
	}
	// wide variant (100 properties, 50k rows, scratch table, GIN) -- admin-side sizing + role-side query
	const wide = await aq("select count(*) n, avg(pg_column_size(custom))::int avg_stored_bytes, max(pg_column_size(custom)) max_stored, avg(length(custom::text))::int avg_text_len from spike.contact_wide");
	const wsz = await aq("select pg_relation_size('spike.contact_wide') heap, (select pg_relation_size(reltoastrelid) from pg_class where oid='spike.contact_wide'::regclass) toast");
	await timed("wide_gin_build", () => aq("CREATE INDEX IF NOT EXISTS wide_gin ON spike.contact_wide USING gin (custom jsonb_path_ops)"));
	await aq("CREATE INDEX IF NOT EXISTS wide_created ON spike.contact_wide(tenant_id,created_at DESC,id DESC)");
	await aq("ANALYZE spike.contact_wide");
	await aq(`GRANT SELECT ON spike.contact_wide TO ${SPIKE_ROLE}`);
	await save("wide_variant", { wide: wide[0], sizes: wsz[0], gin_bytes: (await aq("select pg_relation_size('spike.wide_gin') b"))[0].b });
	await measure("W_wide_filter_select_eq", "W50", () => [{ sql: `SELECT tenant_id,id,created_at FROM spike.contact_wide WHERE tenant_id=$1 AND custom @> $2::jsonb ORDER BY created_at DESC,id DESC LIMIT 51`, params: [whales.W50.id, js({ p1: pick(OPTS20) })] }]);
	await measure("W_wide_list_default_projection", "W50", () => [{ sql: `SELECT tenant_id,id,created_at,custom->'p2' p2 FROM spike.contact_wide WHERE tenant_id=$1 ORDER BY created_at DESC,id DESC LIMIT 51`, params: [whales.W50.id] }]);
	await measure("W_wide_get_full_blob", "W50", () => [{ sql: `SELECT custom FROM spike.contact_wide WHERE tenant_id=$1 AND id=(SELECT id FROM spike.contact_wide WHERE tenant_id=$1 LIMIT 1 OFFSET floor(random()*50000)::int)`, params: [whales.W50.id] }]);
} else if (PHASE === "H") {
	// write amplification split: insert throughput without the custom_search trigram index (reversal-table option 3)
	await aq("DROP INDEX crm.contact_custom_search_trgm");
	await insertThroughput("H_without_contact_custom_search_trgm");
	await aq("DROP INDEX crm.contact_search_trgm");
	await insertThroughput("H_without_any_contact_trigram");
} else if (PHASE === "G") {
	// bloat / HOT / WAL after one bulk update of the whole 1M tenant (the "1M updates" measurement)
	const w = whales.W1M;
	const before = (await aq("select pg_relation_size('crm.contact') heap, pg_indexes_size('crm.contact') idx, (select pg_relation_size(reltoastrelid) from pg_class where oid='crm.contact'::regclass) toast"))[0];
	const st0 = (await aq("select n_tup_upd,n_tup_hot_upd,n_dead_tup from pg_stat_user_tables where relname='contact'"))[0];
	const lsn0 = (await aq("select pg_current_wal_lsn() l"))[0].l;
	const ms = await timed("bulk_update_1M_custom_merge", async () => { await aq("UPDATE crm.contact SET custom=custom||'{\"c1\":true,\"n3\":7}'::jsonb, version=version+1 WHERE tenant_id=$1", [w.id]); });
	void ms;
	await new Promise((r) => setTimeout(r, 1500));
	const after = (await aq("select pg_relation_size('crm.contact') heap, pg_indexes_size('crm.contact') idx, (select pg_relation_size(reltoastrelid) from pg_class where oid='crm.contact'::regclass) toast"))[0];
	const st1 = (await aq("select n_tup_upd,n_tup_hot_upd,n_dead_tup from pg_stat_user_tables where relname='contact'"))[0];
	const wal = (await aq("select pg_wal_lsn_diff(pg_current_wal_lsn(),$1) b", [lsn0]))[0].b;
	await timed("vacuum_after_1M_updates", () => aq("VACUUM (ANALYZE) crm.contact").catch(async () => { /* run outside txn */ }));
	const post = (await aq("select pg_relation_size('crm.contact') heap, pg_indexes_size('crm.contact') idx"))[0];
	await save("bloat_1M_updates", { before, after_update: after, after_vacuum: post, stats_before: st0, stats_after: st1, wal_bytes: wal });
	log(`bloat: heap ${before.heap} -> ${after.heap} -> (vacuum) ${post.heap}; idx ${before.idx} -> ${after.idx}; wal=${wal}`);
	await indexReport("G_final");
}
console.log("PHASE DONE", PHASE);
await admin.end();
