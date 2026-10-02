import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { seed } from "../scripts/seed.js";
import { collect, journeyRequest, attributionWorkOne } from "../src/journey.js";
import { crmRequest, type Body } from "../src/crm.js";
import { Fault, pool, transaction, type Context } from "../src/db.js";
import { server } from "../src/api.js";
const admin = new pg.Client({
	connectionString: process.env.ADMIN_DATABASE_URL,
});
let f: Awaited<ReturnType<typeof seed>>, ctx: Context, site: pg.QueryResultRow;
before(() => admin.connect());
after(async () => {
	await admin.end();
	await pool.end();
});
const at = (days = 0) =>
	new Date(Date.now() - days * 86400000 - 10000).toISOString();
const fail = (code: string) => (e: unknown) =>
	e instanceof Fault && e.code === code;
async function request(
	path: string,
	method = "GET",
	body: Body = {},
	context = ctx,
): Promise<pg.QueryResultRow> {
	const u = new URL(`/v1/${path}`, "http://localhost");
	return journeyRequest(
		context,
		method,
		u.pathname,
		u.searchParams,
		body,
		randomUUID(),
	);
}
async function fresh() {
	f = await seed(admin);
	ctx = { tenant: f.ids.a, token: f.tokens.manager };
	site = (
		await request("journey/sites", "POST", {
			id: randomUUID(),
			origin: "https://synthetic.example",
			enabled: true,
		})
	).data;
}
const telemetry = (overrides: Body = {}) => ({
	event_id: randomUUID(),
	visitor_id: randomUUID(),
	session_id: randomUUID(),
	name: "page_view",
	schema_version: 1,
	occurred_at: at(2),
	consent: { analytics: true, advertising: false },
	landing_path: "/landing",
	...overrides,
});
async function send(b: Body) {
	return collect(site.public_key, site.origin, b);
}
async function link(b: Body, contact = f.ids.contact, extra: Body = {}) {
	const e = await send(b),
		visitor = (
			await admin.query(
				"SELECT visitor_id FROM crm.business_event WHERE tenant_id=$1 AND id=$2",
				[ctx.tenant, e.id],
			)
		).rows[0].visitor_id;
	return (
		await request("journey/identities", "POST", {
			command_id: randomUUID(),
			visitor_id: visitor,
			contact_id: contact,
			evidence_type: "form",
			evidence_ref: String(b.event_id),
			evidence_event_id: e.id,
			valid_from: at(90),
			valid_to: new Date(Date.now() + 86400000).toISOString(),
			...extra,
		})
	).data;
}
async function purchase(
	contact: string | null = f.ids.contact,
	currency = "EGP",
) {
	const base = {
		source: "fixture",
		external_order_id: randomUUID(),
		occurred_at: at(1),
		currency,
		amount_minor: 10000,
		...(contact ? { contact_id: contact } : {}),
	};
	const order = (
		await request("journey/commerce", "POST", {
			...base,
			source_event_id: randomUUID(),
			kind: "order",
			status: "placed",
		})
	).data;
	const body = {
		...base,
		source_event_id: randomUUID(),
		kind: "payment",
		external_id: randomUUID(),
	};
	await request("journey/commerce", "POST", body);
	return { base, body, order_id: order.order_id };
}
async function report(model = "last_non_direct") {
	await request("journey/calculate", "POST", {});
	return (await request(`reports/campaign-performance?model=${model}`)).data;
}
async function count(table: string) {
	return Number(
		(
			await admin.query(
				`SELECT count(*) FROM crm.${table} WHERE tenant_id=$1`,
				[ctx.tenant],
			)
		).rows[0].count,
	);
}
test("M2-01 collection durable replay, late timestamps, no transport-cache dependency", async () => {
	await fresh();
	const b = telemetry(),
		a = await send(b);
	await admin.query("DELETE FROM crm.command_retry WHERE tenant_id=$1", [
		ctx.tenant,
	]);
	assert.deepEqual(await send(b), a);
	assert.equal(await count("business_event"), 1);
	assert.equal(await count("visitor"), 1);
	assert.equal(await count("journey_session"), 1);
	assert.equal(await count("touchpoint"), 1);
	const e = (await request(`journey/events/${a.id}`)).data;
	assert.equal(new Date(e.occurred_at).toISOString(), b.occurred_at);
	assert.ok(new Date(e.received_at) > new Date(e.occurred_at));
	await assert.rejects(
		send({ ...b, source: "changed" }),
		fail("SOURCE_CONFLICT"),
	);
});
test("M2-02 forged site, tenant, trusted payments, properties, URLs and denied consent rejected", async () => {
	await fresh();
	await assert.rejects(
		collect(randomUUID(), site.origin, telemetry()),
		fail("INVALID_SITE"),
	);
	await assert.rejects(
		collect(site.public_key, "https://forged.example", telemetry()),
		fail("INVALID_SITE"),
	);
	for (const b of [
		{ tenant_id: f.ids.b },
		{ contact_id: f.ids.contact },
		{ name: "payment_captured" },
		{ properties: { email: "private@example.test" } },
		{ landing_path: "/x?email=private" },
		{ consent: { analytics: false, advertising: false } },
		{ consent: {} },
		{ schema_version: 2 },
		{ website: "bot" },
		{ occurred_at: new Date(Date.now() + 86400000).toISOString() },
	])
		await assert.rejects(send(telemetry(b)), fail("VALIDATION_FAILED"));
	assert.equal(await count("business_event"), 0);
});
test("M2-03 anonymous remains unknown until explicit form evidence links prior touches", async () => {
	await fresh();
	const visitor = randomUUID();
	await send(
		telemetry({ visitor_id: visitor, source: "search", occurred_at: at(5) }),
	);
	await purchase();
	assert.equal((await report()).rows[0].source, "unknown");
	await link(
		telemetry({
			visitor_id: visitor,
			name: "form_submitted",
			source: "direct",
		}),
	);
	const r = await report();
	assert.equal(r.rows[0].source, "search");
	const journey = (await request(`contacts/${f.ids.contact}/journey`)).data;
	assert.ok(journey.some((e: pg.QueryResultRow) => e.name === "page_view"));
	assert.ok(
		journey.some((e: pg.QueryResultRow) => e.name === "payment_captured"),
	);
});
test("M2-04 shared email creates distinct contacts and never infers visitor identity", async () => {
	await fresh();
	for (let i = 0; i < 2; i++)
		await crmRequest(
			ctx,
			"POST",
			"/v1/contacts",
			new URLSearchParams(),
			{
				command_id: randomUUID(),
				display_name: `Shared ${i}`,
				identifiers: [
					{
						kind: "email",
						value: "shared@example.test",
						provenance: "synthetic",
					},
				],
			},
			randomUUID(),
			randomUUID(),
		);
	await send(telemetry());
	assert.equal(await count("contact"), 3);
	assert.equal(await count("identity_link"), 0);
});
test("M2-05 identity replay and corrected provenance retain original revoked link", async () => {
	await fresh();
	const b = telemetry({ name: "form_submitted" }),
		first = await link(b);
	const newContact = (
		await crmRequest(
			ctx,
			"POST",
			"/v1/contacts",
			new URLSearchParams(),
			{ command_id: randomUUID(), display_name: "Correct person" },
			randomUUID(),
			randomUUID(),
		)
	).data as pg.QueryResultRow;
	const body = {
		command_id: randomUUID(),
		visitor_id: first.visitor_id,
		contact_id: newContact.id,
		evidence_type: "form",
		evidence_ref: "corrected-verification",
		evidence_event_id: first.evidence_event_id,
		valid_from: at(90),
		valid_to: new Date(Date.now() + 86400000).toISOString(),
		corrects_id: first.id,
	};
	const corrected = (await request("journey/identities", "POST", body)).data;
	assert.equal(
		(await request("journey/identities", "POST", body)).data.id,
		corrected.id,
	);
	assert.equal(corrected.corrects_id, first.id);
	assert.ok((await request(`journey/identities/${first.id}`)).data.revoked_at);
	assert.equal(await count("identity_link"), 2);
	assert.equal(
		(await request(`contacts/${f.ids.contact}/journey`)).data.filter(
			(e: pg.QueryResultRow) => e.name === "form_submitted",
		).length,
		0,
	);
});
test("M2-06 direct after non-direct retains non-direct; outside lookback excluded", async () => {
	await fresh();
	const visitor = randomUUID();
	await send(
		telemetry({ visitor_id: visitor, source: "outside", occurred_at: at(45) }),
	);
	await send(
		telemetry({ visitor_id: visitor, source: "search", occurred_at: at(10) }),
	);
	await link(
		telemetry({
			visitor_id: visitor,
			name: "form_submitted",
			source: "direct",
			occurred_at: at(2),
		}),
	);
	await purchase();
	assert.equal((await report()).rows[0].source, "search");
	assert.equal((await report("first_touch")).rows[0].source, "search");
	const r = (await request("journey/calculate", "POST", { lookback_days: 2 }))
		.data;
	assert.equal(
		(await request(`reports/campaign-performance?run_id=${r.id}`)).data.rows[0]
			.source,
		"direct",
	);
});
test("M2-07 late event publishes new run; old run remains stable; deterministic recalculation", async () => {
	await fresh();
	const visitor = randomUUID();
	await link(
		telemetry({
			visitor_id: visitor,
			name: "form_submitted",
			source: "direct",
		}),
	);
	await purchase();
	const old = await report();
	assert.equal(old.rows[0].source, "direct");
	await send(
		telemetry({
			visitor_id: visitor,
			source: "late_search",
			occurred_at: at(5),
		}),
	);
	const a = (await request("journey/calculate", "POST", {})).data,
		b = (await request("journey/calculate", "POST", {})).data;
	assert.notEqual(a.id, b.id);
	assert.equal(a.evidence_hash, b.evidence_hash);
	assert.equal(
		(await request(`reports/campaign-performance?run_id=${a.id}`)).data.rows[0]
			.source,
		"late_search",
	);
	assert.equal(
		(await request(`reports/campaign-performance?run_id=${old.run_id}`)).data
			.rows[0].source,
		"direct",
	);
});
test("M2-08 unknown bucket and internal/provider labels; currencies never summed", async () => {
	await fresh();
	await purchase(null);
	const p = await purchase(null);
	await purchase(null, "USD");
	const r = await report();
	assert.equal(r.rows[0].source, "unknown");
	assert.equal(r.provider_reported, null);
	assert.equal(r.source, "internal_rule_based");
	assert.equal(r.lookback_days, 30);
	assert.equal(
		r.rows.find((x: pg.QueryResultRow) => x.currency === "EGP").value_minor,
		"20000",
	);
	assert.equal(
		r.rows.find((x: pg.QueryResultRow) => x.currency === "USD").value_minor,
		"10000",
	);
	assert.ok(p.order_id);
});
test("M2-09 unpaid/COD delivery, order cancellation and payment remain separate", async () => {
	await fresh();
	const base = {
		source: "cod",
		external_order_id: randomUUID(),
		occurred_at: at(3),
		currency: "EGP",
		amount_minor: 900,
	};
	const o = (
		await request("journey/commerce", "POST", {
			...base,
			source_event_id: randomUUID(),
			kind: "order",
			status: "placed",
		})
	).data;
	await request("journey/commerce", "POST", {
		source: "cod",
		external_order_id: base.external_order_id,
		source_event_id: randomUUID(),
		external_id: "delivered-1",
		occurred_at: at(2),
		kind: "fulfillment",
		status: "delivered",
	});
	assert.equal(await count("conversion"), 0);
	assert.equal(await count("deal"), 1);
	const detail = (await request(`journey/orders/${o.order_id}`)).data;
	assert.equal(detail.payment.length, 0);
	assert.equal(detail.fulfillment.length, 1);
	await request("journey/commerce", "POST", {
		...base,
		source_event_id: randomUUID(),
		occurred_at: at(1),
		kind: "order",
		status: "cancelled",
	});
	await assert.rejects(
		request("journey/commerce", "POST", {
			...base,
			source_event_id: randomUUID(),
			external_id: "pay-1",
			kind: "payment",
		}),
		fail("ORDER_CANCELLED"),
	);
});
test("M2-10 partial refund reverses original credit and cannot exceed payment", async () => {
	await fresh();
	await link(telemetry({ name: "form_submitted", source: "search" }));
	const p = await purchase();
	const payment = (await request(`journey/orders/${p.order_id}`)).data
		.payment[0];
	const b = {
		source: "fixture",
		external_order_id: p.base.external_order_id,
		source_event_id: randomUUID(),
		external_id: "refund-1",
		kind: "refund",
		payment_id: payment.id,
		occurred_at: at(),
		currency: "EGP",
		amount_minor: 2500,
	};
	await request("journey/commerce", "POST", b);
	await request("journey/commerce", "POST", b);
	assert.equal(await count("conversion"), 2);
	assert.equal(await count("refund"), 1);
	const reportData = await report();
	assert.equal(
		reportData.rows.reduce(
			(s: number, r: pg.QueryResultRow) => s + Number(r.value_minor),
			0,
		),
		7500,
	);
	assert.ok(
		reportData.rows.every((r: pg.QueryResultRow) => r.source === "search"),
	);
	await assert.rejects(
		request("journey/commerce", "POST", {
			...b,
			source_event_id: randomUUID(),
			external_id: "too-much",
			amount_minor: 9000,
		}),
		fail("REFUND_EXCEEDS_PAYMENT"),
	);
});
test("M2-11 order/status/payment replay durable and atomic; out-of-order status cannot regress", async () => {
	await fresh();
	const p = await purchase();
	const before = await count("business_event");
	await request("journey/commerce", "POST", p.body);
	assert.equal(await count("business_event"), before);
	assert.equal(await count("conversion"), 1);
	await request("journey/commerce", "POST", {
		...p.base,
		source_event_id: randomUUID(),
		kind: "order",
		status: "cancelled",
		occurred_at: at(),
	});
	await request("journey/commerce", "POST", {
		...p.base,
		source_event_id: randomUUID(),
		kind: "order",
		status: "placed",
		occurred_at: at(2),
	});
	assert.equal(
		(await request(`journey/orders/${p.order_id}`)).data.order_status,
		"cancelled",
	);
	await assert.rejects(
		request("journey/commerce", "POST", { ...p.body, amount_minor: 1 }),
		fail("SOURCE_CONFLICT"),
	);
	assert.equal(await count("payment"), 1);
});
test("M2-12 campaign rename is stable; spend snapshots replace and preserve account dimensions", async () => {
	await fresh();
	const b = {
		source: "search",
		account_id: "synthetic",
		external_id: "campaign-1",
		name: "Before",
		currency: "EGP",
		timezone: "Africa/Cairo",
	};
	const c = (await request("journey/campaigns", "POST", b)).data;
	await link(
		telemetry({
			name: "form_submitted",
			source: "search",
			campaign_id: c.id,
			utm_campaign: "old_label",
			ad_id: "ad-1",
		}),
	);
	await purchase();
	assert.equal(
		(await request("journey/campaigns", "POST", { ...b, name: "After" })).data
			.id,
		c.id,
	);
	for (const amount of [100, 200])
		await request("journey/spend", "POST", {
			campaign_id: c.id,
			reporting_date: "2026-10-01",
			currency: "EGP",
			spend_minor: amount,
		});
	const r = await report();
	assert.equal(r.rows[0].campaign_id, c.id);
	assert.equal(r.spend.length, 1);
	assert.equal(r.spend[0].spend_minor, "200");
	assert.equal(r.spend[0].name, "After");
	assert.equal(r.spend[0].timezone, "Africa/Cairo");
});
test("M2-13 cross-tenant visitor/session/identity/event/touch/order/conversion/report references denied", async () => {
	await fresh();
	const bctx = { tenant: f.ids.b, token: f.tokens.agency };
	await link(telemetry({ name: "form_submitted" }));
	await purchase();
	const run = (await request("journey/calculate", "POST", {})).data;
	for (const name of [
		"visitors",
		"sessions",
		"identities",
		"events",
		"touchpoints",
		"orders",
		"conversions",
		"campaigns",
		"sites",
	]) {
		const list = (await request(`journey/${name}`)).data;
		for (const r of list)
			await assert.rejects(
				request(`journey/${name}/${r.id}`, "GET", {}, bctx),
				fail("NOT_FOUND"),
			);
		assert.equal(
			(await request(`journey/${name}`, "GET", {}, bctx)).data.length,
			0,
		);
	}
	await assert.rejects(
		request(`reports/campaign-performance?run_id=${run.id}`, "GET", {}, bctx),
		fail("NOT_FOUND"),
	);
	await assert.rejects(
		request(
			`contacts/${f.ids.contact}/journey`,
			"GET",
			{},
			{ tenant: f.ids.b, token: f.tokens.manager },
		),
		fail("FORBIDDEN"),
	);
});
test("M2-14 FORCE RLS and nonowner runtime isolate all M2 tables including direct SQL", async () => {
	await fresh();
	await link(telemetry({ name: "form_submitted" }));
	await purchase();
	await report();
	const tables = [
		"collection_site",
		"visitor",
		"journey_session",
		"source_receipt",
		"identity_link",
		"campaign",
		"touchpoint",
		"spend_fact",
		"commerce_order",
		"payment",
		"fulfillment",
		"refund",
		"conversion",
		"attribution_run",
		"attribution_credit",
		"collection_rate",
		"attribution_job",
	];
	const role = (
		await pool.query(
			"SELECT rolname,rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user",
		)
	).rows[0];
	assert.equal(role.rolsuper, false);
	assert.equal(role.rolbypassrls, false);
	for (const table of tables) {
		const flags = (
			await admin.query(
				"SELECT relrowsecurity,relforcerowsecurity,pg_get_userbyid(relowner) owner FROM pg_class WHERE oid=$1::regclass",
				[`crm.${table}`],
			)
		).rows[0];
		assert.ok(flags.relrowsecurity && flags.relforcerowsecurity);
		assert.notEqual(flags.owner, role.rolname);
		if (table !== "collection_rate")
			await transaction(
				{ tenant: f.ids.b, token: f.tokens.agency },
				async (db) => {
					assert.equal(
						(
							await db.query(`SELECT * FROM crm.${table} WHERE tenant_id=$1`, [
								f.ids.a,
							])
						).rowCount,
						0,
					);
				},
			);
	}
	await assert.rejects(
		transaction({ tenant: f.ids.b, token: f.tokens.agency }, (db) =>
			db.query("INSERT INTO crm.visitor VALUES($1,$2,$3,$4)", [
				f.ids.b,
				randomUUID(),
				site.id,
				randomUUID(),
			]),
		),
		(e: unknown) => (e as { code: string }).code === "23503",
	);
	await assert.rejects(
		transaction(ctx, (db) =>
			db.query("UPDATE crm.conversion SET value_minor=1 WHERE tenant_id=$1", [
				ctx.tenant,
			]),
		),
		(e: unknown) => (e as { code: string }).code === "42501",
	);
});
test("M2-15 current RBAC denies reader, revoked membership and agency grant escalation", async () => {
	await fresh();
	for (const path of [
		"reports/campaign-performance",
		"journey/visitors",
		"conversions",
	])
		await assert.rejects(
			request(path, "GET", {}, { tenant: f.ids.a, token: f.tokens.reader }),
			fail("FORBIDDEN"),
		);
	await assert.rejects(
		request(
			"journey/calculate",
			"POST",
			{},
			{ tenant: f.ids.a, token: f.tokens.agency, grant: f.ids.grant },
		),
		fail("FORBIDDEN"),
	);
	await admin.query(
		"UPDATE crm.membership SET active=false WHERE tenant_id=$1 AND principal_id=$2",
		[f.ids.a, f.ids.manager],
	);
	await assert.rejects(
		request("reports/campaign-performance"),
		fail("FORBIDDEN"),
	);
});
test("M2-16 public HTTP body limits and field restrictions; no identity exposure", async () => {
	await fresh();
	const app = server();
	await new Promise<void>((resolve) => app.listen(0, "127.0.0.1", resolve));
	try {
		const address = app.address();
		assert.ok(address && typeof address !== "string");
		const url = `http://127.0.0.1:${address.port}/v1/collect/events`,
			headers = {
				"Content-Type": "application/json",
				"X-Site-Key": site.public_key,
				Origin: site.origin,
			};
		const r = await fetch(url, {
			method: "POST",
			headers,
			body: JSON.stringify(telemetry()),
		});
		assert.equal(r.status, 202);
		assert.equal(r.headers.get("access-control-allow-origin"), site.origin);
		const preflight = await fetch(url, {
			method: "OPTIONS",
			headers: {
				Origin: site.origin,
				"Access-Control-Request-Method": "POST",
				"Access-Control-Request-Headers": "content-type,x-site-key",
			},
		});
		assert.equal(preflight.status, 204);
		assert.equal(
			preflight.headers.get("access-control-allow-origin"),
			site.origin,
		);
		const data = await r.json();
		assert.deepEqual(Object.keys(data.data), ["id"]);
		assert.ok(data.request_id);
		assert.equal(
			(
				await fetch(url, {
					method: "POST",
					headers,
					body: JSON.stringify({ padding: "x".repeat(9000) }),
				})
			).status,
			413,
		);
		assert.equal(
			(await fetch(url, { method: "POST", headers, body: "not JSON" })).status,
			422,
		);
	} finally {
		await new Promise<void>((resolve, reject) =>
			app.close((e) => (e ? reject(e) : resolve())),
		);
	}
});
test("M2-17 disabled site/rate limit/session spoof and cross-tenant campaign rejected", async () => {
	await fresh();
	const b = telemetry();
	await send(b);
	await assert.rejects(
		send({ ...b, event_id: randomUUID(), visitor_id: randomUUID() }),
		fail("SOURCE_CONFLICT"),
	);
	const other = (
		await request(
			"journey/campaigns",
			"POST",
			{
				source: "search",
				account_id: "x",
				external_id: "x",
				name: "Other",
				currency: "EGP",
				timezone: "UTC",
			},
			{ tenant: f.ids.b, token: f.tokens.agency },
		)
	).data;
	await assert.rejects(
		send(telemetry({ source: "search", campaign_id: other.id })),
		fail("VALIDATION_FAILED"),
	);
	await admin.query("UPDATE crm.collection_rate SET n=120 WHERE tenant_id=$1", [
		ctx.tenant,
	]);
	await assert.rejects(send(telemetry()), fail("RATE_LIMITED"));
	await request("journey/sites", "POST", {
		id: site.id,
		origin: site.origin,
		enabled: false,
	});
	await assert.rejects(send(b), fail("INVALID_SITE"));
});
test("M2-18 replay concurrency produces one event/payment and no extra conversion", async () => {
	await fresh();
	const b = telemetry(),
		results = await Promise.all(Array.from({ length: 5 }, () => send(b)));
	assert.equal(new Set(results.map((x) => x.id)).size, 1);
	const p = await purchase();
	await Promise.all(
		Array.from({ length: 5 }, () =>
			request("journey/commerce", "POST", p.body),
		),
	);
	assert.equal(await count("conversion"), 1);
});
test("M2-19 late collection queues a reauthorized calculation; worker replay is harmless", async () => {
	await fresh();
	const visitor = randomUUID();
	await link(
		telemetry({
			visitor_id: visitor,
			name: "form_submitted",
			source: "direct",
		}),
	);
	await purchase();
	const worker = { tenant: ctx.tenant, token: f.tokens.worker };
	let n = 0;
	while (await attributionWorkOne(worker)) {
		if (++n > 20) throw new Error("unbounded queue");
	}
	const first = (await request("reports/campaign-performance")).data;
	assert.equal(first.rows[0].source, "direct");
	await send(
		telemetry({ visitor_id: visitor, source: "late", occurred_at: at(4) }),
	);
	assert.equal(await attributionWorkOne(worker), true);
	assert.equal(await attributionWorkOne(worker), false);
	const last = (await request("reports/campaign-performance")).data;
	assert.notEqual(last.run_id, first.run_id);
	assert.equal(last.rows[0].source, "late");
	await send(telemetry());
	await admin.query(
		"UPDATE crm.membership SET active=false WHERE tenant_id=$1 AND principal_id=$2",
		[ctx.tenant, f.ids.manager],
	);
	const runs = await count("attribution_run");
	await attributionWorkOne(worker);
	assert.equal(await count("attribution_run"), runs);
	assert.equal(
		(
			await admin.query(
				"SELECT count(*)::int n FROM crm.attribution_job WHERE tenant_id=$1 AND status='blocked'",
				[ctx.tenant],
			)
		).rows[0].n,
		1,
	);
});
test("M2-20 duplicate outcome with new transport identity deduplicates, changed amount conflicts", async () => {
	await fresh();
	const p = await purchase();
	await request("journey/commerce", "POST", {
		...p.body,
		source_event_id: randomUUID(),
	});
	assert.equal(await count("conversion"), 1);
	await assert.rejects(
		request("journey/commerce", "POST", {
			...p.body,
			source_event_id: randomUUID(),
			amount_minor: 1,
		}),
		fail("OUTCOME_CONFLICT"),
	);
});
test("M2-21 null and wrong JSON types cannot bypass collection schema", async () => {
	await fresh();
	for (const b of [
		{ name: null },
		{ landing_path: null },
		{ occurred_at: null },
		{ event_id: null },
		{ visitor_id: null },
		{ schema_version: "1" },
		{ consent: { analytics: "true", advertising: false } },
		{ source: { email: "private@example.test" } },
	])
		await assert.rejects(send(telemetry(b)), fail("VALIDATION_FAILED"));
	assert.equal(await count("visitor"), 0);
});
test("M2-22 reporting filters raw identifiers; commerce queue references canonical conversion", async () => {
	await fresh();
	await send(
		telemetry({
			click_id: "synthetic-click",
			consent: { analytics: true, advertising: true },
		}),
	);
	const p = await purchase();
	await admin.query(
		"DELETE FROM crm.role_permission WHERE role='manager' AND action='sensitive.read'",
	);
	try {
		assert.equal(
			"click_id" in (await request("journey/touchpoints")).data[0],
			false,
		);
		assert.equal(
			"external_id" in (await request("journey/visitors")).data[0],
			false,
		);
	} finally {
		await admin.query(
			"INSERT INTO crm.role_permission VALUES('manager','sensitive.read','tenant')",
		);
	}
	const c = (await request("conversions")).data[0];
	assert.equal(c.order_id, p.order_id);
	assert.equal(
		(
			await admin.query(
				"SELECT count(*)::int n FROM crm.attribution_job WHERE tenant_id=$1 AND conversion_id=$2 AND event_id IS NULL",
				[ctx.tenant, c.id],
			)
		).rows[0].n,
		1,
	);
});
