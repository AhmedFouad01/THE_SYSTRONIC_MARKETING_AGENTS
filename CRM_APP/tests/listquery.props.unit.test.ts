// P1b B4: the custom-property side of the list compiler (pure: no database). Golden SQL per type/operator, injection fuzz on
// keys / operators / values, cursor round trip and staleness, allow-list behaviour.
import { describe, expect, it } from "vitest";
import { Fault } from "../src/db.js";
import { customKeys, encodeCursor, planList } from "../src/listquery.js";
import type { ListProp, PropRegistry } from "../src/properties.js";

const T = "00000000-0000-4000-8000-000000000001";
const U = "00000000-0000-4000-8000-0000000000aa";
const tenant = { mode: "tenant", actor: U };
const defs: ListProp[] = [
	{ key: "budget", type: "number", options: [] },
	{ key: "price", type: "currency", options: [] },
	{ key: "nick", type: "text", options: [] },
	{ key: "notes", type: "long_text", options: [] },
	{ key: "since", type: "date", options: [] },
	{ key: "seen", type: "datetime", options: [] },
	{ key: "stage2", type: "single_select", options: ["cold", "warm", "hot"] },
	{ key: "tags", type: "multi_select", options: ["a", "b", "c"] },
	{ key: "vip", type: "checkbox", options: [] },
	{ key: "buyer", type: "user", options: [] },
];
const reg = (rev = 3): PropRegistry => ({
	rev,
	defs: new Map(defs.map((d) => [d.key, d])),
});
const j = JSON.stringify;
const plan = (qs: Record<string, string>, props: PropRegistry | null = reg(), scope = tenant) =>
	planList("lead", new URLSearchParams(qs), T, scope, props ?? undefined);
const f = (n: unknown) => ({ filter: j(n) });
const bad = (fn: () => unknown, code = "VALIDATION_FAILED") => {
	try {
		fn();
	} catch (e) {
		expect(e).toBeInstanceOf(Fault);
		expect((e as Fault).status).toBe(422);
		expect((e as Fault).code).toBe(code);
		return;
	}
	throw new Error("expected a Fault");
};

