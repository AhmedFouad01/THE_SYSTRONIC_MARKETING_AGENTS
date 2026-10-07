import { describe, expect, it } from "vitest";
import { ApiError } from "../../../api/errors.ts";
import { darkColors, lightColors } from "../../../ui/tokens/colors.ts";
import { varName } from "../../../ui/tokens/css.ts";
import { chartData, chartOptions, chartState, formatChartMoney, formatChartValue, isolateCanvas, plotValue, resolveChartTheme, scopeKey, type ChartModel } from "./model.ts";

const sample: ChartModel = {
	scope: "assigned", rowLabel: "Source", type: "bar", horizontal: true,
	columns: [{ key: "n", label: "Open", kind: "count" }, { key: "money", label: "Value", kind: "money", currency: "EGP", plot: false }],
	rows: [{ key: "one", label: "عميل ACME-1", values: { n: 3, money: "9007199254740993123" } }],
};
const themeFor = (mode: "light" | "dark") => {
	const values = new Map(Object.entries(mode === "light" ? lightColors : darkColors).map(([key, value]) => [varName(key), value]));
	values.set("--sy-font-data", "Arial");
	return resolveChartTheme((name) => values.get(name) ?? "");
};
const theme = themeFor("light");

describe("exact chart formatting", () => {
	it("retains every digit above safe integer precision", () => {
		expect(formatChartMoney("9007199254740993123", "EGP", "en")).toBe("EGP\u00a090,071,992,547,409,931.23");
		expect(formatChartMoney("-9007199254740993123", "EGP", "en")).toContain("-EGP\u00a090,071,992,547,409,931.23");
	});
	it("keeps negative sub-unit sign and respects zero/three-digit currency exponents", () => {
		expect(formatChartMoney("-1", "USD", "en")).toBe("-$0.01");
		expect(formatChartMoney("1234", "JPY", "en")).toContain("1,234");
		expect(formatChartMoney("1234", "KWD", "en")).toContain("1.234");
		expect(formatChartMoney("0", "EGP", "en")).toContain("0.00");
	});
	it("localizes Arabic digits without changing exact money or count", () => {
		expect(formatChartMoney("9007199254740993123", "EGP", "ar")).toContain("٩٠٬٠٧١٬٩٩٢٬٥٤٧٬٤٠٩٬٩٣١٫٢٣");
		expect(formatChartMoney("9007199254740993123", "EGP", "ar")).not.toMatch(/[0-9]/);
		expect(formatChartValue(1234, sample.columns[0], "ar")).toBe("١٬٢٣٤");
	});
	it("does not coerce unsafe minor amounts into chart numbers", () => {
		expect(plotValue("9007199254740993123", sample.columns[1])).toBeNull();
		expect(plotValue("-9007199254740993123", sample.columns[1])).toBeNull();
		expect(plotValue("1234", sample.columns[1])).toBe(12.34);
	});
});
describe("independent chart state adapter", () => {
	const adapt = () => sample;
	it("retains tenant/assigned response scope", () => {
		expect(chartState({ status: "ready", data: null }, adapt)).toEqual({ status: "ready", model: sample });
		expect(scopeKey("assigned")).toBe("charts.mine");
		expect(scopeKey("tenant")).toBe("charts.tenant");
	});
	it("zero data is empty while its real rows remain available to the table", () => {
		const zero = { ...sample, rows: [{ ...sample.rows[0], values: { n: 0, money: "0" } }] };
		expect(chartState({ status: "ready", data: zero }, (data) => data)).toEqual({ status: "empty", model: zero });
		expect(chartState({ status: "ready", data: null }, () => ({ ...sample, rows: [] })).status).toBe("empty");
	});
	it("maps loading/403/error independently without leaking arbitrary error messages", () => {
		expect(chartState({ status: "loading" }, adapt)).toEqual({ status: "loading" });
		const error = new ApiError({ status: 403, code: "FORBIDDEN", safeMessage: "denied", requestId: "r1", retryable: false });
		expect(chartState({ status: "error", error }, adapt)).toEqual({ status: "forbidden" });
		expect(chartState({ status: "error", error: new Error("private") }, adapt)).toEqual({ status: "error", requestId: null });
	});
});
describe("theme, direction and shared canvas/table payload", () => {
	it("resolves semantic tokens in both themes", () => {
		for (const mode of ["light", "dark"] as const) {
			const colors = mode === "light" ? lightColors : darkColors;
			const resolved = themeFor(mode);
			expect(resolved.text).toBe(colors.text);
			expect(resolved.surface).toBe(colors.surface);
			expect(resolved.success).toBe(colors.successFg);
			expect(resolved.palette).toHaveLength(8);
			expect(chartData(sample, resolved).datasets[0].backgroundColor).toBe(colors.chart1);
		}
	});
	it("RTL only reverses the horizontal numeric axis; chronological columns stay ordered", () => {
		const ar = chartOptions(sample, "ar", false, theme);
		expect(ar.plugins?.legend).toMatchObject({ rtl: true, textDirection: "rtl" });
		expect(ar.plugins?.tooltip).toMatchObject({ rtl: true, textDirection: "rtl" });
		expect(ar.scales?.x).toMatchObject({ reverse: true });
		const chronological = chartOptions({ ...sample, horizontal: false }, "ar", false, theme);
		expect(chronological.scales?.x).toMatchObject({ reverse: false });
		const en = chartOptions(sample, "en", false, theme);
		expect(en.plugins?.legend).toMatchObject({ rtl: false, textDirection: "ltr" });
		expect(en.plugins?.tooltip).toMatchObject({ rtl: false, textDirection: "ltr" });
		expect(en.scales?.x).toMatchObject({ reverse: false });
	});
	it("reduced motion disables animation, normal preference enables it", () => {
		expect(chartOptions(sample, "ar", true, theme).animation).toBe(false);
		expect(chartOptions(sample, "en", false, theme).animation).toMatchObject({ duration: 250 });
	});
	it("uses identical rows for datasets; keeps unknown/mixed labels isolated", () => {
		const data = chartData(sample, theme);
		expect(data.labels).toEqual(sample.rows.map((row) => isolateCanvas(row.label)));
		expect(data.datasets[0].data).toEqual(sample.rows.map((row) => row.values.n));
		expect(data.datasets).toHaveLength(1);
	});
	it("separates money scale and distinguishes five line series by markers and dashes", () => {
		const model: ChartModel = { ...sample, horizontal: false, type: "line", columns: Array.from({ length: 5 }, (_, i) => ({ key: String(i), label: String(i), kind: "count" })), rows: [] };
		const datasets = chartData(model, theme).datasets;
		expect(new Set(datasets.map((s) => s.pointStyle)).size).toBe(5);
		expect(new Set(datasets.map((s) => JSON.stringify("borderDash" in s ? s.borderDash : undefined))).size).toBe(5);
		const money = { ...sample, horizontal: false, columns: sample.columns.map((col) => ({ ...col, plot: true })) };
		expect(chartOptions(money, "en", false, theme).scales?.money).toMatchObject({ type: "linear", position: "right" });
		expect(chartData(money, theme).datasets[1].data).toEqual([null]);
	});
});
