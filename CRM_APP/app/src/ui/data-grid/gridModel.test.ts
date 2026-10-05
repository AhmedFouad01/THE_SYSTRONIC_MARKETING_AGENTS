import { describe, expect, it } from "vitest";
import {
	applyFilters,
	ariaSortOf,
	computeView,
	cycleSort,
	DEFAULT_VIEW,
	type GridState,
	gridReducer,
	initialGridState,
	type ModelColumn,
	normalizeText,
	paginate,
	pageSelectionState,
	pruneSelection,
	searchRows,
	setEqFilter,
	sortRows,
	toggleHidden,
	visibleColumns,
} from "./gridModel.ts";

type Lead = { id: string; name: string; company: string | null; score: number | null; stage: string };
const LEADS: Lead[] = [
	{ id: "1", name: "Zeinab", company: "Nile Co", score: 70, stage: "new" },
	{ id: "2", name: "ahmed", company: "Delta", score: 90, stage: "qualified" },
	{ id: "3", name: "Ahmed", company: null, score: null, stage: "new" },
	{ id: "4", name: "Émile", company: "Café Group", score: 70, stage: "proposal" },
	{ id: "5", name: "أحمد", company: "شركة النيل", score: 85, stage: "qualified" },
];
const COLS: ModelColumn<Lead>[] = [
	{ id: "name", value: (r) => r.name, hideable: false },
	{ id: "company", value: (r) => r.company },
	{ id: "score", value: (r) => r.score, searchable: false },
	{ id: "stage", value: (r) => r.stage },
];
const ids = (rows: readonly Lead[]) => rows.map((r) => r.id);

describe("search", () => {
	it("is case- and diacritic-insensitive (Latin)", () => {
		expect(ids(searchRows(LEADS, COLS, "EMILE"))).toEqual(["4"]);
		expect(ids(searchRows(LEADS, COLS, "cafe"))).toEqual(["4"]);
		expect(ids(searchRows(LEADS, COLS, "AHMED"))).toEqual(["2", "3"]);
	});
	it("folds Arabic harakat, tatweel, alef-hamza forms and Arabic-Indic digits", () => {
		expect(normalizeText("أَحْمَد")).toBe(normalizeText("احمد"));
		expect(normalizeText("إبراهيم")).toBe(normalizeText("ابراهيم"));
		expect(normalizeText("مـحـمد")).toBe(normalizeText("محمد"));
		expect(normalizeText("١٢٣")).toBe("123");
		expect(ids(searchRows(LEADS, COLS, "احمد"))).toEqual(["5"]);
	});
	it("AND-matches whitespace tokens across columns; ignores non-searchable columns; empty query keeps all", () => {
		expect(ids(searchRows(LEADS, COLS, "ahmed delta"))).toEqual(["2"]);
		expect(searchRows(LEADS, COLS, "90")).toEqual([]); // score is not searchable
		expect(searchRows(LEADS, COLS, "   ")).toHaveLength(5);
	});
});

describe("filters", () => {
	it("eq / in / gte / lte combine with AND; null cells never match", () => {
		expect(ids(applyFilters(LEADS, COLS, [{ key: "stage", op: "eq", value: "new" }]))).toEqual(["1", "3"]);
		expect(ids(applyFilters(LEADS, COLS, [{ key: "stage", op: "in", values: ["proposal", "qualified"] }]))).toEqual(["2", "4", "5"]);
		expect(ids(applyFilters(LEADS, COLS, [{ key: "score", op: "gte", value: 85 }]))).toEqual(["2", "5"]);
		expect(ids(applyFilters(LEADS, COLS, [{ key: "score", op: "lte", value: 70 }]))).toEqual(["1", "4"]);
		expect(
			ids(
				applyFilters(LEADS, COLS, [
					{ key: "stage", op: "eq", value: "qualified" },
					{ key: "score", op: "gte", value: 90 },
				]),
			),
		).toEqual(["2"]);
	});
	it("ignores unknown columns and setEqFilter replaces/removes", () => {
		expect(applyFilters(LEADS, COLS, [{ key: "gone", op: "eq", value: "x" }])).toHaveLength(5);
		const one = setEqFilter([], "stage", "new");
		expect(setEqFilter(one, "stage", "won")).toEqual([{ key: "stage", op: "eq", value: "won" }]);
		expect(setEqFilter(one, "stage", null)).toEqual([]);
	});
});

