// Pure tasks view-model helpers (no DOM, no React). Field names follow M1_CONTRACTS (tasks).
import { isApiError } from "../../api/errors.ts";
import { cond, type ServerNode } from "../../ui/data-grid/serverQuery.ts";
import { carryExpand, contactNameOf, type Expanded, ownerNameOf } from "../expand.ts";
import {
	type BulkFailureKind,
	type BulkItem,
	type BulkOutcome,
	type BulkSummary,
	summarizeBulk,
} from "../leads/model.ts";

export type TaskStatus = "open" | "completed";

export type Task = {
	id: string;
	contact_id: string | null;
	deal_id: string | null;
	owner_id: string;
	title: string;
	/** NOT NULL in the DB today; kept nullable so a future "no date" task renders instead of crashing. */
	due_at: string | null;
	status: TaskStatus;
	outcome: string | null;
	version: number;
	completed_at: string | null;
	/** Not exposed by the API yet (gap): honoured when present so automation badges light up without a UI change. */
	source?: string | null;
	automation_run_id?: string | null;
} & Expanded;

export type TaskSource = "manual" | "automation" | "unknown";

/** The API does not mark automation-generated tasks; only an explicit marker is trusted, never a default. */
export function taskSource(t: Task): TaskSource {
	if (t.source === "automation" || t.automation_run_id) return "automation";
	if (t.source === "manual") return "manual";
	return "unknown";
}

// ---- due buckets -----------------------------------------------------------------------------------------

export type DueBucket = "overdue" | "today" | "upcoming" | "none" | "done";
export type TaskTab = "open" | DueBucket;
export const TASK_TABS: readonly TaskTab[] = [
	"open",
	"overdue",
	"today",
	"upcoming",
	"none",
	"done",
];

/** Whole LOCAL calendar days from `now` to `due` (0 = same local day, negative = past). DST/timezone-safe. */
export function dayDiff(due: Date, now: Date): number {
	const a = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
	const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
	return Math.round((a - b) / 86_400_000);
}

/** Done = completed; open tasks: past due instant = overdue, later today = today, later days = upcoming. */
export function dueBucket(
	t: Pick<Task, "status" | "due_at">,
	now: Date,
): DueBucket {
	if (t.status === "completed") return "done";
	if (t.due_at === null) return "none";
	const due = new Date(t.due_at);
	if (Number.isNaN(due.getTime())) return "none";
	if (due.getTime() < now.getTime()) return "overdue";
	return dayDiff(due, now) <= 0 ? "today" : "upcoming";
}

/** Legacy server `?due=` window (kept for the Dashboard counters). */
export type DueFilter = "overdue" | "today";

/** Whole local days a past-due task is late (0 = overdue earlier today). */
export function overdueDays(due: Date, now: Date): number {
	return Math.max(0, -dayDiff(due, now));
}

/** Start of the next LOCAL calendar day (the "Today" / "Upcoming" boundary of `dueBucket`). */
export function startOfTomorrow(now: Date): Date {
	return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
}

/**
 * A tab as a server query (nothing is bucketed client-side): `due=overdue` for Overdue (the server's own clock),
 * otherwise conditions on `status`/`due_at`. `anchor` is the instant the tab was opened (stable per query).
 */
export function tabQuery(tab: TaskTab, anchor: Date): { due?: string; nodes: ServerNode[] } {
	const open = cond("status", "eq", "open");
	switch (tab) {
		case "open":
			return { nodes: [open] };
		case "overdue":
			return { due: "overdue", nodes: [] };
		case "today":
			return {
				nodes: [
					open,
					cond("due_at", "gte", anchor.toISOString()),
					cond("due_at", "lt", startOfTomorrow(anchor).toISOString()),
				],
			};
		case "upcoming":
			return { nodes: [open, cond("due_at", "gte", startOfTomorrow(anchor).toISOString())] };
		case "none":
			return { nodes: [open, cond("due_at", "is_null")] };
		case "done":
			return { nodes: [cond("status", "eq", "completed")] };
	}
}

