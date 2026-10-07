import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { randomUUID, randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import pg from "pg";
import { seed } from "../scripts/seed.js";
import { crmRequest, type Body } from "../src/crm.js";
import {
	pool,
	transaction,
	assertIdentifierConfiguration,
	Fault,
	type Context,
} from "../src/db.js";
import { server } from "../src/api.js";
const admin = new pg.Client({
	connectionString: process.env.ADMIN_DATABASE_URL,
});
before(async () => {
	await admin.connect();
});
after(async () => {
	await admin.end();
	await pool.end();
});
const call = (
	ctx: Context,
	path: string,
	method = "GET",
	body: Body = {},
	key = randomUUID(),
) =>
	crmRequest(
		ctx,
		method,
		`/v1/${path}`,
		new URLSearchParams(),
		body,
		key,
		randomUUID(),
	);
const create = async (ctx: Context, path: string, b: Body) =>
	(await call(ctx, path, "POST", { command_id: randomUUID(), ...b }))
		.data as pg.QueryResultRow;
const fault = (code: string) => (e: unknown) =>
	e instanceof Fault && e.code === code;
async function fixture() {
	const f = await seed(admin);
	return { f, ctx: { tenant: f.ids.a, token: f.tokens.manager } };
}
async function snapshot(tenant: string) {
	const result: Record<string, unknown> = {};
	for (const table of [
		"contact",
		"contact_identifier",
		"lead",
		"task",
		"audit_log",
		"business_event",
		"outbox",
		"inbox",
		"command_retry",
	])
		result[table] = (
			await admin.query(
				`SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]') rows FROM crm.${table} t WHERE tenant_id=$1`,
				[tenant],
			)
		).rows[0].rows;
	return result;
}
test("M1-R01 valid configured key stays unchanged; runtime cannot provision or read it", async () => {
	const { ctx } = await fixture();
	const beforeKey = (
		await admin.query(
			"SELECT key FROM crm.identifier_secret WHERE tenant_id=$1",
			[ctx.tenant],
		)
	).rows[0].key;
	const c = await create(ctx, "contacts", {
		display_name: "Synthetic",
		identifiers: [{ kind: "email", value: "valid@example.invalid" }],
	});
	assert.equal(c.identifiers[0].value, "valid@example.invalid");
	await admin.query("SELECT crm.provision_identifier_key($1)", [ctx.tenant]);
	assert.ok(
		(
			await admin.query(
				"SELECT key FROM crm.identifier_secret WHERE tenant_id=$1",
				[ctx.tenant],
			)
		).rows[0].key === beforeKey,
		"Existing protected key changed",
	);
	for (const sql of [
		"SELECT * FROM crm.identifier_secret",
		"SELECT crm.provision_identifier_key(crm.context_tenant())",
	])
		await assert.rejects(
			transaction(ctx, (db) => db.query(sql)),
			(e: unknown) => (e as { code: string }).code === "42501",
		);
	await assertIdentifierConfiguration();
});
for (const mode of ["missing", "invalid", "wrong"] as const)
	test(`M1-R02 ${mode} key fails closed without ciphertext/business changes or leaked startup/API errors`, async () => {
		const { ctx } = await fixture();
		const c = await create(ctx, "contacts", {
			display_name: "Encrypted",
			identifiers: [{ kind: "email", value: "protected@example.invalid" }],
		});
		const saved = (
			await admin.query(
				"SELECT * FROM crm.identifier_secret WHERE tenant_id=$1",
				[ctx.tenant],
			)
		).rows[0];
		const replacement =
			mode === "invalid"
				? "invalid-secret-marker"
				: randomBytes(32).toString("hex");
		const beforeRows = await snapshot(ctx.tenant);
		const app = server();
		await new Promise<void>((r) => app.listen(0, "127.0.0.1", r));
		try {
			if (mode === "missing")
				await admin.query(
					"DELETE FROM crm.identifier_secret WHERE tenant_id=$1",
					[ctx.tenant],
				);
			else
				await admin.query(
					"UPDATE crm.identifier_secret SET key=$2 WHERE tenant_id=$1",
					[ctx.tenant, replacement],
				);
			await assert.rejects(
				call(ctx, `contacts/${c.id}`),
				fault("PROTECTED_KEY_UNAVAILABLE"),
			);
			await assert.rejects(
				create(ctx, "contacts", {
					display_name: "Rejected",
					identifiers: [{ kind: "email", value: "new@example.invalid" }],
				}),
				fault("PROTECTED_KEY_UNAVAILABLE"),
			);
			await assert.rejects(
				assertIdentifierConfiguration(),
				fault("PROTECTED_KEY_UNAVAILABLE"),
			);
			if (mode === "missing") {
				await assert.rejects(
					admin.query("SELECT crm.provision_identifier_key($1)", [ctx.tenant]),
					(e: unknown) => (e as { code: string }).code === "PCK01",
				);
				assert.equal(
					(
						await admin.query(
							"SELECT 1 FROM crm.identifier_secret WHERE tenant_id=$1",
							[ctx.tenant],
						)
					).rowCount,
					0,
				);
			}
			const address = app.address() as { port: number };
			const response = await fetch(
				`http://127.0.0.1:${address.port}/v1/contacts/${c.id}`,
				{
					headers: {
						Authorization: `Bearer ${ctx.token}`,
						"X-Tenant-ID": ctx.tenant,
					},
				},
			);
			assert.equal(response.status, 503);
			const returned = await response.text();
			assert.ok(returned.includes("PROTECTED_KEY_UNAVAILABLE"));
			for (const secret of [
				saved.key,
				replacement,
				"protected@example.invalid",
			])
				assert.ok(!returned.includes(secret));
			for (const entry of ["src/api.ts", "src/worker.ts"]) {
				const child = spawnSync(process.execPath, ["--import", "tsx", entry], {
					env: { ...process.env, PORT: "0" },
					encoding: "utf8",
					windowsHide: true,
					// Repeated lane runs retain identifiers; the all-tenant startup scan alone
					// measured 9.1s at 35k rows. Keep startup failure bounded without
					// racing the scan against the former 10s child-process limit.
					timeout: 30000,
				});
				assert.equal(child.status, 1);
				assert.ok(child.stdout === "", "Unexpected startup output");
				assert.ok(
					child.stderr.trim() === "PROTECTED_KEY_UNAVAILABLE",
					"Startup error was not sanitized",
				);
			}
			assert.deepEqual(await snapshot(ctx.tenant), beforeRows);
		} finally {
			await admin.query(
				"INSERT INTO crm.identifier_secret(tenant_id,key,key_fingerprint) VALUES($1,$2,$3) ON CONFLICT(tenant_id) DO UPDATE SET key=excluded.key,key_fingerprint=excluded.key_fingerprint",
				[ctx.tenant, saved.key, saved.key_fingerprint],
			);
			await new Promise<void>((r) => app.close(() => r()));
		}
		assert.equal(
			(await call(ctx, `contacts/${c.id}`)).data.identifiers[0].value,
			"protected@example.invalid",
		);
	});
test("M1-R03 new tenant with no configured key cannot write protected data or start; explicit admin provisioning works", async () => {
	const { ctx } = await fixture();
	await admin.query("DELETE FROM crm.identifier_secret WHERE tenant_id=$1", [
		ctx.tenant,
	]);
	try {
		await assert.rejects(
			assertIdentifierConfiguration(),
			fault("PROTECTED_KEY_UNAVAILABLE"),
		);
		await assert.rejects(
			create(ctx, "contacts", {
				display_name: "Rejected",
				identifiers: [{ kind: "email", value: "new@example.invalid" }],
			}),
			fault("PROTECTED_KEY_UNAVAILABLE"),
		);
		assert.equal(
			(
				await admin.query(
					"SELECT 1 FROM crm.identifier_secret WHERE tenant_id=$1",
					[ctx.tenant],
				)
			).rowCount,
			0,
		);
	} finally {
		await admin.query("SELECT crm.provision_identifier_key($1)", [ctx.tenant]);
	}
	await assertIdentifierConfiguration();
});
async function linkFixture() {
	const { f, ctx } = await fixture();
	await admin.query(
		"UPDATE crm.membership SET role='rep' WHERE tenant_id=$1 AND principal_id=$2",
		[ctx.tenant, f.ids.reader],
	);
	const rep = { ...ctx, token: f.tokens.reader };
	const contact = await create(ctx, "contacts", {
		display_name: "Rep contact",
		owner_id: f.ids.reader,
	});
	const task = await create(ctx, "tasks", {
		contact_id: contact.id,
		owner_id: f.ids.reader,
		title: "Rep task",
		due_at: "2030-01-01T00:00:00Z",
	});
	const deal = async (owner: string) =>
		create(ctx, "deals", {
			contact_id: contact.id,
			owner_id: owner,
			pipeline_id: f.ids.pipeline,
			stage_id: f.ids.start,
			title: "Synthetic deal",
		});
	return { f, ctx, rep, contact, task, deal };
}
test("M1-R04 authorized task/deal link, authorized change and contact-preserving unlink pass", async () => {
	const { f, rep, task, deal } = await linkFixture();
	const a = await deal(f.ids.reader),
		b = await deal(f.ids.reader);
	for (const [version, target] of [a.id, b.id, null].entries()) {
		const updated = await call(rep, `tasks/${task.id}`, "PATCH", {
			command_id: randomUUID(),
			expected_version: version,
			deal_id: target,
		});
		assert.equal(updated.data.deal_id, target);
		assert.equal(updated.data.version, version + 1);
	}
});
for (const targetType of ["manager", "other-rep", "cross-tenant"] as const)
	test(`M1-R05 ${targetType} deal link denied; task/receipt/audit/event/outbox unchanged`, async () => {
		const { f, ctx, rep, task, deal } = await linkFixture();
		// Manager creates the restricted deal before its own role is restricted.
		const target =
			targetType === "cross-tenant"
				? f.ids.dealB
				: (await deal(f.ids.manager)).id;
		if (targetType === "other-rep")
			await admin.query(
				"UPDATE crm.membership SET role='rep' WHERE tenant_id=$1 AND principal_id=$2",
				[ctx.tenant, f.ids.manager],
			);
		const beforeRows = await snapshot(ctx.tenant);
		await assert.rejects(
			call(rep, `tasks/${task.id}`, "PATCH", {
				command_id: randomUUID(),
				expected_version: 0,
				deal_id: target,
			}),
			fault(targetType === "cross-tenant" ? "NOT_FOUND" : "FORBIDDEN"),
		);
		assert.deepEqual(await snapshot(ctx.tenant), beforeRows);
	});
test("M1-R06 replay rechecks target-deal authority; other link fields remain rejected", async () => {
	const { f, ctx, rep, task, deal } = await linkFixture();
	const d = await deal(f.ids.reader);
	const body = { command_id: randomUUID(), expected_version: 0, deal_id: d.id };
	const key = randomUUID();
	await call(rep, `tasks/${task.id}`, "PATCH", body, key);
	await admin.query(
		"UPDATE crm.deal SET owner_id=$3 WHERE tenant_id=$1 AND id=$2",
		[ctx.tenant, d.id, f.ids.manager],
	);
	const beforeRows = await snapshot(ctx.tenant);
	await assert.rejects(
		call(rep, `tasks/${task.id}`, "PATCH", body, key),
		fault("FORBIDDEN"),
	);
	await assert.rejects(
		call(rep, `tasks/${task.id}`, "PATCH", {
			command_id: randomUUID(),
			expected_version: 1,
			contact_id: randomUUID(),
		}),
		fault("FIELD_NOT_WRITABLE"),
	);
	assert.deepEqual(await snapshot(ctx.tenant), beforeRows);
});
