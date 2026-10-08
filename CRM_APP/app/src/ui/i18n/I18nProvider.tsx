import { I18nProvider as AriaI18nProvider } from "react-aria-components";
import {
	createContext,
	Fragment,
	type ReactNode,
	useCallback,
	useContext,
	useLayoutEffect,
	useMemo,
	useState,
} from "react";
import { readPref, writePref } from "../storage.ts";
import type { Locale } from "../tokens/scales.ts";
import { ar } from "./ar.ts";
import { Bdi } from "./Bdi.tsx";
import { type MessageKey, en } from "./en.ts";
import {
	dirOf,
	formatCount,
	formatDate,
	formatDateTime,
	formatMoney,
	formatNumber,
	formatPercent,
	formatRelative,
	interpolate,
	interpolateParts,
} from "./format.ts";

export const LOCALE_STORAGE_KEY = "sy.locale";
export const DEFAULT_LOCALE: Locale = "ar";

export const dictionaries: Record<Locale, Record<MessageKey, string>> = {
	ar,
	en,
};

export function parseLocale(raw: string | null): Locale {
	return raw === "en" || raw === "ar" ? raw : DEFAULT_LOCALE;
}

type I18nCtx = {
	locale: Locale;
	dir: "rtl" | "ltr";
	setLocale: (l: Locale) => void;
	toggleLocale: () => void;
	t: (key: MessageKey, vars?: Record<string, string | number>) => string;
	/** Message with every placeholder value isolated in <bdi>: numbers/dates/names cannot reorder RTL text. */
	tx: (key: MessageKey, vars?: Record<string, string | number>) => ReactNode;
	formatNumber: (v: number, o?: Intl.NumberFormatOptions) => string;
	formatCount: (v: number) => string;
	formatPercent: (fraction: number, o?: Intl.NumberFormatOptions) => string;
	formatMoney: (
		v: number,
		o?: { currency?: string; compact?: boolean },
	) => string;
	formatDate: (
		v: Date | number | string,
		o?: Intl.DateTimeFormatOptions,
	) => string;
	formatDateTime: (v: Date | number | string) => string;
	/** Relative for < 7 days, otherwise date-only. */
	formatRelative: (v: Date | number | string, now?: Date | number) => string;
};

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
	const [locale, setLocaleState] = useState<Locale>(() =>
		parseLocale(readPref(LOCALE_STORAGE_KEY)),
	);
	const dir = dirOf(locale);

	useLayoutEffect(() => {
		document.documentElement.lang = locale;
		document.documentElement.dir = dir;
	}, [locale, dir]);

	const setLocale = useCallback((l: Locale) => {
		setLocaleState(l);
		writePref(LOCALE_STORAGE_KEY, l);
	}, []);
	const toggleLocale = useCallback(
		() => setLocale(locale === "ar" ? "en" : "ar"),
		[locale, setLocale],
	);

	const value = useMemo<I18nCtx>(() => {
		const dict = dictionaries[locale];
		return {
			locale,
			dir,
			setLocale,
			toggleLocale,
			t: (key, vars) => interpolate(dict[key], vars),
			tx: (key, vars) => {
				let offset = 0; // stable keys: position of each part in the message
				return interpolateParts(dict[key], vars, (v, k) => <Bdi key={k}>{v}</Bdi>).map((p) => {
					const at = offset;
					if (typeof p === "string") offset += p.length;
					return typeof p === "string" ? <Fragment key={`t${at}`}>{p}</Fragment> : p;
				});
			},
			formatNumber: (v, o) => formatNumber(v, locale, o),
			formatCount: (v) => formatCount(v, locale),
			formatPercent: (f, o) => formatPercent(f, locale, o),
			formatMoney: (v, o) => formatMoney(v, locale, o),
			formatDate: (v, o) => formatDate(v, locale, o),
			formatDateTime: (v) => formatDateTime(v, locale),
			formatRelative: (v, now) => formatRelative(v, locale, now),
		};
	}, [locale, dir, setLocale, toggleLocale]);

	return <Ctx.Provider value={value}><AriaI18nProvider locale={locale === "ar" ? "ar-EG" : "en"}>{children}</AriaI18nProvider></Ctx.Provider>;
}

export function useI18n(): I18nCtx {
	const v = useContext(Ctx);
	if (!v) throw new Error("I18nProvider missing");
	return v;
}

/** UI direction for primitives that can render outside a provider (unit tests, isolated previews): LTR fallback. */
export function useUiDir(): "ltr" | "rtl" {
	return useContext(Ctx)?.dir ?? "ltr";
}
