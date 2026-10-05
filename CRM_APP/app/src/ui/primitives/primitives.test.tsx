import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "../i18n/index.ts";
import { Button, Input, nextTabIndex, StatusPill, Tabs } from "./index.ts";

describe("Tabs keyboard model", () => {
	it("LTR: ArrowRight is next, ArrowLeft is previous, with wrap", () => {
		expect(nextTabIndex("ArrowRight", 0, 3, "ltr")).toBe(1);
		expect(nextTabIndex("ArrowLeft", 0, 3, "ltr")).toBe(2);
		expect(nextTabIndex("ArrowRight", 2, 3, "ltr")).toBe(0);
	});
	it("RTL: arrows are reversed", () => {
		expect(nextTabIndex("ArrowLeft", 0, 3, "rtl")).toBe(1);
		expect(nextTabIndex("ArrowRight", 0, 3, "rtl")).toBe(2);
		expect(nextTabIndex("ArrowRight", 1, 3, "rtl")).toBe(0);
	});
	it("Home/End jump to the ends in both directions", () => {
		for (const dir of ["ltr", "rtl"] as const) {
			expect(nextTabIndex("Home", 2, 4, dir)).toBe(0);
			expect(nextTabIndex("End", 1, 4, dir)).toBe(3);
		}
	});
	it("skips disabled tabs and ignores other keys", () => {
		expect(nextTabIndex("ArrowRight", 0, 3, "ltr", [false, true, false])).toBe(2);
		expect(nextTabIndex("Home", 1, 3, "ltr", [true, false, false])).toBe(1);
		expect(nextTabIndex("End", 0, 3, "ltr", [false, false, true])).toBe(1);
		expect(nextTabIndex("a", 0, 3, "ltr")).toBeNull();
		expect(nextTabIndex("ArrowRight", 0, 0, "ltr")).toBeNull();
	});
	it("renders roving tabindex and aria wiring", () => {
		const html = renderToString(
			<I18nProvider>
				<Tabs
					label="Sections"
					value="b"
					onChange={() => undefined}
					tabs={[
						{ id: "a", label: "A", panel: "pa" },
						{ id: "b", label: "B", panel: "pb" },
					]}
				/>
			</I18nProvider>,
		);
		expect(html).toContain('role="tablist"');
		expect(html.match(/tabindex="0"/g)?.length).toBe(2); // selected tab + focusable panel
		expect(html.match(/role="tab"[^>]*tabindex="-1"/g)?.length).toBe(1); // unselected tab
		expect(html).toContain('aria-selected="true"');
		expect(html).toContain("pb");
		expect(html).not.toContain(">pa<");
	});
});

describe("primitive accessibility attributes", () => {
	it("Button loading is disabled and aria-busy", () => {
		const html = renderToString(<Button loading>Save</Button>);
		expect(html).toContain("disabled");
		expect(html).toContain('aria-busy="true"');
		expect(renderToString(<Button>Save</Button>)).not.toContain("aria-busy");
	});
	it("Input wires label, hint and error via aria-describedby and aria-invalid", () => {
		const html = renderToString(<Input label="Name" hint="H" error="E" />);
		expect(html).toContain('aria-invalid="true"');
		expect(html).toMatch(/aria-describedby="[^"]+-hint [^"]+-err"/);
		expect(html).toMatch(/<label[^>]*for="/);
		expect(renderToString(<Input label="Name" />)).not.toContain("aria-invalid");
	});
	it("StatusPill carries an icon plus text (not color only)", () => {
		const html = renderToString(<StatusPill tone="danger">Lost</StatusPill>);
		expect(html).toContain("<svg");
		expect(html).toContain("Lost");
	});
});
