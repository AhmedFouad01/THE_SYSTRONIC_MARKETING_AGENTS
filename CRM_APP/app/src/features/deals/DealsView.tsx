import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	isApiError,
	isForbidden,
	sessionStore,
	useSession,
} from "../../api/index.ts";
import { href, navigate } from "../../router.ts";
import {
	Badge,
	Button,
	createSavedViewsStore,
	DataGrid,
	IdentityCell,
	Dialog,
	useRecordSheet,
	ForbiddenState,
	type GridColumn,
	type GridSample,
	Money,
	PageHeader,
	safeLocalStorage,
	Tabs,
	useCursorList,
	useI18n,
	useToast,
} from "../../ui/index.ts";
import {
	fetchAssignees,
	fetchContact,
	fetchContactsPage,
	fetchDeal,
	fetchDealsPage,
	fetchLeadRef,
	fetchPipelines,
} from "./api.ts";
import { toneOf } from "./DealDetail.tsx";
import { DealRecord } from "./DealRecord.tsx";
import {
	type Assignee,
	BUILT_IN_VIEWS,
	type BuiltInView,
	type Contact,
	type Deal,
	type DealContext,
	type DealRow,
	currencyChoices,
	dealContextSearch,
	dealValueText,
	filterBuiltInView,
	type LeadRef,
	mergeLatest,
	type Pipeline,
	parseDealContext,
	parseSelect,
	toRows,
} from "./model.ts";
import { NewDealDialog, type NewDealPrefill } from "./NewDealDialog.tsx";
import "./deals.css";

const VIEW_LABEL = {
	all: "deals.view.all",
	mine: "deals.view.mine",
	open: "deals.view.open",
} as const;

const getDealId = (d: DealRow) => d.id;
const getDealIdRaw = (d: Deal) => d.id;
const getContactId = (c: Contact) => c.id;

type PipelinesState = {
	status: "loading" | "ready" | "error";
	items: readonly Pipeline[];
};

/** Lead -> Contact -> Deal context strip: earlier steps link back (with ?select=), the deal step is current. */
function ContextStrip({
	ctx,
	leadTitle,
	contactName,
	dealTitle,
}: {
	ctx: DealContext;
	leadTitle: string | null;
	contactName: string | null;
	dealTitle: string | null;
}) {
	const { t } = useI18n();
	const link = (route: "/leads" | "/contacts", id: string, label: string) => (
		<a
			href={`${href(route)}?select=${id}`}
			onClick={(e) => {
				e.preventDefault();
				navigate(route, `?select=${id}`);
			}}
		>
			{label}
		</a>
	);
	return (
		<nav
			className="sy-deals__context"
			aria-label={t("deals.context.label")}
			data-testid="deal-context"
		>
			<ol>
				{ctx.leadId ? (
					<li data-testid="context-lead">
						<span className="sy-deals__muted">{t("deals.context.lead")}</span>{" "}
						{link(
							"/leads",
							ctx.leadId,
							leadTitle ?? t("deals.context.unknown"),
						)}
					</li>
				) : null}
				<li data-testid="context-contact">
					<span className="sy-deals__muted">{t("deals.context.contact")}</span>{" "}
					{link(
						"/contacts",
						ctx.contactId,
						contactName ?? t("deals.context.unknown"),
					)}
				</li>
				<li aria-current="step" data-testid="context-deal">
					<span className="sy-deals__muted">{t("deals.context.deal")}</span>{" "}
					<b>{dealTitle ?? t("deals.context.dealNew")}</b>
				</li>
			</ol>
		</nav>
	);
}