describe("sort", () => {
	it("is stable: ties keep input order, in both directions", () => {
		expect(ids(sortRows(LEADS, COLS, [{ key: "stage", dir: "asc" }]))).toEqual(["1", "3", "4", "2", "5"]);
		const scoreAsc = ids(sortRows(LEADS, COLS, [{ key: "score", dir: "asc" }]));
		expect(scoreAsc.slice(0, 2)).toEqual(["1", "4"]); // both 70, original order
		const scoreDesc = ids(sortRows(LEADS, COLS, [{ key: "score", dir: "desc" }]));
		expect(scoreDesc.slice(-3)).toEqual(["1", "4", "3"]); // ties keep order, null last
	});
	it("empty values sort last in both directions", () => {
		expect(ids(sortRows(LEADS, COLS, [{ key: "company", dir: "asc" }])).at(-1)).toBe("3");
		expect(ids(sortRows(LEADS, COLS, [{ key: "company", dir: "desc" }])).at(-1)).toBe("3");
	});
	it("multi-key: secondary key breaks ties; input is not mutated", () => {
		const copy = [...LEADS];
		const out = sortRows(LEADS, COLS, [
			{ key: "score", dir: "asc" },
			{ key: "name", dir: "asc" },
		]);
		expect(ids(out).slice(0, 2)).toEqual(["4", "1"]); // both score 70: name asc puts Émile before Zeinab (input order is the reverse)
		expect(LEADS).toEqual(copy);
	});
	it("uses numeric collation for strings and numeric compare for numbers", () => {
		const rows = [{ v: "item10" }, { v: "item2" }, { v: "Item1" }];
		const cols: ModelColumn<{ v: string }>[] = [{ id: "v", value: (r) => r.v }];
		expect(sortRows(rows, cols, [{ key: "v", dir: "asc" }]).map((r) => r.v)).toEqual(["Item1", "item2", "item10"]);
	});
	it("cycleSort: none -> asc -> desc -> none; additive keeps other keys", () => {
		let s = cycleSort([], "a");
		expect(s).toEqual([{ key: "a", dir: "asc" }]);
		s = cycleSort(s, "a");
		expect(s).toEqual([{ key: "a", dir: "desc" }]);
		expect(cycleSort(s, "a")).toEqual([]);
		expect(cycleSort(s, "b")).toEqual([{ key: "b", dir: "asc" }]); // plain click replaces
		expect(cycleSort(s, "b", true)).toEqual([
			{ key: "a", dir: "desc" },
			{ key: "b", dir: "asc" },
		]);
		expect(cycleSort([{ key: "a", dir: "desc" }, { key: "b", dir: "asc" }], "a", true)).toEqual([{ key: "b", dir: "asc" }]);
	});
	it("aria-sort announces only the primary key", () => {
		const s = [
			{ key: "a", dir: "desc" as const },
			{ key: "b", dir: "asc" as const },
		];
		expect(ariaSortOf(s, "a")).toBe("descending");
		expect(ariaSortOf(s, "b")).toBe("none");
		expect(ariaSortOf([], "a")).toBe("none");
		expect(ariaSortOf([{ key: "a", dir: "asc" }], "a")).toBe("ascending");
	});
});

describe("columns and paging", () => {
	it("hideable:false columns stay visible", () => {
		expect(visibleColumns(COLS, ["name", "stage"]).map((c) => c.id)).toEqual(["name", "company", "score"]);
		expect(toggleHidden(["a"], "a")).toEqual([]);
		expect(toggleHidden([], "a")).toEqual(["a"]);
	});
	it("paginate clamps page, handles empty and exact multiples", () => {
		expect(paginate(25, 2, 10)).toMatchObject({ page: 2, pageCount: 3, start: 10, end: 20 });
		expect(paginate(25, 99, 10)).toMatchObject({ page: 3, start: 20, end: 25 });
		expect(paginate(25, -4, 10)).toMatchObject({ page: 1, start: 0 });
		expect(paginate(0, 1, 10)).toMatchObject({ page: 1, pageCount: 1, start: 0, end: 0 });
		expect(paginate(20, 2, 10).pageCount).toBe(2);
	});
	it("computeView = search -> filter -> sort -> page", () => {
		const v = computeView(LEADS, COLS, { query: "a", filters: [{ key: "stage", op: "eq", value: "new" }], sorts: [{ key: "name", dir: "asc" }], page: 1, pageSize: 1 });
		expect(ids(v.matching)).toEqual(["3", "1"]); // Ahmed, Zeinab
		expect(ids(v.pageRows)).toEqual(["3"]);
		expect(v.pageInfo.pageCount).toBe(2);
	});
});

