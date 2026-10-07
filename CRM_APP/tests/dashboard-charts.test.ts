// Dashboard chart aggregates (CHARTS_CONTRACTS.md) through the real HTTP server and PostgreSQL (crm_runtime, RLS):
// correct sums on seeded data, tenant isolation, rep "assigned" scope, role/permission denial, and input validation.
// Dates are computed relative to "now" (UTC month arithmetic) so the suite does not rot.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import pg from "pg";
import { seed } from "../scripts/seed.js";
import { server } from "../src/api.js";
import { pool } from "../src/db.js";

const admin = new pg.Client({ connectionString: process.env.ADMIN_DATABASE_URL });
const app = server();
let base = "";
let f: Awaited<ReturnType<typeof seed>>;
type Who = { tenant: string; token: string };
let mgr: Who, reader: Who, rep: Who, mgrB: Who, worker: Who, nobody: Who;
let repId = "";
before(async () => {
	await admin.connect();
	await new Promise<void>((r) => app.listen(0, "127.0.0.1", r));
	base = `http://127.0.0.1:${(app.address() as { port: number }).port}`;
});
after(async () => {
	await new Promise((r) => app.close(r));
	await admin.end();
	await pool.end();
});
async function principal(tenant: string | null, role: string) {
	const id = randomUUID(),
		token = randomBytes(32).toString("hex");
	await admin.query("INSERT INTO crm.principal VALUES($1,$2)", [id, `Charts ${role}`]);
	await admin.query(
		"INSERT INTO crm.session(token_hash,principal_id,expires_at,mfa_verified) VALUES($1,$2,now()+interval '1 day',true)",
		[createHash("sha256").update(token).digest("hex"), id],
	);
	if (tenant)
		await admin.query("INSERT INTO crm.membership(tenant_id,id,principal_id,role) VALUES($1,$2,$3,$4)", [tenant, randomUUID(), id, role]);
	return { id, token };
}
// biome-ignore lint/suspicious/noExplicitAny: loosely typed JSON in a test helper
type Res = { status: number; body: Record<string, any> };
async function call(who: Who, url: string, method = "GET", extra: Record<string, string> = {}): Promise<Res> {
	const headers: Record<string, string> = { authorization: `Bearer ${who.token}`, "x-tenant-id": who.tenant, ...extra };
	if (method !== "GET") headers["idempotency-key"] = randomUUID();
	const r = await fetch(`${base}${url}`, { method, headers, body: method === "GET" ? undefined : "{}" });
	// biome-ignore lint/suspicious/noExplicitAny: loosely typed JSON in a test helper
	return { status: r.status, body: (await r.json()) as Record<string, any> };
}
const j = JSON.stringify;
const get = async (who: Who, url: string) => {
	const r = await call(who, url);
	assert.equal(r.status, 200, `${url}: ${j(r.body)}`);
	return r.body.data;
};

// ---- relative dates (UTC) ----
const now = new Date();
const Y = now.getUTCFullYear(),
	M = now.getUTCMonth();
const day = (m: number, d: number, h = 12) => new Date(Date.UTC(Y, M + m, d, h)); // m = month offset from the current UTC month
const iso = (d: Date) => d.toISOString().slice(0, 10);
const monthStart = (m: number) => iso(day(m, 1, 0));
const startOfCurrentMonth = day(0, 1, 0);
// last instant window before the current month starts: 22:30Z on the previous day. UTC = previous month, Africa/Cairo (UTC+2/+3) = current month.
const edge = new Date(startOfCurrentMonth.getTime() - 90 * 60 * 1000);
const mondayOf = (d: Date) => {
	const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
	x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
	return iso(x);
};

