// Operator-only bootstrap; password comes from the environment, never command arguments or output.
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import pg from "pg";
import {
	checkPasswordPolicy,
	createPasswordService,
	loadPepperKeyring,
	type PasswordService,
} from "../src/auth/password.js";

export type TenantAdminInput = {
	tenantId?: string;
	tenantName: string;
	slug: string;
	name: string;
	email: string;
	password: string;
};
export async function createTenantAdmin(
	db: pg.Client,
	input: TenantAdminInput,
	passwords: PasswordService,
) {
	const email = input.email.trim().toLowerCase();
	if (
		!input.tenantName.trim() ||
		!input.name.trim() ||
		!/^[a-z0-9][a-z0-9-]{0,99}$/.test(input.slug) ||
		!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
		checkPasswordPolicy(input.password, email)
	)
		throw new Error("BOOTSTRAP_INPUT_INVALID");
	const tenant = input.tenantId ?? randomUUID();
	const user = randomUUID();
	const hash = await passwords.hash(input.password);
	await db.query("BEGIN");
	try {
		await db.query(
			`INSERT INTO auth."user"(id,name,email,"emailVerified") VALUES($1,$2,$3,false)`,
			[user, input.name, email],
		);
		await db.query(
			`INSERT INTO auth.account("accountId","providerId","userId",password,"updatedAt") VALUES($1::text,'credential',$1::uuid,$2,now())`,
			[user, hash],
		);
		await db.query(
			`INSERT INTO auth.organization(id,name,slug,"createdAt") VALUES($1,$2,$3,now())`,
			[tenant, input.tenantName, input.slug],
		);
		await db.query(
			`INSERT INTO auth.member("organizationId","userId",role,"createdAt") VALUES($1,$2,'manager',now())`,
			[tenant, user],
		);
		await db.query("SELECT crm.seed_system_properties($1)", [tenant]);
		await db.query("COMMIT");
		return { tenant, user };
	} catch (error) {
		await db.query("ROLLBACK");
		throw error;
	}
}
if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(process.argv[1]).href
) {
	const db = new pg.Client({
		connectionString: process.env.ADMIN_DATABASE_URL,
	});
	try {
		await db.connect();
		const result = await createTenantAdmin(
			db,
			{
				tenantId: process.env.CRM_BOOTSTRAP_TENANT_ID,
				tenantName: process.env.CRM_BOOTSTRAP_TENANT_NAME ?? "",
				slug: process.env.CRM_BOOTSTRAP_SLUG ?? "",
				name: process.env.CRM_BOOTSTRAP_NAME ?? "",
				email: process.env.CRM_BOOTSTRAP_EMAIL ?? "",
				password: process.env.CRM_BOOTSTRAP_PASSWORD ?? "",
			},
			createPasswordService({ keyring: loadPepperKeyring() }),
		);
		console.log(JSON.stringify(result)); // identifiers only
	} catch {
		console.error("BOOTSTRAP_FAILED"); // PostgreSQL detail can include an email or password hash.
		process.exitCode = 1;
	} finally {
		await db.end();
	}
}
