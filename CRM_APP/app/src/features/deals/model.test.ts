import { describe, expect, it } from "vitest";
import { ApiError } from "../../api/errors.ts";
import { formatMoney } from "../../ui/i18n/format.ts";
import {
	allowedTargets,
	applyTransition,
	buildCreateBody,
	buildPatchBody,
	buildTransitionBody,
	currencyChoices,
	groupAmount,
	sanitizeAmountInput,
	splitMoves,
	stagePosition,
	stepperSteps,
	classifyTransitionError,
	type Deal,
	dealContextSearch,
	dealValueText,
	draftOf,
	EMPTY_NEW_DEAL,
	initialStages,
	keyFor,
	mergeLatest,
	type Pipeline,
	parseDealContext,
	parseMajorToMinor,
	parseSelect,
	validateNewDeal,
	validateReason,
} from "./model.ts";

const C = "11111111-1111-4111-8111-111111111111";
const L = "22222222-2222-4222-8222-222222222222";
const D = "33333333-3333-4333-8333-333333333333";

const stage = (
	id: string,
	name: string,
	position: number,
	outcome: "won" | "lost" | null = null,
	archived = false,
) => ({
	id,
	name,
	position,
	outcome,
	archived,
});
const pipeline: Pipeline = {
	id: "p1",
	name: "Sales",
	stages: [
		stage("lost", "Lost", 3, "lost"),
		stage("new", "New", 0),
		stage("qual", "Qualified", 1),
		stage("won", "Won", 2, "won"),
		stage("old", "Old", 4, null, true),
	],
	transitions: [
		{ from_stage: "new", to_stage: "qual" },
		{ from_stage: "new", to_stage: "lost" },
		{ from_stage: "qual", to_stage: "won" },
		{ from_stage: "qual", to_stage: "lost" },
		{ from_stage: "qual", to_stage: "old" },
	],
};
const deal: Deal = {
	id: D,
	contact_id: C,
	lead_id: null,
	pipeline_id: "p1",
	stage_id: "new",
	owner_id: "o1",
	title: "Deal",
	amount_minor: 125050,
	currency: "EGP",
	version: 2,
};

describe("allowed transitions", () => {
	it("offers only configured edges, in stage order", () => {
		expect(allowedTargets(pipeline, "new").map((s) => s.id)).toEqual([
			"qual",
			"lost",
		]);
		expect(allowedTargets(pipeline, "qual").map((s) => s.id)).toEqual([
			"won",
			"lost",
		]);
	});
	it("never offers the invalid edge, archived stages, or the current stage", () => {
		expect(allowedTargets(pipeline, "new").some((s) => s.id === "won")).toBe(
			false,
		);
		expect(allowedTargets(pipeline, "qual").some((s) => s.id === "old")).toBe(
			false,
		);
		expect(allowedTargets(pipeline, "won")).toEqual([]);
		expect(allowedTargets(undefined, "new")).toEqual([]);
	});
	it("initial stages are non-terminal and not archived", () => {
		expect(initialStages(pipeline).map((s) => s.id)).toEqual(["new", "qual"]);
	});
	it("lost requires a trimmed reason; others do not", () => {
		const lost = pipeline.stages.find((s) => s.id === "lost");
		const won = pipeline.stages.find((s) => s.id === "won");
		if (!lost || !won) throw new Error("fixture");
		expect(validateReason(lost, "  ")).toBe("reasonRequired");
		expect(validateReason(lost, "price")).toBeNull();
		expect(validateReason(won, "")).toBeNull();
		expect(validateReason(won, "x".repeat(501))).toBe("reasonTooLong");
	});
	it("builds the transition body with expected_version and folds the result", () => {
		const lost = pipeline.stages[0];
		if (!lost) throw new Error("fixture");
		expect(buildTransitionBody(deal, lost, " price ", "c1")).toEqual({
			command_id: "c1",
			to_stage_id: "lost",
			expected_version: 2,
			reason: "price",
		});
		expect(
			applyTransition(deal, { version: 3, stage_id: "qual" }),
		).toMatchObject({ stage_id: "qual", version: 3 });
	});
	it("classifies transition errors", () => {
		const err = (status: number, code: string) =>
			new ApiError({
				status,
				code,
				safeMessage: "",
				requestId: null,
				retryable: false,
			});
		expect(classifyTransitionError(err(409, "VERSION_CONFLICT"))).toBe(
			"conflict",
		);
		expect(classifyTransitionError(err(422, "INVALID_TRANSITION"))).toBe(
			"invalid",
		);
		expect(classifyTransitionError(err(422, "LOSS_REASON_REQUIRED"))).toBe(
			"reason",
		);
		expect(classifyTransitionError(err(403, "FORBIDDEN"))).toBe("forbidden");
		expect(classifyTransitionError(new Error("x"))).toBe("other");
	});
});

