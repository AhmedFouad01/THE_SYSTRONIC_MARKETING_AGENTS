import {readFile} from "node:fs/promises";
// ADR-002 P1b B3 (src/properties.ts + thin call sites in crm.ts/list.ts/listquery.ts): custom values on records, over the real HTTP
// server and real PostgreSQL (crm_runtime, RLS). No migration: 010 columns + 011 permissions only.
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
let mgr: Who, reader: Who, rep: Who, repPrincipal: string, agencyGrant: Who, mgrB: Who;
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
	await admin.query("INSERT INTO crm.principal VALUES($1,$2)", [id, `B3 ${role}`]);
	await admin.query(
		"INSERT INTO crm.session(token_hash,principal_id,expires_at,mfa_verified) VALUES($1,$2,now()+interval '1 day',true)",
		[createHash("sha256").update(token).digest("hex"), id],
	);
	await admin.query(
		"INSERT INTO crm.membership(tenant_id,id,principal_id,role) VALUES($1,$2,$3,$4)",
		[tenant, randomUUID(), id, role],
	);
	return { who: { tenant, token } as Who, id };
}
async function fresh() {
	f = await seed(admin);
	mgr = { tenant: f.ids.a, token: f.tokens.manager };
	reader = { tenant: f.ids.a, token: f.tokens.reader };
	agencyGrant = { tenant: f.ids.a, token: f.tokens.agency, grant: f.ids.grant };
	mgrB = { tenant: f.ids.b, token: f.tokens.agency };
	const r = await principal(f.ids.a, "rep");
	rep = r.who;
	repPrincipal = r.id;
}
// biome-ignore lint/suspicious/noExplicitAny: loosely typed JSON in a test helper
type Res = { status: number; body: Record<string, any> };
async function call(
	who: Who,
	method: string,
	url: string,
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
	const r = await fetch(`${base}${url}`, {
		method,
		headers,
		body: method === "GET" ? undefined : JSON.stringify(body ?? {}),
	});
	// biome-ignore lint/suspicious/noExplicitAny: loosely typed JSON in a test helper
	return { status: r.status, body: (await r.json()) as Record<string, any> };
}
const cmd = () => ({ command_id: randomUUID() });
const L = (label: string) => label;
const errs = (r: Res) =>
	(r.body.errors ?? []).map((e: { property?: string; code: string }) => `${e.property ?? ""}:${e.code}`);
const one = async (sql: string, args: unknown[] = []) => (await admin.query(sql, args)).rows[0];
const customOf = async (table: string, id: string) =>
	(await one(`SELECT custom FROM crm.${table} WHERE id=$1`, [id])).custom as Record<string, unknown>;

// ---- registry + record helpers ----
async function prop(
	object: string,
	key: string,
	type: string,
	extra: Record<string, unknown> = {},
	who: Who = mgr,
) {
	const r = await call(who, "POST", `/v1/schema/${object}/properties`, {
		...cmd(),
		key,
		type,
		label: L(key),
		...extra,
	});
	assert.equal(r.status, 201, `define ${key}: ${JSON.stringify(r.body)}`);
	return r.body.data.property;
}
const propVersion = async (object: string, key: string) =>
	(await call(mgr, "GET", `/v1/schema/${object}/properties/${key}`)).body.data.property.version as number;
async function archiveProp(object: string, key: string) {
	const r = await call(mgr, "POST", `/v1/schema/${object}/properties/${key}/archive`, {
		...cmd(),
		expected_version: await propVersion(object, key),
	});
	assert.equal(r.status, 200);
}
async function archiveOption(object: string, key: string, value: string) {
	const r = await call(mgr, "PATCH", `/v1/schema/${object}/properties/${key}/options/${value}`, {
		...cmd(),
		expected_version: await propVersion(object, key),
		archived: true,
	});
	assert.equal(r.status, 200, JSON.stringify(r.body));
}
const newContact = (who: Who, name: string, properties?: Record<string, unknown>) =>
	call(who, "POST", "/v1/contacts", {
		...cmd(),
		display_name: name,
		...(properties ? { properties } : {}),
	});
const patch = (who: Who, kind: string, id: string, version: number, body: Record<string, unknown>) =>
	call(who, "PATCH", `/v1/${kind}/${id}`, { ...cmd(), expected_version: version, ...body });
const get = (who: Who, kind: string, id: string) => call(who, "GET", `/v1/${kind}/${id}`);
async function contactWith(properties?: Record<string, unknown>, name = "B3 contact", who: Who = mgr) {
	const r = await newContact(who, name, properties);
	assert.equal(r.status, 201, JSON.stringify(r.body));
	return r.body.data as { id: string; version: number; properties: Record<string, unknown>;
	};
}
const lastAudit = async (id: string) =>
	(await one("SELECT action,changed_fields FROM crm.audit_log WHERE object_id=$1 ORDER BY occurred_at DESC,id DESC LIMIT 1", [id])) as {
		action: string;
		changed_fields: string[];
	};

