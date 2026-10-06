import { describe, expect, it } from "vitest";
import type { FilterSpec } from "./gridModel.ts";
import {
	buildListParams,
	defaultFilter,
	enumFilter,
	ownerFilter,
	paramsKey,
	type ServerQueryInput,
	type ServerSpec,
} from "./serverQuery.ts";
import { initialServerState, pageLimit, type ServerListAction, type ServerListState, serverListReducer } from "./useServerList.ts";

const OWNER = "11111111-1111-4111-8111-111111111111";
const spec: ServerSpec = {
	sort: { title: "title", created: "received_at", status: "status" },
	defaultSort: "-received_at",
	filters: {
		status: enumFilter("status", ["open", "qualified", "closed"]),
		owner: ownerFilter(new Map([["Rep", OWNER]])),
		source: defaultFilter("source"),
	},
};
const input = (over: Partial<ServerQueryInput> = {}): ServerQueryInput => ({
	query: "",
	filters: [] as FilterSpec[],
	sorts: [],
	...over,
});

describe("buildListParams (grid view -> server query)", () => {
	it("an untouched grid still sends the default order (never the legacy id order)", () => {
		expect(buildListParams(spec, input())).toEqual({ sort: "-received_at" });
	});
	it("search is trimmed and bounded to the server's 100 characters", () => {
		expect(buildListParams(spec, input({ query: "  Kitchen  " })).q).toBe("Kitchen");
		expect(buildListParams(spec, input({ query: "x".repeat(300) })).q).toHaveLength(100);
		expect(buildListParams(spec, input({ query: "   " })).q).toBeUndefined();
		expect(buildListParams(spec, input({ query: "مطبخ" })).q).toBe("مطبخ");
	});
	it("sort maps column ids to server fields, - = desc, ignores unknown columns, max 2 distinct keys", () => {
		const p = buildListParams(
			spec,
			input({
				sorts: [
					{ key: "created", dir: "desc" },
					{ key: "contact", dir: "asc" },
					{ key: "title", dir: "asc" },
					{ key: "status", dir: "asc" },
				],
			}),
		);
		expect(p.sort).toBe("-received_at,title");
		expect(buildListParams(spec, input({ sorts: [{ key: "contact", dir: "asc" }] })).sort).toBe("-received_at");
	});
	it("filters become a JSON `and` group; one condition stays bare; extras (tabs) are included", () => {
		const one = buildListParams(spec, input({ filters: [{ key: "status", op: "eq", value: "open" }] }));
		expect(JSON.parse(one.filter ?? "")).toEqual({ p: "status", op: "eq", v: "open" });
		const both = buildListParams(
			spec,
			input({
				filters: [
					{ key: "status", op: "eq", value: "open" },
					{ key: "source", op: "eq", value: "web" },
				],
			}),
			[{ p: "owner_id", op: "eq", v: OWNER }],
		);
		expect(JSON.parse(both.filter ?? "").and).toHaveLength(3);
	});
	it("drops filters the server could not accept (bad enum, unknown owner name, unmapped column)", () => {
		const p = buildListParams(
			spec,
			input({
				filters: [
					{ key: "status", op: "eq", value: "bogus" },
					{ key: "owner", op: "eq", value: "Nobody" },
					{ key: "nope", op: "eq", value: 1 },
				],
			}),
		);
		expect(p.filter).toBeUndefined();
	});
	it("owner filter takes an assignee id, or a legacy saved-view display name", () => {
		const byId = buildListParams(spec, input({ filters: [{ key: "owner", op: "eq", value: OWNER }] }));
		const byName = buildListParams(spec, input({ filters: [{ key: "owner", op: "eq", value: "Rep" }] }));
		expect(byId.filter).toBe(byName.filter);
		expect(JSON.parse(byId.filter ?? "")).toEqual({ p: "owner_id", op: "eq", v: OWNER });
	});
	it("`due` passes through; the query key changes with every part", () => {
		const a = buildListParams(spec, input(), [], "overdue");
		expect(a.due).toBe("overdue");
		expect(paramsKey(a, "contact")).not.toBe(paramsKey({ ...a, q: "x" }, "contact"));
		expect(paramsKey(a, "contact")).not.toBe(paramsKey(a, "owner"));
		expect(paramsKey(a, "contact")).toBe(paramsKey({ ...a }, "contact"));
	});
});

describe("server list reducer (stale responses, keep rows while refreshing)", () => {
	type R = { id: string };
	const getId = (r: R) => r.id;
	const page = (ids: string[], next: string | null, total = ids.length) => ({
		items: ids.map((id) => ({ id })),
		nextCursor: next,
		hasMore: next !== null,
		total: { value: total, exact: true },
	});
	const run = (s: ServerListState<R>, ...a: ServerListAction<R>[]) => a.reduce(serverListReducer<R>, s);

	it("first page sets the total; load-more appends and keeps it", () => {
		let s = run(
			initialServerState<R>(),
			{ type: "start", seq: 1, more: false },
			{ type: "success", seq: 1, more: false, page: page(["a", "b"], "c1", 160), getId },
		);
		expect(s).toMatchObject({ status: "ready", total: { value: 160, exact: true }, nextCursor: "c1" });
		s = run(
			s,
			{ type: "start", seq: 2, more: true },
			{ type: "success", seq: 2, more: true, page: { ...page(["c"], null), total: null }, getId },
		);
		expect(s.items.map(getId)).toEqual(["a", "b", "c"]);
		expect(s.total?.value).toBe(160);
	});
	it("a new query keeps the previous rows (refreshing) and drops the stale response of the old one", () => {
		let s = run(
			initialServerState<R>(),
			{ type: "start", seq: 1, more: false },
			{ type: "success", seq: 1, more: false, page: page(["old"], null), getId },
		);
		s = run(s, { type: "start", seq: 2, more: false });
		expect(s).toMatchObject({ status: "ready", refreshing: true });
		expect(s.items.map(getId)).toEqual(["old"]);
		const before = s;
		expect(run(s, { type: "success", seq: 1, more: false, page: page(["stale"], null), getId })).toBe(before);
		s = run(s, { type: "success", seq: 2, more: false, page: page(["new"], null), getId });
		expect(s).toMatchObject({ refreshing: false });
		expect(s.items.map(getId)).toEqual(["new"]);
	});
	it("a failed first page is an error; a failed append keeps rows and stops the auto-append", () => {
		const err = new Error("x");
		let s = run(
			initialServerState<R>(),
			{ type: "start", seq: 1, more: false },
			{ type: "failure", seq: 1, error: err, more: false },
		);
		expect(s.status).toBe("error");
		s = run(
			s,
			{ type: "start", seq: 2, more: false },
			{ type: "success", seq: 2, more: false, page: page(["a"], "n"), getId },
			{ type: "start", seq: 3, more: true },
			{ type: "failure", seq: 3, error: err, more: true },
		);
		expect(s).toMatchObject({ status: "ready", moreError: err, loadingMore: false });
		expect(s.items).toHaveLength(1);
	});
	it("page size -> request limit stays within the server's 25..200", () => {
		expect([pageLimit(10), pageLimit(50), pageLimit(500)]).toEqual([25, 50, 200]);
	});
});
