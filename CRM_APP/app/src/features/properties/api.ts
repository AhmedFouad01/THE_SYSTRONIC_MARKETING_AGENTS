// Schema API (P1B_CONTRACTS B2). Every write carries command_id in the body; the client sends it as Idempotency-Key.
import { apiClient } from "../../api/index.ts";
import type { ObjectKey, ObjectSchema } from "./model.ts";

const base = (o: ObjectKey) => `schema/${o}`;

/** GET /v1/schema/{object}?include_archived=1: one snapshot (archived flagged), so "show archived" is a client filter. */
export async function fetchSchema(object: ObjectKey, signal?: AbortSignal): Promise<ObjectSchema> {
	const r = await apiClient.get<ObjectSchema>(base(object), {
		query: { include_archived: 1 },
		...(signal ? { signal } : {}),
	});
	return r.data;
}

/** GET /v1/schema: only used to learn whether the caller has schema.read (403 = no). */
export async function probeSchemaRead(signal?: AbortSignal): Promise<void> {
	await apiClient.get("schema", signal ? { signal } : {});
}

const send = async (path: string, body: Record<string, unknown>, method: "POST" | "PATCH" = "POST") => {
	const key = String(body.command_id);
	if (method === "PATCH") await apiClient.patch(path, body, { idempotencyKey: key });
	else await apiClient.post(path, body, { idempotencyKey: key });
};

export const createProperty = (o: ObjectKey, body: Record<string, unknown>) => send(`${base(o)}/properties`, body);
export const patchProperty = (o: ObjectKey, key: string, body: Record<string, unknown>) =>
	send(`${base(o)}/properties/${key}`, body, "PATCH");
export const archiveProperty = (o: ObjectKey, key: string, body: Record<string, unknown>) =>
	send(`${base(o)}/properties/${key}/archive`, body);
export const orderProperties = (o: ObjectKey, body: Record<string, unknown>) =>
	send(`${base(o)}/properties/order`, body);

export const createOption = (o: ObjectKey, key: string, body: Record<string, unknown>) =>
	send(`${base(o)}/properties/${key}/options`, body);
export const patchOption = (o: ObjectKey, key: string, value: string, body: Record<string, unknown>) =>
	send(`${base(o)}/properties/${key}/options/${value}`, body, "PATCH");
export const orderOptions = (o: ObjectKey, key: string, body: Record<string, unknown>) =>
	send(`${base(o)}/properties/${key}/options/order`, body);

export const createGroup = (o: ObjectKey, body: Record<string, unknown>) => send(`${base(o)}/groups`, body);
export const patchGroup = (o: ObjectKey, key: string, body: Record<string, unknown>) =>
	send(`${base(o)}/groups/${key}`, body, "PATCH");
export const archiveGroup = (o: ObjectKey, key: string, body: Record<string, unknown>) =>
	send(`${base(o)}/groups/${key}/archive`, body);
export const orderGroups = (o: ObjectKey, body: Record<string, unknown>) => send(`${base(o)}/groups/order`, body);
