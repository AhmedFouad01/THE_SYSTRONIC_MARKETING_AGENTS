import { apiClient, type ApiClient } from "../../api/index.ts";
import type { MessageKey } from "../../ui/i18n/en.ts";
import { formatCount } from "../../ui/i18n/format.ts";
import type { Locale } from "../../ui/tokens/scales.ts";
import type { ChartModel, ChartScope } from "./charts/model.ts";

export type LeadCounts = { open: number; qualified: number; closed: number; total: number };
export type LeadsPayload = {
	scope: ChartScope; total: number; by_status: Omit<LeadCounts, "total">;
	sources: (LeadCounts & { source: string })[];
	other: (LeadCounts & { source_count: number }) | null;
};
export async function fetchLeadsAggregate(signal: AbortSignal, client: ApiClient = apiClient): Promise<LeadsPayload> {
	return (await client.get<LeadsPayload>("dashboard/leads-breakdown", { signal })).data;
}
export function leadsKpis(payload: LeadsPayload) {
	return [
		{ key: "open" as const, value: payload.by_status.open },
		{ key: "qualified" as const, value: payload.by_status.qualified },
		{ key: "closed" as const, value: payload.by_status.closed },
		{ key: "total" as const, value: payload.total },
	];
}
type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;
export function leadsChart(payload: LeadsPayload, locale: Locale, t: Translate): ChartModel {
	return {
		scope: payload.scope, horizontal: true, stacked: true, type: "bar", rowLabel: t("charts.leads.source"),
		columns: [
			{ key: "open", label: t("charts.leads.open"), kind: "count" },
			{ key: "qualified", label: t("charts.leads.qualified"), kind: "count" },
			{ key: "closed", label: t("charts.leads.closed"), kind: "count" },
			{ key: "total", label: t("charts.leads.total"), kind: "count", plot: false },
		],
		rows: [
			...payload.sources.map((source) => ({ key: `source:${source.source}`, label: source.source, values: { open: source.open, qualified: source.qualified, closed: source.closed, total: source.total } })),
			...(payload.other ? [{ key: "other", label: t("charts.leads.other", { count: formatCount(payload.other.source_count, locale) }), tone: "muted" as const, values: { open: payload.other.open, qualified: payload.other.qualified, closed: payload.other.closed, total: payload.other.total } }] : []),
		],
	};
}
