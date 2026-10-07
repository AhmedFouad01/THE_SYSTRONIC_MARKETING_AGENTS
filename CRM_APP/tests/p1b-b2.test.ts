// ADR-002 P1b B2 (migration 011 + src/schema.ts): schema API over the real HTTP server and real PostgreSQL (crm_runtime, RLS).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import pg from "pg";
import { seed } from "../scripts/seed.js";
import { server } from "../src/api.js";
import { pool } from "../src/db.js";

const admin = new pg.Client({
	connectionString: process.env.ADMIN_DATABASE_URL,
});
const app = server();
let base = "";
let f: Awaited<ReturnType<typeof seed>>;
type Who = { tenant: string; token: string; grant?: string };
let mgr: Who, reader: Who, rep: Who, agencyGrant: Who, agencyNoGrant: Who, worker: Who, mgrB: Who, noMfa: Who;
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
async function principal(tenant: string, role: string, mfa: boolean) {
	const id = randomUUID(),
		token = randomBytes(32).toString("hex");
	await admin.query("INSERT INTO crm.principal VALUES($1,$2)", [id, `B2 ${role}`]);
	await admin.query(
		"INSERT INTO crm.session(token_hash,principal_id,expires_at,mfa_verified) VALUES($1,$2,now()+interval '1 day',$3)",
		[createHash("sha256").update(token).digest("hex"), id, mfa],
	);
	await admin.query(
		"INSERT INTO crm.membership(tenant_id,id,principal_id,role) VALUES($1,$2,$3,$4)",
		[tenant, randomUUID(), id, role],
	);
	return { tenant, token };
}
async function fresh() {
	f = await seed(admin);
	mgr = { tenant: f.ids.a, token: f.tokens.manager };
	reader = { tenant: f.ids.a, token: f.tokens.reader };
	agencyGrant = { tenant: f.ids.a, token: f.tokens.agency, grant: f.ids.grant };
	agencyNoGrant = { tenant: f.ids.a, token: f.tokens.agency };
	worker = { tenant: f.ids.a, token: f.tokens.worker };
	mgrB = { tenant: f.ids.b, token: f.tokens.agency };
	rep = await principal(f.ids.a, "rep", true);
	noMfa = await principal(f.ids.a, "manager", false);
}
// biome-ignore lint/suspicious/noExplicitAny: loosely typed JSON in a test helper
type Res = { status: number; body: Record<string, any> };
async function api(
	who: Who,
	method: string,
	path: string,
	body?: Record<string, unknown>,
	key: string = randomUUID(),
): Promise<Res> {
	const headers: Record<string, string> = {
		authorization: `Bearer ${who.token}`,
		"x-tenant-id": who.tenant,
	};
	if (who.grant) headers["x-grant-id"] = who.grant;
	if (method !== "GET") {
		headers["idempotency-key"] = key;
		headers["content-type"] = "application/json";
	}
	const r = await fetch(`${base}/v1/schema${path}`, {
		method,
		headers,
		body: method === "GET" ? undefined : JSON.stringify(body ?? {}),
	});
	// biome-ignore lint/suspicious/noExplicitAny: loosely typed JSON in a test helper
	return { status: r.status, body: (await r.json()) as Record<string, any> };
}
const cmd = () => ({ command_id: randomUUID() });
const L = (en: string, ar = `${en} ع`) => ({ en, ar });
const mk = (who: Who, o: string, b: Record<string, unknown>) =>
	api(who, "POST", `/${o}/properties`, { ...cmd(), ...b });
const prop = async (who: Who, o: string, k: string, q = "") =>
	(await api(who, "GET", `/${o}/properties/${k}${q}`)).body.data?.property;
const rev = async (o = "contact", who = mgr) =>
	(await api(who, "GET", `/${o}?options=none`)).body.data.schema_rev as number;
const codes = (r: Res) => (r.body.errors ?? []).map((e: { code: string }) => e.code);
const one = async (sql: string, args: unknown[] = []) => (await admin.query(sql, args)).rows[0];

test("B2 permissions: catalogue rows; manager manages, rep/reader read only, agency (grant or not), worker and non-MFA manager denied", async () => {
	await fresh();
	const rows = (
		await admin.query(
			"SELECT role,action,scope FROM crm.role_permission WHERE action IN ('schema.read','property.manage','view.manage','view.write') ORDER BY action,role",
		)
	).rows.map((r) => `${r.action}:${r.role}:${r.scope}`);
	assert.deepEqual(rows, [
		"property.manage:manager:tenant",
		"schema.read:manager:tenant",
		"schema.read:reader:tenant",
		"schema.read:rep:tenant",
		"view.manage:manager:tenant",
		"view.write:analyst:tenant",
		"view.write:manager:tenant",
		"view.write:reader:tenant",
		"view.write:rep:tenant",
	]);
	const create = (who: Who) =>
		mk(who, "contact", { key: "perm_probe", type: "text", label: L("Probe") });
	assert.equal((await api(mgr, "GET", "/contact")).status, 200);
	assert.equal((await api(mgr, "GET", "")).status, 200);
	for (const [name, who] of [["reader", reader], ["rep", rep]] as const) {
		assert.equal((await api(who, "GET", "/contact")).status, 200, `${name} reads`);
		assert.equal((await create(who)).status, 403, `${name} cannot create`);
		assert.equal(
			(await api(who, "POST", "/contact/groups", { ...cmd(), key: "g1", label: L("G") })).status,
			403,
		);
		assert.equal(
			(await api(who, "PATCH", "/contact/properties/title", { ...cmd(), expected_version: 0, label: L("X") })).status,
			403,
		);
	}
	for (const [name, who] of [["agency+grant", agencyGrant], ["agency", agencyNoGrant], ["worker", worker], ["no-MFA manager", noMfa]] as const) {
		assert.equal((await api(who, "GET", "/contact")).status, 403, `${name} read`);
		assert.equal((await create(who)).status, 403, `${name} write`);
	}
	assert.equal((await create(mgr)).status, 201);
	assert.equal((await one("SELECT count(*) n FROM crm.property_definition WHERE key='perm_probe' AND tenant_id=$1", [f.ids.a])).n, "1");
	// unauthenticated / wrong tenant
	assert.equal((await api({ tenant: f.ids.a, token: "nope" }, "GET", "/contact")).status, 401);
	assert.equal((await api({ tenant: f.ids.b, token: f.tokens.manager }, "GET", "/contact")).status, 403);
});

