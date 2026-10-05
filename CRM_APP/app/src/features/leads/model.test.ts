import { describe, expect, it } from "vitest";
import { ApiError } from "../../api/errors.ts";
import {
	type BulkItem,
	buildCreateBody,
	buildPatchBody,
	classifyCreateError,
	EMPTY_NEW_LEAD,
	filterBuiltInView,
	keyFor,
	mergeLatest,
	type Lead,
	runBulkAssign,
	summarizeBulk,
	toRows,
	validateNewLead,
} from "./model.ts";

const ME = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const lead = (
	id: string,
	owner: string | null,
	over: Partial<Lead> = {},
): Lead => ({
	id,
	contact_id: "c1",
	owner_id: owner,
	title: `T ${id}`,
	source: "manual",
	source_evidence: "e",
	status: "open",
	version: 0,
	received_at: "2026-10-05T10:00:00Z",
	...over,
});
const err = (status: number, code: string) =>
	new ApiError({
		status,
		code,
		safeMessage: "",
		requestId: null,
		retryable: false,
	});

describe("built-in views", () => {
	const rows = [lead("a", ME), lead("b", OTHER), lead("c", null)];
	it("all keeps everything", () =>
		expect(filterBuiltInView(rows, "all", ME).map((r) => r.id)).toEqual([
			"a",
			"b",
			"c",
		]));
	it("mine = owner is the session actor", () =>
		expect(filterBuiltInView(rows, "mine", ME).map((r) => r.id)).toEqual([
			"a",
		]));
	it("mine with no actor is empty", () =>
		expect(filterBuiltInView(rows, "mine", null)).toEqual([]));
	it("unassigned = no owner", () =>
		expect(filterBuiltInView(rows, "unassigned", ME).map((r) => r.id)).toEqual([
			"c",
		]));
});

describe("toRows", () => {
	it("resolves names with fallbacks", () => {
		const out = toRows(
			[lead("a", ME), lead("b", OTHER), lead("c", null)],
			new Map([["c1", "Ada"]]),
			new Map([[ME, "Me"]]),
			{ unassigned: "None", unknownContact: "?" },
		);
		expect(out.map((r) => [r.contactName, r.ownerName])).toEqual([
			["Ada", "Me"],
			["Ada", OTHER.slice(0, 8)],
			["Ada", "None"],
		]);
	});
});

describe("bulk assign aggregation", () => {
	const items: BulkItem[] = [
		{ id: "1", version: 0, ownerId: OTHER },
		{ id: "2", version: 3, ownerId: ME },
		{ id: "3", version: 1, ownerId: OTHER },
		{ id: "4", version: 1, ownerId: null },
	];
	it("sequential, skips own, records partial failure and keeps going", async () => {
		const calls: string[] = [];
		const progress: number[] = [];
		const { summary } = await runBulkAssign(
			items,
			ME,
			async (i) => {
				calls.push(i.id);
				if (i.id === "3") throw err(409, "VERSION_CONFLICT");
			},
			(d) => progress.push(d),
		);
		expect(calls).toEqual(["1", "3", "4"]);
		expect(progress).toEqual([1, 2, 3, 4]);
		expect(summary.succeeded).toEqual(["1", "4"]);
		expect(summary.skipped).toEqual(["2"]);
		expect(summary.failed).toEqual([
			{ id: "3", kind: "version_conflict", code: "VERSION_CONFLICT" },
		]);
		expect(summary.tone).toBe("warning");
	});
	it("all failed is an error; all ok is success", async () => {
		const bad = await runBulkAssign(
			items.filter((i) => i.ownerId !== ME),
			ME,
			async () => {
				throw err(403, "FORBIDDEN");
			},
		);
		expect(bad.summary.tone).toBe("error");
		expect(bad.summary.failed).toHaveLength(3);
		const ok = await runBulkAssign(items, ME, async () => {});
		expect(ok.summary.tone).toBe("success");
	});
	it("a 401 aborts the rest and reports them as not attempted", async () => {
		const { summary } = await runBulkAssign(items, ME, async (i) => {
			if (i.id === "3") throw err(401, "UNAUTHENTICATED");
		});
		expect(summary.succeeded).toEqual(["1"]);
		expect(summary.notAttempted).toEqual(["4"]);
		expect(summary.tone).toBe("warning");
	});
	it("summarizeBulk of nothing attempted is success", () => {
		expect(summarizeBulk([], []).tone).toBe("success");
	});
});

