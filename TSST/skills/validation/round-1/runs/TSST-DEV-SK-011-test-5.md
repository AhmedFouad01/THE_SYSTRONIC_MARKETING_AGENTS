# Test Run: TSST-DEV-SK-011 · Test 5

## Prompt
Evaluate adverse-path worker process termination and atomicity under CRM transactional outbox patterns. Inspect `tests/crash-worker.ts`, verify the simulated crash exit code, and document test assertions ensuring no orphaned effects survive unexpected failure.

---

## Raw Execution Output

### Crash Test Fixture (`tests/crash-worker.ts`)
```typescript
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
```

### Observed Execution & Verification Result
- **Simulated Event:** Subprocess triggers `process.exit(77)` after uncommitted effect insert into `crm.worker_effect`.
- **Observed Behavior:**
  - Operating system kills client socket connection; PostgreSQL backend detects client disconnect and immediately initiates automatic transaction abort (`ROLLBACK`).
  - Uncommitted row in `crm.worker_effect` is cleared.
  - Job lock on `crm.outbox` (`FOR UPDATE SKIP LOCKED`) is released instantly.
  - Successor worker process claims the job and re-executes idempotently without duplicate side-effects.
- **Verification Evidence:** Confirmed in `tests/foundation.test.ts` (test 10: "retry + process exit after effect SQL + fresh worker process yields one logical effect and processed state").
- **Status:** PASS.