test("B2 two-tenant isolation through the API (read, patch, archive, options, groups)", async () => {
	await fresh();
	assert.equal((await mk(mgr, "contact", { key: "only_a", type: "single_select", label: L("Only A"), options: [{ value: "x", label: L("X") }] })).status, 201);
	assert.equal((await api(mgr, "POST", "/contact/groups", { ...cmd(), key: "ga", label: L("GA") })).status, 201);
	const b = (await api(mgrB, "GET", "/contact?include_archived=1")).body.data;
	assert.ok(!b.properties.some((p: { key: string }) => p.key === "only_a"));
	assert.ok(!b.groups.some((g: { key: string }) => g.key === "ga"));
	assert.equal((await api(mgrB, "GET", "/contact/properties/only_a")).status, 404);
	assert.equal((await api(mgrB, "PATCH", "/contact/properties/only_a", { ...cmd(), expected_version: 0, label: L("Hack") })).status, 404);
	assert.equal((await api(mgrB, "POST", "/contact/properties/only_a/archive", { ...cmd(), expected_version: 0 })).status, 404);
	assert.equal((await api(mgrB, "POST", "/contact/properties/only_a/options", { ...cmd(), expected_version: 0, value: "y", label: L("Y") })).status, 404);
	assert.equal((await api(mgrB, "PATCH", "/contact/groups/ga", { ...cmd(), expected_version: 0, label: L("Hack") })).status, 404);
	// the same key can exist independently in B; counts and schema_rev are per tenant
	assert.equal((await mk(mgrB, "contact", { key: "only_a", type: "text", label: L("B copy") })).status, 201);
	assert.equal((await prop(mgr, "contact", "only_a")).type, "single_select");
	assert.equal((await prop(mgrB, "contact", "only_a")).type, "text");
	assert.equal((await prop(mgr, "contact", "only_a")).label.en, "Only A");
	// A's own state was not touched by B's attempts
	assert.equal((await prop(mgr, "contact", "only_a")).version, 0);
});

