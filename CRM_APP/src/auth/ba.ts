import { createHash, randomBytes } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { PostgresDialect } from "kysely";
import pg from "pg";
import { Fault } from "../db.js";
import { AUTH_ERROR_CATALOG, mapBetterAuthError } from "./errors.js";
import {
	HashBusyError,
	type PasswordService,
	PASSWORD_MAX_LENGTH,
	createPasswordService,
	loadPepperKeyring,
} from "./password.js";

// AUTH_PLAN v2 B3: Better Auth 1.7.7 used headless on schema `auth` as role crm_auth.
// Better Auth proves who the caller is; the CRM database still decides what they may see
// (crm.actor() re-validates the raw session token on every request, 016).

export const AUTH_BASE_PATH = "/v1/auth";
/** Session policy (D3): idle 8 h (sliding), refreshed at most every 30 min; the 14-day absolute cap is enforced in crm.actor(). */
export const SESSION_EXPIRES_IN = 8 * 60 * 60;
export const SESSION_UPDATE_AGE = 30 * 60;
const BODY_LIMIT = 4096;
/** Header only this module writes (overwritten on every request, so a client cannot choose its rate-limit identity). */
const IP_HEADER = "x-crm-client-ip";

export class AuthConfigError extends Error {
	readonly code = "AUTH_CONFIG";
}

/** Endpoints Better Auth may answer. Everything else under /v1/auth is a 404 from our router (T15). Later increments extend this list. */
const ALLOW: Readonly<
	Record<string, { write: boolean; bodyKeys?: readonly string[] }>
> = {
	"POST /sign-in/email": { write: true, bodyKeys: ["email", "password", "rememberMe"] },
	"POST /sign-out": { write: true, bodyKeys: [] },
	"GET /get-session": { write: false },
};
export const ALLOWED_ENDPOINTS = Object.keys(ALLOW);

export type AuthConfig = {
	databaseUrl: string;
	secret: string;
	publicOrigin: string;
	trustedOrigins: string[];
	production: boolean;
	trustProxy: boolean;
	rateLimitEnabled: boolean;
};

const truthy = (v: string | undefined) => v === "1" || v === "true";
const off = (v: string | undefined) => v === "0" || v === "false" || v === "off";

/**
 * The dev Bearer path (tokens minted into crm.session by seeds and tests). Never in production.
 * Elsewhere it is ON unless CRM_DEV_BEARER is 0/false/off, so the existing seeded dev flow and test suites keep working;
 * a deployment that must refuse it sets NODE_ENV=production (boot also refuses CRM_DEV_BEARER=1 there).
 */
export function devBearerEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
	if (env.NODE_ENV === "production") return false;
	return !off(env.CRM_DEV_BEARER);
}

/** Boot-time guards for production. Throws AuthConfigError; the API refuses to start. Also used by tests. */
export function assertAuthEnvironment(env: NodeJS.ProcessEnv = process.env): void {
	if (env.NODE_ENV !== "production") return;
	if (truthy(env.CRM_DEV_BEARER)) throw new AuthConfigError("CRM_DEV_BEARER must not be set in production");
	if (!env.AUTH_DATABASE_URL) throw new AuthConfigError("AUTH_DATABASE_URL is required in production");
	if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32)
		throw new AuthConfigError("BETTER_AUTH_SECRET (>= 32 characters) is required in production");
	if (!env.CRM_PUBLIC_ORIGIN?.startsWith("https://"))
		throw new AuthConfigError("CRM_PUBLIC_ORIGIN (https) is required in production");
	loadPepperKeyring(env); // throws PepperConfigError when the production pepper is missing or short
}

const normalizeOrigin = (v: string): string => {
	try {
		return new URL(v).origin;
	} catch {
		throw new AuthConfigError(`not an origin: ${v}`);
	}
};

