import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from "react";
import {
	buildListParams,
	type ListParams,
	paramsKey,
	type ServerNode,
	type ServerQueryInput,
	type ServerSpec,
} from "./serverQuery.ts";

// Server-side list state for a grid (P1A_CONTRACTS S4): search, filters and sort are sent to the API, the keyset
// cursor pages are appended on demand (only as many rows as the current grid page needs), the total comes from
// `total_count` of the first page of a query, and a response that is no longer current is dropped (seq +
// AbortController). While a new query loads, the previous rows stay visible (`refreshing`) instead of flashing empty.

export type ServerTotal = { value: number; exact: boolean };
export type ServerPage<T> = {
	items: readonly T[];
	nextCursor: string | null;
	hasMore: boolean;
	total: ServerTotal | null;
};
export type ServerPageRequest = {
	params: ListParams;
	expand: string | undefined;
	limit: number;
	cursor: string | null;
	includeTotal: boolean;
	signal: AbortSignal;
};
export type FetchServerPage<T> = (req: ServerPageRequest) => Promise<ServerPage<T>>;

export type ServerListState<T> = {
	items: readonly T[];
	nextCursor: string | null;
	total: ServerTotal | null;
	status: "loading" | "ready" | "error";
	/** A new first page is loading while the previous rows are still shown. */
	refreshing: boolean;
	loadingMore: boolean;
	error: unknown;
	moreError: unknown;
	seq: number;
};

export type ServerListAction<T> =
	| { type: "start"; seq: number; more: boolean }
	| { type: "success"; seq: number; page: ServerPage<T>; more: boolean; getId: (item: T) => string }
	| { type: "failure"; seq: number; error: unknown; more: boolean };

export const initialServerState = <T>(): ServerListState<T> => ({
	items: [],
	nextCursor: null,
	total: null,
	status: "loading",
	refreshing: false,
	loadingMore: false,
	error: null,
	moreError: null,
	seq: 0,
});

function dedupe<T>(existing: readonly T[], incoming: readonly T[], getId: (item: T) => string): T[] {
	const seen = new Set(existing.map(getId));
	const fresh: T[] = [];
	for (const item of incoming) {
		const id = getId(item);
		if (!seen.has(id)) {
			seen.add(id);
			fresh.push(item);
		}
	}
	return [...existing, ...fresh];
}

export function serverListReducer<T>(s: ServerListState<T>, a: ServerListAction<T>): ServerListState<T> {
	switch (a.type) {
		case "start":
			if (a.more) return { ...s, loadingMore: true, moreError: null, seq: a.seq };
			// New first page: keep the rows of the previous query on screen until the new ones arrive.
			return s.status === "ready"
				? { ...s, refreshing: true, loadingMore: false, moreError: null, seq: a.seq }
				: { ...initialServerState<T>(), seq: a.seq };
		case "success": {
			if (a.seq !== s.seq) return s;
			if (a.more)
				return {
					...s,
					items: dedupe(s.items, a.page.items, a.getId),
					nextCursor: a.page.nextCursor,
					loadingMore: false,
				};
			return {
				...s,
				items: dedupe([], a.page.items, a.getId),
				nextCursor: a.page.nextCursor,
				total: a.page.total,
				status: "ready",
				refreshing: false,
				loadingMore: false,
				error: null,
			};
		}
		case "failure":
			if (a.seq !== s.seq) return s;
			return a.more
				? { ...s, loadingMore: false, moreError: a.error }
				: { ...initialServerState<T>(), seq: s.seq, status: "error", error: a.error };
	}
}

/** Rows to fetch per request: at least 25, at most the server cap of 200. */
export const pageLimit = (pageSize: number): number => Math.min(200, Math.max(25, Math.floor(pageSize) || 25));

/** What DataGrid needs to run in server mode. */
export type ServerBinding = {
	total: ServerTotal | null;
	hasMore: boolean;
	/** A new query is loading; the rows shown still belong to the previous one. */
	refreshing: boolean;
	loadingMore: boolean;
	moreFailed: boolean;
	/** Debounced search text, filters and sort changed. */
	onQueryChange: (q: ServerQueryInput) => void;
	/** The current grid page needs rows up to this index (exclusive). */
	onNeedRows: (count: number, pageSize: number) => void;
	onRetryMore: () => void;
};

export type ServerListOptions<T> = {
	fetchPage: FetchServerPage<T>;
	getId: (item: T) => string;
	spec: ServerSpec;
	/** Grid view the list starts with (the grid is mounted with the same one). */
	initial: ServerQueryInput;
	initialPageSize?: number;
	/** Conditions the screen adds itself (built-in tabs). */
	extra?: readonly ServerNode[];
	/** Legacy `?due=` task window. */
	due?: string;
	expand?: string;
	/** Change to reset and reload (tenant). */
	resetKey?: string;
	/** Hold the first request until the screen can express its query (e.g. stage ids resolved). Default true. */
	enabled?: boolean;
};

