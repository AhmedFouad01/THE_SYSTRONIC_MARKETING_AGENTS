import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { isApiError, isForbidden, sessionStore } from "../../api/index.ts";
import { navigate } from "../../router.ts";
import { readPref, writePref } from "../../ui/storage.ts";
import {
	Badge,
	Button,
	EmptyState,
	ErrorState,
	ForbiddenState,
	LoadingState,
	Ltr,
	Money,
	MenuButton,
	minorToMajorUnits,
	PageHeader,
	Select,
	useCursorList,
	useI18n,
	useToast,
} from "../../ui/index.ts";
import { NewDealDialog } from "../deals/NewDealDialog.tsx";
import {
	fetchAssignees,
	fetchContactsPage,
	fetchDeal,
	fetchDealsPage,
	fetchPipelines,
	transitionDeal,
} from "../deals/api.ts";
import { ConflictBanner, TRANSITION_ERR } from "../deals/DealDetail.tsx";
import { LostReasonDialog } from "../deals/LostReasonDialog.tsx";
import {
	type Assignee,
	allowedTargets,
	applyTransition,
	buildTransitionBody,
	classifyTransitionError,
	type Contact,
	currencyChoices,
	type Deal,
	dealValueText,
	mergeLatest,
	type Pipeline,
	type Stage,
	type TransitionErrorKind,
} from "../deals/model.ts";
import {
	columnKind,
	groupByStage,
	initialsOf,
	pickPipeline,
	type StageColumn,
} from "./model.ts";
import "../deals/deals.css";
import "./pipeline.css";

const lastPipelineKey = (tenantId: string) => `sy.pipeline.last.${tenantId}`;
const getDealId = (d: Deal) => d.id;
const getContactId = (c: Contact) => c.id;

type PipelinesState = {
	status: "loading" | "ready" | "error";
	items: readonly Pipeline[];
};
type Notice = { kind: TransitionErrorKind; dealId: string; title: string };

function DealCard({
	deal,
	pipeline,
	contactName,
	ownerName,
	assigned,
	moving,
	onMove,
}: {
	deal: Deal;
	pipeline: Pipeline;
	contactName: string;
	ownerName: string;
	assigned: boolean;
	moving: boolean;
	onMove: (deal: Deal, target: Stage) => void;
}) {
	const { t, formatMoney } = useI18n();
	const targets = allowedTargets(pipeline, deal.stage_id);
	return (
		<li
			className="sy-pipe__card"
			data-testid="pipeline-card"
			data-deal-id={deal.id}
			aria-busy={moving || undefined}
		>
			<button
				type="button"
				className="sy-pipe__open"
				data-testid="pipeline-card-open"
				onClick={() => navigate("/deals", `?select=${deal.id}`)}
			>
				<b className="sy-pipe__title" title={deal.title}>
					{deal.title}
				</b>
				<span className="sy-pipe__meta" title={contactName}>
					{contactName}
				</span>
				<span className="sy-pipe__foot">
					<span
						className={`sy-pipe__avatar${assigned ? "" : " sy-pipe__avatar--none"}`}
						role="img"
						aria-label={ownerName}
						title={ownerName}
						data-testid="pipeline-owner"
					>
						{assigned ? initialsOf(ownerName) : ""}
					</span>
					<span className="sy-pipe__value">
						<Money>{dealValueText(deal, formatMoney)}</Money>
					</span>
				</span>
			</button>
			<div className="sy-pipe__move">
				{moving ? (
					<span className="sy-pipe__meta" role="status">
						{t("common.working")}
					</span>
				) : targets.length > 0 ? (
					<MenuButton
						label={t("pipeline.move", { title: deal.title })}
						icon="dots"
						testId={`move-menu-${deal.id}`}
						items={targets.map((s) => ({
							id: s.id,
							label: s.name,
							testId: `move-option-${s.id}`,
							onSelect: () => onMove(deal, s),
						}))}
					/>
				) : (
					<span className="sy-sr-only" data-testid="pipeline-final">
						{t("pipeline.noMoves")}
					</span>
				)}
			</div>
		</li>
	);
}

