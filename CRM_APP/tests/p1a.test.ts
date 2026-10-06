// ADR-002 P1a: projection (S1), scope/RLS hoist (S2), timestamps (S3), list contract (S4). Real PostgreSQL.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import pg from "pg";
import { seed } from "../scripts/seed.js";
import { crmRequest, type Body } from "../src/crm.js";
import { Fault, pool, transaction, type Context } from "../src/db.js";
import { transition } from "../src/transition.js";

const admin = new pg.Client({
	connectionString: process.env.ADMIN_DATABASE_URL,
});
let f: Awaited<ReturnType<typeof seed>>, ctx: Context;
before(async () => {
	await admin.connect();
});
after(async () => {
	await admin.end();
	await pool.end();
});
async function fresh() {
	f = await seed(admin);
	ctx = { tenant: f.ids.a, token: f.tokens.manager };
}
async function request(
	path: string,
	method = "GET",
	body: Body = {},
	context = ctx,
	key: string = randomUUID(),
) {
	const u = new URL(`/v1/${path}`, "http://localhost");
	return crmRequest(
		context,
		method,
		u.pathname,
		u.searchParams,
		body,
		key,
		randomUUID(),
	);
}
async function create(path: string, b: Body, context = ctx) {
	return (
		await request(path, "POST", { command_id: randomUUID(), ...b }, context)
	).data as pg.QueryResultRow;
}
const fail = (code: string) => (e: unknown) =>
	e instanceof Fault && e.code === code;
// Extra principal with its own session in tenant A (MFA marked, like the fixture).
async function member(role: string, tenant = f.ids.a) {
	const id = randomUUID(),
		token = randomBytes(32).toString("hex");
	await admin.query("INSERT INTO crm.principal VALUES($1,$2)", [
		id,
		`Synthetic ${role} ${id.slice(0, 4)}`,
	]);
	await admin.query(
		"INSERT INTO crm.session(token_hash,principal_id,expires_at,mfa_verified) VALUES($1,$2,now()+interval '1 day',true)",
		[createHash("sha256").update(token).digest("hex"), id],
	);
	await admin.query(
		"INSERT INTO crm.membership(tenant_id,id,principal_id,role) VALUES($1,$2,$3,$4)",
		[tenant, randomUUID(), id, role],
	);
	return { id, ctx: { tenant, token } as Context };
}
async function pipeline() {
	const p = await create("pipelines", {
		name: "P1a pipeline",
		stages: [{ name: "New" }, { name: "Won", outcome: "won" }],
		transitions: [[0, 1]],
	});
	return (
		(await request("pipelines")).data as pg.QueryResultRow[]
	).find((x) => x.id === p.id) as pg.QueryResultRow;
}
// One of each object, owned by `owner` (default manager).
async function sample(owner?: string, as = ctx) {
	const c = await create(
			"contacts",
			{ display_name: "P1a Contact", ...(owner ? { owner_id: owner } : {}) },
			as,
		),
		l = await create(
			"leads",
			{
				contact_id: c.id,
				title: "P1a Lead",
				source_evidence: "synthetic",
				...(owner ? { owner_id: owner } : {}),
			},
			as,
		),
		p = await pipeline(),
		d = await create(
			"deals",
			{
				contact_id: c.id,
				pipeline_id: p.id,
				stage_id: p.stages[0].id,
				title: "P1a Deal",
				amount_minor: 1500,
				...(owner ? { owner_id: owner } : {}),
			},
			as,
		),
		t = await create(
			"tasks",
			{
				contact_id: c.id,
				title: "P1a Task",
				due_at: new Date(Date.now() + 3600e3).toISOString(),
				...(owner ? { owner_id: owner } : {}),
			},
			as,
		);
	return { c, l, p, d, t };
}
const KINDS = ["contacts", "leads", "deals", "tasks"] as const;
const keys = (r: pg.QueryResultRow) => Object.keys(r).sort();

// ---------------------------------------------------------------- S1 explicit projection
const S1_COLUMNS: Record<string, string[]> = {
	contacts: ["tenant_id", "id", "display_name", "owner_id", "version", "source", "merged_into_id"],
	leads: ["tenant_id", "id", "contact_id", "owner_id", "title", "source", "source_evidence", "status", "version", "received_at"],
	deals: ["tenant_id", "id", "contact_id", "pipeline_id", "stage_id", "owner_id", "version", "lead_id", "title", "amount_minor", "currency"],
	tasks: ["tenant_id", "id", "contact_id", "deal_id", "owner_id", "title", "due_at", "status", "outcome", "version", "completed_at"],
};
test("P1A-S1 get/list return exactly the projected columns; a column added later is never leaked", async () => {
	await fresh();
	const s = await sample();
	const ids: Record<string, string> = {
		contacts: s.c.id,
		leads: s.l.id,
		deals: s.d.id,
		tasks: s.t.id,
	};
	const TS = ["created_at", "updated_at"];
	// A hypothetical future column (e.g. ADR `custom`) must stay invisible until projected on purpose.
	const kindTable = { contacts: "contact", leads: "lead", deals: "deal", tasks: "task" };
	for (const k of KINDS)
		await admin.query(
			`ALTER TABLE crm.${kindTable[k]} ADD COLUMN p1a_secret text NOT NULL DEFAULT 'leak'`,
		);
	try {
		for (const k of KINDS) {
			const got = (await request(`${k}/${ids[k]}`)).data;
			assert.deepEqual(
				keys(got).filter((x) => x !== "identifiers" && x !== "replayed"),
				[...S1_COLUMNS[k], ...TS].sort(),
				`${k} get`,
			);
			const row = ((await request(k)).data as pg.QueryResultRow[]).find(
				(r) => r.id === ids[k],
			) as pg.QueryResultRow;
			assert.deepEqual(keys(row), [...S1_COLUMNS[k], ...TS].sort(), `${k} list`);
			assert.ok(!("p1a_secret" in got) && !("p1a_secret" in row));
		}
	} finally {
		for (const k of KINDS)
			await admin.query(`ALTER TABLE crm.${kindTable[k]} DROP COLUMN p1a_secret`);
	}
});

