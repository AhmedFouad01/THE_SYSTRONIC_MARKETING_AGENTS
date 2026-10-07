import { type ImportDraft, newDraft } from "./model.ts";

/** One memory-only scope. Same-tenant reauthentication keeps the draft; actual switches clear it. */
export function createImportDraftStore() {
	let scope: string | null = null;
	let draft = newDraft();
	const listeners = new Set<() => void>();
	const emit = () => { for (const listener of listeners) listener(); };
	return {
		subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
		peek(currentScope: string): ImportDraft | null { return scope === currentScope ? draft : null; },
		open(nextScope: string): ImportDraft {
			if (scope !== nextScope) { scope = nextScope; draft = newDraft(); }
			return draft;
		},
		save(currentScope: string, next: ImportDraft): boolean {
			if (scope !== currentScope) return false;
			draft = next;
			emit();
			return true;
		},
		clear() { scope = null; draft = newDraft(); emit(); },
	};
}
export const importDraftStore = createImportDraftStore();
