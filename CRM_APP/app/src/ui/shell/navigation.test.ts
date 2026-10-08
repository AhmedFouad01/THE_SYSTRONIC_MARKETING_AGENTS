import { describe, expect, it } from "vitest";
import { ROUTES, STAGED_ROUTES, toRoute } from "../../router.ts";
import { ar } from "../i18n/ar.ts";
import { en } from "../i18n/en.ts";
import { filterNavigation, linkedLeaves, NAV_TREE, navigationTrail, NAV_ROUTES, type NavNode, splitMobileNav, upcomingHiddenKeys } from "./navigation.ts";

function allNodes(nodes: readonly NavNode[]): NavNode[] {
	return nodes.flatMap((node) => [node, ...allNodes(node.children ?? [])]);
}

describe("hierarchical navigation", () => {
	it("retains the exact live route set including dashboard and reporting aliases", () => {
		expect([...NAV_ROUTES].sort()).toEqual(ROUTES.filter((route) => !STAGED_ROUTES.includes(route)).sort());
		expect(navigationTrail(NAV_TREE, "/").map((n) => n.key)).toEqual(["overview", "dashboard"]);
		expect(navigationTrail(NAV_TREE, "/reporting-v2").map((n) => n.key)).toEqual(["insights", "reporting"]);
	});
	it("orders the four groups and nests Pipeline under linked Deals, Properties under Settings", () => {
		expect(NAV_TREE.map((n) => n.key)).toEqual(["overview", "crm", "insights", "administration"]);
		expect(navigationTrail(NAV_TREE, "/pipeline").map((n) => n.key)).toEqual(["crm", "deals", "pipeline"]);
		expect(navigationTrail(NAV_TREE, "/settings/properties").map((n) => n.key)).toEqual(["administration", "settings", "properties"]);
		expect(NAV_TREE.slice(0, 3).every((n) => n.kind === "group" && n.expanded)).toBe(true);
		expect(NAV_TREE[3]).not.toHaveProperty("expanded", true);
	});
	it("reserves future screens as inert text without a navigable route", () => {
		const upcoming = allNodes(NAV_TREE).filter((n) => n.kind === "upcoming");
		expect(upcoming.map((n) => n.key)).toEqual(["segments", "journeys", "integrations", "security"]);
		for (const node of upcoming) expect(node).not.toHaveProperty("route");
		expect(toRoute("/app/imports")).toBe("/imports");
		expect(NAV_ROUTES).toContain("/imports");
		expect(toRoute("/app/settings/users")).toBe("/settings/users");
		expect(navigationTrail(NAV_TREE, "/settings/users").map(n => n.key)).toEqual(["administration", "users"]);
		for (const route of ["/segments", "/journeys", "/settings/integrations", "/settings/security"]) expect(toRoute(`/app${route}`)).toBeNull();
	});
	it("removes denied live leaves from the hierarchy, aliases and mobile shortcuts", () => {
		const hidden = ["properties", "leads", "reporting", "journeys", ...upcomingHiddenKeys(false, false)];
		const tree = filterNavigation(NAV_TREE, hidden);
		const keys = allNodes(tree).map((n) => n.key);
		for (const key of hidden) expect(keys).not.toContain(key);
		expect(keys).not.toContain("settings");
		expect(keys).not.toContain("administration");
		expect(keys).not.toContain("insights");
		const mobile = splitMobileNav(linkedLeaves(tree));
		expect(mobile.primary.map((n) => n.key)).toEqual(["contacts", "deals", "tasks"]);
		expect(navigationTrail(tree, "/reporting-v2")).toEqual([]);
	});
	it("denying a branch also removes descendants without losing other CRM links", () => {
		const tree = filterNavigation(NAV_TREE, ["deals"]);
		expect(linkedLeaves(tree).map((n) => n.key)).not.toContain("pipeline");
		expect(splitMobileNav(linkedLeaves(tree)).primary.map((n) => n.key)).toEqual(["leads", "contacts", "tasks"]);
	});
	it("keeps read-only upcoming leaves while removing manager badges for reps/readers and agency grants", () => {
		for (const [manager, agency] of [[false, false], [true, true], [false, true]]) {
			const keys = allNodes(filterNavigation(NAV_TREE, upcomingHiddenKeys(manager, agency))).map((n) => n.key);
			for (const key of ["integrations", "users", "security"]) expect(keys).not.toContain(key);
			for (const key of ["segments", "journeys"]) expect(keys).toContain(key);
		}
		expect(upcomingHiddenKeys(true, false)).toEqual([]);
	});
	it("keeps authorized Properties accessible even when manager badges are denied", () => {
		const tree = filterNavigation(NAV_TREE, upcomingHiddenKeys(false, false));
		expect(navigationTrail(tree, "/settings/properties").map((n) => n.key)).toEqual(["administration", "settings", "properties"]);
	});
	it("has complete AR/EN labels and preserves the existing reporting key with the Reports label", () => {
		for (const node of allNodes(NAV_TREE)) {
			expect(en[node.label]).toBeTruthy();
			expect(ar[node.label]).toBeTruthy();
		}
		expect(en["nav.reporting"]).toBe("Reports");
		expect(ar["nav.reporting"]).toBe("التقارير");
	});
});
