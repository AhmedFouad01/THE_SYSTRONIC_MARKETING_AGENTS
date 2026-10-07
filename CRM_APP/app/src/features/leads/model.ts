// Pure leads view-model helpers (no DOM, no React). Field names follow M1_CONTRACTS (leads + assignees).
import { type ApiErrorKind, isApiError } from "../../api/errors.ts";
import type { CappedCount } from "../capped.ts";
import { carryExpand, contactNameOf, type Expanded, ownerNameOf } from "../expand.ts";
import { cond, NOTHING, type ServerNode } from "../../ui/data-grid/serverQuery.ts";

export type LeadStatus = "open" | "qualified" | "closed";
export const LEAD_STATUSES: readonly LeadStatus[] = [
	"open",
	"qualified",
	"closed",
];

export type Lead = {
	id: string;
	contact_id: string;
	owner_id: string | null;
	title: string;
	source: string;
	source_evidence: string;
	status: LeadStatus;
	version: number;
	received_at: string;
} & Expanded;

export type Assignee = { id: string; name: string };
export type Contact = { id: string; display_name: string };

/** Lead enriched for the grid (names come from the list's `expand=contact,owner`; the assignee directory names owners of confirmed writes). */
export type LeadRow = Lead & { contactName: string; ownerName: string };

export type BuiltInView = "all" | "mine" | "unassigned";
export const BUILT_IN_VIEWS: readonly BuiltInView[] = [
	"all",
	"mine",
	"unassigned",
];

/**
 * Built-in views as server conditions (the grid never filters client-side): "mine" = owned by the session actor,
 * "unassigned" = no owner. With no actor "mine" matches nothing.
 */
export function builtInViewNodes(view: BuiltInView, actor: string | null): ServerNode[] {
	if (view === "all") return [];
	if (view === "mine") return [actor === null ? NOTHING : cond("owner_id", "eq", actor)];
	return [cond("owner_id", "is_null")];
}

export type RowLabels = {
	unassigned: string;
	unknownContact: string;
	/** Shown when the owner id has no display name (never the id). */
	unknownOwner: string;
};

export function toRows(
	leads: readonly Lead[],
	owners: ReadonlyMap<string, string>,
	labels: RowLabels,
): LeadRow[] {
	return leads.map((l) => ({
		...l,
		contactName: contactNameOf(l) ?? labels.unknownContact,
		ownerName: l.owner_id
			? (ownerNameOf(l) ?? owners.get(l.owner_id) ?? labels.unknownOwner)
			: labels.unassigned,
	}));
}

// ---- bulk "Assign to me" ----------------------------------------------------------------------------------

export type BulkItem = { id: string; version: number; ownerId: string | null };
export type BulkFailureKind = ApiErrorKind | "unknown";
export type BulkOutcome =
	| { id: string; result: "ok" }
	| { id: string; result: "skipped" }
	| { id: string; result: "failed"; kind: BulkFailureKind; code: string };
export type BulkSummary = {
	total: number;
	succeeded: string[];
	/** Already owned by the actor: no request sent. */
	skipped: string[];
	failed: Array<{ id: string; kind: BulkFailureKind; code: string }>;
	/** Not attempted because the session ended (401) mid-run. */
	notAttempted: string[];
	tone: "success" | "warning" | "error";
};

export function summarizeBulk(
	items: readonly BulkItem[],
	outcomes: readonly BulkOutcome[],
): BulkSummary {
	const succeeded = outcomes.filter((o) => o.result === "ok").map((o) => o.id);
	const skipped = outcomes
		.filter((o) => o.result === "skipped")
		.map((o) => o.id);
	const failed = outcomes.flatMap((o) =>
		o.result === "failed" ? [{ id: o.id, kind: o.kind, code: o.code }] : [],
	);
	const seen = new Set(outcomes.map((o) => o.id));
	const notAttempted = items.filter((i) => !seen.has(i.id)).map((i) => i.id);
	const bad = failed.length + notAttempted.length;
	const tone =
		bad === 0
			? "success"
			: succeeded.length + skipped.length === 0
				? "error"
				: "warning";
	return {
		total: items.length,
		succeeded,
		skipped,
		failed,
		notAttempted,
		tone,
	};
}

/**
 * N sequential PATCHes (no batch endpoint). Leads already owned by the actor are skipped. A 401 aborts the rest
 * (session gone); any other failure is recorded and the run continues (partial-failure summary).
 */
