import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import pg from "pg";
import { seed } from "../scripts/seed.js";
import { pool, transaction, Fault } from "../src/db.js";
import { transition } from "../src/transition.js";
import { workOne } from "../src/jobs.js";
import { server } from "../src/api.js";
const admin = new pg.Client({
	connectionString: process.env.ADMIN_DATABASE_URL,
});
let f: Awaited<ReturnType<typeof seed>>;
before(async () => {
	await admin.connect();
});
after(async () => {
	await admin.end();
	await pool.end();
});
const fresh = async () => {
	f = await seed(admin);
	return f;
};
const context = () => ({ tenant: f.ids.a, token: f.tokens.manager });
const worker = () => ({ tenant: f.ids.a, token: f.tokens.worker });
const command = () => ({
	to_stage_id: f.ids.qualified,
	expected_version: 0,
	command_id: randomUUID(),
	reason: "Synthetic proof",
});
const isFault = (status: number) => (e: unknown) =>
	e instanceof Fault && e.status === status;
test("01 runtime is non-owner/non-bypass; all business tables FORCE RLS", async () => {
	const {
		rows: [role],
	} = await pool.query(
		"SELECT rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user",
	);
	assert.deepEqual(role, { rolsuper: false, rolbypassrls: false });
	const { rows } = await admin.query(
		"SELECT relname,relrowsecurity,relforcerowsecurity,pg_get_userbyid(relowner) owner FROM pg_class JOIN pg_namespace n ON n.oid=relnamespace WHERE n.nspname='crm' AND relkind='r' AND relname NOT IN ('tenant','principal','role_permission','session')",
	);
	assert.ok(rows.length >= 14);
	for (const r of rows) {
		assert.ok(r.relrowsecurity && r.relforcerowsecurity);
		assert.notEqual(r.owner, "crm_runtime");
	}
});
test("02 Tenant A cannot read/update Tenant B; tenant-equal FK rejects cross-tenant contact", async () => {
	await fresh();
	await transaction(context(), async (db) => {
		assert.equal(
			(await db.query("SELECT * FROM crm.deal WHERE id=$1", [f.ids.dealB]))
				.rowCount,
			0,
		);
		assert.equal(
			(
				await db.query("UPDATE crm.deal SET version=99 WHERE id=$1", [
					f.ids.dealB,
				])
			).rowCount,
			0,
		);
	});
	const foreign = randomUUID();
	await admin.query("INSERT INTO crm.contact VALUES($1,$2,$3)", [
		f.ids.b,
		foreign,
		"B only",
	]);
	await assert.rejects(
		admin.query(
			"INSERT INTO crm.deal(tenant_id,id,contact_id,pipeline_id,stage_id,owner_id) VALUES($1,$2,$3,$4,$5,$6)",
			[
				f.ids.a,
				randomUUID(),
				foreign,
				f.ids.pipeline,
				f.ids.start,
				f.ids.manager,
			],
		),
		(e: unknown) => (e as { code: string }).code === "23503",
	);
});
test("03 forged tenant/actor/token context fails and pooled context is transaction local", async () => {
	await fresh();
	await assert.rejects(
		transaction({ ...context(), tenant: f.ids.b }, async () => 1),
		isFault(403),
	);
	await assert.rejects(
		transaction({ ...context(), token: "forged" }, async () => 1),
		isFault(401),
	);
	await transaction(context(), async (db) => {
		await db.query(
			"SELECT set_config('crm.tenant',$1,true),set_config('crm.actor',$2,true)",
			[f.ids.b, f.ids.agency],
		);
		assert.equal((await db.query("SELECT * FROM crm.deal")).rowCount, 0);
	});
	assert.equal((await pool.query("SELECT * FROM crm.deal")).rowCount, 0);
});
test("04 unauthorized action and assigned-object scope fail", async () => {
	await fresh();
	await assert.rejects(
		transition(
			{ ...context(), token: f.tokens.reader },
			f.ids.dealA,
			command(),
			"reader",
		),
		isFault(403),
	);
	await admin.query(
		"UPDATE crm.membership SET role='rep' WHERE tenant_id=$1 AND principal_id=$2",
		[f.ids.a, f.ids.manager],
	);
	await admin.query("UPDATE crm.deal SET owner_id=$1 WHERE tenant_id=$2", [
		f.ids.reader,
		f.ids.a,
	]);
	await assert.rejects(
		transition(context(), f.ids.dealA, command(), "rep"),
		isFault(403),
	);
});
test("05 revoked grant denies replay and pending worker effect", async () => {
	await fresh();
	const ctx = { tenant: f.ids.a, token: f.tokens.agency, grant: f.ids.grant },
		cmd = command();
	await transition(ctx, f.ids.dealA, cmd, "agency");
	await admin.query(
		"UPDATE crm.agency_grant SET revoked_at=now() WHERE tenant_id=$1",
		[f.ids.a],
	);
	await assert.rejects(
		transition(ctx, f.ids.dealA, cmd, "agency"),
		isFault(403),
	);
	await workOne(worker());
	assert.equal(
		(
			await admin.query("SELECT * FROM crm.worker_effect WHERE tenant_id=$1", [
				f.ids.a,
			])
		).rowCount,
		0,
	);
	assert.equal(
		(
			await admin.query("SELECT status FROM crm.outbox WHERE tenant_id=$1", [
				f.ids.a,
			])
		).rows[0].status,
		"blocked",
	);
});
test("06 valid transition creates one history/event/outbox/audit and durable command", async () => {
	await fresh();
	const result = await transition(context(), f.ids.dealA, command(), "valid");
	assert.equal(result.version, 1);
	for (const table of [
		"stage_transition",
		"business_event",
		"outbox",
		"audit_log",
		"command_receipt",
	])
		assert.equal(
			(
				await admin.query(`SELECT * FROM crm.${table} WHERE tenant_id=$1`, [
					f.ids.a,
				])
			).rowCount,
			1,
		);
});
test("07 invalid transition rolls back all state", async () => {
	await fresh();
	await assert.rejects(
		transition(
			context(),
			f.ids.dealA,
			{ ...command(), to_stage_id: f.ids.won },
			"invalid",
		),
		isFault(422),
	);
	assert.equal(
		(
			await admin.query("SELECT version FROM crm.deal WHERE tenant_id=$1", [
				f.ids.a,
			])
		).rows[0].version,
		0,
	);
	assert.equal(
		(
			await admin.query("SELECT * FROM crm.outbox WHERE tenant_id=$1", [
				f.ids.a,
			])
		).rowCount,
		0,
	);
});
test("08 stale expected_version and concurrent commands conflict", async () => {
	await fresh();
	const results = await Promise.allSettled([
		transition(context(), f.ids.dealA, command(), "one"),
		transition(context(), f.ids.dealA, command(), "two"),
	]);
	assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
	const failed = results.find((r) => r.status === "rejected");
	assert.ok(failed?.status === "rejected" && isFault(409)(failed.reason));
});
test("09 command replay survives cache expiry; changed body conflicts", async () => {
	await fresh();
	const cmd = command();
	const first = await transition(context(), f.ids.dealA, cmd, "retry");
	assert.equal(
		(await transition(context(), f.ids.dealA, cmd, "retry")).id,
		first.id,
	);
	await admin.query(
		"UPDATE crm.api_retry SET expires_at=now()-interval '1 day' WHERE tenant_id=$1",
		[f.ids.a],
	);
	assert.equal(
		(await transition(context(), f.ids.dealA, cmd, "new-cache-key")).id,
		first.id,
	);
	await assert.rejects(
		transition(context(), f.ids.dealA, { ...cmd, reason: "changed" }, "new"),
		isFault(409),
	);
	assert.equal(
		(
			await admin.query("SELECT * FROM crm.business_event WHERE tenant_id=$1", [
				f.ids.a,
			])
		).rowCount,
		1,
	);
});
test("10 worker retry + crash rollback + separate process restart creates one effect", async () => {
	await fresh();
	await transition(context(), f.ids.dealA, command(), "worker");
	await workOne(worker(), "retry");
	await admin.query(
		"UPDATE crm.outbox SET next_attempt_at=now() WHERE tenant_id=$1",
		[f.ids.a],
	);
	await assert.rejects(workOne(worker(), "crash"));
	await new Promise<void>((resolve, reject) => {
		const child = spawn(
			process.execPath,
			["--import", "tsx", "tests/crash-worker.ts"],
			{
				env: { ...process.env, WORKER_CONTEXTS: JSON.stringify([worker()]) },
				stdio: "pipe",
			},
		);
		child.on("error", reject);
		child.on("exit", (code) =>
			code === 77 ? resolve() : reject(new Error(`crash fixture exit ${code}`)),
		);
	});
	await new Promise<void>((resolve, reject) => {
		const child = spawn(
			process.execPath,
			["--import", "tsx", "src/worker.ts", "--once"],
			{
				env: { ...process.env, WORKER_CONTEXTS: JSON.stringify([worker()]) },
				stdio: "pipe",
			},
		);
		child.on("error", reject);
		child.on("exit", (code) =>
			code === 0 ? resolve() : reject(new Error(`worker exit ${code}`)),
		);
	});
	assert.equal(await workOne(worker()), false);
	assert.equal(
		(
			await admin.query("SELECT * FROM crm.worker_effect WHERE tenant_id=$1", [
				f.ids.a,
			])
		).rowCount,
		1,
	);
	const job = (
		await admin.query(
			"SELECT status,attempts FROM crm.outbox WHERE tenant_id=$1",
			[f.ids.a],
		)
	).rows[0];
	assert.deepEqual(job, { status: "processed", attempts: 2 });
});
test("11 atomic rollback when audit insert fails", async () => {
	await fresh();
	const req = randomUUID();
	await admin.query(
		`CREATE FUNCTION crm.test_reject_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.request_id='${req}'::uuid THEN RAISE EXCEPTION 'synthetic fault'; END IF; RETURN NEW; END $$; CREATE TRIGGER m0_test_audit BEFORE INSERT ON crm.audit_log FOR EACH ROW EXECUTE FUNCTION crm.test_reject_audit()`,
	);
	try {
		await assert.rejects(
			transition(context(), f.ids.dealA, command(), "atomic", req),
		);
		for (const table of [
			"stage_transition",
			"business_event",
			"outbox",
			"command_receipt",
		])
			assert.equal(
				(
					await admin.query(`SELECT * FROM crm.${table} WHERE tenant_id=$1`, [
						f.ids.a,
					])
				).rowCount,
				0,
			);
		assert.equal(
			(
				await admin.query("SELECT version FROM crm.deal WHERE tenant_id=$1", [
					f.ids.a,
				])
			).rows[0].version,
			0,
		);
	} finally {
		await admin.query(
			"DROP TRIGGER m0_test_audit ON crm.audit_log; DROP FUNCTION crm.test_reject_audit()",
		);
	}
});
test("12 HTTP validates fields, denies forged workspace and maps stale version to 409", async () => {
	await fresh();
	const app = server();
	await new Promise<void>((r) => app.listen(0, "127.0.0.1", r));
	const addr = app.address();
	assert.ok(addr && typeof addr !== "string");
	const url = `http://127.0.0.1:${addr.port}/v1/deals/${f.ids.dealA}/transitions`;
	const post = (body: unknown, tenant = f.ids.a) =>
		fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${f.tokens.manager}`,
				"X-Tenant-ID": tenant,
				"Idempotency-Key": randomUUID(),
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});
	try {
		assert.equal(
			(await post({ ...command(), actor_id: f.ids.agency })).status,
			422,
		);
		assert.equal((await post(command(), f.ids.b)).status, 403);
		assert.equal((await post(command())).status, 200);
		assert.equal(
			(await post({ ...command(), to_stage_id: f.ids.won })).status,
			409,
		);
	} finally {
		await new Promise<void>((r) => app.close(() => r()));
	}
});

test("13 A/K1 then A/K2 replay binds K2 and B/K2 conflicts without extra outcomes", async () => {
	await fresh();
	const a = command();
	const result = await transition(context(), f.ids.dealA, a, "K1");
	assert.equal(
		(await transition(context(), f.ids.dealA, a, "K2")).id,
		result.id,
	);
	assert.equal(
		(await transition(context(), f.ids.dealA, a, "K2")).id,
		result.id,
	);
	await assert.rejects(
		transition(
			context(),
			f.ids.dealA,
			{
				...a,
				to_stage_id: f.ids.won,
				expected_version: 1,
				command_id: randomUUID(),
			},
			"K2",
		),
		(e: unknown) =>
			e instanceof Fault &&
			e.status === 409 &&
			e.code === "IDEMPOTENCY_CONFLICT",
	);
	const cache = (
		await admin.query(
			"SELECT request_hash,transition_id FROM crm.api_retry WHERE tenant_id=$1 ORDER BY key",
			[f.ids.a],
		)
	).rows;
	assert.equal(cache.length, 2);
	assert.deepEqual(cache[0], cache[1]);
	// Expiring the retry cache cannot remove the durable command or its result.
	await admin.query(
		"UPDATE crm.api_retry SET expires_at=now()-interval '1 day' WHERE tenant_id=$1",
		[f.ids.a],
	);
	assert.equal(
		(await transition(context(), f.ids.dealA, a, "K2")).id,
		result.id,
	);
	await workOne(worker());
	for (const table of [
		"stage_transition",
		"business_event",
		"outbox",
		"audit_log",
		"command_receipt",
		"worker_effect",
	]) {
		assert.equal(
			(
				await admin.query(
					`SELECT count(*)::int count FROM crm.${table} WHERE tenant_id=$1`,
					[f.ids.a],
				)
			).rows[0].count,
			1,
		);
	}
	assert.equal(
		(
			await admin.query("SELECT version FROM crm.deal WHERE tenant_id=$1", [
				f.ids.a,
			])
		).rows[0].version,
		1,
	);
});

test("14 concurrent workers overlap on pending work and SKIP LOCKED yields one effect", async () => {
	await fresh();
	await transition(context(), f.ids.dealA, command(), "race");
	const key = Math.floor(Math.random() * 2_000_000_000) + 1;
	const {
		rows: [{ pid }],
	} = await admin.query("SELECT pg_backend_pid() pid");
	await admin.query(
		`CREATE FUNCTION crm.m0_claim_barrier() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.tenant_id='${f.ids.a}'::uuid THEN PERFORM pg_advisory_xact_lock(${key}::bigint); END IF; RETURN NEW; END $$; CREATE TRIGGER m0_claim_barrier BEFORE INSERT ON crm.worker_effect FOR EACH ROW EXECUTE FUNCTION crm.m0_claim_barrier()`,
	);
	await admin.query("SELECT pg_advisory_lock($1::bigint)", [key]);
	const first = workOne(worker());
	// Capture rejection immediately while waiting for the observable DB lock barrier.
	const settled = first.then(
		(value) => ({ value, error: null }),
		(error) => ({ value: false, error }),
	);
	try {
		let blocked = false;
		for (let i = 0; i < 200; i++) {
			blocked = (
				await admin.query(
					"SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE $1=ANY(pg_blocking_pids(pid)) AND query LIKE 'INSERT INTO crm.worker_effect%') blocked",
					[pid],
				)
			).rows[0].blocked;
			if (blocked) break;
			await new Promise((r) => setTimeout(r, 10));
		}
		assert.ok(
			blocked,
			"First worker must hold the outbox row lock at the effect barrier",
		);
		assert.equal(
			(
				await admin.query("SELECT status FROM crm.outbox WHERE tenant_id=$1", [
					f.ids.a,
				])
			).rows[0].status,
			"pending",
		);
		// First worker is still active and holds the claim; second must skip it.
		const reserved: pg.PoolClient[] = [];
		try {
			// Reserve every other connection so worker two must use the timed one.
			for (let i = 1; i < pool.options.max; i++) {
				reserved.push(await pool.connect());
			}
			const timed = reserved[reserved.length - 1];
			await timed.query("SET statement_timeout = '2s'");
			reserved.pop();
			timed.release();
			try {
				// PostgreSQL cancels a blocked claim if SKIP LOCKED regresses;
				// workOne then rolls back before the barrier is released below.
				assert.equal(await workOne(worker()), false);
			} finally {
				// The timed connection is still the only available pool slot.
				// Destroy it so its session timeout cannot leak into later tests.
				(await pool.connect()).release(true);
			}
		} finally {
			for (const connection of reserved) connection.release();
		}
		assert.equal(
			(
				await admin.query(
					"SELECT count(*)::int count FROM crm.worker_effect WHERE tenant_id=$1",
					[f.ids.a],
				)
			).rows[0].count,
			0,
		);
	} finally {
		await admin.query("SELECT pg_advisory_unlock($1::bigint)", [key]);
		await settled;
		await admin.query(
			"DROP TRIGGER m0_claim_barrier ON crm.worker_effect; DROP FUNCTION crm.m0_claim_barrier()",
		);
	}
	const outcome = await settled;
	if (outcome.error) throw outcome.error;
	assert.equal(outcome.value, true);
	assert.equal(
		(
			await admin.query(
				"SELECT count(*)::int count FROM crm.worker_effect WHERE tenant_id=$1",
				[f.ids.a],
			)
		).rows[0].count,
		1,
	);
	assert.deepEqual(
		(
			await admin.query(
				"SELECT status,attempts FROM crm.outbox WHERE tenant_id=$1",
				[f.ids.a],
			)
		).rows[0],
		{ status: "processed", attempts: 1 },
	);
});