// ======================================================================================================================
test("B3 every type: valid values stored normalised and read back; invalid values rejected per property with a code", async () => {
	await fresh();
	await prop("contact", "t_text", "text", { validation: { max_length: 10 } });
	await prop("contact", "t_long", "long_text", { validation: { max_length: 50 } });
	await prop("contact", "t_num", "number", { validation: { min: 0, max: 100 } });
	await prop("contact", "t_cur", "currency", { currency: "EGP", validation: { min: 0 } });
	await prop("contact", "t_date", "date");
	await prop("contact", "t_dt", "datetime");
	await prop("contact", "t_bool", "checkbox");
	await prop("contact", "t_sel", "single_select", { options: [{ value: "a", label: L("A") }, { value: "b", label: L("B") }] });
	await prop("contact", "t_multi", "multi_select", {
		validation: { max_selected: 2 },
		options: ["x", "y", "z"].map((v) => ({ value: v, label: L(v) })),
	});
	await prop("contact", "t_user", "user");
	const c = await contactWith();
	assert.deepEqual(c.properties, {}, "legacy create without properties: empty properties");
	const ok = await patch(mgr, "contacts", c.id, c.version, {
		properties: {
			t_text: "  مرحبا Hi  ",
			t_long: "line1\nline2",
			t_num: 42.5,
			t_cur: 1999,
			t_date: "2026-02-28",
			t_dt: "2026-10-07T10:00:00+02:00",
			t_bool: false,
			t_sel: "a",
			t_multi: ["x", "y"],
			t_user: f.ids.manager.toUpperCase(),
		},
	});
	assert.equal(ok.status, 200, JSON.stringify(ok.body));
	assert.deepEqual(ok.body.data.properties, {
		t_text: "مرحبا Hi",
		t_long: "line1\nline2",
		t_num: 42.5,
		t_cur: 1999,
		t_date: "2026-02-28",
		t_dt: "2026-10-07T08:00:00.000Z",
		t_bool: false,
		t_sel: "a",
		t_multi: ["x", "y"],
		t_user: f.ids.manager,
	});
	assert.deepEqual(ok.body.data.properties, (await get(mgr, "contacts", c.id)).body.data.properties);
	assert.equal(ok.body.data.custom, undefined, "the blob is never returned");
	// boundaries
	let v = ok.body.data.version as number;
	for (const props of [
		{ t_text: "😀".repeat(10) }, // 10 code points = 20 UTF-16 units: the limit counts code points
		{ t_num: 0 },
		{ t_num: 100 },
		{ t_cur: 0 },
		{ t_date: "2024-02-29" }, // leap day
		{ t_dt: "2026-10-07T23:59:59.123456789Z" },
		{ t_multi: ["z"] },
		{ t_user: repPrincipal },
	]) {
		const r = await patch(mgr, "contacts", c.id, v, { properties: props });
		assert.equal(r.status, 200, JSON.stringify([props, r.body]));
		v = r.body.data.version;
	}
	const bad: [string, unknown, string][] = [
		["t_text", 5, "INVALID_TYPE"],
		["t_text", "x".repeat(11), "MAX_LENGTH"],
		["t_text", "a\u0000b", "INVALID_VALUE"],
		["t_text", "a‮b", "INVALID_VALUE"], // bidi override (trojan source)
		["t_text", "a\nb", "INVALID_VALUE"], // newline only in long_text
		["t_text", "\ud800", "INVALID_VALUE"], // lone surrogate would break the jsonb
		["t_long", "x".repeat(51), "MAX_LENGTH"],
		["t_long", 5, "INVALID_TYPE"],
		["t_num", "5", "INVALID_VALUE"],
		["t_num", true, "INVALID_VALUE"],
		["t_num", -1, "MIN_VALUE"],
		["t_num", 101, "MAX_VALUE"],
		["t_num", 1e16, "INVALID_VALUE"],
		["t_cur", 10.5, "INVALID_VALUE"],
		["t_cur", "10", "INVALID_VALUE"],
		["t_cur", -1, "MIN_VALUE"],
		["t_date", "2026-02-30", "INVALID_VALUE"],
		["t_date", "2026-2-3", "INVALID_VALUE"],
		["t_date", "2026-10-07T00:00:00Z", "INVALID_VALUE"],
		["t_date", 20261007, "INVALID_TYPE"],
		["t_dt", "2026-10-07", "INVALID_VALUE"],
		["t_dt", "2026-10-07T10:00:00", "INVALID_VALUE"], // no zone
		["t_dt", "2026-13-07T10:00:00Z", "INVALID_VALUE"],
		["t_dt", "2026-10-07T25:00:00Z", "INVALID_VALUE"],
		["t_bool", "true", "INVALID_TYPE"],
		["t_bool", 1, "INVALID_TYPE"],
		["t_sel", "nope", "OPTION_UNKNOWN"],
		["t_sel", 1, "INVALID_TYPE"],
		["t_sel", ["a"], "INVALID_TYPE"],
		["t_multi", ["x", "y", "z"], "MAX_SELECTED"],
		["t_multi", ["x", "x"], "DUPLICATE_OPTION"],
		["t_multi", ["q"], "OPTION_UNKNOWN"],
		["t_multi", "x", "INVALID_TYPE"],
		["t_multi", [1], "INVALID_TYPE"],
		["t_user", "not-a-uuid", "INVALID_VALUE"],
		["t_user", randomUUID(), "USER_INVALID"],
		["t_user", f.ids.reader, "USER_INVALID"], // a member who cannot write CRM is not assignable
	];
	const before = await customOf("contact", c.id);
	for (const [key, value, code] of bad) {
		const r = await patch(mgr, "contacts", c.id, v, { properties: { [key]: value } });
		assert.equal(r.status, 422, `${key}=${JSON.stringify(value)}`);
		assert.equal(r.body.code, "VALIDATION_FAILED");
		assert.deepEqual(errs(r), [`${key}:${code}`], `${key}=${JSON.stringify(value)}`);
	}
	assert.deepEqual(await customOf("contact", c.id), before, "no rejected write changed the record");
	assert.equal((await get(mgr, "contacts", c.id)).body.data.version, v);
	// all violations at once
	const many = await patch(mgr, "contacts", c.id, v, { properties: { t_num: -1, t_text: 5, nope: 1 } });
	assert.equal(many.status, 422);
	assert.equal(many.body.code, "UNKNOWN_PROPERTY");
	assert.deepEqual(errs(many).sort(), ["nope:UNKNOWN_PROPERTY", "t_num:MIN_VALUE", "t_text:INVALID_TYPE"]);
});

test("B3 key rules: unknown / prototype / system-column / badly shaped keys and shape errors", async () => {
	await fresh();
	await prop("contact", "known", "text");
	const c = await contactWith();
	for (const key of ["nope", "__proto__", "constructor", "prototype", "display_name", "source", "custom", "BadKey", "a-b", "x".repeat(70)]) {
		const props = JSON.parse(`{${JSON.stringify(key)}:"v"}`); // JSON.parse keeps __proto__ as an own key
		const r = await patch(mgr, "contacts", c.id, c.version, { properties: props });
		assert.equal(r.status, 422, key);
		assert.equal(r.body.code, "UNKNOWN_PROPERTY", key);
		assert.equal(r.body.errors[0].code, "UNKNOWN_PROPERTY");
	}
	for (const bad of ["x", 5, ["known"], null, true]) {
		const r = await patch(mgr, "contacts", c.id, c.version, { properties: bad });
		assert.equal(r.status, 422, JSON.stringify(bad));
		assert.equal(r.body.code, "VALIDATION_FAILED");
	}
	const wide = Object.fromEntries(Array.from({ length: 101 }, (_, i) => [`k${i}`, "v"]));
	assert.deepEqual(errs(await patch(mgr, "contacts", c.id, c.version, { properties: wide })), [":TOO_MANY_PROPERTIES"]);
	assert.equal((await newContact(mgr, "x", { nope: "v" })).status, 422);
	assert.deepEqual(await customOf("contact", c.id), {});
	// the other body rules are unchanged
	assert.equal((await patch(mgr, "contacts", c.id, c.version, { custom: { known: "v" } })).status, 422);
	assert.equal((await patch(mgr, "contacts", c.id, c.version, { custom_search: "x" })).status, 422);
});

