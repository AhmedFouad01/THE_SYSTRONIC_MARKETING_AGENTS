// Generic sequential bulk runner shared by Leads / Deals / Tasks bulk actions (no batch endpoint exists:
// one write per selected row). A 401 aborts the rest (session gone); any other failure is recorded and the
// run continues, so the user gets a partial-failure summary instead of an all-or-nothing result.
import { type ApiErrorKind, isApiError } from "../api/errors.ts";
import type { MessageKey } from "../ui/index.ts";

export type BulkRunItem = { id: string; /** Already in the requested state: no request sent. */ skip?: boolean };
export type BulkRunSummary = {
	succeeded: string[];
	skipped: string[];
	failed: Array<{ id: string; kind: ApiErrorKind | "unknown"; code: string }>;
	/** Not attempted because the session ended (401) mid-run. */
	notAttempted: string[];
};

export async function runBulkOps(
	items: readonly BulkRunItem[],
	op: (id: string) => Promise<void>,
	onProgress?: (done: number, total: number) => void,
): Promise<BulkRunSummary> {
	const s: BulkRunSummary = { succeeded: [], skipped: [], failed: [], notAttempted: [] };
	let done = 0;
	for (const [i, item] of items.entries()) {
		if (item.skip) s.skipped.push(item.id);
		else {
			try {
				await op(item.id);
				s.succeeded.push(item.id);
			} catch (e) {
				const kind = isApiError(e) ? e.kind : "unknown";
				s.failed.push({ id: item.id, kind, code: isApiError(e) ? e.code : "UNKNOWN" });
				if (kind === "unauthenticated") {
					s.notAttempted.push(...items.slice(i + 1).map((x) => x.id));
					done += 1;
					onProgress?.(done, items.length);
					break;
				}
			}
		}
		done += 1;
		onProgress?.(done, items.length);
	}
	return s;
}

export type BulkMessageKeys = {
	ok: MessageKey;
	partial: MessageKey;
	failed: MessageKey;
};
export const GENERIC_BULK_KEYS: BulkMessageKeys = {
	ok: "bulk.ok",
	partial: "bulk.partial",
	failed: "bulk.failed",
};
export const TASK_BULK_KEYS: BulkMessageKeys = {
	ok: "bulk.tasksOk",
	partial: "bulk.tasksPartial",
	failed: "bulk.tasksFailed",
};

type Fmt = (n: number) => string;
type Tr = (key: MessageKey, vars?: Record<string, string | number>) => string;

/** One toast text for a finished run; tone `error` for any failure (assertive region, stays until dismissed). */
export function bulkMessage(
	s: BulkRunSummary,
	keys: BulkMessageKeys,
	t: Tr,
	fmt: Fmt,
): { text: string; tone: "success" | "error" } {
	const failed = s.failed.length + s.notAttempted.length;
	const parts: string[] = [];
	if (failed === 0) parts.push(t(keys.ok, { count: fmt(s.succeeded.length) }));
	else if (s.succeeded.length === 0) parts.push(t(keys.failed, { failed: fmt(failed) }));
	else parts.push(t(keys.partial, { ok: fmt(s.succeeded.length), failed: fmt(failed) }));
	if (s.skipped.length > 0) parts.push(t("bulk.skipped", { count: fmt(s.skipped.length) }));
	if (s.notAttempted.length > 0) parts.push(t("bulk.stopped", { count: fmt(s.notAttempted.length) }));
	return { text: parts.join(" "), tone: failed === 0 ? "success" : "error" };
}
