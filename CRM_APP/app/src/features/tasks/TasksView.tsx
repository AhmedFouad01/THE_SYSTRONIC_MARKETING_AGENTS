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
	useWideLayout,
	DEFAULT_VIEW,
	ForbiddenState,
	type GridColumn,
	type GridSample,
	type MessageKey,
	PageHeader,
	safeLocalStorage,
	StatusPill,
	Tabs,
	useCursorList,
	useI18n,
	useToast,
	type ViewState,
} from "../../ui/index.ts";
import { parseSelect } from "../deals/model.ts";
import {
	type Assignee,
	type ContactRef,
	type DealRef,
	fetchAssignees,
	fetchContactRefsPage,
	fetchDealRefsPage,
	fetchTasksPage,
	patchTask,
} from "./api.ts";
import { DueLabel } from "./DueLabel.tsx";
import {
	type BulkCompleteItem,
	completeBody,
	inTab,
	mergeLatest,
	runBulkComplete,
	TASK_TABS,
	type Task,
	type TaskRow,
	type TaskTab,
	toRows,
} from "./model.ts";
import { NewTaskDialog } from "./NewTaskDialog.tsx";
import { RelatedLink } from "./RelatedLink.tsx";
import { SOURCE_KEY, TaskDetail } from "./TaskDetail.tsx";
import "./tasks.css";

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
	const wide = useWideLayout();
	const toast = useToast();
	const session = useSession();
	const actor = session.info?.actor ?? null;
	const tenantId = sessionStore.getCredentials()?.tenantId ?? "";
	const now = useNow();

	const tasks = useCursorList<Task>(fetchTasksPage, {
		getId: getTaskId,
		resetKey: tenantId,
	});
	const contacts = useCursorList<ContactRef>(fetchContactRefsPage, {
		getId: getRefId,
		resetKey: tenantId,
	});
	const deals = useCursorList<DealRef>(fetchDealRefsPage, {
		getId: getRefId,
		resetKey: tenantId,
	});
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
	const remember = useCallback(
		(task: Task) => setOverlay((m) => new Map(m).set(task.id, task)),
		[],
	);

	const [tab, setTab] = useState<TaskTab>("open");
	const [activeId, setActiveId] = useState<string | null>(() =>
		parseSelect(location.search),
	);
	const [newOpen, setNewOpen] = useState(false);

	const contactNames = useMemo(
		() => new Map(contacts.items.map((c) => [c.id, c.display_name])),
		[contacts.items],
	);
	const dealNames = useMemo(
		() => new Map(deals.items.map((d) => [d.id, d.title])),
		[deals.items],
	);
	const ownerNames = useMemo(
		() => new Map(assignees.map((a) => [a.id, a.name])),
		[assignees],
	);
	const allRows = useMemo(
		() =>
			toRows(
				mergeLatest(tasks.items, overlay),
				contactNames,
				dealNames,
				ownerNames,
				{ unknown: t("tasks.unknownRecord"), unknownOwner: t("common.unknownUser") },
				now,
			),
		[tasks.items, overlay, contactNames, dealNames, ownerNames, t, now],
	);
	const rows = useMemo(
		() => allRows.filter((r) => inTab(r.bucket, tab)),
		[allRows, tab],
	);
	const rowsRef = useRef(allRows);
	useEffect(() => {
		rowsRef.current = allRows;
	});
	const active =
		activeId === null ? null : (allRows.find((r) => r.id === activeId) ?? null);

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

	const ownerOptions = useMemo(() => {
		const names = new Set<string>(assignees.map((a) => a.name));
		for (const r of allRows) names.add(r.ownerName);
		return [...names]
			.sort((a, b) => a.localeCompare(b))
			.map((n) => ({ value: n, label: n }));
	}, [assignees, allRows]);

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
				sortable: true,
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
				sortable: true,
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
				sortable: true,
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
							className="sy-tasks__complete"
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

	const sample: GridSample = {
		loaded: tasks.items.length,
		hasMore: tasks.sample,
		loadingMore: tasks.loadingMore,
		atCap: tasks.atCap,
		failed: tasks.moreError !== null,
		onLoadMore: tasks.loadMore,
	};

	const onCreated = (task: Task) => {
		remember(task);
		setTab("open");
		setActiveId(task.id);
		setNewOpen(false);
		toast.notify(t("tasks.new.created"), "success");
	};

	return (
		<div className="sy-tasks" data-testid="tasks-view">
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
				onChange={(id) => setTab(id as TaskTab)}
				tabs={TASK_TABS.map((v) => ({ id: v, label: t(TAB_LABEL[v]) }))}
			/>
			{ownersFailed ? (
				<p className="sy-tasks__muted" role="status">
					{t("tasks.ownersFailed")}
				</p>
			) : null}
			<div className="sy-tasks__body">
				<div className="sy-tasks__main">
					{bulk ? (
						<p
							role="status"
							className="sy-tasks__muted"
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
							columns={columns}
							getRowId={getRowId}
							status={tasks.status}
							onRetry={tasks.reload}
							requestId={isApiError(tasks.error) ? tasks.error.requestId : null}
							activeId={activeId}
							onActiveChange={setActiveId}
							autoSelectFirst={wide}
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
							sample={sample}
							emptyTitle={t("tasks.emptyTitle")}
							emptyHint={t("tasks.emptyHint")}
						/>
					)}
				</div>
				<TaskDetail
					task={active}
					assignees={assignees}
					now={now}
					onUpdated={remember}
					onClose={() => setActiveId(null)}
				/>
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
