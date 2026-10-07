import { describe, expect, it } from "vitest";
import { href, toRoute } from "./router.ts";

describe("client router", () => {
	it("maps base paths", () => {
		expect(toRoute("/app")).toBe("/");
		expect(toRoute("/app/")).toBe("/");
		expect(toRoute("/app/leads")).toBe("/leads");
		expect(toRoute("/app/reporting")).toBe("/reporting");
		expect(toRoute("/app/reporting/")).toBe("/reporting");
		expect(toRoute("/app/reporting-v2/")).toBe("/reporting-v2");
		expect(toRoute("/app/settings/properties")).toBe("/settings/properties");
		expect(toRoute("/app/settings/properties/")).toBe("/settings/properties");
		expect(toRoute("/app/settings")).toBeNull();
	});
	it("rejects unknown and legacy paths", () => {
		expect(toRoute("/leads")).toBeNull();
		expect(toRoute("/application")).toBeNull();
		expect(toRoute("/app/foundation")).toBeNull();
	});
	it("builds hrefs", () => {
		expect(href("/")).toBe("/app/");
		expect(href("/deals")).toBe("/app/deals");
	});
});
