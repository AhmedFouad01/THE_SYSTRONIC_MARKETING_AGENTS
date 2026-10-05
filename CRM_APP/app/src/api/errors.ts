// Typed API error. Mirrors the server error envelope { code, safe_message, request_id, retryable } (M1_CONTRACTS).
// The safe message is server-authored and carries no credentials; tokens are never put on an error.
export type ApiErrorKind =
	| "unauthenticated" // 401: token/tenant not accepted
	| "forbidden" // 403: authenticated but not permitted (RBAC/RLS)
	| "version_conflict" // 409 VERSION_CONFLICT: stale expected_version, reload and retry
	| "conflict" // other 409 (idempotency key/body mismatch, duplicate)
	| "network" // fetch itself failed / non-JSON body
	| "http"; // any other non-2xx

export type ErrorEnvelope = {
	code: string;
	safe_message: string;
	request_id: string;
	retryable: boolean;
};

export class ApiError extends Error {
	readonly status: number;
	readonly code: string;
	readonly safeMessage: string;
	readonly requestId: string | null;
	readonly retryable: boolean;
	readonly kind: ApiErrorKind;

	constructor(init: {
		status: number;
		code: string;
		safeMessage: string;
		requestId: string | null;
		retryable: boolean;
	}) {
		super(init.safeMessage || init.code);
		this.name = "ApiError";
		this.status = init.status;
		this.code = init.code;
		this.safeMessage = init.safeMessage;
		this.requestId = init.requestId;
		this.retryable = init.retryable;
		this.kind = kindOf(init.status, init.code);
	}
}

export function kindOf(status: number, code: string): ApiErrorKind {
	if (status === 0) return "network";
	if (status === 401) return "unauthenticated";
	if (status === 403) return "forbidden";
	if (status === 409) return code === "VERSION_CONFLICT" ? "version_conflict" : "conflict";
	return "http";
}

export function isApiError(e: unknown): e is ApiError {
	return e instanceof ApiError;
}

export const isForbidden = (e: unknown): boolean => isApiError(e) && e.kind === "forbidden";
export const isVersionConflict = (e: unknown): boolean =>
	isApiError(e) && e.kind === "version_conflict";

function str(v: unknown): string | null {
	return typeof v === "string" ? v : null;
}

/** Builds an ApiError from a non-2xx response body (any shape; falls back to a status-derived code). */
export function errorFromResponse(status: number, body: unknown): ApiError {
	const b = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
	return new ApiError({
		status,
		code: str(b.code) ?? `HTTP_${status}`,
		safeMessage: str(b.safe_message) ?? "",
		requestId: str(b.request_id),
		retryable: b.retryable === true,
	});
}

export function networkError(): ApiError {
	return new ApiError({
		status: 0,
		code: "NETWORK",
		safeMessage: "",
		requestId: null,
		retryable: true,
	});
}
