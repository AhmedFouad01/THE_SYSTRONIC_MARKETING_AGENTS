// ADR-002 P1b B2 (S6): the schema (registry) API under /v1/schema. Kept out of crm.ts on purpose; crm.ts only exports `durable`.
// Authority: reads need `schema.read`, every write needs `property.manage` (manager + MFA, enforced by crm.can_object). Agency
// grants and the worker have neither. All statements run as crm_runtime under RLS (tenant_boundary), so a tenant can never see or
// touch another tenant's registry; archive only (no DELETE grant exists). Validation lives in schemarules.ts (one place).
import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import type pg from "pg";
import { durable, evidence, permit, type Body } from "./crm.js";
import { type Context, Fault, transaction } from "./db.js";
import { rebuildInline, requestSearchRebuild } from "./searchrebuild.js";
import type { Kind } from "./query.js";
import {
	KEY_RE,
	LIMITS,
	OPTION_COLORS,
	OPTION_VALUE_RE,
	TYPES,
	TYPE_NAMES,
	expectedVersion,
	validateGroup,
	validateOptionWrite,
	validateOrder,
	validateProperty,
	type PropType,
} from "./schemarules.js";

type Db = pg.PoolClient;
type Row = Record<string, unknown>;
type Done = { kind: "property" | "property_group"; id: string };

export const isSchema = (p: string) =>
	p === "/v1/schema" || p.startsWith("/v1/schema/");

// ---- routing ---------------------------------------------------------------------------------------------------------
type Op =
	| "objects"
	| "get"
	| "property.get"
	| "group.create"
	| "group.update"
	| "group.archive"
	| "group.order"
	| "property.create"
	| "property.update"
	| "property.archive"
	| "property.order"
	| "option.create"
	| "option.update"
	| "option.order";
function route(method: string, s: string[]): Op | null {
	const [obj, sec, k, sub, v] = s;
	const key = (x?: string) => !!x && KEY_RE.test(x);
	if (!s.length) return method === "GET" ? "objects" : null;
	if (!key(obj)) return null;
	if (s.length === 1) return method === "GET" ? "get" : null;
	if (sec === "groups") {
		if (s.length === 2 && method === "POST") return "group.create";
		if (s.length === 3 && k === "order" && method === "POST")
			return "group.order";
		if (s.length === 3 && key(k) && method === "PATCH") return "group.update";
		if (s.length === 4 && key(k) && sub === "archive" && method === "POST")
			return "group.archive";
	}
	if (sec === "properties") {
		if (s.length === 2 && method === "POST") return "property.create";
		if (s.length === 3) {
			if (k === "order" && method === "POST") return "property.order";
			if (key(k) && method === "GET") return "property.get";
			if (key(k) && method === "PATCH") return "property.update";
		}
		if (s.length === 4 && key(k)) {
			if (sub === "archive" && method === "POST") return "property.archive";
			if (sub === "options" && method === "POST") return "option.create";
		}
		if (s.length === 5 && key(k) && sub === "options") {
			if (v === "order" && method === "POST") return "option.order";
			if (method === "PATCH" && OPTION_VALUE_RE.test(v)) return "option.update";
		}
	}
	return null;
}