test("B2 validation: one rule per case, all violations reported, nothing written", async () => {
	await fresh();
	const base = { key: "v_ok", type: "text", label: L("Ok") };
	const cases: [string, Record<string, unknown>, string, string][] = [
		["key uppercase", { ...base, key: "Bad" }, "VALIDATION_FAILED", "KEY_INVALID"],
		["key leading digit", { ...base, key: "1abc" }, "VALIDATION_FAILED", "KEY_INVALID"],
		["key too long", { ...base, key: `a${"b".repeat(63)}` }, "VALIDATION_FAILED", "KEY_INVALID"],
		["key missing", { type: "text", label: L("x") }, "VALIDATION_FAILED", "KEY_INVALID"],
		["key reserved", { ...base, key: "constructor" }, "VALIDATION_FAILED", "KEY_RESERVED"],
		["key reserved id", { ...base, key: "id" }, "VALIDATION_FAILED", "KEY_RESERVED"],
		["type unknown", { ...base, type: "money" }, "VALIDATION_FAILED", "TYPE_INVALID"],
		["label missing", { key: "v1", type: "text" }, "VALIDATION_FAILED", "LABEL_REQUIRED"],
		["label both empty", { ...base, label: { en: " ", ar: "" } }, "VALIDATION_FAILED", "LABEL_REQUIRED"],
		["label lang", { ...base, label: { en: "x", fr: "y" } }, "VALIDATION_FAILED", "LABEL_LANG_UNSUPPORTED"],
		["label too long", { ...base, label: { en: "x".repeat(121) } }, "VALIDATION_FAILED", "LABEL_INVALID"],
		["label bidi override", { ...base, label: { en: "ab‮cd" } }, "VALIDATION_FAILED", "LABEL_INVALID"],
		["label control char", { ...base, label: { en: "ab\u0007" } }, "VALIDATION_FAILED", "LABEL_INVALID"],
		["label not string", { ...base, label: { en: 5 } }, "VALIDATION_FAILED", "LABEL_INVALID"],
		["currency missing", { ...base, type: "currency" }, "VALIDATION_FAILED", "CURRENCY_REQUIRED"],
		["currency lowercase", { ...base, type: "currency", currency: "egp" }, "VALIDATION_FAILED", "CURRENCY_INVALID"],
		["currency unknown", { ...base, type: "currency", currency: "ZZZ" }, "VALIDATION_FAILED", "CURRENCY_INVALID"],
		["currency on text", { ...base, currency: "USD" }, "VALIDATION_FAILED", "CURRENCY_NOT_ALLOWED"],
		["display for type", { ...base, display: "radio" }, "VALIDATION_FAILED", "DISPLAY_INVALID"],
		["options on text", { ...base, options: [] }, "VALIDATION_FAILED", "OPTIONS_NOT_ALLOWED"],
		["option value", { ...base, type: "single_select", options: [{ value: "Bad Value", label: L("x") }] }, "VALIDATION_FAILED", "OPTION_VALUE_INVALID"],
		["option duplicate", { ...base, type: "single_select", options: [{ value: "a", label: L("A") }, { value: "a", label: L("B") }] }, "VALIDATION_FAILED", "OPTION_DUPLICATE"],
		["option color", { ...base, type: "single_select", options: [{ value: "a", label: L("A"), color: "hotpink" }] }, "VALIDATION_FAILED", "OPTION_COLOR_INVALID"],
		["option label", { ...base, type: "single_select", options: [{ value: "a" }] }, "VALIDATION_FAILED", "LABEL_REQUIRED"],
		["validation key", { ...base, validation: { regex: ".*" } }, "VALIDATION_FAILED", "VALIDATION_KEY_UNKNOWN"],
		["validation range", { ...base, type: "number", validation: { min: 5, max: 1 } }, "VALIDATION_FAILED", "VALIDATION_RANGE_INVALID"],
		["validation not finite", { ...base, type: "number", validation: { min: "1" } }, "VALIDATION_FAILED", "VALIDATION_INVALID"],
		["currency validation int", { ...base, type: "currency", currency: "EGP", validation: { min: 1.5 } }, "VALIDATION_FAILED", "VALIDATION_INVALID"],
		["position", { ...base, position: -1 }, "VALIDATION_FAILED", "POSITION_INVALID"],
		["flag type", { ...base, required: "yes" }, "VALIDATION_FAILED", "BOOLEAN_REQUIRED"],
		["required+read_only", { ...base, required: true, read_only: true }, "VALIDATION_FAILED", "REQUIRED_READ_ONLY"],
		["sensitive+searchable", { ...base, sensitive: true, searchable: true }, "VALIDATION_FAILED", "SENSITIVE_NOT_SEARCHABLE"],
		["searchable type", { ...base, type: "number", searchable: true }, "VALIDATION_FAILED", "SEARCHABLE_TYPE_UNSUPPORTED"],
		["group missing", { ...base, group: "nope" }, "VALIDATION_FAILED", "GROUP_NOT_FOUND"],
		["unknown field", { ...base, bogus: 1 }, "FIELD_NOT_WRITABLE", "UNKNOWN"],
		["storage not writable", { ...base, storage: "column" }, "FIELD_NOT_WRITABLE", "IMMUTABLE"],
		["is_system not writable", { ...base, is_system: true }, "FIELD_NOT_WRITABLE", "IMMUTABLE"],
		["indexed not writable", { ...base, indexed: true }, "FIELD_NOT_WRITABLE", "IMMUTABLE"],
	];
	for (const [name, body, code, issue] of cases) {
		const r = await mk(mgr, "contact", body);
		assert.equal(r.status, 422, name);
		assert.equal(r.body.code, code, name);
		assert.ok(codes(r).includes(issue), `${name}: ${JSON.stringify(r.body.errors)}`);
		assert.equal(r.body.safe_message, code);
		assert.ok(r.body.request_id);
	}
	// several violations are all reported in one response
	const multi = await mk(mgr, "contact", { key: "BAD", type: "nope", label: {} });
	assert.deepEqual(codes(multi).sort(), ["KEY_INVALID", "LABEL_REQUIRED", "TYPE_INVALID"]);
	// missing command_id, unknown object, bad route
	assert.equal((await api(mgr, "POST", "/contact/properties", { key: "k1", type: "text", label: L("k") })).status, 422);
	assert.equal((await mk(mgr, "nosuch", base)).status, 404);
	assert.equal((await api(mgr, "GET", "/contact/nothing")).status, 404);
	assert.equal((await api(mgr, "DELETE", "/contact/properties/title")).status, 404);
	assert.equal((await api(mgr, "GET", "/contact?include_archived=maybe")).status, 422);
	// nothing leaked into the registry
	assert.equal((await one("SELECT count(*) n FROM crm.property_definition WHERE tenant_id=$1 AND NOT is_system", [f.ids.a])).n, "0");
	// valid edge: Arabic-only label, mixed bidi label, every type accepted
	assert.equal((await mk(mgr, "contact", { key: "ar_only", type: "text", label: { ar: "الاسم الكامل" } })).status, 201);
	assert.equal((await mk(mgr, "contact", { key: "mixed", type: "text", label: { en: "Contract ‏رقم 12", ar: "رقم العقد A-12" } })).status, 201);
	for (const t of ["long_text", "number", "date", "datetime", "checkbox", "user", "multi_select", "single_select"])
		assert.equal((await mk(mgr, "contact", { key: `t_${t}`, type: t, label: L(t) })).status, 201, t);
	const cur = await mk(mgr, "contact", { key: "t_cur", type: "currency", currency: "EGP", validation: { min: 0 }, label: L("Cur") });
	assert.equal(cur.status, 201);
	assert.equal(cur.body.data.property.currency, "EGP");
	assert.equal((await prop(mgr, "contact", "mixed")).label.ar, "رقم العقد A-12");
});

