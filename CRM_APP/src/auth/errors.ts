// AUTH_PLAN B3: one place that turns Better Auth failures and PostgreSQL SQLSTATE 23514 into the stable
// CRM error envelope { code, safe_message, request_id, retryable }. Better Auth's own English `message`
// strings are never forwarded; the UI maps `code` to the i18n key below (AR/EN, complete RTL is the UI round's job).

export type CatalogEntry = {
	status: number;
	/** Key the UI round reads from its dictionary. */
	i18nKey: string;
	en: string;
	ar: string;
};

const e = (
	status: number,
	key: string,
	en: string,
	ar: string,
): CatalogEntry => ({
	status,
	i18nKey: `auth.error.${key}`,
	en,
	ar,
});

/** Stable public error codes of the auth surface and of the DB-invariant mapping. Adding a code is cheap; renaming one is a breaking change. */
export const AUTH_ERROR_CATALOG = {
	AUTH_RESET_INVALID: e(
		400,
		"reset_invalid",
		"This reset link is invalid or expired.",
		"رابط إعادة تعيين كلمة المرور غير صالح أو منتهي.",
	),
	AUTH_INVITATION_INVALID: e(
		403,
		"invitation_invalid",
		"This invitation is not valid.",
		"هذه الدعوة غير صالحة.",
	),
	AUTH_PASSWORD_POLICY: e(
		422,
		"password_policy",
		"Choose a stronger password.",
		"اختر كلمة مرور أقوى.",
	),
	AUTH_INVALID_CREDENTIALS: e(
		401,
		"invalid_credentials",
		"The email or password is not correct.",
		"البريد الإلكتروني أو كلمة المرور غير صحيحة.",
	),
	AUTH_TOO_MANY_ATTEMPTS: e(
		429,
		"too_many_attempts",
		"Too many failed attempts. Try again later.",
		"محاولات فاشلة كثيرة. حاول مرة أخرى لاحقاً.",
	),
	AUTH_RATE_LIMITED: e(
		429,
		"rate_limited",
		"Too many requests. Try again in a moment.",
		"طلبات كثيرة. حاول مرة أخرى بعد قليل.",
	),
	AUTH_ORIGIN_NOT_ALLOWED: e(
		403,
		"origin_not_allowed",
		"This request came from an origin that is not allowed.",
		"هذا الطلب جاء من مصدر غير مسموح به.",
	),
	AUTH_UNAVAILABLE: e(
		503,
		"unavailable",
		"Sign-in is not available right now.",
		"تسجيل الدخول غير متاح حالياً.",
	),
	AUTH_BUSY: e(
		503,
		"busy",
		"Sign-in is busy. Try again in a moment.",
		"تسجيل الدخول مشغول. حاول مرة أخرى بعد قليل.",
	),
	AUTH_REQUEST_REJECTED: e(
		400,
		"request_rejected",
		"The sign-in request was not accepted.",
		"لم يتم قبول طلب تسجيل الدخول.",
	),
	UNAUTHENTICATED: e(
		401,
		"unauthenticated",
		"Please sign in.",
		"يرجى تسجيل الدخول.",
	),
	FORBIDDEN: e(
		403,
		"forbidden",
		"You do not have permission to do this.",
		"ليست لديك صلاحية لتنفيذ هذا الإجراء.",
	),
	NOT_FOUND: e(404, "not_found", "Not found.", "غير موجود."),
	VALIDATION_FAILED: e(
		422,
		"validation_failed",
		"Some of the values are not valid.",
		"بعض القيم غير صالحة.",
	),
	PAYLOAD_TOO_LARGE: e(
		413,
		"payload_too_large",
		"The request is too large.",
		"الطلب كبير جداً.",
	),
	LAST_MANAGER_REQUIRED: e(
		409,
		"last_manager_required",
		"A workspace must keep at least one active manager.",
		"يجب أن يبقى في مساحة العمل مدير نشط واحد على الأقل.",
	),
	CONSTRAINT_VIOLATION: e(
		422,
		"constraint_violation",
		"This change is not allowed.",
		"هذا التغيير غير مسموح به.",
	),
	INTERNAL_ERROR: e(
		500,
		"internal_error",
		"Something went wrong.",
		"حدث خطأ ما.",
	),
} as const satisfies Record<string, CatalogEntry>;
export type AuthErrorCode = keyof typeof AUTH_ERROR_CATALOG;

