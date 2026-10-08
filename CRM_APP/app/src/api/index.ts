import { useSyncExternalStore } from "react";
import { importDraftStore } from "../features/imports/draft.ts";
import { createAuthClient } from "./auth.ts";
import { createApiClient } from "./client.ts";
import {
	createSessionStore,
	type SessionInfo,
	type SessionState,
	safeSessionStorage,
} from "./session.ts";

export * from "./client.ts";
export * from "./errors.ts";
export * from "./session.ts";

export const DEV_BEARER = import.meta.env.VITE_DEV_BEARER === "1";
export const authClient = createAuthClient();

// Singletons for the app. Closures reference each other lazily (both are created before first call).
export const apiClient = createApiClient({
	getCredentials: () => sessionStore.getCredentials(),
	onUnauthenticated: () => sessionStore.invalidate(),
});

export const sessionStore = createSessionStore({
	storage: safeSessionStorage(),
	...(!DEV_BEARER ? { cookieAuth: authClient } : {}),
	fetchSession: async (credentials, signal) =>
		(await apiClient.get<SessionInfo>("session", { credentials, signal })).data,
	onWorkspaceChange: () => {
		importDraftStore.clear();
		// Drop record/query handoffs before the new tenant mounts and reads location.
		if (typeof window !== "undefined") window.history.replaceState(null, "", window.location.pathname);
	},
});

export function useSession(): SessionState {
	return useSyncExternalStore(sessionStore.subscribe, sessionStore.getState);
}

/** Admin = may configure the tenant (UI_R4_SPEC B: ID/Version "Technical details" are shown to admins only). */
export function useIsAdmin(): boolean {
	return useSession().info?.configure === true;
}
