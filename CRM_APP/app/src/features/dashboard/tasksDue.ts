import { apiClient, ApiError, type ApiClient } from "../../api/index.ts";
import type { MessageKey } from "../../ui/i18n/en.ts";
import { formatDate } from "../../ui/i18n/format.ts";
import type { Locale } from "../../ui/tokens/scales.ts";
import type { ChartModel, ChartScope } from "./charts/model.ts";
import type { Load } from "./useLoad.ts";

export type TasksDuePayload = {
	scope: ChartScope; as_of: string; tz: string; today: string;
	open_total: number; overdue: number; next_24h: number;
	days: { date: string; count: number }[]; later: number;
};
export async function fetchTasksDue(tz: string, signal: AbortSignal, client: ApiClient = apiClient): Promise<TasksDuePayload> {
	const payload = (await client.get<TasksDuePayload>("dashboard/tasks-due", { query: { tz }, signal })).data;
	if (payload.tz !== tz) throw new ApiError({ status: 502, code: "CHARTS_CONTRACT_MISMATCH", safeMessage: "", requestId: null, retryable: false });
	return payload;
}
/** Do not briefly expose a previous authority's response while useLoad restarts its effect. */
export function tasksDueState(load: Load<{ key: string; data: TasksDuePayload }>, key: string): Load<TasksDuePayload> {
	return load.status === "ready" ? load.data.key === key ? { status: "ready", data: load.data.data } : { status: "loading" } : load;
}
export function tasksDueKpis(payload: TasksDuePayload) {
	return { overdue: payload.overdue, next24h: payload.next_24h, openTotal: payload.open_total };
}
type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;
export function tasksDueChart(payload: TasksDuePayload, locale: Locale, t: Translate): ChartModel {
	return {
		scope: payload.scope, asOf: payload.as_of, tz: payload.tz, type: "bar", horizontal: false,
		rowLabel: t("charts.tasks.period"), columns: [{ key: "count", label: t("charts.tasks.count"), kind: "count" }],
		rows: [
			{ key: "overdue", label: t("dash.overdue.label"), tone: "danger", values: { count: payload.overdue } },
			...payload.days.map((day) => ({ key: day.date, label: formatDate(`${day.date}T00:00:00Z`, locale, { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }), values: { count: day.count } })),
			{ key: "later", label: t("charts.tasks.later"), tone: "muted", values: { count: payload.later } },
		],
	};
}