export type TaskRow = Task & {
	bucket: DueBucket;
	ownerName: string;
	relatedKind: "deal" | "contact" | null;
	relatedId: string | null;
	relatedName: string;
	contactName: string;
	sourceKind: TaskSource;
	/** Epoch ms; undated sorts last ascending. */
	dueMs: number;
};

export type RowLabels = { unknown: string; unknownOwner: string };

export function toRows(
	tasks: readonly Task[],
	deals: ReadonlyMap<string, string>,
	owners: ReadonlyMap<string, string>,
	labels: RowLabels,
	now: Date,
): TaskRow[] {
	return tasks.map((t) => {
		const contactName = t.contact_id ? (contactNameOf(t) ?? labels.unknown) : "";
		const relatedKind = t.deal_id ? "deal" : t.contact_id ? "contact" : null;
		const relatedId = t.deal_id ?? t.contact_id;
		const relatedName = t.deal_id
			? (deals.get(t.deal_id) ?? labels.unknown)
			: contactName;
		const due = t.due_at === null ? Number.NaN : Date.parse(t.due_at);
		return {
			...t,
			bucket: dueBucket(t, now),
			ownerName: ownerNameOf(t) ?? owners.get(t.owner_id) ?? labels.unknownOwner,
			relatedKind,
			relatedId,
			relatedName,
			contactName,
			sourceKind: taskSource(t),
			dueMs: Number.isNaN(due) ? Number.MAX_SAFE_INTEGER : due,
		};
	});
}

/** `?select=<id>` target of the related record's screen. */
export function relatedTarget(
	r: Pick<TaskRow, "relatedKind" | "relatedId">,
): { route: "/deals" | "/contacts"; search: string } | null {
	if (r.relatedKind === null || r.relatedId === null) return null;
	return {
		route: r.relatedKind === "deal" ? "/deals" : "/contacts",
		search: `?select=${r.relatedId}`,
	};
}

