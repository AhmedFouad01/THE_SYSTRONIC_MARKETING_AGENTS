import type { ApiError } from "../../api/errors.ts";
import type { MessageKey } from "../../ui/i18n/en.ts";

const keys: Record<string, MessageKey> = {
	LAST_MANAGER_REQUIRED: "users.lastManager",
	VALIDATION_FAILED: "users.validation",
	NOT_FOUND: "users.notFound",
	AUTH_RESET_INVALID: "auth.error.reset_invalid",
	AUTH_INVITATION_INVALID: "auth.error.invitation_invalid",
	AUTH_PASSWORD_POLICY: "auth.error.password_policy",
	AUTH_INVALID_CREDENTIALS: "auth.error.invalid_credentials",
	AUTH_TOO_MANY_ATTEMPTS: "auth.error.too_many_attempts",
	AUTH_RATE_LIMITED: "auth.error.rate_limited",
	AUTH_ORIGIN_NOT_ALLOWED: "auth.error.origin_not_allowed",
	AUTH_UNAVAILABLE: "auth.error.unavailable",
	AUTH_BUSY: "auth.error.busy",
	AUTH_REQUEST_REJECTED: "auth.error.request_rejected",
	UNAUTHENTICATED: "auth.error.unauthenticated",
	FORBIDDEN: "error.forbidden",
	NETWORK: "error.network",
};
export function authErrorKey(error: ApiError): MessageKey {
	return (
		keys[error.code] ??
		(error.status === 401 ? "auth.error.unauthenticated" : "error.generic")
	);
}
