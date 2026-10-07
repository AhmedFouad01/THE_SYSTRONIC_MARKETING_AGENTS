// ADR-002 P1b B2: the ONE place that validates registry writes (properties, groups, options). Pure: no database, no I/O.
// Rules that need the database (group exists, key unused, counts, version) live in schema.ts; DB CHECKs/triggers (010) back every rule here.
// Errors are collected, then thrown once as Fault(422,'VALIDATION_FAILED',[{field,code}]) so a form can mark every field in one round trip.
import { Fault } from "./db.js";

export type Issue = { field: string; code: string };
export type Lang = { en?: string; ar?: string };

export const KEY_RE = /^[a-z][a-z0-9_]{0,62}$/;
export const OPTION_VALUE_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/;
export const OBJECT_KEYS = ["contact", "lead", "deal", "task"] as const;
export const LIMITS = {
	properties: 100, // active custom properties per object (DB trigger enforces too)
	options: 200, // active options per property (DB trigger enforces too)
	groups: 50, // active groups per object (bounds the GET payload)
	position: 1_000_000,
	order: 400,
	label: { property: 120, group: 80, option: 80, description: 500 },
} as const;
export const TYPE_NAMES = [
	"text",
	"long_text",
	"number",
	"currency",
	"date",
	"datetime",
	"single_select",
	"multi_select",
	"checkbox",
	"user",
] as const;
export type PropType = (typeof TYPE_NAMES)[number];
// Display variants and the `validation` keys each type accepts (B3 consumes them; unknown keys are rejected, never stored).
export const TYPES: Record<
	PropType,
	{ displays: string[]; validation: string[]; options: boolean }
> = {
	text: { displays: ["default"], validation: ["max_length"], options: false },
	long_text: {
		displays: ["default"],
		validation: ["max_length"],
		options: false,
	},
	number: { displays: ["default"], validation: ["min", "max"], options: false },
	currency: {
		displays: ["default"],
		validation: ["min", "max"],
		options: false,
	},
	date: { displays: ["default"], validation: [], options: false },
	datetime: { displays: ["default"], validation: [], options: false },
	single_select: {
		displays: ["default", "dropdown", "radio"],
		validation: [],
		options: true,
	},
	multi_select: {
		displays: ["default", "checklist"],
		validation: ["max_selected"],
		options: true,
	},
	checkbox: { displays: ["default"], validation: [], options: false },
	user: { displays: ["default"], validation: [], options: false },
};
// Fixed token palette (the settings UI offers exactly these swatches; an option colour is optional).
export const OPTION_COLORS = [
	"gray",
	"blue",
	"teal",
	"green",
	"amber",
	"orange",
	"red",
	"purple",
] as const;
// Keys that would collide with record columns, the API envelope or JavaScript object internals.
export const RESERVED_KEYS = new Set([
	"id",
	"tenant_id",
	"version",
	"custom",
	"custom_search",
	"properties",
	"schema_rev",
	"constructor",
	"prototype",
	"contact_id",
	"lead_id",
	"deal_id",
	"task_id",
	"stage_id",
	"pipeline_id",
	"merged_into_id",
	"source_evidence",
	"identifiers",
	"hasownproperty",
	"tostring",
	"valueof",
	"tolocalestring",
	"isprototypeof",
	"propertyisenumerable",
]);
const CURRENCIES = new Set(Intl.supportedValuesOf("currency"));
// C0/C1 controls and the bidi override/embedding/isolate controls (trojan-source class). LRM/RLM/ALM stay legal.
// biome-ignore lint/suspicious/noControlCharactersInRegex: this IS the control-character guard.
export const BAD_TEXT = /[\u0000-\u001f\u007f-\u009f‪-‮⁦-⁩]/u;
export const BAD_TEXT_MULTILINE =
	// biome-ignore lint/suspicious/noControlCharactersInRegex: this IS the control-character guard.
	/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f‪-‮⁦-⁩]/u;

