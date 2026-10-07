import { readFile } from "node:fs/promises";
import pg from "pg";
const db = new pg.Client({ connectionString: process.env.ADMIN_DATABASE_URL });
await db.connect();
try {
	await db.query("BEGIN");
	await db.query("SELECT pg_advisory_xact_lock(724901)");
	await db.query(
		"CREATE TABLE IF NOT EXISTS public.crm_migrations(version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
	);
	for (const [version, file] of [
		[1, "001_foundation.sql"],
		[2, "002_crm_core.sql"],
		[3, "003_object_integrity.sql"],
		[4, "004_relationship_authority.sql"],
		[5, "005_protected_key_configuration.sql"],
		[6, "006_journey_reporting.sql"],
		[7, "007_collect_event_canonical_id.sql"],
		[8, "008_list_query_timestamps_scope.sql"],
		[9, "009_arabic_search.sql"],
		[10, "010_property_registry.sql"],
		[11, "011_schema_api.sql"],
		[12, "012_search_rebuild.sql"],
		[13, "013_auth_schema_roles.sql"],
		[14, "014_auth_org_2fa.sql"],
		[15, "015_auth_projection.sql"],
		[16, "016_auth_bridge.sql"],
		[17, "017_auth_audit.sql"],
		[18, "018_import.sql"],
	] as const) {
		const { rowCount } = await db.query(
			"SELECT 1 FROM public.crm_migrations WHERE version=$1",
			[version],
		);
		if (!rowCount) {
			// Additive upgrades must not change object row counts (ADR-002 4.10 verification step).
			const counts = async () => {
				const out: Record<string, number> = {};
				for (const t of ["contact", "lead", "deal", "task"])
					out[t] = Number(
						(await db.query(`SELECT count(*) n FROM crm.${t}`)).rows[0].n,
					);
				return out;
			};
			const before = version >= 8 ? await counts() : null;
			await db.query(
				await readFile(
					new URL(`../migrations/${file}`, import.meta.url),
					"utf8",
				),
			);
			if (before) {
				const after = await counts();
				if (JSON.stringify(before) !== JSON.stringify(after))
					throw new Error(`Row counts changed in migration ${version}`);
				console.log(`Migration ${version} row counts unchanged:`, after);
			}
			await db.query("INSERT INTO public.crm_migrations(version) VALUES($1)", [
				version,
			]);
		}
	}
	// Repair privileges on databases that applied 008 before its PUBLIC EXECUTE fix.
	// This is idempotent and runs under the same migration lock and transaction.
	await db.query(
		"REVOKE EXECUTE ON FUNCTION crm.context_tenant_if_allowed(),crm.object_scope(text,uuid),crm.owner_names(uuid[]) FROM PUBLIC",
	);
	const password = new URL(process.env.DATABASE_URL ?? "").password;
	if (!/^[a-zA-Z0-9]{24,}$/.test(password))
		throw new Error("Use generated alphanumeric runtime password");
	await db.query(`ALTER ROLE crm_runtime PASSWORD '${password}'`);
	// AUTH_PLAN B1: re-assert the auth/crm privilege split on every run (idempotent repair block).
	await db.query(`
		REVOKE USAGE ON SCHEMA public FROM PUBLIC;
		GRANT USAGE ON SCHEMA public TO crm_runtime;
		REVOKE ALL ON SCHEMA auth FROM PUBLIC;
		REVOKE ALL ON SCHEMA auth FROM crm_runtime;
		GRANT USAGE ON SCHEMA auth TO crm_auth;
		REVOKE ALL ON ALL TABLES IN SCHEMA auth FROM PUBLIC, crm_runtime;
		GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA auth TO crm_auth;
		REVOKE ALL ON auth.login_throttle, auth.auth_event FROM PUBLIC, crm_auth, crm_runtime;
		REVOKE ALL ON ALL FUNCTIONS IN SCHEMA auth FROM PUBLIC;
		GRANT EXECUTE ON FUNCTION auth.login_gate(text), auth.login_failed(text), auth.login_succeeded(text) TO crm_auth;
		REVOKE ALL ON crm.platform_flag FROM PUBLIC, crm_runtime;
		REVOKE EXECUTE ON FUNCTION crm.actor(), crm.mfa_ok(uuid,uuid) FROM PUBLIC;
		REVOKE ALL ON SCHEMA crm FROM crm_auth;
		REVOKE ALL ON ALL TABLES IN SCHEMA crm FROM crm_auth;
		REVOKE ALL ON ALL FUNCTIONS IN SCHEMA crm FROM crm_auth;
		REVOKE ALL ON SCHEMA public FROM crm_auth`);
	// crm_auth is the Better Auth pool role. Its password comes from AUTH_DATABASE_URL; without it the role
	// stays password-less (cannot log in), which is safe for installs that do not run sign-in yet.
	if (process.env.AUTH_DATABASE_URL) {
		const authPassword = new URL(process.env.AUTH_DATABASE_URL).password;
		if (!/^[a-zA-Z0-9]{24,}$/.test(authPassword))
			throw new Error("Use generated alphanumeric auth password");
		if (authPassword === password)
			throw new Error("crm_auth and crm_runtime must not share a password");
		await db.query(`ALTER ROLE crm_auth PASSWORD '${authPassword}'`);
	} else
		console.warn("AUTH_DATABASE_URL not set: crm_auth password left unchanged");
	await db.query("COMMIT");
	console.log("Migrations 001–018 applied/verified");
} catch (e) {
	await db.query("ROLLBACK");
	throw e;
} finally {
	await db.end();
}
