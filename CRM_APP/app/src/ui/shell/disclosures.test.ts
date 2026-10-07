import { describe, expect, it } from "vitest";
import { defaultDisclosures, disclosureStorageKey, expandActiveBranch, restoreDisclosures } from "./disclosures.ts";
import { filterNavigation, NAV_TREE } from "./navigation.ts";

describe("navigation disclosure state", () => {
	it("isolates preferences by actor, tenant and grant without namespace collisions", () => {
		const scopes = [["a", "t"], ["b", "t"], ["a", "u"], ["a", "t", "g"], ["a:t", "u"], ["a", "t:u"]];
		expect(new Set(scopes.map(([actor, tenant, grant]) => disclosureStorageKey(actor, tenant, grant))).size).toBe(scopes.length);
	});
	it("persists recognized boolean choices while rejecting corrupt or unknown settings", () => {
		for (const raw of [null, "bad", "[]", "null", '"text"']) expect(restoreDisclosures(raw, NAV_TREE, null)).toEqual(defaultDisclosures(NAV_TREE));
		expect(restoreDisclosures('{"crm":false,"settings":true,"overview":"false","unknown":true}', NAV_TREE, null)).toMatchObject({ crm: false, settings: true, overview: true });
		expect(restoreDisclosures('{"unknown":true}', NAV_TREE, null)).not.toHaveProperty("unknown");
	});
	it("opens the full active Pipeline and Properties branches after route changes", () => {
		const saved = restoreDisclosures('{"crm":false,"deals":false,"administration":false,"settings":false}', NAV_TREE, null);
		const pipeline = expandActiveBranch(saved, NAV_TREE, "/pipeline");
		expect(pipeline).toMatchObject({ crm: true, deals: true, administration: false, settings: false });
		expect(expandActiveBranch(pipeline, NAV_TREE, "/settings/properties")).toMatchObject({ administration: true, settings: true });
		expect(saved.crm).toBe(false);
	});
	it("opens aliases and does not reopen denied or nonexistent branches", () => {
		const saved = restoreDisclosures('{"overview":false,"insights":false}', NAV_TREE, null);
		expect(expandActiveBranch(saved, NAV_TREE, "/").overview).toBe(true);
		expect(expandActiveBranch(saved, NAV_TREE, "/reporting-v2").insights).toBe(true);
		const denied = filterNavigation(NAV_TREE, ["properties", "security"]);
		expect(expandActiveBranch(saved, denied, "/settings/properties")).toBe(saved);
		expect(expandActiveBranch(saved, NAV_TREE, null)).toBe(saved);
	});
});
