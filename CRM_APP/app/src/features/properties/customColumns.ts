// P1b B4 UI model: custom fields as list columns, typed filters and sort (server: `props=`, `filter`, `sort`). Pure helpers:
// no React, no fetch. The server stays the authority; these only build what it accepts (src/listquery.ts PROP_OPS / PROP_T).
import { cond, type ServerCond } from "../../ui/data-grid/serverQuery.ts";
import type { PropertyDef, PropType } from "./model.ts";
import { localInputToIso, parseMinor, parseNumber } from "./values.ts";

/** Grid column id of a custom field. System columns never contain a colon, so ids cannot collide. */
export const CF_PREFIX = "cf:";
export const cfId = (key: string): string => `${CF_PREFIX}${key}`;
export const isCfId = (id: string): boolean => id.startsWith(CF_PREFIX);
export const keyOfCfId = (id: string): string => id.slice(CF_PREFIX.length);

/** Server limit of `props=` keys on one list request. */
export const MAX_COLUMNS = 20;
/** Server limit of conditions in one filter (shared with the screen's own conditions). */
export const MAX_FILTERS = 8;

/** Custom, active properties the caller can read (the schema endpoint already omits sensitive ones without permission). */
export const listable = (properties: readonly PropertyDef[]): PropertyDef[] =>
	properties.filter((p) => !p.is_system && !p.archived).sort((a, b) => a.position - b.position || a.key.localeCompare(b.key));

/** Types the server can sort by (src/listquery.ts PROP_T). */
const SORTABLE: ReadonlySet<PropType> = new Set(["text", "number", "currency", "date", "datetime", "single_select"]);
export const isSortable = (p: PropertyDef): boolean => SORTABLE.has(p.type);

// ---- operators (mirror PROP_OPS of the server, narrowed to what the UI offers) ----------------------------------------

export type Op =
	| "eq"
	| "neq"
	| "contains"
	| "starts_with"
	| "gt"
	| "gte"
	| "lt"
	| "lte"
	| "between"
	| "in"
	| "has_any"
	| "has_all"
	| "is"
	| "is_null"
	| "not_null";

const NULLS: Op[] = ["is_null", "not_null"];
const ORDERED: Op[] = ["eq", "neq", "gt", "gte", "lt", "lte", "between"];
const OPS: Record<PropType, Op[]> = {
	text: ["contains", "starts_with", "eq", "neq", ...NULLS],
	long_text: ["contains", ...NULLS],
	number: [...ORDERED, ...NULLS],
	currency: [...ORDERED, ...NULLS],
	date: [...ORDERED, ...NULLS],
	datetime: ["gt", "gte", "lt", "lte", "between", ...NULLS],
	single_select: ["eq", "neq", "in", ...NULLS],
	multi_select: ["has_any", "has_all", ...NULLS],
	checkbox: ["is", ...NULLS],
	user: ["eq", "neq", ...NULLS],
};
export const opsOf = (p: PropertyDef): Op[] => OPS[p.type];
export const defaultOp = (p: PropertyDef): Op => OPS[p.type][0] ?? "is_null";

export type ValueShape = "none" | "one" | "two" | "list" | "bool";
export function shapeOf(op: Op): ValueShape {
	if (op === "is_null" || op === "not_null") return "none";
	if (op === "between") return "two";
	if (op === "in" || op === "has_any" || op === "has_all") return "list";
	if (op === "is") return "bool";
	return "one";
}

// ---- draft -> server condition ----------------------------------------------------------------------------------------

/** One editable filter row. `a`/`b` are control values (text, `YYYY-MM-DD`, local datetime, option value, user id, "true"/"false"). */
export type FilterDraft = { id: string; key: string; op: Op; a: string; b: string; list: string[] };

export const newDraft = (p: PropertyDef, id: string): FilterDraft => ({ id, key: p.key, op: defaultOp(p), a: p.type === "checkbox" ? "true" : "", b: "", list: [] });

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const NUM_MAX = 1e15;

