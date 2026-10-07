import { describe, expect, it } from "vitest";
import { ApiError, errorFromResponse } from "../../api/errors.ts";
import {
	activeKeys,
	buildCreateBody,
	buildPatchBody,
	classifyWriteError,
	commandFor,
	countKey,
	deriveKey,
	deriveOptionValue,
	draftOf,
	EMPTY_DRAFT,
	groupProperties,
	KEY_RE,
	moveItem,
	moveProperty,
	type ObjectSchema,
	optionValues,
	pickLabel,
	type PropertyDef,
	serverFieldErrors,
	validateDraft,
	withLabelEn,
	withType,
} from "./model.ts";

const prop = (key: string, position: number, over: Partial<PropertyDef> = {}): PropertyDef => ({
	key,
	label: { en: key },
	type: "text",
	display: "default",
	group: "general",
	position,
	is_system: false,
	required: false,
	read_only: false,
	sensitive: false,
	searchable: false,
	show_default: true,
	validation: {},
	currency: null,
	version: 3,
	archived: false,
	option_count: 0,
	options: [],
	...over,
});
const schema = (properties: PropertyDef[]): ObjectSchema => ({
	object: "contact",
	schema_rev: 7,
	limits: { properties: 100, options: 200, groups: 50 },
	types: [],
	option_colors: ["gray", "blue", "teal", "green", "amber", "orange", "red", "purple"],
	groups: [
		{ key: "general", label: { en: "General", ar: "عام" }, position: 0, version: 0, archived: false },
		{ key: "extra", label: { en: "Extra" }, position: 10, version: 0, archived: false },
	],
	properties,
});

describe("keys", () => {
	it("derives a contract-valid key from the English label", () => {
		expect(deriveKey("Lead Score")).toBe("lead_score");
		expect(deriveKey("  Café  & Co!! ")).toBe("cafe_co");
		expect(deriveKey("2nd phone")).toBe("p_2nd_phone");
		expect(deriveKey("شركة")).toBe("");
		expect(deriveKey("x".repeat(100)).length).toBe(63);
		for (const l of ["Lead Score", "2nd phone", "A", "a-b-c"]) expect(KEY_RE.test(deriveKey(l))).toBe(true);
	});
	it("auto-derives until the key is edited by hand", () => {
		let d = withLabelEn(EMPTY_DRAFT, "Plan Tier", true);
		expect(d.key).toBe("plan_tier");
		d = { ...d, key: "tier", keyTouched: true };
		expect(withLabelEn(d, "Plan Tier 2", true).key).toBe("tier");
		expect(withLabelEn({ ...d, key: "locked" }, "Other", false).key).toBe("locked");
	});
	it("option values are stable, unique and valid", () => {
		expect(optionValues([{ id: "1", en: "Gold", ar: "", color: "" }, { id: "2", en: "gold", ar: "", color: "" }, { id: "3", en: "", ar: "فضي", color: "" }])).toEqual(["gold", "gold_2", "option_3"]);
		expect(deriveOptionValue("A B", new Set(["a_b"]), 0)).toBe("a_b_2");
	});
});