describe("B4 custom filters: golden SQL, parameters only", () => {
	it("number: guarded numeric read, key and value are bound", () => {
		const p = plan(f({ p: "budget", op: "gte", v: 500 }));
		expect(p.sql).toContain(
			"(CASE WHEN jsonb_typeof(custom->$2::text)='number' THEN (custom->>$2::text)::numeric END) >= $3::numeric",
		);
		expect(p.params).toEqual([T, "budget", 500]);
		expect(p.sql).not.toContain("budget");
	});
	it("between / in / nin / is_null per type", () => {
		const b = plan(f({ p: "price", op: "between", v: [100, 900] }));
		expect(b.sql).toContain("BETWEEN $3::numeric AND $4::numeric");
		const i = plan(f({ p: "stage2", op: "in", v: ["cold", "hot"] }));
		expect(i.sql).toContain("= ANY($3::text[])");
		expect(i.params[2]).toEqual(["cold", "hot"]);
		const n = plan(f({ p: "stage2", op: "nin", v: ["cold"] }));
		expect(n.sql).toContain("IS NULL OR");
		expect(n.sql).toContain("<> ALL($3::text[])");
		expect(plan(f({ p: "nick", op: "is_null" })).sql).toContain(" IS NULL");
		expect(plan(f({ p: "tags", op: "not_null" })).sql).toContain("jsonb_typeof(custom->$2::text)='array'");
		expect(plan(f({ p: "vip", op: "is_null" })).sql).toContain("IS DISTINCT FROM 'boolean'");
	});
	it("date / datetime compare as normalised text", () => {
		const d = plan(f({ p: "since", op: "between", v: ["2026-01-01", "2026-12-31"] }));
		expect(d.sql).toContain("BETWEEN $3::text AND $4::text");
		const t = plan(f({ p: "seen", op: "gt", v: "2026-05-01T10:00:00+02:00" }));
		expect(t.params[2]).toBe("2026-05-01T08:00:00.000Z");
		bad(() => plan(f({ p: "since", op: "eq", v: "2026-02-30" })));
		bad(() => plan(f({ p: "since", op: "eq", v: "yesterday" })));
	});
	it("text: eq/contains/starts_with with escaped bound patterns", () => {
		const c = plan(f({ p: "nick", op: "contains", v: "50%_x" }));
		expect(c.sql).toContain("ILIKE $3 ESCAPE");
		expect(c.params[2]).toBe("%50\\%\\_x%");
		expect(plan(f({ p: "nick", op: "starts_with", v: "ab" })).params[2]).toBe("ab%");
		bad(() => plan(f({ p: "notes", op: "eq", v: "x" })), "VALIDATION_FAILED"); // long_text: contains only
		expect(plan(f({ p: "notes", op: "contains", v: "x" })).sql).toContain("ILIKE");
	});
	it("multi-select has_any / has_all, checkbox is, user eq", () => {
		const any = plan(f({ p: "tags", op: "has_any", v: ["a", "c"] }));
		expect(any.sql).toContain("unnest($3::text[])");
		expect(any.sql).toContain("@> to_jsonb(w.v)");
		expect(any.params[2]).toEqual(["a", "c"]);
		const all = plan(f({ p: "tags", op: "has_all", v: ["a", "b"] }));
		expect(all.sql).toContain("@> $3::jsonb");
		expect(all.params[2]).toBe('["a","b"]');
		expect(plan(f({ p: "vip", op: "is", v: true })).sql).toContain("='true'::jsonb");
		expect(plan(f({ p: "vip", op: "is", v: false })).sql).toContain("NOT coalesce(");
		bad(() => plan(f({ p: "vip", op: "eq", v: true })));
		bad(() => plan(f({ p: "vip", op: "is", v: "true" })));
		expect(plan(f({ p: "buyer", op: "eq", v: U.toUpperCase() })).params[2]).toBe(U);
		bad(() => plan(f({ p: "buyer", op: "eq", v: "not-a-uuid" })));
	});
	it("operators outside the type's set are refused", () => {
		bad(() => plan(f({ p: "tags", op: "eq", v: "a" })));
		bad(() => plan(f({ p: "tags", op: "has_any", v: ["zzz"] }))); // unknown option
		bad(() => plan(f({ p: "stage2", op: "gt", v: "cold" })));
		bad(() => plan(f({ p: "nick", op: "has_any", v: ["a"] })));
		bad(() => plan(f({ p: "budget", op: "eq", v: "5" })));
		bad(() => plan(f({ p: "budget", op: "eq", v: 1e16 })));
		bad(() => plan(f({ p: "budget", op: "eq", v: Number.NaN })));
		bad(() => plan(f({ p: "stage2", op: "eq", v: "nope" })));
	});
	it("one key is bound once however often it is used (filter + sort + keyset)", () => {
		const p = plan({ ...f({ and: [{ p: "budget", op: "gt", v: 1 }, { p: "budget", op: "lt", v: 9 }] }), sort: "-budget" });
		expect(p.params.filter((x) => x === "budget")).toHaveLength(1);
	});
	it("composes with system fields, AND/OR depth and the rep scope", () => {
		const p = plan(
			f({ and: [{ p: "status", op: "eq", v: "open" }, { or: [{ p: "tags", op: "has_any", v: ["a"] }, { p: "nick", op: "eq", v: "x" }] }] }),
			reg(),
			{ mode: "assigned", actor: U },
		);
		expect(p.sql).toContain("owner_id=$2::uuid");
		expect(p.sql).toContain("status = $");
	});
});

describe("B4 allow-list and unknown properties", () => {
	it("unknown / archived / unreadable keys are UNKNOWN_PROPERTY (they are simply absent from the map)", () => {
		bad(() => plan(f({ p: "ghost", op: "eq", v: 1 })), "UNKNOWN_PROPERTY");
		bad(() => plan({ sort: "ghost" }), "UNKNOWN_PROPERTY");
		try {
			plan(f({ p: "ghost", op: "eq", v: 1 }));
		} catch (e) {
			expect((e as Fault).details).toEqual([{ field: "filter", property: "ghost", code: "UNKNOWN_PROPERTY" }]);
		}
	});
	it("without a registry the static compiler is unchanged (unknown name = VALIDATION_FAILED)", () => {
		bad(() => plan(f({ p: "budget", op: "eq", v: 1 }), null));
		bad(() => plan({ sort: "budget" }, null));
	});
	it("system fields win over a same-named key and keep their old errors", () => {
		const p = plan(f({ p: "title", op: "eq", v: "x" }));
		expect(p.sql).toContain("title = $2::text");
		bad(() => plan(f({ p: "contact_name", op: "eq", v: "x" })));
	});
	it("customKeys: only key-shaped, non-system names from filter and sort", () => {
		const q = new URLSearchParams({ filter: j({ and: [{ p: "budget", op: "eq", v: 1 }, { or: [{ p: "status", op: "eq", v: "open" }, { p: "nick", op: "is_null" }] }] }), sort: "-since,title" });
		expect(customKeys(q).sort()).toEqual(["budget", "nick", "since"]);
		expect(customKeys(new URLSearchParams({ filter: "{not json", sort: "x'y" }))).toEqual([]);
		expect(customKeys(new URLSearchParams({ filter: j({ p: "Bad-Key" }) }))).toEqual([]);
	});
});

