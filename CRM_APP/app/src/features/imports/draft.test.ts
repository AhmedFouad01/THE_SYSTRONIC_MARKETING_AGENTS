import { describe, expect, it } from "vitest";
import { createSessionStore } from "../../api/session.ts";
import { workspaceKey } from "../../api/workspaces.ts";
import { createImportDraftStore } from "./draft.ts";

describe("import draft isolation", () => {
	it("retains a same-scope draft in memory across unmount/remount and rejects stale scope saves", () => {
		const store = createImportDraftStore();
		const initial = store.open("actor-a/tenant-a");
		const draft = { ...initial, options: { ...initial.options, default_country_code: "+20" } };
		expect(store.save("actor-a/tenant-a", draft)).toBe(true);
		expect(store.open("actor-a/tenant-a")).toBe(draft);
		expect(store.open("actor-a/tenant-b").options.default_country_code).toBe("");
		expect(store.save("actor-a/tenant-a", draft)).toBe(false);
	});
	it("preserves same-tenant reauthentication but clears on an actual authorized workspace change", async () => {
		const store = createImportDraftStore();
		const info = { actor: "a", configure: true, merge: true, audit: true };
		const session = createSessionStore({ storage: null, fetchSession: async () => info, onWorkspaceChange: store.clear });
		await session.connect({ token: "synthetic", tenantId: "t" });
		const scope = workspaceKey("a", { tenantId: "t" });
		const initial = store.open(scope);
		store.save(scope, { ...initial, options: { ...initial.options, default_country_code: "+20" } });
		session.invalidate();
		await session.connect({ token: "replacement", tenantId: "t" });
		expect(store.open(scope).options.default_country_code).toBe("+20");
		await session.connect({ token: "replacement", tenantId: "other" });
		expect(store.open(workspaceKey("a", { tenantId: "other" })).options.default_country_code).toBe("");
	});
	it("clears source contents on explicit discard and actor/grant changes", () => {
		const store = createImportDraftStore();
		const direct = workspaceKey("a", { tenantId: "t" });
		const initial = store.open(direct);
		store.save(direct, { ...initial, file_base64: "synthetic-file" });
		expect(store.open(workspaceKey("a", { tenantId: "t", grantId: "g" })).file_base64).toBeNull();
		expect(store.open(workspaceKey("other", { tenantId: "t" })).file_base64).toBeNull();
		store.clear();
		expect(store.open(direct).file_base64).toBeNull();
	});
});
