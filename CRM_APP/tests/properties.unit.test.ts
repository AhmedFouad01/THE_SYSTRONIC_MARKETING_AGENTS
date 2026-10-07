// ADR-002 P1b B3: pure unit tests of the ONE value validator (src/properties.ts). No database.
import { describe, expect, it } from "vitest";
import { Fault } from "../src/db.js";
import {
	type Actor,
	type Def,
	LIMITS,
	mergePlan,
	type Registry,
	searchSource,
	truncateBytes,
	validateProperties,
} from "../src/properties.js";

const def = (o: Partial<Def> & Pick<Def, "key" | "type">): Def => ({
	required: false,
	read_only: false,
	sensitive: false,
	searchable: false,
	validation: {},
	position: 0,
	archived: false,
	options: new Map(),
	...o,
});
const reg = (...defs: Def[]): Registry => ({
	object: "contact",
	defs: new Map(defs.map((d) => [d.key, d])),
});
const actor = (o: Partial<Actor> = {}): Actor => ({
	sensitiveRead: true,
	sensitiveWrite: true,
	assignable: new Set(),
	...o,
});
const fail = (fn: () => unknown) => {
	try {
		fn();
	} catch (e) {
		expect(e).toBeInstanceOf(Fault);
		return e as Fault;
	}
	throw new Error("expected a Fault");
};
const codes = (e: Fault) => (e.details ?? []).map((d) => `${d.property ?? ""}:${d.code}`);

describe("validateProperties", () => {
	const r = reg(
		def({ key: "t", type: "text", validation: { max_length: 5 } }),
		def({ key: "n", type: "number", validation: { min: -1, max: 10 } }),
		def({ key: "d", type: "date" }),
		def({ key: "dt", type: "datetime" }),
		def({ key: "s", type: "single_select", options: new Map([["a", false], ["old", true]]) }),
		def({ key: "m", type: "multi_select", validation: { max_selected: 2 }, options: new Map([["x", false], ["y", false], ["z", true]]) }),
		def({ key: "u", type: "user" }),
		def({ key: "ro", type: "text", read_only: true }),
		def({ key: "gone", type: "text", archived: true }),
		def({ key: "sec", type: "text", sensitive: true }),
	);
	const run = (patch: unknown, a = actor(), o = {}) => validateProperties(r, "contact", patch, a, o);

	it("normalises valid values and reports only effective changes", () => {
		const v = run({ t: " ab ", n: -0, d: "2024-02-29", dt: "2026-10-07T10:00:00+02:00", s: "a", m: ["x"] });
		expect(v.custom).toEqual({ t: "ab", n: 0, d: "2024-02-29", dt: "2026-10-07T08:00:00.000Z", s: "a", m: ["x"] });
		expect(v.changed).toEqual(["t", "n", "d", "dt", "s", "m"]);
		const same = run({ t: "ab", s: "a" }, actor(), { current: { t: "ab", s: "a", keep: 1 } });
		expect(same.changed).toEqual([]);
		expect(same.custom).toEqual({ t: "ab", s: "a", keep: 1 });
	});
	it("null, empty string and empty array clear; a missing key stays missing", () => {
		const v = run({ t: null, m: [], s: "" }, actor(), { current: { t: "x", m: ["x"], other: 1 } });
		expect(v.custom).toEqual({ other: 1 });
		expect(v.changed).toEqual(["t", "m"]);
	});
	it("rejects every invalid shape with a per-property code", () => {
		const cases: [Record<string, unknown>, string][] = [
			[{ t: 5 }, "t:INVALID_TYPE"],
			[{ t: "abcdef" }, "t:MAX_LENGTH"],
			[{ t: "a\u0000" }, "t:INVALID_VALUE"],
			[{ t: "‮" }, "t:INVALID_VALUE"],
			[{ n: Number.NaN }, "n:INVALID_VALUE"],
			[{ n: Number.POSITIVE_INFINITY }, "n:INVALID_VALUE"],
			[{ n: 11 }, "n:MAX_VALUE"],
			[{ n: -2 }, "n:MIN_VALUE"],
			[{ d: "2023-02-29" }, "d:INVALID_VALUE"],
			[{ d: "2024-00-10" }, "d:INVALID_VALUE"],
			[{ dt: "2026-10-07T10:00:00" }, "dt:INVALID_VALUE"],
			[{ dt: "2026-10-07T10:00:60Z" }, "dt:INVALID_VALUE"],
			[{ dt: "2026-10-07T10:00:00+24:00" }, "dt:INVALID_VALUE"],
			[{ s: "old" }, "s:OPTION_ARCHIVED"],
			[{ s: "zz" }, "s:OPTION_UNKNOWN"],
			[{ m: ["x", "y", "z"] }, "m:MAX_SELECTED"],
			[{ m: ["z"] }, "m:OPTION_ARCHIVED"],
			[{ m: ["x", "x"] }, "m:DUPLICATE_OPTION"],
			[{ u: "nope" }, "u:INVALID_VALUE"],
			[{ u: "11111111-1111-4111-8111-111111111111" }, "u:USER_INVALID"],
			[{ ro: "x" }, "ro:READ_ONLY"],
			[{ gone: "x" }, "gone:PROPERTY_ARCHIVED"],
		];
		for (const [patch, code] of cases) expect(codes(fail(() => run(patch))), JSON.stringify(patch)).toEqual([code]);
	});
	it("an archived option that is already stored is not a new write", () => {
		expect(run({ s: "old" }, actor(), { current: { s: "old" } }).changed).toEqual([]);
		expect(run({ m: ["z", "x"] }, actor(), { current: { m: ["z"] } }).custom.m).toEqual(["z", "x"]);
	});
	it("unknown keys, prototype keys and shape errors", () => {
		for (const k of ["nope", "__proto__", "constructor", "toString", "T", "a-b", "x".repeat(70)]) {
			const e = fail(() => run(JSON.parse(`{${JSON.stringify(k)}:1}`)));
			expect(e.code, k).toBe("UNKNOWN_PROPERTY");
			expect(e.status).toBe(422);
		}
		for (const bad of [null, "x", 5, [], true]) expect(fail(() => run(bad)).code).toBe("VALIDATION_FAILED");
		const wide = Object.fromEntries(Array.from({ length: LIMITS.patchKeys + 1 }, (_, i) => [`k${i}`, 1]));
		expect(codes(fail(() => run(wide)))).toEqual([":TOO_MANY_PROPERTIES"]);
		// the result never carries a prototype and a hostile key cannot pollute Object.prototype
		const v = run({ t: "a" });
		expect(Object.getPrototypeOf(v.custom)).toBeNull();
		expect(({} as Record<string, unknown>).polluted).toBeUndefined();
	});
	it("sensitive: unreadable looks unknown, readable-but-not-writable is 403, readable+writable works", () => {
		expect(fail(() => run({ sec: "x" }, actor({ sensitiveRead: false, sensitiveWrite: false }))).code).toBe("UNKNOWN_PROPERTY");
		const e = fail(() => run({ sec: "x" }, actor({ sensitiveRead: true, sensitiveWrite: false })));
		expect([e.status, e.code]).toEqual([403, "FORBIDDEN"]);
		expect(run({ sec: "x" }).custom).toEqual({ sec: "x" });
	});
	it("required: enforced on create (and on clearing), not on an update that does not touch it; invisible sensitive required is skipped", () => {
		const q = reg(
			def({ key: "must", type: "text", required: true }),
			def({ key: "hidden", type: "text", required: true, sensitive: true }),
			def({ key: "was", type: "text", required: true, archived: true }),
		);
		const create = (p: unknown, a = actor()) => validateProperties(q, "contact", p, a, { mode: "create" });
		expect(codes(fail(() => create(undefined)))).toEqual(["must:REQUIRED", "hidden:REQUIRED"]);
		expect(codes(fail(() => create({ must: " " })))).toEqual(["must:REQUIRED", "hidden:REQUIRED"]);
		expect(create({ must: "v", hidden: "h" }).custom).toEqual({ must: "v", hidden: "h" });
		expect(codes(fail(() => create(undefined, actor({ sensitiveRead: false, sensitiveWrite: false }))))).toEqual(["must:REQUIRED"]);
		expect(validateProperties(q, "contact", {}, actor(), { mode: "update", current: {} }).changed).toEqual([]);
		expect(codes(fail(() => validateProperties(q, "contact", { must: null }, actor(), { current: { must: "x" } })))).toEqual(["must:REQUIRED"]);
	});
	it("caps the merged blob", () => {
		const big = reg(def({ key: "l1", type: "long_text" }), def({ key: "l2", type: "long_text" }), def({ key: "l3", type: "long_text" }));
		const e = fail(() => validateProperties(big, "contact", { l3: "z".repeat(8100) }, actor(), { current: { l1: "x".repeat(8100), l2: "y".repeat(8100) } }));
		expect(e.code).toBe("PROPERTIES_TOO_LARGE");
	});
	it("refuses a registry for another object", () => {
		expect(fail(() => validateProperties(r, "lead", {}, actor())).status).toBe(500);
	});
});

