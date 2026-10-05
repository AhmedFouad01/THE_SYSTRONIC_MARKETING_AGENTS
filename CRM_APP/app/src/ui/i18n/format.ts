// Locale layer. Every formatter returns ONE finished string per locale (never number + text pieces joined by
// code), so bidi reordering cannot garble it. Render results inside <Bdi>/<Ltr> where they sit in running text.
// Locale tags follow the prototype: ar-EG (Arabic-Indic digits) / en-EG (Latin digits).
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

/** Count / quantity: grouped integer in the locale's digits. */
export function formatCount(value: number, locale: Locale): string {
	return formatNumber(Math.trunc(value), locale, { maximumFractionDigits: 0 });
}

export function formatPercent(
	fraction: number,
	locale: Locale,
	opts?: Intl.NumberFormatOptions,
): string {
	return formatNumber(fraction, locale, { style: "percent", ...opts });
}

/** ISO 4217 minor-unit exponent (EGP 2, JPY 0, KWD 3) as the platform ICU reports it; 2 if the code is unknown. */
export function currencyExponent(currency: string): number {
	try {
		return (
			new Intl.NumberFormat("en", {
				style: "currency",
				currency,
			}).resolvedOptions().maximumFractionDigits ?? 2
		);
	} catch {
		return 2;
	}
}

/** Minor units (integer) to major units using the currency's real exponent. */
export function minorToMajorUnits(minor: number, currency: string): number {
	return minor / 10 ** currencyExponent(currency);
}

/**
 * Money as ONE string via Intl currency style (symbol/placement/digits per locale); `value` is in MAJOR units.
 * Whole amounts drop the fraction digits. Wrap the result in <Bdi> / <Ltr> when rendering.
 */
export function formatMoney(
	value: number,
	locale: Locale,
	opts?: { currency?: string; compact?: boolean },
): string {
	const currency = opts?.currency ?? "EGP";
	const base: Intl.NumberFormatOptions = { style: "currency", currency };
	let o: Intl.NumberFormatOptions = base;
	if (opts?.compact)
		o = { ...base, notation: "compact", maximumFractionDigits: 1 };
	else if (Number.isInteger(value))
		o = { ...base, minimumFractionDigits: 0, maximumFractionDigits: 0 };
	try {
		return formatNumber(value, locale, o);
	} catch {
		return `${formatNumber(value, locale)} ${currency}`; // malformed currency code from the server
	}
}

/** Money from minor units, with the exponent resolved per currency. */
export function formatMoneyMinor(
	minor: number,
	locale: Locale,
	currency: string,
	opts?: { compact?: boolean },
): string {
	return formatMoney(minorToMajorUnits(minor, currency), locale, {
		currency,
		...opts,
	});
}

const DATE_ONLY: Intl.DateTimeFormatOptions = {
	day: "numeric",
	month: "short",
	year: "numeric",
};
const DATE_TIME: Intl.DateTimeFormatOptions = {
	...DATE_ONLY,
	hour: "numeric",
	minute: "2-digit",
};

export function formatDate(
	value: Date | number | string,
	locale: Locale,
	opts: Intl.DateTimeFormatOptions = DATE_ONLY,
): string {
	const d = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(d.getTime())) return "";
	const out = new Intl.DateTimeFormat(INTL_LOCALE[locale], opts).format(d);
	// Arabic text never carries the Latin comma (UX-01): date/time separators use U+060C.
	return locale === "ar" ? out.replace(/,/g, "،") : out;
}

/** Date + time as ONE string. Explicit fields, not dateStyle: Arabic dateStyle emits reversed slash dates. */
export function formatDateTime(
	value: Date | number | string,
	locale: Locale,
	opts?: { timeZone?: string },
): string {
	return formatDate(value, locale, { ...DATE_TIME, ...opts });
}

export const RELATIVE_LIMIT_MS = 7 * 24 * 60 * 60 * 1000;

/** "منذ 12 دقيقة" / "12 minutes ago" for |delta| < 7 days, otherwise a date-only string. `now` is injectable. */
export function formatRelative(
	value: Date | number | string,
	locale: Locale,
	now: Date | number = Date.now(),
	opts?: { timeZone?: string },
): string {
	const d = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(d.getTime())) return "";
	const delta = d.getTime() - (typeof now === "number" ? now : now.getTime());
	if (Math.abs(delta) >= RELATIVE_LIMIT_MS)
		return formatDate(d, locale, { ...DATE_ONLY, ...opts });
	const rtf = new Intl.RelativeTimeFormat(INTL_LOCALE[locale], {
		numeric: "auto",
	});
	const sec = Math.round(delta / 1000);
	const abs = Math.abs(sec);
	if (abs < 60) return rtf.format(0, "second");
	if (abs < 3600) return rtf.format(Math.round(sec / 60), "minute");
	if (abs < 86400) return rtf.format(Math.round(sec / 3600), "hour");
	return rtf.format(Math.round(sec / 86400), "day");
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

/** Like interpolate, but returns parts so the caller can isolate each value (e.g. wrap in <bdi>). */
export function interpolateParts<T>(
	template: string,
	vars: Record<string, string | number> | undefined,
	wrap: (value: string, key: string) => T,
): Array<string | T> {
	const out: Array<string | T> = [];
	let last = 0;
	for (const m of template.matchAll(/\{(\w+)\}/g)) {
		const idx = m.index ?? 0;
		const key = m[1] ?? "";
		if (idx > last) out.push(template.slice(last, idx));
		out.push(vars && key in vars ? wrap(String(vars[key]), key) : m[0]);
		last = idx + m[0].length;
	}
	if (last < template.length) out.push(template.slice(last));
	return out;
}
