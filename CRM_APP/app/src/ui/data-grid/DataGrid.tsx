import {
	type KeyboardEvent,
	type MouseEvent,
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useReducer,
	useRef,
	useState,
} from "react";
import { BidiText, useI18n } from "../i18n/index.ts";
import { Icon } from "../icons/index.ts";
import { Dialog } from "../overlays/Dialog.tsx";
import { rovingIndex } from "../overlays/nav.ts";
import { Popover } from "../overlays/Popover.tsx";
import { useMediaQuery } from "../primitives/useMediaQuery.ts";
import { Button } from "../primitives/Button.tsx";
import { Input } from "../primitives/Field.tsx";
import { Select } from "../primitives/Select.tsx";
import { EmptyState, ErrorState, SkeletonRows } from "../primitives/States.tsx";
import {
	ariaSortOf,
	computeView,
	DEFAULT_VIEW,
	type FilterSpec,
	gridReducer,
	initialGridState,
	type ModelColumn,
	PAGE_SIZES,
	pageSelectionState,
	pagerItems,
	paginate,
	setEqFilter,
	type ViewState,
	visibleColumns,
} from "./gridModel.ts";
import type { SavedView, SavedViewsStore } from "./savedViews.ts";
import type { ServerBinding } from "./useServerList.ts";
import "./grid-kit.css";
import { Button as AriaButton, Input as AriaInput, TextField } from "react-aria-components";
import { Checkbox } from "../primitives/Checkbox.tsx";

export type GridColumn<T> = ModelColumn<T> & {
	header: string;
	cell?: (row: T) => ReactNode;
	sortable?: boolean;
	/** Bidi-sensitive values (ids, emails, phones, money): rendered LTR-isolated. */
	ltr?: boolean;
	/** Adds an equality filter control for this column. */
	filter?: { options: ReadonlyArray<{ value: string; label: string }> };
	/** CSS width of the column (e.g. "140px"). Omit for the flexible column that takes the remaining space. */
	width?: string;
	/**
	 * Secondary column that drops out (>768px only) when the grid is narrower than the tier's width, so the primary
	 * column keeps a readable width (UX-R2-01): 1 = hidden below 1040px (first to go), 2 = hidden below 880px.
	 * Still reachable through the record panel / Columns chooser.
	 */
	collapse?: 1 | 2;
	/** Icon-only column: the header text stays for assistive tech but takes no width. */
	headerHidden?: boolean;
	/**
	 * Role of the cell in the mobile card layout (<=768px): `title` = card heading (default: first column),
	 * `chip` = status chip beside the title, `meta` = inline meta line (default), `action` = row action pushed to the
	 * inline-end of the meta line (no separator), `hide` = not shown on cards.
	 */
	mobile?: "title" | "chip" | "meta" | "action" | "hide";
	/** Hover title for plain-text cells that have no custom `cell` (default: the value when it is a string). */
	titleText?: (row: T) => string | undefined;
};

/**
 * Optional pieces a feature hosts in the grid without owning its state (P1b B4: custom-field columns and typed filters).
 * The grid renders them: picker in the toolbar (desktop) and `columnList` in the phone sheet; `filterPanel` in the filters
 * panel/sheet; `chips` (`<li>`s) beside the column-filter chips. `filterCount` adds to the Filters badge; `onClear` runs with Clear filters.
 */
export type GridExtension = {
	columnPicker: ReactNode;
	columnList: ReactNode;
	filterPanel: ReactNode;
	filterCount: number;
	chips: ReactNode;
	onClear: () => void;
};

export type GridSample = {
	loaded: number;
	/** next_cursor remains: loaded rows are a sample. */
	hasMore: boolean;
	loadingMore: boolean;
	atCap: boolean;
	failed: boolean;
	onLoadMore: () => void;
};

