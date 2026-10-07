// Import, server half: UNTRUSTED FILE PARSING. Pure (no database, no HTTP). Two formats become one shape: a grid of cells.
//   CSV  : in-house RFC 4180 parser (UTF-8, optional BOM, `,` `;` or TAB delimiter, quoted fields, doubled quotes, CRLF/LF/CR).
//   XLSX : `read-excel-file` (pinned), behind a ZIP guard that runs BEFORE the library sees a single byte: the archive directory
//          is parsed here, every entry is inflated under a hard output cap (declared sizes are not trusted), overlapping entries,
//          encryption, ZIP64, unknown methods and DTD/entity declarations are refused.
// A cell is never interpreted: "=SUM(A1)", "+1", "-2", "@x" are plain strings here. Failures throw `FileError` (a stable code).
import { createHash } from "node:crypto";
import { inflateRawSync } from "node:zlib";

export const IMPORT_LIMITS = {
	fileBytes: 5 * 1024 * 1024, // raw upload (decoded)
	rows: 5000, // data rows, header excluded
	columns: 100,
	cellChars: 20_000, // hard parse-time ceiling per cell (field rules are tighter)
	zipEntries: 300,
	zipEntryBytes: 25 * 1024 * 1024, // inflated size of one entry
	zipTotalBytes: 50 * 1024 * 1024, // inflated size of the whole archive
	zipRatio: 100, // inflated:deflated for entries above zipRatioFloor
	zipRatioFloor: 256 * 1024,
} as const;
export type ImportLimits = { -readonly [K in keyof typeof IMPORT_LIMITS]: number };

export type Cell = string | number | boolean | Date | null;
export type Grid = { headers: string[]; rows: Cell[][]; rowNumbers: number[] };

export class FileError extends Error {
	constructor(
		public code: string,
		public detail?: Record<string, unknown>,
	) {
		super(code);
	}
}

export const sha256 = (b: Buffer | string) => createHash("sha256").update(b).digest("hex");

// ---- CSV ---------------------------------------------------------------------------------------------------------------------
function decodeUtf8(buf: Buffer): string {
	if (buf.length >= 2 && ((buf[0] === 0xff && buf[1] === 0xfe) || (buf[0] === 0xfe && buf[1] === 0xff)))
		throw new FileError("UNSUPPORTED_ENCODING"); // UTF-16 ("Unicode text" from Excel): save as CSV UTF-8
	if (buf.includes(0)) throw new FileError("NOT_TEXT");
	let s: string;
	try {
		s = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(buf);
	} catch {
		throw new FileError("INVALID_ENCODING");
	}
	return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}
function pickDelimiter(text: string): string {
	// First record only, outside quotes. Ties go to comma. Arabic-locale Excel writes ';'.
	const counts: Record<string, number> = { ",": 0, ";": 0, "\t": 0 };
	let q = false;
	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (c === '"') q = !q;
		else if (!q && (c === "\n" || c === "\r")) break;
		else if (!q && c in counts) counts[c]++;
	}
	return (Object.entries(counts).sort((a, b) => b[1] - a[1] || (a[0] === "," ? -1 : 1))[0] ?? [","])[0];
}
/** Raw records (arrays of strings). `maxRecords` counts every record including the header. */
export function parseCsvRecords(
	text: string,
	limits: Pick<ImportLimits, "columns" | "cellChars"> & { maxRecords: number },
	delimiter = pickDelimiter(text),
): string[][] {
	const out: string[][] = [];
	let rec: string[] = [];
	let field = "";
	let i = 0;
	const n = text.length;
	const endField = () => {
		if (field.length > limits.cellChars) throw new FileError("CELL_TOO_LONG", { row: out.length + 1, column: rec.length + 1 });
		rec.push(field);
		field = "";
		if (rec.length > limits.columns) throw new FileError("TOO_MANY_COLUMNS", { row: out.length + 1 });
	};
	const endRecord = () => {
		endField();
		out.push(rec);
		rec = [];
		if (out.length > limits.maxRecords) throw new FileError("TOO_MANY_ROWS");
	};
	while (i < n) {
		const c = text[i];
		if (c === '"' && field === "") {
			// quoted field
			i++;
			for (;;) {
				if (i >= n) throw new FileError("CSV_MALFORMED", { row: out.length + 1, reason: "UNTERMINATED_QUOTE" });
				const d = text[i];
				if (d === '"') {
					if (text[i + 1] === '"') {
						field += '"';
						i += 2;
						continue;
					}
					i++;
					break;
				}
				field += d;
				if (field.length > limits.cellChars) throw new FileError("CELL_TOO_LONG", { row: out.length + 1, column: rec.length + 1 });
				i++;
			}
			const after = text[i];
			if (i < n && after !== delimiter && after !== "\n" && after !== "\r")
				throw new FileError("CSV_MALFORMED", { row: out.length + 1, reason: "TEXT_AFTER_QUOTE" });
			continue;
		}
		if (c === delimiter) {
			endField();
			i++;
		} else if (c === "\n" || c === "\r") {
			endRecord();
			i += c === "\r" && text[i + 1] === "\n" ? 2 : 1;
		} else {
			field += c;
			if (field.length > limits.cellChars) throw new FileError("CELL_TOO_LONG", { row: out.length + 1, column: rec.length + 1 });
			i++;
		}
	}
	// final record without a trailing newline (a lone trailing newline adds nothing)
	if (field !== "" || rec.length > 0) endRecord();
	return out;
}
const blank = (r: Cell[]) => r.every((c) => c === null || (typeof c === "string" && c.trim() === ""));

