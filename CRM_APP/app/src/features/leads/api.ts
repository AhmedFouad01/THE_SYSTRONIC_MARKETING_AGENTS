import { apiClient } from "../../api/index.ts";
import type { FetchPage } from "../../ui/data-grid/index.ts";
import type { Assignee, Contact, Lead } from "./model.ts";

export const fetchLeadsPage: FetchPage<Lead> = async ({ cursor, signal }) => {
	const r = await apiClient.get<Lead[]>("leads", {
		query: { cursor: cursor ?? undefined },
		signal,
	});
	return { items: r.data, nextCursor: r.nextCursor };
};

export const fetchContactsPage: FetchPage<Contact> = async ({
	cursor,
	signal,
}) => {
	const r = await apiClient.get<Contact[]>("contacts", {
		query: { cursor: cursor ?? undefined },
		signal,
	});
	return { items: r.data, nextCursor: r.nextCursor };
};

export async function fetchAssignees(
	signal?: AbortSignal,
): Promise<Assignee[]> {
	return (
		await apiClient.get<Assignee[]>("assignees", signal ? { signal } : {})
	).data;
}

export async function fetchLead(id: string): Promise<Lead> {
	return (await apiClient.get<Lead>(`leads/${id}`)).data;
}

/** PATCH /v1/leads/{id}; body carries command_id (Idempotency-Key) and expected_version. */
export async function patchLead(
	id: string,
	body: Record<string, unknown>,
): Promise<Lead> {
	return (await apiClient.patch<Lead>(`leads/${id}`, body)).data;
}

export async function createLead(
	body: Record<string, unknown>,
	idempotencyKey: string,
): Promise<Lead> {
	return (await apiClient.post<Lead>("leads", body, { idempotencyKey })).data;
}
