import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ar } from "./ar.ts";
import { en } from "./en.ts";
import {
	dirOf,
	formatDate,
	formatMoney,
	formatNumber,
	formatPercent,
	interpolate,
} from "./format.ts";
import { parseLocale } from "./I18nProvider.tsx";
import { Ltr, ltrIsolate } from "./Ltr.tsx";

const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();

describe("i18n dictionaries", () => {
	it("AR and EN have identical key sets", () => {
		expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
	});

	it("no empty strings and placeholders match per key", () => {
		for (const k of Object.keys(en) as Array<keyof typeof en>) {
			expect(en[k].trim(), `en.${k}`).not.toBe("");
			expect(ar[k].trim(), `ar.${k}`).not.toBe("");
			expect(placeholders(ar[k]), `placeholders ${k}`).toEqual(
				placeholders(en[k]),
			);
		}
	});

	it("Arabic strings contain Arabic script (except brand/language names)", () => {
		const exempt = new Set(["app.name", "locale.switchTo"]);
		for (const [k, v] of Object.entries(ar))
			if (!exempt.has(k)) expect(v, k).toMatch(/[؀-ۿ]/);
	});
});

describe("locale + formatters", () => {
	it("parseLocale defaults to ar, accepts en/ar only", () => {
		expect(parseLocale(null)).toBe("ar");
		expect(parseLocale("fr")).toBe("ar");
		expect(parseLocale("en")).toBe("en");
		expect(parseLocale("ar")).toBe("ar");
	});

	it("dirOf", () => {
		expect(dirOf("ar")).toBe("rtl");
		expect(dirOf("en")).toBe("ltr");
	});

	it("formatNumber uses Latin digits in EN and Arabic-Indic in AR", () => {
		expect(formatNumber(1284500, "en")).toBe("1,284,500");
		expect(formatNumber(1284500, "ar")).toMatch(/^[٠-٩٫٬]+$/);
	});

	it("formatMoney is one Intl currency string per locale", () => {
		const n = (s: string) => s.replace(/[ ‏]/g, " ").trim();
		expect(n(formatMoney(1284500, "en"))).toBe("EGP 1,284,500");
		expect(n(formatMoney(1284500, "en", { currency: "USD" }))).toBe("$1,284,500");
		expect(n(formatMoney(1284500, "en", { compact: true }))).toBe("EGP 1.3M");
		expect(formatMoney(1284500, "ar")).toMatch(/[٠-٩]/);
		expect(formatMoney(1284500, "ar")).not.toMatch(/[0-9]/);
	});

	it("formatPercent", () => {
		expect(formatPercent(0.25, "en")).toBe("25%");
		expect(formatPercent(0.25, "ar")).toMatch(/[٠-٩]/);
	});

	it("formatDate is locale aware, timezone-explicit, and tolerant of invalid input", () => {
		const d = new Date("2026-10-10T12:00:00Z");
		const opts = {
			day: "numeric",
			month: "short",
			year: "numeric",
			timeZone: "UTC",
		} as const;
		expect(formatDate(d, "en", opts)).toMatch(/Oct.*10.*2026/);
		expect(formatDate(d, "ar", opts)).toMatch(/[٠-٩]/);
		expect(formatDate("not-a-date", "en")).toBe("");
	});

	it("interpolate replaces known placeholders and keeps unknown ones", () => {
		expect(interpolate("{count} matching", { count: 3 })).toBe("3 matching");
		expect(interpolate("{a}-{b}", { a: 1 })).toBe("1-{b}");
		expect(interpolate("plain")).toBe("plain");
	});
});

describe("bidi helpers", () => {
	it("<Ltr> renders an isolated LTR bdi", () => {
		const html = renderToStaticMarkup(<Ltr>LEAD-0042</Ltr>);
		expect(html).toBe('<bdi dir="ltr" class="sy-ltr">LEAD-0042</bdi>');
	});

	it("ltrIsolate wraps with LRI/PDI", () => {
		expect(ltrIsolate("a@b.co")).toBe("⁦a@b.co⁩");
	});
});
