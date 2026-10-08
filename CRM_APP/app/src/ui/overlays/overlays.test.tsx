import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "../i18n/index.ts";
import { Dialog } from "./Dialog.tsx";
import { MenuButton } from "./Menu.tsx";
import { rovingIndex, trapIndex, typeaheadIndex } from "./nav.ts";
import {
	type ToastItem,
	ToastProvider,
	toastReducer,
	toastTimeoutMs,
} from "./Toast.tsx";

describe("nav models", () => {
	it("rovingIndex: Up/Down wrap, Home/End, entry from nothing, no-wrap clamps, other keys ignored", () => {
		expect(rovingIndex("ArrowDown", -1, 3)).toBe(0);
		expect(rovingIndex("ArrowUp", -1, 3)).toBe(2);
		expect(rovingIndex("ArrowDown", 2, 3)).toBe(0);
		expect(rovingIndex("ArrowUp", 0, 3)).toBe(2);
		expect(rovingIndex("ArrowDown", 2, 3, false)).toBe(2);
		expect(rovingIndex("ArrowUp", 0, 3, false)).toBe(0);
		expect(rovingIndex("Home", 2, 3)).toBe(0);
		expect(rovingIndex("End", 0, 3)).toBe(2);
		expect(rovingIndex("a", 0, 3)).toBeNull();
		expect(rovingIndex("ArrowDown", 0, 0)).toBeNull();
	});
	it("trapIndex wraps Tab at both ends and pulls stray focus in", () => {
		expect(trapIndex(false, 2, 3)).toBe(0);
		expect(trapIndex(true, 0, 3)).toBe(2);
		expect(trapIndex(false, 0, 3)).toBeNull();
		expect(trapIndex(true, 1, 3)).toBeNull();
		expect(trapIndex(false, -1, 3)).toBe(0);
		expect(trapIndex(true, -1, 3)).toBe(2);
		expect(trapIndex(false, 0, 0)).toBeNull();
	});
	it("typeaheadIndex finds by prefix, cycles on a repeated letter, wraps, and misses cleanly", () => {
		const labels = ["Archive", "Assign", "Delete"];
		expect(typeaheadIndex("d", labels, -1)).toBe(2);
		expect(typeaheadIndex("a", labels, 0)).toBe(1);
		expect(typeaheadIndex("a", labels, 1)).toBe(0);
		expect(typeaheadIndex("as", labels, 0)).toBe(1);
		expect(typeaheadIndex("z", labels, 0)).toBeNull();
		expect(typeaheadIndex("", labels, 0)).toBeNull();
	});
});

describe("toast model", () => {
	const t = (id: number, tone: ToastItem["tone"] = "info"): ToastItem => ({
		id,
		tone,
		message: `m${id}`,
	});
	it("is bounded (oldest dropped) and dismisses by id", () => {
		let s: readonly ToastItem[] = [];
		for (let i = 1; i <= 6; i++)
			s = toastReducer(s, { type: "push", toast: t(i) });
		expect(s.map((x) => x.id)).toEqual([3, 4, 5, 6]);
		expect(
			toastReducer(s, { type: "dismiss", id: 4 }).map((x) => x.id),
		).toEqual([3, 5, 6]);
	});
	it("errors persist until dismissed; others auto-dismiss", () => {
		expect(toastTimeoutMs("error")).toBeNull();
		expect(toastTimeoutMs("success")).toBeGreaterThan(0);
		expect(toastTimeoutMs("warning")).toBeGreaterThanOrEqual(
			toastTimeoutMs("info") ?? 0,
		);
	});
});

describe("overlay markup", () => {
	it("Dialog: portals mount only in the browser; nothing when closed", () => {
		const html = renderToString(
			<I18nProvider>
				<Dialog
					open
					onClose={() => undefined}
					title="Delete?"
					description="This cannot be undone."
					confirm={{ label: "Delete", onConfirm: () => undefined }}
				/>
			</I18nProvider>,
		);
		// RAC modal portals have no server DOM. Role/name/trap/return are checked in the bounded browser fixture.
		expect(html).toBe("");
		const closed = renderToString(
			<I18nProvider>
				<Dialog open={false} onClose={() => undefined} title="x" />
			</I18nProvider>,
		);
		expect(closed).toBe("");
	});
	it("MenuButton trigger exposes haspopup/expanded and renders no menu while closed", () => {
		const html = renderToString(
			<I18nProvider>
				<MenuButton
					label="Actions"
					items={[{ id: "a", label: "A", onSelect: () => undefined }]}
				/>
			</I18nProvider>,
		);
		expect(html).toContain('aria-haspopup="menu"');
		expect(html).toContain('aria-expanded="false"');
		expect(html).toContain('aria-label="Actions"');
		expect(html).not.toContain('role="menu"');
	});
	it("ToastProvider mounts polite and assertive live regions up front", () => {
		const html = renderToString(
			<I18nProvider>
				<ToastProvider>
					<p>app</p>
				</ToastProvider>
			</I18nProvider>,
		);
		expect(html).toContain('role="status"');
		expect(html).toContain('aria-live="polite"');
		expect(html).toContain('role="alert"');
		expect(html).toContain('aria-live="assertive"');
	});
});
