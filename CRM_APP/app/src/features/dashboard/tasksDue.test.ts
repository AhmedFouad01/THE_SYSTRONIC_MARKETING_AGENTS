import { describe, expect, it, vi } from "vitest";
import { createApiClient } from "../../api/client.ts";
import { ApiError } from "../../api/errors.ts";
import { ar } from "../../ui/i18n/ar.ts";
import { en } from "../../ui/i18n/en.ts";
import { interpolate } from "../../ui/i18n/format.ts";
import { chartData, chartOptions, chartState, formatChartValue, resolveChartTheme } from "./charts/model.ts";
import { fetchTasksDue, tasksDueChart, tasksDueKpis, tasksDueState, type TasksDuePayload } from "./tasksDue.ts";
const payload: TasksDuePayload = {
	scope: "assigned", as_of: "2026-10-08T10:00:00Z", tz: "Africa/Cairo", today: "2026-10-08",
	open_total: 167, overdue: 101, next_24h: 33, later: 31,
	days: [11, 12, 0, 2, 4, 0, 6].map((count, index) => ({ date: `2026-10-${8 + index < 10 ? "0" : ""}${8 + index}`, count })),
};
const t = (key: keyof typeof en, vars?: Record<string, string | number>) => interpolate(en[key], vars);
const theme = resolveChartTheme((name) => name);

describe("tasks-due aggregate adapter", () => {
	it("exact KPI counts exceed page limits and preserve the overlapping next24 value", () => {
		expect(tasksDueKpis(payload)).toEqual({ overdue: 101, next24h: 33, openTotal: 167 });
	});
	it("partition sums overdue + seven days + later without next24", () => {
		const model = tasksDueChart(payload, "en", t);
		expect(model.rows).toHaveLength(9);
		expect(model.rows.reduce((sum, row) => sum + Number(row.values.count), 0)).toBe(payload.open_total);
		expect(model.rows.map((row) => row.key)).toEqual(["overdue", ...payload.days.map((day) => day.date), "later"]);
		expect(model.rows.some((row) => row.key === "next_24h")).toBe(false);
	});
	it("changing the overlapping KPI never changes chart or partition total", () => {
		const changed = { ...payload, next_24h: 22 };
		expect(tasksDueChart(changed, "en", t)).toEqual(tasksDueChart(payload, "en", t));
		expect(tasksDueKpis(changed).next24h).toBe(22);
	});
	it("chart and accessible table share count rows with danger/muted end bars", () => {
		const model = tasksDueChart(payload, "en", t);
		const data = chartData(model, theme);
		expect(data.datasets).toHaveLength(1);
		expect(data.datasets[0].data).toEqual([101, 11, 12, 0, 2, 4, 0, 6, 31]);
		expect(model.rows[0].tone).toBe("danger");
		expect(model.rows[8].tone).toBe("muted");
	});
	it("server local dates retain order and zeros; Arabic does not reverse time", () => {
		const copy = structuredClone(payload);
		const model = tasksDueChart(payload, "ar", (key, vars) => interpolate(ar[key], vars));
		expect(model.rows[1].label).toContain("٨");
		expect(model.rows[7].label).toContain("١٤");
		expect(model.rows[8].label).toBe("لاحقًا");
		expect(chartOptions(model, "ar", false, theme).scales?.x).toMatchObject({ reverse: false });
		expect(formatChartValue(101, model.columns[0], "ar")).toBe("١٠١");
		expect(payload).toEqual(copy);
	});
	it("zero snapshot shows empty state while keeping nine table rows and exact zero KPIs", () => {
		const zero: TasksDuePayload = { ...payload, open_total: 0, overdue: 0, next_24h: 0, later: 0, days: payload.days.map((day) => ({ ...day, count: 0 })) };
		expect(chartState({ status: "ready", data: zero }, (data) => tasksDueChart(data, "en", t))).toMatchObject({ status: "empty", model: { rows: expect.arrayContaining([expect.objectContaining({ key: "overdue" })]) } });
		expect(tasksDueChart(zero, "en", t).rows).toHaveLength(9);
		expect(tasksDueKpis(zero)).toEqual({ overdue: 0, next24h: 0, openTotal: 0 });
	});
	it("response scope and snapshot metadata stay authoritative without assignment refiltering", () => {
		const assigned = tasksDueChart(payload, "en", t);
		const tenant = tasksDueChart({ ...payload, scope: "tenant" }, "en", t);
		expect(assigned).toMatchObject({ scope: "assigned", asOf: payload.as_of, tz: payload.tz });
		expect(tenant.scope).toBe("tenant");
		expect(assigned.rows).toEqual(tenant.rows);
	});
	it("prior authority data is hidden while a new scoped request begins", () => {
		expect(tasksDueState({ status: "ready", data: { key: "old", data: payload } }, "new")).toEqual({ status: "loading" });
		expect(tasksDueState({ status: "ready", data: { key: "new", data: payload } }, "new")).toEqual({ status: "ready", data: payload });
	});
	it("local loading/error/403 states remain independent from healthy charts", () => {
		const error = new ApiError({ status: 403, code: "FORBIDDEN", safeMessage: "", requestId: null, retryable: false });
		expect(chartState({ status: "error", error }, (data: TasksDuePayload) => tasksDueChart(data, "en", t))).toEqual({ status: "forbidden" });
		expect(chartState({ status: "loading" }, (data: TasksDuePayload) => tasksDueChart(data, "en", t))).toEqual({ status: "loading" });
		expect(chartState({ status: "error", error: new Error("synthetic") }, (data: TasksDuePayload) => tasksDueChart(data, "en", t))).toEqual({ status: "error", requestId: null });
		expect(chartState({ status: "ready", data: payload }, (data) => tasksDueChart(data, "en", t)).status).toBe("ready");
	});
	it("fetches actual endpoint with browser timezone query, shared envelope and signal", async () => {
		const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ data: payload, request_id: "synthetic" }), { status: 200 }));
		const client = createApiClient({ getCredentials: () => ({ token: "synthetic", tenantId: "synthetic" }), fetchImpl });
		const controller = new AbortController();
		expect(await fetchTasksDue("Africa/Cairo", controller.signal, client)).toEqual(payload);
		expect(fetchImpl.mock.calls[0][0]).toBe("/v1/dashboard/tasks-due?tz=Africa%2FCairo");
		expect(fetchImpl.mock.calls[0][1]).toMatchObject({ method: "GET", signal: controller.signal });
	});
	it("a mismatched response timezone becomes a local error", async () => {
		const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ data: { ...payload, tz: "UTC" }, request_id: "synthetic" }), { status: 200 }));
		const client = createApiClient({ getCredentials: () => ({ token: "synthetic", tenantId: "synthetic" }), fetchImpl });
		await expect(fetchTasksDue("Africa/Cairo", new AbortController().signal, client)).rejects.toMatchObject({ code: "CHARTS_CONTRACT_MISMATCH" });
	});
});
