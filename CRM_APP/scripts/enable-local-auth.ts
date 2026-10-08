// Local review only: B4's password service and auth projection bootstrap sequence.
import { randomBytes, randomUUID } from "node:crypto";
import { appendFile, readFile, writeFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import pg from "pg";
import {
	checkPasswordPolicy,
	createPasswordService,
	loadPepperKeyring,
} from "../src/auth/password.js";

async function enableLocalAuth() {
	if (process.env.NODE_ENV === "production")
		throw new Error("LOCAL_AUTH_PRODUCTION_DENIED");
	const original = await readFile(".env", "utf8");
	const env = parseEnv(original);
	if (env.NODE_ENV === "production")
		throw new Error("LOCAL_AUTH_PRODUCTION_DENIED");
	const additions: string[] = [];
	const append = (key: string, value: string) => {
		env[key] = value;
		additions.push(`${key}=${value}`);
	};
	if (!env.AUTH_DATABASE_URL) {
		const url = new URL(env.DATABASE_URL ?? "");
		if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
			throw new Error("LOCAL_DATABASE_REQUIRED");
		url.username = "crm_auth";
		url.password = randomBytes(32).toString("hex");
		append("AUTH_DATABASE_URL", url.toString());
	}
	// Refuse an existing auth URL pointing outside the local runtime database.
	const runtime = new URL(env.DATABASE_URL ?? "");
	const auth = new URL(env.AUTH_DATABASE_URL ?? "");
	if (
		!["localhost", "127.0.0.1", "[::1]"].includes(runtime.hostname) ||
		auth.host !== runtime.host ||
		auth.pathname !== runtime.pathname ||
		auth.username !== "crm_auth"
	)
		throw new Error("LOCAL_DATABASE_REQUIRED");
	if (!env.BETTER_AUTH_SECRET)
		append("BETTER_AUTH_SECRET", randomBytes(48).toString("hex"));
	// B4's development fallback is process-local; persist a key for API restarts.
	const keyring = loadPepperKeyring(env);
	if (keyring.ephemeral) {
		append("CRM_AUTH_PEPPER_ACTIVE", "local");
		append("CRM_AUTH_PEPPER_local", randomBytes(32).toString("base64"));
	}
	if (additions.length) await appendFile(".env", `\n${additions.join("\n")}\n`);
	Object.assign(process.env, env);
	// Run the existing migration in-process; suppress its identifier-only progress.
	const log = console.log;
	const warn = console.warn;
	try {
		console.log = () => {};
		console.warn = () => {};
		await import("./migrate.js");
	} finally {
		console.log = log;
		console.warn = warn;
	}
	const tenant = "f018c810-1de8-45c2-9021-76162be4d472";
	const email = "ahmed.review@local.test";
	const password = randomBytes(32).toString("base64url");
	if (checkPasswordPolicy(password, email))
		throw new Error("BOOTSTRAP_INPUT_INVALID");
	const passwords = createPasswordService({ keyring: loadPepperKeyring() });
	const hash = await passwords.hash(password);
	const db = new pg.Client({ connectionString: env.ADMIN_DATABASE_URL });
	try {
		await db.connect();
		await db.query("BEGIN");
		await db.query("SELECT pg_advisory_xact_lock(724902)");
		const existingTenant = await db.query(
			"SELECT name FROM crm.tenant WHERE id=$1",
			[tenant],
		);
		if (existingTenant.rowCount !== 1) throw new Error("DEMO_TENANT_REQUIRED");
		const existing = await db.query(
			`SELECT id FROM auth."user" WHERE email=$1`,
			[email],
		);
		if (existing.rowCount) {
			const user = existing.rows[0].id;
			const membership = await db.query(
				`SELECT role FROM auth.member WHERE "organizationId"=$1 AND "userId"=$2`,
				[tenant, user],
			);
			if (membership.rows[0]?.role !== "manager")
				throw new Error("DEMO_MANAGER_REQUIRED");
			const updated = await db.query(
				`UPDATE auth.account SET password=$2,"updatedAt"=now() WHERE "userId"=$1 AND "providerId"='credential'`,
				[user, hash],
			);
			if (updated.rowCount !== 1) throw new Error("DEMO_CREDENTIAL_REQUIRED");
		} else {
			const user = randomUUID();
			// Same B4 identity/account/member writes; retain the existing tenant's name.
			await db.query(
				`INSERT INTO auth.organization(id,name,slug,"createdAt") VALUES($1,$2,$3,now()) ON CONFLICT(id) DO NOTHING`,
				[tenant, existingTenant.rows[0].name, `local-demo-${tenant}`],
			);
			await db.query(
				`INSERT INTO auth."user"(id,name,email,"emailVerified") VALUES($1,$2,$3,false)`,
				[user, "Ahmed Review", email],
			);
			await db.query(
				`INSERT INTO auth.account("accountId","providerId","userId",password,"updatedAt") VALUES($1::text,'credential',$1::uuid,$2,now())`,
				[user, hash],
			);
			await db.query(
				`INSERT INTO auth.member("organizationId","userId",role,"createdAt") VALUES($1,$2,'manager',now())`,
				[tenant, user],
			);
			await db.query("SELECT crm.seed_system_properties($1)", [tenant]);
		}
		await db.query("COMMIT");
	} catch (error) {
		await db.query("ROLLBACK").catch(() => {});
		throw error;
	} finally {
		await db.end();
	}
	await writeFile(
		"local-auth-demo.json",
		`${JSON.stringify({ email, password, tenant }, null, 2)}\n`,
		{ mode: 0o600 },
	);
	console.log("credentials written to local-auth-demo.json");
}

enableLocalAuth().catch((error: unknown) => {
	console.error(
		"LOCAL_AUTH_FAILED",
		error instanceof Error ? error.name : "unknown",
		(error as { code?: string }).code ?? "no_code",
	); // Never emit database detail, environment or credentials.
	process.exitCode = 1;
});
