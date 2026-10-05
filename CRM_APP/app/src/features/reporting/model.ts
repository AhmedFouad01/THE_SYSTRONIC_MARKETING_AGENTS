import { formatNumber, formatPercent } from "../../ui/i18n/format.ts";
import type { Locale } from "../../ui/tokens/scales.ts";

// Reporting model: API shapes and pure derivation (KPIs, per-campaign aggregation, validation).
// Contract: M2_CONTRACTS.md. Money is integer minor units (bigint comes back as a string from the API).

export type AttributionModel = "first_touch" | "last_non_direct";
export const MODELS: readonly AttributionModel[] = [
	"first_touch",
	"last_non_direct",
];
export const DEFAULT_MODEL: AttributionModel = "last_non_direct";

export const UNKNOWN_CAMPAIGN = "unknown";
export const REFUND_TYPE = "refund_recorded";

export type CampaignRow = {
	campaign_id: string;
	campaign_name: string | null;
	source: string;
	currency: string;
	conversion_type: string;
	value_minor: string | number;
	outcomes: number;
};

export type SpendRow = {
	campaign_id: string;
	name: string;
	source?: string;
	currency: string;
	spend_minor: string | number;
	reporting_date: string;
	timezone: string;
};

export type CampaignReport = {
	model: AttributionModel;
	version: string;
	lookback_days: number;
	run_id: string | null;
	as_of: string | null;
	rows: CampaignRow[];
	spend: SpendRow[];
};

export type Conversion = {
	id: string;
	conversion_type: string;
	contact_id: string | null;
	order_id: string | null;
	deal_id: string | null;
	occurred_at: string;
	value_minor: string | number;
	currency: string;
};

export type Credit = {
	model: string;
	source: string;
	model_version: string;
	lookback_days: number;
	as_of: string;
};
export type ConversionDetail = Conversion & { credits: Credit[] };

export type Order = {
	id: string;
	source: string;
	external_id: string;
	contact_id: string | null;
	order_status: string;
	placed_at: string;
	currency: string;
	net_minor: string | number;
};
export type Money = {
	id: string;
	amount_minor: string | number;
	currency: string;
	occurred_at: string;
};
export type Fulfillment = { id: string; status: string; occurred_at: string };
export type OrderDetail = Order & {
	payment: Money[];
	refund: Money[];
	fulfillment: Fulfillment[];
};

export type JourneyEvent = {
	id: string;
	name: string;
	occurred_at: string;
	received_at: string;
	source: string | null;
};

// ---- minor-unit arithmetic ------------------------------------------------------------------------------

export function toBig(v: string | number | null | undefined): bigint {
	if (v === null || v === undefined || v === "") return 0n;
	try {
		return BigInt(typeof v === "number" ? Math.trunc(v) : v);
	} catch {
		return 0n;
	}
}

/** Display number for a minor-unit amount (lossless below 2^53; reporting totals are bounded evidence sets). */
export const minorToNumber = (v: bigint): number => Number(v);

/** ROAS as a plain ratio (revenue / spend). Null when spend is not positive. */
export function roasOf(revenue: bigint, spend: bigint): number | null {
	if (spend <= 0n) return null;
	return Number(revenue) / Number(spend);
}

// ---- per-campaign aggregation -----------------------------------------------------------------------------

export type CampaignAgg = {
	key: string;
	campaignId: string;
	name: string | null;
	currency: string;
	sources: string[];
	outcomes: number;
	refunds: number;
	/** Net attributed value (refund credits are negative). */
	revenue: bigint;
	spend: bigint;
	hasSpend: boolean;
	roas: number | null;
	rows: CampaignRow[];
	spendRows: SpendRow[];
};

export const isUnknownCampaign = (id: string): boolean =>
	id === UNKNOWN_CAMPAIGN;

/** One aggregate per (campaign, currency): credits and spend facts are joined on campaign id. */
export function aggregateCampaigns(report: CampaignReport): CampaignAgg[] {
	const map = new Map<string, CampaignAgg>();
	const get = (
		campaignId: string,
		currency: string,
		name: string | null,
	): CampaignAgg => {
		const key = `${campaignId}|${currency}`;
		let agg = map.get(key);
		if (!agg) {
			agg = {
				key,
				campaignId,
				name,
				currency,
				sources: [],
				outcomes: 0,
				refunds: 0,
				revenue: 0n,
				spend: 0n,
				hasSpend: false,
				roas: null,
				rows: [],
				spendRows: [],
			};
			map.set(key, agg);
		}
		if (agg.name === null && name) agg.name = name;
		return agg;
	};
	for (const r of report.rows) {
		const a = get(r.campaign_id, r.currency, r.campaign_name);
		a.rows.push(r);
		if (!a.sources.includes(r.source)) a.sources.push(r.source);
		a.revenue += toBig(r.value_minor);
		if (r.conversion_type === REFUND_TYPE) a.refunds += r.outcomes;
		else a.outcomes += r.outcomes;
	}
	for (const s of report.spend) {
		const a = get(s.campaign_id, s.currency, s.name);
		a.spendRows.push(s);
		a.spend += toBig(s.spend_minor);
		a.hasSpend = true;
		if (s.source && !a.sources.includes(s.source)) a.sources.push(s.source);
	}
	const out = [...map.values()];
	for (const a of out) a.roas = roasOf(a.revenue, a.spend);
	return out.sort(
		(x, y) => Number(y.revenue - x.revenue) || x.key.localeCompare(y.key),
	);
}

