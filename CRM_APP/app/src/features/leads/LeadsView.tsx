import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	isForbidden,
	isApiError,
	sessionStore,
	useSession,
} from "../../api/index.ts";
import {
	Badge,
	Button,
	createSavedViewsStore,
	DataGrid,
	ForbiddenState,
	type GridColumn,
	type GridSample,
	safeLocalStorage,
	Tabs,
	type ViewState,
	DEFAULT_VIEW,
	useCursorList,
	useI18n,
	useToast,
} from "../../ui/index.ts";
import {
	fetchAssignees,
	fetchContactsPage,
	fetchLeadsPage,
	patchLead,
} from "./api.ts";
import { parseSelect } from "../deals/model.ts";
import { LeadDetail } from "./LeadDetail.tsx";
import { STATUS_KEY, STATUS_TONE } from "./labels.ts";
import {
	type Assignee,
	BUILT_IN_VIEWS,
	type BuiltInView,
	type BulkItem,
	type Contact,
	filterBuiltInView,
	LEAD_STATUSES,
	type Lead,
	type LeadRow,
	mergeLatest,
	runBulkAssign,
	toRows,
} from "./model.ts";
import { NewLeadDialog } from "./NewLeadDialog.tsx";
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
const getContactId = (c: Contact) => c.id;

export function LeadsView() {
	const { t, formatDate, formatNumber } = useI18n();
	const toast = useToast();
	const session = useSession();
	const actor = session.info?.actor ?? null;
	const tenantId = sessionStore.getCredentials()?.tenantId ?? "";

	const leads = useCursorList<Lead>(fetchLeadsPage, {
		getId: getLeadIdRaw,
		resetKey: tenantId,
	});
	const contacts = useCursorList<Contact>(fetchContactsPage, {
		getId: getContactId,
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
	const [overlay, setOverlay] = useState<ReadonlyMap<string, Lead>>(new Map());
	const remember = useCallback(
		(lead: Lead) => setOverlay((m) => new Map(m).set(lead.id, lead)),
		[],
	);

	const [view, setView] = useState<BuiltInView>("all");
	const [activeId, setActiveId] = useState<string | null>(() =>
		parseSelect(location.search),
	);
	const [newOpen, setNewOpen] = useState(false);

	const contactNames = useMemo(
		() => new Map(contacts.items.map((c) => [c.id, c.display_name])),
		[contacts.items],
	);
	const ownerNames = useMemo(
		() => new Map(assignees.map((a) => [a.id, a.name])),
		[assignees],
	);
	const allRows = useMemo(
		() =>
			toRows(mergeLatest(leads.items, overlay), contactNames, ownerNames, {
				unassigned: t("common.unassigned"),
				unknownContact: t("leads.unknownContact"),
			}),
		[leads.items, overlay, contactNames, ownerNames, t],
	);
	const rows = useMemo(
		() => filterBuiltInView(allRows, view, actor),
		[allRows, view, actor],
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
						gridId: "leads",
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

	const columns = useMemo<ReadonlyArray<GridColumn<LeadRow>>>(
		() => [
			{
				id: "lead",
				header: t("leads.col.lead"),
				value: (r) => r.title,
				sortable: true,
				hideable: false,
				cell: (r) => <b>{r.title}</b>,
			},
			{
				id: "contact",
				header: t("leads.col.contact"),
				value: (r) => r.contactName,
				sortable: true,
			},
			{
				id: "status",
				header: t("leads.col.status"),
				value: (r) => r.status,
				sortable: true,
				filter: {
					options: LEAD_STATUSES.map((s) => ({
						value: s,
						label: t(STATUS_KEY[s]),
					})),
				},
				cell: (r) => (
					<Badge tone={STATUS_TONE[r.status]}>{t(STATUS_KEY[r.status])}</Badge>
				),
			},
			{
				id: "owner",
				header: t("common.owner"),
				value: (r) => r.ownerName,
				sortable: true,
				filter: { options: ownerOptions },
			},
			{
				id: "source",
				header: t("common.source"),
				value: (r) => r.source,
				sortable: true,
			},
			{
				id: "created",
				header: t("leads.col.created"),
				value: (r) => Date.parse(r.received_at),
				searchable: false,
				sortable: true,
				cell: (r) =>
					formatDate(r.received_at, {
						dateStyle: "medium",
						timeStyle: "short",
					}),
			},
		],
		[t, ownerOptions, formatDate],
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

	const sample: GridSample = {
		loaded: leads.items.length,
		hasMore: leads.sample,
		loadingMore: leads.loadingMore,
		atCap: leads.atCap,
		failed: leads.moreError !== null,
		onLoadMore: leads.loadMore,
	};

	const onCreated = (lead: Lead) => {
		remember(lead);
		contacts.reload();
		setView("all");
		setActiveId(lead.id);
		setNewOpen(false);
		toast.notify(t("leads.new.created"), "success");
	};

	return (
		<div className="sy-leads" data-testid="leads-view">
			<header className="sy-leads__top">
				<h1 className="sy-leads__h1">{t("nav.leads")}</h1>
				<div className="sy-leads__actions">
					<Button
						icon="upload"
						disabled
						aria-label={t("leads.notInMvp", { label: t("common.import") })}
					>
						{t("common.import")}
					</Button>
					<Button
						variant="primary"
						icon="plus"
						onClick={() => setNewOpen(true)}
						data-testid="new-lead"
					>
						{t("action.newLead")}
					</Button>
				</div>
			</header>
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
							onActiveChange={setActiveId}
							selectable
							batchActions={(ids, clear) => (
								<Button
									size="sm"
									variant="primary"
									loading={bulk !== null}
									onClick={() => void assignToMe(ids, clear)}
									data-testid="bulk-assign"
								>
									{t("action.assignToMe")}
								</Button>
							)}
							{...(views ? { views } : {})}
							initialView={INITIAL_VIEW}
							sample={sample}
							emptyTitle={t("leads.emptyTitle")}
							emptyHint={t("leads.emptyHint")}
						/>
					)}
				</div>
				<LeadDetail lead={active} assignees={assignees} onUpdated={remember} />
			</div>
			<NewLeadDialog
				open={newOpen}
				onClose={() => setNewOpen(false)}
				assignees={assignees}
				onCreated={onCreated}
			/>
		</div>
	);
}
