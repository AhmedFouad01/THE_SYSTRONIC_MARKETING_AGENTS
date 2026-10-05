import { describe, expect, it } from "vitest";
import { cappedCount, formatCapped } from "../capped.ts";
import type { CampaignReport } from "../reporting/model.ts";
import type { Task } from "../tasks/model.ts";
import {
	emphasis,
	followUps,
	isReportEmpty,
	isReportStale,
	nextWindowCount,
	nextWindowTasks,
	overdueCount,
	summarizeReport,
	topCampaigns,
} from "./model.ts";

const NOW = new Date("2026-10-05T12:00:00Z");
const HOUR = 3_600_000;
const task = (id: string, dueOffsetH: number | null, status: Task["status"] = "open"): Task => ({
	id,
	contact_id: "c1",
	deal_id: null,
	owner_id: "o1",
	title: `T ${id}`,
	due_at: dueOffsetH === null ? null : new Date(NOW.getTime() + dueOffsetH * HOUR).toISOString(),
	status,
	outcome: null,
	version: 1,
	completed_at: null,
});

const report = (over: Partial<CampaignReport> = {}): CampaignReport => ({
	model: "last_non_direct",
	version: "v1",
	lookback_days: 30,
	run_id: "run-1",
	as_of: "2026-10-05T10:00:00Z",
	rows: [],
	spend: [],
	...over,
});
const row = (campaign_id: string, value_minor: number, outcomes: number, currency = "EGP", conversion_type = "payment_captured") => ({
	campaign_id,
	campaign_name: campaign_id.toUpperCase(),
	source: "ads",
	currency,
	conversion_type,
	value_minor,
	outcomes,
});

describe("capped counts (W1/W2)", () => {
	it("is exact without a next page and a lower bound with one", () => {
		const fifty = Array.from({ length: 50 }, (_, i) => task(`t${i}`, -1));
		expect(overdueCount(fifty.slice(0, 3), false)).toEqual({ count: 3, capped: false });
		const c = overdueCount(fifty, true);
		expect(c).toEqual({ count: 50, capped: true });
		expect(formatCapped(c, String)).toBe("50+");
		expect(formatCapped(cappedCount(3, false), String)).toBe("3");
	});
	it("never exceeds what the server returned (zero is a valid, exact value)", () => {
		expect(overdueCount([], false)).toEqual({ count: 0, capped: false });
		expect(overdueCount([task("a", -2)], false).count).toBe(1);
	});
	it("next-24h drops the overdue rows the server also returns, and anything outside the window", () => {
		const rows = [
			task("past", -5),
			task("soon", 3),
			task("edge", 23.9),
			task("later", 24.5),
			task("none", null),
			task("done", 2, "completed"),
		];
		expect(nextWindowTasks(rows, NOW).map((t) => t.id)).toEqual(["soon", "edge"]);
		expect(nextWindowCount(rows, true, NOW)).toEqual({ count: 2, capped: true });
	});
});

describe("follow-ups (W5)", () => {
	it("lists the 5 earliest open tasks once each, oldest first", () => {
		const overdue = [task("o3", -1), task("o1", -30), task("o2", -10)];
		const next = [task("o3", -1), task("n1", 2), task("n2", 5), task("n3", 8)];
		const list = followUps(overdue, next, NOW);
		expect(list.map((t) => t.id)).toEqual(["o1", "o2", "o3", "n1", "n2"]);
	});
	it("is empty when nothing is due", () => {
		expect(followUps([], [task("x", 30)], NOW)).toEqual([]);
	});
});

