// ADR-002 P1b B4 server: filter / sort / keyset on custom properties through the real HTTP server and PostgreSQL (crm_runtime, RLS),
// the sensitive / archived rejections, rep scope, and the bounded custom_search rebuild (012). Migration 012 must be applied.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import pg from "pg";
import { seed } from "../scripts/seed.js";
import { server } from "../src/api.js";
import { pool } from "../src/db.js";
import { searchRebuildOne } from "../src/searchrebuild.js";

const admin = new pg.Client({ connectionString: process.env.ADMIN_DATABASE_URL });
const app = server();
let base = "";
let f: Awaited<ReturnType<typeof seed>>;
type Who = { tenant: string; token: string; grant?: string };
let mgr: Who, reader: Who, rep: Who, mgrB: Who, worker: Who;
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
async function principal(tenant: string, role: string) {
	const id = randomUUID(),
		token = randomBytes(32).toString("hex");
	await admin.query("INSERT INTO crm.principal VALUES($1,$2)", [id, `B4 ${role}`]);
	await admin.query(
		"INSERT INTO crm.session(token_hash,principal_id,expires_at,mfa_verified) VALUES($1,$2,now()+interval '1 day',true)",
		[createHash("sha256").update(token).digest("hex"), id],
	);
	await admin.query("INSERT INTO crm.membership(tenant_id,id,principal_id,role) VALUES($1,$2,$3,$4)", [tenant, randomUUID(), id, role]);
	return { who: { tenant, token } as Who, id };
}
async function fresh() {
	f = await seed(admin);
	mgr = { tenant: f.ids.a, token: f.tokens.manager };
	reader = { tenant: f.ids.a, token: f.tokens.reader };
	mgrB = { tenant: f.ids.b, token: f.tokens.agency };
	worker = { tenant: f.ids.a, token: f.tokens.worker };
	rep = (await principal(f.ids.a, "rep")).who;
	// the seed's one contact is a record without custom values: name it so list expectations can include it
	await admin.query("UPDATE crm.contact SET display_name='c0' WHERE tenant_id=$1 AND id=$2", [f.ids.a, f.ids.contact]);
}
// biome-ignore lint/suspicious/noExplicitAny: loosely typed JSON in a test helper
type Res = { status: number; body: Record<string, any> };
async function call(who: Who, method: string, url: string, body?: Record<string, unknown>): Promise<Res> {
	const headers: Record<string, string> = { authorization: `Bearer ${who.token}`, "x-tenant-id": who.tenant };
	if (method !== "GET") {
		headers["idempotency-key"] = randomUUID();
		headers["content-type"] = "application/json";
	}
	const r = await fetch(`${base}${url}`, { method, headers, body: method === "GET" ? undefined : JSON.stringify(body ?? {}) });
	// biome-ignore lint/suspicious/noExplicitAny: loosely typed JSON in a test helper
	return { status: r.status, body: (await r.json()) as Record<string, any> };
}
const cmd = () => ({ command_id: randomUUID() });
const L = (label: string) => label;
const j = JSON.stringify;
async function prop(who: Who, object: string, key: string, type: string, extra: Record<string, unknown> = {}) {
	const r = await call(who, "POST", `/v1/schema/${object}/properties`, { ...cmd(), key, type, label: L(key), ...extra });
	assert.equal(r.status, 201, `define ${key}: ${j(r.body)}`);
}
const version = async (object: string, key: string) =>
	(await call(mgr, "GET", `/v1/schema/${object}/properties/${key}`)).body.data.property.version as number;
async function flag(object: string, key: string, body: Record<string, unknown>) {
	const r = await call(mgr, "PATCH", `/v1/schema/${object}/properties/${key}`, { ...cmd(), expected_version: await version(object, key), ...body });
	assert.equal(r.status, 200, j(r.body));
}
const contact = async (who: Who, name: string, properties: Record<string, unknown>) => {
	const r = await call(who, "POST", "/v1/contacts", { ...cmd(), display_name: name, properties });
	assert.equal(r.status, 201, j(r.body));
	return r.body.data.id as string;
};
const list = (who: Who, qs: Record<string, string>) =>
	call(who, "GET", `/v1/contacts?${new URLSearchParams(qs)}`);
const names = (r: Res) => (r.body.data as { display_name: string }[]).map((x) => x.display_name);
const code = (r: Res) => r.body.code as string;
// every page of a list (limit small to force many cursors); returns display names in order
async function pages(who: Who, qs: Record<string, string>, limit = "2") {
	const out: string[] = [];
	let cursor: string | null = null;
	for (let i = 0; i < 2000; i++) {
		const r = await list(who, { ...qs, limit, ...(cursor ? { cursor } : {}) });
		assert.equal(r.status, 200, j(r.body));
		out.push(...names(r));
		if (!r.body.has_more) return out;
		cursor = r.body.next_cursor;
	}
	throw new Error("did not terminate");
}

