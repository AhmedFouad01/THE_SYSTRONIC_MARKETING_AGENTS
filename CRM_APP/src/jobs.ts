import { followUp, escalateOne } from "./automation.js";
import { authorize, type Context, transaction } from "./db.js";
import { attributionWorkOne } from "./journey.js";
import { searchRebuildOne } from "./searchrebuild.js";
// One bounded database effect. Holding a row lock avoids lease races; a process death
// rolls back the transaction, so another worker can claim it immediately.
export async function workOne(ctx: Context, fault?: "retry" | "crash") {
	const worked = await transaction(ctx, async (db) => {
		await authorize(db, "automation.execute", null);
		const {
			rows: [job],
		} = await db.query(
			"SELECT * FROM crm.outbox WHERE tenant_id=$1 AND status IN ('pending','retry') AND next_attempt_at<=now() ORDER BY next_attempt_at,id FOR UPDATE SKIP LOCKED LIMIT 1",
			[ctx.tenant],
		);
		if (!job) return escalateOne(db, ctx);
		const {
			rows: [auth],
		} = await db.query("SELECT crm.job_authorized($1) allowed", [job.id]);
		if (!auth.allowed) {
			await db.query(
				"UPDATE crm.outbox SET status='blocked',error_code='AUTHORITY_REVOKED',attempts=attempts+1 WHERE tenant_id=$1 AND id=$2",
				[ctx.tenant, job.id],
			);
			return true;
		}
		await db.query("SAVEPOINT effect");
		try {
			await db.query(
				"INSERT INTO crm.worker_effect(tenant_id,outbox_id) VALUES($1,$2) ON CONFLICT DO NOTHING",
				[ctx.tenant, job.id],
			);
			await followUp(db, ctx, job);
			if (fault) throw new Error(fault);
			await db.query(
				"UPDATE crm.outbox SET status='processed',processed_at=now(),attempts=attempts+1,error_code=NULL WHERE tenant_id=$1 AND id=$2",
				[ctx.tenant, job.id],
			);
		} catch (error) {
			if (fault === "crash") throw error;
			await db.query("ROLLBACK TO SAVEPOINT effect");
			await db.query(
				"UPDATE crm.outbox SET status=CASE WHEN attempts>=4 THEN 'dead' ELSE 'retry' END,attempts=attempts+1,error_code='RETRYABLE',next_attempt_at=now()+interval '1 second' WHERE tenant_id=$1 AND id=$2",
				[ctx.tenant, job.id],
			);
		}
		return true;
	});
	return worked || (await attributionWorkOne(ctx)) || searchRebuildOne(ctx);
}
