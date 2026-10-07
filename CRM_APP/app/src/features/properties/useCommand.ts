import { useRef } from "react";
import { type CommandMemo, commandFor } from "./model.ts";

/** command_id per submit: the same payload retried reuses it (idempotent replay), a changed payload gets a fresh one. */
export function useCommand(): (scope: string, body: Record<string, unknown>) => Record<string, unknown> {
	const memo = useRef<CommandMemo | null>(null);
	return (scope, body) => {
		memo.current = commandFor(memo.current, { scope, ...body }, () => crypto.randomUUID());
		return { ...body, command_id: memo.current.commandId };
	};
}