// ---- KPIs ---------------------------------------------------------------------------------------------------

export type Kpis = {
	/** Currency the money KPIs are computed in (null when the report is empty). */
	currency: string | null;
	/** More than one currency present: money KPIs cover the primary currency only. */
	mixedCurrency: boolean;
	spend: bigint;
	revenue: bigint;
	roas: number | null;
	/** Attributed outcomes excluding refunds (all currencies). */
	conversions: number;
	refunds: number;
	/** Outcomes with no known campaign, as a 0..1 share of conversions; null when there are none. */
	unattributedShare: number | null;
	published: boolean;
};

/** Headline numbers for the decision-first header. Pure; derived only from the campaign-performance payload. */
export function deriveKpis(report: CampaignReport): Kpis {
	const aggs = aggregateCampaigns(report);
	const byCurrency = new Map<string, { revenue: bigint; spend: bigint }>();
	for (const a of aggs) {
		const c = byCurrency.get(a.currency) ?? { revenue: 0n, spend: 0n };
		c.revenue += a.revenue;
		c.spend += a.spend;
		byCurrency.set(a.currency, c);
	}
	let primary: string | null = null;
	let weight = -1n;
	for (const [cur, v] of [...byCurrency.entries()].sort((a, b) =>
		a[0].localeCompare(b[0]),
	)) {
		const w = (v.revenue < 0n ? -v.revenue : v.revenue) + v.spend;
		if (w > weight) {
			weight = w;
			primary = cur;
		}
	}
	const totals = (primary && byCurrency.get(primary)) || {
		revenue: 0n,
		spend: 0n,
	};
	let conversions = 0;
	let refunds = 0;
	let unknown = 0;
	for (const a of aggs) {
		conversions += a.outcomes;
		refunds += a.refunds;
		if (isUnknownCampaign(a.campaignId)) unknown += a.outcomes;
	}
	return {
		currency: primary,
		mixedCurrency: byCurrency.size > 1,
		spend: totals.spend,
		revenue: totals.revenue,
		roas: roasOf(totals.revenue, totals.spend),
		conversions,
		refunds,
		unattributedShare: conversions > 0 ? unknown / conversions : null,
		published: report.run_id !== null,
	};
}

/** Magenta marks "needs attention": most outcomes carry no campaign. Neutral otherwise (max 1-2 emphasized cards). */
export const UNATTRIBUTED_ALERT = 0.5;
export function unattributedAlert(k: Kpis): boolean {
	return k.unattributedShare !== null && k.unattributedShare >= UNATTRIBUTED_ALERT;
}

// ---- lookback validation (POST /v1/journey/calculate: integer 1..365) ---------------------------------------------

export const LOOKBACK_MIN = 1;
export const LOOKBACK_MAX = 365;
export const LOOKBACK_DEFAULT = 30;

/** Integer 1..365 or null. Accepts only plain digit strings. */
export function parseLookback(raw: string): number | null {
	const s = raw.trim();
	if (!/^\d{1,3}$/.test(s)) return null;
	const n = Number(s);
	return n >= LOOKBACK_MIN && n <= LOOKBACK_MAX ? n : null;
}

// ---- misc helpers ---------------------------------------------------------------------------------------------

/** `?select=` hand-off to the contact screen (route is /contacts). */
export const contactSearch = (id: string): string =>
	`?select=${encodeURIComponent(id)}`;

export const UTC_DATETIME: Intl.DateTimeFormatOptions = {
	day: "numeric",
	month: "short",
	year: "numeric",
	hour: "numeric",
	minute: "2-digit",
	timeZone: "UTC",
};

export const sortChronological = <T extends { occurred_at: string }>(
	items: readonly T[],
): T[] =>
	[...items].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));

// ---- formatting (pure; locale-aware through ui/i18n/format) -----------------------------------------------------

/** `<grouped number> <ISO code>` of a minor-unit amount. The label says "minor units"; no exponent is assumed. */
export function formatMinor(
	value: string | number | bigint,
	currency: string | null | undefined,
	locale: Locale,
): string {
	const big = typeof value === "bigint" ? value : toBig(value);
	const num = formatNumber(minorToNumber(big), locale);
	return currency ? `${num} ${currency}` : num;
}

/** "2.50x" style ratio; em dash when undefined (no spend). */
export function formatRoas(roas: number | null, locale: Locale): string {
	if (roas === null || !Number.isFinite(roas)) return "—";
	return `${formatNumber(roas, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}×`;
}

export function formatShare(fraction: number | null, locale: Locale): string {
	if (fraction === null) return "—";
	return formatPercent(fraction, locale, { maximumFractionDigits: 0 });
}