describe("emphasis rules", () => {
	it("overdue is navy only when count > 0", () => {
		expect(emphasis({ overdue: 2, revenue: null, stale: false }).overdue).toBe("navy");
		expect(emphasis({ overdue: 0, revenue: null, stale: false }).overdue).toBe("neutral");
		expect(emphasis({ overdue: null, revenue: null, stale: false }).overdue).toBe("neutral");
	});
	it("revenue is magenta only when positive and the report is not stale", () => {
		expect(emphasis({ overdue: 0, revenue: 100n, stale: false }).revenue).toBe("magenta");
		expect(emphasis({ overdue: 0, revenue: 100n, stale: true }).revenue).toBe("neutral");
		expect(emphasis({ overdue: 0, revenue: 0n, stale: false }).revenue).toBe("neutral");
		expect(emphasis({ overdue: 0, revenue: -5n, stale: false }).revenue).toBe("neutral");
		expect(emphasis({ overdue: 0, revenue: null, stale: false }).revenue).toBe("neutral");
	});
	it("at most two filled cards for every combination, one when only one condition holds", () => {
		for (const overdue of [0, 4])
			for (const revenue of [0n, 50n])
				for (const stale of [true, false]) {
					const e = emphasis({ overdue, revenue, stale });
					const filled = Object.values(e).filter((t) => t !== "neutral").length;
					expect(filled).toBeLessThanOrEqual(2);
					expect(filled).toBe((overdue > 0 ? 1 : 0) + (revenue > 0n && !stale ? 1 : 0));
				}
	});
});

describe("stale and empty reports", () => {
	it("stale when there is no published run or no usable as-of", () => {
		expect(isReportStale(report())).toBe(false);
		expect(isReportStale(report({ run_id: null }))).toBe(true);
		expect(isReportStale(report({ as_of: null }))).toBe(true);
		expect(isReportStale(report({ as_of: "garbage" }))).toBe(true);
	});
	it("empty when there are no rows and no spend", () => {
		expect(isReportEmpty(report())).toBe(true);
		expect(isReportEmpty(report({ rows: [row("a", 1, 1)] }))).toBe(false);
	});
	it("a stale report never earns the revenue emphasis even with revenue", () => {
		const s = summarizeReport(report({ run_id: null, rows: [row("a", 900, 3)] }));
		expect(s.stale).toBe(true);
		expect(emphasis({ overdue: 0, revenue: s.kpis.revenue, stale: s.stale }).revenue).toBe("neutral");
	});
});

describe("marketing summary (W3/W6/W7)", () => {
	const mixed = report({
		rows: [
			row("a", 10_000, 4),
			row("b", 3_000, 1),
			row("a", -500, 1, "EGP", "refund_recorded"),
			row("z", 90, 1, "USD"),
		],
		spend: [{ campaign_id: "a", name: "A", currency: "EGP", spend_minor: 2_000, reporting_date: "2026-10-01", timezone: "UTC" }],
	});
	it("uses one primary currency, notes the others and never sums them", () => {
		const s = summarizeReport(mixed);
		expect(s.kpis.currency).toBe("EGP");
		expect(s.kpis.revenue).toBe(12_500n); // 10000 + 3000 - 500, USD excluded
		expect(s.others).toEqual(["USD"]);
		expect(s.top.every((a) => a.currency === "EGP")).toBe(true);
	});
	it("refunds are signed (negative value) with their count", () => {
		const s = summarizeReport(mixed);
		expect(s.refunds).toEqual({ value: -500n, count: 1 });
	});
	it("top campaigns are the highest revenue first, at most five", () => {
		const many = report({ rows: Array.from({ length: 8 }, (_, i) => row(`c${i}`, (i + 1) * 100, 1)) });
		const top = topCampaigns(many, "EGP");
		expect(top).toHaveLength(5);
		expect(top.map((a) => a.campaignId)).toEqual(["c7", "c6", "c5", "c4", "c3"]);
		expect(topCampaigns(many, null)).toEqual([]);
	});
	it("roas is undefined without spend", () => {
		expect(summarizeReport(report({ rows: [row("a", 100, 1)] })).kpis.roas).toBeNull();
		expect(summarizeReport(mixed).kpis.roas).toBe(12_500 / 2_000);
	});
});
