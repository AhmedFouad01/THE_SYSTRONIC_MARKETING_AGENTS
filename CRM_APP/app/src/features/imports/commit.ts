import { isApiError } from "../../api/errors.ts";
import { commitImport } from "./api.ts";
import { importDraftStore } from "./draft.ts";
import type { ImportDraft } from "./model.ts";
import type { CommitResult, CommitState } from "./jobs.ts";
import type { ImportBody } from "./preview.ts";
import { reviewGate } from "./preview.ts";

type Store = { peek(scope: string): ImportDraft | null; save(scope: string, draft: ImportDraft): boolean };
export function createCommitController(store: Store, send: (body: ImportBody, key: string) => Promise<CommitResult>, newKey: () => string = () => crypto.randomUUID()) {
	const running = new Set<object>();
	return {
		async submit(scope: string, authorized: boolean, issues: readonly string[] = []): Promise<void> {
			let draft = store.peek(scope);
			if (!draft || !authorized || issues.length || (draft.commit.pending !== null && running.has(draft.commit.pending)) || draft.commit.phase === "complete") return;
			const retry = draft.commit.phase === "uncertain" && draft.commit.pending?.scope === scope;
			if (!retry && reviewGate(draft, issues) !== "ready") return;
			const pending = retry ? draft.commit.pending : draft.preview ? { scope, fileHash: draft.inspection?.file.sha256 ?? "", key: newKey(), body: structuredClone(draft.preview.body) } : null;
			if (!pending) return;
			running.add(pending);
			store.save(scope, { ...draft, step: "result", commit: { phase: "submitting", pending, result: null, failure: null } });
			try {
				const result = await send(pending.body, pending.key);
				if (result.job.file.sha256 !== pending.fileHash) throw new Error("INVALID_IMPORT_RESPONSE");
				draft = store.peek(scope);
				if (draft?.commit.pending === pending) store.save(scope, { ...draft, commit: { phase: "complete", pending, result, failure: null } });
			} catch (failure) {
				draft = store.peek(scope);
				if (draft?.commit.pending !== pending) return;
				const api = isApiError(failure) ? failure : null;
				const uncertain = !api || api.status === 0 || api.status === 401 || api.status >= 500;
				const state: CommitState = { phase: uncertain ? "uncertain" : "failed", pending, result: null, failure: { code: api?.code ?? "NETWORK", safeMessage: api?.safeMessage ?? "", requestId: api?.requestId ?? null, retryable: api?.retryable ?? true, status: api?.status ?? 0 } };
				store.save(scope, { ...draft, preview: uncertain ? draft.preview : null, commit: state });
			} finally { running.delete(pending); }
		},
	};
}
/** Continues across same-scope reauthentication/unmount; a scope switch clears the command store. */
export const importCommitController = createCommitController(importDraftStore, commitImport);
