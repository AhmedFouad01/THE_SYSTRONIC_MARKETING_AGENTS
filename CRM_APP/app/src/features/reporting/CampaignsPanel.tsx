import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
	BidiText,
	Button,
	DataGrid,
	type GridColumn,
	Ltr,
	useI18n,
} from "../../ui/index.ts";
import { type CampaignAgg, formatRoas, isUnknownCampaign } from "./model.ts";
import { ReportPreview } from "./ReportPreview.tsx";
import { useReportFmt } from "./shared.tsx";

const getRowId = (a: CampaignAgg) => a.key;
const campaignName = (a: CampaignAgg, unknown: string) =>
	isUnknownCampaign(a.campaignId) ? unknown : (a.name ?? a.campaignId);

export function CampaignsPanel({
	aggs,
	emptyAction,
}: {
	aggs: readonly CampaignAgg[];
	/** Primary next step shown in the empty state (UX-23), e.g. "Publish calculation". */
	emptyAction?: ReactNode;
}) {
	const { t, locale } = useI18n();
	const f = useReportFmt();
	// Open row = preview slide-over (no permanent detail column); closed on first load.
	const [activeId, setActiveId] = useState<string | null>(null);
	const active = aggs.find((a) => a.key === activeId) ?? null;
	const ids = useMemo(() => aggs.map(getRowId), [aggs]);
	// A recalculation can drop the open campaign: close instead of showing a stale one.
	useEffect(() => {
		if (activeId !== null && active === null) setActiveId(null);
	}, [activeId, active]);

	const columns = useMemo<ReadonlyArray<GridColumn<CampaignAgg>>>(() => {
		const name = (a: CampaignAgg) => campaignName(a, t("rep.unknown"));
		return [
			{
				id: "campaign",
				header: t("rep.col.campaign"),
				value: (a) => name(a),
				sortable: true,
				hideable: false,
				cell: (a) => <BidiText className="sy-rep__strong">{name(a)}</BidiText>,
			},
			{
				id: "source",
				header: t("rep.col.source"),
				value: (a) => a.sources.join(", "),
				sortable: true,
			},
			{
				id: "currency",
				header: t("rep.col.currency"),
				value: (a) => a.currency,
				sortable: true,
				ltr: true,
			},
			{
				id: "outcomes",
				header: t("rep.col.outcomes"),
				value: (a) => a.outcomes,
				searchable: false,
				sortable: true,
			},
			{
				id: "value",
				header: t("rep.col.value"),
				value: (a) => Number(a.revenue),
				searchable: false,
				sortable: true,
				cell: (a) => f.money(a.revenue, a.currency),
			},
			{
				id: "spend",
				header: t("rep.col.spend"),
				value: (a) => Number(a.spend),
				searchable: false,
				sortable: true,
				cell: (a) => (a.hasSpend ? f.money(a.spend, a.currency) : "—"),
			},
			{
				id: "roas",
				header: t("rep.col.roas"),
				value: (a) => a.roas ?? -1,
				searchable: false,
				sortable: true,
				cell: (a) => <Ltr>{formatRoas(a.roas, locale)}</Ltr>,
			},
			{
				id: "actions",
				header: t("rep.col.actions"),
				value: () => "",
				searchable: false,
				hideable: false,
				cell: (a) => (
					<Button
						size="sm"
						aria-label={t("rep.detail.openFor", { name: name(a) })}
						onClick={() => setActiveId(a.key)}
						data-testid="campaign-detail"
					>
						{t("rep.detail.open")}
					</Button>
				),
			},
		];
	}, [t, f, locale]);

	return (
		<div className="sy-rep__main">
			<DataGrid<CampaignAgg>
				gridId="report-campaigns"
				label={t("rep.grid.campaigns")}
				rows={aggs}
				columns={columns}
				getRowId={getRowId}
				status="ready"
				activeId={activeId}
				onActiveChange={setActiveId}
				revealId={activeId}
				emptyTitle={t("rep.empty")}
				emptyHint={t("rep.emptyHint")}
				{...(emptyAction ? { emptyAction } : {})}
			/>
			{active ? (
				<ReportPreview
					label={t("rep.detail.campaign")}
					heading={campaignName(active, t("rep.unknown"))}
					activeId={activeId}
					ids={ids}
					onChange={setActiveId}
				>
					<CampaignDetail agg={active} />
				</ReportPreview>
			) : null}
		</div>
	);
}

function CampaignDetail({ agg }: { agg: CampaignAgg }) {
	const { t, locale } = useI18n();
	const f = useReportFmt();
	const unknown = isUnknownCampaign(agg.campaignId);
	return (
		<div>
			<p className="sy-rep__ptitle">
				<BidiText wrap>{campaignName(agg, t("rep.unknown"))}</BidiText>
			</p>
			{unknown ? (
				<p className="sy-rep__muted">{t("rep.detail.unknownNote")}</p>
			) : null}
			<p className="sy-rep__muted">
				{t("rep.col.roas")}: <Ltr>{formatRoas(agg.roas, locale)}</Ltr> ·{" "}
				{t("rep.col.currency")}: <Ltr>{agg.currency}</Ltr>
			</p>
			<h3>{t("rep.detail.credited")}</h3>
			<div className="sy-rep__tablewrap">
				<table className="sy-rep__table">
					<thead>
						<tr>
							<th scope="col">{t("rep.col.type")}</th>
							<th scope="col">{t("rep.col.source")}</th>
							<th scope="col">{t("rep.col.value")}</th>
							<th scope="col">{t("rep.col.outcomes")}</th>
						</tr>
					</thead>
					<tbody>
						{agg.rows.map((r) => (
							<tr key={`${r.source}|${r.conversion_type}`}>
								<td>{f.label(r.conversion_type)}</td>
								<td>{r.source === "unknown" ? t("rep.unknown") : r.source}</td>
								<td>{f.money(r.value_minor, agg.currency)}</td>
								<td>
									<Ltr>{f.count(r.outcomes)}</Ltr>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<h3>{t("rep.detail.spendFacts")}</h3>
			{agg.spendRows.length === 0 ? (
				<p className="sy-rep__muted">{t("rep.detail.noSpend")}</p>
			) : (
				<>
					<p className="sy-rep__muted">{t("rep.meta.spend")}</p>
					<ul className="sy-rep__list">
						{agg.spendRows.map((s) => (
							<li key={`${s.reporting_date}|${s.campaign_id}`}>
								<Ltr>
									{s.reporting_date} / {s.timezone}
								</Ltr>
								{" · "}
								{f.money(s.spend_minor, s.currency)}
							</li>
						))}
					</ul>
				</>
			)}
		</div>
	);
}
