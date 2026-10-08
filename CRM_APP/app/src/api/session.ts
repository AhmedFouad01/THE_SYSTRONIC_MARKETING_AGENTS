import type { Credentials } from "./client.ts";
import { ApiError, isApiError, networkError } from "./errors.ts";

import {
	type Workspace,
	readWorkspaceHistory,
	rememberWorkspace,
	sameWorkspace,
	WORKSPACE_HISTORY_KEY,
	workspaceCredentials,
} from "./workspaces.ts";
export type { Workspace } from "./workspaces.ts";

// Cookie mode keeps only workspace history in storage. Explicit development Bearer mode is tab-scoped.
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
	workspace: Workspace | null;
	knownWorkspaceCount: number;
	switching: boolean;
	workspaceError: ApiError | null;
};

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type SessionStoreDeps = {
	storage: StorageLike | null;
	/** Presence selects cookie mode; identity is checked before any tenant restore. */
	cookieAuth?: {
		getSession: () => Promise<{ user: { id: string } } | null>;
		signIn: (
			email: string,
			password: string,
		) => Promise<{ twoFactorRedirect?: boolean }>;
		signOut: () => Promise<unknown>;
	};
	fetchSession: (c: Credentials, signal?: AbortSignal) => Promise<SessionInfo>;
	/** Runs before a changed context is published so URL-bound record/selection state cannot cross tenants. */
	onWorkspaceChange?: () => void;
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
		if (typeof v.token !== "string" || typeof v.tenantId !== "string")
			return null;
		if (!v.token || !v.tenantId) return null;
		return {
			token: v.token,
			tenantId: v.tenantId,
			...(typeof v.grantId === "string" && v.grantId
				? { grantId: v.grantId }
				: {}),
		};
	} catch {
		return null;
	}
}

