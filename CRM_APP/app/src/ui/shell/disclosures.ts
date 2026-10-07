import type { RoutePath } from "../../router.ts";
import { navigationTrail, type NavNode } from "./navigation.ts";

export type Disclosures = Record<string, boolean>;

/** Grant context is also isolated; IDs are metadata, credentials are never persisted here. */
export function disclosureStorageKey(actor: string, tenant: string, grant = ""): string {
	return `sy.nav.${JSON.stringify([actor, tenant, grant])}`;
}

export function defaultDisclosures(nodes: readonly NavNode[]): Disclosures {
	const state: Disclosures = {};
	for (const node of nodes) {
		if (node.children?.length) {
			state[node.key] = node.kind === "group" && node.expanded === true;
			Object.assign(state, defaultDisclosures(node.children));
		}
	}
	return state;
}

export function expandActiveBranch(state: Disclosures, nodes: readonly NavNode[], route: RoutePath | null): Disclosures {
	const keys = navigationTrail(nodes, route).slice(0, -1).map((node) => node.key);
	if (keys.every((key) => state[key] === true)) return state;
	const next = { ...state };
	for (const key of keys) next[key] = true;
	return next;
}

export function restoreDisclosures(raw: string | null, nodes: readonly NavNode[], route: RoutePath | null): Disclosures {
	const state = defaultDisclosures(nodes);
	try {
		const saved: unknown = JSON.parse(raw ?? "null");
		if (saved !== null && typeof saved === "object" && !Array.isArray(saved)) {
			for (const key of Object.keys(state)) {
				const value = (saved as Record<string, unknown>)[key];
				if (typeof value === "boolean") state[key] = value;
			}
		}
	} catch {
		// Corrupt preferences fall back to defaults.
	}
	return expandActiveBranch(state, nodes, route);
}
