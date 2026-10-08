import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, formatMoneyMinor, formatNumber } from "../../ui/i18n/format.ts";
import type { ObjectSchema, PropertyDef } from "./model.ts";
import {
	buildProperties,
	choicesFor,
	createGroups,
	customGroups,
	draftFromValue,
	isoToLocalInput,
	linkOf,
	localInputToIso,
	minorToInput,
	normalizeDigits,
	parseDraft,
	parseMinor,
	parseNumber,
	type ReadCtx,
	readValue,
	serverIssueSuffix,
	serverPropertyIssues,
	visibleInRead,
	withCreateProperties,
	withProperties,
	ymdToDate,
} from "./values.ts";

const def = (key: string, type: PropertyDef["type"], over: Partial<PropertyDef> = {}): PropertyDef => ({
	key,
	label: key,
	type,
	display: "default",
	group: "general",
	position: 1,
	is_system: false,
	required: false,
	read_only: false,
	sensitive: false,
	searchable: false,
	show_default: true,
	validation: {},
	currency: null,
	version: 1,
	archived: false,
	option_count: 0,
	options: [],
	...over,
});
const opt = (value: string, over: Partial<PropertyDef["options"][number]> = {}) => ({
	value,
	label: value.toUpperCase(),
	color: null,
	position: 1,
	archived: false,
	...over,
});
const tier = def("tier", "single_select", { options: [opt("gold", { color: "amber" }), opt("silver", { position: 2 }), opt("old", { archived: true, position: 3 })] });
const tags = def("tags", "multi_select", { validation: { max_selected: 2 }, options: [opt("a"), opt("b", { position: 2 }), opt("c", { position: 3 }), opt("z", { archived: true, position: 4 })] });

describe("number text", () => {
	it("accepts Arabic-Indic digits, Arabic decimal and grouping separators", () => {
		expect(normalizeDigits("١٢٬٣٤٥٫٦٧")).toBe("12345.67");
		expect(parseNumber("١٢٣٫٥")).toBe(123.5);
		expect(parseNumber("-4")).toBe(-4);
		expect(parseNumber(" 1,000 ")).toBe(1000);
	});
	it("rejects non-numbers", () => {
		for (const s of ["", "abc", "1.2.3", "--1", "1e5", "."]) expect(parseNumber(s)).toBeNull();
	});
	it("currency text becomes exact minor units using the currency exponent", () => {
		expect(parseMinor("1500.5", "EGP")).toEqual({ ok: true, minor: 150050 });
		expect(parseMinor("١٢٫٣٤", "EGP")).toEqual({ ok: true, minor: 1234 });
		expect(parseMinor("0.29", "EGP")).toEqual({ ok: true, minor: 29 }); // float math would give 28.999...
		expect(parseMinor("500", "JPY")).toEqual({ ok: true, minor: 500 });
		expect(parseMinor("1.005", "EGP")).toEqual({ ok: false, code: "DECIMALS" });
		expect(parseMinor("1.500", "EGP")).toEqual({ ok: true, minor: 150 }); // zeros beyond the exponent are fine
		expect(parseMinor("x", "EGP")).toEqual({ ok: false, code: "NOT_A_NUMBER" });
		expect(parseMinor("-2.5", "EGP")).toEqual({ ok: true, minor: -250 });
	});
	it("minor units back to input text", () => {
		expect(minorToInput(150050, "EGP")).toBe("1500.5");
		expect(minorToInput(1200, "EGP")).toBe("12");
		expect(minorToInput(5, "EGP")).toBe("0.05");
		expect(minorToInput(500, "JPY")).toBe("500");
		expect(minorToInput(-250, "EGP")).toBe("-2.5");
	});
});

describe("dates", () => {
	it("validates calendar days without a timezone shift", () => {
		expect(ymdToDate("2026-02-30")).toBeNull();
		expect(ymdToDate("2026-10-07")?.getDate()).toBe(7);
		expect(ymdToDate("07/10/2026")).toBeNull();
	});
	it("datetime round-trips between the picker value and an ISO instant", () => {
		const iso = localInputToIso("2026-10-07T14:30");
		expect(iso).not.toBeNull();
		expect(isoToLocalInput(iso as string)).toBe("2026-10-07T14:30");
		expect(localInputToIso("2026-10-07")).toBeNull();
		expect(isoToLocalInput("nope")).toBe("");
	});
});

