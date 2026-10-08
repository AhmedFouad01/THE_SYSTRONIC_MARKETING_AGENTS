import { describe, expect, it } from "vitest";
import {
	normalizeEmail,
	normalizePhone,
	normalizeUrl,
} from "../src/contactformat.js";
describe("R09 channel and custom typed validation", () => {
	it("normalizes Arabic local digits with +20 and international E.164", () => {
		expect(normalizePhone("٠١٠٠١٢٣٤٥٦٧")).toBe("+201001234567");
		expect(normalizePhone("00201001234567")).toBe("+201001234567");
		expect(normalizePhone("1001234567")).toBe("+201001234567");
		expect(normalizePhone("bad")).toBeNull();
	});
	it("rejects control/bidi and unsafe URL schemes and credentials", () => {
		expect(normalizeEmail(" A@EXAMPLE.COM ")).toBe("a@example.com");
		expect(normalizeEmail("a\u202e@x.com")).toBeNull();
		expect(normalizeUrl("javascript:alert(1)")).toBeNull();
		expect(normalizeUrl("https://user:secret@example.com")).toBeNull();
		expect(normalizeUrl("https://example.com")).toBe("https://example.com/");
	});
});