async function fresh() {
	f = await seed(admin);
	mgr = { tenant: f.ids.a, token: f.tokens.manager };
	reader = { tenant: f.ids.a, token: f.tokens.reader };
	mgrB = { tenant: f.ids.b, token: f.tokens.agency };
	worker = { tenant: f.ids.a, token: f.tokens.worker };
	const r = await principal(f.ids.a, "rep");
	rep = { tenant: f.ids.a, token: r.token };
	repId = r.id;
	nobody = { tenant: f.ids.a, token: (await principal(null, "none")).token };
}
const STAGE_LOST = randomUUID();
async function outcomeStages() {
	for (const t of [f.ids.a, f.ids.b]) await admin.query("INSERT INTO crm.stage(tenant_id,id,pipeline_id,name,outcome,position) VALUES($1,$2,$3,'Lost','lost',9)", [t, STAGE_LOST, f.ids.pipeline]);
	await admin.query("UPDATE crm.stage SET outcome='won',position=5 WHERE tenant_id=$1 AND id=$2", [f.ids.a, f.ids.won]);
	await admin.query("UPDATE crm.stage SET position=1 WHERE id=$1", [f.ids.start]);
	await admin.query("UPDATE crm.stage SET position=2 WHERE id=$1", [f.ids.qualified]);
}
async function deal(tenant: string, stage: string, owner: string, amount: number, currency: string, at?: Date, created?: Date) {
	const id = randomUUID();
	await admin.query(
		"INSERT INTO crm.deal(tenant_id,id,contact_id,pipeline_id,stage_id,owner_id,amount_minor,currency,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)",
		[tenant, id, f.ids.contact, f.ids.pipeline, stage, owner, amount, currency, (created ?? at ?? new Date()).toISOString()],
	);
	return id;
}
async function transitionInto(tenant: string, dealId: string, stage: string, at: Date, version = 1) {
	await admin.query(
		"INSERT INTO crm.stage_transition(tenant_id,id,deal_id,pipeline_id,from_stage,to_stage,actor_id,command_id,deal_version,reason,occurred_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'t',$10)",
		[tenant, randomUUID(), dealId, f.ids.pipeline, f.ids.start, stage, f.ids.manager, randomUUID(), version, at.toISOString()],
	);
}
async function lead(tenant: string, owner: string, source: string, status: string, created?: Date) {
	await admin.query(
		"INSERT INTO crm.lead(tenant_id,id,contact_id,owner_id,title,source,source_evidence,status,received_at,created_at) VALUES($1,$2,$3,$4,'L',$5,'e',$6,$7,$7)",
		[tenant, randomUUID(), f.ids.contact, owner, source, status, (created ?? new Date()).toISOString()],
	);
}
async function task(tenant: string, owner: string, due: Date, status = "open", created?: Date, completed?: Date) {
	await admin.query(
		"INSERT INTO crm.task(tenant_id,id,contact_id,owner_id,title,due_at,status,completed_at,created_at) VALUES($1,$2,$3,$4,'T',$5,$6,$7,$8)",
		[tenant, randomUUID(), f.ids.contact, owner, due.toISOString(), status, completed?.toISOString() ?? null, (created ?? new Date()).toISOString()],
	);
}
const hours = (h: number) => new Date(Date.now() + h * 3600_000);
type Stage = { stage_id: string; name: string; deal_count: number; totals: { currency: string; amount_minor: string }[]; outcome: string | null };
const stageMap = (d: { pipelines: { stages: Stage[] }[] }) => Object.fromEntries(d.pipelines[0].stages.map((s) => [s.stage_id, s]));

