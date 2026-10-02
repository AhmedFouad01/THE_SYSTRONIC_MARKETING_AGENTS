import { createHash, randomUUID } from "node:crypto";
import type pg from "pg";
import { type Context, Fault, pool, transaction } from "./db.js";
import { type Body, id, permit, record } from "./crm.js";

const invalid = () => new Fault(422, "VALIDATION_FAILED");
function fields(b: Body, names: string[]) {
	if (Object.keys(b).some((k) => !names.includes(k)))
		throw new Fault(422, "FIELD_NOT_WRITABLE");
}
function str(v: unknown, max = 100): string {
	if (typeof v !== "string" || !v.trim() || v.length > max) throw invalid();
	return v.trim();
}
function code(v: unknown): string {
	const s = str(v);
	if (!/^[a-zA-Z0-9_.:-]+$/.test(s)) throw invalid();
	return s;
}
function time(v: unknown): string {
	const s = str(v, 40);
	if (!/^\d{4}-\d\d-\d\dT.*Z$/.test(s) || !Number.isFinite(Date.parse(s)))
		throw invalid();
	return new Date(s).toISOString();
}
function money(v: unknown): number {
	if (!Number.isSafeInteger(v) || Number(v) < 0 || Number(v) > 1e12)
		throw invalid();
	return Number(v);
}
function currency(v: unknown): string {
	const s = str(v, 3);
	if (!/^[A-Z]{3}$/.test(s)) throw invalid();
	return s;
}
function canonical(v: unknown): string {
	if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
	if (v && typeof v === "object")
		return `{${Object.entries(v)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([k, x]) => `${JSON.stringify(k)}:${canonical(x)}`)
			.join(",")}}`;
	return JSON.stringify(v);
}
const hash = (v: unknown) =>
	createHash("sha256").update(canonical(v)).digest("hex");
