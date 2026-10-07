import { useEffect, useSyncExternalStore } from "react";
import { fetchImportFields } from "./api.ts";

export function createImportAccess() {
	let state: { scope: string; session: unknown; allowed: boolean } = { scope: "", session: null, allowed: false };
	let attempt = 0;
	const listeners = new Set<() => void>();
	const set = (next: typeof state) => { state = next; for (const listener of listeners) listener(); };
	return {
		get: () => state,
		subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
		deny(scope: string) { if (state.scope === scope) { attempt++; set({ ...state, allowed: false }); } },
		async probe(scope: string, session: unknown, fetchFields: (signal: AbortSignal) => Promise<unknown>, signal: AbortSignal) {
			const mine = ++attempt;
			set({ scope, session, allowed: false });
			try { await fetchFields(signal); if (mine === attempt && !signal.aborted) set({ scope, session, allowed: true }); } catch { if (mine === attempt && !signal.aborted) set({ scope, session, allowed: false }); }
		},
	};
}
export const importAccess = createImportAccess();
export function useImportAccess(connected: boolean, scope: string, session: unknown, agency: boolean): boolean {
	const state = useSyncExternalStore(importAccess.subscribe, importAccess.get);
	useEffect(() => {
		if (!connected || agency) { importAccess.deny(scope); return; }
		const controller = new AbortController();
		void importAccess.probe(scope, session, (signal) => fetchImportFields("contact", signal), AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]));
		return () => controller.abort();
	}, [connected, scope, session, agency]);
	return connected && !agency && state.scope === scope && state.session === session && state.allowed;
}