test("pipeline-stages: counts and per-currency sums, tenant isolation, rep scope", async () => {
	await fresh();
	await outcomeStages();
	const A = f.ids.a;
	await deal(A, f.ids.start, repId, 1000, "EGP");
	await deal(A, f.ids.qualified, f.ids.manager, 2500, "EGP");
	await deal(A, f.ids.won, f.ids.manager, 5000, "EGP");
	await deal(A, f.ids.won, f.ids.manager, 100, "EGP");
	await deal(A, f.ids.won, repId, 700, "USD");
	await deal(A, STAGE_LOST, repId, 300, "EGP");
	// tenant B holds the same stage ids: its deals must never leak into A's totals
	await deal(f.ids.b, f.ids.start, f.ids.agency, 99999, "EGP");
	await deal(f.ids.b, f.ids.won, f.ids.agency, 88888, "USD");

	const m = await get(mgr, "/v1/dashboard/pipeline-stages");
	assert.equal(m.scope, "tenant");
	assert.deepEqual(m.pipelines[0].stages.map((s: Stage) => s.name), ["New", "Qualified", "Won", "Lost"], "ordered by position");
	const s = stageMap(m);
	// start = seeded dealA (0) + 1000
	assert.deepEqual([s[f.ids.start].deal_count, s[f.ids.start].totals], [2, [{ currency: "EGP", amount_minor: "1000" }]]);
	assert.deepEqual([s[f.ids.qualified].deal_count, s[f.ids.qualified].totals], [1, [{ currency: "EGP", amount_minor: "2500" }]]);
	assert.equal(s[f.ids.won].deal_count, 3);
	assert.equal(s[f.ids.won].outcome, "won");
	assert.deepEqual(s[f.ids.won].totals, [{ currency: "EGP", amount_minor: "5100" }, { currency: "USD", amount_minor: "700" }], "currencies are never summed together");
	assert.deepEqual([s[STAGE_LOST].deal_count, s[STAGE_LOST].outcome], [1, "lost"]);

	// reader has crm.read with tenant scope: same numbers
	assert.deepEqual(await get(reader, "/v1/dashboard/pipeline-stages"), m);

	// rep: assigned scope only
	const r = stageMap(await get(rep, "/v1/dashboard/pipeline-stages"));
	assert.deepEqual([r[f.ids.start].deal_count, r[f.ids.start].totals], [1, [{ currency: "EGP", amount_minor: "1000" }]]);
	assert.equal(r[f.ids.qualified].deal_count, 0);
	assert.deepEqual(r[f.ids.qualified].totals, []);
	assert.deepEqual(r[f.ids.won].totals, [{ currency: "USD", amount_minor: "700" }]);
	assert.equal(r[STAGE_LOST].deal_count, 1);

	// tenant B sees only its own
	const b = stageMap(await get(mgrB, "/v1/dashboard/pipeline-stages"));
	assert.deepEqual(b[f.ids.start].totals, [{ currency: "EGP", amount_minor: "99999" }]);
	assert.equal(b[f.ids.start].deal_count, 2, "B: seeded dealB + 99999");
	assert.deepEqual(b[f.ids.won].totals, [{ currency: "USD", amount_minor: "88888" }]);
	assert.equal(b[f.ids.qualified].deal_count, 0);

	// pipeline_id filter
	const none = await get(mgr, `/v1/dashboard/pipeline-stages?pipeline_id=${randomUUID()}`);
	assert.deepEqual(none.pipelines, []);
	// an archived empty stage is hidden, an archived stage that still holds deals stays
	await admin.query("UPDATE crm.stage SET archived=true WHERE tenant_id=$1 AND id IN ($2,$3)", [A, f.ids.qualified, STAGE_LOST]);
	await admin.query("DELETE FROM crm.deal WHERE tenant_id=$1 AND stage_id=$2", [A, f.ids.qualified]);
	const arch = stageMap(await get(mgr, `/v1/dashboard/pipeline-stages?pipeline_id=${f.ids.pipeline}`));
	assert.equal(arch[f.ids.qualified], undefined);
	assert.equal(arch[STAGE_LOST].deal_count, 1);
});

test("leads-breakdown: source x status, top-20 plus other, rep scope, isolation", async () => {
	await fresh();
	const A = f.ids.a;
	await lead(A, f.ids.manager, "web", "open");
	await lead(A, repId, "web", "open");
	await lead(A, repId, "web", "qualified");
	await lead(A, f.ids.manager, "ads", "closed");
	for (let i = 0; i < 22; i++) await lead(A, f.ids.manager, `bulk-${String(i).padStart(2, "0")}`, "open");
	await lead(f.ids.b, f.ids.agency, "web", "open");

	const d = await get(mgr, "/v1/dashboard/leads-breakdown");
	assert.equal(d.total, 26);
	assert.deepEqual(d.by_status, { open: 24, qualified: 1, closed: 1 });
	assert.equal(d.sources.length, 20);
	assert.deepEqual(d.sources[0], { source: "web", open: 2, qualified: 1, closed: 0, total: 3 });
	assert.deepEqual(d.sources[1], { source: "ads", open: 0, qualified: 0, closed: 1, total: 1 });
	assert.deepEqual(d.sources[19].source, "bulk-17");
	assert.deepEqual(d.other, { source_count: 4, open: 4, qualified: 0, closed: 0, total: 4 });
	assert.equal(d.sources.reduce((n: number, s: { total: number }) => n + s.total, 0) + d.other.total, d.total, "nothing lost between top and other");

	const r = await get(rep, "/v1/dashboard/leads-breakdown");
	assert.equal(r.scope, "assigned");
	assert.equal(r.total, 2);
	assert.deepEqual(r.sources, [{ source: "web", open: 1, qualified: 1, closed: 0, total: 2 }]);
	assert.equal(r.other, null);

	const b = await get(mgrB, "/v1/dashboard/leads-breakdown");
	assert.deepEqual([b.total, b.sources], [1, [{ source: "web", open: 1, qualified: 0, closed: 0, total: 1 }]]);
});