describe("validation mirrors the contract", () => {
	it("needs one label, a valid key, a currency for currency", () => {
		const e = validateDraft({ ...EMPTY_DRAFT, key: "Bad Key" }, true);
		expect(e.label).toBe("labelRequired");
		expect(e.key).toBe("keyInvalid");
		expect(validateDraft({ ...EMPTY_DRAFT, labelAr: "اسم", key: "ok" }, true).label).toBeUndefined();
		expect(validateDraft({ ...withType(EMPTY_DRAFT, "currency"), labelEn: "A", key: "a" }, true).currency).toBe("currencyRequired");
		expect(validateDraft({ ...withType(EMPTY_DRAFT, "currency"), labelEn: "A", key: "a", currency: "egp" }, true).currency).toBe("currencyInvalid");
	});
	it("flag rules and ranges", () => {
		const base = { ...EMPTY_DRAFT, labelEn: "A", key: "a" };
		expect(validateDraft({ ...base, required: true, read_only: true }, true).flags).toBe("requiredReadOnly");
		expect(validateDraft({ ...base, sensitive: true, searchable: true }, true).flags).toBe("sensitiveSearchable");
		expect(validateDraft({ ...base, maxLength: "2001" }, true).maxLength).toBe("range");
		expect(validateDraft({ ...base, type: "long_text", maxLength: "2001" }, true).maxLength).toBeUndefined();
		expect(validateDraft({ ...base, type: "number", min: "5", max: "1" }, true).max).toBe("range");
		expect(validateDraft({ ...withType(base, "currency"), currency: "EGP", min: "1.5" }, true).min).toBe("notInteger");
		expect(validateDraft({ ...withType(base, "multi_select"), maxSelected: "51" }, true).maxSelected).toBe("range");
	});
	it("option labels need one language", () => {
		const d = { ...withType(EMPTY_DRAFT, "single_select"), labelEn: "A", key: "a", options: [{ id: "x", en: "", ar: "", color: "" }] };
		expect(validateDraft(d, true).option).toEqual({ x: "optionLabelRequired" });
	});
	it("a system property validates label only", () => {
		expect(validateDraft({ ...EMPTY_DRAFT, labelEn: "A", required: true, read_only: true }, false, true).flags).toBeUndefined();
	});
	it("changing type clears what no longer applies", () => {
		const d = withType({ ...withType(EMPTY_DRAFT, "single_select"), options: [{ id: "x", en: "A", ar: "", color: "" }], searchable: true }, "text");
		expect(d.options).toEqual([]);
		expect(withType({ ...EMPTY_DRAFT, searchable: true }, "number").searchable).toBe(false);
	});
});

describe("bodies", () => {
	it("create body: EN + AR labels, select options with derived values and colours", () => {
		const d = { ...withType(EMPTY_DRAFT, "single_select"), labelEn: "Tier", labelAr: "الفئة", key: "tier", options: [{ id: "1", en: "Gold", ar: "ذهبي", color: "amber" }, { id: "2", en: "", ar: "فضي", color: "" }] };
		const b = buildCreateBody(d, "cmd-1");
		expect(b).toMatchObject({ command_id: "cmd-1", key: "tier", type: "single_select", label: { en: "Tier", ar: "الفئة" }, group: "general" });
		expect(b.options).toEqual([
			{ value: "gold", label: { en: "Gold", ar: "ذهبي" }, color: "amber", position: 10 },
			{ value: "option_2", label: { ar: "فضي" }, color: null, position: 20 },
		]);
		expect(b).not.toHaveProperty("currency");
	});
	it("patch body: only changes, version attached, null when unchanged", () => {
		const p = prop("a", 10, { label: { en: "A", ar: "ا" } });
		expect(buildPatchBody(p, draftOf(p), "c")).toBeNull();
		expect(buildPatchBody(p, { ...draftOf(p), labelEn: "B", required: true }, "c")).toEqual({ command_id: "c", expected_version: 3, label: { en: "B", ar: "ا" }, required: true });
	});
	it("system property patch carries label/group only", () => {
		const p = prop("title", 10, { is_system: true });
		const b = buildPatchBody(p, { ...draftOf(p), labelEn: "T", required: true, group: "extra" }, "c");
		expect(Object.keys(b ?? {}).sort()).toEqual(["command_id", "expected_version", "group", "label"]);
	});
});

describe("idempotency", () => {
	it("same payload reuses the command id, a changed one gets a new id", () => {
		let n = 0;
		const id = () => `id-${++n}`;
		const a = commandFor(null, { a: 1, command_id: "x" }, id);
		expect(commandFor(a, { a: 1, command_id: "y" }, id)).toBe(a);
		expect(commandFor(a, { a: 2 }, id).commandId).toBe("id-2");
	});
});

