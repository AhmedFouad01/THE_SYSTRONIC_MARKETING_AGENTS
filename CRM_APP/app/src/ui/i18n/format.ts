// Intl formatters. Locale tags follow the prototype: ar-EG (Arabic-Indic digits) / en-EG (Latin digits).
import type { Locale } from "../tokens/scales.ts";

export const INTL_LOCALE: Record<Locale, string> = {
	ar: "ar-EG",
	en: "en-EG",
};

export function dirOf(locale: Locale): "rtl" | "ltr" {
	return locale === "ar" ? "rtl" : "ltr";
}

export function formatNumber(
	value: number,
	locale: Locale,
	opts?: Intl.NumberFormatOptions,
): string {
	return new Intl.NumberFormat(INTL_LOCALE[locale], opts).format(value);
}

export function formatPercent(
	fraction: number,
	locale: Locale,
	opts?: Intl.NumberFormatOptions,
): string {
	return formatNumber(fraction, locale, { style: "percent", ...opts });
}

/** Prototype style: `<number> <ISO code>` (e.g. "1,284,500 EGP"). Wrap the result in <Ltr> when rendering in RTL. */
export function formatMoney(
	value: number,
	locale: Locale,
	opts?: { currency?: string; compact?: boolean },
): string {
	const num = formatNumber(
		value,
		locale,
		opts?.compact
			? { notation: "compact", maximumFractionDigits: 1 }
			: undefined,
	);
	return `${num} ${opts?.currency ?? "EGP"}`;
}

export function formatDate(
	value: Date | number | string,
	locale: Locale,
	opts: Intl.DateTimeFormatOptions = {
		day: "numeric",
		month: "short",
		year: "numeric",
	},
): string {
	const d = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(d.getTime())) return "";
	return new Intl.DateTimeFormat(INTL_LOCALE[locale], opts).format(d);
}

/** Replace {name} placeholders. Unknown placeholders are left intact. */
export function interpolate(
	template: string,
	vars?: Record<string, string | number>,
): string {
	if (!vars) return template;
	return template.replace(/\{(\w+)\}/g, (m, k: string) =>
		k in vars ? String(vars[k]) : m,
	);
}