test("deals-outcomes: won/lost per bucket, tenant timezone, week buckets, rep scope", async () => {
	await fresh();
	await outcomeStages();
	const A = f.ids.a;
	const dEdge = await deal(A, f.ids.won, f.ids.manager, 5000, "EGP", edge);
	await transitionInto(A, dEdge, f.ids.won, edge);
	const dLost = await deal(A, STAGE_LOST, repId, 300, "EGP", day(-1, 15));
	await transitionInto(A, dLost, STAGE_LOST, day(-1, 15));
	const dOld = await deal(A, f.ids.won, repId, 700, "USD", day(-2, 15));
	await transitionInto(A, dOld, f.ids.won, day(-2, 15));
	// reopened then won again: only the latest transition into the current stage counts, once
	await transitionInto(A, dOld, f.ids.won, day(-2, 15), 0);
	// no transition recorded: falls back to updated_at
	await deal(A, f.ids.won, f.ids.manager, 100, "EGP", day(-2, 16));
	// open deals never count; tenant B's won deal never leaks
	await deal(A, f.ids.start, f.ids.manager, 123456, "EGP", day(-1, 5));
	const dB = await deal(f.ids.b, f.ids.won, f.ids.agency, 777, "EGP", day(-2, 15));
	await admin.query("UPDATE crm.stage SET outcome='won' WHERE tenant_id=$1 AND id=$2", [f.ids.b, f.ids.won]);
	assert.ok(dB);

	const q = "/v1/dashboard/deals-outcomes?bucket=month&periods=100";
	const u = await get(mgr, q);
	assert.equal(u.tz, "UTC");
	assert.equal(u.buckets.length, 100, "zero-filled continuous series");
	assert.equal(u.buckets[99].start, monthStart(0));
	assert.equal(u.buckets[0].start, monthStart(-99));
	assert.equal(u.from, u.buckets[0].start);
	assert.equal(u.to, u.buckets[99].end);
	for (let i = 1; i < u.buckets.length; i++) assert.equal(u.buckets[i].start, u.buckets[i - 1].end, "buckets are contiguous");
	// biome-ignore lint/suspicious/noExplicitAny: loosely typed JSON in a test helper
	const at = (d: any, start: string) => d.buckets.find((b: { start: string }) => b.start === start);
	assert.deepEqual(at(u, monthStart(-2)).won, { count: 2, totals: [{ currency: "EGP", amount_minor: "100" }, { currency: "USD", amount_minor: "700" }] });
	assert.deepEqual(at(u, monthStart(-2)).lost, { count: 0, totals: [] });
	assert.deepEqual(at(u, monthStart(-1)).won, { count: 1, totals: [{ currency: "EGP", amount_minor: "5000" }] });
	assert.deepEqual(at(u, monthStart(-1)).lost, { count: 1, totals: [{ currency: "EGP", amount_minor: "300" }] });
	assert.deepEqual(at(u, monthStart(0)).won, { count: 0, totals: [] });
	const wonTotal = u.buckets.reduce((n: number, b: { won: { count: number } }) => n + b.won.count, 0);
	assert.equal(wonTotal, 3, "open deals and tenant B excluded");

	// tenant timezone moves the edge deal across the month boundary
	const c = await get(mgr, `${q}&tz=Africa/Cairo`);
	assert.equal(c.tz, "Africa/Cairo");
	assert.equal(at(c, monthStart(-1)).won.count, 0);
	assert.deepEqual(at(c, monthStart(0)).won, { count: 1, totals: [{ currency: "EGP", amount_minor: "5000" }] });
	assert.equal(at(c, monthStart(-1)).lost.count, 1);

	// ISO week buckets (Monday start)
	const w = await get(mgr, "/v1/dashboard/deals-outcomes?bucket=week&periods=104");
	assert.equal(w.buckets.length, 104);
	assert.equal(w.buckets[103].start, mondayOf(now));
	assert.equal(at(w, mondayOf(day(-1, 15))).lost.count, 1);
	assert.equal(w.buckets.reduce((n: number, b: { lost: { count: number } }) => n + b.lost.count, 0), 1);

	// rep: only own closed deals
	const r = await get(rep, q);
	assert.equal(r.scope, "assigned");
	assert.deepEqual(at(r, monthStart(-2)).won, { count: 1, totals: [{ currency: "USD", amount_minor: "700" }] });
	assert.equal(at(r, monthStart(-1)).won.count, 0);
	assert.equal(at(r, monthStart(-1)).lost.count, 1);

	// tenant B: its own won deal only
	const b = await get(mgrB, q);
	assert.deepEqual(at(b, monthStart(-2)).won, { count: 1, totals: [{ currency: "EGP", amount_minor: "777" }] });
	assert.equal(b.buckets.reduce((n: number, x: { won: { count: number } }) => n + x.won.count, 0), 1);
});

