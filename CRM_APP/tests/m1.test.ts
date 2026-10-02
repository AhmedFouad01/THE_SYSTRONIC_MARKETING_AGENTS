import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { seed } from "../scripts/seed.js";
import { crmRequest, type Body } from "../src/crm.js";
import { Fault, pool, transaction, type Context } from "../src/db.js";
import { transition } from "../src/transition.js";
import { workOne } from "../src/jobs.js";
import { server } from "../src/api.js";
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
const contact = () =>
	create("contacts", {
		display_name: "Synthetic Contact",
		source: "manual",
		identifiers: [
			{ kind: "phone", value: "+201000000001", provenance: "Synthetic call" },
		],
	});
async function pipeline() {
	const p = await create("pipelines", {
		name: "Synthetic reference",
		stages: [
			{ name: "New" },
			{ name: "Qualified" },
			{ name: "Won", outcome: "won" },
			{ name: "Lost", outcome: "lost" },
		],
		transitions: [
			[0, 1],
			[1, 2],
			[1, 3],
			[2, 1],
			[3, 1],
		],
	});
	const result = (
		(await request("pipelines")).data as pg.QueryResultRow[]
	).find((x) => x.id === p.id);
	assert.ok(result);
	return result;
}
async function flow() {
	const c = await contact(),
		p = await pipeline(),
		l = await create("leads", {
			contact_id: c.id,
			title: "Manual inquiry",
			source_evidence: "Synthetic phone conversation",
		}),
		d = await create("deals", {
			contact_id: c.id,
			lead_id: l.id,
			pipeline_id: p.id,
			stage_id: p.stages[0].id,
			title: "Synthetic opportunity",
			amount_minor: 12000,
			currency: "EGP",
		});
	return { c, p, l, d };
}
async function move(d: pg.QueryResultRow, stage: string, version: number) {
	return transition(
		ctx,
		d.id,
		{
			command_id: randomUUID(),
			to_stage_id: stage,
			expected_version: version,
			reason: "Synthetic reason",
		},
		randomUUID(),
	);
}
async function drain() {
	let n = 0;
	while (await workOne({ tenant: ctx.tenant, token: f.tokens.worker })) {
		if (++n > 100) throw new Error("Unbounded worker");
	}
}
async function count(table: string) {
	return (
		await admin.query(
			`SELECT count(*)::int n FROM crm.${table} WHERE tenant_id=$1`,
			[ctx.tenant],
		)
	).rows[0].n;
}
test("M1-01 manual contacts encrypt identifiers and shared phone gives candidates, never auto-merges", async () => {
	await fresh();
	const a = await contact(),
		b = await contact();
	assert.notEqual(a.id, b.id);
	assert.equal(a.identifiers[0].value, "+201000000001");
	assert.equal((await request(`contacts/${a.id}/duplicates`)).data.length, 1);
	const stored = (
		await admin.query(
			"SELECT encrypted_value,keyed_lookup_digest FROM crm.contact_identifier WHERE tenant_id=$1",
			[ctx.tenant],
		)
	).rows;
	assert.ok(!stored[0].encrypted_value.toString().includes("+201000000001"));
	assert.equal(stored[0].keyed_lookup_digest, stored[1].keyed_lookup_digest);
	assert.equal(await count("contact"), 3);
});
test("M1-02 manual lead atomically creates contact, audit, event/outbox and replay survives cache expiry", async () => {
	await fresh();
	const body = {
		command_id: randomUUID(),
		contact: { display_name: "New from lead" },
		title: "Manual inquiry",
		source_evidence: "Synthetic call",
	};
	const first = await request("leads", "POST", body, ctx, "K1"),
		second = await request("leads", "POST", body, ctx, "K2");
	assert.equal(first.data.id, second.data.id);
	await assert.rejects(
		request("leads", "POST", { ...body, title: "Changed" }, ctx, "K2"),
		fail("IDEMPOTENCY_CONFLICT"),
	);
	await admin.query(
		"UPDATE crm.command_retry SET expires_at=now()-interval '8 days' WHERE tenant_id=$1",
		[ctx.tenant],
	);
	assert.equal((await request("leads", "POST", body)).data.id, first.data.id);
	assert.equal(await count("lead"), 1);
	assert.equal(await count("audit_log"), 2);
	assert.equal(await count("business_event"), 2);
	assert.equal(await count("outbox"), 2);
	assert.equal(first.data.source_evidence, "Synthetic call");
});
test("M1-03 explicit reviewed merge preserves identifiers/provenance, references and history; stale preview denied", async () => {
	await fresh();
	const { c, l, d } = await flow(),
		target = await contact(),
		task = await create("tasks", {
			contact_id: c.id,
			deal_id: d.id,
			title: "Follow up",
			due_at: new Date().toISOString(),
		});
	const preview = (
		await request("contacts/merge-previews", "POST", {
			source_id: c.id,
			target_id: target.id,
		})
	).data;
	const body = {
		command_id: randomUUID(),
		source_id: c.id,
		target_id: target.id,
		source_version: preview.source_version,
		target_version: preview.target_version,
	};
	const result = await request("contacts/merges", "POST", body);
	assert.equal(result.status, 202);
	assert.equal(
		(await request(`contacts/${c.id}`)).data.merged_into_id,
		target.id,
	);
	for (const [kind, id] of [
		["leads", l.id],
		["deals", d.id],
		["tasks", task.id],
	]) {
		const r = (await request(`${kind}/${id}`)).data;
		assert.equal(r.contact_id, target.id);
		assert.equal(r.version, 1);
	}
	const merged = (await request(`contacts/${target.id}`)).data;
	assert.equal(merged.identifiers.length, 2);
	assert.ok(
		merged.identifiers.some(
			(i: pg.QueryResultRow) => i.original_contact_id === c.id,
		),
	);
	assert.equal(
		(await request("contacts/merges", "POST", body)).data.id,
		result.data.id,
	);
	await assert.rejects(
		request("contacts/merges", "POST", { ...body, command_id: randomUUID() }),
		fail("VERSION_CONFLICT"),
	);
	assert.ok((await request(`contacts/${c.id}/journey`)).data.length >= 2);
});
test("M1-04 deals validate pipeline, transitions, stale versions, loss reason and won/reopened/won identity", async () => {
	await fresh();
	const { d, p } = await flow();
	await assert.rejects(move(d, p.stages[2].id, 0), fail("INVALID_TRANSITION"));
	await move(d, p.stages[1].id, 0);
	await assert.rejects(move(d, p.stages[2].id, 0), fail("VERSION_CONFLICT"));
	await assert.rejects(
		transition(
			ctx,
			d.id,
			{
				command_id: randomUUID(),
				to_stage_id: p.stages[3].id,
				expected_version: 1,
				reason: "",
			},
			randomUUID(),
		),
		fail("LOSS_REASON_REQUIRED"),
	);
	await move(d, p.stages[2].id, 1);
	await move(d, p.stages[1].id, 2);
	await move(d, p.stages[2].id, 3);
	assert.equal(await count("commercial_outcome"), 1);
	assert.equal((await request(`deals/${d.id}/history`)).data.length, 4);
});
test("M1-05 task due/overdue, assignment, completion and one escalation despite worker repetition", async () => {
	await fresh();
	const c = await contact(),
		task = await create("tasks", {
			contact_id: c.id,
			title: "Call back",
			due_at: new Date(Date.now() - 60000).toISOString(),
		});
	assert.equal((await request("tasks?due=overdue")).data.length, 1);
	await drain();
	await drain();
	assert.equal(await count("task_escalation"), 1);
	await request(`tasks/${task.id}`, "PATCH", {
		command_id: randomUUID(),
		expected_version: 0,
		status: "completed",
		outcome: "Reached contact",
	});
	assert.equal((await request("tasks?due=overdue")).data.length, 0);
	assert.equal(
		(await request(`tasks/${task.id}`)).data.outcome,
		"Reached contact",
	);
});
test("M1-06 configured stage follow-up has one task/run despite rollback/retry and repeated worker", async () => {
	await fresh();
	const { d, p } = await flow();
	await create("automations", {
		stage_id: p.stages[1].id,
		title: "Stage follow-up",
		delay_minutes: 30,
	});
	await drain();
	await move(d, p.stages[1].id, 0);
	await workOne({ tenant: ctx.tenant, token: f.tokens.worker }, "retry");
	assert.equal(await count("automation_run"), 0);
	await admin.query(
		"UPDATE crm.outbox SET next_attempt_at=now() WHERE tenant_id=$1",
		[ctx.tenant],
	);
	await drain();
	await drain();
	assert.equal(await count("automation_run"), 1);
	assert.equal(await count("task"), 1);
	assert.equal((await request("tasks")).data[0].title, "Stage follow-up");
});
test("M1-07 disabled rule creates no task and records skipped run", async () => {
	await fresh();
	const { d, p } = await flow();
	const r = await create("automations", {
		stage_id: p.stages[1].id,
		title: "Disabled",
		delay_minutes: 0,
	});
	await request(`automations/${r.id}`, "PATCH", {
		command_id: randomUUID(),
		enabled: false,
	});
	await drain();
	await move(d, p.stages[1].id, 0);
	await drain();
	assert.equal(await count("task"), 0);
	assert.equal(
		(
			await admin.query(
				"SELECT status FROM crm.automation_run WHERE tenant_id=$1",
				[ctx.tenant],
			)
		).rows[0].status,
		"disabled",
	);
});
test("M1-08 actor membership revoked before automation effect blocks pending task", async () => {
	await fresh();
	const { d, p } = await flow();
	await create("automations", {
		stage_id: p.stages[1].id,
		title: "Revoked",
		delay_minutes: 0,
	});
	await drain();
	await move(d, p.stages[1].id, 0);
	await admin.query(
		"UPDATE crm.membership SET active=false WHERE tenant_id=$1 AND principal_id=$2",
		[ctx.tenant, f.ids.manager],
	);
	await drain();
	assert.equal(await count("task"), 0);
	assert.equal(
		(
			await admin.query(
				"SELECT status FROM crm.outbox WHERE tenant_id=$1 AND deal_id=$2 ORDER BY processed_at NULLS FIRST",
				[ctx.tenant, d.id],
			)
		).rows[0].status,
		"blocked",
	);
});
test("M1-09 tenant A cannot read B contact or update B lead/deal/task; forged tenant/token denied", async () => {
	await fresh();
	const other = { tenant: f.ids.b, token: f.tokens.agency };
	const c = await create("contacts", { display_name: "B" }, other),
		l = await create(
			"leads",
			{ contact_id: c.id, title: "B lead", source_evidence: "synthetic" },
			other,
		),
		task = await create(
			"tasks",
			{ contact_id: c.id, title: "B task", due_at: new Date().toISOString() },
			other,
		);
	await assert.rejects(request(`contacts/${c.id}`), fail("NOT_FOUND"));
	for (const [kind, id] of [
		["leads", l.id],
		["deals", f.ids.dealB],
		["tasks", task.id],
	])
		await assert.rejects(
			request(`${kind}/${id}`, "PATCH", {
				command_id: randomUUID(),
				expected_version: 0,
				title: "A overwrite",
			}),
			fail("NOT_FOUND"),
		);
	await assert.rejects(
		request("contacts", "GET", {}, { ...ctx, tenant: f.ids.b }),
		fail("FORBIDDEN"),
	);
	await assert.rejects(
		request("contacts", "GET", {}, { ...ctx, token: "forged" }),
		fail("UNAUTHENTICATED"),
	);
});
test("M1-10 assignment scope, unauthorized action and field read/write restrictions fail closed", async () => {
	await fresh();
	const c = await contact();
	await admin.query(
		"UPDATE crm.membership SET role='rep' WHERE tenant_id=$1 AND principal_id=$2",
		[ctx.tenant, f.ids.manager],
	);
	await admin.query(
		"UPDATE crm.contact SET owner_id=$3 WHERE tenant_id=$1 AND id=$2",
		[ctx.tenant, c.id, f.ids.reader],
	);
	await assert.rejects(request(`contacts/${c.id}`), fail("FORBIDDEN"));
	assert.ok(
		!(await request("contacts")).data.some(
			(x: pg.QueryResultRow) => x.id === c.id,
		),
	);
	await assert.rejects(
		create("contacts", { display_name: "Misassigned", owner_id: f.ids.reader }),
		fail("ASSIGNMENT_DENIED"),
	);
	const reader = { ...ctx, token: f.tokens.reader };
	assert.deepEqual(
		(await request(`contacts/${c.id}`, "GET", {}, reader)).data.identifiers,
		[],
	);
	await assert.rejects(
		create("contacts", { display_name: "Denied" }, reader),
		fail("FORBIDDEN"),
	);
	await assert.rejects(
		request("contacts/merge-previews", "POST", {
			source_id: c.id,
			target_id: f.ids.contact,
		}),
		fail("FORBIDDEN"),
	);
	await assert.rejects(
		create("contacts", { display_name: "Bad field", tenant_id: f.ids.b }),
		fail("FIELD_NOT_WRITABLE"),
	);
});
test("M1-11 sensitive action removal denies identifiers; manager and agency-manager MFA required", async () => {
	await fresh();
	await admin.query(
		"UPDATE crm.session SET mfa_verified=false WHERE principal_id=$1",
		[f.ids.manager],
	);
	await assert.rejects(request("contacts"), fail("FORBIDDEN"));
	await admin.query(
		"UPDATE crm.session SET mfa_verified=false WHERE principal_id=$1",
		[f.ids.agency],
	);
	await assert.rejects(
		transition(
			{ tenant: f.ids.a, token: f.tokens.agency, grant: f.ids.grant },
			f.ids.dealA,
			{
				command_id: randomUUID(),
				to_stage_id: f.ids.qualified,
				expected_version: 0,
				reason: "Synthetic",
			},
			randomUUID(),
		),
		fail("FORBIDDEN"),
	);
	await admin.query(
		"UPDATE crm.session SET mfa_verified=true WHERE principal_id=$1",
		[f.ids.manager],
	);
	await admin.query(
		"INSERT INTO crm.role_permission VALUES('limited','crm.read','tenant'),('limited','crm.write','tenant') ON CONFLICT DO NOTHING",
	);
	await admin.query(
		"UPDATE crm.membership SET role='limited' WHERE tenant_id=$1 AND principal_id=$2",
		[ctx.tenant, f.ids.manager],
	);
	await assert.rejects(contact(), fail("FORBIDDEN"));
});
test("M1-12 cross-tenant FKs and typed ledger references fail in actual PostgreSQL", async () => {
	await fresh();
	const other = { tenant: f.ids.b, token: f.tokens.agency },
		c = await create("contacts", { display_name: "B" }, other);
	for (const sql of [
		"INSERT INTO crm.lead(tenant_id,id,contact_id,owner_id,title,source,source_evidence) VALUES($1,$2,$3,$4,'x','manual','x')",
		"INSERT INTO crm.task(tenant_id,id,contact_id,owner_id,title,due_at) VALUES($1,$2,$3,$4,'x',now())",
	]) {
		await assert.rejects(
			admin.query(sql, [ctx.tenant, randomUUID(), c.id, f.ids.manager]),
			(e: unknown) => (e as { code: string }).code === "23503",
		);
	}
	await assert.rejects(
		admin.query(
			"INSERT INTO crm.business_event(tenant_id,id,object_kind,object_id) VALUES($1,$2,'contact',$3)",
			[ctx.tenant, randomUUID(), c.id],
		),
		(e: unknown) => (e as { code: string }).code === "23503",
	);
});
test("M1-13 current authority rechecked on replay; audit append-only and internal visibility restricted", async () => {
	await fresh();
	const b = { command_id: randomUUID(), display_name: "Replay" };
	await request("contacts", "POST", b);
	await admin.query(
		"UPDATE crm.membership SET active=false WHERE tenant_id=$1 AND principal_id=$2",
		[ctx.tenant, f.ids.manager],
	);
	await assert.rejects(request("contacts", "POST", b), fail("FORBIDDEN"));
	await admin.query(
		"UPDATE crm.membership SET active=true WHERE tenant_id=$1 AND principal_id=$2",
		[ctx.tenant, f.ids.manager],
	);
	await assert.rejects(
		transaction(ctx, (db) => db.query("DELETE FROM crm.audit_log")),
		(e: unknown) => (e as { code: string }).code === "42501",
	);
	await assert.rejects(
		request("outbox", "GET", {}, { ...ctx, token: f.tokens.reader }),
		fail("FORBIDDEN"),
	);
	const logs = await request("audit");
	assert.equal(logs.data.length, 1);
	assert.ok(!JSON.stringify(logs).includes("Replay"));
});
test("M1-14 HTTP create/list/detail/update, validation and safe request-id envelopes", async () => {
	await fresh();
	const app = server();
	await new Promise<void>((r) => app.listen(0, "127.0.0.1", r));
	try {
		const addr = app.address() as { port: number };
		const base = `http://127.0.0.1:${addr.port}/v1/`;
		const headers = {
			Authorization: `Bearer ${ctx.token}`,
			"X-Tenant-ID": ctx.tenant,
			"Content-Type": "application/json",
			"Idempotency-Key": randomUUID(),
		};
		let r = await fetch(`${base}contacts`, {
			method: "POST",
			headers,
			body: JSON.stringify({
				command_id: randomUUID(),
				display_name: "HTTP contact",
			}),
		});
		assert.equal(r.status, 201);
		const c = (await r.json()).data;
		r = await fetch(`${base}contacts/${c.id}`, { headers });
		assert.equal(r.status, 200);
		r = await fetch(`${base}contacts/${c.id}`, {
			method: "PATCH",
			headers: { ...headers, "Idempotency-Key": randomUUID() },
			body: JSON.stringify({
				command_id: randomUUID(),
				expected_version: 0,
				display_name: "Updated",
			}),
		});
		assert.equal(r.status, 200);
		r = await fetch(`${base}contacts/${c.id}`, {
			method: "PATCH",
			headers: { ...headers, "Idempotency-Key": randomUUID() },
			body: JSON.stringify({
				command_id: randomUUID(),
				expected_version: 0,
				display_name: "Stale",
			}),
		});
		assert.equal(r.status, 409);
		assert.ok((await r.json()).request_id);
		r = await fetch(`${base}contacts`, {
			headers: { ...headers, Authorization: "Bearer invalid" },
		});
		assert.equal(r.status, 401);
	} finally {
		await new Promise<void>((resolve, reject) =>
			app.close((e) => (e ? reject(e) : resolve())),
		);
	}
});
test("M1-15 concurrent manual command replays serialize and bind every retry key", async () => {
	await fresh();
	const body = {
		command_id: randomUUID(),
		contact: { display_name: "Concurrent contact" },
		title: "Concurrent lead",
		source_evidence: "Synthetic concurrency",
	};
	const results = await Promise.all([
		request("leads", "POST", body, ctx, "concurrent-1"),
		request("leads", "POST", body, ctx, "concurrent-2"),
	]);
	assert.equal(results[0].data.id, results[1].data.id);
	assert.equal(await count("lead"), 1);
	assert.equal(await count("command_retry"), 2);
	await assert.rejects(
		request(
			"leads",
			"POST",
			{ ...body, command_id: randomUUID(), title: "Conflicting intent" },
			ctx,
			"concurrent-2",
		),
		fail("IDEMPOTENCY_CONFLICT"),
	);
});
test("M1-16 manual intake audit failure rolls contact/lead/event/outbox/receipt back atomically", async () => {
	await fresh();
	await admin.query(
		`CREATE FUNCTION crm.m1_fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.tenant_id='${ctx.tenant}'::uuid THEN RAISE EXCEPTION 'synthetic failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER m1_fail_audit BEFORE INSERT ON crm.audit_log FOR EACH ROW EXECUTE FUNCTION crm.m1_fail_audit()`,
	);
	try {
		await assert.rejects(
			create("leads", {
				contact: { display_name: "Rolled back" },
				title: "Rolled back",
				source_evidence: "Synthetic",
			}),
		);
		for (const table of ["lead", "business_event", "outbox", "inbox"])
			assert.equal(await count(table), 0);
		assert.equal(await count("contact"), 1);
	} finally {
		await admin.query(
			"DROP TRIGGER m1_fail_audit ON crm.audit_log; DROP FUNCTION crm.m1_fail_audit()",
		);
	}
});
test("M1-17 grant revocation blocks configured worker effect and assigned lead/task access is denied", async () => {
	await fresh();
	const { c, d, p, l } = await flow();
	await create("automations", {
		stage_id: p.stages[1].id,
		title: "Grant task",
		delay_minutes: 5,
	});
	await drain();
	await admin.query(
		"UPDATE crm.agency_grant SET deal_id=$3 WHERE tenant_id=$1 AND id=$2",
		[ctx.tenant, f.ids.grant, d.id],
	);
	await transition(
		{ tenant: ctx.tenant, token: f.tokens.agency, grant: f.ids.grant },
		d.id,
		{
			command_id: randomUUID(),
			to_stage_id: p.stages[1].id,
			expected_version: 0,
			reason: "Synthetic grant",
		},
		randomUUID(),
	);
	await admin.query(
		"UPDATE crm.agency_grant SET revoked_at=now() WHERE tenant_id=$1 AND id=$2",
		[ctx.tenant, f.ids.grant],
	);
	await drain();
	assert.equal(await count("task"), 0);
	const task = await create("tasks", {
		contact_id: c.id,
		title: "Assigned task",
		due_at: new Date(Date.now() + 60000).toISOString(),
	});
	await admin.query(
		"UPDATE crm.membership SET role='rep' WHERE tenant_id=$1 AND principal_id=$2",
		[ctx.tenant, f.ids.manager],
	);
	for (const table of ["lead", "task"])
		await admin.query(
			`UPDATE crm.${table} SET owner_id=$2 WHERE tenant_id=$1`,
			[ctx.tenant, f.ids.reader],
		);
	for (const [kind, object] of [
		["leads", l.id],
		["tasks", task.id],
	]) {
		await assert.rejects(request(`${kind}/${object}`), fail("FORBIDDEN"));
		await assert.rejects(
			request(`${kind}/${object}`, "PATCH", {
				command_id: randomUUID(),
				expected_version: 0,
				title: "Denied",
			}),
			fail("FORBIDDEN"),
		);
		assert.equal((await request(kind)).data.length, 0);
	}
});
test("M1-18 database relationship agreement and scheduled escalation keep real worker authority", async () => {
	await fresh();
	const { c, d } = await flow(),
		other = await contact();
	await assert.rejects(
		admin.query(
			"INSERT INTO crm.task(tenant_id,id,contact_id,deal_id,owner_id,title,due_at) VALUES($1,$2,$3,$4,$5,'Mismatch',now())",
			[ctx.tenant, randomUUID(), other.id, d.id, f.ids.manager],
		),
		(e: unknown) => (e as { code: string }).code === "23514",
	);
	const task = await create("tasks", {
		contact_id: c.id,
		deal_id: d.id,
		title: "Escalate",
		due_at: new Date(Date.now() - 60000).toISOString(),
	});
	await drain();
	const row = (
		await admin.query(
			"SELECT o.actor_id,o.status,a.actor_id audit_actor FROM crm.outbox o JOIN crm.business_event e ON (e.tenant_id,e.id)=(o.tenant_id,o.event_id) JOIN crm.audit_log a ON a.tenant_id=o.tenant_id AND a.object_id=o.object_id AND a.action='task.escalated' WHERE o.tenant_id=$1 AND o.object_id=$2 AND e.name='task.escalated'",
			[ctx.tenant, task.id],
		)
	).rows[0];
	assert.equal(row.actor_id, f.ids.worker);
	assert.equal(row.audit_actor, f.ids.worker);
	assert.equal(row.status, "processed");
});