export function DealsView() {
	const { t, formatMoney } = useI18n();
	const sheet = useRecordSheet();
	const toast = useToast();
	const session = useSession();
	const actor = session.info?.actor ?? null;
	const tenantId = sessionStore.getCredentials()?.tenantId ?? "";

	const deals = useCursorList<Deal>(fetchDealsPage, {
		getId: getDealIdRaw,
		resetKey: tenantId,
	});
	const contacts = useCursorList<Contact>(fetchContactsPage, {
		getId: getContactId,
		resetKey: tenantId,
	});
	const [assignees, setAssignees] = useState<readonly Assignee[]>([]);
	const [ownersFailed, setOwnersFailed] = useState(false);
	const [pipelines, setPipelines] = useState<PipelinesState>({
		status: "loading",
		items: [],
	});
	// biome-ignore lint/correctness/useExhaustiveDependencies: tenantId re-fetches directories for a new tenant
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
		fetchPipelines(ctrl.signal)
			.then((items) => setPipelines({ status: "ready", items }))
			.catch((e: unknown) => {
				if (!(e instanceof DOMException))
					setPipelines({ status: "error", items: [] });
			});
		return () => ctrl.abort();
	}, [tenantId]);

	// Confirmed writes (PATCH/POST/transition results) layered over the loaded pages.
	const [overlay, setOverlay] = useState<ReadonlyMap<string, Deal>>(new Map());
	const remember = useCallback(
		(deal: Deal) => setOverlay((m) => new Map(m).set(deal.id, deal)),
		[],
	);

	// ---- Lead -> Contact -> Deal context (from ?contact=&lead=&deal=) ----
	const [ctx, setCtx] = useState<DealContext | null>(() =>
		parseDealContext(location.search),
	);
	const [ctxContact, setCtxContact] = useState<Contact | null>(null);
	const [ctxLead, setCtxLead] = useState<LeadRef | null>(null);
	const [ctxSettled, setCtxSettled] = useState(ctx === null);
	const ctxContactId = ctx?.contactId ?? null;
	const ctxLeadId = ctx?.leadId ?? null;
	useEffect(() => {
		if (ctxContactId === null) return;
		let live = true;
		const settle = (p: Promise<unknown>) => p.catch(() => undefined);
		void Promise.all([
			settle(fetchContact(ctxContactId).then((c) => live && setCtxContact(c))),
			settle(
				ctxLeadId
					? fetchLeadRef(ctxLeadId).then((l) => live && setCtxLead(l))
					: Promise.resolve(),
			),
		]).then(() => live && setCtxSettled(true));
		return () => {
			live = false;
		};
	}, [ctxContactId, ctxLeadId]);

	const [view, setView] = useState<BuiltInView>("all");
	const [activeId, setActiveId] = useState<string | null>(
		() => ctx?.dealId ?? parseSelect(location.search),
	);
	const [newOpen, setNewOpen] = useState(false);

	const contactNames = useMemo(() => {
		const m = new Map(contacts.items.map((c) => [c.id, c.display_name]));
		if (ctxContact && !m.has(ctxContact.id))
			m.set(ctxContact.id, ctxContact.display_name);
		return m;
	}, [contacts.items, ctxContact]);
	const ownerNames = useMemo(
		() => new Map(assignees.map((a) => [a.id, a.name])),
		[assignees],
	);
	const pipelineById = useMemo(
		() => new Map(pipelines.items.map((p) => [p.id, p])),
		[pipelines.items],
	);
	const allRows = useMemo(
		() =>
			toRows(
				mergeLatest(deals.items, overlay),
				contactNames,
				ownerNames,
				pipelineById,
				{
					unassigned: t("common.unassigned"),
					unknownContact: t("deals.unknownContact"),
					unknownStage: t("deals.unknownStage"),
					unknownOwner: t("common.unknownUser"),
				},
			),
		[deals.items, overlay, contactNames, ownerNames, pipelineById, t],
	);
	const rows = useMemo(
		() => filterBuiltInView(allRows, view, actor),
		[allRows, view, actor],
	);
	const active =
		activeId === null ? null : (allRows.find((r) => r.id === activeId) ?? null);

	// A deal selected via the URL (after refresh) may not be on a loaded page: fetch it once.
	const fetchedDeal = useRef<string | null>(null);
	useEffect(() => {
		if (
			activeId === null ||
			deals.status === "loading" ||
			active !== null ||
			fetchedDeal.current === activeId
		)
			return;
		fetchedDeal.current = activeId;
		fetchDeal(activeId).then(remember, () => undefined);
	}, [activeId, active, deals.status, remember]);

	// Arriving from Lead/Contact with context: open the create dialog once everything it prefills is known.
	const autoOpened = useRef(false);
	useEffect(() => {
		if (
			autoOpened.current ||
			ctx === null ||
			ctx.dealId !== null ||
			!ctxSettled ||
			pipelines.status === "loading"
		)
			return;
		autoOpened.current = true;
		setNewOpen(true);
	}, [ctx, ctxSettled, pipelines.status]);

	const views = useMemo(
		() =>
			actor && tenantId
				? createSavedViewsStore({
						storage: safeLocalStorage(),
						tenantId,
						actor,
						gridId: "deals",
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
	const stageOptions = useMemo(() => {
		const names = new Set<string>();
		for (const p of pipelines.items)
			for (const s of p.stages) names.add(s.name);
		return [...names].map((n) => ({ value: n, label: n }));
	}, [pipelines.items]);

	const columns = useMemo<ReadonlyArray<GridColumn<DealRow>>>(
		() => [
			{
				id: "deal",
				header: t("deals.col.deal"),
				value: (r) => r.title,
				sortable: true,
				hideable: false,
				mobile: "title",
				cell: (r) => <IdentityCell name={r.title} caption={r.contactName} />,
			},
			{
				id: "contact",
				header: t("deals.col.contact"),
				value: (r) => r.contactName,
				sortable: true,
				width: "170px",
				mobile: "hide",
				collapse: 1,
			},
			{
				id: "pipeline",
				header: t("deals.col.pipeline"),
				value: (r) => r.pipelineName,
				sortable: true,
				width: "150px",
				mobile: "hide",
				collapse: 2,
			},
			{
				id: "stage",
				header: t("common.stage"),
				value: (r) => r.stageName,
				sortable: true,
				width: "140px",
				mobile: "chip",
				filter: { options: stageOptions },
				cell: (r) => <Badge tone={toneOf(r.stageOutcome)}>{r.stageName}</Badge>,
			},
			{
				id: "value",
				header: t("common.value"),
				value: (r) => r.value,
				searchable: false,
				sortable: true,
				width: "130px",
				cell: (r) => <Money>{dealValueText(r, formatMoney)}</Money>,
			},
			{
				id: "owner",
				header: t("common.owner"),
				value: (r) => r.ownerName,
				sortable: true,
				width: "150px",
				filter: { options: ownerOptions },
			},
		],
		[t, formatMoney, stageOptions, ownerOptions],
	);

	const sample: GridSample = {
		loaded: deals.items.length,
		hasMore: deals.sample,
		loadingMore: deals.loadingMore,
		atCap: deals.atCap,
		failed: deals.moreError !== null,
		onLoadMore: deals.loadMore,
	};

	const prefill = useMemo<NewDealPrefill | null>(
		() =>
			ctx !== null && ctx.dealId === null
				? {
						contactId: ctx.contactId,
						leadId: ctx.leadId,
						title: ctxLead?.title ?? "",
					}
				: null,
		[ctx, ctxLead],
	);
	const contactOptions = useMemo(() => {
		const list = [...contacts.items];
		if (ctxContact && !list.some((c) => c.id === ctxContact.id))
			list.unshift(ctxContact);
		return list;
	}, [contacts.items, ctxContact]);

	const onCreated = (deal: Deal) => {
		remember(deal);
		setView("all");
		setActiveId(deal.id);
		setNewOpen(false);
		toast.notify(t("deals.new.created"), "success");
		if (ctx !== null) {
			const next = { ...ctx, dealId: deal.id };
			setCtx(next);
			history.replaceState(null, "", href("/deals") + dealContextSearch(next));
		}
	};

	const currencies = useMemo(
		() => currencyChoices(allRows.map((r) => r.currency)),
		[allRows],
	);
	const closeRecord = () => setActiveId(null);
	const page = !sheet;
	const record = (deal: DealRow, onBack?: () => void) => (
		<DealRecord
			key={deal.id}
			deal={deal}
			pipeline={pipelineById.get(deal.pipeline_id)}
			assignees={assignees}
			actors={ownerNames}
			currencies={currencies}
			onUpdated={remember}
			{...(onBack ? { onBack } : {})}
		/>
	);

	const activeTitle =
		ctx?.dealId != null
			? (allRows.find((r) => r.id === ctx.dealId)?.title ?? null)
			: null;

	return (
		<div className="sy-deals" data-testid="deals-view">
			{page && active ? (
				<>
					{ctx !== null ? (
						<ContextStrip
							ctx={ctx}
							leadTitle={ctxLead?.title ?? null}
							contactName={ctxContact?.display_name ?? null}
							dealTitle={activeTitle}
						/>
					) : null}
					{record(active, closeRecord)}
				</>
			) : null}
			{/* The list stays mounted (hidden) behind the record page so filters, sort and paging survive Back. */}
			<div className="sy-deals__list" hidden={page && active !== null}>
			<PageHeader
				title={t("nav.deals")}
				actions={
					<Button
						variant="primary"
						icon="plus"
						onClick={() => setNewOpen(true)}
						disabled={
							pipelines.status !== "ready" || pipelines.items.length === 0
						}
						data-testid="new-deal"
					>
						{t("action.newDeal")}
					</Button>
				}
			/>
			{ctx !== null && !(page && active) ? (
				<ContextStrip
					ctx={ctx}
					leadTitle={ctxLead?.title ?? null}
					contactName={ctxContact?.display_name ?? null}
					dealTitle={activeTitle}
				/>
			) : null}
			<Tabs
				label={t("deals.views")}
				value={view}
				onChange={(id) => setView(id as BuiltInView)}
				tabs={BUILT_IN_VIEWS.map((v) => ({ id: v, label: t(VIEW_LABEL[v]) }))}
			/>
			{ownersFailed ? (
				<p className="sy-deals__muted" role="status">
					{t("deals.ownersFailed")}
				</p>
			) : null}
			{pipelines.status === "error" ? (
				<p
					className="sy-deals__muted"
					role="status"
					data-testid="pipelines-failed"
				>
					{t("deals.pipelinesFailed")}
				</p>
			) : null}
			{pipelines.status === "ready" && pipelines.items.length === 0 ? (
				<p className="sy-deals__muted" role="status" data-testid="no-pipelines">
					{t("deals.noPipelines")}
				</p>
			) : null}
			<div className="sy-deals__body">
				<div className="sy-deals__main">
					{deals.status === "error" && isForbidden(deals.error) ? (
						<ForbiddenState />
					) : (
						<DataGrid<DealRow>
							gridId="deals"
							label={t("deals.grid")}
							rows={rows}
							columns={columns}
							getRowId={getDealId}
							status={deals.status}
							onRetry={deals.reload}
							requestId={isApiError(deals.error) ? deals.error.requestId : null}
							activeId={activeId}
							onActiveChange={setActiveId}
							{...(views ? { views } : {})}
							sample={sample}
							emptyTitle={t("deals.emptyTitle")}
							emptyHint={t("deals.emptyHint")}
						/>
					)}
				</div>
			</div>
			</div>
			<NewDealDialog
				open={newOpen}
				onClose={() => setNewOpen(false)}
				contacts={contactOptions}
				pipelines={pipelines.items}
				assignees={assignees}
				currencies={currencies}
				prefill={prefill}
				onCreated={onCreated}
			/>
			{sheet && active ? (
				<Dialog
					open
					onClose={closeRecord}
					title={t("deals.detail.title")}
					placement="side"
					testId="deal-sheet"
				>
					{record(active)}
				</Dialog>
			) : null}
		</div>
	);
}
