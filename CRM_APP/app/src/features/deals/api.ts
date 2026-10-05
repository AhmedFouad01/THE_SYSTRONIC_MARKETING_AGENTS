import { apiClient } from "../../api/index.ts";
import type { FetchPage } from "../../ui/data-grid/index.ts";
import type {
	Assignee,
	Contact,
	Deal,
	HistoryEntry,
	LeadRef,
	Pipeline,
} from "./model.ts";

export const fetchDealsPage: FetchPage<Deal> = async ({ cursor, signal }) => {
	const r = await apiClient.get<Deal[]>("deals", {
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

/** GET /v1/pipelines: stages and allowed transitions are embedded. */
export async function fetchPipelines(
	signal?: AbortSignal,
): Promise<Pipeline[]> {
	return (
		await apiClient.get<Pipeline[]>("pipelines", signal ? { signal } : {})
	).data;
}

export async function fetchDeal(id: string): Promise<Deal> {
	return (await apiClient.get<Deal>(`deals/${id}`)).data;
}

export async function fetchContact(id: string): Promise<Contact> {
	return (await apiClient.get<Contact>(`contacts/${id}`)).data;
}

export async function fetchLeadRef(id: string): Promise<LeadRef> {
	return (await apiClient.get<LeadRef>(`leads/${id}`)).data;
}

export async function fetchHistory(
	id: string,
	signal?: AbortSignal,
): Promise<HistoryEntry[]> {
	return (
		await apiClient.get<HistoryEntry[]>(
			`deals/${id}/history`,
			signal ? { signal } : {},
		)
	).data;
}

/** PATCH /v1/deals/{id}; body carries command_id (Idempotency-Key) and expected_version. */
export async function patchDeal(
	id: string,
	body: Record<string, unknown>,
): Promise<Deal> {
	return (await apiClient.patch<Deal>(`deals/${id}`, body)).data;
}

export async function createDeal(
	body: Record<string, unknown>,
	idempotencyKey: string,
): Promise<Deal> {
	return (await apiClient.post<Deal>("deals", body, { idempotencyKey })).data;
}

export type TransitionResult = {
	id: string;
	version: number;
	stage_id: string;
	replayed?: boolean;
};

/** POST /v1/deals/{id}/transitions; command_id doubles as the Idempotency-Key. */
export async function transitionDeal(
	id: string,
	body: Record<string, unknown>,
): Promise<TransitionResult> {
	return (
		await apiClient.post<TransitionResult>(`deals/${id}/transitions`, body)
	).data;
}