/** null = sign-in is not configured (allowed outside production only): /v1/auth answers 503 and cookies are ignored. */
export function loadAuthConfig(env: NodeJS.ProcessEnv = process.env): AuthConfig | null {
	assertAuthEnvironment(env);
	const production = env.NODE_ENV === "production";
	if (!env.AUTH_DATABASE_URL) return null;
	const publicOrigin = normalizeOrigin(
		env.CRM_PUBLIC_ORIGIN ?? `http://localhost:${env.PORT ?? 4317}`,
	);
	return {
		databaseUrl: env.AUTH_DATABASE_URL,
		secret: env.BETTER_AUTH_SECRET || randomBytes(32).toString("base64url"),
		publicOrigin,
		trustedOrigins: [
			publicOrigin,
			...(env.CRM_TRUSTED_ORIGINS ?? "")
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean)
				.map(normalizeOrigin),
		],
		production,
		trustProxy: truthy(env.CRM_TRUST_PROXY),
		rateLimitEnabled: production || !off(env.CRM_AUTH_RATE_LIMIT),
	};
}

/** Per-account lockout key (017): sha256 of the lower-cased email, identical for known and unknown accounts. */
export const lockoutKey = (email: string): string =>
	createHash("sha256").update(email.trim().toLowerCase(), "utf8").digest("hex");

/** Recursively removes every `token` key from a JSON value (U1: page JS never sees the raw session token). */
export function stripTokens(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(stripTokens);
	if (value && typeof value === "object") {
		const out: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(value)) if (k !== "token") out[k] = stripTokens(v);
		return out;
	}
	return value;
}

function clientIp(req: IncomingMessage, trustProxy: boolean): string {
	let ip = "";
	if (trustProxy) {
		// One trusted hop (nginx): the rightmost entry is the one the proxy appended.
		const xff = req.headers["x-forwarded-for"];
		ip = (Array.isArray(xff) ? xff.join(",") : (xff ?? "")).split(",").pop()?.trim() ?? "";
	}
	ip ||= req.socket.remoteAddress ?? "";
	return ip.replace(/^::ffff:/i, "") || "127.0.0.1";
}

export interface AuthRuntimeOptions {
	config: AuthConfig;
	passwords?: PasswordService;
	/** Tests may inject the pool; otherwise one small pool is created from config.databaseUrl. */
	pool?: pg.Pool;
}

export interface AuthRuntime {
	readonly config: AuthConfig;
	readonly cookieName: string;
	/** Serves one /v1/auth request (allow-list, origin, body rules, token stripping, error envelope). */
	handle(req: IncomingMessage, res: ServerResponse, requestId: string): Promise<void>;
	/** Raw Better Auth session token for the request's cookie, or "" (forwards any refreshed Set-Cookie to `res`). */
	session(req: IncomingMessage, res: ServerResponse): Promise<string>;
	originAllowed(origin: string | undefined): boolean;
	close(): Promise<void>;
}

const wrapHash = async <T>(fn: () => Promise<T>): Promise<T> => {
	try {
		return await fn();
	} catch (e) {
		if (e instanceof HashBusyError)
			throw new APIError("SERVICE_UNAVAILABLE", { code: "AUTH_BUSY", message: "busy" });
		if (e instanceof RangeError)
			throw new APIError("UNAUTHORIZED", { code: "AUTH_INVALID_CREDENTIALS", message: "invalid" });
		throw e;
	}
};

