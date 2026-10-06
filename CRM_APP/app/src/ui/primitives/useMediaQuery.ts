import { useSyncExternalStore } from "react";

/** Subscribes to a CSS media query; false where matchMedia is unavailable (unit tests, SSR). */
export function useMediaQuery(query: string): boolean {
	return useSyncExternalStore(
		(onChange) => {
			if (
				typeof window === "undefined" ||
				typeof window.matchMedia !== "function"
			)
				return () => {};
			const mql = window.matchMedia(query);
			mql.addEventListener("change", onChange);
			return () => mql.removeEventListener("change", onChange);
		},
		() =>
			typeof window !== "undefined" && typeof window.matchMedia === "function"
				? window.matchMedia(query).matches
				: false,
		() => false,
	);
}

/** Below this width a record opens as a full-screen sheet instead of an inline panel (UX-02). */
export const RECORD_SHEET_QUERY = "(max-width: 1023px)";
export const useRecordSheet = () => useMediaQuery(RECORD_SHEET_QUERY);
/** True from 1024px: the master-detail layout has room for the inline record panel (auto-select first row). */
export const useWideLayout = () => !useMediaQuery(RECORD_SHEET_QUERY);
