import { describe, expect, it } from "vitest";
import { HARD_LIMITS, cleanFilename, effectiveLimits, fileIssue, mappingIssues, newDraft, optionIssues, parseFields, parseInspection, setColumn, sheetOption } from "./model.ts";

const fields = (sensitive = true) => ({ object: "contact", limits: HARD_LIMITS, formats: ["csv", "xlsx"], sensitive_mapping: sensitive, targets: [
	{ target: "display_name", required: true, label: "Display name" }, { target: "email", required: false, label: "Email" }, { target: "phone", required: false, label: "Phone" },
	{ target: "property:region", required: false, label: { en: "Region", ar: "المنطقة" }, type: "single_select", options: ["cairo", "giza"] },
	{ target: "property:private", required: false, label: "Private", sensitive: true, type: "text" },
] });
const inspection = () => ({ object: "contact", format: "csv", file: { name: "clients.csv", sha256: "a".repeat(64), bytes: 50 }, limits: HARD_LIMITS, headers: ["Name", "Region"], total_rows: 4, sheet: null, samples: [{ row: 2, cells: ["Mona", "cairo"] }] });

describe("import mapping and limits", () => {
	it("uses the returned property targets/options and refuses unauthorized or stale mappings", () => {
		const contract = parseFields(fields(), "contact");
		expect(contract.targets.find((target) => target.target === "property:region")?.options).toEqual(["cairo", "giza"]);
		expect(mappingIssues([{ column: 0, target: "display_name" }, { column: 1, target: "property:unauthorized" }], 2, contract)).toEqual(["UNKNOWN_TARGET"]);
	});
	it("requires the mandatory target, refuses duplicate targets and out-of-range indices", () => {
		const contract = parseFields(fields(), "contact");
		expect(mappingIssues([], 2, contract)).toEqual(["REQUIRED_TARGET"]);
		expect(mappingIssues([{ column: 0, target: "display_name" }, { column: 1, target: "display_name" }], 2, contract)).toEqual(["DUPLICATE_TARGET"]);
		expect(mappingIssues([{ column: 2, target: "display_name" }], 2, contract)).toEqual(["COLUMN_OUT_OF_RANGE"]);
		expect(setColumn([{ column: 0, target: "email" }], 0, "display_name")).toEqual([{ column: 0, target: "display_name" }]);
		expect(setColumn([{ column: 0, target: "display_name" }], 0, "")).toEqual([]);
	});
	it("does not infer sensitive authority from the presence of fixed fields", () => {
		for (const raw of [fields(false), { ...fields(), sensitive_mapping: undefined }]) {
			const contract = parseFields(raw, "contact");
			expect(contract.targets.map((target) => target.target)).toEqual(["display_name", "property:region"]);
			expect(mappingIssues([{ column: 0, target: "display_name" }, { column: 1, target: "email" }], 2, contract)).toEqual(["UNKNOWN_TARGET"]);
		}
	});
	it("rejects read-only/archived/user properties and incompatible object/label contracts", () => {
		const raw = fields();
		const denied = [{ target: "property:archived", label: "Archived", archived: true }, { target: "property:readonly", label: "Read-only", read_only: true }, { target: "property:user", label: "User", type: "user" }];
		expect(parseFields({ ...raw, targets: [...raw.targets, ...denied] }, "contact").targets).toHaveLength(raw.targets.length);
		expect(() => parseFields(raw, "lead")).toThrow("INVALID_IMPORT_RESPONSE");
		expect(() => parseFields({ ...raw, targets: [{ target: "display_name", label: { en: 2 } }] }, "contact")).toThrow("INVALID_IMPORT_RESPONSE");
	});
	it("enforces the exact file/row/column caps even if a server tries to loosen them", () => {
		const contract = parseFields(fields(), "contact");
		expect(effectiveLimits({ fileBytes: 99999999, rows: 6000, columns: 101, cellChars: 30000 })).toEqual(HARD_LIMITS);
		expect(fileIssue({ name: "A.CSV", size: HARD_LIMITS.fileBytes }, contract)).toBeNull();
		expect(fileIssue({ name: "a.csv", size: HARD_LIMITS.fileBytes + 1 }, contract)).toBe("FILE_TOO_LARGE");
		expect(fileIssue({ name: "a.csv", size: 0 }, contract)).toBe("EMPTY_FILE");
		expect(fileIssue({ name: "a.xls", size: 100 }, contract)).toBe("FORMAT_MISMATCH");
		expect(() => parseInspection({ ...inspection(), total_rows: 5001 }, "contact", HARD_LIMITS)).toThrow();
		expect(() => parseInspection({ ...inspection(), headers: Array(101).fill("h") }, "contact", HARD_LIMITS)).toThrow();
	});
	it("defaults to first sheet/caller/no country and accepts Arabic-Indic option input", () => {
		const options = newDraft().options;
		expect(options).toEqual({ sheet: "1", owner_id: "", default_country_code: "", duplicate_mode: "skip", error_policy: "skip" });
		expect(sheetOption("٢")).toBe(2);
		expect(sheetOption("Sales")).toBe("Sales");
		expect(() => sheetOption("٠")).toThrow("INVALID_SHEET");
		expect(optionIssues({ ...options, default_country_code: "+٢٠" }, [])).toEqual([]);
		expect(optionIssues({ ...options, owner_id: "unavailable", default_country_code: "bad" }, [])).toEqual(["INVALID_COUNTRY", "INVALID_OWNER"]);
	});
	it("bounds sample responses and retains raw formula-like text as data", () => {
		const raw = inspection();
		const response = parseInspection({ ...raw, samples: [{ row: 2, cells: ["=1+1", "@cmd"] }] }, "contact", HARD_LIMITS);
		expect(response.samples[0]?.cells).toEqual(["=1+1", "@cmd"]);
		expect(() => parseInspection({ ...raw, samples: Array(4).fill(raw.samples[0]) }, "contact", HARD_LIMITS)).toThrow();
		expect(() => parseInspection({ ...raw, samples: [{ row: 2, cells: ["x".repeat(20001), "y"] }] }, "contact", HARD_LIMITS)).toThrow();
		expect(cleanFilename("\u202eclients\u0001.csv")).toBe("clients.csv");
	});
});