// ---------------------------------------------------------------- S2 hoisted authorization
const LEGACY = (t: string) =>
	`SELECT id FROM crm.${t} WHERE tenant_id=$1 AND crm.can_object('crm.read','${t}',id,$2) ORDER BY id`;
async function scopeIds(c: Context, kind: string) {
	return transaction(c, async (db) => {
		const {
			rows: [s],
		} = await db.query(
			"SELECT mode,actor FROM crm.object_scope('crm.read',$1)",
			[c.grant ?? null],
		);
		const legacy = (
			await db.query(LEGACY(kind), [c.tenant, c.grant ?? null])
		).rows.map((r) => r.id);
		const hoisted = s
			? (
					await db.query(
						`SELECT id FROM crm.${kind} WHERE tenant_id=$1 ${s.mode === "tenant" ? "" : "AND owner_id=$2"} ORDER BY id`,
						s.mode === "tenant" ? [c.tenant] : [c.tenant, s.actor],
					)
				).rows.map((r) => r.id)
			: [];
		return {
			mode: s?.mode as string | undefined,
			legacy: legacy as string[],
			hoisted: hoisted as string[],
		};
	});
}
test("P1A-S2a hoisted scope returns exactly what per-row can_object returned (manager, reader, rep) and denies analyst/non-MFA/agency", async () => {
	await fresh();
	const rep = await member("rep"),
		other = await member("manager"),
		analyst = await member("analyst");
	await sample(); // manager-owned
	await sample(rep.id, rep.ctx); // rep-owned
	await sample(other.id, other.ctx);
	const reader = { ...ctx, token: f.tokens.reader };
	for (const [name, c, mode] of [
		["manager", ctx, "tenant"],
		["reader", reader, "tenant"],
		["rep", rep.ctx, "assigned"],
	] as const)
		for (const kind of ["contact", "lead", "deal", "task"]) {
			const r = await scopeIds(c, kind);
			assert.equal(r.mode, mode, `${name} mode`);
			assert.deepEqual(r.hoisted, r.legacy, `${name} ${kind}`);
			assert.ok(r.legacy.length > 0);
		}
	const repTask = await scopeIds(rep.ctx, "task");
	const all = await scopeIds(ctx, "task");
	assert.ok(
		repTask.hoisted.length < all.hoisted.length,
		"rep sees a strict subset",
	);
	// no crm.read -> no scope -> 403 on the API, same as before
	assert.equal((await scopeIds(analyst.ctx, "contact")).mode, undefined);
	await assert.rejects(
		request("contacts", "GET", {}, analyst.ctx),
		fail("FORBIDDEN"),
	);
	// manager without MFA -> no scope
	await admin.query(
		"UPDATE crm.session SET mfa_verified=false WHERE principal_id=$1",
		[f.ids.manager],
	);
	assert.equal((await scopeIds(ctx, "contact")).mode, undefined);
	await assert.rejects(request("contacts"), fail("FORBIDDEN"));
	await admin.query(
		"UPDATE crm.session SET mfa_verified=true WHERE principal_id=$1",
		[f.ids.manager],
	);
	// agency grant header: list stays 403 (fixed-deal grants never list); tenant B manager has no scope in A
	const agency = {
		tenant: f.ids.a,
		token: f.tokens.agency,
		grant: f.ids.grant,
	};
	await assert.rejects(request("deals", "GET", {}, agency), fail("FORBIDDEN"));
	// the agency principal passes the tenant boundary (active grant) but holds no membership: no list scope
	assert.equal(
		(await scopeIds({ tenant: f.ids.a, token: f.tokens.agency }, "deal")).mode,
		undefined,
	);
	await assert.rejects(
		request("deals", "GET", {}, { tenant: f.ids.a, token: f.tokens.agency }),
		fail("FORBIDDEN"),
	);
});
test("P1A-S2b tenant isolation unchanged under the InitPlan policy (reads, writes, forged contexts) and the plan has no per-row definer call", async () => {
	await fresh();
	const other = { tenant: f.ids.b, token: f.tokens.agency };
	const bContact = (await create("contacts", { display_name: "B only" }, other))
		.id;
	await sample();
	for (const k of KINDS) {
		const a = (await request(k)).data as pg.QueryResultRow[];
		assert.ok(
			a.length > 0 && a.every((r) => r.tenant_id === f.ids.a),
			`${k} A list is tenant A only`,
		);
		const b = (await request(k, "GET", {}, other)).data as pg.QueryResultRow[];
		assert.ok(
			b.every((r) => r.tenant_id === f.ids.b),
			`${k} B list is tenant B only`,
		);
	}
	await assert.rejects(request(`contacts/${bContact}`), fail("NOT_FOUND"));
	await assert.rejects(
		request("contacts", "GET", {}, { ...ctx, tenant: f.ids.b }),
		fail("FORBIDDEN"),
	);
	await assert.rejects(
		request("contacts", "GET", {}, { ...ctx, token: "forged" }),
		fail("UNAUTHENTICATED"),
	);
	await transaction(ctx, async (db) => {
		for (const t of ["contact", "lead", "deal", "task"])
			assert.equal(
				(
					await db.query(
						`SELECT count(*)::int n FROM crm.${t} WHERE tenant_id=$1`,
						[f.ids.b],
					)
				).rows[0].n,
				0,
				`${t} B rows invisible to A context`,
			);
		await db.query("SAVEPOINT s");
		await assert.rejects(
			db.query(
				"INSERT INTO crm.contact(tenant_id,id,display_name) VALUES($1,$2,'x')",
				[f.ids.b, randomUUID()],
			),
			(e: { code?: string }) => e.code === "42501",
		);
		await db.query("ROLLBACK TO s");
		const plan = JSON.stringify(
			(
				await db.query(
					"EXPLAIN (FORMAT JSON) SELECT id FROM crm.contact WHERE tenant_id=$1",
					[f.ids.a],
				)
			).rows[0],
		);
		assert.match(plan, /InitPlan/);
		assert.doesNotMatch(plan, /tenant_access/);
	});
	// the hoisting function itself: NULL (deny) for a non-member, the tenant for a member
	const stranger = await member("manager", f.ids.b); // member of B only, no grant in A
	const db = await pool.connect();
	try {
		await db.query("BEGIN");
		await db.query(
			"SELECT set_config('crm.tenant',$1,true),set_config('crm.token',$2,true)",
			[f.ids.a, stranger.ctx.token],
		);
		assert.equal(
			(await db.query("SELECT crm.context_tenant_if_allowed() v")).rows[0].v,
			null,
		);
		await db.query("SELECT set_config('crm.token',$1,true)", [
			f.tokens.manager,
		]);
		assert.equal(
			(await db.query("SELECT crm.context_tenant_if_allowed() v")).rows[0].v,
			f.ids.a,
		);
		await db.query("ROLLBACK");
	} finally {
		db.release();
	}
});

