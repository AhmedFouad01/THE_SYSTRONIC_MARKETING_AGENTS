import { describe, expect, it } from "vitest";
import type { Deal, Pipeline } from "../deals/model.ts";
import {
	boardStages,
	columnKind,
	groupByStage,
	initialsOf,
	openDealCount,
	orphanCount,
	pickPipeline,
	resolvePipeline,
	totalsOf,
} from "./model.ts";

const P: Pipeline = {
	id: "p1",
	name: "Sales",
	stages: [
		{ id: "won", name: "Won", outcome: "won", position: 3, archived: false },
		{ id: "new", name: "New", outcome: null, position: 1, archived: false },
		{ id: "old", name: "Old", outcome: null, position: 0, archived: true },
		{
			id: "qual",
			name: "Qualified",
			outcome: null,
			position: 2,
			archived: false,
		},
		{ id: "lost", name: "Lost", outcome: "lost", position: 4, archived: false },
	],
	transitions: [],
};

const deal = (
	id: string,
	stage: string,
	minor: number,
	cur = "EGP",
	pipe = "p1",
): Deal => ({
	id,
	contact_id: "c",
	lead_id: null,
	pipeline_id: pipe,
	stage_id: stage,
	owner_id: null,
	title: id,
	amount_minor: minor,
	currency: cur,
	version: 0,
});

describe("groupByStage", () => {
	it("orders columns by position, hides empty archived stages, groups deals", () => {
		const cols = groupByStage(P, [
			deal("a", "new", 100),
			deal("b", "new", 250),
			deal("c", "won", 900),
		]);
		expect(cols.map((c) => c.stage.id)).toEqual(["new", "qual", "won", "lost"]);
		expect(cols.map((c) => c.count)).toEqual([2, 0, 1, 0]);
		expect(cols[0]?.totals).toEqual([{ currency: "EGP", minor: 350 }]);
		expect(cols[1]?.totals).toEqual([]);
	});

	it("shows an archived stage only while a deal still sits in it", () => {
		expect(boardStages(P, []).map((s) => s.id)).not.toContain("old");
		expect(boardStages(P, [deal("a", "old", 1)]).map((s) => s.id)[0]).toBe(
			"old",
		);
	});

	it("ignores deals of other pipelines", () => {
		const cols = groupByStage(P, [
			deal("a", "new", 1),
			deal("x", "new", 5, "EGP", "p2"),
		]);
		expect(cols[0]?.count).toBe(1);
	});

	it("keeps currencies apart and sorted", () => {
		expect(
			totalsOf([
				deal("a", "new", 100, "USD"),
				deal("b", "new", 50, "EGP"),
				deal("c", "new", 25, "USD"),
			]),
		).toEqual([
			{ currency: "EGP", minor: 50 },
			{ currency: "USD", minor: 125 },
		]);
	});

	it("applies optimistic moves without mutating the input", () => {
		const input = [deal("a", "new", 100)];
		const cols = groupByStage(P, input, new Map([["a", "qual"]]));
		expect(cols.map((c) => c.count)).toEqual([0, 1, 0, 0]);
		expect(cols[1]?.totals).toEqual([{ currency: "EGP", minor: 100 }]);
		expect(input[0]?.stage_id).toBe("new");
	});

	it("counts deals whose stage is unknown to the pipeline", () => {
		expect(orphanCount(P, [deal("a", "gone", 1), deal("b", "new", 1)])).toBe(1);
	});
});

describe("columnKind / resolvePipeline", () => {
	it("maps outcomes", () => {
		expect(P.stages.map(columnKind)).toEqual([
			"won",
			"open",
			"open",
			"open",
			"lost",
		]);
	});
	it("falls back to the first pipeline", () => {
		const q = { ...P, id: "p2" };
		expect(resolvePipeline([P, q], "p2")?.id).toBe("p2");
		expect(resolvePipeline([P, q], "zzz")?.id).toBe("p1");
		expect(resolvePipeline([], null)).toBeNull();
	});
});

describe("pickPipeline (UX-16: default to the busiest, remember last-used)", () => {
	const Q: Pipeline = { ...P, id: "p2", name: "Other" };
	const deals = [
		deal("a", "new", 1, "EGP", "p2"),
		deal("b", "qual", 1, "EGP", "p2"),
		deal("c", "won", 1, "EGP", "p2"), // won: not open
		deal("d", "new", 1, "EGP", "p1"),
	];
	it("counts only deals in open stages of that pipeline", () => {
		expect(openDealCount(P, deals)).toBe(1);
		expect(openDealCount(Q, deals)).toBe(2);
	});
	it("defaults to the pipeline with the most open deals, not the first", () => {
		expect(pickPipeline([P, Q], deals, null, null)?.id).toBe("p2");
	});
	it("keeps pipeline order on a tie or when nothing is loaded", () => {
		expect(pickPipeline([P, Q], [], null, null)?.id).toBe("p1");
		expect(pickPipeline([P, Q], [deal("x", "new", 1, "EGP", "p1"), deal("y", "new", 1, "EGP", "p2")], null, null)?.id).toBe("p1");
	});
	it("prefers the explicit choice, then the remembered one, ignoring stale ids", () => {
		expect(pickPipeline([P, Q], deals, "p1", "p2")?.id).toBe("p1");
		expect(pickPipeline([P, Q], deals, null, "p1")?.id).toBe("p1");
		expect(pickPipeline([P, Q], deals, "gone", "gone-too")?.id).toBe("p2");
		expect(pickPipeline([], deals, null, null)).toBeNull();
	});
});

describe("initialsOf", () => {
	it("takes up to two leading letters", () => {
		expect(initialsOf("Alex Carter")).toBe("AC");
		expect(initialsOf("  maya  lee  jones ")).toBe("ML");
		expect(initialsOf("Single")).toBe("S");
		expect(initialsOf("")).toBe("");
		expect(initialsOf("أحمد فؤاد")).toBe("أف");
	});
});