test("B2 system properties: label/group/position only; key, type, storage immutable; no archive; no option add", async () => {
	await fresh();
	const t = await prop(mgr, "contact", "display_name");
	assert.equal(t.is_system, true);
	assert.equal(t.storage, "column");
	const patch = (b: Record<string, unknown>, k = "display_name", v = t.version) =>
		api(mgr, "PATCH", `/contact/properties/${k}`, { ...cmd(), expected_version: v, ...b });
	for (const [field, value] of [["key", "x"], ["type", "number"], ["storage", "custom"], ["is_system", false], ["column_name", "source"]] as const) {
		const r = await patch({ [field]: value });
		assert.equal(r.status, 422, field);
		assert.equal(r.body.code, "FIELD_NOT_WRITABLE", field);
	}
	for (const b of [{ required: false }, { read_only: true }, { sensitive: true }, { display: "default" }, { description: { en: "x" } }, { validation: {} }, { searchable: false }, { show_default: false }]) {
		const r = await patch(b);
		assert.equal(r.status, 422, JSON.stringify(b));
		assert.equal(r.body.code, "SYSTEM_PROPERTY_IMMUTABLE");
	}
	assert.equal((await api(mgr, "POST", "/contact/properties/display_name/archive", { ...cmd(), expected_version: t.version })).body.code, "SYSTEM_PROPERTY_IMMUTABLE");
	// the allowed edits work
	const ok = await patch({ label: { en: "Full name", ar: "الاسم الكامل" }, position: 5 });
	assert.equal(ok.status, 200);
	assert.equal(ok.body.data.property.label.en, "Full name");
	assert.equal(ok.body.data.property.position, 5);
	assert.equal(ok.body.data.property.version, t.version + 1);
	assert.equal((await api(mgr, "POST", "/contact/groups", { ...cmd(), key: "extra", label: L("Extra") })).status, 201);
	assert.equal((await patch({ group: "extra" }, "display_name", ok.body.data.property.version)).status, 200);
	// system select options: no add/archive, label edit allowed
	const st = await prop(mgr, "lead", "status");
	assert.equal((await api(mgr, "POST", "/lead/properties/status/options", { ...cmd(), expected_version: st.version, value: "new", label: L("New") })).body.code, "SYSTEM_PROPERTY_IMMUTABLE");
	const arch = await api(mgr, "PATCH", "/lead/properties/status/options/open", { ...cmd(), expected_version: st.version, archived: true });
	assert.equal(arch.status, 422);
	assert.ok(codes(arch).includes("SYSTEM_PROPERTY_IMMUTABLE"));
	assert.equal((await api(mgr, "PATCH", "/lead/properties/status/options/open", { ...cmd(), expected_version: st.version, label: L("Open lead") })).status, 200);
	// custom property: key/type immutable too
	const c = await mk(mgr, "contact", { key: "imm", type: "text", label: L("Imm") });
	for (const field of ["key", "type", "currency", "options"])
		assert.equal((await api(mgr, "PATCH", "/contact/properties/imm", { ...cmd(), expected_version: 0, [field]: "x" })).body.code, "FIELD_NOT_WRITABLE", field);
	assert.equal(c.body.data.property.version, 0);
	// DB level: runtime cannot do it either (belt and braces from 010)
	assert.equal((await one("SELECT count(*) n FROM crm.property_definition WHERE tenant_id=$1 AND key='display_name' AND type='text' AND storage='column' AND is_system", [f.ids.a])).n, "1");
});

