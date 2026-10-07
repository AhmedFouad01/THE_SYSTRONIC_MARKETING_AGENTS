import type { PreviewSnapshot } from "./preview.ts";
export type ImportObject = "contact" | "lead";
export type ImportFormat = "csv" | "xlsx";
export type MappingColumn = { column: number; target: string };
export type ImportLimits = { fileBytes: number; rows: number; columns: number; cellChars: number };
export const HARD_LIMITS: ImportLimits = { fileBytes: 5 * 1024 * 1024, rows: 5000, columns: 100, cellChars: 20_000 };
export type Target = { target: string; required: boolean; label: string | { en?: string; ar?: string }; type?: string; property_required?: boolean; sensitive?: boolean; options?: string[] };
export type ImportFields = { object: ImportObject; limits: ImportLimits; formats: ImportFormat[]; sensitive_mapping: boolean; targets: Target[] };
export type Inspection = {
	object: ImportObject;
	format: ImportFormat;
	file: { name: string; sha256: string; bytes: number };
	limits: ImportLimits;
	headers: string[];
	total_rows: number;
	sheet: number | string | null;
	samples: { row: number; cells: (string | number | boolean | null)[] }[];
};
export type ImportOptions = { sheet: string; default_country_code: string; owner_id: string; duplicate_mode: "skip" | "update" | "create"; error_policy: "skip" | "abort" };
export type ImportDraft = { object: ImportObject; file: File | null; file_base64: string | null; inspection: Inspection | null; mapping: MappingColumn[]; options: ImportOptions; step: "upload" | "mapping" | "preview" | "policy"; preview: PreviewSnapshot | null; revision: number };
export function newDraft(): ImportDraft {
	return { object: "contact", file: null, file_base64: null, inspection: null, mapping: [], options: { sheet: "1", default_country_code: "", owner_id: "", duplicate_mode: "skip", error_policy: "skip" }, step: "upload", preview: null, revision: 0 };
}
const objectRecord = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("INVALID_IMPORT_RESPONSE");
	return value as Record<string, unknown>;
};
export function effectiveLimits(value: unknown): ImportLimits {
	const raw = objectRecord(value);
	const limits = { ...HARD_LIMITS };
	for (const key of Object.keys(limits) as (keyof ImportLimits)[]) {
		if (!Number.isInteger(raw[key]) || (raw[key] as number) <= 0) throw new Error("INVALID_IMPORT_RESPONSE");
		limits[key] = Math.min(limits[key], raw[key] as number);
	}
	return limits;
}
export function parseFields(value: unknown, object: ImportObject): ImportFields {
	const raw = objectRecord(value);
	if (raw.object !== object || !Array.isArray(raw.targets) || raw.targets.length > 205 || !Array.isArray(raw.formats)) throw new Error("INVALID_IMPORT_RESPONSE");
	const formats = raw.formats.filter((format): format is ImportFormat => format === "csv" || format === "xlsx");
	if (!formats.length) throw new Error("INVALID_IMPORT_RESPONSE");
	const sensitive = raw.sensitive_mapping === true;
	const fixed = object === "contact" ? ["display_name", "email", "phone"] : ["title", "contact_name", "email", "phone", "source_evidence"];
	const targets: Target[] = [];
	for (const value of raw.targets) {
		const target = objectRecord(value);
		if (typeof target.target !== "string" || !(fixed.includes(target.target) || /^property:[a-z][a-z0-9_]{0,62}$/.test(target.target))) throw new Error("INVALID_IMPORT_RESPONSE");
		if (target.type === "user" || target.read_only === true || target.archived === true || target.archived_at != null) continue;
		if (!sensitive && (target.target === "email" || target.target === "phone" || target.sensitive === true)) continue;
		if (typeof target.label !== "string" && (!target.label || typeof target.label !== "object" || Array.isArray(target.label))) throw new Error("INVALID_IMPORT_RESPONSE");
		if (typeof target.label !== "string") {
			const label = target.label as Record<string, unknown>;
			if ((label.en !== undefined && typeof label.en !== "string") || (label.ar !== undefined && typeof label.ar !== "string") || (!label.en && !label.ar)) throw new Error("INVALID_IMPORT_RESPONSE");
		}
		if (target.options !== undefined && (!Array.isArray(target.options) || target.options.some((option) => typeof option !== "string"))) throw new Error("INVALID_IMPORT_RESPONSE");
		if (targets.some((item) => item.target === target.target)) throw new Error("INVALID_IMPORT_RESPONSE");
		targets.push({ target: target.target, required: target.required === true, label: target.label as Target["label"],
			...(typeof target.type === "string" ? { type: target.type } : {}), property_required: target.property_required === true, sensitive: target.sensitive === true,
			...(target.options ? { options: target.options as string[] } : {}) });
	}
	return { object, limits: effectiveLimits(raw.limits), formats, sensitive_mapping: sensitive, targets };
}
export function parseInspection(value: unknown, object: ImportObject, limits: ImportLimits): Inspection {
	const raw = objectRecord(value);
	const file = objectRecord(raw.file);
	if (raw.object !== object || (raw.format !== "csv" && raw.format !== "xlsx") || !Array.isArray(raw.headers) || !raw.headers.length || raw.headers.length > limits.columns || raw.headers.some((header) => typeof header !== "string") || !Number.isInteger(raw.total_rows) || (raw.total_rows as number) < 1 || (raw.total_rows as number) > limits.rows || !Array.isArray(raw.samples) || raw.samples.length > 3 || typeof file.name !== "string" || typeof file.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(file.sha256) || typeof file.bytes !== "number" || file.bytes > limits.fileBytes || file.bytes <= 0) throw new Error("INVALID_IMPORT_RESPONSE");
	const headers = raw.headers as string[];
	const samples = raw.samples.map((sample) => {
		const row = objectRecord(sample);
		if (!Number.isInteger(row.row) || (row.row as number) < 2 || !Array.isArray(row.cells) || row.cells.length !== headers.length || row.cells.some((cell) => cell !== null && typeof cell !== "string" && typeof cell !== "boolean" && !(typeof cell === "number" && Number.isFinite(cell))) || row.cells.some((cell) => typeof cell === "string" && cell.length > limits.cellChars)) throw new Error("INVALID_IMPORT_RESPONSE");
		return { row: row.row as number, cells: row.cells as Inspection["samples"][number]["cells"] };
	});
	return { object, format: raw.format, file: { name: file.name, sha256: file.sha256, bytes: file.bytes }, limits: effectiveLimits(raw.limits), headers, total_rows: raw.total_rows as number, sheet: raw.sheet as number | string | null, samples };
}
export function fileIssue(file: Pick<File, "name" | "size">, fields: ImportFields): string | null {
	if (file.size <= 0) return "EMPTY_FILE";
	if (file.size > fields.limits.fileBytes) return "FILE_TOO_LARGE";
	const format = file.name.toLowerCase().split(".").at(-1);
	return fields.formats.includes(format as ImportFormat) ? null : "FORMAT_MISMATCH";
}
export function fileFormat(name: string): ImportFormat { return name.toLowerCase().endsWith(".xlsx") ? "xlsx" : "csv"; }
export function cleanFilename(name: string): string { return name.replace(/[\p{Cc}\u202a-\u202e\u2066-\u2069]/gu, "").trim(); }
export function foldDigits(value: string): string {
	return value.replace(/[٠-٩۰-۹]/g, (digit) => String(digit.charCodeAt(0) - (digit.charCodeAt(0) >= 0x06f0 ? 0x06f0 : 0x0660)));
}
export function sheetOption(value: string): number | string {
	const digits = foldDigits(value);
	if (/^\d+$/.test(digits)) {
		const index = Number(digits);
		if (index < 1 || index > 255) throw new Error("INVALID_SHEET");
		return index;
	}
	if (!value || value.length > 255) throw new Error("INVALID_SHEET");
	return value;
}
export function optionIssues(options: ImportOptions, ownerIds: readonly string[]): string[] {
	const issues: string[] = [];
	if (!["skip", "update", "create"].includes(options.duplicate_mode) || !["skip", "abort"].includes(options.error_policy)) issues.push("INVALID_POLICY");
	const country = foldDigits(options.default_country_code.trim());
	if (country && !/^\+?[1-9]\d{0,3}$/.test(country)) issues.push("INVALID_COUNTRY");
	if (options.owner_id && !ownerIds.includes(options.owner_id)) issues.push("INVALID_OWNER");
	return issues;
}
export function mappingIssues(mapping: readonly MappingColumn[], width: number, fields: ImportFields): string[] {
	const issues: string[] = [];
	const seen = new Set<string>();
	for (const column of mapping) {
		if (!Number.isInteger(column.column) || column.column < 0 || column.column >= width) issues.push("COLUMN_OUT_OF_RANGE");
		if (seen.has(column.target)) issues.push("DUPLICATE_TARGET");
		if (!fields.targets.some((target) => target.target === column.target)) issues.push("UNKNOWN_TARGET");
		seen.add(column.target);
	}
	if (fields.targets.some((target) => target.required && !seen.has(target.target))) issues.push("REQUIRED_TARGET");
	return [...new Set(issues)];
}
export function setColumn(mapping: readonly MappingColumn[], column: number, target: string): MappingColumn[] {
	return [...mapping.filter((item) => item.column !== column), ...(target ? [{ column, target }] : [])].sort((a, b) => a.column - b.column);
}
export function sampleText(value: string | number | boolean | null): string { return value === null ? "" : String(value); }

/** Step navigation preserves review; any source/mapping/options change requires a new server preview. */
export function changeDraft(current: ImportDraft, change: Partial<ImportDraft>): ImportDraft {
	const invalidates = ["object", "file", "file_base64", "inspection", "mapping", "options"].some((key) => Object.hasOwn(change, key));
	return { ...current, ...change, preview: invalidates ? null : change.preview === undefined ? current.preview : change.preview, revision: current.revision + (invalidates ? 1 : 0) };
}
