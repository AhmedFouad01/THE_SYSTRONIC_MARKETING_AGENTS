import { apiClient, ApiError, type ApiClient } from "../../api/index.ts";
import type { MessageKey } from "../../ui/i18n/en.ts";
import { formatDate } from "../../ui/i18n/format.ts";
import type { Locale } from "../../ui/tokens/scales.ts";
import type { ChartModel, ChartScope } from "./charts/model.ts";
import { browserTimezone } from "./outcomes.ts";

export const activitySeries = ["contacts_created", "leads_created", "deals_created", "tasks_created", "tasks_completed"] as const;
export type ActivityPayload = {
	scope: ChartScope; as_of: string; tz: string; bucket: "week"; week_start: "saturday" | "monday";
	periods: number; from: string; to: string;
	buckets: ({ start: string; end: string } & Record<(typeof activitySeries)[number], number>)[];
};
export const activityQuery = (tz = browserTimezone()) => ({ bucket: "week", periods: 12, tz, week_start: "saturday" });
export async function fetchActivity(tz: string, signal: AbortSignal, client: ApiClient = apiClient): Promise<ActivityPayload> {
	const payload = (await client.get<ActivityPayload>("dashboard/activity", { query: activityQuery(tz), signal })).data;
	if (payload.bucket !== "week" || payload.periods !== 12 || payload.week_start !== "saturday" || payload.tz !== tz)
		throw new ApiError({ status: 502, code: "CHARTS_CONTRACT_MISMATCH", safeMessage: "", requestId: null, retryable: false });
	return payload;
}
type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;
export function activityChart(payload: ActivityPayload, locale: Locale, t: Translate): ChartModel {
	const date = (value: string) => formatDate(`${value}T00:00:00Z`, locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
	return {
		scope: payload.scope, asOf: payload.as_of, tz: payload.tz, from: payload.from, to: payload.to,
		type: "line", horizontal: false, rowLabel: t("charts.outcomes.period"),
		columns: activitySeries.map((key) => ({ key, label: t(`charts.activity.${key}`), kind: "count" })),
		rows: payload.buckets.toSorted((a, b) => a.start.localeCompare(b.start)).map((bucket) => ({
			key: bucket.start, label: t("charts.outcomes.range", { from: date(bucket.start), to: date(bucket.end) }),
			values: Object.fromEntries(activitySeries.map((key) => [key, bucket[key]])),
		})),
	};
}
