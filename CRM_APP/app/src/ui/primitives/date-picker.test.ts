import { describe, expect, it } from "vitest";
import { formatLocalValue, parseLocalValue } from "./DatePicker.tsx";

describe("DatePicker value codec", () => {
	it("parses date and datetime values and rejects non-days", () => {
		expect(parseLocalValue("2026-10-05T14:30")).toEqual({
			y: 2026,
			m: 10,
			d: 5,
			hh: 14,
			mm: 30,
		});
		expect(parseLocalValue("2026-10-05")).toEqual({
			y: 2026,
			m: 10,
			d: 5,
			hh: 9,
			mm: 0,
		});
		expect(parseLocalValue("")).toBeNull();
		expect(parseLocalValue("2026-02-30")).toBeNull();
		expect(parseLocalValue("2026-10-05T24:00")).toBeNull();
		expect(parseLocalValue("05/10/2026")).toBeNull();
	});

	it("round-trips to the same strings the native input produced", () => {
		const p = parseLocalValue("2026-01-09T07:05");
		expect(p && formatLocalValue(p, "datetime")).toBe("2026-01-09T07:05");
		expect(p && formatLocalValue(p, "date")).toBe("2026-01-09");
	});
});
