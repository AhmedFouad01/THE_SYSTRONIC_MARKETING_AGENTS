import { afterEach, describe, expect, it, vi } from "vitest";
import type { TooltipItem, TooltipModel } from "chart.js";
import { createApiClient } from "../../api/client.ts";
import { ApiError } from "../../api/errors.ts";
import { ar } from "../../ui/i18n/ar.ts";
import { en } from "../../ui/i18n/en.ts";
import { interpolate } from "../../ui/i18n/format.ts";
import { chartData, chartOptions, chartState, formatChartValue, resolveChartTheme, type ChartKind } from "./charts/model.ts";
import { browserTimezone, fetchOutcomes, outcomesChart, outcomesCurrencies, outcomesCurrency, outcomesQuery, type OutcomesPayload } from "./outcomes.ts";
const payload: OutcomesPayload = {
	scope: "assigned", as_of: "2026-10-08T00:00:00Z", tz: "Africa/Cairo", bucket: "month", periods: 12,
	from: "2026-08-01", to: "2026-11-01", buckets: [
		{ start: "2026-10-01", end: "2026-11-01", won: { count: 2, totals: [{ currency: "EGP", amount_minor: "9007199254740993123" }, { currency: "USD", amount_minor: "501" }] }, lost: { count: 1, totals: [{ currency: "EGP", amount_minor: "1234" }] } },
		{ start: "2026-08-01", end: "2026-09-01", won: { count: 1, totals: [{ currency: "USD", amount_minor: "222" }] }, lost: { count: 1, totals: [{ currency: "JPY", amount_minor: "500" }] } },
	],
};
const t = (key: keyof typeof en, vars?: Record<string, string | number>) => interpolate(en[key], vars);
const theme = resolveChartTheme((name) => name);
const response = (data: OutcomesPayload) => new Response(JSON.stringify({ data }), { status: 200 });
const clientFor = (fetchImpl: typeof fetch) => createApiClient({ getCredentials: () => ({ token: "synthetic", tenantId: "synthetic" }), fetchImpl });
afterEach(() => vi.restoreAllMocks());

