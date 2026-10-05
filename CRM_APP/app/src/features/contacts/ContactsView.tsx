import { parseSelect } from "../deals/model.ts";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	isApiError,
	isForbidden,
	sessionStore,
	useSession,
} from "../../api/index.ts";
import {
	Bdi,
	createSavedViewsStore,
	DataGrid,
	DEFAULT_VIEW,
	ForbiddenState,
	type GridColumn,
	type GridSample,
	safeLocalStorage,
	sourceLabel,
	Tabs,
	useCursorList,
	useI18n,
	useToast,
	type ViewState,
} from "../../ui/index.ts";
import { fetchAssignees, fetchContactsPage } from "./api.ts";
import { ContactDetail } from "./ContactDetail.tsx";
import { MergeDialogs } from "./MergeDialogs.tsx";
import {
	type Assignee,
	BUILT_IN_VIEWS,
	type BuiltInView,
	type Contact,
	type ContactRow,
	type Duplicate,
	filterBuiltInView,
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

export function ContactsView() {
	const { t } = useI18n();
	const toast = useToast();
	const session = useSession();
	const actor = session.info?.actor ?? null;
	const canMerge = session.info?.merge === true;
	const tenantId = sessionStore.getCredentials()?.tenantId ?? "";

	const contacts = useCursorList<Contact>(fetchContactsPage, {
		getId: getRawId,
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

	const [overlay, setOverlay] = useState<ReadonlyMap<string, Contact>>(
		new Map(),
	);
	const [merged, setMerged] = useState<ReadonlySet<string>>(new Set());
	const remember = useCallback(
		(c: Contact) => setOverlay((m) => new Map(m).set(c.id, c)),
		[],
	);

	const [view, setView] = useState<BuiltInView>("all");
	const [activeId, setActiveId] = useState<string | null>(() =>
		parseSelect(location.search),
	);
	const [mergeWith, setMergeWith] = useState<Duplicate | null>(null);

	const ownerNames = useMemo(
		() => new Map(assignees.map((a) => [a.id, a.name])),
		[assignees],
	);
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
	const rows = useMemo(
		() => filterBuiltInView(allRows, view, actor),
		[allRows, view, actor],
	);
	const active =
		activeId === null ? null : (allRows.find((r) => r.id === activeId) ?? null);

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

	const ownerOptions = useMemo(() => {
		const names = new Set<string>(assignees.map((a) => a.name));
		for (const r of allRows) names.add(r.ownerName);
		return [...names]
			.sort((a, b) => a.localeCompare(b))
			.map((n) => ({ value: n, label: n }));
	}, [assignees, allRows]);
	const sourceOptions = useMemo(
		() =>
			[...new Set(allRows.map((r) => r.source))]
				.sort((a, b) => a.localeCompare(b))
				.map((s) => ({ value: s, label: sourceLabel(s, t) })),
		[allRows, t],
	);

	const columns = useMemo<ReadonlyArray<GridColumn<ContactRow>>>(
		() => [
			{
				id: "name",
				header: t("contacts.col.name"),
				value: (r) => r.display_name,
				sortable: true,
				hideable: false,
				cell: (r) => (
					<b>
						<Bdi>{r.display_name}</Bdi>
					</b>
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
				filter: { options: sourceOptions },
				cell: (r) => sourceLabel(r.source, t),
			},
		],
		[t, ownerOptions, sourceOptions],
	);

	const sample: GridSample = {
		loaded: contacts.items.length,
		hasMore: contacts.sample,
		loadingMore: contacts.loadingMore,
		atCap: contacts.atCap,
		failed: contacts.moreError !== null,
		onLoadMore: contacts.loadMore,
	};

	const ownerName = useCallback(
		(id: string | null) =>
			id ? (ownerNames.get(id) ?? t("common.unknownUser")) : t("common.unassigned"),
		[ownerNames, t],
	);

	const onMerged = (sourceId: string) => {
		setMerged((s) => new Set(s).add(sourceId));
		setMergeWith(null);
		contacts.reload();
		toast.notify(t("contacts.merge.done"), "success");
	};

	return (
		<div className="sy-contacts" data-testid="contacts-view">
			<header>
				<h1 className="sy-contacts__h1">{t("nav.contacts")}</h1>
			</header>
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
							onActiveChange={setActiveId}
							{...(views ? { views } : {})}
							initialView={INITIAL_VIEW}
							sample={sample}
							emptyTitle={t("contacts.emptyTitle")}
							emptyHint={t("contacts.emptyHint")}
						/>
					)}
				</div>
				<ContactDetail
					contact={active}
					assignees={assignees}
					canMerge={canMerge}
					onUpdated={remember}
					onMerge={setMergeWith}
				/>
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
		</div>
	);
}