test("B2 optimistic concurrency, schema_rev, idempotent retry, no-op", async () => {
	await fresh();
	const r0 = await rev();
	const key = randomUUID(),
		command = randomUUID();
	const body = { command_id: command, key: "idem", type: "text", label: L("Idem") };
	const first = await api(mgr, "POST", "/contact/properties", body, key);
	assert.equal(first.status, 201);
	assert.equal(first.body.data.replayed, false);
	assert.equal(first.body.data.schema_rev, r0 + 1);
	const again = await api(mgr, "POST", "/contact/properties", body, key);
	assert.equal(again.status, 200);
	assert.equal(again.body.data.replayed, true);
	assert.equal(again.body.data.schema_rev, r0 + 1, "replay does not bump");
	// same key via a fresh Idempotency-Key but the same command_id is a replay too
	assert.equal((await api(mgr, "POST", "/contact/properties", body)).body.data.replayed, true);
	assert.equal((await one("SELECT count(*) n FROM crm.property_definition WHERE tenant_id=$1 AND key='idem'", [f.ids.a])).n, "1");
	assert.equal((await one("SELECT count(*) n FROM crm.audit_log WHERE tenant_id=$1 AND action='property.created' AND object_kind='property'", [f.ids.a])).n, "1");
	// changed body under the same command or key conflicts
	assert.equal((await api(mgr, "POST", "/contact/properties", { ...body, label: L("Other") }, key)).body.code, "IDEMPOTENCY_CONFLICT");
	assert.equal((await api(mgr, "POST", "/contact/properties", { ...body, label: L("Other") })).body.code, "IDEMPOTENCY_CONFLICT");
	// concurrency: expected_version
	const p = await prop(mgr, "contact", "idem");
	assert.equal(p.version, 0);
	const upd = (v: number, label: string, k = randomUUID(), c = randomUUID()) =>
		api(mgr, "PATCH", "/contact/properties/idem", { command_id: c, expected_version: v, label: L(label) }, k);
	const k2 = randomUUID(),
		c2 = randomUUID();
	const u1 = await upd(0, "One", k2, c2);
	assert.equal(u1.status, 200);
	assert.equal(u1.body.data.property.version, 1);
	assert.equal(u1.body.data.schema_rev, r0 + 2);
	// the same command_id + operation against a different target is a conflict, not a replay
	await mk(mgr, "contact", { key: "idem2", type: "text", label: L("Idem2") });
	assert.equal((await api(mgr, "PATCH", "/contact/properties/idem2", { command_id: c2, expected_version: 0, label: L("One") })).body.code, "IDEMPOTENCY_CONFLICT");
	assert.equal((await prop(mgr, "contact", "idem2")).version, 0);
	const rBefore = await rev();
	const stale = await upd(0, "Two");
	assert.equal(stale.status, 409);
	assert.equal(stale.body.code, "VERSION_CONFLICT");
	assert.equal(stale.body.retryable, false);
	assert.equal(await rev(), rBefore, "failed write does not bump");
	assert.equal((await prop(mgr, "contact", "idem")).label.en, "One");
	// replay of the successful update after it was superseded still returns the receipt, applies nothing
	assert.equal((await upd(1, "Three")).status, 200);
	const rep1 = await upd(0, "One", k2, c2);
	assert.equal(rep1.status, 200);
	assert.equal(rep1.body.data.replayed, true);
	assert.equal((await prop(mgr, "contact", "idem")).label.en, "Three");
	// missing expected_version
	assert.equal((await api(mgr, "PATCH", "/contact/properties/idem", { ...cmd(), label: L("x") })).status, 422);
	// no-op: same values -> no version bump, no schema_rev bump, no evidence
	const before = await rev();
	const evBefore = (await one("SELECT count(*) n FROM crm.audit_log WHERE tenant_id=$1", [f.ids.a])).n;
	const noop = await upd(2, "Three");
	assert.equal(noop.status, 200);
	assert.equal(noop.body.data.property.version, 2);
	assert.equal(await rev(), before);
	assert.equal((await one("SELECT count(*) n FROM crm.audit_log WHERE tenant_id=$1", [f.ids.a])).n, evBefore);
	// every change bumps schema_rev by exactly one, in order, across objects independently
	const leadRev = await rev("lead");
	assert.equal((await mk(mgr, "contact", { key: "bump1", type: "text", label: L("b") })).body.data.schema_rev, before + 1);
	assert.equal((await mk(mgr, "contact", { key: "bump2", type: "text", label: L("b") })).body.data.schema_rev, before + 2);
	assert.equal(await rev("lead"), leadRev);
	// concurrent writers on the same version: exactly one wins
	const race = await Promise.all([1, 2, 3, 4].map((i) => upd(2, `Race ${i}`)));
	assert.deepEqual(race.map((r) => r.status).sort(), [200, 409, 409, 409]);
	assert.equal((await prop(mgr, "contact", "idem")).version, 3);
	// concurrent creates of the same key: one 201, the rest 409/replay-free
	const dup = await Promise.all([1, 2, 3].map(() => mk(mgr, "contact", { key: "dupkey", type: "text", label: L("d") })));
	assert.deepEqual(dup.map((r) => r.status).sort(), [201, 409, 409]);
});

test("B2 archive hides from GET unless include_archived; key stays reserved; archived property cannot be edited; values stay (no data touched)", async () => {
	await fresh();
	await mk(mgr, "contact", { key: "gone", type: "text", label: L("Gone") });
	await mk(mgr, "contact", { key: "stay", type: "text", label: L("Stay") });
	const r = await api(mgr, "POST", "/contact/properties/gone/archive", { ...cmd(), expected_version: 0 });
	assert.equal(r.status, 200);
	assert.equal(r.body.data.property.archived, true);
	assert.equal(r.body.data.property.version, 1);
	const keys = (d: { properties: { key: string }[] }) => d.properties.map((p) => p.key);
	assert.ok(!keys((await api(mgr, "GET", "/contact")).body.data).includes("gone"));
	assert.ok(!keys((await api(reader, "GET", "/contact")).body.data).includes("gone"));
	assert.ok(keys((await api(mgr, "GET", "/contact?include_archived=1")).body.data).includes("gone"));
	assert.ok(keys((await api(mgr, "GET", "/contact")).body.data).includes("stay"));
	assert.equal((await mk(mgr, "contact", { key: "gone", type: "text", label: L("Again") })).body.code, "KEY_EXISTS");
	assert.equal((await api(mgr, "PATCH", "/contact/properties/gone", { ...cmd(), expected_version: 1, label: L("x") })).body.code, "PROPERTY_ARCHIVED");
	assert.equal((await api(mgr, "POST", "/contact/properties/gone/archive", { ...cmd(), expected_version: 1 })).body.code, "PROPERTY_ARCHIVED");
	// the row is kept (archive, never delete); runtime has no DELETE
	assert.equal((await one("SELECT archived_at IS NOT NULL a FROM crm.property_definition WHERE tenant_id=$1 AND key='gone'", [f.ids.a])).a, true);
	// unknown fields on archive are refused
	assert.equal((await api(mgr, "POST", "/contact/properties/stay/archive", { ...cmd(), expected_version: 0, extra: 1 })).status, 422);
});

