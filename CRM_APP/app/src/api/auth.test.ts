import { describe, expect, it, vi } from "vitest";
import { createAuthClient } from "./auth.ts";
import { createApiClient } from "./client.ts";
import { ApiError } from "./errors.ts";

describe("cookie auth contracts", () => {
	it("uses same-origin JSON and accepted bodies without bearer or tenant headers", async () => {
		const fetchImpl = vi.fn<typeof fetch>(
			async () =>
				new Response(JSON.stringify({ user: { id: "actor" } }), {
					status: 200,
				}),
		);
		const auth = createAuthClient(fetchImpl);
		await auth.signIn("a@example.test", "synthetic-password");
		await auth.getSession();
		await auth.signOut();
		expect(fetchImpl.mock.calls.map((call) => call[0])).toEqual([
			"/v1/auth/sign-in/email",
			"/v1/auth/get-session",
			"/v1/auth/sign-out",
		]);
		expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({
			credentials: "same-origin",
			method: "POST",
			body: JSON.stringify({
				email: "a@example.test",
				password: "synthetic-password",
			}),
		});
		for (const call of fetchImpl.mock.calls)
			expect(call[1]?.headers).not.toHaveProperty("Authorization");
	});
	it("sends cookie business headers and preserves idempotency and 401 invalidation", async () => {
		const f = vi.fn<typeof fetch>(
			async () =>
				new Response(JSON.stringify({ code: "UNAUTHENTICATED" }), {
					status: 401,
				}),
		);
		const invalid = vi.fn();
		const client = createApiClient({
			getCredentials: () => ({
				token: "",
				authMode: "cookie",
				tenantId: "tenant",
				grantId: "grant",
			}),
			fetchImpl: f,
			newKey: () => "key",
			onUnauthenticated: invalid,
		});
		await expect(client.post("leads", {})).rejects.toBeInstanceOf(ApiError);
		expect(f.mock.calls[0]?.[1]).toMatchObject({
			credentials: "same-origin",
			headers: {
				"X-Tenant-ID": "tenant",
				"X-Grant-ID": "grant",
				"Idempotency-Key": "key",
			},
		});
		expect(f.mock.calls[0]?.[1]?.headers).not.toHaveProperty("Authorization");
		expect(invalid).toHaveBeenCalledOnce();
	});
	it("maps stable adverse responses without exposing upstream message", async () => {
		const auth = createAuthClient(
			async () =>
				new Response(
					JSON.stringify({
						code: "AUTH_RATE_LIMITED",
						message: "secret upstream",
					}),
					{ status: 429 },
				),
		);
		await expect(
			auth.signIn("a@example.test", "synthetic"),
		).rejects.toMatchObject({ code: "AUTH_RATE_LIMITED", safeMessage: "" });
	});
});

describe("B8 link auth contracts", () => {
	it("posts strict bodies without URL credentials or retries", async () => {
		const f = vi.fn<typeof fetch>(
			async () => new Response(JSON.stringify({ status: true })),
		);
		const auth = createAuthClient(f);
		await auth.signUp(
			"mixed@example.test",
			"synthetic-password",
			"Mixed name",
			"invite",
		);
		await auth.acceptInvitation("invite");
		await auth.resetPassword("synthetic-token", "synthetic-password");
		expect(
			f.mock.calls.map((c) => [c[0], JSON.parse(String(c[1]?.body))]),
		).toEqual([
			[
				"/v1/auth/sign-up/email",
				{
					email: "mixed@example.test",
					password: "synthetic-password",
					name: "Mixed name",
					invitationId: "invite",
				},
			],
			["/v1/auth/organization/accept-invitation", { invitationId: "invite" }],
			[
				"/v1/auth/reset-password",
				{ token: "synthetic-token", newPassword: "synthetic-password" },
			],
		]);
		for (const [, options] of f.mock.calls) {
			expect(options).toMatchObject({
				credentials: "same-origin",
				cache: "no-store",
				referrerPolicy: "no-referrer",
			});
			expect(options?.headers).not.toHaveProperty("Authorization");
			expect(options?.headers).not.toHaveProperty("X-Tenant-ID");
		}
	});
});
