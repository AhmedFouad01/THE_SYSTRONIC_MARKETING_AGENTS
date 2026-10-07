import { describe, expect, it } from "vitest";
import {
	type FileError,
	IMPORT_LIMITS,
	guardXlsx,
	parseCsv,
	parseXlsx,
} from "../src/importfile.js";
import {
	buildRow,
	coerceCell,
	formulaLike,
	normalizeEmail,
	normalizePhone,
	validateMapping,
} from "../src/importmap.js";
import type { Def, Registry } from "../src/properties.js";
import { xlsx, zip } from "./helpers/xlsx.js";

const code = (fn: () => unknown) => {
	try {
		fn();
	} catch (e) {
		return (e as FileError).code;
	}
	return "NO_ERROR";
};
const acode = async (fn: () => Promise<unknown>) => {
	try {
		await fn();
	} catch (e) {
		return (e as FileError).code;
	}
	return "NO_ERROR";
};
const L = { ...IMPORT_LIMITS };

describe("CSV parser (RFC 4180)", () => {
	it("strips a UTF-8 BOM and reads Arabic text", () => {
		const g = parseCsv(
			Buffer.from("﻿الاسم,البريد\r\nأحمد علي,a@x.com\r\n", "utf8"),
		);
		expect(g.headers).toEqual(["الاسم", "البريد"]);
		expect(g.rows).toEqual([["أحمد علي", "a@x.com"]]);
		expect(g.rowNumbers).toEqual([2]);
	});
	it("handles quotes, doubled quotes, embedded delimiters and newlines, CR/LF/CRLF", () => {
		const g = parseCsv(Buffer.from('a,b\r"x, ""y""","line1\nline2"\rz,w\n'));
		expect(g.rows).toEqual([
			['x, "y"', "line1\nline2"],
			["z", "w"],
		]);
	});
	it("detects ';' and tab delimiters, pads short rows, drops blank rows but keeps numbering", () => {
		const g = parseCsv(Buffer.from("a;b;c\n1;2\n\n3;4;5\n"));
		expect(g.rows).toEqual([
			["1", "2", null],
			["3", "4", "5"],
		]);
		expect(g.rowNumbers).toEqual([2, 4]);
		expect(parseCsv(Buffer.from("a\tb\n1\t2")).rows).toEqual([["1", "2"]]);
	});
	it("keeps formula-looking cells as plain text", () => {
		const g = parseCsv(Buffer.from('n,v\n=SUM(A1),+1\n-2,@cmd\n"=1+1",x'));
		expect(g.rows.flat()).toEqual([
			"=SUM(A1)",
			"+1",
			"-2",
			"@cmd",
			"=1+1",
			"x",
		]);
	});
	it("rejects malformed quoting, bad encodings, binary, UTF-16, empty input", () => {
		expect(code(() => parseCsv(Buffer.from('a\n"x')))).toBe("CSV_MALFORMED");
		expect(code(() => parseCsv(Buffer.from('a\n"x"y\n')))).toBe(
			"CSV_MALFORMED",
		);
		expect(code(() => parseCsv(Buffer.from([0xff, 0xfe, 0x61, 0x00])))).toBe(
			"UNSUPPORTED_ENCODING",
		);
		expect(code(() => parseCsv(Buffer.from([0x61, 0x0a, 0xc3, 0x28])))).toBe(
			"INVALID_ENCODING",
		);
		expect(code(() => parseCsv(Buffer.from([0x61, 0x00, 0x62])))).toBe(
			"NOT_TEXT",
		);
		expect(code(() => parseCsv(Buffer.alloc(0)))).toBe("EMPTY_FILE");
		expect(code(() => parseCsv(Buffer.from("\n\n")))).toBe("HEADER_MISSING");
	});
	it("enforces file, row, column and cell limits", () => {
		expect(
			code(() => parseCsv(Buffer.alloc(IMPORT_LIMITS.fileBytes + 1, 97))),
		).toBe("FILE_TOO_LARGE");
		expect(
			code(() =>
				parseCsv(Buffer.from(`a\n${"x\n".repeat(IMPORT_LIMITS.rows + 1)}`)),
			),
		).toBe("TOO_MANY_ROWS");
		expect(
			parseCsv(Buffer.from(`a\n${"x\n".repeat(IMPORT_LIMITS.rows)}`)).rows,
		).toHaveLength(IMPORT_LIMITS.rows);
		const wide = Array.from(
			{ length: IMPORT_LIMITS.columns + 1 },
			(_, i) => `c${i}`,
		).join(",");
		expect(code(() => parseCsv(Buffer.from(wide)))).toBe("TOO_MANY_COLUMNS");
		expect(
			code(() =>
				parseCsv(Buffer.from(`a\n${"y".repeat(IMPORT_LIMITS.cellChars + 1)}`)),
			),
		).toBe("CELL_TOO_LONG");
		expect(
			code(() =>
				parseCsv(
					Buffer.from(`a\n"${"y".repeat(IMPORT_LIMITS.cellChars + 1)}"`),
				),
			),
		).toBe("CELL_TOO_LONG");
	});
});