export type ServerList<T> = {
	items: readonly T[];
	status: ServerListState<T>["status"];
	error: unknown;
	total: ServerTotal | null;
	hasMore: boolean;
	refreshing: boolean;
	reload: () => void;
	/** The params of the current query (tests, copy). */
	params: ListParams;
	server: ServerBinding;
};

export function useServerList<T>(opts: ServerListOptions<T>): ServerList<T> {
	const enabled = opts.enabled ?? true;
	const [view, setView] = useState<ServerQueryInput>(opts.initial);
	const [need, setNeed] = useState(0);
	const [reloadTick, setReloadTick] = useState(0);
	const [state, dispatch] = useReducer(serverListReducer<T>, undefined, initialServerState<T>);
	const specRef = useRef(opts.spec);
	const fetchRef = useRef(opts.fetchPage);
	const getIdRef = useRef(opts.getId);
	const pageSizeRef = useRef(opts.initialPageSize ?? 10);
	const stateRef = useRef(state);
	const seqRef = useRef(0);
	const abortRef = useRef<AbortController | null>(null);
	const paramsRef = useRef<ListParams>({ sort: "" });
	useLayoutEffect(() => {
		specRef.current = opts.spec;
		fetchRef.current = opts.fetchPage;
		getIdRef.current = opts.getId;
		stateRef.current = state;
	});

	const params = buildListParams(opts.spec, view, opts.extra ?? [], opts.due);
	paramsRef.current = params;
	const key = `${opts.resetKey ?? ""}|${paramsKey(params, opts.expand)}`;
	const expandRef = useRef(opts.expand);
	expandRef.current = opts.expand;

	const run = useCallback((cursor: string | null, more: boolean) => {
		abortRef.current?.abort();
		const ctrl = new AbortController();
		abortRef.current = ctrl;
		seqRef.current += 1;
		const seq = seqRef.current;
		dispatch({ type: "start", seq, more });
		fetchRef
			.current({
				params: paramsRef.current,
				expand: expandRef.current,
				limit: pageLimit(pageSizeRef.current),
				cursor,
				includeTotal: !more,
				signal: ctrl.signal,
			})
			.then((page) => dispatch({ type: "success", seq, page, more, getId: getIdRef.current }))
			.catch((error: unknown) => {
				if (ctrl.signal.aborted) return; // superseded: its seq is stale anyway
				dispatch({ type: "failure", seq, error, more });
			});
	}, []);

	// First page of every distinct query (and of every reload / tenant change).
	// biome-ignore lint/correctness/useExhaustiveDependencies: key is the identity of the query; reloadTick re-runs it
	useEffect(() => {
		if (!enabled) return;
		run(null, false);
		return () => {
			seqRef.current += 1; // drop any in-flight response
			abortRef.current?.abort();
		};
	}, [key, reloadTick, enabled, run]);

	// Append cursor pages only while the current grid page still needs rows. A failed append stops until retried.
	useEffect(() => {
		if (
			state.status === "ready" &&
			!state.refreshing &&
			!state.loadingMore &&
			state.moreError === null &&
			state.nextCursor !== null &&
			state.items.length < need
		)
			run(state.nextCursor, true);
	}, [state, need, run]);

	const onQueryChange = useCallback((q: ServerQueryInput) => setView(q), []);
	const onNeedRows = useCallback((count: number, pageSize: number) => {
		pageSizeRef.current = pageSize;
		setNeed(count);
	}, []);
	const onRetryMore = useCallback(() => {
		const s = stateRef.current;
		if (s.status === "ready" && !s.loadingMore && s.nextCursor !== null) run(s.nextCursor, true);
	}, [run]);
	const reload = useCallback(() => setReloadTick((n) => n + 1), []);

	const server = useMemo<ServerBinding>(
		() => ({
			total: state.total,
			hasMore: state.nextCursor !== null,
			refreshing: state.refreshing,
			loadingMore: state.loadingMore,
			moreFailed: state.moreError !== null,
			onQueryChange,
			onNeedRows,
			onRetryMore,
		}),
		[state, onQueryChange, onNeedRows, onRetryMore],
	);

	return {
		items: state.items,
		status: state.status,
		error: state.error,
		total: state.total,
		hasMore: state.nextCursor !== null,
		refreshing: state.refreshing,
		reload,
		params,
		server,
	};
}
