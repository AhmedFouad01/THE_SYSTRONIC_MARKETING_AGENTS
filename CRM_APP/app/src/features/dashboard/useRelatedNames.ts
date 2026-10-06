import { useEffect, useRef, useState } from "react";
import { fetchContactRef, fetchDealRef } from "../tasks/api.ts";
import type { Task } from "../tasks/model.ts";

export type RelatedKind = "deal" | "contact";
export type Related = { kind: RelatedKind; id: string };

/** The record a follow-up points at: its deal first, else its contact; null when it has neither. */
export function relatedOf(task: Pick<Task, "deal_id" | "contact_id">): Related | null {
	if (task.deal_id) return { kind: "deal", id: task.deal_id };
	if (task.contact_id) return { kind: "contact", id: task.contact_id };
	return null;
}

export const relatedKey = (r: Related): string => `${r.kind}:${r.id}`;

/**
 * Names for the (few) records the follow-ups list points at, resolved BY ID (GET /v1/deals|contacts/{id}) so a
 * record that is not on page 1 of its list is still named (UX-R3-01). `known` holds names already loaded from
 * page 1; only the rest is fetched. A record that cannot be read maps to null: the row then shows no caption
 * (never an "Unknown record" label). `scope` (tenant) resets the cache.
 */
export function useRelatedNames(
	rows: readonly Pick<Task, "deal_id" | "contact_id">[],
	known: ReadonlyMap<string, string>,
	ready: boolean,
	scope: string,
): ReadonlyMap<string, string | null> {
	const [fetched, setFetched] = useState<{ scope: string; names: ReadonlyMap<string, string | null> }>({
		scope,
		names: new Map(),
	});
	const asked = useRef(new Set<string>());
	const wanted = rows.flatMap((r) => {
		const rel = relatedOf(r);
		return rel === null || known.has(relatedKey(rel)) ? [] : [rel];
	});
	const signature = wanted.map(relatedKey).join("|");

	// biome-ignore lint/correctness/useExhaustiveDependencies: `signature` is the stable identity of `wanted`
	useEffect(() => {
		if (!ready) return;
		const ctrl = new AbortController();
		const todo = wanted.filter((r) => !asked.current.has(`${scope}/${relatedKey(r)}`));
		for (const rel of todo) {
			const slot = `${scope}/${relatedKey(rel)}`;
			asked.current.add(slot);
			const load =
				rel.kind === "deal"
					? fetchDealRef(rel.id, ctrl.signal).then((d) => d.title)
					: fetchContactRef(rel.id, ctrl.signal).then((c) => c.display_name);
			load
				.then((name) => name || null)
				.catch(() => {
					if (ctrl.signal.aborted) {
						asked.current.delete(slot);
						return undefined;
					}
					return null;
				})
				.then((name) => {
					if (name === undefined) return;
					setFetched((cur) => {
						const base = cur.scope === scope ? cur.names : new Map<string, string | null>();
						return { scope, names: new Map(base).set(relatedKey(rel), name) };
					});
				});
		}
		return () => ctrl.abort();
	}, [signature, ready, scope]);

	return fetched.scope === scope ? fetched.names : new Map();
}
