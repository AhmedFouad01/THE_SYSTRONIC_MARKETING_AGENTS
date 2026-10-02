import pg from "pg";
const tenant = process.argv[2];
if (
	!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
		tenant ?? "",
	)
)
	throw new Error("Tenant UUID required");
const db = new pg.Client({ connectionString: process.env.ADMIN_DATABASE_URL });
try {
	await db.connect();
	await db.query("SELECT crm.provision_identifier_key($1)", [tenant]);
	console.log(
		"Tenant protected-key configuration verified; no existing key replaced",
	);
} catch {
	console.error(
		"PROTECTED_KEY_CONFIGURATION_FAILED: restore matching key state; no key replaced",
	);
	process.exitCode = 1;
} finally {
	await db.end();
}