// ---------------------------------------------------------------- S3 timestamps
test("P1A-S3a created_at/updated_at present, updated_at is DB-maintained, created_at immutable", async () => {
	await fresh();
	const s = await sample();
	const get = async (k: string, id: string) => (await request(`${k}/${id}`)).data;
	const all: [string, string, pg.QueryResultRow][] = [
		["contacts", s.c.id, s.c],
		["leads", s.l.id, s.l],
		["deals", s.d.id, s.d],
		["tasks", s.t.id, s.t],
	];
	for (const [k, id] of all) {
		const r = await get(k, id);
		assert.ok(r.created_at instanceof Date && r.updated_at instanceof Date, k);
		assert.equal(
			r.created_at.getTime(),
			r.updated_at.getTime(),
			`${k} created=updated on insert`,
		);
	}
	for (const [k, id] of all)
		if (k !== "deals")
			await request(`${k}/${id}`, "PATCH", {
				command_id: randomUUID(),
				expected_version: 0,
				...(k === "contacts" ? { display_name: "Renamed" } : { title: "Renamed" }),
			});
	await request(`deals/${s.d.id}`, "PATCH", {
		command_id: randomUUID(),
		expected_version: 0,
		title: "Renamed",
	});
	await transition(
		ctx,
		s.d.id,
		{
			command_id: randomUUID(),
			to_stage_id: s.p.stages[1].id,
			expected_version: 1,
			reason: "synthetic",
		},
		randomUUID(),
	);
	for (const [k, id, before] of all) {
		const r = await get(k, id);
		assert.ok(r.updated_at > r.created_at, `${k} updated_at bumped`);
		assert.equal(
			r.created_at.getTime(),
			before.created_at.getTime(),
			`${k} created_at stable`,
		);
	}
	// created_at cannot be rewritten even by a privileged UPDATE
	await admin.query(
		"UPDATE crm.contact SET created_at='2000-01-01',display_name='x' WHERE tenant_id=$1 AND id=$2",
		[ctx.tenant, s.c.id],
	);
	assert.ok((await get("contacts", s.c.id)).created_at.getFullYear() >= 2026);
});
test("P1A-S3b migration 008 backfill invariants hold for every pre-existing row", async () => {
	const q = async (sql: string) => Number((await admin.query(sql)).rows[0].n);
	for (const t of ["contact", "lead", "deal", "task"]) {
		assert.equal(
			await q(
				`SELECT count(*) n FROM crm.${t} WHERE created_at IS NULL OR updated_at IS NULL OR updated_at<created_at`,
			),
			0,
			t,
		);
		// audit-backed rows carry exactly the audited creation time
		if (t !== "lead")
			assert.equal(
				await q(
					`SELECT count(*) n FROM crm.${t} x JOIN (SELECT tenant_id,object_id,min(occurred_at) m FROM crm.audit_log WHERE object_kind='${t}' AND action='${t}.created' GROUP BY 1,2) a ON a.tenant_id=x.tenant_id AND a.object_id=x.id WHERE x.created_at<>a.m`,
				),
				0,
				`${t} created_at = audited creation`,
			);
	}
	assert.equal(
		await q("SELECT count(*) n FROM crm.lead WHERE created_at<>received_at"),
		0,
	);
	assert.ok(
		(await q(
			"SELECT count(*) n FROM pg_indexes WHERE schemaname='crm' AND (indexname LIKE '%_tenant_created' OR indexname LIKE '%_tenant_owner_created')",
		)) >= 8,
	);
});