export async function schemaRequest(
	ctx: Context,
	method: string,
	path: string,
	query: URLSearchParams,
	b: Body,
	key: string,
	request: string,
) {
	const segs = path.split("/").filter(Boolean).slice(2);
	const op = route(method, segs);
	if (!op) throw new Fault(404, "NOT_FOUND");
	return transaction(ctx, async (db) => {
		const read = op === "objects" || op === "get" || op === "property.get";
		await permit(db, ctx, read ? "schema.read" : "property.manage", "property");
		const [object, , k1, , k2] = segs;
		if (op === "objects") return { data: await objects(db, ctx) };
		if (op === "get" || op === "property.get") {
			const flag = (name: string) => {
				const v = query.get(name);
				if (v === null || v === "0" || v === "false") return false;
				if (v === "1" || v === "true") return true;
				throw new Fault(422, "VALIDATION_FAILED", [
					{ field: name, code: "BOOLEAN_REQUIRED" },
				]);
			};
			const archived = flag("include_archived");
			const optionsParam = query.get("options");
			if (optionsParam !== null && !["all", "none"].includes(optionsParam))
				throw new Fault(422, "VALIDATION_FAILED", [
					{ field: "options", code: "VALUE_INVALID" },
				]);
			const {
				rows: [s],
			} = await db.query(
				"SELECT crm.can_object('sensitive.read','contact',NULL,$1) ok",
				[ctx.grant ?? null],
			);
			const data = await readObject(db, ctx, object, {
				archived,
				options: op === "property.get" || optionsParam !== "none",
				sensitive: s.ok === true,
				key: op === "property.get" ? k1 : null,
			});
			if (op === "property.get") {
				const property = (data.properties as Row[])[0];
				if (!property) throw new Fault(404, "NOT_FOUND");
				return {
					data: { object, schema_rev: data.schema_rev, property },
				};
			}
			return { data };
		}
		// ---- mutations: Idempotency-Key is enforced by api.ts; command_id is validated by durable() ----
		const target = `${method} ${path}`;
		const run = (fn: () => Promise<Done>) =>
			durable(db, ctx, `schema.${op}`, { ...b, _target: target }, key, () =>
				guarded(fn),
			);
		const reply = async (r: Done & { replayed: boolean }, entity: string, status = 200) => {
			const data: Row = {
				object,
				schema_rev: await rev(db, ctx, object),
				replayed: r.replayed,
			};
			if (entity === "property") data.property = await readOne(db, ctx, object, r.id);
			else if (entity === "group") data.group = await readGroup(db, ctx, object, r.id);
			else if (entity === "properties")
				data.properties = (
					await db.query(
						"SELECT key,position,version FROM crm.property_definition WHERE tenant_id=$1 AND object_type=$2 AND archived_at IS NULL ORDER BY position,key",
						[ctx.tenant, object],
					)
				).rows;
			else if (entity === "groups")
				data.groups = (
					await db.query(
						"SELECT key,position,version FROM crm.property_group WHERE tenant_id=$1 AND object_type=$2 AND NOT archived ORDER BY position,key",
						[ctx.tenant, object],
					)
				).rows;
			return { status, data };
		};
		switch (op) {
			case "property.create": {
				const w = validateProperty(b, "create");
				const r = await run(() => createProperty(db, ctx, request, object, w));
				return reply(r, "property", r.replayed ? 200 : 201);
			}
			case "property.update": {
				validateProperty(b, "update");
				const expected = expectedVersion(b, "expected_version") as number;
				const r = await run(() =>
					updateProperty(db, ctx, request, object, k1, expected, b),
				);
				return reply(r, "property");
			}
			case "property.archive": {
				strictOnly(b, ["command_id", "expected_version"]);
				const expected = expectedVersion(b, "expected_version") as number;
				const r = await run(() =>
					archiveProperty(db, ctx, request, object, k1, expected),
				);
				return reply(r, "property");
			}
			case "property.order": {
				const o = validateOrder(b, "keys", "expected_schema_rev");
				const r = await run(() =>
					orderProperties(db, ctx, request, object, o.list, o.guard),
				);
				return reply(r, "properties");
			}
			case "option.create": {
				const o = validateOptionWrite(b, "create");
				const expected = expectedVersion(b, "expected_version") as number;
				const r = await run(() =>
					createOption(db, ctx, request, object, k1, expected, o),
				);
				return reply(r, "property", r.replayed ? 200 : 201);
			}
			case "option.update": {
				validateOptionWrite(b, "update");
				const expected = expectedVersion(b, "expected_version") as number;
				const r = await run(() =>
					updateOption(db, ctx, request, object, k1, k2, expected, b),
				);
				return reply(r, "property");
			}
			case "option.order": {
				const o = validateOrder(b, "values", "expected_version");
				const r = await run(() =>
					orderOptions(db, ctx, request, object, k1, o.list, o.guard),
				);
				return reply(r, "property");
			}
			case "group.create": {
				const w = validateGroup(b, "create");
				const r = await run(() => createGroup(db, ctx, request, object, w));
				return reply(r, "group", r.replayed ? 200 : 201);
			}
			case "group.update": {
				const w = validateGroup(b, "update");
				const expected = expectedVersion(b, "expected_version") as number;
				const r = await run(() =>
					updateGroup(db, ctx, request, object, k1, expected, w),
				);
				return reply(r, "group");
			}
			case "group.archive": {
				strictOnly(b, ["command_id", "expected_version"]);
				const expected = expectedVersion(b, "expected_version") as number;
				const r = await run(() =>
					archiveGroup(db, ctx, request, object, k1, expected),
				);
				return reply(r, "group");
			}
			case "group.order": {
				const o = validateOrder(b, "keys", "expected_schema_rev");
				const r = await run(() =>
					orderGroups(db, ctx, request, object, o.list, o.guard),
				);
				return reply(r, "groups");
			}
		}
		throw new Fault(404, "NOT_FOUND");
	});
}

