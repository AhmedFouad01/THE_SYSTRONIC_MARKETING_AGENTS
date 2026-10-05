import { describe, expect, it } from "vitest";
import { ar } from "./ar.ts";
import { en } from "./en.ts";
import {
	currencyExponent,
	formatCount,
	formatDateTime,
	formatMoney,
	formatMoneyMinor,
	formatRelative,
	interpolateParts,
	minorToMajorUnits,
} from "./format.ts";
import { personLabel, roleLabel, sourceEvidenceLabel, sourceLabel } from "./labels.ts";

// Fixed clock: 2026-10-05 14:15:00 UTC; all date output pinned to UTC.
const NOW = Date.UTC(2026, 9, 5, 14, 15, 0);
const UTC = { timeZone: "UTC" };
const norm = (s: string) => s.replace(/[  ‏‎]/g, " ").trim();

describe("locale layer: dates", () => {
	it("formatDateTime is one string per locale (no reversed slash dates, no Latin digits in AR)", () => {
		const d = "2026-10-05T14:03:00Z";
		expect(norm(formatDateTime(d, "en", UTC))).toBe("Oct 5, 2026, 2:03 PM");
		const a = formatDateTime(d, "ar", UTC);
		expect(a).toContain("أكتوبر");
		expect(a).toMatch(/٢٠٢٦/);
		expect(a).not.toMatch(/[0-9]/);
		expect(a).not.toMatch(/\//);
	});

	it("AR dates never contain the Latin comma (UX-01)", () => {
		const d = "2026-10-05T14:03:00Z";
		expect(formatDateTime(d, "ar", UTC)).not.toContain(",");
		expect(formatDateTime(d, "ar", UTC)).toContain("،");
	});

	it("AR money is a single Intl string whose symbol keeps its trailing period (UX-R2-05)", () => {
		const m = formatMoney(296900, "ar").replace(/[‎‏ \s]/g, "");
		expect(m).toMatch(/^[٠-٩٬٫]+ج\.م\.$/);
	});

	it("sourceEvidenceLabel maps known source tokens, keeps free text, omits empty (UX-11)", () => {
		const t = (k: Parameters<typeof sourceLabel>[1] extends (k: infer K) => string ? K : never) => en[k];
		expect(sourceEvidenceLabel("referral", t)).toBe("Referral");
		expect(sourceEvidenceLabel(" Web Form ", t)).toBe("Website form");
		expect(sourceEvidenceLabel("Met at the Cairo expo", t)).toBe("Met at the Cairo expo");
		expect(sourceEvidenceLabel("  ", t)).toBeNull();
		expect(sourceEvidenceLabel(null, t)).toBeNull();
	});

	it("formatRelative: relative under 7 days (AR + EN), date-only from 7 days", () => {
		const min12 = NOW - 12 * 60_000;
		expect(formatRelative(min12, "en", NOW)).toBe("12 minutes ago");
		expect(formatRelative(min12, "ar", NOW)).toBe("قبل ١٢ دقيقة");
		expect(formatRelative(NOW - 2 * 3_600_000, "en", NOW)).toBe("2 hours ago");
		expect(formatRelative(NOW - 3 * 86_400_000, "en", NOW)).toBe("3 days ago");
		expect(formatRelative(NOW + 2 * 3_600_000, "en", NOW)).toBe("in 2 hours");
		expect(formatRelative(NOW - 10_000, "en", NOW)).toBe("now");
		// exactly 7 days and beyond: date only
		expect(norm(formatRelative(NOW - 7 * 86_400_000, "en", NOW, UTC))).toBe("Sep 28, 2026");
		expect(formatRelative(NOW - 30 * 86_400_000, "ar", NOW, UTC)).toBe("٥ سبتمبر ٢٠٢٦");
		expect(formatRelative("not a date", "en", NOW)).toBe("");
	});
});

describe("locale layer: numbers and money", () => {
	it("formatCount groups integers in the locale's digits", () => {
		expect(formatCount(12345, "en")).toBe("12,345");
		expect(formatCount(12345, "ar")).toBe("١٢٬٣٤٥");
		expect(formatCount(7.9, "en")).toBe("7");
	});

	it("currency exponent comes from ISO currency data, not a fixed 100", () => {
		expect(currencyExponent("EGP")).toBe(2);
		expect(currencyExponent("JPY")).toBe(0);
		expect(currencyExponent("KWD")).toBe(3);
		expect(currencyExponent("??")).toBe(2);
		expect(minorToMajorUnits(125050, "EGP")).toBe(1250.5);
		expect(minorToMajorUnits(1500, "JPY")).toBe(1500);
		expect(minorToMajorUnits(1500, "KWD")).toBe(1.5);
	});

	it("formatMoneyMinor / formatMoney use Intl currency formatting", () => {
		expect(norm(formatMoneyMinor(125050, "en", "EGP"))).toBe("EGP 1,250.50");
		expect(norm(formatMoneyMinor(1500, "en", "JPY"))).toBe("¥1,500");
		expect(norm(formatMoney(2500, "en", { currency: "USD" }))).toBe("$2,500");
		expect(formatMoneyMinor(125050, "ar", "EGP")).not.toMatch(/[0-9]/);
		expect(formatMoney(5, "en", { currency: "bad" })).toContain("5"); // never throws on a bad code
	});
});

describe("locale layer: messages and labels", () => {
	it("range / page messages are single messages with placeholders in both locales", () => {
		expect(en["grid.range"]).toBe("{from}–{to} of {total}");
		expect(ar["grid.range"]).toBe("{from}–{to} من {total}");
		expect(en["grid.page"]).toBe("Page {page} of {count}");
		expect(ar["grid.page"]).toBe("الصفحة {page} من {count}");
	});

	it("interpolateParts isolates each placeholder value", () => {
		const parts = interpolateParts(ar["grid.range"], { from: "١", to: "١٠", total: "١٤" }, (v) => `[${v}]`);
		expect(parts.join("")).toBe("[١]–[١٠] من [١٤]");
		expect(interpolateParts("a {x} b", {}, (v) => v)).toEqual(["a ", "{x}", " b"]);
	});

	it("no dictionary string leaks seed/dev wording", () => {
		for (const [name, dict] of [["en", en], ["ar", ar]] as const)
			for (const [k, v] of Object.entries(dict)) {
				expect(v, `${name}.${k}`).not.toMatch(/synthetic|تجريب/i);
			}
	});

	it("source / role / person labels never return a raw value", () => {
		const t = (k: keyof typeof en) => en[k];
		expect(sourceLabel("manual", t)).toBe("Manual entry");
		expect(sourceLabel("Referral", t)).toBe("Referral");
		expect(sourceLabel("web-form", t)).toBe("Website form");
		expect(sourceLabel("some_odd_value", t)).toBe("Other");
		expect(sourceLabel("", t)).toBe("Not recorded");
		expect(roleLabel("manager", t)).toBe("Manager");
		expect(roleLabel("zzz", t)).toBe("Team member");
		expect(personLabel(null, t)).toBe("Team member");
		expect(personLabel("Mona", t)).toBe("Mona");
		const ta = (k: keyof typeof en) => ar[k];
		expect(sourceLabel("referral", ta)).toBe("إحالة");
	});
});