test("B3 required (create + non-clearable) and read_only", async () => {
	await fresh();
	await prop("lead", "must", "text", { required: true });
	await prop("lead", "frozen", "text", { read_only: true });
	await prop("contact", "cmust", "text", { required: true });
	const contact = f.ids.contact;
	const mk = (properties?: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
		call(mgr, "POST", "/v1/leads", {
			...cmd(),
			contact_id: contact,
			title: "L",
			source_evidence: "e",
			...(properties ? { properties } : {}),
			...extra,
		});
	let r = await mk();
	assert.equal(r.status, 422);
	assert.deepEqual(errs(r), ["must:REQUIRED"]);
	r = await mk({ must: null });
	assert.deepEqual(errs(r), ["must:REQUIRED"]);
	r = await mk({ must: "  " });
	assert.deepEqual(errs(r), ["must:REQUIRED"]);
	r = await mk({ must: "yes", frozen: "x" });
	assert.deepEqual(errs(r), ["frozen:READ_ONLY"], "read_only rejects writes, even on create");
	assert.equal((await one("SELECT count(*) n FROM crm.lead WHERE tenant_id=$1 AND title='L'", [f.ids.a])).n, "0");
	r = await mk({ must: "yes" });
	assert.equal(r.status, 201, JSON.stringify(r.body));
	const lead = r.body.data;
	// not clearable; an edit that does not touch it stays valid; read_only never writable (also not to clear)
	assert.deepEqual(errs(await patch(mgr, "leads", lead.id, lead.version, { properties: { must: null } })), ["must:REQUIRED"]);
	assert.deepEqual(errs(await patch(mgr, "leads", lead.id, lead.version, { properties: { must: "" } })), ["must:REQUIRED"]);
	assert.deepEqual(errs(await patch(mgr, "leads", lead.id, lead.version, { properties: { frozen: null } })), ["frozen:READ_ONLY"]);
	const t = await patch(mgr, "leads", lead.id, lead.version, { title: "L2" });
	assert.equal(t.status, 200);
	// a required property added AFTER the record exists does not block edits of that record (rules apply to new writes only)
	await prop("lead", "later", "text", { required: true });
	assert.equal((await patch(mgr, "leads", lead.id, t.body.data.version, { title: "L3" })).status, 200);
	assert.deepEqual(errs(await mk({ must: "yes" })), ["later:REQUIRED"]);
	// inline contact on a lead create: the contact's own required property applies to the inline contact
	r = await call(mgr, "POST", "/v1/leads", {
		...cmd(),
		title: "L4",
		source_evidence: "e",
		properties: { must: "m", later: "l" },
		contact: { display_name: "Inline" },
	});
	assert.deepEqual(errs(r), ["cmust:REQUIRED"]);
	r = await call(mgr, "POST", "/v1/leads", {
		...cmd(),
		title: "L4",
		source_evidence: "e",
		properties: { must: "m", later: "l" },
		contact: { display_name: "Inline", properties: { cmust: "c" } },
	});
	assert.equal(r.status, 201, JSON.stringify(r.body));
	assert.deepEqual(r.body.data.properties, { must: "m", later: "l" });
	const inline = await one("SELECT custom FROM crm.contact WHERE tenant_id=$1 AND display_name='Inline'", [f.ids.a]);
	assert.deepEqual(inline.custom, { cmust: "c" });
});

test("B3 archived property and archived option are rejected; an unchanged archived option stays; archived values are hidden but kept", async () => {
	await fresh();
	await prop("contact", "gone", "text");
	await prop("contact", "colour", "single_select", { options: ["r", "g", "b"].map((v) => ({ value: v, label: L(v) })) });
	await prop("contact", "tags", "multi_select", { options: ["p", "q", "r"].map((v) => ({ value: v, label: L(v) })) });
	const c = await contactWith({ gone: "keep me", colour: "b", tags: ["p", "q"] });
	await archiveOption("contact", "colour", "b");
	await archiveOption("contact", "tags", "q");
	let v = c.version;
	// unchanged archived values pass through an unrelated edit and a re-send of the same value
	let r = await patch(mgr, "contacts", c.id, v, { display_name: "Renamed", properties: { colour: "b", tags: ["p", "q"] } });
	assert.equal(r.status, 200, JSON.stringify(r.body));
	v = r.body.data.version;
	assert.equal(r.body.data.properties.colour, "b");
	assert.deepEqual((await lastAudit(c.id)).changed_fields.sort(), ["display_name"], "no-op properties are not listed as changed");
	// a NEW archived option is refused, on update and on create; an active one works and the archived one cannot come back
	r = await patch(mgr, "contacts", c.id, v, { properties: { tags: ["p", "q", "r"] } });
	assert.equal(r.status, 200, "q is kept (already selected), r is active");
	v = r.body.data.version;
	assert.equal((await newContact(mgr, "n", { colour: "b" })).status, 422);
	assert.deepEqual(errs(await newContact(mgr, "n", { tags: ["q"] })), ["tags:OPTION_ARCHIVED"]);
	r = await patch(mgr, "contacts", c.id, v, { properties: { colour: "g" } });
	assert.equal(r.status, 200);
	v = r.body.data.version;
	r = await patch(mgr, "contacts", c.id, v, { properties: { colour: "b" } });
	assert.deepEqual(errs(r), ["colour:OPTION_ARCHIVED"]);
	// archived property: writes rejected, hidden from reads (single + props=), the stored value is kept
	await archiveProp("contact", "gone");
	r = await patch(mgr, "contacts", c.id, v, { properties: { gone: "new" } });
	assert.equal(r.status, 422);
	assert.deepEqual(errs(r), ["gone:PROPERTY_ARCHIVED"]);
	r = await patch(mgr, "contacts", c.id, v, { properties: { gone: null } });
	assert.deepEqual(errs(r), ["gone:PROPERTY_ARCHIVED"]);
	assert.ok(!("gone" in (await get(mgr, "contacts", c.id)).body.data.properties));
	assert.equal((await call(mgr, "GET", "/v1/contacts?props=gone")).status, 422);
	assert.equal((await customOf("contact", c.id)).gone, "keep me");
});

test("B3 sensitive matrix: write needs the sensitive permission, unreadable sensitive keys look unknown, reads omit them, audit never holds values", async () => {
	await fresh();
	await prop("contact", "ssn", "text", { sensitive: true });
	await prop("contact", "note", "text", { searchable: true });
	await prop("deal", "dsens", "text", { sensitive: true });
	const SECRET = "SECRET-VALUE-4711";
	// manager: write + read
	const c = await contactWith({ ssn: SECRET, note: "visible note" });
	assert.equal(c.properties.ssn, SECRET);
	// rep (sensitive.* scope 'assigned'): own record yes
	const own = await contactWith({ ssn: "rep-secret", note: "n" }, "rep own", rep);
	assert.equal(own.properties.ssn, "rep-secret");
	assert.equal((await get(rep, "contacts", own.id)).body.data.properties.ssn, "rep-secret");
	// ... another owner's record: neither read nor write
	assert.equal((await get(rep, "contacts", c.id)).status, 403);
	assert.equal((await patch(rep, "contacts", c.id, c.version, { properties: { ssn: "x" } })).status, 403);
	// reader (no sensitive.read, no write): value omitted, other values visible, write 403, props= of it = unknown
	const rd = (await get(reader, "contacts", c.id)).body.data;
	assert.deepEqual(rd.properties, { note: "visible note" });
	assert.equal((await patch(reader, "contacts", c.id, c.version, { properties: { note: "x" } })).status, 403);
	assert.equal((await newContact(reader, "n", { note: "x" })).status, 403);
	let r = await call(reader, "GET", "/v1/contacts?props=ssn");
	assert.equal(r.status, 422);
	assert.equal(r.body.code, "UNKNOWN_PROPERTY");
	r = await call(reader, "GET", "/v1/contacts?props=note");
	assert.equal(r.status, 200);
	assert.ok(r.body.data.every((x: { properties: Record<string, unknown> }) => !("ssn" in x.properties)));
	r = await call(mgr, "GET", "/v1/contacts?props=ssn,note");
	assert.equal(r.body.data.find((x: { id: string }) => x.id === c.id).properties.ssn, SECRET);
	// agency under a fixed-deal grant has no sensitive.read: the sensitive key is indistinguishable from an unknown one
	r = await patch(agencyGrant, "deals", f.ids.dealA, 0, { properties: { dsens: "x" } });
	assert.equal(r.status, 422);
	assert.equal(r.body.code, "UNKNOWN_PROPERTY");
	assert.deepEqual(errs(r), ["dsens:UNKNOWN_PROPERTY"]);
	// a sensitive property that is made sensitive later is hidden from readers at once (read filters by the CURRENT definition)
	const pv = await propVersion("contact", "note");
	assert.equal(
		(await call(mgr, "PATCH", "/v1/schema/contact/properties/note", { ...cmd(), expected_version: pv, searchable: false, sensitive: true })).status,
		200,
	);
	assert.deepEqual((await get(reader, "contacts", c.id)).body.data.properties, {});
	// audit / events / outbox / receipts never contain the value; the key name is listed
	const patched = await patch(mgr, "contacts", c.id, c.version, { properties: { ssn: "SECOND-SECRET-99" } });
	assert.equal(patched.status, 200);
	assert.ok((await lastAudit(c.id)).changed_fields.includes("custom:ssn"));
	for (const needle of [SECRET, "SECOND-SECRET-99", "rep-secret"])
		for (const t of ["audit_log", "business_event", "outbox", "inbox", "command_retry"])
			assert.equal(
				(await one(`SELECT count(*) n FROM crm.${t} x WHERE x::text LIKE $1`, [`%${needle}%`])).n,
				"0",
				`${t} must not hold ${needle}`,
			);
});

test("B3 partial update, null/empty clears, changed_fields = property keys only, version +1", async () => {
	await fresh();
	await prop("contact", "a", "text");
	await prop("contact", "b", "text");
	await prop("contact", "m", "multi_select", { options: [{ value: "x", label: L("x") }] });
	const c = await contactWith({ a: "1", b: "2", m: ["x"] });
	assert.deepEqual(await lastAudit(c.id), { action: "contact.created", changed_fields: ["display_name", "owner_id", "source", "custom:a", "custom:b", "custom:m"] });
	let r = await patch(mgr, "contacts", c.id, c.version, { properties: { b: "22" } });
	assert.deepEqual(r.body.data.properties, { a: "1", b: "22", m: ["x"] }, "other keys untouched");
	assert.equal(r.body.data.version, c.version + 1);
	assert.deepEqual((await lastAudit(c.id)).changed_fields, ["custom:b"]);
	r = await patch(mgr, "contacts", c.id, r.body.data.version, { properties: { b: null, a: "" } });
	assert.deepEqual(r.body.data.properties, { m: ["x"] });
	assert.deepEqual(await customOf("contact", c.id), { m: ["x"] }, "cleared = key removed, no null stored");
	assert.deepEqual((await lastAudit(c.id)).changed_fields.sort(), ["custom:a", "custom:b"]);
	r = await patch(mgr, "contacts", c.id, r.body.data.version, { properties: { m: [] } });
	assert.deepEqual(r.body.data.properties, {});
	// clearing an absent key and re-sending a value change nothing (version still +1: any PATCH is a write) and list no key
	const v = r.body.data.version;
	r = await patch(mgr, "contacts", c.id, v, { properties: { a: null, b: "" } });
	assert.equal(r.status, 200);
	assert.equal(r.body.data.version, v + 1);
	assert.deepEqual((await lastAudit(c.id)).changed_fields, []);
	// properties together with standard fields
	r = await patch(mgr, "contacts", c.id, v + 1, { display_name: "New name", properties: { a: "z" } });
	assert.deepEqual((await lastAudit(c.id)).changed_fields.sort(), ["custom:a", "display_name"]);
});

test("B3 version conflict, concurrent PATCH, idempotent replay and receipt conflict", async () => {
	await fresh();
	await prop("contact", "a", "text");
	const c = await contactWith({ a: "0" });
	const ok = await patch(mgr, "contacts", c.id, c.version, { properties: { a: "1" } });
	assert.equal(ok.status, 200);
	// stale expected_version: 409, nothing written
	const stale = await patch(mgr, "contacts", c.id, c.version, { properties: { a: "stale" } });
	assert.equal(stale.status, 409);
	assert.equal(stale.body.code, "VERSION_CONFLICT");
	assert.equal((await customOf("contact", c.id)).a, "1");
	// concurrent PATCH on the same version: exactly one wins
	const v = ok.body.data.version;
	const both = await Promise.all([
		patch(mgr, "contacts", c.id, v, { properties: { a: "left" } }),
		patch(mgr, "contacts", c.id, v, { properties: { a: "right" } }),
	]);
	assert.deepEqual(both.map((x) => x.status).sort(), [200, 409]);
	const winner = both.find((x) => x.status === 200) as Res;
	assert.equal((await customOf("contact", c.id)).a, winner.body.data.properties.a);
	// replay: same command + key + body -> replayed, applied once
	const body = { ...cmd(), expected_version: winner.body.data.version, properties: { a: "once" } };
	const key = randomUUID();
	const first = await call(mgr, "PATCH", `/v1/contacts/${c.id}`, body, key);
	const again = await call(mgr, "PATCH", `/v1/contacts/${c.id}`, body, key);
	assert.equal(first.status, 200);
	assert.equal(again.status, 200);
	assert.equal(first.body.data.replayed, false);
	assert.equal(again.body.data.replayed, true);
	assert.equal(again.body.data.version, first.body.data.version, "applied exactly once");
	assert.equal(
		(await one("SELECT count(*) n FROM crm.audit_log WHERE object_id=$1 AND action='contact.updated'", [c.id])).n,
		"3", // ok, winner, once
	);
	// same command_id, different properties -> conflict, nothing applied
	const other = await call(mgr, "PATCH", `/v1/contacts/${c.id}`, { ...body, properties: { a: "different" } }, randomUUID());
	assert.equal(other.status, 409);
	assert.equal(other.body.code, "IDEMPOTENCY_CONFLICT");
	assert.equal((await customOf("contact", c.id)).a, "once");
	// create replay
	const create = { ...cmd(), display_name: "Replay", properties: { a: "r" } };
	const k2 = randomUUID();
	const c1 = await call(mgr, "POST", "/v1/contacts", create, k2);
	const c2 = await call(mgr, "POST", "/v1/contacts", create, k2);
	assert.equal(c1.body.data.id, c2.body.data.id);
	assert.equal(c2.body.data.replayed, true);
	assert.equal((await one("SELECT count(*) n FROM crm.contact WHERE tenant_id=$1 AND display_name='Replay'", [f.ids.a])).n, "1");
});

test("B3 custom_search: folded text of searchable non-sensitive properties; q finds it; truncation at 8192 bytes; size cap", async () => {
	await fresh();
	await prop("contact", "note", "text", { searchable: true });
	await prop("contact", "other", "text"); // not searchable
	await prop("contact", "secret", "text", { sensitive: true });
	await prop("contact", "big", "long_text", { searchable: true, validation: { max_length: 20000 } });
	await prop("contact", "l1", "long_text", { validation: { max_length: 20000 } });
	await prop("contact", "l2", "long_text", { validation: { max_length: 20000 } });
	await prop("contact", "l3", "long_text", { validation: { max_length: 20000 } });
	const c = await contactWith({ note: "أحمد الإسكندري", other: "hidden-needle", secret: "classified-needle" }, "Plain Name");
	const row = await one("SELECT custom_search s FROM crm.contact WHERE id=$1", [c.id]);
	assert.equal(row.s, "احمد الاسكندري", "folded (Arabic alef variants) and ONLY the searchable value");
	const q = async (needle: string, kind = "contacts") =>
		(await call(mgr, "GET", `/v1/${kind}?q=${encodeURIComponent(needle)}`)).body.data.map((x: { id: string }) => x.id);
	assert.deepEqual(await q("أحمد"), [c.id], "typed with hamza");
	assert.deepEqual(await q("احمد"), [c.id], "typed without");
	assert.deepEqual(await q("الاسكندري"), [c.id]);
	assert.deepEqual(await q("hidden-needle"), [], "non-searchable property never matches");
	assert.deepEqual(await q("classified-needle"), [], "sensitive never matches");
	assert.deepEqual(await q("plain name"), [c.id], "display name search unchanged");
	assert.ok(!(await one("SELECT custom_search s FROM crm.contact WHERE id=$1", [c.id])).s.includes("classified"));
	assert.deepEqual((await call(reader, "GET", `/v1/contacts?q=${encodeURIComponent("احمد")}`)).body.data.map((x: { id: string }) => x.id), [c.id]);
	// clearing removes it from the search text
	const cleared = await patch(mgr, "contacts", c.id, c.version, { properties: { note: null } });
	assert.equal((await one("SELECT custom_search s FROM crm.contact WHERE id=$1", [c.id])).s, "");
	assert.deepEqual(await q("احمد"), []);
	// truncation: 'a' + Arabic (2 bytes each) so the 8192-byte cut falls inside a character; never invalid UTF-8
	const long = `a${"ب".repeat(4500)}`;
	const t = await patch(mgr, "contacts", c.id, cleared.body.data.version, { properties: { big: long } });
	assert.equal(t.status, 200, JSON.stringify(t.body).slice(0, 300));
	const s = (await one("SELECT custom_search s, octet_length(custom_search) n FROM crm.contact WHERE id=$1", [c.id])) as { s: string; n: number };
	assert.ok(s.n <= 8192 && s.n >= 8190, `octet_length ${s.n}`);
	assert.ok(!s.s.includes("�"), "no split character");
	assert.ok(long.startsWith(s.s), "a clean prefix of the folded text");
	assert.equal(t.body.data.properties.big, long, "the stored value is not truncated, only the search text");
	// the merged blob cap (24,000 bytes of JSON): two 8100-char values fit, the third does not; nothing is written
	let v = t.body.data.version as number;
	let r = await patch(mgr, "contacts", c.id, v, { properties: { big: null, l1: "x".repeat(8100) } });
	assert.equal(r.status, 200, JSON.stringify(r.body).slice(0, 200));
	r = await patch(mgr, "contacts", c.id, r.body.data.version, { properties: { l2: "y".repeat(8100) } });
	assert.equal(r.status, 200);
	v = r.body.data.version;
	r = await patch(mgr, "contacts", c.id, v, { properties: { l3: "z".repeat(8100) } });
	assert.equal(r.status, 422);
	assert.equal(r.body.code, "PROPERTIES_TOO_LARGE");
	assert.equal((await customOf("contact", c.id)).l3, undefined);
	// q on leads/deals/tasks also reads their own custom_search
	await prop("lead", "lnote", "text", { searchable: true });
	const lead = await call(mgr, "POST", "/v1/leads", { ...cmd(), contact_id: f.ids.contact, title: "Lead T", source_evidence: "e", properties: { lnote: "findme-lead" } });
	assert.equal(lead.status, 201);
	assert.deepEqual(await q("findme-lead", "leads"), [lead.body.data.id]);
});

test("B3 list: no properties by default (never the blob); props= projects only the requested active keys", async () => {
	await fresh();
	await prop("contact", "a", "text");
	await prop("contact", "b", "text");
	await prop("contact", "c", "text");
	const c = await contactWith({ a: "A", b: "B", c: "C" }, "Listed");
	for (const url of ["/v1/contacts", "/v1/contacts?limit=5", "/v1/contacts?q=Listed", "/v1/contacts?sort=display_name"]) {
		const r = await call(mgr, "GET", url);
		assert.equal(r.status, 200, url);
		for (const row of r.body.data) {
			assert.ok(!("properties" in row) && !("custom" in row) && !("custom_search" in row), `${url}: ${Object.keys(row)}`);
		}
	}
	let r = await call(mgr, "GET", "/v1/contacts?props=a,c");
	assert.deepEqual(r.body.data.find((x: { id: string }) => x.id === c.id).properties, { a: "A", c: "C" });
	assert.ok(r.body.data.every((x: { properties: object }) => x.properties !== undefined), "every row carries properties when asked");
	assert.ok(r.body.data.every((x: { custom?: unknown }) => !("custom" in x)));
	r = await call(mgr, "GET", "/v1/contacts?props=");
	assert.deepEqual(r.body.data.find((x: { id: string }) => x.id === c.id).properties, {});
	for (const bad of ["zzz", "a,zzz", "a,a", "__proto__", "A", `a,${"k".repeat(70)}`, Array.from({ length: 21 }, () => "a").join(",")]) {
		const x = await call(mgr, "GET", `/v1/contacts?props=${bad}`);
		assert.equal(x.status, 422, bad);
	}
	// with filters / cursor paging the projection still applies to every page
	for (let i = 0; i < 4; i++) await contactWith({ a: `n${i}` }, `Paged ${i}`);
	const page1 = await call(mgr, "GET", "/v1/contacts?props=a&sort=display_name&limit=3");
	assert.equal(page1.body.data.length, 3);
	assert.ok(page1.body.has_more);
	const page2 = await call(mgr, "GET", `/v1/contacts?props=a&sort=display_name&limit=3&cursor=${page1.body.next_cursor}`);
	assert.ok(page2.body.data.every((x: { properties: object }) => "properties" in x));
});

test("B3 two-tenant isolation: another tenant's definitions, values and records are unreachable", async () => {
	await fresh();
	await prop("contact", "only_a", "text", { searchable: true });
	await prop("contact", "shared_key", "single_select", { options: [{ value: "a1", label: L("A1") }] });
	await prop("contact", "shared_key", "text", {}, mgrB);
	const a = await contactWith({ only_a: "tenant-a-value", shared_key: "a1" });
	// B cannot use A's key, nor reuse A's option set for its own same-named key
	assert.deepEqual(errs(await newContact(mgrB, "B contact", { only_a: "x" })), ["only_a:UNKNOWN_PROPERTY"]);
	const own = await newContact(mgrB, "B own", { shared_key: "a1" });
	assert.equal(own.status, 201, "B's own shared_key is text: 'a1' is just text there");
	assert.deepEqual(own.body.data.properties, { shared_key: "a1" });
	// B cannot read or write A's record, and A's values do not appear in B's lists or search
	assert.ok([403, 404].includes((await get(mgrB, "contacts", a.id)).status));
	assert.ok([403, 404].includes((await patch(mgrB, "contacts", a.id, a.version, { properties: { shared_key: "zz" } })).status));
	assert.ok([403, 404].includes((await call({ tenant: f.ids.a, token: f.tokens.agency }, "GET", `/v1/contacts/${a.id}`)).status));
	const list = await call(mgrB, "GET", "/v1/contacts?props=shared_key");
	assert.equal(list.status, 200);
	assert.ok(!JSON.stringify(list.body).includes("tenant-a-value"));
	assert.equal((await call(mgrB, "GET", "/v1/contacts?props=only_a")).status, 422);
	assert.deepEqual((await call(mgrB, "GET", `/v1/contacts?q=${encodeURIComponent("tenant-a-value")}`)).body.data, []);
	assert.equal((await customOf("contact", a.id)).only_a, "tenant-a-value");
	// the database itself: B's runtime context cannot even see A's property or its values
	const probe = new pg.Client({ connectionString: process.env.DATABASE_URL });
	await probe.connect();
	try {
		await probe.query("BEGIN");
		await probe.query("SELECT set_config('crm.tenant',$1,true),set_config('crm.token',$2,true)", [f.ids.b, f.tokens.agency]);
		assert.equal((await probe.query("SELECT count(*) n FROM crm.property_definition WHERE key='only_a'")).rows[0].n, "0");
		assert.equal((await probe.query("SELECT count(*) n FROM crm.contact WHERE custom ? 'only_a'")).rows[0].n, "0");
		await probe.query("ROLLBACK");
	} finally {
		await probe.end();
	}
});

test("B3 all four objects: create + patch + read with properties; legacy create untouched", async () => {
	await fresh();
	for (const o of ["contact", "lead", "deal", "task"]) await prop(o, "x", "text", { searchable: true });
	await prop("deal", "n", "number");
	await prop("task", "flag", "checkbox");
	const lead = await call(mgr, "POST", "/v1/leads", { ...cmd(), contact_id: f.ids.contact, title: "L", source_evidence: "e", properties: { x: "lead x" } });
	assert.equal(lead.status, 201, JSON.stringify(lead.body));
	const deal = await call(mgr, "POST", "/v1/deals", { ...cmd(), contact_id: f.ids.contact, pipeline_id: f.ids.pipeline, stage_id: f.ids.start, title: "D", properties: { x: "deal x", n: 7 } });
	assert.equal(deal.status, 201, JSON.stringify(deal.body));
	const task = await call(mgr, "POST", "/v1/tasks", { ...cmd(), contact_id: f.ids.contact, title: "T", due_at: "2030-01-01T00:00:00Z", properties: { x: "task x", flag: true } });
	assert.equal(task.status, 201, JSON.stringify(task.body));
	assert.deepEqual(deal.body.data.properties, { x: "deal x", n: 7 });
	assert.deepEqual(task.body.data.properties, { x: "task x", flag: true });
	for (const [kind, table, rec] of [["leads", "lead", lead], ["deals", "deal", deal], ["tasks", "task", task]] as const) {
		const r = await patch(mgr, kind, rec.body.data.id, rec.body.data.version, { properties: { x: "changed" } });
		assert.equal(r.status, 200, kind);
		assert.equal(r.body.data.properties.x, "changed");
		assert.equal((await one(`SELECT custom_search s FROM crm.${table} WHERE id=$1`, [rec.body.data.id])).s, "changed");
		assert.ok((await lastAudit(rec.body.data.id)).changed_fields.includes("custom:x"));
		assert.deepEqual(errs(await patch(mgr, kind, rec.body.data.id, r.body.data.version, { properties: { nope: 1 } })), ["nope:UNKNOWN_PROPERTY"]);
	}
	// an existing seeded deal (created before any property) reads {} and an old-style PATCH still works
	const old = await get(mgr, "deals", f.ids.dealA);
	assert.deepEqual(old.body.data.properties, {});
	assert.equal((await patch(mgr, "deals", f.ids.dealA, old.body.data.version, { title: "Renamed" })).status, 200);
	assert.equal((await one("SELECT custom::text c, custom_search s FROM crm.deal WHERE id=$1", [f.ids.dealA])).c, "{}");
	// a property of another object is unknown here
	const tk = (await get(mgr, "tasks", task.body.data.id)).body.data;
	const bad = await patch(mgr, "tasks", tk.id, tk.version, { properties: { n: 1 } });
	assert.equal(bad.body.code, "UNKNOWN_PROPERTY");
});

test("B3 contact merge: target wins per key, source-only keys fill in, listed in preview and audit; search rebuilt; too large refused", async () => {
	await fresh();
	await prop("contact", "t", "text", { searchable: true });
	await prop("contact", "note", "text", { searchable: true });
	await prop("contact", "m", "multi_select", { options: ["x", "y"].map((v) => ({ value: v, label: L(v) })) });
	await prop("contact", "ssn", "text", { sensitive: true });
	await prop("contact", "l1", "long_text", { validation: { max_length: 20000 } });
	await prop("contact", "l2", "long_text", { validation: { max_length: 20000 } });
	await prop("contact", "l3", "long_text", { validation: { max_length: 20000 } });
	const target = await contactWith({ t: "target text", m: ["y"] }, "Target");
	const source = await contactWith({ t: "source text", note: "الأحمد", m: ["x"], ssn: "S-123" }, "Source");
	const pv = await call(mgr, "POST", "/v1/contacts/merge-previews", { source_id: source.id, target_id: target.id });
	assert.equal(pv.status, 200, JSON.stringify(pv.body));
	assert.deepEqual(pv.body.data.custom, { fill: ["note", "ssn"], conflicts: ["m", "t"], fits: true });
	assert.deepEqual(pv.body.data.conflicts, ["display_name: target retained"], "existing field list unchanged");
	const body = { ...cmd(), source_id: source.id, target_id: target.id, source_version: source.version, target_version: target.version };
	const key = randomUUID();
	const m = await call(mgr, "POST", "/v1/contacts/merges", body, key);
	assert.equal(m.status, 202, JSON.stringify(m.body));
	assert.deepEqual(await customOf("contact", target.id), { t: "target text", m: ["y"], note: "الأحمد", ssn: "S-123" });
	assert.deepEqual((await customOf("contact", source.id)).t, "source text", "the merged-away record keeps its own values");
	assert.equal((await one("SELECT custom_search s FROM crm.contact WHERE id=$1", [target.id])).s, `target text\u001fالاحمد`);
	const audit = await one("SELECT changed_fields FROM crm.audit_log WHERE object_id=$1 AND action='contact.merge_received'", [target.id]);
	assert.deepEqual(audit.changed_fields, ["identifiers", "references", "custom:note", "custom:ssn"]);
	assert.equal((await one("SELECT count(*) n FROM crm.audit_log x WHERE x::text LIKE '%S-123%'")).n, "0");
	assert.equal((await get(reader, "contacts", target.id)).body.data.properties.ssn, undefined);
	assert.equal((await get(mgr, "contacts", target.id)).body.data.properties.note, "الأحمد");
	const q = await call(mgr, "GET", `/v1/contacts?q=${encodeURIComponent("احمد")}`);
	assert.deepEqual(q.body.data.map((x: { id: string }) => x.id), [target.id]);
	// replay does not apply twice
	const again = await call(mgr, "POST", "/v1/contacts/merges", body, key);
	assert.equal(again.body.data.replayed, true);
	assert.equal((await one("SELECT count(*) n FROM crm.audit_log WHERE object_id=$1 AND action='contact.merge_received'", [target.id])).n, "1");
	// too large to merge: refused with nothing applied
	const t2 = await contactWith({ l3: "c".repeat(9000) }, "Target2");
	let s2 = await contactWith({ l1: "a".repeat(9000) }, "Source2");
	const r = await patch(mgr, "contacts", s2.id, s2.version, { properties: { l2: "b".repeat(9000) } });
	s2 = { ...s2, version: r.body.data.version };
	const pv2 = await call(mgr, "POST", "/v1/contacts/merge-previews", { source_id: s2.id, target_id: t2.id });
	assert.equal(pv2.body.data.custom.fits, false);
	const big = await call(mgr, "POST", "/v1/contacts/merges", { ...cmd(), source_id: s2.id, target_id: t2.id, source_version: s2.version, target_version: t2.version });
	assert.equal(big.status, 422);
	assert.equal(big.body.code, "PROPERTIES_TOO_LARGE");
	assert.equal((await one("SELECT merged_into_id FROM crm.contact WHERE id=$1", [s2.id])).merged_into_id, null);
	assert.deepEqual(Object.keys(await customOf("contact", t2.id)), ["l3"]);
});

test("B3 session capability flags: schema_read and property_manage", async () => {
	await fresh();
	const flags = async (who: Who) => (await call(who, "GET", "/v1/session")).body.data;
	const m = await flags(mgr);
	assert.equal(m.schema_read, true);
	assert.equal(m.property_manage, true);
	for (const who of [rep, reader]) {
		const x = await flags(who);
		assert.equal(x.schema_read, true);
		assert.equal(x.property_manage, false);
	}
	// existing flags unchanged
	assert.deepEqual(Object.keys(m).sort(), ["actor", "audit", "configure", "merge", "property_manage", "schema_read", "sensitive_read", "sensitive_write"]);
	assert.equal(m.merge, true);
	assert.equal((await flags(reader)).merge, false);
});

test("B3 writing properties does not weaken a schema write: schema writers and record writers serialise on the object_type row", async () => {
	await fresh();
	await prop("contact", "a", "text");
	// hold the object_type lock FOR UPDATE (what every B2 schema write does) and prove a record write with properties waits for it
	const blocker = new pg.Client({ connectionString: process.env.ADMIN_DATABASE_URL });
	await blocker.connect();
	try {
		await blocker.query("BEGIN");
		await blocker.query("SELECT 1 FROM crm.object_type WHERE tenant_id=$1 AND key='contact' FOR UPDATE", [f.ids.a]);
		const started = Date.now();
		const pending = newContact(mgr, "Waits", { a: "v" });
		const raced = await Promise.race([pending.then(() => "done"), new Promise((r) => setTimeout(() => r("waiting"), 700))]);
		assert.equal(raced, "waiting", "record write must wait for an in-flight schema write");
		await blocker.query("COMMIT");
		const r = await pending;
		assert.equal(r.status, 201);
		assert.ok(Date.now() - started >= 600);
	} finally {
		await blocker.end();
	}
});

// R09 protected system fields: metadata, permissions, encryption, primary selection and atomic rollback.
test("R09 contact/lead fields are normalized, encrypted, masked and absent from search/filter oracles", async () => {
 await fresh();
 const created=await call(mgr,"POST","/v1/contacts",{...cmd(),display_name:"R09 fields",email:" A@EXAMPLE.COM ",phone:"٠١٠٠١٢٣٤٥٦٧",company:"شركة Example",job_title:"مدير"});
 assert.equal(created.status,201,JSON.stringify(created.body));
 const c=created.body.data;
 assert.equal(c.email,"a@example.com"); assert.equal(c.phone,"+201001234567"); assert.equal(c.company,"شركة Example"); assert.equal(c.job_title,"مدير"); assert.equal(c.sensitive_masked,false);
 assert.deepEqual(c.properties,{});
 const encrypted=await one("SELECT company_encrypted,job_title_encrypted,custom,custom_search FROM crm.contact WHERE tenant_id=$1 AND id=$2",[mgr.tenant,c.id]);
 assert.ok(Buffer.isBuffer(encrypted.company_encrypted)); assert.ok(!encrypted.company_encrypted.includes(Buffer.from("Example")));
 assert.deepEqual(encrypted.custom,{}); assert.equal(encrypted.custom_search,"");
 const lead=await call(mgr,"POST","/v1/leads",{...cmd(),contact_id:c.id,title:"R09 lead",source_evidence:"manual"});
 assert.equal(lead.status,201,JSON.stringify(lead.body)); assert.equal(lead.body.data.email,c.email);
 for (const kind of ["contacts","leads"]) {
  const identifier=kind === "contacts" ? c.id : lead.body.data.id;
  for (const route of [`/v1/${kind}/${identifier}`,`/v1/${kind}`]) {
   const result=await call(reader,"GET",route); assert.equal(result.status,200);
   const row=Array.isArray(result.body.data) ? result.body.data.find((r:{id:string})=>r.id === identifier) : result.body.data;
   assert.equal(row.sensitive_masked,true);assert.equal(row.email,null);assert.equal(row.phone,null);
   if (kind === "contacts") {assert.equal(row.company,null);assert.equal(row.job_title,null);}
   assert.ok(!JSON.stringify(result.body).includes("a@example.com"));
  }
  const search=await call(reader,"GET",`/v1/${kind}?q=a%40example.com`);assert.equal(search.body.data.length,0);
  const filtered=await call(reader,"GET",`/v1/${kind}?filter=${encodeURIComponent(JSON.stringify({field:"email",op:"eq",value:c.email}))}`);assert.equal(filtered.status,422);
 }
 const schema=await call(reader,"GET","/v1/schema/contact");
 for (const field of ["email","phone","company","job_title"]) {
  const definition=schema.body.data.properties.find((d:{system_field:string})=>d.system_field === field);
  assert.ok(definition?.is_system && definition.sensitive && definition.show_default);assert.equal(definition.storage,"protected");
 }
 const oldCount=Number((await one("SELECT count(*) n FROM crm.contact_identifier WHERE tenant_id=$1 AND contact_id=$2",[mgr.tenant,c.id])).n);
 const patchGood=await patch(mgr,"contacts",c.id,c.version,{email:"other@example.com"});assert.equal(patchGood.status,200);assert.equal(patchGood.body.data.email,"other@example.com");
 assert.equal(Number((await one("SELECT count(*) n FROM crm.contact_identifier WHERE tenant_id=$1 AND contact_id=$2",[mgr.tenant,c.id])).n),oldCount+1);
 const before=await one("SELECT version,company_encrypted FROM crm.contact WHERE tenant_id=$1 AND id=$2",[mgr.tenant,c.id]);
 const bad=await patch(mgr,"contacts",c.id,patchGood.body.data.version,{company:"must roll back",phone:"bad"});assert.equal(bad.status,422);
 const after=await one("SELECT version,company_encrypted FROM crm.contact WHERE tenant_id=$1 AND id=$2",[mgr.tenant,c.id]);assert.deepEqual(after,before);
 const denied=await patch(reader,"contacts",c.id,patchGood.body.data.version,{email:"hidden@example.com"});assert.equal(denied.status,403);
 const agency=await call(agencyGrant,"GET",`/v1/contacts/${c.id}`);assert.equal(agency.status,403);
});
test("R09 assigned rep sees/writes own fields; both lead and contact permission are required", async () => {
 await fresh();
 const session=await call(rep,"GET","/v1/session");assert.equal(session.body.data.sensitive_read,true);assert.equal(session.body.data.sensitive_write,true);
 const created=await call(rep,"POST","/v1/contacts",{...cmd(),display_name:"Rep own",email:"rep@example.com",company:"Own"});assert.equal(created.status,201,JSON.stringify(created.body));assert.equal(created.body.data.email,"rep@example.com");
 const c=created.body.data;
 const changed=await patch(rep,"contacts",c.id,c.version,{phone:"01001234567"});assert.equal(changed.status,200);assert.equal(changed.body.data.phone,"+201001234567");
 const lead=await call(rep,"POST","/v1/leads",{...cmd(),contact_id:c.id,title:"Rep lead",source_evidence:"manual"});assert.equal(lead.status,201);assert.equal(lead.body.data.email,c.email);
 const fromLead=await patch(rep,"leads",lead.body.data.id,lead.body.data.version,{email:"lead-primary@example.com"});assert.equal(fromLead.status,200);assert.equal(fromLead.body.data.email,"lead-primary@example.com");
 assert.equal((await get(rep,"contacts",c.id)).body.data.version,changed.body.data.version+1);
 lead.body.data=fromLead.body.data;
 await admin.query("UPDATE crm.contact SET owner_id=$3 WHERE tenant_id=$1 AND id=$2",[mgr.tenant,c.id,f.ids.manager]);
 const hidden=await call(rep,"GET",`/v1/leads/${lead.body.data.id}`);assert.equal(hidden.status,200);assert.equal(hidden.body.data.sensitive_masked,true);assert.equal(hidden.body.data.email,null);
 const noWrite=await patch(rep,"leads",lead.body.data.id,lead.body.data.version,{email:"forbidden@example.com"});assert.equal(noWrite.status,403);
});
test("R09 new property types validate on server, normalize accepted values and reject rollback writes",async()=>{
 await fresh();
 for (const type of ["email","phone","url"]) await prop("contact",`typed_${type}`,type);
 const c=await contactWith({typed_email:" X@EXAMPLE.COM ",typed_phone:"01001234567",typed_url:"https://example.com"});
 const visible=await get(mgr,"contacts",c.id);assert.deepEqual(visible.body.data.properties,{typed_email:"x@example.com",typed_phone:"+201001234567",typed_url:"https://example.com/"});
 for (const [key,value] of [["typed_email","invalid"],["typed_phone","abc"],["typed_url","javascript:alert(1)"]]) {
  const result=await patch(mgr,"contacts",c.id,c.version,{display_name:"Must roll back",properties:{[String(key)]:value}});assert.equal(result.status,422);
 }
 const after=await get(mgr,"contacts",c.id);assert.equal(after.body.data.version,c.version);assert.equal(after.body.data.display_name,"B3 contact");
});
test("R09 seed/backfill retains colliding custom keys and values and repeats without duplicates",async()=>{
 await fresh();
 // Rehearse the exact additive backfill against pre-028 metadata, including legitimate custom keys.
 await admin.query("DELETE FROM crm.property_definition WHERE tenant_id=$1 AND storage='protected'",[mgr.tenant]);
 const c=await contactWith();
 for (const key of ["email","phone","company","job_title","system_email"]) {
  await prop("contact",key,"text");
 }
 const values={email:"custom email",phone:"custom phone",company:"custom company",job_title:"custom title",system_email:"custom alternate"};
 await admin.query("UPDATE crm.contact SET custom=$3::jsonb WHERE tenant_id=$1 AND id=$2",[mgr.tenant,c.id,JSON.stringify(values)]);
 await admin.query("SELECT crm.seed_contact_system_properties($1)",[mgr.tenant]);
 const before=(await admin.query("SELECT id,key,system_field FROM crm.property_definition WHERE tenant_id=$1 ORDER BY id",[mgr.tenant])).rows;
 await admin.query("SELECT crm.seed_system_properties($1)",[mgr.tenant]);
 assert.deepEqual((await admin.query("SELECT id,key,system_field FROM crm.property_definition WHERE tenant_id=$1 ORDER BY id",[mgr.tenant])).rows,before);
 assert.deepEqual(await customOf("contact",c.id),values);
 const defs=(await call(mgr,"GET","/v1/schema/contact")).body.data.properties;
 assert.equal(defs.find((d:{system_field:string})=>d.system_field === "email").key,"system_email_2");
 for (const field of ["email","phone","company","job_title"]) {
  assert.ok(defs.find((d:{key:string;is_system:boolean})=>d.key === field && !d.is_system));
  assert.ok(defs.find((d:{system_field:string;storage:string})=>d.system_field === field && d.storage === "protected"));
 }
 const noPublic=await one("SELECT count(*)::int n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace CROSS JOIN LATERAL aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a WHERE n.nspname='crm' AND p.proname IN ('identifier_value_scoped','contact_business_fields','seed_contact_system_properties','seed_system_properties') AND a.grantee=0 AND a.privilege_type='EXECUTE'");assert.equal(noPublic.n,0);
 const rls=(await admin.query("SELECT relrowsecurity,relforcerowsecurity FROM pg_class WHERE oid IN ('crm.contact'::regclass,'crm.contact_identifier'::regclass,'crm.property_definition'::regclass)")).rows;assert.ok(rls.every(r=>r.relrowsecurity && r.relforcerowsecurity));
});

test("R09 actual migration 028 preserves populated records and ciphertext, then repeats seeds",async()=>{
 await fresh();
 const snapshot=async()=>(await admin.query("SELECT (SELECT count(*) FROM crm.contact) contacts,(SELECT count(*) FROM crm.lead) leads,(SELECT count(*) FROM crm.contact_identifier) identifiers,(SELECT md5(string_agg(encode(encrypted_value,'hex'),'' ORDER BY tenant_id,id)) FROM crm.contact_identifier) ciphertext")).rows[0];
 const before=await snapshot();
 await admin.query("BEGIN");
 try {
  // Reconstruct only the additive pre-028 surface; the entire populated rehearsal is rolled back.
  await admin.query("DELETE FROM crm.property_definition WHERE storage='protected'");
  await admin.query("DROP FUNCTION crm.contact_business_fields(uuid,uuid); DROP FUNCTION crm.identifier_value_scoped(uuid,uuid); DROP FUNCTION crm.seed_contact_system_properties(uuid); DROP FUNCTION crm.seed_system_properties(uuid); ALTER FUNCTION crm.seed_system_properties_pre028(uuid) RENAME TO seed_system_properties");
  await admin.query("ALTER TABLE crm.contact DROP COLUMN company_encrypted,DROP COLUMN job_title_encrypted; ALTER TABLE crm.contact_identifier DROP COLUMN is_primary; ALTER TABLE crm.property_definition DROP COLUMN system_field, DROP CONSTRAINT registry_types, DROP CONSTRAINT registry_storage, DROP CONSTRAINT registry_column, DROP CONSTRAINT registry_system");
  await admin.query("ALTER TABLE crm.property_definition ADD CHECK(type IN ('text','long_text','number','currency','date','datetime','single_select','multi_select','checkbox','user')) NOT VALID,ADD CHECK(storage IN ('column','custom','record')),ADD CHECK((storage='column')=(column_name IS NOT NULL)),ADD CHECK(NOT is_system OR storage='column') NOT VALID");
  await admin.query(await readFile(new URL("../migrations/028_contact_system_properties.sql",import.meta.url),"utf8"));
  assert.deepEqual(await snapshot(),before);
  const counts=await one("SELECT (SELECT count(*) FROM crm.tenant)*6 expected,(SELECT count(*) FROM crm.property_definition WHERE storage='protected') actual");assert.equal(counts.actual,counts.expected);
  const metadata=await one("SELECT count(*)::int n FROM crm.property_definition WHERE tenant_id=$1 AND storage='protected'",[mgr.tenant]);assert.equal(metadata.n,6);
  await admin.query("SELECT crm.seed_system_properties($1)",[mgr.tenant]);assert.equal((await one("SELECT count(*)::int n FROM crm.property_definition WHERE tenant_id=$1 AND storage='protected'",[mgr.tenant])).n,6);
 } finally {await admin.query("ROLLBACK");}
 assert.deepEqual(await snapshot(),before);
});