export function createAuthRuntime(opts: AuthRuntimeOptions): AuthRuntime {
	const { config } = opts;
	const passwords =
		opts.passwords ?? createPasswordService({ keyring: loadPepperKeyring() });
	const pool =
		opts.pool ?? new pg.Pool({ connectionString: config.databaseUrl, max: 4 });
	const host = config.production ? "__Host-" : "";
	const cookieName = `${host}crm_session`;
	const trusted = new Set(config.trustedOrigins);

	const logger = {
		level: "error" as const,
		// Message text only: never the extra arguments, which can carry tokens or request bodies (T12).
		log: (level: string, message: string) =>
			console.error(`[auth:${level}] ${String(message).slice(0, 200)}`),
	};

	const auth = betterAuth({
		baseURL: config.publicOrigin,
		basePath: AUTH_BASE_PATH,
		secret: config.secret,
		trustedOrigins: config.trustedOrigins,
		telemetry: { enabled: false },
		logger,
		database: {
			dialect: new PostgresDialect({ pool }),
			type: "postgres",
			schemaName: "auth",
		},
		emailAndPassword: {
			enabled: true,
			disableSignUp: true, // closed sign-up; the invite-gated route is B4
			minPasswordLength: 12,
			maxPasswordLength: PASSWORD_MAX_LENGTH,
			requireEmailVerification: false,
			autoSignIn: false,
			revokeSessionsOnPasswordReset: true,
			password: {
				hash: (password: string) => wrapHash(() => passwords.hash(password)),
				verify: ({ hash, password }: { hash: string; password: string }) =>
					wrapHash(async () => (await passwords.verify(password, hash)).ok),
			},
		},
		session: {
			expiresIn: SESSION_EXPIRES_IN,
			updateAge: SESSION_UPDATE_AGE,
			cookieCache: { enabled: false },
		},
		rateLimit: {
			enabled: config.rateLimitEnabled,
			storage: "database",
			window: 60,
			max: 100,
			customRules: { "/sign-in/email": { window: 10, max: 3 } },
		},
		advanced: {
			// Cookie names carry no automatic __Secure- prefix; production uses an explicit __Host- name instead.
			useSecureCookies: false,
			defaultCookieAttributes: {
				httpOnly: true,
				secure: config.production,
				sameSite: "lax",
				path: "/",
			},
			cookies: {
				session_token: { name: cookieName },
				dont_remember: { name: `${host}crm_dont_remember` },
			},
			ipAddress: { ipAddressHeaders: [IP_HEADER], ipv6Subnet: 64 },
			database: { generateId: "uuid" },
		},
		hooks: {
			// Per-account password lockout (017): refuse a locked key before any password work.
			before: createAuthMiddleware(async (ctx) => {
				if (ctx.path !== "/sign-in/email") return;
				const email = (ctx.body as { email?: unknown } | undefined)?.email;
				if (typeof email !== "string" || !email) return; // Better Auth validates the shape
				const {
					rows: [r],
				} = await pool.query("SELECT auth.login_gate($1) AS seconds", [lockoutKey(email)]);
				if (r.seconds > 0)
					throw new APIError(
						"TOO_MANY_REQUESTS",
						{ code: "AUTH_TOO_MANY_ATTEMPTS", message: "locked", retryAfter: r.seconds },
					);
			}),
			after: createAuthMiddleware(async (ctx) => {
				if (ctx.path !== "/sign-in/email") return;
				const email = (ctx.body as { email?: unknown } | undefined)?.email;
				if (typeof email !== "string" || !email) return;
				const returned = ctx.context.returned as
					| { statusCode?: number; body?: { code?: string } }
					| undefined;
				if (returned && typeof returned === "object" && "statusCode" in returned) {
					// Only a wrong credential counts (not rate limits, validation errors or the lock itself).
					if (returned.body?.code === "INVALID_EMAIL_OR_PASSWORD")
						await pool.query("SELECT auth.login_failed($1)", [lockoutKey(email)]);
				} else if (returned) {
					await pool.query("SELECT auth.login_succeeded($1)", [lockoutKey(email)]);
				}
			}),
		},
	});

	const envelope = (code: string, status: number, requestId: string, headers: Headers) => {
		headers.set("content-type", "application/json");
		return new Response(
			JSON.stringify({ code, safe_message: code, request_id: requestId, retryable: status >= 500 }),
			{ status, headers },
		);
	};

	// Response post-processing: our error envelope instead of Better Auth's English messages, and no `token` in any JSON body.
	const postProcess = async (resp: Response, requestId: string): Promise<Response> => {
		const headers = new Headers(resp.headers);
		headers.delete("content-length");
		headers.delete("content-type");
		const text = await resp.text();
		let body: unknown = null;
		try {
			body = text ? JSON.parse(text) : null;
		} catch {
			body = null;
		}
		if (resp.status >= 400) {
			const { status, code } = mapBetterAuthError(resp.status, body);
			const retry =
				(body as { retryAfter?: unknown } | null)?.retryAfter ??
				resp.headers.get("x-retry-after");
			headers.delete("x-retry-after");
			if (status === 429 && retry && /^\d+$/.test(String(retry)))
				headers.set("retry-after", String(retry));
			return envelope(code, status, requestId, headers);
		}
		headers.set("content-type", "application/json");
		return new Response(text ? JSON.stringify(stripTokens(body)) : null, {
			status: resp.status,
			headers,
		});
	};

	let currentRequestId = "";
	const node = toNodeHandler(async (request: Request) =>
		postProcess(await auth.handler(request), currentRequestId),
	);

	async function readJson(req: IncomingMessage): Promise<Record<string, unknown> | undefined> {
		const parts: Buffer[] = [];
		let size = 0;
		for await (const chunk of req) {
			size += chunk.length;
			if (size > BODY_LIMIT) throw new Fault(413, "PAYLOAD_TOO_LARGE");
			parts.push(chunk);
		}
		if (!size) return undefined;
		if (!(req.headers["content-type"] ?? "").toLowerCase().startsWith("application/json"))
			throw new Fault(422, "VALIDATION_FAILED");
		let parsed: unknown;
		try {
			parsed = JSON.parse(Buffer.concat(parts).toString("utf8"));
		} catch {
			throw new Fault(422, "VALIDATION_FAILED");
		}
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
			throw new Fault(422, "VALIDATION_FAILED");
		return parsed as Record<string, unknown>;
	}

	const originAllowed = (origin: string | undefined) =>
		typeof origin === "string" && trusted.has(origin);

	return {
		config,
		cookieName,
		originAllowed,
		async handle(req, res, requestId) {
			const url = new URL(req.url ?? "/", "http://localhost");
			const rel = url.pathname.slice(AUTH_BASE_PATH.length);
			const route = ALLOW[`${req.method} ${rel}`];
			if (!route || !url.pathname.startsWith(`${AUTH_BASE_PATH}/`)) throw new Fault(404, "NOT_FOUND");
			if (route.write) {
				// T3: every state-changing auth call must come from a trusted origin (no ambient-cookie CSRF, no origin-less POST).
				if (!originAllowed(req.headers.origin)) throw new Fault(403, "AUTH_ORIGIN_NOT_ALLOWED");
				const body = await readJson(req);
				if (body && Object.keys(body).some((k) => !route.bodyKeys?.includes(k)))
					throw new Fault(422, "VALIDATION_FAILED");
				// The stream is consumed: hand the parsed body to the adapter (it re-serialises it).
				(req as IncomingMessage & { body?: unknown }).body = body;
				delete req.headers["content-length"];
				delete req.headers["transfer-encoding"];
			}
			req.url = url.pathname; // query strings (disableRefresh, callbackURL, ...) never reach Better Auth
			req.headers[IP_HEADER] = clientIp(req, config.trustProxy);
			currentRequestId = requestId;
			await node(req, res);
		},
		async session(req, res) {
			if (!req.headers.cookie) return "";
			try {
				const { headers, response } = await auth.api.getSession({
					headers: fromNodeHeaders(req.headers),
					returnHeaders: true,
				});
				// A refreshed (or cleared) cookie must reach the browser even when the call was a CRM API request.
				for (const c of headers?.getSetCookie?.() ?? []) res.appendHeader("set-cookie", c);
				return response?.session?.token ?? "";
			} catch {
				throw new Fault(503, "AUTH_UNAVAILABLE");
			}
		},
		async close() {
			if (!opts.pool) await pool.end();
		},
	};
}

// -------------------------------------------------------------- process-wide runtime (lazy)

let shared: AuthRuntime | null | undefined;
/** The runtime for this process, from the environment; null when sign-in is not configured (non-production only). */
export function sharedAuth(): AuthRuntime | null {
	if (shared === undefined) {
		const config = loadAuthConfig();
		shared = config ? createAuthRuntime({ config }) : null;
	}
	return shared;
}
export async function closeSharedAuth(): Promise<void> {
	const s = shared;
	shared = undefined;
	await s?.close();
}

// Catalog re-export for the API and the UI round.
export { AUTH_ERROR_CATALOG };
