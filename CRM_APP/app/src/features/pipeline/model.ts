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