test("B2 audit + evidence: object_kind 'property' accepted by the ledger trigger; foreign/missing ids rejected; no label text in audit", async () => {
	await fresh();
	const c = await mk(mgr, "deal", { key: "aud", type: "single_select", label: L("Secret Label Text"), options: [{ value: "a", label: L("A") }] });
	assert.equal(c.status, 201);
	const v = c.body.data.property.version;
	await api(mgr, "PATCH", "/deal/properties/aud", { ...cmd(), expected_version: v, label: L("Renamed Label"), required: true });
	await api(mgr, "POST", "/deal/properties/aud/options", { ...cmd(), expected_version: v + 1, value: "b", label: L("B") });
	await api(mgr, "POST", "/deal/properties/aud/archive", { ...cmd(), expected_version: v + 2 });
	const id = (await one("SELECT id FROM crm.property_definition WHERE tenant_id=$1 AND key='aud'", [f.ids.a])).id;
	const rows = (await admin.query("SELECT action,changed_fields,object_kind,actor_id FROM crm.audit_log WHERE tenant_id=$1 AND object_id=$2 ORDER BY occurred_at,id", [f.ids.a, id])).rows;
	assert.deepEqual(rows.map((r) => r.action).sort(), ["property.archived", "property.created", "property.updated", "property.updated"]);
	assert.ok(rows.every((r) => r.object_kind === "property" && r.actor_id === f.ids.manager));
	const flat = JSON.stringify(rows);
	assert.ok(!flat.includes("Secret Label Text") && !flat.includes("Renamed"), "audit stores field names only");
	assert.ok(rows.some((r) => r.changed_fields.includes("option:b")));
	assert.ok(rows.some((r) => r.changed_fields.includes("label") && r.changed_fields.includes("required")));
	assert.equal((await one("SELECT count(*) n FROM crm.business_event WHERE tenant_id=$1 AND object_kind='property' AND object_id=$2", [f.ids.a, id])).n, "4");
	assert.equal((await one("SELECT count(*) n FROM crm.outbox WHERE tenant_id=$1 AND object_kind='property' AND object_id=$2", [f.ids.a, id])).n, "4");
	// trigger: unknown id, other tenant's id, bad kind
	const ins = (tenant: string, kind: string, obj: string) =>
		admin.query("INSERT INTO crm.audit_log(tenant_id,id,actor_id,action,request_id,object_kind,object_id) VALUES($1,$2,$3,'x',$4,$5,$6)", [tenant, randomUUID(), f.ids.manager, randomUUID(), kind, obj]);
	await assert.rejects(ins(f.ids.a, "property", randomUUID()), /Invalid object reference/);
	await assert.rejects(ins(f.ids.b, "property", id), /Invalid object reference/);
	await assert.rejects(ins(f.ids.a, "property_x", id), /Invalid object reference/);
	await ins(f.ids.a, "property", id);
	const gid = (await one("SELECT id FROM crm.property_group WHERE tenant_id=$1 AND key='general' AND object_type='deal'", [f.ids.a])).id;
	await ins(f.ids.a, "property_group", gid);
	await assert.rejects(ins(f.ids.b, "property_group", gid), /Invalid object reference/);
	// the worker processes the property outbox rows without blocking them
	const { workOne } = await import("../src/jobs.js");
	for (let i = 0; i < 6; i++) await workOne({ tenant: f.ids.a, token: f.tokens.worker });
	assert.equal((await one("SELECT count(*) n FROM crm.outbox WHERE tenant_id=$1 AND object_kind='property' AND status NOT IN ('processed')", [f.ids.a])).n, "0");
	// the 003 trigger function stays closed to PUBLIC
	assert.equal((await one("SELECT has_function_privilege('public','crm.check_object_reference()','EXECUTE') x")).x, false);
});

test("B2 options: stable values, add/edit/archive/reactivate, reorder, 200 limit, property version is the concurrency token", async () => {
	await fresh();
	const c = await mk(mgr, "lead", { key: "stage_x", type: "single_select", label: L("Stage X"), options: [{ value: "a", label: L("A"), color: "blue" }, { value: "b", label: L("B") }] });
	let v = c.body.data.property.version;
	const opt = async (m: string, p: string, b: Record<string, unknown>) => {
		const r = await api(mgr, m, `/lead/properties/stage_x/options${p}`, { ...cmd(), expected_version: v, ...b });
		if (r.status < 300 && r.body.data.property) v = r.body.data.property.version;
		return r;
	};
	assert.deepEqual(c.body.data.property.options.map((o: { value: string; position: number }) => [o.value, o.position]), [["a", 10], ["b", 20]]);
	assert.equal((await opt("POST", "", { value: "c", label: L("C"), color: "red" })).status, 201);
	assert.equal((await opt("POST", "", { value: "c", label: L("C2") })).body.code, "OPTION_EXISTS");
	assert.equal((await api(mgr, "POST", "/lead/properties/stage_x/options", { ...cmd(), expected_version: 0, value: "z", label: L("Z") })).body.code, "VERSION_CONFLICT");
	const ren = await opt("PATCH", "/a", { label: L("Alpha"), color: null });
	assert.equal(ren.status, 200);
	const a = ren.body.data.property.options.find((o: { value: string }) => o.value === "a");
	assert.deepEqual([a.value, a.label.en, a.color], ["a", "Alpha", null], "value is stable, label changes");
	const arch = await opt("PATCH", "/b", { archived: true });
	assert.equal(arch.body.data.property.options.find((o: { value: string }) => o.value === "b").archived, true);
	assert.equal(arch.body.data.property.option_count, 2);
	assert.equal((await opt("PATCH", "/nope", { label: L("x") })).status, 404);
	assert.equal((await opt("PATCH", "/a", { value: "x" })).body.code, "FIELD_NOT_WRITABLE");
	assert.equal((await opt("PATCH", "/a", { color: "mauve" })).status, 422);
	// reorder: complete active set required
	const ord = await opt("POST", "/order", { values: ["c", "a"] });
	assert.equal(ord.status, 200);
	assert.deepEqual(ord.body.data.property.options.filter((o: { archived: boolean }) => !o.archived).map((o: { value: string }) => o.value), ["c", "a"]);
	assert.equal((await opt("POST", "/order", { values: ["c"] })).body.errors[0].code, "REORDER_SET_MISMATCH");
	assert.equal((await opt("POST", "/order", { values: ["c", "c"] })).body.errors[0].code, "ORDER_DUPLICATE");
	assert.equal((await opt("POST", "/order", { values: ["c", "a", "b"] })).status, 422, "archived option is not part of the active set");
	assert.equal((await opt("PATCH", "/b", { archived: false })).status, 200);
	// the archived option is still returned (flagged) so stored values keep a label
	// options on a text property are refused
	await mk(mgr, "lead", { key: "txt", type: "text", label: L("t") });
	assert.equal((await api(mgr, "POST", "/lead/properties/txt/options", { ...cmd(), expected_version: 0, value: "q", label: L("q") })).body.errors[0].code, "OPTIONS_NOT_ALLOWED");
	// limit 200 active options (DB trigger + pre-check)
	const big = await mk(mgr, "lead", { key: "big", type: "multi_select", label: L("Big"), options: Array.from({ length: 200 }, (_, i) => ({ value: `o${i}`, label: L(`O${i}`) })) });
	assert.equal(big.status, 201);
	assert.equal(big.body.data.property.option_count, 200);
	const over = await api(mgr, "POST", "/lead/properties/big/options", { ...cmd(), expected_version: 0, value: "extra", label: L("E") });
	assert.equal(over.status, 422);
	assert.equal(over.body.code, "OPTION_LIMIT_EXCEEDED");
	assert.equal((await mk(mgr, "lead", { key: "big2", type: "multi_select", label: L("B2"), options: Array.from({ length: 201 }, (_, i) => ({ value: `o${i}`, label: L("x") })) })).status, 422);
	// archive one, then one more fits; reactivating beyond 200 is refused
	assert.equal((await api(mgr, "PATCH", "/lead/properties/big/options/o0", { ...cmd(), expected_version: 0, archived: true })).status, 200);
	assert.equal((await api(mgr, "POST", "/lead/properties/big/options", { ...cmd(), expected_version: 1, value: "extra", label: L("E") })).status, 201);
	const re = await api(mgr, "PATCH", "/lead/properties/big/options/o0", { ...cmd(), expected_version: 2, archived: false });
	assert.equal(re.body.code, "OPTION_LIMIT_EXCEEDED");
	// lazy loading: options=none omits them and keeps the count
	const lite = (await api(mgr, "GET", "/lead?options=none")).body.data.properties.find((p: { key: string }) => p.key === "big");
	assert.equal(lite.options, undefined);
	assert.equal(lite.option_count, 200);
});

