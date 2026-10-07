import { afterEach, describe, expect, it, vi } from "vitest";
import { createApiClient } from "../../api/client.ts";
import { ApiError } from "../../api/errors.ts";
import { ar } from "../../ui/i18n/ar.ts";
import { en } from "../../ui/i18n/en.ts";
import { interpolate } from "../../ui/i18n/format.ts";
import { lightColors, darkColors } from "../../ui/tokens/colors.ts";
import { chartData, chartOptions, chartState, resolveChartTheme } from "./charts/model.ts";
import { activityChart, activityQuery, activitySeries, fetchActivity, type ActivityPayload } from "./activity.ts";
import { dashboardChartOrder } from "./composition.ts";
const payload: ActivityPayload = {
	scope: "assigned", as_of: "2026-10-08T12:00:00Z", tz: "Africa/Cairo", bucket: "week", week_start: "saturday", periods: 12,
	from: "2026-07-18", to: "2026-10-10", buckets: Array.from({ length: 12 }, (_, index) => {
		const start = new Date("2026-07-18T00:00:00Z"); start.setUTCDate(start.getUTCDate() + index * 7);
		const end = new Date(start); end.setUTCDate(end.getUTCDate() + 7);
		return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10), contacts_created: index, leads_created: index + 1, deals_created: index + 2, tasks_created: index + 3, tasks_completed: index + 4 };
	}),
};
const t = (key: keyof typeof en, vars?: Record<string, string | number>) => interpolate(en[key], vars);
const theme = resolveChartTheme((name) => name);
const clientFor = (data: ActivityPayload) => {
	const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ data, request_id: "synthetic" }), { status: 200 }));
	return { fetchImpl, client: createApiClient({ getCredentials: () => ({ token: "synthetic", tenantId: "synthetic" }), fetchImpl }) };
};
afterEach(() => vi.restoreAllMocks());
describe("activity aggregate and composition", () => {
	it("requests exactly 12 Saturday weeks in browser IANA timezone", () => {
		const original = Intl.DateTimeFormat().resolvedOptions();
		vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockReturnValue({ ...original, timeZone: "Africa/Cairo" });
		expect(activityQuery()).toEqual({ bucket: "week", periods: 12, tz: "Africa/Cairo", week_start: "saturday" });
	});
	it("fetches actual activity endpoint with explicit timezone and signal", async () => {
		const { client, fetchImpl } = clientFor(payload); const signal = new AbortController().signal;
		expect(await fetchActivity("Africa/Cairo", signal, client)).toEqual(payload);
		expect(fetchImpl.mock.calls[0][0]).toBe("/v1/dashboard/activity?bucket=week&periods=12&tz=Africa%2FCairo&week_start=saturday");
		expect(fetchImpl.mock.calls[0][1]).toMatchObject({ signal, method: "GET" });
	});
	it("wrong week start, bucket, periods or timezone cannot be relabeled", async () => {
		for (const changed of [{ week_start: "monday" }, { week_start: undefined }, { bucket: "month" }, { periods: 11 }, { tz: "UTC" }]) {
			const { client } = clientFor({ ...payload, ...changed } as ActivityPayload);
			await expect(fetchActivity("Africa/Cairo", new AbortController().signal, client)).rejects.toMatchObject({ code: "CHARTS_CONTRACT_MISMATCH" });
		}
	});
	it("maps all five record/completion measures to exact matching table and chart rows", () => {
		const model = activityChart(payload, "en", t); const data = chartData(model, theme);
		expect(model.columns.map((column) => column.key)).toEqual([...activitySeries]);
		expect(model.rows).toHaveLength(12); expect(data.datasets).toHaveLength(5);
		for (const [index, key] of activitySeries.entries()) {
			expect(data.datasets[index].data).toEqual(payload.buckets.map((bucket) => bucket[key]));
			expect(model.rows.map((row) => row.values[key])).toEqual(data.datasets[index].data);
		}
		expect(model.rows[0].values).toEqual({ contacts_created: 0, leads_created: 1, deals_created: 2, tasks_created: 3, tasks_completed: 4 });
	});
	it("five series have unique markers, dash patterns and semantic palette colors", () => {
		const datasets = chartData(activityChart(payload, "en", t), theme).datasets;
		expect(new Set(datasets.map((dataset) => dataset.pointStyle)).size).toBe(5);
		expect(new Set(datasets.map((dataset) => JSON.stringify("borderDash" in dataset ? dataset.borderDash : undefined))).size).toBe(5);
		expect(new Set(datasets.map((dataset) => dataset.borderColor)).size).toBe(5);
		expect(datasets.every((dataset) => dataset.type === "line")).toBe(true);
	});
	it("chronological Saturday ranges stay unchanged in Arabic and English", () => {
		const reversed = { ...payload, buckets: [...payload.buckets].reverse() };
		for (const locale of ["ar", "en"] as const) {
			const model = activityChart(reversed, locale, t);
			expect(model.rows.map((row) => row.key)).toEqual(payload.buckets.map((bucket) => bucket.start));
			expect(chartOptions(model, locale, false, theme).scales?.x).toMatchObject({ reverse: false });
		}
		expect(reversed.buckets[0].start).toBe(payload.buckets[11].start);
	});
	it("Arabic labels and dates are localized with RTL legend/tooltip and reduced motion", () => {
		const model = activityChart(payload, "ar", (key, vars) => interpolate(ar[key], vars));
		expect(model.columns[4].label).toBe("مهام مكتملة"); expect(model.rows[0].label).toContain("١٨");
		const options = chartOptions(model, "ar", true, theme);
		expect(options.animation).toBe(false);
		expect(options.plugins?.legend).toMatchObject({ rtl: true, textDirection: "rtl" });
		expect(options.plugins?.tooltip).toMatchObject({ rtl: true, textDirection: "rtl" });
	});
	it("scope, timezone, as_of and exclusive period metadata remain authoritative", () => {
		expect(activityChart(payload, "en", t)).toMatchObject({ scope: "assigned", tz: payload.tz, asOf: payload.as_of, from: payload.from, to: payload.to });
		const tenant = activityChart({ ...payload, scope: "tenant" }, "en", t);
		expect(tenant.scope).toBe("tenant"); expect(tenant.rows).toEqual(activityChart(payload, "en", t).rows);
	});
	it("all zero series use empty state with all 12 table rows retained", () => {
		const zero = { ...payload, buckets: payload.buckets.map((bucket) => ({ ...bucket, contacts_created: 0, leads_created: 0, deals_created: 0, tasks_created: 0, tasks_completed: 0 })) };
		expect(chartState({ status: "ready", data: zero }, (data) => activityChart(data, "en", t))).toMatchObject({ status: "empty", model: { rows: expect.any(Array) } });
		expect(activityChart(zero, "en", t).rows).toHaveLength(12);
	});
	it("403 remains local while healthy widgets remain ready", () => {
		const error = new ApiError({ status: 403, code: "FORBIDDEN", safeMessage: "", requestId: null, retryable: false });
		expect(chartState({ status: "error", error }, (data: ActivityPayload) => activityChart(data, "en", t))).toEqual({ status: "forbidden" });
		expect(chartState({ status: "ready", data: payload }, (data) => activityChart(data, "en", t)).status).toBe("ready");
	});
	it("M/R tenant order and rep assigned order match NAV_AND_SCREENS", () => {
		expect(dashboardChartOrder("tenant")).toEqual(["pipeline", "leads", "outcomes", "tasks", "activity"]);
		expect(dashboardChartOrder("assigned")).toEqual(["tasks", "pipeline", "leads", "outcomes", "activity"]);
		expect(dashboardChartOrder()).toEqual(dashboardChartOrder("tenant"));
		for (const scope of ["tenant", "assigned"] as const) expect(new Set(dashboardChartOrder(scope)).size).toBe(5);
	});
});
function luminance(color: string) {
	const rgb = [1, 3, 5].map((start) => Number.parseInt(color.slice(start, start + 2), 16) / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
	return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function contrast(a: string, b: string) { const [low, high] = [luminance(a), luminance(b)].sort((x, y) => x - y); return (high + 0.05) / (low + 0.05); }
for (const [mode, colors] of [["light", lightColors], ["dark", darkColors]] as const) {
	it(`${mode} actual activity tokens meet text 4.5:1 and graphics/focus 3:1 contrast`, () => {
		for (const text of [colors.text, colors.text2, colors.interactive]) expect(contrast(text, colors.surface)).toBeGreaterThanOrEqual(4.5);
		for (const graphic of [colors.chart1, colors.chart2, colors.chart3, colors.chart4, colors.chart5, colors.focus]) expect(contrast(graphic, colors.surface)).toBeGreaterThanOrEqual(3);
	});
}