describe("XLSX guard and parser", () => {
	it("reads a workbook: strings (Arabic), numbers, booleans, formula-looking text", async () => {
		const g = await parseXlsx(
			xlsx([
				["الاسم", "n", "ok"],
				['=HYPERLINK("x")', 5, true],
				["محمد", null, false],
			]),
		);
		expect(g.headers).toEqual(["الاسم", "n", "ok"]);
		expect(g.rows[0]).toEqual(['=HYPERLINK("x")', 5, true]);
		expect(g.rows[1][0]).toBe("محمد");
	});
	it("rejects non-zip, truncated, and oversized input", async () => {
		expect(
			await acode(() => parseXlsx(Buffer.from("not a zip at all, definitely"))),
		).toBe("NOT_XLSX");
		expect(await acode(() => parseXlsx(xlsx([["a"]]).subarray(0, 60)))).toBe(
			"NOT_XLSX",
		);
		expect(
			await acode(() => parseXlsx(Buffer.alloc(IMPORT_LIMITS.fileBytes + 1))),
		).toBe("FILE_TOO_LARGE");
	});
	it("refuses a zip bomb: oversized inflate, ratio, lying declared size, total cap", () => {
		const bomb = zip([
			{
				name: "xl/worksheets/sheet1.xml",
				data: Buffer.alloc(30 * 1024 * 1024, 0),
			},
		]);
		expect(bomb.length).toBeLessThan(IMPORT_LIMITS.fileBytes);
		expect(code(() => guardXlsx(bomb))).toBe("ZIP_BOMB");
		const ratio = zip([
			{ name: "a.xml", data: Buffer.alloc(3 * 1024 * 1024, 0) },
		]);
		expect(code(() => guardXlsx(ratio))).toBe("ZIP_BOMB");
		const liar = zip([
			{
				name: "a.xml",
				data: Buffer.alloc(2 * 1024 * 1024, 0),
				declaredSize: 10,
			},
		]);
		expect(code(() => guardXlsx(liar))).toBe("ZIP_BOMB");
		expect(
			code(() => guardXlsx(xlsx([["a"]]), { ...L, zipTotalBytes: 1000 })),
		).toBe("ZIP_BOMB");
	});
	it("refuses too many entries, unsafe paths, DTD/entities and overlapping entries", () => {
		const many = zip(
			Array.from({ length: IMPORT_LIMITS.zipEntries + 1 }, (_, i) => ({
				name: `f${i}.xml`,
				data: "x",
			})),
		);
		expect(code(() => guardXlsx(many))).toBe("ZIP_TOO_MANY_ENTRIES");
		expect(
			code(() => guardXlsx(zip([{ name: "../evil.xml", data: "x" }]))),
		).toBe("ZIP_UNSAFE_PATH");
		expect(
			code(() =>
				guardXlsx(
					zip([
						{
							name: "xl/workbook.xml",
							data: '<!DOCTYPE x [<!ENTITY a "b">]><x/>',
						},
					]),
				),
			),
		).toBe("XML_DTD_FORBIDDEN");
		const z = zip([
			{ name: "a.xml", data: "aaaa", store: true },
			{ name: "b.xml", data: "bbbb", store: true },
		]);
		// point b's central-directory entry at a's data: the classic overlap trick
		const cd = z.indexOf(
			Buffer.from([0x50, 0x4b, 0x01, 0x02]),
			z.indexOf("b.xml") + 10,
		);
		z.writeUInt32LE(0, cd + 42);
		expect(code(() => guardXlsx(z))).toBe("ZIP_OVERLAP");
	});
	it("enforces the row limit on sheets", async () => {
		const rows: string[][] = [
			["a"],
			...Array.from({ length: IMPORT_LIMITS.rows + 1 }, () => ["x"]),
		];
		expect(await acode(() => parseXlsx(xlsx(rows)))).toBe("TOO_MANY_ROWS");
	});
});