test("B2 groups: create/update/order/archive, general (non-empty) cannot be archived, property group assignment", async () => {
	await fresh();
	const g = await api(mgr, "POST", "/task/groups", { ...cmd(), key: "billing", label: L("Billing") });
	assert.equal(g.status, 201);
	assert.equal(g.body.data.group.version, 0);
	assert.equal((await api(mgr, "POST", "/task/groups", { ...cmd(), key: "billing", label: L("Again") })).body.code, "KEY_EXISTS");
	assert.equal((await api(mgr, "POST", "/task/groups", { ...cmd(), key: "Bad Key", label: L("x") })).status, 422);
	const up = await api(mgr, "PATCH", "/task/groups/billing", { ...cmd(), expected_version: 0, label: L("Money") });
	assert.equal(up.body.data.group.version, 1);
	assert.equal((await api(mgr, "PATCH", "/task/groups/billing", { ...cmd(), expected_version: 0, label: L("Stale") })).body.code, "VERSION_CONFLICT");
	const p = await mk(mgr, "task", { key: "fee", type: "number", label: L("Fee"), group: "billing" });
	assert.equal(p.body.data.property.group, "billing");
	assert.equal((await api(mgr, "POST", "/task/groups/billing/archive", { ...cmd(), expected_version: 1 })).body.code, "GROUP_NOT_EMPTY");
	assert.equal((await api(mgr, "POST", "/task/groups/general/archive", { ...cmd(), expected_version: 0 })).body.code, "GROUP_NOT_EMPTY");
	// reorder (schema_rev guard)
	const r = await rev("task");
	const ord = await api(mgr, "POST", "/task/groups/order", { ...cmd(), keys: ["billing", "general"], expected_schema_rev: r });
	assert.equal(ord.status, 200);
	assert.deepEqual(ord.body.data.groups.map((x: { key: string }) => x.key), ["billing", "general"]);
	assert.equal((await api(mgr, "POST", "/task/groups/order", { ...cmd(), keys: ["billing", "general"], expected_schema_rev: r })).body.code, "VERSION_CONFLICT");
	assert.equal((await api(mgr, "POST", "/task/groups/order", { ...cmd(), keys: ["billing"], expected_schema_rev: await rev("task") })).body.errors[0].code, "REORDER_SET_MISMATCH");
	// move the property away, then the group can be archived and disappears
	const mv = await api(mgr, "PATCH", "/task/properties/fee", { ...cmd(), expected_version: 0, group: "general" });
	assert.equal(mv.status, 200);
	assert.equal((await api(mgr, "POST", "/task/groups/billing/archive", { ...cmd(), expected_version: 1 })).status, 200);
	const keys = (q: string) => api(mgr, "GET", `/task${q}`).then((x) => x.body.data.groups.map((y: { key: string }) => y.key));
	assert.deepEqual(await keys(""), ["general"]);
	assert.deepEqual((await keys("?include_archived=1")).sort(), ["billing", "general"]);
	assert.equal((await mk(mgr, "task", { key: "late", type: "text", label: L("l"), group: "billing" })).body.errors[0].code, "GROUP_NOT_FOUND");
	// audit for groups
	const acts = (await admin.query("SELECT DISTINCT action FROM crm.audit_log WHERE tenant_id=$1 AND object_kind='property_group' ORDER BY action", [f.ids.a])).rows.map((r) => r.action);
	assert.deepEqual(acts, ["property_group.archived", "property_group.created", "property_group.updated"]);
	// group limit
	for (let i = 0; i < 49; i++) assert.equal((await api(mgr, "POST", "/task/groups", { ...cmd(), key: `g${i}`, label: L(`G${i}`) })).status, 201);
	assert.equal((await api(mgr, "POST", "/task/groups", { ...cmd(), key: "toomany", label: L("x") })).body.code, "GROUP_LIMIT_EXCEEDED");
});

