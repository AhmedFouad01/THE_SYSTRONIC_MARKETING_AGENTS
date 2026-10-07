// ADR-002 P1b B4: bounded rebuild of `custom_search` after a property's searchable / sensitive / archived change (the B3 known risk:
// rows kept stale search text until their next write). Design:
//  - `requestSearchRebuild` (inside the schema write's transaction) upserts ONE queue row per (tenant, object): cursor reset, not done.
//  - `rebuildBatch` handles <= BATCH rows in id order inside one transaction, under the queue row's lock, then advances the cursor.
//    It reuses the B3 pure functions (searchSource, truncateBytes) and the registry as committed NOW, so the text is exactly what a
//    record write would have produced. Rows are locked FOR UPDATE (a concurrent write finishes first, never lost); only rows whose
//    text differs are written (idempotent: a second pass writes nothing) and updated_at/version are untouched (012 touch_row).
//  - A later schema change resets the cursor (the upsert waits for the batch's queue-row lock), so a pass never finishes on a stale
//    registry. The inline call from the schema write is capped; the worker (jobs.ts) drains the rest, one batch per call.
import type pg from "pg";
import { authorize, type Context, transaction } from "./db.js";
import { LIMITS, loadRegistry, searchSource, truncateBytes } from "./properties.js";
import type { Kind } from "./query.js";

type Db = pg.PoolClient;
export const REBUILD = { batch: 500, inlineBatches: 2 } as const;

export async function requestSearchRebuild(db: Db, ctx: Context, kind: Kind) {
	await db.query(
		`INSERT INTO crm.search_rebuild(tenant_id,object_type,requested_rev)
 SELECT tenant_id,key,schema_rev FROM crm.object_type WHERE tenant_id=$1 AND key=$2
 ON CONFLICT (tenant_id,object_type) DO UPDATE
  SET cursor_id=NULL,done=false,requested_rev=EXCLUDED.requested_rev,requested_at=now(),updated_at=now()`,
		[ctx.tenant, kind],
	);
}

// One batch for `kind` (queue row locked; skipped when nothing is pending or another worker holds it). Returns rows scanned, or
// null when there was nothing to do.
export async function rebuildBatch(
	db: Db,
	ctx: Context,
	kind: Kind,
	size: number = REBUILD.batch,
): Promise<number | null> {
	// Lock order = the schema write's: object_type row (loadRegistry: FOR KEY SHARE), then the queue row. Never the reverse.
	const registry = await loadRegistry(db, ctx, kind, [], false);
	const {
		rows: [q],
	} = await db.query(
		"SELECT cursor_id FROM crm.search_rebuild WHERE tenant_id=$1 AND object_type=$2 AND NOT done FOR UPDATE SKIP LOCKED",
		[ctx.tenant, kind],
	);
	if (!q) return null;
	const { rows } = await db.query(
		`SELECT id,custom FROM crm.${kind} WHERE tenant_id=$1 AND ($2::uuid IS NULL OR id>$2) AND custom<>'{}'::jsonb
 ORDER BY id LIMIT $3 FOR UPDATE`,
		[ctx.tenant, q.cursor_id, size],
	);
	if (rows.length) {
		const src = rows.map((r) => searchSource(registry, r.custom));
		const { rows: folded } = await db.query(
			"SELECT crm.normalize_search(s) f FROM unnest($1::text[]) WITH ORDINALITY u(s,n) ORDER BY n",
			[src],
		);
		await db.query(
			`UPDATE crm.${kind} t SET custom_search=v.s FROM unnest($2::uuid[],$3::text[]) v(id,s)
 WHERE t.tenant_id=$1 AND t.id=v.id AND t.custom_search IS DISTINCT FROM v.s`,
			[
				ctx.tenant,
				rows.map((r) => r.id),
				folded.map((f) => truncateBytes(f.f as string, LIMITS.searchBytes)),
			],
		);
	}
	const last = rows.length === size ? rows[rows.length - 1].id : null;
	await db.query(
		"UPDATE crm.search_rebuild SET cursor_id=$3,done=$4,updated_at=now() WHERE tenant_id=$1 AND object_type=$2",
		[ctx.tenant, kind, last ?? q.cursor_id, last === null],
	);
	return rows.length;
}

// Inline, capped pass from the schema write (same transaction): small tenants finish immediately, large ones are left to the worker.
export async function rebuildInline(db: Db, ctx: Context, kind: Kind) {
	for (let i = 0; i < REBUILD.inlineBatches; i++)
		if ((await rebuildBatch(db, ctx, kind)) === null) return;
}

// Worker entry: one batch of one pending (tenant, object); true when it did work. Same authority as the outbox worker.
export async function searchRebuildOne(ctx: Context): Promise<boolean> {
	return transaction(ctx, async (db) => {
		await authorize(db, "automation.execute", null);
		const {
			rows: [p],
		} = await db.query(
			"SELECT object_type FROM crm.search_rebuild WHERE tenant_id=$1 AND NOT done ORDER BY updated_at LIMIT 1",
			[ctx.tenant],
		);
		if (!p) return false;
		return (await rebuildBatch(db, ctx, p.object_type as Kind)) !== null;
	});
}
