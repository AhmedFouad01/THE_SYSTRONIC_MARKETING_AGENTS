import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarController, BarElement, LineController, LineElement, PointElement, Legend, Tooltip } from "chart.js";
import { Chart } from "react-chartjs-2";
import { Bdi, Panel, EmptyState, ErrorState, ForbiddenState, SkeletonRows, useI18n, useTheme } from "../../../ui/index.ts";
import { formatDate, formatDateTime } from "../../../ui/i18n/format.ts";
import { chartData, chartOptions, formatChartValue, resolveChartTheme, scopeKey, type ChartModel, type ChartState } from "./model.ts";
import "./charts.css";

ChartJS.register(CategoryScale, LinearScale, BarController, BarElement, LineController, LineElement, PointElement, Legend, Tooltip);

export function ChartCanvas({ model, theme, locale, reducedMotion, label, tableId }: {
	model: ChartModel; theme: ReturnType<typeof resolveChartTheme>; locale: "ar" | "en"; reducedMotion: boolean; label: string; tableId: string;
}) {
	const { t } = useI18n();
	return <Chart type={model.type ?? "bar"} data={chartData(model, theme)} options={chartOptions(model, locale, reducedMotion, theme)} role="img" aria-label={label} aria-describedby={tableId} fallbackContent={<p>{t("charts.tableFallback")}</p>} />;
}

function ReadyChart({ title, model, empty, emptyAction }: { title: string; model: ChartModel; empty: boolean; emptyAction?: ReactNode }) {
	const { t, locale, dir } = useI18n();
	const { mode, reducedMotion } = useTheme();
	const [theme, setTheme] = useState<ReturnType<typeof resolveChartTheme> | null>(null);
	const tableId = useId();
	// biome-ignore lint/correctness/useExhaustiveDependencies: mode and locale changes update root tokens outside this effect
	useEffect(() => {
		const root = document.documentElement;
		const style = getComputedStyle(root);
		setTheme(resolveChartTheme((name) => style.getPropertyValue(name).trim()));
	}, [mode, locale]);
	const scope = t(scopeKey(model.scope));
	const period = model.from && model.to ? t("charts.period", {
		from: formatDate(`${model.from}T00:00:00Z`, locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }),
		to: formatDate(`${model.to}T00:00:00Z`, locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }),
	}) : t("charts.current");
	const label = t("charts.description", { title, scope, period, timezone: model.tz ?? t("charts.current"), measure: model.columns.map((col) => col.currency ? `${col.label} (${col.currency})` : col.label).join(locale === "ar" ? "، " : ", ") });
	const data = useMemo(() => theme ? chartData(model, theme) : null, [model, theme]);
	const unsafe = data?.datasets.some((dataset) => dataset.data.includes(null)) ?? false;
	return <>
		{model.tz || model.asOf ? <p className="sy-chart__meta"><Bdi>{model.tz}</Bdi>{model.asOf ? <Bdi>{t("charts.asOf", { date: formatDateTime(model.asOf, locale, { timeZone: model.tz ?? "UTC" }) })}</Bdi> : null}</p> : null}
		{empty ? <div role="status"><EmptyState title={t(model.scope === "assigned" ? "charts.emptyMine" : "charts.empty")} action={emptyAction} /></div> : <>
			<p className="sy-chart__status" role="status" aria-live="polite">{t("charts.ready")}</p>
			<div className="sy-chart__canvas" dir={dir}>
				{data && theme ? <ChartCanvas model={model} theme={theme} locale={locale} reducedMotion={reducedMotion} label={label} tableId={tableId} /> : <SkeletonRows count={3} />}
			</div>
		</>}
		{unsafe ? <p className="sy-chart__meta">{t("charts.largeValues")}</p> : null}
		{model.rows.length > 0 ? <details className="sy-chart__details" open={unsafe || undefined}>
			<summary>{t("charts.showTable")}</summary>
			{/* biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard users must be able to scroll an overflowing data table */}
			<section className="sy-chart__table" tabIndex={0} aria-label={t("charts.table")}>
				<table id={tableId}>
					<caption>{label}</caption>
					<thead><tr><th scope="col">{model.rowLabel}</th>{model.columns.map((col) => <th key={col.key} scope="col"><Bdi>{col.label}</Bdi>{col.currency ? <> <Bdi>{col.currency}</Bdi></> : null}</th>)}</tr></thead>
					<tbody>{model.rows.map((row) => <tr key={row.key}><th scope="row"><Bdi>{row.label}</Bdi></th>{model.columns.map((col) => <td key={col.key}><Bdi>{formatChartValue(row.values[col.key], col, locale)}</Bdi></td>)}</tr>)}</tbody>
				</table>
			</section>
		</details> : null}
	</>;
}

/** One local state per widget; ready tables retain zero rows even when the plot is empty. */
export function ChartSurface({ title, state, onRetry, actions, summary, emptyAction, className }: {
	title: string; state: ChartState; onRetry: () => void; actions?: ReactNode; summary?: ReactNode; emptyAction?: ReactNode; className?: string;
}) {
	const { t, dir } = useI18n();
	const id = useId();
	const model = state.status === "ready" || state.status === "empty" ? state.model : null;
	const heading = model?.scope === "assigned" ? t("charts.scopedTitle", { title, scope: t("charts.mine") }) : title;
	return <Panel title={heading} actions={actions} className={`sy-chart${className ? ` ${className}` : ""}`} dir={dir} aria-label={heading}>
		{state.status === "loading" ? <SkeletonRows count={3} label={t("charts.loading", { title })} /> : null}
		{state.status === "forbidden" ? <div role="status"><ForbiddenState title={t("charts.forbidden")} /></div> : null}
		{state.status === "error" ? <ErrorState title={t("charts.error")} requestId={state.requestId} onRetry={onRetry} /> : null}
		{model ? <><div key={`${id}-${model.scope}`}>{summary}</div><ReadyChart key={model.scope} title={title} model={model} empty={state.status === "empty"} emptyAction={emptyAction} /></> : null}
	</Panel>;
}
