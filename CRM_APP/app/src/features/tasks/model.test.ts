import { describe, expect, it } from "vitest";
import { ApiError } from "../../api/errors.ts";
import {
	buildCreateBody,
	buildPatchBody,
	completeBody,
	dayDiff,
	draftOf,
	dueBucket,
	fromLocalInput,
	tabQuery,
	keyFor,
	mergeLatest,
	overdueDays,
	relatedTarget,
	runBulkComplete,
	type Task,
	taskSource,
	toLocalInput,
	toRows,
	validateNewTask,
} from "./model.ts";

// Fixed clock built from LOCAL components, so every assertion holds in any timezone.
const NOW = new Date(2026, 9, 5, 14, 30, 0);
const local = (d: number, h: number, m = 0) =>
	new Date(2026, 9, d, h, m, 0).toISOString();
const ID = "11111111-1111-4111-8111-111111111111";
const task = (over: Partial<Task> = {}): Task => ({
	id: ID,
	contact_id: ID,
	deal_id: null,
	owner_id: ID,
	title: "Call back",
	due_at: local(5, 18),
	status: "open",
	outcome: null,
	version: 0,
	completed_at: null,
	...over,
});

describe("dueBucket (fixed clock 2026-10-05 14:30 local)", () => {
	it("past instant is overdue, even earlier the same day", () => {
		expect(dueBucket({ status: "open", due_at: local(4, 9) }, NOW)).toBe(
			"overdue",
		);
		expect(dueBucket({ status: "open", due_at: local(5, 9) }, NOW)).toBe(
			"overdue",
		);
	});
	it("later today is today, including the last minute of the day", () => {
		expect(dueBucket({ status: "open", due_at: local(5, 14, 31) }, NOW)).toBe(
			"today",
		);
		expect(dueBucket({ status: "open", due_at: local(5, 23, 59) }, NOW)).toBe(
			"today",
		);
	});
	it("next local midnight onward is upcoming", () => {
		expect(dueBucket({ status: "open", due_at: local(6, 0, 0) }, NOW)).toBe(
			"upcoming",
		);
		expect(dueBucket({ status: "open", due_at: local(30, 8) }, NOW)).toBe(
			"upcoming",
		);
	});
	it("completed is done regardless of date; missing/invalid date is none", () => {
		expect(dueBucket({ status: "completed", due_at: local(1, 8) }, NOW)).toBe(
			"done",
		);
		expect(dueBucket({ status: "open", due_at: null }, NOW)).toBe("none");
		expect(dueBucket({ status: "open", due_at: "garbage" }, NOW)).toBe("none");
	});
	it("tabs are server queries: status/due_at conditions, or the server's own due=overdue clock", () => {
		expect(tabQuery("open", NOW)).toEqual({ nodes: [{ p: "status", op: "eq", v: "open" }] });
		expect(tabQuery("overdue", NOW)).toEqual({ due: "overdue", nodes: [] });
		expect(tabQuery("done", NOW).nodes).toEqual([{ p: "status", op: "eq", v: "completed" }]);
		const today = tabQuery("today", NOW).nodes;
		expect(today).toContainEqual({ p: "due_at", op: "gte", v: NOW.toISOString() });
		expect(today).toContainEqual({ p: "due_at", op: "lt", v: new Date(2026, 9, 6).toISOString() });
		expect(tabQuery("upcoming", NOW).nodes).toContainEqual({ p: "due_at", op: "gte", v: new Date(2026, 9, 6).toISOString() });
		expect(tabQuery("none", NOW).nodes).toContainEqual({ p: "due_at", op: "is_null" });
	});
	it("dayDiff counts local calendar days", () => {
		expect(dayDiff(new Date(2026, 9, 5, 23, 59), NOW)).toBe(0);
		expect(dayDiff(new Date(2026, 9, 6, 0, 0), NOW)).toBe(1);
		expect(dayDiff(new Date(2026, 9, 3, 12, 0), NOW)).toBe(-2);
	});
});

describe("local input <-> ISO", () => {
	it("round-trips through the local zone", () => {
		const iso = local(7, 9, 15);
		expect(toLocalInput(iso)).toBe("2026-10-07T09:15");
		expect(fromLocalInput("2026-10-07T09:15")).toBe(iso);
	});
	it("rejects empty and malformed values", () => {
		expect(fromLocalInput("")).toBeNull();
		expect(fromLocalInput("2026-10-07")).toBeNull();
		expect(toLocalInput(null)).toBe("");
	});
});

