import { useState } from "react";
import { sessionStore } from "../../api/index.ts";
import { href, navigate } from "../../router.ts";
import { Select, useI18n } from "../../ui/index.ts";
import { ChartSurface } from "./charts/ChartSurface.tsx";
import { chartState } from "./charts/model.ts";
import { fetchPipelineAggregate, pipelineChart, pipelineSelection } from "./pipeline.ts";
import { useLoad } from "./useLoad.ts";

/** Keyed by tenant, actor and grant: local selectors/dataset cannot survive a workspace authority change. */
export function PipelineWidget() {
	const credentials = sessionStore.getCredentials();
	const identity = JSON.stringify([credentials?.tenantId, sessionStore.getState().info?.actor, credentials?.grantId]);
	return <PipelineWidgetLoad key={identity} identity={identity} />;
}
function PipelineWidgetLoad({ identity }: { identity: string }) {
	const { t } = useI18n();
	const load = useLoad(fetchPipelineAggregate, identity);
	const [pipelineId, setPipelineId] = useState("");
	const [currency, setCurrency] = useState("");
	const data = load.state.status === "ready" ? load.state.data : null;
	const selected = data ? pipelineSelection(data, pipelineId, currency) : null;
	const controls = data ? <div className="sy-chart__controls flex flex-wrap gap-12 [&_.sy-field]:min-w-[8rem] [&_.sy-field]:flex-[1_1_8rem]">
		<Select label={t("charts.pipeline.selector")} size="sm" value={selected?.pipeline?.pipeline_id ?? ""} disabled={data.pipelines.length === 0}
			onChange={(event) => setPipelineId(event.target.value)}>
			{data.pipelines.length === 0 ? <option value="">{t("charts.pipeline.noPipelines")}</option> : null}
			{data.pipelines.map((pipeline) => <option key={pipeline.pipeline_id} value={pipeline.pipeline_id}>{pipeline.name}</option>)}
		</Select>
		<Select label={t("charts.pipeline.currency")} size="sm" value={selected?.currency ?? ""} disabled={!selected?.currencies.length}
			onChange={(event) => setCurrency(event.target.value)}>
			{!selected?.currencies.length ? <option value="">{t("charts.pipeline.noCurrency")}</option> : null}
			{selected?.currencies.map((code) => <option key={code} value={code}>{code}</option>)}
		</Select>
	</div> : null;
	return <ChartSurface title={t("charts.pipeline.title")} className="sy-dash__chart col-span-6 max-mobile:col-span-full" state={chartState(load.state, (payload) => pipelineChart(payload, pipelineId, currency, t))}
		onRetry={load.reload} actions={controls} emptyAction={<a href={href("/pipeline")} onClick={(event) => { event.preventDefault(); navigate("/pipeline"); }}>{t("charts.pipeline.open")}</a>} />;
}
