import { fileFormat, foldDigits, type ImportDraft, type ImportFields, type ImportObject, type MappingColumn, sheetOption } from "./model.ts";

export type ImportBody = {
	object: ImportObject; format: "csv" | "xlsx"; filename: string; file_base64: string; mapping: { columns: MappingColumn[] };
	options: { duplicate_mode: "skip" | "update" | "create"; error_policy: "skip" | "abort"; owner_id?: string; default_country_code?: string; sheet?: number | string };
};
export type PreviewIssue = { field: string; code: string; safe_message?: string };
export type PreviewRow = { row: number; status: "create" | "update" | "skip" | "error"; reason?: string; errors: PreviewIssue[]; warnings: string[]; values: Record<string, string | number | boolean | null> };
export type PreviewData = {
	total_rows: number; summary: { create: number; update: number; skip: number; error: number; warnings: number };
	rows: PreviewRow[]; error_rows: PreviewRow[]; error_rows_truncated: boolean;
	already_imported: { job_id: string; created_at: string } | null;
};
export type PreviewSnapshot = { revision: number; body: ImportBody; data: PreviewData };

/** This exact body is suitable for commit; preview-only sample limits never enter it. */
export function buildImportBody(draft: ImportDraft): ImportBody {
	if (!draft.file || !draft.file_base64 || !draft.inspection) throw new Error("EMPTY_FILE");
	const format = fileFormat(draft.file.name);
	const country = foldDigits(draft.options.default_country_code.trim());
	return { object: draft.object, format, filename: draft.file.name, file_base64: draft.file_base64,
		mapping: { columns: draft.mapping.map((column) => ({ ...column })).sort((a, b) => a.column - b.column) },
		options: { duplicate_mode: draft.options.duplicate_mode, error_policy: draft.options.error_policy,
			...(draft.options.owner_id ? { owner_id: draft.options.owner_id } : {}), ...(country ? { default_country_code: country } : {}),
			...(format === "xlsx" ? { sheet: sheetOption(draft.options.sheet) } : {}) } };
}
const record = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("INVALID_IMPORT_RESPONSE");
	return value as Record<string, unknown>;
};
const bad = (): never => { throw new Error("INVALID_IMPORT_RESPONSE"); };
const text = (value: unknown, max = 255): string => typeof value === "string" && value.length <= max ? value : bad();
const count = (value: unknown, max: number): number => Number.isInteger(value) && (value as number) >= 0 && (value as number) <= max ? value as number : bad();
export function parsePreview(value: unknown, draft: ImportDraft, fields: ImportFields): PreviewData {
	const raw = record(value);
	const file = record(raw.file);
	if (!draft.inspection || raw.object !== draft.object || raw.format !== draft.inspection.format || file.sha256 !== draft.inspection.file.sha256 || file.bytes !== draft.inspection.file.bytes || !Array.isArray(raw.headers) || JSON.stringify(raw.headers) !== JSON.stringify(draft.inspection.headers)) bad();
	const total = count(raw.total_rows, fields.limits.rows);
	const sum = record(raw.summary);
	const summary = { create: count(sum.create, total), update: count(sum.update, total), skip: count(sum.skip, total), error: count(sum.error, total), warnings: count(sum.warnings, fields.limits.rows * fields.limits.columns) };
	if (summary.create + summary.update + summary.skip + summary.error !== total || typeof raw.error_rows_truncated !== "boolean") bad();
	const targets = new Set(draft.mapping.map((column) => column.target));
	const parseRows = (value: unknown, errorsOnly: boolean): PreviewRow[] => {
		if (!Array.isArray(value) || value.length > 100 || value.length > total) return bad();
		const seen = new Set<number>();
		return value.map((value) => {
			const row = record(value);
			const number = count(row.row, Number.MAX_SAFE_INTEGER);
			if (number < 2 || seen.has(number) || !["create", "update", "skip", "error"].includes(row.status as string) || (errorsOnly && row.status !== "error")) bad();
			seen.add(number);
			const errors = row.errors ?? [];
			const warnings = row.warnings ?? [];
			if (!Array.isArray(errors) || errors.length > 400 || !Array.isArray(warnings) || warnings.length > fields.limits.columns) return bad();
			const parsedErrors = errors.map((value) => {
				const issue = record(value);
				return { field: text(issue.field), code: text(issue.code, 128), ...(issue.safe_message === undefined ? {} : { safe_message: text(issue.safe_message, 1000) }) };
			});
			const values = record(row.values);
			if (Object.keys(values).length > fields.limits.columns) bad();
			for (const [target, cell] of Object.entries(values)) if (!targets.has(target) || (cell !== null && typeof cell !== "boolean" && !(typeof cell === "number" && Number.isFinite(cell)) && !(typeof cell === "string" && cell.length <= fields.limits.cellChars))) bad();
			return { row: number, status: row.status as PreviewRow["status"], ...(row.reason === undefined ? {} : { reason: text(row.reason, 128) }), errors: parsedErrors, warnings: warnings.map((warning) => text(warning, 255)), values: values as PreviewRow["values"] };
		});
	};
	const rows = parseRows(raw.rows, false);
	const errorRows = parseRows(raw.error_rows, true);
	if (errorRows.length > summary.error || (raw.error_rows_truncated && errorRows.length >= summary.error)) bad();
	const prior = raw.already_imported == null ? null : record(raw.already_imported);
	return { total_rows: total, summary, rows, error_rows: errorRows, error_rows_truncated: raw.error_rows_truncated === true,
		already_imported: prior ? { job_id: text(prior.job_id), created_at: text(prior.created_at) } : null };
}
export function reviewGate(draft: ImportDraft, issues: readonly string[] = []): "stale" | "empty" | "invalid" | "abort" | "ready" {
	const preview = draft.preview;
	if (!preview || preview.revision !== draft.revision) return "stale";
	if (issues.length) return "invalid";
	const { summary, total_rows } = preview.data;
	if (!total_rows) return "empty";
	if (draft.options.error_policy === "abort" && summary.error) return "abort";
	return summary.create + summary.update + summary.skip > 0 ? "ready" : "invalid";
}
/** Revision and attempt together reject edits, newer requests, cancellation and unmount. */
export function createPreviewGate() {
	let attempt = 0;
	return {
		begin(revision: number) { return { revision, attempt: ++attempt }; },
		invalidate() { attempt++; },
		accepts(ticket: { revision: number; attempt: number }, revision: number) { return ticket.attempt === attempt && ticket.revision === revision; },
	};
}