test("tasks-due: overdue / next 24h / 7 local days / later partition open tasks; timezone moves today", async () => {
	await fresh();
	const A = f.ids.a;
	await task(A, f.ids.manager, hours(-2));
	await task(A, repId, hours(-72));
	await task(A, f.ids.manager, hours(2));
	await task(A, repId, hours(30));
	await task(A, f.ids.manager, hours(24 * 10));
	await task(A, f.ids.manager, hours(-5), "completed", undefined, hours(-4)); // completed tasks are not open work
	await task(f.ids.b, f.ids.agency, hours(-1)); // other tenant

	const d = await get(mgr, "/v1/dashboard/tasks-due");
	assert.equal(d.open_total, 5);
	assert.equal(d.overdue, 2);
	assert.equal(d.next_24h, 1);
	assert.equal(d.days.length, 7);
	assert.equal(d.days[0].date, d.today);
	assert.match(d.today, /^\d{4}-\d{2}-\d{2}$/);
	const inDays = d.days.reduce((n: number, x: { count: number }) => n + x.count, 0);
	assert.equal(inDays, 2);
	assert.equal(d.later, 1);
	assert.equal(d.overdue + inDays + d.later, d.open_total, "the buckets partition the open tasks");

	const r = await get(rep, "/v1/dashboard/tasks-due");
	assert.deepEqual([r.scope, r.open_total, r.overdue, r.next_24h, r.later], ["assigned", 2, 1, 0, 0]);

	const b = await get(mgrB, "/v1/dashboard/tasks-due");
	assert.deepEqual([b.open_total, b.overdue], [1, 1]);

	const east = await get(mgr, "/v1/dashboard/tasks-due?tz=Pacific/Kiritimati");
	const west = await get(mgr, "/v1/dashboard/tasks-due?tz=Etc/GMT%2B12");
	assert.notEqual(east.today, west.today, "26 hours apart: always different local dates");
	assert.equal(east.overdue, 2);
	assert.equal(west.open_total, 5);
});

test("activity: records created and tasks completed per bucket, merged contacts excluded, rep scope, isolation", async () => {
	await fresh();
	const A = f.ids.a;
	const c1 = day(-2, 10),
		c2 = day(-2, 11);
	for (const [owner, at] of [[f.ids.manager, c1], [repId, c2]] as const)
		await admin.query("INSERT INTO crm.contact(tenant_id,id,display_name,owner_id,created_at) VALUES($1,$2,'c',$3,$4)", [A, randomUUID(), owner, at.toISOString()]);
	await admin.query("INSERT INTO crm.contact(tenant_id,id,display_name,owner_id,created_at,merged_into_id) VALUES($1,$2,'m',$3,$4,$5)", [A, randomUUID(), f.ids.manager, c1.toISOString(), f.ids.contact]);
	await lead(A, f.ids.manager, "web", "open", day(-2, 10));
	await lead(A, repId, "web", "open", day(-2, 12));
	await lead(A, repId, "web", "open", day(-1, 12));
	await deal(A, f.ids.start, f.ids.manager, 1, "EGP", undefined, day(-2, 10));
	await deal(A, f.ids.start, repId, 1, "EGP", undefined, day(-2, 11));
	await task(A, f.ids.manager, day(-2, 20), "open", day(-2, 10));
	await task(A, repId, day(-2, 20), "completed", day(-2, 10), day(-1, 10));
	await task(A, repId, day(-2, 20), "open", day(-2, 10));
	await admin.query("INSERT INTO crm.contact(tenant_id,id,display_name,owner_id,created_at) VALUES($1,$2,'b',$3,$4)", [f.ids.b, randomUUID(), f.ids.agency, c1.toISOString()]);

	const q = "/v1/dashboard/activity?bucket=month&periods=6";
	const d = await get(mgr, q);
	assert.equal(d.buckets.length, 6);
	assert.equal(d.buckets[5].start, monthStart(0));
	// biome-ignore lint/suspicious/noExplicitAny: loosely typed JSON in a test helper
	const at = (x: any, start: string) => x.buckets.find((b: { start: string }) => b.start === start);
	assert.deepEqual(
		{ ...at(d, monthStart(-2)), start: undefined, end: undefined },
		{ start: undefined, end: undefined, contacts_created: 2, leads_created: 2, deals_created: 2, tasks_created: 3, tasks_completed: 0 },
	);
	assert.deepEqual(
		{ ...at(d, monthStart(-1)), start: undefined, end: undefined },
		{ start: undefined, end: undefined, contacts_created: 0, leads_created: 1, deals_created: 0, tasks_created: 0, tasks_completed: 1 },
	);
	// the seed's own owner-less contact and manager deal were created "now"
	assert.deepEqual([at(d, monthStart(0)).contacts_created, at(d, monthStart(0)).deals_created], [1, 1]);

	const r = await get(rep, q);
	assert.equal(r.scope, "assigned");
	assert.deepEqual(
		{ ...at(r, monthStart(-2)), start: undefined, end: undefined },
		{ start: undefined, end: undefined, contacts_created: 1, leads_created: 1, deals_created: 1, tasks_created: 2, tasks_completed: 0 },
	);
	assert.equal(at(r, monthStart(-1)).tasks_completed, 1);
	assert.equal(at(r, monthStart(0)).contacts_created, 0, "owner-less seed contact is outside the rep's scope");

	const b = await get(mgrB, q);
	assert.equal(at(b, monthStart(-2)).contacts_created, 1);
	assert.equal(at(b, monthStart(-2)).leads_created, 0);

	const w = await get(mgr, "/v1/dashboard/activity?bucket=week&periods=3&tz=Africa/Cairo");
	assert.equal(w.buckets.length, 3);
	assert.equal(w.buckets[2].start, w.buckets[1].end);
});

