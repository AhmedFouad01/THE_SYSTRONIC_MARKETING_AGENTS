import { apiClient, type ListTotal } from "../api/index.ts";
import {
	andNodes,
	cond,
	type FetchServerPage,
	type ServerNode,
} from "../ui/data-grid/index.ts";

export type ListPath = "contacts" | "leads" | "deals" | "tasks";

/** GET /v1/{path}?q&filter&sort&limit&cursor&include_total&expand (P1A_CONTRACTS S4). */
export const listFetcher =
	<T>(path: ListPath): FetchServerPage<T> =>
	async ({ params, expand, props, limit, cursor, includeTotal, signal }) => {
		const r = await apiClient.get<T[]>(path, {
			query: {
				q: params.q,
				filter: params.filter,
				sort: params.sort,
				due: params.due,
				limit,
				cursor: cursor ?? undefined,
				include_total: includeTotal ? 1 : undefined,
				expand,
				props,
			},
			signal,
		});
		return {
			items: r.data,
			nextCursor: r.nextCursor,
			hasMore: r.hasMore ?? r.nextCursor !== null,
			total: r.total,
		};
	};

/** Exact server count (capped at 10,000: `exact:false`) of the rows matching `nodes`, without loading them. */
export async function countRecords(
	path: ListPath,
	nodes: readonly ServerNode[],
	signal?: AbortSignal,
	due?: string,
): Promise<ListTotal> {
	const root = andNodes(nodes);
	const r = await apiClient.get<unknown[]>(path, {
		query: {
			sort: "-created_at",
			limit: 1,
			include_total: 1,
			filter: root === null ? undefined : JSON.stringify(root),
			due,
		},
		...(signal ? { signal } : {}),
	});
	return r.total ?? { value: r.data.length, exact: !(r.hasMore ?? false) };
}

/** Rows by id (`id in [...]`, at most 80 ids per request: the filter is capped at 4096 bytes): names for related records that `expand` does not cover. */
export async function fetchByIds<T>(
	path: ListPath,
	ids: readonly string[],
	signal?: AbortSignal,
): Promise<T[]> {
	if (ids.length === 0) return [];
	const out: T[] = [];
	for (let i = 0; i < ids.length; i += 80) {
		const chunk = ids.slice(i, i + 80);
		const r = await apiClient.get<T[]>(path, {
			query: {
				sort: "-created_at",
				limit: Math.min(200, chunk.length),
				filter: JSON.stringify(cond("id", "in", chunk)),
			},
			...(signal ? { signal } : {}),
		});
		out.push(...r.data);
	}
	return out;
}

/** One row with its embedded names (a created record has none until listed): used right after a create. */
export async function fetchExpanded<T>(
	path: ListPath,
	id: string,
	expand: string,
	signal?: AbortSignal,
): Promise<T | null> {
	const r = await apiClient.get<T[]>(path, {
		query: { sort: "-created_at", limit: 1, filter: JSON.stringify(cond("id", "eq", id)), expand },
		...(signal ? { signal } : {}),
	});
	return r.data[0] ?? null;
}