export type DataGridProps<T> = {
	/** Stable id of this grid: part of the saved-views key. */
	gridId: string;
	/** Accessible name of the table. */
	label: string;
	rows: readonly T[];
	columns: ReadonlyArray<GridColumn<T>>;
	getRowId: (row: T) => string;
	status: "loading" | "ready" | "error";
	onRetry?: () => void;
	requestId?: string | null;
	/** Master-detail row. Uncontrolled unless `activeId` is passed. */
	activeId?: string | null;
	onActiveChange?: (id: string | null) => void;
	/** Enables the checkbox column and bulk selection. */
	selectable?: boolean;
	onSelectionChange?: (ids: ReadonlySet<string>) => void;
	/** Contextual batch actions, shown while rows are selected. */
	batchActions?: (ids: readonly string[], clear: () => void) => ReactNode;
	views?: SavedViewsStore;
	initialView?: ViewState;
	sample?: GridSample;
	/**
	 * Server mode (P1A S4): search, filters, sort and the total come from the API. `rows` are the rows loaded so far
	 * in server order; the grid performs no client-side search/filter/sort and reports its (debounced) query instead.
	 */
	server?: ServerBinding;
	emptyTitle?: string;
	emptyHint?: string;
	/** Primary next step in the zero-data empty state (UX-23). Not shown for filtered-empty. */
	emptyAction?: ReactNode;
	toolbarExtra?: ReactNode;
	extension?: GridExtension;
	/**
	 * Keep this row visible: switch to the grid page that holds it and scroll it into view (`block: "nearest"`, never
	 * horizontal-first). Used by the preview slide-over for Prev/Next and deep links. Off when undefined/null.
	 */
	revealId?: string | null;
};

const interactive = "input,button,a,select,label,textarea";
/** Typing in the search box reaches the server after this pause (filters and sort apply at once). */
export const SEARCH_DEBOUNCE_MS = 275;

