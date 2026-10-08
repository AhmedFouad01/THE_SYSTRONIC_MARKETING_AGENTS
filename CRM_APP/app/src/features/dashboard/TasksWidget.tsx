import { href, navigate } from "../../router.ts";
import { Bdi, useI18n } from "../../ui/index.ts";
import { ChartSurface } from "./charts/ChartSurface.tsx";
import { chartState } from "./charts/model.ts";
import { tasksDueChart, tasksDueKpis, type TasksDuePayload } from "./tasksDue.ts";
import type { Load } from "./useLoad.ts";

export function TasksWidget({ state, onRetry }: { state: Load<TasksDuePayload>; onRetry: () => void }) {
	const { t, locale, formatCount } = useI18n();
	const data = state.status === "ready" ? state.data : null;
	const summary = data ? <>
		<dl className="sy-chart__kpis" aria-label={t("charts.tasks.total")}><div><dt>{t("charts.tasks.total")}</dt><dd><Bdi>{formatCount(tasksDueKpis(data).openTotal)}</Bdi></dd></div></dl>
		<p className="sy-chart__meta">{t("charts.tasks.overlap")}</p>
	</> : null;
	return <ChartSurface title={t("charts.tasks.title")} className="sy-dash__chart col-span-6 max-mobile:col-span-full" summary={summary}
		state={chartState(state, (payload) => tasksDueChart(payload, locale, t))} onRetry={onRetry}
		emptyAction={<a href={href("/tasks")} onClick={(event) => { event.preventDefault(); navigate("/tasks"); }}>{t("dash.follow.link")}</a>} />;
}
