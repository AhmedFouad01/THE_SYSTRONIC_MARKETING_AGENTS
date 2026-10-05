import { useMemo, useState } from "react";
import { isApiError, isForbidden } from "../../api/index.ts";
import {
	Button,
	DataGrid,
	ForbiddenState,
	type GridColumn,
	type GridSample,
	Ltr,
	Panel,
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
import { ContactLink, DetailState, useDetail, useReportFmt } from "./shared.tsx";

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
				cell: (c) => <b>{f.label(c.conversion_type)}</b>,
			},
			{
				id: "value",
				header: t("rep.col.value"),
				value: (c) => Number(c.value_minor),
				searchable: false,
				sortable: true,
				cell: (c) => <Ltr>{f.minor(c.value_minor, null)}</Ltr>,
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
				cell: (c) => <Ltr>{f.utc(c.occurred_at)}</Ltr>,
			},
			{
				id: "contact",
				header: t("rep.col.contact"),
				value: () => "",
				searchable: false,
				cell: (c) => <ContactLink id={c.contact_id} />,
			},
			{
				id: "id",
				header: t("rep.col.id"),
				value: (c) => c.id,
				ltr: true,
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

	return (
		<div className="sy-rep__body">
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
						sample={sampleOf(list)}
						emptyTitle={t("rep.empty")}
						emptyHint={t("rep.emptyHint")}
					/>
				)}
			</div>
			<Panel
				as="aside"
				className="sy-rep__detail"
				title={t("rep.detail.credits")}
				data-testid="report-detail"
			>
				{activeId ? (
					<ConversionDetailView id={activeId} resetKey={resetKey} />
				) : (
					<p className="sy-rep__muted">{t("rep.detail.pick")}</p>
				)}
			</Panel>
		</div>
	);
}

function ConversionDetailView({
	id,
	resetKey,
}: {
	id: string;
	resetKey: string;
}) {
	const { t } = useI18n();
	const f = useReportFmt();
	const state = useDetail(fetchConversion, id, resetKey);
	return (
		<DetailState state={state}>
			{(c) => (
				<div className="details" data-testid="detail-body">
					<p>
						<b>{f.label(c.conversion_type)}</b> ·{" "}
						<Ltr>{f.minor(c.value_minor, c.currency)}</Ltr>
					</p>
					<p className="sy-rep__muted">
						<Ltr>{f.utc(c.occurred_at)}</Ltr>
					</p>
					{c.credits.length === 0 ? (
						<p className="sy-rep__muted">{t("rep.meta.unpublished")}</p>
					) : (
						<ul className="sy-rep__list">
							{c.credits.map((cr) => (
								<li key={`${cr.model}|${cr.as_of}`}>
									{f.label(cr.model)} ·{" "}
									{cr.source === "unknown" ? t("rep.unknown") : cr.source} ·{" "}
									<Ltr>
										{cr.model_version} · {cr.lookback_days} · {f.utc(cr.as_of)}
									</Ltr>
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
				value: (o) => o.id,
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
				cell: (o) => <Ltr>{f.minor(o.net_minor, null)}</Ltr>,
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
				cell: (o) => <Ltr>{f.utc(o.placed_at)}</Ltr>,
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

	return (
		<div className="sy-rep__body">
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
						sample={sampleOf(list)}
						emptyTitle={t("rep.empty")}
						emptyHint={t("rep.emptyHint")}
					/>
				)}
			</div>
			<Panel
				as="aside"
				className="sy-rep__detail"
				title={t("rep.tab.orders")}
				data-testid="report-detail"
			>
				{activeId ? (
					<OrderDetailView id={activeId} resetKey={resetKey} />
				) : (
					<p className="sy-rep__muted">{t("rep.detail.pick")}</p>
				)}
			</Panel>
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
					<Ltr>{f.minor(m.amount_minor, m.currency)}</Ltr> ·{" "}
					<Ltr>{f.utc(m.occurred_at)}</Ltr>
				</li>
			))}
		</ul>
	);
}

function OrderDetailView({
	id,
	resetKey,
}: {
	id: string;
	resetKey: string;
}) {
	const { t } = useI18n();
	const f = useReportFmt();
	const state = useDetail(fetchOrder, id, resetKey);
	return (
		<DetailState state={state}>
			{(o) => (
				<div className="details" data-testid="detail-body">
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
									{f.label(x.status)} · <Ltr>{f.utc(x.occurred_at)}</Ltr>
								</li>
							))}
						</ul>
					)}
				</div>
			)}
		</DetailState>
	);
}
