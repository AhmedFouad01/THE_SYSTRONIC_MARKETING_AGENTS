import { useCallback, useEffect, useRef, useState } from "react";
import { isApiError } from "../../api/errors.ts";
import { fetchSchema, probeSchemaRead } from "./api.ts";
import type { ObjectKey, ObjectSchema } from "./model.ts";

export type SchemaState =
	| { status: "loading"; schema: null }
	| { status: "ready"; schema: ObjectSchema }
	| { status: "forbidden"; schema: null }
	| { status: "error"; schema: null };

/** Loads one object's schema (archived included). `reload()` refreshes in place: the old schema stays on screen while it runs. */
export function useSchema(object: ObjectKey): { state: SchemaState; reload: () => Promise<void> } {
	const [state, setState] = useState<SchemaState>({ status: "loading", schema: null });
	const ctrl = useRef<AbortController | null>(null);
	const run = useCallback(
		async (keep: boolean) => {
			ctrl.current?.abort();
			const c = new AbortController();
			ctrl.current = c;
			if (!keep) setState({ status: "loading", schema: null });
			try {
				const schema = await fetchSchema(object, c.signal);
				if (!c.signal.aborted) setState({ status: "ready", schema });
			} catch (e) {
				if (c.signal.aborted) return;
				setState({ status: isApiError(e) && e.kind === "forbidden" ? "forbidden" : "error", schema: null });
			}
		},
		[object],
	);
	useEffect(() => {
		void run(false);
		return () => ctrl.current?.abort();
	}, [run]);
	return { state, reload: () => run(true) };
}

/** true = the caller has schema.read, false = 403, null = unknown yet / not connected / failed (nav stays hidden). */
export function useSchemaRead(actor: string | null): boolean | null {
	const [answer, setAnswer] = useState<{ actor: string; ok: boolean } | null>(null);
	useEffect(() => {
		if (actor === null) return;
		const c = new AbortController();
		probeSchemaRead(c.signal)
			.then(() => setAnswer({ actor, ok: true }))
			.catch((e) => {
				if (isApiError(e) && e.kind === "forbidden") setAnswer({ actor, ok: false });
			});
		return () => c.abort();
	}, [actor]);
	return actor !== null && answer?.actor === actor ? answer.ok : null;
}
