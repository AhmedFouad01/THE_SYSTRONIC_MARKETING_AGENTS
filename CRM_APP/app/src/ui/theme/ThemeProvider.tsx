import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useLayoutEffect,
	useMemo,
	useState,
} from "react";
import { readPref, writePref } from "../storage.ts";
import { buildTokensCss } from "../tokens/css.ts";
import type { Mode } from "../tokens/scales.ts";
import "../tokens/tailwind.css";
import "./base.css";

export const THEME_STORAGE_KEY = "sy.theme";
const STYLE_ID = "sy-tokens";

export function parseMode(raw: string | null): Mode {
	return raw === "dark" ? "dark" : "light"; // light is the default
}

/** Injects the token custom properties once. Safe to call repeatedly / outside the DOM. */
export function ensureTokenStyles(): void {
	if (typeof document === "undefined" || document.getElementById(STYLE_ID))
		return;
	const el = document.createElement("style");
	el.id = STYLE_ID;
	el.textContent = buildTokensCss();
	document.head.appendChild(el);
}

type ThemeCtx = {
	mode: Mode;
	setMode: (m: Mode) => void;
	toggleMode: () => void;
	reducedMotion: boolean;
};

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
	ensureTokenStyles();
	const [mode, setModeState] = useState<Mode>(() =>
		parseMode(readPref(THEME_STORAGE_KEY)),
	);
	const [reducedMotion, setReducedMotion] = useState(false);

	useLayoutEffect(() => {
		document.documentElement.dataset.theme = mode;
	}, [mode]);

	useEffect(() => {
		if (typeof window.matchMedia !== "function") return;
		const q = window.matchMedia("(prefers-reduced-motion: reduce)");
		const apply = () => {
			setReducedMotion(q.matches);
			document.documentElement.dataset.reducedMotion = String(q.matches);
		};
		apply();
		q.addEventListener("change", apply);
		return () => q.removeEventListener("change", apply);
	}, []);

	const setMode = useCallback((m: Mode) => {
		setModeState(m);
		writePref(THEME_STORAGE_KEY, m);
	}, []);
	const toggleMode = useCallback(
		() => setMode(mode === "light" ? "dark" : "light"),
		[mode, setMode],
	);

	const value = useMemo(
		() => ({ mode, setMode, toggleMode, reducedMotion }),
		[mode, setMode, toggleMode, reducedMotion],
	);
	return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
	const v = useContext(Ctx);
	if (!v) throw new Error("ThemeProvider missing");
	return v;
}
