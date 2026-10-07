// Pure deals view-model helpers (no DOM, no React). Field names follow M1_CONTRACTS (deals, transitions,
// history, pipelines). Stage writes go ONLY through the transition command; PATCH never carries stage_id.
import { isApiError } from "../../api/errors.ts";
import { cond, NOTHING, type ServerNode } from "../../ui/data-grid/serverQuery.ts";
import { minorToMajorUnits } from "../../ui/i18n/format.ts";
import { carryExpand, contactNameOf, type Expanded, ownerNameOf } from "../expand.ts";

export type StageOutcome = "won" | "lost" | null;
export type Stage = {
	id: string;
	name: string;
	outcome: StageOutcome;
	position: number;
	archived: boolean;
};
export type Edge = { from_stage: string; to_stage: string };
export type Pipeline = {
	id: string;
	name: string;
	stages: Stage[];
	transitions: Edge[];
};

export type Deal = {
	id: string;
	contact_id: string;
	lead_id: string | null;
	pipeline_id: string;
	stage_id: string;
	owner_id: string | null;
	title: string;
	amount_minor: number;
	currency: string;
	version: number;
} & Expanded;
export type Assignee = { id: string; name: string };
export type Contact = { id: string; display_name: string };
export type LeadRef = { id: string; title: string; contact_id: string };

export type HistoryEntry = {
	id: string;
	from_stage: string;
	to_stage: string;
	deal_version: number;
	reason: string;
	occurred_at: string;
	actor_id: string;
};

export type DealRow = Deal & {
	contactName: string;
	ownerName: string;
	pipelineName: string;
	stageName: string;
	stageOutcome: StageOutcome;
	/** Major units (amount_minor / 100) for formatMoney. */
	value: number;
};

// ---- money ------------------------------------------------------------------------------------------------

export const MINOR_PER_MAJOR = 100;
export const minorToMajor = (minor: number): number => minor / MINOR_PER_MAJOR;

/** Decimal text ("1250", "1250.5", "1,250.50" not accepted) -> integer minor units, or null if invalid. */
export function parseMajorToMinor(text: string): number | null {
	const s = text.trim();
	if (s === "") return 0;
	if (!/^\d{1,12}(\.\d{1,2})?$/.test(s)) return null;
	return Math.round(Number(s) * MINOR_PER_MAJOR);
}

/** formatMoney is passed in (useI18n().formatMoney) so the pure model stays locale-agnostic. */
export function dealValueText(
	deal: Pick<Deal, "amount_minor" | "currency">,
	formatMoney: (
		v: number,
		o?: { currency?: string; compact?: boolean },
	) => string,
): string {
	return formatMoney(minorToMajorUnits(deal.amount_minor, deal.currency), {
		currency: deal.currency,
	});
}

// ---- pipeline ---------------------------------------------------------------------------------------------

export const orderedStages = (p: Pipeline): Stage[] =>
	[...p.stages].sort(
		(a, b) => a.position - b.position || a.name.localeCompare(b.name),
	);

/** Stages a new deal may start in: non-archived, non-terminal (contract: initial stage must be nonterminal). */
export const initialStages = (p: Pipeline): Stage[] =>
	orderedStages(p).filter((s) => !s.archived && s.outcome === null);

/**
 * Allowed targets from a stage = the pipeline's configured edges only (server returns 422 INVALID_TRANSITION
 * otherwise), excluding archived stages. Never offers the current stage.
 */
export function allowedTargets(
	p: Pipeline | undefined,
	fromStageId: string,
): Stage[] {
	if (p === undefined) return [];
	const to = new Set(
		p.transitions
			.filter((e) => e.from_stage === fromStageId)
			.map((e) => e.to_stage),
	);
	return orderedStages(p).filter(
		(s) => to.has(s.id) && !s.archived && s.id !== fromStageId,
	);
}

/**
 * Stages the whole selection can be moved to in one bulk action: every selected deal must be in the same
 * pipeline and have a configured edge to the target (so the server cannot answer INVALID_TRANSITION). Lost
 * targets are excluded (they need a per-deal reason). Empty = the action is not offered.
 */