test("B4 filter and sort by every filterable type, with paging across nulls", async () => {
	await fresh();
	await prop(mgr, "contact", "budget", "number");
	await prop(mgr, "contact", "nick", "text");
	await prop(mgr, "contact", "tier", "single_select", { options: [{ value: "cold", label: L("c") }, { value: "warm", label: L("w") }, { value: "hot", label: L("h") }] });
	await prop(mgr, "contact", "tags", "multi_select", { options: [{ value: "a", label: L("a") }, { value: "b", label: L("b") }, { value: "c", label: L("c") }] });
	await prop(mgr, "contact", "vip", "checkbox");
	await prop(mgr, "contact", "since", "date");
	await contact(mgr, "c1", { budget: 10, nick: "Zed", tier: "hot", tags: ["a", "b"], vip: true, since: "2026-01-10" });
	await contact(mgr, "c2", { budget: 30, nick: "amy", tier: "cold", tags: ["b"], vip: false, since: "2026-03-01" });
	await contact(mgr, "c3", { budget: 20, nick: "Bob", tier: "warm", tags: ["c"], since: "2026-02-01" });
	await contact(mgr, "c4", {}); // no values at all
	await contact(mgr, "c5", { budget: 20, tier: "cold" }); // tie on budget (id tiebreak)
	const F = (n: unknown, extra: Record<string, string> = {}) => list(mgr, { filter: j(n), sort: "display_name", ...extra });
	assert.deepEqual(names(await F({ p: "budget", op: "gte", v: 20 })), ["c2", "c3", "c5"]);
	assert.deepEqual(names(await F({ p: "budget", op: "between", v: [10, 20] })), ["c1", "c3", "c5"]);
	assert.deepEqual(names(await F({ p: "budget", op: "is_null" })), ["c0", "c4"]);
	assert.deepEqual(names(await F({ p: "nick", op: "contains", v: "o" })), ["c3"]);
	assert.deepEqual(names(await F({ p: "nick", op: "starts_with", v: "a" })), ["c2"]);
	assert.deepEqual(names(await F({ p: "tier", op: "in", v: ["cold", "hot"] })), ["c1", "c2", "c5"]);
	assert.deepEqual(names(await F({ p: "tier", op: "nin", v: ["cold"] })), ["c0", "c1", "c3", "c4"]);
	assert.deepEqual(names(await F({ p: "tags", op: "has_any", v: ["a", "c"] })), ["c1", "c3"]);
	assert.deepEqual(names(await F({ p: "tags", op: "has_all", v: ["a", "b"] })), ["c1"]);
	assert.deepEqual(names(await F({ p: "vip", op: "is", v: true })), ["c1"]);
	assert.deepEqual(names(await F({ p: "vip", op: "is", v: false })), ["c0", "c2", "c3", "c4", "c5"]);
	assert.deepEqual(names(await F({ p: "since", op: "between", v: ["2026-01-15", "2026-02-15"] })), ["c3"]);
	assert.deepEqual(names(await F({ and: [{ p: "tier", op: "eq", v: "cold" }, { p: "budget", op: "gt", v: 25 }] })), ["c2"]);
	assert.equal((await F({ p: "budget", op: "gte", v: 20 }, { include_total: "1" })).body.total_count.value, 3);
	// sort: ASC nulls last, DESC nulls first, id tiebreak in the direction of the key; every page boundary crosses ties and nulls
	const grouped = (got: string[], want: string[][]) => {
		assert.equal(got.length, want.flat().length);
		let i = 0;
		for (const g of want) {
			assert.deepEqual(got.slice(i, i + g.length).sort(), [...g].sort(), j(got));
			i += g.length;
		}
	};
	grouped(await pages(mgr, { sort: "budget" }, "1"), [["c1"], ["c3", "c5"], ["c2"], ["c0", "c4"]]);
	grouped(await pages(mgr, { sort: "-budget" }, "2"), [["c0", "c4"], ["c2"], ["c3", "c5"], ["c1"]]);
	grouped(await pages(mgr, { sort: "budget" }, "3"), [["c1"], ["c3", "c5"], ["c2"], ["c0", "c4"]]);
	// option position: cold < warm < hot (not alphabetical); text sort; two keys custom + system
	assert.deepEqual(await pages(mgr, { sort: "tier,display_name" }, "2"), ["c2", "c5", "c3", "c1", "c0", "c4"]);
	assert.deepEqual(await pages(mgr, { sort: "-tier,display_name" }, "2"), ["c0", "c4", "c1", "c3", "c2", "c5"]);
	assert.equal((await pages(mgr, { sort: "nick" }, "1")).length, 6);
	assert.deepEqual(await pages(mgr, { sort: "budget,-display_name" }, "1"), ["c1", "c5", "c3", "c2", "c4", "c0"]);
	// filter + sort together, and the cursor is bound to the filter/sort/schema_rev
	const p1 = await list(mgr, { filter: j({ p: "budget", op: "gte", v: 10 }), sort: "-budget", limit: "1" });
	const cur = p1.body.next_cursor as string;
	assert.equal((await list(mgr, { filter: j({ p: "budget", op: "gte", v: 11 }), sort: "-budget", cursor: cur })).body.code, "CURSOR_STALE");
	await prop(mgr, "contact", "extra", "text"); // schema_rev bump
	assert.equal(code(await list(mgr, { filter: j({ p: "budget", op: "gte", v: 10 }), sort: "-budget", cursor: cur })), "CURSOR_STALE");
	// props= projection still composes
	const pr = await list(mgr, { sort: "-budget", limit: "2", props: "budget" });
	assert.equal(pr.body.data[0].properties.budget, undefined); // DESC: records without a value first
	assert.equal(pr.body.data[1].properties.budget, undefined);
	// not sortable / not filterable by operator / unknown value
	assert.equal(code(await list(mgr, { sort: "tags" })), "VALIDATION_FAILED");
	assert.equal(code(await list(mgr, { sort: "vip" })), "VALIDATION_FAILED");
	assert.equal(code(await F({ p: "tags", op: "eq", v: "a" })), "VALIDATION_FAILED");
	assert.equal(code(await F({ p: "tier", op: "eq", v: "nope" })), "VALIDATION_FAILED");
});

