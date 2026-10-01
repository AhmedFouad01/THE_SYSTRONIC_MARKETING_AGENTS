import pg from "pg";
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
const ctx = JSON.parse(process.env.WORKER_CONTEXTS ?? "[]")[0];
await db.query("BEGIN");
await db.query(
	"SELECT set_config('crm.tenant',$1,true),set_config('crm.token',$2,true)",
	[ctx.tenant, ctx.token],
);
const {
	rows: [job],
} = await db.query(
	"SELECT id FROM crm.outbox WHERE tenant_id=$1 AND status IN ('pending','retry') FOR UPDATE SKIP LOCKED LIMIT 1",
	[ctx.tenant],
);
if (!job) throw new Error("No crash fixture");
await db.query(
	"INSERT INTO crm.worker_effect(tenant_id,outbox_id) VALUES($1,$2)",
	[ctx.tenant, job.id],
);
// Abrupt process death after effect SQL, before commit/acknowledgment.
process.exit(77);