export function bulkMoveTargets(
	selected: readonly Pick<Deal, "pipeline_id" | "stage_id">[],
	pipelineById: ReadonlyMap<string, Pipeline>,
): Stage[] {
	const first = selected[0];
	if (first === undefined) return [];
	if (selected.some((d) => d.pipeline_id !== first.pipeline_id)) return [];
	const p = pipelineById.get(first.pipeline_id);
	let common: Stage[] | null = null;
	for (const d of selected) {
		const ids = new Set(
			allowedTargets(p, d.stage_id)
				.filter((s) => s.outcome !== "lost")
				.map((s) => s.id),
		);
		common = (common ?? allowedTargets(p, d.stage_id)).filter((s) => ids.has(s.id));
	}
	return common ?? [];
}

export const stageOf = (
	p: Pipeline | undefined,
	stageId: string,
): Stage | undefined => p?.stages.find((s) => s.id === stageId);

export function toRows(
	deals: readonly Deal[],
	owners: ReadonlyMap<string, string>,
	pipelines: ReadonlyMap<string, Pipeline>,
	labels: {
		unassigned: string;
		unknownContact: string;
		unknownStage: string;
		unknownOwner: string;
	},
): DealRow[] {
	return deals.map((d) => {
		const p = pipelines.get(d.pipeline_id);
		const s = stageOf(p, d.stage_id);
		return {
			...d,
			contactName: contactNameOf(d) ?? labels.unknownContact,
			ownerName: d.owner_id
				? (ownerNameOf(d) ?? owners.get(d.owner_id) ?? labels.unknownOwner)
				: labels.unassigned,
			pipelineName: p?.name ?? "",
			stageName: s?.name ?? labels.unknownStage,
			stageOutcome: s?.outcome ?? null,
			value: minorToMajor(d.amount_minor),
		};
	});
}

export type BuiltInView = "all" | "mine" | "open";
export const BUILT_IN_VIEWS: readonly BuiltInView[] = ["all", "mine", "open"];

/**
 * Built-in views as server conditions. "open" = deals sitting in a non won/lost stage of any pipeline (stage ids
 * come from the pipelines directory); with no open stage it matches nothing.
 */
export function builtInViewNodes(
	view: BuiltInView,
	actor: string | null,
	pipelines: readonly Pipeline[],
): ServerNode[] {
	if (view === "all") return [];
	if (view === "mine") return [actor === null ? NOTHING : cond("owner_id", "eq", actor)];
	const open = pipelines.flatMap((p) => p.stages.filter((s) => s.outcome === null).map((s) => s.id));
	return [open.length === 0 ? NOTHING : cond("stage_id", "in", open)];
}

/** Stage filter (keyed by stage name, which repeats across pipelines) -> `stage_id in [every stage with that name]`. */
export function stageIdsByName(pipelines: readonly Pipeline[], name: string): string[] {
	return pipelines.flatMap((p) => p.stages.filter((s) => s.name === name).map((s) => s.id));
}

