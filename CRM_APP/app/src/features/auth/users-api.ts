import type { ApiClient } from "../../api/client.ts";
import { readAuthLink } from "./link.ts";
export const USER_ROLES = ["manager", "rep", "reader"] as const;
export type UserRole = (typeof USER_ROLES)[number];
export type Member = {
	id: string;
	userId: string;
	role: UserRole;
	user: { id: string; name: string; email: string };
};
export type Invitation = {
	id: string;
	email: string;
	role: UserRole;
	status: string;
};
export function createUsersApi(client: ApiClient) {
	const options = () => ({ signal: AbortSignal.timeout(10_000) });
	const user = (id: string) => `users/${encodeURIComponent(id)}`;
	return {
		members: async (offset = 0) =>
			(
				await client.get<{ members: Member[]; total: number }>("users", {
					...options(),
					query: { limit: 100, offset },
				})
			).data,
		invitations: async () =>
			(await client.get<Invitation[]>("invites", options())).data,
		invite: async (email: string, role: UserRole) =>
			(
				await client.post<{ invitation: Invitation; link: string }>(
					"invites",
					{ email, role },
					options(),
				)
			).data,
		role: async (id: string, role: UserRole) =>
			client.patch(user(id), { role }, options()),
		deactivate: async (id: string) =>
			client.request("DELETE", user(id), {
				...options(),
				body: {},
				idempotencyKey: crypto.randomUUID(),
			}),
		cancel: async (id: string) =>
			client.request("DELETE", `invites/${encodeURIComponent(id)}`, {
				...options(),
				body: {},
				idempotencyKey: crypto.randomUUID(),
			}),
		reset: async (id: string) =>
			(
				await client.post<{ status: true; link: string }>(
					`${user(id)}/reset-password`,
					{},
					options(),
				)
			).data,
	};
}
/** Copy only the configured app origin and accepted fragment shape; never navigate or persist. */
export function safeCopyLink(
	raw: string,
	kind: "invite" | "reset",
	origin: string,
): string | null {
	try {
		const url = new URL(raw);
		if (
			url.origin !== origin ||
			url.username ||
			url.password ||
			url.search ||
			url.pathname !== `/app/${kind}`
		)
			return null;
		const link = readAuthLink(url, { replaceState: () => {} });
		return link?.kind === kind && link.secret ? url.href : null;
	} catch {
		return null;
	}
}
