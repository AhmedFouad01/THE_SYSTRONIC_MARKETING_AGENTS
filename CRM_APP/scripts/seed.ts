import { randomUUID, randomBytes, createHash } from "node:crypto";
import { writeFile, readFile } from "node:fs/promises";
import pg from "pg";
export async function seed(db: pg.Client) {
	const ids = {
		a: randomUUID(),
		b: randomUUID(),
		manager: randomUUID(),
		reader: randomUUID(),
		agency: randomUUID(),
		worker: randomUUID(),
		member: randomUUID(),
		grant: randomUUID(),
		dealA: randomUUID(),
		dealB: randomUUID(),
		pipeline: randomUUID(),
		start: randomUUID(),
		qualified: randomUUID(),
		won: randomUUID(),
		contact: randomUUID(),
	};
	const tokens = {
		manager: randomBytes(32).toString("hex"),
		reader: randomBytes(32).toString("hex"),
		agency: randomBytes(32).toString("hex"),
		worker: randomBytes(32).toString("hex"),
	};
	const hasRegistry = Boolean(
		(await db.query("SELECT to_regprocedure('crm.seed_system_properties(uuid)') p")).rows[0].p,
	);
	await db.query("BEGIN");
	try {
		for (const [id, name] of [
			[ids.a, "Tenant A"],
			[ids.b, "Tenant B"],
		]) {
			await db.query("INSERT INTO crm.tenant VALUES($1,$2)", [id, name]);
			await db.query("SELECT crm.provision_identifier_key($1)", [id]);
			// 010+: system properties for the new tenant (owner-only, idempotent). Absent on pre-010 schemas (M2 upgrade checks).
			if (hasRegistry)
				await db.query("SELECT crm.seed_system_properties($1)", [id]);
		}
		for (const role of ["manager", "reader", "agency", "worker"] as const) {
			await db.query("INSERT INTO crm.principal VALUES($1,$2)", [
				ids[role],
				`Synthetic ${role}`,
			]);
			await db.query(
				"INSERT INTO crm.session(token_hash,principal_id,expires_at,mfa_verified) VALUES($1,$2,now()+interval '1 day',true)",
				[createHash("sha256").update(tokens[role]).digest("hex"), ids[role]],
			);
		}
		for (const [tenant, id, principal, role] of [
			[ids.a, randomUUID(), ids.manager, "manager"],
			[ids.a, randomUUID(), ids.reader, "reader"],
			[ids.b, ids.member, ids.agency, "manager"],
			[ids.a, randomUUID(), ids.worker, "worker"],
			[ids.b, randomUUID(), ids.worker, "worker"],
		])
			await db.query(
				"INSERT INTO crm.membership(tenant_id,id,principal_id,role) VALUES($1,$2,$3,$4)",
				[tenant, id, principal, role],
			);
		for (const tenant of [ids.a, ids.b]) {
			await db.query("INSERT INTO crm.contact VALUES($1,$2,$3)", [
				tenant,
				ids.contact,
				`Synthetic ${tenant === ids.a ? "A" : "B"}`,
			]);
			await db.query("INSERT INTO crm.pipeline VALUES($1,$2,$3)", [
				tenant,
				ids.pipeline,
				"M0 pipeline",
			]);
			for (const [id, name] of [
				[ids.start, "New"],
				[ids.qualified, "Qualified"],
				[ids.won, "Won"],
			])
				await db.query("INSERT INTO crm.stage VALUES($1,$2,$3,$4)", [
					tenant,
					id,
					ids.pipeline,
					name,
				]);
			await db.query(
				"INSERT INTO crm.allowed_transition VALUES($1,$2,$3,$4),($1,$2,$4,$5)",
				[tenant, ids.pipeline, ids.start, ids.qualified, ids.won],
			);
			await db.query(
				"INSERT INTO crm.deal(tenant_id,id,contact_id,pipeline_id,stage_id,owner_id) VALUES($1,$2,$3,$4,$5,$6)",
				[
					tenant,
					tenant === ids.a ? ids.dealA : ids.dealB,
					ids.contact,
					ids.pipeline,
					ids.start,
					tenant === ids.a ? ids.manager : ids.agency,
				],
			);
		}
		await db.query(
			"INSERT INTO crm.agency_grant(tenant_id,id,agency_tenant_id,membership_id,deal_id,action,expires_at) VALUES($1,$2,$3,$4,$5,'crm.write',now()+interval '1 day')",
			[ids.a, ids.grant, ids.b, ids.member, ids.dealA],
		);
		await db.query("COMMIT");
		return { ids, tokens };
	} catch (e) {
		await db.query("ROLLBACK");
		throw e;
	}
}
if (
	process.argv[1].endsWith("seed.ts") ||
	process.argv[1].endsWith("seed.js")
) {
	const db = new pg.Client({
		connectionString: process.env.ADMIN_DATABASE_URL,
	});
	await db.connect();
	try {
		const fixture = await seed(db);
		await writeFile("local-fixture.json", JSON.stringify(fixture, null, 2));
		const env = await readFile(".env", "utf8");
		await writeFile(
			".env",
			env.replace(
				/^WORKER_CONTEXTS=.*$/m,
				`WORKER_CONTEXTS='${JSON.stringify([fixture.ids.a, fixture.ids.b].map((tenant) => ({ tenant, token: fixture.tokens.worker })))}'`,
			),
		);
		console.log(
			"Synthetic fixture written to ignored local-fixture.json (sessions expire in 24 hours)",
		);
	} finally {
		await db.end();
	}
}
