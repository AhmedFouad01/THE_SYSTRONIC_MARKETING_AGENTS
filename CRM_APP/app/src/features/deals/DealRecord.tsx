import { type ReactNode, useCallback, useEffect, useState } from "react";
import { href, navigate } from "../../router.ts";
import {
	Badge,
	Bdi,
	Button,
	Icon,
	Money,
	PageHeader,
	Panel,
	RecordDetails,
	Tabs,
	useI18n,
} from "../../ui/index.ts";
import { fetchTasksPage } from "../tasks/api.ts";
import { AddTaskButton } from "../tasks/AddTaskButton.tsx";
import { DueLabel } from "../tasks/DueLabel.tsx";
import { dueBucket, type Task } from "../tasks/model.ts";
import {
	DealEditor,
	HistoryList,
	StageActions,
	StageBadge,
	StageFeedback,
	useStageMove,
} from "./DealDetail.tsx";
import { LostReasonDialog } from "./LostReasonDialog.tsx";
import {
	allowedTargets,
	type Assignee,
	type Deal,
	type DealRow,
	dealValueText,
	type Pipeline,
	type Stage,
	type StepState,
	splitMoves,
	stagePosition,
	stepperSteps,
} from "./model.ts";

type TabId = "overview" | "history" | "tasks";

const STEP_KEY = {
	done: "deals.stepper.done",
	current: "deals.stepper.current",
	upcoming: "deals.stepper.upcoming",
	won: "deals.stepper.won",
	lost: "deals.stepper.lost",
} as const satisfies Record<StepState, string>;

/** Stage stepper (prototype DealView): done = success tint + check, current = info outline, upcoming neutral. */
function DealStepper({
	deal,
	pipeline,
}: {
	deal: DealRow;
	pipeline: Pipeline | undefined;
}) {
	const { t } = useI18n();
	const steps = stepperSteps(pipeline, deal.stage_id);
	if (steps.length === 0) return null;
	return (
		<nav aria-label={t("deals.stepper.label")}>
			<ol className="sy-deals__stepper" data-testid="deal-stepper">
				{steps.map(({ stage, state }) => (
					<li
						key={stage.id}
						className="sy-deals__step"
						data-state={state}
						data-testid="deal-step"
						aria-current={
							state === "current" || state === "won" || state === "lost"
								? "step"
								: undefined
						}
					>
						{state === "done" || state === "won" ? (
							<Icon name="check" size={14} />
						) : null}
						<Bdi>{stage.name}</Bdi>
						<span className="sy-deals__sr">{t(STEP_KEY[state])}</span>
					</li>
				))}
			</ol>
		</nav>
	);
}

function StatCard({
	label,
	testId,
	children,
}: {
	label: string;
	testId: string;
	children: ReactNode;
}) {
	return (
		<div className="sy-deals__stat" data-testid={testId}>
			<p className="sy-deals__statlabel">{label}</p>
			<p className="sy-deals__statvalue">{children}</p>
		</div>
	);
}

type TaskState =
	| { s: "loading" }
	| { s: "error" }
	| { s: "ready"; items: Task[] };
const MAX_TASK_PAGES = 10;

/** Open and completed tasks linked to this deal (the tasks API has no deal filter: pages are scanned, capped). */
function DealTasks({
	deal,
	refreshKey,
	actors,
}: {
	deal: DealRow;
	refreshKey: number;
	actors: ReadonlyMap<string, string>;
}) {
	const { t } = useI18n();
	const [state, setState] = useState<TaskState>({ s: "loading" });
	// biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey re-reads after a task was added
	useEffect(() => {
		const ctrl = new AbortController();
		(async () => {
			const found: Task[] = [];
			let cursor: string | null = null;
			for (let i = 0; i < MAX_TASK_PAGES; i++) {
				const page = await fetchTasksPage({ cursor, signal: ctrl.signal });
				found.push(...page.items.filter((x) => x.deal_id === deal.id));
				cursor = page.nextCursor;
				if (cursor === null) break;
			}
			setState({ s: "ready", items: found });
		})().catch((e: unknown) => {
			if (!(e instanceof DOMException)) setState({ s: "error" });
		});
		return () => ctrl.abort();
	}, [deal.id, refreshKey]);
	if (state.s === "loading")
		return (
			<p className="sy-deals__muted" role="status">
				{t("deals.tasks.loading")}
			</p>
		);
	if (state.s === "error")
		return <p role="alert">{t("deals.tasks.failed")}</p>;
	if (state.items.length === 0)
		return (
			<p className="sy-deals__muted" data-testid="deal-tasks-empty">
				{t("deals.tasks.empty")}
			</p>
		);
	const now = new Date();
	return (
		<ul className="sy-deals__tasks" data-testid="deal-tasks">
			{state.items.map((task) => (
				<li key={task.id} className="sy-deals__task" data-testid="deal-task">
					<div className="sy-deals__tasktitle">
						<b>
							<Bdi>{task.title}</Bdi>
						</b>
						<span className="sy-deals__muted">
							<Bdi>{actors.get(task.owner_id) ?? t("common.unknownUser")}</Bdi>
						</span>
					</div>
					<DueLabel
						dueAt={task.due_at}
						bucket={dueBucket(task, now)}
						now={now}
						compact
					/>
					<Badge tone={task.status === "completed" ? "success" : "neutral"}>
						{t(
							task.status === "completed"
								? "tasks.status.completed"
								: "tasks.status.open",
						)}
					</Badge>
				</li>
			))}
		</ul>
	);
}

