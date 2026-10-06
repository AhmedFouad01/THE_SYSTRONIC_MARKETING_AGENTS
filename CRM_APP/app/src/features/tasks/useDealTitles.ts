import { useEffect, useMemo, useRef, useState } from "react";
import { fetchByIds } from "../listApi.ts";

/**
 * Titles of the deals the loaded task rows point at (`expand` covers contact and owner only): one `id in [...]`
 * request per new set of ids, cached per scope (tenant). A deal that cannot be read is simply absent from the map.
 */
export function useDealTitles(dealIds: readonly (string | null)[], scope: string): ReadonlyMap<string, string> {
	const [titles, setTitles] = useState<{ scope: string; map: ReadonlyMap<string, string> }>({
		scope,
		map: new Map(),
	});
	const asked = useRef(new Set<string>());
	const wanted = useMemo(
		() => [...new Set(dealIds.filter((id): id is string => id !== null))].sort(),
		[dealIds],
	);
	const signature = wanted.join("|");
	// biome-ignore lint/correctness/useExhaustiveDependencies: signature is the identity of `wanted`
	useEffect(() => {
		const todo = wanted.filter((id) => !asked.current.has(`${scope}/${id}`));
		if (todo.length === 0) return;
		const ctrl = new AbortController();
		for (const id of todo) asked.current.add(`${scope}/${id}`);
		fetchByIds<{ id: string; title: string }>("deals", todo, ctrl.signal)
			.then((rows) =>
				setTitles((cur) => {
					const base = cur.scope === scope ? cur.map : new Map<string, string>();
					return { scope, map: new Map([...base, ...rows.map((r) => [r.id, r.title] as const)]) };
				}),
			)
			.catch(() => {
				for (const id of todo) asked.current.delete(`${scope}/${id}`); // retry on the next change
			});
		return () => ctrl.abort();
	}, [signature, scope]);
	return titles.scope === scope ? titles.map : new Map();
}
