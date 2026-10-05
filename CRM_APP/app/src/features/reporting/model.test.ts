import { describe, expect, it } from "vitest";
import {
	aggregateCampaigns,
	type CampaignReport,
	deriveKpis,
	parseLookback,
	roasOf,
	unattributedAlert,
} from "./model.ts";

const report = (over: Partial<CampaignReport> = {}): CampaignReport => ({
	model: "last_non_direct",
	version: "deterministic-v1",
	lookback_days: 30,
	run_id: "r1",
	as_of: null,
	rows: [],
	spend: [],
	...over,
});
const row = (
	campaign_id: string,
	value_minor: string | number,
	outcomes: number,
	conversion_type = "payment_captured",
	currency = "EGP",
) => ({
	campaign_id,
	campaign_name: null,
	source: "ads",
	currency,
	conversion_type,
	value_minor,
	outcomes,
});

describe("parseLookback", () => {
	it("accepts integers 1..365 only", () => {
		expect(parseLookback("1")).toBe(1);
		expect(parseLookback(" 365 ")).toBe(365);
		for (const bad of ["0", "366", "", "1.5", "-3", "1e2", "abc", "0030x"])
			expect(parseLookback(bad)).toBeNull();
	});
});

describe("roasOf", () => {
	it("is null without positive spend", () => {
		expect(roasOf(100n, 0n)).toBeNull();
		expect(roasOf(100n, 50n)).toBe(2);
	});
});

describe("aggregateCampaigns / deriveKpis", () => {
	it("joins credits and spend per campaign, nets refunds, counts refunds apart", () => {
		const r = report({
			rows: [
				row("c1", "10000", 2),
				row("c1", "-2500", 1, "refund_recorded"),
				row("unknown", "5000", 2),
			],
			spend: [
				{
					campaign_id: "c1",
					name: "Spring",
					currency: "EGP",
					spend_minor: "5000",
					reporting_date: "2026-10-01",
					timezone: "UTC",
				},
			],
		});
		const aggs = aggregateCampaigns(r);
		const c1 = aggs.find((a) => a.campaignId === "c1");
		expect(c1?.revenue).toBe(7500n);
		expect(c1?.outcomes).toBe(2);
		expect(c1?.refunds).toBe(1);
		expect(c1?.name).toBe("Spring");
		expect(c1?.roas).toBe(1.5);
		const k = deriveKpis(r);
		expect(k.revenue).toBe(12500n);
		expect(k.spend).toBe(5000n);
		expect(k.conversions).toBe(4);
		expect(k.unattributedShare).toBe(0.5);
		expect(unattributedAlert(k)).toBe(true);
		expect(k.published).toBe(true);
	});
	it("empty report: no division, no alert, unpublished flag follows run_id", () => {
		const k = deriveKpis(report({ run_id: null }));
		expect(k.roas).toBeNull();
		expect(k.unattributedShare).toBeNull();
		expect(unattributedAlert(k)).toBe(false);
		expect(k.published).toBe(false);
		expect(k.currency).toBeNull();
	});
	it("mixed currencies: money KPIs cover the primary currency and say so", () => {
		const k = deriveKpis(
			report({
				rows: [row("a", "100", 1), row("b", "9000", 1, "payment_captured", "USD")],
			}),
		);
		expect(k.mixedCurrency).toBe(true);
		expect(k.currency).toBe("USD");
		expect(k.revenue).toBe(9000n);
	});
});