export function createSessionStore(deps: SessionStoreDeps) {
	let credentials: Credentials | null = null;
	const emptyState = (): SessionState => ({
		status: "disconnected",
		info: null,
		error: null,
		workspace: null,
		knownWorkspaceCount: 0,
		switching: false,
		workspaceError: null,
	});
	let state: SessionState = emptyState();
	let historyActor: string | null = null;
	let history: Workspace[] = [];
	let lastScope: { actor: string; workspace: Workspace } | null = null;
	const listeners = new Set<() => void>();
	let attempt = 0; // guards against out-of-order validation results

	const set = (next: SessionState) => {
		state = next;
		for (const l of listeners) l();
	};
	const persist = (c: Credentials | null) => {
		try {
			if (c && !deps.cookieAuth)
				deps.storage?.setItem(SESSION_STORAGE_KEY, JSON.stringify(c));
			else deps.storage?.removeItem(SESSION_STORAGE_KEY);
		} catch {
			// ignore: memory-only session
		}
	};

	function loadHistory(actor: string) {
		if (historyActor === actor) return;
		historyActor = actor;
		try {
			history = readWorkspaceHistory(
				deps.storage?.getItem(WORKSPACE_HISTORY_KEY) ?? null,
				actor,
			);
		} catch {
			history = [];
		}
	}
	function persistHistory() {
		try {
			deps.storage?.setItem(
				WORKSPACE_HISTORY_KEY,
				JSON.stringify({ actor: historyActor, contexts: history }),
			);
		} catch {
			// History is optional; switching still works in memory.
		}
	}
	function forbiddenWorkspace(): ApiError {
		return new ApiError({
			status: 403,
			code: "FORBIDDEN",
			safeMessage: "",
			requestId: null,
			retryable: false,
		});
	}
	function removeWorkspace(workspace: Workspace) {
		history = history.filter((item) => !sameWorkspace(item, workspace));
		persistHistory();
	}

	async function validate(
		c: Credentials,
		keepOnFailure: boolean,
	): Promise<boolean> {
		const mine = ++attempt;
		set({ ...emptyState(), status: "checking" });
		try {
			const info = await deps.fetchSession(c, AbortSignal.timeout(10_000));
			if (mine !== attempt) return false;
			loadHistory(info.actor);
			const workspace: Workspace = {
				tenantId: c.tenantId,
				...(c.grantId ? { grantId: c.grantId } : {}),
			};
			history = rememberWorkspace(history, workspace);
			persistHistory();
			if (
				lastScope &&
				(lastScope.actor !== info.actor ||
					!sameWorkspace(lastScope.workspace, workspace))
			)
				deps.onWorkspaceChange?.();
			lastScope = { actor: info.actor, workspace };
			credentials = c;
			persist(c);
			set({
				...emptyState(),
				status: "connected",
				info,
				workspace,
				knownWorkspaceCount: history.length,
			});
			return true;
		} catch (e) {
			if (mine !== attempt) return false;
			if (!keepOnFailure) {
				credentials = null;
				persist(null);
			}
			set({
				...emptyState(),
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
				token: deps.cookieAuth ? "" : c.token.trim(),
				...(deps.cookieAuth ? { authMode: "cookie" as const } : {}),
				tenantId: c.tenantId.trim(),
				...(c.grantId?.trim() ? { grantId: c.grantId.trim() } : {}),
			};
			return validate(clean, false);
		},
		/** Recheck every remembered context before it becomes a selectable option. */
		async listWorkspaces(signal?: AbortSignal): Promise<Workspace[]> {
			const current = credentials;
			const actor = state.info?.actor;
			const mine = attempt;
			if (!current || !actor || state.status !== "connected") return [];
			const available: Workspace[] = [];
			const timeout = AbortSignal.timeout(10_000);
			const listSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
			for (const workspace of [...history]) {
				listSignal.throwIfAborted();
				try {
					const info = await deps.fetchSession(
						{
							...workspaceCredentials(current.token, workspace),
							...(deps.cookieAuth ? { authMode: "cookie" as const } : {}),
						},
						listSignal,
					);
					if (mine !== attempt || actor !== state.info?.actor) return [];
					if (info.actor !== actor) throw forbiddenWorkspace();
					available.push(workspace);
				} catch (error) {
					if (mine !== attempt) return [];
					if (
						isApiError(error) &&
						(error.kind === "forbidden" || error.kind === "unauthenticated")
					) {
						removeWorkspace(workspace);
						if (state.workspace && sameWorkspace(state.workspace, workspace)) {
							attempt++;
							credentials = null;
							persist(null);
							set({ ...emptyState(), error });
							return [];
						}
						continue;
					}
					throw error;
				}
			}
			if (mine === attempt)
				set({ ...state, knownWorkspaceCount: history.length });
			return available;
		},
		/** A known target is revalidated with its exact grant tuple; failure retains the current workspace. */
		async switchWorkspace(workspace: Workspace): Promise<boolean> {
			const current = credentials;
			const actor = state.info?.actor;
			if (
				!current ||
				!actor ||
				state.status !== "connected" ||
				!history.some((item) => sameWorkspace(item, workspace))
			)
				return false;
			const mine = ++attempt;
			set({ ...state, switching: true, workspaceError: null });
			try {
				const next = {
					...workspaceCredentials(current.token, workspace),
					...(deps.cookieAuth ? { authMode: "cookie" as const } : {}),
				};
				const info = await deps.fetchSession(next, AbortSignal.timeout(10_000));
				if (mine !== attempt) return false;
				if (info.actor !== actor) throw forbiddenWorkspace();
				if (!state.workspace || !sameWorkspace(state.workspace, workspace))
					deps.onWorkspaceChange?.();
				lastScope = { actor: info.actor, workspace: { ...workspace } };
				credentials = next;
				persist(next);
				history = rememberWorkspace(history, workspace);
				persistHistory();
				set({
					...emptyState(),
					status: "connected",
					info,
					workspace: { ...workspace },
					knownWorkspaceCount: history.length,
				});
				return true;
			} catch (error) {
				if (mine !== attempt) return false;
				if (
					isApiError(error) &&
					(error.kind === "forbidden" || error.kind === "unauthenticated")
				)
					removeWorkspace(workspace);
				set({
					...state,
					switching: false,
					workspaceError: isApiError(error) ? error : null,
					knownWorkspaceCount: history.length,
				});
				return false;
			}
		},
		/** Reads sessionStorage and re-validates; resolves false if nothing stored/invalid. */
		async restore() {
			if (deps.cookieAuth) {
				const mine = ++attempt;
				persist(null); // discard credentials left by the old development gate
				set({ ...emptyState(), status: "checking" });
				try {
					const identity = await deps.cookieAuth.getSession();
					if (mine !== attempt) return false;
					if (!identity) {
						set(emptyState());
						return false;
					}
					loadHistory(identity.user.id);
					const workspace = history[0];
					if (!workspace) {
						set(emptyState());
						return false;
					}
					return validate(
						{ token: "", authMode: "cookie", ...workspace },
						false,
					);
				} catch (error) {
					if (mine === attempt)
						set({ ...emptyState(), error: isApiError(error) ? error : null });
					return false;
				}
			}
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
		async signIn(email: string, password: string, workspace: Workspace) {
			if (!deps.cookieAuth || state.status === "checking") return false;
			const mine = ++attempt;
			set({ ...emptyState(), status: "checking" });
			try {
				const result = await deps.cookieAuth.signIn(email.trim(), password);
				if (mine !== attempt) return false;
				// Independent factor composition stays gated until accepted B6.
				if (result.twoFactorRedirect)
					throw new ApiError({
						status: 503,
						code: "AUTH_UNAVAILABLE",
						safeMessage: "",
						requestId: null,
						retryable: false,
					});
				return validate({ token: "", authMode: "cookie", ...workspace }, false);
			} catch (error) {
				if (mine === attempt)
					set({
						...emptyState(),
						error: isApiError(error) ? error : networkError(),
					});
				return false;
			}
		},
		/** Confirm a rotated/revoked cookie without unmounting a connected recovery screen. */
  async recheck() {
   const current = credentials;
   if (!current || state.status !== "connected") return false;
   const mine = attempt;
   try {
    const info = await deps.fetchSession(current, AbortSignal.timeout(10_000));
    if (mine !== attempt) return false;
    if (info.actor !== state.info?.actor) {
     attempt++; credentials = null; persist(null); set(emptyState());
     return false;
    }
    set({ ...state, info });
    return true;
   } catch (e) {
    if (mine !== attempt) return false;
    if (isApiError(e) && e.status === 401) {
     attempt++; credentials = null; persist(null); set({ ...emptyState(), error: e });
     return false;
    }
    throw e;
   }
  },
		async logout() {
			if (state.switching) return false;
			if (deps.cookieAuth) {
				const mine = ++attempt;
				set({ ...state, switching: true, error: null });
				try {
					await deps.cookieAuth.signOut();
				} catch (error) {
					if (mine === attempt)
						set({
							...state,
							switching: false,
							error: isApiError(error) ? error : networkError(),
						});
					return false;
				}
				if (mine !== attempt) return false;
			}
			attempt++;
			credentials = null;
			persist(null);
			set(emptyState());
			deps.onWorkspaceChange?.();
			return true;
		},
		disconnect() {
			attempt++;
			credentials = null;
			persist(null);
			set(emptyState());
		},
		/** Called when an authenticated call returns 401 (revoked/expired). */
		invalidate(error?: ApiError) {
			attempt++;
			credentials = null;
			persist(null);
			set({ ...emptyState(), error: error ?? null });
		},
	};
}

export type SessionStore = ReturnType<typeof createSessionStore>;