describe("server errors", () => {
	const err = (status: number, body: Record<string, unknown>) => errorFromResponse(status, { safe_message: "", request_id: "r", retryable: false, ...body });
	it("keeps errors[] on the ApiError", () => {
		const e = err(422, { code: "VALIDATION_FAILED", errors: [{ field: "key", code: "KEY_RESERVED" }, { nope: 1 }] });
		expect(e).toBeInstanceOf(ApiError);
		expect(e.issues).toEqual([{ field: "key", code: "KEY_RESERVED" }]);
	});
	it("classifies", () => {
		expect(classifyWriteError(err(409, { code: "VERSION_CONFLICT" }))).toBe("conflict");
		expect(classifyWriteError(err(409, { code: "KEY_EXISTS" }))).toBe("exists");
		expect(classifyWriteError(err(409, { code: "GROUP_NOT_EMPTY" }))).toBe("notEmpty");
		expect(classifyWriteError(err(422, { code: "VALIDATION_FAILED" }))).toBe("validation");
		expect(classifyWriteError(err(422, { code: "PROPERTY_LIMIT_EXCEEDED" }))).toBe("limit");
		expect(classifyWriteError(err(403, { code: "FORBIDDEN" }))).toBe("forbidden");
		expect(classifyWriteError(new Error("x"))).toBe("other");
	});
	it("maps issues to form fields and option rows; unknown fields go to the form banner", () => {
		const r = serverFieldErrors([
			{ field: "key", code: "KEY_RESERVED" },
			{ field: "label.ar", code: "LABEL_INVALID" },
			{ field: "validation.max_length", code: "VALIDATION_INVALID" },
			{ field: "options[1].value", code: "OPTION_VALUE_INVALID" },
			{ field: "options[1].color", code: "OPTION_COLOR_INVALID" },
			{ field: "mystery", code: "X" },
		]);
		expect(r.key).toBe("KEY_RESERVED");
		expect(r["label.ar"]).toBe("LABEL_INVALID");
		expect(r.maxLength).toBe("VALIDATION_INVALID");
		expect(r.optionRows).toEqual({ 1: "OPTION_VALUE_INVALID" });
		expect(r.form).toBe("X");
	});
});

describe("plural forms", () => {
	it("Arabic: zero, one, two, few (3-10), many (11-99), other (100)", () => {
		const k = (n: number) => countKey(n, "ar").replace("props.count.", "");
		expect([0, 1, 2, 3, 10, 11, 99, 100].map(k)).toEqual(["zero", "one", "two", "few", "few", "many", "many", "other"]);
	});
	it("English: one / other", () => {
		expect([0, 1, 2, 5].map((n) => countKey(n, "en").replace("props.count.", ""))).toEqual(["zero", "one", "other", "other"]);
	});
});

describe("listing and ordering", () => {
	const s = schema([prop("c", 30), prop("a", 10), prop("b", 20, { group: "extra" }), prop("z", 40, { archived: true }), prop("d", 50, { group: "extra", label: { ar: "اسم" } })]);
	it("groups by group, hides archived unless asked, searches EN/AR/key", () => {
		const g = groupProperties(s, { query: "", showArchived: false, locale: "en" });
		expect(g.map((x) => x.properties.map((p) => p.key))).toEqual([["a", "c"], ["b", "d"]]);
		expect(groupProperties(s, { query: "", showArchived: true, locale: "en" })[0]?.properties.map((p) => p.key)).toEqual(["a", "c", "z"]);
		expect(groupProperties(s, { query: "اسم", showArchived: false, locale: "ar" }).map((x) => x.group.key)).toEqual(["extra"]);
		expect(groupProperties(s, { query: "B", showArchived: false, locale: "en" }).map((x) => x.properties.map((p) => p.key))).toEqual([["b"]]);
	});
	it("active keys exclude archived, in global order", () => {
		expect(activeKeys(s)).toEqual(["a", "b", "c", "d"]);
	});
	it("moves a property within its group only, swapping neighbours; null at the edge", () => {
		expect(moveProperty(s, "c", -1)).toEqual(["c", "b", "a", "d"]);
		expect(moveProperty(s, "a", -1)).toBeNull();
		expect(moveProperty(s, "d", 1)).toBeNull();
		expect(moveProperty(s, "b", 1)).toEqual(["a", "d", "c", "b"]);
	});
	it("moveItem", () => {
		expect(moveItem([1, 2, 3], 0, 1)).toEqual([2, 1, 3]);
		expect(moveItem([1, 2, 3], 0, -1)).toBeNull();
		expect(moveItem([1, 2, 3], 2, 1)).toBeNull();
	});
	it("pickLabel falls back to the other language, then the key", () => {
		expect(pickLabel({ en: "A" }, "ar")).toBe("A");
		expect(pickLabel({ ar: "ب" }, "en")).toBe("ب");
		expect(pickLabel({}, "en", "k")).toBe("k");
	});
});
