import { describe, expect, it } from "vitest";
import { Fault } from "../src/db.js";
import {
	KEY_RE,
	OPTION_VALUE_RE,
	TYPES,
	TYPE_NAMES,
	validateGroup,
	validateOptionWrite,
	validateOrder,
	validateProperty,
} from "../src/schemarules.js";

const L = { en: "Label", ar: "عنوان" };
const issues = (fn: () => unknown) => {
	try {
		fn();
	} catch (e) {
		expect(e).toBeInstanceOf(Fault);
		return (e as Fault).details?.map((i) => i.code) ?? [(e as Fault).code];
	}
	throw new Error("expected a Fault");
};
const ok = { command_id: "x", key: "k1", type: "text", label: L };

describe("schema rules (pure)", () => {
	it("key regex", () => {
		for (const k of ["a", "abc_1", `a${"b".repeat(62)}`]) expect(KEY_RE.test(k)).toBe(true);
		for (const k of ["", "A", "1a", "_a", "a-b", "a b", `a${"b".repeat(63)}`, "__proto__"])
			expect(KEY_RE.test(k)).toBe(false);
		expect(OPTION_VALUE_RE.test("a-b_1")).toBe(true);
		expect(OPTION_VALUE_RE.test("-a")).toBe(false);
	});
	it("type/display matrix: every type accepts its own displays and rejects others", () => {
		for (const t of TYPE_NAMES) {
			const extra = t === "currency" ? { currency: "EGP" } : {};
			for (const d of TYPES[t].displays)
				expect(() => validateProperty({ ...ok, type: t, display: d, ...extra }, "create")).not.toThrow();
			expect(issues(() => validateProperty({ ...ok, type: t, display: "bogus", ...extra }, "create"))).toContain("DISPLAY_INVALID");
		}
	});
	it("currency pairing", () => {
		expect(issues(() => validateProperty({ ...ok, type: "currency" }, "create"))).toContain("CURRENCY_REQUIRED");
		expect(issues(() => validateProperty({ ...ok, type: "currency", currency: "XXZ" }, "create"))).toContain("CURRENCY_INVALID");
		expect(issues(() => validateProperty({ ...ok, currency: "USD" }, "create"))).toContain("CURRENCY_NOT_ALLOWED");
		expect(validateProperty({ ...ok, type: "currency", currency: "USD" }, "create").currency).toBe("USD");
	});
	it("labels: en/ar, one required, NFC-trimmed, bidi controls rejected, empty language dropped", () => {
		expect(validateProperty({ ...ok, label: { en: "  A  ", ar: "" } }, "create").label).toEqual({ en: "A" });
		expect(validateProperty({ ...ok, label: { ar: "مرحبا" } }, "create").label).toEqual({ ar: "مرحبا" });
		expect(issues(() => validateProperty({ ...ok, label: { en: "", ar: " " } }, "create"))).toContain("LABEL_REQUIRED");
		expect(issues(() => validateProperty({ ...ok, label: { en: "a‮b" } }, "create"))).toContain("LABEL_INVALID");
		expect(issues(() => validateProperty({ ...ok, label: { en: "a\nb" } }, "create"))).toContain("LABEL_INVALID");
		// LRM/RLM are legal
		expect(() => validateProperty({ ...ok, label: { en: "a‏b" } }, "create")).not.toThrow();
	});
	it("update: system properties accept label/group/position only; immutable names are FIELD_NOT_WRITABLE", () => {
		const sys = { type: "text" as const, is_system: true, required: false, read_only: false, sensitive: false, searchable: false, show_default: false, display: "default" };
		expect(() => validateProperty({ command_id: "x", expected_version: 0, label: L, position: 3, group: "general" }, "update", sys)).not.toThrow();
		try {
			validateProperty({ command_id: "x", expected_version: 0, required: true }, "update", sys);
			throw new Error("no fault");
		} catch (e) {
			expect((e as Fault).code).toBe("SYSTEM_PROPERTY_IMMUTABLE");
		}
		for (const f of ["key", "type", "storage", "currency", "options"]) {
			try {
				validateProperty({ command_id: "x", expected_version: 0, [f]: "x" }, "update");
				throw new Error("no fault");
			} catch (e) {
				expect((e as Fault).code).toBe("FIELD_NOT_WRITABLE");
			}
		}
	});
	it("effective flags are checked against the existing row on update", () => {
		const row = { type: "text" as const, is_system: false, required: false, read_only: true, sensitive: false, searchable: true, show_default: false, display: "default" };
		expect(issues(() => validateProperty({ expected_version: 0, command_id: "x", required: true }, "update", row))).toContain("REQUIRED_READ_ONLY");
		expect(issues(() => validateProperty({ expected_version: 0, command_id: "x", sensitive: true }, "update", row))).toContain("SENSITIVE_NOT_SEARCHABLE");
	});
	it("validation rules per type", () => {
		expect(validateProperty({ ...ok, validation: { max_length: 50 } }, "create").validation).toEqual({ max_length: 50 });
		expect(issues(() => validateProperty({ ...ok, validation: { max_length: 0 } }, "create"))).toContain("VALIDATION_INVALID");
		expect(issues(() => validateProperty({ ...ok, type: "number", validation: { max_length: 5 } }, "create"))).toContain("VALIDATION_KEY_UNKNOWN");
		expect(issues(() => validateProperty({ ...ok, type: "number", validation: { min: Number.POSITIVE_INFINITY } }, "create"))).toContain("VALIDATION_INVALID");
		expect(issues(() => validateProperty({ ...ok, type: "multi_select", validation: { max_selected: 51 } }, "create"))).toContain("VALIDATION_INVALID");
		expect(issues(() => validateProperty({ ...ok, type: "date", validation: { min: 1 } }, "create"))).toContain("VALIDATION_KEY_UNKNOWN");
	});
	it("options: value/colour/duplicates/limit; update cannot change the value", () => {
		const sel = (options: unknown[]) => ({ ...ok, type: "single_select", options });
		expect(validateProperty(sel([{ value: "a", label: L }, { value: "b", label: L, color: "red" }]), "create").options?.map((o) => [o.value, o.position])).toEqual([["a", 10], ["b", 20]]);
		expect(issues(() => validateProperty(sel([{ value: "a", label: L }, { value: "a", label: L }]), "create"))).toContain("OPTION_DUPLICATE");
		expect(issues(() => validateProperty(sel(Array.from({ length: 201 }, (_, i) => ({ value: `o${i}`, label: L }))), "create"))).toContain("OPTIONS_INVALID");
		expect(issues(() => validateOptionWrite({ value: "A b", label: L }, "create"))).toContain("OPTION_VALUE_INVALID");
		expect(issues(() => validateOptionWrite({ label: L, color: "pink" }, "update"))).toContain("OPTION_COLOR_INVALID");
		expect(issues(() => validateOptionWrite({ value: "x" }, "update"))).toEqual(["IMMUTABLE"]);
		expect(issues(() => validateOptionWrite({ archived: true }, "update", true))).toContain("SYSTEM_PROPERTY_IMMUTABLE");
	});
	it("groups and order bodies", () => {
		expect(validateGroup({ key: "g", label: L }, "create").key).toBe("g");
		expect(issues(() => validateGroup({ key: "G", label: L }, "create"))).toContain("KEY_INVALID");
		expect(validateOrder({ keys: ["a", "b"], expected_schema_rev: 3 }, "keys", "expected_schema_rev")).toEqual({ list: ["a", "b"], guard: 3 });
		expect(issues(() => validateOrder({ keys: ["a", "a"], expected_schema_rev: 3 }, "keys", "expected_schema_rev"))).toContain("ORDER_DUPLICATE");
		expect(issues(() => validateOrder({ keys: ["A"], expected_schema_rev: 3 }, "keys", "expected_schema_rev"))).toContain("ORDER_INVALID");
		expect(issues(() => validateOrder({ keys: ["a"] }, "keys", "expected_schema_rev"))).toContain("VERSION_REQUIRED");
	});
});
