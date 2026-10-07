import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Chart as ChartJS } from "chart.js";
import { I18nProvider, ThemeProvider } from "../../../ui/index.ts";
import { ChartCanvas, ChartSurface } from "./ChartSurface.tsx";
import type { ChartModel, ChartState } from "./model.ts";
import { chartData, resolveChartTheme } from "./model.ts";

const model: ChartModel = {
	scope: "assigned", rowLabel: "الفئة", columns: [{ key: "count", label: "العدد", kind: "count" }, { key: "amount", label: "القيمة", kind: "money", currency: "EGP", plot: false }],
	rows: [{ key: "one", label: "ACME عميل 12", values: { count: 12, amount: "9007199254740993123" } }],
	from: "2026-09-26", to: "2026-10-03", tz: "Africa/Cairo", asOf: "2026-10-02T00:00:00Z",
};
const wrap = (state: ChartState, locale: "ar" | "en" = "ar") => {
	vi.stubGlobal("window", { localStorage: { getItem: (key: string) => key === "sy.locale" ? locale : "light" } });
	return renderToStaticMarkup(<I18nProvider><ThemeProvider><ChartSurface title="البيانات" state={state} onRetry={() => undefined} /></ThemeProvider></I18nProvider>);
};
afterEach(() => vi.unstubAllGlobals());
describe("chart surface semantic output (unit SSR)", () => {
	it("provides caption, headers, keyboard table disclosure and bidi-isolated exact cells", () => {
		const html = wrap({ status: "ready", model });
		expect(html).toContain("<caption>");
		expect(html).toContain('scope="col"');
		expect(html).toContain('scope="row"');
		expect(html).toContain('tabindex="0"');
		expect(html).toContain("عرض جدول البيانات");
		expect(html).toContain("<bdi>ACME عميل 12</bdi>");
		expect(html).toContain("٩٠٬٠٧١٬٩٩٢٬٥٤٧٬٤٠٩٬٩٣١٫٢٣");
		expect(html).toContain("Africa/Cairo");
		expect(html).toContain("الخاصة بي");
		expect(html).toContain('dir="rtl"');
	});
	it("English renders the same rows with English digits and labels", () => {
		const html = wrap({ status: "ready", model }, "en");
		expect(html).toContain("Show data table");
		expect(html).toContain("90,071,992,547,409,931.23");
		expect(html).toContain("Mine");
		expect(html).toContain('dir="ltr"');
	});
	it("keeps empty/assigned messaging and real zero rows without a misleading flat chart", () => {
		const html = wrap({ status: "empty", model: { ...model, rows: [{ ...model.rows[0], values: { count: 0, amount: "0" } }] } });
		expect(html).toContain("لا توجد سجلات مسندة إليك");
		expect(html).toContain("<table");
		expect(html).not.toContain("<canvas");
		expect(html).toContain('role="status"');
	});
	it("loading is announced once with decorative skeleton rows", () => {
		const html = wrap({ status: "loading" });
		expect(html).toContain('aria-busy="true"');
		expect(html.match(/data-testid="skeleton-row"/g)).toHaveLength(3);
	});
	it("403 has a permission message without Retry; safe errors offer widget Retry", () => {
		const forbidden = wrap({ status: "forbidden" }, "en");
		expect(forbidden).toContain("You do not have permission");
		expect(forbidden).not.toContain("Retry");
		const error = wrap({ status: "error", requestId: "safe-reference" }, "en");
		expect(error).toContain("Could not load this chart");
		expect(error).toContain("Retry");
		expect(error).toContain("safe-reference");
	});
	it("uses approved chart package registration and actual React canvas ARIA attributes", () => {
		expect(ChartJS.version).toBe("4.5.1");
		expect(ChartJS.registry.getController("bar")).toBeDefined();
		expect(ChartJS.registry.getController("line")).toBeDefined();
		const theme = resolveChartTheme((name) => name);
		const html = renderToStaticMarkup(<I18nProvider><ChartCanvas model={model} theme={theme} locale="ar" reducedMotion label="Chart assigned September Cairo count" tableId="exact-table" /></I18nProvider>);
		expect(html).toContain("<canvas");
		expect(html).toContain('role="img"');
		expect(html).toContain('aria-label="Chart assigned September Cairo count"');
		expect(html).toContain('aria-describedby="exact-table"');
		expect(chartData(model, theme).datasets[0].data).toEqual([12]);
	});
});
