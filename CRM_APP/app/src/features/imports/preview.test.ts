import { describe, expect, it } from "vitest";
import { changeDraft, HARD_LIMITS, type ImportDraft, mappingIssues, newDraft, parseFields } from "./model.ts";
import { buildImportBody, createPreviewGate, parsePreview, reviewGate, type PreviewData } from "./preview.ts";
import { rowErrorKey } from "./PreviewReview.tsx";

const fields = (sensitive = true) => parseFields({ object: "contact", formats: ["csv", "xlsx"], limits: HARD_LIMITS, sensitive_mapping: sensitive,
	targets: [{ target: "display_name", label: "Name", required: true }, { target: "email", label: "Email" }] }, "contact");
const draft = (): ImportDraft => ({ ...newDraft(), file: new File(["name\nMona"], "clients.csv"), file_base64: "bmFtZQpNb25h", revision: 7,
	mapping: [{ column: 0, target: "display_name" }], inspection: { object: "contact", format: "csv", file: { name: "clients.csv", bytes: 9, sha256: "a".repeat(64) }, headers: ["name"], samples: [{ row: 2, cells: ["Mona"] }], sheet: null, limits: HARD_LIMITS, total_rows: 1 } });
const raw = () => ({ object: "contact", format: "csv", file: draft().inspection?.file, headers: ["name"], limits: HARD_LIMITS, total_rows: 1,
	summary: { create: 1, update: 0, skip: 0, error: 0, warnings: 0 }, rows: [{ row: 2, status: "create", values: { display_name: "Mona" } }], error_rows: [], error_rows_truncated: false, already_imported: null });
const reviewed = (data: PreviewData = parsePreview(raw(), draft(), fields())): ImportDraft => { const d = draft(); return { ...d, preview: { revision: d.revision, body: buildImportBody(d), data } }; };

