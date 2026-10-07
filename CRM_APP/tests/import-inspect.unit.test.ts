import { describe, expect, it, vi } from "vitest";
import { inspectImport } from "../src/import.js";
import { Fault } from "../src/db.js";
import { IMPORT_LIMITS, parseFile } from "../src/importfile.js";
import { xlsx } from "./helpers/xlsx.js";

const upload = (text = "name,email\nMona,mona@example.test\n") => ({ object: "contact", format: "csv", filename: "contacts.csv", file_base64: Buffer.from(text).toString("base64") });
const allowed = async () => undefined;

describe("authorized import inspection contract", () => {
	it("denied authority returns before decoding and before the real parser", async () => {
		const parser = vi.fn(parseFile);
		const authorize = vi.fn(async () => { throw new Fault(403, "FORBIDDEN"); });
		await expect(inspectImport({ ...upload(), file_base64: "invalid" }, { authorize, parse: parser })).rejects.toMatchObject({ status: 403, code: "FORBIDDEN" });
		expect(authorize).toHaveBeenCalledWith("contact");
		expect(parser).not.toHaveBeenCalled();
	});
	it("returns exact bounded raw CSV samples and original row numbers without executing formulas", async () => {
		const response = await inspectImport(upload("name,value\nMona,=1+1\n\nAli,@cmd\nNoor,3\nFour,4"), { authorize: allowed });
		expect(response.data.headers).toEqual(["name", "value"]);
		expect(response.data.total_rows).toBe(4);
		expect(response.data.samples).toEqual([{ row: 2, cells: ["Mona", "=1+1"] }, { row: 4, cells: ["Ali", "@cmd"] }, { row: 5, cells: ["Noor", "3"] }]);
		expect(response.data.limits).toEqual(IMPORT_LIMITS);
		expect(response.data.sheet).toBeNull();
	});
	it("sanitizes filenames with the same upload reader used by preview/commit", async () => {
		const response = await inspectImport({ ...upload(), filename: "\u202econtacts\u0001.csv" }, { authorize: allowed });
		expect(response.data.file.name).toBe("contacts.csv");
		expect(response.data.file.bytes).toBeGreaterThan(0);
		expect(response.data.file.sha256).toMatch(/^[a-f0-9]{64}$/);
	});
	it("uses the real XLSX guard/parser and first-sheet default", async () => {
		const file = xlsx([["name", "value"], ["أحمد", 3]]);
		const response = await inspectImport({ object: "lead", format: "xlsx", filename: "leads.xlsx", file_base64: file.toString("base64") }, { authorize: allowed });
		expect(response.data.sheet).toBe(1);
		expect(response.data.samples[0]?.cells).toEqual(["أحمد", 3]);
	});
	it("preserves strict schema, format and row/column/file/encoding hard failures", async () => {
		await expect(inspectImport({ ...upload(), mapping: { columns: [] } }, { authorize: allowed })).rejects.toMatchObject({ status: 422, code: "FIELD_NOT_WRITABLE" });
		await expect(inspectImport({ ...upload(), options: { owner_id: "x" } }, { authorize: allowed })).rejects.toMatchObject({ status: 422, code: "FIELD_NOT_WRITABLE" });
		await expect(inspectImport({ ...upload(), format: "xlsx" }, { authorize: allowed })).rejects.toMatchObject({ code: "FORMAT_MISMATCH" });
		await expect(inspectImport(upload(`name\n${"x\n".repeat(IMPORT_LIMITS.rows + 1)}`), { authorize: allowed })).rejects.toMatchObject({ code: "TOO_MANY_ROWS" });
		await expect(inspectImport(upload(Array.from({ length: 101 }, (_, i) => String(i)).join(",")), { authorize: allowed })).rejects.toMatchObject({ code: "TOO_MANY_COLUMNS" });
		await expect(inspectImport({ ...upload(), file_base64: Buffer.alloc(IMPORT_LIMITS.fileBytes + 1, 97).toString("base64") }, { authorize: allowed })).rejects.toMatchObject({ status: 413, code: "FILE_TOO_LARGE" });
		await expect(inspectImport({ ...upload(), file_base64: Buffer.from([0xff, 0xfe, 0x61, 0]).toString("base64") }, { authorize: allowed })).rejects.toMatchObject({ code: "UNSUPPORTED_ENCODING" });
	});
	it("keeps missing-sheet and malformed CSV failures as safe field issues", async () => {
		await expect(inspectImport(upload('name\n"unterminated'), { authorize: allowed })).rejects.toMatchObject({ status: 422, code: "CSV_MALFORMED", details: [{ field: "file.row.2", code: "CSV_MALFORMED" }] });
		await expect(inspectImport({ object: "contact", format: "xlsx", filename: "x.xlsx", file_base64: xlsx([["name"], ["Mona"]]).toString("base64"), options: { sheet: 99 } }, { authorize: allowed })).rejects.toMatchObject({ code: "SHEET_NOT_FOUND" });
	});
});