describe("rows, source, related", () => {
	it("resolves names, buckets and falls back for unknown ids", () => {
		const rows = toRows(
			[
				task({ deal_id: "d1" }),
				task({ id: "t2", contact_id: "zz", deal_id: null }),
			].map((x) => (x.id === ID ? { ...x, contact: { id: ID, display_name: "Ada" } } : x)),
			new Map([["d1", "Big deal"]]),
			new Map([[ID, "Owner"]]),
			{ unknown: "?", unknownOwner: "Someone" },
			NOW,
		);
		expect(rows[0]).toMatchObject({
			relatedKind: "deal",
			relatedName: "Big deal",
			contactName: "Ada",
			ownerName: "Owner",
			bucket: "today",
		});
		expect(rows[1]).toMatchObject({ relatedKind: "contact", relatedName: "?" });
		expect(relatedTarget(rows[0] as never)).toEqual({
			route: "/deals",
			search: "?select=d1",
		});
		expect(relatedTarget({ relatedKind: null, relatedId: null })).toBeNull();
	});
	it("trusts only an explicit automation marker", () => {
		expect(taskSource(task())).toBe("unknown");
		expect(taskSource(task({ source: "manual" }))).toBe("manual");
		expect(taskSource(task({ source: "automation" }))).toBe("automation");
		expect(taskSource(task({ automation_run_id: ID }))).toBe("automation");
	});
});

describe("create / edit bodies", () => {
	it("validates required fields and the contact-or-deal rule", () => {
		const e = validateNewTask({
			title: " ",
			due: "",
			ownerId: "",
			contactId: "",
			dealId: "",
		});
		expect(e).toEqual({
			title: "required",
			due: "required",
			contactId: "required",
		});
		expect(
			validateNewTask({
				title: "x",
				due: "2026-10-07T09:15",
				ownerId: "",
				contactId: "",
				dealId: ID,
			}),
		).toEqual({});
	});
	it("keeps the relation and UTC due in the POST body; reuses the key for a retry", () => {
		const input = {
			title: " T ",
			due: "2026-10-07T09:15",
			ownerId: "",
			contactId: ID,
			dealId: "d",
		};
		expect(buildCreateBody(input, "c")).toEqual({
			command_id: "c",
			title: "T",
			due_at: local(7, 9, 15),
			contact_id: ID,
			deal_id: "d",
		});
		const a = keyFor(null, input, () => "k1");
		expect(keyFor(a, input, () => "k2").key).toBe("k1");
		expect(keyFor(a, { ...input, title: "U" }, () => "k2").key).toBe("k2");
	});
	it("PATCH carries only changes plus expected_version; null when clean", () => {
		const t = task({ version: 3 });
		expect(buildPatchBody(t, draftOf(t), "c")).toBeNull();
		expect(buildPatchBody(t, { ...draftOf(t), title: "New" }, "c")).toEqual({
			command_id: "c",
			expected_version: 3,
			title: "New",
		});
		expect(completeBody(t, "c")).toEqual({
			command_id: "c",
			expected_version: 3,
			status: "completed",
		});
	});
	it("overlay: newer version wins, new tasks first", () => {
		const a = task({ id: "a", version: 0 });
		const merged = mergeLatest(
			[a],
			new Map([
				["a", { ...a, version: 1, status: "completed" as const }],
				["n", task({ id: "n" })],
			]),
		);
		expect(merged.map((m) => m.id)).toEqual(["n", "a"]);
		expect(merged[1]?.status).toBe("completed");
		// server-query lists show only what the server returned
		expect(mergeLatest([a], new Map([["n", task({ id: "n" })]]), false).map((m) => m.id)).toEqual(["a"]);
	});
});

describe("runBulkComplete", () => {
	const err = (status: number, code: string) =>
		new ApiError({
			status,
			code,
			safeMessage: "",
			requestId: null,
			retryable: false,
		});
	const items = [
		{ id: "a", version: 0, done: false },
		{ id: "b", version: 0, done: true },
		{ id: "c", version: 0, done: false },
		{ id: "d", version: 0, done: false },
	];
	it("skips done rows, continues after a 409, summarizes partial failure", async () => {
		const { summary } = await runBulkComplete(items, async (i) => {
			if (i.id === "c") throw err(409, "VERSION_CONFLICT");
		});
		expect(summary.succeeded).toEqual(["a", "d"]);
		expect(summary.skipped).toEqual(["b"]);
		expect(summary.failed).toEqual([
			{ id: "c", kind: "version_conflict", code: "VERSION_CONFLICT" },
		]);
		expect(summary.tone).toBe("warning");
	});
	it("a 401 aborts the rest", async () => {
		const { summary } = await runBulkComplete(items, async (i) => {
			if (i.id === "a") throw err(401, "UNAUTHENTICATED");
		});
		expect(summary.notAttempted).toEqual(["b", "c", "d"]);
		expect(summary.tone).toBe("error");
	});
});

describe("overdue chip (UX-17)", () => {
	it("counts whole local days late; earlier today is 0, never negative", () => {
		expect(overdueDays(new Date(2026, 8, 23, 9), NOW)).toBe(12);
		expect(overdueDays(new Date(2026, 9, 4, 23, 59), NOW)).toBe(1);
		expect(overdueDays(new Date(2026, 9, 5, 9), NOW)).toBe(0);
		expect(overdueDays(new Date(2026, 9, 9, 9), NOW)).toBe(0);
	});
});
