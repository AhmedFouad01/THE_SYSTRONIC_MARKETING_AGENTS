import { useCallback, useEffect, useLayoutEffect, useReducer, useRef } from "react";

// Loads cursor pages for directories and timelines that need no query (the record grids use useServerList: P1A S4). Bounded: at most `maxPages`
// pages are ever loaded; the first `autoPages` load automatically, the rest on demand ("load more").
// While a next_cursor remains the list is a SAMPLE and the UI must say so.

export type Page<T> = { items: readonly T[]; nextCursor: string | null };
export type FetchPage<T> = (req: { cursor: string | null; signal: AbortSignal }) => Promise<Page<T>>;

export type CursorListState<T> = {
	items: readonly T[];
	nextCursor: string | null;
	pages: number;
	status: "loading" | "ready" | "error";
	loadingMore: boolean;
	/** Error of the initial load (status "error"). */
	error: unknown;
	/** Error of a load-more (items kept). */
	moreError: unknown;
	/** Identifies the request whose result is accepted; stale responses are dropped. */
	seq: number;
};

export type CursorListAction<T> =
	| { type: "start"; seq: number; more: boolean }
	| { type: "success"; seq: number; page: Page<T>; more: boolean; getId: (item: T) => string }
	| { type: "failure"; seq: number; error: unknown; more: boolean };

export const initialCursorState = <T>(): CursorListState<T> => ({
	items: [],
	nextCursor: null,
	pages: 0,
	status: "loading",
	loadingMore: false,
	error: null,
	moreError: null,
	seq: 0,
});

/** Append a page, dropping items whose id is already loaded (cursor pages can overlap after concurrent writes). */
export function mergePage<T>(existing: readonly T[], incoming: readonly T[], getId: (item: T) => string): T[] {
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

export function cursorListReducer<T>(s: CursorListState<T>, a: CursorListAction<T>): CursorListState<T> {
	switch (a.type) {
		case "start":
			return a.more
				? { ...s, loadingMore: true, moreError: null, seq: a.seq }
				: { ...initialCursorState<T>(), seq: a.seq };
		case "success": {
			if (a.seq !== s.seq) return s;
			const items = a.more ? mergePage(s.items, a.page.items, a.getId) : mergePage([], a.page.items, a.getId);
			return { ...s, items, nextCursor: a.page.nextCursor, pages: s.pages + 1, status: "ready", loadingMore: false };
		}
		case "failure":
			if (a.seq !== s.seq) return s;
			return a.more
				? { ...s, loadingMore: false, moreError: a.error }
				: { ...s, status: "error", loadingMore: false, error: a.error };
	}
}

export type CursorListOptions<T> = {
	getId: (item: T) => string;
	maxPages?: number;
	autoPages?: number;
	/** Change to reset and reload (e.g. tenant). */
	resetKey?: string;
	/** false = do not load yet (e.g. a picker's directory until its dialog opens). Default true. */
	enabled?: boolean;
};

export type CursorList<T> = {
	items: readonly T[];
	status: CursorListState<T>["status"];
	loadingMore: boolean;
	error: unknown;
	moreError: unknown;
	pages: number;
	maxPages: number;
	/** A next_cursor remains: the loaded items are a sample of the server data. */
	sample: boolean;
	/** The page cap was hit while more data remains (load more is no longer offered). */
	atCap: boolean;
	loadMore: () => void;
	reload: () => void;
};

export function canLoadMore<T>(s: CursorListState<T>, maxPages: number): boolean {
	return s.status === "ready" && !s.loadingMore && s.nextCursor !== null && s.pages < maxPages;
}

export function useCursorList<T>(fetchPage: FetchPage<T>, opts: CursorListOptions<T>): CursorList<T> {
	const maxPages = Math.max(1, opts.maxPages ?? 10);
	const autoPages = Math.min(maxPages, Math.max(1, opts.autoPages ?? 3));
	const [state, dispatch] = useReducer(cursorListReducer<T>, undefined, initialCursorState<T>);
	const fetchRef = useRef(fetchPage);
	const getIdRef = useRef(opts.getId);
	const seqRef = useRef(0);
	const abortRef = useRef<AbortController | null>(null);
	const stateRef = useRef(state);
	useLayoutEffect(() => {
		fetchRef.current = fetchPage;
		getIdRef.current = opts.getId;
		stateRef.current = state;
	});

	const run = useCallback((cursor: string | null, more: boolean) => {
		abortRef.current?.abort();
		const ctrl = new AbortController();
		abortRef.current = ctrl;
		seqRef.current += 1;
		const seq = seqRef.current;
		dispatch({ type: "start", seq, more });
		fetchRef
			.current({ cursor, signal: ctrl.signal })
			.then((page) => dispatch({ type: "success", seq, page, more, getId: getIdRef.current }))
			.catch((error: unknown) => dispatch({ type: "failure", seq, error, more }));
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: resetKey intentionally re-runs the initial load
	useEffect(() => {
		if (opts.enabled === false) return;
		run(null, false);
		return () => {
			seqRef.current += 1; // drop any in-flight response
			abortRef.current?.abort();
		};
	}, [run, opts.resetKey, opts.enabled]);

	// Bounded auto-fetch: keep loading until `autoPages` pages are in or the data ends. A failed load-more stops the loop.
	useEffect(() => {
		if (opts.enabled !== false && canLoadMore(state, autoPages) && state.moreError === null && state.nextCursor !== null) run(state.nextCursor, true);
	}, [state, autoPages, run, opts.enabled]);

	const loadMore = useCallback(() => {
		const s = stateRef.current;
		if (canLoadMore(s, maxPages) && s.nextCursor !== null) run(s.nextCursor, true);
	}, [maxPages, run]);
	const reload = useCallback(() => run(null, false), [run]);

	return {
		items: state.items,
		status: state.status,
		loadingMore: state.loadingMore,
		error: state.error,
		moreError: state.moreError,
		pages: state.pages,
		maxPages,
		sample: state.nextCursor !== null,
		atCap: state.nextCursor !== null && state.pages >= maxPages,
		loadMore,
		reload,
	};
}
