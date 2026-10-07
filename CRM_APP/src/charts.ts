// Dashboard chart aggregates (roadmap v2 item 4, server half). Contract: CHARTS_CONTRACTS.md.
// Read-only GET endpoints under /v1/dashboard/*. Every query runs in the normal tenant transaction as crm_runtime, so RLS
// (tenant_boundary) applies; authorization is `crm.read` through crm.object_scope exactly like the list endpoints, and the
// rep's "assigned" scope becomes `owner_id = actor` in SQL. No SECURITY DEFINER function, no schema change.
// Numbers are locale-neutral: counts are JSON integers, minor-unit sums are decimal strings (bigint-safe), dates are ISO.
import type pg from "pg";
import { type Context, Fault, transaction } from "./db.js";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PERIODS_MAX = 104;
const PERIODS_DEFAULT = 12;
/** Lead sources shown individually; the rest are rolled into `other`. */
export const SOURCES_TOP = 20;
const invalid = () => new Fault(422, "VALIDATION_FAILED");

export function isCharts(path: string) {
	return path.startsWith("/v1/dashboard/");
}

type Totals = { currency: string; amount_minor: string }[];
type Scope = { mode: "tenant" | "assigned"; actor: string };

async function scopeOf(db: pg.PoolClient, ctx: Context): Promise<Scope> {
	const {
		rows: [scope],
	} = await db.query("SELECT mode,actor FROM crm.object_scope('crm.read',$1)", [
		ctx.grant ?? null,
	]);
	if (!scope || (scope.mode !== "tenant" && scope.mode !== "assigned"))
		throw new Fault(403, "FORBIDDEN");
	return scope;
}

/** Strict query validation: unknown names, repeats and malformed values are 422, never silently ignored. */
function params(query: URLSearchParams, allowed: string[]) {
	const seen = new Set<string>();
	for (const k of query.keys()) {
		if (!allowed.includes(k) || seen.has(k)) throw invalid();
		seen.add(k);
	}
}
async function timezone(db: pg.PoolClient, query: URLSearchParams) {
	const tz = query.get("tz") ?? "UTC";
	if (tz.length > 64) throw invalid();
	const { rowCount } = await db.query(
		"SELECT 1 FROM pg_timezone_names WHERE name=$1",
		[tz],
	);
	if (!rowCount) throw invalid();
	return tz;
}
function series(query: URLSearchParams) {
	const bucket = query.get("bucket") ?? "month";
	if (bucket !== "week" && bucket !== "month") throw invalid();
	const raw = query.get("periods");
	if (raw !== null && !/^[0-9]{1,3}$/.test(raw)) throw invalid();
	const periods = raw === null ? PERIODS_DEFAULT : Number(raw);
	if (periods < 1 || periods > PERIODS_MAX) throw invalid();
	const weekStart = query.get("week_start") ?? "monday";
	if (weekStart !== "monday" && weekStart !== "saturday") throw invalid();
	if (query.has("week_start") && bucket !== "week") throw invalid();
	return { bucket, periods, weekStart };
}
/** SQL fragment: the rep's assigned scope (a NULL actor parameter means tenant scope). */
const owned = (col: string, p: string) => `(${p}::uuid IS NULL OR ${col}=${p}::uuid)`;
const actorOf = (s: Scope) => (s.mode === "assigned" ? s.actor : null);

// Bucket series in the caller's timezone: one row per local calendar bucket start.
// $2 = tz, $3 = 'week'|'month', $4 = periods, $6 = validated 'monday'|'saturday'. The half-open bounds are local midnights converted back to timestamptz, so
// range predicates on created_at / completed_at can use the (tenant_id, created_at) indexes.
const BUCKETS = `
WITH shift_by AS (SELECT CASE WHEN $3::text='week' AND $6::text='saturday'
  THEN interval '2 days' ELSE interval '0 days' END shift),
cur AS (SELECT date_trunc($3::text, (now() AT TIME ZONE $2::text)+shift_by.shift)-shift_by.shift c,
  CASE WHEN $3::text='week' THEN interval '1 week' ELSE interval '1 month' END step FROM shift_by),
b AS (SELECT gs::date start_d, (gs+cur.step)::date end_d,
  (gs AT TIME ZONE $2::text) lo, ((gs+cur.step) AT TIME ZONE $2::text) hi
  FROM cur, generate_series(cur.c-cur.step*($4::int-1), cur.c, cur.step) gs)`;

