import { describe, expect, it, vi } from "vitest";
import { createSessionStore, SESSION_STORAGE_KEY } from "./session.ts";
import { WORKSPACE_HISTORY_KEY } from "./workspaces.ts";
import { ApiError } from "./errors.ts";
const info = { actor: "actor", configure: false, merge: false, audit: false };
function setup(actor = "actor") {
	const values = new Map([
		[
			SESSION_STORAGE_KEY,
			JSON.stringify({ token: "obsolete", tenantId: "old" }),
		],
	]);
	const storage = {
		getItem: (k: string) => values.get(k) ?? null,
		setItem: (k: string, v: string) => void values.set(k, v),
		removeItem: (k: string) => void values.delete(k),
	};
	const cookieAuth = {
		getSession: vi.fn(async () => ({ user: { id: actor } })),
		signIn: vi.fn(async () => ({})),
		signOut: vi.fn(async () => ({})),
	};
	const fetchSession = vi.fn(
		async (_credentials: import("./client.ts").Credentials) => info,
	);
	return {
		values,
		cookieAuth,
		fetchSession,
		store: createSessionStore({ storage, cookieAuth, fetchSession }),
	};
}
describe("cookie session lifecycle", () => {
 it("rechecks rotated cookies while keeping the recovery screen connected, then clears revoked cookies", async () => {
  const { store, fetchSession } = setup();
  await store.signIn("a@example.test", "synthetic", { tenantId: "tenant" });
  const states: string[] = [];
  store.subscribe(() => states.push(store.getState().status));
  expect(await store.recheck()).toBe(true);
  expect(states).toEqual(["connected"]);
  fetchSession.mockRejectedValueOnce(new ApiError({status:401,code:"UNAUTHENTICATED",safeMessage:"",requestId:null,retryable:false}));
  expect(await store.recheck()).toBe(false);
  expect(store.getState().status).toBe("disconnected");
  expect(store.getCredentials()).toBeNull();
 });
 it("rejects stale recovery checks after invalidation", async () => {
  const { store, fetchSession } = setup();
  await store.signIn("a@example.test", "synthetic", { tenantId: "tenant" });
  let resolve!: (value: typeof info) => void;
  fetchSession.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  const checking = store.recheck();
  store.invalidate(); resolve(info);
  expect(await checking).toBe(false);
  expect(store.getState().status).toBe("disconnected");
 });

	it("signs in without persisted credentials and only after server tenant validation", async () => {
		const { store, values, fetchSession } = setup();
		expect(
			await store.signIn(" a@example.test ", "synthetic", {
				tenantId: "tenant",
			}),
		).toBe(true);
		expect(fetchSession.mock.calls[0]?.[0]).toEqual({
			token: "",
			authMode: "cookie",
			tenantId: "tenant",
		});
		expect(values.has(SESSION_STORAGE_KEY)).toBe(false);
		expect(JSON.stringify([...values.values()])).not.toContain("synthetic");
		expect(await store.restore()).toBe(true);
		expect(store.getState().status).toBe("connected");
	});
	it("does not restore contexts belonging to another actor", async () => {
		const { store, values, fetchSession } = setup("other");
		values.set(
			WORKSPACE_HISTORY_KEY,
			JSON.stringify({ actor: "actor", contexts: [{ tenantId: "tenant" }] }),
		);
		expect(await store.restore()).toBe(false);
		expect(fetchSession).not.toHaveBeenCalled();
		expect(values.has(SESSION_STORAGE_KEY)).toBe(false);
	});
	it("failed logout remains authenticated with retryable error; success clears context", async () => {
		const { store, cookieAuth } = setup();
		await store.signIn("a@example.test", "synthetic", { tenantId: "tenant" });
		cookieAuth.signOut.mockRejectedValueOnce(
			new ApiError({
				status: 503,
				code: "AUTH_BUSY",
				safeMessage: "",
				requestId: null,
				retryable: true,
			}),
		);
		expect(await store.logout()).toBe(false);
		expect(store.getState()).toMatchObject({
			status: "connected",
			error: { code: "AUTH_BUSY" },
		});
		expect(await store.logout()).toBe(true);
		expect(store.getCredentials()).toBeNull();
	});
	it("401 invalidation clears cookie context and ignores stale bootstrap completion", async () => {
		const { store, cookieAuth } = setup();
		let resolve!: (v: { user: { id: string } }) => void;
		cookieAuth.getSession.mockImplementationOnce(
			() =>
				new Promise((done) => {
					resolve = done;
				}),
		);
		const pending = store.restore();
		store.invalidate();
		resolve({ user: { id: "actor" } });
		expect(await pending).toBe(false);
		expect(store.getState().status).toBe("disconnected");
	});
	it("deferred factor never creates connected state or exposes factor controls", async () => {
		const { store, cookieAuth, fetchSession } = setup();
		cookieAuth.signIn.mockResolvedValueOnce({ twoFactorRedirect: true });
		expect(
			await store.signIn("a@example.test", "synthetic", { tenantId: "tenant" }),
		).toBe(false);
		expect(fetchSession).not.toHaveBeenCalled();
		expect(store.getState().error?.code).toBe("AUTH_UNAVAILABLE");
	});
});
