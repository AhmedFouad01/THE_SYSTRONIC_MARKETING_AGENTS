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
import { useI18n } from "../i18n/index.ts";
import { Icon } from "../icons/index.ts";
import { Dialog } from "../overlays/Dialog.tsx";
import { rovingIndex } from "../overlays/nav.ts";
import { Popover } from "../overlays/Popover.tsx";
import { Button } from "../primitives/Button.tsx";
import { Input, Select } from "../primitives/Field.tsx";
import { EmptyState, ErrorState, LoadingState } from "../primitives/States.tsx";
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
	setEqFilter,
	type ViewState,
	visibleColumns,
} from "./gridModel.ts";
import type { SavedView, SavedViewsStore } from "./savedViews.ts";
import "./datagrid.css";

export type GridColumn<T> = ModelColumn<T> & {
	header: string;
	cell?: (row: T) => ReactNode;
	sortable?: boolean;
	/** Bidi-sensitive values (ids, emails, phones, money): rendered LTR-isolated. */
	ltr?: boolean;
	/** Adds an equality filter control for this column. */
	filter?: { options: ReadonlyArray<{ value: string; label: string }> };
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
	emptyTitle?: string;
	emptyHint?: string;
	toolbarExtra?: ReactNode;
};

const interactive = "input,button,a,select,label,textarea";