function strictOnly(b: Body, allowed: string[]) {
	const bad = Object.keys(b).filter((k) => !allowed.includes(k));
	if (bad.length)
		throw new Fault(
			422,
			"FIELD_NOT_WRITABLE",
			bad.map((field) => ({ field, code: "UNKNOWN" })),
		);
}
// Maps the 010 limit triggers / unique indexes to stable API codes (the pre-checks below normally answer first).
async function guarded<T>(fn: () => Promise<T>): Promise<T> {
	try {
		return await fn();
	} catch (e) {
		const x = e as { code?: string; message?: string; table?: string };
		if (x.code === "23514" && /^(PROPERTY|OPTION)_LIMIT_EXCEEDED$/.test(x.message ?? ""))
			throw new Fault(422, x.message as string);
		if (x.code === "23505")
			throw new Fault(409, x.table === "property_option" ? "OPTION_EXISTS" : "KEY_EXISTS");
		throw e;
	}
}

// ---- reads (ONE statement => one snapshot: schema_rev always matches the content returned) -----------------------------
async function objects(db: Db, ctx: Context) {
	return (
		await db.query(
			"SELECT key,kind,label,schema_rev FROM crm.object_type WHERE tenant_id=$1 AND NOT archived ORDER BY key",
			[ctx.tenant],
		)
	).rows;
}
async function readObject(
	db: Db,
	ctx: Context,
	object: string,
	o: { archived: boolean; options: boolean; sensitive: boolean; key: string | null;
	},
): Promise<Row> {
	const {
		rows: [r],
	} = await db.query(
		`SELECT o.key,o.kind,o.label,o.schema_rev,
 coalesce((SELECT jsonb_agg(jsonb_build_object('key',g.key,'label',g.label,'label_key',CASE WHEN g.key='general' AND (g.label#>>'{}') IN (g.label_legacy->>'en',g.label_legacy->>'ar') THEN 'props.system.general' END,'position',g.position,'version',g.version,'archived',g.archived) ORDER BY g.position,g.key)
  FROM crm.property_group g WHERE g.tenant_id=o.tenant_id AND g.object_type=o.key AND ($3::boolean OR NOT g.archived)),'[]'::jsonb) groups,
 coalesce((SELECT jsonb_agg(jsonb_build_object(
   'key',d.key,'label',d.label,'label_key',CASE WHEN d.is_system AND (d.label#>>'{}') IN (d.label_legacy->>'en',d.label_legacy->>'ar') THEN 'props.system.'||d.key END,'description',d.description,'type',d.type,'display',d.display,'group',g.key,'position',d.position,
   'storage',d.storage,'is_system',d.is_system,'required',d.required,'read_only',d.read_only,'sensitive',d.sensitive,
   'searchable',d.searchable,'indexed',d.indexed,'show_default',d.show_default,'validation',d.validation,'currency',d.currency,
   'version',d.version,'archived',d.archived_at IS NOT NULL,
   'option_count',(SELECT count(*) FROM crm.property_option c WHERE c.tenant_id=d.tenant_id AND c.property_id=d.id AND NOT c.archived),
   'options',CASE WHEN $4::boolean THEN (SELECT coalesce(jsonb_agg(jsonb_build_object('value',p.value,'label',p.label,'color',p.color,'position',p.position,'archived',p.archived) ORDER BY p.position,p.value),'[]'::jsonb)
     FROM crm.property_option p WHERE p.tenant_id=d.tenant_id AND p.property_id=d.id) END) ORDER BY d.position,d.key)
  FROM crm.property_definition d LEFT JOIN crm.property_group g ON (g.tenant_id,g.id)=(d.tenant_id,d.group_id)
  WHERE d.tenant_id=o.tenant_id AND d.object_type=o.key AND ($3::boolean OR d.archived_at IS NULL) AND ($5::boolean OR NOT d.sensitive) AND ($6::text IS NULL OR d.key=$6)),'[]'::jsonb) properties
 FROM crm.object_type o WHERE o.tenant_id=$1 AND o.key=$2 AND NOT o.archived`,
		[ctx.tenant, object, o.archived, o.options, o.sensitive, o.key],
	);
	if (!r) throw new Fault(404, "NOT_FOUND");
	if (!o.options) for (const p of r.properties) delete p.options;
	return {
		object: r.key,
		kind: r.kind,
		label: r.label,
		schema_rev: r.schema_rev,
		limits: {
			properties: LIMITS.properties,
			options: LIMITS.options,
			groups: LIMITS.groups,
		},
		types: TYPE_NAMES.map((type) => ({ type, ...TYPES[type] })),
		option_colors: [...OPTION_COLORS],
		groups: r.groups,
		properties: r.properties,
	};
}
async function rev(db: Db, ctx: Context, object: string) {
	const {
		rows: [r],
	} = await db.query(
		"SELECT schema_rev FROM crm.object_type WHERE tenant_id=$1 AND key=$2",
		[ctx.tenant, object],
	);
	return r.schema_rev as number;
}
// Reads back one property/group by internal id after a write (the caller holds property.manage, so sensitive rows are visible).
async function readOne(db: Db, ctx: Context, object: string, id: string) {
	const {
		rows: [d],
	} = await db.query(
		"SELECT key FROM crm.property_definition WHERE tenant_id=$1 AND object_type=$2 AND id=$3",
		[ctx.tenant, object, id],
	);
	const data = await readObject(db, ctx, object, {
		archived: true,
		options: true,
		sensitive: true,
		key: d.key,
	});
	return (data.properties as Row[])[0];
}
async function readGroup(db: Db, ctx: Context, object: string, id: string) {
	const {
		rows: [g],
	} = await db.query(
		"SELECT key,label,position,version,archived FROM crm.property_group WHERE tenant_id=$1 AND object_type=$2 AND id=$3",
		[ctx.tenant, object, id],
	);
	return g;
}