async function pipelineStages(
	db: pg.PoolClient,
	ctx: Context,
	query: URLSearchParams,
	scope: Scope,
) {
	params(query, ["pipeline_id"]);
	const pipeline = query.get("pipeline_id");
	if (pipeline !== null && !uuid.test(pipeline)) throw invalid();
	const { rows } = await db.query(
		`WITH pl AS (SELECT id,name FROM crm.pipeline WHERE tenant_id=$1 AND ($3::uuid IS NULL OR id=$3::uuid) ORDER BY id LIMIT 100)
SELECT pl.id pipeline_id,pl.name pipeline_name,s.id stage_id,s.name stage_name,s.position,s.outcome,s.archived,
  d.currency,count(d.id)::int deal_count,coalesce(sum(d.amount_minor),0)::text amount_minor
FROM pl JOIN crm.stage s ON s.tenant_id=$1 AND s.pipeline_id=pl.id
LEFT JOIN crm.deal d ON d.tenant_id=$1 AND d.stage_id=s.id AND ${owned("d.owner_id", "$2")}
GROUP BY pl.id,pl.name,s.id,s.name,s.position,s.outcome,s.archived,d.currency
ORDER BY pl.id,s.position,s.id,d.currency`,
		[ctx.tenant, actorOf(scope), pipeline],
	);
	type Stage = {
		stage_id: string;
		name: string;
		position: number;
		outcome: string | null;
		archived: boolean;
		deal_count: number;
		totals: Totals;
	};
	const pipelines = new Map<
		string,
		{ pipeline_id: string; name: string; stages: Map<string, Stage> }
	>();
	for (const r of rows) {
		let p = pipelines.get(r.pipeline_id);
		if (!p) {
			p = { pipeline_id: r.pipeline_id, name: r.pipeline_name, stages: new Map() };
			pipelines.set(r.pipeline_id, p);
		}
		let s = p.stages.get(r.stage_id);
		if (!s) {
			s = {
				stage_id: r.stage_id,
				name: r.stage_name,
				position: r.position,
				outcome: r.outcome,
				archived: r.archived,
				deal_count: 0,
				totals: [],
			};
			p.stages.set(r.stage_id, s);
		}
		if (r.currency !== null) {
			s.deal_count += r.deal_count;
			s.totals.push({ currency: r.currency, amount_minor: r.amount_minor });
		}
	}
	return {
		data: {
			scope: scope.mode,
			pipelines: [...pipelines.values()].map((p) => ({
				pipeline_id: p.pipeline_id,
				name: p.name,
				// An archived stage is only shown while it still holds deals.
				stages: [...p.stages.values()].filter((s) => !s.archived || s.deal_count > 0),
			})),
		},
	};
}

async function leadsBreakdown(
	db: pg.PoolClient,
	ctx: Context,
	query: URLSearchParams,
	scope: Scope,
) {
	params(query, []);
	const { rows } = await db.query(
		`WITH g AS (SELECT source,status,count(*)::int n FROM crm.lead WHERE tenant_id=$1 AND ${owned("owner_id", "$2")} GROUP BY source,status),
r AS (SELECT source,row_number() OVER (ORDER BY sum(n) DESC,source) rk FROM g GROUP BY source)
SELECT CASE WHEN r.rk<=$3 THEN g.source END source,(r.rk>$3) other,g.status,sum(g.n)::int n,
  (SELECT count(*) FROM r WHERE rk>$3)::int other_sources
FROM g JOIN r ON r.source=g.source GROUP BY 1,2,3 ORDER BY 1,3`,
		[ctx.tenant, actorOf(scope), SOURCES_TOP],
	);
	const blank = () => ({ open: 0, qualified: 0, closed: 0, total: 0 });
	type Counts = ReturnType<typeof blank>;
	const bySource = new Map<string, Counts>();
	const byStatus = blank();
	const other = blank();
	let otherSources = 0;
	for (const r of rows) {
		const status = r.status as "open" | "qualified" | "closed";
		byStatus[status] += r.n;
		byStatus.total += r.n;
		otherSources = r.other_sources;
		let c = other;
		if (!r.other) {
			c = bySource.get(r.source) ?? blank();
			bySource.set(r.source, c);
		}
		c[status] += r.n;
		c.total += r.n;
	}
	return {
		data: {
			scope: scope.mode,
			total: byStatus.total,
			by_status: { open: byStatus.open, qualified: byStatus.qualified, closed: byStatus.closed },
			sources: [...bySource.entries()]
				.map(([source, c]) => ({ source, ...c }))
				.sort((a, b) => b.total - a.total || (a.source < b.source ? -1 : 1)),
			other: otherSources ? { source_count: otherSources, ...other } : null,
		},
	};
}