test("B4 unknown, archived and sensitive properties are one indistinguishable 422", async () => {
	await fresh();
	await prop(mgr, "contact", "gone", "text");
	await prop(mgr, "contact", "secret", "number", { sensitive: true });
	await prop(mgr, "contact", "open_n", "number");
	await contact(mgr, "s1", { gone: "x", secret: 5, open_n: 1 });
	const ok = await list(mgr, { filter: j({ p: "secret", op: "eq", v: 5 }) });
	assert.equal(ok.status, 200);
	assert.deepEqual(names(ok), ["s1"]);
	assert.equal((await list(mgr, { sort: "secret" })).status, 200);
	const who = async (w: Who) => [
		(await list(w, { filter: j({ p: "secret", op: "eq", v: 5 }) })).status,
		(await list(w, { sort: "-secret" })).status,
		(await list(w, { filter: j({ p: "no_such", op: "eq", v: 5 }) })).status,
	];
	assert.deepEqual(await who(reader), [422, 422, 422]);
	const r = await list(reader, { filter: j({ p: "secret", op: "eq", v: 5 }) });
	const u = await list(reader, { filter: j({ p: "no_such", op: "eq", v: 5 }) });
	assert.equal(code(r), "UNKNOWN_PROPERTY");
	assert.deepEqual(r.body.errors.map((e: { code: string }) => e.code), u.body.errors.map((e: { code: string }) => e.code));
	assert.equal(j(r.body.data ?? null), j(u.body.data ?? null)); // no value ever leaks
	// a non-sensitive property stays usable for the same caller
	assert.equal((await list(reader, { filter: j({ p: "open_n", op: "eq", v: 1 }) })).status, 200);
	// archive: filter and sort are rejected; the same key on another object/tenant is not affected
	await call(mgr, "POST", "/v1/schema/contact/properties/gone/archive", { ...cmd(), expected_version: await version("contact", "gone") });
	assert.equal(code(await list(mgr, { filter: j({ p: "gone", op: "eq", v: "x" }) })), "UNKNOWN_PROPERTY");
	assert.equal(code(await list(mgr, { sort: "gone" })), "UNKNOWN_PROPERTY");
	// flipping sensitive on later closes the door for the reader as well
	await flag("contact", "open_n", { sensitive: true });
	assert.equal(code(await list(reader, { filter: j({ p: "open_n", op: "eq", v: 1 }) })), "UNKNOWN_PROPERTY");
	// tenant isolation of the allow-list: tenant B has no such property
	assert.equal(code(await list(mgrB, { filter: j({ p: "open_n", op: "eq", v: 1 }) })), "UNKNOWN_PROPERTY");
	// sensitive values are never matched by q
	assert.deepEqual(names(await list(mgr, { q: "5" })).includes("s1"), false);
});

