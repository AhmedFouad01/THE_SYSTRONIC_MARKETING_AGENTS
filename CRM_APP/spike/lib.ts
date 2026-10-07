// THROWAWAY B0 spike harness (AUTH_PLAN section 5). Lives on branch spike/better-auth-b0 only.
// Never merge. Uses scratch DB crm_spike_b0 and role crm_spike_auth, both created here.
import { randomBytes } from "node:crypto";
import { betterAuth } from "better-auth";
import { getMigrations } from "better-auth/db/migration";
import { organization, twoFactor } from "better-auth/plugins";
import { base32 } from "@better-auth/utils/base32";
import { createOTP } from "@better-auth/utils/otp";
import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";

export const SCRATCH_DB = "crm_spike_b0";
export const SPIKE_ROLE = "crm_spike_auth";
export const BASE = "http://localhost:4318";
export const logs: string[] = [];

function swapDb(url: string, db: string, user?: string, pw?: string) {
	const u = new URL(url);
	u.pathname = `/${db}`;
	if (user) u.username = user;
	if (pw) u.password = pw;
	return u.toString();
}

export async function setup() {
	const adminUrl = process.env.ADMIN_DATABASE_URL as string;
	const boot = new pg.Client({ connectionString: adminUrl });
	await boot.connect();
	const ex = await boot.query("select 1 from pg_database where datname=$1", [SCRATCH_DB]);
	if (ex.rowCount) {
		// only ever drop what this spike created
		await boot.query(`drop database ${SCRATCH_DB} with (force)`);
	}
	await boot.query(`create database ${SCRATCH_DB}`);
	const hasRole = await boot.query("select 1 from pg_roles where rolname=$1", [SPIKE_ROLE]);
	const rolePw = randomBytes(12).toString("hex");
	if (hasRole.rowCount) await boot.query(`alter role ${SPIKE_ROLE} login password '${rolePw}'`);
	else await boot.query(`create role ${SPIKE_ROLE} login nosuperuser nocreatedb nocreaterole noinherit nobypassrls password '${rolePw}'`);
	await boot.end();
	const adminPool = new pg.Pool({ connectionString: swapDb(adminUrl, SCRATCH_DB), max: 2 });
	const appPool = new pg.Pool({ connectionString: swapDb(adminUrl, SCRATCH_DB, SPIKE_ROLE, rolePw), max: 4 });
	return { adminPool, appPool };
}

export async function teardown(adminPool: pg.Pool, appPool: pg.Pool) {
	await appPool.end();
	await adminPool.end();
	const adminUrl = process.env.ADMIN_DATABASE_URL as string;
	const boot = new pg.Client({ connectionString: adminUrl });
	await boot.connect();
	await boot.query(`drop database if exists ${SCRATCH_DB} with (force)`);
	await boot.query(`drop role if exists ${SPIKE_ROLE}`);
	await boot.end();
}

export interface Hooks {
	hash?: (p: string) => Promise<string>;
	verify?: (d: { hash: string; password: string }) => Promise<boolean>;
	extra?: Record<string, unknown>;
	twoFactorOpts?: Record<string, unknown>;
	orgOpts?: Record<string, unknown>;
}

export function makeOptions(appPool: pg.Pool, h: Hooks = {}) {
	const kysely = new Kysely({ dialect: new PostgresDialect({ pool: appPool }) });
	return {
		baseURL: BASE,
		basePath: "/v1/auth",
		secret: "spike-only-secret-not-for-use-0123456789abcdef",
		database: { db: kysely, type: "postgres" as const, schemaName: "auth" },
		advanced: { database: { generateId: "uuid" as const, validateSchema: true } },
		telemetry: { enabled: false },
		logger: { level: "debug" as const, log: (level: string, message: string) => { logs.push(`${level}: ${message}`); } },
		emailAndPassword: {
			enabled: true,
			minPasswordLength: 12,
			maxPasswordLength: 128,
			autoSignIn: false,
			revokeSessionsOnPasswordReset: true,
			sendResetPassword: async (d: { user: { email: string }; url: string; token: string }) => {
				(globalThis as any).__mail.push(d);
			},
			...(h.hash || h.verify ? { password: { hash: h.hash, verify: h.verify } } : {}),
		},
		plugins: [
			organization({
				allowUserToCreateOrganization: false,
				disableOrganizationDeletion: true,
				creatorRole: "manager",
				sendInvitationEmail: async (d: unknown) => { (globalThis as any).__invites.push(d); },
				...(h.orgOpts ?? {}),
			} as any),
			twoFactor({ issuer: "CRM-spike", ...(h.twoFactorOpts ?? {}) } as any),
		],
		...(h.extra ?? {}),
	};
}

export async function migrate(adminPool: pg.Pool, opts: any) {
	// run schema creation as the owner (admin) pool, then grant to the app role
	const o = { ...opts, database: { db: new Kysely({ dialect: new PostgresDialect({ pool: adminPool }) }), type: "postgres", schemaName: "auth" } };
	const m = await getMigrations(o);
	const sql = await m.compileMigrations();
	await m.runMigrations();
	await adminPool.query(`grant usage on schema auth to ${SPIKE_ROLE}`);
	await adminPool.query(`grant select, insert, update, delete on all tables in schema auth to ${SPIKE_ROLE}`);
	return { toBeCreated: m.toBeCreated.map((t: any) => t.table), toBeAdded: m.toBeAdded.map((t: any) => t.table), sql };
}

export function client(auth: any) {
	const jar = new Map<string, string>();
	const absorb = (res: Response) => {
		for (const sc of res.headers.getSetCookie()) {
			const [kv] = sc.split(";");
			const i = kv.indexOf("=");
			const k = kv.slice(0, i);
			const v = kv.slice(i + 1);
			if (/max-age=0/i.test(sc) || v === "") jar.delete(k);
			else jar.set(k, v);
		}
	};
	const cookie = () => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
	async function call(path: string, o: { method?: string; body?: unknown; headers?: Record<string, string>; cookie?: string; noOrigin?: boolean } = {}) {
		const headers: Record<string, string> = { "content-type": "application/json", "x-forwarded-for": "198.51.100.7", ...(o.headers ?? {}) };
		if (!o.noOrigin) headers.origin = BASE;
		const ck = o.cookie ?? cookie();
		if (ck) headers.cookie = ck;
		const res = await auth.handler(new Request(`${BASE}/v1/auth${path}`, { method: o.method ?? (o.body ? "POST" : "GET"), headers, body: o.body ? JSON.stringify(o.body) : undefined }));
		absorb(res);
		let json: any = null;
		const text = await res.text();
		try { json = JSON.parse(text); } catch { json = text; }
		return { status: res.status, json, setCookies: res.headers.getSetCookie() };
	}
	return { call, jar, cookie };
}

export async function totpNow(uri: string) {
	const b32 = new URL(uri).searchParams.get("secret") as string;
	const secret = new TextDecoder().decode(base32.decode(b32));
	return createOTP(secret).totp();
}
export function ok(c: boolean, msg: string) { console.log(`${c ? "PASS" : "FAIL"}  ${msg}`); }
export function show(label: string, v: unknown) { console.log(`--- ${label}\n${typeof v === "string" ? v : JSON.stringify(v, null, 1)}`); }
