// ADR-002 P1a: explicit projection (S1) and the list query contract (S4) for contact/lead/deal/task.
// Nothing here concatenates request input into SQL: identifiers come from the fixed tables below, values are bound.
export type Kind = "contact" | "lead" | "deal" | "task";
// Explicit column lists. A column added to a table later is NOT returned until it is added here deliberately.
export const COLUMNS: Record<Kind, string[]> = {
	contact: [
		"tenant_id",
		"id",
		"display_name",
		"owner_id",
		"version",
		"source",
		"merged_into_id",
		"created_at",
		"updated_at",
	],
	lead: [
		"tenant_id",
		"id",
		"contact_id",
		"owner_id",
		"title",
		"source",
		"source_evidence",
		"status",
		"version",
		"received_at",
		"created_at",
		"updated_at",
	],
	deal: [
		"tenant_id",
		"id",
		"contact_id",
		"pipeline_id",
		"stage_id",
		"owner_id",
		"version",
		"lead_id",
		"title",
		"amount_minor",
		"currency",
		"created_at",
		"updated_at",
	],
	task: [
		"tenant_id",
		"id",
		"contact_id",
		"deal_id",
		"owner_id",
		"title",
		"due_at",
		"status",
		"outcome",
		"version",
		"completed_at",
		"created_at",
		"updated_at",
	],
};
export const projection = (kind: Kind, alias = "") =>
	COLUMNS[kind].map((c) => (alias ? `${alias}.${c}` : c)).join(",");