/** Loaded pages + locally confirmed writes: newer version wins; overlay-only entries (new deals) come first. */
export function mergeLatest(
	items: readonly Deal[],
	overlay: ReadonlyMap<string, Deal>,
): Deal[] {
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

// ---- Lead -> Contact -> Deal context ----------------------------------------------------------------------

export type DealContext = {
	contactId: string;
	leadId: string | null;
	/** Set once a deal was created from this context (suppresses re-opening the dialog on refresh). */
	dealId: string | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuidOrNull = (v: string | null): string | null =>
	v !== null && UUID.test(v) ? v : null;

/** Parse `?contact=&lead=&deal=` (ids validated as UUIDs). No valid contact id = no context. */
export function parseDealContext(search: string): DealContext | null {
	const q = new URLSearchParams(search);
	const contactId = uuidOrNull(q.get("contact"));
	const dealId = uuidOrNull(q.get("deal"));
	if (contactId === null) return null;
	return { contactId, leadId: uuidOrNull(q.get("lead")), dealId };
}

/** Inverse of parseDealContext: a query string starting with `?`, or "" when there is no context. */
export function dealContextSearch(c: DealContext | null): string {
	if (c === null) return "";
	const q = new URLSearchParams({ contact: c.contactId });
	if (c.leadId) q.set("lead", c.leadId);
	if (c.dealId) q.set("deal", c.dealId);
	return `?${q.toString()}`;
}

/** Initial selection id from `?select=` (used by Leads/Contacts when linked back from the context strip). */
export function parseSelect(search: string): string | null {
	return uuidOrNull(new URLSearchParams(search).get("select"));
}

// ---- create -----------------------------------------------------------------------------------------------

export type NewDealInput = {
	title: string;
	contactId: string;
	pipelineId: string;
	stageId: string;
	amount: string;
	currency: string;
	ownerId: string;
};
export type NewDealField =
	| "title"
	| "contactId"
	| "pipelineId"
	| "stageId"
	| "amount"
	| "currency";
export type DealIssue = "required" | "tooLong" | "amount" | "currency";
export type NewDealErrors = Partial<Record<NewDealField, DealIssue>>;

export const EMPTY_NEW_DEAL: NewDealInput = {
	title: "",
	contactId: "",
	pipelineId: "",
	stageId: "",
	amount: "",
	currency: "EGP",
	ownerId: "",
};
const MAX_TITLE = 160;

export function validateNewDeal(i: NewDealInput): NewDealErrors {
	const e: NewDealErrors = {};
	if (i.title.trim() === "") e.title = "required";
	else if (i.title.trim().length > MAX_TITLE) e.title = "tooLong";
	if (i.contactId === "") e.contactId = "required";
	if (i.pipelineId === "") e.pipelineId = "required";
	if (i.stageId === "") e.stageId = "required";
	if (parseMajorToMinor(i.amount) === null) e.amount = "amount";
	if (!/^[A-Z]{3}$/.test(i.currency.trim().toUpperCase()))
		e.currency = "currency";
	return e;
}

/** POST /v1/deals body. command_id doubles as the Idempotency-Key. */
export function buildCreateBody(
	i: NewDealInput,
	leadId: string | null,
	commandId: string,
): Record<string, unknown> {
	return {
		command_id: commandId,
		contact_id: i.contactId,
		...(leadId ? { lead_id: leadId } : {}),
		pipeline_id: i.pipelineId,
		stage_id: i.stageId,
		title: i.title.trim(),
		amount_minor: parseMajorToMinor(i.amount) ?? 0,
		currency: i.currency.trim().toUpperCase(),
		...(i.ownerId ? { owner_id: i.ownerId } : {}),
	};
}

export type KeyMemo = { fingerprint: string; key: string };

/** Same payload retried reuses its key (server replays); a changed payload needs a new key. */
export function keyFor(
	prev: KeyMemo | null,
	input: NewDealInput,
	leadId: string | null,
	newKey: () => string,
	extra?: unknown,
): KeyMemo {
	const fingerprint = JSON.stringify([buildCreateBody(input, leadId, ""), extra ?? null]);
	return prev !== null && prev.fingerprint === fingerprint
		? prev
		: { fingerprint, key: newKey() };
}

export type CreateErrorKind =
	| "validation"
	| "stage"
	| "assignment"
	| "conflict"
	| "forbidden"
	| "network"
	| "other";

export function classifyCreateError(e: unknown): CreateErrorKind {
	if (!isApiError(e)) return "other";
	if (e.kind === "forbidden")
		return e.code === "ASSIGNMENT_DENIED" ? "assignment" : "forbidden";
	if (e.kind === "network") return "network";
	if (e.kind === "conflict" || e.kind === "version_conflict") return "conflict";
	if (e.status === 422)
		return e.code === "INVALID_STAGE" ? "stage" : "validation";
	return "other";
}

// ---- detail edit ------------------------------------------------------------------------------------------

export type EditDraft = {
	title: string;
	amount: string;
	currency: string;
	ownerId: string;
};

const majorText = (minor: number) =>
	Number.isInteger(minor / MINOR_PER_MAJOR)
		? String(minor / MINOR_PER_MAJOR)
		: (minor / MINOR_PER_MAJOR).toFixed(2);

export const draftOf = (d: Deal): EditDraft => ({
	title: d.title,
	amount: majorText(d.amount_minor),
	currency: d.currency,
	ownerId: d.owner_id ?? "",
});

export function validateEdit(d: EditDraft): NewDealErrors {
	const e: NewDealErrors = {};
	if (d.title.trim() === "") e.title = "required";
	else if (d.title.trim().length > MAX_TITLE) e.title = "tooLong";
	if (parseMajorToMinor(d.amount) === null) e.amount = "amount";
	if (!/^[A-Z]{3}$/.test(d.currency.trim().toUpperCase()))
		e.currency = "currency";
	return e;
}

/** PATCH body with only changed allowed fields (title/owner_id/amount_minor/currency) + expected_version. */
export function buildPatchBody(
	deal: Deal,
	d: EditDraft,
	commandId: string,
): Record<string, unknown> | null {
	if (Object.keys(validateEdit(d)).length > 0) return null;
	const changes: Record<string, unknown> = {};
	if (d.title.trim() !== deal.title) changes.title = d.title.trim();
	const minor = parseMajorToMinor(d.amount);
	if (minor !== null && minor !== deal.amount_minor)
		changes.amount_minor = minor;
	const cur = d.currency.trim().toUpperCase();
	if (cur !== deal.currency) changes.currency = cur;
	if (d.ownerId !== "" && d.ownerId !== deal.owner_id)
		changes.owner_id = d.ownerId;
	if (Object.keys(changes).length === 0) return null;
	return { command_id: commandId, expected_version: deal.version, ...changes };
}

export const isDirty = (deal: Deal, d: EditDraft): boolean =>
	d.title.trim() !== deal.title ||
	parseMajorToMinor(d.amount) !== deal.amount_minor ||
	d.currency.trim().toUpperCase() !== deal.currency ||
	(d.ownerId !== "" && d.ownerId !== deal.owner_id);

// ---- transitions ------------------------------------------------------------------------------------------

export const MAX_REASON = 500;

export type TransitionIssue = "reasonRequired" | "reasonTooLong";

/** Lost needs a non-empty reason (client mirrors server LOSS_REASON_REQUIRED); others send an empty reason. */
export function validateReason(
	target: Stage,
	reason: string,
): TransitionIssue | null {
	if (target.outcome === "lost" && reason.trim() === "")
		return "reasonRequired";
	if (reason.trim().length > MAX_REASON) return "reasonTooLong";
	return null;
}

export function buildTransitionBody(
	deal: Deal,
	target: Stage,
	reason: string,
	commandId: string,
): Record<string, unknown> {
	return {
		command_id: commandId,
		to_stage_id: target.id,
		expected_version: deal.version,
		reason: reason.trim(),
	};
}

export type TransitionErrorKind =
	| "conflict"
	| "forbidden"
	| "invalid"
	| "reason"
	| "network"
	| "other";

export function classifyTransitionError(e: unknown): TransitionErrorKind {
	if (!isApiError(e)) return "other";
	if (e.kind === "version_conflict") return "conflict";
	if (e.kind === "forbidden") return "forbidden";
	if (e.kind === "network") return "network";
	if (e.code === "LOSS_REASON_REQUIRED") return "reason";
	if (e.code === "INVALID_TRANSITION") return "invalid";
	return "other";
}

/** POST /transitions returns {id, version, stage_id}; fold it into the local deal copy. */
export function applyTransition(
	deal: Deal,
	result: { version: number; stage_id: string },
): Deal {
	return { ...deal, stage_id: result.stage_id, version: result.version };
}

// ---- record page: stage stepper, amount input, currencies -------------------------------------------------

export type StepState = "done" | "current" | "upcoming" | "won" | "lost";
export type StepperStep = { stage: Stage; state: StepState };

/** The pipeline's forward path: non-archived, non-lost stages in order (a current archived stage is kept). */
function pathStages(p: Pipeline, currentId: string): Stage[] {
	return orderedStages(p).filter(
		(s) => s.outcome !== "lost" && (!s.archived || s.id === currentId),
	);
}

/**
 * Stage stepper model. Earlier stages of the path are "done", the deal's stage is "current" (or "won" for a won
 * terminal), later ones "upcoming". A lost deal cannot tell where it fell out, so the path stays "upcoming" and the
 * lost stage is appended as the "lost" step. Unknown stage or pipeline gives no steps.
 */
export function stepperSteps(
	p: Pipeline | undefined,
	currentId: string,
): StepperStep[] {
	const cur = stageOf(p, currentId);
	if (p === undefined || cur === undefined) return [];
	const path = pathStages(p, currentId);
	if (cur.outcome === "lost")
		return [
			...path.map((stage) => ({ stage, state: "upcoming" as const })),
			{ stage: cur, state: "lost" as const },
		];
	const at = path.findIndex((s) => s.id === currentId);
	return path.map((stage, i) => ({
		stage,
		state:
			i < at
				? ("done" as const)
				: i === at
					? cur.outcome === "won"
						? ("won" as const)
						: ("current" as const)
					: ("upcoming" as const),
	}));
}

/** 1-based position of the deal's stage on the forward path ("2 of 5"); null for lost/unknown stages. */
export function stagePosition(
	p: Pipeline | undefined,
	currentId: string,
): { index: number; total: number } | null {
	const cur = stageOf(p, currentId);
	if (p === undefined || cur === undefined || cur.outcome === "lost")
		return null;
	const path = pathStages(p, currentId);
	const at = path.findIndex((s) => s.id === currentId);
	return at < 0 ? null : { index: at + 1, total: path.length };
}

export type StageMoves = {
	won: Stage | null;
	lost: Stage | null;
	others: Stage[];
};

/** Splits the allowed edges: the first won/lost target feed the Mark won / Mark lost buttons, the rest the stage menu. */
export function splitMoves(targets: readonly Stage[]): StageMoves {
	const won = targets.find((s) => s.outcome === "won") ?? null;
	const lost = targets.find((s) => s.outcome === "lost") ?? null;
	return {
		won,
		lost,
		others: targets.filter((s) => s !== won && s !== lost),
	};
}

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const EASTERN_INDIC = "۰۱۲۳۴۵۶۷۸۹";

/**
 * What the user typed in the money field -> plain decimal text ("1,250.5" -> "1250.5"). Arabic-Indic digits and the
 * Arabic decimal separator are accepted; anything else is dropped, only the first dot is kept, at most 12 integer
 * digits and 2 decimals survive.
 */
export function sanitizeAmountInput(typed: string): string {
	let out = "";
	let dot = false;
	let ints = 0;
	let decs = 0;
	for (const ch of typed) {
		let c = ch;
		const a = ARABIC_INDIC.indexOf(ch);
		const e = EASTERN_INDIC.indexOf(ch);
		if (a >= 0) c = String(a);
		else if (e >= 0) c = String(e);
		else if (ch === "٫") c = ".";
		if (c >= "0" && c <= "9") {
			if (dot) {
				if (decs >= 2) continue;
				decs++;
			} else {
				if (ints >= 12) continue;
				ints++;
			}
			out += c;
		} else if (c === "." && !dot) {
			dot = true;
			out += c;
		}
	}
	return out;
}

/** Plain decimal text -> display text with thousands grouping ("1250.5" -> "1,250.5"; keeps a trailing dot). */
export function groupAmount(plain: string): string {
	const [int = "", frac] = plain.split(".");
	const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	return frac === undefined ? grouped : `${grouped}.${frac}`;
}

/** ISO codes offered by the currency select: those present in the data, the default, and the record's own. */
export function currencyChoices(
	used: Iterable<string>,
	current?: string,
): string[] {
	const set = new Set<string>(["EGP"]);
	for (const c of used) if (/^[A-Z]{3}$/.test(c)) set.add(c);
	if (current && /^[A-Z]{3}$/.test(current)) set.add(current);
	return [...set].sort((a, b) =>
		a === "EGP" ? -1 : b === "EGP" ? 1 : a.localeCompare(b),
	);
}
