import { sessionStore } from "../../api/index.ts";
import { href, navigate } from "../../router.ts";
import { Bdi, useI18n } from "../../ui/index.ts";
import { ChartSurface } from "./charts/ChartSurface.tsx";
import { chartState } from "./charts/model.ts";
import { fetchLeadsAggregate, leadsChart, leadsKpis } from "./leads.ts";
import { useLoad } from "./useLoad.ts";

export function LeadsWidget() {
	const credentials = sessionStore.getCredentials();
	const identity = JSON.stringify([credentials?.tenantId, sessionStore.getState().info?.actor, credentials?.grantId]);
	return <LeadsWidgetLoad key={identity} identity={identity} />;
}
function LeadsWidgetLoad({ identity }: { identity: string }) {
	const { t, locale, formatCount } = useI18n();
	const load = useLoad(fetchLeadsAggregate, identity);
	const data = load.state.status === "ready" ? load.state.data : null;
	const summary = data ? <dl className="sy-chart__kpis grid grid-cols-4 gap-12 my-12 max-mobile:grid-cols-2 [&_dt]:text-text-2 [&_dd]:m-0 [&_dd]:text-text [&_dd]:[font-size:var(--sy-type-section-title-size)] [&_dd]:font-weight-section-title" aria-label={t("charts.leads.statusTotals")}>
		{leadsKpis(data).map(({ key, value }) => <div key={key}>
			<dt>{t(`charts.leads.${key}`)}</dt><dd><Bdi>{formatCount(value)}</Bdi></dd>
		</div>)}
	</dl> : null;
	return <ChartSurface title={t("charts.leads.title")} className="sy-dash__chart col-span-6 max-mobile:col-span-full" state={chartState(load.state, (payload) => leadsChart(payload, locale, t))}
		onRetry={load.reload} summary={summary} emptyAction={<a href={href("/leads")} onClick={(event) => { event.preventDefault(); navigate("/leads"); }}>{t("charts.leads.view")}</a>} />;
}
