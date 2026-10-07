import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/errors.ts";
import { createSessionStore } from "../../api/session.ts";
import { workspaceKey } from "../../api/workspaces.ts";
import { createCommitController } from "./commit.ts";
import { createImportDraftStore } from "./draft.ts";
import type { Job } from "./jobs.ts";
import { newDraft } from "./model.ts";
import { buildImportBody } from "./preview.ts";

const id = "00000000-0000-4000-8000-000000000001";
const job: Job = { id, object: "contact", status: "completed", file: { name: "clients.csv", sha256: "a".repeat(64), format: "csv" }, duplicate_mode: "skip", error_policy: "skip", actor_id: id, total_rows: 1, created: 1, updated: 0, skipped: 0, failed: 0, created_at: "2026-10-08T00:00:00Z" };
function ready(store: ReturnType<typeof createImportDraftStore>, scope: string) {
	const current = store.open(scope); const draft = { ...current, file: new File(["name\nMona"], "clients.csv"), file_base64: "bmFtZQpNb25h", mapping: [{ column: 0, target: "display_name" }], inspection: { object: "contact" as const, format: "csv" as const, file: { name: "clients.csv", bytes: 9, sha256: "a".repeat(64) }, headers: ["name"], total_rows: 1, samples: [], sheet: null, limits: { fileBytes: 5242880, rows: 5000, columns: 100, cellChars: 20000 } } };
	const preview = { revision: draft.revision, body: buildImportBody(draft), data: { total_rows: 1, summary: { create: 1, update: 0, skip: 0, error: 0, warnings: 0 }, rows: [], error_rows: [], error_rows_truncated: false, already_imported: null } };
	store.save(scope, { ...draft, preview }); return store.peek(scope);
}
describe("synchronous import commit controller", () => {
	it("locks double submissions and stores the exact reviewed body before awaiting", async () => {
		const store = createImportDraftStore(); ready(store, "scope");
		let finish: ((value: { job: Job; replayed: boolean }) => void) | undefined;
		const send = vi.fn(() => new Promise<{ job: Job; replayed: boolean }>((resolve) => { finish = resolve; }));
		const controller = createCommitController(store, send, () => "stable-key");
		const pending = controller.submit("scope", true); await controller.submit("scope", true);
		expect(send).toHaveBeenCalledTimes(1); expect(store.peek("scope")?.commit.phase).toBe("submitting"); expect(send.mock.calls[0]).toHaveLength(2);
		finish?.({ job, replayed: false }); await pending;
		expect(store.peek("scope")?.commit.phase).toBe("complete"); await controller.submit("scope", true); expect(send).toHaveBeenCalledTimes(1);
	});
	it("retries uncertainty with the same body reference/key and preserves original replay time", async () => {
		const store = createImportDraftStore(); ready(store, "scope");
		const send = vi.fn().mockRejectedValueOnce(new Error("network uncertainty")).mockResolvedValueOnce({ job, replayed: true });
		const controller = createCommitController(store, send, () => "stable-key");
		await controller.submit("scope", true); const pending = store.peek("scope")?.commit.pending;
		expect(store.peek("scope")?.commit.phase).toBe("uncertain"); expect(pending?.body).not.toHaveProperty("preview_rows");
		await controller.submit("scope", true);
		expect(send.mock.calls[1]?.[0]).toBe(send.mock.calls[0]?.[0]); expect(send.mock.calls[1]?.[1]).toBe("stable-key");
		expect(store.peek("scope")?.commit.result?.replayed).toBe(true); expect(store.peek("scope")?.commit.result?.job.created_at).toBe(job.created_at);
	});
	it("preserves pending command across same-context reauth and refuses old-scope results after switch", async () => {
		const store = createImportDraftStore();
		const session = createSessionStore({ storage: null, fetchSession: async () => ({ actor: id, configure: true, merge: true, audit: true }), onWorkspaceChange: store.clear });
		await session.connect({ token: "synthetic", tenantId: "tenant" }); const scope = workspaceKey(id, { tenantId: "tenant" }); ready(store, scope);
		let finish: ((value: { job: Job; replayed: boolean }) => void) | undefined;
		const send = vi.fn(() => new Promise<{ job: Job; replayed: boolean }>((resolve) => { finish = resolve; }));
		const controller = createCommitController(store, send, () => "key"); const waiting = controller.submit(scope, true); const pending = store.peek(scope)?.commit.pending;
		session.invalidate(); await session.connect({ token: "replacement", tenantId: "tenant" }); expect(store.open(scope).commit.pending).toBe(pending);
		await session.connect({ token: "replacement", tenantId: "other" }); const other = workspaceKey(id, { tenantId: "other" }); store.open(other);
		finish?.({ job, replayed: false }); await waiting; expect(store.peek(other)?.commit.phase).toBe("idle"); expect(store.peek(scope)).toBeNull();
	});
	it("does not submit denied, stale, all-invalid, abort-error or revoked mappings", async () => {
		const store = createImportDraftStore(); ready(store, "scope"); const send = vi.fn(); const controller = createCommitController(store, send);
		await controller.submit("scope", false); await controller.submit("scope", true, ["UNKNOWN_TARGET"]);
		const current = store.peek("scope"); if (!current?.preview) throw new Error("fixture");
		store.save("scope", { ...current, revision: 99 }); await controller.submit("scope", true);
		const invalid = { ...current, preview: { ...current.preview, data: { ...current.preview.data, summary: { create: 0, update: 0, skip: 0, error: 1, warnings: 0 } } } };
		store.save("scope", invalid); await controller.submit("scope", true); store.save("scope", { ...invalid, options: { ...invalid.options, error_policy: "abort" } }); await controller.submit("scope", true);
		expect(send).not.toHaveBeenCalled();
	});
	it("definite abort failure clears preview and requires a new review; 401 preserves identical retry", async () => {
		const store = createImportDraftStore(); ready(store, "scope"); const send = vi.fn().mockRejectedValue(new ApiError({ status: 422, code: "IMPORT_REJECTED", safeMessage: "Nothing written", retryable: false, requestId: "safe-ref" }));
		const controller = createCommitController(store, send, () => "key"); await controller.submit("scope", true);
		expect(store.peek("scope")?.commit.phase).toBe("failed"); expect(store.peek("scope")?.preview).toBeNull(); await controller.submit("scope", true); expect(send).toHaveBeenCalledTimes(1);
		ready(store, "scope"); send.mockRejectedValue(new ApiError({ status: 401, code: "UNAUTHENTICATED", safeMessage: "", retryable: false, requestId: "ref" })); await controller.submit("scope", true);
		expect(store.peek("scope")?.commit.phase).toBe("uncertain"); expect(store.peek("scope")?.commit.pending?.key).toBe("key");
	});
	it("does not publish a mismatched file job or a response after explicit discard", async () => {
		const store = createImportDraftStore(); ready(store, "scope"); const send = vi.fn().mockResolvedValue({ job: { ...job, file: { ...job.file, sha256: "b".repeat(64) } }, replayed: false });
		await createCommitController(store, send).submit("scope", true); expect(store.peek("scope")?.commit.phase).toBe("uncertain"); store.clear(); expect(store.open("scope").commit).toEqual(newDraft().commit);
	});
	it("cleared then reopened same scope can submit a new command without an old response overwriting it", async () => {
		const store = createImportDraftStore(); ready(store, "scope");
		const finishes: ((value: { job: Job; replayed: boolean }) => void)[] = [];
		const send = vi.fn(() => new Promise<{ job: Job; replayed: boolean }>((resolve) => finishes.push(resolve)));
		const controller = createCommitController(store, send, () => "key"); const old = controller.submit("scope", true);
		store.clear(); ready(store, "scope"); const current = controller.submit("scope", true); expect(send).toHaveBeenCalledTimes(2);
		finishes[1]({ job, replayed: true }); await current; finishes[0]({ job, replayed: false }); await old;
		expect(store.peek("scope")?.commit.result?.replayed).toBe(true);
	});

});