describe("parseDraft per type", () => {
	it("empty input is null for every type except checkbox", () => {
		for (const t of ["text", "long_text", "number", "currency", "date", "datetime", "single_select", "user"] as const)
			expect(parseDraft(def("k", t, { currency: "EGP" }), "  ")).toEqual({ ok: true, value: null });
		expect(parseDraft(tags, [])).toEqual({ ok: true, value: null });
		expect(parseDraft(def("k", "checkbox"), false)).toEqual({ ok: true, value: false });
	});
	it("text and long_text enforce max_length by code points and trim", () => {
		const p = def("t", "text", { validation: { max_length: 3 } });
		expect(parseDraft(p, " ab ")).toEqual({ ok: true, value: "ab" });
		expect(parseDraft(p, "abcd")).toEqual({ ok: false, issue: { code: "TOO_LONG", max: 3 } });
		expect(parseDraft(p, "😀😀😀")).toEqual({ ok: true, value: "😀😀😀" });
		expect(parseDraft(def("l", "long_text", { validation: { max_length: 2 } }), "abc")).toMatchObject({ ok: false });
	});
	it("number applies min and max", () => {
		const p = def("n", "number", { validation: { min: 1, max: 10 } });
		expect(parseDraft(p, "٥")).toEqual({ ok: true, value: 5 });
		expect(parseDraft(p, "0")).toEqual({ ok: false, issue: { code: "TOO_SMALL", min: 1 } });
		expect(parseDraft(p, "11")).toEqual({ ok: false, issue: { code: "TOO_LARGE", max: 10 } });
		expect(parseDraft(p, "x")).toEqual({ ok: false, issue: { code: "NOT_A_NUMBER" } });
	});
	it("currency bounds are minor units on the wire and major units in the message", () => {
		const p = def("c", "currency", { currency: "EGP", validation: { min: 1000 } });
		expect(parseDraft(p, "12.5")).toEqual({ ok: true, value: 1250 });
		expect(parseDraft(p, "5")).toEqual({ ok: false, issue: { code: "TOO_SMALL", min: 10, currency: "EGP" } });
	});
	it("date and datetime", () => {
		expect(parseDraft(def("d", "date"), "2026-10-07")).toEqual({ ok: true, value: "2026-10-07" });
		expect(parseDraft(def("d", "date"), "2026-13-01")).toEqual({ ok: false, issue: { code: "DATE_INVALID" } });
		const r = parseDraft(def("d", "datetime"), "2026-10-07T09:00");
		expect(r.ok && typeof r.value === "string" && r.value.endsWith("Z")).toBe(true);
	});
	it("single select takes an active option; an archived one only when it is the stored value", () => {
		expect(parseDraft(tier, "gold")).toEqual({ ok: true, value: "gold" });
		expect(parseDraft(tier, "nope")).toEqual({ ok: false, issue: { code: "OPTION_INVALID" } });
		expect(parseDraft(tier, "old")).toMatchObject({ ok: false });
		expect(parseDraft(tier, "old", "old")).toEqual({ ok: true, value: "old" });
	});
	it("multi select applies max_selected and option membership", () => {
		expect(parseDraft(tags, ["a", "b"])).toEqual({ ok: true, value: ["a", "b"] });
		expect(parseDraft(tags, ["a", "b", "c"])).toEqual({ ok: false, issue: { code: "TOO_MANY", max: 2 } });
		expect(parseDraft(tags, ["z"])).toMatchObject({ ok: false });
		expect(parseDraft(tags, ["z"], ["z"])).toEqual({ ok: true, value: ["z"] });
	});
});

describe("draftFromValue", () => {
	it("renders stored values as input text", () => {
		expect(draftFromValue(def("n", "number"), 12.5)).toBe("12.5");
		expect(draftFromValue(def("c", "currency", { currency: "EGP" }), 150050)).toBe("1500.5");
		expect(draftFromValue(def("d", "date"), "2026-10-07")).toBe("2026-10-07");
		expect(draftFromValue(tags, ["a"])).toEqual(["a"]);
		expect(draftFromValue(def("b", "checkbox"), true)).toBe(true);
		expect(draftFromValue(def("t", "text"), undefined)).toBe("");
		expect(draftFromValue(def("n", "number"), "oops")).toBe("");
	});
	it("choices keep the stored archived option selectable", () => {
		expect(choicesFor(tier, "gold").map((o) => o.value)).toEqual(["gold", "silver"]);
		expect(choicesFor(tier, "old").map((o) => o.value)).toEqual(["gold", "silver", "old"]);
	});
});