export async function runBulkAssign(
	items: readonly BulkItem[],
	actor: string,
	assign: (item: BulkItem) => Promise<void>,
	onProgress?: (done: number, total: number) => void,
): Promise<{ outcomes: BulkOutcome[]; summary: BulkSummary }> {
	const outcomes: BulkOutcome[] = [];
	for (const item of items) {
		if (item.ownerId === actor) {
			outcomes.push({ id: item.id, result: "skipped" });
		} else {
			try {
				await assign(item);
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
	return { outcomes, summary: summarizeBulk(items, outcomes) };
}

// ---- new lead form ----------------------------------------------------------------------------------------

export type NewLeadInput = {
	title: string;
	contactName: string;
	phone: string;
	email: string;
	evidence: string;
	ownerId: string;
};
export type NewLeadField =
	| "title"
	| "contactName"
	| "phone"
	| "email"
	| "evidence";
export type FieldIssue = "required" | "tooLong" | "phone" | "email";
export type NewLeadErrors = Partial<Record<NewLeadField, FieldIssue>>;

export const EMPTY_NEW_LEAD: NewLeadInput = {
	title: "",
	contactName: "",
	phone: "",
	email: "",
	evidence: "",
	ownerId: "",
};
const MAX = { title: 160, contactName: 160, evidence: 500 } as const;
const E164 = /^\+[1-9]\d{6,14}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateNewLead(i: NewLeadInput): NewLeadErrors {
	const e: NewLeadErrors = {};
	const need = (field: "title" | "contactName" | "evidence", value: string) => {
		if (value.trim() === "") e[field] = "required";
		else if (value.trim().length > MAX[field]) e[field] = "tooLong";
	};
	need("title", i.title);
	need("contactName", i.contactName);
	need("evidence", i.evidence);
	if (i.phone.trim() !== "" && !E164.test(i.phone.trim())) e.phone = "phone";
	if (i.email.trim() !== "" && !EMAIL.test(i.email.trim())) e.email = "email";
	return e;
}

/** POST /v1/leads body with inline contact. command_id doubles as the Idempotency-Key (client default). */
export function buildCreateBody(
	i: NewLeadInput,
	commandId: string,
): Record<string, unknown> {
	const identifiers: Array<{
		kind: "phone" | "email";
		value: string;
		provenance: string;
	}> = [];
	if (i.phone.trim() !== "")
		identifiers.push({
			kind: "phone",
			value: i.phone.trim(),
			provenance: "manual_entry",
		});
	if (i.email.trim() !== "")
		identifiers.push({
			kind: "email",
			value: i.email.trim(),
			provenance: "manual_entry",
		});
	return {
		command_id: commandId,
		title: i.title.trim(),
		source_evidence: i.evidence.trim(),
		...(i.ownerId ? { owner_id: i.ownerId } : {}),
		contact: {
			display_name: i.contactName.trim(),
			...(identifiers.length > 0 ? { identifiers } : {}),
		},
	};
}

export type KeyMemo = { fingerprint: string; key: string };

/**
 * A retry of the SAME payload must reuse its key (the server replays); a changed payload needs a new key
 * (a changed body under a used key is 409 IDEMPOTENCY_CONFLICT).
 */
export function keyFor(
	prev: KeyMemo | null,
	input: NewLeadInput,
	newKey: () => string,
	extra?: unknown,
): KeyMemo {
	const fingerprint = JSON.stringify([buildCreateBody(input, ""), extra ?? null]);
	return prev !== null && prev.fingerprint === fingerprint
		? prev
		: { fingerprint, key: newKey() };
}

export type CreateErrorKind =
	| "validation"
	| "assignment"
	| "conflict"
	| "forbidden"
	| "network"
	| "other";

/** Server error -> form-level message class. The API returns no per-field detail (VALIDATION_FAILED only). */
export function classifyCreateError(e: unknown): CreateErrorKind {
	if (!isApiError(e)) return "other";
	if (e.kind === "forbidden")
		return e.code === "ASSIGNMENT_DENIED" ? "assignment" : "forbidden";
	if (e.kind === "network") return "network";
	if (e.kind === "conflict" || e.kind === "version_conflict") return "conflict";
	if (e.status === 422) return "validation";
	return "other";
}

// ---- detail edit ------------------------------------------------------------------------------------------

export type EditDraft = { title: string; status: LeadStatus; ownerId: string };

export const draftOf = (l: Lead): EditDraft => ({
	title: l.title,
	status: l.status,
	ownerId: l.owner_id ?? "",
});

/** PATCH body with only the changed allowed fields (title/owner_id/status) plus expected_version. Null = no change. */
export function buildPatchBody(
	l: Lead,
	d: EditDraft,
	commandId: string,
): Record<string, unknown> | null {
	const changes: Record<string, unknown> = {};
	if (d.title.trim() !== l.title) changes.title = d.title.trim();
	if (d.status !== l.status) changes.status = d.status;
	if (d.ownerId !== "" && d.ownerId !== l.owner_id)
		changes.owner_id = d.ownerId;
	if (Object.keys(changes).length === 0) return null;
	return { command_id: commandId, expected_version: l.version, ...changes };
}

/**
 * Loaded pages + locally confirmed writes: a newer version wins (keeping the embedded names it cannot carry);
 * overlay-only entries are new leads (shown first, newest first) until the next reload brings them in server order.
 */
export function mergeLatest(
	items: readonly Lead[],
	overlay: ReadonlyMap<string, Lead>,
): Lead[] {
	const seen = new Set<string>();
	const merged = items.map((i) => {
		seen.add(i.id);
		const o = overlay.get(i.id);
		return o !== undefined && o.version > i.version ? carryExpand(o, i) : i;
	});
	const created = [...overlay.values()]
		.filter((o) => !seen.has(o.id))
		.reverse();
	return [...created, ...merged];
}

// ---- KPI strip (UX-09) -----------------------------------------------------------------------------------

export type LeadStrip = Record<LeadStatus, CappedCount>;

/** Qualified is the one emphasised card, and only when there is something qualified. Others stay neutral. */
export function leadStripTone(
	status: LeadStatus,
	c: CappedCount,
): "navy" | "neutral" {
	return status === "qualified" && c.count > 0 ? "navy" : "neutral";
}
