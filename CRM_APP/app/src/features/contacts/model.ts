// Pure contacts view-model helpers (no DOM, no React). Field names follow M1_CONTRACTS (contacts, duplicates,
// merge-previews, merges) and the journey timeline (audit rows).
import { isApiError } from "../../api/errors.ts";

export type IdentifierKind = "phone" | "email";
export type Identifier = {
	id: string;
	kind: IdentifierKind;
	value: string;
	provenance: string;
	original_contact_id: string;
};

/** GET /contacts rows carry no identifiers; GET /contacts/{id} adds the ones the session may read. */
export type Contact = {
	id: string;
	display_name: string;
	owner_id: string | null;
	source: string;
	version: number;
	merged_into_id?: string | null;
	identifiers?: Identifier[];
};
export type Assignee = { id: string; name: string };
export type ContactRow = Contact & { ownerName: string };

/** GET /contacts/{id}/journey rows (M2 business events; supersedes the M1 audit-row shape). */
export type JourneyEvent = {
	id: string;
	name: string;
	occurred_at: string;
	received_at?: string;
	source?: string | null;
	schema_version?: number;
};
export type Duplicate = { id: string; display_name: string; version: number };
export type MergeAffected = {
	leads: number;
	deals: number;
	tasks: number;
	identifiers: number;
};
export type MergePreview = {
	source_id: string;
	target_id: string;
	source_version: number;
	target_version: number;
	conflicts: string[];
	affected: MergeAffected;
};

export type BuiltInView = "all" | "mine";
export const BUILT_IN_VIEWS: readonly BuiltInView[] = ["all", "mine"];

export function filterBuiltInView<
	T extends { owner_id: string | null | undefined },
>(rows: readonly T[], view: BuiltInView, actor: string | null): T[] {
	if (view === "all") return [...rows];
	return actor === null ? [] : rows.filter((r) => r.owner_id === actor);
}

export function toRows(
	contacts: readonly Contact[],
	owners: ReadonlyMap<string, string>,
	unassigned: string,
	unknownOwner: string = unassigned,
): ContactRow[] {
	return contacts.map((c) => ({
		...c,
		ownerName: c.owner_id
			? (owners.get(c.owner_id) ?? unknownOwner)
			: unassigned,
	}));
}

/** Loaded pages + confirmed writes: a newer version wins; merged-away contacts are hidden. */
export function mergeLatest(
	items: readonly Contact[],
	overlay: ReadonlyMap<string, Contact>,
	hidden: ReadonlySet<string>,
): Contact[] {
	return items
		.filter((i) => !hidden.has(i.id))
		.map((i) => {
			const o = overlay.get(i.id);
			return o !== undefined && o.version > i.version ? o : i;
		});
}

// ---- identifier gating --------------------------------------------------------------------------------------

export type IdentifierView =
	| { state: "visible"; items: Identifier[] }
	/** Empty list: none exist OR the role is redacted (reader) - the API does not tell them apart. */
	| { state: "hidden" };

export function identifierView(c: Pick<Contact, "identifiers">): IdentifierView {
	const items = c.identifiers ?? [];
	return items.length === 0 ? { state: "hidden" } : { state: "visible", items };
}

const E164 = /^\+[1-9]\d{6,14}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export type IdentifierIssue = "phone" | "email" | null;
export function validateIdentifier(
	kind: IdentifierKind,
	value: string,
): IdentifierIssue {
	const v = value.trim().toLowerCase();
	if (v === "") return null;
	if (kind === "phone")
		return E164.test(v.replace(/[ ()-]/g, "")) ? null : "phone";
	return EMAIL.test(v) ? null : "email";
}

// ---- create -------------------------------------------------------------------------------------------------

export type NewContactInput = {
	name: string;
	phone: string;
	email: string;
	ownerId: string;
};
export const EMPTY_NEW_CONTACT: NewContactInput = {
	name: "",
	phone: "",
	email: "",
	ownerId: "",
};
export type NewContactErrors = {
	name?: "required";
	phone?: "phone";
	email?: "email";
};

export function validateNewContact(i: NewContactInput): NewContactErrors {
	const e: NewContactErrors = {};
	if (i.name.trim() === "") e.name = "required";
	if (validateIdentifier("phone", i.phone) !== null) e.phone = "phone";
	if (validateIdentifier("email", i.email) !== null) e.email = "email";
	return e;
}

/** POST /v1/contacts body; command_id doubles as the Idempotency-Key. Source is left to the server default. */
export function buildCreateContactBody(
	i: NewContactInput,
	commandId: string,
): Record<string, unknown> {
	const identifiers: Array<{ kind: IdentifierKind; value: string; provenance: string }> = [];
	if (i.phone.trim() !== "")
		identifiers.push({ kind: "phone", value: i.phone.trim(), provenance: "manual_entry" });
	if (i.email.trim() !== "")
		identifiers.push({ kind: "email", value: i.email.trim(), provenance: "manual_entry" });
	return {
		command_id: commandId,
		display_name: i.name.trim(),
		...(i.ownerId ? { owner_id: i.ownerId } : {}),
		...(identifiers.length > 0 ? { identifiers } : {}),
	};
}