describe("B4 injection fuzz: nothing request-controlled reaches SQL text", () => {
	const evil = ["x'; DROP TABLE crm.lead;--", "a\" OR 1=1 --", "$1", "\\", "%", "a\0b", "custom->>'x'", "') OR ('1'='1", "ن'؛ DROP"];
	it("hostile property keys are refused before any SQL is built", () => {
		for (const k of evil) {
			bad(() => plan(f({ p: k, op: "eq", v: 1 })));
			bad(() => plan({ sort: k }));
			bad(() => plan({ sort: `-${k}` }));
		}
		expect(customKeys(new URLSearchParams({ filter: j({ p: evil[0], op: "eq", v: 1 }) }))).toEqual([]);
	});
	it("hostile operators are refused", () => {
		for (const op of ["= 1 OR 1=1 --", "eq; DROP", "EQ", "__proto__", ""]) bad(() => plan(f({ p: "nick", op, v: "x" })));
		bad(() => plan(f({ p: "nick", op: ["eq"], v: "x" })));
	});
	it("hostile values only ever become bound parameters", () => {
		for (const v of evil.filter((x) => !x.includes("\0"))) {
			const p = plan(f({ and: [{ p: "nick", op: "eq", v }, { p: "nick", op: "contains", v }, { p: "stage2", op: "eq", v: "cold" }] }));
			expect(p.sql).not.toContain("DROP");
			expect(p.sql).not.toContain("1=1");
			expect(p.params).toContain(v.normalize("NFC"));
		}
		bad(() => plan(f({ p: "nick", op: "eq", v: "a\0b" })));
		bad(() => plan(f({ p: "nick", op: "eq", v: { $ne: 1 } })));
		bad(() => plan(f({ p: "nick", op: "eq", v: "x", extra: 1 })));
	});
	it("a property named like a SQL fragment cannot exist in the map to begin with, and cannot be injected through it either", () => {
		const evilMap: PropRegistry = { rev: 1, defs: new Map([["nick", { key: "nick", type: "text", options: ["x'); DROP--"] }]]) };
		const p = plan({ sort: "nick" }, evilMap);
		expect(p.sql).not.toContain("DROP");
		const s = planList("lead", new URLSearchParams({ sort: "stg" }), T, tenant, {
			rev: 1,
			defs: new Map([["stg", { key: "stg", type: "single_select", options: ["x'); DROP--", "ok"] }]]),
		});
		expect(s.sql).not.toContain("DROP");
	});
});