/** Better Auth error `code` -> ours. Anything not listed falls back by HTTP status (see mapBetterAuthError). */
const BA_CODES: Record<string, AuthErrorCode> = {
	INVALID_EMAIL_OR_PASSWORD: "AUTH_INVALID_CREDENTIALS",
	USER_NOT_FOUND: "AUTH_INVALID_CREDENTIALS",
	CREDENTIAL_ACCOUNT_NOT_FOUND: "AUTH_INVALID_CREDENTIALS",
	INVALID_PASSWORD: "AUTH_INVALID_CREDENTIALS",
	PASSWORD_TOO_LONG: "AUTH_INVALID_CREDENTIALS",
	PASSWORD_TOO_SHORT: "AUTH_INVALID_CREDENTIALS",
	INVALID_EMAIL: "VALIDATION_FAILED",
	VALIDATION_ERROR: "VALIDATION_FAILED",
	INVALID_ORIGIN: "AUTH_ORIGIN_NOT_ALLOWED",
	INVALID_CALLBACK_URL: "AUTH_ORIGIN_NOT_ALLOWED",
	INVALID_REDIRECT_URL: "AUTH_ORIGIN_NOT_ALLOWED",
	MISSING_OR_NULL_ORIGIN: "AUTH_ORIGIN_NOT_ALLOWED",
	CROSS_SITE_NAVIGATION_LOGIN_BLOCKED: "AUTH_ORIGIN_NOT_ALLOWED",
	FAILED_TO_GET_SESSION: "UNAUTHENTICATED",
	SESSION_EXPIRED: "UNAUTHENTICATED",
	// Our own codes, thrown from hooks / the password adapter, pass through.
	AUTH_TOO_MANY_ATTEMPTS: "AUTH_TOO_MANY_ATTEMPTS",
	AUTH_BUSY: "AUTH_BUSY",
	AUTH_INVITATION_INVALID: "AUTH_INVITATION_INVALID",
	AUTH_RESET_INVALID: "AUTH_RESET_INVALID",
	INVALID_TOKEN: "AUTH_RESET_INVALID",
	SESSION_NOT_FRESH: "UNAUTHENTICATED",
	AUTH_PASSWORD_POLICY: "AUTH_PASSWORD_POLICY",
	INVITATION_NOT_FOUND: "AUTH_INVITATION_INVALID",
	INVITATION_EXPIRED: "AUTH_INVITATION_INVALID",
	YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION: "AUTH_INVITATION_INVALID",
	YOU_CANNOT_LEAVE_THE_ORGANIZATION_AS_THE_ONLY_OWNER: "LAST_MANAGER_REQUIRED",
	YOU_CANNOT_LEAVE_THE_ORGANIZATION_WITHOUT_AN_OWNER: "LAST_MANAGER_REQUIRED",
	AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
};

/** The public error for a failed Better Auth response. Never copies Better Auth's message text. */
export function mapBetterAuthError(
	status: number,
	body: unknown,
): { status: number; code: AuthErrorCode } {
	const raw =
		body && typeof body === "object" && "code" in body
			? String((body as { code?: unknown }).code)
			: "";
	const known = BA_CODES[raw];
	if (known) return { status: AUTH_ERROR_CATALOG[known].status, code: known };
	if (status === 429) return { status, code: "AUTH_RATE_LIMITED" };
	if (status === 401) return { status, code: "UNAUTHENTICATED" };
	if (status === 403) return { status, code: "FORBIDDEN" };
	if (status === 404) return { status, code: "NOT_FOUND" };
	if (status === 413) return { status, code: "PAYLOAD_TOO_LARGE" };
	if (status === 422) return { status, code: "VALIDATION_FAILED" };
	if (status === 503) return { status, code: "AUTH_UNAVAILABLE" };
	if (status >= 500) return { status: 500, code: "INTERNAL_ERROR" };
	return { status: 400, code: "AUTH_REQUEST_REJECTED" };
}
