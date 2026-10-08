import { errorFromResponse, networkError } from "./errors.ts";

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
		getSession: () => request<{ user: { id: string } } | null>("get-session"),
		signOut: () => request("sign-out", {}),
	};
}