// ---- write helpers ---------------------------------------------------------------------------------------------------------
const j = (v: unknown) => JSON.stringify(v);
// Serialises every registry write per object (and so `schema_rev` increments are gap-free and ordered).
async function lockObject(db: Db, ctx: Context, object: string) {
	const { rowCount } = await db.query(
		"SELECT 1 FROM crm.object_type WHERE tenant_id=$1 AND key=$2 AND NOT archived FOR UPDATE",
		[ctx.tenant, object],
	);
	if (!rowCount) throw new Fault(404, "NOT_FOUND");
}
async function bump(db: Db, ctx: Context, object: string) {
	await db.query(
		"UPDATE crm.object_type SET schema_rev=schema_rev+1,version=version+1 WHERE tenant_id=$1 AND key=$2",
		[ctx.tenant, object],
	);
}
async function groupId(db: Db, ctx: Context, object: string, key: string) {
	const {
		rows: [g],
	} = await db.query(
		"SELECT id FROM crm.property_group WHERE tenant_id=$1 AND object_type=$2 AND key=$3 AND NOT archived",
		[ctx.tenant, object, key],
	);
	if (!g)
		throw new Fault(422, "VALIDATION_FAILED", [
			{ field: "group", code: "GROUP_NOT_FOUND" },
		]);
	return g.id as string;
}
const conflict = (row: { version: number }, expected: number) => {
	if (row.version !== expected) throw new Fault(409, "VERSION_CONFLICT");
};
async function loadProperty(
	db: Db,
	ctx: Context,
	object: string,
	key: string,
	expected: number,
) {
	await lockObject(db, ctx, object);
	const {
		rows: [p],
	} = await db.query(
		`SELECT d.*,g.key group_key FROM crm.property_definition d LEFT JOIN crm.property_group g ON (g.tenant_id,g.id)=(d.tenant_id,d.group_id)
		 WHERE d.tenant_id=$1 AND d.object_type=$2 AND d.key=$3 FOR UPDATE OF d`,
		[ctx.tenant, object, key],
	);
	if (!p) throw new Fault(404, "NOT_FOUND");
	conflict(p, expected);
	if (p.archived_at) throw new Fault(409, "PROPERTY_ARCHIVED");
	return p;
}
const immutable = (field: string) =>
	new Fault(422, "SYSTEM_PROPERTY_IMMUTABLE", [
		{ field, code: "SYSTEM_PROPERTY_IMMUTABLE" },
	]);

