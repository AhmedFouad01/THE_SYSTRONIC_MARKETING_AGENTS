import { useCallback, useEffect, useRef, useState } from "react";

export type Load<T> =
	| { status: "loading" }
	| { status: "ready"; data: T }
	| { status: "error"; error: unknown };

/** One independent load per widget group: a failing request never blanks another widget. `key` resets (tenant). */
export function useLoad<T>(
	fetcher: (signal: AbortSignal) => Promise<T>,
	key: string,
): { state: Load<T>; reload: () => void } {
	const [state, setState] = useState<Load<T>>({ status: "loading" });
	const [n, setN] = useState(0);
	const ref = useRef(fetcher);
	ref.current = fetcher;
	// biome-ignore lint/correctness/useExhaustiveDependencies: key and n deliberately re-run the load
	useEffect(() => {
		const ctrl = new AbortController();
		setState({ status: "loading" });
		ref
			.current(ctrl.signal)
			.then((data) => setState({ status: "ready", data }))
			.catch((error: unknown) => {
				if (!ctrl.signal.aborted) setState({ status: "error", error });
			});
		return () => ctrl.abort();
	}, [key, n]);
	return { state, reload: useCallback(() => setN((x) => x + 1), []) };
}