// ---- datetime-local <-> ISO ------------------------------------------------------------------------------

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO instant -> `YYYY-MM-DDTHH:mm` in the browser's local zone (value of <input type=datetime-local>). */
export function toLocalInput(iso: string | null): string {
	if (iso === null) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Local `YYYY-MM-DDTHH:mm` -> UTC ISO (API requires a UTC ISO timestamp). Null when empty/invalid. */
export function fromLocalInput(v: string): string | null {
	if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return null;
	const d = new Date(v);
	return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// ---- create ----------------------------------------------------------------------------------------------

export type NewTaskInput = {
	title: string;
	due: string;
	ownerId: string;
	contactId: string;
	dealId: string;
};
export const EMPTY_NEW_TASK: NewTaskInput = {
	title: "",
	due: "",
	ownerId: "",
	contactId: "",
	dealId: "",
};
export type NewTaskField = "title" | "due" | "contactId";
export type TaskIssue = "required" | "tooLong" | "date";
export type NewTaskErrors = Partial<Record<NewTaskField, TaskIssue>>;

export function validateNewTask(i: NewTaskInput): NewTaskErrors {
	const e: NewTaskErrors = {};
	if (i.title.trim() === "") e.title = "required";
	else if (i.title.trim().length > 160) e.title = "tooLong";
	if (i.due.trim() === "") e.due = "required";
	else if (fromLocalInput(i.due) === null) e.due = "date";
	// The API requires a contact or a deal.
	if (i.contactId === "" && i.dealId === "") e.contactId = "required";
	return e;
}

/** POST /v1/tasks body. Contact and deal must agree server-side; both are sent when known. */
export function buildCreateBody(
	i: NewTaskInput,
	commandId: string,
): Record<string, unknown> {
	return {
		command_id: commandId,
		title: i.title.trim(),
		due_at: fromLocalInput(i.due),
		...(i.ownerId ? { owner_id: i.ownerId } : {}),
		...(i.contactId ? { contact_id: i.contactId } : {}),
		...(i.dealId ? { deal_id: i.dealId } : {}),
	};
}

export type KeyMemo = { fingerprint: string; key: string };

/** Same payload retried reuses its Idempotency-Key; a changed payload needs a new one. */
export function keyFor(
	prev: KeyMemo | null,
	input: NewTaskInput,
	newKey: () => string,
	extra?: unknown,
): KeyMemo {
	const fingerprint = JSON.stringify([buildCreateBody(input, ""), extra ?? null]);
	return prev !== null && prev.fingerprint === fingerprint
		? prev
		: { fingerprint, key: newKey() };
}

// ---- detail edit -----------------------------------------------------------------------------------------

export type EditDraft = { title: string; due: string; ownerId: string };

export const draftOf = (t: Task): EditDraft => ({
	title: t.title,
	due: toLocalInput(t.due_at),
	ownerId: t.owner_id,
});

export type EditIssue = { title?: "required" | "tooLong"; due?: "date" };

export function validateEdit(d: EditDraft): EditIssue {
	const e: EditIssue = {};
	if (d.title.trim() === "") e.title = "required";
	else if (d.title.trim().length > 160) e.title = "tooLong";
	if (fromLocalInput(d.due) === null) e.due = "date";
	return e;
}

/** PATCH body with only changed fields (title/owner_id/due_at) plus expected_version. Null = no change. */
export function buildPatchBody(
	t: Task,
	d: EditDraft,
	commandId: string,
): Record<string, unknown> | null {
	const changes: Record<string, unknown> = {};
	if (d.title.trim() !== t.title) changes.title = d.title.trim();
	const due = fromLocalInput(d.due);
	if (due !== null && toLocalInput(t.due_at) !== d.due) changes.due_at = due;
	if (d.ownerId !== "" && d.ownerId !== t.owner_id)
		changes.owner_id = d.ownerId;
	if (Object.keys(changes).length === 0) return null;
	return { command_id: commandId, expected_version: t.version, ...changes };
}

/** PATCH body that completes a task. */
export const completeBody = (
	t: Pick<Task, "version">,
	commandId: string,
): Record<string, unknown> => ({
	command_id: commandId,
	expected_version: t.version,
	status: "completed",
});

/** Loaded pages + confirmed writes (newer version wins; overlay-only entries are new tasks, newest first). */
export function mergeLatest(
	items: readonly Task[],
	overlay: ReadonlyMap<string, Task>,
	/** false = list only what the server returned (every tab is a server query; a written task may have left it). */
	includeCreated = true,
): Task[] {
	const seen = new Set<string>();
	const merged = items.map((i) => {
		seen.add(i.id);
		const o = overlay.get(i.id);
		return o !== undefined && o.version > i.version ? carryExpand(o, i) : i;
	});
	if (!includeCreated) return merged;
	const created = [...overlay.values()]
		.filter((o) => !seen.has(o.id))
		.reverse();
	return [...created, ...merged];
}

// ---- bulk complete ---------------------------------------------------------------------------------------

export type BulkCompleteItem = { id: string; version: number; done: boolean };

/**
 * N sequential PATCHes. Already-completed tasks are skipped (no request). A 401 aborts the rest; any other
 * failure (409/403/...) is recorded and the run continues.
 */
export async function runBulkComplete(
	items: readonly BulkCompleteItem[],
	complete: (item: BulkCompleteItem) => Promise<void>,
	onProgress?: (done: number, total: number) => void,
): Promise<{ outcomes: BulkOutcome[]; summary: BulkSummary }> {
	const outcomes: BulkOutcome[] = [];
	for (const item of items) {
		if (item.done) {
			outcomes.push({ id: item.id, result: "skipped" });
		} else {
			try {
				await complete(item);
				outcomes.push({ id: item.id, result: "ok" });
			} catch (e) {
				const kind: BulkFailureKind = isApiError(e) ? e.kind : "unknown";
				outcomes.push({
					id: item.id,
					result: "failed",
					kind,
					code: isApiError(e) ? e.code : "UNKNOWN",
				});
				if (kind === "unauthenticated") {
					onProgress?.(outcomes.length, items.length);
					break;
				}
			}
		}
		onProgress?.(outcomes.length, items.length);
	}
	const asItems: BulkItem[] = items.map((i) => ({
		id: i.id,
		version: i.version,
		ownerId: null,
	}));
	return { outcomes, summary: summarizeBulk(asItems, outcomes) };
}
