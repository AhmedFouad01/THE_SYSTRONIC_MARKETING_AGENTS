// ADR-002 P1a S4: list query compiler (q, filter, sort, keyset cursor, limit, include_total, expand) for contact/lead/deal/task.
// Identifiers (columns) come only from FIELDS; every request value is a bound parameter ($n::type). Pure: no I/O.
// P1b B4: custom properties join filter/sort through an optional, caller-resolved `PropRegistry` (the allow-list for one tenant and
// object). A custom key is only ever a BOUND parameter (`custom -> $n::text`), never SQL text; reads are `jsonb_typeof`-guarded.
import { createHash } from "node:crypto";
import { Fault } from "./db.js";
import {
	isoDate,
	isoDateTime,
	type ListProp,
	type PropRegistry,
} from "./properties.js";
import { COLUMNS, type Kind, projection } from "./query.js";
import { KEY_RE, RESERVED_KEYS, type PropType } from "./schemarules.js";

// num/date/dtm/pos exist only for custom properties: numeric, ISO date text, ISO UTC instant text, select option position.
type T = "uuid" | "text" | "int" | "big" | "ts" | "num" | "date" | "dtm" | "pos";
type Field = {
	t: T;
	sort?: true;
	sortOnly?: true;
	nullable?: true;
	enum?: readonly string[];
	// custom property: default PostgreSQL null ordering (ASC nulls last, DESC nulls first: the order an index serves, B0 F3)
	custom?: ListProp;
};
const f = (t: T, o: Partial<Field> = {}): Field => ({ t, ...o });
const relatedNames = {
	contact_name: f("text", { sort: true, sortOnly: true, nullable: true }),
	owner_name: f("text", { sort: true, sortOnly: true, nullable: true }),
};
const stamps = {
	created_at: f("ts", { sort: true }),
	updated_at: f("ts", { sort: true }),
	version: f("int"),
};
const fields = (o: Record<string, Field>) => new Map(Object.entries(o));
// System fields only (no source_evidence, no identifiers). Filterable = every entry; sortable = `sort`.
export const FIELDS: Record<Kind, Map<string, Field>> = {
	contact: fields({
		id: f("uuid"),
		display_name: f("text", { sort: true }),
		owner_id: f("uuid"),
		source: f("text", { sort: true }),
		...stamps,
	}),
	lead: fields({
		...relatedNames,
		id: f("uuid"),
		contact_id: f("uuid"),
		owner_id: f("uuid"),
		title: f("text", { sort: true }),
		source: f("text", { sort: true }),
		status: f("text", { sort: true, enum: ["open", "qualified", "closed"] }),
		received_at: f("ts", { sort: true }),
		...stamps,
	}),
	deal: fields({
		...relatedNames,
		stage: f("int", { sort: true, sortOnly: true, nullable: true }),
		id: f("uuid"),
		contact_id: f("uuid"),
		pipeline_id: f("uuid"),
		stage_id: f("uuid"),
		owner_id: f("uuid"),
		lead_id: f("uuid"),
		title: f("text", { sort: true }),
		amount_minor: f("big", { sort: true }),
		currency: f("text", { sort: true }),
		...stamps,
	}),
	task: fields({
		owner_name: relatedNames.owner_name,
		id: f("uuid"),
		contact_id: f("uuid"),
		deal_id: f("uuid"),
		owner_id: f("uuid"),
		title: f("text", { sort: true }),
		due_at: f("ts", { sort: true }),
		status: f("text", { sort: true, enum: ["open", "completed"] }),
		outcome: f("text"),
		completed_at: f("ts", { sort: true, nullable: true }),
		...stamps,
	}),
};
const BASE = ["eq", "neq", "in", "nin", "is_null", "not_null"];
const ORD = ["gt", "gte", "lt", "lte", "between"];
const OPS: Partial<Record<T, string[]>> = {
	uuid: BASE,
	text: [...BASE, "contains", "starts_with"],
	int: [...BASE, ...ORD],
	big: [...BASE, ...ORD],
	ts: [...BASE, ...ORD],
};
export const LIMITS = {
	depth: 3,
	conditions: 20,
	bytes: 4096,
	list: 100,
	text: 200,
	q: 100,
	limit: 200,
	defaultLimit: 50,
	total: 10000,
};
const bad = () => new Fault(422, "VALIDATION_FAILED");
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isObj = (v: unknown): v is Record<string, unknown> =>
	typeof v === "object" && v !== null && !Array.isArray(v);
