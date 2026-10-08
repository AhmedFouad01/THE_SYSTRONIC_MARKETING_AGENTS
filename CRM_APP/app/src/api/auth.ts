import { errorFromResponse, networkError } from "./errors.ts";

export type AuthSession = {
 id: string;
 createdAt: string;
 updatedAt: string;
 expiresAt: string;
 ipAddress?: string | null;
 userAgent?: string | null;
};

/** Accepted B3/B5 headless surface; no automatic retry of password mutations. */
export function createAuthClient(fetchImpl: typeof fetch = fetch) {
	async function request<T>(
		path: string,
		body?: unknown,
		signal = AbortSignal.timeout(10_000),
	): Promise<T> {
		let response: Response;
		let json: unknown;
		try {
			response = await fetchImpl(`/v1/auth/${path}`, {
				method: body === undefined ? "GET" : "POST",
				credentials: "same-origin",
				headers: {
					Accept: "application/json",
					...(body === undefined ? {} : { "Content-Type": "application/json" }),
				},
				...(body === undefined ? {} : { body: JSON.stringify(body) }),
				signal,
				cache: "no-store",
				referrerPolicy: "no-referrer",
			});
			json = await response.json();
		} catch (error) {
			if (error instanceof DOMException && error.name === "AbortError")
				throw error;
			throw networkError();
		}
		if (!response.ok) throw errorFromResponse(response.status, json);
		return json as T;
	}
	return {
		// B6 has not been accepted: no factor routes or trusted-device option is exposed.
		signIn: (email: string, password: string) =>
			request<{ twoFactorRedirect?: boolean }>("sign-in/email", {
				email,
				password,
			}),
		signUp: (
			email: string,
			password: string,
			name: string,
			invitationId: string,
		) => request("sign-up/email", { email, password, name, invitationId }),
		acceptInvitation: (invitationId: string) =>
			request("organization/accept-invitation", { invitationId }),
		resetPassword: (token: string, newPassword: string) =>
			request("reset-password", { token, newPassword }),
		getSession: () => request<{ user: { id: string } } | null>("get-session"),
		signOut: () => request("sign-out", {}),
  listSessions: () => request<AuthSession[]>("list-sessions"),
  revokeSession: (sessionId: string) => request("revoke-session", { sessionId }),
  revokeOtherSessions: () => request("revoke-other-sessions", {}),
  revokeSessions: () => request("revoke-sessions", {}),
  changePassword: (currentPassword: string, newPassword: string) =>
   request("change-password", { currentPassword, newPassword }),
	};
}