describe("B4 sort: expressions, default null order, keyset", () => {
	it("sortable types compile to guarded expressions; others are refused", () => {
		const n = plan({ sort: "-budget" });
		expect(n.sql).toContain("ORDER BY (CASE WHEN jsonb_typeof(custom->$2::text)='number' THEN (custom->>$2::text)::numeric END) DESC,id DESC");
		expect(n.sql).not.toContain("NULLS LAST"); // default null ordering: ASC nulls last, DESC nulls first (index-servable)
		expect(plan({ sort: "nick" }).sql).toContain("ORDER BY (CASE WHEN jsonb_typeof(custom->$2::text)='string' THEN custom->>$2::text END) ASC,id ASC");
		const s = plan({ sort: "stage2" });
		expect(s.sql).toContain("array_position($2::text[],(CASE WHEN jsonb_typeof(custom->$3::text)='string'");
		expect(s.params[1]).toEqual(["cold", "warm", "hot"]);
		for (const k of ["notes", "tags", "vip", "buyer"]) bad(() => plan({ sort: k }));
		bad(() => plan({ sort: "budget,-budget" }));
		bad(() => plan({ sort: "budget,nick,since" }));
	});
	it("the count query never references sort parameters", () => {
		const p = plan({ ...f({ p: "nick", op: "eq", v: "x" }), sort: "-budget", include_total: "1" });
		expect(p.countParams.length).toBeLessThan(p.params.length);
		const max = Math.max(...[...p.countSql.matchAll(/\$(\d+)/g)].map((m) => +m[1]));
		expect(max).toBe(p.countParams.length);
	});
	const pageAfter = (sort: string, raw: unknown, extra: Record<string, string> = {}, props = reg()) => {
		const p0 = plan({ sort, ...extra }, props);
		const c = encodeCursor({ id: T, ...Object.fromEntries((Array.isArray(raw) ? raw : [raw]).map((v, i) => [`_k${i}`, v])) }, p0.keys, p0.fp);
		return plan({ sort, cursor: c, ...extra }, props);
	};
	it("single custom key: row-value keyset, nulls last ascending", () => {
		const a = pageAfter("budget", "10.5");
		expect(a.sql).toMatch(/\(\(CASE.*END\),id\) > \(\$\d+::numeric,\$\d+::uuid\) OR \(CASE.*END\) IS NULL/);
		const an = pageAfter("budget", null);
		expect(an.sql).toMatch(/END\) IS NULL AND id > \$\d+::uuid/);
	});
	it("single custom key descending: nulls first, row value only for a non-null cursor", () => {
		const d = pageAfter("-budget", "10.5");
		expect(d.sql).toMatch(/END\),id\) < \(\$\d+::numeric,\$\d+::uuid\)\)/);
		expect(d.sql).not.toContain(" OR (CASE WHEN jsonb_typeof(custom->$2::text)='number' THEN (custom->>$2::text)::numeric END) IS NULL");
		const dn = pageAfter("-budget", null);
		expect(dn.sql).toMatch(/END\) IS NULL AND id < \$\d+::uuid\) OR \(CASE.*END\) IS NOT NULL/);
	});
	it("two keys (custom + system, mixed or same direction) use the OR-chain with the same null rules", () => {
		const m = pageAfter("-nick,created_at", ["ali", "2026-01-01T00:00:00.123456Z"]);
		expect(m.sql).toContain("< $");
		expect(m.sql).toContain(" OR ");
		const nulls = pageAfter("-nick,created_at", [null, "2026-01-01T00:00:00.123456Z"]);
		expect(nulls.sql).toContain("IS NOT NULL");
		const asc = pageAfter("nick,title", [null, "t"]);
		expect(asc.sql).not.toContain("IS NOT NULL"); // ASC: a NULL cursor value has nothing after it
	});
	it("cursor values are validated per type and fingerprint binds sort, filter and schema_rev", () => {
		const p0 = plan({ sort: "budget" });
		const mk = (v: unknown) => encodeCursor({ id: T, _k0: v }, p0.keys, p0.fp);
		for (const v of ["1;DROP", "1e5", "abc", "--1"]) bad(() => plan({ sort: "budget", cursor: mk(v) }));
		const dp = plan({ sort: "since" });
		bad(() => plan({ sort: "since", cursor: encodeCursor({ id: T, _k0: "2026-13-01" }, dp.keys, dp.fp) }));
		const sp = plan({ sort: "stage2" });
		bad(() => plan({ sort: "stage2", cursor: encodeCursor({ id: T, _k0: "0" }, sp.keys, sp.fp) }));
		expect(plan({ sort: "stage2", cursor: encodeCursor({ id: T, _k0: "2" }, sp.keys, sp.fp) }).params).toContain("2");
		// round trip works; a different schema_rev, sort or filter -> CURSOR_STALE
		const ok = plan({ sort: "budget", cursor: mk("5") });
		expect(ok.params).toContain("5");
		bad(() => planList("lead", new URLSearchParams({ sort: "budget", cursor: mk("5") }), T, tenant, reg(4)), "CURSOR_STALE");
		bad(() => plan({ sort: "-budget", cursor: mk("5") }), "CURSOR_STALE");
		bad(() => plan({ sort: "budget", cursor: mk("5"), ...f({ p: "nick", op: "is_null" }) }), "CURSOR_STALE");
	});
	it("static fingerprints do not depend on schema_rev (live cursors survive)", () => {
		const a = planList("lead", new URLSearchParams({ sort: "title" }), T, tenant, reg(1));
		const b = planList("lead", new URLSearchParams({ sort: "title" }), T, tenant, reg(9));
		const c = planList("lead", new URLSearchParams({ sort: "title" }), T, tenant);
		expect(a.fp).toBe(b.fp);
		expect(a.fp).toBe(c.fp);
	});
});