export const isObj = (v: unknown): v is Record<string, unknown> =>
	!!v && typeof v === "object" && !Array.isArray(v);
const own = (o: object, k: string) => Object.hasOwn(o, k);

export class Issues {
	list: Issue[] = [];
	add(field: string, code: string) {
		this.list.push({ field, code });
	}
	done() {
		if (this.list.length) throw new Fault(422, "VALIDATION_FAILED", this.list);
	}
}

// Rejects any field that is not in `allowed`. Known immutable names get their own issue code; the response code is the M1 one.
export function strictFields(
	b: Record<string, unknown>,
	allowed: readonly string[],
	immutable: readonly string[] = [],
) {
	const bad: Issue[] = [];
	for (const k of Object.keys(b))
		if (!allowed.includes(k))
			bad.push({
				field: k,
				code: immutable.includes(k) ? "IMMUTABLE" : "UNKNOWN",
			});
	if (bad.length) throw new Fault(422, "FIELD_NOT_WRITABLE", bad);
}

export function validateLabel(
	v: unknown,
	field: string,
	max: number,
	e: Issues,
	required = true,
): Lang | undefined {
	if (!isObj(v)) {
		e.add(field, "LABEL_REQUIRED");
		return undefined;
	}
	const out: Lang = {};
	let ok = true;
	for (const [lang, raw] of Object.entries(v)) {
		if (lang !== "en" && lang !== "ar") {
			e.add(field, "LABEL_LANG_UNSUPPORTED");
			ok = false;
			continue;
		}
		if (typeof raw !== "string") {
			e.add(`${field}.${lang}`, "LABEL_INVALID");
			ok = false;
			continue;
		}
		const s = raw.normalize("NFC").trim();
		if (!s) continue; // an empty language is simply absent
		if ([...s].length > max || BAD_TEXT.test(s)) {
			e.add(`${field}.${lang}`, "LABEL_INVALID");
			ok = false;
			continue;
		}
		out[lang] = s;
	}
	if (ok && required && !out.en && !out.ar) e.add(field, "LABEL_REQUIRED");
	return ok ? out : undefined;
}
function validateDescription(
	v: unknown,
	e: Issues,
): Lang | null | undefined {
	if (v === null) return null;
	if (!isObj(v)) {
		e.add("description", "DESCRIPTION_INVALID");
		return undefined;
	}
	const out: Lang = {};
	for (const [lang, raw] of Object.entries(v)) {
		if (lang !== "en" && lang !== "ar") {
			e.add("description", "LABEL_LANG_UNSUPPORTED");
			return undefined;
		}
		if (typeof raw !== "string") {
			e.add(`description.${lang}`, "DESCRIPTION_INVALID");
			return undefined;
		}
		const s = raw.normalize("NFC").trim();
		if (!s) continue;
		if (
			[...s].length > LIMITS.label.description ||
			BAD_TEXT_MULTILINE.test(s)
		) {
			e.add(`description.${lang}`, "DESCRIPTION_INVALID");
			return undefined;
		}
		out[lang] = s;
	}
	return out.en || out.ar ? out : null;
}
function validatePosition(v: unknown, field: string, e: Issues) {
	if (!Number.isInteger(v) || (v as number) < 0 || (v as number) > LIMITS.position) {
		e.add(field, "POSITION_INVALID");
		return undefined;
	}
	return v as number;
}
function validateKey(v: unknown, field: string, e: Issues, re = KEY_RE) {
	if (typeof v !== "string" || !re.test(v)) {
		e.add(field, "KEY_INVALID");
		return undefined;
	}
	return v;
}
function bool(v: unknown, field: string, e: Issues) {
	if (typeof v !== "boolean") {
		e.add(field, "BOOLEAN_REQUIRED");
		return undefined;
	}
	return v;
}
function finite(v: unknown): v is number {
	return typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= 1e15;
}
function validateRules(type: PropType, v: unknown, e: Issues) {
	if (!isObj(v)) {
		e.add("validation", "VALIDATION_INVALID");
		return undefined;
	}
	const allowed = TYPES[type].validation;
	const out: Record<string, number> = {};
	for (const [k, x] of Object.entries(v)) {
		if (!allowed.includes(k)) {
			e.add(`validation.${k}`, "VALIDATION_KEY_UNKNOWN");
			continue;
		}
		const intOnly = k === "max_length" || k === "max_selected" || type === "currency";
		if (!finite(x) || (intOnly && !Number.isInteger(x))) {
			e.add(`validation.${k}`, "VALIDATION_INVALID");
			continue;
		}
		if (k === "max_length" && (x < 1 || x > (type === "text" ? 2000 : 20000)))
			e.add(`validation.${k}`, "VALIDATION_INVALID");
		else if (k === "max_selected" && (x < 1 || x > 50))
			e.add(`validation.${k}`, "VALIDATION_INVALID");
		else out[k] = x;
	}
	if (own(out, "min") && own(out, "max") && out.min > out.max)
		e.add("validation", "VALIDATION_RANGE_INVALID");
	return out;
}