function Column({
	col,
	pipeline,
	contactNames,
	ownerNames,
	moving,
	onMove,
}: {
	col: StageColumn;
	pipeline: Pipeline;
	contactNames: ReadonlyMap<string, string>;
	ownerNames: ReadonlyMap<string, string>;
	moving: ReadonlySet<string>;
	onMove: (deal: Deal, target: Stage) => void;
}) {
	const { t, formatMoney, formatNumber } = useI18n();
	const headId = useId();
	const kind = columnKind(col.stage);
	return (
		<section
			className={`sy-pipe__col sy-pipe__col--${kind}`}
			aria-labelledby={headId}
			data-testid="pipeline-column"
			data-stage-id={col.stage.id}
			data-kind={kind}
		>
			<header className="sy-pipe__head">
				<h2 className="sy-pipe__stage" id={headId}>
					{col.stage.name}
				</h2>
				<Badge
					tone={
						kind === "won" ? "success" : kind === "lost" ? "danger" : "neutral"
					}
				>
					<span
						title={t("pipeline.count", { count: formatNumber(col.count) })}
						data-testid="column-count"
					>
						<Ltr>{formatNumber(col.count)}</Ltr>
					</span>
				</Badge>
				{kind !== "open" ? (
					<span className="sy-pipe__kind">
						{t(kind === "won" ? "pipeline.kind.won" : "pipeline.kind.lost")}
					</span>
				) : null}
				<p className="sy-pipe__total" data-testid="column-total">
					<span className="sy-pipe__total-label">{t("pipeline.total")}</span>{" "}
					{col.totals.length === 0 ? (
						<Money>{formatMoney(0)}</Money>
					) : (
						col.totals.map((x) => (
							<Money key={x.currency}>
								<span className="sy-pipe__amount">
									{formatMoney(minorToMajorUnits(x.minor, x.currency), { currency: x.currency })}
								</span>
							</Money>
						))
					)}
				</p>
			</header>
			{col.deals.length === 0 ? (
				<p className="sy-pipe__empty" data-testid="column-empty">
					{t("pipeline.emptyColumn")}
				</p>
			) : (
				<ul className="sy-pipe__list">
					{col.deals.map((d) => (
						<DealCard
							key={d.id}
							deal={d}
							pipeline={pipeline}
							contactName={
								contactNames.get(d.contact_id) ?? t("deals.unknownContact")
							}
							ownerName={
								d.owner_id
									? (ownerNames.get(d.owner_id) ?? t("common.unknownUser"))
									: t("common.unassigned")
							}
							assigned={d.owner_id !== null}
							moving={moving.has(d.id)}
							onMove={onMove}
						/>
					))}
				</ul>
			)}
		</section>
	);
}

