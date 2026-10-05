// Pure data-grid model (D3: client-side search/filter/sort/page over the loaded cursor pages). No DOM, no React.
// Record-detail selection (activeId) and bulk selection (selection) are separate on purpose (CRM_DATA_WORKSPACE).

export type Cell = string | number | boolean | null | undefined;
export type SortDir = "asc" | "desc";
export type SortSpec = { key: string; dir: SortDir };
export type Density = "comfortable" | "compact";
export type FilterValue = string | number | boolean;
export type FilterSpec =
	| { key: string; op: "eq"; value: FilterValue }
	| { key: string; op: "in"; values: readonly FilterValue[] }
	| { key: string; op: "gte" | "lte"; value: number };

/** What the model needs from a column. DataGrid columns extend this with presentation. */
export type ModelColumn<T> = {
	id: string;
	value: (row: T) => Cell;
	/** Included in text search (default true). */
	searchable?: boolean;
	/** Always visible; cannot be hidden from the column chooser. */
	hideable?: boolean;
};

export const PAGE_SIZES = [10, 25, 50, 100] as const;

// ---- text search -----------------------------------------------------------------------------------------

/**
 * Case-, diacritic- and digit-script-insensitive text. NFD + dropping combining marks removes Latin accents and
 * Arabic harakat, and also folds alef-with-hamza/madda (U+0622/0623/0625) to bare alef (canonical decompositions).
 * Tatweel is dropped; Arabic-Indic digits map to ASCII. The handoff specifies no further Arabic folding
 * (yaa/alef-maqsura, taa-marbuta are NOT merged).
 */
export function normalizeText(input: string): string {
	return input
		.normalize("NFD")
		.replace(/\p{M}/gu, "")
		.replace(/ـ/g, "")
		.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
		.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
		.toLowerCase();
}

function cellText(v: Cell): string {
	return v === null || v === undefined ? "" : String(v);
}

/** Every whitespace-separated token must appear in some searchable column (AND). */
export function searchRows<T>(rows: readonly T[], cols: readonly ModelColumn<T>[], query: string): T[] {
	const tokens = normalizeText(query).split(/\s+/).filter(Boolean);
	if (tokens.length === 0) return [...rows];
	const searchable = cols.filter((c) => c.searchable !== false);
	return rows.filter((row) => {
		const hay = normalizeText(searchable.map((c) => cellText(c.value(row))).join(" "));
		return tokens.every((tok) => hay.includes(tok));
	});
}

// ---- filters ---------------------------------------------------------------------------------------------

function matchesFilter(cell: Cell, f: FilterSpec): boolean {
	if (f.op === "eq") return cell !== null && cell !== undefined && String(cell) === String(f.value);
	if (f.op === "in") return cell !== null && cell !== undefined && f.values.some((v) => String(v) === String(cell));
	const n = typeof cell === "number" ? cell : typeof cell === "string" && cell.trim() !== "" ? Number(cell) : Number.NaN;
	if (Number.isNaN(n)) return false;
	return f.op === "gte" ? n >= f.value : n <= f.value;
}

/** All filters AND together. Filters on unknown columns are ignored (a saved view may outlive a column). */
export function applyFilters<T>(rows: readonly T[], cols: readonly ModelColumn<T>[], filters: readonly FilterSpec[]): T[] {
	const active = filters.flatMap((f) => {
		const col = cols.find((c) => c.id === f.key);
		return col ? [{ f, col }] : [];
	});
	if (active.length === 0) return [...rows];
	return rows.filter((row) => active.every(({ f, col }) => matchesFilter(col.value(row), f)));
}

/** Set (or with value null remove) the single `eq` filter of a column. */
export function setEqFilter(filters: readonly FilterSpec[], key: string, value: FilterValue | null): FilterSpec[] {
	const rest = filters.filter((f) => f.key !== key);
	return value === null ? rest : [...rest, { key, op: "eq", value }];
}

// ---- sorting ---------------------------------------------------------------------------------------------

function isEmpty(v: Cell): boolean {
	return v === null || v === undefined || v === "";
}

