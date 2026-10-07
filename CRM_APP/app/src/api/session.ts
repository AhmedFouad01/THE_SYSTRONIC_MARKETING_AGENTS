import type { Credentials } from "./client.ts";
import { type ApiError, isApiError } from "./errors.ts";

// Session store: credentials live in sessionStorage only (tab-scoped, cleared on close), never localStorage.
// Tokens are never logged. Validity is always confirmed by GET /v1/session before "connected".
export const SESSION_STORAGE_KEY = "sy.session";

export type SessionInfo = {
	actor: string;
	configure: boolean;
	merge: boolean;
	audit: boolean;
	/** P1b B3: schema.read / property.manage as the server resolves them. Absent on an older server: callers fall back to a probe / `configure`. */
	schema_read?: boolean;
	property_manage?: boolean;
};

export type SessionState = {
	status: "disconnected" | "checking" | "connected";
	info: SessionInfo | null;
	error: ApiError | null;
};

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type SessionStoreDeps = {
	storage: StorageLike | null;
	fetchSession: (c: Credentials) => Promise<SessionInfo>;
};

export function safeSessionStorage(): StorageLike | null {
	try {
		return window.sessionStorage;
	} catch {
		return null; // storage disabled: session is memory-only
	}
}

function parseCredentials(raw: string | null): Credentials | null {
	if (!raw) return null;
	try {
		const v = JSON.parse(raw) as Record<string, unknown>;
		if (typeof v.token !== "string" || typeof v.tenantId !== "string") return null;
		if (!v.token || !v.tenantId) return null;
		return {
			token: v.token,
			tenantId: v.tenantId,
			...(typeof v.grantId === "string" && v.grantId ? { grantId: v.grantId } : {}),
		};
	} catch {
		return null;
	}
}

export function createSessionStore(deps: SessionStoreDeps) {
	let credentials: Credentials | null = null;
	let state: SessionState = { status: "disconnected", info: null, error: null };
	const listeners = new Set<() => void>();
	let attempt = 0; // guards against out-of-order validation results

	const set = (next: SessionState) => {
		state = next;
		for (const l of listeners) l();
	};
	const persist = (c: Credentials | null) => {
		try {
			if (c) deps.storage?.setItem(SESSION_STORAGE_KEY, JSON.stringify(c));
			else deps.storage?.removeItem(SESSION_STORAGE_KEY);
		} catch {
			// ignore: memory-only session
		}
	};

	async function validate(c: Credentials, keepOnFailure: boolean): Promise<boolean> {
		const mine = ++attempt;
		set({ status: "checking", info: null, error: null });
		try {
			const info = await deps.fetchSession(c);
			if (mine !== attempt) return false;
			credentials = c;
			persist(c);
			set({ status: "connected", info, error: null });
			return true;
		} catch (e) {
			if (mine !== attempt) return false;
			if (!keepOnFailure) {
				credentials = null;
				persist(null);
			}
			set({
				status: "disconnected",
				info: null,
				error: isApiError(e) ? e : null,
			});
			return false;
		}
	}

	return {
		getState: () => state,
		getCredentials: () => credentials,
		subscribe(l: () => void) {
			listeners.add(l);
			return () => listeners.delete(l);
		},
		/** Validates via GET /v1/session; stores credentials only on success. */
		connect(c: Credentials) {
			const clean: Credentials = {
				token: c.token.trim(),
				tenantId: c.tenantId.trim(),
				...(c.grantId?.trim() ? { grantId: c.grantId.trim() } : {}),
			};
			return validate(clean, false);
		},
		/** Reads sessionStorage and re-validates; resolves false if nothing stored/invalid. */
		async restore() {
			let raw: string | null = null;
			try {
				raw = deps.storage?.getItem(SESSION_STORAGE_KEY) ?? null;
			} catch {
				raw = null;
			}
			const c = parseCredentials(raw);
			if (!c) {
				persist(null);
				return false;
			}
			return validate(c, false);
		},
		disconnect() {
			attempt++;
			credentials = null;
			persist(null);
			set({ status: "disconnected", info: null, error: null });
		},
		/** Called when an authenticated call returns 401 (revoked/expired). */
		invalidate(error?: ApiError) {
			attempt++;
			credentials = null;
			persist(null);
			set({ status: "disconnected", info: null, error: error ?? null });
		},
	};
}

export type SessionStore = ReturnType<typeof createSessionStore>;