async function dealsOutcomes(
	db: pg.PoolClient,
	ctx: Context,
	query: URLSearchParams,
	scope: Scope,
) {
	params(query, ["bucket", "periods", "tz", "week_start"]);
	const { bucket, periods, weekStart } = series(query);
	const tz = await timezone(db, query);
	// A deal is "closed" when it currently sits in a won/lost stage; the close moment is its latest transition INTO that stage
	// (a deal that was reopened and closed again counts once, at the latest close), falling back to updated_at for deals that
	// were placed there without a recorded transition (seeded / imported).
	const { rows } = await db.query(
		`${BUCKETS},
closed AS (
  SELECT d.amount_minor,d.currency,s.outcome,coalesce(t.at,d.updated_at) closed_at
  FROM crm.deal d JOIN crm.stage s ON s.tenant_id=d.tenant_id AND s.id=d.stage_id
  LEFT JOIN LATERAL (SELECT max(x.occurred_at) at FROM crm.stage_transition x
    WHERE x.tenant_id=d.tenant_id AND x.deal_id=d.id AND x.to_stage=d.stage_id) t ON true
  WHERE d.tenant_id=$1 AND s.outcome IS NOT NULL AND ${owned("d.owner_id", "$5")})
SELECT b.start_d::text start,b.end_d::text "end",c.outcome,c.currency,count(c.outcome)::int deal_count,
  coalesce(sum(c.amount_minor),0)::text amount_minor,now() as_of
FROM b LEFT JOIN closed c ON c.closed_at>=b.lo AND c.closed_at<b.hi
GROUP BY b.start_d,b.end_d,c.outcome,c.currency ORDER BY b.start_d,c.outcome,c.currency`,
		[ctx.tenant, tz, bucket, periods, actorOf(scope), weekStart],
	);
	type Side = { count: number; totals: Totals };
	const buckets = new Map<string, { start: string; end: string; won: Side; lost: Side }>();
	for (const r of rows) {
		let b = buckets.get(r.start);
		if (!b) {
			b = {
				start: r.start,
				end: r.end,
				won: { count: 0, totals: [] },
				lost: { count: 0, totals: [] },
			};
			buckets.set(r.start, b);
		}
		if (r.outcome === "won" || r.outcome === "lost") {
			b[r.outcome as "won" | "lost"].count += r.deal_count;
			b[r.outcome as "won" | "lost"].totals.push({
				currency: r.currency,
				amount_minor: r.amount_minor,
			});
		}
	}
	const list = [...buckets.values()];
	return {
		data: {
			scope: scope.mode,
			as_of: rows[0]?.as_of ?? null,
			tz,
			bucket,
			...(bucket === "week" ? { week_start: weekStart } : {}),
			periods,
			from: list[0]?.start ?? null,
			to: list[list.length - 1]?.end ?? null,
			buckets: list,
		},
	};
}

