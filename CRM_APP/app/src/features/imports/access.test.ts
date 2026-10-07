import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../../api/index.ts";
import { ApiError } from "../../api/errors.ts";
import { filterNavigation, linkedLeaves, NAV_TREE, splitMobileNav } from "../../ui/shell/navigation.ts";
import { createImportAccess } from "./access.ts";
import { fetchImportFields } from "./api.ts";
import { HARD_LIMITS } from "./model.ts";
const fields = { object: "contact", formats: ["csv", "xlsx"], limits: HARD_LIMITS, sensitive_mapping: false, targets: [{ target: "display_name", required: true, label: "Name" }] };
const envelope = { data: fields, nextCursor: null, requestId: "ref", hasMore: null, total: null };
const visible = (allowed: boolean) => linkedLeaves(filterNavigation(NAV_TREE, allowed ? [] : ["import"]));
afterEach(() => vi.restoreAllMocks());
describe("verified live Import navigation authority", () => {
	it("uses the actual fields adapter before exposing desktop/More link; pending and denied fail closed", async () => {
		const store = createImportAccess(); const session = { configure: true, merge: true }; let complete: ((v: typeof envelope) => void) | undefined;
		vi.spyOn(apiClient, "get").mockImplementation(() => new Promise((resolve) => { complete = resolve; }));
		const waiting = store.probe("scope", session, (signal) => fetchImportFields("contact", signal), new AbortController().signal);
		expect(store.get().allowed).toBe(false); expect(visible(store.get().allowed).map((n) => n.key)).not.toContain("import");
		complete?.(envelope); await waiting; expect(store.get().allowed).toBe(true); expect(visible(true).find((n) => n.key === "import")?.route).toBe("/imports"); expect(splitMobileNav(visible(true)).overflow.map((n) => n.key)).toContain("import");
		store.deny("scope"); expect(visible(store.get().allowed).map((n) => n.key)).not.toContain("import");
	});
	it("denied rep/reader/agency response and malformed fields never inherit manager cosmetic flags", async () => {
		for (const data of [new ApiError({ status: 403, code: "FORBIDDEN", safeMessage: "", retryable: false, requestId: "ref" }), new Error("offline")]) {
			vi.spyOn(apiClient, "get").mockRejectedValue(data); const store = createImportAccess(); await store.probe("scope", { configure: true }, (signal) => fetchImportFields("contact", signal), new AbortController().signal); expect(store.get().allowed).toBe(false); vi.restoreAllMocks();
		}
		vi.spyOn(apiClient, "get").mockResolvedValue({ ...envelope, data: {} }); const store = createImportAccess(); await store.probe("scope", {}, (signal) => fetchImportFields("contact", signal), new AbortController().signal); expect(store.get().allowed).toBe(false);
	});
	it("ignores stale scope/session and cancelled preflights, rechecks same-scope reauth", async () => {
		const store = createImportAccess(); const controller = new AbortController(); let finish: (() => void) | undefined;
		const waiting = store.probe("old", {}, () => new Promise((resolve) => { finish = () => resolve({}); }), controller.signal);
		const current = {}; await store.probe("new", current, async () => fields, new AbortController().signal); finish?.(); await waiting; expect(store.get().scope).toBe("new"); expect(store.get().session).toBe(current);
		controller.abort(); await store.probe("new", {}, async () => fields, controller.signal); expect(store.get().allowed).toBe(false);
	});
});