// ---------------------------------------------------------------- S4 list query contract
const enc = (o: unknown) => encodeURIComponent(JSON.stringify(o));
type Page = {
	data: pg.QueryResultRow[];
	next_cursor: string | null;
	has_more: boolean;
	total_count?: { value: number; exact: boolean };
};
const list = async (qs: string, kind = "contacts", c = ctx) =>
	(await request(
		`${kind}${qs ? `?${qs}` : ""}`,
		"GET",
		{},
		c,
	)) as unknown as Page;
async function pageAll(qs: string, kind = "contacts", c = ctx) {
	const ids: string[] = [];
	let cursor: string | null = null,
		pages = 0;
	do {
		const p: Page = await list(
			`${qs}${cursor ? `&cursor=${cursor}` : ""}`,
			kind,
			c,
		);
		ids.push(...p.data.map((r) => r.id));
		cursor = p.next_cursor;
		pages++;
		assert.ok(pages < 200);
	} while (cursor);
	return { ids, pages };
}
const truth = async (sql: string, args: unknown[] = []) =>
	(await admin.query(sql, args)).rows.map((r) => r.id as string);
// 1000 contacts and 1000 tasks in tenant A with heavy timestamp/name ties (microsecond-level) and NULLs.
async function bulk() {
	await admin.query(
		`INSERT INTO crm.contact(tenant_id,id,display_name,owner_id,source,created_at)
		 SELECT $1,gen_random_uuid(),'Bulk '||(i%37)||' '||(i%5),CASE WHEN i%3=0 THEN $2::uuid END,CASE WHEN i%2=0 THEN 'web' ELSE 'import' END,
		 timestamptz '2026-01-01 00:00:00+00'+(i%25)*interval '1 second'+(i%7)*interval '1 microsecond' FROM generate_series(1,1000) i`,
		[f.ids.a, f.ids.manager],
	);
	await admin.query(
		`INSERT INTO crm.task(tenant_id,id,contact_id,owner_id,title,due_at,status,completed_at,created_at)
		 SELECT $1,gen_random_uuid(),$2,$3,'Bulk task '||i,timestamptz '2026-02-01 00:00:00+00'+(i%40)*interval '1 hour',
		 CASE WHEN i%3=0 THEN 'completed' ELSE 'open' END,CASE WHEN i%3=0 THEN timestamptz '2026-03-01 00:00:00+00'-(i%11)*interval '1 minute'-(i%5)*interval '1 microsecond' END,
		 timestamptz '2026-01-01 00:00:00+00'+(i%25)*interval '1 second' FROM generate_series(1,1000) i`,
		[f.ids.a, f.ids.contact, f.ids.manager],
	);
}
test("P1A-S4a sort + keyset cursor: 1k rows with timestamp/name ties page exactly like ORDER BY, no gaps or duplicates", async () => {
	await fresh();
	await bulk();
	const tc = "crm.contact WHERE tenant_id=$1 AND merged_into_id IS NULL";
	const cases: [string, string, string][] = [
		["contacts", "sort=-created_at", `SELECT id FROM ${tc} ORDER BY created_at DESC,id DESC`],
		["contacts", "sort=created_at", `SELECT id FROM ${tc} ORDER BY created_at,id`],
		["contacts", "sort=display_name,-created_at", `SELECT id FROM ${tc} ORDER BY display_name,created_at DESC,id`],
		["contacts", "sort=-display_name,source", `SELECT id FROM ${tc} ORDER BY display_name DESC,source,id DESC`],
		["contacts", `q=bulk&filter=${enc({ p: "source", op: "eq", v: "web" })}`, `SELECT id FROM ${tc} AND display_name ILIKE '%bulk%' AND source='web' ORDER BY created_at DESC,id DESC`],
		["tasks", "sort=-completed_at", "SELECT id FROM crm.task WHERE tenant_id=$1 ORDER BY completed_at DESC NULLS LAST,id DESC"],
		["tasks", "sort=completed_at", "SELECT id FROM crm.task WHERE tenant_id=$1 ORDER BY completed_at NULLS LAST,id"],
		["tasks", "sort=due_at,-completed_at", "SELECT id FROM crm.task WHERE tenant_id=$1 ORDER BY due_at,completed_at DESC NULLS LAST,id"],
	];
	for (const [kind, qs, sql] of cases) {
		const want = await truth(sql, [f.ids.a]);
		assert.ok(want.length >= 500, qs);
		const got = await pageAll(`${qs}&limit=137`, kind);
		assert.equal(new Set(got.ids).size, got.ids.length, `${qs} duplicates`);
		assert.deepEqual(got.ids, want, `${qs} order`);
		assert.ok(got.pages > 1);
	}
	// new path defaults to newest first; without q/filter/sort the legacy id order is kept
	const dflt = await pageAll(`filter=${enc({ p: "version", op: "gte", v: 0 })}&limit=200`);
	assert.deepEqual(dflt.ids, await truth(`SELECT id FROM ${tc} ORDER BY created_at DESC,id DESC`, [f.ids.a]));
	assert.deepEqual((await pageAll("limit=200")).ids, await truth(`SELECT id FROM ${tc} ORDER BY id`, [f.ids.a]));
	// next_cursor is opaque and carries microseconds as text (a truncated value would have broken the ties above)
	const p = await list("sort=-created_at&limit=5");
	assert.ok(p.has_more && /^[A-Za-z0-9_-]+$/.test(p.next_cursor as string));
	assert.match(JSON.parse(Buffer.from(p.next_cursor as string, "base64url").toString()).v[0], /\.\d{6}Z$/);
	assert.ok(!Object.keys(p.data[0]).some((k) => k.startsWith("_k")));
});
test("P1A-S4b filter operators match plain SQL (per type), nesting, include_total, literal LIKE metacharacters", async () => {
	await fresh();
	await bulk();
	const F = (o: unknown) => `filter=${enc(o)}`;
	const sqlN = async (w: string, t: string) =>
		Number((await admin.query(`SELECT count(*) n FROM crm.${t} WHERE tenant_id=$1 AND ${w}`, [f.ids.a])).rows[0].n);
	const t0 = "2026-01-01T00:00:10Z",
		t1 = "2026-01-01T00:00:20Z";
	const checks: [string, string, string][] = [
		[F({ p: "source", op: "eq", v: "web" }), "source='web'", "contact"],
		[F({ p: "source", op: "neq", v: "web" }), "source IS DISTINCT FROM 'web'", "contact"],
		[F({ p: "source", op: "in", v: ["web", "manual"] }), "source IN ('web','manual')", "contact"],
		[F({ p: "source", op: "nin", v: ["web"] }), "source<>'web'", "contact"],
		[F({ p: "owner_id", op: "is_null" }), "owner_id IS NULL", "contact"],
		[F({ p: "owner_id", op: "not_null" }), "owner_id IS NOT NULL", "contact"],
		[F({ p: "owner_id", op: "eq", v: f.ids.manager }), `owner_id='${f.ids.manager}'`, "contact"],
		[F({ p: "display_name", op: "contains", v: "k 1" }), "display_name ILIKE '%k 1%'", "contact"],
		[F({ p: "display_name", op: "starts_with", v: "bulk 3" }), "display_name ILIKE 'bulk 3%'", "contact"],
		[F({ p: "created_at", op: "gte", v: t0 }), `created_at>='${t0}'`, "contact"],
		[F({ p: "created_at", op: "lt", v: t1 }), `created_at<'${t1}'`, "contact"],
		[F({ p: "created_at", op: "between", v: [t0, t1] }), `created_at BETWEEN '${t0}' AND '${t1}'`, "contact"],
		[F({ p: "created_at", op: "gt", v: "2026-01-01" }), "created_at>'2026-01-01T00:00:00Z'", "contact"],
		[F({ p: "version", op: "lte", v: 0 }), "version<=0", "contact"],
		[F({ and: [{ p: "source", op: "eq", v: "web" }, { or: [{ p: "owner_id", op: "is_null" }, { p: "display_name", op: "starts_with", v: "Bulk 1" }] }] }), "source='web' AND (owner_id IS NULL OR display_name ILIKE 'Bulk 1%')", "contact"],
		[F({ p: "status", op: "eq", v: "completed" }), "status='completed'", "task"],
		[F({ p: "completed_at", op: "is_null" }), "completed_at IS NULL", "task"],
		[F({ p: "due_at", op: "between", v: ["2026-02-01T05:00:00Z", "2026-02-01T10:00:00Z"] }), "due_at BETWEEN '2026-02-01T05:00:00Z' AND '2026-02-01T10:00:00Z'", "task"],
		[`${F({ p: "status", op: "in", v: ["completed"] })}&q=task 1`, "status='completed' AND title ILIKE '%task 1%'", "task"],
	];
	for (const [qs, w, t] of checks) {
		const want = await sqlN(t === "contact" ? `merged_into_id IS NULL AND ${w}` : w, t);
		const got = (await list(`${qs}&include_total=1`, `${t}s`)).total_count;
		assert.deepEqual(got, { value: want, exact: true }, qs);
	}
	// lead + deal fields
	const s = await sample();
	assert.equal((await list(F({ p: "status", op: "eq", v: "open" }), "leads")).data.some((r) => r.id === s.l.id), true);
	assert.deepEqual((await list(F({ and: [{ p: "amount_minor", op: "gte", v: 1500 }, { p: "currency", op: "eq", v: "EGP" }] }), "deals")).data.map((r) => r.id), [s.d.id]);
	assert.deepEqual((await list(F({ p: "contact_id", op: "in", v: [s.c.id] }), "leads")).data.map((r) => r.id), [s.l.id]);
	// LIKE metacharacters in user text are literal
	const pct = await create("contacts", { display_name: "Zed 100% sure" });
	await create("contacts", { display_name: "Zed 1000 sure" });
	await create("contacts", { display_name: "Zed_1 under" });
	assert.deepEqual((await list(F({ p: "display_name", op: "contains", v: "100%" }))).data.map((r) => r.id), [pct.id]);
	assert.equal((await list(`q=${encodeURIComponent("100%")}`)).data.length, 1);
	assert.equal((await list(F({ p: "display_name", op: "starts_with", v: "Zed_" }))).data.length, 1);
});
test("P1A-S4c injection attempts and limits: 422 or inert, data intact, never a 500", async () => {
	await fresh();
	await bulk();
	const rows = async () => Number((await admin.query("SELECT count(*) n FROM crm.contact")).rows[0].n);
	const before = await rows();
	const F = (o: unknown) => `filter=${enc(o)}`;
	const evil = ["'; DROP TABLE crm.contact;--", "' OR '1'='1", "\\", "%", "x') OR 1=1 --", "$1", '"; SELECT pg_sleep(5);--'];
	for (const v of evil) {
		for (const op of ["eq", "neq", "contains", "starts_with"]) {
			const t = Date.now();
			const r = await list(F({ p: "display_name", op, v }));
			assert.ok(Date.now() - t < 4000);
			if (op === "eq" || op === "starts_with") assert.equal(r.data.length, 0, `${op} ${v}`);
			if (op === "neq") assert.ok(r.data.length > 0);
		}
		assert.ok((await list(`q=${encodeURIComponent(v)}`)).data.length < before);
		await assert.rejects(list(F({ p: `display_name; DROP TABLE crm.contact--${v}`, op: "eq", v })), fail("VALIDATION_FAILED"));
		await assert.rejects(list(F({ p: "source", op: v, v: "x" })), fail("VALIDATION_FAILED"));
		for (const k of ["sort", "expand", "limit", "include_total"])
			await assert.rejects(list(`${k}=${encodeURIComponent(v)}`), fail("VALIDATION_FAILED"), k);
	}
	assert.equal(await rows(), before);
	const c = { p: "source", op: "eq", v: "web" };
	const bads: [string, unknown][] = [
		["not json", "{"],
		["scalar", 5],
		["array root", [c]],
		["empty and", { and: [] }],
		["and+or", { and: [c], or: [c] }],
		["unknown key in node", { ...c, x: 1 }],
		["tenant_id not whitelisted", { p: "tenant_id", op: "eq", v: f.ids.a }],
		["merged_into_id not whitelisted", { p: "merged_into_id", op: "is_null" }],
		["__proto__", { p: "__proto__", op: "eq", v: "x" }],
		["constructor", { p: "constructor", op: "eq", v: "x" }],
		["contains on uuid", { p: "owner_id", op: "contains", v: "a" }],
		["gt on text", { p: "source", op: "gt", v: "a" }],
		["between arity", { p: "version", op: "between", v: [1] }],
		["bad uuid", { p: "owner_id", op: "eq", v: "nope" }],
		["bad int", { p: "version", op: "eq", v: 1.5 }],
		["int overflow", { p: "version", op: "eq", v: 2 ** 40 }],
		["string for int", { p: "version", op: "eq", v: "1" }],
		["bad date", { p: "created_at", op: "gt", v: "yesterday" }],
		["is_null with value", { p: "owner_id", op: "is_null", v: 1 }],
		["missing v", { p: "source", op: "eq" }],
		["null v", { p: "source", op: "eq", v: null }],
		["object v", { p: "source", op: "eq", v: { $ne: 1 } }],
		["NUL byte", { p: "source", op: "eq", v: "a\u0000b" }],
		["empty contains", { p: "source", op: "contains", v: "" }],
		["in empty", { p: "source", op: "in", v: [] }],
		["in too big", { p: "source", op: "in", v: Array.from({ length: 101 }, (_, i) => `v${i}`) }],
		["depth 4", { and: [{ or: [{ and: [{ or: [c] }] }] }] }],
		["21 conditions", { and: Array.from({ length: 21 }, () => c) }],
		["21 conditions nested", { and: [{ or: Array.from({ length: 11 }, () => c) }, { or: Array.from({ length: 10 }, () => c) }] }],
		["over 4 KB", { p: "display_name", op: "eq", v: "x".repeat(4100) }],
	];
	for (const [name, o] of bads)
		await assert.rejects(list(`filter=${typeof o === "string" ? encodeURIComponent(o) : enc(o)}`), fail("VALIDATION_FAILED"), name);
	// boundaries that must pass: depth 3, exactly 20 conditions
	await list(F({ and: [{ or: [c] }] }));
	await list(F({ and: Array.from({ length: 20 }, () => c) }));
	for (const qs of ["sort=tenant_id", "sort=id", "sort=-created_at,-created_at", "sort=a,b,c", "sort=owner_id", "limit=0", "limit=201", "limit=-1", "limit=1.5", "expand=stage", "expand=contact", "expand=owner,owner", `q=${"x".repeat(101)}`, "q=a%00b"])
		await assert.rejects(list(qs), fail("VALIDATION_FAILED"), qs);
	await assert.rejects(list("sort=-owner_id", "tasks"), fail("VALIDATION_FAILED"));
	await assert.rejects(list("sort=amount_minor", "leads"), fail("VALIDATION_FAILED"));
	await assert.rejects(list(F({ p: "source_evidence", op: "eq", v: "x" }), "leads"), fail("VALIDATION_FAILED"));
	await assert.rejects(list("sort=-created_at", "contacts", { ...ctx, token: "x".repeat(64) }), (e) => e instanceof Fault && e.status === 401);
});
test("P1A-S4d cursor: opaque, tamper-safe, bound to kind+filter+sort+q, legacy UUID only without q/filter/sort", async () => {
	await fresh();
	await bulk();
	const filter = `filter=${enc({ p: "source", op: "eq", v: "web" })}`;
	const p1 = await list(`${filter}&sort=display_name&limit=10`);
	const cur = p1.next_cursor as string;
	assert.ok(cur);
	const dec = () => JSON.parse(Buffer.from(cur, "base64url").toString());
	const re = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
	assert.equal((await list(`${filter}&sort=display_name&limit=10&cursor=${cur}`)).data.length, 10);
	const cc = (await list("sort=created_at&limit=2")).next_cursor;
	await assert.rejects(list(`sort=created_at&cursor=${cc}`, "leads"), fail("CURSOR_STALE"));
	// bound to kind, filter, sort and q -> CURSOR_STALE otherwise
	for (const [qs, kind] of [
		[`filter=${enc({ p: "source", op: "eq", v: "import" })}&sort=display_name`, "contacts"],
		[`${filter}&sort=-display_name`, "contacts"],
		[`${filter}&sort=display_name&q=bulk`, "contacts"],
		["sort=display_name", "contacts"],
		["", "contacts"],
	] as const)
		await assert.rejects(list(`${qs}${qs ? "&" : ""}cursor=${cur}`, kind), fail("CURSOR_STALE"), `${kind} ${qs}`);
	await assert.rejects(list(`${filter}&sort=display_name&cursor=${re({ ...dec(), fp: "0".repeat(16) })}`), fail("CURSOR_STALE"));
	for (const bad of [
		"!!!",
		"e30",
		re({}),
		re({ ...dec(), extra: 1 }),
		re({ ...dec(), v: [] }),
		re({ ...dec(), v: [1] }),
		re({ ...dec(), v: [null] }),
		re({ ...dec(), id: "nope" }),
		re({ ...dec(), id: "' OR 1=1" }),
		re({ ...dec(), fp: "x" }),
		re({ ...dec(), v: ["a\u0000"] }),
		"A".repeat(2100),
		Buffer.from("not json").toString("base64url"),
	])
		await assert.rejects(list(`${filter}&sort=display_name&cursor=${bad}`), fail("VALIDATION_FAILED"), bad.slice(0, 20));
	// values edited to valid-typed garbage only move the position; scope/tenant/filter still apply in SQL
	const forged = await list(`${filter}&sort=display_name&cursor=${re({ ...dec(), v: ["' OR 1=1 --"], id: randomUUID() })}`);
	assert.ok(forged.data.every((r) => r.source === "web" && r.tenant_id === f.ids.a));
	// timestamp key hygiene (exact microsecond text only)
	const d2 = JSON.parse(Buffer.from(((await list("sort=-created_at&limit=5", "tasks")).next_cursor as string), "base64url").toString());
	for (const v of ["2026-01-01", "2026-01-01T00:00:00Z", "x", "2026-01-01T00:00:00.123456Z; DROP"])
		await assert.rejects(list(`sort=-created_at&cursor=${re({ ...d2, v: [v] })}`, "tasks"), fail("VALIDATION_FAILED"), v);
	// legacy uuid cursor: unchanged without q/filter/sort, rejected with them
	const l1 = await list("limit=7");
	assert.equal(l1.next_cursor, l1.data[6].id);
	assert.ok(l1.data.every((r, i, a) => i === 0 || a[i - 1].id < r.id));
	assert.equal((await list(`cursor=${l1.next_cursor}`)).data[0].id > l1.data[6].id, true);
	for (const qs of [filter, "q=bulk", "sort=created_at"])
		await assert.rejects(list(`${qs}&cursor=${l1.next_cursor}`), fail("CURSOR_STALE"));
	await assert.rejects(list("cursor=not-a-uuid"), fail("VALIDATION_FAILED"));
});
test("P1A-S4e tenant isolation, rep scope, expand, total cap, legacy behaviour", async () => {
	await fresh();
	const rep = await member("rep"),
		analyst = await member("analyst");
	const mine = await sample(rep.id, rep.ctx); // rep-owned objects
	const theirs = await sample(); // manager-owned objects
	// tenant B manager: nothing of A is reachable by filter, id filter, cursor or expand
	const b = { tenant: f.ids.b, token: f.tokens.agency };
	for (const [kind, id] of [["contacts", theirs.c.id], ["leads", theirs.l.id], ["deals", theirs.d.id], ["tasks", theirs.t.id]] as const) {
		const r = await list(`filter=${enc({ p: "id", op: "eq", v: id })}&include_total=1&expand=owner`, kind, b);
		assert.equal(r.data.length, 0, kind);
		assert.deepEqual(r.total_count, { value: 0, exact: true });
		assert.ok((await list("sort=-created_at&include_total=1", kind, b)).data.every((x) => x.tenant_id === f.ids.b));
	}
	await create("contacts", { display_name: "A2" });
	const aPage = await list("sort=-created_at&limit=1");
	assert.ok(aPage.next_cursor);
	const bUsingA = await list(`sort=-created_at&cursor=${aPage.next_cursor}`, "contacts", b);
	assert.ok(bUsingA.data.every((x) => x.tenant_id === f.ids.b));
	// rep: filtered/sorted/total/expand stay inside the assigned scope
	for (const kind of KINDS) {
		const r = await list("sort=-created_at&include_total=1&limit=200", kind, rep.ctx);
		assert.ok(r.data.length >= 1 && r.data.every((x) => x.owner_id === rep.id), kind);
		const tbl = { contacts: "contact", leads: "lead", deals: "deal", tasks: "task" }[kind];
		const n = Number((await admin.query(`SELECT count(*) n FROM crm.${tbl} WHERE tenant_id=$1 AND owner_id=$2${tbl === "contact" ? " AND merged_into_id IS NULL" : ""}`, [f.ids.a, rep.id])).rows[0].n);
		assert.deepEqual(r.total_count, { value: n, exact: true }, `${kind} total scoped`);
		const all = await list("sort=-created_at&include_total=1", kind);
		assert.ok((all.total_count?.value ?? 0) > n);
		const widen = await list(`filter=${enc({ p: "owner_id", op: "neq", v: rep.id })}&limit=200`, kind, rep.ctx);
		assert.equal(widen.data.length, 0, `${kind} filter cannot widen scope`);
	}
	await assert.rejects(list("sort=-created_at", "contacts", analyst.ctx), fail("FORBIDDEN"));
	// expand: owner names via owner_names(); contact name visible vs restricted
	const mgrLead = await list(`filter=${enc({ p: "id", op: "eq", v: theirs.l.id })}&expand=contact,owner`, "leads");
	assert.deepEqual(mgrLead.data[0].contact, { id: theirs.c.id, display_name: "P1a Contact" });
	assert.deepEqual(mgrLead.data[0].owner, { id: f.ids.manager, name: "Synthetic manager" });
	const repLead = await list("sort=-created_at&expand=contact,owner&limit=200", "leads", rep.ctx);
	assert.deepEqual(repLead.data[0].contact, { id: mine.c.id, display_name: "P1a Contact" });
	assert.equal(repLead.data[0].owner.id, rep.id);
	// a rep-owned lead pointing at a manager-owned contact -> restricted (no name)
	const xl = await create("leads", { contact_id: theirs.c.id, title: "x", source_evidence: "s", owner_id: rep.id });
	const xr = (await list(`filter=${enc({ p: "id", op: "eq", v: xl.id })}&expand=contact`, "leads", rep.ctx)).data[0];
	assert.deepEqual(xr.contact, { id: theirs.c.id, restricted: true });
	// expand alone keeps the legacy id order; default response keys are unchanged
	const lx = await list("expand=owner&limit=50", "tasks");
	assert.ok(lx.data.every((r, i, a) => i === 0 || a[i - 1].id < r.id) && lx.data[0].owner.id);
	assert.deepEqual(Object.keys((await list("", "tasks")).data[0]).sort(), [...S1_COLUMNS.tasks, "created_at", "updated_at"].sort());
	// ?due= keeps working and combines with the new params
	const due = await list("due=today", "tasks");
	assert.ok(due.data.length >= 1 && due.data.every((r) => r.status === "open"));
	assert.equal((await list("due=overdue&sort=-created_at", "tasks")).data.length, 0);
	assert.ok((await list("due=today&sort=-created_at&include_total=1", "tasks")).total_count?.value);
	// total cap: exact up to 10000, capped above
	await admin.query("INSERT INTO crm.contact(tenant_id,id,display_name) SELECT $1,gen_random_uuid(),'Cap '||i FROM generate_series(1,10001) i", [f.ids.a]);
	assert.deepEqual((await list("q=cap&include_total=1&limit=1")).total_count, { value: 10000, exact: false });
	await admin.query("DELETE FROM crm.contact WHERE id=(SELECT id FROM crm.contact WHERE tenant_id=$1 AND display_name LIKE 'Cap %' LIMIT 1)", [f.ids.a]);
	assert.deepEqual((await list("q=cap&include_total=1&limit=1")).total_count, { value: 10000, exact: true });
	assert.equal((await list("q=cap&limit=1")).total_count, undefined);
});
