import { useEffect, useMemo, useState } from "react";
import { isApiError, isForbidden } from "../../api/index.ts";
import {
	Button,
	DataGrid,
	ForbiddenState,
	type GridColumn,
	type GridSample,
	Bdi,
	BidiText,
	Ltr,
	useCursorList,
	useI18n,
} from "../../ui/index.ts";
import {
	fetchConversion,
	fetchConversionsPage,
	fetchOrder,
	fetchOrdersPage,
} from "./api.ts";
import type { Conversion, Money, Order } from "./model.ts";
import { ReportPreview } from "./ReportPreview.tsx";
import {
	ContactLink,
	DetailState,
	useDetail,
	useReportFmt,
} from "./shared.tsx";

const convId = (c: Conversion) => c.id;
const orderId = (o: Order) => o.id;

function sampleOf<T>(l: ReturnType<typeof useCursorList<T>>): GridSample {
	return {
		loaded: l.items.length,
		hasMore: l.sample,
		loadingMore: l.loadingMore,
		atCap: l.atCap,
		failed: l.moreError !== null,
		onLoadMore: l.loadMore,
	};
}

/** The open row can disappear after a reload / recalculation: close the preview once the list has settled without it. */
function useClosedWhenGone(
	activeId: string | null,
	present: boolean,
	status: "loading" | "ready" | "error",
	close: (id: null) => void,
) {
	useEffect(() => {
		if (activeId !== null && !present && status === "ready") close(null);
	}, [activeId, present, status, close]);
}

export function ConversionsPanel({ resetKey }: { resetKey: string }) {
	const { t } = useI18n();
	const f = useReportFmt();
	const list = useCursorList<Conversion>(fetchConversionsPage, {
		getId: convId,
		resetKey,
	});
	const [activeId, setActiveId] = useState<string | null>(null);

	const columns = useMemo<ReadonlyArray<GridColumn<Conversion>>>(
		() => [
			{
				id: "type",
				header: t("rep.col.type"),
				value: (c) => f.label(c.conversion_type),
				sortable: true,
				hideable: false,
				cell: (c) => (
					<BidiText className="sy-rep__strong">{f.label(c.conversion_type)}</BidiText>
				),
			},
			{
				id: "value",
				header: t("rep.col.value"),
				value: (c) => Number(c.value_minor),
				searchable: false,
				sortable: true,
				cell: (c) => f.money(c.value_minor, c.currency),
			},
			{
				id: "currency",
				header: t("rep.col.currency"),
				value: (c) => c.currency,
				sortable: true,
				ltr: true,
			},
			{
				id: "occurred",
				header: t("rep.col.occurred"),
				value: (c) => c.occurred_at,
				searchable: false,
				sortable: true,
				cell: (c) => <Bdi>{f.utc(c.occurred_at)}</Bdi>,
			},
			{
				id: "contact",
				header: t("rep.col.contact"),
				value: () => "",
				searchable: false,
				cell: (c) => <ContactLink id={c.contact_id} />,
			},
			{
				id: "actions",
				header: t("rep.col.actions"),
				value: () => "",
				searchable: false,
				hideable: false,
				cell: (c) => (
					<Button
						size="sm"
						aria-label={t("rep.detail.openFor", {
							name: f.label(c.conversion_type),
						})}
						onClick={() => setActiveId(c.id)}
						data-testid="conversion-detail"
					>
						{t("rep.detail.open")}
					</Button>
				),
			},
		],
		[t, f],
	);

	const active = list.items.find((c) => c.id === activeId) ?? null;
	const ids = useMemo(() => list.items.map(convId), [list.items]);
	useClosedWhenGone(activeId, active !== null, list.status, setActiveId);

	return (
		<div className="sy-rep__main">
			{list.status === "error" && isForbidden(list.error) ? (
				<ForbiddenState />
			) : (
				<DataGrid<Conversion>
					gridId="report-conversions"
					label={t("rep.grid.conversions")}
					rows={list.items}
					columns={columns}
					getRowId={convId}
					status={list.status}
					onRetry={list.reload}
					requestId={isApiError(list.error) ? list.error.requestId : null}
					activeId={activeId}
					onActiveChange={setActiveId}
					revealId={activeId}
					sample={sampleOf(list)}
					emptyTitle={t("rep.empty")}
					emptyHint={t("rep.emptyHint")}
				/>
			)}
			{active ? (
				<ReportPreview
					label={t("rep.detail.credits")}
					heading={f.label(active.conversion_type)}
					activeId={activeId}
					ids={ids}
					partial={list.sample}
					onChange={setActiveId}
				>
					<ConversionDetailView conversion={active} resetKey={resetKey} />
				</ReportPreview>
			) : null}
		</div>
	);
}

function ConversionDetailView({
	conversion,
	resetKey,
}: {
	conversion: Conversion;
	resetKey: string;
}) {
	const { t } = useI18n();
	const f = useReportFmt();
	const state = useDetail(fetchConversion, conversion.id, resetKey);
	return (
		<DetailState state={state}>
			{(c) => (
				<div className="details" data-testid="detail-body">
					<p className="sy-rep__ptitle">
						{f.label(c.conversion_type)} · {f.money(c.value_minor, c.currency)}
					</p>
					<p className="sy-rep__muted">
						<Bdi>{f.utc(c.occurred_at)}</Bdi>
					</p>
					{c.credits.length === 0 ? (
						<p className="sy-rep__muted">{t("rep.meta.unpublished")}</p>
					) : (
						<ul className="sy-rep__list">
							{c.credits.map((cr) => (
								<li key={`${cr.model}|${cr.as_of}`}>
									{f.label(cr.model)} ·{" "}
									{cr.source === "unknown" ? t("rep.unknown") : cr.source} ·{" "}
									<Ltr>{cr.model_version}</Ltr> · <Ltr>{cr.lookback_days}</Ltr>{" "}
									· <Bdi>{f.utc(cr.as_of)}</Bdi>
								</li>
							))}
						</ul>
					)}
				</div>
			)}
		</DetailState>
	);
}

