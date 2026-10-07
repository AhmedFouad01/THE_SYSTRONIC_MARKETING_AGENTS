import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../../api/index.ts";
import { bytesToBase64, fetchImportFields, inspectionBody, inspectUpload, previewImport } from "./api.ts";
import { HARD_LIMITS, newDraft, parseFields } from "./model.ts";

const fields = { object: "contact", formats: ["csv", "xlsx"], limits: HARD_LIMITS, sensitive_mapping: false, targets: [{ target: "display_name", required: true, label: "Name" }] };
const result = (data: unknown) => ({ data, nextCursor: null, requestId: "r", hasMore: null, total: null });
afterEach(() => vi.restoreAllMocks());

describe("upload inspection adapter", () => {
	it("encodes raw binary including padding and chunk boundaries without interpreting cells", () => {
		const bytes = Uint8Array.from([0, 255, 128, 61, 43, 64]);
		expect(bytesToBase64(bytes)).toBe(Buffer.from(bytes).toString("base64"));
		const larger = Uint8Array.from({ length: 9001 }, (_, index) => index % 256);
		expect(bytesToBase64(larger)).toBe(Buffer.from(larger).toString("base64"));
	});
	it("sends only upload/selected-sheet fields, never mapping or owner/country options", () => {
		const draft = { ...newDraft(), file: new File(["test"], "clients.csv"), file_base64: "dGVzdA==" };
		expect(inspectionBody(draft)).toEqual({ object: "contact", format: "csv", filename: "clients.csv", file_base64: "dGVzdA==" });
		const xlsxDraft = { ...draft, file: new File(["test"], "clients.xlsx"), options: { ...draft.options, sheet: "٢", owner_id: "synthetic", default_country_code: "+20" } };
		expect(inspectionBody(xlsxDraft)).toMatchObject({ format: "xlsx", options: { sheet: 2 } });
		expect(inspectionBody(xlsxDraft)).not.toHaveProperty("mapping");
	});
	it("fetches object-scoped fields and propagates the caller cancellation boundary", async () => {
		const get = vi.spyOn(apiClient, "get").mockResolvedValue(result(fields));
		const controller = new AbortController();
		await fetchImportFields("contact", controller.signal);
		expect(get).toHaveBeenCalledWith("imports/fields", { query: { object: "contact" }, signal: controller.signal });
	});
	it("uses the writes-free inspection endpoint and validates its bounded response", async () => {
		const payload = { object: "contact", format: "csv", file: { name: "clients.csv", sha256: "a".repeat(64), bytes: 10 }, headers: ["Name"], total_rows: 1, sheet: null, samples: [{ row: 2, cells: ["Mona"] }], limits: HARD_LIMITS };
		const post = vi.spyOn(apiClient, "post").mockResolvedValue(result(payload));
		const draft = { ...newDraft(), file: new File(["test"], "clients.csv"), file_base64: "dGVzdA==" };
		expect((await inspectUpload(draft, parseFields(fields, "contact"))).headers).toEqual(["Name"]);
		expect(post.mock.calls[0]?.[0]).toBe("imports/inspect");
	});
});

describe("writes-free import preview adapter", () => {
	it("requests 100 sample rows without changing the stored commit body and propagates cancellation", async () => {
		const draft = { ...newDraft(), file: new File(["name\nMona"], "clients.csv"), file_base64: "bmFtZQpNb25h", mapping: [{ column: 0, target: "display_name" }], inspection: { object: "contact" as const, format: "csv" as const, file: { name: "clients.csv", bytes: 9, sha256: "a".repeat(64) }, headers: ["name"], total_rows: 1, samples: [], sheet: null, limits: HARD_LIMITS } };
		const post = vi.spyOn(apiClient, "post").mockResolvedValue(result({ object: "contact", format: "csv", file: draft.inspection.file, headers: ["name"], total_rows: 1, summary: { create: 1, update: 0, skip: 0, error: 0, warnings: 0 }, rows: [{ row: 2, status: "create", values: { display_name: "Mona" } }], error_rows: [], error_rows_truncated: false, already_imported: null }));
		const controller = new AbortController();
		const preview = await previewImport(draft, parseFields(fields, "contact"), controller.signal);
		expect(post).toHaveBeenCalledWith("imports/preview", { ...preview.body, preview_rows: 100 }, { signal: controller.signal });
		expect(preview.body).not.toHaveProperty("preview_rows"); expect(preview.data.summary.create).toBe(1);
	});
	it("does not invent a successful preview from failed/denied requests", async () => {
		const draft = { ...newDraft(), file: new File(["x"], "clients.csv"), file_base64: "eA==", inspection: { object: "contact" as const, format: "csv" as const, file: { name: "clients.csv", bytes: 1, sha256: "a".repeat(64) }, headers: ["name"], total_rows: 1, samples: [], sheet: null, limits: HARD_LIMITS } };
		vi.spyOn(apiClient, "post").mockRejectedValue(new Error("DENIED"));
		await expect(previewImport(draft, parseFields(fields, "contact"))).rejects.toThrow("DENIED");
	});
});