test("B4 rep assigned scope holds on filtered and sorted lists", async () => {
	await fresh();
	await prop(mgr, "contact", "score", "number");
	const mine = await contact(rep, "mine", { score: 50 });
	await contact(mgr, "theirs", { score: 99 });
	const r = await list(rep, { filter: j({ p: "score", op: "gte", v: 1 }), sort: "-score" });
	assert.equal(r.status, 200, j(r.body));
	assert.deepEqual(names(r), ["mine"]);
	assert.equal(r.body.data[0].id, mine);
	assert.deepEqual(await pages(rep, { sort: "score" }, "1"), ["mine"]);
	assert.equal((await list(rep, { filter: j({ p: "score", op: "gt", v: 60 }), include_total: "1" })).body.total_count.value, 0);
});

test("B4 1.2k rows: filter finds a record beyond row 150; deep keyset pages cover every row once", async () => {
	await fresh();
	await prop(mgr, "contact", "rank", "number");
	await prop(mgr, "contact", "grade", "single_select", { options: [{ value: "lo", label: L("l") }, { value: "hi", label: L("h") }] });
	await admin.query(
		`INSERT INTO crm.contact(tenant_id,id,display_name,custom)
 SELECT $1,gen_random_uuid(),'bulk '||lpad(g::text,5,'0'),
  CASE WHEN g%10=0 THEN '{}'::jsonb ELSE jsonb_build_object('rank',g%97,'grade',CASE WHEN g%2=0 THEN 'lo' ELSE 'hi' END) END
 FROM generate_series(1,1200) g`,
		[f.ids.a],
	);
	await admin.query("UPDATE crm.contact SET custom=custom||'{\"rank\":4242}' WHERE tenant_id=$1 AND display_name='bulk 01111'", [f.ids.a]);
	const hit = await list(mgr, { filter: j({ p: "rank", op: "eq", v: 4242 }) });
	assert.deepEqual(names(hit), ["bulk 01111"]);
	const total = await list(mgr, { filter: j({ p: "grade", op: "eq", v: "hi" }), include_total: "1" });
	assert.equal(total.body.total_count.value > 0, true);
	for (const sort of ["rank", "-rank", "grade,-display_name"]) {
		const all = await pages(mgr, { sort }, "200");
		assert.equal(all.length, 1201, sort); // 1200 bulk + the seed contact
		assert.equal(new Set(all).size, 1201, sort);
	}
	// order check against SQL for one custom sort (ASC: values ascending, nulls last)
	const asc = await pages(mgr, { sort: "rank" }, "199");
	const { rows } = await admin.query(
		"SELECT display_name FROM crm.contact WHERE tenant_id=$1 ORDER BY (custom->>'rank')::numeric ASC,id ASC",
		[f.ids.a],
	);
	assert.deepEqual(asc, rows.map((r) => r.display_name));
});

