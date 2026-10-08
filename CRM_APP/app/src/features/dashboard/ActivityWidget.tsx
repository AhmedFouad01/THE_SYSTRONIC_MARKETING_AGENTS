import { sessionStore } from "../../api/index.ts";
import { href, navigate } from "../../router.ts";
import { useI18n } from "../../ui/index.ts";
import { fetchActivity, activityChart } from "./activity.ts";
import { ChartSurface } from "./charts/ChartSurface.tsx";
import { chartState } from "./charts/model.ts";
import { browserTimezone } from "./outcomes.ts";
import { useLoad } from "./useLoad.ts";

export function ActivityWidget() {
	const credentials = sessionStore.getCredentials();
	const tz = browserTimezone();
	const identity = JSON.stringify([credentials?.tenantId, sessionStore.getState().info?.actor, credentials?.grantId, tz]);
	return <ActivityWidgetLoad key={identity} identity={identity} tz={tz} />;
}
function ActivityWidgetLoad({ identity, tz }: { identity: string; tz: string }) {
	const { t, locale } = useI18n();
	const load = useLoad((signal) => fetchActivity(tz, signal), identity);
	return <ChartSurface title={t("charts.activity.title")} className="sy-dash__chart sy-dash__chart--wide col-span-full"
		state={chartState(load.state, (payload) => activityChart(payload, locale, t))} onRetry={load.reload}
		summary={<p className="sy-chart__meta flex flex-wrap gap-12 text-text-2">{t("charts.activity.records")}</p>}
		emptyAction={<a href={href("/tasks")} onClick={(event) => { event.preventDefault(); navigate("/tasks"); }}>{t("dash.follow.link")}</a>} />;
}
