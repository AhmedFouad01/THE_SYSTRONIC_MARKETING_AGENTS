import { describe, expect, it } from "vitest";
import { readWorkspaceHistory, rememberWorkspace, sameWorkspace, WORKSPACE_HISTORY_LIMIT, workspaceCredentials, workspaceKey } from "./workspaces.ts";

describe("workspace history boundary", () => {
	it("ignores corrupt and foreign actor history", () => {
		for (const raw of [null, "bad", "[]", "null", '{"actor":"other","contexts":[{"tenantId":"t"}]}']) expect(readWorkspaceHistory(raw, "a")).toEqual([]);
	});
	it("accepts only bounded context metadata, dropping credentials and duplicates", () => {
		const raw = JSON.stringify({ actor: "a", contexts: [null, {}, { tenantId: "" }, { tenantId: "t", token: "synthetic" }, { tenantId: "t" }, { tenantId: "t", grantId: "g" }, { tenantId: "u", grantId: 4 }] });
		expect(readWorkspaceHistory(raw, "a")).toEqual([{ tenantId: "t" }, { tenantId: "t", grantId: "g" }]);
	});
	it("caps discovery history and brings selected contexts to the front", () => {
		const contexts = Array.from({ length: 30 }, (_, index) => ({ tenantId: String(index) }));
		expect(readWorkspaceHistory(JSON.stringify({ actor: "a", contexts }), "a")).toHaveLength(WORKSPACE_HISTORY_LIMIT);
		const remembered = rememberWorkspace(contexts, { tenantId: "2" });
		expect(remembered[0]).toEqual({ tenantId: "2" });
		expect(remembered).toHaveLength(WORKSPACE_HISTORY_LIMIT);
		expect(remembered.filter((item) => item.tenantId === "2")).toHaveLength(1);
	});
	it("isolates component/draft identity by actor, tenant and grant rather than role or token", () => {
		expect(workspaceKey("a", { tenantId: "t" })).not.toBe(workspaceKey("a", { tenantId: "u" }));
		expect(workspaceKey("a", { tenantId: "t" })).not.toBe(workspaceKey("b", { tenantId: "t" }));
		expect(workspaceKey("a", { tenantId: "t" })).not.toBe(workspaceKey("a", { tenantId: "t", grantId: "g" }));
		expect(sameWorkspace({ tenantId: "t" }, { tenantId: "t", grantId: "g" })).toBe(false);
	});
	it("rebuilds target credentials without carrying a current grant", () => {
		expect(workspaceCredentials("synthetic", { tenantId: "t" })).toEqual({ token: "synthetic", tenantId: "t" });
		expect(workspaceCredentials("synthetic", { tenantId: "t", grantId: "g" })).toEqual({ token: "synthetic", tenantId: "t", grantId: "g" });
	});
});
