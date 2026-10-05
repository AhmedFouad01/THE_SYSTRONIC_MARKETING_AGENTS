import {
	createContext,
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
import { type MessageKey, en } from "./en.ts";
import {
	dirOf,
	formatDate,
	formatMoney,
	formatNumber,
	formatPercent,
	interpolate,
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
	formatNumber: (v: number, o?: Intl.NumberFormatOptions) => string;
	formatPercent: (fraction: number, o?: Intl.NumberFormatOptions) => string;
	formatMoney: (
		v: number,
		o?: { currency?: string; compact?: boolean },
	) => string;
	formatDate: (
		v: Date | number | string,
		o?: Intl.DateTimeFormatOptions,
	) => string;
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
			formatNumber: (v, o) => formatNumber(v, locale, o),
			formatPercent: (f, o) => formatPercent(f, locale, o),
			formatMoney: (v, o) => formatMoney(v, locale, o),
			formatDate: (v, o) => formatDate(v, locale, o),
		};
	}, [locale, dir, setLocale, toggleLocale]);

	return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
	const v = useContext(Ctx);
	if (!v) throw new Error("I18nProvider missing");
	return v;
}
