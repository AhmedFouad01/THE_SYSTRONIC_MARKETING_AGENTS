import { apiClient } from "../../api/index.ts";
import type { FetchPage } from "../../ui/data-grid/index.ts";
import type {
	Assignee,
	Contact,
	Duplicate,
	JourneyEvent,
	MergePreview,
} from "./model.ts";

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

export async function fetchContact(id: string): Promise<Contact> {
	return (await apiClient.get<Contact>(`contacts/${id}`)).data;
}

/** PATCH /v1/contacts/{id}; body carries command_id (Idempotency-Key) and expected_version. */
export async function patchContact(
	id: string,
	body: Record<string, unknown>,
): Promise<Contact> {
	return (await apiClient.patch<Contact>(`contacts/${id}`, body)).data;
}

export const journeyFetcher =
	(contactId: string): FetchPage<JourneyEvent> =>
	async ({ cursor, signal }) => {
		const r = await apiClient.get<JourneyEvent[]>(
			`contacts/${contactId}/journey`,
			{ query: { cursor: cursor ?? undefined }, signal },
		);
		return { items: r.data, nextCursor: r.nextCursor };
	};

export async function fetchDuplicates(
	id: string,
	signal?: AbortSignal,
): Promise<Duplicate[]> {
	return (
		await apiClient.get<Duplicate[]>(
			`contacts/${id}/duplicates`,
			signal ? { signal } : {},
		)
	).data;
}

export async function previewMerge(
	sourceId: string,
	targetId: string,
): Promise<MergePreview> {
	return (
		await apiClient.post<MergePreview>("contacts/merge-previews", {
			source_id: sourceId,
			target_id: targetId,
		})
	).data;
}

/** POST /v1/contacts/merges; command_id doubles as the Idempotency-Key. */
export async function mergeContacts(
	body: Record<string, unknown>,
	idempotencyKey: string,
): Promise<{ id: string; status: string }> {
	return (
		await apiClient.post<{ id: string; status: string }>(
			"contacts/merges",
			body,
			{ idempotencyKey },
		)
	).data;
}