export function OrdersPanel({ resetKey }: { resetKey: string }) {
	const { t } = useI18n();
	const f = useReportFmt();
	const list = useCursorList<Order>(fetchOrdersPage, {
		getId: orderId,
		resetKey,
	});
	const [activeId, setActiveId] = useState<string | null>(null);

	const columns = useMemo<ReadonlyArray<GridColumn<Order>>>(
		() => [
			{
				id: "id",
				header: t("rep.col.id"),
				value: (o) => o.external_id,
				ltr: true,
				hideable: false,
			},
			{
				id: "source",
				header: t("rep.col.source"),
				value: (o) => o.source,
				sortable: true,
			},
			{
				id: "status",
				header: t("rep.col.status"),
				value: (o) => f.label(o.order_status),
				sortable: true,
			},
			{
				id: "net",
				header: t("rep.col.net"),
				value: (o) => Number(o.net_minor),
				searchable: false,
				sortable: true,
				cell: (o) => f.money(o.net_minor, o.currency),
			},
			{
				id: "currency",
				header: t("rep.col.currency"),
				value: (o) => o.currency,
				sortable: true,
				ltr: true,
			},
			{
				id: "placed",
				header: t("rep.col.placed"),
				value: (o) => o.placed_at,
				searchable: false,
				sortable: true,
				cell: (o) => <Bdi>{f.utc(o.placed_at)}</Bdi>,
			},
			{
				id: "contact",
				header: t("rep.col.contact"),
				value: () => "",
				searchable: false,
				cell: (o) => <ContactLink id={o.contact_id} />,
			},
			{
				id: "actions",
				header: t("rep.col.actions"),
				value: () => "",
				searchable: false,
				hideable: false,
				cell: (o) => (
					<Button
						size="sm"
						aria-label={t("rep.detail.openFor", { name: o.external_id })}
						onClick={() => setActiveId(o.id)}
						data-testid="order-detail"
					>
						{t("rep.detail.open")}
					</Button>
				),
			},
		],
		[t, f],
	);

	const active = list.items.find((o) => o.id === activeId) ?? null;
	const ids = useMemo(() => list.items.map(orderId), [list.items]);
	useClosedWhenGone(activeId, active !== null, list.status, setActiveId);

	return (
		<div className="sy-rep__main">
			{list.status === "error" && isForbidden(list.error) ? (
				<ForbiddenState />
			) : (
				<DataGrid<Order>
					gridId="report-orders"
					label={t("rep.grid.orders")}
					rows={list.items}
					columns={columns}
					getRowId={orderId}
					status={list.status}
					onRetry={list.reload}
					requestId={isApiError(list.error) ? list.error.requestId : null}
					activeId={activeId}
					onActiveChange={setActiveId}
					revealId={activeId}
					sample={sampleOf(list)}
					emptyTitle={t("rep.empty")}
					emptyHint={t("rep.emptyHint")}
				/>
			)}
			{active ? (
				<ReportPreview
					label={t("rep.tab.orders")}
					heading={active.external_id}
					activeId={activeId}
					ids={ids}
					partial={list.sample}
					onChange={setActiveId}
				>
					<OrderDetailView order={active} resetKey={resetKey} />
				</ReportPreview>
			) : null}
		</div>
	);
}

function MoneyList({ items }: { items: readonly Money[] }) {
	const { t } = useI18n();
	const f = useReportFmt();
	if (items.length === 0)
		return <p className="sy-rep__muted">{t("rep.detail.none")}</p>;
	return (
		<ul className="sy-rep__list">
			{items.map((m) => (
				<li key={m.id}>
					{f.money(m.amount_minor, m.currency)} ·{" "}
					<Bdi>{f.utc(m.occurred_at)}</Bdi>
				</li>
			))}
		</ul>
	);
}

function OrderDetailView({ order, resetKey }: { order: Order; resetKey: string }) {
	const { t } = useI18n();
	const f = useReportFmt();
	const state = useDetail(fetchOrder, order.id, resetKey);
	return (
		<DetailState state={state}>
			{(o) => (
				<div className="details" data-testid="detail-body">
					<p className="sy-rep__ptitle">
						<Ltr>{order.external_id}</Ltr>
					</p>
					<p className="sy-rep__muted">
						{order.source} · {f.label(order.order_status)} ·{" "}
						{f.money(order.net_minor, order.currency)}
					</p>
					<h3>{t("rep.detail.payments")}</h3>
					<MoneyList items={o.payment} />
					<h3>{t("rep.detail.refunds")}</h3>
					<MoneyList items={o.refund} />
					<h3>{t("rep.detail.fulfillment")}</h3>
					{o.fulfillment.length === 0 ? (
						<p className="sy-rep__muted">{t("rep.detail.none")}</p>
					) : (
						<ul className="sy-rep__list">
							{o.fulfillment.map((x) => (
								<li key={x.id}>
									{f.label(x.status)} · <Bdi>{f.utc(x.occurred_at)}</Bdi>
								</li>
							))}
						</ul>
					)}
				</div>
			)}
		</DetailState>
	);
}
