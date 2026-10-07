import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../../api/index.ts";
import { commitImport, fetchImportHistory, fetchImportJob, fetchImportRows } from "./api.ts";
import { parseCommit, parseHistory, parseJob, parseLedger } from "./jobs.ts";
import type { ImportBody } from "./preview.ts";
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const job = (n = 1) => ({ id: uuid(n), object: "contact", status: "completed", file: { name: "clients.csv", sha256: "a".repeat(64), format: "csv" }, duplicate_mode: "skip", error_policy: "skip", actor_id: uuid(1), total_rows: 1, created: 0, updated: 0, skipped: 1, failed: 0, created_at: "2026-10-08T00:00:00Z" });
const body: ImportBody = { object: "contact", format: "csv", filename: "clients.csv", file_base64: "eA==", mapping: { columns: [{ column: 0, target: "display_name" }] }, options: { duplicate_mode: "skip", error_policy: "skip" } };
const row = (n: number) => ({ row_no: n, outcome: "skipped", reason: "DUPLICATE", record_kind: "contact", record_id: uuid(1) });
const response = (data: unknown, nextCursor: string | null = null, nextAfter: number | null = null) => ({ data, nextCursor, nextAfter, requestId: "ref", hasMore: null, total: null });
afterEach(() => vi.restoreAllMocks());
describe("import evidence pagination and adapters", () => {
	it("accepts exactly 50 history jobs and rejects oversized pages or incompatible cursor", () => {
		const jobs = Array.from({ length: 50 }, (_, n) => job(n + 1)); expect(parseHistory(jobs, uuid(50)).jobs).toHaveLength(50);
		expect(() => parseHistory([...jobs, job(51)], uuid(50))).toThrow(); expect(() => parseHistory(jobs, uuid(99))).toThrow(); expect(() => parseHistory([job(), job()], null)).toThrow();
	});
	it("accepts exactly 200 ordered ledger rows and preserves numeric paging/outcome filter", () => {
		const rows = Array.from({ length: 200 }, (_, n) => row(n + 2)); expect(parseLedger(rows, 201, 0, "skipped").next).toBe(201);
		for (const [items, next, after, filter] of [[Array(201).fill(row(2)), 202, 0, ""], [[row(2), row(2)], null, 0, ""], [[row(2)], 2, 2, ""], [[row(2)], null, 0, "created"], [[row(2)], undefined, 0, ""]] as const) expect(() => parseLedger(items, next, after, filter)).toThrow();
	});
	it("validates all four outcome counts and rejects malformed job/commit shapes", () => {
		expect(parseJob(job()).skipped).toBe(1); expect(() => parseJob({ ...job(), failed: 1 })).toThrow(); expect(() => parseJob({ ...job(), created_at: "fake" })).toThrow(); expect(() => parseCommit({ job: job(), replayed: "yes", error_rows: [] }, body)).toThrow();
		expect(parseCommit({ job: job(), replayed: true, error_rows: [] }, body).replayed).toBe(true);
	});
	it("posts the reviewed body with caller-stable key and preserves replay response", async () => {
		const post = vi.spyOn(apiClient, "post").mockResolvedValue(response({ job: job(), replayed: true, error_rows: [] }));
		expect((await commitImport(body, "same-key")).replayed).toBe(true); expect(post.mock.calls[0]?.[0]).toBe("imports"); expect(post.mock.calls[0]?.[1]).toBe(body); expect(post.mock.calls[0]?.[2]?.idempotencyKey).toBe("same-key"); expect(body).not.toHaveProperty("preview_rows");
	});
	it("passes server cursor and next-after as separate bounded contract values", async () => {
		const get = vi.spyOn(apiClient, "get").mockResolvedValueOnce(response([job(50)], uuid(50))).mockResolvedValueOnce(response([row(201)], null, 201)).mockResolvedValueOnce(response(job()));
		expect((await fetchImportHistory(uuid(1))).next).toBe(uuid(50)); expect(get.mock.calls[0]).toEqual(["imports", { query: { cursor: uuid(1) }, signal: undefined }]);
		expect((await fetchImportRows(uuid(1), 200, "skipped")).next).toBe(201); expect(get.mock.calls[1]).toEqual([`imports/${uuid(1)}/rows`, { query: { after: 200, outcome: "skipped" }, signal: undefined }]);
		expect((await fetchImportJob(uuid(1))).id).toBe(uuid(1));
	});
	it("rejects unsafe identifiers/filter/cursors before issuing reads", async () => {
		const get = vi.spyOn(apiClient, "get"); await expect(fetchImportJob("../../other")).rejects.toThrow(); await expect(fetchImportHistory("bad")).rejects.toThrow(); await expect(fetchImportRows(uuid(1), -1, "")).rejects.toThrow(); await expect(fetchImportRows(uuid(1), 0, "invented")).rejects.toThrow(); expect(get).not.toHaveBeenCalled();
	});
});