export function DataGrid<T>(props: DataGridProps<T>) {
	const { rows, columns, getRowId, selectable = false, views } = props;
	const { t, tx, locale, formatNumber } = useI18n();
	const [state, dispatch] = useReducer(gridReducer, props.initialView ?? DEFAULT_VIEW, initialGridState);
	const getIdRef = useRef(getRowId);
	const selectionCb = useRef(props.onSelectionChange);
	const activeCb = useRef(props.onActiveChange);
	useEffect(() => {
		getIdRef.current = getRowId;
		selectionCb.current = props.onSelectionChange;
		activeCb.current = props.onActiveChange;
	});

	const cols = useMemo(() => visibleColumns(columns, state.hidden), [columns, state.hidden]);
	const { matching, pageRows, pageInfo } = useMemo(
		() => computeView(rows, columns, state, locale),
		[rows, columns, state, locale],
	);
	const pageIds = useMemo(() => pageRows.map((r) => getIdRef.current(r)), [pageRows]);
	const activeId = props.activeId !== undefined ? props.activeId : state.activeId;

	// Reloads can remove rows: drop selection/active ids that are no longer loaded.
	useEffect(() => {
		dispatch({ type: "prune", validIds: rows.map((r) => getIdRef.current(r)) });
	}, [rows]);
	useEffect(() => {
		selectionCb.current?.(state.selection);
	}, [state.selection]);

	const open = (id: string) => {
		dispatch({ type: "open", id });
		activeCb.current?.(id);
	};

	// ---- keyboard: roving row focus ----
	const rowRefs = useRef<Array<HTMLTableRowElement | null>>([]);
	const [focusIdx, setFocusIdx] = useState(0);
	const tabIdx = Math.min(focusIdx, Math.max(0, pageRows.length - 1));
	const onRowKey = (e: KeyboardEvent<HTMLTableRowElement>, i: number, id: string) => {
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
			setViewError(res.reason === "name" ? t("grid.viewNameRequired") : t("grid.viewSaveFailed"));
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
	const optionLabel = (c: GridColumn<T>, v: string) => c.filter?.options.find((o) => o.value === v)?.label ?? v;
	const filtersActive = state.filters.length > 0 || state.query.trim() !== "";

	const toggleSort = useCallback((id: string, additive: boolean) => dispatch({ type: "sort", key: id, additive }), []);
	const selectedIds = [...state.selection];
	const clearSelection = () => dispatch({ type: "clearSelection" });

	const body = (() => {
		if (props.status === "loading" && rows.length === 0) return <LoadingState />;
		if (props.status === "error") return <ErrorState requestId={props.requestId ?? null} {...(props.onRetry ? { onRetry: props.onRetry } : {})} />;
		if (matching.length === 0)
			return filtersActive || rows.length > 0 ? (
				<EmptyState
					title={t("state.noResults")}
					hint={t("state.noResultsHint")}
					action={
						<Button size="sm" onClick={() => dispatch({ type: "clearFilters" })}>
							{t("common.clearFilters")}
						</Button>
					}
				/>
			) : (
				<EmptyState {...(props.emptyTitle ? { title: props.emptyTitle } : {})} {...(props.emptyHint ? { hint: props.emptyHint } : {})} />
			);
		return (
			// biome-ignore lint/a11y/noNoninteractiveTabindex: scrollable region must be keyboard reachable
			<section className="sy-grid__scroll" aria-label={props.label} tabIndex={0}>
				<table className="sy-grid__table" data-density={state.density} data-testid="grid-table">
					<caption className="sy-grid__sr">{props.label}</caption>
					<thead>
						<tr>
							{selectable ? (
								<th scope="col" className="sy-grid__check">
									<input
										ref={allRef}
										type="checkbox"
										aria-label={t("grid.selectAll")}
										checked={pageSel === "all"}
										onChange={() => dispatch({ type: "togglePage", pageIds })}
										data-testid="grid-select-all"
									/>
								</th>
							) : null}
							{cols.map((c) => {
								const dir = ariaSortOf(state.sorts, c.id);
								return (
									<th key={c.id} scope="col" aria-sort={c.sortable ? dir : undefined}>
										{c.sortable ? (
											<button
												type="button"
												className="sy-grid__sort"
												aria-label={t("grid.sortBy", { column: c.header })}
												onClick={(e) => toggleSort(c.id, e.shiftKey)}
												data-testid={`sort-${c.id}`}
											>
												<span>{c.header}</span>
												<span aria-hidden="true" className="sy-grid__sortmark">
													{dir === "ascending" ? "▲" : dir === "descending" ? "▼" : "↕"}
												</span>
											</button>
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
											<input
												type="checkbox"
												aria-label={t("grid.selectRow", { name: String(cols[0]?.value(row) ?? id) })}
												checked={checked}
												onChange={() => dispatch({ type: "toggleRow", id })}
											/>
										</td>
									) : null}
									{cols.map((c) => (
										<td key={c.id} className={c.ltr ? "sy-ltr" : undefined}>
											{c.cell ? c.cell(row) : (c.value(row) ?? "")}
										</td>
									))}
								</tr>
							);
						})}
					</tbody>
				</table>
			</section>
		);
	})();

	return (
		<div className="sy-grid" data-testid="data-grid">
			<search className="sy-grid__toolbar">
				<div className="sy-grid__searchbox">
					<Icon name="search" size={16} />
					<input
						type="search"
						className="sy-grid__search"
						aria-label={t("grid.search")}
						placeholder={t("grid.searchPlaceholder")}
						value={state.query}
						onChange={(e) => dispatch({ type: "query", query: e.target.value })}
						data-testid="grid-search"
					/>
				</div>
				{views ? (
					<fieldset className="sy-grid__views">
<legend className="sy-grid__sr">{t("grid.views")}</legend>
						<button
							type="button"
							className="sy-grid__chip"
							aria-pressed={viewId === null}
							onClick={() => {
								setViewId(null);
								dispatch({ type: "applyView", view: props.initialView ?? DEFAULT_VIEW });
							}}
						>
							{t("common.all")}
						</button>
						{saved.map((v) => (
							<button
								key={v.id}
								type="button"
								className="sy-grid__chip"
								aria-pressed={v.id === viewId}
								onClick={() => {
									setViewId(v.id);
									dispatch({ type: "applyView", view: v.state });
								}}
							>
								{v.name}
							</button>
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
							<Button size="sm" variant="ghost" icon="delete" onClick={() => setDeleteOpen(true)}>
								{t("grid.deleteView")}
							</Button>
						) : null}
					</fieldset>
				) : null}
				<div className="sy-grid__tools">
					{filterCols.length > 0 ? (
						<Button
							size="sm"
							icon="filter"
							aria-expanded={filtersOpen}
							onClick={() => setFiltersOpen((v) => !v)}
							data-testid="grid-filters"
						>
							{state.filters.length > 0
								? tx("grid.filtersCount", { count: formatNumber(state.filters.length) })
								: t("common.filters")}
						</Button>
					) : null}
					<Popover
						label={t("grid.chooseColumns")}
						triggerLabel={tx("grid.columnsCount", { count: formatNumber(cols.length) })}
						testId="grid-columns"
					>
						<b className="sy-grid__poptitle">{t("grid.visibleColumns")}</b>
						{columns.map((c) => (
							<label key={c.id} className="sy-grid__colopt">
								<input
									type="checkbox"
									checked={c.hideable === false || !state.hidden.includes(c.id)}
									disabled={c.hideable === false}
									onChange={() => dispatch({ type: "toggleColumn", id: c.id })}
								/>
								<span>{c.header}</span>
							</label>
						))}
					</Popover>
					<Button
						size="sm"
						aria-pressed={state.density === "compact"}
						onClick={() => dispatch({ type: "density", density: state.density === "compact" ? "comfortable" : "compact" })}
						data-testid="grid-density"
					>
						{state.density === "compact" ? t("grid.densityComfortable") : t("grid.densityCompact")}
					</Button>
					{props.toolbarExtra}
				</div>
				<p className="sy-grid__count" role="status" data-testid="grid-count">
					{tx("format.matching", { count: formatNumber(matching.length) })}
				</p>
			</search>

			{filtersOpen && filterCols.length > 0 ? (
				<div className="sy-grid__filters">
					{filterCols.map((c) => (
						<Select
							key={c.id}
							label={c.header}
							value={eqValue(c.id)}
							onChange={(e) =>
								dispatch({ type: "filters", filters: setEqFilter(state.filters, c.id, e.target.value === "" ? null : e.target.value) })
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
					<Button size="sm" onClick={() => dispatch({ type: "clearFilters" })} disabled={!filtersActive}>
						{t("common.clearFilters")}
					</Button>
				</div>
			) : null}
			{state.filters.length > 0 ? (
				<ul className="sy-grid__chips" aria-label={t("common.filters")}>
					{state.filters.flatMap((f) => {
						const c = columns.find((x) => x.id === f.key);
						if (!c || f.op !== "eq") return [];
						const text = `${c.header}: ${optionLabel(c, String(f.value))}`;
						return [
							<li key={f.key}>
								<span className="sy-grid__chip sy-grid__chip--static">
									{text}
									<button
										type="button"
										className="sy-grid__chipx"
										aria-label={t("grid.removeFilter", { name: text })}
										onClick={() => dispatch({ type: "filters", filters: setEqFilter(state.filters, f.key, null) })}
									>
										<Icon name="close" size={12} />
									</button>
								</span>
							</li>,
						];
					})}
				</ul>
			) : null}

			{selectable && state.selection.size > 0 ? (
				<section className="sy-grid__batch" aria-label={t("format.selectedCount", { count: formatNumber(state.selection.size) })} data-testid="grid-batch">
					<span>{tx("format.selectedCount", { count: formatNumber(state.selection.size) })}</span>
					{props.batchActions?.(selectedIds, clearSelection)}
					<Button size="sm" variant="ghost" onClick={clearSelection}>
						{t("common.clearSelection")}
					</Button>
				</section>
			) : null}

			{body}

			{props.status === "ready" && matching.length > 0 ? (
				<div className="sy-grid__footer">
					<Select
						label={t("common.rowsPerPage")}
						value={String(state.pageSize)}
						onChange={(e) => dispatch({ type: "pageSize", size: Number(e.target.value) })}
						className="sy-grid__size"
					>
						{PAGE_SIZES.map((n) => (
							<option key={n} value={n}>
								{formatNumber(n)}
							</option>
						))}
					</Select>
					<span className="sy-grid__range" data-testid="grid-range">
						{tx("grid.range", {
							from: formatNumber(pageInfo.start + 1),
							to: formatNumber(pageInfo.end),
							total: formatNumber(pageInfo.total),
						})}
					</span>
					<div className="sy-grid__pager">
						<Button
							size="sm"
							disabled={pageInfo.page <= 1}
							onClick={() => dispatch({ type: "page", page: pageInfo.page - 1 })}
							data-testid="grid-prev"
						>
							{t("common.previousPage")}
						</Button>
						<span>{tx("grid.page", { page: formatNumber(pageInfo.page), count: formatNumber(pageInfo.pageCount) })}</span>
						<Button
							size="sm"
							disabled={pageInfo.page >= pageInfo.pageCount}
							onClick={() => dispatch({ type: "page", page: pageInfo.page + 1 })}
							data-testid="grid-next"
						>
							{t("common.nextPage")}
						</Button>
					</div>
				</div>
			) : null}

			{props.sample?.hasMore ? (
				<div className="sy-grid__sample" role="status" data-testid="grid-sample">
					<Icon name="info" size={16} />
					<span>
						{props.sample.atCap
							? tx("grid.sampleCap", { count: formatNumber(props.sample.loaded) })
							: tx("grid.sample", { count: formatNumber(props.sample.loaded) })}
					</span>
					{props.sample.failed ? <span role="alert">{t("grid.loadMoreFailed")}</span> : null}
					{props.sample.atCap ? null : (
						<Button size="sm" loading={props.sample.loadingMore} onClick={props.sample.onLoadMore} data-testid="grid-load-more">
							{t("grid.loadMore")}
						</Button>
					)}
				</div>
			) : null}

			<Dialog
				open={saveOpen}
				onClose={() => setSaveOpen(false)}
				title={t("grid.saveViewTitle")}
				confirm={{ label: t("common.save"), onConfirm: saveView, tone: "primary" }}
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
				description={t("grid.deleteViewBody", { name: currentView?.name ?? "" })}
				confirm={{ label: t("grid.deleteView"), onConfirm: removeView }}
			/>
		</div>
	);
}
