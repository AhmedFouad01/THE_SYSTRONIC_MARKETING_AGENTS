import { DEFAULT_VIEW, type Density, type FilterSpec, type FilterValue, PAGE_SIZES, type SortSpec, type ViewState } from "./gridModel.ts";

// Saved views are client-side only (decision D3): localStorage keyed by tenant + actor + grid. Best-effort:
// storage may be missing, full or throw; nothing here may throw. No credentials are stored (only view settings).
export const VIEWS_KEY_PREFIX = "sy.views.v1";
export const MAX_VIEWS = 20;
export const MAX_NAME = 60;

export type SavedView = { id: string; name: string; state: ViewState };
export type StorageLike = Pick<Storage, "getItem" | "setItem">;
export type SaveResult =
	| { ok: true; view: SavedView }
	| { ok: false; reason: "name" | "limit" | "storage" };

export type SavedViewsStore = {
	readonly key: string;
	list(): SavedView[];
	save(name: string, state: ViewState, id?: string): SaveResult;
	remove(id: string): boolean;
};

export function safeLocalStorage(): StorageLike | null {
	try {
		return window.localStorage;
	} catch {
		return null;
	}
}

export function viewsKey(tenantId: string, actor: string, gridId: string): string {
	return `${VIEWS_KEY_PREFIX}:${encodeURIComponent(tenantId)}:${encodeURIComponent(actor)}:${encodeURIComponent(gridId)}`;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isFilterValue = (v: unknown): v is FilterValue => ["string", "number", "boolean"].includes(typeof v);

function sanitizeFilter(raw: unknown): FilterSpec | null {
	if (!isRecord(raw) || typeof raw.key !== "string") return null;
	if (raw.op === "eq" && isFilterValue(raw.value)) return { key: raw.key, op: "eq", value: raw.value };
	if (raw.op === "in" && Array.isArray(raw.values) && raw.values.every(isFilterValue))
		return { key: raw.key, op: "in", values: raw.values };
	if ((raw.op === "gte" || raw.op === "lte") && typeof raw.value === "number" && Number.isFinite(raw.value))
		return { key: raw.key, op: raw.op, value: raw.value };
	return null;
}

/** Field-wise validation: a damaged field falls back to its default instead of discarding the whole view. */
export function sanitizeViewState(raw: unknown): ViewState {
	const r = isRecord(raw) ? raw : {};
	const sorts: SortSpec[] = Array.isArray(r.sorts)
		? r.sorts.flatMap((s: unknown) =>
				isRecord(s) && typeof s.key === "string" && (s.dir === "asc" || s.dir === "desc")
					? [{ key: s.key, dir: s.dir }]
					: [],
			)
		: [];
	const density: Density = r.density === "compact" ? "compact" : "comfortable";
	const pageSize = PAGE_SIZES.find((p) => p === r.pageSize) ?? DEFAULT_VIEW.pageSize;
	return {
		query: typeof r.query === "string" ? r.query.slice(0, 200) : "",
		filters: Array.isArray(r.filters) ? r.filters.flatMap((f: unknown) => sanitizeFilter(f) ?? []) : [],
		sorts,
		hidden: Array.isArray(r.hidden) ? r.hidden.filter((h: unknown): h is string => typeof h === "string") : [],
		density,
		pageSize,
	};
}

export function parseViews(raw: string | null): SavedView[] {
	if (!raw) return [];
	try {
		const data: unknown = JSON.parse(raw);
		if (!Array.isArray(data)) return [];
		const seen = new Set<string>();
		const out: SavedView[] = [];
		for (const v of data) {
			if (!isRecord(v) || typeof v.id !== "string" || typeof v.name !== "string" || !v.name.trim() || seen.has(v.id))
				continue;
			seen.add(v.id);
			out.push({ id: v.id, name: v.name.slice(0, MAX_NAME), state: sanitizeViewState(v.state) });
			if (out.length >= MAX_VIEWS) break;
		}
		return out;
	} catch {
		return [];
	}
}

export type SavedViewsDeps = {
	storage: StorageLike | null;
	tenantId: string;
	actor: string;
	gridId: string;
	newId?: () => string;
};

export function createSavedViewsStore(deps: SavedViewsDeps): SavedViewsStore {
	const key = viewsKey(deps.tenantId, deps.actor, deps.gridId);
	const newId = deps.newId ?? (() => `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`);

	const read = (): SavedView[] => {
		try {
			return parseViews(deps.storage?.getItem(key) ?? null);
		} catch {
			return [];
		}
	};
	const write = (views: SavedView[]): boolean => {
		if (!deps.storage) return false;
		try {
			deps.storage.setItem(key, JSON.stringify(views));
			return true;
		} catch {
			return false;
		}
	};

	return {
		key,
		list: read,
		save(name, state, id) {
			const clean = name.trim().slice(0, MAX_NAME);
			if (!clean) return { ok: false, reason: "name" };
			const views = read();
			const existing = id ? views.findIndex((v) => v.id === id) : -1;
			const view: SavedView = { id: existing >= 0 && id ? id : newId(), name: clean, state: sanitizeViewState(state) };
			if (existing < 0 && views.length >= MAX_VIEWS) return { ok: false, reason: "limit" };
			const next = existing >= 0 ? views.map((v, i) => (i === existing ? view : v)) : [...views, view];
			return write(next) ? { ok: true, view } : { ok: false, reason: "storage" };
		},
		remove(id) {
			const views = read();
			const next = views.filter((v) => v.id !== id);
			return next.length !== views.length && write(next);
		},
	};
}