describe("import preview invalidation and policy", () => {
	it("invalidates every source/mapping/option change and preserves back navigation", () => {
		const current = reviewed();
		const changes: Partial<ImportDraft>[] = [{ file: new File(["other"], "other.csv") }, { file_base64: "changed" }, { object: "lead" }, { mapping: [{ column: 0, target: "email" }] }, { inspection: null },
			...[{ sheet: "2" }, { default_country_code: "+20" }, { owner_id: "another" }, { duplicate_mode: "update" as const }, { error_policy: "abort" as const }].map((options) => ({ options: { ...current.options, ...options } }))];
		for (const change of changes) { const next = changeDraft(current, change); expect(next.preview).toBeNull(); expect(next.revision).toBe(current.revision + 1); expect(reviewGate(next)).toBe("stale"); }
		const back = changeDraft(current, { step: "mapping" });
		expect(back.preview).toBe(current.preview); expect(back.revision).toBe(current.revision);
	});
	it("ignores stale revisions, superseded responses and cancellation even when work resolves", async () => {
		const gate = createPreviewGate();
		let finish: (() => void) | undefined;
		const waiting = new Promise<void>((resolve) => { finish = resolve; });
		const first = gate.begin(7);
		const second = gate.begin(7);
		finish?.(); await waiting;
		expect(gate.accepts(first, 7)).toBe(false); expect(gate.accepts(second, 8)).toBe(false); expect(gate.accepts(second, 7)).toBe(true);
		gate.invalidate(); expect(gate.accepts(second, 7)).toBe(false);
	});
	it("defaults to skip/skip and blocks abort errors, all-invalid/all-zero and stale reviews", () => {
		const current = reviewed(); expect(current.options.duplicate_mode).toBe("skip"); expect(current.options.error_policy).toBe("skip"); expect(reviewGate(current)).toBe("ready");
		const data = current.preview?.data as PreviewData;
		const mixed = reviewed({ ...data, total_rows: 2, summary: { create: 1, update: 0, skip: 0, error: 1, warnings: 0 } });
		expect(reviewGate(mixed)).toBe("ready");
		expect(reviewGate({ ...mixed, options: { ...mixed.options, error_policy: "abort" } })).toBe("abort");
		expect(reviewGate(reviewed({ ...data, summary: { create: 0, update: 0, skip: 0, error: 1, warnings: 0 } }))).toBe("invalid");
		expect(reviewGate(reviewed({ ...data, total_rows: 0, summary: { create: 0, update: 0, skip: 0, error: 0, warnings: 0 } }))).toBe("empty");
		expect(reviewGate({ ...current, revision: 8 })).toBe("stale");
	});
	it("permits skipped valid duplicates to be ledgered and rechecks revoked sensitive targets", () => {
		const current = reviewed(); const data = current.preview?.data as PreviewData;
		expect(reviewGate(reviewed({ ...data, summary: { create: 0, update: 0, skip: 1, error: 0, warnings: 0 } }))).toBe("ready");
		const mapped = { ...current, mapping: [...current.mapping, { column: 1, target: "email" }] };
		const issues = mappingIssues(mapped.mapping, 2, fields(false)); expect(issues).toContain("UNKNOWN_TARGET"); expect(reviewGate(mapped, issues)).toBe("invalid");
	});
	it("builds an immutable normalized commit-compatible body without preview_rows", () => {
		const current = draft(); current.options.default_country_code = " +٢٠ "; current.options.owner_id = "owner";
		const body = buildImportBody(current); expect(body.options).toEqual({ duplicate_mode: "skip", error_policy: "skip", default_country_code: "+20", owner_id: "owner" }); expect(body).not.toHaveProperty("preview_rows");
		current.mapping[0].target = "email"; current.options.duplicate_mode = "create";
		expect(body.mapping.columns[0].target).toBe("display_name"); expect(body.options.duplicate_mode).toBe("skip");
		const xlsx = draft(); xlsx.file = new File(["x"], "book.xlsx"); xlsx.options.sheet = "٢";
		expect(buildImportBody(xlsx).options.sheet).toBe(2); expect(buildImportBody(draft()).options).not.toHaveProperty("sheet");
	});
	it("validates bounded safe rows, counts and upload identity; formulas stay strings", () => {
		const response = parsePreview({ ...raw(), rows: [{ row: 2, status: "create", warnings: ["FORMULA_LIKE:display_name"], values: { display_name: "=1+1" } }] }, draft(), fields());
		expect(response.rows[0].values.display_name).toBe("=1+1");
		for (const response of [{ ...raw(), rows: Array(101).fill(raw().rows[0]) }, { ...raw(), summary: { ...raw().summary, error: 1 } }, { ...raw(), file: { ...raw().file, sha256: "b".repeat(64) } }, { ...raw(), rows: [{ ...raw().rows[0], values: { unauthorized: "value" } }] }]) expect(() => parsePreview(response, draft(), fields())).toThrow("INVALID_IMPORT_RESPONSE");
	});
	it("keeps capped error samples and totals truthful and rejects invalid truncation", () => {
		const errors = Array.from({ length: 100 }, (_, i) => ({ row: i + 2, status: "error", errors: [{ field: "properties.region", code: "OPTION_UNKNOWN", safe_message: "Choose a current option" }], values: {} }));
		const payload = { ...raw(), total_rows: 101, summary: { create: 0, update: 0, skip: 0, error: 101, warnings: 0 }, rows: errors, error_rows: errors, error_rows_truncated: true };
		const response = parsePreview(payload, draft(), fields()); expect(response.error_rows).toHaveLength(100); expect(response.summary.error).toBe(101); expect(response.error_rows_truncated).toBe(true); expect(response.error_rows[0].errors[0].safe_message).toBe("Choose a current option");
		expect(() => parsePreview({ ...payload, error_rows: [...errors, errors[0]] }, draft(), fields())).toThrow();
		expect(() => parsePreview({ ...raw(), error_rows_truncated: true }, draft(), fields())).toThrow();
	});
	it("localizes property validator codes and retains unknown safe-message fallback", () => {
		expect(rowErrorKey("INVALID_EMAIL")).toBe("import.row.email"); expect(rowErrorKey("OPTION_ARCHIVED", "properties.region")).toBe("cf.err.OPTION_INVALID"); expect(rowErrorKey("MAX_VALUE", "properties.amount")).toBe("cf.err.RANGE"); expect(rowErrorKey("FUTURE_CODE")).toBeNull();
	});
});
