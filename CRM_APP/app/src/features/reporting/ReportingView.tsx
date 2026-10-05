import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isApiError, isForbidden, sessionStore } from "../../api/index.ts";
import {
	Button,
	Dialog,
	ErrorState,
	ForbiddenState,
	Bdi,
	Input,
	LoadingState,
	Ltr,
	Select,
	Tabs,
	useI18n,
	useToast,
} from "../../ui/index.ts";
import { calculateAttribution, fetchCampaignReport } from "./api.ts";
import { CampaignsPanel } from "./CampaignsPanel.tsx";
import { ConversionsPanel, OrdersPanel } from "./EvidencePanels.tsx";
import { JourneyPanel } from "./JourneyPanel.tsx";
import { KpiCard } from "./KpiCard.tsx";
import {
	type AttributionModel,
	aggregateCampaigns,
	type CampaignReport,
	DEFAULT_MODEL,
	deriveKpis,
	formatRoas,
	formatShare,
	LOOKBACK_DEFAULT,
	LOOKBACK_MAX,
	LOOKBACK_MIN,
	MODELS,
	parseLookback,
	unattributedAlert,
} from "./model.ts";
import { useReportFmt } from "./shared.tsx";
import "./reporting.css";

export type ReportTab = "campaigns" | "conversions" | "orders" | "journey";
const TABS: readonly ReportTab[] = [
	"campaigns",
	"conversions",
	"orders",
	"journey",
];

type ReportState =
	| { status: "loading" }
	| { status: "ready"; data: CampaignReport }
	| { status: "error"; error: unknown };

function useCampaignReport(
	model: AttributionModel,
	resetKey: string,
): { state: ReportState; reload: () => void } {
	const [state, setState] = useState<ReportState>({ status: "loading" });
	const [n, setN] = useState(0);
	// biome-ignore lint/correctness/useExhaustiveDependencies: n and resetKey re-run the load
	useEffect(() => {
		const ctrl = new AbortController();
		setState({ status: "loading" });
		fetchCampaignReport(model, ctrl.signal)
			.then((data) => setState({ status: "ready", data }))
			.catch((error: unknown) => {
				if (!ctrl.signal.aborted) setState({ status: "error", error });
			});
		return () => ctrl.abort();
	}, [model, resetKey, n]);
	return { state, reload: useCallback(() => setN((x) => x + 1), []) };
}

