import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	isApiError,
	isForbidden,
	sessionStore,
	useSession,
} from "../../api/index.ts";
import {
	createSavedViewsStore,
	DataGrid,
	Button,
	DEFAULT_VIEW,
	IdentityCell,
	ForbiddenState,
	type GridColumn,
	PageHeader,
	safeLocalStorage,
	sourceLabel,
	Tabs,
	useI18n,
	useToast,
	type ViewState,
	defaultFilter,
	ownerFilter,
	type ServerSpec,
	useServerList,
	parsePreview,
	previewStep,
	usePreviewGuard,
	withPreview,
} from "../../ui/index.ts";
import { useCrumbReturn, useRecordCrumb } from "../../ui/shell/index.ts";
import { fetchAssignees } from "./api.ts";
import { fetchExpanded, listFetcher } from "../listApi.ts";
import { carryExpand } from "../expand.ts";
import { toRoute } from "../../router.ts";
import { ContactDetail } from "./ContactDetail.tsx";
import { MergeDialogs } from "./MergeDialogs.tsx";
import { NewContactDialog } from "./NewContactDialog.tsx";
import {
	type Assignee,
	BUILT_IN_VIEWS,
	type BuiltInView,
	type Contact,
	type ContactRow,
	type Duplicate,
	builtInViewNodes,
	mergeLatest,
	toRows,
} from "./model.ts";
import "./contacts.css";

const VIEW_LABEL = {
	all: "contacts.view.all",
	mine: "contacts.view.mine",
} as const;

const INITIAL_VIEW: ViewState = {
	...DEFAULT_VIEW,
	sorts: [{ key: "name", dir: "asc" }],
};

const getRowId = (c: ContactRow) => c.id;
const getRawId = (c: Contact) => c.id;
const fetchContacts = listFetcher<Contact>("contacts");

