// P1b B2 UI model: pure helpers for the Properties settings page (types of the schema API, validation that mirrors
// src/schemarules.ts, body builders, ordering, grouping). No React, no fetch: unit-tested in model.test.ts.
import { type FieldIssue, isApiError } from "../../api/errors.ts";
import type { MessageKey } from "../../ui/i18n/index.ts";

export const OBJECTS = ["contact", "lead", "deal", "task"] as const;
export type ObjectKey = (typeof OBJECTS)[number];

// Contract (P1B_CONTRACTS B2): key and option value patterns, label limits. The server stays the authority.
export const KEY_RE = /^[a-z][a-z0-9_]{0,62}$/;
export const OPTION_VALUE_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/;
export const LABEL_MAX = { property: 120, group: 80, option: 80 } as const;
export const OPTIONS_MAX = 200;
export const MAX_LENGTH_LIMITS = { text: 2000, long_text: 20000 } as const;

export type Lang = { en?: string; ar?: string };
export type PropType =
	| "text"
	| "long_text"
	| "number"
	| "currency"
	| "date"
	| "datetime"
	| "single_select"
	| "multi_select"
	| "checkbox"
	| "user";
export type OptionColor = "gray" | "blue" | "teal" | "green" | "amber" | "orange" | "red" | "purple";

export type PropertyOption = {
	value: string;
	label: Lang;
	color: string | null;
	position: number;
	archived: boolean;
};
export type PropertyDef = {
	key: string;
	label: Lang;
	type: PropType;
	display: string;
	group: string;
	position: number;
	is_system: boolean;
	required: boolean;
	read_only: boolean;
	sensitive: boolean;
	searchable: boolean;
	show_default: boolean;
	validation: Record<string, number>;
	currency: string | null;
	version: number;
	archived: boolean;
	option_count: number;
	options: PropertyOption[];
};
export type SchemaGroup = { key: string; label: Lang; position: number; version: number; archived: boolean };
export type TypeSpec = { type: PropType; displays: string[]; validation: string[]; options: boolean };
export type ObjectSchema = {
	object: ObjectKey;
	schema_rev: number;
	limits: { properties: number; options: number; groups: number };
	types: TypeSpec[];
	option_colors: OptionColor[];
	groups: SchemaGroup[];
	properties: PropertyDef[];
};

/** Label for the UI language, falling back to the other language, then to the key. */
export function pickLabel(label: Lang | undefined, locale: "en" | "ar", fallback = ""): string {
	const other = locale === "ar" ? "en" : "ar";
	return label?.[locale]?.trim() || label?.[other]?.trim() || fallback;
}

// ---- keys ---------------------------------------------------------------------------------------------

