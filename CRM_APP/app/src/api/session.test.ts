import { describe, expect, it, vi } from "vitest";
import type { Credentials } from "./client.ts";
import { WORKSPACE_HISTORY_KEY } from "./workspaces.ts";
import { ApiError } from "./errors.ts";
import { createSessionStore, SESSION_STORAGE_KEY, type SessionInfo } from "./session.ts";

const INFO: SessionInfo = { actor: "actor-1", configure: false, merge: false, audit: false };

function memStorage(initial?: string) {
	const m = new Map<string, string>();
	if (initial) m.set(SESSION_STORAGE_KEY, initial);
	return {
		m,
		getItem: (k: string) => m.get(k) ?? null,
		setItem: (k: string, v: string) => void m.set(k, v),
		removeItem: (k: string) => void m.delete(k),
	};
}

const unauth = () =>
	new ApiError({ status: 401, code: "UNAUTHENTICATED", safeMessage: "", requestId: "r", retryable: false });

describe("session store", () => {
	it("connect validates via fetchSession and stores credentials only on success", async () => {
		const storage = memStorage();
		const seen: string[] = [];
		const s = createSessionStore({
			storage,
			fetchSession: async (c) => {
				seen.push(c.tenantId);
				return INFO;
			},
		});
		expect(await s.connect({ token: " tok ", tenantId: " ten ", grantId: " " })).toBe(true);
		expect(seen).toEqual(["ten"]);
		expect(s.getState()).toMatchObject({ status: "connected", info: INFO });
		expect(JSON.parse(storage.m.get(SESSION_STORAGE_KEY) ?? "{}")).toEqual({ token: "tok", tenantId: "ten" });
		expect(s.getCredentials()).toEqual({ token: "tok", tenantId: "ten" });
	});

	it("failed connect stores nothing and exposes the typed error", async () => {
		const storage = memStorage();
		const s = createSessionStore({
			storage,
			fetchSession: async () => {
				throw unauth();
			},
		});
		expect(await s.connect({ token: "bad", tenantId: "t" })).toBe(false);
		expect(s.getState().status).toBe("disconnected");
		expect(s.getState().error?.kind).toBe("unauthenticated");
		expect(storage.m.size).toBe(0);
		expect(s.getCredentials()).toBeNull();
	});

	it("restore re-validates stored credentials; garbage is discarded", async () => {
		const good = memStorage(JSON.stringify({ token: "a", tenantId: "b", grantId: "g" }));
		const s1 = createSessionStore({ storage: good, fetchSession: async () => INFO });
		expect(await s1.restore()).toBe(true);
		expect(s1.getCredentials()).toEqual({ token: "a", tenantId: "b", grantId: "g" });
		const bad = memStorage("{not json");
		const s2 = createSessionStore({ storage: bad, fetchSession: async () => INFO });
		expect(await s2.restore()).toBe(false);
		expect(bad.m.size).toBe(0);
	});

	it("disconnect and invalidate (401) clear memory and storage", async () => {
		const storage = memStorage();
		const s = createSessionStore({ storage, fetchSession: async () => INFO });
		await s.connect({ token: "a", tenantId: "b" });
		s.disconnect();
		expect(storage.m.has(SESSION_STORAGE_KEY)).toBe(false);
		expect(s.getState().status).toBe("disconnected");
		await s.connect({ token: "a", tenantId: "b" });
		s.invalidate(unauth());
		expect(storage.m.has(SESSION_STORAGE_KEY)).toBe(false);
		expect(s.getState().error?.kind).toBe("unauthenticated");
	});

	it("works when storage is unavailable (memory only) or throws", async () => {
		const throwing = {
			getItem: () => {
				throw new Error("denied");
			},
			setItem: () => {
				throw new Error("denied");
			},
			removeItem: () => {
				throw new Error("denied");
			},
		};
		const s = createSessionStore({ storage: throwing, fetchSession: async () => INFO });
		expect(await s.connect({ token: "a", tenantId: "b" })).toBe(true);
		const n = createSessionStore({ storage: null, fetchSession: async () => INFO });
		expect(await n.connect({ token: "a", tenantId: "b" })).toBe(true);
		expect(await n.restore()).toBe(false);
	});
});