export function ContactsView() {
	const { t, formatNumber } = useI18n();
	const toast = useToast();
	const session = useSession();
	const actor = session.info?.actor ?? null;
	const canMerge = session.info?.merge === true;
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

	const [overlay, setOverlay] = useState<ReadonlyMap<string, Contact>>(
		new Map(),
	);
	const [merged, setMerged] = useState<ReadonlySet<string>>(new Set());
	// A merge changes the record under the open panel: remount it so it returns to the overview with fresh identifiers.
	const [detailEpoch, setDetailEpoch] = useState(0);
	const remember = useCallback(
		(c: Contact) => setOverlay((m) => new Map(m).set(c.id, c)),
		[],
	);

	const [view, setView] = useState<BuiltInView>("all");
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
		if (toRoute(location.pathname) !== "/contacts") return;
		const next = withPreview(location.search, activeId);
		if (next !== location.search)
			history.replaceState(history.state, "", `${location.pathname}${next}${location.hash}`);
	}, [activeId]);
	const [mergeWith, setMergeWith] = useState<Duplicate | null>(null);
	const [newOpen, setNewOpen] = useState(false);
	const [added, setAdded] = useState<readonly Contact[]>([]);

	const ownerNames = useMemo(
		() => new Map(assignees.map((a) => [a.id, a.name])),
		[assignees],
	);
	const ownerByName = useMemo(
		() => new Map(assignees.map((a) => [a.name, a.id])),
		[assignees],
	);
	const spec = useMemo<ServerSpec>(
		() => ({
			sort: { name: "display_name", source: "source" },
			defaultSort: "display_name",
			filters: { owner: ownerFilter(ownerByName), source: defaultFilter("source") },
		}),
		[ownerByName],
	);
	const viewNodes = useMemo(() => builtInViewNodes(view, actor), [view, actor]);
	const contacts = useServerList<Contact>({
		fetchPage: fetchContacts,
		getId: getRawId,
		spec,
		initial: INITIAL_VIEW,
		initialPageSize: INITIAL_VIEW.pageSize,
		extra: viewNodes,
		expand: "owner",
		resetKey: tenantId,
	});
	const allRows = useMemo(
		() =>
			toRows(
				mergeLatest(contacts.items, overlay, merged),
				ownerNames,
				t("common.unassigned"),
				t("common.unknownUser"),
			),
		[contacts.items, overlay, merged, ownerNames, t],
	);
	const rows = allRows;
	// A contact created this session opens in the detail panel even before the list reload brings it in server order.
	const addedRows = useMemo(
		() => toRows(added.map((c) => overlay.get(c.id) ?? c), ownerNames, t("common.unassigned"), t("common.unknownUser")),
		[added, overlay, ownerNames, t],
	);
	const found =
		activeId === null
			? null
			: (allRows.find((r) => r.id === activeId) ?? addedRows.find((r) => r.id === activeId) ?? null);
	// The open record outlives the loaded pages (filter/sort/reload can drop its row; a deep link may point past page 1):
	// the last seen copy is retained, and a record that was never loaded is fetched by id.
	const [fallback, setFallback] = useState<Contact | null>(null);
	const [missing, setMissing] = useState<string | null>(null);
	useEffect(() => {
		if (found !== null) setFallback(found);
	}, [found]);
	useEffect(() => {
		if (activeId === null || found !== null || fallback?.id === activeId) return;
		const ctrl = new AbortController();
		fetchExpanded<Contact>("contacts", activeId, "owner", ctrl.signal)
			.then((c) => {
				if (ctrl.signal.aborted) return;
				if (c) setFallback(c);
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
				: (toRows([fallback], ownerNames, t("common.unassigned"), t("common.unknownUser"))[0] ?? null),
		[fallback, ownerNames, t],
	);
	const active = found ?? (fallbackRow !== null && fallbackRow.id === activeId ? fallbackRow : null);
	const onRecordUpdated = useCallback(
		(c: Contact) => {
			remember(c);
			// The overlay only decorates loaded rows: a record opened by id (not in the loaded pages) updates its retained copy.
			setFallback((prev) => (prev !== null && prev.id === c.id ? carryExpand(c, prev) : prev));
		},
		[remember],
	);

	// Prev/Next over the loaded rows in grid order; at the last loaded row the next server page is loaded first.
	const ids = useMemo(() => rows.map((r) => r.id), [rows]);
	const step = previewStep(ids, activeId, contacts.hasMore);
	const [wantMore, setWantMore] = useState<string | null>(null);
	const { server: contactsServer } = contacts;
	useEffect(() => {
		if (wantMore === null) return;
		if (activeId !== wantMore || contactsServer.moreFailed) {
			setWantMore(null);
			return;
		}
		if (step.nextId !== null) {
			setWantMore(null);
			setActiveId(step.nextId);
		} else if (!contacts.hasMore && !contactsServer.loadingMore) setWantMore(null);
	}, [wantMore, activeId, step.nextId, contacts.hasMore, contactsServer.moreFailed, contactsServer.loadingMore]);
	const goNext = () => {
		if (step.nextId !== null) openRecord(step.nextId);
		else if (step.needsMore && !contacts.refreshing)
			guard.request(() => {
				setWantMore(activeId);
				contactsServer.onRetryMore();
			});
	};
	const listTotal = Math.max(contacts.total?.value ?? 0, ids.length);
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
			onPrev:
				step.prevId !== null && !contacts.refreshing
					? () => openRecord(step.prevId)
					: null,
			onNext: (step.nextId !== null || step.needsMore) && !contacts.refreshing ? goNext : null,
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
	useRecordCrumb(active?.display_name, crumbReturn.back);

	const views = useMemo(
		() =>
			actor && tenantId
				? createSavedViewsStore({
						storage: safeLocalStorage(),
						tenantId,
						actor,
						gridId: "contacts",
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
	// `source` is free text: the filter offers the sources seen in any loaded result so far (no distinct-values endpoint yet).
	const [seenSources, setSeenSources] = useState<readonly string[]>([]);
	useEffect(() => {
		setSeenSources((prev) => {
			const next = new Set(prev);
			for (const c of contacts.items) next.add(c.source);
			return next.size === prev.length ? prev : [...next];
		});
	}, [contacts.items]);
	const sourceOptions = useMemo(
		() =>
			[...seenSources]
				.sort((a, b) => a.localeCompare(b))
				.map((s) => ({ value: s, label: sourceLabel(s, t) })),
		[seenSources, t],
	);

	const columns = useMemo<ReadonlyArray<GridColumn<ContactRow>>>(
		() => [
			{
				id: "name",
				header: t("contacts.col.name"),
				value: (r) => r.display_name,
				sortable: true,
				hideable: false,
				mobile: "title",
				cell: (r) => <IdentityCell name={r.display_name} />,
			},
			{
				id: "owner",
				header: t("common.owner"),
				value: (r) => r.ownerName,
				width: "180px",
				mobile: "hide",
				filter: { options: ownerOptions },
			},
			{
				id: "source",
				header: t("common.source"),
				value: (r) => r.source,
				sortable: true,
				width: "160px",
				filter: { options: sourceOptions },
				cell: (r) => sourceLabel(r.source, t),
			},
		],
		[t, ownerOptions, sourceOptions],
	);

	const ownerName = useCallback(
		(id: string | null) =>
			id ? (ownerNames.get(id) ?? t("common.unknownUser")) : t("common.unassigned"),
		[ownerNames, t],
	);

	const onMerged = (sourceId: string) => {
		setMerged((s) => new Set(s).add(sourceId));
		setDetailEpoch((n) => n + 1);
		setMergeWith(null);
		contacts.reload();
		toast.notify(t("contacts.merge.done"), "success");
	};

	const onCreated = (c: Contact) => {
		setAdded((a) => [...a, c]);
		remember(c);
		void fetchExpanded<Contact>("contacts", c.id, "owner")
			.then((full) => full && remember(full))
			.catch(() => undefined);
		contacts.reload();
		setView("all");
		setActiveId(c.id);
		setNewOpen(false);
		toast.notify(t("contacts.new.created"), "success");
	};

	return (
		<div className="sy-contacts" data-testid="contacts-view">
			<PageHeader
				title={t("nav.contacts")}
				actions={
					<Button
						variant="primary"
						icon="plus"
						onClick={() => setNewOpen(true)}
						data-testid="new-contact"
					>
						{t("contacts.new.title")}
					</Button>
				}
			/>
			<Tabs
				label={t("contacts.views")}
				value={view}
				onChange={(id) => setView(id as BuiltInView)}
				tabs={BUILT_IN_VIEWS.map((v) => ({ id: v, label: t(VIEW_LABEL[v]) }))}
			/>
			{ownersFailed ? (
				<p className="sy-contacts__muted" role="status">
					{t("contacts.ownersFailed")}
				</p>
			) : null}
			<div className="sy-contacts__body">
				<div className="sy-contacts__main">
					{contacts.status === "error" && isForbidden(contacts.error) ? (
						<ForbiddenState />
					) : (
						<DataGrid<ContactRow>
							gridId="contacts"
							label={t("contacts.grid")}
							rows={rows}
							columns={columns}
							getRowId={getRowId}
							status={contacts.status}
							onRetry={contacts.reload}
							requestId={
								isApiError(contacts.error) ? contacts.error.requestId : null
							}
							activeId={activeId}
							onActiveChange={crumbReturn.onActiveChange}
							revealId={activeId}
							{...(views ? { views } : {})}
							initialView={INITIAL_VIEW}
							server={contacts.server}
							emptyTitle={t("contacts.emptyTitle")}
							emptyHint={t("contacts.emptyHint")}
						/>
					)}
				</div>
				{activeId !== null ? (
					<ContactDetail
						contact={active}
						state={missing === activeId ? "missing" : "loading"}
						epoch={detailEpoch}
						assignees={assignees}
						canMerge={canMerge}
						onUpdated={onRecordUpdated}
						onMerge={setMergeWith}
						onClose={() => setActiveId(null)}
						preview={preview}
					/>
				) : null}
				{guardDialog}
			</div>
			{mergeWith && active ? (
				<MergeDialogs
					duplicate={mergeWith}
					target={active}
					ownerName={ownerName}
					onClose={() => setMergeWith(null)}
					onMerged={onMerged}
				/>
			) : null}
			<NewContactDialog
				open={newOpen}
				onClose={() => setNewOpen(false)}
				assignees={assignees}
				onCreated={onCreated}
			/>
		</div>
	);
}