/** One typed value for the property, or null while the control is empty/invalid (the row is then not applied). */
function scalar(p: PropertyDef, raw: string): string | number | null {
	const s = raw.trim();
	if (s === "") return null;
	switch (p.type) {
		case "number": {
			const n = parseNumber(s);
			return n !== null && Math.abs(n) <= NUM_MAX ? n : null;
		}
		case "currency": {
			const m = parseMinor(s, p.currency ?? "EGP");
			return m.ok && Math.abs(m.minor) <= NUM_MAX ? m.minor : null;
		}
		case "date":
			return YMD.test(s) ? s : null;
		case "datetime":
			return localInputToIso(s);
		case "text":
		case "long_text":
			return s.length <= 100 ? s.normalize("NFC") : null;
		default:
			return s;
	}
}

/** The server condition of a row, or null when the row is incomplete or its operator is not valid for the property. */
export function toCondition(p: PropertyDef, d: FilterDraft): ServerCond | null {
	if (d.key !== p.key || !OPS[p.type].includes(d.op)) return null;
	switch (shapeOf(d.op)) {
		case "none":
			return cond(p.key, d.op);
		case "bool":
			return d.a === "true" || d.a === "false" ? cond(p.key, "is", d.a === "true") : null;
		case "list":
			return d.list.length > 0 ? cond(p.key, d.op, [...d.list]) : null;
		case "two": {
			const lo = scalar(p, d.a);
			const hi = scalar(p, d.b);
			return lo === null || hi === null ? null : cond(p.key, "between", [lo, hi]);
		}
		case "one": {
			const v = scalar(p, d.a);
			return v === null ? null : cond(p.key, d.op, v);
		}
	}
}

/** Conditions of every complete row whose property still exists; the rest are ignored (never sent). */
export function toConditions(defs: ReadonlyMap<string, PropertyDef>, drafts: readonly FilterDraft[]): ServerCond[] {
	const out: ServerCond[] = [];
	for (const d of drafts) {
		const p = defs.get(d.key);
		const c = p ? toCondition(p, d) : null;
		if (c !== null) out.push(c);
		if (out.length === MAX_FILTERS) break;
	}
	return out;
}

/** Which key the row's list control offers (select options; the server only accepts known option values). */
export const listChoices = (p: PropertyDef): Array<{ value: string; archived: boolean }> =>
	[...p.options].sort((a, b) => a.position - b.position || a.value.localeCompare(b.value)).map((o) => ({ value: o.value, archived: o.archived }));

// ---- selected columns -------------------------------------------------------------------------------------------------

/** `props=` value: the shown keys that still exist, in schema order, at most MAX_COLUMNS. undefined = none. */
export function propsParam(shown: readonly string[], defs: ReadonlyMap<string, PropertyDef>): string | undefined {
	const keys = shown.filter((k) => defs.has(k));
	return keys.length === 0 ? undefined : keys.slice(0, MAX_COLUMNS).join(",");
}

/** Toggle a column; a new one is refused (unchanged) once MAX_COLUMNS are shown. */
export function toggleShown(shown: readonly string[], key: string): string[] {
	if (shown.includes(key)) return shown.filter((k) => k !== key);
	return shown.length >= MAX_COLUMNS ? [...shown] : [...shown, key];
}

export const COLUMNS_KEY_PREFIX = "sy.cols.v1";
export function columnsKey(tenantId: string, actor: string, gridId: string): string {
	return `${COLUMNS_KEY_PREFIX}:${encodeURIComponent(tenantId)}:${encodeURIComponent(actor)}:${encodeURIComponent(gridId)}`;
}

/** Stored selection: damaged or foreign data reads as "none shown". Never throws. */
export function parseShown(raw: string | null): string[] {
	if (!raw) return [];
	try {
		const data: unknown = JSON.parse(raw);
		if (!Array.isArray(data)) return [];
		const out: string[] = [];
		for (const k of data) if (typeof k === "string" && /^[a-z][a-z0-9_]{0,62}$/.test(k) && !out.includes(k)) out.push(k);
		return out.slice(0, MAX_COLUMNS);
	} catch {
		return [];
	}
}
