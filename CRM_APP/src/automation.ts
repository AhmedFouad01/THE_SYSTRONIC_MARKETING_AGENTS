import { randomUUID } from "node:crypto";
import type pg from "pg";
import type { Context } from "./db.js";
export async function followUp(
	db: pg.PoolClient,
	ctx: Context,
	job: {
		id: string;
		event_id: string;
		actor_id: string;
		grant_id: string | null;
		deal_id: string | null;
	},
) {
	if (!job.deal_id) return;
	const { rows: rules } = await db.query(
		"SELECT v.*,r.enabled,d.contact_id,d.owner_id FROM crm.business_event e JOIN crm.stage_transition s ON (s.tenant_id,s.id)=(e.tenant_id,e.transition_id) JOIN crm.automation_version v ON v.tenant_id=s.tenant_id AND v.stage_id=s.to_stage JOIN crm.automation_rule r ON (r.tenant_id,r.id)=(v.tenant_id,v.rule_id) JOIN crm.deal d ON (d.tenant_id,d.id)=(s.tenant_id,s.deal_id) WHERE e.tenant_id=$1 AND e.id=$2 FOR SHARE OF r",
		[ctx.tenant, job.event_id],
	);
	for (const rule of rules) {
		if (
			(
				await db.query(
					"SELECT 1 FROM crm.automation_run WHERE tenant_id=$1 AND version_id=$2 AND event_id=$3",
					[ctx.tenant, rule.id, job.event_id],
				)
			).rowCount
		)
			continue;
		const run = randomUUID(),
			task = rule.enabled ? randomUUID() : null;
		if (task) {
			const {
				rows: [valid],
			} = await db.query("SELECT crm.assignment_ok($1) valid", [rule.owner_id]);
			if (!valid.valid) throw new Error("Assignment revoked");
			await db.query(
				"INSERT INTO crm.task(tenant_id,id,contact_id,deal_id,owner_id,title,due_at) VALUES($1,$2,$3,$4,$5,$6,now()+$7*interval '1 minute')",
				[
					ctx.tenant,
					task,
					rule.contact_id,
					job.deal_id,
					rule.owner_id,
					rule.title,
					rule.delay_minutes,
				],
			);
			const event = randomUUID();
			await db.query(
				"INSERT INTO crm.business_event(tenant_id,id,name,object_kind,object_id) VALUES($1,$2,'automation.task_created','task',$3)",
				[ctx.tenant, event, task],
			);
			await db.query(
				"INSERT INTO crm.outbox(tenant_id,id,event_id,actor_id,grant_id,deal_id,object_kind,object_id) VALUES($1,$2,$3,$4,$5,$6,'task',$7)",
				[
					ctx.tenant,
					randomUUID(),
					event,
					job.actor_id,
					job.grant_id,
					job.deal_id,
					task,
				],
			);
			await db.query(
				"INSERT INTO crm.audit_log(tenant_id,id,actor_id,grant_id,action,request_id,object_kind,object_id,changed_fields) VALUES($1,$2,$3,$4,'automation.task_created',$5,'task',$6,ARRAY['title','owner_id','due_at'])",
				[
					ctx.tenant,
					randomUUID(),
					job.actor_id,
					job.grant_id,
					randomUUID(),
					task,
				],
			);
		}
		await db.query("INSERT INTO crm.automation_run VALUES($1,$2,$3,$4,$5,$6)", [
			ctx.tenant,
			run,
			rule.id,
			job.event_id,
			task,
			rule.enabled ? "completed" : "disabled",
		]);
	}
}
export async function escalateOne(db: pg.PoolClient, ctx: Context) {
	const {
		rows: [task],
	} = await db.query(
		"SELECT t.* FROM crm.task t WHERE t.tenant_id=$1 AND t.status='open' AND t.due_at<now() AND crm.assignment_ok(t.owner_id) AND NOT EXISTS(SELECT 1 FROM crm.task_escalation e WHERE (e.tenant_id,e.task_id)=(t.tenant_id,t.id)) ORDER BY t.due_at FOR UPDATE SKIP LOCKED LIMIT 1",
		[ctx.tenant],
	);
	if (!task) return false;
	const result = await db.query(
		"INSERT INTO crm.task_escalation(tenant_id,task_id,id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING id",
		[ctx.tenant, task.id, randomUUID()],
	);
	if (result.rowCount) {
		const event = randomUUID();
		await db.query(
			"INSERT INTO crm.business_event(tenant_id,id,name,object_kind,object_id) VALUES($1,$2,'task.escalated','task',$3)",
			[ctx.tenant, event, task.id],
		);
		await db.query(
			"INSERT INTO crm.outbox(tenant_id,id,event_id,actor_id,object_kind,object_id) VALUES($1,$2,$3,crm.actor(),'task',$4)",
			[ctx.tenant, randomUUID(), event, task.id],
		);
		await db.query(
			"INSERT INTO crm.audit_log(tenant_id,id,actor_id,action,request_id,object_kind,object_id,changed_fields) VALUES($1,$2,crm.actor(),'task.escalated',$3,'task',$4,ARRAY['overdue'])",
			[ctx.tenant, randomUUID(), randomUUID(), task.id],
		);
	}
	return true;
}
