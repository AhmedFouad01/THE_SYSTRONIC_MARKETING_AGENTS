import { createHash, randomBytes } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { PostgresDialect } from "kysely";
import pg from "pg";
import {
	Fault,
	type Context,
	transaction,
	authorize,
	faultFromDbError,
} from "../db.js";
import { organization } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { AUTH_ERROR_CATALOG, mapBetterAuthError } from "./errors.js";
import {
	HashBusyError,
	type PasswordService,
	PASSWORD_MAX_LENGTH,
	createPasswordService,
	loadPepperKeyring,
	checkPasswordPolicy,
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
	"POST /sign-in/email": {
		write: true,
		bodyKeys: ["email", "password", "rememberMe"],
	},
	"POST /sign-out": { write: true, bodyKeys: [] },
	"GET /get-session": { write: false },
	"POST /sign-up/email": {
		write: true,
		bodyKeys: ["email", "password", "name", "invitationId"],
	},
	"POST /organization/accept-invitation": {
		write: true,
		bodyKeys: ["invitationId"],
	},
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
const off = (v: string | undefined) =>
	v === "0" || v === "false" || v === "off";

/**
 * The dev Bearer path (tokens minted into crm.session by seeds and tests). Never in production.
 * Elsewhere it is ON unless CRM_DEV_BEARER is 0/false/off, so the existing seeded dev flow and test suites keep working;
 * a deployment that must refuse it sets NODE_ENV=production (boot also refuses CRM_DEV_BEARER=1 there).
 */
export function devBearerEnabled(
	env: NodeJS.ProcessEnv = process.env,
): boolean {
	if (env.NODE_ENV === "production") return false;
	return !off(env.CRM_DEV_BEARER);
}

/** Boot-time guards for production. Throws AuthConfigError; the API refuses to start. Also used by tests. */
export function assertAuthEnvironment(
	env: NodeJS.ProcessEnv = process.env,
): void {
	if (env.NODE_ENV !== "production") return;
	if (truthy(env.CRM_DEV_BEARER))
		throw new AuthConfigError("CRM_DEV_BEARER must not be set in production");
	if (!env.AUTH_DATABASE_URL)
		throw new AuthConfigError("AUTH_DATABASE_URL is required in production");
	if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32)
		throw new AuthConfigError(
			"BETTER_AUTH_SECRET (>= 32 characters) is required in production",
		);
	if (!env.CRM_PUBLIC_ORIGIN?.startsWith("https://"))
		throw new AuthConfigError(
			"CRM_PUBLIC_ORIGIN (https) is required in production",
		);
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
export function loadAuthConfig(
	env: NodeJS.ProcessEnv = process.env,
): AuthConfig | null {
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
		for (const [k, v] of Object.entries(value))
			if (k !== "token") out[k] = stripTokens(v);
		return out;
	}
	return value;
}