function Link({
	route,
	id,
	children,
}: {
	route: "/contacts" | "/leads";
	id: string;
	children: ReactNode;
}) {
	return (
		<a
			href={`${href(route)}?select=${id}`}
			onClick={(e) => {
				e.preventDefault();
				navigate(route, `?select=${id}`);
			}}
		>
			{children}
		</a>
	);
}

/**
 * Deal record (UX-03, prototype DealView): header with Mark lost / Mark won and stage menu, stage stepper, stat cards
 * and Overview / Activity / Tasks tabs. Rendered as a page from 1024px and inside the full-screen sheet below it.
 * Only real data is shown: no probability or expected close until the API has them.
 */
export function DealRecord({
	deal,
	pipeline,
	assignees,
	actors,
	currencies,
	onUpdated,
	onBack,
}: {
	deal: DealRow;
	pipeline: Pipeline | undefined;
	assignees: readonly Assignee[];
	actors: ReadonlyMap<string, string>;
	currencies: readonly string[];
	onUpdated: (deal: Deal) => void;
	/** Page mode only: back to the deals list. Omit in the sheet (its own Back button closes it). */
	onBack?: () => void;
}) {
	const { t, formatMoney } = useI18n();
	const [tab, setTab] = useState<TabId>("overview");
	const [editing, setEditing] = useState(false);
	const [lost, setLost] = useState<Stage | null>(null);
	const [taskKey, setTaskKey] = useState(0);
	const move = useStageMove(deal, onUpdated);
	const moves = splitMoves(allowedTargets(pipeline, deal.stage_id));
	const position = stagePosition(pipeline, deal.stage_id);
	const refreshTasks = useCallback(() => setTaskKey((k) => k + 1), []);

	return (
		<div className="sy-deals__record" data-testid="deal-detail">
			{onBack ? (
				<Button
					variant="ghost"
					size="sm"
					icon="chevronRight"
					className="sy-deals__back"
					onClick={onBack}
					data-testid="deal-back"
				>
					{t("deals.record.back")}
				</Button>
			) : null}
			<PageHeader
				eyebrow={t("deals.eyebrow")}
				title={<Bdi>{deal.title}</Bdi>}
				titleTestId="deal-detail-title"
				subtitle={
					<span data-testid="deal-detail-subtitle">
						<Bdi>{deal.contactName}</Bdi>
						{deal.pipelineName ? (
							<>
								{" · "}
								<Bdi>{deal.pipelineName}</Bdi>
							</>
						) : null}
					</span>
				}
				actions={
					<StageActions
						moves={moves}
						busy={move.busy}
						onLost={setLost}
						onWon={(s) => void move.run(s, "")}
						onMove={(s) => void move.run(s, "")}
					/>
				}
			/>
			<StageFeedback move={move} />
			<LostReasonDialog
				key={lost?.id ?? "none"}
				stage={lost}
				busy={move.busy}
				onCancel={() => setLost(null)}
				onConfirm={(stage, reason) => {
					void move.run(stage, reason).then(() => setLost(null));
				}}
			/>
			<div className="sy-deals__card sy-deals__steps">
				<DealStepper deal={deal} pipeline={pipeline} />
			</div>
			<div className="sy-deals__stats" data-testid="deal-stats">
				<StatCard label={t("common.value")} testId="deal-stat-value">
					<span data-testid="deal-detail-value">
						<Money>{dealValueText(deal, formatMoney)}</Money>
					</span>
				</StatCard>
				<StatCard label={t("common.stage")} testId="deal-stat-stage">
					<StageBadge deal={deal} />
				</StatCard>
				{position ? (
					<StatCard
						label={t("deals.stat.progress")}
						testId="deal-stat-progress"
					>
						{t("deals.stat.progressValue", {
							index: position.index,
							total: position.total,
						})}
					</StatCard>
				) : null}
				<StatCard label={t("common.owner")} testId="deal-stat-owner">
					<Bdi>{deal.ownerName}</Bdi>
				</StatCard>
			</div>
			<Tabs
				label={t("deals.tabs")}
				value={tab}
				onChange={(id) => setTab(id as TabId)}
				tabs={[
					{
						id: "overview",
						label: t("deals.tab.overview"),
						panel: (
							<Panel
								title={t("deals.overview.title")}
								actions={
									editing ? (
										<Button
											size="sm"
											variant="ghost"
											onClick={() => setEditing(false)}
											data-testid="deal-edit-cancel"
										>
											{t("record.cancelEdit")}
										</Button>
									) : (
										<Button
											size="sm"
											icon="edit"
											onClick={() => setEditing(true)}
											data-testid="record-edit"
										>
											{t("record.edit")}
										</Button>
									)
								}
								data-testid="deal-overview"
							>
								{editing ? (
									// biome-ignore lint/a11y/noStaticElementInteractions: Escape leaves edit mode; popovers (Select) consume their own Escape first
									<div
										data-testid="record-editor"
										onKeyDown={(e) => {
											if (e.key !== "Escape" || e.defaultPrevented) return;
											e.preventDefault();
											e.stopPropagation();
											setEditing(false);
										}}
									>
										<DealEditor
											key={`${deal.id}:${deal.version}`}
											deal={deal}
											assignees={assignees}
											currencies={currencies}
											onUpdated={onUpdated}
											onDone={() => setEditing(false)}
										/>
									</div>
								) : (
									<dl className="sy-record__facts" data-testid="record-facts">
										<div className="sy-record__fact">
											<dt>{t("deals.detail.contact")}</dt>
											<dd>
												<Link route="/contacts" id={deal.contact_id}>
													<Bdi>{deal.contactName}</Bdi>
												</Link>
											</dd>
										</div>
										<div className="sy-record__fact">
											<dt>{t("deals.detail.pipeline")}</dt>
											<dd>
												<Bdi>{deal.pipelineName}</Bdi>
											</dd>
										</div>
										<div className="sy-record__fact">
											<dt>{t("deals.field.currency")}</dt>
											<dd>
												<bdi dir="ltr">{deal.currency}</bdi>
											</dd>
										</div>
										{deal.lead_id ? (
											<div className="sy-record__fact">
												<dt>{t("deals.context.lead")}</dt>
												<dd>
													<Link route="/leads" id={deal.lead_id}>
														{t("deals.context.lead")}
													</Link>
												</dd>
											</div>
										) : null}
									</dl>
								)}
								<RecordDetails
									rows={[
										{
											label: t("deals.detail.id"),
											value: deal.id,
											copyable: true,
										},
										{
											label: t("deals.detail.version"),
											value: deal.version,
											testId: "deal-version",
										},
									]}
								/>
							</Panel>
						),
					},
					{
						id: "history",
						label: t("deals.tab.history"),
						panel: (
							<Panel title={t("deals.tab.history")}>
								<HistoryList
									dealId={deal.id}
									version={deal.version}
									pipeline={pipeline}
									actors={actors}
								/>
							</Panel>
						),
					},
					{
						id: "tasks",
						label: t("deals.tab.tasks"),
						panel: (
							<Panel
								title={t("deals.tab.tasks")}
								actions={
									<AddTaskButton
										contactId={deal.contact_id}
										dealId={deal.id}
										label={deal.title}
										onCreated={refreshTasks}
									/>
								}
							>
								<DealTasks deal={deal} refreshKey={taskKey} actors={actors} />
							</Panel>
						),
					},
				]}
			/>
		</div>
	);
}
