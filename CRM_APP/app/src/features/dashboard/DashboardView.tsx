import { type ReactNode, useEffect, useMemo, useState } from "react";
import { isApiError, isForbidden, sessionStore } from "../../api/index.ts";
import { href, navigate } from "../../router.ts";
import {
	Bdi,
	Badge,
	Button,
	EmptyState,
	ErrorState,
	ForbiddenState,
	LoadingState,
	Money,
	PageHeader,
	Panel,
	StatusPill,
	useI18n,
	useCursorList,
	useMediaQuery,
	useToast,
	cond,
} from "../../ui/index.ts";
import { formatMoneyMinor } from "../../ui/i18n/format.ts";
import { NewLeadDialog } from "../leads/NewLeadDialog.tsx";
import { listFetcher } from "../listApi.ts";
import { fetchCampaignReport } from "../reporting/api.ts";
import { KpiCard } from "../reporting/KpiCard.tsx";
import {
	type CampaignReport,
	DEFAULT_MODEL,
	formatRoas,
	formatShare,
} from "../reporting/model.ts";
import { useReportFmt } from "../reporting/shared.tsx";
import {
	type Assignee,
	fetchAssignees,
	fetchContactRefsPage,
	type ContactRef,
} from "../tasks/api.ts";
import { relatedKey, relatedOf, useRelatedNames } from "./useRelatedNames.ts";
import { NewTaskDialog } from "../tasks/NewTaskDialog.tsx";
import { contactNameOf } from "../expand.ts";
import { RelatedLink } from "../tasks/RelatedLink.tsx";
import { type Task, overdueDays } from "../tasks/model.ts";
import {
	emphasis,
	followUps,
	NEXT_WINDOW_MS,
	summarizeReport,
} from "./model.ts";
import { type Load, useLoad } from "./useLoad.ts";
import "../reporting/reporting.css";
import { PipelineWidget } from "./PipelineWidget.tsx";
import { LeadsWidget } from "./LeadsWidget.tsx";
import { OutcomesWidget } from "./OutcomesWidget.tsx";
import { TasksWidget } from "./TasksWidget.tsx";
import { ActivityWidget } from "./ActivityWidget.tsx";
import { dashboardChartOrder } from "./composition.ts";
import { fetchTasksDue, tasksDueState } from "./tasksDue.ts";
import { browserTimezone } from "./outcomes.ts";

const NARROW = "(max-width: 720px)";

const fetchTasks = listFetcher<Task>("tasks");
const FOLLOW_ROWS = 25;
const getRefId = (r: { id: string }) => r.id;

/** First rows of a server query with their exact total (`total_count`), names embedded (`expand=contact`). */
const loadTasks = (params: { due?: string; filter?: string }) => (signal: AbortSignal) =>
	fetchTasks({
		params: { sort: "due_at", ...params },
		expand: "contact",
		limit: FOLLOW_ROWS,
		cursor: null,
		includeTotal: true,
		signal,
	});

/** Wall clock that re-evaluates the next-24h window once a minute. */
function useNow(): Date {
	const [now, setNow] = useState(() => new Date());
	useEffect(() => {
		const id = setInterval(() => setNow(new Date()), 60_000);
		return () => clearInterval(id);
	}, []);
	return now;
}

const requestIdOf = (e: unknown): string | null =>
	isApiError(e) ? e.requestId : null;

function RetryLink({ onClick }: { onClick: () => void }) {
	const { t } = useI18n();
	return (
		<Button size="sm" onClick={onClick} title={t("dash.error")}>
			{t("state.retry")}
		</Button>
	);
}

