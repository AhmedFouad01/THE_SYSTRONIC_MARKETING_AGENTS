// Test-only: builds ZIP / minimal XLSX bytes by hand (no writer dependency). `declaredSize` lets a test lie about sizes.
import { crc32, deflateRawSync } from "node:zlib";

export type ZEntry = {
	name: string;
	data: Buffer | string;
	store?: boolean;
	declaredSize?: number;
};
export function zip(entries: ZEntry[]): Buffer {
	const parts: Buffer[] = [];
	const cd: Buffer[] = [];
	let off = 0;
	for (const e of entries) {
		const raw = Buffer.isBuffer(e.data) ? e.data : Buffer.from(e.data);
		const body = e.store ? raw : deflateRawSync(raw);
		const name = Buffer.from(e.name);
		const lh = Buffer.alloc(30);
		lh.writeUInt32LE(0x04034b50, 0);
		lh.writeUInt16LE(20, 4);
		lh.writeUInt16LE(e.store ? 0 : 8, 8);
		lh.writeUInt32LE(crc32(raw), 14);
		lh.writeUInt32LE(body.length, 18);
		lh.writeUInt32LE(raw.length, 22);
		lh.writeUInt16LE(name.length, 26);
		parts.push(lh, name, body);
		const ch = Buffer.alloc(46);
		ch.writeUInt32LE(0x02014b50, 0);
		ch.writeUInt16LE(20, 4);
		ch.writeUInt16LE(20, 6);
		ch.writeUInt16LE(e.store ? 0 : 8, 10);
		ch.writeUInt32LE(crc32(raw), 16);
		ch.writeUInt32LE(body.length, 20);
		ch.writeUInt32LE(e.declaredSize ?? raw.length, 24);
		ch.writeUInt16LE(name.length, 28);
		ch.writeUInt32LE(off, 42);
		cd.push(ch, name);
		off += 30 + name.length + body.length;
	}
	const cdBuf = Buffer.concat(cd);
	const end = Buffer.alloc(22);
	end.writeUInt32LE(0x06054b50, 0);
	end.writeUInt16LE(entries.length, 8);
	end.writeUInt16LE(entries.length, 10);
	end.writeUInt32LE(cdBuf.length, 12);
	end.writeUInt32LE(off, 16);
	return Buffer.concat([...parts, cdBuf, end]);
}
const esc = (s: string) =>
	s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const col = (i: number) => String.fromCharCode(65 + i);
/** Minimal workbook: one sheet, inline strings; numbers/booleans typed; no styles needed. */
export function xlsx(
	rows: (string | number | boolean | null)[][],
	sheetName = "Sheet1",
): Buffer {
	const sheet = rows
		.map(
			(r, ri) =>
				`<row r="${ri + 1}">${r
					.map((c, ci) => {
						const ref = `${col(ci)}${ri + 1}`;
						if (c === null) return "";
						if (typeof c === "number") return `<c r="${ref}"><v>${c}</v></c>`;
						if (typeof c === "boolean")
							return `<c r="${ref}" t="b"><v>${c ? 1 : 0}</v></c>`;
						return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${esc(c)}</t></is></c>`;
					})
					.join("")}</row>`,
		)
		.join("");
	const H = '<?xml version="1.0" encoding="UTF-8"?>';
	return zip([
		{
			name: "[Content_Types].xml",
			data: `${H}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
		},
		{
			name: "_rels/.rels",
			data: `${H}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
		},
		{
			name: "xl/workbook.xml",
			data: `${H}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${esc(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
		},
		{
			name: "xl/_rels/workbook.xml.rels",
			data: `${H}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
		},
		{
			name: "xl/worksheets/sheet1.xml",
			data: `${H}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheet}</sheetData></worksheet>`,
		},
	]);
}
