import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../../api/index.ts";
import { bytesToBase64, fetchImportFields, inspectionBody, inspectUpload } from "./api.ts";
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
		const xlsxDraft = { ...draft, file: new File(["test"], "clients.xlsx"), options: { sheet: "٢", owner_id: "synthetic", default_country_code: "+20" } };
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
