import { describe, expect, it } from "vitest";
import { ApiError } from "../../api/errors.ts";
import {
	leadStripTone,
	type BulkItem,
	buildCreateBody,
	buildPatchBody,
	classifyCreateError,
	EMPTY_NEW_LEAD,
	builtInViewNodes,
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

describe("built-in views (server conditions)", () => {
	it("all adds nothing", () => expect(builtInViewNodes("all", ME)).toEqual([]));
	it("mine = owner_id eq the session actor", () =>
		expect(builtInViewNodes("mine", ME)).toEqual([{ p: "owner_id", op: "eq", v: ME }]));
	it("mine with no actor matches nothing", () =>
		expect(builtInViewNodes("mine", null)).toEqual([{ p: "id", op: "is_null" }]));
	it("unassigned = owner_id is null", () =>
		expect(builtInViewNodes("unassigned", ME)).toEqual([{ p: "owner_id", op: "is_null" }]));
});

describe("toRows", () => {
	it("names come from expand, owners fall back to the directory, then to neutral labels", () => {
		const out = toRows(
			[
				lead("a", ME, { contact: { id: "c1", display_name: "Ada" }, owner: { id: ME, name: "Me" } }),
				lead("b", OTHER, { contact: { id: "c1", restricted: true } }),
				lead("c", null),
			],
			new Map([[OTHER, "Other"]]),
			{ unassigned: "None", unknownContact: "?", unknownOwner: "Someone" },
		);
		expect(out.map((r) => [r.contactName, r.ownerName])).toEqual([
			["Ada", "Me"],
			["?", "Other"],
			["?", "None"],
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
		email: "ada@example.test",
		evidence: "Call",
	};
	it("requires title, contact name and evidence", () => {
		expect(validateNewLead(EMPTY_NEW_LEAD)).toEqual({
			contactChannels: "contactRequired",
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
			contact: { display_name: "Ada", identifiers: [{kind:"email",value:"ada@example.test",provenance:"manual_entry"}] },
		});
		const withIds = buildCreateBody(
			{ ...ok, email: "", phone: "+201001234567", ownerId: ME },
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

describe("leads KPI strip", () => {
	it("only qualified > 0 is emphasised", () => {
		expect(leadStripTone("qualified", { count: 1, capped: false })).toBe("neutral");
		expect(leadStripTone("open", { count: 5, capped: false })).toBe("neutral");
		expect(leadStripTone("closed", { count: 5, capped: true })).toBe("neutral");
		expect(leadStripTone("qualified", { count: 0, capped: false })).toBe("neutral");
	});
});

describe("corrected R10 contact channels",()=>{
 const form={...EMPTY_NEW_LEAD,title:"Lead",contactName:"Name",evidence:"Manual"};
 it("name alone and whitespace fail; phone-only/email-only/both succeed",()=>{
  expect(validateNewLead(form).contactChannels).toBe("contactRequired");
  expect(validateNewLead({...form,phone:"  ",email:"  "}).contactChannels).toBe("contactRequired");
  for (const channels of [{phone:"01001234567"},{email:"valid@example.test"},{phone:"01001234567",email:"valid@example.test"}]) expect(validateNewLead({...form,...channels})).toEqual({});
  expect(validateNewLead({...form,email:"•••• (Hidden)"}).email).toBe("email");
 });
 it("missing contact preset sends a boolean server filter",()=>{expect(builtInViewNodes("missing_contact",ME)).toEqual([{p:"missing_contact",op:"eq",v:true}]);});
});
