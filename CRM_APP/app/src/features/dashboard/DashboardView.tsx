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
import { cappedCount, formatCapped } from "../capped.ts";
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
import "./dashboard.css";
import { PipelineWidget } from "./PipelineWidget.tsx";
import { LeadsWidget } from "./LeadsWidget.tsx";

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

	// W1/W2 are server counts (`total_count`), not a count of one loaded page.
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

	const overdueC =
		overdue.state.status === "ready"
			? cappedCount(overdue.state.data.total?.value ?? overdue.state.data.items.length, overdue.state.data.total?.exact === false)
			: null;
	const soonC =
		soon.state.status === "ready"
			? cappedCount(soon.state.data.total?.value ?? soon.state.data.items.length, soon.state.data.total?.exact === false)
			: null;
	const emph = emphasis({
		overdue: overdueC?.count ?? null,
		revenue: marketing && !marketing.empty ? marketing.kpis.revenue : null,
		stale: marketing?.stale ?? true,
	});

	const capHint = (n: number) => t("dash.capped", { count: formatNumber(n) });

	// ---- KPI cards ----------------------------------------------------------------------------------------

	const taskCard = (
		testId: string,
		label: string,
		load: Load<unknown>,
		reload: () => void,
		c: ReturnType<typeof cappedCount> | null,
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
		const count = c ?? { count: 0, capped: false };
		return (
			<KpiCard
				testId={testId}
				label={label}
				tone={tone}
				value={formatCapped(count, formatNumber)}
				sub={count.capped ? capHint(count.count) : count.count === 0 ? none : sub}
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
		<section className="sy-dash__kpis" aria-label={t("dash.kpis")} data-testid="dash-kpis">
			{taskCard(
				"kpi-overdue",
				t("dash.overdue.label"),
				overdue.state,
				overdue.reload,
				overdueC,
				t("dash.overdue.sub"),
				t("dash.overdue.none"),
				emph.overdue === "navy" ? "navy" : "neutral",
			)}
			{taskCard(
				"kpi-next24h",
				t("dash.next.label"),
				soon.state,
				soon.reload,
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
			return <span className="sy-dash__muted">{t("tasks.noDue")}</span>;
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
			<ul className="sy-dash__list" data-testid="dash-followup-list">
				{list.map((task) => {
					const rel = relatedOf(task);
					const relatedName = rel ? (knownNames.get(relatedKey(rel)) ?? fetchedNames.get(relatedKey(rel)) ?? null) : null;
					return (
						<li key={task.id} className="sy-dash__row" data-testid="dash-followup">
							<div className="sy-dash__row-main">
								<a
									className="sy-dash__name"
									href={`${href("/tasks")}?select=${task.id}`}
									onClick={(e) => {
										e.preventDefault();
										navigate("/tasks", `?select=${task.id}`);
									}}
								>
									<Bdi>{task.title}</Bdi>
								</a>
								{rel && relatedName ? (
									<span className="sy-dash__muted">
										<Bdi>
											<RelatedLink
												row={{ relatedKind: rel.kind, relatedId: rel.id, relatedName }}
											/>
										</Bdi>
									</span>
								) : null}
							</div>
							<div className="sy-dash__row-due">{renderDue(task)}</div>
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
				<dl className="sy-dash__kv" data-testid="dash-snapshot">
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
							{money(refundValue, cur)} <span className="sy-dash__muted">(<Bdi>{formatNumber(m.refunds.count)}</Bdi>)</span>
						</dd>
					</div>
					<div>
						<dt>{t("dash.mkt.unknown")}</dt>
						<dd data-testid="dash-unknown">
							<Bdi>{formatShare(m.kpis.unattributedShare, locale)}</Bdi>
						</dd>
					</div>
				</dl>
				<div className="sy-dash__meta" data-testid="dash-meta">
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
			return <p className="sy-dash__muted">{t("dash.report.empty")}</p>;
		return narrow ? (
			<ul className="sy-dash__list" data-testid="dash-campaign-cards">
				{m.top.map((a) => (
					<li key={a.key} className="sy-dash__card" data-testid="dash-campaign-row">
						<p className="sy-dash__name">
							<Bdi>{name(a)}</Bdi>
						</p>
						<dl className="sy-dash__kv sy-dash__kv--tight">
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
			<div className="sy-dash__tablewrap">
				<table className="sy-dash__table" data-testid="dash-campaign-table">
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
		<div className="sy-dash" data-testid="dashboard-view">
			<PageHeader
				title={t("nav.dashboard")}
				subtitle={t("dash.subtitle")}
				actions={
					<div className="sy-dash__actions">
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
			<div className="sy-dash__grid">
				<Panel
					className="sy-dash__follow"
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
				<Panel className="sy-dash__mkt" title={t("dash.mkt.title")} data-testid="dash-marketing">
					{snapshot}
				</Panel>
				<Panel
					className="sy-dash__top"
					title={t("dash.top.title")}
					actions={reportLink("dash-report-link")}
					data-testid="dash-campaigns"
				>
					{topCampaigns}
				</Panel>
			</div>
			<div className="sy-dash__charts"><PipelineWidget /><LeadsWidget /></div>
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
