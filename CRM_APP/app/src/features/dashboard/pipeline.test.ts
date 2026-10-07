import { describe, expect, it, vi } from "vitest";
import type { TooltipItem, TooltipModel } from "chart.js";
import { createApiClient } from "../../api/client.ts";
import { en } from "../../ui/i18n/en.ts";
import { ar } from "../../ui/i18n/ar.ts";
import { chartData, chartOptions, chartState, formatChartValue, resolveChartTheme, type ChartKind } from "./charts/model.ts";
import { fetchPipelineAggregate, pipelineChart, pipelineSelection, type PipelinePayload, type PipelineStage } from "./pipeline.ts";
const stage = (id: string, position: number, overrides: Partial<PipelineStage> = {}): PipelineStage => ({
	stage_id: id, name: id, position, outcome: null, archived: false, deal_count: 0, totals: [], ...overrides,
});
const payload: PipelinePayload = {
	scope: "assigned", pipelines: [
		{ pipeline_id: "p1", name: "ACME مسار", stages: [
			stage("lost", 4, { outcome: "lost", deal_count: 1, totals: [{ currency: "EGP", amount_minor: "100" }] }),
			stage("archive-empty", 5, { archived: true }),
			stage("won", 3, { outcome: "won", deal_count: 4, totals: [{ currency: "USD", amount_minor: "777" }, { currency: "EGP", amount_minor: "9007199254740993123" }] }),
			stage("zero", 1),
			stage("archive-live", 2, { archived: true, deal_count: 2, totals: [{ currency: "USD", amount_minor: "200" }] }),
		] },
		{ pipeline_id: "p2", name: "Second", stages: [stage("other", 1, { deal_count: 1, totals: [{ currency: "JPY", amount_minor: "500" }] })] },
	],
};
const theme = resolveChartTheme((name) => name);
const translate = (key: keyof typeof en) => en[key];

describe("pipeline aggregate selection and adapters", () => {
	it("uses only returned pipelines, first default and stale-selection fallback", () => {
		expect(pipelineSelection(payload, "", "").pipeline?.pipeline_id).toBe("p1");
		expect(pipelineSelection(payload, "gone", "").pipeline?.pipeline_id).toBe("p1");
		expect(pipelineSelection(payload, "p2", "").pipeline?.pipeline_id).toBe("p2");
		expect(pipelineSelection({ scope: "tenant", pipelines: [] }, "p1", "EGP")).toMatchObject({ pipeline: null, stages: [], currency: "", currencies: [] });
	});
	it("preserves zero stages, hides only empty archived stages and sorts by position", () => {
		const selected = pipelineSelection(payload, "p1", "EGP");
		expect(selected.stages.map((s) => s.stage_id)).toEqual(["zero", "archive-live", "won", "lost"]);
		expect(selected.stages[0].deal_count).toBe(0);
		expect(payload.pipelines[0].stages[0].stage_id).toBe("lost");
	});
	it("orders position ties by stage ID, without reordering payload", () => {
		const tied: PipelinePayload = { scope: "tenant", pipelines: [{ pipeline_id: "x", name: "x", stages: [stage("b", 1), stage("a", 1)] }] };
		expect(pipelineSelection(tied, "x", "").stages.map((s) => s.stage_id)).toEqual(["a", "b"]);
	});
	it("currencies stay distinct; switching pipeline replaces an unavailable currency", () => {
		expect(pipelineSelection(payload, "p1", "USD")).toMatchObject({ currencies: ["EGP", "USD"], currency: "USD" });
		expect(pipelineSelection(payload, "p2", "USD")).toMatchObject({ currencies: ["JPY"], currency: "JPY" });
	});
	it("counts across currencies but displays exactly the selected currency value", () => {
		const egp = pipelineChart(payload, "p1", "EGP", translate);
		const usd = pipelineChart(payload, "p1", "USD", translate);
		expect(egp.rows[2].values).toEqual({ count: 4, amount: "9007199254740993123" });
		expect(usd.rows[2].values).toEqual({ count: 4, amount: "777" });
		expect(egp.rows[1].values.amount).toBe("0");
		expect(usd.rows[1].values.amount).toBe("200");
	});
	it("won and lost remain visible with semantic color and localized non-color labels", () => {
		const model = pipelineChart(payload, "p1", "EGP", translate);
		expect(model.rows[2]).toMatchObject({ tone: "success" });
		expect(model.rows[3]).toMatchObject({ tone: "danger" });
		expect(model.rows[2].label).toContain("Won");
		expect(model.rows[3].label).toContain("Lost");
		expect(model.rows[1].label).toContain("Archived");
		expect(chartData(model, theme).datasets[0].backgroundColor).toEqual(["--sy-chart-1", "--sy-chart-1", "--sy-success-fg", "--sy-danger-fg"]);
		const arabic = pipelineChart(payload, "p1", "EGP", (key) => ar[key]);
		expect(arabic.rows[2].label).toContain("رابحة");
		expect(arabic.rows[3].label).toContain("خاسرة");
	});
	it("scope follows server and selected count rows drive both bars and table", () => {
		const model = pipelineChart(payload, "p1", "EGP", translate);
		expect(model.scope).toBe("assigned");
		expect(model.horizontal).toBe(true);
		expect(chartData(model, theme).datasets[0].data).toEqual(model.rows.map((row) => row.values.count));
		expect(chartData(model, theme).datasets).toHaveLength(1);
		expect(chartOptions(model, "ar", false, theme).scales?.x).toMatchObject({ reverse: true, beginAtZero: true });
	});
	it("secondary tooltip and table use identical exact selected money", () => {
		const model = pipelineChart(payload, "p1", "EGP", translate);
		const callback = chartOptions(model, "en", false, theme).plugins?.tooltip?.callbacks?.label;
		const output = callback?.call({} as TooltipModel<ChartKind>, { datasetIndex: 0, dataIndex: 2 } as TooltipItem<ChartKind>);
		const table = formatChartValue(model.rows[2].values.amount, model.columns[1], "en");
		expect(output).toEqual(["\u2068Deals: 4\u2069", `\u2068Value: ${table}\u2069`]);
		expect(table).toContain("90,071,992,547,409,931.23");
	});
	it("an all-zero pipeline remains empty with its zero stages in the accessible table", () => {
		const zero: PipelinePayload = { scope: "tenant", pipelines: [{ pipeline_id: "z", name: "z", stages: [stage("zero", 1)] }] };
		const state = chartState({ status: "ready", data: zero }, (data) => pipelineChart(data, "z", "", translate));
		expect(state.status).toBe("empty");
		if (state.status === "empty") { expect(state.model.rows).toHaveLength(1); expect(state.model.columns).toHaveLength(1); }
	});
	it("GETs the real scoped endpoint through the existing envelope/client and abort signal", async () => {
		const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ data: payload, request_id: "synthetic-r" }), { status: 200 }));
		const client = createApiClient({ getCredentials: () => ({ token: "synthetic-token", tenantId: "synthetic-tenant" }), fetchImpl });
		const controller = new AbortController();
		expect(await fetchPipelineAggregate(controller.signal, client)).toEqual(payload);
		expect(fetchImpl.mock.calls[0][0]).toBe("/v1/dashboard/pipeline-stages");
		expect(fetchImpl.mock.calls[0][1]).toMatchObject({ method: "GET", signal: controller.signal, headers: { "X-Tenant-ID": "synthetic-tenant" } });
	});
});
