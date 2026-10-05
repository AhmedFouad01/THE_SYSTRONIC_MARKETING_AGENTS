import { describe, expect, it } from "vitest";
import { readPref, writePref } from "../storage.ts";
import { parseMode } from "./ThemeProvider.tsx";

describe("theme", () => {
	it("defaults to light; only 'dark' selects dark", () => {
		expect(parseMode(null)).toBe("light");
		expect(parseMode("")).toBe("light");
		expect(parseMode("sepia")).toBe("light");
		expect(parseMode("dark")).toBe("dark");
		expect(parseMode("light")).toBe("light");
	});

	it("preference storage never throws when localStorage is unavailable", () => {
		// Node test env: no window/localStorage -> both calls hit the try/catch path.
		expect(readPref("sy.theme")).toBeNull();
		expect(() => writePref("sy.theme", "dark")).not.toThrow();
	});
});
