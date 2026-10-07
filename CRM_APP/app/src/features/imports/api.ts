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