function compareCells(a: Cell, b: Cell, collator: Intl.Collator): number {
	if (typeof a === "number" && typeof b === "number") return a - b;
	if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
	return collator.compare(String(a), String(b));
}

/** Stable multi-key sort. Empty values always sort last, regardless of direction. Never mutates the input. */
export function sortRows<T>(
	rows: readonly T[],
	cols: readonly ModelColumn<T>[],
	sorts: readonly SortSpec[],
	locale = "en",
): T[] {
	const keys = sorts.flatMap((s) => {
		const col = cols.find((c) => c.id === s.key);
		return col ? [{ col, mul: s.dir === "asc" ? 1 : -1 }] : [];
	});
	if (keys.length === 0) return [...rows];
	const collator = new Intl.Collator(locale, { numeric: true, sensitivity: "base" });
	return rows
		.map((row, index) => ({ row, index }))
		.sort((x, y) => {
			for (const { col, mul } of keys) {
				const a = col.value(x.row);
				const b = col.value(y.row);
				const ea = isEmpty(a);
				const eb = isEmpty(b);
				if (ea || eb) {
					if (ea && eb) continue;
					return ea ? 1 : -1;
				}
				const c = compareCells(a, b, collator);
				if (c !== 0) return c * mul;
			}
			return x.index - y.index; // stable
		})
		.map((d) => d.row);
}

/**
 * Header click: none -> asc -> desc -> none. Plain click replaces the whole sort; additive (shift) edits
 * only that key and keeps the others as secondary keys.
 */
export function cycleSort(sorts: readonly SortSpec[], key: string, additive = false): SortSpec[] {
	const cur = sorts.find((s) => s.key === key);
	const next: SortSpec | null = !cur ? { key, dir: "asc" } : cur.dir === "asc" ? { key, dir: "desc" } : null;
	if (!additive) return next ? [next] : [];
	if (!cur) return [...sorts, { key, dir: "asc" }];
	return next ? sorts.map((s) => (s.key === key ? next : s)) : sorts.filter((s) => s.key !== key);
}

/** aria-sort: only the primary key announces a direction (ARIA allows one sorted column); others are "none". */
export function ariaSortOf(sorts: readonly SortSpec[], key: string): "ascending" | "descending" | "none" {
	const first = sorts[0];
	if (!first || first.key !== key) return "none";
	return first.dir === "asc" ? "ascending" : "descending";
}

// ---- columns, paging, selection ---------------------------------------------------------------------------

export function visibleColumns<C extends ModelColumn<never>>(cols: readonly C[], hidden: readonly string[]): C[] {
	return cols.filter((c) => c.hideable === false || !hidden.includes(c.id));
}

export function toggleHidden(hidden: readonly string[], id: string): string[] {
	return hidden.includes(id) ? hidden.filter((h) => h !== id) : [...hidden, id];
}

export type PageInfo = { page: number; pageCount: number; pageSize: number; total: number; start: number; end: number };

/** page is 1-based and clamped into range; start/end are slice indexes. */
export function paginate(total: number, page: number, pageSize: number): PageInfo {
	const size = Math.max(1, Math.floor(pageSize));
	const pageCount = Math.max(1, Math.ceil(total / size));
	const p = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
	const start = (p - 1) * size;
	return { page: p, pageCount, pageSize: size, total, start, end: Math.min(total, start + size) };
}

export type Selection = ReadonlySet<string>;
export const NO_SELECTION: Selection = new Set<string>();

export function toggleId(sel: Selection, id: string): Selection {
	const next = new Set(sel);
	if (!next.delete(id)) next.add(id);
	return next;
}

export function pageSelectionState(sel: Selection, pageIds: readonly string[]): "none" | "some" | "all" {
	if (pageIds.length === 0) return "none";
	const n = pageIds.filter((id) => sel.has(id)).length;
	return n === 0 ? "none" : n === pageIds.length ? "all" : "some";
}

/** Select-all for the current page: all selected -> unselect the page; otherwise select the whole page. */
export function togglePageSelection(sel: Selection, pageIds: readonly string[]): Selection {
	const next = new Set(sel);
	if (pageSelectionState(sel, pageIds) === "all") for (const id of pageIds) next.delete(id);
	else for (const id of pageIds) next.add(id);
	return next;
}

