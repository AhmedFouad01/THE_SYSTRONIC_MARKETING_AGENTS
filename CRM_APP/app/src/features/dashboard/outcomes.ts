import { apiClient, ApiError, type ApiClient } from "../../api/index.ts";
import type { MessageKey } from "../../ui/i18n/en.ts";
import { formatDate } from "../../ui/i18n/format.ts";
import type { Locale } from "../../ui/tokens/scales.ts";
import { toBig } from "../reporting/model.ts";
import type { ChartModel, ChartScope } from "./charts/model.ts";

export type OutcomeBucketKind = "month" | "week";
type Side = { count: number; totals: { currency: string; amount_minor: string }[] };
export type OutcomesPayload = {
	scope: ChartScope; as_of: string | null; tz: string; bucket: OutcomeBucketKind; week_start?: "monday" | "saturday";
	periods: number; from: string | null; to: string | null;
	buckets: { start: string; end: string; won: Side; lost: Side }[];
};
export const browserTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
export function outcomesQuery(bucket: OutcomeBucketKind = "month", tz = browserTimezone()) {
	return { bucket, periods: 12, tz, ...(bucket === "week" ? { week_start: "saturday" } : {}) };
}
export async function fetchOutcomes(bucket: OutcomeBucketKind, tz: string, signal: AbortSignal, client: ApiClient = apiClient): Promise<OutcomesPayload> {
	const payload = (await client.get<OutcomesPayload>("dashboard/deals-outcomes", { query: outcomesQuery(bucket, tz), signal })).data;
	// A successful old/mismatched response must never be presented as Saturday/browser-zone aggregates.
	if (payload.bucket !== bucket || payload.tz !== tz || (bucket === "week" && payload.week_start !== "saturday"))
		throw new ApiError({ status: 502, code: "CHARTS_CONTRACT_MISMATCH", safeMessage: "", requestId: null, retryable: false });
	return payload;
}
export function outcomesCurrencies(payload: OutcomesPayload) {
	return [...new Set(payload.buckets.flatMap((bucket) => [...bucket.won.totals, ...bucket.lost.totals].map((total) => total.currency)))].sort();
}
export function outcomesCurrency(payload: OutcomesPayload, requested: string) {
	return outcomesCurrencies(payload).includes(requested) ? requested : "";
}
type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;
export function outcomesChart(payload: OutcomesPayload, requestedCurrency: string, locale: Locale, t: Translate): ChartModel {
	const currency = outcomesCurrency(payload, requestedCurrency);
	const date = (value: string) => formatDate(`${value}T00:00:00Z`, locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
	return {
		scope: payload.scope, type: "bar", horizontal: false, stacked: false,
		rowLabel: t("charts.outcomes.period"), asOf: payload.as_of, tz: payload.tz,
		from: payload.from ?? undefined, to: payload.to ?? undefined,
		columns: [
			{ key: "won", label: t("charts.outcomes.won"), kind: "count", color: "success" },
			{ key: "lost", label: t("charts.outcomes.lost"), kind: "count", color: "danger" },
			...(currency ? [
				{ key: "wonValue", label: t("charts.outcomes.wonValue"), kind: "money" as const, currency, type: "line" as const },
				{ key: "lostValue", label: t("charts.outcomes.lostValue"), kind: "money" as const, currency, plot: false },
			] : []),
		],
		rows: payload.buckets.toSorted((a, b) => a.start.localeCompare(b.start)).map((bucket) => ({
			key: bucket.start, label: t("charts.outcomes.range", { from: date(bucket.start), to: date(bucket.end) }),
			values: { won: bucket.won.count, lost: bucket.lost.count,
				wonValue: toBig(bucket.won.totals.find((total) => total.currency === currency)?.amount_minor).toString(),
				lostValue: toBig(bucket.lost.totals.find((total) => total.currency === currency)?.amount_minor).toString(),
			},
		})),
	};
}
