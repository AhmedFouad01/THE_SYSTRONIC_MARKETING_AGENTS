import { createHash, randomUUID } from "node:crypto";
import type pg from "pg";
import { type Context, Fault, transaction } from "./db.js";
import { contactSources, listRecords } from "./list.js";
import {
	attachProperties,
	mergeCustom,
	prepareCustom,
	sensitiveRead,
} from "./properties.js";
import { type Kind, projection } from "./query.js";
export type Body = Record<string, unknown>;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function id(v: unknown): string {
	if (typeof v !== "string" || !uuid.test(v))
		throw new Fault(422, "VALIDATION_FAILED");
	return v;
}
function text(v: unknown, max = 500): string {
	if (typeof v !== "string" || !v.trim() || v.length > max)
		throw new Fault(422, "VALIDATION_FAILED");
	return v.trim();
}
function integer(v: unknown): number {
	if (!Number.isSafeInteger(v) || Number(v) < 0)
		throw new Fault(422, "VALIDATION_FAILED");
	return Number(v);
}
function date(v: unknown): string {
	const s = text(v, 40);
	if (
		!/^\d{4}-\d\d-\d\dT.*(Z|[+-]\d\d:\d\d)$/.test(s) ||
		!Number.isFinite(Date.parse(s))
	)
		throw new Fault(422, "VALIDATION_FAILED");
	return new Date(s).toISOString();
}
function fields(b: Body, allowed: string[]) {
	if (Object.keys(b).some((k) => !allowed.includes(k)))
		throw new Fault(422, "FIELD_NOT_WRITABLE");
}
export async function permit(
	db: pg.PoolClient,
	ctx: Context,
	action: string,
	kind: string,
	object: string | null = null,
) {
	const {
		rows: [r],
	} = await db.query("SELECT crm.can_object($1,$2,$3,$4) allowed", [
		action,
		kind,
		object,
		ctx.grant ?? null,
	]);
	if (!r.allowed) throw new Fault(403, "FORBIDDEN");
}
const kinds = ["contact", "lead", "deal", "task"];
export async function record(
	db: pg.PoolClient,
	ctx: Context,
	kind: string,
	object: string,
	action = "crm.read",
	lock = false,
) {
	if (!kinds.includes(kind)) throw new Fault(404, "NOT_FOUND");
	const {
		rows: [r],
	} = await db.query(
		`SELECT ${projection(kind as Kind)} FROM crm.${kind} WHERE tenant_id=$1 AND id=$2 ${lock ? "FOR UPDATE" : ""}`,
		[ctx.tenant, object],
	);
	if (!r) throw new Fault(404, "NOT_FOUND");
	await permit(db, ctx, action, kind, object);
	if (kind === "contact") {
		const { rows } = await db.query(
			"SELECT id,kind,crm.identifier_value(id) value,provenance,original_contact_id FROM crm.contact_identifier WHERE tenant_id=$1 AND contact_id=$2 AND crm.can_object('sensitive.read','contact',contact_id,$3)",
			[ctx.tenant, object, ctx.grant ?? null],
		);
		r.identifiers = rows;
	}
	if (kind === "deal") r.amount_minor = Number(r.amount_minor);
	return r;
}
// P1b B3: `properties` on a single record read = active custom values only; sensitive ones only for a caller who may read them on THIS record.
async function withProperties(
	db: pg.PoolClient,
	ctx: Context,
	kind: Kind,
	r: Record<string, unknown>,
) {
	await attachProperties(db, ctx, kind, [r], {
		keys: null,
		sensitive: await sensitiveRead(db, ctx, kind, r.id as string),
	});
}
async function assignment(db: pg.PoolClient, _ctx: Context, owner: unknown) {
	const {
		rows: [r],
	} = await db.query(
		"SELECT crm.actor() actor,crm.assignment_ok($1) valid,crm.can_action('crm.write',NULL) manager",
		[owner ? id(owner) : null],
	);
	const target = owner ? id(owner) : r.actor;
	const {
		rows: [valid],
	} = await db.query("SELECT crm.assignment_ok($1) ok", [target]);
	if (!valid.ok || (!r.manager && target !== r.actor))
		throw new Fault(403, "ASSIGNMENT_DENIED");
	return target;
}
export async function evidence(
	db: pg.PoolClient,
	ctx: Context,
	kind: string,
	object: string,
	action: string,
	requestId: string,
	changed: string[],
) {
	const event = randomUUID();
	await db.query(
		"INSERT INTO crm.audit_log(tenant_id,id,actor_id,grant_id,action,request_id,object_kind,object_id,changed_fields) VALUES($1,$2,crm.actor(),$3,$4,$5,$6,$7,$8)",
		[
			ctx.tenant,
			randomUUID(),
			ctx.grant ?? null,
			action,
			requestId,
			kind,
			object,
			changed,
		],
	);
	await db.query(
		"INSERT INTO crm.business_event(tenant_id,id,name,object_kind,object_id) VALUES($1,$2,$3,$4,$5)",
		[ctx.tenant, event, action, kind, object],
	);
	await db.query(
		"INSERT INTO crm.outbox(tenant_id,id,event_id,actor_id,grant_id,deal_id,object_kind,object_id) VALUES($1,$2,$3,crm.actor(),$4,$5,$6,$7)",
		[
			ctx.tenant,
			randomUUID(),
			event,
			ctx.grant ?? null,
			kind === "deal" ? object : null,
			kind,
			object,
		],
	);
}
async function identifiers(
	db: pg.PoolClient,
	ctx: Context,
	contact: string,
	input: unknown,
) {
	if (input === undefined) return;
	await permit(db, ctx, "sensitive.write", "contact", contact);
	if (!Array.isArray(input) || input.length > 8)
		throw new Fault(422, "VALIDATION_FAILED");
	for (const raw of input) {
		if (!raw || typeof raw !== "object")
			throw new Fault(422, "VALIDATION_FAILED");
		fields(raw, ["kind", "value", "provenance"]);
		const kind = raw.kind;
		let value = text(raw.value, 254).toLowerCase();
		if (kind === "phone") {
			value = value.replace(/[ ()-]/g, "");
			if (!/^\+[1-9]\d{6,14}$/.test(value))
				throw new Fault(422, "VALIDATION_FAILED");
		} else if (kind !== "email" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
			throw new Fault(422, "VALIDATION_FAILED");
		const provenance = text(raw.provenance ?? "manual", 300);
		// Use only the explicitly provisioned tenant key; never replace missing state.
		const {
			rows: [encrypted],
		} = await db.query("SELECT crm.encrypt_identifier($1) value", [value]);
		await db.query(
			"INSERT INTO crm.contact_identifier VALUES($1,$2,$3,$4,$5,crm.identifier_digest($6),$7,$3)",
			[
				ctx.tenant,
				randomUUID(),
				contact,
				kind,
				encrypted.value,
				value,
				provenance,
			],
		);
	}
}
async function contactCreate(
	db: pg.PoolClient,
	ctx: Context,
	b: Body,
	request: string,
) {
	const object = randomUUID(),
		owner = await assignment(db, ctx, b.owner_id);
	const props = await prepareCustom(db, ctx, "contact", null, b.properties);
	await db.query(
		"INSERT INTO crm.contact(tenant_id,id,display_name,owner_id,source,custom,custom_search) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7)",
		[
			ctx.tenant,
			object,
			text(b.display_name, 160),
			owner,
			text(b.source ?? "manual", 100),
			props?.custom ?? "{}",
			props?.search ?? "",
		],
	);
	await identifiers(db, ctx, object, b.identifiers);
	await evidence(db, ctx, "contact", object, "contact.created", request, [
		"display_name",
		"owner_id",
		"source",
		...(b.identifiers ? ["identifiers"] : []),
		...(props?.changed.map((k) => `custom:${k}`) ?? []),
	]);
	return object;
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
export async function durable(
	db: pg.PoolClient,
	ctx: Context,
	operation: string,
	b: Body,
	key: string,
	run: () => Promise<{ kind: string; id: string }>,
) {
	const command = id(b.command_id),
		hash = createHash("sha256").update(canonical(b)).digest("hex");
	await db.query(
		"SELECT pg_advisory_xact_lock(hashtextextended($1||crm.actor()::text,0))",
		[ctx.tenant + operation],
	);
	const {
		rows: [receipt],
	} = await db.query(
		"SELECT * FROM crm.inbox WHERE tenant_id=$1 AND actor_id=crm.actor() AND operation=$2 AND command_id=$3",
		[ctx.tenant, operation, command],
	);
	const {
		rows: [retry],
	} = await db.query(
		"SELECT * FROM crm.command_retry WHERE tenant_id=$1 AND actor_id=crm.actor() AND operation=$2 AND key=$3 AND expires_at>now()",
		[ctx.tenant, operation, key],
	);
	if (
		(receipt && receipt.request_hash !== hash) ||
		(retry && retry.request_hash !== hash)
	)
		throw new Fault(409, "IDEMPOTENCY_CONFLICT");
	const result = receipt
		? { kind: receipt.result_kind, id: receipt.result_id }
		: await run();
	if (!receipt)
		await db.query(
			"INSERT INTO crm.inbox VALUES($1,crm.actor(),$2,$3,$4,$5,$6)",
			[ctx.tenant, operation, command, hash, result.kind, result.id],
		);
	await db.query(
		"INSERT INTO crm.command_retry(tenant_id,actor_id,operation,key,request_hash,command_id) VALUES($1,crm.actor(),$2,$3,$4,$5) ON CONFLICT(tenant_id,actor_id,operation,key) DO UPDATE SET request_hash=excluded.request_hash,command_id=excluded.command_id,expires_at=now()+interval '7 days'",
		[ctx.tenant, operation, key, hash, command],
	);
	return { ...result, replayed: !!receipt };
}
export async function crmRequest(
	ctx: Context,
	method: string,
	path: string,
	query: URLSearchParams,
	b: Body,
	key: string,
	request: string,
) {
	return transaction(ctx, async (db) => {
		if (!/^\/v1\/[a-z]+(?:\/[a-zA-Z0-9-]+){0,2}$/.test(path))
			throw new Fault(404, "NOT_FOUND");
		const parts = path.split("/").filter(Boolean).slice(1),
			resource = parts[0],
			object = parts[1],
			sub = parts[2];
		const kind = (
			{
				contacts: "contact",
				leads: "lead",
				deals: "deal",
				tasks: "task",
			} as Record<string, string>
		)[resource];
		if (
			method === "GET" &&
			resource === "contacts" &&
			object === "sources" &&
			!sub
		) {
			await permit(db, ctx, "crm.read", "contact");
			return contactSources(db, ctx);
		}
		if (method === "GET" && resource === "session" && !object) {
			await permit(db, ctx, "crm.read", "contact");
			return {
				data: (
					await db.query(
						"SELECT crm.actor() actor,crm.can_object('pipeline.manage','pipeline',NULL) configure,crm.can_object('crm.merge','contact',NULL) merge,crm.can_object('audit.read','audit',NULL) audit,crm.can_object('schema.read','property',NULL) schema_read,crm.can_object('property.manage','property',NULL) property_manage",
					)
				).rows[0],
			};
		}
		if (method === "GET" && resource === "assignees" && !object) {
			await permit(db, ctx, "crm.read", "contact");
			return { data: (await db.query("SELECT * FROM crm.assignees()")).rows };
		}
		if (method === "GET" && resource === "pipelines" && !object) {
			await permit(db, ctx, "crm.read", "deal");
			return {
				data: (
					await db.query(
						"SELECT p.*,coalesce((SELECT jsonb_agg(s ORDER BY s.position,s.id) FROM crm.stage s WHERE s.tenant_id=p.tenant_id AND s.pipeline_id=p.id),'[]') stages,coalesce((SELECT jsonb_agg(a) FROM crm.allowed_transition a WHERE a.tenant_id=p.tenant_id AND a.pipeline_id=p.id),'[]') transitions FROM crm.pipeline p WHERE tenant_id=$1 ORDER BY id LIMIT 100",
						[ctx.tenant],
					)
				).rows,
			};
		}
		if (method === "POST" && resource === "pipelines" && !object) {
			await permit(db, ctx, "pipeline.manage", "pipeline");
			fields(b, ["command_id", "name", "stages", "transitions"]);
			const result = await durable(
				db,
				ctx,
				"pipeline.create",
				b,
				key,
				async () => {
					if (
						!Array.isArray(b.stages) ||
						b.stages.length < 2 ||
						b.stages.length > 20 ||
						!Array.isArray(b.transitions) ||
						b.transitions.length > 100
					)
						throw new Fault(422, "VALIDATION_FAILED");
					const pipeline = randomUUID(),
						stageIds: string[] = [];
					await db.query(
						"INSERT INTO crm.pipeline(tenant_id,id,name) VALUES($1,$2,$3)",
						[ctx.tenant, pipeline, text(b.name, 100)],
					);
					for (const [position, s] of b.stages.entries()) {
						fields(s, ["name", "outcome"]);
						if (s.outcome !== undefined && !["won", "lost"].includes(s.outcome))
							throw new Fault(422, "VALIDATION_FAILED");
						const stage = randomUUID();
						stageIds.push(stage);
						await db.query(
							"INSERT INTO crm.stage(tenant_id,id,pipeline_id,name,outcome,position) VALUES($1,$2,$3,$4,$5,$6)",
							[
								ctx.tenant,
								stage,
								pipeline,
								text(s.name, 80),
								s.outcome ?? null,
								position,
							],
						);
					}
					for (const pair of b.transitions) {
						if (
							!Array.isArray(pair) ||
							pair.length !== 2 ||
							!stageIds[integer(pair[0])] ||
							!stageIds[integer(pair[1])]
						)
							throw new Fault(422, "VALIDATION_FAILED");
						await db.query(
							"INSERT INTO crm.allowed_transition VALUES($1,$2,$3,$4)",
							[
								ctx.tenant,
								pipeline,
								stageIds[Number(pair[0])],
								stageIds[Number(pair[1])],
							],
						);
					}
					await evidence(
						db,
						ctx,
						"pipeline",
						pipeline,
						"pipeline.created",
						request,
						["name", "stages", "transitions"],
					);
					return { kind: "pipeline", id: pipeline };
				},
			);
			return { data: result, status: 201 };
		}
		if (resource === "automations") {
			if (
				sub ||
				!["GET", "POST", "PATCH"].includes(method) ||
				(method === "PATCH" && !object) ||
				(method === "POST" && !!object) ||
				(method === "POST" && object) ||
				(method === "GET" && object)
			)
				throw new Fault(404, "NOT_FOUND");
			await permit(db, ctx, "pipeline.manage", "pipeline");
			if (method === "GET")
				return {
					data: (
						await db.query(
							"SELECT r.*,v.id version_id,v.stage_id,v.title,v.delay_minutes FROM crm.automation_rule r JOIN crm.automation_version v ON (v.tenant_id,v.rule_id)=(r.tenant_id,r.id) WHERE r.tenant_id=$1 ORDER BY r.id LIMIT 100",
							[ctx.tenant],
						)
					).rows,
				};
			fields(
				b,
				object
					? ["command_id", "enabled"]
					: ["command_id", "stage_id", "title", "delay_minutes"],
			);
			const result = await durable(
				db,
				ctx,
				`automation.${object ?? "create"}`,
				b,
				key,
				async () => {
					const rule = object ? id(object) : randomUUID();
					if (object) {
						if (typeof b.enabled !== "boolean")
							throw new Fault(422, "VALIDATION_FAILED");
						const r = await db.query(
							"UPDATE crm.automation_rule SET enabled=$3 WHERE tenant_id=$1 AND id=$2 RETURNING id",
							[ctx.tenant, rule, b.enabled],
						);
						if (!r.rowCount) throw new Fault(404, "NOT_FOUND");
					} else {
						const stage = id(b.stage_id);
						if (
							!(
								await db.query(
									"SELECT 1 FROM crm.stage WHERE tenant_id=$1 AND id=$2",
									[ctx.tenant, stage],
								)
							).rowCount
						)
							throw new Fault(404, "NOT_FOUND");
						const delay = integer(b.delay_minutes);
						if (delay > 525600) throw new Fault(422, "VALIDATION_FAILED");
						await db.query(
							"INSERT INTO crm.automation_rule(tenant_id,id) VALUES($1,$2)",
							[ctx.tenant, rule],
						);
						await db.query(
							"INSERT INTO crm.automation_version VALUES($1,$2,$3,$4,$5,$6)",
							[
								ctx.tenant,
								randomUUID(),
								rule,
								stage,
								text(b.title, 160),
								delay,
							],
						);
					}
					await evidence(
						db,
						ctx,
						"automation",
						rule,
						"automation.configured",
						request,
						[object ? "enabled" : "rule"],
					);
					return { kind: "automation", id: rule };
				},
			);
			return { data: result };
		}
		if (method === "GET" && ["audit", "outbox"].includes(resource)) {
			await permit(db, ctx, "audit.read", "audit");
			const cursor = query.get("cursor");
			if (cursor) id(cursor);
			const columns =
				resource === "audit"
					? "id,actor_id,grant_id,action,object_kind,object_id,transition_id,changed_fields,request_id,occurred_at"
					: "id,event_id,object_kind,object_id,deal_id,status,attempts,error_code,next_attempt_at,processed_at";
			const rows = (
				await db.query(
					`SELECT ${columns} FROM crm.${resource === "audit" ? "audit_log" : "outbox"} WHERE tenant_id=$1 AND ($2::uuid IS NULL OR id>$2) ORDER BY id LIMIT 51`,
					[ctx.tenant, cursor],
				)
			).rows;
			return {
				data: rows
					.slice(0, 50)
					.map((r) =>
						"amount_minor" in r
							? { ...r, amount_minor: Number(r.amount_minor) }
							: r,
					),
				next_cursor: rows.length > 50 ? rows[49].id : null,
			};
		}
		if (
			resource === "contacts" &&
			["merge-previews", "merges"].includes(object)
		) {
			if (method !== "POST" || sub) throw new Fault(404, "NOT_FOUND");
			await permit(db, ctx, "crm.merge", "contact");
			fields(
				b,
				object === "merge-previews"
					? ["source_id", "target_id"]
					: [
							"source_id",
							"target_id",
							"source_version",
							"target_version",
							"command_id",
						],
			);
			const source = id(b.source_id),
				target = id(b.target_id);
			if (source === target) throw new Fault(422, "VALIDATION_FAILED");
			// Deterministic contact locks serialize merges against intake, edits and each other.
			await db.query(
				"SELECT id FROM crm.contact WHERE tenant_id=$1 AND id=ANY($2::uuid[]) ORDER BY id FOR UPDATE",
				[ctx.tenant, [source, target]],
			);
			const s = await record(db, ctx, "contact", source, "crm.merge"),
				t = await record(db, ctx, "contact", target, "crm.merge");
			if (object === "merge-previews") {
				// P1b B3: custom values follow the same rule as display_name: the target wins per key; keys only the source holds are filled in.
				const mc = await mergeCustom(db, ctx, source, target);
				return {
					data: {
						source_id: source,
						target_id: target,
						source_version: s.version,
						target_version: t.version,
						conflicts:
							s.display_name === t.display_name
								? []
								: ["display_name: target retained"],
						custom: { fill: mc.fill, conflicts: mc.conflicts, fits: mc.fits },
						affected: (
							await db.query(
								"SELECT (SELECT count(*)::int FROM crm.lead WHERE tenant_id=$1 AND contact_id=$2) leads,(SELECT count(*)::int FROM crm.deal WHERE tenant_id=$1 AND contact_id=$2) deals,(SELECT count(*)::int FROM crm.task WHERE tenant_id=$1 AND contact_id=$2) tasks,(SELECT count(*)::int FROM crm.contact_identifier WHERE tenant_id=$1 AND contact_id=$2) identifiers",
								[ctx.tenant, source],
							)
						).rows[0],
					},
				};
			}
			const result = await durable(
				db,
				ctx,
				"contact.merge",
				b,
				key,
				async () => {
					if (
						s.merged_into_id ||
						t.merged_into_id ||
						s.version !== integer(b.source_version) ||
						t.version !== integer(b.target_version)
					)
						throw new Fault(409, "VERSION_CONFLICT");
					for (const table of ["lead", "deal", "task", "contact_identifier"])
						await db.query(
							`UPDATE crm.${table} SET contact_id=$3${table === "contact_identifier" ? "" : ",version=version+1"} WHERE tenant_id=$1 AND contact_id=$2`,
							[ctx.tenant, source, target],
						);
					await db.query(
						"UPDATE crm.contact SET merged_into_id=$3,version=version+1 WHERE tenant_id=$1 AND id=$2",
						[ctx.tenant, source, target],
					);
					const mc = await mergeCustom(db, ctx, source, target);
					if (!mc.fits) throw new Fault(422, "PROPERTIES_TOO_LARGE");
					if (mc.fill.length)
						await db.query(
							"UPDATE crm.contact SET version=version+1,custom=$3::jsonb,custom_search=$4 WHERE tenant_id=$1 AND id=$2",
							[ctx.tenant, target, JSON.stringify(mc.custom), mc.search],
						);
					else
						await db.query(
							"UPDATE crm.contact SET version=version+1 WHERE tenant_id=$1 AND id=$2",
							[ctx.tenant, target],
						);
					const job = randomUUID();
					await db.query(
						"INSERT INTO crm.merge_job(tenant_id,id,source_id,target_id,source_version,target_version,actor_id) VALUES($1,$2,$3,$4,$5,$6,crm.actor())",
						[ctx.tenant, job, source, target, s.version, t.version],
					);
					await evidence(
						db,
						ctx,
						"contact",
						source,
						"contact.merged",
						request,
						["merged_into_id"],
					);
					await evidence(
						db,
						ctx,
						"contact",
						target,
						"contact.merge_received",
						request,
						[
							"identifiers",
							"references",
							...mc.fill.map((k) => `custom:${k}`),
						],
					);
					return { kind: "merge", id: job };
				},
			);
			return { status: 202, data: { ...result, status: "completed" } };
		}
		if (!kind) throw new Fault(404, "NOT_FOUND");
		if (method === "GET") {
			if (object) {
				id(object);
				const r = await record(db, ctx, kind, object);
				if (sub === "journey" && kind === "contact") {
					const rows = (
						await db.query(
							"SELECT id,action,object_kind,object_id,occurred_at FROM crm.audit_log WHERE tenant_id=$1 AND ((object_kind='contact' AND object_id=$2) OR (object_kind='lead' AND object_id IN (SELECT id FROM crm.lead WHERE tenant_id=$1 AND contact_id=$2 AND crm.can_object('crm.read','lead',id,$3))) OR (transition_id IN (SELECT s.id FROM crm.stage_transition s JOIN crm.deal d ON (d.tenant_id,d.id)=(s.tenant_id,s.deal_id) WHERE d.tenant_id=$1 AND d.contact_id=$2 AND crm.can_object('crm.read','deal',d.id,$3))) OR (object_kind='deal' AND object_id IN (SELECT id FROM crm.deal WHERE tenant_id=$1 AND contact_id=$2 AND crm.can_object('crm.read','deal',id,$3))) OR (object_kind='task' AND object_id IN (SELECT id FROM crm.task WHERE tenant_id=$1 AND contact_id=$2 AND crm.can_object('crm.read','task',id,$3)))) AND ($4::uuid IS NULL OR id>$4) ORDER BY id LIMIT 51",
							[
								ctx.tenant,
								object,
								ctx.grant ?? null,
								query.get("cursor") ? id(query.get("cursor")) : null,
							],
						)
					).rows;
					return {
						data: rows
							.slice(0, 50)
							.map((r) =>
								"amount_minor" in r
									? { ...r, amount_minor: Number(r.amount_minor) }
									: r,
							),
						next_cursor: rows.length > 50 ? rows[49].id : null,
					};
				}
				if (sub === "history" && kind === "deal")
					return {
						data: (
							await db.query(
								"SELECT id,from_stage,to_stage,deal_version,reason,occurred_at,actor_id FROM crm.stage_transition WHERE tenant_id=$1 AND deal_id=$2 ORDER BY deal_version LIMIT 100",
								[ctx.tenant, object],
							)
						).rows,
					};
				if (sub === "duplicates" && kind === "contact") {
					await permit(db, ctx, "sensitive.read", kind, object);
					return {
						data: (
							await db.query(
								"SELECT DISTINCT c.id,c.display_name,c.version FROM crm.contact c JOIN crm.contact_identifier ci ON (ci.tenant_id,ci.contact_id)=(c.tenant_id,c.id) JOIN crm.contact_identifier own ON own.tenant_id=ci.tenant_id AND own.kind=ci.kind AND own.keyed_lookup_digest=ci.keyed_lookup_digest WHERE c.tenant_id=$1 AND own.contact_id=$2 AND c.id<>$2 AND c.merged_into_id IS NULL AND crm.can_object('crm.read','contact',c.id,$3) ORDER BY c.id LIMIT 50",
								[ctx.tenant, object, ctx.grant ?? null],
							)
						).rows,
					};
				}
				if (sub) throw new Fault(404, "NOT_FOUND");
				await withProperties(db, ctx, kind as Kind, r);
				return { data: r };
			}
			await permit(db, ctx, "crm.read", kind);
			return listRecords(db, ctx, kind as Kind, query);
		}
		if (
			!["POST", "PATCH"].includes(method) ||
			(method === "PATCH" && !object) ||
			(method === "POST" && !!object) ||
			sub
		)
			throw new Fault(404, "NOT_FOUND");
		if (object) id(object);
		await permit(db, ctx, "crm.write", kind, object ?? null);
		const allowed =
			kind === "contact"
				? ["display_name", "source", "owner_id", "identifiers"]
				: kind === "lead"
					? [
							"contact_id",
							"contact",
							"title",
							"source",
							"source_evidence",
							"owner_id",
							"status",
						]
					: kind === "deal"
						? [
								"contact_id",
								"lead_id",
								"pipeline_id",
								"stage_id",
								"title",
								"owner_id",
								"amount_minor",
								"currency",
							]
						: [
								"contact_id",
								"deal_id",
								"title",
								"owner_id",
								"due_at",
								"status",
								"outcome",
							];
		fields(b, [
			"command_id",
			...(object ? ["expected_version"] : []),
			...allowed,
			"properties",
		]);
		if (
			object &&
			[
				"contact_id",
				"lead_id",
				"pipeline_id",
				"stage_id",
				"contact",
				"source",
				"source_evidence",
			].some((k) => k in b)
		)
			throw new Fault(422, "FIELD_NOT_WRITABLE");
		if (b.identifiers)
			await permit(db, ctx, "sensitive.write", kind, object ?? null);
		if (
			!object &&
			(b.status !== undefined ||
				b.outcome !== undefined ||
				(kind === "lead" && b.source !== undefined && b.source !== "manual"))
		)
			throw new Fault(422, "FIELD_NOT_WRITABLE");
		const result = await durable(
			db,
			ctx,
			`${kind}.${object ?? "create"}`,
			b,
			key,
			async () => {
				if (object) {
					const old = await record(db, ctx, kind, object, "crm.write", true);
					if (old.version !== integer(b.expected_version) || old.merged_into_id)
						throw new Fault(409, "VERSION_CONFLICT");
					if (kind === "task" && "deal_id" in b) {
						if (b.deal_id === null) {
							if (!old.contact_id) throw new Fault(422, "REFERENCE_REQUIRED");
						} else {
							const target = await record(
								db,
								ctx,
								"deal",
								id(b.deal_id),
								"crm.write",
								true,
							);
							if (old.contact_id && old.contact_id !== target.contact_id)
								throw new Fault(422, "REFERENCE_MISMATCH");
						}
					}
					const values: unknown[] = [ctx.tenant, object],
						sets: string[] = [];
					for (const field of allowed) {
						if (!(field in b) || field === "identifiers") continue;
						let value: unknown = b[field];
						if (field === "owner_id") value = await assignment(db, ctx, value);
						else if (field === "deal_id")
							value = value === null ? null : id(value);
						else if (field === "due_at") value = date(value);
						else if (field === "amount_minor") value = integer(value);
						else
							value = text(
								value,
								field === "title" || field === "display_name" ? 160 : 500,
							);
						if (
							field === "status" &&
							!(
								kind === "task"
									? ["open", "completed"]
									: ["open", "qualified", "closed"]
							).includes(String(value))
						)
							throw new Fault(422, "VALIDATION_FAILED");
						if (field === "currency" && !/^[A-Z]{3}$/.test(String(value)))
							throw new Fault(422, "VALIDATION_FAILED");
						values.push(value);
						sets.push(`${field}=$${values.length}`);
					}
					if (kind === "task" && b.status)
						sets.push(
							b.status === "completed"
								? "completed_at=now()"
								: "completed_at=NULL",
						);
					// P1b B3: one validator (properties.ts) decides; the merged blob and the rebuilt search text are written with the row.
					const props = await prepareCustom(
						db,
						ctx,
						kind as Kind,
						object,
						b.properties,
					);
					if (props) {
						values.push(props.custom, props.search);
						sets.push(
							`custom=$${values.length - 1}::jsonb`,
							`custom_search=$${values.length}`,
						);
					}
					sets.push("version=version+1");
					await db.query(
						`UPDATE crm.${kind} SET ${sets.join(",")} WHERE tenant_id=$1 AND id=$2`,
						values,
					);
					if (kind === "contact")
						await identifiers(db, ctx, object, b.identifiers);
					await evidence(
						db,
						ctx,
						kind,
						object,
						`${kind}.updated`,
						request,
						[
							...Object.keys(b).filter(
								(k) =>
									!["command_id", "expected_version", "properties"].includes(k),
							),
							...(props?.changed.map((k) => `custom:${k}`) ?? []),
						],
					);
					return { kind, id: object };
				}
				if (kind === "contact")
					return { kind, id: await contactCreate(db, ctx, b, request) };
				const objectId = randomUUID(),
					owner = await assignment(db, ctx, b.owner_id);
				let contact = b.contact_id ? id(b.contact_id) : null;
				if (kind === "lead" && b.contact) {
					if (contact) throw new Fault(422, "VALIDATION_FAILED");
					if (typeof b.contact !== "object" || Array.isArray(b.contact))
						throw new Fault(422, "VALIDATION_FAILED");
					fields(b.contact as Body, [
						"display_name",
						"identifiers",
						"source",
						"properties",
					]);
					contact = await contactCreate(
						db,
						ctx,
						{ ...(b.contact as Body), owner_id: owner },
						request,
					);
				}
				if (contact) {
					const c = await record(
						db,
						ctx,
						"contact",
						contact,
						"crm.write",
						true,
					);
					if (c.merged_into_id) throw new Fault(409, "CONTACT_MERGED");
				}
				if (kind !== "task" && !contact)
					throw new Fault(422, "VALIDATION_FAILED");
				const props = await prepareCustom(
					db,
					ctx,
					kind as Kind,
					null,
					b.properties,
				);
				const cv = [props?.custom ?? "{}", props?.search ?? ""];
				if (kind === "lead")
					await db.query(
						"INSERT INTO crm.lead(tenant_id,id,contact_id,owner_id,title,source,source_evidence,custom,custom_search) VALUES($1,$2,$3,$4,$5,'manual',$6,$7::jsonb,$8)",
						[
							ctx.tenant,
							objectId,
							contact,
							owner,
							text(b.title, 160),
							text(b.source_evidence, 500),
							...cv,
						],
					);
				if (kind === "deal") {
					const pipeline = id(b.pipeline_id),
						stage = id(b.stage_id),
						lead = b.lead_id ? id(b.lead_id) : null;
					if (lead) {
						const l = await record(db, ctx, "lead", lead, "crm.write");
						if (l.contact_id !== contact)
							throw new Fault(422, "REFERENCE_MISMATCH");
					}
					if (
						!(
							await db.query(
								"SELECT 1 FROM crm.stage WHERE tenant_id=$1 AND id=$2 AND pipeline_id=$3 AND NOT archived AND outcome IS NULL",
								[ctx.tenant, stage, pipeline],
							)
						).rowCount
					)
						throw new Fault(422, "INVALID_STAGE");
					const currency = text(b.currency ?? "EGP", 3);
					if (!/^[A-Z]{3}$/.test(currency))
						throw new Fault(422, "VALIDATION_FAILED");
					await db.query(
						"INSERT INTO crm.deal(tenant_id,id,contact_id,owner_id,title,lead_id,pipeline_id,stage_id,amount_minor,currency,custom,custom_search) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12)",
						[
							ctx.tenant,
							objectId,
							contact,
							owner,
							text(b.title, 160),
							lead,
							pipeline,
							stage,
							integer(b.amount_minor ?? 0),
							currency,
							...cv,
						],
					);
				}
				if (kind === "task") {
					const deal = b.deal_id ? id(b.deal_id) : null;
					if (!deal && !contact) throw new Fault(422, "VALIDATION_FAILED");
					if (deal) {
						const d = await record(db, ctx, "deal", deal, "crm.write");
						if (contact && d.contact_id !== contact)
							throw new Fault(422, "REFERENCE_MISMATCH");
						contact = d.contact_id;
					}
					await db.query(
						"INSERT INTO crm.task(tenant_id,id,contact_id,deal_id,owner_id,title,due_at,custom,custom_search) VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9)",
						[
							ctx.tenant,
							objectId,
							contact,
							deal,
							owner,
							text(b.title, 160),
							date(b.due_at),
							...cv,
						],
					);
				}
				await evidence(
					db,
					ctx,
					kind,
					objectId,
					`${kind}.created`,
					request,
					[
						...Object.keys(b).filter(
							(k) => !["command_id", "properties"].includes(k),
						),
						...(props?.changed.map((k) => `custom:${k}`) ?? []),
					],
				);
				return { kind, id: objectId };
			},
		);
		// Re-authorize and field-filter durable replay under the current policy.
		if (kind === "task" && object && "deal_id" in b && b.deal_id !== null)
			await record(db, ctx, "deal", id(b.deal_id), "crm.write");
		await record(db, ctx, kind, result.id, "crm.write");
		const written = await record(db, ctx, kind, result.id);
		await withProperties(db, ctx, kind as Kind, written);
		return {
			status: object ? 200 : 201,
			data: { ...written, replayed: result.replayed },
		};
	});
}
