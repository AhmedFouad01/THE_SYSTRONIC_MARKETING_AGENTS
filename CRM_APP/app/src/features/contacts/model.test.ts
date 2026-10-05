import { describe, expect, it } from "vitest";
import { ApiError } from "../../api/errors.ts";
import {
	buildMergeBody,
	buildPatchBody,
	type Contact,
	classifyMergeError,
	draftOf,
	filterBuiltInView,
	identifierView,
	journeyActionKey,
	mergeFieldRows,
	mergeLatest,
	sortJourney,
	toRows,
	validateIdentifier,
} from "./model.ts";

const ME = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const contact = (id: string, over: Partial<Contact> = {}): Contact => ({
	id,
	display_name: `N ${id}`,
	owner_id: ME,
	source: "manual",
	version: 0,
	...over,
});
const err = (status: number, code: string) =>
	new ApiError({ status, code, safeMessage: "", requestId: null, retryable: false });

describe("views and rows", () => {
	const rows = [contact("a"), contact("b", { owner_id: OTHER }), contact("c", { owner_id: null })];
	it("mine keeps only the actor's contacts", () =>
		expect(filterBuiltInView(rows, "mine", ME).map((r) => r.id)).toEqual(["a"]));
	it("mine without an actor is empty, all keeps everything", () => {
		expect(filterBuiltInView(rows, "mine", null)).toEqual([]);
		expect(filterBuiltInView(rows, "all", null)).toHaveLength(3);
	});
	it("toRows resolves owner names, short id fallback, unassigned", () => {
		const r = toRows(rows, new Map([[ME, "Me"]]), "None");
		expect(r.map((x) => x.ownerName)).toEqual(["Me", OTHER.slice(0, 8), "None"]);
	});
	it("mergeLatest prefers newer versions and hides merged-away contacts", () => {
		const items = [contact("a"), contact("b")];
		const overlay = new Map([
			["a", contact("a", { version: 1, display_name: "New" })],
			["b", contact("b", { version: 0, display_name: "Stale overlay" })],
		]);
		const out = mergeLatest(items, overlay, new Set());
		expect(out[0]?.display_name).toBe("New");
		expect(out[1]?.display_name).toBe("N b");
		expect(mergeLatest(items, overlay, new Set(["a"])).map((c) => c.id)).toEqual(["b"]);
	});
});

describe("sensitive identifiers", () => {
	it("empty or missing identifiers are hidden (redacted or none)", () => {
		expect(identifierView({}).state).toBe("hidden");
		expect(identifierView({ identifiers: [] }).state).toBe("hidden");
	});
	it("returned identifiers are visible", () => {
		const v = identifierView({
			identifiers: [{ id: "i", kind: "email", value: "a@b.co", provenance: "p", original_contact_id: "a" }],
		});
		expect(v.state).toBe("visible");
	});
	it("validates E.164 phones and emails; empty is fine", () => {
		expect(validateIdentifier("phone", "+20 100 123 4567")).toBeNull();
		expect(validateIdentifier("phone", "0100")).toBe("phone");
		expect(validateIdentifier("email", "x@y.zz")).toBeNull();
		expect(validateIdentifier("email", "nope")).toBe("email");
		expect(validateIdentifier("email", "  ")).toBeNull();
	});
});

describe("patch body", () => {
	const c = contact("a");
	it("null when nothing changed", () => expect(buildPatchBody(c, draftOf(c), "cmd")).toBeNull());
	it("only changed fields plus expected_version and command_id", () => {
		const d = { ...draftOf(c), name: "  Renamed ", ownerId: OTHER };
		expect(buildPatchBody(c, d, "cmd")).toEqual({
			command_id: "cmd",
			expected_version: 0,
			display_name: "Renamed",
			owner_id: OTHER,
		});
	});
	it("adds one identifier with manual provenance", () => {
		const d = { ...draftOf(c), idKind: "email" as const, idValue: " a@b.co " };
		expect(buildPatchBody(c, d, "cmd")?.identifiers).toEqual([
			{ kind: "email", value: "a@b.co", provenance: "manual_entry" },
		]);
	});
});

describe("journey", () => {
	it("orders chronologically with id tiebreak", () => {
		const ev = (id: string, at: string) => ({ id, name: "x", occurred_at: at });
		const out = sortJourney([ev("b", "2026-10-05T10:00:00Z"), ev("a", "2026-10-05T10:00:00Z"), ev("c", "2026-10-05T09:00:00Z")]);
		expect(out.map((e) => e.id)).toEqual(["c", "a", "b"]);
	});
	it("maps known actions to label keys, unknown to null", () => {
		expect(journeyActionKey("deal.stage_changed")).toBe("deal_stage_changed");
		expect(journeyActionKey("contact.merge_received")).toBe("contact_merge_received");
		expect(journeyActionKey("weird.thing")).toBeNull();
	});
});

describe("merge", () => {
	it("target wins; differing source values are flagged", () => {
		const f = mergeFieldRows(
			{ display_name: "A", ownerName: "X", source: "manual" },
			{ display_name: "B", ownerName: "X", source: "manual" },
		);
		expect(f.find((x) => x.field === "display_name")).toMatchObject({ result: "B", differs: true });
		expect(f.find((x) => x.field === "owner")).toMatchObject({ result: "X", differs: false });
	});
	it("merge body carries the preview versions and command id", () => {
		const b = buildMergeBody(
			{ source_id: "s", target_id: "t", source_version: 2, target_version: 3, conflicts: [], affected: { leads: 0, deals: 0, tasks: 0, identifiers: 0 } },
			"cmd",
		);
		expect(b).toEqual({ command_id: "cmd", source_id: "s", target_id: "t", source_version: 2, target_version: 3 });
	});
	it("classifies merge errors", () => {
		expect(classifyMergeError(err(409, "VERSION_CONFLICT"))).toBe("stale");
		expect(classifyMergeError(err(403, "FORBIDDEN"))).toBe("forbidden");
		expect(classifyMergeError(err(0, "NETWORK"))).toBe("network");
		expect(classifyMergeError(new Error("x"))).toBe("other");
		expect(classifyMergeError(err(500, "X"))).toBe("other");
	});
});
