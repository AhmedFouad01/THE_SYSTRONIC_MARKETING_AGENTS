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