describe("cells, mapping and rows", () => {
	const def = (type: Def["type"], extra: Partial<Def> = {}): Def => ({
		key: "k",
		type,
		required: false,
		read_only: false,
		sensitive: false,
		searchable: false,
		validation: {},
		position: 0,
		archived: false,
		options: new Map(),
		...extra,
	});
	it("flags formula-looking cells but not phone numbers or negative numbers", () => {
		expect(formulaLike("=1+1")).toBe(true);
		expect(formulaLike("@SUM(A1)")).toBe(true);
		expect(formulaLike("+cmd|' /C calc'!A0")).toBe(true);
		expect(formulaLike("+20 100 123 4567")).toBe(false);
		expect(formulaLike("-12.5")).toBe(false);
		expect(formulaLike("plain")).toBe(false);
	});
	it("normalises email and phone (Arabic digits, 00 prefix, default country)", () => {
		expect(normalizeEmail("A@X.com")).toBe("a@x.com");
		expect(normalizeEmail("=cmd@x")).toBeNull();
		expect(normalizePhone("+20 (100) 123-4567", null)).toBe("+201001234567");
		expect(normalizePhone("٠١٠٠١٢٣٤٥٦٧", "+20")).toBe("+201001234567");
		expect(normalizePhone("00201001234567", null)).toBe("+201001234567");
		expect(normalizePhone("01001234567", null)).toBeNull();
	});
	it("coerces cells by property type", () => {
		expect(coerceCell(def("number"), "١٢٫٥")).toBe(12.5);
		expect(coerceCell(def("number"), "abc")).toBe("abc");
		expect(coerceCell(def("checkbox"), "نعم")).toBe(true);
		expect(coerceCell(def("multi_select"), "a; b|c")).toEqual(["a", "b", "c"]);
		expect(coerceCell(def("date"), new Date("2026-01-02T00:00:00Z"))).toBe(
			"2026-01-02",
		);
		expect(coerceCell(def("text"), "   ")).toBeUndefined();
		expect(coerceCell(def("text"), "=2+2")).toBe("=2+2");
	});
	it("validates the mapping contract", () => {
		const props = new Map([["note", def("text", { key: "note" })]]);
		const ok = validateMapping(
			"contact",
			[
				{ column: 0, target: "display_name" },
				{ column: 1, target: "property:note" },
			],
			2,
			props,
		);
		expect(ok).toHaveLength(2);
		const fails = (m: unknown) => {
			try {
				validateMapping("contact", m, 2, props);
			} catch (e) {
				return ((e as { details?: { code: string }[] }).details ?? []).map(
					(d) => d.code,
				);
			}
			return [];
		};
		expect(fails([{ column: 0, target: "email" }])).toContain(
			"REQUIRED_TARGET_DISPLAY_NAME",
		);
		expect(fails([{ column: 5, target: "display_name" }])).toContain(
			"COLUMN_OUT_OF_RANGE",
		);
		expect(
			fails([
				{ column: 0, target: "display_name" },
				{ column: 1, target: "display_name" },
			]),
		).toContain("DUPLICATE_TARGET");
		expect(
			fails([
				{ column: 0, target: "display_name" },
				{ column: 1, target: "property:ghost" },
			]),
		).toContain("UNKNOWN_PROPERTY");
		expect(fails([{ column: 0, target: "owner_id" }])).toContain(
			"UNKNOWN_TARGET",
		);
	});
	it("builds a row: stores a formula-looking name verbatim and reports field errors", () => {
		const registry: Registry = { object: "contact", defs: new Map() };
		const cols = [
			{ column: 0, target: "display_name" },
			{ column: 1, target: "email" },
			{ column: 2, target: "phone" },
		];
		const opts = { default_country_code: null };
		expect(
			buildRow(
				"contact",
				cols,
				["=cmd()", "bad", "+20 100 123 4567"],
				registry,
				opts,
			).ok,
		).toBe(false);
		const good = buildRow(
			"contact",
			cols,
			["=cmd()", "A@x.com", "+20 100 123 4567"],
			registry,
			opts,
		);
		expect(good.ok && good.value.displayName).toBe("=cmd()");
		expect(good.ok && good.warnings).toContain("FORMULA_LIKE:display_name");
	});
});