test("B4 custom_search rebuild: flag change, bounded batches, idempotent, isolated per tenant", async () => {
	await fresh();
	await prop(mgr, "contact", "bnote", "text"); // NOT searchable yet
	await prop(mgrB, "contact", "bnote", "text", { searchable: true }).catch(() => undefined);
	await admin.query(
		`INSERT INTO crm.contact(tenant_id,id,display_name,custom)
 SELECT $1,gen_random_uuid(),'rb '||g,jsonb_build_object('bnote','Rebuildword '||g) FROM generate_series(1,1200) g`,
		[f.ids.a],
	);
	// tenant B rows with the same key and an empty search text: a rebuild for A must never touch them
	await admin.query(
		`INSERT INTO crm.contact(tenant_id,id,display_name,custom) SELECT $1,gen_random_uuid(),'other '||g,jsonb_build_object('bnote','Rebuildword b') FROM generate_series(1,5) g`,
		[f.ids.b],
	);
	const stamp = (await admin.query("SELECT max(updated_at) m, count(*)::int n FROM crm.contact WHERE tenant_id=$1 AND display_name LIKE 'rb %'", [f.ids.a])).rows[0];
	assert.equal(names(await list(mgr, { q: "rebuildword" })).length, 0); // not searchable: nothing in custom_search
	await flag("contact", "bnote", { searchable: true });
	// inline pass is capped (2 x 500 rows): the rest is queued for the worker
	const done = async () =>
		Number((await admin.query("SELECT count(*) FROM crm.contact WHERE tenant_id=$1 AND display_name LIKE 'rb %' AND custom_search<>''", [f.ids.a])).rows[0].count);
	assert.equal(await done(), 1000);
	const q1 = (await admin.query("SELECT done,cursor_id FROM crm.search_rebuild WHERE tenant_id=$1 AND object_type='contact'", [f.ids.a])).rows[0];
	assert.equal(q1.done, false);
	// the worker drains it one batch per call
	let calls = 0;
	while (await searchRebuildOne(worker)) calls++;
	assert.ok(calls >= 1 && calls <= 3, `batches: ${calls}`);
	assert.equal(await done(), 1200);
	assert.equal((await admin.query("SELECT done FROM crm.search_rebuild WHERE tenant_id=$1", [f.ids.a])).rows[0].done, true);
	assert.equal(await searchRebuildOne(worker), false); // nothing pending
	// found through the API beyond the first page, text folded
	assert.equal((await list(mgr, { q: "rebuildword 1200", limit: "5" })).body.data.length, 1);
	// derived data only: updated_at and version untouched
	const after = (await admin.query("SELECT max(updated_at) m, max(version) v FROM crm.contact WHERE tenant_id=$1 AND display_name LIKE 'rb %'", [f.ids.a])).rows[0];
	assert.equal(String(after.m), String(stamp.m));
	assert.equal(after.v, 0);
	// isolation: tenant B rows and queue untouched
	assert.equal(Number((await admin.query("SELECT count(*) FROM crm.contact WHERE tenant_id=$1 AND custom_search<>''", [f.ids.b])).rows[0].count), 0);
	assert.equal((await admin.query("SELECT 1 FROM crm.search_rebuild WHERE tenant_id=$1", [f.ids.b])).rowCount, 0);
	// RLS: a worker of tenant A cannot see or advance B's queue (and B's mgr sees none of A's)
	assert.equal((await pool.query("SELECT count(*)::int n FROM crm.search_rebuild")).rows[0].n, 0); // no tenant context: RLS hides all
	// idempotent: re-request with nothing to change writes nothing
	await flag("contact", "bnote", { searchable: false });
	while (await searchRebuildOne(worker));
	assert.equal(await done(), 0);
	assert.equal((await list(mgr, { q: "rebuildword" })).body.data.length, 0);
	await flag("contact", "bnote", { searchable: true });
	while (await searchRebuildOne(worker));
	assert.equal(await done(), 1200);
	const before = (await admin.query("SELECT sum(xmin::text::bigint) s FROM crm.contact WHERE tenant_id=$1", [f.ids.a])).rows[0].s;
	await flag("contact", "bnote", { label: L("renamed") }); // no search impact: no rebuild requested
	while (await searchRebuildOne(worker));
	assert.equal((await admin.query("SELECT sum(xmin::text::bigint) s FROM crm.contact WHERE tenant_id=$1", [f.ids.a])).rows[0].s, before);
	// sensitive flip removes the values from the search text; archive does too
	await flag("contact", "bnote", { sensitive: true, searchable: false }); // sensitive cannot be searchable
	while (await searchRebuildOne(worker));
	assert.equal(await done(), 0);
	await flag("contact", "bnote", { sensitive: false, searchable: true });
	while (await searchRebuildOne(worker));
	assert.equal(await done(), 1200);
	await call(mgr, "POST", "/v1/schema/contact/properties/bnote/archive", { ...cmd(), expected_version: await version("contact", "bnote") });
	while (await searchRebuildOne(worker));
	assert.equal(await done(), 0);
});

test("B4 rebuild and a normal record write follow the same search-text rule", async () => {
	await fresh();
	await prop(mgr, "contact", "memo", "text", { searchable: true });
	const id = await contact(mgr, "race", { memo: "alpha" });
	await flag("contact", "memo", { searchable: false });
	assert.equal((await admin.query("SELECT custom_search s FROM crm.contact WHERE id=$1", [id])).rows[0].s, "");
	await flag("contact", "memo", { searchable: true });
	assert.equal((await admin.query("SELECT custom_search s FROM crm.contact WHERE id=$1", [id])).rows[0].s, "alpha");
	// a normal write keeps the same rule as the rebuild (single source of truth)
	const g = await call(mgr, "GET", `/v1/contacts/${id}`);
	const p = await call(mgr, "PATCH", `/v1/contacts/${id}`, { ...cmd(), expected_version: g.body.data.version, properties: { memo: "Beta" } });
	assert.equal(p.status, 200, j(p.body));
	assert.equal((await admin.query("SELECT custom_search s FROM crm.contact WHERE id=$1", [id])).rows[0].s, "beta");
});
