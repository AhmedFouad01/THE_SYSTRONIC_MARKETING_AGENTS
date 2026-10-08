import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	isApiError,
	isForbidden,
	isVersionConflict,
	sessionStore,
	useSession,
} from "../../api/index.ts";
import {
	Button,
	createSavedViewsStore,
	DataGrid,
	IdentityCell,
	DEFAULT_VIEW,
	ForbiddenState,
	type GridColumn,
	type MessageKey,
	PageHeader,
	safeLocalStorage,
	StatusPill,
	Tabs,
	useCursorList,
	useI18n,
	useToast,
	type ViewState,
	enumFilter,
	ownerFilter,
	type ServerSpec,
	useServerList,
	parsePreview,
	previewStep,
	usePreviewGuard,
	withPreview,
} from "../../ui/index.ts";
import { useCrumbReturn, useRecordCrumb } from "../../ui/shell/index.ts";
import { carryExpand } from "../expand.ts";
import { toRoute } from "../../router.ts";
import {
	type Assignee,
	type ContactRef,
	fetchAssignees,
	fetchContactRefsPage,
	patchTask,
} from "./api.ts";
import { rowProps, useCustomColumns } from "../properties/CustomColumns.tsx";
import { fetchExpanded, listFetcher } from "../listApi.ts";
import { useDealTitles } from "./useDealTitles.ts";
import { DueLabel } from "./DueLabel.tsx";
import {
	type BulkCompleteItem,
	completeBody,
	mergeLatest,
	runBulkComplete,
	TASK_TABS,
	tabQuery,
	type Task,
	type TaskRow,
	type TaskTab,
	toRows,
} from "./model.ts";
import { NewTaskDialog } from "./NewTaskDialog.tsx";
import { RelatedLink } from "./RelatedLink.tsx";
import { SOURCE_KEY, TaskDetail } from "./TaskDetail.tsx";

const TAB_LABEL: Record<TaskTab, MessageKey> = {
	open: "tasks.tab.open",
	overdue: "tasks.tab.overdue",
	today: "tasks.tab.today",
	upcoming: "tasks.tab.upcoming",
	none: "tasks.tab.none",
	done: "tasks.tab.done",
};

const INITIAL_VIEW: ViewState = {
	...DEFAULT_VIEW,
	// Source is rarely informative ("Not recorded"): hidden by default, available in Columns (UX-17).
	hidden: ["source"],
	sorts: [{ key: "due", dir: "asc" }],
};

const getRowId = (r: TaskRow) => r.id;
const getTaskId = (t: Task) => t.id;
const getRefId = (r: { id: string }) => r.id;
const fetchTasks = listFetcher<Task>("tasks");

/** Wall clock that re-evaluates due buckets once a minute. */
function useNow(): Date {
	const [now, setNow] = useState(() => new Date());
	useEffect(() => {
		const id = setInterval(() => setNow(new Date()), 60_000);
		return () => clearInterval(id);
	}, []);
	return now;
}