describe("search text", () => {
	const r = reg(
		def({ key: "b", type: "text", searchable: true, position: 20 }),
		def({ key: "a", type: "long_text", searchable: true, position: 10 }),
		def({ key: "s", type: "text", searchable: true, sensitive: true }),
		def({ key: "x", type: "text" }),
		def({ key: "n", type: "number", searchable: true }),
		def({ key: "old", type: "text", searchable: true, archived: true }),
	);
	it("joins only searchable, active, non-sensitive text values in registry order", () => {
		expect(searchSource(r, { a: "one", b: "two", s: "sec", x: "no", n: 5, old: "gone" })).toBe("one\u001ftwo");
		expect(searchSource(r, {})).toBe("");
	});
	it("truncates on a UTF-8 boundary", () => {
		const s = `a${"ب".repeat(5000)}`;
		const t = truncateBytes(s, 8192);
		expect(Buffer.byteLength(t)).toBeLessThanOrEqual(8192);
		expect(Buffer.byteLength(t)).toBeGreaterThanOrEqual(8190);
		expect(t.includes("�")).toBe(false);
		expect(s.startsWith(t)).toBe(true);
		expect(truncateBytes("short", 8192)).toBe("short");
		expect(truncateBytes("😀😀", 5)).toBe("😀");
	});
});

describe("mergePlan", () => {
	it("target wins per key; source-only keys (or empty target values) fill in; sensitive keys can be left alone", () => {
		const p = mergePlan({ a: 1, b: "s", c: ["x"], d: "s", sec: "S" }, { a: 1, b: "t", e: 9, d: "" }, new Set(["sec"]));
		expect(p.fill).toEqual(["c", "d"]);
		expect(p.conflicts).toEqual(["b"]);
		expect(p.custom).toEqual({ a: 1, b: "t", c: ["x"], d: "s", e: 9 });
		expect(p.fits).toBe(true);
		expect(mergePlan({ l: "x".repeat(20000) }, { m: "y".repeat(8000) }).fits).toBe(false);
	});
});
