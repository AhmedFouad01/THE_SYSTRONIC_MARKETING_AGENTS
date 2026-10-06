import { describe, expect, it } from "vitest";
import { ApiError } from "../api/errors.ts";
import { bulkMessage, GENERIC_BULK_KEYS, runBulkOps } from "./bulk.ts";
import { en } from "../ui/i18n/en.ts";
import { bulkMoveTargets, type Pipeline } from "./deals/model.ts";

const tr = (key: keyof typeof en, vars: Record<string, string | number> = {}) =>
	en[key].replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k]));
const fmt = (n: number) => String(n);

describe("runBulkOps", () => {
	it("records a failure, keeps going, and reports a partial toast", async () => {
		const conflict = new ApiError({ status: 409, code: "VERSION_CONFLICT", safeMessage: "stale", requestId: "r", retryable: false });
		const s = await runBulkOps([{ id: "a" }, { id: "b" }, { id: "c", skip: true }, { id: "d" }], async (id) => {
			if (id === "b") throw conflict;
		});
		expect(s.succeeded).toEqual(["a", "d"]);
		expect(s.failed.map((f) => f.id)).toEqual(["b"]);
		expect(s.skipped).toEqual(["c"]);
		const m = bulkMessage(s, GENERIC_BULK_KEYS, tr, fmt);
		expect(m.tone).toBe("error");
		expect(m.text).toContain("2 updated, 1 failed");
		expect(m.text).toContain("1 already up to date");
	});

	it("a 401 stops the run and counts the rest as not attempted", async () => {
		const gone = new ApiError({ status: 401, code: "UNAUTHENTICATED", safeMessage: "x", requestId: "r", retryable: false });
		const s = await runBulkOps([{ id: "a" }, { id: "b" }, { id: "c" }], async (id) => {
			if (id === "b") throw gone;
		});
		expect(s.notAttempted).toEqual(["c"]);
		expect(bulkMessage(s, GENERIC_BULK_KEYS, tr, fmt).text).toContain("1 not attempted");
	});
});

const stage = (id: string, position: number, outcome: "won" | "lost" | null = null) =>
	({ id, name: id, position, outcome, archived: false }) satisfies Pipeline["stages"][number];
const pipe = (id: string): Pipeline =>
	({
		id,
		name: id,
		stages: [stage("new", 0), stage("q", 1), stage("won", 2, "won"), stage("lost", 3, "lost")],
		transitions: [
			{ from_stage: "new", to_stage: "q" },
			{ from_stage: "new", to_stage: "lost" },
			{ from_stage: "q", to_stage: "won" },
			{ from_stage: "q", to_stage: "lost" },
		],
	}) satisfies Pipeline;

describe("bulkMoveTargets", () => {
	const pipelines = new Map([["p1", pipe("p1")], ["p2", pipe("p2")]]);
	const d = (pipeline_id: string, stage_id: string) => ({ pipeline_id, stage_id });
	it("offers the shared allowed edge (lost excluded)", () => {
		expect(bulkMoveTargets([d("p1", "new"), d("p1", "new")], pipelines).map((s) => s.id)).toEqual(["q"]);
	});
	it("offers nothing when pipelines differ", () => {
		expect(bulkMoveTargets([d("p1", "new"), d("p2", "new")], pipelines)).toEqual([]);
	});
	it("offers nothing when no single edge fits every deal", () => {
		expect(bulkMoveTargets([d("p1", "new"), d("p1", "q")], pipelines)).toEqual([]);
	});
	it("offers nothing for an empty selection", () => {
		expect(bulkMoveTargets([], pipelines)).toEqual([]);
	});
});