export type OptionInput = {
	value: string;
	label: Lang;
	color: string | null;
	position?: number;
};
export function validateOption(
	input: unknown,
	mode: "create" | "update",
	e: Issues,
	field = "option",
	system = false,
) {
	if (!isObj(input)) {
		e.add(field, "OPTION_INVALID");
		return {} as Partial<OptionInput> & { archived?: boolean };
	}
	const out: Partial<OptionInput> & { archived?: boolean } = {};
	if (mode === "create") {
		if (typeof input.value !== "string" || !OPTION_VALUE_RE.test(input.value))
			e.add(`${field}.value`, "OPTION_VALUE_INVALID");
		else out.value = input.value;
	}
	if (mode === "create" || own(input, "label"))
		out.label = validateLabel(input.label, `${field}.label`, LIMITS.label.option, e);
	if (own(input, "color")) {
		if (input.color === null) out.color = null;
		else if (
			typeof input.color !== "string" ||
			!(OPTION_COLORS as readonly string[]).includes(input.color)
		)
			e.add(`${field}.color`, "OPTION_COLOR_INVALID");
		else out.color = input.color;
	} else if (mode === "create") out.color = null;
	if (own(input, "position"))
		out.position = validatePosition(input.position, `${field}.position`, e);
	if (own(input, "archived")) {
		out.archived = bool(input.archived, `${field}.archived`, e);
		if (system && out.archived === true)
			e.add(`${field}.archived`, "SYSTEM_PROPERTY_IMMUTABLE");
	}
	return out;
}

const CREATE_FIELDS = [
	"command_id",
	"key",
	"type",
	"label",
	"description",
	"group",
	"position",
	"display",
	"required",
	"read_only",
	"sensitive",
	"searchable",
	"show_default",
	"validation",
	"currency",
	"options",
] as const;
const PATCH_FIELDS = [
	"command_id",
	"expected_version",
	"label",
	"description",
	"group",
	"position",
	"display",
	"required",
	"read_only",
	"sensitive",
	"searchable",
	"show_default",
	"validation",
] as const;
// Named so a client mistake gets IMMUTABLE instead of UNKNOWN. `indexed` is reserved for the admin-run index job (B6, decision 4).
const IMMUTABLE_FIELDS = [
	"key",
	"type",
	"currency",
	"storage",
	"column_name",
	"is_system",
	"object_type",
	"object",
	"options",
	"indexed",
	"archived_at",
	"id",
	"version",
] as const;
// System (standard-column) properties: label / group / position only (ADR-002 4.3).
const SYSTEM_EDITABLE = new Set(["label", "group", "position"]);
const FLAGS = [
	"required",
	"read_only",
	"sensitive",
	"searchable",
	"show_default",
] as const;

