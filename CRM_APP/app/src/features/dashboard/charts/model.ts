import type { ChartData, ChartOptions, PointStyle } from "chart.js";
import { isApiError, isForbidden } from "../../../api/errors.ts";
import { currencyExponent, formatCount, INTL_LOCALE } from "../../../ui/i18n/format.ts";
import type { Locale } from "../../../ui/tokens/scales.ts";
import { toBig } from "../../reporting/model.ts";
import type { Load } from "../useLoad.ts";

export type ChartKind = "bar" | "line";
export type ChartScope = "tenant" | "assigned";
export type ChartValue = number | string;
export type ChartColumn = {
	key: string; label: string; kind: "count" | "money"; currency?: string;
	plot?: boolean; type?: ChartKind; color?: "success" | "danger";
};
export type ChartRow = { key: string; label: string; values: Record<string, ChartValue> };
/** Both canvas and table consume these rows. Money stays a decimal minor-unit string. */
export type ChartModel = {
	scope: ChartScope; rowLabel: string; columns: ChartColumn[]; rows: ChartRow[];
	type?: ChartKind; horizontal?: boolean; stacked?: boolean;
	asOf?: string | null; tz?: string; from?: string; to?: string;
};
export type ChartState =
	| { status: "loading" | "forbidden" }
	| { status: "error"; requestId: string | null }
	| { status: "empty" | "ready"; model: ChartModel };
export function chartState<T>(load: Load<T>, adapt: (data: T) => ChartModel): ChartState {
	if (load.status === "loading") return { status: "loading" };
	if (load.status === "error") return isForbidden(load.error)
		? { status: "forbidden" }
		: { status: "error", requestId: isApiError(load.error) ? load.error.requestId : null };
	const model = adapt(load.data);
	const empty = model.rows.every((row) => model.columns.every((col) => toBig(row.values[col.key]) === 0n));
	return { status: empty ? "empty" : "ready", model };
}
export const scopeKey = (scope: ChartScope) => scope === "assigned" ? "charts.mine" : "charts.tenant";

/** Format the integer and fractional currency parts independently, without a lossy Number conversion. */
export function formatChartMoney(value: ChartValue, currency: string, locale: Locale): string {
	const minor = toBig(value);
	const negative = minor < 0n;
	const absolute = negative ? -minor : minor;
	const exponent = currencyExponent(currency);
	const scale = 10n ** BigInt(exponent);
	const whole = absolute / scale;
	const signed = negative ? (whole === 0n ? -0 : -whole) : whole;
	const fraction = new Intl.NumberFormat(INTL_LOCALE[locale], {
		useGrouping: false, minimumIntegerDigits: Math.max(1, exponent), maximumFractionDigits: 0,
	}).format(absolute % scale);
	return new Intl.NumberFormat(INTL_LOCALE[locale], {
		style: "currency", currency, minimumFractionDigits: exponent, maximumFractionDigits: exponent,
	}).formatToParts(signed).map((part) => {
		if (part.type === "fraction") return fraction;
		if (part.type === "currency" && locale === "ar") return part.value.replace(/\.$/, "");
		return part.value;
	}).join("");
}
export function formatChartValue(value: ChartValue, column: ChartColumn, locale: Locale): string {
	if (column.kind === "money" && column.currency) return formatChartMoney(value, column.currency, locale);
	return new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 0 }).format(toBig(value));
}
/** Canvas is numeric: retain unsafe amounts exactly in the table instead of rounding them. */
export function plotValue(value: ChartValue, column: ChartColumn): number | null {
	const big = toBig(value);
	if (big > BigInt(Number.MAX_SAFE_INTEGER) || big < BigInt(Number.MIN_SAFE_INTEGER)) return null;
	return Number(big) / (column.kind === "money" ? 10 ** currencyExponent(column.currency ?? "EGP") : 1);
}
export const isolateCanvas = (value: string) => `\u2068${value}\u2069`;
export type ChartTheme = { text: string; grid: string; surface: string; success: string; danger: string; font: string; palette: string[] };
export function resolveChartTheme(read: (name: string) => string): ChartTheme {
	return {
		text: read("--sy-text"), grid: read("--sy-border"), surface: read("--sy-surface"),
		success: read("--sy-success-fg"), danger: read("--sy-danger-fg"), font: read("--sy-font-data"),
		palette: Array.from({ length: 8 }, (_, i) => read(`--sy-chart-${i + 1}`)),
	};
}
const markers: PointStyle[] = ["circle", "rect", "triangle", "rectRot", "crossRot"];
const dashes = [[], [6, 3], [2, 3], [10, 3, 2, 3], [3, 2, 3, 6]];
export function chartData(model: ChartModel, theme: ChartTheme): ChartData<ChartKind, (number | null)[], string> {
	return {
		labels: model.rows.map((row) => isolateCanvas(row.label)),
		datasets: model.columns.filter((col) => col.plot !== false).map((col, i) => ({
			label: isolateCanvas(col.label), type: col.type ?? model.type ?? "bar",
			data: model.rows.map((row) => plotValue(row.values[col.key], col)),
			backgroundColor: col.color ? theme[col.color] : theme.palette[i % theme.palette.length],
			borderColor: col.color ? theme[col.color] : theme.palette[i % theme.palette.length],
			borderWidth: 2, pointStyle: markers[i % markers.length], borderDash: dashes[i % dashes.length],
			pointRadius: 3, tension: 0.2, spanGaps: false,
			yAxisID: col.kind === "money" && !model.horizontal ? "money" : "y",
		})),
	};
}
export function chartOptions(model: ChartModel, locale: Locale, reduced: boolean, theme: ChartTheme): ChartOptions<ChartKind> {
	const rtl = locale === "ar";
	const direction = rtl ? "rtl" : "ltr";
	const plotted = model.columns.filter((col) => col.plot !== false);
	return {
		responsive: true, maintainAspectRatio: false, locale: INTL_LOCALE[locale],
		animation: reduced ? false : { duration: 250 },
		indexAxis: model.horizontal ? "y" : "x", color: theme.text, font: { family: theme.font },
		plugins: {
			legend: { rtl, textDirection: direction, labels: { color: theme.text, usePointStyle: true, font: { family: theme.font } } },
			tooltip: {
				rtl, textDirection: direction, backgroundColor: theme.surface,
				titleColor: theme.text, bodyColor: theme.text, borderColor: theme.grid, borderWidth: 1,
				callbacks: { label: (item) => {
					const col = plotted[item.datasetIndex];
					const row = model.rows[item.dataIndex];
					return isolateCanvas(`${col.label}: ${formatChartValue(row.values[col.key], col, locale)}`);
				} },
			},
		},
		scales: {
			x: { reverse: Boolean(model.horizontal && rtl), stacked: model.stacked, grid: { color: theme.grid }, ticks: { color: theme.text, ...(model.horizontal ? { callback: (v) => formatCount(Number(v), locale) } : {}) } },
			y: { beginAtZero: true, stacked: model.stacked, grid: { color: theme.grid }, ticks: { color: theme.text, ...(!model.horizontal ? { callback: (v) => formatCount(Number(v), locale) } : {}) } },
			...(plotted.some((col) => col.kind === "money") && !model.horizontal ? {
				money: { type: "linear" as const, position: rtl ? "left" as const : "right" as const, beginAtZero: true, grid: { drawOnChartArea: false }, ticks: { color: theme.text } },
			} : {}),
		},
	};
}