describe("money", () => {
	it("parses major text to integer minor units", () => {
		expect(parseMajorToMinor("")).toBe(0);
		expect(parseMajorToMinor("1250")).toBe(125000);
		expect(parseMajorToMinor("12.5")).toBe(1250);
		expect(parseMajorToMinor("0.07")).toBe(7);
		expect(parseMajorToMinor("1.234")).toBeNull();
		expect(parseMajorToMinor("-1")).toBeNull();
		expect(parseMajorToMinor("1,250")).toBeNull();
	});
	it("formats through the shared formatMoney (major units + ISO code)", () => {
		const fm = (v: number, o?: { currency?: string; compact?: boolean }) =>
			formatMoney(v, "en", o);
		const n = (s: string) => s.replace(/ /g, " ");
		expect(n(dealValueText(deal, fm))).toBe("EGP 1,250.50");
		expect(n(dealValueText({ amount_minor: 100, currency: "USD" }, fm))).toBe(
			"$1",
		);
	});
});

describe("create / edit bodies", () => {
	const input = {
		...EMPTY_NEW_DEAL,
		title: " Big deal ",
		contactId: C,
		pipelineId: "p1",
		stageId: "new",
		amount: "10.25",
		currency: "egp",
	};
	it("requires contact, pipeline, stage, title; validates amount/currency", () => {
		expect(Object.keys(validateNewDeal(EMPTY_NEW_DEAL)).sort()).toEqual([
			"contactId",
			"pipelineId",
			"stageId",
			"title",
		]);
		expect(validateNewDeal(input)).toEqual({});
		expect(validateNewDeal({ ...input, amount: "x" }).amount).toBe("amount");
		expect(validateNewDeal({ ...input, currency: "EG" }).currency).toBe(
			"currency",
		);
	});
	it("builds the POST body with the lead link only when present", () => {
		expect(buildCreateBody(input, L, "k")).toEqual({
			command_id: "k",
			contact_id: C,
			lead_id: L,
			pipeline_id: "p1",
			stage_id: "new",
			title: "Big deal",
			amount_minor: 1025,
			currency: "EGP",
		});
		expect("lead_id" in buildCreateBody(input, null, "k")).toBe(false);
	});
	it("reuses the idempotency key for the same payload only", () => {
		const a = keyFor(null, input, L, () => "k1");
		expect(keyFor(a, input, L, () => "k2").key).toBe("k1");
		expect(keyFor(a, { ...input, title: "other" }, L, () => "k2").key).toBe(
			"k2",
		);
	});
	it("PATCH carries only changed fields, never stage_id", () => {
		expect(buildPatchBody(deal, draftOf(deal), "c")).toBeNull();
		expect(
			buildPatchBody(
				deal,
				{ ...draftOf(deal), title: "New", amount: "5" },
				"c",
			),
		).toEqual({
			command_id: "c",
			expected_version: 2,
			title: "New",
			amount_minor: 500,
		});
	});
	it("mergeLatest prefers newer versions and lists new deals first", () => {
		const newer = { ...deal, version: 5, title: "Newer" };
		const fresh = { ...deal, id: "x", version: 0 };
		const out = mergeLatest(
			[deal],
			new Map([
				[deal.id, newer],
				["x", fresh],
			]),
		);
		expect(out.map((d) => d.id)).toEqual(["x", D]);
		expect(out[1]?.title).toBe("Newer");
	});
});

