// Dashboard view-model (pure: no DOM, no React). Spec: audits/2026-10-05/DASHBOARD_SPEC.md.
// Every figure is derived from ONE page of an existing list endpoint or from the campaign-performance payload.
// A count is exact only when the server said there is no next page; otherwise it is a lower bound ("N+").
import { type CappedCount, cappedCount } from "../capped.ts";
import {
	aggregateCampaigns,
	type CampaignAgg,
	type CampaignReport,
	deriveKpis,
	type Kpis,
	REFUND_TYPE,
	toBig,
} from "../reporting/model.ts";
import type { Task } from "../tasks/model.ts";

export type Tone = "neutral" | "navy" | "magenta";

/** Follow-ups list length (W5) and top-campaigns length (W7). */
export const FOLLOWUP_LIMIT = 5;
export const TOP_CAMPAIGNS = 5;
/** The server's `?due=today` window (crm.ts: due_at < now() + 24 hours). */
export const NEXT_WINDOW_MS = 24 * 60 * 60 * 1000;

// ---- tasks (W1, W2, W5) ---------------------------------------------------------------------------------------

const dueMs = (t: Pick<Task, "due_at">): number => {
	if (t.due_at === null) return Number.NaN;
	return Date.parse(t.due_at);
};

/** W1: `?due=overdue` page 1. Count = rows returned; "N+" when the server has another page. */
export function overdueCount(
	tasks: readonly Task[],
	hasMore: boolean,
): CappedCount {
	return cappedCount(tasks.length, hasMore);
}

/**
 * W2: the server's `?due=today` also returns everything overdue, so keep only open tasks due from `now` on
 * (the same client-side rule the Tasks screen applies). Within the next 24 hours by construction.
 */
export function nextWindowTasks(tasks: readonly Task[], now: Date): Task[] {
	const from = now.getTime();
	return tasks.filter((t) => {
		const d = dueMs(t);
		return (
			t.status === "open" &&
			!Number.isNaN(d) &&
			d >= from &&
			d < from + NEXT_WINDOW_MS
		);
	});
}

export function nextWindowCount(
	tasks: readonly Task[],
	hasMore: boolean,
	now: Date,
): CappedCount {
	return cappedCount(nextWindowTasks(tasks, now).length, hasMore);
}

/** W5: first `limit` of overdue + next-24h tasks by due time, oldest first (an id is listed once). */
export function followUps(
	overdue: readonly Task[],
	next: readonly Task[],
	now: Date,
	limit = FOLLOWUP_LIMIT,
): Task[] {
	const seen = new Set<string>();
	const all: Task[] = [];
	for (const t of [...overdue, ...nextWindowTasks(next, now)]) {
		if (t.status !== "open" || seen.has(t.id)) continue;
		seen.add(t.id);
		all.push(t);
	}
	const key = (t: Task) => {
		const d = dueMs(t);
		return Number.isNaN(d) ? Number.MAX_SAFE_INTEGER : d;
	};
	return all.sort((a, b) => key(a) - key(b) || a.id.localeCompare(b.id)).slice(0, limit);
}

// ---- report (W3, W4, W6, W7) ------------------------------------------------------------------------------------

/** No attribution result and no spend: nothing to show (spec: "No attribution results yet"). */
export function isReportEmpty(r: CampaignReport): boolean {
	return r.rows.length === 0 && r.spend.length === 0;
}

/** Stale = not calculated: no published run or no usable as-of. A stale report never earns emphasis. */
export function isReportStale(r: CampaignReport): boolean {
	return r.run_id === null || r.as_of === null || Number.isNaN(Date.parse(r.as_of));
}

/** Currencies other than the primary one that appear in the report (never summed into the primary). */
export function otherCurrencies(
	report: CampaignReport,
	primary: string | null,
): string[] {
	const set = new Set<string>();
	for (const a of aggregateCampaigns(report)) if (a.currency !== primary) set.add(a.currency);
	return [...set].sort();
}

/** Net refund value in the primary currency (credits are negative) and the refund count. */
export function refundTotals(
	report: CampaignReport,
	primary: string | null,
): { value: bigint; count: number } {
	let value = 0n;
	let count = 0;
	for (const r of report.rows) {
		if (r.conversion_type !== REFUND_TYPE || r.currency !== primary) continue;
		value += toBig(r.value_minor);
		count += r.outcomes;
	}
	return { value, count };
}

/** W7: top campaigns by net attributed revenue, primary currency only. */
export function topCampaigns(
	report: CampaignReport,
	primary: string | null,
	limit = TOP_CAMPAIGNS,
): CampaignAgg[] {
	if (primary === null) return [];
	return aggregateCampaigns(report)
		.filter((a) => a.currency === primary)
		.sort((x, y) => Number(y.revenue - x.revenue) || x.key.localeCompare(y.key))
		.slice(0, limit);
}

export type MarketingSummary = {
	kpis: Kpis;
	stale: boolean;
	empty: boolean;
	others: string[];
	refunds: { value: bigint; count: number };
	top: CampaignAgg[];
};

export function summarizeReport(report: CampaignReport): MarketingSummary {
	const kpis = deriveKpis(report);
	return {
		kpis,
		stale: isReportStale(report),
		empty: isReportEmpty(report),
		others: otherCurrencies(report, kpis.currency),
		refunds: refundTotals(report, kpis.currency),
		top: topCampaigns(report, kpis.currency),
	};
}

// ---- emphasis (spec section 3) ----------------------------------------------------------------------------------

export type Emphasis = { overdue: Tone; revenue: Tone };

/**
 * At most two filled cards, never by default. Overdue is navy only when something is overdue; attributed revenue is
 * magenta only when it is positive AND the report is not stale. Every other card is neutral.
 */
export function emphasis(input: {
	overdue: number | null;
	revenue: bigint | null;
	stale: boolean;
}): Emphasis {
	return {
		overdue: input.overdue !== null && input.overdue > 0 ? "navy" : "neutral",
		revenue:
			input.revenue !== null && input.revenue > 0n && !input.stale
				? "magenta"
				: "neutral",
	};
}
