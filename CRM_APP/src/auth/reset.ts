import { createHash } from "node:crypto";
import type pg from "pg";
/** Same SHA-256/base64url identifier as better-auth 1.7.7 verification-token-storage.mjs. */
export const resetIdentifier = (token: string) =>
	createHash("sha256").update(`reset-password:${token}`).digest("base64url");
export function resetRegistry(pool: pg.Pool) {
	return {
		async replace(user: string, token: string) {
			const db = await pool.connect();
			const identifier = resetIdentifier(token);
			try {
				await db.query("BEGIN");
				// The user row serializes issuance across processes, not just this runtime.
				await db.query(`SELECT id FROM auth."user" WHERE id=$1 FOR UPDATE`, [
					user,
				]);
				await db.query(
					`DELETE FROM auth.verification WHERE identifier IN (SELECT identifier FROM auth.password_reset_latest WHERE user_id=$1) AND identifier<>$2`,
					[user, identifier],
				);
				const {
					rows: [verification],
				} = await db.query(
					`SELECT "expiresAt" FROM auth.verification WHERE identifier=$1 AND value=$2`,
					[identifier, user],
				);
				if (!verification) throw new Error("AUTH_RESET_ISSUANCE_FAILED");
				await db.query(
					`INSERT INTO auth.password_reset_latest(user_id,identifier,expires_at) VALUES($1,$2,$3)
					ON CONFLICT(user_id) DO UPDATE SET identifier=EXCLUDED.identifier,expires_at=EXCLUDED.expires_at,created_at=now()`,
					[user, identifier, verification.expiresAt],
				);
				await db.query("COMMIT");
			} catch {
				await db.query("ROLLBACK");
				// The new row belongs only to this known reset token, never to another verification purpose.
				await db.query("DELETE FROM auth.verification WHERE identifier=$1", [
					identifier,
				]);
				throw new Error("AUTH_RESET_ISSUANCE_FAILED");
			} finally {
				db.release();
			}
		},
		async clear(user: string, identifier: string) {
			const db = await pool.connect();
			try {
				await db.query("BEGIN");
				await db.query(`SELECT id FROM auth."user" WHERE id=$1 FOR UPDATE`, [
					user,
				]);
				await db.query(
					"DELETE FROM auth.verification WHERE identifier IN (SELECT identifier FROM auth.password_reset_latest WHERE user_id=$1 AND identifier=$2)",
					[user, identifier],
				);
				await db.query(
					"DELETE FROM auth.password_reset_latest WHERE user_id=$1 AND identifier=$2",
					[user, identifier],
				);
				await db.query("COMMIT");
			} catch {
				await db.query("ROLLBACK");
				throw new Error("AUTH_RESET_CLEANUP_FAILED");
			} finally {
				db.release();
			}
		},
	};
}
