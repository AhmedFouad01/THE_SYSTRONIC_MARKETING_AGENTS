import { apiClient } from "../../api/index.ts";
import type { FetchPage } from "../../ui/data-grid/index.ts";
import type { DueFilter, Task } from "./model.ts";

export type DealRef = { id: string; title: string };
export type ContactRef = { id: string; display_name: string };
export type Assignee = { id: string; name: string };

/** GET /v1/tasks, optionally narrowed server-side by `?due=overdue|today` (M1_CONTRACTS). */
export const fetchTasksPageFor =
	(due: DueFilter | null): FetchPage<Task> =>
	async ({ cursor, signal }) => {
		const r = await apiClient.get<Task[]>("tasks", {
			query: { cursor: cursor ?? undefined, due: due ?? undefined },
			signal,
		});
		return { items: r.data, nextCursor: r.nextCursor };
	};

export const fetchTasksPage: FetchPage<Task> = fetchTasksPageFor(null);

export const fetchDealRefsPage: FetchPage<DealRef> = async ({
	cursor,
	signal,
}) => {
	const r = await apiClient.get<DealRef[]>("deals", {
		query: { cursor: cursor ?? undefined },
		signal,
	});
	return { items: r.data, nextCursor: r.nextCursor };
};

export const fetchContactRefsPage: FetchPage<ContactRef> = async ({
	cursor,
	signal,
}) => {
	const r = await apiClient.get<ContactRef[]>("contacts", {
		query: { cursor: cursor ?? undefined },
		signal,
	});
	return { items: r.data, nextCursor: r.nextCursor };
};

/** GET /v1/contacts/{id}: the one related contact of a task row, whichever page it would be on. */
export async function fetchContactRef(
	id: string,
	signal?: AbortSignal,
): Promise<ContactRef> {
	return (
		await apiClient.get<ContactRef>(`contacts/${id}`, signal ? { signal } : {})
	).data;
}

/** GET /v1/deals/{id}. */
export async function fetchDealRef(
	id: string,
	signal?: AbortSignal,
): Promise<DealRef> {
	return (
		await apiClient.get<DealRef>(`deals/${id}`, signal ? { signal } : {})
	).data;
}

export async function fetchAssignees(
	signal?: AbortSignal,
): Promise<Assignee[]> {
	return (
		await apiClient.get<Assignee[]>("assignees", signal ? { signal } : {})
	).data;
}

export async function fetchTask(id: string): Promise<Task> {
	return (await apiClient.get<Task>(`tasks/${id}`)).data;
}

/** PATCH /v1/tasks/{id}; body carries command_id (Idempotency-Key) and expected_version. */
export async function patchTask(
	id: string,
	body: Record<string, unknown>,
): Promise<Task> {
	return (await apiClient.patch<Task>(`tasks/${id}`, body)).data;
}

export async function createTask(
	body: Record<string, unknown>,
	idempotencyKey: string,
): Promise<Task> {
	return (await apiClient.post<Task>("tasks", body, { idempotencyKey })).data;
}
