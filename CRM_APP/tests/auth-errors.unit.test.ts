import { describe, expect, it } from "vitest";
import { faultFromDbError } from "../src/db.js";
import { AUTH_ERROR_CATALOG, mapBetterAuthError } from "../src/auth/errors.js";
import { stripTokens } from "../src/auth/ba.js";

describe("auth error mapping (AUTH_PLAN B3)", () => {
	it("maps Better Auth codes and statuses to stable codes, never forwarding its message", () => {
		expect(mapBetterAuthError(401, { code: "INVALID_EMAIL_OR_PASSWORD", message: "Invalid email or password" })).toEqual({ status: 401, code: "AUTH_INVALID_CREDENTIALS" });
		expect(mapBetterAuthError(400, { code: "PASSWORD_TOO_LONG" })).toEqual({ status: 401, code: "AUTH_INVALID_CREDENTIALS" });
		expect(mapBetterAuthError(403, { code: "INVALID_ORIGIN" })).toEqual({ status: 403, code: "AUTH_ORIGIN_NOT_ALLOWED" });
		expect(mapBetterAuthError(429, { message: "Too many requests" })).toEqual({ status: 429, code: "AUTH_RATE_LIMITED" });
		expect(mapBetterAuthError(429, { code: "AUTH_TOO_MANY_ATTEMPTS" })).toEqual({ status: 429, code: "AUTH_TOO_MANY_ATTEMPTS" });
		expect(mapBetterAuthError(400, { code: "VALIDATION_ERROR" })).toEqual({ status: 422, code: "VALIDATION_FAILED" });
		expect(mapBetterAuthError(500, null)).toEqual({ status: 500, code: "INTERNAL_ERROR" });
		expect(mapBetterAuthError(418, { code: "SOMETHING_NEW" })).toEqual({ status: 400, code: "AUTH_REQUEST_REJECTED" });
	});
	it("every catalog entry has an i18n key and both AR and EN text", () => {
		for (const [code, e] of Object.entries(AUTH_ERROR_CATALOG)) {
			expect(e.i18nKey).toMatch(/^auth\.error\.[a-z_]+$/);
			expect(e.en.length, code).toBeGreaterThan(3);
			expect(/[؀-ۿ]/.test(e.ar), code).toBe(true);
		}
	});
	it("maps SQLSTATE 23514 and only that", () => {
		const e = (code: string, message: string) => Object.assign(new Error(message), { code });
		const last = faultFromDbError(e("23514", "tenant x would be left without an active manager"));
		expect([last?.status, last?.code]).toEqual([409, "LAST_MANAGER_REQUIRED"]);
		const other = faultFromDbError(e("23514", "role bogus is not allowed for a member"));
		expect([other?.status, other?.code]).toEqual([422, "CONSTRAINT_VIOLATION"]);
		expect(faultFromDbError(e("23505", "dup"))).toBeNull();
		expect(faultFromDbError(new Error("x"))).toBeNull();
	});
	it("stripTokens removes the key at any depth and keeps the rest", () => {
		expect(stripTokens({ token: "a", user: { id: 1, token: "b" }, session: { token: "c", id: 2 }, list: [{ token: "d", k: 1 }] })).toEqual({ user: { id: 1 }, session: { id: 2 }, list: [{ k: 1 }] });
		expect(stripTokens(null)).toBeNull();
	});
});