// ---- properties -------------------------------------------------------------------------------------------------------------
async function createProperty(
	db: Db,
	ctx: Context,
	request: string,
	object: string,
	w: ReturnType<typeof validateProperty>,
): Promise<Done> {
	await lockObject(db, ctx, object);
	const group = await groupId(db, ctx, object, w.group ?? "general");
	const {
		rows: [x],
	} = await db.query(
		`SELECT count(*) FILTER (WHERE NOT is_system AND archived_at IS NULL)::int active, coalesce(max(position),0)::int top,
		 count(*) FILTER (WHERE key=$3)::int dup FROM crm.property_definition WHERE tenant_id=$1 AND object_type=$2`,
		[ctx.tenant, object, w.key],
	);
	if (x.dup) throw new Fault(409, "KEY_EXISTS");
	if (x.active >= LIMITS.properties)
		throw new Fault(422, "PROPERTY_LIMIT_EXCEEDED");
	const id = randomUUID();
	await db.query(
		`INSERT INTO crm.property_definition(tenant_id,id,object_type,key,type,display,label,description,group_id,position,required,read_only,sensitive,searchable,show_default,validation,currency)
		 VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10,$11,$12,$13,$14,$15,$16::jsonb,$17)`,
		[
			ctx.tenant,
			id,
			object,
			w.key,
			w.type,
			w.display ?? "default",
			j(w.label),
			w.description ? j(w.description) : null,
			group,
			w.position ?? Math.min(x.top + 10, LIMITS.position),
			w.required ?? false,
			w.read_only ?? false,
			w.sensitive ?? false,
			w.searchable ?? false,
			w.show_default ?? false,
			j(w.validation ?? {}),
			w.currency ?? null,
		],
	);
	for (const o of w.options ?? [])
		await db.query(
			"INSERT INTO crm.property_option(tenant_id,property_id,value,label,color,position) VALUES($1,$2,$3,$4::jsonb,$5,$6)",
			[ctx.tenant, id, o.value, j(o.label), o.color, o.position],
		);
	await bump(db, ctx, object);
	await evidence(db, ctx, "property", id, "property.created", request, [
		"key",
		"type",
		...Object.keys(w).filter(
			(k) =>
				k !== "key" &&
				k !== "type" &&
				w[k as keyof typeof w] !== undefined &&
				w[k as keyof typeof w] !== null,
		),
	]);
	return { kind: "property", id };
}

async function updateProperty(
	db: Db,
	ctx: Context,
	request: string,
	object: string,
	key: string,
	expected: number,
	input: Body,
): Promise<Done> {
	const p = await loadProperty(db, ctx, object, key, expected);
	const w = validateProperty(input, "update", {
		type: p.type as PropType,
		is_system: p.is_system,
		required: p.required,
		read_only: p.read_only,
		sensitive: p.sensitive,
		searchable: p.searchable,
		show_default: p.show_default,
		display: p.display,
	});
	const cols: [string, unknown, string?][] = [];
	const changed: string[] = [];
	const diff = (name: string, col: string, next: unknown, cur: unknown, cast = "") => {
		if (next === undefined || isDeepStrictEqual(next, cur)) return;
		cols.push([col, next, cast]);
		changed.push(name);
	};
	diff("label", "label", w.label, p.label, "::jsonb");
	diff("description", "description", w.description, p.description, "::jsonb");
	diff("position", "position", w.position, p.position);
	diff("display", "display", w.display, p.display);
	for (const f of ["required", "read_only", "sensitive", "searchable", "show_default"] as const)
		diff(f, f, w[f], p[f]);
	diff("validation", "validation", w.validation, p.validation, "::jsonb");
	if (w.group !== undefined && w.group !== p.group_key) {
		cols.push(["group_id", await groupId(db, ctx, object, w.group)]);
		changed.push("group");
	}
	if (!changed.length) return { kind: "property", id: p.id }; // no-op: no version bump, no schema_rev bump, no evidence
	await db.query(
		`UPDATE crm.property_definition SET ${cols.map(([c, , cast], i) => `${c}=$${i + 3}${cast ?? ""}`).join(",")},version=version+1 WHERE tenant_id=$1 AND id=$2`,
		[
			ctx.tenant,
			p.id,
			...cols.map(([, v, cast]) => (cast && v !== null ? j(v) : v)),
		],
	);
	await bump(db, ctx, object);
	await evidence(db, ctx, "property", p.id, "property.updated", request, changed);
	// B4: a searchable/sensitive flip changes which values belong in custom_search of every existing row
	if (changed.includes("searchable") || changed.includes("sensitive"))
		await rebuildSearch(db, ctx, object);
	return { kind: "property", id: p.id };
}
// Queue + capped inline pass (the worker drains the rest). Only the four record objects have a custom_search column.
async function rebuildSearch(db: Db, ctx: Context, object: string) {
	if (!["contact", "lead", "deal", "task"].includes(object)) return;
	await requestSearchRebuild(db, ctx, object as Kind);
	await rebuildInline(db, ctx, object as Kind);
}