describe("buildProperties", () => {
	const defs = [def("name", "text"), def("seats", "number"), tier, def("ro", "text", { read_only: true }), def("flag", "checkbox")];
	it("edit sends only changed keys, null clears, read_only is never sent", () => {
		const original = { name: "Acme", seats: 5, tier: "gold", ro: "x" };
		const same = buildProperties(defs, original, {}, "edit");
		expect(same).toEqual({ patch: {}, issues: {} });
		const r = buildProperties(defs, original, { name: "", seats: "7", ro: "hack", tier: "gold" }, "edit");
		expect(r.patch).toEqual({ name: null, seats: 7 });
		expect(r.issues).toEqual({});
	});
	it("edit: a checkbox turned on is sent as true; unchanged unset checkbox is not sent", () => {
		expect(buildProperties(defs, {}, {}, "edit").patch).toEqual({});
		expect(buildProperties(defs, {}, { flag: true }, "edit").patch).toEqual({ flag: true });
	});
	it("edit: clearing a required key is an issue, an unchanged invalid legacy value is not re-validated", () => {
		const req = [def("name", "text", { required: true }), def("n", "number", { validation: { max: 3 } })];
		expect(buildProperties(req, { name: "A", n: 99 }, { name: " " }, "edit").issues).toEqual({ name: { code: "REQUIRED" } });
		expect(buildProperties(req, { name: "A", n: 99 }, {}, "edit")).toEqual({ patch: {}, issues: {} });
		expect(buildProperties(req, { name: "A", n: 99 }, { n: "100" }, "edit").issues.n?.code).toBe("TOO_LARGE");
	});
	it("create requires required keys, skips empty optional ones and read_only", () => {
		const cdefs = [def("name", "text", { required: true }), def("seats", "number"), def("ro", "text", { read_only: true })];
		expect(buildProperties(cdefs, {}, {}, "create")).toEqual({ patch: {}, issues: { name: { code: "REQUIRED" } } });
		expect(buildProperties(cdefs, {}, { name: "Acme", seats: "" }, "create")).toEqual({ patch: { name: "Acme" }, issues: {} });
	});
});

describe("request bodies", () => {
	const base = { commandId: "c1", version: 4 };
	it("withProperties adds the map, or builds a minimal body for a custom-only change", () => {
		expect(withProperties({ command_id: "c1", expected_version: 4, title: "T" }, { a: 1 }, base)).toEqual({ command_id: "c1", expected_version: 4, title: "T", properties: { a: 1 } });
		expect(withProperties(null, { a: null }, base)).toEqual({ command_id: "c1", expected_version: 4, properties: { a: null } });
		expect(withProperties(null, {}, base)).toBeNull();
		const body = { command_id: "c1" };
		expect(withProperties(body, {}, base)).toBe(body);
	});
	it("withCreateProperties leaves the body alone without values", () => {
		const body = { title: "T" };
		expect(withCreateProperties(body, {})).toBe(body);
		expect(withCreateProperties(body, { a: "x" })).toEqual({ title: "T", properties: { a: "x" } });
	});
});

describe("server errors", () => {
	it("maps properties.<key> issues to their key and leaves the rest", () => {
		const r = serverPropertyIssues([
			{ field: "properties.seats", code: "OUT_OF_RANGE" },
			{ field: "properties.seats", code: "OTHER" },
			{ field: "properties[tier]", code: "OPTION_INVALID" },
			{ field: "title", code: "REQUIRED" },
		]);
		expect(r.byKey).toEqual({ seats: "OUT_OF_RANGE", tier: "OPTION_INVALID" });
		expect(r.other).toEqual([{ field: "title", code: "REQUIRED" }]);
	});
	it("classifies codes into message groups with a generic fallback", () => {
		expect(serverIssueSuffix("REQUIRED")).toBe("REQUIRED");
		expect(serverIssueSuffix("FIELD_NOT_WRITABLE")).toBe("READONLY");
		expect(serverIssueSuffix("OPTION_ARCHIVED")).toBe("OPTION_INVALID");
		expect(serverIssueSuffix("TOO_LONG")).toBe("LENGTH");
		expect(serverIssueSuffix("OUT_OF_RANGE")).toBe("RANGE");
		expect(serverIssueSuffix("NOT_A_NUMBER")).toBe("TYPE");
		expect(serverIssueSuffix("WHATEVER")).toBe("generic");
	});
});