// NUL cannot be stored in PostgreSQL text and would surface as a 500: reject at the boundary.
const str = (v: unknown, max: number): string => {
	if (typeof v !== "string" || v.length > max || v.includes("\0")) throw bad();
	return v;
};
const INT4 = 2147483647;
function value(fd: Field, v: unknown): string | number {
	switch (fd.t) {
		case "uuid":
			if (typeof v === "string" && UUID.test(v)) return v.toLowerCase();
			break;
		case "text": {
			const s = str(v, LIMITS.text);
			if (fd.enum && !fd.enum.includes(s)) break;
			return s;
		}
		case "int":
			if (Number.isSafeInteger(v) && Math.abs(v as number) <= INT4)
				return v as number;
			break;
		case "big":
			if (Number.isSafeInteger(v)) return v as number;
			break;
		case "ts":
			if (
				typeof v === "string" &&
				v.length <= 40 &&
				/^\d{4}-\d\d-\d\d(T.*(Z|[+-]\d\d:\d\d))?$/.test(v) &&
				Number.isFinite(Date.parse(v))
			)
				return new Date(v).toISOString();
	}
	throw bad();
}
const CAST: Record<T, string> = {
	uuid: "uuid",
	text: "text",
	int: "integer",
	big: "bigint",
	ts: "timestamptz",
	num: "numeric",
	date: "text",
	dtm: "text",
	pos: "integer",
};
const likeEscape = (s: string) => s.replace(/[\\%_]/g, "\\$&");
type Bind = (v: unknown) => string;
type Node = { sql: string; canon: unknown };
// ---- B4: custom properties ------------------------------------------------------------------------------------------------
// Per-request compile context. `kp(key)` binds a registry-validated custom key ONCE (`$n::text`) and reuses it everywhere the
// property appears (filter, sort expression, keyset); `opt(key)` does the same for a select property's option-position array.
type Cx = {
	kind: Kind;
	bind: Bind;
	props?: PropRegistry;
	kp: (key: string) => string;
	opt: (d: ListProp) => string;
	used: Set<string>;
};
// A name that is a record column, a system field of any object, or a reserved word can never be a custom property: the static
// compiler's answer (VALIDATION_FAILED) stays, with or without a registry.
const systemName = (n: string) =>
	RESERVED_KEYS.has(n) ||
	(Object.keys(COLUMNS) as Kind[]).some(
		(k) => FIELDS[k].has(n) || COLUMNS[k].includes(n),
	);
const unknownProperty = (field: string, key: string) =>
	new Fault(422, "UNKNOWN_PROPERTY", [
		{ field, property: key, code: "UNKNOWN_PROPERTY" },
	]);