async function archiveProperty(
	db: Db,
	ctx: Context,
	request: string,
	object: string,
	key: string,
	expected: number,
): Promise<Done> {
	const p = await loadProperty(db, ctx, object, key, expected);
	if (p.is_system) throw immutable("archived");
	await db.query(
		"UPDATE crm.property_definition SET archived_at=now(),version=version+1 WHERE tenant_id=$1 AND id=$2",
		[ctx.tenant, p.id],
	);
	await bump(db, ctx, object);
	await evidence(db, ctx, "property", p.id, "property.archived", request, [
		"archived_at",
	]);
	if (p.searchable) await rebuildSearch(db, ctx, object);
	return { kind: "property", id: p.id };
}

async function orderProperties(
	db: Db,
	ctx: Context,
	request: string,
	object: string,
	keys: string[],
	expectedRev: number,
): Promise<Done> {
	await lockObject(db, ctx, object);
	if ((await rev(db, ctx, object)) !== expectedRev)
		throw new Fault(409, "VERSION_CONFLICT");
	const { rows } = await db.query(
		"SELECT id,key,position FROM crm.property_definition WHERE tenant_id=$1 AND object_type=$2 AND archived_at IS NULL ORDER BY position,key FOR UPDATE",
		[ctx.tenant, object],
	);
	const byKey = new Map(rows.map((r) => [r.key as string, r]));
	if (rows.length !== keys.length || keys.some((k) => !byKey.has(k)))
		throw new Fault(422, "VALIDATION_FAILED", [
			{ field: "keys", code: "REORDER_SET_MISMATCH" },
		]);
	let moved = 0;
	for (const [i, k] of keys.entries()) {
		const r = byKey.get(k) as Row;
		if (r.position === (i + 1) * 10) continue;
		await db.query(
			"UPDATE crm.property_definition SET position=$3,version=version+1 WHERE tenant_id=$1 AND id=$2",
			[ctx.tenant, r.id, (i + 1) * 10],
		);
		await evidence(db, ctx, "property", r.id as string, "property.updated", request, ["position"]);
		moved++;
	}
	if (moved) await bump(db, ctx, object);
	return { kind: "property", id: (byKey.get(keys[0]) as Row).id as string };
}