const forbidden = () => new ApiError({ status: 403, code: "FORBIDDEN", safeMessage: "", requestId: "r", retryable: false });
function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((done) => { resolve = done; });
	return { promise, resolve };
}

describe("authorized workspace changes", () => {
	it("remembers successful connect contexts without credentials and restores tab-local history", async () => {
		const storage = memStorage();
		const s = createSessionStore({ storage, fetchSession: async () => INFO });
		await s.connect({ token: "synthetic-one", tenantId: "tenant-a" });
		s.disconnect();
		await s.connect({ token: "synthetic-two", tenantId: "tenant-b" });
		expect(s.getState().knownWorkspaceCount).toBe(2);
		const history = storage.m.get(WORKSPACE_HISTORY_KEY) ?? "";
		expect(history).not.toContain("synthetic");
		const restored = createSessionStore({ storage, fetchSession: async () => INFO });
		await restored.restore();
		expect(restored.getState().knownWorkspaceCount).toBe(2);
		expect(await restored.listWorkspaces()).toEqual([{ tenantId: "tenant-b" }, { tenantId: "tenant-a" }]);
	});
	it("reloads target capabilities and resets old context before publishing new credentials", async () => {
		const storage = memStorage();
		let phase = "seed";
		let previousTenant: string | undefined;
		const reset = vi.fn(() => { previousTenant = s.getCredentials()?.tenantId; });
		const s = createSessionStore({ storage, onWorkspaceChange: reset, fetchSession: async (c, signal) => {
			expect(signal).toBeInstanceOf(AbortSignal);
			return { ...INFO, configure: phase === "switch" && c.tenantId === "tenant-a", schema_read: c.tenantId === "tenant-a" };
		} });
		await s.connect({ token: "tok", tenantId: "tenant-a" });
		await s.connect({ token: "tok", tenantId: "tenant-b" });
		reset.mockClear();
		phase = "switch";
		expect(await s.switchWorkspace({ tenantId: "tenant-a" })).toBe(true);
		expect(reset).toHaveBeenCalledTimes(1);
		expect(previousTenant).toBe("tenant-b");
		expect(s.getState()).toMatchObject({ status: "connected", workspace: { tenantId: "tenant-a" }, info: { configure: true, schema_read: true }, switching: false });
	});
	it("clears a previous agency grant for a direct target and preserves an explicitly validated grant tuple", async () => {
		const seen: Credentials[] = [];
		const s = createSessionStore({ storage: null, fetchSession: async (c) => { seen.push(c); return INFO; } });
		await s.connect({ token: "tok", tenantId: "tenant-a" });
		await s.connect({ token: "tok", tenantId: "tenant-b", grantId: "grant-b" });
		expect(await s.switchWorkspace({ tenantId: "tenant-a" })).toBe(true);
		expect(seen.at(-1)).toEqual({ token: "tok", tenantId: "tenant-a" });
		expect(await s.switchWorkspace({ tenantId: "tenant-b", grantId: "grant-b" })).toBe(true);
		expect(seen.at(-1)).toEqual({ token: "tok", tenantId: "tenant-b", grantId: "grant-b" });
	});
	it.each([forbidden, unauth])("fails closed for revoked remembered targets while retaining the active context", async (failure) => {
		let revoked = false;
		const s = createSessionStore({ storage: null, fetchSession: async (c) => {
			if (revoked && c.tenantId === "tenant-a") throw failure();
			return INFO;
		} });
		await s.connect({ token: "tok", tenantId: "tenant-a" });
		await s.connect({ token: "tok", tenantId: "tenant-b" });
		revoked = true;
		expect(await s.switchWorkspace({ tenantId: "tenant-a" })).toBe(false);
		expect(s.getCredentials()?.tenantId).toBe("tenant-b");
		expect(s.getState().workspace?.tenantId).toBe("tenant-b");
		expect(await s.listWorkspaces()).toEqual([{ tenantId: "tenant-b" }]);
	});
	it("never sends an arbitrary target or an unvalidated grant tuple", async () => {
		const fetch = vi.fn(async () => INFO);
		const s = createSessionStore({ storage: null, fetchSession: fetch });
		await s.connect({ token: "tok", tenantId: "tenant-a" });
		fetch.mockClear();
		expect(await s.switchWorkspace({ tenantId: "other" })).toBe(false);
		expect(await s.switchWorkspace({ tenantId: "tenant-a", grantId: "unknown-grant" })).toBe(false);
		expect(fetch).not.toHaveBeenCalled();
	});
	it("does not let a stale switch overwrite a newer context", async () => {
		const old = deferred<SessionInfo>();
		let delay = false;
		const s = createSessionStore({ storage: null, fetchSession: async (c) => delay && c.tenantId === "tenant-a" ? old.promise : INFO });
		for (const tenantId of ["tenant-a", "tenant-b", "tenant-c"]) await s.connect({ token: "tok", tenantId });
		delay = true;
		const first = s.switchWorkspace({ tenantId: "tenant-a" });
		expect(await s.switchWorkspace({ tenantId: "tenant-b" })).toBe(true);
		old.resolve(INFO);
		expect(await first).toBe(false);
		expect(s.getCredentials()?.tenantId).toBe("tenant-b");
	});
	it("disconnect prevents pending validation from restoring credentials", async () => {
		const waiting = deferred<SessionInfo>();
		let delay = false;
		const s = createSessionStore({ storage: null, fetchSession: async () => delay ? waiting.promise : INFO });
		await s.connect({ token: "tok", tenantId: "tenant-a" });
		delay = true;
		const switching = s.switchWorkspace({ tenantId: "tenant-a" });
		s.disconnect();
		waiting.resolve(INFO);
		expect(await switching).toBe(false);
		expect(s.getCredentials()).toBeNull();
		expect(s.getState().status).toBe("disconnected");
	});
	it("revalidates every option and prunes revoked targets before returning available choices", async () => {
		let revoked = false;
		const calls: string[] = [];
		const s = createSessionStore({ storage: null, fetchSession: async (c) => {
			calls.push(c.tenantId);
			if (revoked && c.tenantId === "tenant-a") throw forbidden();
			return INFO;
		} });
		await s.connect({ token: "tok", tenantId: "tenant-a" });
		await s.connect({ token: "tok", tenantId: "tenant-b" });
		calls.length = 0;
		revoked = true;
		expect(await s.listWorkspaces()).toEqual([{ tenantId: "tenant-b" }]);
		expect(calls).toEqual(["tenant-b", "tenant-a"]);
		expect(s.getState().knownWorkspaceCount).toBe(1);
	});
	it("invalidates a revoked active context instead of displaying stale authority", async () => {
		let revoked = false;
		const s = createSessionStore({ storage: null, fetchSession: async () => { if (revoked) throw unauth(); return INFO; } });
		await s.connect({ token: "tok", tenantId: "tenant-a" });
		revoked = true;
		expect(await s.listWorkspaces()).toEqual([]);
		expect(s.getState().status).toBe("disconnected");
		expect(s.getCredentials()).toBeNull();
	});
	it("rejects mismatched response actors and replaces history when a different actor connects", async () => {
		const storage = memStorage();
		let actor = INFO.actor;
		const s = createSessionStore({ storage, fetchSession: async () => ({ ...INFO, actor }) });
		await s.connect({ token: "tok", tenantId: "tenant-a" });
		await s.connect({ token: "tok", tenantId: "tenant-b" });
		actor = "other-actor";
		expect(await s.switchWorkspace({ tenantId: "tenant-a" })).toBe(false);
		expect(s.getState().info?.actor).toBe(INFO.actor);
		await s.connect({ token: "other", tenantId: "tenant-c" });
		expect(await s.listWorkspaces()).toEqual([{ tenantId: "tenant-c" }]);
		expect(storage.m.get(WORKSPACE_HISTORY_KEY)).not.toContain("tenant-b");
	});
	it("cancels option discovery and never returns partial choices after a network failure", async () => {
		let fail = false;
		const s = createSessionStore({ storage: null, fetchSession: async (c) => { if (fail && c.tenantId === "tenant-a") throw new Error("network"); return INFO; } });
		await s.connect({ token: "tok", tenantId: "tenant-a" });
		await s.connect({ token: "tok", tenantId: "tenant-b" });
		fail = true;
		await expect(s.listWorkspaces()).rejects.toThrow("network");
		const controller = new AbortController();
		controller.abort();
		await expect(s.listWorkspaces(controller.signal)).rejects.toThrow();
		expect(s.getCredentials()?.tenantId).toBe("tenant-b");
	});
});
