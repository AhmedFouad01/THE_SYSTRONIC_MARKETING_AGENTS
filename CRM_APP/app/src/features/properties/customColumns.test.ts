import { describe, expect, it } from "vitest";
import {
	cfId,
	columnsKey,
	defaultOp,
	isSortable,
	keyOfCfId,
	listable,
	MAX_COLUMNS,
	newDraft,
	opsOf,
	parseShown,
	propsParam,
	toCondition,
	toConditions,
	toggleShown,
} from "./customColumns.ts";
import type { PropertyDef, PropType } from "./model.ts";

const def = (key: string, type: PropType, extra: Partial<PropertyDef> = {}): PropertyDef => ({
	key,
	label: { en: key },
	type,
	display: "default",
	group: "g",
	position: 1,
	is_system: false,
	required: false,
	read_only: false,
	sensitive: false,
	searchable: false,
	show_default: false,
	validation: {},
	currency: null,
	version: 1,
	archived: false,
	option_count: 0,
	options: [],
	...extra,
});
const draft = (p: PropertyDef, patch: Record<string, unknown>) => ({ ...newDraft(p, "d"), ...patch });

describe("custom column ids and listing", () => {
	it("round-trips the grid column id", () => {
		expect(cfId("budget")).toBe("cf:budget");
		expect(keyOfCfId("cf:budget")).toBe("budget");
	});
	it("lists only active custom properties in position order", () => {
		const out = listable([def("b", "text", { position: 2 }), def("a", "text", { position: 1 }), def("sys", "text", { is_system: true }), def("old", "text", { archived: true })]);
		expect(out.map((p) => p.key)).toEqual(["a", "b"]);
	});
	it("sortable types match the server", () => {
		expect(["text", "number", "currency", "date", "datetime", "single_select"].every((t) => isSortable(def("k", t as PropType)))).toBe(true);
		expect(["long_text", "multi_select", "checkbox", "user"].some((t) => isSortable(def("k", t as PropType)))).toBe(false);
	});
});

describe("filter operators and conditions", () => {
	it("offers only server operators per type", () => {
		expect(opsOf(def("k", "multi_select"))).toEqual(["has_any", "has_all", "is_null", "not_null"]);
		expect(opsOf(def("k", "checkbox"))).toEqual(["is", "is_null", "not_null"]);
		expect(opsOf(def("k", "long_text"))).not.toContain("eq");
		expect(defaultOp(def("k", "number"))).toBe("eq");
	});
	it("number: Arabic digits parse, empty or invalid is not applied", () => {
		const p = def("seats", "number");
		expect(toCondition(p, draft(p, { op: "gte", a: "١٢٠" }))).toEqual({ p: "seats", op: "gte", v: 120 });
		expect(toCondition(p, draft(p, { op: "gte", a: "" }))).toBeNull();
		expect(toCondition(p, draft(p, { op: "gte", a: "abc" }))).toBeNull();
	});
	it("currency is sent in minor units", () => {
		const p = def("budget", "currency", { currency: "EGP" });
		expect(toCondition(p, draft(p, { op: "between", a: "10.5", b: "20" }))).toEqual({ p: "budget", op: "between", v: [1050, 2000] });
	});
	it("text, date, null, bool and list operators", () => {
		const t = def("note", "text");
		expect(toCondition(t, draft(t, { op: "contains", a: " ملاحظة " }))).toEqual({ p: "note", op: "contains", v: "ملاحظة" });
		const d = def("due", "date");
		expect(toCondition(d, draft(d, { op: "lt", a: "2026-10-07" }))).toEqual({ p: "due", op: "lt", v: "2026-10-07" });
		expect(toCondition(d, draft(d, { op: "lt", a: "07/10/2026" }))).toBeNull();
		expect(toCondition(t, draft(t, { op: "is_null" }))).toEqual({ p: "note", op: "is_null" });
		const c = def("vip", "checkbox");
		expect(toCondition(c, draft(c, { op: "is", a: "false" }))).toEqual({ p: "vip", op: "is", v: false });
		const m = def("tags", "multi_select");
		expect(toCondition(m, draft(m, { op: "has_any", list: [] }))).toBeNull();
		expect(toCondition(m, draft(m, { op: "has_any", list: ["a", "b"] }))).toEqual({ p: "tags", op: "has_any", v: ["a", "b"] });
	});
	it("datetime converts the local picker value to an ISO instant", () => {
		const p = def("at", "datetime");
		const c = toCondition(p, draft(p, { op: "gte", a: "2026-10-07T09:30" }));
		expect(c?.v).toBe(new Date(2026, 9, 7, 9, 30).toISOString());
	});
	it("an operator that is not valid for the type, or a stale property, is dropped", () => {
		const p = def("seats", "number");
		expect(toCondition(p, draft(p, { op: "contains", a: "1" }))).toBeNull();
		expect(toConditions(new Map(), [draft(p, { op: "eq", a: "1" })])).toEqual([]);
	});
});

describe("shown columns", () => {
	it("builds props= from shown keys that still exist", () => {
		const defs = new Map([["a", def("a", "text")], ["b", def("b", "text")]]);
		expect(propsParam(["b", "gone", "a"], defs)).toBe("b,a");
		expect(propsParam([], defs)).toBeUndefined();
	});
	it("toggles and caps at the server limit", () => {
		expect(toggleShown(["a"], "b")).toEqual(["a", "b"]);
		expect(toggleShown(["a", "b"], "a")).toEqual(["b"]);
		const full = Array.from({ length: MAX_COLUMNS }, (_, i) => `k${i}`);
		expect(toggleShown(full, "extra")).toEqual(full);
	});
	it("reads damaged storage as none and keys are per tenant, actor and grid", () => {
		expect(parseShown("not json")).toEqual([]);
		expect(parseShown('{"a":1}')).toEqual([]);
		expect(parseShown('["a","A b","a","c"]')).toEqual(["a", "c"]);
		expect(columnsKey("t1", "u1", "leads")).not.toBe(columnsKey("t2", "u1", "leads"));
	});
});