export function DataGrid<T>(props: DataGridProps<T>) {
	const { rows, columns, getRowId, selectable = false, views, server } = props;
	const { t, tx, locale, formatNumber, dir: uiDir } = useI18n();
	const [state, dispatch] = useReducer(
		gridReducer,
		props.initialView ?? DEFAULT_VIEW,
		initialGridState,
	);
	const getIdRef = useRef(getRowId);
	const selectionCb = useRef(props.onSelectionChange);
	const activeCb = useRef(props.onActiveChange);
	useEffect(() => {
		getIdRef.current = getRowId;
		selectionCb.current = props.onSelectionChange;
		activeCb.current = props.onActiveChange;
	});

	const cols = useMemo(
		() => visibleColumns(columns, state.hidden),
		[columns, state.hidden],
	);
	const { matching, pageRows, pageInfo } = useMemo(() => {
		if (!server) return computeView(rows, columns, state, locale);
		// Server mode: `rows` already are the server's answer in server order; only the page window is cut here.
		const loaded = rows.length;
		const known = server.total
			? Math.max(server.total.value, loaded)
			: loaded + (server.hasMore ? 1 : 0);
		const info = paginate(known, state.page, state.pageSize);
		return {
			matching: rows as T[],
			pageRows: rows.slice(info.start, info.end) as T[],
			pageInfo: info,
		};
	}, [rows, columns, state, locale, server]);
	const pageIds = useMemo(
		() => pageRows.map((r) => getIdRef.current(r)),
		[pageRows],
	);
	const activeId =
		props.activeId !== undefined ? props.activeId : state.activeId;

	// Reloads can remove rows: drop selection/active ids that are no longer loaded.
	useEffect(() => {
		dispatch({ type: "prune", validIds: rows.map((r) => getIdRef.current(r)) });
	}, [rows]);
	useEffect(() => {
		selectionCb.current?.(state.selection);
	}, [state.selection]);

	// ---- server mode: report the query (search debounced) and how many rows the current page needs ----
	const serverRef = useRef(server);
	useEffect(() => {
		serverRef.current = server;
	});
	const hasServer = server !== undefined;
	const sentQuery = useRef(props.initialView?.query ?? DEFAULT_VIEW.query);
	useEffect(() => {
		if (!hasServer) return;
		const delay = state.query === sentQuery.current ? 0 : SEARCH_DEBOUNCE_MS;
		const id = setTimeout(() => {
			sentQuery.current = state.query;
			serverRef.current?.onQueryChange({
				query: state.query,
				filters: state.filters,
				sorts: state.sorts,
			});
		}, delay);
		return () => clearTimeout(id);
	}, [hasServer, state.query, state.filters, state.sorts]);
	const needRows = pageInfo.start + pageInfo.pageSize;
	useEffect(() => {
		if (hasServer) serverRef.current?.onNeedRows(needRows, state.pageSize);
	}, [hasServer, needRows, state.pageSize]);

	const open = (id: string) => {
		dispatch({ type: "open", id });
		activeCb.current?.(id);
	};

	// ---- keyboard: roving row focus ----
	const rowRefs = useRef<Array<HTMLTableRowElement | null>>([]);

	// ---- reveal: page switch (once per id, as soon as the row is loaded), then scroll it into view ----
	const revealId = props.revealId ?? null;
	const revealed = useRef<string | null>(null);
	const scrollTo = useRef<string | null>(null);
	useEffect(() => {
		if (revealId === null) {
			revealed.current = null;
			return;
		}
		if (revealed.current === revealId) return;
		const idx = matching.findIndex((r) => getIdRef.current(r) === revealId);
		if (idx < 0) return; // not loaded yet: retried when rows arrive
		revealed.current = revealId;
		scrollTo.current = revealId;
		const target = Math.floor(idx / state.pageSize) + 1;
		if (target !== state.page) dispatch({ type: "page", page: target });
	}, [revealId, matching, state.pageSize, state.page]);
	// biome-ignore lint/correctness/useExhaustiveDependencies: pageIds/revealId re-run the pending scroll (rowRefs is a ref)
	useEffect(() => {
		const id = scrollTo.current;
		if (id === null) return;
		const i = pageIds.indexOf(id);
		if (i < 0) return;
		scrollTo.current = null;
		rowRefs.current[i]?.scrollIntoView({ block: "nearest", inline: "nearest" });
	}, [pageIds, revealId]);
	const [focusIdx, setFocusIdx] = useState(0);
	const tabIdx = Math.min(focusIdx, Math.max(0, pageRows.length - 1));
	const onRowKey = (
		e: KeyboardEvent<HTMLTableRowElement>,
		i: number,
		id: string,
	) => {
		if (e.target !== e.currentTarget) return;
		const next = rovingIndex(e.key, i, pageRows.length, false);
		if (next !== null) {
			e.preventDefault();
			setFocusIdx(next);
			rowRefs.current[next]?.focus();
		} else if (e.key === "Enter") {
			e.preventDefault();
			open(id);
		} else if (e.key === " " && selectable) {
			e.preventDefault();
			dispatch({ type: "toggleRow", id });
		}
	};
	const onRowClick = (e: MouseEvent<HTMLTableRowElement>, id: string) => {
		if (e.target instanceof Element && e.target.closest(interactive)) return;
		open(id);
	};

	// ---- select-all checkbox (indeterminate is a DOM-only property) ----
	const allRef = useRef<HTMLInputElement>(null);
	const pageSel = pageSelectionState(state.selection, pageIds);
	useEffect(() => {
		if (allRef.current) allRef.current.indeterminate = pageSel === "some";
	}, [pageSel]);

	// ---- saved views ----
	const [saved, setSaved] = useState<SavedView[]>(() => views?.list() ?? []);
	const [viewId, setViewId] = useState<string | null>(null);
	const [saveOpen, setSaveOpen] = useState(false);
	const [viewName, setViewName] = useState("");
	const [viewError, setViewError] = useState<string | undefined>(undefined);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const currentView = saved.find((v) => v.id === viewId) ?? null;
	const viewSnapshot = (): ViewState => ({
		query: state.query,
		filters: state.filters,
		sorts: state.sorts,
		hidden: state.hidden,
		density: state.density,
		pageSize: state.pageSize,
	});
	const saveView = () => {
		if (!views) return;
		const res = views.save(viewName, viewSnapshot());
		if (!res.ok) {
			setViewError(
				res.reason === "name"
					? t("grid.viewNameRequired")
					: t("grid.viewSaveFailed"),
			);
			return;
		}
		setSaved(views.list());
		setViewId(res.view.id);
		setSaveOpen(false);
	};
	const removeView = () => {
		if (views && currentView) {
			views.remove(currentView.id);
			setSaved(views.list());
			setViewId(null);
			dispatch({ type: "applyView", view: props.initialView ?? DEFAULT_VIEW });
		}
		setDeleteOpen(false);
	};

	// ---- filters ----
	const filterCols = columns.filter((c) => c.filter);
	const [filtersOpen, setFiltersOpen] = useState(false);
	const eqValue = (key: string): string => {
		const f = state.filters.find((x: FilterSpec) => x.key === key);
		return f && f.op === "eq" ? String(f.value) : "";
	};
	const optionLabel = (c: GridColumn<T>, v: string) =>
		c.filter?.options.find((o) => o.value === v)?.label ?? v;
	const ext = props.extension;
	const extCount = ext?.filterCount ?? 0;
	const hasFilterUi = filterCols.length > 0 || ext !== undefined;
	const filtersActive = state.filters.length > 0 || state.query.trim() !== "" || extCount > 0;
	const clearAll = () => {
		dispatch({ type: "clearFilters" });
		ext?.onClear();
	};
	// UX-25: at phone width the toolbar is one row (search + Filters); filters, saved views, columns and
	// density live in a sheet so the first card is not pushed down by three toolbar rows.
	const compact = useMediaQuery("(max-width: 768px)");
	const sheetOpen = compact && filtersOpen;

	const toggleSort = useCallback(
		(id: string, additive: boolean) =>
			dispatch({ type: "sort", key: id, additive }),
		[],
	);
	const selectedIds = [...state.selection];
	const clearSelection = () => dispatch({ type: "clearSelection" });
	const batchOpen = selectable && state.selection.size > 0;

	// Exact server total ("1,234"); a capped count (10,000 is the server ceiling) reads "10,000+".
	const totalText = server?.total
		? `${formatNumber(Math.max(server.total.value, matching.length))}${server.total.exact ? "" : "+"}`
		: formatNumber(matching.length);
	const body = (() => {
		if (props.status === "loading" && rows.length === 0)
			return <SkeletonRows count={6} />;
		if (props.status === "error")
			return (
				<ErrorState
					requestId={props.requestId ?? null}
					{...(props.onRetry ? { onRetry: props.onRetry } : {})}
				/>
			);
		// Server mode: a page beyond the loaded rows is still on its way (keyset cursor), not an empty result.
		if (server && pageRows.length === 0 && matching.length > 0)
			return <SkeletonRows count={6} />;
		if (matching.length === 0)
			return filtersActive || rows.length > 0 ? (
				<EmptyState
					title={t("state.noResults")}
					hint={t("state.noResultsHint")}
					action={
						<Button
							size="sm"
							onClick={clearAll}
						>
							{t("common.clearFilters")}
						</Button>
					}
				/>
			) : (
				<EmptyState
					{...(props.emptyTitle ? { title: props.emptyTitle } : {})}
					{...(props.emptyHint ? { hint: props.emptyHint } : {})}
					{...(props.emptyAction ? { action: props.emptyAction } : {})}
				/>
			);
		return (
			// F2: not focusable itself (no wrapper ring after a mouse click); keyboard users reach the rows, which scroll into view.
			<section className="sy-grid__scroll" aria-label={props.label}>
				<table
					className={`sy-grid__table${selectable ? " sy-grid__table--sel" : ""}`}
					data-density={state.density}
					data-testid="grid-table"
				>
					<caption className="sy-grid__sr">{props.label}</caption>
					<thead>
						<tr>
							{selectable ? (
								<th scope="col" className="sy-grid__check">
									<Checkbox
										inputRef={allRef}
										indeterminate={pageSel === "some"}
										label={<span className="sr-only">{t("grid.selectAll")}</span>}
										checked={pageSel === "all"}
										onChange={() => dispatch({ type: "togglePage", pageIds })}
										data-testid="grid-select-all"
									/>
								</th>
							) : null}
							{cols.map((c) => {
								const dir = ariaSortOf(state.sorts, c.id);
								return (
									<th
										key={c.id}
										scope="col"
										aria-sort={c.sortable ? dir : undefined}
										style={
											c.width
												? { width: c.width, maxWidth: c.width }
												: undefined
										}
										data-mobile={c.mobile}
										data-collapse={c.collapse}
									>
										{c.sortable ? (
											<AriaButton
												type="button"
												className="sy-grid__sort"
												aria-label={t("grid.sortBy", { column: c.header })}
												onClick={(e) => toggleSort(c.id, e.shiftKey)}
												data-testid={`sort-${c.id}`}
												data-active={dir !== "none" || undefined}
											>
												<span>{c.header}</span>
												{dir !== "none" ? (
													<span
														aria-hidden="true"
														className="sy-grid__sortmark"
														data-testid="sort-mark"
														data-dir={dir === "ascending" ? "asc" : "desc"}
													>
														<Icon name={dir === "ascending" ? "chevronUp" : "chevronDown"} size={14} />
													</span>
												) : (
													<span aria-hidden="true" className="sy-grid__sortghost">
														<Icon name="chevronDown" size={14} />
													</span>
												)}
											</AriaButton>
										) : c.headerHidden ? (
											<span className="sy-grid__sr">{c.header}</span>
										) : (
											c.header
										)}
									</th>
								);
							})}
						</tr>
					</thead>
					<tbody>
						{pageRows.map((row, i) => {
							const id = getRowId(row);
							const checked = state.selection.has(id);
							return (
								<tr
									key={id}
									ref={(el) => {
										rowRefs.current[i] = el;
									}}
									tabIndex={i === tabIdx ? 0 : -1}
									aria-current={id === activeId ? "true" : undefined}
									aria-selected={id === activeId || checked}
									data-selected={checked || undefined}
									data-testid="grid-row"
									data-row-id={id}
									onClick={(e) => onRowClick(e, id)}
									onKeyDown={(e) => onRowKey(e, i, id)}
									onFocus={(e) => {
										if (e.target === e.currentTarget) setFocusIdx(i);
									}}
								>
									{selectable ? (
										<td className="sy-grid__check">
											<Checkbox
												label={<span className="sr-only">{t("grid.selectRow", {
													name: String(cols[0]?.value(row) ?? id),
												})}</span>}
												checked={checked}
												onChange={() => dispatch({ type: "toggleRow", id })}
											/>
										</td>
									) : null}
									{cols.map((c, ci) => {
										const plain = c.cell ? undefined : c.value(row);
										const tip = c.titleText
											? c.titleText(row)
											: typeof plain === "string"
												? plain
												: undefined;
										return (
											<td
												key={c.id}
												className={`sy-grid__cell${c.ltr ? " sy-ltr" : ""}${c.width ? "" : " sy-grid__cell--flex"}`}
												style={
													c.width
														? { width: c.width, maxWidth: c.width }
														: undefined
												}
												data-mobile={c.mobile ?? (ci === 0 ? "title" : "meta")}
												data-collapse={c.collapse}
												title={tip}
											>
												{c.cell ? (
													c.cell(row)
												) : typeof plain === "string" && !c.ltr ? (
													<BidiText>{plain}</BidiText>
												) : (
													(plain ?? "")
												)}
											</td>
										);
									})}
								</tr>
							);
						})}
					</tbody>
				</table>
			</section>
		);
	})();

	const viewsEl = views ? (
			<fieldset className="sy-grid__views">
				<legend className="sy-grid__sr">{t("grid.views")}</legend>
				<AriaButton
					type="button"
					className="sy-grid__view"
					aria-pressed={viewId === null}
					onClick={() => {
						setViewId(null);
						dispatch({
							type: "applyView",
							view: props.initialView ?? DEFAULT_VIEW,
						});
					}}
				>
					{t("common.all")}
				</AriaButton>
				{saved.map((v) => (
					<AriaButton
						key={v.id}
						type="button"
						className="sy-grid__view"
						aria-pressed={v.id === viewId}
						onClick={() => {
							setViewId(v.id);
							dispatch({ type: "applyView", view: v.state });
						}}
					>
						<bdi>{v.name}</bdi>
					</AriaButton>
				))}
				<Button
					size="sm"
					variant="ghost"
					icon="plus"
					onClick={() => {
						setViewName("");
						setViewError(undefined);
						setSaveOpen(true);
					}}
					data-testid="grid-save-view"
				>
					{t("grid.saveView")}
				</Button>
				{currentView ? (
					<Button
						size="sm"
						variant="ghost"
						icon="delete"
						onClick={() => setDeleteOpen(true)}
					>
						{t("grid.deleteView")}
					</Button>
				) : null}
			</fieldset>
	) : null;
	const filtersPanel = (
		<div className="sy-grid__filters">
			{filterCols.map((c) => (
				<Select
					key={c.id}
					label={c.header}
					size="sm"
					value={eqValue(c.id)}
					onChange={(e) =>
						dispatch({
							type: "filters",
							filters: setEqFilter(
								state.filters,
								c.id,
								e.target.value === "" ? null : e.target.value,
							),
						})
					}
				>
					<option value="">{t("common.all")}</option>
					{c.filter?.options.map((o) => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</Select>
			))}
			{ext?.filterPanel}
			<Button size="sm" onClick={clearAll} disabled={!filtersActive}>
				{t("common.clearFilters")}
			</Button>
		</div>
	);
	const sheet = (
		<Dialog
			open={sheetOpen}
			onClose={() => setFiltersOpen(false)}
			title={t("grid.sheetTitle")}
			placement="sheet"
			testId="grid-sheet"
			footer={
				<Button
					variant="primary"
					onClick={() => setFiltersOpen(false)}
					data-testid="grid-sheet-done"
				>
					{t("common.done")}
				</Button>
			}
		>
			<div className="sy-grid__sheet">
				{viewsEl}
				{hasFilterUi ? filtersPanel : null}
				<b className="sy-grid__poptitle">{t("grid.visibleColumns")}</b>
				{columns.map((c) => (
					<div key={c.id} className="sy-grid__colopt"><Checkbox label={c.header} checked={c.hideable === false || !state.hidden.includes(c.id)} disabled={c.hideable === false} onChange={() => dispatch({ type: "toggleColumn", id: c.id })} /></div>
				))}
				{ext?.columnList}
				<Button
					size="sm"
					aria-pressed={state.density === "compact"}
					onClick={() =>
						dispatch({
							type: "density",
							density: state.density === "compact" ? "comfortable" : "compact",
						})
					}
				>
					{state.density === "compact"
						? t("grid.densityComfortable")
						: t("grid.densityCompact")}
				</Button>
			</div>
		</Dialog>
	);

	return (
		<div className="sy-grid" data-testid="data-grid" aria-busy={server?.refreshing || undefined}>
			<div className="sy-grid__toolwrap">
				<search className="sy-grid__toolbar" inert={batchOpen}>
					<TextField className="sy-grid__searchbox" aria-label={t("grid.search")}>
						<Icon name="search" size={16} />
						<AriaInput
							type="search"
							// UI_R4_SPEC I: the typed query takes its own direction; an empty box keeps the UI direction.
							dir={state.query ? "auto" : uiDir}
							className="sy-grid__search"
							aria-label={t("grid.search")}
							placeholder={t("grid.searchPlaceholder")}
							value={state.query}
							onChange={(e) =>
								dispatch({ type: "query", query: e.target.value })
							}
							data-testid="grid-search"
						/>
					</TextField>
					{compact ? (
						<Button
							size="sm"
							icon="filter"
							aria-expanded={filtersOpen}
							aria-label={t("grid.sheetTitle")}
							onClick={() => setFiltersOpen((v) => !v)}
							data-testid="grid-filters"
						>
							{state.filters.length + extCount > 0 ? formatNumber(state.filters.length + extCount) : null}
						</Button>
					) : (
						<>
							{viewsEl}
							<div className="sy-grid__tools">
								{hasFilterUi ? (
									<Button
										size="sm"
										icon="filter"
										aria-expanded={filtersOpen}
										onClick={() => setFiltersOpen((v) => !v)}
										data-testid="grid-filters"
									>
										{state.filters.length + extCount > 0
											? tx("grid.filtersCount", {
													count: formatNumber(state.filters.length + extCount),
												})
											: t("common.filters")}
									</Button>
								) : null}
								<Popover
									label={t("grid.chooseColumns")}
									triggerLabel={tx("grid.columnsCount", {
										count: formatNumber(cols.length),
									})}
									testId="grid-columns"
								>
									<b className="sy-grid__poptitle">{t("grid.visibleColumns")}</b>
									{columns.map((c) => (
										<div key={c.id} className="sy-grid__colopt"><Checkbox label={c.header} checked={c.hideable === false || !state.hidden.includes(c.id)} disabled={c.hideable === false} onChange={() => dispatch({ type: "toggleColumn", id: c.id })} /></div>
									))}
								</Popover>
								{ext?.columnPicker}
								<Button
									size="sm"
									aria-pressed={state.density === "compact"}
									onClick={() =>
										dispatch({
											type: "density",
											density:
												state.density === "compact" ? "comfortable" : "compact",
										})
									}
									data-testid="grid-density"
								>
									{state.density === "compact"
										? t("grid.densityComfortable")
										: t("grid.densityCompact")}
								</Button>
								{props.toolbarExtra}
							</div>
							<p className="sy-grid__count" role="status" data-testid="grid-count">
								{tx("format.matching", { count: totalText })}
							</p>
						</>
					)}
				</search>
				{batchOpen ? (
					<section
						className="sy-grid__batch"
						aria-label={t("format.selectedCount", {
							count: formatNumber(state.selection.size),
						})}
						data-testid="grid-batch"
					>
						<b>
							{tx("format.selectedCount", {
								count: formatNumber(state.selection.size),
							})}
						</b>
						{props.batchActions?.(selectedIds, clearSelection)}
						<Button
							size="sm"
							variant="ghost"
							onClick={clearSelection}
							data-testid="grid-batch-clear"
						>
							{t("common.clearSelection")}
						</Button>
					</section>
				) : null}
			</div>

			{!compact && filtersOpen && hasFilterUi ? filtersPanel : null}
			{state.filters.length > 0 || extCount > 0 ? (
				<ul className="sy-grid__chips" aria-label={t("common.filters")}>
					{state.filters.flatMap((f) => {
						const c = columns.find((x) => x.id === f.key);
						if (!c || f.op !== "eq") return [];
						const text = `${c.header}: ${optionLabel(c, String(f.value))}`;
						return [
							<li key={f.key}>
								<span className="sy-grid__chip sy-grid__chip--static">
									{text}
									<AriaButton
										type="button"
										className="sy-grid__chipx"
										aria-label={t("grid.removeFilter", { name: text })}
										onClick={() =>
											dispatch({
												type: "filters",
												filters: setEqFilter(state.filters, f.key, null),
											})
										}
									>
										<Icon name="close" size={12} />
									</AriaButton>
								</span>
							</li>,
						];
					})}
					{ext?.chips}
				</ul>
			) : null}

			{body}

			{props.status === "ready" && matching.length > 0 ? (
				<div className="sy-grid__footer" data-testid="grid-footer">
					<span className="sy-grid__range" data-testid="grid-range">
						{tx("grid.range", {
							from: formatNumber(pageInfo.start + 1),
							to: formatNumber(pageInfo.start + pageRows.length),
							total: totalText,
						})}
					</span>
					<div className="sy-grid__rows">
						<span aria-hidden="true">{t("common.rows")}</span>
						<Select
							label={t("common.rowsPerPage")}
							size="sm"
							value={String(state.pageSize)}
							onChange={(e) =>
								dispatch({ type: "pageSize", size: Number(e.target.value) })
							}
							className="sy-grid__size"
						>
							{PAGE_SIZES.map((n) => (
								<option key={n} value={n}>
									{formatNumber(n)}
								</option>
							))}
						</Select>
					</div>
					<nav
						className="sy-grid__pager"
						aria-label={t("grid.pager")}
						data-testid="grid-pager"
					>
						<AriaButton
							type="button"
							className="sy-grid__pg sy-grid__pg--prev"
							aria-label={t("common.previousPage")}
							isDisabled={pageInfo.page <= 1}
							onClick={() =>
								dispatch({ type: "page", page: pageInfo.page - 1 })
							}
							data-testid="grid-prev"
						>
							<Icon
								name="chevronRight"
								size={16}
								mirrorInRtl={false}
								className="sy-back-icon"
							/>
						</AriaButton>
						{pagerItems(pageInfo.page, pageInfo.pageCount).map((it, i) =>
							it === "gap" ? (
								<span
									// biome-ignore lint/suspicious/noArrayIndexKey: gaps are positional separators
									key={`gap-${i}`}
									className="sy-grid__pg-gap"
									aria-hidden="true"
								>
									…
								</span>
							) : (
								<AriaButton
									key={it}
									type="button"
									className="sy-grid__pg"
									aria-label={t("grid.goToPage", { page: formatNumber(it) })}
									aria-current={it === pageInfo.page ? "page" : undefined}
									onClick={() => dispatch({ type: "page", page: it })}
									data-testid={`grid-page-${it}`}
								>
									{formatNumber(it)}
								</AriaButton>
							),
						)}
						<AriaButton
							type="button"
							className="sy-grid__pg sy-grid__pg--next"
							aria-label={t("common.nextPage")}
							isDisabled={pageInfo.page >= pageInfo.pageCount}
							onClick={() =>
								dispatch({ type: "page", page: pageInfo.page + 1 })
							}
							data-testid="grid-next"
						>
							<Icon name="chevronRight" size={16} />
						</AriaButton>
					</nav>
				</div>
			) : null}

			{server?.moreFailed ? (
				<div className="sy-grid__sample" role="status" data-testid="grid-more-failed">
					<Icon name="info" size={16} />
					<span role="alert">{t("grid.loadMoreFailed")}</span>
					<Button size="sm" loading={server.loadingMore} onClick={server.onRetryMore}>
						{t("state.retry")}
					</Button>
				</div>
			) : null}

			{props.sample?.hasMore ? (
				<div
					className="sy-grid__sample"
					role="status"
					data-testid="grid-sample"
				>
					<Icon name="info" size={16} />
					<span>
						{props.sample.atCap
							? tx("grid.sampleCap", {
									count: formatNumber(props.sample.loaded),
								})
							: tx("grid.sample", { count: formatNumber(props.sample.loaded) })}
					</span>
					{props.sample.failed ? (
						<span role="alert">{t("grid.loadMoreFailed")}</span>
					) : null}
					{props.sample.atCap ? null : (
						<Button
							size="sm"
							loading={props.sample.loadingMore}
							onClick={props.sample.onLoadMore}
							data-testid="grid-load-more"
						>
							{t("grid.loadMore")}
						</Button>
					)}
				</div>
			) : null}

			{sheet}
			<Dialog
				open={saveOpen}
				onClose={() => setSaveOpen(false)}
				title={t("grid.saveViewTitle")}
				confirm={{
					label: t("common.save"),
					onConfirm: saveView,
					tone: "primary",
				}}
			>
				<Input
					label={t("grid.viewName")}
					value={viewName}
					maxLength={60}
					error={viewError}
					data-autofocus
					onChange={(e) => {
						setViewName(e.target.value);
						setViewError(undefined);
					}}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							saveView();
						}
					}}
				/>
			</Dialog>
			<Dialog
				open={deleteOpen}
				onClose={() => setDeleteOpen(false)}
				title={t("grid.deleteViewTitle")}
				description={t("grid.deleteViewBody", {
					name: currentView?.name ?? "",
				})}
				confirm={{ label: t("grid.deleteView"), onConfirm: removeView }}
			/>
		</div>
	);
}
