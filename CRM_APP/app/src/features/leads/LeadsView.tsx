import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	isForbidden,
	isApiError,
	sessionStore,
	useSession,
} from "../../api/index.ts";
import {
	BidiText,
	Button,
	ChipCell,
	IdentityCell,
	RelativeTimeCell,
	useWideLayout,
	createSavedViewsStore,
	DataGrid,
	DEFAULT_VIEW,
	ForbiddenState,
	type GridColumn,
	PageHeader,
	safeLocalStorage,
	sourceLabel,
	Tabs,
	useI18n,
	useToast,
	type ViewState,
	cond,
	enumFilter,
	ownerFilter,
	type ServerSpec,
	useServerList,
} from "../../ui/index.ts";
import { useCrumbReturn, useRecordCrumb } from "../../ui/shell/index.ts";
import { fetchAssignees, patchLead } from "./api.ts";
import { countRecords, fetchExpanded, listFetcher } from "../listApi.ts";
import { parseSelect } from "../deals/model.ts";
import { cappedCount, formatCapped } from "../capped.ts";
import { KpiCard } from "../reporting/KpiCard.tsx";
import "../reporting/reporting.css";
import { LeadDetail } from "./LeadDetail.tsx";
import { STATUS_KEY, STATUS_TONE } from "./labels.ts";
import {
	type Assignee,
	BUILT_IN_VIEWS,
	type BuiltInView,
	type BulkItem,
	builtInViewNodes,
	LEAD_STATUSES,
	type Lead,
	type LeadStatus,
	type LeadStrip,
	leadStripTone,
	type LeadRow,
	mergeLatest,
	runBulkAssign,
	toRows,
} from "./model.ts";
import { NewLeadDialog } from "./NewLeadDialog.tsx";
import { BulkChoiceDialog } from "../BulkChoiceDialog.tsx";
import { bulkMessage, GENERIC_BULK_KEYS, runBulkOps, TASK_BULK_KEYS } from "../bulk.ts";
import { buildCreateBody as buildTaskBody, type NewTaskInput } from "../tasks/model.ts";
import { createTask } from "../tasks/api.ts";
import { BulkTaskDialog } from "./BulkTaskDialog.tsx";
import "./leads.css";

const VIEW_LABEL = {
	all: "leads.view.all",
	mine: "leads.view.mine",
	unassigned: "leads.view.unassigned",
} as const;

// Default order: newest first, so a just-created lead is on page 1.
const INITIAL_VIEW: ViewState = {
	...DEFAULT_VIEW,
	sorts: [{ key: "created", dir: "desc" }],
};

const getLeadId = (l: LeadRow) => l.id;
const getLeadIdRaw = (l: Lead) => l.id;
const fetchLeads = listFetcher<Lead>("leads");

// Column id -> server field (P1A_CONTRACTS S4 sort whitelist). Derived columns (contact/owner names) are not sortable.
const sortFields = {
	lead: "title",
	source: "source",
	status: "status",
	created: "received_at",
} as const;