// ---- options (all option changes bump the PROPERTY's version: that is the optimistic-concurrency token) --------------------------
async function selectProperty(
	db: Db,
	ctx: Context,
	object: string,
	key: string,
	expected: number,
) {
	const p = await loadProperty(db, ctx, object, key, expected);
	if (!TYPES[p.type as PropType].options)
		throw new Fault(422, "VALIDATION_FAILED", [
			{ field: "property", code: "OPTIONS_NOT_ALLOWED" },
		]);
	return p;
}
async function touchProperty(
	db: Db,
	ctx: Context,
	request: string,
	object: string,
	p: Row,
	changed: string[],
) {
	await db.query(
		"UPDATE crm.property_definition SET version=version+1 WHERE tenant_id=$1 AND id=$2",
		[ctx.tenant, p.id],
	);
	await bump(db, ctx, object);
	await evidence(db, ctx, "property", p.id as string, "property.updated", request, changed);
}
async function createOption(
	db: Db,
	ctx: Context,
	request: string,
	object: string,
	key: string,
	expected: number,
	o: ReturnType<typeof validateOptionWrite>,
): Promise<Done> {
	const p = await selectProperty(db, ctx, object, key, expected);
	if (p.is_system) throw immutable("option");
	const {
		rows: [x],
	} = await db.query(
		`SELECT count(*) FILTER (WHERE NOT archived)::int active, coalesce(max(position),0)::int top, count(*) FILTER (WHERE value=$3)::int dup
		 FROM crm.property_option WHERE tenant_id=$1 AND property_id=$2`,
		[ctx.tenant, p.id, o.value],
	);
	if (x.dup) throw new Fault(409, "OPTION_EXISTS");
	if (x.active >= LIMITS.options) throw new Fault(422, "OPTION_LIMIT_EXCEEDED");
	await db.query(
		"INSERT INTO crm.property_option(tenant_id,property_id,value,label,color,position) VALUES($1,$2,$3,$4::jsonb,$5,$6)",
		[
			ctx.tenant,
			p.id,
			o.value,
			j(o.label),
			o.color ?? null,
			o.position ?? Math.min(x.top + 10, LIMITS.position),
		],
	);
	await touchProperty(db, ctx, request, object, p, [`option:${o.value}`]);
	return { kind: "property", id: p.id as string };
}
async function updateOption(
	db: Db,
	ctx: Context,
	request: string,
	object: string,
	key: string,
	value: string,
	expected: number,
	input: Body,
): Promise<Done> {
	const p = await selectProperty(db, ctx, object, key, expected);
	const w = validateOptionWrite(input, "update", p.is_system === true);
	const {
		rows: [cur],
	} = await db.query(
		"SELECT * FROM crm.property_option WHERE tenant_id=$1 AND property_id=$2 AND value=$3 FOR UPDATE",
		[ctx.tenant, p.id, value],
	);
	if (!cur) throw new Fault(404, "NOT_FOUND");
	const cols: [string, unknown, string][] = [];
	if (w.label !== undefined && !isDeepStrictEqual(w.label, cur.label))
		cols.push(["label", j(w.label), "::jsonb"]);
	if (w.color !== undefined && w.color !== cur.color)
		cols.push(["color", w.color, ""]);
	if (w.position !== undefined && w.position !== cur.position)
		cols.push(["position", w.position, ""]);
	if (w.archived !== undefined && w.archived !== cur.archived)
		cols.push(["archived", w.archived, ""]);
	if (!cols.length) return { kind: "property", id: p.id as string };
	await db.query(
		`UPDATE crm.property_option SET ${cols.map(([c, , cast], i) => `${c}=$${i + 4}${cast}`).join(",")} WHERE tenant_id=$1 AND property_id=$2 AND value=$3`,
		[ctx.tenant, p.id, value, ...cols.map(([, v]) => v)],
	);
	await touchProperty(db, ctx, request, object, p, [`option:${value}`]);
	return { kind: "property", id: p.id as string };
}
async function orderOptions(
	db: Db,
	ctx: Context,
	request: string,
	object: string,
	key: string,
	values: string[],
	expected: number,
): Promise<Done> {
	const p = await selectProperty(db, ctx, object, key, expected);
	const { rows } = await db.query(
		"SELECT value,position FROM crm.property_option WHERE tenant_id=$1 AND property_id=$2 AND NOT archived ORDER BY position,value FOR UPDATE",
		[ctx.tenant, p.id],
	);
	const byValue = new Map(rows.map((r) => [r.value as string, r]));
	if (rows.length !== values.length || values.some((v) => !byValue.has(v)))
		throw new Fault(422, "VALIDATION_FAILED", [
			{ field: "values", code: "REORDER_SET_MISMATCH" },
		]);
	let moved = 0;
	for (const [i, v] of values.entries()) {
		if ((byValue.get(v) as Row).position === (i + 1) * 10) continue;
		await db.query(
			"UPDATE crm.property_option SET position=$4 WHERE tenant_id=$1 AND property_id=$2 AND value=$3",
			[ctx.tenant, p.id, v, (i + 1) * 10],
		);
		moved++;
	}
	if (moved) await touchProperty(db, ctx, request, object, p, ["option_order"]);
	return { kind: "property", id: p.id as string };
}

