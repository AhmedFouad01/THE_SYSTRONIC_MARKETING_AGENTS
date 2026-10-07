import { describe, expect, it, vi } from "vitest";
import { createApiClient } from "../../api/client.ts";
import { ApiError } from "../../api/errors.ts";
import { ar } from "../../ui/i18n/ar.ts";
import { en } from "../../ui/i18n/en.ts";
import { interpolate } from "../../ui/i18n/format.ts";
import { chartData, chartOptions, chartState, isolateCanvas, resolveChartTheme } from "./charts/model.ts";
import { fetchLeadsAggregate, leadsChart, leadsKpis, type LeadsPayload } from "./leads.ts";
const payload: LeadsPayload = {
	scope: "assigned", total: 26, by_status: { open: 24, qualified: 1, closed: 1 },
	sources: [{ source: "web عميل", open: 2, qualified: 1, closed: 0, total: 3 }, { source: "other", open: 0, qualified: 0, closed: 1, total: 1 }, { source: "bulk", open: 18, qualified: 0, closed: 0, total: 18 }],
	other: { source_count: 4, open: 4, qualified: 0, closed: 0, total: 4 },
};
const t = (key: keyof typeof en, vars?: Record<string, string | number>) => interpolate(en[key], vars);
const theme = resolveChartTheme((name) => name);

describe("leads aggregate adapter", () => {
	it("status KPI strip uses authoritative server statuses and overall total", () => {
		expect(leadsKpis(payload)).toEqual([{ key: "open", value: 24 }, { key: "qualified", value: 1 }, { key: "closed", value: 1 }, { key: "total", value: 26 }]);
	});
	it("preserves source order and appends server Other once with its source count", () => {
		const model = leadsChart(payload, "en", t);
		expect(model.rows.map((row) => row.label)).toEqual(["web عميل", "other", "bulk", "Other (4 sources)"]);
		expect(model.rows[3].values).toEqual({ open: 4, qualified: 0, closed: 0, total: 4 });
		expect(model.rows[3].tone).toBe("muted");
		expect(model.rows.map((row) => row.key)).toEqual(["source:web عميل", "source:other", "source:bulk", "other"]);
	});
	it("top-source and Other totals equal status KPIs without duplicate aggregation", () => {
		const model = leadsChart(payload, "en", t);
		for (const { key, value } of leadsKpis(payload))
			expect(model.rows.reduce((sum, row) => sum + Number(row.values[key]), 0)).toBe(value);
		for (const row of model.rows)
			expect(Number(row.values.open) + Number(row.values.qualified) + Number(row.values.closed)).toBe(row.values.total);
	});
	it("no Other payload creates no synthetic group", () => {
		const data = { ...payload, other: null };
		expect(leadsChart(data, "en", t).rows).toHaveLength(3);
	});
	it("Other with no top sources remains a single valid row", () => {
		const data = { ...payload, sources: [] };
		expect(leadsChart(data, "en", t).rows.map((row) => row.key)).toEqual(["other"]);
	});
	it("Arabic status/source labels and Other count are localized", () => {
		const model = leadsChart(payload, "ar", (key, vars) => interpolate(ar[key], vars));
		expect(model.rowLabel).toBe("المصدر");
		expect(model.columns.map((col) => col.label)).toEqual(["مفتوح", "مؤهل", "مغلق", "الإجمالي"]);
		expect(model.rows[3].label).toBe("أخرى (٤ مصادر)");
	});
	it("three stacks and table totals come from identical row values; Other muted", () => {
		const model = leadsChart(payload, "en", t);
		const data = chartData(model, theme);
		expect(data.datasets).toHaveLength(3);
		for (const [index, key] of ["open", "qualified", "closed"].entries())
			expect(data.datasets[index].data).toEqual(model.rows.map((row) => row.values[key]));
		expect(data.labels).toEqual(model.rows.map((row) => isolateCanvas(row.label)));
		expect(data.datasets[0].backgroundColor).toEqual(["--sy-chart-1", "--sy-chart-1", "--sy-chart-1", "--sy-text-3"]);
		const options = chartOptions(model, "ar", false, theme);
		expect(options.indexAxis).toBe("y");
		expect(options.scales?.x).toMatchObject({ stacked: true, reverse: true });
		expect(options.scales?.y).toMatchObject({ stacked: true });
	});
	it("Mine comes from response scope; rows are never refiltered by local actor", () => {
		const assigned = leadsChart(payload, "en", t);
		const tenant = leadsChart({ ...payload, scope: "tenant" }, "en", t);
		expect(assigned.scope).toBe("assigned");
		expect(tenant.scope).toBe("tenant");
		expect(assigned.rows).toEqual(tenant.rows);
	});
	it("empty and zero data show truthful empty states with zero status totals", () => {
		const empty: LeadsPayload = { scope: "assigned", total: 0, by_status: { open: 0, qualified: 0, closed: 0 }, sources: [], other: null };
		expect(chartState({ status: "ready", data: empty }, (data) => leadsChart(data, "en", t))).toMatchObject({ status: "empty", model: { scope: "assigned", rows: [] } });
		expect(leadsKpis(empty).every((kpi) => kpi.value === 0)).toBe(true);
	});
	it("a forbidden leads request does not replace another widget's healthy model", () => {
		const error = new ApiError({ status: 403, code: "FORBIDDEN", safeMessage: "", requestId: null, retryable: false });
		expect(chartState({ status: "error", error }, () => leadsChart(payload, "en", t))).toEqual({ status: "forbidden" });
		expect(chartState({ status: "ready", data: payload }, (data) => leadsChart(data, "en", t)).status).toBe("ready");
	});
	it("fetches the real leads-breakdown endpoint with the existing headers/envelope/signal", async () => {
		const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ data: payload, request_id: "synthetic" }), { status: 200 }));
		const client = createApiClient({ getCredentials: () => ({ token: "synthetic", tenantId: "synthetic" }), fetchImpl });
		const controller = new AbortController();
		expect(await fetchLeadsAggregate(controller.signal, client)).toEqual(payload);
		expect(fetchImpl.mock.calls[0][0]).toBe("/v1/dashboard/leads-breakdown");
		expect(fetchImpl.mock.calls[0][1]).toMatchObject({ method: "GET", signal: controller.signal });
	});
});