export function ReportingView() {
	const { t, locale, formatNumber } = useI18n();
	const toast = useToast();
	const f = useReportFmt();
	const tenantId = sessionStore.getCredentials()?.tenantId ?? "";

	const [model, setModel] = useState<AttributionModel>(DEFAULT_MODEL);
	const [days, setDays] = useState(String(LOOKBACK_DEFAULT));
	const [tab, setTab] = useState<ReportTab>("campaigns");
	// Bumped after a published calculation: panels and detail views reload.
	const [published, setPublished] = useState(0);
	const resetKey = `${tenantId}:${published}`;
	const { state, reload } = useCampaignReport(model, resetKey);

	// The session endpoint does not expose report.calculate. The control stays enabled until the server
	// answers 403 (or the report itself is forbidden); then it is disabled with a visible reason.
	const [calcDenied, setCalcDenied] = useState(false);
	// biome-ignore lint/correctness/useExhaustiveDependencies: a new tenant gets a fresh permission guess
	useEffect(() => setCalcDenied(false), [tenantId]);
	const readDenied = state.status === "error" && isForbidden(state.error);
	const blocked = calcDenied || readDenied;

	const lookback = parseLookback(days);
	const lookbackError =
		lookback === null ? t("rep.lookbackInvalid") : undefined;

	const [confirmOpen, setConfirmOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	// One idempotency key per lookback value: a retry of the same request replays, a changed body never reuses a key.
	const keys = useRef<Map<number, string>>(new Map());
	const keyFor = (days: number): string => {
		let k = keys.current.get(days);
		if (!k) {
			k = crypto.randomUUID();
			keys.current.set(days, k);
		}
		return k;
	};
	const openRef = useRef<HTMLButtonElement>(null);

	const publish = async () => {
		if (lookback === null) return;
		setBusy(true);
		try {
			await calculateAttribution(lookback, keyFor(lookback));
			keys.current.delete(lookback);
			setConfirmOpen(false);
			setPublished((x) => x + 1);
			toast.notify(t("rep.publish.done"), "success");
		} catch (e) {
			setConfirmOpen(false);
			if (isForbidden(e)) {
				setCalcDenied(true);
				toast.notify(t("rep.publish.forbidden"), "error");
			} else {
				toast.notify(
					isApiError(e) && e.safeMessage
						? e.safeMessage
						: t("rep.publish.failed"),
					"error",
				);
			}
		} finally {
			setBusy(false);
		}
	};

	const report = state.status === "ready" ? state.data : null;
	const aggs = useMemo(() => (report ? aggregateCampaigns(report) : []), [report]);
	const kpis = useMemo(() => (report ? deriveKpis(report) : null), [report]);

	const panels: Record<ReportTab, React.ReactNode> = {
		campaigns:
			state.status === "loading" ? (
				<LoadingState />
			) : state.status === "error" ? (
				<ErrorState
					title={t("rep.loadFailed")}
					requestId={isApiError(state.error) ? state.error.requestId : null}
					onRetry={reload}
				/>
			) : (
				<CampaignsPanel aggs={aggs} />
			),
		conversions: <ConversionsPanel resetKey={resetKey} />,
		orders: <OrdersPanel resetKey={resetKey} />,
		journey: <JourneyPanel resetKey={resetKey} />,
	};
	const TAB_LABEL = {
		campaigns: t("rep.tab.campaigns"),
		conversions: t("rep.tab.conversions"),
		orders: t("rep.tab.orders"),
		journey: t("rep.tab.journey"),
	} as const;

	return (
		<div className="sy-rep" data-testid="reporting-view">
			<header className="sy-rep__top">
				<div>
					<h1 className="sy-rep__h1">{t("nav.reporting")}</h1>
					<p className="sy-rep__muted">{t("rep.intro")}</p>
				</div>
			</header>

			<div className="sy-rep__controls">
				<Select
					label={t("rep.model")}
					value={model}
					onChange={(e) => setModel(e.target.value as AttributionModel)}
					data-testid="report-model"
				>
					{MODELS.map((m) => (
						<option key={m} value={m}>
							{f.label(m)}
						</option>
					))}
				</Select>
				<Input
					label={t("rep.lookback")}
					type="number"
					inputMode="numeric"
					min={LOOKBACK_MIN}
					max={LOOKBACK_MAX}
					value={days}
					onChange={(e) => setDays(e.target.value)}
					hint={t("rep.lookbackHint")}
					error={lookbackError}
					data-testid="report-days"
				/>
				<div className="sy-rep__btns">
					<Button
						onClick={reload}
						loading={state.status === "loading"}
						data-testid="report-refresh"
					>
						{t("rep.refresh")}
					</Button>
					<Button
						ref={openRef}
						variant="primary"
						icon="report"
						disabled={blocked || lookback === null || state.status === "loading"}
						aria-describedby={blocked ? "rep-denied" : undefined}
						onClick={() => setConfirmOpen(true)}
						data-testid="report-calculate"
					>
						{t("rep.publish")}
					</Button>
				</div>
			</div>
			{blocked ? (
				<p id="rep-denied" className="sy-rep__muted" data-testid="calc-denied">
					{t("rep.publishDenied")}
				</p>
			) : null}

			{readDenied ? (
				<ForbiddenState />
			) : (
				<>
					<section aria-label={t("rep.kpis")}>
						{state.status === "loading" ? (
							<LoadingState />
						) : kpis && report ? (
							<>
								<div className="sy-rep__kpis" data-testid="report-kpis">
									<KpiCard
										testId="kpi-roas"
										tone="navy"
										label={t("rep.kpi.roas")}
										value={formatRoas(kpis.roas, locale)}
										sub={
											kpis.spend > 0n
												? (kpis.currency ?? undefined)
												: t("rep.kpi.noSpend")
										}
									/>
									<KpiCard
										testId="kpi-revenue"
										label={t("rep.kpi.revenue")}
										value={f.minor(kpis.revenue, kpis.currency)}
										sub={t("rep.kpi.minor")}
									/>
									<KpiCard
										testId="kpi-spend"
										label={t("rep.kpi.spend")}
										value={f.minor(kpis.spend, kpis.currency)}
										sub={t("rep.kpi.minor")}
									/>
									<KpiCard
										testId="kpi-conversions"
										label={t("rep.kpi.conversions")}
										value={formatNumber(kpis.conversions)}
										sub={t("rep.kpi.refunds", {
											count: formatNumber(kpis.refunds),
										})}
									/>
									<KpiCard
										testId="kpi-unattributed"
										tone={unattributedAlert(kpis) ? "magenta" : "neutral"}
										label={t("rep.kpi.unattributed")}
										value={formatShare(kpis.unattributedShare, locale)}
										sub={t("rep.kpi.unattributedHint")}
									/>
								</div>
								{kpis.mixedCurrency && kpis.currency ? (
									<p className="sy-rep__muted">
										{t("rep.kpi.mixed", { currency: kpis.currency })}
									</p>
								) : null}
								<p className="sy-rep__meta" data-testid="report-meta">
									{t("rep.meta.internal")} · {f.label(report.model)} ·{" "}
									{t("rep.meta.version")}: <Ltr>{report.version}</Ltr> ·{" "}
									{t("rep.meta.lookback")}: <Ltr>{report.lookback_days}</Ltr> ·{" "}
									{t("rep.meta.basis")} · {t("rep.meta.run")}:{" "}
									{report.run_id ? (
										<Bdi>{f.utc(report.as_of)}</Bdi>
									) : (
										t("rep.meta.unpublished")
									)}{" "}
									· {t("rep.meta.provider")}
								</p>
								<p className="sy-rep__muted">{t("rep.meta.stale")}</p>
							</>
						) : null}
					</section>
					<Tabs
						label={t("rep.tabs")}
						value={tab}
						onChange={(id) => setTab(id as ReportTab)}
						tabs={TABS.map((id) => ({
							id,
							label: TAB_LABEL[id],
							panel: panels[id],
						}))}
					/>
				</>
			)}

			<Dialog
				open={confirmOpen}
				onClose={() => (busy ? undefined : setConfirmOpen(false))}
				title={t("rep.publish.title")}
				description={t("rep.publish.body", {
					days: lookback === null ? "—" : formatNumber(lookback),
				})}
				returnFocusRef={openRef}
				testId="publish-dialog"
				confirm={{
					label: t("rep.publish.confirm"),
					tone: "primary",
					loading: busy,
					onConfirm: () => void publish(),
				}}
			/>
		</div>
	);
}
