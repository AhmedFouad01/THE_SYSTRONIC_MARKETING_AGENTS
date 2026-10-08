import { randomUUID } from "node:crypto";
import type pg from "pg";
import { type Context, Fault } from "./db.js";
import { normalizeEmail, normalizePhone } from "./contactformat.js";
import type { Kind } from "./query.js";

/** Protected projections never participate in search, filtering or sorting. A lead must pass both gates. */
export async function attachContactFields(
	db: pg.PoolClient,
	ctx: Context,
	kind: Kind,
	rows: Record<string, unknown>[],
) {
	if ((kind !== "contact" && kind !== "lead") || !rows.length) return;
	const ids = rows.map((r) => r.id);
	const results = await db.query(
		`SELECT x.id, c.id contact_id,
 crm.can_object('sensitive.read',$3,x.id,$4) AND crm.can_object('sensitive.read','contact',c.id,$4) allowed
 FROM crm.${kind} x JOIN crm.contact c ON c.tenant_id=x.tenant_id AND c.id=${kind === "contact" ? "x.id" : "x.contact_id"}
 WHERE x.tenant_id=$1 AND x.id=ANY($2::uuid[])`,
		[ctx.tenant, ids, kind, ctx.grant ?? null],
	);
	const permissions = new Map(results.rows.map((r) => [r.id, r]));
	const allowedContacts = [
		...new Set(results.rows.filter((r) => r.allowed).map((r) => r.contact_id)),
	];
	const values = new Map<string, Record<string, unknown>>();
	if (allowedContacts.length) {
		const channels = await db.query(
			`SELECT DISTINCT ON(contact_id,kind) contact_id,kind,crm.identifier_value_scoped(id,$3) value
   FROM crm.contact_identifier WHERE tenant_id=$1 AND contact_id=ANY($2::uuid[])
   ORDER BY contact_id,kind,is_primary DESC,(original_contact_id=contact_id) DESC,id`,
			[ctx.tenant, allowedContacts, ctx.grant ?? null],
		);
		for (const r of channels.rows)
			values.set(r.contact_id, {
				...values.get(r.contact_id),
				[r.kind]: r.value,
			});
		if (kind === "contact") {
			const business = await db.query(
				"SELECT c.id,b.* FROM crm.contact c CROSS JOIN LATERAL crm.contact_business_fields(c.id,$3) b WHERE c.tenant_id=$1 AND c.id=ANY($2::uuid[])",
				[ctx.tenant, allowedContacts, ctx.grant ?? null],
			);
			for (const r of business.rows)
				values.set(r.id, {
					...values.get(r.id),
					company: r.company,
					job_title: r.job_title,
				});
		}
	}
	for (const row of rows) {
		const permission = permissions.get(row.id);
		const v = permission?.allowed
			? values.get(permission.contact_id)
			: undefined;
		row.sensitive_masked = !permission?.allowed;
		for (const field of kind === "contact"
			? ["email", "phone", "company", "job_title"]
			: ["email", "phone"])
			row[field] = v?.[field] ?? null;
	}
}

/** Scalar adapters reuse the encrypted identifier registry, preserving all earlier values and provenance. */
export async function writeContactFields(
	db: pg.PoolClient,
	ctx: Context,
	contact: string,
	body: Record<string, unknown>,
	bumpVersion = false,
) {
	const fields = ["email", "phone", "company", "job_title"].filter(
		(k) => k in body,
	);
	if (!fields.length) return;
	const permission = await db.query(
		"SELECT crm.can_object('sensitive.write','contact',$1,$2) allowed",
		[contact, ctx.grant ?? null],
	);
	if (!permission.rows[0].allowed) throw new Fault(403, "FORBIDDEN");
	await db.query(
		"SELECT id FROM crm.contact WHERE tenant_id=$1 AND id=$2 FOR UPDATE",
		[ctx.tenant, contact],
	);
	for (const field of fields) {
		const raw = body[field];
		if (field === "email" || field === "phone") {
			const value =
				typeof raw === "string"
					? field === "email"
						? normalizeEmail(raw)
						: normalizePhone(raw)
					: null;
			if (!value) throw new Fault(422, "VALIDATION_FAILED");
			await db.query(
				"UPDATE crm.contact_identifier SET is_primary=false WHERE tenant_id=$1 AND contact_id=$2 AND kind=$3",
				[ctx.tenant, contact, field],
			);
			const existing = await db.query(
				"SELECT id FROM crm.contact_identifier WHERE tenant_id=$1 AND contact_id=$2 AND kind=$3 AND keyed_lookup_digest=crm.identifier_digest($4) ORDER BY id LIMIT 1",
				[ctx.tenant, contact, field, value],
			);
			if (existing.rowCount)
				await db.query(
					"UPDATE crm.contact_identifier SET is_primary=true WHERE tenant_id=$1 AND id=$2",
					[ctx.tenant, existing.rows[0].id],
				);
			else
				await db.query(
					"INSERT INTO crm.contact_identifier(tenant_id,id,contact_id,kind,encrypted_value,keyed_lookup_digest,provenance,original_contact_id,is_primary) VALUES($1,$2,$3,$4,crm.encrypt_identifier($5),crm.identifier_digest($5),'manual_entry',$3,true)",
					[ctx.tenant, randomUUID(), contact, field, value],
				);
		} else {
			if (raw !== null && (typeof raw !== "string" || raw.length > 300))
				throw new Fault(422, "VALIDATION_FAILED");
			const value =
				typeof raw === "string" ? raw.trim().normalize("NFC") : null;
			await db.query(
				`UPDATE crm.contact SET ${field}_encrypted=CASE WHEN $3::text IS NULL OR $3='' THEN NULL ELSE crm.encrypt_identifier($3) END WHERE tenant_id=$1 AND id=$2`,
				[ctx.tenant, contact, value],
			);
		}
	}
	if (bumpVersion) await db.query("UPDATE crm.contact SET version=version+1 WHERE tenant_id=$1 AND id=$2",[ctx.tenant,contact]);
}
