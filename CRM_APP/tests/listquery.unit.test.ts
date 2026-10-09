import { describe, expect, it } from "vitest";
import { Fault } from "../src/db.js";
import { encodeCursor, planList } from "../src/listquery.js";

const T = "00000000-0000-4000-8000-000000000001";
const U = "00000000-0000-4000-8000-0000000000aa";
const tenant = { mode: "tenant", actor: U };
const plan = (qs: Record<string, string>, scope = tenant, kind = "contact" as const) =>
	planList(kind, new URLSearchParams(qs), T, scope);
const j = JSON.stringify;

describe("S4 list compiler (pure)", () => {
	it("legacy form: id order, no extra columns", () => {
		const p = plan({});
		expect(p.legacy).toBe(true);
		expect(p.sql).toMatch(/WHERE tenant_id=\$1 AND merged_into_id IS NULL ORDER BY id ASC LIMIT 51$/);
		expect(p.params).toEqual([T]);
	});
	it("golden: filter + sort compile to bound parameters only", () => {
		const p = plan({
			filter: j({ and: [{ p: "source", op: "eq", v: "x'; DROP TABLE crm.contact;--" }, { p: "version", op: "gte", v: 1 }] }),
			sort: "-display_name",
		});
		expect(p.sql).toContain("(source = $2::text AND version >= $3::integer)");
		expect(p.sql).toContain("ORDER BY display_name DESC,id DESC LIMIT 51");
		expect(p.sql).not.toContain("DROP");
		expect(p.params).toEqual([T, "x'; DROP TABLE crm.contact;--", 1]);
	});
	it("rep scope is applied in SQL and cannot be removed by filter or cursor", () => {
		const p = plan({ filter: j({ p: "owner_id", op: "neq", v: U }) }, { mode: "assigned", actor: U });
		expect(p.sql).toContain("owner_id=$2::uuid");
		expect(p.params[1]).toBe(U);
	});
	it("related lookups reuse the bound rep actor after q and filter parameters", () => {
		const scope = { mode: "assigned", actor: U };
		const lead = planList("lead", new URLSearchParams({ q: "needle", filter: j({ p: "status", op: "eq", v: "open" }), sort: "contact_name" }), T, scope);
		expect(lead.sql).toContain("c.owner_id=$2::uuid");
		expect(lead.params).toEqual([T, U, "%needle%", "open"]);
		const task = planList("task", new URLSearchParams({ q: "needle", sort: "owner_name" }), T, scope);
		expect(task.sql).toContain("d.owner_id=$2::uuid");
		expect(task.sql).toContain("l.owner_id=$2::uuid");
		expect(task.params[1]).toBe(U);
		expect(() => planList("lead", new URLSearchParams({ q: "needle" }), T, { mode: "unexpected", actor: U })).toThrow(Fault);
	});
	it("fuzz: hostile text never reaches the SQL text (bound only); unknown identifiers are rejected", () => {
		const nul = String.fromCharCode(0), bs = String.fromCharCode(92);
		const evil = ["x';DROP TABLE t;--", 'x"y', `x${bs}y`, "x%_y", "x$1y", `x${nul}y`, "a".repeat(300), `x${"$"}{y}z`, "x`y", "x/*y*/", "x;SELECT 1"];
		for (const v of evil)
			for (const op of ["eq", "neq", "contains", "starts_with", "in"]) {
				try {
					const p = plan({ filter: j({ p: "display_name", op, v: op === "in" ? [v] : v }) });
					expect(p.sql.includes(v)).toBe(false);
					expect(p.params.length).toBe(2);
				} catch (e) {
					expect(e).toBeInstanceOf(Fault);
					expect(v.includes(nul) || v.length > 200).toBe(true);
				}
			}
		for (const bad of ["display_name;--", "tenant_id", "__proto__", "constructor", "toString", "DISPLAY_NAME", ""])
			expect(() => plan({ filter: j({ p: bad, op: "eq", v: "x" }) })).toThrow(Fault);
		for (const bad of ["tenant_id", "x;--", "-", ",", "display_name,", "a,b,c", "-display_name,display_name"])
			expect(() => plan({ sort: bad })).toThrow(Fault);
	});
	it("cursor round-trip and stale detection", () => {
		const p = plan({ sort: "-created_at" });
		const row = { id: T, _k0: "2026-01-01T00:00:00.123456Z" };
		const c = encodeCursor(row, p.keys, p.fp);
		const next = plan({ sort: "-created_at", cursor: c });
		expect(next.sql).toContain("((created_at,id) < ($2::timestamptz,$3::uuid))");
		expect(next.params).toEqual([T, "2026-01-01T00:00:00.123456Z", T]);
		expect(() => plan({ sort: "created_at", cursor: c })).toThrow(Fault);
		expect(() => plan({ cursor: c })).toThrow(Fault);
	});
	// P1b B0 F2: same-direction keysets are one row-value comparison (index condition); everything else keeps the OR-chain.
	const pageAfter = (sort: string, raw: unknown[], kind = "contact" as "contact" | "task") => {
		const p0 = planList(kind, new URLSearchParams({ sort }), T, tenant);
		const c = encodeCursor({ id: T, ...Object.fromEntries(raw.map((v, i) => [`_k${i}`, v])) }, p0.keys, p0.fp);
		return planList(kind, new URLSearchParams({ sort, cursor: c }), T, tenant);
	};
	const TS = "2026-01-01T00:00:00.123456Z";
	it("keyset: same-direction sorts compile to a row-value comparison", () => {
		const d = pageAfter("-created_at", [TS]);
		expect(d.sql).toContain("((created_at,id) < ($2::timestamptz,$3::uuid))");
		expect(d.sql).not.toContain(" OR ");
		expect(d.params).toEqual([T, TS, T]);
		expect(pageAfter("created_at", [TS]).sql).toContain("((created_at,id) > ($2::timestamptz,$3::uuid))");
		expect(pageAfter("display_name", ["Ali"]).sql).toContain("((display_name,id) > ($2::text,$3::uuid))");
		// two keys, both descending, and both ascending
		const dd = pageAfter("-display_name,-created_at", ["Ali", TS]);
		expect(dd.sql).toContain("((display_name,created_at,id) < ($2::text,$3::timestamptz,$4::uuid))");
		expect(dd.sql).not.toContain(" OR ");
		expect(pageAfter("display_name,created_at", ["Ali", TS]).sql).toContain("((display_name,created_at,id) > ($2::text,$3::timestamptz,$4::uuid))");
		// the default newest-first order with q or filter is the same shape
		const q = planList("contact", new URLSearchParams({ q: "x" }), T, tenant);
		const withCursor = planList("contact", new URLSearchParams({ q: "x", cursor: encodeCursor({ id: T, _k0: TS }, q.keys, q.fp) }), T, tenant);
		expect(withCursor.sql).toContain("((created_at,id) < ($3::timestamptz,$4::uuid))");
	});
	it("keyset: mixed directions keep the OR-chain (a row value cannot express them)", () => {
		const m = pageAfter("display_name,-created_at", ["Ali", TS]);
		expect(m.sql).not.toContain("(display_name,created_at,id)");
		expect(m.sql).toContain("display_name > $2::text");
		expect(m.sql).toContain("display_name = $");
		expect(m.sql).toContain(" OR ");
		const m2 = pageAfter("-display_name,source", ["Ali", "web"]);
		expect(m2.sql).toContain("display_name < $2::text");
		expect(m2.sql).not.toContain("(display_name,source,id)");
	});
	it("keyset: nullable keys keep the OR-chain with NULLS LAST semantics", () => {
		const n = pageAfter("completed_at", [TS], "task");
		expect(n.sql).toContain("(completed_at > $2::timestamptz OR completed_at IS NULL)");
		expect(n.sql).not.toContain("(completed_at,id)");
		// NULL cursor value: only rows after it on the next key, never a row-value over a NULL
		const nn = pageAfter("completed_at", [null], "task");
		expect(nn.sql).toContain("completed_at IS NULL AND id > $2::uuid");
		expect(nn.sql).not.toContain("(completed_at,id)");
		// a nullable key anywhere in a same-direction sort also keeps the chain
		expect(pageAfter("-due_at,-completed_at", [TS, TS], "task").sql).not.toContain("(due_at,completed_at,id)");
	});
});

describe("R10 missing_contact filter",()=>{
 it("binds boolean presence and rejects strings, operators and other objects",()=>{
  const filter=JSON.stringify({p:"missing_contact",op:"eq",v:true});const p=planList("lead",new URLSearchParams({filter}),T,tenant);
  expect(p.sql).toContain("(NOT crm.contact_has_channel(contact_id)) = $2::boolean");expect(p.params).toEqual([T,true]);
  expect(()=>planList("contact",new URLSearchParams({filter}),T,tenant)).toThrow(Fault);
  for (const node of [{p:"missing_contact",op:"eq",v:"true"},{p:"missing_contact",op:"contains",v:true}]) expect(()=>planList("lead",new URLSearchParams({filter:JSON.stringify(node)}),T,tenant)).toThrow(Fault);
 });
});