/** Drop selected ids that are no longer loaded. Returns the same instance when nothing changed. */
export function pruneSelection(sel: Selection, validIds: Iterable<string>): Selection {
	const valid = new Set(validIds);
	const kept = [...sel].filter((id) => valid.has(id));
	return kept.length === sel.size ? sel : new Set(kept);
}

// ---- view + grid state ------------------------------------------------------------------------------------

export type ViewState = {
	query: string;
	filters: readonly FilterSpec[];
	sorts: readonly SortSpec[];
	hidden: readonly string[];
	density: Density;
	pageSize: number;
};

export const DEFAULT_VIEW: ViewState = {
	query: "",
	filters: [],
	sorts: [],
	hidden: [],
	density: "comfortable",
	pageSize: 10,
};

export type GridState = ViewState & {
	page: number;
	/** Bulk selection: explicit checkboxes only. */
	selection: Selection;
	/** Record detail (master-detail) row. Never implies bulk selection. */
	activeId: string | null;
};

export const initialGridState = (view: ViewState = DEFAULT_VIEW): GridState => ({
	...view,
	page: 1,
	selection: NO_SELECTION,
	activeId: null,
});

export type GridAction =
	| { type: "query"; query: string }
	| { type: "filters"; filters: readonly FilterSpec[] }
	| { type: "clearFilters" }
	| { type: "sort"; key: string; additive?: boolean }
	| { type: "toggleColumn"; id: string }
	| { type: "density"; density: Density }
	| { type: "pageSize"; size: number }
	| { type: "page"; page: number }
	| { type: "toggleRow"; id: string }
	| { type: "togglePage"; pageIds: readonly string[] }
	| { type: "clearSelection" }
	| { type: "open"; id: string | null }
	| { type: "prune"; validIds: readonly string[] }
	| { type: "applyView"; view: ViewState };

export function gridReducer(s: GridState, a: GridAction): GridState {
	switch (a.type) {
		case "query":
			return { ...s, query: a.query, page: 1 };
		case "filters":
			return { ...s, filters: a.filters, page: 1 };
		case "clearFilters":
			return { ...s, filters: [], query: "", page: 1 };
		case "sort":
			return { ...s, sorts: cycleSort(s.sorts, a.key, a.additive ?? false), page: 1 };
		case "toggleColumn":
			return { ...s, hidden: toggleHidden(s.hidden, a.id) };
		case "density":
			return { ...s, density: a.density };
		case "pageSize":
			return { ...s, pageSize: a.size, page: 1 };
		case "page":
			return { ...s, page: a.page };
		case "toggleRow":
			return { ...s, selection: toggleId(s.selection, a.id) }; // activeId untouched
		case "togglePage":
			return { ...s, selection: togglePageSelection(s.selection, a.pageIds) };
		case "clearSelection":
			return s.selection.size === 0 ? s : { ...s, selection: NO_SELECTION };
		case "open":
			return { ...s, activeId: a.id }; // selection untouched
		case "prune": {
			const selection = pruneSelection(s.selection, a.validIds);
			const activeId = s.activeId !== null && !a.validIds.includes(s.activeId) ? null : s.activeId;
			return selection === s.selection && activeId === s.activeId ? s : { ...s, selection, activeId };
		}
		case "applyView":
			return { ...s, ...a.view, page: 1 };
	}
}

export type ComputedView<T> = { matching: T[]; pageRows: T[]; pageInfo: PageInfo };

/** search -> filter -> sort -> page. `matching` is everything that passes search+filters (sorted). */
export function computeView<T>(
	rows: readonly T[],
	cols: readonly ModelColumn<T>[],
	s: Pick<GridState, "query" | "filters" | "sorts" | "page" | "pageSize">,
	locale = "en",
): ComputedView<T> {
	const matching = sortRows(applyFilters(searchRows(rows, cols, s.query), cols, s.filters), cols, s.sorts, locale);
	const pageInfo = paginate(matching.length, s.page, s.pageSize);
	return { matching, pageRows: matching.slice(pageInfo.start, pageInfo.end), pageInfo };
}
