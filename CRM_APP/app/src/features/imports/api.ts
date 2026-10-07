import { parseCommit, parseHistory, parseJob, parseLedger, validJobId } from "./jobs.ts";
import type { ImportBody } from "./preview.ts";
import { buildImportBody, parsePreview, type PreviewSnapshot } from "./preview.ts";
import { apiClient } from "../../api/index.ts";
import { type ImportDraft, type ImportFields, type ImportObject, parseFields, parseInspection, fileFormat, sheetOption } from "./model.ts";

export async function fetchImportFields(object: ImportObject, signal?: AbortSignal): Promise<ImportFields> {
	return parseFields((await apiClient.get<unknown>("imports/fields", { query: { object }, signal })).data, object);
}
export function inspectionBody(draft: ImportDraft) {
	if (!draft.file || !draft.file_base64) throw new Error("EMPTY_FILE");
	const format = fileFormat(draft.file.name);
	return { object: draft.object, format, filename: draft.file.name, file_base64: draft.file_base64,
		...(format === "xlsx" ? { options: { sheet: sheetOption(draft.options.sheet) } } : {}) };
}
export async function inspectUpload(draft: ImportDraft, fields: ImportFields, signal?: AbortSignal) {
	const response = await apiClient.post<unknown>("imports/inspect", inspectionBody(draft), { signal });
	return parseInspection(response.data, draft.object, fields.limits);
}
export function bytesToBase64(bytes: Uint8Array): string {
	let text = "";
	for (let offset = 0; offset < bytes.length; offset += 8192) text += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
	return btoa(text);
}

export async function previewImport(draft: ImportDraft, fields: ImportFields, signal?: AbortSignal): Promise<PreviewSnapshot> {
	const body = buildImportBody(draft);
	const response = await apiClient.post<unknown>("imports/preview", { ...body, preview_rows: 100 }, { signal });
	return { revision: draft.revision, body, data: parsePreview(response.data, draft, fields) };
}

export async function commitImport(body: ImportBody, key: string) {
	return parseCommit((await apiClient.post<unknown>("imports", body, { idempotencyKey: key, signal: AbortSignal.timeout(60_000) })).data, body);
}
export async function fetchImportHistory(cursor: string | null, signal?: AbortSignal) {
	if (cursor !== null && !validJobId(cursor)) throw new Error("INVALID_IMPORT_RESPONSE");
	const response = await apiClient.get<unknown>("imports", { query: { cursor: cursor ?? undefined }, signal });
	return parseHistory(response.data, response.nextCursor);
}
export async function fetchImportJob(id: string, signal?: AbortSignal) {
	if (!validJobId(id)) throw new Error("INVALID_IMPORT_RESPONSE");
	const job = parseJob((await apiClient.get<unknown>(`imports/${id}`, { signal })).data);
	if (job.id !== id) throw new Error("INVALID_IMPORT_RESPONSE");
	return job;
}
export async function fetchImportRows(id: string, after: number, outcome: string, signal?: AbortSignal) {
	if (!validJobId(id) || !Number.isSafeInteger(after) || after < 0 || !["", "created", "updated", "skipped", "failed"].includes(outcome)) throw new Error("INVALID_IMPORT_RESPONSE");
	const response = await apiClient.get<unknown>(`imports/${id}/rows`, { query: { after, outcome: outcome || undefined }, signal });
	return parseLedger(response.data, response.nextAfter, after, outcome);
}
