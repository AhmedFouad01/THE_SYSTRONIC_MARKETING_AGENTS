// Import, server half: through the real HTTP server and PostgreSQL (crm_runtime, RLS). Migration 018 must be applied.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import pg from "pg";
import { seed } from "../scripts/seed.js";
import { server } from "../src/api.js";
import { pool } from "../src/db.js";
import { xlsx } from "./helpers/xlsx.js";

const admin = new pg.Client({
	connectionString: process.env.ADMIN_DATABASE_URL,
});
const app = server();
let base = "";
let f: Awaited<ReturnType<typeof seed>>;
type Who = { tenant: string; token: string; grant?: string };
let mgr: Who, mgrB: Who, reader: Who, rep: Who, worker: Who, agency: Who;
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
async function fresh() {
	f = await seed(admin);
	mgr = { tenant: f.ids.a, token: f.tokens.manager };
	mgrB = { tenant: f.ids.b, token: f.tokens.agency };
	reader = { tenant: f.ids.a, token: f.tokens.reader };
	worker = { tenant: f.ids.a, token: f.tokens.worker };
	// an agency-grant caller: tenant A, grant on dealA, bearer of tenant B's manager
	agency = { tenant: f.ids.a, token: f.tokens.agency, grant: f.ids.grant };
	const id = randomUUID(),
		token = randomBytes(32).toString("hex");
	await admin.query("INSERT INTO crm.principal VALUES($1,'Import rep')", [id]);
	await admin.query(
		"INSERT INTO crm.session(token_hash,principal_id,expires_at,mfa_verified) VALUES($1,$2,now()+interval '1 day',true)",
		[createHash("sha256").update(token).digest("hex"), id],
	);
	await admin.query(
		"INSERT INTO crm.membership(tenant_id,id,principal_id,role) VALUES($1,$2,$3,'rep')",
		[f.ids.a, randomUUID(), id],
	);
	rep = { tenant: f.ids.a, token };
}
// biome-ignore lint/suspicious/noExplicitAny: loosely typed JSON in a test helper
type Res = { status: number; body: Record<string, any> };
async function call(
	who: Who,
	method: string,
	url: string,
	body?: Record<string, unknown>,
): Promise<Res> {
	const headers: Record<string, string> = {
		authorization: `Bearer ${who.token}`,
		"x-tenant-id": who.tenant,
	};
	if (who.grant) headers["x-grant-id"] = who.grant;
	if (method !== "GET") {
		headers["idempotency-key"] = randomUUID();
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
const L = (label: string) => label;
const csv = (s: string) => Buffer.from(`﻿${s}`, "utf8");
const req = (
	file: Buffer,
	columns: { column: number; target: string }[],
	extra: Record<string, unknown> = {},
) => ({
	object: "contact",
	format: "csv",
	filename: "contacts.csv",
	file_base64: file.toString("base64"),
	mapping: { columns },
	...extra,
});
const NAME_EMAIL = [
	{ column: 0, target: "display_name" },
	{ column: 1, target: "email" },
];
const count = async (sql: string, args: unknown[] = []) =>
	Number((await admin.query(sql, args)).rows[0].n);
const contactsOf = (tenant: string) =>
	count(
		"SELECT count(*) n FROM crm.contact WHERE tenant_id=$1 AND source='import'",
		[tenant],
	);

test("I1 permission: only a (MFA) manager may use any import route; rep, reader, worker, agency grant are denied", async () => {
	await fresh();
	const rows = (
		await admin.query(
			"SELECT role,scope FROM crm.role_permission WHERE action='crm.import'",
		)
	).rows;
	assert.deepEqual(rows, [{ role: "manager", scope: "tenant" }]);
	const file = csv("name,email\nAda,ada@example.com\n");
	for (const [label, who] of [
		["rep", rep],
		["reader", reader],
		["worker", worker],
		["agency", agency],
	] as const) {
		assert.equal(
			(await call(who, "POST", "/v1/imports/preview", req(file, NAME_EMAIL)))
				.status,
			403,
			`${label} preview`,
		);
		assert.equal(
			(await call(who, "POST", "/v1/imports", req(file, NAME_EMAIL))).status,
			403,
			`${label} commit`,
		);
		assert.equal(
			(await call(who, "GET", "/v1/imports")).status,
			403,
			`${label} list`,
		);
		assert.equal(
			(await call(who, "GET", "/v1/imports/fields?object=contact")).status,
			403,
			`${label} fields`,
		);
	}
	assert.equal(await contactsOf(f.ids.a), 0);
	// no session at all
	assert.equal(
		(await call({ tenant: f.ids.a, token: "nope" }, "GET", "/v1/imports"))
			.status,
		401,
	);
	assert.equal((await call(mgr, "GET", "/v1/imports")).status, 200);
});

test("I2 preview writes nothing and reports per-row validation errors; commit skips them", async () => {
	await fresh();
	const file = csv(
		"name,email\nAda,ada@example.com\n,none@example.com\nBob,not-an-email\n=SUM(A1),eve@example.com\n",
	);
	const body = req(file, NAME_EMAIL, { preview_rows: 2 });
	const p = await call(mgr, "POST", "/v1/imports/preview", body);
	assert.equal(p.status, 200, JSON.stringify(p.body));
	const d = p.body.data;
	assert.deepEqual(d.headers, ["name", "email"]);
	assert.equal(d.total_rows, 4);
	assert.deepEqual(
		{ ...d.summary },
		{ create: 2, update: 0, skip: 0, error: 2, warnings: 1 },
	);
	assert.equal(d.rows.length, 2);
	assert.deepEqual(
		d.error_rows.map((r: { row: number }) => r.row),
		[3, 4],
	);
	assert.equal(d.error_rows[0].errors[0].code, "REQUIRED");
	assert.equal(d.error_rows[1].errors[0].code, "INVALID_EMAIL");
	assert.equal(await contactsOf(f.ids.a), 0, "preview must not write");
	const commitBody: Record<string, unknown> = { ...body };
	commitBody.preview_rows = undefined;
	const c = await call(mgr, "POST", "/v1/imports", commitBody);
	assert.equal(c.status, 201, JSON.stringify(c.body));
	assert.deepEqual(
		[
			c.body.data.job.created,
			c.body.data.job.failed,
			c.body.data.job.total_rows,
		],
		[2, 2, 4],
	);
	assert.equal(await contactsOf(f.ids.a), 2);
	// formula-looking text is stored verbatim as text
	assert.equal(
		await count(
			"SELECT count(*) n FROM crm.contact WHERE tenant_id=$1 AND display_name='=SUM(A1)'",
			[f.ids.a],
		),
		1,
	);
	// abort policy: any bad row rejects everything
	const ab = await call(
		mgr,
		"POST",
		"/v1/imports",
		req(
			csv("name,email\nZed,zed@example.com\n,bad@example.com\n"),
			NAME_EMAIL,
			{ options: { error_policy: "abort" } },
		),
	);
	assert.equal(ab.status, 422);
	assert.equal(ab.body.code, "IMPORT_REJECTED");
	assert.equal(await contactsOf(f.ids.a), 2);
});

test("I3 idempotent: the same file + mapping + options re-submitted inserts nothing; a changed mapping or option is a new job", async () => {
	await fresh();
	const file = csv("name,email\nAda,ada@example.com\nBob,bob@example.com\n");
	const first = await call(mgr, "POST", "/v1/imports", req(file, NAME_EMAIL));
	assert.equal(first.status, 201);
	assert.equal(first.body.data.replayed, false);
	const again = await call(mgr, "POST", "/v1/imports", req(file, NAME_EMAIL));
	assert.equal(again.status, 200);
	assert.equal(again.body.data.replayed, true);
	assert.equal(again.body.data.job.id, first.body.data.job.id);
	assert.equal(await contactsOf(f.ids.a), 2);
	assert.equal(
		await count("SELECT count(*) n FROM crm.import_job WHERE tenant_id=$1", [
			f.ids.a,
		]),
		1,
	);
	// concurrent double submit of a NEW file: exactly one job
	const file2 = csv("name,email\nCy,cy@example.com\n");
	const both = await Promise.all([
		call(mgr, "POST", "/v1/imports", req(file2, NAME_EMAIL)),
		call(mgr, "POST", "/v1/imports", req(file2, NAME_EMAIL)),
	]);
	assert.deepEqual(both.map((r) => r.status).sort(), [200, 201]);
	assert.equal(await contactsOf(f.ids.a), 3);
	// option change = a different job, which finds every row as a duplicate (skip) and creates nothing
	const reorder = await call(
		mgr,
		"POST",
		"/v1/imports",
		req(file, NAME_EMAIL, {
			options: { duplicate_mode: "skip", default_country_code: "+20" },
		}),
	);
	assert.equal(reorder.status, 201);
	assert.deepEqual(
		[reorder.body.data.job.created, reorder.body.data.job.skipped],
		[0, 2],
	);
	assert.equal(await contactsOf(f.ids.a), 3);
	// the preview says it was already imported
	const pv = await call(
		mgr,
		"POST",
		"/v1/imports/preview",
		req(file, NAME_EMAIL),
	);
	assert.equal(pv.body.data.already_imported.job_id, first.body.data.job.id);
	// per-row ledger and the audit trail
	const rows = await call(
		mgr,
		"GET",
		`/v1/imports/${first.body.data.job.id}/rows`,
	);
	assert.equal(rows.status, 200);
	assert.deepEqual(
		rows.body.data.map((r: { outcome: string }) => r.outcome),
		["created", "created"],
	);
	assert.equal(
		await count(
			"SELECT count(*) n FROM crm.audit_log WHERE tenant_id=$1 AND action='import.completed' AND object_id=$2",
			[f.ids.a, first.body.data.job.id],
		),
		1,
	);
	assert.equal(
		await count(
			"SELECT count(*) n FROM crm.audit_log WHERE tenant_id=$1 AND action='contact.created'",
			[f.ids.a],
		),
		3,
	);
	assert.equal(
		await count(
			"SELECT count(*) n FROM crm.outbox WHERE tenant_id=$1 AND object_kind='contact'",
			[f.ids.a],
		),
		3,
	);
});

test("I4 duplicates keyed on email/phone: skip / update / create, including within one file", async () => {
	await fresh();
	const cols = [...NAME_EMAIL, { column: 2, target: "phone" }];
	await call(
		mgr,
		"POST",
		"/v1/imports",
		req(csv("name,email,phone\nAda,ada@example.com,+201001234567\n"), cols),
	);
	const second = csv(
		"name,email,phone\nAda Lovelace,ADA@example.com,\nPhone Only,,+20 100 123 4567\nNew One,new@example.com,\nNew Dup,new@example.com,\n",
	);
	const skip = await call(
		mgr,
		"POST",
		"/v1/imports/preview",
		req(second, cols),
	);
	assert.deepEqual(
		{ ...skip.body.data.summary },
		{ create: 1, update: 0, skip: 3, error: 0, warnings: 0 },
	);
	const upd = await call(
		mgr,
		"POST",
		"/v1/imports",
		req(second, cols, { options: { duplicate_mode: "update" } }),
	);
	assert.equal(upd.status, 201, JSON.stringify(upd.body));
	assert.deepEqual(
		[
			upd.body.data.job.created,
			upd.body.data.job.updated,
			upd.body.data.job.skipped,
		],
		[1, 3, 0],
	);
	assert.equal(
		await count(
			"SELECT count(*) n FROM crm.contact WHERE tenant_id=$1 AND source='import'",
			[f.ids.a],
		),
		2,
	);
	assert.equal(
		await count(
			"SELECT count(*) n FROM crm.contact WHERE tenant_id=$1 AND display_name='Phone Only'",
			[f.ids.a],
		),
		1,
		"matched by email, then by phone: same contact, last name wins",
	);
	// identifiers are encrypted at rest: the plaintext never appears in the table
	assert.equal(
		await count(
			"SELECT count(*) n FROM crm.contact_identifier WHERE tenant_id=$1",
			[f.ids.a],
		),
		3,
	);
	// create mode inserts regardless of a match
	const mk = await call(
		mgr,
		"POST",
		"/v1/imports",
		req(csv("name,email,phone\nAda Again,ada@example.com,\n"), cols, {
			options: { duplicate_mode: "create" },
		}),
	);
	assert.deepEqual(
		[mk.body.data.job.created, mk.body.data.job.skipped],
		[1, 0],
	);
	assert.equal(
		await count(
			"SELECT count(*) n FROM crm.contact WHERE tenant_id=$1 AND source='import'",
			[f.ids.a],
		),
		3,
	);
});

test("I5 custom properties: mapped through the registry validator; unknown / read-only / archived targets are mapping errors", async () => {
	await fresh();
	const mkProp = (
		key: string,
		type: string,
		extra: Record<string, unknown> = {},
	) =>
		call(mgr, "POST", "/v1/schema/contact/properties", {
			command_id: randomUUID(),
			key,
			type,
			label: L(key),
			...extra,
		});
	assert.equal(
		(await mkProp("custom_company", "text", { searchable: true })).status,
		201,
	);
	assert.equal((await mkProp("seats", "number")).status, 201);
	const fields = await call(mgr, "GET", "/v1/imports/fields?object=contact");
	assert.equal(fields.status, 200);
	const targets = fields.body.data.targets.map(
		(t: { target: string }) => t.target,
	);
	assert.deepEqual(targets, [
		"display_name",
		"email",
		"phone",
		"property:custom_company",
		"property:seats",
	]);
	const cols = [
		{ column: 0, target: "display_name" },
		{ column: 1, target: "property:custom_company" },
		{ column: 2, target: "property:seats" },
	];
	const file = csv(
		"name,company,seats\nAda,شركة النور,١٢\nBob,Acme,many\nCy,,5\n",
	);
	const r = await call(mgr, "POST", "/v1/imports", req(file, cols));
	assert.equal(r.status, 201, JSON.stringify(r.body));
	assert.deepEqual([r.body.data.job.created, r.body.data.job.failed], [2, 1]);
	assert.equal(r.body.data.error_rows[0].errors[0].code, "INVALID_VALUE");
	const ada = (
		await admin.query(
			"SELECT custom,custom_search FROM crm.contact WHERE tenant_id=$1 AND display_name='Ada'",
			[f.ids.a],
		)
	).rows[0];
	assert.deepEqual(ada.custom, { custom_company: "شركة النور", seats: 12 });
	assert.ok(ada.custom_search.length > 0);
	const bad = await call(
		mgr,
		"POST",
		"/v1/imports/preview",
		req(file, [
			{ column: 0, target: "display_name" },
			{ column: 1, target: "property:ghost" },
			{ column: 2, target: "owner_id" },
		]),
	);
	assert.equal(bad.status, 422);
	assert.equal(bad.body.code, "MAPPING_INVALID");
	assert.deepEqual(
		bad.body.errors.map((e: { code: string }) => e.code).sort(),
		["UNKNOWN_PROPERTY", "UNKNOWN_TARGET"],
	);
});

test("I6 xlsx and leads: workbook import, lead reuses the matched contact, lead duplicate = same contact + title", async () => {
	await fresh();
	const wb = xlsx([
		["Contact", "Email", "Lead"],
		["Ada", "ada@example.com", "Website redesign"],
		["Ada L.", "ada@example.com", "Mobile app"],
		["Bob", "bob@example.com", "Website redesign"],
	]);
	const cols = [
		{ column: 0, target: "contact_name" },
		{ column: 1, target: "email" },
		{ column: 2, target: "title" },
	];
	const body = {
		object: "lead",
		format: "xlsx",
		filename: "leads.xlsx",
		file_base64: wb.toString("base64"),
		mapping: { columns: cols },
	};
	const r = await call(mgr, "POST", "/v1/imports", body);
	assert.equal(r.status, 201, JSON.stringify(r.body));
	assert.deepEqual([r.body.data.job.created, r.body.data.job.failed], [3, 0]);
	assert.equal(
		await count(
			"SELECT count(*) n FROM crm.lead WHERE tenant_id=$1 AND source='import'",
			[f.ids.a],
		),
		3,
	);
	assert.equal(
		await count(
			"SELECT count(*) n FROM crm.contact WHERE tenant_id=$1 AND source='import'",
			[f.ids.a],
		),
		2,
		"the second Ada row reuses her contact",
	);
	// a second workbook: the same lead is a duplicate (skipped), a new title is created
	const wb2 = xlsx([
		["Contact", "Email", "Lead"],
		["Ada", "ada@example.com", "website REDESIGN"],
		["Ada", "ada@example.com", "Support plan"],
	]);
	const r2 = await call(mgr, "POST", "/v1/imports", {
		...body,
		file_base64: wb2.toString("base64"),
	});
	assert.deepEqual(
		[r2.body.data.job.created, r2.body.data.job.skipped],
		[1, 1],
	);
	assert.equal(
		await count(
			"SELECT count(*) n FROM crm.lead WHERE tenant_id=$1 AND source='import'",
			[f.ids.a],
		),
		4,
	);
	// wrong declared format and hostile archives are refused before any parsing result is used
	const mism = await call(mgr, "POST", "/v1/imports/preview", {
		...body,
		format: "csv",
	});
	assert.equal(mism.status, 422);
	assert.equal(mism.body.code, "FORMAT_MISMATCH");
	const junk = Buffer.concat([
		Buffer.from([0x50, 0x4b, 0x03, 0x04]),
		randomBytes(200),
	]);
	const jr = await call(mgr, "POST", "/v1/imports/preview", {
		...body,
		file_base64: junk.toString("base64"),
	});
	assert.equal(jr.status, 422);
	assert.equal(jr.body.code, "NOT_XLSX");
	// an oversized upload is refused by the size limit
	const big = await call(mgr, "POST", "/v1/imports", {
		...body,
		format: "csv",
		file_base64: Buffer.alloc(5 * 1024 * 1024 + 1, 97).toString("base64"),
	});
	assert.equal(big.status, 413);
});

test("I7 tenant isolation: another tenant never sees, replays or is affected by a job; RLS blocks direct reads and cross-tenant writes", async () => {
	await fresh();
	const file = csv("name,email\nAda,ada@example.com\n");
	const a = await call(mgr, "POST", "/v1/imports", req(file, NAME_EMAIL));
	assert.equal(a.status, 201);
	const job = a.body.data.job.id as string;
	// tenant B imports the identical file: a fresh job (no replay), and its own duplicate scope (Ada of A is invisible to B)
	const b = await call(mgrB, "POST", "/v1/imports", req(file, NAME_EMAIL));
	assert.equal(b.status, 201, JSON.stringify(b.body));
	assert.equal(b.body.data.replayed, false);
	assert.equal(b.body.data.job.created, 1);
	assert.notEqual(b.body.data.job.id, job);
	assert.equal((await call(mgrB, "GET", `/v1/imports/${job}`)).status, 404);
	assert.equal(
		(await call(mgrB, "GET", `/v1/imports/${job}/rows`)).status,
		404,
	);
	assert.deepEqual(
		(await call(mgrB, "GET", "/v1/imports")).body.data.map(
			(j: { id: string }) => j.id,
		),
		[b.body.data.job.id],
	);
	assert.equal(await contactsOf(f.ids.a), 1);
	assert.equal(await contactsOf(f.ids.b), 1);
	// direct SQL as the runtime role: tenant B's context sees none of A's ledger rows, and cannot insert rows for A
	const db = await pool.connect();
	try {
		await db.query("BEGIN");
		await db.query(
			"SELECT set_config('crm.tenant',$1,true),set_config('crm.token',$2,true)",
			[f.ids.b, f.tokens.agency],
		);
		assert.equal(
			(await db.query("SELECT 1 FROM crm.import_job WHERE id=$1", [job]))
				.rowCount,
			0,
		);
		assert.equal(
			(await db.query("SELECT 1 FROM crm.import_row WHERE job_id=$1", [job]))
				.rowCount,
			0,
		);
		await db.query("SAVEPOINT s");
		await assert.rejects(
			db.query(
				"INSERT INTO crm.import_job(tenant_id,id,object_type,import_key,file_sha256,file_name,format,duplicate_mode,error_policy,actor_id,total_rows,created_count,updated_count,skipped_count,failed_count) VALUES($1,$2,'contact',repeat('a',64),repeat('b',64),'x','csv','skip','skip',crm.actor(),0,0,0,0,0)",
				[f.ids.a, randomUUID()],
			),
		);
		await db.query("ROLLBACK TO SAVEPOINT s");
		// the ledger is append-only for the runtime role
		await assert.rejects(db.query("UPDATE crm.import_job SET total_rows=0"));
		await db.query("ROLLBACK");
	} finally {
		db.release();
	}
	// no context at all: nothing visible
	assert.equal((await pool.query("SELECT 1 FROM crm.import_job")).rowCount, 0);
});

test("I8 a file at the row limit (5000 rows) imports in one transaction within a sane time", async () => {
	await fresh();
	const lines = Array.from(
		{ length: 5000 },
		(_, i) => `Person ${i},p${i}@example.com`,
	);
	const t0 = Date.now();
	const r = await call(
		mgr,
		"POST",
		"/v1/imports",
		req(csv(`name,email\n${lines.join("\n")}\n`), NAME_EMAIL),
	);
	assert.equal(r.status, 201, JSON.stringify(r.body).slice(0, 300));
	assert.equal(r.body.data.job.created, 5000);
	assert.ok(Date.now() - t0 < 60_000, `took ${Date.now() - t0} ms`);
	assert.equal(await contactsOf(f.ids.a), 5000);
	const over = Array.from(
		{ length: 5001 },
		(_, i) => `P${i},q${i}@example.com`,
	);
	const big = await call(
		mgr,
		"POST",
		"/v1/imports/preview",
		req(csv(`name,email\n${over.join("\n")}\n`), NAME_EMAIL),
	);
	assert.equal(big.status, 422);
	assert.equal(big.body.code, "TOO_MANY_ROWS");
});

test("R09 scalar identifier edits remain dedup/import compatible, masked, and invalid imports roll back",async()=>{
 await fresh();
 const c=await call(mgr,"POST","/v1/contacts",{command_id:randomUUID(),display_name:"R09 import",email:" Initial@EXAMPLE.COM ",phone:"01001234567"});assert.equal(c.status,201,JSON.stringify(c.body));
 const id=c.body.data.id;
 const patched=await call(mgr,"PATCH",`/v1/contacts/${id}`,{command_id:randomUUID(),expected_version:c.body.data.version,email:"current@example.com"});assert.equal(patched.status,200);
 for (const email of ["initial@example.com","current@example.com"]) {
  const result=await call(mgr,"POST","/v1/imports",req(csv(`name,email\nDuplicate,${email}\n`),NAME_EMAIL));assert.equal(result.status,201,JSON.stringify(result.body));assert.equal(result.body.data.job.created,0);assert.equal(result.body.data.job.skipped,1);
 }
 assert.equal(await count("SELECT count(*) n FROM crm.contact_identifier WHERE tenant_id=$1 AND contact_id=$2",[mgr.tenant,id]),3);
 const before=await count("SELECT count(*) n FROM crm.contact WHERE tenant_id=$1",[mgr.tenant]);
 const invalid=await call(mgr,"POST","/v1/imports",req(csv("name,email\nNew,new@example.com\nInvalid,bad\n"),NAME_EMAIL,{options:{error_policy:"abort"}}));assert.equal(invalid.status,422);assert.equal(await count("SELECT count(*) n FROM crm.contact WHERE tenant_id=$1",[mgr.tenant]),before);
 const hidden=await call(reader,"GET",`/v1/contacts/${id}`);assert.equal(hidden.body.data.sensitive_masked,true);assert.equal(hidden.body.data.email,null);assert.equal(hidden.body.data.phone,null);
});