export function DashboardView() {
	const { t, locale, formatNumber, formatDateTime, tx } = useI18n();
	const f = useReportFmt();
	const toast = useToast();
	const narrow = useMediaQuery(NARROW);
	const tenantId = sessionStore.getCredentials()?.tenantId ?? "";
	const now = useNow();

	// One exact aggregate snapshot feeds W1/W2 and C4; list requests remain for actionable rows.
	const credentials = sessionStore.getCredentials();
	const taskKey = JSON.stringify([tenantId, sessionStore.getState().info?.actor, credentials?.grantId, browserTimezone()]);
	const taskAggregate = useLoad(async (signal) => ({ key: taskKey, data: await fetchTasksDue(browserTimezone(), signal) }), taskKey);
	const taskState = tasksDueState(taskAggregate.state, taskKey);
	const overdue = useLoad(loadTasks({ due: "overdue" }), tenantId);
	const soon = useLoad((signal) => {
		const from = new Date();
		const to = new Date(from.getTime() + NEXT_WINDOW_MS);
		// `due=today` = the server's open-and-due-within-24h window; `due_at >= now` excludes what is already overdue.
		return loadTasks({
			due: "today",
			filter: JSON.stringify({
				and: [
					cond("due_at", "gte", from.toISOString()),
					cond("due_at", "lt", to.toISOString()),
				],
			}),
		})(signal);
	}, tenantId);
	const report = useLoad(
		(signal) => fetchCampaignReport(DEFAULT_MODEL, signal),
		tenantId,
	);
	const reloadTasks = () => {
		taskAggregate.reload();
		overdue.reload();
		soon.reload();
	};

	const [taskOpen, setTaskOpen] = useState(false);
	// Contact picker of the new-task dialog (F-08 is a later track): loaded only once the dialog opens.
	const contacts = useCursorList<ContactRef>(fetchContactRefsPage, {
		getId: getRefId,
		resetKey: tenantId,
		enabled: taskOpen,
	});
	const [leadOpen, setLeadOpen] = useState(false);
	const [assignees, setAssignees] = useState<readonly Assignee[]>([]);
	const loadAssignees = () => {
		fetchAssignees()
			.then(setAssignees)
			.catch(() => undefined);
	};
	const openTask = () => {
		setTaskOpen(true);
		loadAssignees();
	};
	const openLead = () => {
		setLeadOpen(true);
		loadAssignees();
	};

	const marketing = useMemo(
		() => (report.state.status === "ready" ? summarizeReport(report.state.data) : null),
		[report.state],
	);

	const overdueC = taskState.status === "ready" ? taskState.data.overdue : null;
	const soonC = taskState.status === "ready" ? taskState.data.next_24h : null;
	const emph = emphasis({
		overdue: overdueC,
		revenue: marketing && !marketing.empty ? marketing.kpis.revenue : null,
		stale: marketing?.stale ?? true,
	});

	// ---- KPI cards ----------------------------------------------------------------------------------------

	const taskCard = (
		testId: string,
		label: string,
		load: Load<unknown>,
		reload: () => void,
		c: number | null,
		sub: string,
		none: string,
		tone: "neutral" | "navy",
	) => {
		if (load.status === "loading") return <KpiCard testId={testId} label={label} value="" loading />;
		if (load.status === "error")
			return isForbidden(load.error) ? (
				<KpiCard testId={testId} label={label} value="—" sub={t("dash.noTaskAccess")} />
			) : (
				<KpiCard testId={testId} label={label} value="—" sub={<RetryLink onClick={reload} />} />
			);
		const count = c ?? 0;
		return (
			<KpiCard
				testId={testId}
				label={label}
				tone={tone}
				value={formatNumber(count)}
				sub={count === 0 ? none : sub}
			/>
		);
	};

	const reportCard = (
		testId: string,
		label: string,
		render: (
			m: NonNullable<typeof marketing>,
			data: CampaignReport,
		) => { value: ReactNode; sub: ReactNode; tone?: "neutral" | "magenta" },
	) => {
		const st = report.state;
		if (st.status === "loading") return <KpiCard testId={testId} label={label} value="" loading />;
		if (st.status === "error")
			return isForbidden(st.error) ? (
				<KpiCard testId={testId} label={label} value="—" sub={t("dash.noReportAccess")} />
			) : (
				<KpiCard testId={testId} label={label} value="—" sub={<RetryLink onClick={report.reload} />} />
			);
		if (!marketing) return null;
		if (marketing.empty)
			return <KpiCard testId={testId} label={label} value="—" sub={t("dash.report.empty")} />;
		const r = render(marketing, st.data);
		return <KpiCard testId={testId} label={label} value={r.value} sub={r.sub} tone={r.tone ?? "neutral"} />;
	};

	const money = (minor: bigint, currency: string | null) =>
		currency ? (
			<Money>{formatMoneyMinor(Number(minor), locale, currency)}</Money>
		) : (
			<Money>{formatNumber(Number(minor))}</Money>
		);

	const otherNote = (others: string[]) =>
		others.length > 0 ? ` · ${t("dash.otherCurrencies", { count: formatNumber(others.length) })}` : "";

	const kpis = (
		<section className="sy-dash__kpis grid grid-cols-4 gap-12 min-w-0 max-mobile:grid-cols-2 max-mobile:gap-10" aria-label={t("dash.kpis")} data-testid="dash-kpis">
			{taskCard(
				"kpi-overdue",
				t(taskState.status === "ready" && taskState.data.scope === "assigned" ? "charts.tasks.overdueMine" : "dash.overdue.label"),
				taskState,
				taskAggregate.reload,
				overdueC,
				t("dash.overdue.sub"),
				t("dash.overdue.none"),
				emph.overdue === "navy" ? "navy" : "neutral",
			)}
			{taskCard(
				"kpi-next24h",
				t(taskState.status === "ready" && taskState.data.scope === "assigned" ? "charts.tasks.nextMine" : "dash.next.label"),
				taskState,
				taskAggregate.reload,
				soonC,
				t("dash.next.sub"),
				t("dash.next.none"),
				"neutral",
			)}
			{reportCard("kpi-revenue", t("dash.revenue.label"), (m, data) => ({
				value: money(m.kpis.revenue, m.kpis.currency),
				sub: `${t("dash.revenue.sub", { days: formatNumber(data.lookback_days) })}${otherNote(m.others)}`,
				tone: emph.revenue === "magenta" ? "magenta" : "neutral",
			}))}
			{reportCard("kpi-roas", t("dash.roas.label"), (m) => ({
				value: formatRoas(m.kpis.roas, locale),
				sub: m.kpis.roas === null ? t("rep.kpi.noSpend") : `${t("dash.roas.sub")}${otherNote(m.others)}`,
			}))}
		</section>
	);

	// ---- W5 follow-ups ------------------------------------------------------------------------------------

	// Contact names come embedded in the task rows (`expand=contact`); deal titles are fetched by id (UX-R3-01).
	const knownNames = useMemo(() => {
		const m = new Map<string, string>();
		for (const st of [overdue.state, soon.state])
			if (st.status === "ready")
				for (const task of st.data.items) {
					const n = contactNameOf(task);
					if (task.contact_id && n !== null) m.set(`contact:${task.contact_id}`, n);
				}
		return m;
	}, [overdue.state, soon.state]);
	const followList = useMemo(
		() =>
			followUps(
				overdue.state.status === "ready" ? overdue.state.data.items : [],
				soon.state.status === "ready" ? soon.state.data.items : [],
				now,
			),
		[overdue.state, soon.state, now],
	);
	const fetchedNames = useRelatedNames(
		followList,
		knownNames,
		overdue.state.status !== "loading" && soon.state.status !== "loading",
		tenantId,
	);

	const renderDue = (task: Task) => {
		if (task.due_at === null || Number.isNaN(Date.parse(task.due_at)))
			return <span className="sy-dash__muted m-0 text-text-3 [overflow-wrap:anywhere]">{t("tasks.noDue")}</span>;
		const due = new Date(task.due_at);
		if (due.getTime() < now.getTime()) {
			const late = overdueDays(due, now);
			return (
				<span data-testid="dash-overdue-chip">
					<StatusPill tone="danger">
						{late >= 1 ? t("tasks.overdueDays", { days: formatNumber(late) }) : t("tasks.overdue")}
					</StatusPill>
				</span>
			);
		}
		return (
			<Badge>
				<Bdi>{formatDateTime(due)}</Bdi>
			</Badge>
		);
	};

	const followBody = () => {
		const states = [overdue.state, soon.state];
		if (states.some((s) => s.status === "loading")) return <LoadingState />;
		const ready = states.filter((s) => s.status === "ready").length;
		if (ready === 0) {
			const denied = states.every((s) => s.status === "error" && isForbidden(s.error));
			if (denied) return <ForbiddenState title={t("dash.noTaskAccess")} />;
			const err = states.find((s) => s.status === "error");
			return (
				<ErrorState
					title={t("dash.error")}
					requestId={err?.status === "error" ? requestIdOf(err.error) : null}
					onRetry={reloadTasks}
				/>
			);
		}
		const list = followList;
		if (list.length === 0)
			return (
				<EmptyState
					title={t("dash.follow.empty")}
					action={
						<Button variant="primary" icon="plus" onClick={openTask} data-testid="dash-empty-add-task">
							{t("tasks.action.new")}
						</Button>
					}
				/>
			);
		return (
			<ul className="sy-dash__list flex flex-col m-0 p-0 list-none" data-testid="dash-followup-list">
				{list.map((task) => {
					const rel = relatedOf(task);
					const relatedName = rel ? (knownNames.get(relatedKey(rel)) ?? fetchedNames.get(relatedKey(rel)) ?? null) : null;
					return (
						<li key={task.id} className="sy-dash__row flex items-center justify-between gap-12 min-h-[48px] py-8 border-b border-solid border-divider last:border-b-0 max-mobile:flex-wrap" data-testid="dash-followup">
							<div className="sy-dash__row-main flex flex-col min-w-0 gap-4">
								<a
									className="sy-dash__name m-0 font-[700] text-text [overflow-wrap:anywhere] no-underline hover:underline focus-visible:underline"
									href={`${href("/tasks")}?select=${task.id}`}
									onClick={(e) => {
										e.preventDefault();
										navigate("/tasks", `?select=${task.id}`);
									}}
								>
									<Bdi>{task.title}</Bdi>
								</a>
								{rel && relatedName ? (
									<span className="sy-dash__muted m-0 text-text-3 [overflow-wrap:anywhere]">
										<Bdi>
											<RelatedLink
												row={{ relatedKind: rel.kind, relatedId: rel.id, relatedName }}
											/>
										</Bdi>
									</span>
								) : null}
							</div>
							<div className="sy-dash__row-due flex-none max-mobile:flex-[1_1_100%]">{renderDue(task)}</div>
						</li>
					);
				})}
			</ul>
		);
	};

	// ---- W6 / W7 ------------------------------------------------------------------------------------------

	const reportGate = (children: (m: NonNullable<typeof marketing>) => ReactNode) => {
		const st = report.state;
		if (st.status === "loading") return <LoadingState />;
		if (st.status === "error")
			return isForbidden(st.error) ? (
				<ForbiddenState title={t("dash.noReportAccess")} />
			) : (
				<ErrorState title={t("dash.error")} requestId={requestIdOf(st.error)} onRetry={report.reload} />
			);
		if (!marketing) return null;
		if (marketing.empty)
			return (
				<EmptyState
					title={t("dash.report.empty")}
					hint={t("dash.report.emptyHint")}
					action={
						<a
							href={href("/reporting")}
							data-testid="dash-empty-report-link"
							onClick={(e) => {
								e.preventDefault();
								navigate("/reporting");
							}}
						>
							{t("dash.top.link")}
						</a>
					}
				/>
			);
		return children(marketing);
	};

	const reportLink = (testId: string) => (
		<a
			href={href("/reporting")}
			data-testid={testId}
			onClick={(e) => {
				e.preventDefault();
				navigate("/reporting");
			}}
		>
			{t("dash.top.link")}
		</a>
	);

	const snapshot = reportGate((m) => {
		const data = report.state.status === "ready" ? report.state.data : null;
		if (!data) return null;
		const cur = m.kpis.currency;
		const refundValue = m.refunds.value;
		return (
			<>
				<dl className="sy-dash__kv flex flex-col gap-8 m-0 [&>div]:flex [&>div]:items-baseline [&>div]:justify-between [&>div]:gap-12 [&>div]:min-w-0 [&_dt]:text-text-2 [&_dd]:m-0 [&_dd]:font-[600] [&_dd]:text-end [&_dd]:[overflow-wrap:anywhere]" data-testid="dash-snapshot">
					<div>
						<dt>{t("dash.mkt.spend")}</dt>
						<dd data-testid="dash-spend">{money(m.kpis.spend, cur)}</dd>
					</div>
					<div>
						<dt>{t("dash.mkt.conversions")}</dt>
						<dd data-testid="dash-conversions">
							<Bdi>{formatNumber(m.kpis.conversions)}</Bdi>
						</dd>
					</div>
					<div>
						<dt>{t("dash.mkt.refunds")}</dt>
						<dd data-testid="dash-refunds">
							{money(refundValue, cur)} <span className="sy-dash__muted m-0 text-text-3 [overflow-wrap:anywhere]">(<Bdi>{formatNumber(m.refunds.count)}</Bdi>)</span>
						</dd>
					</div>
					<div>
						<dt>{t("dash.mkt.unknown")}</dt>
						<dd data-testid="dash-unknown">
							<Bdi>{formatShare(m.kpis.unattributedShare, locale)}</Bdi>
						</dd>
					</div>
				</dl>
				<div className="sy-dash__meta mt-12 pt-10 border-t border-solid border-divider text-text-2 text-[0.875rem] [&_p]:m-0 [&_p]:mb-4 [&_p]:[overflow-wrap:anywhere]" data-testid="dash-meta">
					<p>
						{m.stale || data.as_of === null
							? t("dash.mkt.notCalculated")
							: tx("dash.mkt.asOf", { time: f.utc(data.as_of) })}
					</p>
					<p>{tx("dash.mkt.model", { model: f.label(data.model) })}</p>
					<p>{tx("dash.mkt.window", { n: formatNumber(data.lookback_days) })}</p>
				</div>
			</>
		);
	});

	const topCampaigns = reportGate((m) => {
		const name = (a: (typeof m.top)[number]) =>
			a.campaignId === "unknown" ? t("rep.unknown") : (a.name ?? a.campaignId);
		const cur = m.kpis.currency;
		if (m.top.length === 0)
			return <p className="sy-dash__muted m-0 text-text-3 [overflow-wrap:anywhere]">{t("dash.report.empty")}</p>;
		return narrow ? (
			<ul className="sy-dash__list flex flex-col m-0 p-0 list-none" data-testid="dash-campaign-cards">
				{m.top.map((a) => (
					<li key={a.key} className="sy-dash__card p-10 border border-solid border-border rounded-10 mb-8 min-h-[48px]" data-testid="dash-campaign-row">
						<p className="sy-dash__name m-0 font-[700] text-text [overflow-wrap:anywhere] no-underline hover:underline focus-visible:underline">
							<Bdi>{name(a)}</Bdi>
						</p>
						<dl className="sy-dash__kv sy-dash__kv--tight flex flex-col gap-8 m-0 [&>div]:flex [&>div]:items-baseline [&>div]:justify-between [&>div]:gap-12 [&>div]:min-w-0 [&_dt]:text-text-2 [&_dd]:m-0 [&_dd]:font-[600] [&_dd]:text-end [&_dd]:[overflow-wrap:anywhere] gap-4!">
							<div>
								<dt>{t("dash.top.revenue")}</dt>
								<dd>{money(a.revenue, cur)}</dd>
							</div>
							<div>
								<dt>{t("rep.col.roas")}</dt>
								<dd>
									<Bdi>{formatRoas(a.roas, locale)}</Bdi>
								</dd>
							</div>
							<div>
								<dt>{t("dash.mkt.conversions")}</dt>
								<dd>
									<Bdi>{formatNumber(a.outcomes)}</Bdi>
								</dd>
							</div>
						</dl>
					</li>
				))}
			</ul>
		) : (
			<div className="sy-dash__tablewrap max-w-full overflow-x-auto">
				<table className="sy-dash__table w-full border-collapse [&_th]:py-8 [&_th]:px-6 [&_th]:text-start [&_th]:border-b [&_th]:border-solid [&_th]:border-divider [&_th]:[overflow-wrap:anywhere] [&_td]:py-8 [&_td]:px-6 [&_td]:text-start [&_td]:border-b [&_td]:border-solid [&_td]:border-divider [&_td]:[overflow-wrap:anywhere] [&_thead_th]:text-text-2 [&_thead_th]:font-[600] [&_tbody_th]:font-[700]" data-testid="dash-campaign-table">
					<thead>
						<tr>
							<th scope="col">{t("rep.col.campaign")}</th>
							<th scope="col">{t("dash.top.revenue")}</th>
							<th scope="col">{t("rep.col.roas")}</th>
							<th scope="col">{t("dash.mkt.conversions")}</th>
						</tr>
					</thead>
					<tbody>
						{m.top.map((a) => (
							<tr key={a.key} data-testid="dash-campaign-row">
								<th scope="row">
									<Bdi>{name(a)}</Bdi>
								</th>
								<td>{money(a.revenue, cur)}</td>
								<td>
									<Bdi>{formatRoas(a.roas, locale)}</Bdi>
								</td>
								<td>
									<Bdi>{formatNumber(a.outcomes)}</Bdi>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		);
	});

	return (
		<div className="sy-dash flex flex-col gap-16 min-w-0 [&_a]:min-h-[24px] max-mobile:[&_a]:inline-flex max-mobile:[&_a]:items-center max-mobile:[&_a]:min-h-[44px] max-mobile:[&_.sy-page-header__actions]:w-full max-mobile:[&_.sy-page-header__actions]:ms-0" data-testid="dashboard-view">
			<PageHeader
				title={t("nav.dashboard")}
				subtitle={t("dash.subtitle")}
				actions={
					<div className="sy-dash__actions flex flex-wrap gap-8 max-mobile:w-full max-mobile:ms-0 max-mobile:[&_.sy-btn]:flex-1 max-mobile:[&_.sy-btn]:min-h-[44px]">
						<Button variant="primary" icon="plus" onClick={openTask} data-testid="dash-new-task">
							{t("tasks.action.new")}
						</Button>
						<Button icon="plus" onClick={openLead} data-testid="dash-new-lead">
							{t("action.newLead")}
						</Button>
					</div>
				}
				kpis={kpis}
			/>
			<div className="sy-dash__grid grid grid-cols-12 gap-16 min-w-0">
				<Panel
					className="sy-dash__follow col-start-1 col-span-8 max-[1024px]:col-span-full"
					title={t("dash.follow.title")}
					actions={
						<a
							href={href("/tasks")}
							data-testid="dash-tasks-link"
							onClick={(e) => {
								e.preventDefault();
								navigate("/tasks");
							}}
						>
							{t("dash.follow.link")}
						</a>
					}
					data-testid="dash-followups"
				>
					{followBody()}
				</Panel>
				<Panel className="sy-dash__mkt col-start-9 col-span-4 max-[1024px]:col-start-1 max-[1024px]:col-span-full" title={t("dash.mkt.title")} data-testid="dash-marketing">
					{snapshot}
				</Panel>
				<Panel
					className="sy-dash__top col-span-full"
					title={t("dash.top.title")}
					actions={reportLink("dash-report-link")}
					data-testid="dash-campaigns"
				>
					{topCampaigns}
				</Panel>
			</div>
			<div className="sy-dash__charts grid grid-cols-12 gap-16 min-w-0">{dashboardChartOrder(taskState.status === "ready" ? taskState.data.scope : undefined).map((widget) => {
				switch (widget) {
					case "pipeline": return <PipelineWidget key={widget} />;
					case "leads": return <LeadsWidget key={widget} />;
					case "outcomes": return <OutcomesWidget key={widget} />;
					case "tasks": return <TasksWidget key={`${widget}:${taskKey}`} state={taskState} onRetry={taskAggregate.reload} />;
					case "activity": return <ActivityWidget key={widget} />;
				}
				return null;
			})}</div>
			<NewTaskDialog
				open={taskOpen}
				onClose={() => setTaskOpen(false)}
				assignees={assignees}
				contacts={contacts.items}
				prefill={null}
				onCreated={() => {
					setTaskOpen(false);
					toast.notify(t("tasks.new.created"), "success");
					reloadTasks();
				}}
			/>
			<NewLeadDialog
				open={leadOpen}
				onClose={() => setLeadOpen(false)}
				assignees={assignees}
				onCreated={(lead) => {
					setLeadOpen(false);
					toast.notify(t("leads.new.created"), "success");
					navigate("/leads", `?select=${lead.id}`);
				}}
			/>
		</div>
	);
}