const NUM_MAX = 1e15; // = the write-side bound (properties.ts LIMITS.number)
// Filter operators per property type (ADR-002 4.4). multi_select has no scalar ordering; checkbox is `is true|false`.
const PROP_OPS: Record<PropType, string[]> = {
	text: [...BASE, "contains", "starts_with"],
	long_text: ["contains", "is_null", "not_null"],
	number: [...BASE, ...ORD],
	currency: [...BASE, ...ORD],
	date: [...BASE, ...ORD],
	datetime: [...BASE, ...ORD],
	single_select: BASE,
	multi_select: ["has_any", "has_all", "is_null", "not_null"],
	checkbox: ["is", "is_null", "not_null"],
	user: BASE,
};
// Sortable types (ADR 4.4): text, number-like, date-like, select by option position. Not: long_text, multi_select, checkbox, user.
const PROP_T: Partial<Record<PropType, T>> = {
	text: "text",
	number: "num",
	currency: "num",
	date: "date",
	datetime: "dtm",
	single_select: "pos",
};
const rawX = (cx: Cx, d: ListProp) => `custom->${cx.kp(d.key)}`;
// Typed reads: a value of the wrong JSON type reads as NULL (never a cast error), whatever is stored.
function strX(cx: Cx, d: ListProp) {
	return `(CASE WHEN jsonb_typeof(${rawX(cx, d)})='string' THEN custom->>${cx.kp(d.key)} END)`;
}
function numX(cx: Cx, d: ListProp) {
	return `(CASE WHEN jsonb_typeof(${rawX(cx, d)})='number' THEN (custom->>${cx.kp(d.key)})::numeric END)`;
}
// The SQL expression a sort key (and its keyset) uses; select = position in the registry's option order (bound array, <= 200).
function sortExpr(cx: Cx, d: ListProp): string {
	switch (d.type) {
		case "number":
		case "currency":
			return numX(cx, d);
		case "single_select":
			return `array_position(${cx.opt(d)},${strX(cx, d)})`;
		default:
			return strX(cx, d);
	}
}
function customField(d: ListProp): Field {
	const t = PROP_T[d.type];
	return t
		? { t, sort: true, nullable: true, custom: d }
		: { t: "text", nullable: true, custom: d };
}
// name -> Field for filter and sort. System fields win; with a registry, a key-shaped unknown name is UNKNOWN_PROPERTY (archived,
// sensitive-without-permission and missing are indistinguishable); without one the compiler is the P1a static one.
function resolve(cx: Cx, name: string, where: "filter" | "sort"): Field {
	const sys = FIELDS[cx.kind].get(name);
	if (sys) {
		if (!/^[a-z_]+$/.test(name)) throw bad();
		return sys;
	}
	if (!cx.props || !KEY_RE.test(name) || systemName(name)) throw bad();
	const d = cx.props.defs.get(name);
	if (!d) throw unknownProperty(where, name);
	cx.used.add(name);
	return customField(d);
}
// Custom keys a request names in filter/sort (pure, lenient: malformed input is left for planList to reject). The caller loads
// exactly these from the registry; nothing here reaches SQL.
export function customKeys(query: URLSearchParams): string[] {
	const out = new Set<string>();
	const add = (p: unknown) => {
		if (typeof p === "string" && KEY_RE.test(p) && !systemName(p))
			out.add(p);
	};
	let seen = 0;
	const walk = (n: unknown, depth: number) => {
		if (!isObj(n) || depth > LIMITS.depth || ++seen > 100) return;
		for (const k of ["and", "or"]) {
			const l = n[k];
			if (Array.isArray(l))
				for (const c of l.slice(0, LIMITS.conditions)) walk(c, depth + 1);
		}
		add(n.p);
	};
	const f = query.get("filter");
	if (f && Buffer.byteLength(f) <= LIMITS.bytes)
		try {
			walk(JSON.parse(f), 1);
		} catch {}
	const s = query.get("sort");
	if (s && s.length <= 100)
		for (const p of s.split(",").slice(0, 2))
			add(p.startsWith("-") ? p.slice(1) : p);
	return [...out].slice(0, LIMITS.conditions + 2);
}
// A filter value for a custom property of this type, validated and normalised exactly like the stored form.
function cvalue(d: ListProp, v: unknown): string | number | boolean {
	switch (d.type) {
		case "text":
		case "long_text":
			return str(v, LIMITS.text).normalize("NFC");
		case "number":
		case "currency":
			if (typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= NUM_MAX)
				return v;
			break;
		case "date":
			if (typeof v === "string") {
				const x = isoDate(v);
				if (x) return x;
			}
			break;
		case "datetime":
			if (typeof v === "string" && v.length <= 40) {
				const x = isoDateTime(v);
				if (x) return x;
			}
			break;
		case "single_select":
		case "multi_select":
			if (typeof v === "string" && d.options.includes(v)) return v;
			break;
		case "user":
			if (typeof v === "string" && UUID.test(v)) return v.toLowerCase();
			break;
		case "checkbox":
			if (typeof v === "boolean") return v;
	}
	throw bad();
}
function customCondition(
	cx: Cx,
	d: ListProp,
	n: Record<string, unknown>,
	name: string,
): Node {
	const op = n.op as string;
	if (!PROP_OPS[d.type].includes(op)) throw bad();
	const rx = rawX(cx, d);
	const typed = (s: string) => `jsonb_typeof(${rx})${s}`;
	const num = d.type === "number" || d.type === "currency";
	if (op === "is_null" || op === "not_null") {
		if ("v" in n) throw bad();
		const isNull = op === "is_null";
		let sql: string;
		if (d.type === "multi_select")
			sql = typed(isNull ? " IS DISTINCT FROM 'array'" : "='array'");
		else if (d.type === "checkbox")
			sql = typed(isNull ? " IS DISTINCT FROM 'boolean'" : "='boolean'");
		else
			sql = `${num ? numX(cx, d) : strX(cx, d)} IS ${isNull ? "" : "NOT "}NULL`;
		return { sql, canon: { p: name, op } };
	}
	if (!("v" in n)) throw bad();
	const v = n.v;
	if (op === "is") {
		// checkbox: `is true` = value true; `is false` = not true (stored false or never set)
		if (typeof v !== "boolean") throw bad();
		return {
			sql: v ? `${rx}='true'::jsonb` : `NOT coalesce(${rx}='true'::jsonb,false)`,
			canon: { p: name, op, v },
		};
	}
	const list = (): (string | number | boolean)[] => {
		if (!Array.isArray(v) || !v.length || v.length > LIMITS.list) throw bad();
		return v.map((x) => cvalue(d, x));
	};
	if (op === "has_any" || op === "has_all") {
		const vals = list() as string[];
		const hit =
			op === "has_any"
				? `EXISTS(SELECT 1 FROM unnest(${cx.bind(vals)}::text[]) w(v) WHERE ${rx} @> to_jsonb(w.v))`
				: `${rx} @> ${cx.bind(JSON.stringify(vals))}::jsonb`;
		return {
			sql: `(${typed("='array'")} AND ${hit})`,
			canon: { p: name, op, v },
		};
	}
	// scalar types: one guarded expression, the same operator set as the static compiler
	const col = num ? numX(cx, d) : strX(cx, d);
	const cast = num ? "numeric" : "text";
	const one = (x: unknown) => `${cx.bind(cvalue(d, x))}::${cast}`;
	const arr = () => `${cx.bind(list())}::${cast}[]`;
	let sql: string;
	let cv: unknown = v;
	switch (op) {
		case "eq":
			sql = `${col} = ${one(v)}`;
			break;
		case "neq":
			sql = `${col} IS DISTINCT FROM ${one(v)}`;
			break;
		case "in":
			sql = `${col} = ANY(${arr()})`;
			break;
		case "nin":
			sql = `(${col} IS NULL OR ${col} <> ALL(${arr()}))`;
			break;
		case "gt":
			sql = `${col} > ${one(v)}`;
			break;
		case "gte":
			sql = `${col} >= ${one(v)}`;
			break;
		case "lt":
			sql = `${col} < ${one(v)}`;
			break;
		case "lte":
			sql = `${col} <= ${one(v)}`;
			break;
		case "between":
			if (!Array.isArray(v) || v.length !== 2) throw bad();
			sql = `${col} BETWEEN ${one(v[0])} AND ${one(v[1])}`;
			break;
		default: {
			// contains | starts_with
			const s = str(v, LIMITS.q).normalize("NFC");
			if (!s) throw bad();
			sql = `${col} ILIKE ${cx.bind(op === "contains" ? `%${likeEscape(s)}%` : `${likeEscape(s)}%`)} ESCAPE '\\'`;
			cv = s;
		}
	}
	return { sql, canon: { p: name, op, v: cv } };
}
function condition(cx: Cx, n: Record<string, unknown>): Node {
	const { bind } = cx;
	if (Object.keys(n).some((k) => !["p", "op", "v"].includes(k))) throw bad();
	if (typeof n.p !== "string" || typeof n.op !== "string") throw bad();
	const fd = resolve(cx, n.p, "filter");
	if (fd.custom) return customCondition(cx, fd.custom, n, n.p);
	const op = n.op as string;
	if (fd.sortOnly || !OPS[fd.t]?.includes(op)) throw bad();
	const col = n.p as string;
	if (!/^[a-z_]+$/.test(col)) throw bad();
	const cast = CAST[fd.t],
		one = (v: unknown) => `${bind(value(fd, v))}::${cast}`;
	const arr = (v: unknown) => {
		if (!Array.isArray(v) || !v.length || v.length > LIMITS.list) throw bad();
		return `${bind(v.map((x) => value(fd, x)))}::${cast}[]`;
	};
	if (op === "is_null" || op === "not_null") {
		if ("v" in n) throw bad();
		return {
			sql: `${col} IS ${op === "is_null" ? "" : "NOT "}NULL`,
			canon: { p: col, op },
		};
	}
	if (!("v" in n)) throw bad();
	const v = n.v;
	let sql: string;
	let cv: unknown = v;
	switch (op) {
		case "eq":
			sql = `${col} = ${one(v)}`;
			break;
		case "neq":
			sql = `${col} IS DISTINCT FROM ${one(v)}`;
			break;
		case "in":
			sql = `${col} = ANY(${arr(v)})`;
			break;
		case "nin":
			sql = `(${col} IS NULL OR ${col} <> ALL(${arr(v)}))`;
			break;
		case "gt":
			sql = `${col} > ${one(v)}`;
			break;
		case "gte":
			sql = `${col} >= ${one(v)}`;
			break;
		case "lt":
			sql = `${col} < ${one(v)}`;
			break;
		case "lte":
			sql = `${col} <= ${one(v)}`;
			break;
		case "between":
			if (!Array.isArray(v) || v.length !== 2) throw bad();
			sql = `${col} BETWEEN ${one(v[0])} AND ${one(v[1])}`;
			break;
		default: {
			// contains | starts_with (already checked against OPS): bound ILIKE pattern, metacharacters escaped.
			const s = str(v, LIMITS.q);
			if (!s) throw bad();
			sql = `${col} ILIKE ${bind(op === "contains" ? `%${likeEscape(s)}%` : `${likeEscape(s)}%`)} ESCAPE '\\'`;
			cv = s;
		}
	}
	return { sql, canon: { p: col, op, v: cv } };
}
function group(
	cx: Cx,
	n: unknown,
	depth: number,
	count: { c: number },
): Node {
	if (!isObj(n) || depth > LIMITS.depth) throw bad();
	const keys = Object.keys(n);
	if (keys.length === 1 && (keys[0] === "and" || keys[0] === "or")) {
		const list = n[keys[0]];
		if (!Array.isArray(list) || !list.length || list.length > LIMITS.conditions)
			throw bad();
		const parts = list.map((c) => group(cx, c, depth + 1, count));
		return {
			sql: `(${parts.map((p) => p.sql).join(keys[0] === "and" ? " AND " : " OR ")})`,
			canon: { [keys[0]]: parts.map((p) => p.canon) },
		};
	}
	if (++count.c > LIMITS.conditions) throw bad();
	return condition(cx, n);
}
// `expr` = the SQL expression of a custom sort key (set by planList once its bound parameters are known); system keys use `name`.
export type Key = { name: string; fd: Field; desc: boolean; expr?: string };
export type Plan = {
	legacy: boolean;
	limit: number;
	sql: string;
	params: unknown[];
	countSql: string;
	countParams: unknown[];
	keys: Key[];
	fp: string;
	expand: string[];
	includeTotal: boolean;
};
const ex = (k: Key) => k.expr ?? k.name;
// Cursor key values travel as exact text (timestamps with microseconds; a JS Date would truncate them).
const keyExpr = (k: Key) =>
	k.fd.t === "ts"
		? `to_char(${ex(k)} AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`
		: k.fd.t === "text" || k.fd.t === "date" || k.fd.t === "dtm"
			? ex(k)
			: `${ex(k)}::text`;