export type PropertyExisting = {
	type: PropType;
	is_system: boolean;
	required: boolean;
	read_only: boolean;
	sensitive: boolean;
	searchable: boolean;
	show_default: boolean;
	display: string;
};
export type PropertyWrite = {
	key?: string;
	type?: PropType;
	label?: Lang;
	description?: Lang | null;
	group?: string;
	position?: number;
	display?: string;
	required?: boolean;
	read_only?: boolean;
	sensitive?: boolean;
	searchable?: boolean;
	show_default?: boolean;
	validation?: Record<string, number>;
	currency?: string | null;
	options?: OptionInput[];
};

// create: `existing` undefined, every rule applies. update: pass `existing` for the full check (system limits, type-dependent rules,
// effective flag combinations); without it only the shape/value rules run (a cheap first pass before the row is locked).
export function validateProperty(
	input: Record<string, unknown>,
	mode: "create" | "update",
	existing?: PropertyExisting,
): PropertyWrite {
	strictFields(
		input,
		mode === "create" ? CREATE_FIELDS : PATCH_FIELDS,
		IMMUTABLE_FIELDS,
	);
	const e = new Issues();
	const w: PropertyWrite = {};
	const type: PropType | undefined =
		mode === "create"
			? (TYPE_NAMES as readonly string[]).includes(input.type as string)
				? (input.type as PropType)
				: undefined
			: existing?.type;
	if (mode === "create") {
		w.key = validateKey(input.key, "key", e);
		if (w.key && RESERVED_KEYS.has(w.key)) e.add("key", "KEY_RESERVED");
		if (!type) e.add("type", "TYPE_INVALID");
		else w.type = type;
	}
	if (mode === "create" || own(input, "label"))
		w.label = validateLabel(input.label, "label", LIMITS.label.property, e);
	if (own(input, "description"))
		w.description = validateDescription(input.description, e);
	if (own(input, "group")) w.group = validateKey(input.group, "group", e);
	if (own(input, "position"))
		w.position = validatePosition(input.position, "position", e);
	for (const f of FLAGS)
		if (own(input, f)) w[f] = bool(input[f], f, e);
	if (own(input, "display")) {
		if (typeof input.display !== "string") e.add("display", "DISPLAY_INVALID");
		else w.display = input.display;
	}
	if (own(input, "validation") && type) w.validation = validateRules(type, input.validation, e);
	else if (own(input, "validation") && !isObj(input.validation))
		e.add("validation", "VALIDATION_INVALID");

	if (type) {
		// display variant must exist for the type (a default is applied by the caller when omitted)
		const display = w.display ?? existing?.display ?? "default";
		if (
			(own(input, "display") || mode === "create") &&
			!TYPES[type].displays.includes(display)
		)
			e.add("display", "DISPLAY_INVALID");
		if (mode === "create") {
			if (type === "currency") {
				if (typeof input.currency !== "string" || !input.currency)
					e.add("currency", "CURRENCY_REQUIRED");
				else if (!/^[A-Z]{3}$/.test(input.currency) || !CURRENCIES.has(input.currency))
					e.add("currency", "CURRENCY_INVALID");
				else w.currency = input.currency;
			} else if (own(input, "currency") && input.currency !== null)
				e.add("currency", "CURRENCY_NOT_ALLOWED");
			else w.currency = null;
			if (own(input, "options")) {
				if (!TYPES[type].options) e.add("options", "OPTIONS_NOT_ALLOWED");
				else if (!Array.isArray(input.options) || input.options.length > LIMITS.options)
					e.add("options", "OPTIONS_INVALID");
				else {
					w.options = [];
					const seen = new Set<string>();
					input.options.forEach((raw, i) => {
						const o = validateOption(raw, "create", e, `options[${i}]`);
						if (o.value && seen.has(o.value))
							e.add(`options[${i}].value`, "OPTION_DUPLICATE");
						if (o.value) seen.add(o.value);
						if (o.value && o.label)
							w.options?.push({
								value: o.value,
								label: o.label,
								color: o.color ?? null,
								position: o.position ?? (i + 1) * 10,
							});
					});
				}
			}
		}
		if (own(input, "searchable") && w.searchable && type !== "text" && type !== "long_text")
			e.add("searchable", "SEARCHABLE_TYPE_UNSUPPORTED");
	}
	// effective flags: the written value, else what the row already has (update) / false (create)
	const eff = (f: (typeof FLAGS)[number]) => w[f] ?? existing?.[f] ?? false;
	if (mode === "create" || existing) {
		if (eff("required") && eff("read_only")) e.add("required", "REQUIRED_READ_ONLY");
		// `q` search reads custom_search; a sensitive value must never reach readers through it
		if (eff("sensitive") && eff("searchable"))
			e.add("searchable", "SENSITIVE_NOT_SEARCHABLE");
	}
	if (existing?.is_system) {
		// Dedicated top-level code: a client can tell "this row is a system property" from "your value is invalid".
		const bad = Object.keys(input).filter(
			(k) => k !== "command_id" && k !== "expected_version" && !SYSTEM_EDITABLE.has(k),
		);
		if (bad.length)
			throw new Fault(
				422,
				"SYSTEM_PROPERTY_IMMUTABLE",
				bad.map((field) => ({ field, code: "SYSTEM_PROPERTY_IMMUTABLE" })),
			);
	}
	e.done();
	return w;
}