function clientIp(req: IncomingMessage, trustProxy: boolean): string {
	let ip = "";
	if (trustProxy) {
		// One trusted hop (nginx): the rightmost entry is the one the proxy appended.
		const xff = req.headers["x-forwarded-for"];
		ip =
			(Array.isArray(xff) ? xff.join(",") : (xff ?? ""))
				.split(",")
				.pop()
				?.trim() ?? "";
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
	handle(
		req: IncomingMessage,
		res: ServerResponse,
		requestId: string,
	): Promise<void>;
	/** Raw Better Auth session token for the request's cookie, or "" (forwards any refreshed Set-Cookie to `res`). */
	session(req: IncomingMessage, res: ServerResponse): Promise<string>;
	originAllowed(origin: string | undefined): boolean;
	directory(
		ctx: Context,
		method: string,
		path: string,
		body: Record<string, unknown>,
		headers: IncomingMessage["headers"],
		query?: URLSearchParams,
	): Promise<{ data: unknown; status?: number }>;
	close(): Promise<void>;
}

const wrapHash = async <T>(fn: () => Promise<T>): Promise<T> => {
	try {
		return await fn();
	} catch (e) {
		if (e instanceof HashBusyError)
			throw new APIError("SERVICE_UNAVAILABLE", {
				code: "AUTH_BUSY",
				message: "busy",
			});
		if (e instanceof RangeError)
			throw new APIError("UNAUTHORIZED", {
				code: "AUTH_INVALID_CREDENTIALS",
				message: "invalid",
			});
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

	const ac = createAccessControl({
		member: ["create", "update", "delete"],
		invitation: ["create", "cancel"],
	} as const);
	const roles = {
		manager: ac.newRole({
			member: ["create", "update", "delete"],
			invitation: ["create", "cancel"],
		}),
		rep: ac.newRole({ member: [], invitation: [] }),
		reader: ac.newRole({ member: [], invitation: [] }),
	};
	const validInvitation = async (
		id: unknown,
		email: unknown,
		atCreate = false,
	) => {
		if (
			typeof id !== "string" ||
			!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
				id,
			) ||
			typeof email !== "string"
		)
			throw new APIError(atCreate ? "UNPROCESSABLE_ENTITY" : "FORBIDDEN", {
				code: "AUTH_INVITATION_INVALID",
				message: "invite required",
			});
		const { rowCount } = await pool.query(
			`SELECT 1 FROM auth.invitation WHERE id=$1 AND email=lower($2) AND status='pending' AND "expiresAt">now()`,
			[id, email.trim()],
		);
		if (!rowCount)
			throw new APIError(atCreate ? "UNPROCESSABLE_ENTITY" : "FORBIDDEN", {
				code: "AUTH_INVITATION_INVALID",
				message: "invite invalid",
			});
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
			disableSignUp: false, // B4: guarded twice below; no ungated registration
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
		plugins: [
			organization({
				ac,
				roles,
				creatorRole: "manager",
				allowUserToCreateOrganization: false,
				disableOrganizationDeletion: true,
				requireEmailVerificationOnInvitation: false,
				invitationExpiresIn: 7 * 24 * 60 * 60,
				// D4: delivery is copy-link through our manager route; no email transport yet.
				sendInvitationEmail: async () => {},
			}),
		],
		databaseHooks: {
			user: {
				create: {
					before: async (user, ctx) => {
						// 1.7.7 masks a user-create 403 as duplicate-signup success; 422 keeps this
						// denial explicit. Our public mapper still returns 403 AUTH_INVITATION_INVALID.
						await validInvitation(ctx?.body?.invitationId, user.email, true);
						return { data: user };
					},
				},
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
				if (
					ctx.path === "/organization/accept-invitation" &&
					(typeof ctx.body?.invitationId !== "string" ||
						!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
							ctx.body.invitationId,
						))
				)
					throw new APIError("FORBIDDEN", {
						code: "AUTH_INVITATION_INVALID",
						message: "invite invalid",
					});
				if (ctx.path === "/sign-up/email") {
					await validInvitation(ctx.body?.invitationId, ctx.body?.email);
					if (
						typeof ctx.body?.password !== "string" ||
						checkPasswordPolicy(ctx.body.password, ctx.body.email)
					)
						throw new APIError("UNPROCESSABLE_ENTITY", {
							code: "AUTH_PASSWORD_POLICY",
							message: "password policy",
						});
					return;
				}
				if (ctx.path !== "/sign-in/email") return;
				const email = (ctx.body as { email?: unknown } | undefined)?.email;
				if (typeof email !== "string" || !email) return; // Better Auth validates the shape
				const {
					rows: [r],
				} = await pool.query("SELECT auth.login_gate($1) AS seconds", [
					lockoutKey(email),
				]);
				if (r.seconds > 0)
					throw new APIError("TOO_MANY_REQUESTS", {
						code: "AUTH_TOO_MANY_ATTEMPTS",
						message: "locked",
						retryAfter: r.seconds,
					});
			}),
			after: createAuthMiddleware(async (ctx) => {
				if (ctx.path !== "/sign-in/email") return;
				const email = (ctx.body as { email?: unknown } | undefined)?.email;
				if (typeof email !== "string" || !email) return;
				const returned = ctx.context.returned as
					| { statusCode?: number; body?: { code?: string } }
					| undefined;
				if (
					returned &&
					typeof returned === "object" &&
					"statusCode" in returned
				) {
					// Only a wrong credential counts (not rate limits, validation errors or the lock itself).
					if (returned.body?.code === "INVALID_EMAIL_OR_PASSWORD")
						await pool.query("SELECT auth.login_failed($1)", [
							lockoutKey(email),
						]);
				} else if (returned) {
					await pool.query("SELECT auth.login_succeeded($1)", [
						lockoutKey(email),
					]);
				}
			}),
		},
	});

	const envelope = (
		code: string,
		status: number,
		requestId: string,
		headers: Headers,
	) => {
		headers.set("content-type", "application/json");
		return new Response(
			JSON.stringify({
				code,
				safe_message: code,
				request_id: requestId,
				retryable: status >= 500,
			}),
			{ status, headers },
		);
	};

	// Response post-processing: our error envelope instead of Better Auth's English messages, and no `token` in any JSON body.
	const postProcess = async (
		resp: Response,
		requestId: string,
	): Promise<Response> => {
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

	async function readJson(
		req: IncomingMessage,
	): Promise<Record<string, unknown> | undefined> {
		const parts: Buffer[] = [];
		let size = 0;
		for await (const chunk of req) {
			size += chunk.length;
			if (size > BODY_LIMIT) throw new Fault(413, "PAYLOAD_TOO_LARGE");
			parts.push(chunk);
		}
		if (!size) return undefined;
		if (
			!(req.headers["content-type"] ?? "")
				.toLowerCase()
				.startsWith("application/json")
		)
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
			if (!route || !url.pathname.startsWith(`${AUTH_BASE_PATH}/`))
				throw new Fault(404, "NOT_FOUND");
			if (route.write) {
				// T3: every state-changing auth call must come from a trusted origin (no ambient-cookie CSRF, no origin-less POST).
				if (!originAllowed(req.headers.origin))
					throw new Fault(403, "AUTH_ORIGIN_NOT_ALLOWED");
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
				for (const c of headers?.getSetCookie?.() ?? [])
					res.appendHeader("set-cookie", c);
				return response?.session?.token ?? "";
			} catch {
				throw new Fault(503, "AUTH_UNAVAILABLE");
			}
		},
		async directory(
			ctx,
			method,
			path,
			body,
			requestHeaders,
			query = new URLSearchParams(),
		) {
			// crm_runtime validates tenant, actor and permission before the isolated auth pool is used.
			return transaction(ctx, async (db) => {
				const invites =
					path === "/v1/invites" || path.startsWith("/v1/invites/");
				const collection = path === (invites ? "/v1/invites" : "/v1/users");
				if (
					!collection &&
					!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
						path.split("/").pop() ?? "",
					)
				)
					throw new Fault(404, "NOT_FOUND");
				if (
					!(
						(method === "GET" && collection) ||
						(invites && method === "POST" && collection) ||
						(!collection &&
							(method === "DELETE" || (!invites && method === "PATCH")))
					)
				)
					throw new Fault(404, "NOT_FOUND");
				await authorize(
					db,
					method === "GET"
						? "user.read"
						: invites
							? "user.invite"
							: "user.manage",
					null,
					ctx.grant,
				);
				// The plugin also requires a real cookie session and a direct manager membership.
				const headers = fromNodeHeaders(requestHeaders);
				const session = await auth.api.getSession({ headers });
				if (!session || session.session.token !== ctx.token)
					throw new Fault(401, "UNAUTHENTICATED");
				const { rowCount } = await pool.query(
					`SELECT 1 FROM auth.member WHERE "organizationId"=$1 AND "userId"=$2 AND role='manager'`,
					[ctx.tenant, session.user.id],
				);
				if (!rowCount) throw new Fault(403, "FORBIDDEN");
				const allowed =
					method === "POST"
						? ["email", "role"]
						: method === "PATCH"
							? ["role"]
							: [];
				if (Object.keys(body).some((k) => !allowed.includes(k)))
					throw new Fault(422, "VALIDATION_FAILED");
				if (method === "POST" || method === "PATCH") {
					if (
						typeof body.role !== "string" ||
						!["manager", "rep", "reader"].includes(body.role)
					)
						throw new Fault(422, "VALIDATION_FAILED");
				}
				try {
					if (method === "GET") {
						const limit = Number(query.get("limit") ?? 100),
							offset = Number(query.get("offset") ?? 0);
						if (
							[...query.keys()].some(
								(k) => invites || !["limit", "offset"].includes(k),
							) ||
							!Number.isInteger(limit) ||
							limit < 1 ||
							limit > 100 ||
							!Number.isSafeInteger(offset) ||
							offset < 0
						)
							throw new Fault(422, "VALIDATION_FAILED");
						const data = invites
							? await auth.api.listInvitations({
									headers,
									query: { organizationId: ctx.tenant },
								})
							: await auth.api.listMembers({
									headers,
									query: {
										organizationId: ctx.tenant,
										limit,
										offset,
										sortBy: "createdAt",
										sortDirection: "asc",
									},
								});
						return { data: stripTokens(data) };
					}
					if (invites && method === "POST") {
						if (
							typeof body.email !== "string" ||
							body.email.length > 254 ||
							!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)
						)
							throw new Fault(422, "VALIDATION_FAILED");
						const invite = await auth.api.createInvitation({
							headers,
							body: {
								email: body.email.trim().toLowerCase(),
								role: body.role as "manager" | "rep" | "reader",
								organizationId: ctx.tenant,
							},
						});
						const link = new URL("/app/invite", config.publicOrigin);
						link.hash = new URLSearchParams({
							invitationId: invite.id,
						}).toString();
						return {
							data: { invitation: invite, link: link.toString() },
							status: 201,
						};
					}
					const id = path.split("/").pop() as string;
					// Never pass a global object id to Better Auth until it is bound to our tenant.
					const found = await pool.query(
						invites
							? `SELECT id FROM auth.invitation WHERE id=$1 AND "organizationId"=$2`
							: `SELECT id FROM auth.member WHERE id=$1 AND "organizationId"=$2`,
						[id, ctx.tenant],
					);
					if (!found.rowCount) throw new Fault(404, "NOT_FOUND");
					const data = invites
						? await auth.api.cancelInvitation({
								headers,
								body: { invitationId: id },
							})
						: method === "PATCH"
							? await auth.api.updateMemberRole({
									headers,
									body: {
										memberId: id,
										role: body.role as "manager" | "rep" | "reader",
										organizationId: ctx.tenant,
									},
								})
							: await auth.api.removeMember({
									headers,
									body: { memberIdOrEmail: id, organizationId: ctx.tenant },
								});
					return { data: stripTokens(data) };
				} catch (error) {
					if (error instanceof Fault) throw error;
					const invariant = faultFromDbError(error);
					if (invariant) throw invariant;
					if (error instanceof APIError) {
						const mapped = mapBetterAuthError(error.statusCode, error.body);
						throw new Fault(mapped.status, mapped.code);
					}
					throw error;
				}
			});
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
