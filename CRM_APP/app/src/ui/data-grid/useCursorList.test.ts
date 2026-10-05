import { describe, expect, it } from "vitest";
import {
	type CursorListAction,
	type CursorListState,
	canLoadMore,
	cursorListReducer,
	initialCursorState,
	mergePage,
} from "./useCursorList.ts";

type Item = { id: string };
const getId = (i: Item) => i.id;
const items = (...ids: string[]): Item[] => ids.map((id) => ({ id }));
const run = (s: CursorListState<Item>, ...actions: CursorListAction<Item>[]) => actions.reduce(cursorListReducer, s);
const ok = (seq: number, ids: string[], next: string | null, more: boolean): CursorListAction<Item> => ({
	type: "success",
	seq,
	page: { items: items(...ids), nextCursor: next },
	more,
	getId,
});

describe("cursor list reducer", () => {
	it("initial load then load-more appends pages and tracks cursor + sample", () => {
		let s = run(initialCursorState<Item>(), { type: "start", seq: 1, more: false }, ok(1, ["a", "b"], "c1", false));
		expect(s).toMatchObject({ status: "ready", pages: 1, nextCursor: "c1", loadingMore: false });
		expect(canLoadMore(s, 3)).toBe(true);
		s = run(s, { type: "start", seq: 2, more: true });
		expect(s.loadingMore).toBe(true);
		expect(canLoadMore(s, 3)).toBe(false); // no concurrent load-more
		s = run(s, ok(2, ["c"], null, true));
		expect(s.items.map(getId)).toEqual(["a", "b", "c"]);
		expect(s).toMatchObject({ pages: 2, nextCursor: null, loadingMore: false });
		expect(canLoadMore(s, 3)).toBe(false); // data ended: not a sample any more
	});
	it("page cap bounds loading even when more data remains", () => {
		let s = run(initialCursorState<Item>(), { type: "start", seq: 1, more: false }, ok(1, ["a"], "c1", false));
		s = run(s, { type: "start", seq: 2, more: true }, ok(2, ["b"], "c2", true));
		expect(s.pages).toBe(2);
		expect(s.nextCursor).toBe("c2"); // still a sample
		expect(canLoadMore(s, 2)).toBe(false); // cap reached
		expect(canLoadMore(s, 3)).toBe(true);
	});
	it("drops stale responses (older seq) so a reset cannot be overwritten", () => {
		let s = run(initialCursorState<Item>(), { type: "start", seq: 1, more: false });
		s = run(s, { type: "start", seq: 2, more: false }); // reload / tenant change supersedes request 1
		const before = s;
		expect(run(s, ok(1, ["stale"], null, false))).toBe(before);
		expect(run(s, { type: "failure", seq: 1, error: new Error("x"), more: false })).toBe(before);
		s = run(s, ok(2, ["fresh"], null, false));
		expect(s.items.map(getId)).toEqual(["fresh"]);
	});
	it("initial failure -> error state; load-more failure keeps items and stops the auto loop", () => {
		const err = new Error("boom");
		let s = run(initialCursorState<Item>(), { type: "start", seq: 1, more: false }, { type: "failure", seq: 1, error: err, more: false });
		expect(s).toMatchObject({ status: "error", error: err });
		s = run(s, { type: "start", seq: 2, more: false }, ok(2, ["a"], "c1", false), { type: "start", seq: 3, more: true }, { type: "failure", seq: 3, error: err, more: true });
		expect(s).toMatchObject({ status: "ready", moreError: err, loadingMore: false });
		expect(s.items).toHaveLength(1);
		s = run(s, { type: "start", seq: 4, more: true }); // retry clears the error
		expect(s.moreError).toBeNull();
	});
	it("restart (reload) clears items and errors", () => {
		let s = run(initialCursorState<Item>(), { type: "start", seq: 1, more: false }, ok(1, ["a"], "c", false));
		s = run(s, { type: "start", seq: 2, more: false });
		expect(s).toMatchObject({ items: [], status: "loading", pages: 0, nextCursor: null, error: null });
	});
});

describe("mergePage", () => {
	it("appends only unseen ids, preserving order, and dedupes within the page", () => {
		expect(mergePage(items("a", "b"), items("b", "c", "c", "d"), getId).map(getId)).toEqual(["a", "b", "c", "d"]);
		expect(mergePage([], [], getId)).toEqual([]);
	});
});