export function LeadsView() {
	const { t, formatNumber } = useI18n();
	const wide = useWideLayout();
	const toast = useToast();
	const session = useSession();
	const actor = session.info?.actor ?? null;
	const tenantId = sessionStore.getCredentials()?.tenantId ?? "";

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
	const [overlay, setOverlay] = useState<ReadonlyMap<string, Lead>>(new Map());
	const [countsTick, setCountsTick] = useState(0);
	const remember = useCallback((lead: Lead) => {
		setOverlay((m) => new Map(m).set(lead.id, lead));
		setCountsTick((n) => n + 1); // a write can move a lead between status counts
	}, []);

	const [view, setView] = useState<BuiltInView>("all");
	const [activeId, setActiveId] = useState<string | null>(() =>
		parseSelect(location.search),
	);
	const [newOpen, setNewOpen] = useState(false);

	const ownerByName = useMemo(
		() => new Map(assignees.map((a) => [a.name, a.id])),
		[assignees],
	);
	const spec = useMemo<ServerSpec>(
		() => ({
			sort: sortFields,
			defaultSort: "-received_at",
			filters: {
				status: enumFilter("status", LEAD_STATUSES),
				owner: ownerFilter(ownerByName),
			},
		}),
		[ownerByName],
	);
	const viewNodes = useMemo(() => builtInViewNodes(view, actor), [view, actor]);
	const leads = useServerList<Lead>({
		fetchPage: fetchLeads,
		getId: getLeadIdRaw,
		spec,
		initial: INITIAL_VIEW,
		initialPageSize: INITIAL_VIEW.pageSize,
		extra: viewNodes,
		expand: "contact,owner",
		resetKey: tenantId,
	});

	const ownerNames = useMemo(
		() => new Map(assignees.map((a) => [a.id, a.name])),
		[assignees],
	);
	const allRows = useMemo(
		() =>
			toRows(mergeLatest(leads.items, overlay), ownerNames, {
				unassigned: t("common.unassigned"),
				unknownContact: t("leads.unknownContact"),
				unknownOwner: t("common.unknownUser"),
			}),
		[leads.items, overlay, ownerNames, t],
	);
	const rows = allRows;
	const rowsRef = useRef(allRows);
	useEffect(() => {
		rowsRef.current = allRows;
	});
	const active =
		activeId === null ? null : (allRows.find((r) => r.id === activeId) ?? null);
	// Breadcrumb `CRM > list > record`: the list crumb closes the record (filters/sort/view stay: the view is mounted).
	const crumbReturn = useCrumbReturn(setActiveId);
	useRecordCrumb(active?.title, crumbReturn.back);

	const views = useMemo(
		() =>
			actor && tenantId
				? createSavedViewsStore({
						storage: safeLocalStorage(),
						tenantId,
						actor,
						gridId: "leads",
					})
				: undefined,
		[actor, tenantId],
	);

	// Owner filter is keyed by assignee id (names can repeat) and resolved on the server (`owner_id`).
	const ownerOptions = useMemo(
		() =>
			[...assignees]
				.sort((a, b) => a.name.localeCompare(b.name))
				.map((a) => ({ value: a.id, label: a.name })),
		[assignees],
	);

	const columns = useMemo<ReadonlyArray<GridColumn<LeadRow>>>(
		() => [
			{
				id: "lead",
				header: t("leads.col.lead"),
				value: (r) => r.title,
				sortable: true,
				hideable: false,
				mobile: "title",
				cell: (r) => <IdentityCell name={r.title} caption={r.contactName} />,
			},
			{
				id: "contact",
				header: t("leads.col.contact"),
				value: (r) => r.contactName,
				width: "180px",
				mobile: "hide",
				collapse: 2,
				cell: (r) => <BidiText>{r.contactName}</BidiText>,
			},
			{
				id: "status",
				header: t("leads.col.status"),
				value: (r) => r.status,
				sortable: true,
				width: "120px",
				mobile: "chip",
				filter: {
					options: LEAD_STATUSES.map((s) => ({
						value: s,
						label: t(STATUS_KEY[s]),
					})),
				},
				cell: (r) => (
					<ChipCell tone={STATUS_TONE[r.status]}>{t(STATUS_KEY[r.status])}</ChipCell>
				),
			},
			{
				id: "owner",
				header: t("common.owner"),
				value: (r) => r.ownerName,
				width: "150px",
				filter: { options: ownerOptions },
			},
			{
				id: "source",
				header: t("common.source"),
				value: (r) => sourceLabel(r.source, t),
				sortable: true,
				width: "130px",
				mobile: "hide",
				collapse: 1,
				cell: (r) => sourceLabel(r.source, t),
				titleText: (r) => sourceLabel(r.source, t),
			},
			{
				id: "created",
				header: t("leads.col.created"),
				value: (r) => Date.parse(r.received_at),
				searchable: false,
				sortable: true,
				width: "130px",
				cell: (r) => <RelativeTimeCell iso={r.received_at} />,
			},
		],
		[t, ownerOptions],
	);

	// ---- bulk assign to me ----
	const [bulk, setBulk] = useState<{ done: number; total: number } | null>(
		null,
	);
	const assignToMe = async (ids: readonly string[], clear: () => void) => {
		if (actor === null) {
			toast.notify(t("leads.bulk.noActor"), "error");
			return;
		}
		const byId = new Map(rowsRef.current.map((r) => [r.id, r]));
		const items: BulkItem[] = ids.flatMap((id) => {
			const r = byId.get(id);
			return r ? [{ id, version: r.version, ownerId: r.owner_id }] : [];
		});
		setBulk({ done: 0, total: items.length });
		const { summary } = await runBulkAssign(
			items,
			actor,
			async (item) => {
				const body = {
					command_id: crypto.randomUUID(),
					expected_version: item.version,
					owner_id: actor,
				};
				remember(await patchLead(item.id, body));
			},
			(done, total) => setBulk({ done, total }),
		);
		setBulk(null);
		const failed = summary.failed.length + summary.notAttempted.length;
		const parts: string[] = [];
		if (failed === 0)
			parts.push(
				t("leads.bulk.ok", { count: formatNumber(summary.succeeded.length) }),
			);
		else if (summary.succeeded.length === 0)
			parts.push(t("leads.bulk.failed", { failed: formatNumber(failed) }));
		else
			parts.push(
				t("leads.bulk.partial", {
					ok: formatNumber(summary.succeeded.length),
					failed: formatNumber(failed),
				}),
			);
		if (summary.skipped.length > 0)
			parts.push(
				t("leads.bulk.skipped", {
					count: formatNumber(summary.skipped.length),
				}),
			);
		if (summary.notAttempted.length > 0)
			parts.push(
				t("leads.bulk.stopped", {
					count: formatNumber(summary.notAttempted.length),
				}),
			);
		// Any failure is reported through the assertive (alert) region and stays until dismissed.
		toast.notify(parts.join(" "), failed === 0 ? "success" : "error");
		clear();
		if (summary.failed.some((f) => f.kind === "version_conflict"))
			leads.reload();
	};

	// ---- bulk change status / add task (one PATCH or POST per row; partial failures reported like Assign) ----
	const [bulkDialog, setBulkDialog] = useState<{
		kind: "status" | "task";
		ids: readonly string[];
		clear: () => void;
	} | null>(null);
	const finishBulk = (
		summary: Parameters<typeof bulkMessage>[0],
		keys: Parameters<typeof bulkMessage>[1],
		clear: () => void,
	) => {
		setBulk(null);
		const m = bulkMessage(summary, keys, t, formatNumber);
		toast.notify(m.text, m.tone);
		clear();
		if (summary.failed.some((f) => f.kind === "version_conflict")) leads.reload();
	};
	const changeStatus = async (status: LeadStatus) => {
		if (bulkDialog === null) return;
		const { ids, clear } = bulkDialog;
		setBulkDialog(null);
		const byId = new Map(rowsRef.current.map((r) => [r.id, r]));
		const items = ids.flatMap((id) => {
			const r = byId.get(id);
			return r ? [{ id, skip: r.status === status }] : [];
		});
		setBulk({ done: 0, total: items.length });
		const summary = await runBulkOps(
			items,
			async (id) => {
				const r = byId.get(id);
				if (!r) return;
				remember(
					await patchLead(id, {
						command_id: crypto.randomUUID(),
						expected_version: r.version,
						status,
					}),
				);
			},
			(done, total) => setBulk({ done, total }),
		);
		finishBulk(summary, GENERIC_BULK_KEYS, clear);
	};
	const addTasks = async (input: NewTaskInput) => {
		if (bulkDialog === null) return;
		const { ids, clear } = bulkDialog;
		setBulkDialog(null);
		const byId = new Map(rowsRef.current.map((r) => [r.id, r]));
		const items = ids.flatMap((id) => (byId.has(id) ? [{ id }] : []));
		setBulk({ done: 0, total: items.length });
		const summary = await runBulkOps(
			items,
			async (id) => {
				const r = byId.get(id);
				if (!r) return;
				const key = crypto.randomUUID();
				await createTask(buildTaskBody({ ...input, contactId: r.contact_id }, key), key);
			},
			(done, total) => setBulk({ done, total }),
		);
		finishBulk(summary, TASK_BULK_KEYS, clear);
	};

	// UX-09: exact counts per status from the server (`total_count`) for the current built-in view; "N+" only above the 10,000 ceiling.
	const [counts, setCounts] = useState<{ status: "loading" | "ready" | "error"; strip: LeadStrip | null }>({
		status: "loading",
		strip: null,
	});
	const viewKey = JSON.stringify(viewNodes);
	// biome-ignore lint/correctness/useExhaustiveDependencies: viewKey is the identity of viewNodes; countsTick re-counts after writes
	useEffect(() => {
		const ctrl = new AbortController();
		const timer = setTimeout(() => {
			Promise.all(
				LEAD_STATUSES.map((st) =>
					countRecords("leads", [...viewNodes, cond("status", "eq", st)], ctrl.signal),
				),
			)
				.then((r) => {
					const strip = Object.fromEntries(
						LEAD_STATUSES.map((st, i) => [st, cappedCount(r[i]?.value ?? 0, r[i]?.exact === false)]),
					) as LeadStrip;
					setCounts({ status: "ready", strip });
				})
				.catch((e: unknown) => {
					if (!ctrl.signal.aborted && !(e instanceof DOMException)) setCounts({ status: "error", strip: null });
				});
		}, 150);
		return () => {
			clearTimeout(timer);
			ctrl.abort();
		};
	}, [viewKey, tenantId, countsTick]);
	const strip = counts.strip;
	const stripSub = view !== "all" ? t("leads.kpi.view") : undefined;

	const onCreated = (lead: Lead) => {
		remember(lead);
		// The create response carries no names: list the row once with its embedded contact/owner, then re-list.
		void fetchExpanded<Lead>("leads", lead.id, "contact,owner")
			.then((full) => full && remember(full))
			.catch(() => undefined);
		leads.reload();
		setView("all");
		setActiveId(lead.id);
		setNewOpen(false);
		toast.notify(t("leads.new.created"), "success");
	};

	return (
		<div className="sy-leads" data-testid="leads-view">
			<PageHeader
				title={t("nav.leads")}
				subtitle={t("leads.subtitle")}
				kpis={
					leads.status === "error" ? undefined : (
						<section
							className="sy-leads__kpis"
							aria-label={t("leads.kpis")}
							data-testid="leads-kpis"
						>
							{LEAD_STATUSES.map((st) => (
								<KpiCard
									key={st}
									testId={`leads-kpi-${st}`}
									label={t(STATUS_KEY[st])}
									loading={counts.status === "loading"}
									value={strip ? formatCapped(strip[st], formatNumber) : "—"}
									sub={stripSub}
									tone={strip ? leadStripTone(st, strip[st]) : "neutral"}
								/>
							))}
						</section>
					)
				}
				actions={
					<Button
						variant="primary"
						icon="plus"
						onClick={() => setNewOpen(true)}
						data-testid="new-lead"
					>
						{t("action.newLead")}
					</Button>
				}
			/>
			<Tabs
				label={t("leads.views")}
				value={view}
				onChange={(id) => setView(id as BuiltInView)}
				tabs={BUILT_IN_VIEWS.map((v) => ({ id: v, label: t(VIEW_LABEL[v]) }))}
			/>
			{ownersFailed ? (
				<p className="sy-leads__muted" role="status">
					{t("leads.ownersFailed")}
				</p>
			) : null}
			<div className="sy-leads__body">
				<div className="sy-leads__main">
					{bulk ? (
						<p
							role="status"
							className="sy-leads__muted"
							data-testid="bulk-progress"
						>
							{t("leads.bulk.progress", {
								done: formatNumber(bulk.done),
								total: formatNumber(bulk.total),
							})}
						</p>
					) : null}
					{leads.status === "error" && isForbidden(leads.error) ? (
						<ForbiddenState />
					) : (
						<DataGrid<LeadRow>
							gridId="leads"
							label={t("leads.grid")}
							rows={rows}
							columns={columns}
							getRowId={getLeadId}
							status={leads.status}
							onRetry={leads.reload}
							requestId={isApiError(leads.error) ? leads.error.requestId : null}
							activeId={activeId}
							onActiveChange={crumbReturn.onActiveChange}
							autoSelectFirst={wide && !crumbReturn.suppressAutoOpen}
							selectable
							batchActions={(ids, clear) => (
								<>
									<Button
										size="sm"
										variant="primary"
										loading={bulk !== null}
										onClick={() => void assignToMe(ids, clear)}
										data-testid="bulk-assign"
									>
										{t("action.assignToMe")}
									</Button>
									<Button
										size="sm"
										disabled={bulk !== null}
										onClick={() => setBulkDialog({ kind: "status", ids, clear })}
										data-testid="bulk-status"
									>
										{t("bulk.changeStatus")}
									</Button>
									<Button
										size="sm"
										icon="tasks"
										disabled={bulk !== null}
										onClick={() => setBulkDialog({ kind: "task", ids, clear })}
										data-testid="bulk-add-task"
									>
										{t("bulk.addTask")}
									</Button>
								</>
							)}
							{...(views ? { views } : {})}
							initialView={INITIAL_VIEW}
							server={leads.server}
							emptyTitle={t("leads.emptyTitle")}
							emptyHint={t("leads.emptyHint")}
						/>
					)}
				</div>
				<LeadDetail
					lead={active}
					assignees={assignees}
					onUpdated={remember}
					onClose={() => setActiveId(null)}
				/>
			</div>
			<BulkChoiceDialog
				open={bulkDialog?.kind === "status"}
				onClose={() => setBulkDialog(null)}
				title={t("bulk.changeStatus")}
				label={t("bulk.statusPick")}
				count={bulkDialog?.ids.length ?? 0}
				options={LEAD_STATUSES.map((s) => ({ value: s, label: t(STATUS_KEY[s]) }))}
				onConfirm={(v) => void changeStatus(v as LeadStatus)}
				testId="bulk-status-dialog"
			/>
			<BulkTaskDialog
				open={bulkDialog?.kind === "task"}
				onClose={() => setBulkDialog(null)}
				count={bulkDialog?.ids.length ?? 0}
				assignees={assignees}
				onSubmit={(i) => void addTasks(i)}
			/>
			<NewLeadDialog
				open={newOpen}
				onClose={() => setNewOpen(false)}
				assignees={assignees}
				onCreated={onCreated}
			/>
		</div>
	);
}