async function tasksDue(
	db: pg.PoolClient,
	ctx: Context,
	query: URLSearchParams,
	scope: Scope,
) {
	params(query, ["tz"]);
	const tz = await timezone(db, query);
	const args = [ctx.tenant, tz, actorOf(scope)];
	const {
		rows: [t],
	} = await db.query(
		`WITH b AS (SELECT (now() AT TIME ZONE $2::text)::date today),
open AS (SELECT due_at,(due_at AT TIME ZONE $2::text)::date due_d FROM crm.task
  WHERE tenant_id=$1 AND status='open' AND ${owned("owner_id", "$3")})
SELECT b.today::text today,now() as_of,count(open.due_at)::int open_total,
  count(*) FILTER (WHERE open.due_at<now())::int overdue,
  count(*) FILTER (WHERE open.due_at>=now() AND open.due_at<now()+interval '24 hours')::int next_24h,
  count(*) FILTER (WHERE open.due_at>=now() AND open.due_d>b.today+6)::int later
FROM b LEFT JOIN open ON true GROUP BY b.today`,
		args,
	);
	const { rows: days } = await db.query(
		`WITH b AS (SELECT (now() AT TIME ZONE $2::text)::date today),
open AS (SELECT due_at,(due_at AT TIME ZONE $2::text)::date due_d FROM crm.task
  WHERE tenant_id=$1 AND status='open' AND due_at>=now() AND ${owned("owner_id", "$3")})
SELECT (b.today+k)::text date,count(open.due_at)::int n
FROM b CROSS JOIN generate_series(0,6) k LEFT JOIN open ON open.due_d=b.today+k
GROUP BY b.today,k ORDER BY k`,
		args,
	);
	return {
		data: {
			scope: scope.mode,
			as_of: t.as_of,
			tz,
			today: t.today,
			open_total: t.open_total,
			overdue: t.overdue,
			next_24h: t.next_24h,
			days: days.map((d) => ({ date: d.date as string, count: d.n as number })),
			later: t.later,
		},
	};
}

async function activity(
	db: pg.PoolClient,
	ctx: Context,
	query: URLSearchParams,
	scope: Scope,
) {
	params(query, ["bucket", "periods", "tz", "week_start"]);
	const { bucket, periods, weekStart } = series(query);
	const tz = await timezone(db, query);
	// Activity = records created per bucket plus tasks completed. Deliberately NOT crm.audit_log: that stream is gated by
	// `audit.read` (managers only), while the dashboard is a `crm.read` surface that reps use for their own assigned records.
	const cnt = (table: string, ts: string, extra = "") =>
		`(SELECT count(*) FROM crm.${table} x WHERE x.tenant_id=$1 AND ${owned("x.owner_id", "$5")} AND x.${ts}>=b.lo AND x.${ts}<b.hi${extra})::int`;
	const { rows } = await db.query(
		`${BUCKETS}
SELECT b.start_d::text start,b.end_d::text "end",
  ${cnt("contact", "created_at", " AND x.merged_into_id IS NULL")} contacts_created,
  ${cnt("lead", "created_at")} leads_created,
  ${cnt("deal", "created_at")} deals_created,
  ${cnt("task", "created_at")} tasks_created,
  ${cnt("task", "completed_at", " AND x.status='completed'")} tasks_completed,
  now() as_of
FROM b ORDER BY b.start_d`,
		[ctx.tenant, tz, bucket, periods, actorOf(scope), weekStart],
	);
	return {
		data: {
			scope: scope.mode,
			as_of: rows[0]?.as_of ?? null,
			tz,
			bucket,
			...(bucket === "week" ? { week_start: weekStart } : {}),
			periods,
			from: rows[0]?.start ?? null,
			to: rows[rows.length - 1]?.end ?? null,
			buckets: rows.map((r) => ({
				start: r.start as string,
				end: r.end as string,
				contacts_created: r.contacts_created as number,
				leads_created: r.leads_created as number,
				deals_created: r.deals_created as number,
				tasks_created: r.tasks_created as number,
				tasks_completed: r.tasks_completed as number,
			})),
		},
	};
}

const routes: Record<
	string,
	(
		db: pg.PoolClient,
		ctx: Context,
		query: URLSearchParams,
		scope: Scope,
	) => Promise<{ data: unknown }>
> = {
	"/v1/dashboard/pipeline-stages": pipelineStages,
	"/v1/dashboard/leads-breakdown": leadsBreakdown,
	"/v1/dashboard/deals-outcomes": dealsOutcomes,
	"/v1/dashboard/tasks-due": tasksDue,
	"/v1/dashboard/activity": activity,
};

export async function chartsRequest(
	ctx: Context,
	method: string,
	path: string,
	query: URLSearchParams,
) {
	const handler = routes[path];
	if (method !== "GET" || !handler) throw new Fault(404, "NOT_FOUND");
	return transaction(ctx, async (db) => {
		const scope = await scopeOf(db, ctx);
		// Same ceiling the bounded list paths use; a runaway aggregate fails closed instead of holding a pooled connection.
		await db.query("SELECT set_config('statement_timeout','5000',true)");
		return handler(db, ctx, query, scope);
	});
}
