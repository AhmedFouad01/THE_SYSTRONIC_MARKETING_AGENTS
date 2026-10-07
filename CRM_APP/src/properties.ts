// ADR-002 P1b B3 (S7): custom property VALUES on contact/lead/deal/task. The ONE validator is `validateProperties` (ADR 4.7): pure,
// no I/O, unit-tested. Everything that needs the database (registry load + lock, permissions, user lookups, search fold, reads)
// is in the small async helpers below; crm.ts only calls them (thin call sites).
// Storage: `custom` jsonb (absent key = no value; `null` and "" / [] clear) + `custom_search` (folded text of searchable,
// non-sensitive, active text properties). Old rows that violate a newer rule stay readable; rules apply to new writes only.
import { isDeepStrictEqual } from "node:util";
import type pg from "pg";
import { type Context, Fault } from "./db.js";
import type { Kind } from "./query.js";
import {
	BAD_TEXT,
	BAD_TEXT_MULTILINE,
	KEY_RE,
	isObj,
	type PropType,
} from "./schemarules.js";

type Db = pg.PoolClient;
export type Row = Record<string, unknown>;
export type Def = {
	key: string;
	type: PropType;
	required: boolean;
	read_only: boolean;
	sensitive: boolean;
	searchable: boolean;
	validation: Record<string, number>;
	position: number;
	archived: boolean;
	// option value -> archived. Loaded only for the select properties named in the patch.
	options: Map<string, boolean>;
};
// A registry slice: the custom (non-system) definitions needed for one write or read, never the whole schema.
export type Registry = { object: string; defs: Map<string, Def> };
export type Actor = {
	sensitiveRead: boolean;
	sensitiveWrite: boolean;
	// uuids among the patch's `user` values that crm.assignment_ok accepts (resolved by the caller before validating)
	assignable: ReadonlySet<string>;
};
export type Opts = { mode?: "create" | "update"; current?: Row };
export type Validated = { custom: Row; changed: string[] };

export const LIMITS = {
	patchKeys: 100, // = the registry cap of active custom properties per object
	customBytes: 24_000, // JSON text of the merged `custom`; the 010 CHECK (32 KB of jsonb) is the backstop
	searchBytes: 8192, // = 010 octet_length(custom_search) CHECK
	multi: 50,
	text: 2000,
	longText: 20000,
	number: 1e15,
	props: 20, // props= keys on a list
} as const;

const issue = (key: string | null, code: string) => ({
	field: key === null ? "properties" : `properties.${key}`,
	...(key === null ? {} : { property: key }),
	code,
});
// A lone surrogate would make Postgres reject the jsonb ("Unicode low surrogate must follow a high surrogate"): refuse it up front.
const LONE_SURROGATE = /[\ud800-\udfff]/u;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isEmpty = (v: unknown) =>
	v === null || v === "" || (Array.isArray(v) && v.length === 0);

function calendar(y: number, m: number, d: number) {
	if (y < 1000 || y > 9999 || m < 1 || m > 12 || d < 1) return false;
	const t = new Date(Date.UTC(2000, m - 1, 1));
	t.setUTCFullYear(y);
	t.setUTCMonth(m - 1, d);
	return t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}
