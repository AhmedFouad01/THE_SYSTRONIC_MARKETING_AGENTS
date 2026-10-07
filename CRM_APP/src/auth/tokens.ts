import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

// Session / invite / reset / CSRF tokens (AUTH_PLAN section 5): 256 random bits,
// base64url on the wire, only the SHA-256 digest (hex) is ever stored.
export const TOKEN_BYTES = 32;

export interface IssuedToken {
	token: string;
	hash: string;
}

export function hashToken(token: string): string {
	return createHash("sha256").update(token, "utf8").digest("hex");
}

export function newToken(): IssuedToken {
	const token = randomBytes(TOKEN_BYTES).toString("base64url");
	return { token, hash: hashToken(token) };
}

/** Constant-time comparison of two hex digests (defence in depth; lookups are by hash). */
export function tokenHashEquals(a: string, b: string): boolean {
	const x = Buffer.from(a, "utf8");
	const y = Buffer.from(b, "utf8");
	return x.length === y.length && timingSafeEqual(x, y);
}
