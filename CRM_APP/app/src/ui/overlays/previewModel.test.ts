import { describe, expect, it } from "vitest";
import {
	isOutsideDismissIgnored,
	isTypingTarget,
	parsePreview,
	previewStep,
	stepDirectionOfKey,
	withPreview,
} from "./previewModel.ts";

const A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

describe("preview URL param", () => {
	it("reads ?preview=, falls back to the legacy ?select=, and rejects non-uuids", () => {
		expect(parsePreview(`?preview=${A}`)).toBe(A);
		expect(parsePreview(`?select=${B}`)).toBe(B);
		expect(parsePreview(`?select=${B}&preview=${A}`)).toBe(A);
		expect(parsePreview("?preview=not-a-uuid")).toBeNull();
		expect(parsePreview(`?preview=nope&select=${B}`)).toBe(B);
		expect(parsePreview("")).toBeNull();
	});
	it("writes preview, drops legacy select, keeps other params, removes on close", () => {
		expect(withPreview(`?select=${B}`, A)).toBe(`?preview=${A}`);
		expect(withPreview("?x=1", A)).toBe(`?x=1&preview=${A}`);
		expect(withPreview(`?x=1&preview=${A}`, null)).toBe("?x=1");
		expect(withPreview(`?preview=${A}`, null)).toBe("");
		expect(withPreview("", null)).toBe("");
	});
});

describe("previewStep (prev/next over loaded rows)", () => {
	const ids = ["a", "b", "c"];
	it("walks without wrapping and reports the position", () => {
		expect(previewStep(ids, "b", false)).toEqual({ index: 1, total: 3, prevId: "a", nextId: "c", needsMore: false });
		expect(previewStep(ids, "a", false).prevId).toBeNull();
		expect(previewStep(ids, "c", false).nextId).toBeNull();
	});
	it("at the last loaded row with more on the server Next needs a page load", () => {
		expect(previewStep(ids, "c", true)).toMatchObject({ nextId: null, needsMore: true });
		expect(previewStep(ids, "b", true).needsMore).toBe(false);
	});
	it("a record that is not among the loaded rows has no neighbours", () => {
		expect(previewStep(ids, "zzz", true)).toEqual({ index: -1, total: 3, prevId: null, nextId: null, needsMore: false });
		expect(previewStep(ids, null, true).index).toBe(-1);
		expect(previewStep([], "a", false).index).toBe(-1);
	});
});

describe("outside-dismiss and shortcut predicates", () => {
	const el = (hit: boolean) => ({ closest: (_s: string) => (hit ? {} : null) });
	it("ignores pointer targets inside dialogs/lists/rows only", () => {
		expect(isOutsideDismissIgnored(el(true))).toBe(true);
		expect(isOutsideDismissIgnored(el(false))).toBe(false);
		expect(isOutsideDismissIgnored(null)).toBe(false);
	});
	it("never treats typing targets as shortcut targets' complement", () => {
		expect(isTypingTarget({ tagName: "INPUT" })).toBe(true);
		expect(isTypingTarget({ tagName: "textarea" })).toBe(true);
		expect(isTypingTarget({ tagName: "SELECT" })).toBe(true);
		expect(isTypingTarget({ tagName: "DIV", isContentEditable: true })).toBe(true);
		expect(isTypingTarget({ tagName: "TR" })).toBe(false);
		expect(isTypingTarget(null)).toBe(false);
	});
	it("J/K by physical key (Arabic layout safe) and Alt+Up/Down; modifiers otherwise ignored", () => {
		const k = (o: Partial<{ code: string; key: string; altKey: boolean; ctrlKey: boolean; metaKey: boolean }>) =>
			stepDirectionOfKey({ code: "", key: "", altKey: false, ctrlKey: false, metaKey: false, ...o });
		expect(k({ code: "KeyJ", key: "ج" })).toBe("next");
		expect(k({ code: "KeyK", key: "ن" })).toBe("prev");
		expect(k({ altKey: true, key: "ArrowDown" })).toBe("next");
		expect(k({ altKey: true, key: "ArrowUp" })).toBe("prev");
		expect(k({ key: "ArrowDown" })).toBeNull();
		expect(k({ code: "KeyJ", ctrlKey: true })).toBeNull();
		expect(k({ code: "KeyJ", altKey: true })).toBeNull();
	});
});