export type CreateContactError = "validation" | "assignment" | "forbidden" | "network" | "other";
export function classifyCreateContactError(e: unknown): CreateContactError {
	if (!isApiError(e)) return "other";
	if (e.kind === "forbidden") return e.code === "ASSIGNMENT_DENIED" ? "assignment" : "forbidden";
	if (e.kind === "network") return "network";
	if (e.status === 422) return "validation";
	return "other";
}

/** PATCH body adding one identifier (the "+ Add" popover); null when the value is blank or invalid. */
export function buildAddIdentifierBody(
	c: Pick<Contact, "version">,
	kind: IdentifierKind,
	value: string,
	commandId: string,
): Record<string, unknown> | null {
	if (value.trim() === "" || validateIdentifier(kind, value) !== null) return null;
	return {
		command_id: commandId,
		expected_version: c.version,
		identifiers: [{ kind, value: value.trim(), provenance: "manual_entry" }],
	};
}

// ---- detail edit ------------------------------------------------------------------------------------------

export type EditDraft = {
	name: string;
	ownerId: string;
	idKind: IdentifierKind;
	idValue: string;
};
export const draftOf = (c: Contact): EditDraft => ({
	name: c.display_name,
	ownerId: c.owner_id ?? "",
	idKind: "phone",
	idValue: "",
});

/** PATCH body with only changed allowed fields (+ one added identifier) and expected_version; null = no change. */
export function buildPatchBody(
	c: Contact,
	d: EditDraft,
	commandId: string,
): Record<string, unknown> | null {
	const changes: Record<string, unknown> = {};
	if (d.name.trim() !== c.display_name) changes.display_name = d.name.trim();
	if (d.ownerId !== "" && d.ownerId !== c.owner_id)
		changes.owner_id = d.ownerId;
	if (d.idValue.trim() !== "")
		changes.identifiers = [
			{ kind: d.idKind, value: d.idValue.trim(), provenance: "manual_entry" },
		];
	if (Object.keys(changes).length === 0) return null;
	return { command_id: commandId, expected_version: c.version, ...changes };
}

// ---- journey ------------------------------------------------------------------------------------------------

const KNOWN_ACTIONS = new Set([
	"contact.created",
	"contact.updated",
	"contact.merged",
	"contact.merge_received",
	"lead.created",
	"lead.updated",
	"deal.created",
	"deal.updated",
	"deal.stage_changed",
	"task.created",
	"task.updated",
]);
/** Known business-event name -> i18n suffix (`contacts.journey.<suffix>`); null = show the raw action. */
export function journeyActionKey(name: string): string | null {
	return KNOWN_ACTIONS.has(name) ? name.replace(".", "_") : null;
}
/** Chronological: oldest first, id as tiebreak. */
export function sortJourney(events: readonly JourneyEvent[]): JourneyEvent[] {
	return [...events].sort(
		(a, b) =>
			Date.parse(a.occurred_at) - Date.parse(b.occurred_at) ||
			a.id.localeCompare(b.id),
	);
}

// ---- merge --------------------------------------------------------------------------------------------------

export type MergeField = {
	field: "display_name" | "owner" | "source";
	source: string;
	target: string;
	/** Target wins explicitly (M1 contract); a differing source value is dropped. */
	result: string;
	differs: boolean;
};

type MergeSide = { display_name: string; ownerName: string; source: string };
export function mergeFieldRows(
	source: MergeSide,
	target: MergeSide,
): MergeField[] {
	const row = (
		field: MergeField["field"],
		s: string,
		t: string,
	): MergeField => ({ field, source: s, target: t, result: t, differs: s !== t });
	return [
		row("display_name", source.display_name, target.display_name),
		row("owner", source.ownerName, target.ownerName),
		row("source", source.source, target.source),
	];
}

export function buildMergeBody(
	p: MergePreview,
	commandId: string,
): Record<string, unknown> {
	return {
		command_id: commandId,
		source_id: p.source_id,
		target_id: p.target_id,
		source_version: p.source_version,
		target_version: p.target_version,
	};
}

export type MergeErrorKind = "stale" | "forbidden" | "network" | "other";
export function classifyMergeError(e: unknown): MergeErrorKind {
	if (!isApiError(e)) return "other";
	if (e.kind === "version_conflict" || e.kind === "conflict") return "stale";
	if (e.kind === "forbidden") return "forbidden";
	if (e.kind === "network") return "network";
	return "other";
}
