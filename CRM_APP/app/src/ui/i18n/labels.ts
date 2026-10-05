// Display labels for enum-like values. Raw enum / source / role values are never rendered: every value maps to an
// i18n key, and unknown values fall back to a neutral label (never the raw token).
import type { MessageKey } from "./en.ts";

export type Translate = (key: MessageKey) => string;

const SOURCE_KEY: Record<string, MessageKey> = {
	manual: "source.manual",
	referral: "source.referral",
	web: "source.web",
	website: "source.web",
	web_form: "source.web_form",
	import: "source.import",
	api: "source.api",
	phone: "source.phone",
	email: "source.email",
	whatsapp: "source.whatsapp",
	campaign: "source.campaign",
	event: "source.event",
	walk_in: "source.walk_in",
	social: "source.social",
	other: "source.other",
};

const ROLE_KEY: Record<string, MessageKey> = {
	manager: "role.manager",
	rep: "role.rep",
	reader: "role.reader",
	worker: "role.worker",
};

const norm = (v: string) => v.trim().toLowerCase().replace(/[\s-]+/g, "_");

export function sourceLabel(raw: string | null | undefined, t: Translate): string {
	if (!raw || raw.trim() === "") return t("source.unknown");
	return t(SOURCE_KEY[norm(raw)] ?? "source.other");
}

/**
 * Free-text "source evidence" note: a note that is exactly a known source token ("referral", "web_form") shows its
 * translated label; any other note is the user's own text and is shown as written. Empty = null (omit the row).
 */
export function sourceEvidenceLabel(raw: string | null | undefined, t: Translate): string | null {
	if (!raw || raw.trim() === "") return null;
	const key = SOURCE_KEY[norm(raw)];
	return key ? t(key) : raw.trim();
}

export function roleLabel(raw: string | null | undefined, t: Translate): string {
	return t((raw ? ROLE_KEY[norm(raw)] : undefined) ?? "role.unknown");
}

/** Owner / actor display: the display name when known, otherwise a neutral label (never an id). */
export function personLabel(name: string | null | undefined, t: Translate): string {
	return name && name.trim() !== "" ? name : t("common.unknownUser");
}