/** Rows are padded/truncated to the header width; blank rows are dropped; `rowNumbers` keep spreadsheet numbering (header = 1). */
function toGrid(records: Cell[][], limits: ImportLimits): Grid {
	if (!records.length) throw new FileError("EMPTY_FILE");
	const head = records[0].map((c) => (c === null ? "" : String(c)).trim());
	while (head.length && head[head.length - 1] === "") head.pop();
	if (!head.length || head.every((h) => h === "")) throw new FileError("HEADER_MISSING");
	if (head.length > limits.columns) throw new FileError("TOO_MANY_COLUMNS");
	const rows: Cell[][] = [];
	const rowNumbers: number[] = [];
	for (let r = 1; r < records.length; r++) {
		const rec = records[r];
		if (blank(rec)) continue;
		rows.push(Array.from({ length: head.length }, (_, k) => rec[k] ?? null));
		rowNumbers.push(r + 1);
		if (rows.length > limits.rows) throw new FileError("TOO_MANY_ROWS", { max: limits.rows });
	}
	return { headers: head, rows, rowNumbers };
}
export function parseCsv(buf: Buffer, limits: ImportLimits = { ...IMPORT_LIMITS }): Grid {
	if (buf.length > limits.fileBytes) throw new FileError("FILE_TOO_LARGE");
	if (!buf.length) throw new FileError("EMPTY_FILE");
	const records = parseCsvRecords(decodeUtf8(buf), {
		columns: limits.columns,
		cellChars: limits.cellChars,
		maxRecords: limits.rows + 1 + 10_000, // blank lines are free up to this much slack; toGrid enforces the data-row cap
	});
	return toGrid(records, limits);
}

// ---- XLSX: ZIP guard ---------------------------------------------------------------------------------------------------------
type ZipEntry = { name: string; method: number; comp: number; size: number; start: number };
function u16(b: Buffer, o: number) {
	return b.readUInt16LE(o);
}
function u32(b: Buffer, o: number) {
	return b.readUInt32LE(o);
}
/** Parses the central directory only (no inflation). Throws on anything a spreadsheet would never contain. */
export function listZip(buf: Buffer, limits: ImportLimits = { ...IMPORT_LIMITS }): ZipEntry[] {
	if (buf.length < 22 || u32(buf, 0) !== 0x04034b50) throw new FileError("NOT_XLSX");
	let eocd = -1;
	for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65535); i--)
		if (u32(buf, i) === 0x06054b50) {
			eocd = i;
			break;
		}
	if (eocd < 0) throw new FileError("NOT_XLSX");
	const count = u16(buf, eocd + 10);
	const cdSize = u32(buf, eocd + 12);
	const cdOff = u32(buf, eocd + 16);
	if (count === 0xffff || cdSize === 0xffffffff || cdOff === 0xffffffff) throw new FileError("ZIP_UNSUPPORTED");
	if (count === 0 || count > limits.zipEntries) throw new FileError("ZIP_TOO_MANY_ENTRIES");
	if (cdOff + cdSize > eocd) throw new FileError("NOT_XLSX");
	const entries: ZipEntry[] = [];
	let p = cdOff;
	for (let k = 0; k < count; k++) {
		if (p + 46 > buf.length || u32(buf, p) !== 0x02014b50) throw new FileError("NOT_XLSX");
		const flags = u16(buf, p + 8);
		const method = u16(buf, p + 10);
		const comp = u32(buf, p + 20);
		const size = u32(buf, p + 24);
		const nameLen = u16(buf, p + 28);
		const extraLen = u16(buf, p + 30);
		const commentLen = u16(buf, p + 32);
		const local = u32(buf, p + 42);
		if (flags & 1 || flags & 0x40) throw new FileError("ZIP_ENCRYPTED");
		if (method !== 0 && method !== 8) throw new FileError("ZIP_UNSUPPORTED");
		if (comp === 0xffffffff || size === 0xffffffff) throw new FileError("ZIP_UNSUPPORTED");
		const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
		if (name.includes("..") || name.startsWith("/") || name.includes("\\") || name.includes("\0"))
			throw new FileError("ZIP_UNSAFE_PATH");
		if (local + 30 > buf.length || u32(buf, local) !== 0x04034b50) throw new FileError("NOT_XLSX");
		const start = local + 30 + u16(buf, local + 26) + u16(buf, local + 28);
		if (start + comp > cdOff) throw new FileError("NOT_XLSX");
		entries.push({ name, method, comp, size, start });
		p += 46 + nameLen + extraLen + commentLen;
	}
	// Overlapping entry data is the classic "zip quine / overlap bomb": every legitimate archive has disjoint ranges.
	const spans = entries.filter((e) => e.comp > 0).sort((a, b) => a.start - b.start);
	for (let k = 1; k < spans.length; k++)
		if (spans[k].start < spans[k - 1].start + spans[k - 1].comp) throw new FileError("ZIP_OVERLAP");
	return entries;
}
/**
 * Proves the archive is bounded BEFORE the xlsx library decompresses it: each entry is inflated here with a hard output cap, the real
 * size must equal the declared one, and the running total is capped. (The library then inflates the same bytes; the work is identical.)
 */
