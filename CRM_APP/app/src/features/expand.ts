// Related names that the list API embeds (`expand=contact,owner`, P1A_CONTRACTS S4). Pure helpers, no DOM.

/** `restricted:true` = the caller's scope cannot read that contact (no name is ever sent). */
export type ContactExpand = { id: string; display_name: string } | { id: string; restricted: true };
/** `name:null` = the owner id could not be resolved. */
export type OwnerExpand = { id: string; name: string | null };
export type Expanded = {
	contact?: ContactExpand | null;
	owner?: OwnerExpand | null;
};

export const contactNameOf = (r: Expanded): string | null =>
	r.contact && "display_name" in r.contact ? r.contact.display_name : null;

export const ownerNameOf = (r: Expanded): string | null => r.owner?.name ?? null;

/**
 * A confirmed write (PATCH/POST result) has no `expand` keys. Keep the embedded contact of the row it replaces when the
 * contact is unchanged, and the owner only while the owner is unchanged (a changed owner is named from the assignees).
 */
export function carryExpand<T extends Expanded & { owner_id: string | null; contact_id?: string | null }>(
	next: T,
	prev: T,
): T {
	const out: T = { ...next };
	if (out.contact === undefined && prev.contact !== undefined && prev.contact_id === next.contact_id)
		out.contact = prev.contact;
	if (out.owner === undefined && prev.owner !== undefined && prev.owner_id === next.owner_id) out.owner = prev.owner;
	return out;
}