function isoDate(s: string): string | null {
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
	return m && calendar(+m[1], +m[2], +m[3]) ? s : null;
}
function isoDateTime(s: string): string | null {
	const m =
		/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(Z|[+-](\d{2}):(\d{2}))$/.exec(
			s,
		);
	if (!m || !calendar(+m[1], +m[2], +m[3])) return null;
	if (+m[4] > 23 || +m[5] > 59 || (m[6] !== undefined && +m[6] > 59)) return null;
	if (m[9] !== undefined && (+m[9] > 23 || +m[10] > 59)) return null;
	const frac = (m[7] ?? "0").padEnd(3, "0").slice(0, 3);
	const t = Date.parse(
		`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] ?? "00"}.${frac}${m[8]}`,
	);
	return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

type Coerced = { value: unknown } | { code: string };
const bad = (code: string): Coerced => ({ code });
// One value against one definition. `cur` = the stored value: an option that was archived after it was chosen stays valid while
// it is unchanged, so editing another property of the record never trips over it.
function coerce(d: Def, raw: unknown, cur: unknown, actor: Actor): Coerced {
	switch (d.type) {
		case "text":
		case "long_text": {
			if (typeof raw !== "string") return bad("INVALID_TYPE");
			const s = raw.normalize("NFC").trim();
			if (s === "") return { value: null };
			if (
				LONE_SURROGATE.test(s) ||
				(d.type === "text" ? BAD_TEXT : BAD_TEXT_MULTILINE).test(s)
			)
				return bad("INVALID_VALUE");
			const max = d.validation.max_length ?? (d.type === "text" ? LIMITS.text : LIMITS.longText);
			return [...s].length > max ? bad("MAX_LENGTH") : { value: s };
		}
		case "number":
		case "currency": {
			if (typeof raw !== "number" || !Number.isFinite(raw) || Math.abs(raw) > LIMITS.number)
				return bad("INVALID_VALUE");
			// currency = integer minor units in the property's fixed currency code
			if (d.type === "currency" && !Number.isSafeInteger(raw)) return bad("INVALID_VALUE");
			if (d.validation.min !== undefined && raw < d.validation.min) return bad("MIN_VALUE");
			if (d.validation.max !== undefined && raw > d.validation.max) return bad("MAX_VALUE");
			return { value: raw === 0 ? 0 : raw };
		}
		case "checkbox":
			return typeof raw === "boolean" ? { value: raw } : bad("INVALID_TYPE");
		case "date": {
			if (typeof raw !== "string") return bad("INVALID_TYPE");
			const v = isoDate(raw);
			return v ? { value: v } : bad("INVALID_VALUE");
		}
		case "datetime": {
			if (typeof raw !== "string") return bad("INVALID_TYPE");
			const v = isoDateTime(raw);
			return v ? { value: v } : bad("INVALID_VALUE");
		}
		case "single_select": {
			if (typeof raw !== "string") return bad("INVALID_TYPE");
			const a = d.options.get(raw);
			if (a === undefined) return bad("OPTION_UNKNOWN");
			return a && raw !== cur ? bad("OPTION_ARCHIVED") : { value: raw };
		}
		case "multi_select": {
			if (!Array.isArray(raw) || raw.some((x) => typeof x !== "string"))
				return bad("INVALID_TYPE");
			if (raw.length > Math.min(d.validation.max_selected ?? LIMITS.multi, LIMITS.multi))
				return bad("MAX_SELECTED");
			if (new Set(raw).size !== raw.length) return bad("DUPLICATE_OPTION");
			const have = Array.isArray(cur) ? cur : [];
			for (const x of raw as string[]) {
				const a = d.options.get(x);
				if (a === undefined) return bad("OPTION_UNKNOWN");
				if (a && !have.includes(x)) return bad("OPTION_ARCHIVED");
			}
			return { value: raw };
		}
		case "user": {
			if (typeof raw !== "string" || !UUID.test(raw)) return bad("INVALID_VALUE");
			return actor.assignable.has(raw.toLowerCase())
				? { value: raw.toLowerCase() }
				: bad("USER_INVALID");
		}
	}
}

// ADR 4.7 steps 1, 3-7: shape/size, per-property authority, per-type validation, required, caps, merge. Throws Fault(422) with ALL
// violations (`errors[{field,property,code}]`; top-level UNKNOWN_PROPERTY when any key is unknown, else VALIDATION_FAILED) or
// Fault(403) when the actor may read a sensitive property but not write it. Returns the merged `custom` and the changed keys.
export function validateProperties(
	registry: Registry,
	object: string,
	patch: unknown,
	actor: Actor,
	opts: Opts = {},
): Validated {
	const mode = opts.mode ?? "update";
	const current = opts.current ?? {};
	if (registry.object !== object) throw new Fault(500, "INTERNAL_ERROR");
	if (patch === undefined || (patch === null && mode === "create")) patch = {};
	if (!isObj(patch)) throw new Fault(422, "VALIDATION_FAILED", [issue(null, "INVALID_TYPE")]);
	const entries = Object.entries(patch);
	if (entries.length > LIMITS.patchKeys)
		throw new Fault(422, "VALIDATION_FAILED", [issue(null, "TOO_MANY_PROPERTIES")]);
	const errors: ReturnType<typeof issue>[] = [];
	let unknown = false;
	const next: Row = Object.create(null);
	Object.assign(next, current);
	const changed: string[] = [];
	const touched = new Set<string>();
	for (const [key, raw] of entries) {
		const d = KEY_RE.test(key) ? registry.defs.get(key) : undefined;
		// A sensitive property is invisible (indistinguishable from an unknown key) to a caller who cannot read it.
		if (!d || (d.sensitive && !actor.sensitiveRead)) {
			unknown = true;
			errors.push(issue(KEY_RE.test(key) ? key : null, "UNKNOWN_PROPERTY"));
			continue;
		}
		if (d.archived) {
			errors.push(issue(key, "PROPERTY_ARCHIVED"));
			continue;
		}
		if (d.sensitive && !actor.sensitiveWrite) throw new Fault(403, "FORBIDDEN");
		if (d.read_only) {
			errors.push(issue(key, "READ_ONLY"));
			continue;
		}
		touched.add(key);
		let value: unknown = null;
		if (!isEmpty(raw)) {
			const c = coerce(d, raw, current[key], actor);
			if ("code" in c) {
				errors.push(issue(key, c.code));
				continue;
			}
			value = c.value;
		}
		if (value === null) {
			if (d.required) {
				errors.push(issue(key, "REQUIRED"));
				continue;
			}
			if (Object.hasOwn(next, key)) {
				delete next[key];
				changed.push(key);
			}
		} else if (!isDeepStrictEqual(next[key], value)) {
			next[key] = value;
			changed.push(key);
		}
	}
	if (mode === "create")
		for (const d of registry.defs.values()) {
			if (!d.required || d.archived || d.read_only || touched.has(d.key)) continue;
			// Required but invisible/unwritable to this caller (sensitive): the server cannot ask for what the caller cannot know.
			if (d.sensitive && !(actor.sensitiveRead && actor.sensitiveWrite)) continue;
			errors.push(issue(d.key, "REQUIRED"));
		}
	if (errors.length)
		throw new Fault(422, unknown ? "UNKNOWN_PROPERTY" : "VALIDATION_FAILED", errors);
	if (Buffer.byteLength(JSON.stringify(next)) > LIMITS.customBytes)
		throw new Fault(422, "PROPERTIES_TOO_LARGE");
	return { custom: next, changed };
}

// Folded search text: searchable + active + NOT sensitive text values, in registry order (position, key). Pure; the caller folds
// it with crm.normalize_search and truncates to the 8192-byte column limit.
export function searchSource(registry: Registry, custom: Row): string {
	return [...registry.defs.values()]
		.filter(
			(d) =>
				d.searchable &&
				!d.sensitive &&
				!d.archived &&
				(d.type === "text" || d.type === "long_text") &&
				typeof custom[d.key] === "string",
		)
		.sort((a, b) => a.position - b.position || (a.key < b.key ? -1 : 1))
		.map((d) => custom[d.key] as string)
		.join("\u001f"); // a unit separator no query can contain, so a match never spans two values
}
export function truncateBytes(s: string, max: number): string {
	const buf = Buffer.from(s, "utf8");
	if (buf.length <= max) return s;
	let cut = max;
	while (cut > 0 && (buf[cut] & 0xc0) === 0x80) cut--; // never split a UTF-8 sequence
	return buf.subarray(0, cut).toString("utf8");
}

// ---------------------------------------------------------------------------------------------------------------------------
// Database helpers
// ---------------------------------------------------------------------------------------------------------------------------
// Registry slice for a write: the named keys (with their options), every searchable active property (to rebuild custom_search),
// and on create every required active one. Takes FOR KEY SHARE on the object_type row: B2 schema writes hold it FOR UPDATE, so a
// definition change and a record write serialise (the validation sees committed schema state until this transaction ends).
export async function loadRegistry(
	db: Db,
	ctx: Context,
	object: string,
	keys: string[],
	create: boolean,
): Promise<Registry> {
	await db.query(
		"SELECT 1 FROM crm.object_type WHERE tenant_id=$1 AND key=$2 FOR KEY SHARE",
		[ctx.tenant, object],
	);
	const { rows } = await db.query(
		`SELECT d.key,d.type,d.required,d.read_only,d.sensitive,d.searchable,d.validation,d.position,d.archived_at IS NOT NULL archived,
  CASE WHEN d.type IN ('single_select','multi_select') AND d.key=ANY($3::text[])
   THEN coalesce((SELECT jsonb_object_agg(o.value,o.archived) FROM crm.property_option o WHERE o.tenant_id=d.tenant_id AND o.property_id=d.id),'{}'::jsonb)
   ELSE '{}'::jsonb END options
 FROM crm.property_definition d
 WHERE d.tenant_id=$1 AND d.object_type=$2 AND d.storage='custom' AND NOT d.is_system
  AND (d.key=ANY($3::text[]) OR (d.archived_at IS NULL AND (d.searchable OR ($4::boolean AND d.required))))`,
		[ctx.tenant, object, keys, create],
	);
	const defs = new Map<string, Def>();
	for (const r of rows)
		defs.set(r.key, {
			key: r.key,
			type: r.type,
			required: r.required,
			read_only: r.read_only,
			sensitive: r.sensitive,
			searchable: r.searchable,
			validation: r.validation ?? {},
			position: r.position,
			archived: r.archived,
			options: new Map(Object.entries(r.options as Record<string, boolean>)),
		});
	return { object, defs };
}

async function can(db: Db, ctx: Context, action: string, kind: string, object: string | null) {
	const {
		rows: [r],
	} = await db.query("SELECT crm.can_object($1,$2,$3,$4) ok", [
		action,
		kind,
		object,
		ctx.grant ?? null,
	]);
	return r.ok === true;
}

// ADR 4.7 pipeline around validateProperties for one record write. `object` = the record id on update (row already locked FOR UPDATE
// by the caller), null on create. Returns null when there is nothing to write (update without `properties`).
export async function prepareCustom(
	db: Db,
	ctx: Context,
	kind: Kind,
	object: string | null,
	patch: unknown,
): Promise<{ custom: string; search: string; changed: string[] } | null> {
	if (object !== null && patch === undefined) return null;
	const create = object === null;
	const keys = isObj(patch) ? Object.keys(patch).filter((k) => KEY_RE.test(k)).slice(0, LIMITS.patchKeys) : [];
	const registry = await loadRegistry(db, ctx, kind, keys, create);
	const actor: Actor = { sensitiveRead: false, sensitiveWrite: false, assignable: new Set() };
	if ([...registry.defs.values()].some((d) => d.sensitive)) {
		actor.sensitiveRead = await can(db, ctx, "sensitive.read", kind, object);
		actor.sensitiveWrite = await can(db, ctx, "sensitive.write", kind, object);
	}
	// `user` values: ask the same definer function that guards assignment (active member who may write CRM).
	const ids = new Set<string>();
	if (isObj(patch))
		for (const k of keys) {
			const d = registry.defs.get(k),
				v = patch[k];
			if (d?.type === "user" && typeof v === "string" && UUID.test(v)) ids.add(v.toLowerCase());
		}
	const ok = new Set<string>();
	for (const u of ids) {
		const {
			rows: [r],
		} = await db.query("SELECT crm.assignment_ok($1) ok", [u]);
		if (r.ok === true) ok.add(u);
	}
	actor.assignable = ok;
	let current: Row = {};
	if (!create) {
		const {
			rows: [r],
		} = await db.query(
			`SELECT custom FROM crm.${kind} WHERE tenant_id=$1 AND id=$2`,
			[ctx.tenant, object],
		);
		current = (r?.custom ?? {}) as Row;
	}
	const v = validateProperties(registry, kind, patch, actor, {
		mode: create ? "create" : "update",
		current,
	});
	const src = searchSource(registry, v.custom);
	let search = "";
	if (src) {
		const {
			rows: [f],
		} = await db.query("SELECT crm.normalize_search($1::text) s", [src]);
		search = truncateBytes(f.s as string, LIMITS.searchBytes);
	}
	return { custom: JSON.stringify(v.custom), search, changed: v.changed };
}

// ---- reads -----------------------------------------------------------------------------------------------------------------
// Adds `properties` to rows (each needs `id`): only active custom properties that hold a value, non-sensitive unless the caller may
// read sensitive ones. `keys` null = every value of the record (single GET); a list = only those (list `props=`). Selected in SQL so
// the whole blob never leaves the database.
export async function attachProperties(
	db: Db,
	ctx: Context,
	kind: Kind,
	rows: Row[],
	opts: { keys: string[] | null; sensitive: boolean },
): Promise<void> {
	if (!rows.length || (opts.keys && !opts.keys.length)) {
		for (const r of rows) r.properties = {};
		return;
	}
	const { rows: got } = await db.query(
		`WITH d AS (SELECT key FROM crm.property_definition WHERE tenant_id=$1 AND object_type=$2 AND storage='custom' AND NOT is_system
   AND archived_at IS NULL AND ($3::boolean OR NOT sensitive) AND ($4::text[] IS NULL OR key=ANY($4)))
 SELECT t.id,coalesce((SELECT jsonb_object_agg(d.key,t.custom->d.key) FROM d WHERE jsonb_exists(t.custom,d.key)),'{}'::jsonb) properties
 FROM crm.${kind} t WHERE t.tenant_id=$1 AND t.id=ANY($5::uuid[])`,
		[ctx.tenant, kind, opts.sensitive, opts.keys, rows.map((r) => r.id)],
	);
	const by = new Map(got.map((g) => [g.id as string, g.properties as Row]));
	for (const r of rows) r.properties = by.get(r.id as string) ?? {};
}
export const sensitiveRead = (db: Db, ctx: Context, kind: string, object: string | null) =>
	can(db, ctx, "sensitive.read", kind, object);

// `props=a,b` on a list: validated against the registry (an archived, unknown or unreadable-sensitive key is the same 422).
export async function listKeys(
	db: Db,
	ctx: Context,
	kind: Kind,
	raw: string | null,
	sensitive: boolean,
): Promise<string[] | null> {
	if (raw === null) return null;
	const keys = raw === "" ? [] : raw.split(",");
	if (keys.length > LIMITS.props || new Set(keys).size !== keys.length)
		throw new Fault(422, "VALIDATION_FAILED", [issue(null, "TOO_MANY_PROPERTIES")]);
	const badKeys = keys.filter((k) => !KEY_RE.test(k));
	if (badKeys.length) throw new Fault(422, "UNKNOWN_PROPERTY", [issue(null, "UNKNOWN_PROPERTY")]);
	if (!keys.length) return keys;
	const { rows } = await db.query(
		"SELECT key FROM crm.property_definition WHERE tenant_id=$1 AND object_type=$2 AND storage='custom' AND NOT is_system AND archived_at IS NULL AND ($4::boolean OR NOT sensitive) AND key=ANY($3::text[])",
		[ctx.tenant, kind, keys, sensitive],
	);
	const have = new Set(rows.map((r) => r.key as string));
	const missing = keys.filter((k) => !have.has(k));
	if (missing.length)
		throw new Fault(422, "UNKNOWN_PROPERTY", missing.map((k) => issue(k, "UNKNOWN_PROPERTY")));
	return keys;
}

// ---- contact merge (ADR 4.7): the target wins per key; keys only the source holds fill the gaps ---------------------------------
export function mergePlan(source: Row, target: Row, hidden: ReadonlySet<string> = new Set()) {
	const fill: string[] = [],
		conflicts: string[] = [];
	for (const [k, v] of Object.entries(source)) {
		if (hidden.has(k)) continue;
		if (!Object.hasOwn(target, k) || isEmpty(target[k])) fill.push(k);
		else if (!isDeepStrictEqual(target[k], v)) conflicts.push(k);
	}
	fill.sort();
	conflicts.sort();
	const custom: Row = Object.create(null);
	Object.assign(custom, target);
	for (const k of fill) custom[k] = source[k];
	return {
		fill,
		conflicts,
		custom,
		fits: Buffer.byteLength(JSON.stringify(custom)) <= LIMITS.customBytes,
	};
}
// Reads both contacts' custom blobs (rows already locked by the caller) and computes the plan. Sensitive keys are planned (listed,
// filled) only when the actor may read AND write sensitive values; otherwise they are left exactly as they are on both records.
export async function mergeCustom(
	db: Db,
	ctx: Context,
	source: string,
	target: string,
) {
	const { rows } = await db.query(
		"SELECT id,custom FROM crm.contact WHERE tenant_id=$1 AND id=ANY($2::uuid[])",
		[ctx.tenant, [source, target]],
	);
	const get = (id: string) => (rows.find((r) => r.id === id)?.custom ?? {}) as Row;
	const s = get(source),
		t = get(target);
	const keys = Object.keys(s);
	const registry = await loadRegistry(db, ctx, "contact", keys, false);
	const hidden = new Set<string>();
	if ([...registry.defs.values()].some((d) => d.sensitive)) {
		const ok =
			(await can(db, ctx, "sensitive.read", "contact", target)) &&
			(await can(db, ctx, "sensitive.write", "contact", target));
		if (!ok) for (const d of registry.defs.values()) if (d.sensitive) hidden.add(d.key);
	}
	const plan = mergePlan(s, t, hidden);
	let search = "";
	const src = searchSource(registry, plan.custom);
	if (src) {
		const {
			rows: [f],
		} = await db.query("SELECT crm.normalize_search($1::text) s", [src]);
		search = truncateBytes(f.s as string, LIMITS.searchBytes);
	}
	return { ...plan, search };
}
