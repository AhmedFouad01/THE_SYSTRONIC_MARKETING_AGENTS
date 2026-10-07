import { apiClient, type ApiClient } from "../../api/index.ts";
import type { MessageKey } from "../../ui/i18n/en.ts";
import { toBig } from "../reporting/model.ts";
import { isolateCanvas, type ChartModel, type ChartScope } from "./charts/model.ts";

export type PipelineStage = {
	stage_id: string; name: string; position: number; outcome: "won" | "lost" | null; archived: boolean;
	deal_count: number; totals: { currency: string; amount_minor: string }[];
};
export type PipelineAggregate = { pipeline_id: string; name: string; stages: PipelineStage[] };
export type PipelinePayload = { scope: ChartScope; pipelines: PipelineAggregate[] };
export async function fetchPipelineAggregate(signal: AbortSignal, client: ApiClient = apiClient): Promise<PipelinePayload> {
	return (await client.get<PipelinePayload>("dashboard/pipeline-stages", { signal })).data;
}
export function pipelineSelection(payload: PipelinePayload, pipelineId: string, currency: string) {
	const pipeline = payload.pipelines.find((p) => p.pipeline_id === pipelineId) ?? payload.pipelines[0] ?? null;
	const stages = (pipeline?.stages ?? []).filter((stage) => !stage.archived || stage.deal_count > 0)
		.toSorted((a, b) => a.position - b.position || a.stage_id.localeCompare(b.stage_id));
	const currencies = [...new Set(stages.flatMap((stage) => stage.totals.map((total) => total.currency)))].sort();
	return { pipeline, stages, currencies, currency: currencies.includes(currency) ? currency : currencies[0] ?? "" };
}
type Translate = (key: MessageKey) => string;
export function pipelineChart(payload: PipelinePayload, pipelineId: string, currency: string, t: Translate): ChartModel {
	const selected = pipelineSelection(payload, pipelineId, currency);
	return {
		scope: payload.scope, horizontal: true, type: "bar", rowLabel: t("charts.pipeline.stage"),
		columns: [{ key: "count", label: t("charts.pipeline.count"), kind: "count" },
			...(selected.currency ? [{ key: "amount", label: t("charts.pipeline.value"), kind: "money" as const, currency: selected.currency, plot: false }] : [])],
		rows: selected.stages.map((stage) => ({
			key: stage.stage_id,
			label: `${isolateCanvas(stage.name)}${stage.outcome ? ` — ${t(stage.outcome === "won" ? "charts.pipeline.won" : "charts.pipeline.lost")}` : ""}${stage.archived ? ` (${t("charts.pipeline.archived")})` : ""}`,
			...(stage.outcome ? { tone: stage.outcome === "won" ? "success" as const : "danger" as const } : {}),
			values: { count: stage.deal_count, amount: toBig(stage.totals.find((total) => total.currency === selected.currency)?.amount_minor).toString() },
		})),
	};
}