function cursorValue(fd: Field, v: unknown): string | null {
	if (v === null) {
		if (fd.nullable) return null;
		throw bad();
	}
	const s = str(v, 2000);
	if (fd.t === "uuid" && UUID.test(s)) return s;
	if (fd.t === "text" && (!fd.enum || fd.enum.includes(s))) return s;
	if (fd.t === "int" && /^-?\d{1,10}$/.test(s) && Math.abs(Number(s)) <= INT4)
		return s;
	if (
		fd.t === "big" &&
		/^-?\d{1,19}$/.test(s) &&
		BigInt(s) >= -(2n ** 63n) &&
		BigInt(s) < 2n ** 63n
	)
		return s;
	if (
		fd.t === "ts" &&
		/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{6}Z$/.test(s) &&
		Number.isFinite(Date.parse(s))
	)
		return s;
	// custom keys: numeric text (|v| <= 1e15, any scale), real dates, UTC instants with milliseconds, option positions
	if (fd.t === "num" && /^-?\d{1,16}(\.\d{1,400})?$/.test(s)) return s;
	if (fd.t === "date" && isoDate(s) === s) return s;
	if (
		fd.t === "dtm" &&
		/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(s) &&
		isoDateTime(s) === s
	)
		return s;
	if (fd.t === "pos" && /^[1-9]\d{0,2}$/.test(s)) return s;
	throw bad();
}
export function encodeCursor(
	row: Record<string, unknown>,
	keys: Key[],
	fp: string,
) {
	return Buffer.from(
		JSON.stringify({
			v: keys.map((_, i) => row[`_k${i}`] ?? null),
			id: row.id,
			fp,
		}),
	).toString("base64url");
}
function decodeCursor(raw: string) {
	let o: unknown;
	try {
		if (raw.length > 2048 || !/^[A-Za-z0-9_-]+$/.test(raw)) throw bad();
		o = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
	} catch {
		throw bad();
	}
	if (
		!isObj(o) ||
		Object.keys(o).sort().join() !== "fp,id,v" ||
		!Array.isArray(o.v) ||
		typeof o.fp !== "string" ||
		!/^[0-9a-f]{16}$/.test(o.fp) ||
		typeof o.id !== "string" ||
		!UUID.test(o.id)
	)
		throw bad();
	return { fp: o.fp, id: o.id, raw: o.v as unknown[] };
}
// Keyset predicate "strictly after the cursor" for ORDER BY k1 [,k2],id with the ids' direction = idDesc.
// P1b B0 F2: all keys (and the id tiebreak) in one direction and none nullable -> a single row-value comparison
// `(k1,..,id) > ($a,..,$id)`, which a btree serves as an index condition (the OR-chain is only a filter: 3-4 s at 1M rows).
// Kept as the OR-chain (equal on earlier keys AND strictly after on key i; `id` last) where a row value cannot express the
// order: mixed directions, and nullable keys. Null placement: system nullable keys are NULLS LAST (a NULL cursor value has nothing
// after it); custom keys use PostgreSQL's default (B0 F3: the order an index serves): ASC nulls last, DESC nulls FIRST, so a NULL
// cursor value on a DESC custom key is followed by every non-null row. B4: a single custom key still gets a row-value form.
const nullsFirst = (k: Key) => !!k.fd.custom && k.desc;
export function keyset(
	keys: Key[],
	idDesc: boolean,
	vals: (string | null)[],
	id: string,
	bind: Bind,
): string {
	if (keys.every((k) => k.desc === idDesc && !k.fd.nullable)) {
		const lhs = [...keys.map(ex), "id"].join(",");
		const rhs = [
			...keys.map((k, i) => `${bind(vals[i])}::${CAST[k.fd.t]}`),
			`${bind(id)}::uuid`,
		].join(",");
		return `((${lhs}) ${idDesc ? "<" : ">"} (${rhs}))`;
	}
	if (keys.length === 1 && keys[0].fd.custom) {
		const k = keys[0],
			e = ex(k),
			v = vals[0];
		if (v === null)
			return k.desc
				? `((${e} IS NULL AND id < ${bind(id)}::uuid) OR ${e} IS NOT NULL)`
				: `(${e} IS NULL AND id > ${bind(id)}::uuid)`;
		const row = `(${e},id) ${k.desc ? "<" : ">"} (${bind(v)}::${CAST[k.fd.t]},${bind(id)}::uuid)`;
		return k.desc ? `(${row})` : `(${row} OR ${e} IS NULL)`;
	}
	const eq = (k: Key, v: string | null) =>
		v === null
			? `${ex(k)} IS NULL`
			: `${ex(k)} = ${bind(v)}::${CAST[k.fd.t]}`;
	const chain: string[] = [];
	for (let i = 0; i <= keys.length; i++) {
		// A NULL cursor value has nothing after it when nulls sort last: skip before binding anything.
		if (i < keys.length && vals[i] === null && !nullsFirst(keys[i])) continue;
		const pre = keys.slice(0, i).map((k, j) => eq(k, vals[j]));
		let after: string;
		if (i === keys.length)
			after = `id ${idDesc ? "<" : ">"} ${bind(id)}::uuid`;
		else {
			const k = keys[i],
				e = ex(k);
			after =
				vals[i] === null
					? `${e} IS NOT NULL`
					: nullsFirst(k)
						? `${e} < ${bind(vals[i])}::${CAST[k.fd.t]}`
						: `(${e} ${k.desc ? "<" : ">"} ${bind(vals[i])}::${CAST[k.fd.t]}${k.fd.nullable ? ` OR ${e} IS NULL` : ""})`;
		}
		chain.push(`(${[...pre, after].join(" AND ")})`);
	}
	return `(${chain.join(" OR ")})`;
}
export function planList(
	kind: Kind,
	query: URLSearchParams,
	tenant: string,
	scope: { mode: string; actor: string },
	props?: PropRegistry,
): Plan {
	const params: unknown[] = [tenant];
	const bind: Bind = (v) => {
		params.push(v);
		return `$${params.length}`;
	};
	// Custom keys / option arrays are bound once each and reused (a bound key is never SQL text).
	const kps = new Map<string, string>(),
		opts = new Map<string, string>();
	const cx: Cx = {
		kind,
		bind,
		props,
		used: new Set(),
		kp: (key) => {
			const have = kps.get(key);
			if (have) return have;
			const s = `${bind(key)}::text`;
			kps.set(key, s);
			return s;
		},
		opt: (d) => {
			const have = opts.get(d.key);
			if (have) return have;
			const s = `${bind(d.options)}::text[]`;
			opts.set(d.key, s);
			return s;
		},
	};
	if (scope.mode !== "tenant" && scope.mode !== "assigned")
		throw new Fault(403, "FORBIDDEN");
	const where: string[] = ["tenant_id=$1"];
	const actorParam = scope.mode === "assigned" ? bind(scope.actor) : null;
	if (actorParam) where.push(`owner_id=${actorParam}::uuid`);
	if (kind === "contact") where.push("merged_into_id IS NULL");
	const due = query.get("due");
	if (kind === "task" && due === "overdue")
		where.push("status='open' AND due_at<now()");
	if (kind === "task" && due === "today")
		where.push("status='open' AND due_at<now()+interval '24 hours'");
	// Fold both sides in SQL, preserving bounded literal patterns and raw-q fingerprint semantics.
	const qRaw = query.get("q");
	const q = qRaw === null ? "" : str(qRaw, LIMITS.q).trim();
	if (q) {
		const pattern = `crm.normalize_search(${bind(`%${likeEscape(q)}%`)}::text)`;
		where.push(
			`(search_normalized LIKE ${pattern} ESCAPE '\\' OR custom_search LIKE ${pattern} ESCAPE '\\'${kind === "contact" ? "" : ` OR related_search LIKE ${pattern} ESCAPE '\\'`})`,
		);
	}
	let canon: unknown = null;
	const fRaw = query.get("filter");
	if (fRaw) {
		if (Buffer.byteLength(fRaw) > LIMITS.bytes) throw bad();
		let tree: unknown;
		try {
			tree = JSON.parse(fRaw);
		} catch {
			throw bad();
		}
		const node = group(cx, tree, 1, { c: 0 });
		where.push(node.sql);
		canon = node.canon;
	}
	// sort: whitelisted fields, max 2 keys, implicit `id` tiebreak in the direction of the first key.
	const sRaw = query.get("sort");
	const modern = q !== "" || canon !== null || !!sRaw;
	let keys: Key[] = [];
	if (sRaw) {
		const parts = str(sRaw, 100).split(",");
		if (parts.length > 2) throw bad();
		keys = parts.map((p) => {
			const desc = p.startsWith("-"),
				name = desc ? p.slice(1) : p;
			const fd = resolve(cx, name, "sort");
			if (!fd.sort) throw bad();
			return { name, fd, desc };
		});
		if (keys.length === 2 && keys[0].name === keys[1].name) throw bad();
	} else if (modern)
		keys = [
			{
				name: "created_at",
				fd: FIELDS[kind].get("created_at") as Field,
				desc: true,
			},
		];
	const idDesc = keys.length ? keys[0].desc : false;
	const fp = createHash("sha256")
		.update(
			JSON.stringify([
				kind,
				canon,
				keys.map((k) => (k.desc ? "-" : "") + k.name),
				q,
				due,
				// schema_rev only when a custom property is involved: static fingerprints (and their live cursors) are unchanged
				...(cx.used.size && props ? [props.rev] : []),
			]),
		)
		.digest("hex")
		.slice(0, 16);
	const lRaw = query.get("limit");
	let limit = LIMITS.defaultLimit;
	if (lRaw !== null) {
		if (!/^\d{1,4}$/.test(lRaw) || +lRaw < 1 || +lRaw > LIMITS.limit)
			throw bad();
		limit = +lRaw;
	}
	const itRaw = query.get("include_total");
	if (itRaw !== null && itRaw !== "0" && itRaw !== "1") throw bad();
	const exRaw = query.get("expand");
	const expand = exRaw ? exRaw.split(",") : [];
	const allowed = kind === "contact" ? ["owner"] : ["contact", "owner"];
	if (expand.some((e, i) => !allowed.includes(e) || expand.indexOf(e) !== i))
		throw bad();
	// Scalar lookups stay inside the tenant and the related record's assigned scope.
	// Compute only requested names; keep the legacy FROM/projection exactly unchanged.
	const derived: string[] = [];
	const assigned = (alias: string) =>
		actorParam ? ` AND ${alias}.owner_id=${actorParam}::uuid` : "";
	if (
		keys.some((k) => k.name === "contact_name") ||
		(q && (kind === "lead" || kind === "deal"))
	) {
		const visible = `c.tenant_id=b.tenant_id AND c.id=b.contact_id AND c.merged_into_id IS NULL${assigned("c")}`;
		if (keys.some((k) => k.name === "contact_name"))
			derived.push(
				`(SELECT c.display_name FROM crm.contact c WHERE ${visible}) AS contact_name`,
			);
		if (q)
			derived.push(
				`(SELECT c.search_normalized FROM crm.contact c WHERE ${visible}) AS related_search`,
			);
	}
	if (q && kind === "task")
		derived.push(
			`(SELECT concat_ws(' ',d.search_normalized,l.search_normalized) FROM crm.deal d LEFT JOIN crm.lead l ON l.tenant_id=d.tenant_id AND l.id=d.lead_id${assigned("l")} WHERE d.tenant_id=b.tenant_id AND d.id=b.deal_id${assigned("d")}) AS related_search`,
		);
	if (keys.some((k) => k.name === "owner_name"))
		derived.push(
			"(SELECT n.name FROM crm.owner_names(ARRAY[b.owner_id]) n) AS owner_name",
		);
	if (keys.some((k) => k.name === "stage"))
		derived.push(
			"(SELECT s.position FROM crm.stage s WHERE s.tenant_id=b.tenant_id AND s.pipeline_id=b.pipeline_id AND s.id=b.stage_id) AS stage",
		);
	const from = derived.length
		? `(SELECT b.*,${derived.join(",")} FROM crm.${kind} b) records`
		: `crm.${kind}`;
	const base = where.join(" AND ");
	const countParams = params.slice();
	// Sort expressions bind after the count snapshot: the count query never references them.
	for (const k of keys) if (k.fd.custom) k.expr = sortExpr(cx, k.fd.custom);
	// Keyset predicate: OR-chain of (equal on earlier keys AND strictly after on key i); `id` is the last key.
	const cRaw = query.get("cursor");
	const clauses: string[] = [];
	if (cRaw) {
		if (UUID.test(cRaw)) {
			if (modern) throw new Fault(422, "CURSOR_STALE");
			clauses.push(`id > ${bind(cRaw.toLowerCase())}::uuid`);
		} else {
			const c = decodeCursor(cRaw);
			if (!modern || c.fp !== fp) throw new Fault(422, "CURSOR_STALE");
			if (c.raw.length !== keys.length) throw bad();
			const vals = keys.map((k, i) => cursorValue(k.fd, c.raw[i]));
			clauses.push(keyset(keys, idDesc, vals, c.id.toLowerCase(), bind));
		}
	}
	const dir = (d: boolean) => (d ? "DESC" : "ASC");
	// NULLS LAST only where a column can be NULL, so NOT NULL sorts still match the (col DESC, id DESC) indexes.
	const order = [
		...keys.map(
			(k) =>
				`${ex(k)} ${dir(k.desc)}${k.fd.nullable && !k.fd.custom ? " NULLS LAST" : ""}`,
		),
		`id ${dir(idDesc)}`,
	].join(",");
	const extra = keys.map((k, i) => `${keyExpr(k)} AS _k${i}`);
	return {
		legacy: !modern,
		limit,
		sql: `SELECT ${[projection(kind), ...extra].join(",")} FROM ${from} WHERE ${[base, ...clauses].join(" AND ")} ORDER BY ${order} LIMIT ${limit + 1}`,
		params,
		countSql: `SELECT count(*)::int n FROM (SELECT 1 FROM ${from} WHERE ${base} LIMIT ${LIMITS.total + 1}) c`,
		countParams,
		keys,
		fp,
		expand,
		includeTotal: itRaw === "1",
	};
}
