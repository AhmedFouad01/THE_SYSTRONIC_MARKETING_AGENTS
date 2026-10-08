import { describe, expect, it } from "vitest";
import { ALL_ROUTES_ACCOUNTED_FOR, ALL_ROUTES_HAVE_NAV, initials, MOBILE_PRIMARY_KEYS, NAV, splitMobileNav } from "./AppShell.tsx";

describe("shell navigation model", () => {
	it("linked leaves cover every live route; inert upcoming entries never become routes", () => {
		const keys = NAV.map((n) => n.key);
		for (const dead of ["email", "call", "segments", "journeys", "integrations", "security"]) expect(keys).not.toContain(dead);
		expect(NAV.every((n) => typeof n.route === "string")).toBe(true);
		expect(ALL_ROUTES_HAVE_NAV).toBe(true); // Complete gated /imports now has a live leaf.
		expect(ALL_ROUTES_ACCOUNTED_FOR).toBe(true);
	});
	it("mobile bar: at most 5 tabs (4 screens + More); the remainder goes to the More sheet; nothing is lost", () => {
		const { primary, overflow } = splitMobileNav();
		expect(primary.length + 1).toBeLessThanOrEqual(5);
		expect(primary.map((n) => n.key)).toEqual([...MOBILE_PRIMARY_KEYS]);
		expect([...primary, ...overflow].map((n) => n.key).sort()).toEqual(NAV.map((n) => n.key).sort());
	});
	it("initials: first + last word, Arabic safe, empty-safe", () => {
		expect(initials("Mona Adel")).toBe("MA");
		expect(initials("  mona   adel  hassan ")).toBe("MH");
		expect(initials("Mona")).toBe("M");
		expect(initials("منى عادل")).toBe("مع");
		expect(initials("")).toBe("");
	});
});
