import { useState } from "react";
import { sessionStore } from "../../api/index.ts";
import { href, navigate } from "../../router.ts";
import { Select, useI18n } from "../../ui/index.ts";
import { ChartSurface } from "./charts/ChartSurface.tsx";
import { chartState } from "./charts/model.ts";
import { browserTimezone, fetchOutcomes, outcomesChart, outcomesCurrencies, outcomesCurrency, type OutcomeBucketKind } from "./outcomes.ts";
import { useLoad } from "./useLoad.ts";

export function OutcomesWidget() {
	const credentials = sessionStore.getCredentials();
	const identity = JSON.stringify([credentials?.tenantId, sessionStore.getState().info?.actor, credentials?.grantId]);
	return <OutcomesControls key={identity} identity={identity} />;
}
function OutcomesControls({ identity }: { identity: string }) {
	const [bucket, setBucket] = useState<OutcomeBucketKind>("month");
	const [currency, setCurrency] = useState("");
	const tz = browserTimezone();
	return <OutcomesLoad key={`${bucket}:${tz}`} loadKey={`${identity}:${bucket}:${tz}`} bucket={bucket} onBucket={setBucket} currency={currency} onCurrency={setCurrency} tz={tz} />;
}
function OutcomesLoad({ loadKey, bucket, onBucket, currency, onCurrency, tz }: {
	loadKey: string; bucket: OutcomeBucketKind; onBucket: (bucket: OutcomeBucketKind) => void; currency: string; onCurrency: (currency: string) => void; tz: string;
}) {
	const { t, locale } = useI18n();
	const load = useLoad((signal) => fetchOutcomes(bucket, tz, signal), loadKey);
	const data = load.state.status === "ready" ? load.state.data : null;
	const controls = <div className="sy-chart__controls">
		<Select label={t("charts.outcomes.bucket")} size="sm" value={bucket} onChange={(event) => onBucket(event.target.value === "week" ? "week" : "month")}>
			<option value="month">{t("charts.outcomes.months")}</option><option value="week">{t("charts.outcomes.weeks")}</option>
		</Select>
		{data ? <Select label={t("charts.outcomes.currency")} size="sm" value={outcomesCurrency(data, currency)} onChange={(event) => onCurrency(event.target.value)}>
			<option value="">{t("charts.outcomes.countsOnly")}</option>
			{outcomesCurrencies(data).map((code) => <option key={code} value={code}>{code}</option>)}
		</Select> : null}
	</div>;
	return <ChartSurface title={t("charts.outcomes.title")} className="sy-dash__chart" actions={controls}
		state={chartState(load.state, (payload) => outcomesChart(payload, currency, locale, t))} onRetry={load.reload}
		emptyAction={<a href={href("/deals")} onClick={(event) => { event.preventDefault(); navigate("/deals"); }}>{t("charts.outcomes.view")}</a>} />;
}
