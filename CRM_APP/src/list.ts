// ADR-002 P1a S4: executes a compiled list plan. Authorization (crm.read) is checked by the caller before this runs;
// scope is resolved once via crm.object_scope and applied in SQL, so no cursor or filter can widen it.
import type pg from "pg";
import { type Context, Fault } from "./db.js";
import { encodeCursor, LIMITS, planList } from "./listquery.js";
import type { Kind } from "./query.js";

export async function listRecords(
	db: pg.PoolClient,
	ctx: Context,
	kind: Kind,
	query: URLSearchParams,
) {
	const {
		rows: [scope],
	} = await db.query(
		"SELECT mode,actor FROM crm.object_scope('crm.read',$1)",
		[ctx.grant ?? null],
	);
	if (!scope) throw new Fault(403, "FORBIDDEN");
	const plan = planList(kind, query, ctx.tenant, scope);
	// Bound the cost of a hostile filter/q on the new path (transaction-local; the legacy path is untouched).
	if (!plan.legacy)
		await db.query("SELECT set_config('statement_timeout','5000',true)");
	const rows = (await db.query(plan.sql, plan.params)).rows;
	const page = rows.slice(0, plan.limit);
	const hasMore = rows.length > plan.limit;
	let next: string | null = null;
	if (hasMore) {
		const last = page[page.length - 1];
		next = plan.legacy ? last.id : encodeCursor(last, plan.keys, plan.fp);
	}
	const data = page.map((r) => {
		const o: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(r))
			if (!k.startsWith("_k")) o[k] = v;
		if ("amount_minor" in o) o.amount_minor = Number(o.amount_minor);
		return o;
	});
	if (plan.expand.includes("owner")) {
		const ids = [...new Set(data.map((r) => r.owner_id as string | null))].filter(
			Boolean,
		);
		const names = new Map<string, string>();
		if (ids.length)
			for (const r of (
				await db.query("SELECT id,name FROM crm.owner_names($1::uuid[])", [ids])
			).rows)
				names.set(r.id, r.name);
		for (const r of data) {
			const oid = r.owner_id as string | null;
			r.owner = oid ? { id: oid, name: names.get(oid) ?? null } : null;
		}
	}
	if (plan.expand.includes("contact")) {
		const ids = [...new Set(data.map((r) => r.contact_id as string | null))].filter(
			Boolean,
		);
		const names = new Map<string, string>();
		if (ids.length)
			// Same visibility as the contact list: the caller's scope (assigned = owner_id = actor) in SQL.
			for (const r of (
				await db.query(
					`SELECT id,display_name FROM crm.contact WHERE tenant_id=$1 AND id=ANY($2::uuid[])${scope.mode === "tenant" ? "" : " AND owner_id=$3"}`,
					scope.mode === "tenant"
						? [ctx.tenant, ids]
						: [ctx.tenant, ids, scope.actor],
				)
			).rows)
				names.set(r.id, r.display_name);
		for (const r of data) {
			const cid = r.contact_id as string | null;
			r.contact = !cid
				? null
				: names.has(cid)
					? { id: cid, display_name: names.get(cid) }
					: { id: cid, restricted: true };
		}
	}
	const out: Record<string, unknown> = {
		data,
		next_cursor: next,
		has_more: hasMore,
	};
	if (plan.includeTotal) {
		const n = (await db.query(plan.countSql, plan.countParams)).rows[0]
			.n as number;
		out.total_count = {
			value: Math.min(n, LIMITS.total),
			exact: n <= LIMITS.total,
		};
	}
	return out;
}