describe("new lead form", () => {
	const ok = {
		...EMPTY_NEW_LEAD,
		title: " Intro ",
		contactName: "Ada",
		evidence: "Call",
	};
	it("requires title, contact name and evidence", () => {
		expect(validateNewLead(EMPTY_NEW_LEAD)).toEqual({
			title: "required",
			contactName: "required",
			evidence: "required",
		});
		expect(validateNewLead(ok)).toEqual({});
	});
	it("validates E.164 phone, email and length", () => {
		expect(validateNewLead({ ...ok, phone: "0100", email: "x" })).toEqual({
			phone: "phone",
			email: "email",
		});
		expect(
			validateNewLead({ ...ok, phone: "+201001234567", email: "a@b.co" }),
		).toEqual({});
		expect(validateNewLead({ ...ok, title: "x".repeat(161) }).title).toBe(
			"tooLong",
		);
	});
	it("builds an inline-contact body without empty identifiers", () => {
		const body = buildCreateBody(ok, "cmd");
		expect(body).toEqual({
			command_id: "cmd",
			title: "Intro",
			source_evidence: "Call",
			contact: { display_name: "Ada" },
		});
		const withIds = buildCreateBody(
			{ ...ok, phone: "+201001234567", ownerId: ME },
			"cmd",
		);
		expect(withIds.owner_id).toBe(ME);
		expect(
			(withIds.contact as { identifiers: unknown[] }).identifiers,
		).toHaveLength(1);
	});
	it("keeps the idempotency key for the same payload and rotates it when the payload changes", () => {
		let n = 0;
		const mk = () => `k${++n}`;
		const a = keyFor(null, ok, mk);
		expect(keyFor(a, ok, mk)).toBe(a);
		const b = keyFor(a, { ...ok, title: "Other" }, mk);
		expect(b.key).not.toBe(a.key);
	});
	it("classifies server errors", () => {
		expect(classifyCreateError(err(422, "VALIDATION_FAILED"))).toBe(
			"validation",
		);
		expect(classifyCreateError(err(403, "ASSIGNMENT_DENIED"))).toBe(
			"assignment",
		);
		expect(classifyCreateError(err(403, "FORBIDDEN"))).toBe("forbidden");
		expect(classifyCreateError(err(409, "IDEMPOTENCY_CONFLICT"))).toBe(
			"conflict",
		);
		expect(classifyCreateError(err(0, "NETWORK"))).toBe("network");
		expect(classifyCreateError(new Error("x"))).toBe("other");
	});
});

describe("patch body", () => {
	const l = lead("a", OTHER, { version: 4 });
	it("sends only changed fields plus expected_version", () => {
		const body = buildPatchBody(
			l,
			{ title: "New", status: "open", ownerId: OTHER },
			"cmd",
		);
		expect(body).toEqual({
			command_id: "cmd",
			expected_version: 4,
			title: "New",
		});
	});
	it("returns null when nothing changed", () => {
		expect(
			buildPatchBody(
				l,
				{ title: " T a ".trim(), status: "open", ownerId: OTHER },
				"cmd",
			),
		).toBeNull();
	});
	it("owner and status changes", () => {
		const body = buildPatchBody(
			l,
			{ title: l.title, status: "qualified", ownerId: ME },
			"cmd",
		);
		expect(body).toMatchObject({
			status: "qualified",
			owner_id: ME,
			expected_version: 4,
		});
	});
});

describe("mergeLatest", () => {
	it("newer overlay version wins, older is ignored, created leads come first", () => {
		const items = [
			lead("a", ME, { version: 1 }),
			lead("b", ME, { version: 2 }),
		];
		const overlay = new Map([
			["a", lead("a", OTHER, { version: 2 })],
			["b", lead("b", OTHER, { version: 1 })],
			["n1", lead("n1", ME)],
			["n2", lead("n2", ME)],
		]);
		const out = mergeLatest(items, overlay);
		expect(out.map((l) => l.id)).toEqual(["n2", "n1", "a", "b"]);
		expect(out.find((l) => l.id === "a")?.owner_id).toBe(OTHER);
		expect(out.find((l) => l.id === "b")?.owner_id).toBe(ME);
	});
});
