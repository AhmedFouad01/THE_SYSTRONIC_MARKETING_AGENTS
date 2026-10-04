// M2-F01 upgrade check. Destructive only to the disposable loopback crm_m2 database/role.
// Builds a real 001-006 database, creates case-variant legacy collection data with the
// DELIVERED 006 function (so the stored rows are exactly what 006 produced), applies 007
// and proves replay, row preservation and unchanged function ownership/grants.
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { seed } from "./seed.js";
const u = new URL(process.env.ADMIN_DATABASE_URL ?? "");
if (
	u.hostname !== "127.0.0.1" ||
	u.port !== "55438" ||
	u.pathname !== "/crm_m2"
)
	throw new Error("Isolated M2 validation cluster required");
const root = new pg.Client({ connectionString: new URL("/postgres", u).href });
await root.connect();
await root.query("DROP DATABASE IF EXISTS crm_m2");
await root.query("DROP ROLE IF EXISTS crm_runtime");
await root.query("CREATE DATABASE crm_m2");
await root.end();
const db = new pg.Client({ connectionString: u.href });
await db.connect();
const occurredAt = new Date(Date.now() - 60000).toISOString();
const mixedCase = (id: string) =>
	[...id].map((c, i) => (i % 2 ? c.toUpperCase() : c)).join("");
const body = (event_id: string, visitor: string, session: string) => ({
	event_id,
	visitor_id: visitor,
	session_id: session,
	name: "page_view",
	schema_version: 1,
	occurred_at: occurredAt,
	consent: { analytics: true, advertising: false },
	landing_path: "/landing",
});
const collect = (key: string, origin: string, b: object) =>
	db.query("SELECT crm.collect_event($1,$2,$3::jsonb) id", [
		key,
		origin,
		JSON.stringify(b),
	]);
const n = async (table: string) =>
	Number((await db.query(`SELECT count(*) FROM crm.${table}`)).rows[0].count);
const signature = async () =>
	(
		await db.query(
			"SELECT pg_get_userbyid(p.proowner) owner,p.prosecdef,p.proconfig,p.proacl::text acl FROM pg_proc p WHERE p.oid='crm.collect_event(uuid,text,jsonb)'::regprocedure",
		)
	).rows[0];
const snapshot = async () => ({
	event: (await db.query("SELECT * FROM crm.business_event ORDER BY id")).rows,
	receipt: (
		await db.query("SELECT * FROM crm.source_receipt ORDER BY source_id")
	).rows,
	touch: (await db.query("SELECT * FROM crm.touchpoint ORDER BY id")).rows,
});
try {
	const files = [
		"001_foundation.sql",
		"002_crm_core.sql",
		"003_object_integrity.sql",
		"004_relationship_authority.sql",
		"005_protected_key_configuration.sql",
		"006_journey_reporting.sql",
	];
	await db.query(
		"CREATE TABLE public.crm_migrations(version integer PRIMARY KEY,applied_at timestamptz NOT NULL DEFAULT now())",
	);
	for (const [i, file] of files.entries()) {
		await db.query(await readFile(`migrations/${file}`, "utf8"));
		await db.query("INSERT INTO public.crm_migrations(version) VALUES($1)", [
			i + 1,
		]);
	}
	const f = await seed(db),
		site = randomUUID(),
		key = randomUUID(),
		origin = "https://synthetic.example";
	await db.query(
		"INSERT INTO crm.collection_site(tenant_id,id,public_key,origin,enabled,actor_id) VALUES($1,$2,$3,$4,true,$5)",
		[f.ids.a, site, key, origin, f.ids.manager],
	);
	const visitor = randomUUID(),
		session = randomUUID(),
		dupId = randomUUID(),
		legacyOnly = randomUUID(),
		mixedId = randomUUID(),
		mixedForm = mixedCase(mixedId);
	// Reproduce the 006 defect: UPPER then lower -> two events (the pre-007 behaviour).
	await collect(key, origin, body(dupId.toUpperCase(), visitor, session));
	await collect(key, origin, body(dupId, visitor, session));
	// A legacy UPPER-only event and a mixed-case-only event, each stored raw by 006.
	await collect(key, origin, body(legacyOnly.toUpperCase(), visitor, session));
	await collect(key, origin, body(mixedForm, visitor, session));
	assert.equal(await n("business_event"), 4, "006 defect reproduced");
	const before = await snapshot();
	const ids = before.receipt.map((r) => r.source_id as string);
	assert.ok(ids.includes(legacyOnly.toUpperCase()));
	assert.ok(ids.includes(mixedForm));
	const sig006 = await signature();
	await db.query("BEGIN");
	await db.query(
		await readFile("migrations/007_collect_event_canonical_id.sql", "utf8"),
	);
	await db.query("INSERT INTO public.crm_migrations(version) VALUES(7)");
	await db.query("COMMIT");
	assert.deepEqual(
		await signature(),
		sig006,
		"owner/secdef/search_path/ACL unchanged",
	);
	assert.deepEqual(
		await snapshot(),
		before,
		"legacy rows byte-identical after 007",
	);
	const events = await n("business_event");
	const replay = async (form: string) =>
		(await collect(key, origin, body(form, visitor, session))).rows[0]
			.id as string;
	const original = (sourceId: string) =>
		before.receipt.find((r) => r.source_id === sourceId)?.event_id as string;
	// Legacy rows are found for the raw, canonical and mixed forms.
	for (const form of [
		legacyOnly.toUpperCase(),
		legacyOnly,
		mixedCase(legacyOnly),
	])
		assert.equal(await replay(form), original(legacyOnly.toUpperCase()));
	for (const form of [mixedForm, mixedId, mixedId.toUpperCase()])
		assert.equal(await replay(form), original(mixedForm));
	// Legacy duplicate pair (UPPER + lower): deterministic, prefers the canonical receipt.
	for (const form of [dupId, dupId.toUpperCase()])
		assert.equal(await replay(form), original(dupId));
	assert.equal(await n("business_event"), events, "no new events on replay");
	assert.equal(await n("source_receipt"), 4);
	assert.equal(await n("touchpoint"), 4);
	await assert.rejects(
		collect(key, origin, {
			...body(legacyOnly, visitor, session),
			source: "changed",
		}),
		(e: { code?: string }) => e.code === "P2003",
	);
	// New events after 007 store the canonical form and replay in any case.
	const created = randomUUID(),
		first = await replay(created.toUpperCase());
	assert.equal(await replay(created), first);
	assert.equal(
		(
			await db.query(
				"SELECT source_event_id FROM crm.business_event WHERE id=$1",
				[first],
			)
		).rows[0].source_event_id,
		created,
	);
	assert.equal(await n("business_event"), events + 1);
	assert.equal(
		(
			await db.query(
				"SELECT count(*)::int c FROM pg_indexes WHERE indexname='source_receipt_site_canonical'",
			)
		).rows[0].c,
		1,
	);
	await db.query("SELECT crm.assert_identifier_configuration()");
	console.log(
		"M2-F01 upgrade PASS: 006 duplicate reproduced (4 events), 007 applied, owner/ACL/search_path unchanged, legacy events/receipts/touchpoints byte-identical, UPPER/lower/mixed replays return the original event ids, new events canonical",
	);
} finally {
	await db.end();
}