describe("Lead -> Contact -> Deal context", () => {
	it("round-trips through the query string", () => {
		const ctx = { contactId: C, leadId: L, dealId: null };
		expect(parseDealContext(dealContextSearch(ctx))).toEqual(ctx);
		expect(parseDealContext(dealContextSearch({ ...ctx, dealId: D }))).toEqual({
			...ctx,
			dealId: D,
		});
		expect(dealContextSearch(null)).toBe("");
	});
	it("contact-only context has no lead", () => {
		expect(parseDealContext(`?contact=${C}`)).toEqual({
			contactId: C,
			leadId: null,
			dealId: null,
		});
	});
	it("rejects missing or malformed ids", () => {
		expect(parseDealContext("")).toBeNull();
		expect(parseDealContext("?contact=not-a-uuid")).toBeNull();
		expect(parseDealContext(`?lead=${L}`)).toBeNull();
		expect(parseDealContext(`?contact=${C}&lead=zzz`)?.leadId).toBeNull();
		expect(parseSelect(`?select=${L}`)).toBe(L);
		expect(parseSelect("?select=zzz")).toBeNull();
	});
});

describe("stage stepper", () => {
	const states = (id: string) =>
		stepperSteps(pipeline, id).map((s) => `${s.stage.id}:${s.state}`);
	it("marks done / current / upcoming along the forward path (lost and archived are off the path)", () => {
		expect(states("new")).toEqual(["new:current", "qual:upcoming", "won:upcoming"]);
		expect(states("qual")).toEqual(["new:done", "qual:current", "won:upcoming"]);
	});
	it("a won deal shows every earlier step done and the terminal as won", () => {
		expect(states("won")).toEqual(["new:done", "qual:done", "won:won"]);
	});
	it("a lost deal keeps the path upcoming and appends the lost step", () => {
		expect(states("lost")).toEqual([
			"new:upcoming",
			"qual:upcoming",
			"won:upcoming",
			"lost:lost",
		]);
	});
	it("keeps a current archived stage on the path; unknown stage or pipeline gives nothing", () => {
		expect(states("old")).toEqual([
			"new:done",
			"qual:done",
			"won:done",
			"old:current",
		]);
		expect(stepperSteps(pipeline, "nope")).toEqual([]);
		expect(stepperSteps(undefined, "new")).toEqual([]);
	});
	it("position counts the forward path only", () => {
		expect(stagePosition(pipeline, "qual")).toEqual({ index: 2, total: 3 });
		expect(stagePosition(pipeline, "lost")).toBeNull();
		expect(stagePosition(undefined, "qual")).toBeNull();
	});
	it("splits allowed edges into Mark won, Mark lost and the stage menu", () => {
		const m = splitMoves(allowedTargets(pipeline, "qual"));
		expect(m.won?.id).toBe("won");
		expect(m.lost?.id).toBe("lost");
		expect(m.others.map((s) => s.id)).toEqual([]);
		const n = splitMoves(allowedTargets(pipeline, "new"));
		expect(n.won).toBeNull();
		expect(n.lost?.id).toBe("lost");
		expect(n.others.map((s) => s.id)).toEqual(["qual"]);
	});
});

describe("amount input and currencies", () => {
	it("sanitizes typed text (separators, Arabic digits, junk) to plain decimal text", () => {
		expect(sanitizeAmountInput("1,250.5")).toBe("1250.5");
		expect(sanitizeAmountInput("٢٩٦٬٩٠٠٫٥٠")).toBe("296900.50");
		expect(sanitizeAmountInput("12ab.3.4")).toBe("12.34");
		expect(sanitizeAmountInput("1.234")).toBe("1.23");
		expect(sanitizeAmountInput("1234567890123")).toBe("123456789012");
		expect(sanitizeAmountInput("")).toBe("");
	});
	it("groups thousands and keeps a trailing dot while typing", () => {
		expect(groupAmount("296900")).toBe("296,900");
		expect(groupAmount("1234567.5")).toBe("1,234,567.5");
		expect(groupAmount("12.")).toBe("12.");
		expect(groupAmount("")).toBe("");
		expect(parseMajorToMinor(sanitizeAmountInput(groupAmount("2500.50")))).toBe(250050);
	});
	it("offers EGP first plus the codes in the data and the record's own", () => {
		expect(currencyChoices(["USD", "EGP", "bad", "AED"], "SAR")).toEqual([
			"EGP",
			"AED",
			"SAR",
			"USD",
		]);
		expect(currencyChoices([])).toEqual(["EGP"]);
	});
});
