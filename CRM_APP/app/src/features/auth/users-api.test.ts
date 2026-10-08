import { describe, expect, it, vi } from "vitest";
import { createApiClient } from "../../api/client.ts";
import { createUsersApi, safeCopyLink } from "./users-api.ts";

describe("B8 admin contracts", () => {
	it("uses paged tenant-scoped strict bodies and never retries writes", async () => {
		const f = vi.fn<typeof fetch>(
			async () =>
				new Response(JSON.stringify({ data: { members: [], total: 0 } })),
		);
		const api = createUsersApi(
			createApiClient({
				getCredentials: () => ({
					authMode: "cookie",
					token: "",
					tenantId: "tenant",
				}),
				fetchImpl: f,
				newKey: () => "fixture-key",
			}),
		);
		await api.members(100);
		await api.invitations();
		await api.invite("a@example.test", "rep");
		await api.role("member", "reader");
		await api.deactivate("member");
		await api.cancel("invite");
		await api.reset("member");
		expect(
			f.mock.calls.map(([url, opts]) => [
				url,
				opts?.method,
				opts?.body ? JSON.parse(String(opts.body)) : undefined,
			]),
		).toEqual([
			["/v1/users?limit=100&offset=100", "GET", undefined],
			["/v1/invites", "GET", undefined],
			["/v1/invites", "POST", { email: "a@example.test", role: "rep" }],
			["/v1/users/member", "PATCH", { role: "reader" }],
			["/v1/users/member", "DELETE", {}],
			["/v1/invites/invite", "DELETE", {}],
			["/v1/users/member/reset-password", "POST", {}],
		]);
		for (const [, opts] of f.mock.calls) {
			expect(opts).toMatchObject({
				credentials: "same-origin",
				headers: { "X-Tenant-ID": "tenant" },
			});
			expect(opts?.headers).not.toHaveProperty("Authorization");
			if (opts?.method !== "GET")
				expect(opts?.headers).toHaveProperty(
					"Idempotency-Key",
					expect.any(String),
				);
		}
		expect(f.mock.calls[2]?.[1]?.headers).toHaveProperty(
			"Idempotency-Key",
			"fixture-key",
		);
	});
	it.each(["AUTH_INVITATION_INVALID", "LAST_MANAGER_REQUIRED", "FORBIDDEN"])(
		"returns %s for reconciliation without replaying a command",
		async (code) => {
			const f = vi.fn<typeof fetch>(
				async () =>
					new Response(JSON.stringify({ code, message: "hidden" }), {
						status: code === "LAST_MANAGER_REQUIRED" ? 409 : 403,
					}),
			);
			const api = createUsersApi(
				createApiClient({
					getCredentials: () => ({
						authMode: "cookie",
						token: "",
						tenantId: "tenant",
					}),
					fetchImpl: f,
				}),
			);
			await expect(api.role("member", "rep")).rejects.toMatchObject({
				code,
				safeMessage: "",
			});
			expect(f).toHaveBeenCalledOnce();
		},
	);
	it("validates fragment-only local copy links", () => {
		const origin = "https://crm.example.test";
		expect(
			safeCopyLink(
				`${origin}/app/reset#token=abcdefghijklmnopqrstuvwx`,
				"reset",
				origin,
			),
		).toBe(`${origin}/app/reset#token=abcdefghijklmnopqrstuvwx`);
		expect(
			safeCopyLink(
				`${origin}/app/invite#invitationId=00000000-0000-4000-8000-000000000001`,
				"invite",
				origin,
			),
		).toBeTruthy();
	});
	it.each([
		"https://other.example.test/app/reset#token=abcdefghijklmnopqrstuvwx",
		"https://crm.example.test/app/reset?token=abcdefghijklmnopqrstuvwx",
		"https://crm.example.test/app/reset#token=short",
		"https://crm.example.test/app/reset#token=abcdefghijklmnopqrstuvwx&extra=1",
		"javascript:alert(1)",
	])("rejects unsafe copy link %s", (url) => {
		expect(safeCopyLink(url, "reset", "https://crm.example.test")).toBeNull();
	});
});