describe("outcomes requests and contract boundary", () => {
	it("default is12months in browser IANA timezone, without a weekly parameter", () => {
		const original = Intl.DateTimeFormat().resolvedOptions();
		vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockReturnValue({ ...original, timeZone: "Africa/Cairo" });
		expect(browserTimezone()).toBe("Africa/Cairo");
		expect(outcomesQuery()).toEqual({ bucket: "month", periods: 12, tz: "Africa/Cairo" });
	});
	it("week view requests exactly12Saturday weeks without relabeling aggregates", () => {
		expect(outcomesQuery("week", "Pacific/Kiritimati")).toEqual({ bucket: "week", periods: 12, tz: "Pacific/Kiritimati", week_start: "saturday" });
	});
	it("fetches month/week actual endpoint with timezone and AbortSignal", async () => {
		const fetchImpl = vi.fn<typeof fetch>().mockResolvedValueOnce(response(payload)).mockResolvedValueOnce(response({ ...payload, bucket: "week", week_start: "saturday" }));
		const client = clientFor(fetchImpl);
		const signal = new AbortController().signal;
		expect(await fetchOutcomes("month", "Africa/Cairo", signal, client)).toEqual(payload);
		await fetchOutcomes("week", "Africa/Cairo", signal, client);
		expect(fetchImpl.mock.calls[0][0]).toBe("/v1/dashboard/deals-outcomes?bucket=month&periods=12&tz=Africa%2FCairo");
		expect(fetchImpl.mock.calls[1][0]).toBe("/v1/dashboard/deals-outcomes?bucket=week&periods=12&tz=Africa%2FCairo&week_start=saturday");
		expect(fetchImpl.mock.calls[1][1]).toMatchObject({ signal, method: "GET" });
	});
	it("old Monday or missing-week-start responses fail this widget instead of being relabeled", async () => {
		for (const week_start of ["monday", undefined] as const) {
			const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(response({ ...payload, bucket: "week", week_start }));
			await expect(fetchOutcomes("week", "Africa/Cairo", new AbortController().signal, clientFor(fetchImpl))).rejects.toMatchObject({ code: "CHARTS_CONTRACT_MISMATCH" });
		}
	});
	it("mismatched bucket/timezone responses fail safely through existing widget state", async () => {
		for (const data of [{ ...payload, bucket: "week" as const }, { ...payload, tz: "UTC" }]) {
			const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(response(data));
			await expect(fetchOutcomes("month", "Africa/Cairo", new AbortController().signal, clientFor(fetchImpl))).rejects.toBeInstanceOf(ApiError);
		}
	});
});
describe("outcomes chart adapter", () => {
	it("chronological buckets stay oldest-first in both locales without changing payload dates", () => {
		for (const locale of ["ar", "en"] as const) {
			const model = outcomesChart(payload, "", locale, t);
			expect(model.rows.map((row) => row.key)).toEqual(["2026-08-01", "2026-10-01"]);
			expect(chartOptions(model, locale, false, theme).scales?.x).toMatchObject({ reverse: false });
		}
		expect(payload.buckets[0].start).toBe("2026-10-01");
	});
	it("response scope/as_of/timezone and real calendar range are retained", () => {
		const model = outcomesChart(payload, "", "en", t);
		expect(model).toMatchObject({ scope: "assigned", asOf: payload.as_of, tz: "Africa/Cairo", from: "2026-08-01", to: "2026-11-01" });
		expect(model.rows[0].label).toContain("Aug");
		expect(model.rows[0].label).toContain("Sep");
		expect(model.rowLabel).toContain("end exclusive");
	});
	it("counts-only is default; optional single currency creates exactly one won-value line", () => {
		const plain = outcomesChart(payload, "", "en", t);
		expect(plain.columns).toHaveLength(2);
		const money = outcomesChart(payload, "USD", "en", t);
		const data = chartData(money, theme);
		expect(data.datasets.map((dataset) => dataset.type)).toEqual(["bar", "bar", "line"]);
		expect(data.datasets[2].yAxisID).toBe("money");
		expect(data.datasets[2].order).toBeLessThan(data.datasets[0].order ?? 1);
		expect(money.columns.filter((col) => col.kind === "money").every((col) => col.currency === "USD")).toBe(true);
	});
	it("currency values never combine; missing currency per bucket is zero, unavailable choice turns line off", () => {
		expect(outcomesCurrencies(payload)).toEqual(["EGP", "JPY", "USD"]);
		expect(outcomesCurrency(payload, "gone")).toBe("");
		const egp = outcomesChart(payload, "EGP", "en", t);
		const usd = outcomesChart(payload, "USD", "en", t);
		expect(egp.rows[1].values.wonValue).toBe("9007199254740993123");
		expect(usd.rows[1].values.wonValue).toBe("501");
		expect(egp.rows[0].values.wonValue).toBe("0");
		expect(usd.rows[1].values.lostValue).toBe("0");
	});
	it("unsafe plot values become gaps while exact table and tooltip retain all money digits", () => {
		const model = outcomesChart(payload, "EGP", "en", t);
		const data = chartData(model, theme);
		expect(data.datasets[2].data).toEqual([0, null]);
		const value = formatChartValue(model.rows[1].values.wonValue, model.columns[2], "en");
		expect(value).toContain("90,071,992,547,409,931.23");
		const callback = chartOptions(model, "en", false, theme).plugins?.tooltip?.callbacks?.label;
		expect(callback?.call({} as TooltipModel<ChartKind>, { datasetIndex: 2, dataIndex: 1 } as TooltipItem<ChartKind>)).toContain(`\u2068Won value: ${value}\u2069`);
	});
	it("Arabic date ranges, status labels and exact money digits are localized", () => {
		const model = outcomesChart(payload, "EGP", "ar", (key, vars) => interpolate(ar[key], vars));
		expect(model.columns[0].label).toBe("الصفقات الرابحة");
		expect(model.rows[0].label).toMatch(/[٠-٩]/);
		expect(formatChartValue(model.rows[1].values.wonValue, model.columns[2], "ar")).toContain("٩٠٬٠٧١٬٩٩٢٬٥٤٧٬٤٠٩٬٩٣١٫٢٣");
	});
	it("zero-filled series stays intact and empty even with no monetary currency", () => {
		const zero: OutcomesPayload = { ...payload, buckets: payload.buckets.map((bucket) => ({ ...bucket, won: { count: 0, totals: [] }, lost: { count: 0, totals: [] } })) };
		const state = chartState({ status: "ready", data: zero }, (data) => outcomesChart(data, "", "en", t));
		expect(state.status).toBe("empty");
		if (state.status === "empty") expect(state.model.rows).toHaveLength(2);
		expect(outcomesCurrencies(zero)).toEqual([]);
	});
});
