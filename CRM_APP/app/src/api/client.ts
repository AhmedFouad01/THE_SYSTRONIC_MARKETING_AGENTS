import { type ApiError, errorFromResponse, networkError } from "./errors.ts";

export type Credentials = {
	token: string;
	/** Cookie mode never carries a browser-readable session token. */
	authMode?: "cookie";
	tenantId: string;
	grantId?: string | undefined;
};

/** `total_count` of a list response (only present when `include_total=1` was sent). `exact:false` = capped lower bound. */
export type ListTotal = { value: number; exact: boolean };

export type ApiResult<T> = {
	data: T;
	nextCursor: string | null;
	/** Numeric row-ledger pagination, present only for endpoints that return next_after. */
	nextAfter?: number | null;
	requestId: string | null;
	/** List envelope `has_more` (null when the endpoint does not send it). */
	hasMore: boolean | null;
	total: ListTotal | null;
};

export type RequestOptions = {
	query?: Record<string, string | number | undefined>;
	body?: unknown;
	/** Writes: stable key for retry of the same command. Default: body.command_id if a string, else a fresh UUID. */
	idempotencyKey?: string;
	/** Explicit credentials (connect gate validation). Bypasses the store and the 401 hook. */
	credentials?: Credentials;
	signal?: AbortSignal;
};

export type ApiClientOptions = {
	baseUrl?: string;
	getCredentials: () => Credentials | null;
	/** Called on 401 for calls that used the stored credentials (session expired/revoked). */
	onUnauthenticated?: () => void;
	fetchImpl?: typeof fetch;
	newKey?: () => string;
};

const WRITE = new Set(["POST", "PATCH", "PUT", "DELETE"]);
const IDEMPOTENT = new Set(["POST", "PATCH"]);

export function buildHeaders(
	method: string,
	creds: Credentials,
	opts: { body?: unknown; idempotencyKey?: string },
	newKey: () => string,
): Record<string, string> {
	const headers: Record<string, string> = {
		Accept: "application/json",
		"X-Tenant-ID": creds.tenantId,
	};
	if (creds.authMode !== "cookie") headers.Authorization = `Bearer ${creds.token}`;
	if (creds.grantId) headers["X-Grant-ID"] = creds.grantId;
	if (opts.body !== undefined) headers["Content-Type"] = "application/json";
	if (IDEMPOTENT.has(method) || (WRITE.has(method) && opts.idempotencyKey)) {
		const fromBody =
			typeof opts.body === "object" && opts.body !== null
				? (opts.body as Record<string, unknown>).command_id
				: undefined;
		headers["Idempotency-Key"] =
			opts.idempotencyKey ?? (typeof fromBody === "string" ? fromBody : newKey());
	}
	return headers;
}

function buildUrl(base: string, path: string, query?: RequestOptions["query"]): string {
	const clean = path.replace(/^\/+/, "");
	const qs = new URLSearchParams();
	for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined) qs.set(k, String(v));
	const s = qs.toString();
	return `${base}/${clean}${s ? `?${s}` : ""}`;
}

export class NotConnectedError extends Error {
	constructor() {
		super("NOT_CONNECTED");
		this.name = "NotConnectedError";
	}
}

export function createApiClient(options: ApiClientOptions) {
	const base = options.baseUrl ?? "/v1";
	const newKey = options.newKey ?? (() => crypto.randomUUID());

	async function request<T>(
		method: string,
		path: string,
		opts: RequestOptions = {},
	): Promise<ApiResult<T>> {
		const creds = opts.credentials ?? options.getCredentials();
		if (!creds) throw new NotConnectedError();
		const f = options.fetchImpl ?? fetch;
		const headers = buildHeaders(method, creds, opts, newKey);
		let res: Response;
		let json: unknown;
		try {
			res = await f(buildUrl(base, path, opts.query), {
				method,
				credentials: "same-origin",
				headers,
				body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
				signal: opts.signal ?? null,
			});
			json = await res.json();
		} catch (e) {
			if (e instanceof DOMException && e.name === "AbortError") throw e;
			throw networkError();
		}
		if (!res.ok) {
			const err: ApiError = errorFromResponse(res.status, json);
			if (err.kind === "unauthenticated" && !opts.credentials) options.onUnauthenticated?.();
			throw err;
		}
		const env = (typeof json === "object" && json !== null ? json : {}) as Record<string, unknown>;
		const tc = env.total_count;
		const total =
			typeof tc === "object" &&
			tc !== null &&
			typeof (tc as ListTotal).value === "number" &&
			typeof (tc as ListTotal).exact === "boolean"
				? { value: (tc as ListTotal).value, exact: (tc as ListTotal).exact }
				: null;
		return {
			data: env.data as T,
			nextCursor: typeof env.next_cursor === "string" ? env.next_cursor : null,
			...(Object.hasOwn(env, "next_after") ? { nextAfter: env.next_after === null ? null : typeof env.next_after === "number" && Number.isSafeInteger(env.next_after) && env.next_after >= 0 ? env.next_after : undefined } : {}),
			requestId: typeof env.request_id === "string" ? env.request_id : null,
			hasMore: typeof env.has_more === "boolean" ? env.has_more : null,
			total,
		};
	}

	return {
		request,
		get: <T>(path: string, o?: RequestOptions) => request<T>("GET", path, o),
		post: <T>(path: string, body: unknown, o?: RequestOptions) =>
			request<T>("POST", path, { ...o, body }),
		patch: <T>(path: string, body: unknown, o?: RequestOptions) =>
			request<T>("PATCH", path, { ...o, body }),
	};
}

export type ApiClient = ReturnType<typeof createApiClient>;
export const isWriteMethod = (m: string): boolean => WRITE.has(m);