export function TasksView() {
	const { t, formatNumber } = useI18n();
	const toast = useToast();
	const session = useSession();
	const actor = session.info?.actor ?? null;
	const tenantId = sessionStore.getCredentials()?.tenantId ?? "";
	const now = useNow();

	const [tab, setTab] = useState<TaskTab>("open");
	// Every tab is a server query (status / due_at conditions, or the server's own `due=overdue` clock): exact totals.
	const [anchor, setAnchor] = useState(() => new Date());
	const tabQ = useMemo(() => tabQuery(tab, anchor), [tab, anchor]);
	const chooseTab = (next: TaskTab) => {
		setAnchor(new Date());
		setTab(next);
	};

	const [assignees, setAssignees] = useState<readonly Assignee[]>([]);
	const [ownersFailed, setOwnersFailed] = useState(false);
	// biome-ignore lint/correctness/useExhaustiveDependencies: tenantId re-fetches the directory for a new tenant
	useEffect(() => {
		const ctrl = new AbortController();
		fetchAssignees(ctrl.signal)
			.then((a) => {
				setAssignees(a);
				setOwnersFailed(false);
			})
			.catch((e: unknown) => {
				if (!(e instanceof DOMException)) setOwnersFailed(true);
			});
		return () => ctrl.abort();
	}, [tenantId]);

	// Confirmed writes (PATCH/POST results) layered over the loaded pages.
	const [overlay, setOverlay] = useState<ReadonlyMap<string, Task>>(new Map());
	// A write can move a task between tabs (status / due date): re-ask the server after every confirmed write.
	const reloadRef = useRef<() => void>(() => undefined);
	const remember = useCallback((task: Task) => {
		setOverlay((m) => new Map(m).set(task.id, task));
		reloadRef.current();
	}, []);

	// Open record = preview slide-over; `?preview=<id>` (legacy `?select=` accepted) keeps it across reloads and deep links.
	const [activeId, setActiveId] = useState<string | null>(() =>
		parsePreview(location.search),
	);
	const { guard, dialog: guardDialog } = usePreviewGuard();
	// Every way to leave or swap the open record asks first when the edit form holds unsaved changes.
	const openRecord = useCallback(
		(id: string | null) => guard.request(() => setActiveId(id)),
		[guard],
	);
	useEffect(() => {
		if (toRoute(location.pathname) !== "/tasks") return;
		const next = withPreview(location.search, activeId);
		if (next !== location.search)
			history.replaceState(history.state, "", `${location.pathname}${next}${location.hash}`);
	}, [activeId]);
	// The open record outlives the loaded pages (tab/filter/sort/reload can drop its row; a deep link may point past page 1):
	// the last seen copy is retained, and a record that was never loaded is fetched by id.
	const [fallback, setFallback] = useState<Task | null>(null);
	const [missing, setMissing] = useState<string | null>(null);
	const [newOpen, setNewOpen] = useState(false);

	const ownerByName = useMemo(
		() => new Map(assignees.map((a) => [a.name, a.id])),
		[assignees],
	);
	const spec = useMemo<ServerSpec>(
		() => ({
			sort: { title: "title", due: "due_at", status: "status" },
			defaultSort: "due_at",
			filters: {
				owner: ownerFilter(ownerByName),
				status: enumFilter("status", ["open", "completed"]),
			},
		}),
		[ownerByName],
	);
	const cc = useCustomColumns<TaskRow>({ object: "task", gridId: "tasks", baseSpec: spec, getProps: rowProps });
	const listExtra = useMemo(() => [...tabQ.nodes, ...cc.extra], [tabQ.nodes, cc.extra]);
	const tasks = useServerList<Task>({
		fetchPage: fetchTasks,
		getId: getTaskId,
		spec: cc.spec,
		props: cc.props,
		initial: INITIAL_VIEW,
		initialPageSize: INITIAL_VIEW.pageSize,
		extra: listExtra,
		...(tabQ.due ? { due: tabQ.due } : {}),
		expand: "contact,owner",
		resetKey: tenantId,
	});
	// Contact picker of the create dialog (F-08 is a later track): loaded only once the dialog opens.
	const contacts = useCursorList<ContactRef>(fetchContactRefsPage, {
		getId: getRefId,
		resetKey: tenantId,
		enabled: newOpen,
	});
	reloadRef.current = tasks.reload;
	const dealIds = useMemo(() => [...tasks.items.map((x) => x.deal_id), fallback?.deal_id ?? null], [tasks.items, fallback]);
	const dealNames = useDealTitles(dealIds, tenantId);

	const ownerNames = useMemo(
		() => new Map(assignees.map((a) => [a.id, a.name])),
		[assignees],
	);
	const allRows = useMemo(
		() =>
			toRows(
				mergeLatest(tasks.items, overlay, false),
				dealNames,
				ownerNames,
				{ unknown: t("tasks.unknownRecord"), unknownOwner: t("common.unknownUser") },
				now,
			),
		[tasks.items, overlay, dealNames, ownerNames, t, now],
	);
	const rows = allRows;
	const rowsRef = useRef(allRows);
	useEffect(() => {
		rowsRef.current = allRows;
	});
	// A task written this session still opens in the detail panel when the server list no longer returns it (e.g. completed on the Open tab).
	const overlayRows = useMemo(
		() => toRows([...overlay.values()], dealNames, ownerNames, { unknown: t("tasks.unknownRecord"), unknownOwner: t("common.unknownUser") }, now),
		[overlay, dealNames, ownerNames, t, now],
	);
	const found =
		activeId === null
			? null
			: (allRows.find((r) => r.id === activeId) ?? overlayRows.find((r) => r.id === activeId) ?? null);
	useEffect(() => {
		if (found !== null) setFallback(found);
	}, [found]);
	useEffect(() => {
		if (activeId === null || found !== null || fallback?.id === activeId) return;
		const ctrl = new AbortController();
		fetchExpanded<Task>("tasks", activeId, "contact,owner", ctrl.signal)
			.then((x) => {
				if (ctrl.signal.aborted) return;
				if (x) setFallback(x);
				else setMissing(activeId);
			})
			.catch((e: unknown) => {
				if (!ctrl.signal.aborted && !(e instanceof DOMException)) setMissing(activeId);
			});
		return () => ctrl.abort();
	}, [activeId, found, fallback]);
	const fallbackRow = useMemo(
		() =>
			fallback === null
				? null
				: (toRows([fallback], dealNames, ownerNames, { unknown: t("tasks.unknownRecord"), unknownOwner: t("common.unknownUser") }, now)[0] ?? null),
		[fallback, dealNames, ownerNames, t, now],
	);
	const active = found ?? (fallbackRow !== null && fallbackRow.id === activeId ? fallbackRow : null);
	const onRecordUpdated = useCallback(
		(task: Task) => {
			remember(task);
			// The overlay only decorates loaded rows: a record opened by id keeps its own retained copy current too.
			setFallback((prev) => (prev !== null && prev.id === task.id ? carryExpand(task, prev) : prev));
		},
		[remember],
	);

	// Prev/Next over the loaded rows in grid order; at the last loaded row the next server page is loaded first.
	const ids = useMemo(() => rows.map((r) => r.id), [rows]);
	const step = previewStep(ids, activeId, tasks.hasMore);
	const [wantMore, setWantMore] = useState<string | null>(null);
	const { server: tasksServer } = tasks;
	useEffect(() => {
		if (wantMore === null) return;
		if (activeId !== wantMore || tasksServer.moreFailed) {
			setWantMore(null);
			return;
		}
		if (step.nextId !== null) {
			setWantMore(null);
			setActiveId(step.nextId);
		} else if (!tasks.hasMore && !tasksServer.loadingMore) setWantMore(null);
	}, [wantMore, activeId, step.nextId, tasks.hasMore, tasksServer.moreFailed, tasksServer.loadingMore]);
	const goNext = () => {
		if (step.nextId !== null) openRecord(step.nextId);
		else if (step.needsMore && !tasks.refreshing)
			guard.request(() => {
				setWantMore(activeId);
				tasksServer.onRetryMore();
			});
	};
	const listTotal = Math.max(tasks.total?.value ?? 0, ids.length);
	const lastActive = useRef<string | null>(null);
	useEffect(() => {
		if (activeId !== null) lastActive.current = activeId;
	}, [activeId]);
	const preview = {
		guard,
		returnFocus: () =>
			lastActive.current === null
				? null
				: document.querySelector<HTMLElement>(`tr[data-row-id="${lastActive.current}"]`),
		nav: {
			onPrev: step.prevId !== null && !tasks.refreshing ? () => openRecord(step.prevId) : null,
			onNext: (step.nextId !== null || step.needsMore) && !tasks.refreshing ? goNext : null,
			busy: wantMore !== null,
			...(step.index >= 0
				? {
						position: t("preview.position", {
							index: formatNumber(step.index + 1),
							total: formatNumber(listTotal),
						}),
					}
				: {}),
		},
	};
	// Breadcrumb `CRM > list > record`: the list crumb closes the record (filters/sort/view stay: the view is mounted).
	const crumbReturn = useCrumbReturn(openRecord);
	useRecordCrumb(active?.title, crumbReturn.back);

	const views = useMemo(
		() =>
			actor && tenantId
				? createSavedViewsStore({
						storage: safeLocalStorage(),
						tenantId,
						actor,
						gridId: "tasks",
					})
				: undefined,
		[actor, tenantId],
	);

	const ownerOptions = useMemo(
		() =>
			[...assignees]
				.sort((a, b) => a.name.localeCompare(b.name))
				.map((a) => ({ value: a.id, label: a.name })),
		[assignees],
	);

	// ---- complete (row action) ----
	const [completingId, setCompletingId] = useState<string | null>(null);
	const reloadTasks = tasks.reload;
	const completeRow = useCallback(
		async (row: TaskRow) => {
			setCompletingId(row.id);
			try {
				remember(
					await patchTask(row.id, completeBody(row, crypto.randomUUID())),
				);
				toast.notify(t("tasks.complete.done"), "success");
			} catch (e) {
				if (isVersionConflict(e)) {
					toast.notify(t("tasks.complete.conflict"), "error");
					reloadTasks();
				} else if (isForbidden(e)) {
					toast.notify(t("tasks.complete.forbidden"), "error");
				} else {
					toast.notify(
						isApiError(e) && e.safeMessage
							? e.safeMessage
							: t("tasks.complete.failed"),
						"error",
					);
				}
			} finally {
				setCompletingId(null);
			}
		},
		[remember, toast, t, reloadTasks],
	);

	const columns = useMemo<ReadonlyArray<GridColumn<TaskRow>>>(
		() => [
			{
				id: "title",
				header: t("tasks.col.task"),
				value: (r) => r.title,
				sortable: true,
				hideable: false,
				mobile: "title",
				cell: (r) => <IdentityCell name={r.title} caption={r.relatedName} />,
			},
			{
				id: "related",
				header: t("tasks.col.related"),
				value: (r) => r.relatedName,
				width: "160px",
				mobile: "hide",
				collapse: 1,
				titleText: (r) => r.relatedName,
				cell: (r) => <RelatedLink row={r} />,
			},
			{
				id: "due",
				header: t("tasks.col.due"),
				value: (r) => r.dueMs,
				searchable: false,
				sortable: true,
				width: "170px",
				cell: (r) => (
					<DueLabel dueAt={r.due_at} bucket={r.bucket} now={now} compact />
				),
			},
			{
				id: "owner",
				header: t("common.owner"),
				value: (r) => r.ownerName,
				width: "130px",
				filter: { options: ownerOptions },
			},
			{
				id: "status",
				header: t("tasks.col.status"),
				value: (r) => r.status,
				sortable: true,
				width: "110px",
				mobile: "chip",
				collapse: 1,
				filter: {
					options: [
						{ value: "open", label: t("tasks.status.open") },
						{ value: "completed", label: t("tasks.status.completed") },
					],
				},
				cell: (r) => (
					<StatusPill tone={r.status === "completed" ? "success" : "info"}>
						{t(
							r.status === "completed"
								? "tasks.status.completed"
								: "tasks.status.open",
						)}
					</StatusPill>
				),
			},
			{
				id: "source",
				header: t("common.source"),
				value: (r) => t(SOURCE_KEY[r.sourceKind]),
				width: "120px",
				mobile: "hide",
				cell: (r) => (
					<span data-testid="task-source" data-source={r.sourceKind}>
						{r.sourceKind === "automation" ? (
							<StatusPill tone="warning">
								{t(SOURCE_KEY[r.sourceKind])}
							</StatusPill>
						) : (
							t(SOURCE_KEY[r.sourceKind])
						)}
					</span>
				),
			},
			{
				id: "actions",
				header: t("tasks.col.actions"),
				value: () => "",
				searchable: false,
				hideable: false,
				width: "56px",
				headerHidden: true,
				mobile: "action",
				cell: (r) =>
					r.status === "open" ? (
						<Button
							size="sm"
							className="sy-tasks__complete w-[32px] px-0! [&_.sy-btn__label]:sr-only max-[769px]:w-auto max-[769px]:px-10! max-[769px]:[&_.sy-btn__label]:not-sr-only max-[769px]:[&_.sy-btn__label]:whitespace-nowrap"
							icon="success"
							title={t("tasks.action.complete")}
							loading={completingId === r.id}
							disabled={completingId !== null}
							aria-label={t("tasks.action.completeTask", { title: r.title })}
							onClick={() => void completeRow(r)}
							data-testid="row-complete"
						>
							{t("tasks.action.complete")}
						</Button>
					) : null,
			},
		],
		[t, ownerOptions, now, completingId, completeRow],
	);

	// ---- bulk complete ----
	const [bulk, setBulk] = useState<{ done: number; total: number } | null>(
		null,
	);
	const completeSelected = async (
		ids: readonly string[],
		clear: () => void,
	) => {
		const byId = new Map(rowsRef.current.map((r) => [r.id, r]));
		const items: BulkCompleteItem[] = ids.flatMap((id) => {
			const r = byId.get(id);
			return r
				? [{ id, version: r.version, done: r.status === "completed" }]
				: [];
		});
		setBulk({ done: 0, total: items.length });
		const { summary } = await runBulkComplete(
			items,
			async (item) => {
				remember(
					await patchTask(item.id, completeBody(item, crypto.randomUUID())),
				);
			},
			(done, total) => setBulk({ done, total }),
		);
		setBulk(null);
		const failed = summary.failed.length + summary.notAttempted.length;
		const parts: string[] = [];
		if (failed === 0)
			parts.push(
				t("tasks.bulk.ok", { count: formatNumber(summary.succeeded.length) }),
			);
		else if (summary.succeeded.length === 0)
			parts.push(t("tasks.bulk.failed", { failed: formatNumber(failed) }));
		else
			parts.push(
				t("tasks.bulk.partial", {
					ok: formatNumber(summary.succeeded.length),
					failed: formatNumber(failed),
				}),
			);
		if (summary.skipped.length > 0)
			parts.push(
				t("tasks.bulk.skipped", {
					count: formatNumber(summary.skipped.length),
				}),
			);
		if (summary.notAttempted.length > 0)
			parts.push(
				t("tasks.bulk.stopped", {
					count: formatNumber(summary.notAttempted.length),
				}),
			);
		// Any failure goes through the assertive (alert) region and stays until dismissed.
		toast.notify(parts.join(" "), failed === 0 ? "success" : "error");
		clear();
		if (summary.failed.some((f) => f.kind === "version_conflict"))
			tasks.reload();
	};

	const onCreated = (task: Task) => {
		remember(task);
		void fetchExpanded<Task>("tasks", task.id, "contact,owner")
			.then((full) => full && remember(full))
			.catch(() => undefined);
		setAnchor(new Date());
		tasks.reload();
		setTab("open");
		setActiveId(task.id);
		setNewOpen(false);
		toast.notify(t("tasks.new.created"), "success");
	};

	const gridColumns = useMemo(() => [...columns, ...cc.columns], [columns, cc.columns]);

	return (
		<div className="sy-tasks flex flex-col gap-12 min-w-0" data-testid="tasks-view">
			<PageHeader
				title={t("nav.tasks")}
				actions={
					<Button
						variant="primary"
						icon="plus"
						onClick={() => setNewOpen(true)}
						data-testid="new-task"
					>
						{t("tasks.action.new")}
					</Button>
				}
			/>
			<Tabs
				label={t("tasks.tabs")}
				value={tab}
				onChange={(id) => chooseTab(id as TaskTab)}
				tabs={TASK_TABS.map((v) => ({ id: v, label: t(TAB_LABEL[v]) }))}
			/>
			{ownersFailed ? (
				<p className="sy-tasks__muted m-0 mt-4 text-text-3" role="status">
					{t("tasks.ownersFailed")}
				</p>
			) : null}
			<div className="sy-tasks__body min-w-0">
				<div className="sy-tasks__main min-w-0 flex flex-col gap-8">
					{bulk ? (
						<p
							role="status"
							className="sy-tasks__muted m-0 mt-4 text-text-3"
							data-testid="bulk-progress"
						>
							{t("tasks.bulk.progress", {
								done: formatNumber(bulk.done),
								total: formatNumber(bulk.total),
							})}
						</p>
					) : null}
					{tasks.status === "error" && isForbidden(tasks.error) ? (
						<ForbiddenState />
					) : (
						<DataGrid<TaskRow>
							gridId="tasks"
							label={t("tasks.grid")}
							rows={rows}
							columns={gridColumns}
							extension={cc.extension}
							getRowId={getRowId}
							status={tasks.status}
							onRetry={tasks.reload}
							requestId={isApiError(tasks.error) ? tasks.error.requestId : null}
							activeId={activeId}
							onActiveChange={crumbReturn.onActiveChange}
							revealId={activeId}
							selectable
							batchActions={(ids, clear) => (
								<Button
									size="sm"
									variant="primary"
									loading={bulk !== null}
									onClick={() => void completeSelected(ids, clear)}
									data-testid="bulk-complete"
								>
									{t("tasks.action.complete")}
								</Button>
							)}
							{...(views ? { views } : {})}
							initialView={INITIAL_VIEW}
							server={tasks.server}
							emptyTitle={t("tasks.emptyTitle")}
							emptyHint={t("tasks.emptyHint")}
						/>
					)}
				</div>
				{activeId !== null ? (
					<TaskDetail
						task={active}
						state={missing === activeId ? "missing" : "loading"}
						assignees={assignees}
						now={now}
						onUpdated={onRecordUpdated}
						onClose={() => setActiveId(null)}
						preview={preview}
					/>
				) : null}
				{guardDialog}
			</div>
			<NewTaskDialog
				open={newOpen}
				onClose={() => setNewOpen(false)}
				assignees={assignees}
				contacts={contacts.items}
				prefill={null}
				onCreated={onCreated}
			/>
		</div>
	);
}
