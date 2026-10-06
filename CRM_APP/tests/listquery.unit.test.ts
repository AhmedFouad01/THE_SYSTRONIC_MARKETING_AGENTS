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
		expect(next.sql).toContain("created_at < $2::timestamptz");
		expect(next.params).toContain("2026-01-01T00:00:00.123456Z");
		expect(() => plan({ sort: "created_at", cursor: c })).toThrow(Fault);
		expect(() => plan({ cursor: c })).toThrow(Fault);
	});
});
