import { createHash, randomUUID } from "node:crypto";
import { authorize, type Context, Fault, transaction } from "./db.js";
import { permit } from "./crm.js";
export type Command = {
	to_stage_id: string;
	expected_version: number;
	command_id: string;
	reason: string;
};
export async function transition(
	ctx: Context,
	dealId: string,
	cmd: Command,
	key: string,
	requestId = randomUUID(),
) {
	return transaction(ctx, async (db) => {
		await authorize(db, "crm.write", dealId, ctx.grant);
		await permit(db, ctx, "crm.write", "deal", dealId);
		const {
			rows: [deal],
		} = await db.query(
			"SELECT * FROM crm.deal WHERE tenant_id=$1 AND id=$2 FOR UPDATE",
			[ctx.tenant, dealId],
		);
		if (!deal) throw new Fault(404, "NOT_FOUND");
		const operation = `deal:${dealId}:transition`;
		const hash = createHash("sha256")
			.update(
				JSON.stringify([
					dealId,
					cmd.to_stage_id,
					cmd.expected_version,
					cmd.command_id,
					cmd.reason,
				]),
			)
			.digest("hex");
		// Serialize same actor/route retry keys as well as same-deal commands.
		const {
			rows: [receipt],
		} = await db.query(
			"SELECT request_hash,transition_id FROM crm.command_receipt WHERE tenant_id=$1 AND actor_id=crm.actor() AND operation=$2 AND command_id=$3",
			[ctx.tenant, operation, cmd.command_id],
		);
		const {
			rows: [cache],
		} = await db.query(
			"SELECT request_hash,transition_id FROM crm.api_retry WHERE tenant_id=$1 AND actor_id=crm.actor() AND operation=$2 AND key=$3 AND expires_at>now()",
			[ctx.tenant, operation, key],
		);
		if (
			(receipt && receipt.request_hash !== hash) ||
			(cache && cache.request_hash !== hash)
		)
			throw new Fault(409, "IDEMPOTENCY_CONFLICT");
		if (receipt || cache) {
			// The deal lock also serializes keys within this actor/operation scope.
			// A durable replay must bind a new/expired retry key before it commits.
			if (!cache) {
				await db.query(
					"INSERT INTO crm.api_retry(tenant_id,actor_id,operation,key,request_hash,transition_id) VALUES($1,crm.actor(),$2,$3,$4,$5) ON CONFLICT(tenant_id,actor_id,operation,key) DO UPDATE SET request_hash=excluded.request_hash,transition_id=excluded.transition_id,expires_at=now()+interval '7 days'",
					[ctx.tenant, operation, key, hash, receipt.transition_id],
				);
			}
			const {
				rows: [old],
			} = await db.query(
				"SELECT id,deal_version version,to_stage stage_id FROM crm.stage_transition WHERE tenant_id=$1 AND id=$2",
				[ctx.tenant, (receipt ?? cache).transition_id],
			);
			return { ...old, replayed: true };
		}
		if (deal.version !== cmd.expected_version)
			throw new Fault(409, "VERSION_CONFLICT");
		const { rowCount } = await db.query(
			"SELECT 1 FROM crm.allowed_transition WHERE tenant_id=$1 AND pipeline_id=$2 AND from_stage=$3 AND to_stage=$4",
			[ctx.tenant, deal.pipeline_id, deal.stage_id, cmd.to_stage_id],
		);
		if (!rowCount) throw new Fault(422, "INVALID_TRANSITION");
		const {
			rows: [target],
		} = await db.query(
			"SELECT outcome FROM crm.stage WHERE tenant_id=$1 AND id=$2 AND NOT archived",
			[ctx.tenant, cmd.to_stage_id],
		);
		if (!target) throw new Fault(422, "INVALID_TRANSITION");
		if (target.outcome === "lost" && !cmd.reason.trim())
			throw new Fault(422, "LOSS_REASON_REQUIRED");
		const id = randomUUID(),
			event = randomUUID(),
			outbox = randomUUID(),
			version = deal.version + 1;
		await db.query(
			"UPDATE crm.deal SET stage_id=$3,version=$4 WHERE tenant_id=$1 AND id=$2",
			[ctx.tenant, dealId, cmd.to_stage_id, version],
		);
		await db.query(
			"INSERT INTO crm.stage_transition(tenant_id,id,deal_id,pipeline_id,from_stage,to_stage,actor_id,grant_id,command_id,deal_version,reason) VALUES($1,$2,$3,$4,$5,$6,crm.actor(),$7,$8,$9,$10)",
			[
				ctx.tenant,
				id,
				dealId,
				deal.pipeline_id,
				deal.stage_id,
				cmd.to_stage_id,
				ctx.grant ?? null,
				cmd.command_id,
				version,
				cmd.reason,
			],
		);
		await db.query(
			"INSERT INTO crm.business_event(tenant_id,id,transition_id) VALUES($1,$2,$3)",
			[ctx.tenant, event, id],
		);
		if (target.outcome === "won")
			await db.query(
				"INSERT INTO crm.commercial_outcome(tenant_id,deal_id,event_id,outcome_key) VALUES($1,$2,$3,$4) ON CONFLICT(tenant_id,deal_id) DO NOTHING",
				[ctx.tenant, dealId, event, `deal:${dealId}:won`],
			);
		await db.query(
			"INSERT INTO crm.outbox(tenant_id,id,event_id,actor_id,grant_id,deal_id) VALUES($1,$2,$3,crm.actor(),$4,$5)",
			[ctx.tenant, outbox, event, ctx.grant ?? null, dealId],
		);
		await db.query(
			"INSERT INTO crm.audit_log(tenant_id,id,actor_id,grant_id,transition_id,action,request_id) VALUES($1,$2,crm.actor(),$3,$4,'crm.write',$5)",
			[ctx.tenant, randomUUID(), ctx.grant ?? null, id, requestId],
		);
		await db.query(
			"INSERT INTO crm.command_receipt VALUES($1,crm.actor(),$2,$3,$4,$5)",
			[ctx.tenant, operation, cmd.command_id, hash, id],
		);
		await db.query(
			"INSERT INTO crm.api_retry(tenant_id,actor_id,operation,key,request_hash,transition_id) VALUES($1,crm.actor(),$2,$3,$4,$5) ON CONFLICT(tenant_id,actor_id,operation,key) DO UPDATE SET request_hash=excluded.request_hash,transition_id=excluded.transition_id,expires_at=now()+interval '7 days'",
			[ctx.tenant, operation, key, hash, id],
		);
		return { id, version, stage_id: cmd.to_stage_id, replayed: false };
	});
}