/** Key suggestion from an English label: lowercase, [a-z0-9_], starts with a letter, <= 63 chars. Empty when no Latin letter or digit is available. */
export function deriveKey(labelEn: string): string {
	const base = labelEn
		.normalize("NFKD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "");
	if (!base) return "";
	const lead = /^[a-z]/.test(base) ? base : `p_${base}`;
	return lead.slice(0, 63).replace(/_+$/, "");
}

/** Stable option value from its label (EN preferred); unique among `taken`. */
export function deriveOptionValue(labelEn: string, taken: ReadonlySet<string>, index: number): string {
	const slug = labelEn
		.normalize("NFKD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "")
		.slice(0, 56);
	const base = slug || `option_${index + 1}`;
	let v = base;
	for (let n = 2; taken.has(v); n++) v = `${base}_${n}`;
	return v;
}

// ---- draft ----------------------------------------------------------------------------------------------

export type OptionDraft = { id: string; en: string; ar: string; color: string };
export type PropertyDraft = {
	type: PropType;
	labelEn: string;
	labelAr: string;
	key: string;
	keyTouched: boolean;
	group: string;
	display: string;
	required: boolean;
	read_only: boolean;
	sensitive: boolean;
	searchable: boolean;
	show_default: boolean;
	currency: string;
	maxLength: string;
	min: string;
	max: string;
	maxSelected: string;
	options: OptionDraft[];
};

export const EMPTY_DRAFT: PropertyDraft = {
	type: "text",
	labelEn: "",
	labelAr: "",
	key: "",
	keyTouched: false,
	group: "general",
	display: "default",
	required: false,
	read_only: false,
	sensitive: false,
	searchable: false,
	show_default: true,
	currency: "",
	maxLength: "",
	min: "",
	max: "",
	maxSelected: "",
	options: [],
};

export const isSelectType = (t: PropType): boolean => t === "single_select" || t === "multi_select";
export const isSearchableType = (t: PropType): boolean => t === "text" || t === "long_text";

export function draftOf(p: PropertyDef): PropertyDraft {
	const v = p.validation;
	return {
		type: p.type,
		labelEn: p.label.en ?? "",
		labelAr: p.label.ar ?? "",
		key: p.key,
		keyTouched: true,
		group: p.group,
		display: p.display,
		required: p.required,
		read_only: p.read_only,
		sensitive: p.sensitive,
		searchable: p.searchable,
		show_default: p.show_default,
		currency: p.currency ?? "",
		maxLength: v.max_length === undefined ? "" : String(v.max_length),
		min: v.min === undefined ? "" : String(v.min),
		max: v.max === undefined ? "" : String(v.max),
		maxSelected: v.max_selected === undefined ? "" : String(v.max_selected),
		options: [],
	};
}

/** Draft after the type changed: keep what still applies, clear what the new type does not allow. */
export function withType(d: PropertyDraft, type: PropType): PropertyDraft {
	return {
		...d,
		type,
		display: "default",
		searchable: isSearchableType(type) ? d.searchable : false,
		currency: type === "currency" ? d.currency : "",
		maxLength: type === "text" || type === "long_text" ? d.maxLength : "",
		min: type === "number" || type === "currency" ? d.min : "",
		max: type === "number" || type === "currency" ? d.max : "",
		maxSelected: type === "multi_select" ? d.maxSelected : "",
		options: isSelectType(type) ? d.options : [],
	};
}

/** Typing the English label updates the key until the user edits the key by hand. */
export function withLabelEn(d: PropertyDraft, labelEn: string, creating: boolean): PropertyDraft {
	return { ...d, labelEn, key: creating && !d.keyTouched ? deriveKey(labelEn) : d.key };
}

// ---- validation (mirrors schemarules.ts; the server stays the authority) ------------------------------------------

export type DraftIssue =
	| "labelRequired"
	| "labelTooLong"
	| "keyInvalid"
	| "currencyRequired"
	| "currencyInvalid"
	| "range"
	| "notInteger"
	| "requiredReadOnly"
	| "sensitiveSearchable"
	| "optionLabelRequired"
	| "optionLabelTooLong"
	| "tooManyOptions";
export type DraftErrors = {
	label?: DraftIssue;
	key?: DraftIssue;
	currency?: DraftIssue;
	maxLength?: DraftIssue;
	min?: DraftIssue;
	max?: DraftIssue;
	maxSelected?: DraftIssue;
	flags?: DraftIssue;
	options?: DraftIssue;
	/** option draft id -> issue */
	option: Record<string, DraftIssue>;
};

const codePoints = (s: string): number => [...s].length;
const isInt = (s: string): boolean => /^-?\d+$/.test(s.trim());

/** Live validation of the draft. `creating` adds the key rule; `system` skips everything that is not editable on a system property. */
export function validateDraft(d: PropertyDraft, creating: boolean, system = false): DraftErrors {
	const e: DraftErrors = { option: {} };
	const en = d.labelEn.trim();
	const ar = d.labelAr.trim();
	if (!en && !ar) e.label = "labelRequired";
	else if (codePoints(en) > LABEL_MAX.property || codePoints(ar) > LABEL_MAX.property) e.label = "labelTooLong";
	if (creating && !KEY_RE.test(d.key)) e.key = "keyInvalid";
	if (system) return e;
	if (d.type === "currency") {
		if (!d.currency.trim()) e.currency = "currencyRequired";
		else if (!/^[A-Z]{3}$/.test(d.currency.trim())) e.currency = "currencyInvalid";
	}
	if (d.maxLength.trim() !== "") {
		const cap = d.type === "long_text" ? MAX_LENGTH_LIMITS.long_text : MAX_LENGTH_LIMITS.text;
		const n = Number(d.maxLength);
		if (!isInt(d.maxLength) || n < 1 || n > cap) e.maxLength = "range";
	}
	for (const [f, raw] of [["min", d.min], ["max", d.max]] as const) {
		if (raw.trim() === "") continue;
		if (d.type === "currency" && !isInt(raw)) e[f] = "notInteger";
		else if (!Number.isFinite(Number(raw))) e[f] = "range";
	}
	if (!e.min && !e.max && d.min.trim() !== "" && d.max.trim() !== "" && Number(d.min) > Number(d.max)) e.max = "range";
	if (d.maxSelected.trim() !== "") {
		const n = Number(d.maxSelected);
		if (!isInt(d.maxSelected) || n < 1 || n > 50) e.maxSelected = "range";
	}
	if (d.required && d.read_only) e.flags = "requiredReadOnly";
	else if (d.sensitive && d.searchable) e.flags = "sensitiveSearchable";
	if (creating && isSelectType(d.type)) {
		if (d.options.length > OPTIONS_MAX) e.options = "tooManyOptions";
		for (const o of d.options) {
			const oen = o.en.trim();
			const oar = o.ar.trim();
			if (!oen && !oar) e.option[o.id] = "optionLabelRequired";
			else if (codePoints(oen) > LABEL_MAX.option || codePoints(oar) > LABEL_MAX.option) e.option[o.id] = "optionLabelTooLong";
		}
	}
	return e;
}

export function hasDraftErrors(e: DraftErrors): boolean {
	const { option, ...rest } = e;
	return Object.values(rest).some(Boolean) || Object.keys(option).length > 0;
}

// ---- bodies -----------------------------------------------------------------------------------------------

const langOf = (en: string, ar: string): Lang => {
	const out: Lang = {};
	if (en.trim()) out.en = en.trim();
	if (ar.trim()) out.ar = ar.trim();
	return out;
};

/** Option values for a draft list: derived once from the labels, unique within the list. */
export function optionValues(options: readonly OptionDraft[]): string[] {
	const taken = new Set<string>();
	return options.map((o, i) => {
		const v = deriveOptionValue(o.en, taken, i);
		taken.add(v);
		return v;
	});
}

function validationOf(d: PropertyDraft): Record<string, number> {
	const v: Record<string, number> = {};
	if ((d.type === "text" || d.type === "long_text") && d.maxLength.trim() !== "") v.max_length = Number(d.maxLength);
	if ((d.type === "number" || d.type === "currency") && d.min.trim() !== "") v.min = Number(d.min);
	if ((d.type === "number" || d.type === "currency") && d.max.trim() !== "") v.max = Number(d.max);
	if (d.type === "multi_select" && d.maxSelected.trim() !== "") v.max_selected = Number(d.maxSelected);
	return v;
}

export function buildCreateBody(d: PropertyDraft, commandId: string): Record<string, unknown> {
	const body: Record<string, unknown> = {
		command_id: commandId,
		key: d.key,
		type: d.type,
		label: langOf(d.labelEn, d.labelAr),
		group: d.group,
		display: d.display,
		required: d.required,
		read_only: d.read_only,
		sensitive: d.sensitive,
		searchable: d.searchable,
		show_default: d.show_default,
		validation: validationOf(d),
	};
	if (d.type === "currency") body.currency = d.currency.trim();
	if (isSelectType(d.type)) {
		const values = optionValues(d.options);
		body.options = d.options.map((o, i) => ({
			value: values[i],
			label: langOf(o.en, o.ar),
			color: o.color || null,
			position: (i + 1) * 10,
		}));
	}
	return body;
}

const sameJson = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

/** PATCH body with only the changed, writable fields. null = nothing changed. System properties: label and group only. */
export function buildPatchBody(p: PropertyDef, d: PropertyDraft, commandId: string): Record<string, unknown> | null {
	const body: Record<string, unknown> = {};
	const label = langOf(d.labelEn, d.labelAr);
	if (!sameJson(label, langOf(p.label.en ?? "", p.label.ar ?? ""))) body.label = label;
	if (d.group !== p.group) body.group = d.group;
	if (!p.is_system) {
		if (d.display !== p.display) body.display = d.display;
		for (const f of ["required", "read_only", "sensitive", "searchable", "show_default"] as const)
			if (d[f] !== p[f]) body[f] = d[f];
		const v = validationOf(d);
		if (!sameJson(Object.entries(v).sort(), Object.entries(p.validation).sort())) body.validation = v;
	}
	if (Object.keys(body).length === 0) return null;
	return { command_id: commandId, expected_version: p.version, ...body };
}

// ---- idempotency: one command_id per distinct payload ---------------------------------------------------------

export type CommandMemo = { fingerprint: string; commandId: string };

/** A retry of the same payload (after a network error / timeout) reuses its command_id; a changed payload gets a new one. */
export function commandFor(prev: CommandMemo | null, payload: Record<string, unknown>, newId: () => string): CommandMemo {
	const { command_id: _ignored, ...rest } = payload;
	const fingerprint = JSON.stringify(rest);
	return prev !== null && prev.fingerprint === fingerprint ? prev : { fingerprint, commandId: newId() };
}

// ---- server errors --------------------------------------------------------------------------------------------

export type WriteErrorKind = "validation" | "conflict" | "exists" | "forbidden" | "network" | "limit" | "notEmpty" | "system" | "other";

export function classifyWriteError(e: unknown): WriteErrorKind {
	if (!isApiError(e)) return "other";
	if (e.kind === "version_conflict") return "conflict";
	if (e.kind === "forbidden") return "forbidden";
	if (e.kind === "network") return "network";
	if (e.code === "GROUP_NOT_EMPTY") return "notEmpty";
	if (e.code === "KEY_EXISTS" || e.code === "OPTION_EXISTS") return "exists";
	if (e.code === "PROPERTY_ARCHIVED" || e.code === "GROUP_ARCHIVED" || e.code === "IDEMPOTENCY_CONFLICT") return "conflict";
	if (e.code === "SYSTEM_PROPERTY_IMMUTABLE") return "system";
	if (e.code.endsWith("_LIMIT_EXCEEDED")) return "limit";
	if (e.status === 422) return "validation";
	return "other";
}

/** Form-level fields of the property dialog that a server issue can attach to. */
export type FormField =
	| "label"
	| "label.en"
	| "label.ar"
	| "key"
	| "type"
	| "group"
	| "display"
	| "currency"
	| "flags"
	| "maxLength"
	| "min"
	| "max"
	| "maxSelected"
	| "options"
	| "form";

/** Where a server `errors[].field` belongs in the form. Unknown fields land on the form-level banner, never silently dropped. */
export function formFieldOf(field: string): FormField {
	if (field === "label" || field === "label.en" || field === "label.ar") return field;
	if (field === "key" || field === "type" || field === "group" || field === "display" || field === "currency") return field;
	if (field === "required" || field === "read_only" || field === "sensitive" || field === "searchable") return "flags";
	if (field === "validation.max_length") return "maxLength";
	if (field === "validation.min") return "min";
	if (field === "validation.max" || field === "validation") return "max";
	if (field === "validation.max_selected") return "maxSelected";
	if (field === "options" || field.startsWith("options[")) return "options";
	return "form";
}

export type ServerFieldErrors = Partial<Record<FormField, string>> & { optionRows: Record<number, string> };

/** First server code per form field, plus per-option-row codes (`options[2].value`). */
export function serverFieldErrors(issues: readonly FieldIssue[]): ServerFieldErrors {
	const out: ServerFieldErrors = { optionRows: {} };
	for (const i of issues) {
		const m = /^options\[(\d+)\]/.exec(i.field);
		if (m) {
			const idx = Number(m[1]);
			if (out.optionRows[idx] === undefined) out.optionRows[idx] = i.code;
			continue;
		}
		const f = formFieldOf(i.field);
		if (out[f] === undefined) out[f] = i.code;
	}
	return out;
}

/** Message key of a server issue code (falls back to the generic validation message). */
export function issueMessageKey(code: string): MessageKey {
	return ISSUE_MESSAGES[code] ?? "props.err.generic";
}
const ISSUE_MESSAGES: Record<string, MessageKey> = {
	KEY_INVALID: "props.err.KEY_INVALID",
	KEY_RESERVED: "props.err.KEY_RESERVED",
	LABEL_REQUIRED: "props.err.LABEL_REQUIRED",
	LABEL_INVALID: "props.err.LABEL_INVALID",
	CURRENCY_REQUIRED: "props.err.CURRENCY_REQUIRED",
	CURRENCY_INVALID: "props.err.CURRENCY_INVALID",
	CURRENCY_NOT_ALLOWED: "props.err.CURRENCY_NOT_ALLOWED",
	DISPLAY_INVALID: "props.err.DISPLAY_INVALID",
	OPTIONS_INVALID: "props.err.OPTIONS_INVALID",
	OPTION_VALUE_INVALID: "props.err.OPTION_VALUE_INVALID",
	OPTION_DUPLICATE: "props.err.OPTION_DUPLICATE",
	OPTION_COLOR_INVALID: "props.err.OPTION_COLOR_INVALID",
	VALIDATION_INVALID: "props.err.VALIDATION_INVALID",
	VALIDATION_RANGE_INVALID: "props.err.VALIDATION_RANGE_INVALID",
	REQUIRED_READ_ONLY: "props.err.REQUIRED_READ_ONLY",
	SENSITIVE_NOT_SEARCHABLE: "props.err.SENSITIVE_NOT_SEARCHABLE",
	SEARCHABLE_TYPE_UNSUPPORTED: "props.err.SEARCHABLE_TYPE_UNSUPPORTED",
	GROUP_NOT_FOUND: "props.err.GROUP_NOT_FOUND",
	TYPE_INVALID: "props.err.TYPE_INVALID",
};

// ---- listing: group, search, order -----------------------------------------------------------------------------

export type PropertyGroupView = { group: SchemaGroup; properties: PropertyDef[] };

const byPosition = <T extends { position: number; key?: string }>(a: T, b: T): number =>
	a.position - b.position || (a.key ?? "").localeCompare(b.key ?? "");

export function matchesQuery(p: PropertyDef, q: string, locale: "en" | "ar"): boolean {
	const needle = q.trim().toLowerCase();
	if (!needle) return true;
	return [p.key, p.label.en ?? "", p.label.ar ?? "", pickLabel(p.label, locale)].some((s) => s.toLowerCase().includes(needle));
}

/** Properties grouped by group (group order, then property order); empty groups are dropped while searching. */
export function groupProperties(
	schema: ObjectSchema,
	opts: { query: string; showArchived: boolean; locale: "en" | "ar" },
): PropertyGroupView[] {
	const visible = schema.properties.filter(
		(p) => (opts.showArchived || !p.archived) && matchesQuery(p, opts.query, opts.locale),
	);
	const groups = [...schema.groups].filter((g) => opts.showArchived || !g.archived).sort(byPosition);
	const known = new Set(groups.map((g) => g.key));
	const out: PropertyGroupView[] = groups.map((group) => ({
		group,
		properties: visible.filter((p) => p.group === group.key).sort(byPosition),
	}));
	// a property whose group is not listed (should not happen) still shows up, under a synthetic group
	const orphans = visible.filter((p) => !known.has(p.group));
	if (orphans.length) out.push({ group: { key: orphans[0]?.group ?? "?", label: {}, position: 1e9, version: 0, archived: false }, properties: orphans });
	const searching = opts.query.trim() !== "";
	return out.filter((g) => g.properties.length > 0 || !searching);
}

/** Active property keys in their global order (what the order endpoint wants). */
export function activeKeys(schema: ObjectSchema): string[] {
	return schema.properties
		.filter((p) => !p.archived)
		.sort(byPosition)
		.map((p) => p.key);
}

/**
 * New global key order after moving `key` one step up/down among the active properties of ITS GROUP. Returns null at the edge.
 * The two neighbours swap slots in the global list, so other groups keep their place.
 */
export function moveProperty(schema: ObjectSchema, key: string, dir: -1 | 1): string[] | null {
	const all = schema.properties.filter((p) => !p.archived).sort(byPosition);
	const me = all.find((p) => p.key === key);
	if (!me) return null;
	const sameGroup = all.filter((p) => p.group === me.group);
	const at = sameGroup.findIndex((p) => p.key === key);
	const other = sameGroup[at + dir];
	if (!other) return null;
	const keys = all.map((p) => p.key);
	const i = keys.indexOf(me.key);
	const j = keys.indexOf(other.key);
	keys[i] = other.key;
	keys[j] = me.key;
	return keys;
}

/** Generic one-step move in a plain string list (groups, options). null at the edge. */
export function moveItem<T>(list: readonly T[], index: number, dir: -1 | 1): T[] | null {
	const j = index + dir;
	if (index < 0 || index >= list.length || j < 0 || j >= list.length) return null;
	const out = [...list];
	const a = out[index] as T;
	out[index] = out[j] as T;
	out[j] = a;
	return out;
}

export const activeGroups = (schema: ObjectSchema): SchemaGroup[] =>
	schema.groups.filter((g) => !g.archived).sort(byPosition);

export const activeOptions = (p: PropertyDef): PropertyOption[] =>
	p.options.filter((o) => !o.archived).sort(byPosition);

/** Group key from its English label (same shape as a property key). */
export const deriveGroupKey = deriveKey;

/** Swatch token per fixed option colour name (design tokens only; the NAME is always shown too, never colour alone). */
export const COLOR_VAR: Record<OptionColor, string> = {
	gray: "var(--sy-chart-8)",
	blue: "var(--sy-chart-5)",
	teal: "var(--sy-chart-4)",
	green: "var(--sy-success-icon)",
	amber: "var(--sy-warning-icon)",
	orange: "var(--sy-kpi-magenta-bg)",
	red: "var(--sy-danger-icon)",
	purple: "var(--sy-chart-3)",
};
