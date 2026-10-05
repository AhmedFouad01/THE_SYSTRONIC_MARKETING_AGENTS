import { apiClient } from "../../api/index.ts";
import type { FetchPage } from "../../ui/data-grid/index.ts";
import type {
	AttributionModel,
	CampaignReport,
	Conversion,
	ConversionDetail,
	JourneyEvent,
	Order,
	OrderDetail,
} from "./model.ts";

export const fetchCampaignReport = async (
	model: AttributionModel,
	signal?: AbortSignal,
): Promise<CampaignReport> =>
	(
		await apiClient.get<CampaignReport>("reports/campaign-performance", {
			query: { model },
			...(signal ? { signal } : {}),
		})
	).data;

export const fetchConversionsPage: FetchPage<Conversion> = async ({
	cursor,
	signal,
}) => {
	const r = await apiClient.get<Conversion[]>("conversions", {
		query: { cursor: cursor ?? undefined },
		signal,
	});
	return { items: r.data, nextCursor: r.nextCursor };
};

export const fetchOrdersPage: FetchPage<Order> = async ({ cursor, signal }) => {
	const r = await apiClient.get<Order[]>("journey/orders", {
		query: { cursor: cursor ?? undefined },
		signal,
	});
	return { items: r.data, nextCursor: r.nextCursor };
};

export const fetchConversion = async (
	id: string,
	signal?: AbortSignal,
): Promise<ConversionDetail> =>
	(
		await apiClient.get<ConversionDetail>(`conversions/${id}`, {
			...(signal ? { signal } : {}),
		})
	).data;

export const fetchOrder = async (
	id: string,
	signal?: AbortSignal,
): Promise<OrderDetail> =>
	(
		await apiClient.get<OrderDetail>(`journey/orders/${id}`, {
			...(signal ? { signal } : {}),
		})
	).data;

export const fetchJourneyPage =
	(contactId: string): FetchPage<JourneyEvent> =>
	async ({ cursor, signal }) => {
		const r = await apiClient.get<JourneyEvent[]>(
			`contacts/${contactId}/journey`,
			{ query: { cursor: cursor ?? undefined }, signal },
		);
		return { items: r.data, nextCursor: r.nextCursor };
	};

/** POST /v1/journey/calculate (report.calculate + conversion.normalize). Key is stable per dialog open (retry = replay). */
export const calculateAttribution = async (
	lookbackDays: number,
	idempotencyKey: string,
): Promise<unknown> =>
	(
		await apiClient.post<unknown>(
			"journey/calculate",
			{ lookback_days: lookbackDays },
			{ idempotencyKey },
		)
	).data;
