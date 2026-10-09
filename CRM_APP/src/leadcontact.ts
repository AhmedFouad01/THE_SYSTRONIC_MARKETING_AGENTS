import type pg from "pg";
import { type Context, Fault } from "./db.js";
/** Shared API/import/future Lead Ads gate. Call inside the write transaction AFTER channel writes.
 * All channel ingress normalizes before encrypted persistence. Presence never needs sensitive.read. */
export async function requireLeadContact(db: pg.PoolClient, ctx: Context, contact: string) {
 await db.query("SELECT id FROM crm.contact WHERE tenant_id=$1 AND id=$2 FOR UPDATE",[ctx.tenant,contact]);
 const {rows:[r]}=await db.query("SELECT crm.contact_has_channel($1) allowed",[contact]);
 if (!r.allowed) throw new Fault(422,"CONTACT_REQUIRED",[{field:"contact_channels",code:"CONTACT_REQUIRED"}]);
}

export function contactRequiredMessage(language: string = "en") {
 return /^ar(?:-|,|;|$)/i.test(language) ? "أدخل رقم هاتف صالحًا أو بريدًا إلكترونيًا صالحًا على الأقل." : "Provide at least one valid phone number or email address.";
}