describe("selection vs active row", () => {
	const base = initialGridState();
	it("opening a record never changes bulk selection", () => {
		let s: GridState = gridReducer(base, { type: "toggleRow", id: "1" });
		s = gridReducer(s, { type: "open", id: "2" });
		expect([...s.selection]).toEqual(["1"]);
		expect(s.activeId).toBe("2");
	});
	it("selecting rows never changes the active record", () => {
		let s: GridState = gridReducer(base, { type: "open", id: "2" });
		s = gridReducer(s, { type: "toggleRow", id: "3" });
		s = gridReducer(s, { type: "togglePage", pageIds: ["1", "2", "3"] });
		expect(s.activeId).toBe("2");
		expect([...s.selection].sort()).toEqual(["1", "2", "3"]);
	});
	it("select-all for the page: none -> all -> none, partial -> all; indeterminate state", () => {
		const page = ["1", "2", "3"];
		expect(pageSelectionState(new Set(), page)).toBe("none");
		expect(pageSelectionState(new Set(["1"]), page)).toBe("some");
		expect(pageSelectionState(new Set(page), page)).toBe("all");
		expect(pageSelectionState(new Set(["x"]), [])).toBe("none");
		let s = gridReducer(base, { type: "toggleRow", id: "1" });
		s = gridReducer(s, { type: "togglePage", pageIds: page });
		expect(pageSelectionState(s.selection, page)).toBe("all");
		s = gridReducer(s, { type: "togglePage", pageIds: page });
		expect(s.selection.size).toBe(0);
	});
	it("selection on other pages survives page select-all toggling", () => {
		let s = gridReducer(base, { type: "toggleRow", id: "other" });
		s = gridReducer(s, { type: "togglePage", pageIds: ["1", "2"] });
		s = gridReducer(s, { type: "togglePage", pageIds: ["1", "2"] });
		expect([...s.selection]).toEqual(["other"]);
	});
	it("prune drops ids that are no longer loaded and keeps identity when unchanged", () => {
		const sel = new Set(["1", "9"]);
		expect([...pruneSelection(sel, ["1", "2"])]).toEqual(["1"]);
		expect(pruneSelection(sel, ["1", "9"])).toBe(sel);
		let s = gridReducer(gridReducer(base, { type: "toggleRow", id: "9" }), { type: "open", id: "9" });
		s = gridReducer(s, { type: "prune", validIds: ["1"] });
		expect(s.selection.size).toBe(0);
		expect(s.activeId).toBeNull();
		expect(gridReducer(s, { type: "prune", validIds: ["1"] })).toBe(s);
	});
});

describe("grid reducer", () => {
	it("search/filter/sort/pageSize reset to page 1; page and column changes do not", () => {
		let s: GridState = { ...initialGridState(), page: 4 };
		for (const a of [
			{ type: "query", query: "x" },
			{ type: "filters", filters: [] },
			{ type: "sort", key: "name" },
			{ type: "pageSize", size: 25 },
			{ type: "clearFilters" },
		] as const) {
			expect(gridReducer({ ...s, page: 4 }, a).page).toBe(1);
		}
		s = gridReducer(s, { type: "toggleColumn", id: "stage" });
		expect(s.page).toBe(4);
		expect(s.hidden).toEqual(["stage"]);
		expect(gridReducer(s, { type: "density", density: "compact" }).density).toBe("compact");
	});
	it("applyView replaces view settings but keeps selection and active row", () => {
		let s = gridReducer(initialGridState(), { type: "toggleRow", id: "1" });
		s = gridReducer(s, { type: "open", id: "2" });
		s = gridReducer(s, { type: "applyView", view: { ...DEFAULT_VIEW, query: "q", density: "compact" } });
		expect(s).toMatchObject({ query: "q", density: "compact", activeId: "2" });
		expect(s.selection.has("1")).toBe(true);
	});
});
