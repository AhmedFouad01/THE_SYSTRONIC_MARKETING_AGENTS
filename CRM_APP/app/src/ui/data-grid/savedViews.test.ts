import { describe, expect, it } from "vitest";
import { DEFAULT_VIEW, type ViewState } from "./gridModel.ts";
import {
	createSavedViewsStore,
	MAX_NAME,
	MAX_VIEWS,
	parseViews,
	sanitizeViewState,
	type StorageLike,
	viewsKey,
} from "./savedViews.ts";

function memory(): StorageLike & { data: Map<string, string> } {
	const data = new Map<string, string>();
	return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}
const broken: StorageLike = {
	getItem() {
		throw new Error("denied");
	},
	setItem() {
		throw new Error("quota");
	},
};
const VIEW: ViewState = {
	...DEFAULT_VIEW,
	query: "ahmed",
	filters: [{ key: "stage", op: "eq", value: "new" }],
	sorts: [{ key: "name", dir: "desc" }],
	hidden: ["source"],
	density: "compact",
	pageSize: 25,
};
const mk = (storage: StorageLike | null, tenantId = "t1", actor = "a1") =>
	createSavedViewsStore({ storage, tenantId, actor, gridId: "leads", newId: (() => { let n = 0; return () => `id${++n}`; })() });

describe("saved views store", () => {
	it("round-trips save/list/remove", () => {
		const store = mk(memory());
		const res = store.save("  New leads  ", VIEW);
		expect(res).toMatchObject({ ok: true, view: { id: "id1", name: "New leads", state: VIEW } });
		expect(store.list()).toHaveLength(1);
		expect(store.list()[0]?.state).toEqual(VIEW);
		expect(store.remove("id1")).toBe(true);
		expect(store.list()).toEqual([]);
		expect(store.remove("nope")).toBe(false);
	});
	it("updates an existing view in place by id", () => {
		const store = mk(memory());
		store.save("A", VIEW);
		store.save("A2", { ...VIEW, query: "" }, "id1");
		expect(store.list()).toHaveLength(1);
		expect(store.list()[0]).toMatchObject({ id: "id1", name: "A2" });
	});
	it("isolates by tenant and actor", () => {
		const m = memory();
		mk(m, "t1", "a1").save("mine", VIEW);
		expect(mk(m, "t1", "a2").list()).toEqual([]);
		expect(mk(m, "t2", "a1").list()).toEqual([]);
		expect(mk(m, "t1", "a1").list()).toHaveLength(1);
		expect(viewsKey("t1", "a1", "leads")).not.toBe(viewsKey("t1", "a1", "contacts"));
		expect(viewsKey("a:b", "c", "g")).not.toBe(viewsKey("a", "b:c", "g")); // separator injection cannot collide
	});
	it("never throws with broken or missing storage", () => {
		for (const storage of [broken, null]) {
			const store = mk(storage);
			expect(store.list()).toEqual([]);
			expect(store.save("x", VIEW)).toEqual({ ok: false, reason: "storage" });
			expect(store.remove("x")).toBe(false);
		}
	});
	it("rejects empty names and enforces name/count limits", () => {
		const store = mk(memory());
		expect(store.save("   ", VIEW)).toEqual({ ok: false, reason: "name" });
		const long = store.save("x".repeat(500), VIEW);
		expect(long.ok && long.view.name.length).toBe(MAX_NAME);
		for (let i = 1; i < MAX_VIEWS; i++) store.save(`v${i}`, VIEW);
		expect(store.list()).toHaveLength(MAX_VIEWS);
		expect(store.save("one too many", VIEW)).toEqual({ ok: false, reason: "limit" });
	});
	it("survives corrupted stored data", () => {
		const m = memory();
		const key = viewsKey("t1", "a1", "leads");
		for (const raw of ["{not json", "null", "42", '{"a":1}', "[1,null,{}]", '[{"id":1,"name":"x"}]']) {
			m.data.set(key, raw);
			expect(mk(m).list()).toEqual([]);
		}
		m.data.set(key, JSON.stringify([{ id: "k", name: "Keep", state: { query: 5, density: "huge", pageSize: 7, sorts: "no", filters: [{ op: "eq" }] } }, { id: "k", name: "dup" }]));
		const [only, ...rest] = mk(m).list();
		expect(rest).toEqual([]);
		expect(only).toEqual({ id: "k", name: "Keep", state: DEFAULT_VIEW }); // damaged fields fall back to defaults
	});
});

describe("sanitizeViewState", () => {
	it("keeps valid fields and drops invalid entries individually", () => {
		const s = sanitizeViewState({
			...VIEW,
			filters: [{ key: "stage", op: "eq", value: "new" }, { key: "x", op: "bogus" }, { key: "s", op: "gte", value: "NaN" }, { key: "n", op: "gte", value: 5 }],
			sorts: [{ key: "a", dir: "asc" }, { key: "b", dir: "sideways" }],
			hidden: ["a", 3, "b"],
		});
		expect(s.filters).toEqual([{ key: "stage", op: "eq", value: "new" }, { key: "n", op: "gte", value: 5 }]);
		expect(s.sorts).toEqual([{ key: "a", dir: "asc" }]);
		expect(s.hidden).toEqual(["a", "b"]);
		expect(sanitizeViewState(undefined)).toEqual(DEFAULT_VIEW);
		expect(parseViews(null)).toEqual([]);
	});
});
