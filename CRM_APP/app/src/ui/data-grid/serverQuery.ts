// Pure translation of a grid view (search text, column filters, sort) into the server list query
// (P1A_CONTRACTS S4: `q`, `filter` JSON grammar, `sort`). No DOM, no React, no I/O.
import type { FilterSpec, SortSpec } from "./gridModel.ts";

export type ServerCond = { p: string; op: string; v?: unknown };
export type ServerNode = ServerCond | { and: ServerNode[] } | { or: ServerNode[] };

/** Per-grid mapping from column ids to server fields. A column that is absent here is not server-queryable. */
export type ServerSpec = {
	/** Column id -> sortable server field (`FIELDS` whitelist). */
	sort: Readonly<Record<string, string>>;
	/** Order used when the grid has no (mappable) sort, e.g. "-created_at". Always sent: the new path has stable keyset order. */
	defaultSort: string;
	/** Column id -> translator of that column's grid filter. Return null to drop a filter that cannot be expressed. */
	filters?: Readonly<Record<string, (f: FilterSpec) => ServerNode | null>>;
};

export type ServerQueryInput = {
	query: string;
	filters: readonly FilterSpec[];
	sorts: readonly SortSpec[];
};

/** The query string parameters that identify one list query (page size, cursor and expand are not part of it). */
export type ListParams = { q?: string; filter?: string; sort: string; due?: string };

export const MAX_Q = 100;
export const MAX_SORT_KEYS = 2;
export const MAX_FILTER_BYTES = 4096;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);
export const cond = (p: string, op: string, v?: unknown): ServerCond =>
	v === undefined ? { p, op } : { p, op, v };

/** `eq` on one column; other grid ops map to their server twin (`in`, `gte`, `lte`). */
export function defaultFilter(field: string): (f: FilterSpec) => ServerNode | null {
	return (f) => {
		if (f.op === "eq") return cond(field, "eq", f.value);
		if (f.op === "in") return f.values.length === 0 ? null : cond(field, "in", [...f.values]);
		return cond(field, f.op, f.value);
	};
}

/** Owner filter: an assignee id; a legacy saved view holds the display name, which is resolved through `byName`. */
export function ownerFilter(byName: ReadonlyMap<string, string>): (f: FilterSpec) => ServerNode | null {
	return (f) => {
		if (f.op !== "eq") return null;
		const v = String(f.value);
		if (isUuid(v)) return cond("owner_id", "eq", v.toLowerCase());
		const id = byName.get(v);
		return id === undefined ? null : cond("owner_id", "eq", id);
	};
}

export function andNodes(nodes: readonly ServerNode[]): ServerNode | null {
	if (nodes.length === 0) return null;
	if (nodes.length === 1) return nodes[0] ?? null;
	return { and: [...nodes] };
}

/**
 * Grid view -> list params. `extra` are conditions the screen itself adds (built-in tabs such as "My leads").
 * Search text is trimmed and bounded (the server answers 422 above 100 chars); sorts the spec cannot express are
 * ignored; at most 2 distinct sort keys are sent (server limit).
 */
export function buildListParams(
	spec: ServerSpec,
	input: ServerQueryInput,
	extra: readonly ServerNode[] = [],
	due?: string,
): ListParams {
	const nodes: ServerNode[] = [...extra];
	for (const f of input.filters) {
		const node = spec.filters?.[f.key]?.(f) ?? null;
		if (node !== null) nodes.push(node);
	}
	const fields: string[] = [];
	for (const s of input.sorts) {
		const field = spec.sort[s.key];
		if (field === undefined || fields.some((x) => x.replace(/^-/, "") === field)) continue;
		fields.push(s.dir === "desc" ? `-${field}` : field);
		if (fields.length === MAX_SORT_KEYS) break;
	}
	const out: ListParams = { sort: fields.length > 0 ? fields.join(",") : spec.defaultSort };
	const q = input.query.trim().slice(0, MAX_Q).trim();
	if (q !== "") out.q = q;
	const root = andNodes(nodes);
	if (root !== null) out.filter = JSON.stringify(root);
	if (due !== undefined) out.due = due;
	return out;
}

/** Stable identity of a query: a change resets the list (and drops any in-flight response). */
export const paramsKey = (p: ListParams, expand: string | undefined): string =>
	JSON.stringify([p.q ?? null, p.filter ?? null, p.sort, p.due ?? null, expand ?? null]);

/** `eq` on an enum column; a value outside `allowed` (an old saved view) is dropped instead of causing a 422. */
export function enumFilter(field: string, allowed: readonly string[]): (f: FilterSpec) => ServerNode | null {
	return (f) => (f.op === "eq" && allowed.includes(String(f.value)) ? cond(field, "eq", String(f.value)) : null);
}

/** A condition no row satisfies (e.g. "My leads" when the session has no actor). */
export const NOTHING: ServerCond = { p: "id", op: "is_null" };
