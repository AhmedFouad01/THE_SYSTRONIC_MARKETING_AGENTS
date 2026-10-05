import { describe, expect, it } from "vitest";
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
		expect(storage.m.size).toBe(0);
		expect(s.getState().status).toBe("disconnected");
		await s.connect({ token: "a", tenantId: "b" });
		s.invalidate(unauth());
		expect(storage.m.size).toBe(0);
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