// ---- groups -----------------------------------------------------------------------------------------------------------------------
async function loadGroup(
	db: Db,
	ctx: Context,
	object: string,
	key: string,
	expected: number,
) {
	await lockObject(db, ctx, object);
	const {
		rows: [g],
	} = await db.query(
		"SELECT * FROM crm.property_group WHERE tenant_id=$1 AND object_type=$2 AND key=$3 FOR UPDATE",
		[ctx.tenant, object, key],
	);
	if (!g) throw new Fault(404, "NOT_FOUND");
	conflict(g, expected);
	if (g.archived) throw new Fault(409, "GROUP_ARCHIVED");
	return g;
}
async function createGroup(
	db: Db,
	ctx: Context,
	request: string,
	object: string,
	w: ReturnType<typeof validateGroup>,
): Promise<Done> {
	await lockObject(db, ctx, object);
	const {
		rows: [x],
	} = await db.query(
		`SELECT count(*) FILTER (WHERE NOT archived)::int active, coalesce(max(position),0)::int top, count(*) FILTER (WHERE key=$3)::int dup
		 FROM crm.property_group WHERE tenant_id=$1 AND object_type=$2`,
		[ctx.tenant, object, w.key],
	);
	if (x.dup) throw new Fault(409, "KEY_EXISTS");
	if (x.active >= LIMITS.groups) throw new Fault(422, "GROUP_LIMIT_EXCEEDED");
	const id = randomUUID();
	await db.query(
		"INSERT INTO crm.property_group(tenant_id,id,object_type,key,label,position) VALUES($1,$2,$3,$4,$5::jsonb,$6)",
		[ctx.tenant, id, object, w.key, j(w.label), w.position ?? Math.min(x.top + 10, LIMITS.position)],
	);
	await bump(db, ctx, object);
	await evidence(db, ctx, "property_group", id, "property_group.created", request, [
		"key",
		"label",
		...(w.position !== undefined ? ["position"] : []),
	]);
	return { kind: "property_group", id };
}
async function updateGroup(
	db: Db,
	ctx: Context,
	request: string,
	object: string,
	key: string,
	expected: number,
	w: ReturnType<typeof validateGroup>,
): Promise<Done> {
	const g = await loadGroup(db, ctx, object, key, expected);
	const cols: [string, unknown, string][] = [];
	const changed: string[] = [];
	if (w.label !== undefined && !isDeepStrictEqual(w.label, g.label)) {
		cols.push(["label", j(w.label), "::jsonb"]);
		changed.push("label");
	}
	if (w.position !== undefined && w.position !== g.position) {
		cols.push(["position", w.position, ""]);
		changed.push("position");
	}
	if (!changed.length) return { kind: "property_group", id: g.id };
	await db.query(
		`UPDATE crm.property_group SET ${cols.map(([c, , cast], i) => `${c}=$${i + 3}${cast}`).join(",")},version=version+1 WHERE tenant_id=$1 AND id=$2`,
		[ctx.tenant, g.id, ...cols.map(([, v]) => v)],
	);
	await bump(db, ctx, object);
	await evidence(db, ctx, "property_group", g.id, "property_group.updated", request, changed);
	return { kind: "property_group", id: g.id };
}
async function archiveGroup(
	db: Db,
	ctx: Context,
	request: string,
	object: string,
	key: string,
	expected: number,
): Promise<Done> {
	const g = await loadGroup(db, ctx, object, key, expected);
	const {
		rows: [x],
	} = await db.query(
		"SELECT count(*)::int n FROM crm.property_definition WHERE tenant_id=$1 AND group_id=$2 AND archived_at IS NULL",
		[ctx.tenant, g.id],
	);
	// A group that still holds active properties (the seeded 'general' group always does: system properties) cannot be archived.
	if (x.n) throw new Fault(409, "GROUP_NOT_EMPTY");
	await db.query(
		"UPDATE crm.property_group SET archived=true,version=version+1 WHERE tenant_id=$1 AND id=$2",
		[ctx.tenant, g.id],
	);
	await bump(db, ctx, object);
	await evidence(db, ctx, "property_group", g.id, "property_group.archived", request, ["archived"]);
	return { kind: "property_group", id: g.id };
}
async function orderGroups(
	db: Db,
	ctx: Context,
	request: string,
	object: string,
	keys: string[],
	expectedRev: number,
): Promise<Done> {
	await lockObject(db, ctx, object);
	if ((await rev(db, ctx, object)) !== expectedRev)
		throw new Fault(409, "VERSION_CONFLICT");
	const { rows } = await db.query(
		"SELECT id,key,position FROM crm.property_group WHERE tenant_id=$1 AND object_type=$2 AND NOT archived ORDER BY position,key FOR UPDATE",
		[ctx.tenant, object],
	);
	const byKey = new Map(rows.map((r) => [r.key as string, r]));
	if (rows.length !== keys.length || keys.some((k) => !byKey.has(k)))
		throw new Fault(422, "VALIDATION_FAILED", [
			{ field: "keys", code: "REORDER_SET_MISMATCH" },
		]);
	let moved = 0;
	for (const [i, k] of keys.entries()) {
		const r = byKey.get(k) as Row;
		if (r.position === (i + 1) * 10) continue;
		await db.query(
			"UPDATE crm.property_group SET position=$3,version=version+1 WHERE tenant_id=$1 AND id=$2",
			[ctx.tenant, r.id, (i + 1) * 10],
		);
		await evidence(db, ctx, "property_group", r.id as string, "property_group.updated", request, ["position"]);
		moved++;
	}
	if (moved) await bump(db, ctx, object);
	return { kind: "property_group", id: (byKey.get(keys[0]) as Row).id as string };
}