export type GroupWrite = { key?: string; label?: Lang; position?: number };
export function validateGroup(
	input: Record<string, unknown>,
	mode: "create" | "update",
): GroupWrite {
	strictFields(
		input,
		mode === "create"
			? ["command_id", "key", "label", "position"]
			: ["command_id", "expected_version", "label", "position"],
		["key", "object", "object_type", "id", "version", "archived"],
	);
	const e = new Issues();
	const w: GroupWrite = {};
	if (mode === "create") w.key = validateKey(input.key, "key", e);
	if (mode === "create" || own(input, "label"))
		w.label = validateLabel(input.label, "label", LIMITS.label.group, e);
	if (own(input, "position"))
		w.position = validatePosition(input.position, "position", e);
	e.done();
	return w;
}
export function validateOptionWrite(
	input: Record<string, unknown>,
	mode: "create" | "update",
	system = false,
) {
	strictFields(
		input,
		mode === "create"
			? ["command_id", "expected_version", "value", "label", "color", "position"]
			: ["command_id", "expected_version", "label", "color", "position", "archived"],
		["value", "property", "property_id", "id"],
	);
	const e = new Issues();
	const o = validateOption(input, mode, e, "option", system);
	e.done();
	return o;
}
// `keys` = the complete ordered list of active keys/values; positions are assigned from it by the caller.
export function validateOrder(
	input: Record<string, unknown>,
	listField: "keys" | "values",
	guard: "expected_schema_rev" | "expected_version",
): { list: string[]; guard: number } {
	strictFields(input, ["command_id", listField, guard]);
	const e = new Issues();
	const raw = input[listField];
	const re = listField === "values" ? OPTION_VALUE_RE : KEY_RE;
	let list: string[] = [];
	if (
		!Array.isArray(raw) ||
		raw.length === 0 ||
		raw.length > LIMITS.order ||
		raw.some((x) => typeof x !== "string" || !re.test(x))
	)
		e.add(listField, "ORDER_INVALID");
	else if (new Set(raw).size !== raw.length) e.add(listField, "ORDER_DUPLICATE");
	else list = raw as string[];
	const g = expectedVersion(input, guard, e);
	e.done();
	return { list, guard: g as number };
}
export function expectedVersion(
	input: Record<string, unknown>,
	field: string,
	e?: Issues,
): number | undefined {
	const v = input[field];
	if (!Number.isSafeInteger(v) || (v as number) < 0) {
		if (e) e.add(field, "VERSION_REQUIRED");
		else throw new Fault(422, "VALIDATION_FAILED", [{ field, code: "VERSION_REQUIRED" }]);
		return undefined;
	}
	return v as number;
}
export const PAYLOAD_LIMIT = 65_536;