export function guardXlsx(buf: Buffer, limits: ImportLimits = { ...IMPORT_LIMITS }): void {
	if (buf.length > limits.fileBytes) throw new FileError("FILE_TOO_LARGE");
	const entries = listZip(buf, limits);
	let total = 0;
	for (const e of entries) {
		if (e.size > limits.zipEntryBytes) throw new FileError("ZIP_BOMB", { entry: e.name });
		if (e.size > limits.zipRatioFloor && e.size > e.comp * limits.zipRatio) throw new FileError("ZIP_BOMB", { entry: e.name });
		total += e.size;
		if (total > limits.zipTotalBytes) throw new FileError("ZIP_BOMB");
	}
	let actual = 0;
	for (const e of entries) {
		const raw = buf.subarray(e.start, e.start + e.comp);
		let data: Buffer;
		if (e.method === 0) data = raw;
		else {
			try {
				// +1 so an entry that inflates past its declared size is detected, not silently truncated
				data = inflateRawSync(raw, { maxOutputLength: Math.min(e.size, limits.zipEntryBytes) + 1 });
			} catch (err) {
				const code = (err as { code?: string }).code;
				throw new FileError(code === "ERR_BUFFER_TOO_LARGE" ? "ZIP_BOMB" : "NOT_XLSX", { entry: e.name });
			}
		}
		if (data.length !== e.size) throw new FileError("ZIP_BOMB", { entry: e.name });
		actual += data.length;
		if (actual > limits.zipTotalBytes) throw new FileError("ZIP_BOMB");
		// XLSX never needs a DTD; refusing it closes entity-expansion / external-entity tricks regardless of the XML parser.
		if (/\.(xml|rels)$/i.test(e.name) || e.name === "[Content_Types].xml")
			if (data.includes("<!DOCTYPE") || data.includes("<!ENTITY") || data.includes("<!doctype"))
				throw new FileError("XML_DTD_FORBIDDEN", { entry: e.name });
	}
}

export async function parseXlsx(buf: Buffer, sheet?: number | string, limits: ImportLimits = { ...IMPORT_LIMITS }): Promise<Grid> {
	if (!buf.length) throw new FileError("EMPTY_FILE");
	guardXlsx(buf, limits);
	const { default: readAll } = await import("read-excel-file/node");
	let sheets: { sheet: string; data: unknown[][] }[];
	try {
		sheets = (await readAll(buf)) as { sheet: string; data: unknown[][] }[];
	} catch {
		throw new FileError("NOT_XLSX");
	}
	if (!sheets.length) throw new FileError("EMPTY_FILE");
	let chosen = sheets[0];
	if (sheet !== undefined) {
		const found = typeof sheet === "number" ? sheets[sheet - 1] : sheets.find((s) => s.sheet === sheet);
		if (!found) throw new FileError("SHEET_NOT_FOUND", { sheets: sheets.map((s) => s.sheet).slice(0, 50) });
		chosen = found;
	}
	if (chosen.data.length > limits.rows + 1 + 10_000) throw new FileError("TOO_MANY_ROWS", { max: limits.rows });
	const records: Cell[][] = [];
	for (let r = 0; r < chosen.data.length; r++) {
		const row = chosen.data[r] ?? [];
		if (row.length > limits.columns && row.slice(limits.columns).some((c) => c !== null && c !== undefined && c !== ""))
			throw new FileError("TOO_MANY_COLUMNS", { row: r + 1 });
		records.push(
			row.slice(0, limits.columns).map((c, k) => {
				if (c === undefined || c === null) return null;
				if (typeof c === "string" && c.length > limits.cellChars) throw new FileError("CELL_TOO_LONG", { row: r + 1, column: k + 1 });
				if (typeof c === "number" && !Number.isFinite(c)) return null;
				if (c instanceof Date) return Number.isFinite(c.getTime()) ? c : null;
				return typeof c === "string" || typeof c === "number" || typeof c === "boolean" ? c : String(c);
			}),
		);
	}
	return toGrid(records, limits);
}

export function parseFile(format: "csv" | "xlsx", buf: Buffer, sheet?: number | string): Promise<Grid> {
	return format === "csv" ? Promise.resolve(parseCsv(buf)) : parseXlsx(buf, sheet);
}
