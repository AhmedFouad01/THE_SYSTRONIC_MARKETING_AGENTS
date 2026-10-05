// Pure pipeline-board view-model (no DOM, no React). Stage/edge rules live in deals/model.ts and are reused.
import {
	type Deal,
	orderedStages,
	type Pipeline,
	type Stage,
} from "../deals/model.ts";

export type CurrencyTotal = { currency: string; minor: number };

export type StageColumn = {
	stage: Stage;
	deals: Deal[];
	count: number;
	/** One entry per currency (never summed across currencies), sorted by currency code. */
	totals: CurrencyTotal[];
};

/** Visible stages in pipeline order: archived stages only when a loaded deal still sits in them. */
export function boardStages(p: Pipeline, deals: readonly Deal[]): Stage[] {
	const used = new Set(deals.map((d) => d.stage_id));
	return orderedStages(p).filter((s) => !s.archived || used.has(s.id));
}

export function totalsOf(deals: readonly Deal[]): CurrencyTotal[] {
	const by = new Map<string, number>();
	for (const d of deals)
		by.set(d.currency, (by.get(d.currency) ?? 0) + d.amount_minor);
	return [...by.entries()]
		.map(([currency, minor]) => ({ currency, minor }))
		.sort((a, b) => a.currency.localeCompare(b.currency));
}

/**
 * Group the loaded deals of one pipeline by stage, client-side (the API has no board endpoint).
 * `pendingStage` holds optimistic moves (deal id -> target stage id) layered over the real stage.
 * DOM/column order is pipeline order; RTL mirrors it visually through CSS (flex row follows `dir`).
 */
export function groupByStage(
	p: Pipeline,
	deals: readonly Deal[],
	pendingStage: ReadonlyMap<string, string> = new Map(),
): StageColumn[] {
	const mine = deals
		.filter((d) => d.pipeline_id === p.id)
		.map((d) => {
			const to = pendingStage.get(d.id);
			return to === undefined ? d : { ...d, stage_id: to };
		});
	return boardStages(p, mine).map((stage) => {
		const inStage = mine.filter((d) => d.stage_id === stage.id);
		return {
			stage,
			deals: inStage,
			count: inStage.length,
			totals: totalsOf(inStage),
		};
	});
}

/** Deals of the pipeline whose stage is unknown to it (stale pipeline data): shown nowhere, counted for honesty. */
export function orphanCount(p: Pipeline, deals: readonly Deal[]): number {
	const ids = new Set(p.stages.map((s) => s.id));
	return deals.filter((d) => d.pipeline_id === p.id && !ids.has(d.stage_id))
		.length;
}

export type ColumnKind = "open" | "won" | "lost";
export const columnKind = (s: Stage): ColumnKind => s.outcome ?? "open";

/** Selected pipeline id if still present, else the first pipeline (or null). */
export function resolvePipeline(
	pipelines: readonly Pipeline[],
	selectedId: string | null,
): Pipeline | null {
	return pipelines.find((p) => p.id === selectedId) ?? pipelines[0] ?? null;
}

/** Deals in pipeline `p` that still sit in an open (non won/lost) stage. */
export function openDealCount(p: Pipeline, deals: readonly Deal[]): number {
	const open = new Set(p.stages.filter((s) => !s.outcome).map((s) => s.id));
	return deals.filter((d) => d.pipeline_id === p.id && open.has(d.stage_id)).length;
}

/**
 * Pipeline to show: the user's explicit choice, else the remembered last-used one, else the pipeline with the most
 * open deals among the loaded ones (ties and "none loaded" keep pipeline order), else the first.
 */
export function pickPipeline(
	pipelines: readonly Pipeline[],
	deals: readonly Deal[],
	selectedId: string | null,
	rememberedId: string | null,
): Pipeline | null {
	for (const id of [selectedId, rememberedId]) {
		const hit = id === null ? undefined : pipelines.find((p) => p.id === id);
		if (hit) return hit;
	}
	let best: Pipeline | null = null;
	let bestN = -1;
	for (const p of pipelines) {
		const n = openDealCount(p, deals);
		if (n > bestN) {
			best = p;
			bestN = n;
		}
	}
	return best;
}

/** Up to two leading initials of a name (card owner avatar); "" for a blank name. */
export function initialsOf(name: string): string {
	return name
		.trim()
		.split(/\s+/)
		.filter((w) => w !== "")
		.slice(0, 2)
		.map((w) => Array.from(w)[0] ?? "")
		.join("")
		.toUpperCase();
}