export function PipelineView() {
	const { t, formatNumber } = useI18n();
	const toast = useToast();
	const tenantId = sessionStore.getCredentials()?.tenantId ?? "";

	const deals = useCursorList<Deal>(fetchDealsPage, {
		getId: getDealId,
		resetKey: tenantId,
	});
	const contacts = useCursorList<Contact>(fetchContactsPage, {
		getId: getContactId,
		resetKey: tenantId,
	});
	const [assignees, setAssignees] = useState<readonly Assignee[]>([]);
	const [pipelines, setPipelines] = useState<PipelinesState>({
		status: "loading",
		items: [],
	});
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [remembered] = useState<string | null>(() => readPref(lastPipelineKey(tenantId)));
	const [newOpen, setNewOpen] = useState(false);

	const loadPipelines = useCallback((signal?: AbortSignal) => {
		setPipelines({ status: "loading", items: [] });
		fetchPipelines(signal)
			.then((items) => setPipelines({ status: "ready", items }))
			.catch((e: unknown) => {
				if (!(e instanceof DOMException))
					setPipelines({ status: "error", items: [] });
			});
	}, []);
	// biome-ignore lint/correctness/useExhaustiveDependencies: tenantId re-fetches directories for a new tenant
	useEffect(() => {
		const ctrl = new AbortController();
		fetchAssignees(ctrl.signal)
			.then(setAssignees)
			.catch(() => undefined);
		loadPipelines(ctrl.signal);
		return () => ctrl.abort();
	}, [tenantId, loadPipelines]);

	// Confirmed writes layered over the loaded pages; `pending` = optimistic moves awaiting the server.
	const [overlay, setOverlay] = useState<ReadonlyMap<string, Deal>>(new Map());
	const [pending, setPending] = useState<ReadonlyMap<string, string>>(
		new Map(),
	);
	const [notice, setNotice] = useState<Notice | null>(null);
	const [reloading, setReloading] = useState(false);
	const [lostFor, setLostFor] = useState<{ deal: Deal; stage: Stage } | null>(
		null,
	);

	const remember = useCallback(
		(deal: Deal) => setOverlay((m) => new Map(m).set(deal.id, deal)),
		[],
	);
	const allDeals = useMemo(
		() => mergeLatest(deals.items, overlay),
		[deals.items, overlay],
	);
	// The "most open deals" default is latched once the first deals page is in, so moving the last open deal to
	// Won/Lost (or paging in more deals) never flips the board to another pipeline under the user.
	const [autoId, setAutoId] = useState<string | null>(null);
	const initialLoaded = pipelines.status === "ready" && deals.status === "ready";
	const pipeline = pickPipeline(
		pipelines.items,
		allDeals,
		selectedId,
		autoId ?? remembered,
	);
	const pipelineId = pipeline?.id ?? null;
	useEffect(() => {
		if (initialLoaded && autoId === null && pipelineId !== null) setAutoId(pipelineId);
	}, [initialLoaded, autoId, pipelineId]);
	const currencies = useMemo(
		() => currencyChoices(allDeals.map((d) => d.currency)),
		[allDeals],
	);
	// The create dialog starts on the pipeline being viewed.
	const dialogPipelines = useMemo(
		() =>
			pipeline
				? [pipeline, ...pipelines.items.filter((p) => p.id !== pipeline.id)]
				: pipelines.items,
		[pipeline, pipelines.items],
	);
	const choosePipeline = (id: string) => {
		setSelectedId(id);
		writePref(lastPipelineKey(tenantId), id);
	};
	const onDealCreated = (deal: Deal) => {
		remember(deal);
		setNewOpen(false);
		toast.notify(t("deals.new.created"), "success");
	};
	const columns = useMemo(
		() => (pipeline ? groupByStage(pipeline, allDeals, pending) : []),
		[pipeline, allDeals, pending],
	);
	const contactNames = useMemo(
		() => new Map(contacts.items.map((c) => [c.id, c.display_name])),
		[contacts.items],
	);
	const ownerNames = useMemo(
		() => new Map(assignees.map((a) => [a.id, a.name])),
		[assignees],
	);
	const moving = useMemo(() => new Set(pending.keys()), [pending]);
	const inPipeline = columns.reduce((n, c) => n + c.count, 0);

	const run = async (deal: Deal, target: Stage, reason: string) => {
		setNotice(null);
		setPending((m) => new Map(m).set(deal.id, target.id));
		const done = () =>
			setPending((m) => {
				const n = new Map(m);
				n.delete(deal.id);
				return n;
			});
		try {
			const res = await transitionDeal(
				deal.id,
				buildTransitionBody(deal, target, reason, crypto.randomUUID()),
			);
			remember(applyTransition(deal, res));
			done();
			toast.notify(t("deals.stage.moved", { stage: target.name }), "success");
		} catch (e) {
			done(); // rollback: the card returns to its real stage
			setNotice({
				kind: classifyTransitionError(e),
				dealId: deal.id,
				title: deal.title,
			});
		}
	};
	const onMove = (deal: Deal, target: Stage) => {
		if (target.outcome === "lost") setLostFor({ deal, stage: target });
		else void run(deal, target, "");
	};
	const reload = async () => {
		if (notice === null) return;
		setReloading(true);
		try {
			remember(await fetchDeal(notice.dealId));
			setNotice(null);
		} catch {
			toast.notify(t("deals.edit.failed"), "error");
		} finally {
			setReloading(false);
		}
	};

	let body: React.ReactNode;
	if (pipelines.status === "loading" || deals.status === "loading") {
		body = <LoadingState />;
	} else if (pipelines.status === "error") {
		body = (
			<ErrorState
				title={t("pipeline.failed")}
				onRetry={() => loadPipelines()}
			/>
		);
	} else if (deals.status === "error") {
		body = isForbidden(deals.error) ? (
			<ForbiddenState />
		) : (
			<ErrorState
				requestId={isApiError(deals.error) ? deals.error.requestId : null}
				onRetry={deals.reload}
			/>
		);
	} else if (pipeline === null) {
		body = (
			<EmptyState
				title={t("pipeline.noPipelines.title")}
				hint={t("pipeline.noPipelines.hint")}
				action={
					// Admin configuration screen lands in S11; kept visibly disabled until then.
					<Button
						variant="secondary"
						disabled
						data-testid="pipeline-admin-link"
					>
						{t("pipeline.noPipelines.admin")}
					</Button>
				}
			/>
		);
	} else {
		body = (
			<>
				{inPipeline === 0 ? (
					<EmptyState
						title={t("pipeline.empty.title")}
						hint={t("pipeline.empty.hint")}
					/>
				) : null}
				{deals.sample ? (
					<div
						className="sy-pipe__sample"
						role="status"
						data-testid="pipeline-sample"
					>
						<span>
							{t(deals.atCap ? "grid.sampleCap" : "grid.sample", {
								count: formatNumber(deals.items.length),
							})}
						</span>
						{deals.moreError !== null ? (
							<span role="alert">{t("grid.loadMoreFailed")}</span>
						) : null}
						{deals.atCap ? null : (
							<Button
								size="sm"
								loading={deals.loadingMore}
								onClick={deals.loadMore}
								data-testid="pipeline-load-more"
							>
								{t("grid.loadMore")}
							</Button>
						)}
					</div>
				) : null}
				<div className="sy-pipe__board" data-testid="pipeline-board">
					{columns.map((c) => (
						<Column
							key={c.stage.id}
							col={c}
							pipeline={pipeline}
							contactNames={contactNames}
							ownerNames={ownerNames}
							moving={moving}
							onMove={onMove}
						/>
					))}
				</div>
			</>
		);
	}

	return (
		<div className="sy-deals sy-pipe" data-testid="pipeline-view">
			<PageHeader
				title={t("nav.pipeline")}
				actions={
					pipelines.items.length > 0 && pipeline ? (
						<>
							<Select
								label={t("pipeline.select")}
								name="pipeline"
								className="sy-pipe__select"
								value={pipeline.id}
								onChange={(e) => choosePipeline(e.target.value)}
								data-testid="pipeline-select"
							>
								{pipelines.items.map((p) => (
									<option key={p.id} value={p.id}>
										{p.name}
									</option>
								))}
							</Select>
							<Button
								variant="primary"
								icon="plus"
								onClick={() => setNewOpen(true)}
								data-testid="new-deal"
							>
								{t("action.newDeal")}
							</Button>
						</>
					) : null
				}
			/>
			{notice !== null ? (
				notice.kind === "conflict" ? (
					<ConflictBanner
						onReload={() => void reload()}
						reloading={reloading}
						testId="pipeline-conflict"
						reloadTestId="pipeline-reload"
						body="deals.err.stale"
					/>
				) : (
					<div
						className="sy-deals__banner"
						role="alert"
						data-testid="pipeline-error"
					>
						<b>{t("pipeline.moveFailed", { title: notice.title })}</b>
						<p>{t(TRANSITION_ERR[notice.kind])}</p>
						<Button size="sm" variant="ghost" onClick={() => setNotice(null)}>
							{t("pipeline.dismiss")}
						</Button>
					</div>
				)
			) : null}
			{body}
			<NewDealDialog
				open={newOpen}
				onClose={() => setNewOpen(false)}
				contacts={contacts.items}
				pipelines={dialogPipelines}
				assignees={assignees}
				currencies={currencies}
				prefill={null}
				onCreated={onDealCreated}
			/>
			<LostReasonDialog
				key={lostFor?.stage.id ?? "none"}
				stage={lostFor?.stage ?? null}
				onCancel={() => setLostFor(null)}
				onConfirm={(stage, reason) => {
					const target = lostFor;
					setLostFor(null);
					if (target !== null) void run(target.deal, stage, reason);
				}}
			/>
		</div>
	);
}