describe("read formatting", () => {
	const ctx = (locale: "en" | "ar"): ReadCtx => ({
		locale,
		number: (n) => formatNumber(n, locale, { maximumFractionDigits: 6 }),
		moneyMinor: (m, c) => formatMoneyMinor(m, locale, c),
		date: (d) => formatDate(d, locale),
		dateTime: (iso) => formatDateTime(iso, locale),
		yes: locale === "ar" ? "نعم" : "Yes",
		no: locale === "ar" ? "لا" : "No",
		userName: (id) => (id === "u1" ? "Mona" : "?"),
	});
	it("empty values", () => {
		for (const v of [null, undefined, "", []]) expect(readValue(def("t", "text"), v, ctx("en"))).toEqual({ kind: "empty" });
	});
	it("numbers, money and dates use Arabic digits in AR and Latin in EN", () => {
		const n = def("n", "number");
		expect(readValue(n, 1234.5, ctx("ar"))).toMatchObject({ kind: "num", text: expect.stringMatching(/^[٠-٩٫٬]+$/) });
		expect(readValue(n, 1234.5, ctx("en"))).toMatchObject({ kind: "num", text: "1,234.5" });
		const c = def("c", "currency", { currency: "EGP" });
		const ar = readValue(c, 150050, ctx("ar"));
		expect(ar.kind).toBe("money");
		expect(ar.kind === "money" && /[٠-٩]/.test(ar.text) && !/[0-9]/.test(ar.text)).toBe(true);
		const d = readValue(def("d", "date"), "2026-10-07", ctx("ar"));
		expect(d.kind === "num" && /[٠-٩]/.test(d.text) && !/[0-9]/.test(d.text)).toBe(true);
		expect(readValue(def("d", "date"), "2026-10-07", ctx("en"))).toMatchObject({ text: expect.stringContaining("7") });
	});
	it("booleans and users", () => {
		expect(readValue(def("b", "checkbox"), true, ctx("en"))).toEqual({ kind: "plain", text: "Yes" });
		expect(readValue(def("b", "checkbox"), false, ctx("ar"))).toEqual({ kind: "plain", text: "لا" });
		expect(readValue(def("u", "user"), "u1", ctx("en"))).toEqual({ kind: "plain", text: "Mona" });
	});
	it("selects become chips with the option label in the UI language and colour", () => {
		expect(readValue(tier, "gold", ctx("en"))).toEqual({ kind: "chips", chips: [{ value: "gold", label: "GOLD", color: "amber", archived: false }] });
		expect(readValue(tier, "gold", ctx("ar"))).toMatchObject({ chips: [{ label: "GOLD" }] });
		expect(readValue(tier, "old", ctx("en"))).toMatchObject({ chips: [{ archived: true }] });
		expect(readValue(tags, ["a", "b"], ctx("en"))).toMatchObject({ kind: "chips", chips: [{ value: "a" }, { value: "b" }] });
		expect(readValue(tags, ["ghost"], ctx("en"))).toMatchObject({ chips: [{ value: "ghost", label: "ghost", archived: true }] });
	});
	it("long text is multiline; text that is a url / email / phone becomes a link", () => {
		expect(readValue(def("l", "long_text"), "a\nb", ctx("en"))).toEqual({ kind: "multiline", text: "a\nb" });
		expect(readValue(def("t", "text"), "https://x.test/a", ctx("en"))).toEqual({ kind: "link", text: "https://x.test/a", href: "https://x.test/a" });
		expect(linkOf("a@b.co", "text")?.href).toBe("mailto:a@b.co");
		expect(linkOf("+20 100 123 4567", "text")?.href).toBe("tel:+201001234567");
		expect(linkOf("javascript:alert(1)", "text")).toBeNull();
		expect(linkOf("see https://x.test", "text")).toBeNull();
		expect(linkOf("https://x.test", "long_text")).toBeNull();
	});
});

describe("grouping", () => {
	const schema = {
		object: "lead",
		schema_rev: 1,
		limits: { properties: 100, options: 200, groups: 50 },
		types: [],
		option_colors: [],
		groups: [
			{ key: "general", label: "General", position: 1, version: 1, archived: false },
			{ key: "extra", label: "Extra", position: 2, version: 1, archived: false },
		],
		properties: [
			def("title", "text", { is_system: true }),
			def("a", "text", { position: 2 }),
			def("b", "text", { position: 1, required: true, group: "extra" }),
			def("c", "text", { position: 3, archived: true }),
			def("d", "text", { position: 4, required: true, read_only: true }),
		],
	} as unknown as ObjectSchema;
	it("lists active custom properties by group; system and archived ones are left out", () => {
		expect(customGroups(schema, "en").map((g) => [g.group.key, g.properties.map((p) => p.key)])).toEqual([
			["general", ["a", "d"]],
			["extra", ["b"]],
		]);
	});
	it("the create dialog asks only for required, writable ones", () => {
		expect(createGroups(schema, "en").map((g) => [g.group.key, g.properties.map((p) => p.key)])).toEqual([["extra", ["b"]]]);
	});
	it("a sensitive property without a returned value is hidden in the read view", () => {
		const s = def("ssn", "text", { sensitive: true });
		expect(visibleInRead(s, {})).toBe(false);
		expect(visibleInRead(s, { ssn: "x" })).toBe(true);
		expect(visibleInRead(def("t", "text"), {})).toBe(true);
	});
});

it("R09 client email/phone/url drafts normalize accepted values and reject invalid values",()=>{
 for(const [type,input,value] of [["email"," A@EXAMPLE.COM ","a@example.com"],["phone","01001234567","+201001234567"],["url","https://example.com","https://example.com/"]] as const){
  const property={type,validation:{}} as PropertyDef;expect(parseDraft(property,input)).toEqual({ok:true,value});expect(parseDraft(property,"bad")).toEqual({ok:false,issue:{code:"INVALID_VALUE"}});
 }
});