test("permission denial, tenant mismatch and validation", async () => {
	await fresh();
	const urls = ["pipeline-stages", "leads-breakdown", "deals-outcomes", "tasks-due", "activity"].map((p) => `/v1/dashboard/${p}`);
	for (const url of urls) {
		assert.equal((await call(worker, url)).status, 403, `worker (no crm.read): ${url}`);
		assert.equal((await call(nobody, url)).status, 403, `no membership: ${url}`);
		assert.equal((await call(mgrB, url)).status, 200, `own tenant: ${url}`);
		assert.equal((await call({ tenant: f.ids.a, token: mgrB.token }, url)).status, 403, `B manager against tenant A: ${url}`);
		assert.equal((await call({ tenant: f.ids.a, token: "bad" }, url)).status, 401, `bad token: ${url}`);
		const g = await call(mgr, url, "GET", { "x-grant-id": f.ids.grant });
		assert.equal(g.status, 403, `agency grant yields no list scope: ${url}`);
	}
	const denied = await call(worker, urls[0]);
	assert.equal(denied.body.code, "FORBIDDEN");
	assert.equal(JSON.stringify(denied.body).includes("Tenant"), false, "no data in the denial");

	const bad = [
		"/v1/dashboard/deals-outcomes?bucket=day",
		"/v1/dashboard/deals-outcomes?periods=0",
		"/v1/dashboard/deals-outcomes?periods=105",
		"/v1/dashboard/deals-outcomes?periods=1.5",
		"/v1/dashboard/deals-outcomes?periods=-1",
		"/v1/dashboard/deals-outcomes?tz=Not/AZone",
		"/v1/dashboard/deals-outcomes?tz=EST5EDT%27%3B--",
		"/v1/dashboard/deals-outcomes?unknown=1",
		"/v1/dashboard/deals-outcomes?bucket=week&bucket=month",
		"/v1/dashboard/activity?periods=abc",
		"/v1/dashboard/activity?tz=Not/AZone",
		"/v1/dashboard/tasks-due?tz=Mars/Base",
		"/v1/dashboard/tasks-due?bucket=week",
		"/v1/dashboard/pipeline-stages?pipeline_id=nope",
		"/v1/dashboard/leads-breakdown?limit=5",
	];
	for (const url of bad) {
		const r = await call(mgr, url);
		assert.equal(r.status, 422, `${url}: ${j(r.body)}`);
		assert.equal(r.body.code, "VALIDATION_FAILED");
	}
	assert.equal((await call(mgr, "/v1/dashboard/nope")).status, 404);
	assert.equal((await call(mgr, urls[0], "POST")).status, 404, "read-only");
	// extremes still work
	assert.equal((await call(mgr, "/v1/dashboard/deals-outcomes?periods=1&bucket=week")).status, 200);
	assert.equal((await call(mgr, "/v1/dashboard/activity?periods=104")).status, 200);
	assert.equal((await call(reader, urls[4])).status, 200);
});
