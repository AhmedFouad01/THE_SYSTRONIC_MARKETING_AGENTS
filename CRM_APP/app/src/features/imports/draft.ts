import { type ImportDraft, newDraft } from "./model.ts";

/** One memory-only scope. Same-tenant reauthentication keeps the draft; actual switches clear it. */
export function createImportDraftStore() {
	let scope: string | null = null;
	let draft = newDraft();
	return {
		open(nextScope: string): ImportDraft {
			if (scope !== nextScope) { scope = nextScope; draft = newDraft(); }
			return draft;
		},
		save(currentScope: string, next: ImportDraft): boolean {
			if (scope !== currentScope) return false;
			draft = next;
			return true;
		},
		clear() { scope = null; draft = newDraft(); },
	};
}
export const importDraftStore = createImportDraftStore();
