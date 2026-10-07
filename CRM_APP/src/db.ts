import pg from "pg";
export const pool = new pg.Pool({
	connectionString: process.env.DATABASE_URL,
	max: 5,
});
export class Fault extends Error {
	constructor(
		public status: number,
		public code: string,
		// Optional machine-readable per-field issues, surfaced as `errors` in the error envelope (schema API).
		public details?: { field: string; code: string; property?: string }[],
	) {
		super(code);
	}
}
/**
 * SQLSTATE 23514 (check_violation) -> a Fault, or null when the error is not one we classify.
 * Trigger invariants (015) raise 23514 without a constraint name, so the message text is the only handle;
 * those texts are ours and pinned by tests/auth-b2.test.ts. Stable public codes: see src/auth/errors.ts.
 */
export function faultFromDbError(error: unknown): Fault | null {
	const err = error as { code?: string; message?: string };
	if (err?.code !== "23514") return null;
	if (/would be left without an active manager/.test(err.message ?? ""))
		return new Fault(409, "LAST_MANAGER_REQUIRED");
	return new Fault(422, "CONSTRAINT_VIOLATION");
}
export type Context = { tenant: string; token: string; grant?: string };
export async function assertIdentifierConfiguration() {
	try {
		await pool.query("SELECT crm.assert_identifier_configuration()");
	} catch {
		throw new Fault(503, "PROTECTED_KEY_UNAVAILABLE");
	}
}
export async function transaction<T>(
	ctx: Context,
	fn: (db: pg.PoolClient) => Promise<T>,
): Promise<T> {
	const db = await pool.connect();
	try {
		await db.query("BEGIN");
		await db.query(
			"SELECT set_config('crm.tenant',$1,true),set_config('crm.token',$2,true)",
			[ctx.tenant, ctx.token],
		);
		const {
			rows: [auth],
		} = await db.query(
			"SELECT crm.actor() actor,crm.tenant_access($1) allowed",
			[ctx.tenant],
		);
		if (!auth.actor) throw new Fault(401, "UNAUTHENTICATED");
		if (!auth.allowed) throw new Fault(403, "FORBIDDEN");
		const result = await fn(db);
		await db.query("COMMIT");
		return result;
	} catch (error) {
		await db.query("ROLLBACK");
		if ((error as { code?: string }).code === "PCK01")
			throw new Fault(503, "PROTECTED_KEY_UNAVAILABLE");
		// P1b B3 backstop: the 010 CHECKs on custom / custom_search (the validator caps the merged blob below them first).
		if (
			(error as { code?: string }).code === "23514" &&
			/_custom_(shape|search_size)$/.test(
				(error as { constraint?: string }).constraint ?? "",
			)
		)
			throw new Fault(422, "PROPERTIES_TOO_LARGE");
		throw error; // raw DB errors keep their SQLSTATE for callers; the HTTP layer maps 23514 with faultFromDbError (src/api.ts)
	} finally {
		db.release();
	}
}
export async function authorize(
	db: pg.PoolClient,
	action: string,
	deal: string | null,
	grant?: string,
) {
	const {
		rows: [r],
	} = await db.query("SELECT crm.can_action($1,$2,$3) allowed", [
		action,
		deal,
		grant ?? null,
	]);
	if (!r.allowed) throw new Fault(403, "FORBIDDEN");
}
