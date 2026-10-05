import { useSyncExternalStore } from "react";
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

// Singletons for the app. Closures reference each other lazily (both are created before first call).
export const apiClient = createApiClient({
	getCredentials: () => sessionStore.getCredentials(),
	onUnauthenticated: () => sessionStore.invalidate(),
});

export const sessionStore = createSessionStore({
	storage: safeSessionStorage(),
	fetchSession: async (credentials) =>
		(await apiClient.get<SessionInfo>("session", { credentials })).data,
});

export function useSession(): SessionState {
	return useSyncExternalStore(sessionStore.subscribe, sessionStore.getState);
}