test("B2 property reorder: complete set + schema_rev guard; sensitive properties hidden from readers, visible to reps and managers", async () => {
	await fresh();
	await mk(mgr, "deal", { key: "p1", type: "text", label: L("1") });
	await mk(mgr, "deal", { key: "p2", type: "text", label: L("2") });
	await mk(mgr, "deal", { key: "secret", type: "text", label: L("Secret"), sensitive: true });
	const all = (await api(mgr, "GET", "/deal")).body.data;
	const keys: string[] = all.properties.map((p: { key: string }) => p.key);
	const next = [...keys.filter((k) => k !== "p2"), "p2"];
	next.splice(0, 0, next.pop() as string);
	const ok = await api(mgr, "POST", "/deal/properties/order", { ...cmd(), keys: next, expected_schema_rev: all.schema_rev });
	assert.equal(ok.status, 200);
	assert.deepEqual(ok.body.data.properties.map((p: { key: string }) => p.key), next);
	assert.equal(ok.body.data.schema_rev, all.schema_rev + 1);
	assert.equal((await api(mgr, "POST", "/deal/properties/order", { ...cmd(), keys: next, expected_schema_rev: all.schema_rev })).body.code, "VERSION_CONFLICT");
	assert.equal((await api(mgr, "POST", "/deal/properties/order", { ...cmd(), keys: next.slice(1), expected_schema_rev: await rev("deal") })).body.errors[0].code, "REORDER_SET_MISMATCH");
	const same = await rev("deal");
	assert.equal((await api(mgr, "POST", "/deal/properties/order", { ...cmd(), keys: next, expected_schema_rev: same })).status, 200);
	assert.equal(await rev("deal"), same, "unchanged order is a no-op");
	const seen = async (w: Who) => (await api(w, "GET", "/deal")).body.data.properties.map((p: { key: string }) => p.key);
	assert.ok((await seen(mgr)).includes("secret"));
	assert.ok((await seen(rep)).includes("secret"));
	assert.ok(!(await seen(reader)).includes("secret"));
	assert.equal((await api(reader, "GET", "/deal/properties/secret")).status, 404);
	assert.equal((await api(mgr, "GET", "/deal/properties/secret")).status, 200);
});

test("B2 limits: 100 active custom properties per object; archived free a slot; GET payload for 100 properties stays <= 128 KB", async () => {
	await fresh();
	for (let i = 0; i < 100; i++) {
		const r = await mk(mgr, "contact", i % 4 === 0
			? { key: `f${i}`, type: "single_select", label: L(`Field number ${i}`, `حقل رقم ${i}`), description: L(`Description of field ${i}`), options: Array.from({ length: 12 }, (_, o) => ({ value: `opt_${o}`, label: L(`Option ${o}`, `خيار ${o}`), color: "blue" })) }
			: { key: `f${i}`, type: "text", label: L(`Field number ${i}`, `حقل رقم ${i}`), description: L(`Description of field ${i}`) });
		assert.equal(r.status, 201, `f${i}`);
	}
	const over = await mk(mgr, "contact", { key: "f_over", type: "text", label: L("over") });
	assert.equal(over.status, 422);
	assert.equal(over.body.code, "PROPERTY_LIMIT_EXCEEDED");
	// other objects and other tenants are unaffected
	assert.equal((await mk(mgr, "lead", { key: "f_over", type: "text", label: L("ok") })).status, 201);
	assert.equal((await mk(mgrB, "contact", { key: "f_over", type: "text", label: L("ok") })).status, 201);
	const res = await fetch(`${base}/v1/schema/contact`, { headers: { authorization: `Bearer ${mgr.token}`, "x-tenant-id": mgr.tenant } });
	const text = await res.text();
	const size = Buffer.byteLength(text);
	assert.ok(size <= 131072, `payload ${size} bytes`);
	assert.ok(JSON.parse(text).data.properties.length >= 105, "100 custom + system properties");
	console.log(`B2 schema GET payload with 100 custom properties (25 selects x 12 options): ${size} bytes`);
	assert.equal((await api(mgr, "POST", "/contact/properties/f1/archive", { ...cmd(), expected_version: 0 })).status, 200);
	assert.equal((await mk(mgr, "contact", { key: "f_over", type: "text", label: L("fits now") })).status, 201);
	// DB trigger is the backstop: a direct insert beyond the limit is refused even without the API pre-check
	await assert.rejects(
		admin.query(
			`INSERT INTO crm.property_definition(tenant_id,id,object_type,key,type,label,group_id,position)
			 SELECT $1,gen_random_uuid(),'contact','direct_over','text','{"en":"x"}',(SELECT id FROM crm.property_group WHERE tenant_id=$1 AND object_type='contact' AND key='general'),1`,
			[f.ids.a],
		),
		/PROPERTY_LIMIT_EXCEEDED/,
	);
});