async function lock(db: pg.PoolClient, tenant: string) {
	// Serializes evidence changes and calculations for a consistent published snapshot.
	await db.query("SELECT pg_advisory_xact_lock(hashtextextended($1,2))", [
		tenant,
	]);
}
async function row(
	db: pg.PoolClient,
	ctx: Context,
	table: string,
	object: string,
) {
	const tables = [
		"visitor",
		"journey_session",
		"identity_link",
		"business_event",
		"touchpoint",
		"commerce_order",
		"conversion",
		"campaign",
		"collection_site",
		"payment",
	];
	if (!tables.includes(table)) throw new Fault(404, "NOT_FOUND");
	const r = (
		await db.query(`SELECT * FROM crm.${table} WHERE tenant_id=$1 AND id=$2`, [
			ctx.tenant,
			id(object),
		])
	).rows[0];
	if (!r) throw new Fault(404, "NOT_FOUND");
	return r;
}
async function audit(
	db: pg.PoolClient,
	ctx: Context,
	action: string,
	requestId: string,
	eventId?: string,
) {
	await db.query(
		"INSERT INTO crm.audit_log(tenant_id,id,actor_id,grant_id,action,request_id,changed_fields) VALUES($1,$2,crm.actor(),$3,$4,$5,ARRAY['m2_evidence'])",
		[ctx.tenant, randomUUID(), ctx.grant ?? null, action, requestId],
	);
	if (action === "identity.linked" || action.startsWith("commerce."))
		await db.query(
			"INSERT INTO crm.attribution_job(tenant_id,id,actor_id,action,event_id,conversion_id) SELECT $1,$2,crm.actor(),'integration.ingest',CASE WHEN c.id IS NULL THEN $3::uuid END,c.id FROM (SELECT 1) x LEFT JOIN crm.conversion c ON c.tenant_id=$1 AND c.event_id=$3",
			[ctx.tenant, randomUUID(), eventId],
		);
}
async function event(
	db: pg.PoolClient,
	ctx: Context,
	namespace: string,
	sourceId: string,
	name: string,
	at: string,
	contact: string | null,
	properties: Body = {},
) {
	const e = randomUUID();
	await db.query(
		"INSERT INTO crm.business_event(tenant_id,id,name,source,source_event_id,occurred_at,contact_id,properties) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
		[ctx.tenant, e, name, namespace, sourceId, at, contact, properties],
	);
	return e;
}
async function receipt(
	db: pg.PoolClient,
	ctx: Context,
	namespace: string,
	sourceId: string,
	b: Body,
) {
	const r = (
		await db.query(
			"SELECT * FROM crm.source_receipt WHERE tenant_id=$1 AND namespace=$2 AND source_id=$3",
			[ctx.tenant, namespace, sourceId],
		)
	).rows[0];
	if (r && r.request_hash !== hash(b)) throw new Fault(409, "SOURCE_CONFLICT");
	return r?.event_id as string | undefined;
}
async function saveReceipt(
	db: pg.PoolClient,
	ctx: Context,
	namespace: string,
	sourceId: string,
	b: Body,
	e: string,
) {
	await db.query("INSERT INTO crm.source_receipt VALUES($1,$2,$3,$4,$5)", [
		ctx.tenant,
		namespace,
		sourceId,
		hash(b),
		e,
	]);
}
export async function collect(site: unknown, origin: unknown, b: Body) {
	try {
		const r = await pool.query("SELECT crm.collect_event($1,$2,$3) id", [
			id(site),
			str(origin, 250),
			b,
		]);
		return { id: r.rows[0].id };
	} catch (e) {
		if (e instanceof Fault) throw e;
		const c = (e as { code?: string }).code;
		if (c === "P2001") throw new Fault(403, "INVALID_SITE");
		if (c === "P2003") throw new Fault(409, "SOURCE_CONFLICT");
		if (c === "P2004") throw new Fault(429, "RATE_LIMITED");
		if (c === "P2002" || c?.startsWith("22") || c?.startsWith("23"))
			throw invalid();
		throw e;
	}
}
export async function collectionOrigin(origin: unknown) {
	if (typeof origin !== "string" || origin.length > 250) return false;
	return (
		await pool.query("SELECT crm.collection_origin_allowed($1) allowed", [
			origin,
		])
	).rows[0].allowed as boolean;
}
async function identity(
	db: pg.PoolClient,
	ctx: Context,
	b: Body,
	requestId: string,
) {
	fields(b, [
		"command_id",
		"visitor_id",
		"contact_id",
		"evidence_type",
		"evidence_ref",
		"evidence_event_id",
		"valid_from",
		"valid_to",
		"corrects_id",
	]);
	await permit(db, ctx, "crm.write", "contact", id(b.contact_id));
	const contact = await record(
		db,
		ctx,
		"contact",
		id(b.contact_id),
		"crm.write",
	);
	if (contact.merged_into_id) throw new Fault(409, "CONTACT_MERGED");
	const visitor = await row(db, ctx, "visitor", id(b.visitor_id));
	const evidence = await row(
		db,
		ctx,
		"business_event",
		id(b.evidence_event_id),
	);
	const kind = str(b.evidence_type),
		ref = code(b.evidence_ref),
		from = time(b.valid_from),
		to = time(b.valid_to);
	if (
		!["form", "authentication", "order"].includes(kind) ||
		from >= to ||
		Date.parse(to) - Date.parse(from) > 366 * 86400000
	)
		throw invalid();
	if (
		kind === "form" &&
		(evidence.name !== "form_submitted" || evidence.visitor_id !== visitor.id)
	)
		throw invalid();
	if (
		kind !== "form" &&
		(evidence.contact_id !== contact.id ||
			!["order_placed", "identity.authenticated"].includes(evidence.name))
	)
		throw invalid();
	const ns = `identity:${ctx.token ? (await db.query("SELECT crm.actor() id")).rows[0].id : ""}`,
		command = id(b.command_id);
	const prior = await receipt(db, ctx, ns, command, b);
	if (prior)
		return (
			await db.query(
				"SELECT * FROM crm.identity_link WHERE tenant_id=$1 AND evidence_type=$2 AND evidence_ref=$3 AND visitor_id=$4",
				[ctx.tenant, kind, ref, visitor.id],
			)
		).rows[0];
	const existing = (
		await db.query(
			"SELECT * FROM crm.identity_link WHERE tenant_id=$1 AND visitor_id=$2 AND evidence_type=$3 AND evidence_ref=$4",
			[ctx.tenant, visitor.id, kind, ref],
		)
	).rows[0];
	if (existing) throw new Fault(409, "SOURCE_CONFLICT");
	let correction: string | null = null;
	if (b.corrects_id) {
		const old = await row(db, ctx, "identity_link", id(b.corrects_id));
		await record(db, ctx, "contact", old.contact_id, "crm.write");
		if (old.visitor_id !== visitor.id || old.revoked_at)
			throw new Fault(409, "IDENTITY_CONFLICT");
		correction = old.id;
		await db.query(
			"UPDATE crm.identity_link SET revoked_at=now() WHERE tenant_id=$1 AND id=$2",
			[ctx.tenant, old.id],
		);
	}
	const overlap = await db.query(
		"SELECT 1 FROM crm.identity_link WHERE tenant_id=$1 AND visitor_id=$2 AND revoked_at IS NULL AND valid_from<$4 AND valid_to>$3",
		[ctx.tenant, visitor.id, from, to],
	);
	if (overlap.rowCount) throw new Fault(409, "IDENTITY_CONFLICT");
	const link = randomUUID();
	await db.query(
		"INSERT INTO crm.identity_link(tenant_id,id,visitor_id,contact_id,evidence_type,evidence_ref,evidence_event_id,valid_from,valid_to,corrects_id,actor_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,crm.actor())",
		[
			ctx.tenant,
			link,
			visitor.id,
			contact.id,
			kind,
			ref,
			evidence.id,
			from,
			to,
			correction,
		],
	);
	await saveReceipt(db, ctx, ns, command, b, evidence.id);
	await audit(db, ctx, "identity.linked", requestId, evidence.id);
	return row(db, ctx, "identity_link", link);
}
async function commerce(
	db: pg.PoolClient,
	ctx: Context,
	b: Body,
	requestId: string,
) {
	fields(b, [
		"source",
		"source_event_id",
		"kind",
		"external_order_id",
		"external_id",
		"contact_id",
		"occurred_at",
		"currency",
		"amount_minor",
		"status",
		"payment_id",
	]);
	const source = `synthetic:${code(b.source)}`,
		sourceId = code(b.source_event_id),
		kind = code(b.kind),
		at = time(b.occurred_at),
		externalOrder = code(b.external_order_id);
	if (Date.parse(at) > Date.now() + 300000) throw invalid();
	if (!["order", "payment", "fulfillment", "refund"].includes(kind))
		throw invalid();
	const contact = b.contact_id ? id(b.contact_id) : null;
	if (contact) await record(db, ctx, "contact", contact, "crm.write");
	const old = await receipt(db, ctx, source, sourceId, b);
	if (old) return { event_id: old, replayed: true };
	let order = (
		await db.query(
			"SELECT * FROM crm.commerce_order WHERE tenant_id=$1 AND source=$2 AND external_id=$3 FOR UPDATE",
			[ctx.tenant, source, externalOrder],
		)
	).rows[0];
	if (order?.contact_id)
		await record(db, ctx, "contact", order.contact_id, "crm.write");
	let e: string;
	if (kind === "order") {
		const status = str(b.status),
			cur = currency(b.currency),
			amount = money(b.amount_minor);
		if (!["placed", "cancelled"].includes(status)) throw invalid();
		if (
			order &&
			(order.currency !== cur ||
				Number(order.net_minor) !== amount ||
				order.contact_id !== contact)
		)
			throw new Fault(409, "ORDER_CONFLICT");
		if (
			order &&
			new Date(order.status_at).toISOString() === at &&
			order.order_status !== status
		)
			throw new Fault(409, "ORDER_CONFLICT");
		if (!order) {
			if (status !== "placed") throw new Fault(409, "ORDER_REQUIRED");
			order = { id: randomUUID(), contact_id: contact };
			await db.query(
				"INSERT INTO crm.commerce_order VALUES($1,$2,$3,$4,$5,$6,$7,$7,$8,$9)",
				[
					ctx.tenant,
					order.id,
					source,
					externalOrder,
					contact,
					status,
					at,
					cur,
					amount,
				],
			);
		} else
			await db.query(
				"UPDATE crm.commerce_order SET order_status=$3,status_at=$4 WHERE tenant_id=$1 AND id=$2 AND status_at<$4",
				[ctx.tenant, order.id, status, at],
			);
		e = await event(
			db,
			ctx,
			source,
			sourceId,
			status === "placed" ? "order_placed" : "order_cancelled",
			at,
			contact,
			{ order_id: order.id },
		);
	} else {
		if (!order) throw new Fault(409, "ORDER_REQUIRED");
		if (contact && contact !== order.contact_id)
			throw new Fault(409, "ORDER_CONFLICT");
		const external = code(b.external_id),
			object = randomUUID();
		// Separate immutable outcome IDs also catch replays wrapped in a new transport event.
		const duplicate = (
			await db.query(
				`SELECT * FROM crm.${kind} WHERE tenant_id=$1 AND order_id=$2 AND external_id=$3`,
				[ctx.tenant, order.id, external],
			)
		).rows[0];
		if (duplicate) {
			const oldEvent = await row(db, ctx, "business_event", duplicate.event_id);
			if (
				hash({ ...oldEvent.properties.input, source_event_id: null }) !==
				hash({ ...b, source_event_id: null })
			)
				throw new Fault(409, "OUTCOME_CONFLICT");
			await saveReceipt(db, ctx, source, sourceId, b, duplicate.event_id);
			return { event_id: duplicate.event_id, replayed: true };
		}
		if (kind === "fulfillment") {
			const status = str(b.status);
			if (!["shipped", "delivered", "returned"].includes(status))
				throw invalid();
			e = await event(
				db,
				ctx,
				source,
				sourceId,
				`order_${status}`,
				at,
				order.contact_id,
				{ order_id: order.id, input: b },
			);
			await db.query(
				"INSERT INTO crm.fulfillment VALUES($1,$2,$3,$4,$5,$6,$7)",
				[ctx.tenant, object, order.id, external, at, status, e],
			);
		} else {
			const amount = money(b.amount_minor),
				cur = currency(b.currency);
			if (!amount || cur !== order.currency) throw invalid();
			let reversal: string | null = null,
				payment: string | null = null;
			if (kind === "payment") {
				if (order.order_status === "cancelled")
					throw new Fault(409, "ORDER_CANCELLED");
				const paid = (
					await db.query(
						"SELECT coalesce(sum(amount_minor),0)::text amount FROM crm.payment WHERE tenant_id=$1 AND order_id=$2",
						[ctx.tenant, order.id],
					)
				).rows[0];
				if (Number(paid.amount) + amount > Number(order.net_minor))
					throw new Fault(409, "PAYMENT_EXCEEDS_ORDER");
			} else {
				const p = await row(db, ctx, "payment", id(b.payment_id));
				payment = p.id;
				if (
					p.order_id !== order.id ||
					p.currency !== cur ||
					Date.parse(at) < new Date(p.occurred_at).getTime()
				)
					throw invalid();
				const refunded = (
					await db.query(
						"SELECT coalesce(sum(amount_minor),0)::text amount FROM crm.refund WHERE tenant_id=$1 AND payment_id=$2",
						[ctx.tenant, p.id],
					)
				).rows[0];
				if (Number(refunded.amount) + amount > Number(p.amount_minor))
					throw new Fault(409, "REFUND_EXCEEDS_PAYMENT");
				reversal = (
					await db.query(
						"SELECT id FROM crm.conversion WHERE tenant_id=$1 AND event_id=$2",
						[ctx.tenant, p.event_id],
					)
				).rows[0].id;
			}
			const name = kind === "payment" ? "payment_captured" : "refund_recorded";
			e = await event(db, ctx, source, sourceId, name, at, order.contact_id, {
				order_id: order.id,
				input: b,
			});
			if (kind === "payment")
				await db.query(
					"INSERT INTO crm.payment VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
					[ctx.tenant, object, order.id, external, at, amount, cur, e],
				);
			else
				await db.query(
					"INSERT INTO crm.refund VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
					[ctx.tenant, object, order.id, payment, external, at, amount, cur, e],
				);
			await db.query(
				"INSERT INTO crm.conversion(tenant_id,id,event_id,conversion_type,contact_id,order_id,business_outcome_key,occurred_at,value_minor,currency,evidence_kind,reversal_of_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'synthetic_authoritative_import',$11)",
				[
					ctx.tenant,
					randomUUID(),
					e,
					name,
					order.contact_id,
					order.id,
					`${source}:${externalOrder}:${kind}:${external}`,
					at,
					kind === "refund" ? -amount : amount,
					cur,
					reversal,
				],
			);
		}
	}
	await saveReceipt(db, ctx, source, sourceId, b, e);
	await audit(db, ctx, `commerce.${kind}`, requestId, e);
	return { event_id: e, order_id: order.id, replayed: false };
}
async function normalizeDeals(db: pg.PoolClient, ctx: Context) {
	await permit(db, ctx, "conversion.normalize", "report");
	// M1's once-per-deal outcome ledger is the accepted service truth.
	await db.query(
		`INSERT INTO crm.conversion(tenant_id,id,event_id,conversion_type,contact_id,deal_id,business_outcome_key,definition_version,occurred_at,value_minor,currency,evidence_kind)
 SELECT o.tenant_id,gen_random_uuid(),o.event_id,'deal_won',d.contact_id,d.id,o.outcome_key,'service-won-v1',e.occurred_at,d.amount_minor,d.currency,'crm_outcome'
 FROM crm.commercial_outcome o JOIN crm.deal d ON (d.tenant_id,d.id)=(o.tenant_id,o.deal_id) JOIN crm.business_event e ON (e.tenant_id,e.id)=(o.tenant_id,o.event_id)
 WHERE o.tenant_id=$1 ON CONFLICT(tenant_id,conversion_type,business_outcome_key) DO NOTHING`,
		[ctx.tenant],
	);
}
async function calculate(db: pg.PoolClient, ctx: Context, b: Body) {
	fields(b, ["lookback_days"]);
	const days = b.lookback_days ?? 30;
	if (!Number.isInteger(days) || Number(days) < 1 || Number(days) > 365)
		throw invalid();
	await normalizeDeals(db, ctx);
	const conversions = (
		await db.query(
			"SELECT * FROM crm.conversion WHERE tenant_id=$1 ORDER BY (reversal_of_id IS NOT NULL),occurred_at,id",
			[ctx.tenant],
		)
	).rows;
	const touches = (
		await db.query(
			"SELECT t.*,i.contact_id,i.valid_from,i.valid_to FROM crm.touchpoint t JOIN crm.identity_link i ON i.tenant_id=t.tenant_id AND i.visitor_id=t.visitor_id WHERE t.tenant_id=$1 AND i.revoked_at IS NULL AND t.analytics_consent ORDER BY t.occurred_at,t.id,i.id",
			[ctx.tenant],
		)
	).rows;
	const run = randomUUID(),
		credits: Body[] = [],
		allocations = new Map<string, pg.QueryResultRow | null>();
	for (const c of conversions) {
		const at = new Date(c.occurred_at).getTime();
		const eligible = touches.filter(
			(t) =>
				t.contact_id === c.contact_id &&
				new Date(t.occurred_at).getTime() <= at &&
				new Date(t.occurred_at).getTime() >= at - Number(days) * 86400000 &&
				new Date(t.occurred_at) >= new Date(t.valid_from) &&
				new Date(t.occurred_at) < new Date(t.valid_to) &&
				new Date(c.occurred_at) < new Date(t.valid_to),
		);
		for (const model of ["first_touch", "last_non_direct"]) {
			const meaningful = eligible.filter(
				(t) => t.source !== "direct" && t.source !== "unknown",
			);
			let chosen: pg.QueryResultRow | null =
				model === "first_touch"
					? (eligible[0] ?? null)
					: (meaningful.at(-1) ??
						eligible.filter((t) => t.source === "direct").at(-1) ??
						null);
			if (chosen?.source === "unknown") chosen = null;
			if (c.reversal_of_id)
				chosen = allocations.get(`${c.reversal_of_id}:${model}`) ?? null;
			allocations.set(`${c.id}:${model}`, chosen);
			credits.push({
				conversion_id: c.id,
				model,
				touchpoint_id: chosen?.id ?? null,
				source: chosen?.source ?? "unknown",
				value_minor: c.value_minor,
			});
		}
	}
	await db.query(
		"INSERT INTO crm.attribution_run(tenant_id,id,model_version,lookback_days,evidence_hash,actor_id) VALUES($1,$2,'deterministic-v1',$3,$4,crm.actor())",
		[ctx.tenant, run, days, hash({ conversions, touches, days, credits })],
	);
	for (const c of credits)
		await db.query(
			"INSERT INTO crm.attribution_credit VALUES($1,$2,$3,$4,$5,$6,1,$7)",
			[
				ctx.tenant,
				run,
				c.conversion_id,
				c.model,
				c.touchpoint_id,
				c.source,
				c.value_minor,
			],
		);
	return (
		await db.query(
			"SELECT * FROM crm.attribution_run WHERE tenant_id=$1 AND id=$2",
			[ctx.tenant, run],
		)
	).rows[0];
}
const mappings: Record<string, string> = {
	visitors: "visitor",
	sessions: "journey_session",
	identities: "identity_link",
	events: "business_event",
	touchpoints: "touchpoint",
	orders: "commerce_order",
	conversions: "conversion",
	campaigns: "campaign",
	sites: "collection_site",
};
export function isJourney(path: string) {
	return (
		path.startsWith("/v1/journey/") ||
		path.startsWith("/v1/conversions") ||
		path.startsWith("/v1/reports/") ||
		/^\/v1\/contacts\/[^/]+\/journey$/.test(path)
	);
}
export async function journeyRequest(
	ctx: Context,
	method: string,
	path: string,
	query: URLSearchParams,
	b: Body,
	requestId: string,
) {
	return transaction(ctx, async (db) => {
		const write = method !== "GET";
		const action =
			path === "/v1/journey/calculate"
				? "report.calculate"
				: path === "/v1/journey/sites"
					? "integration.manage"
					: "integration.ingest";
		const contactJourney = /^\/v1\/contacts\/([^/]+)\/journey$/.exec(path);
		if (!write && contactJourney)
			await record(db, ctx, "contact", id(contactJourney[1]));
		else await permit(db, ctx, write ? action : "report.read", "report");
		if (write) {
			if (method !== "POST") throw new Fault(404, "NOT_FOUND");
			await lock(db, ctx.tenant);
		}
		if (method === "POST" && path === "/v1/journey/sites") {
			fields(b, ["id", "origin", "enabled"]);
			const site = id(b.id),
				origin = str(b.origin, 250);
			let u: URL;
			try {
				u = new URL(origin);
			} catch {
				throw invalid();
			}
			if (
				u.origin !== origin ||
				!["http:", "https:"].includes(u.protocol) ||
				typeof b.enabled !== "boolean"
			)
				throw invalid();
			const r = await db.query(
				"INSERT INTO crm.collection_site(tenant_id,id,public_key,origin,enabled,actor_id) VALUES($1,$2,$3,$4,$5,crm.actor()) ON CONFLICT(tenant_id,id) DO UPDATE SET origin=excluded.origin,enabled=excluded.enabled,actor_id=crm.actor() RETURNING *",
				[ctx.tenant, site, randomUUID(), origin, b.enabled],
			);
			await audit(db, ctx, "collection.site", requestId);
			return { data: r.rows[0] };
		}
		if (method === "POST" && path === "/v1/journey/identities")
			return { data: await identity(db, ctx, b, requestId) };
		if (method === "POST" && path === "/v1/journey/commerce") {
			await permit(db, ctx, "conversion.normalize", "report");
			return { data: await commerce(db, ctx, b, requestId) };
		}
		if (method === "POST" && path === "/v1/journey/calculate") {
			const result = await calculate(db, ctx, b);
			await audit(db, ctx, "attribution.calculated", requestId);
			return { data: result };
		}
		if (method === "POST" && path === "/v1/journey/campaigns") {
			fields(b, [
				"source",
				"account_id",
				"external_id",
				"name",
				"currency",
				"timezone",
			]);
			const zone = str(b.timezone);
			try {
				new Intl.DateTimeFormat("en", { timeZone: zone });
			} catch {
				throw invalid();
			}
			const result = await db.query(
				"INSERT INTO crm.campaign VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(tenant_id,source,account_id,external_id) DO UPDATE SET name=excluded.name RETURNING *",
				[
					ctx.tenant,
					randomUUID(),
					code(b.source),
					code(b.account_id),
					code(b.external_id),
					str(b.name, 160),
					currency(b.currency),
					zone,
				],
			);
			if (
				result.rows[0].currency !== b.currency ||
				result.rows[0].timezone !== zone
			)
				throw new Fault(409, "CAMPAIGN_DIMENSION_CONFLICT");
			await audit(db, ctx, "campaign.snapshot", requestId);
			return { data: result.rows[0] };
		}
		if (method === "POST" && path === "/v1/journey/spend") {
			fields(b, ["campaign_id", "reporting_date", "currency", "spend_minor"]);
			const c = await row(db, ctx, "campaign", id(b.campaign_id)),
				date = str(b.reporting_date, 10);
			if (
				!/^\d{4}-\d\d-\d\d$/.test(date) ||
				!Number.isFinite(Date.parse(date)) ||
				new Date(date).toISOString().slice(0, 10) !== date ||
				currency(b.currency) !== c.currency
			)
				throw invalid();
			await db.query(
				"INSERT INTO crm.spend_fact(tenant_id,campaign_id,reporting_date,grain,currency,spend_minor) VALUES($1,$2,$3,'campaign_day',$4,$5) ON CONFLICT(tenant_id,campaign_id,reporting_date,grain,breakdown_key) DO UPDATE SET spend_minor=excluded.spend_minor,fetched_at=now()",
				[ctx.tenant, c.id, date, c.currency, money(b.spend_minor)],
			);
			await audit(db, ctx, "spend.snapshot", requestId);
			return { data: { campaign_id: c.id, reporting_date: date } };
		}
		if (method !== "GET") throw new Fault(404, "NOT_FOUND");
		const journey = /^\/v1\/contacts\/([^/]+)\/journey$/.exec(path);
		const limit = 50,
			cursor = query.get("cursor");
		if (cursor && !journey) id(cursor);
		if (journey) {
			const contact = id(journey[1]);
			await record(db, ctx, "contact", contact);
			let cursorTime: string | null = null,
				cursorId: string | null = null;
			if (cursor) {
				const parts = Buffer.from(cursor, "base64url").toString().split("|");
				if (parts.length !== 2) throw invalid();
				cursorTime = time(parts[0]);
				cursorId = id(parts[1]);
			}
			const rows = (
				await db.query(
					`SELECT e.id,e.name,e.occurred_at,e.received_at,e.source,e.schema_version FROM crm.business_event e WHERE e.tenant_id=$1 AND (e.contact_id=$2 OR EXISTS(SELECT 1 FROM crm.identity_link i WHERE i.tenant_id=e.tenant_id AND i.visitor_id=e.visitor_id AND i.contact_id=$2 AND i.revoked_at IS NULL AND e.occurred_at>=i.valid_from AND e.occurred_at<i.valid_to) OR (e.object_kind='contact' AND e.object_id=$2) OR EXISTS(SELECT 1 FROM crm.deal d LEFT JOIN crm.stage_transition st ON st.tenant_id=d.tenant_id AND st.deal_id=d.id WHERE d.tenant_id=e.tenant_id AND d.contact_id=$2 AND ((e.object_kind='deal' AND e.object_id=d.id) OR e.transition_id=st.id))) AND ($3::timestamptz IS NULL OR (e.occurred_at,e.id)>($3::timestamptz,$4::uuid)) ORDER BY e.occurred_at,e.id LIMIT 51`,
					[ctx.tenant, contact, cursorTime, cursorId],
				)
			).rows;
			return {
				data: rows.slice(0, limit),
				next_cursor:
					rows.length > limit
						? Buffer.from(
								new Date(rows[limit - 1].occurred_at).toISOString() +
									"|" +
									rows[limit - 1].id,
							).toString("base64url")
						: null,
			};
		}
		if (path === "/v1/reports/campaign-performance") {
			const model = query.get("model") ?? "last_non_direct";
			if (!["first_touch", "last_non_direct"].includes(model)) throw invalid();
			const runId = query.get("run_id");
			if (runId) id(runId);
			const run = (
				await db.query(
					"SELECT * FROM crm.attribution_run WHERE tenant_id=$1 AND ($2::uuid IS NULL OR id=$2) ORDER BY as_of DESC,id DESC LIMIT 1",
					[ctx.tenant, runId],
				)
			).rows[0];
			if (runId && !run) throw new Fault(404, "NOT_FOUND");
			const rows = run
				? (
						await db.query(
							`SELECT coalesce(t.campaign_id::text,'unknown') campaign_id,cp.name campaign_name,a.source,c.currency,c.conversion_type,sum(a.value_minor)::text value_minor,count(*)::int outcomes FROM crm.attribution_credit a JOIN crm.conversion c ON (c.tenant_id,c.id)=(a.tenant_id,a.conversion_id) LEFT JOIN crm.touchpoint t ON (t.tenant_id,t.id)=(a.tenant_id,a.touchpoint_id) LEFT JOIN crm.campaign cp ON (cp.tenant_id,cp.id)=(t.tenant_id,t.campaign_id) WHERE a.tenant_id=$1 AND a.run_id=$2 AND a.model=$3 GROUP BY t.campaign_id,cp.name,a.source,c.currency,c.conversion_type ORDER BY 1,2,3,4,5`,
							[ctx.tenant, run.id, model],
						)
					).rows
				: [];
			const spend = (
				await db.query(
					"SELECT s.*,c.name,c.source,c.account_id,c.timezone FROM crm.spend_fact s JOIN crm.campaign c ON (c.tenant_id,c.id)=(s.tenant_id,s.campaign_id) WHERE s.tenant_id=$1 ORDER BY reporting_date,campaign_id",
					[ctx.tenant],
				)
			).rows;
			return {
				data: {
					model,
					version: "deterministic-v1",
					lookback_days: run?.lookback_days ?? 30,
					run_id: run?.id ?? null,
					as_of: run?.as_of ?? null,
					time_basis: "conversion_occurrence_UTC",
					window: "all_received_evidence",
					source: "internal_rule_based",
					provider_reported: null,
					rows,
					spend,
					spend_source: "synthetic_internal_snapshot",
					spend_time_basis: "account_local_reporting_date",
					unknown_visible: true,
				},
			};
		}
		const parts = path.replace(/^\/v1\/(journey\/)?/, "").split("/"),
			table = mappings[parts[0]];
		if (!table || parts.length > 2) throw new Fault(404, "NOT_FOUND");
		if (
			[
				"visitor",
				"journey_session",
				"identity_link",
				"business_event",
				"touchpoint",
				"collection_site",
			].includes(table)
		)
			await permit(db, ctx, "crm.read", "contact");
		const rawIdentifiers = (
			await db.query(
				"SELECT crm.can_object('sensitive.read','contact',NULL,$1) allowed",
				[ctx.grant ?? null],
			)
		).rows[0].allowed;
		function redact(r: pg.QueryResultRow) {
			if (table === "business_event") delete r.properties;
			if (!rawIdentifiers) {
				delete r.click_id;
				if (table === "visitor" || table === "journey_session")
					delete r.external_id;
			}
		}
		if (parts[1]) {
			const r = await row(db, ctx, table, id(parts[1]));
			if (r.contact_id) await record(db, ctx, "contact", r.contact_id);
			// General reporting excludes arbitrary event payloads and all protected identifiers.
			redact(r);
			if (table === "conversion")
				r.credits = (
					await db.query(
						"SELECT a.*,r.model_version,r.lookback_days,r.as_of FROM crm.attribution_credit a JOIN crm.attribution_run r ON (r.tenant_id,r.id)=(a.tenant_id,a.run_id) WHERE a.tenant_id=$1 AND a.conversion_id=$2 ORDER BY r.as_of DESC,a.model",
						[ctx.tenant, r.id],
					)
				).rows;
			if (table === "commerce_order")
				for (const part of ["payment", "refund", "fulfillment"])
					r[part] = (
						await db.query(
							`SELECT * FROM crm.${part} WHERE tenant_id=$1 AND order_id=$2 ORDER BY occurred_at,id`,
							[ctx.tenant, r.id],
						)
					).rows;
			return { data: r };
		}
		const rows = (
			await db.query(
				`SELECT * FROM crm.${table} WHERE tenant_id=$1 AND ($2::uuid IS NULL OR id>$2) ORDER BY id LIMIT 51`,
				[ctx.tenant, cursor],
			)
		).rows;
		for (const r of rows) redact(r);
		return {
			data: rows.slice(0, limit),
			next_cursor: rows.length > limit ? rows[limit - 1].id : null,
		};
	});
}
export async function attributionWorkOne(ctx: Context) {
	return transaction(ctx, async (db) => {
		await permit(db, ctx, "report.calculate", "report");
		const job = (
			await db.query(
				"SELECT * FROM crm.attribution_job WHERE tenant_id=$1 AND status='pending' ORDER BY created_at,id FOR UPDATE SKIP LOCKED LIMIT 1",
				[ctx.tenant],
			)
		).rows[0];
		if (!job) return false;
		await lock(db, ctx.tenant);
		const allowed = (
			await db.query("SELECT crm.attribution_job_allowed($1) allowed", [job.id])
		).rows[0].allowed;
		if (!allowed) {
			await db.query(
				"UPDATE crm.attribution_job SET status='blocked' WHERE tenant_id=$1 AND id=$2",
				[ctx.tenant, job.id],
			);
			return true;
		}
		const previous = (
			await db.query(
				"SELECT lookback_days FROM crm.attribution_run WHERE tenant_id=$1 ORDER BY as_of DESC,id DESC LIMIT 1",
				[ctx.tenant],
			)
		).rows[0];
		await calculate(db, ctx, { lookback_days: previous?.lookback_days ?? 30 });
		await db.query(
			"UPDATE crm.attribution_job SET status='processed' WHERE tenant_id=$1 AND id=$2",
			[ctx.tenant, job.id],
		);
		return true;
	});
}
