import { normalizeEmail, normalizePhone, normalizeUrl } from "../../../../src/contactformat.ts";
// P1b B3 UI model: custom-field VALUES on records (pure: no React, no fetch; unit-tested in values.test.ts).
// Wire shapes (ADR-002 §4.4, P1B_CONTRACTS B3): a record carries `properties:{key:value}` (custom only, active and permitted
// only); writes send a PARTIAL map, `null` clears a key. Value per type: text/long_text string; number finite number;
// currency integer MINOR units (the property's ISO code decides the exponent); date `YYYY-MM-DD`; datetime ISO instant;
// single_select option value; multi_select option values[]; checkbox boolean; user principal id. The server stays the authority.
import type { FieldIssue } from "../../api/errors.ts";
import { currencyExponent } from "../../ui/i18n/format.ts";
import {
	groupProperties,
	type ObjectSchema,
	pickLabel,
	type PropertyDef,
	type PropertyGroupView,
	type PropertyOption,
} from "./model.ts";

export type Locale = "en" | "ar";
export type Values = Record<string, unknown>;
/** What an input holds: text/number/currency/date/select/user as a string, multi-select as values[], checkbox as boolean. */
export type Draft = string | boolean | string[];
export type Drafts = Record<string, Draft>;

export type IssueCode =
	| "REQUIRED"
	| "NOT_A_NUMBER"
	| "TOO_SMALL"
	| "TOO_LARGE"
	| "TOO_LONG"
	| "INVALID_VALUE"
	| "TOO_MANY"
	| "DATE_INVALID"
	| "DECIMALS"
	| "OPTION_INVALID";
/** `min`/`max`/`currency` are the numbers the message shows (currency bounds in MAJOR units). */
export type Issue = { code: IssueCode; min?: number; max?: number; currency?: string };

// ---- which properties a record form shows ---------------------------------------------------------------------------

const isCustom = (p: PropertyDef): boolean => !p.is_system && !p.archived;

/** Active custom properties grouped (group order, then property order). Standard fields are system properties and have their own inputs. */
export function customGroups(schema: ObjectSchema, locale: Locale): PropertyGroupView[] {
	return groupProperties(schema, { query: "", showArchived: false, locale })
		.map((g) => ({ group: g.group, properties: g.properties.filter(isCustom) }))
		.filter((g) => g.properties.length > 0);
}

/** Properties the create dialog asks for: required and writable (the rest is edited on the record afterwards). */
export const createGroups = (schema: ObjectSchema, locale: Locale): PropertyGroupView[] =>
	customGroups(schema, locale)
		.map((g) => ({ group: g.group, properties: g.properties.filter((p) => p.required && !p.read_only) }))
		.filter((g) => g.properties.length > 0);

export const flatten = (groups: readonly PropertyGroupView[]): PropertyDef[] => groups.flatMap((g) => g.properties);

/** Read view: a sensitive property that the server did not return a value for stays hidden (never an empty placeholder). */
export const visibleInRead = (p: PropertyDef, values: Values): boolean => !p.sensitive || Object.hasOwn(values, p.key);

// ---- number text ----------------------------------------------------------------------------------------------------

/** Arabic-Indic and Persian digits to Latin, Arabic decimal separator to ".", grouping separators and spaces dropped. */
export function normalizeDigits(s: string): string {
	return s
		.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
		.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
		.replace(/٫/g, ".")
		.replace(/[٬،,\s_]/g, "");
}

type Decimal = { neg: boolean; int: string; frac: string };
function splitDecimal(raw: string): Decimal | null {
	const s = normalizeDigits(raw.trim());
	const m = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(s);
	if (!m || s.length > 40) return null;
	const int = m[2] ?? "";
	const frac = m[3] ?? "";
	if (int === "" && frac === "") return null;
	return { neg: m[1] === "-", int: int === "" ? "0" : int, frac };
}

/** Finite number from user text (Arabic digits accepted); null when it is not a number. */
export function parseNumber(raw: string): number | null {
	const d = splitDecimal(raw);
	if (d === null) return null;
	const n = Number(`${d.neg ? "-" : ""}${d.int}.${d.frac === "" ? "0" : d.frac}`);
	return Number.isFinite(n) ? n : null;
}

export type MinorParse = { ok: true; minor: number } | { ok: false; code: "NOT_A_NUMBER" | "DECIMALS" };
/** Minor units from user text in MAJOR units, exactly (string arithmetic, no float rounding). More decimals than the currency has is an error unless they are zeros. */
export function parseMinor(raw: string, currency: string): MinorParse {
	const d = splitDecimal(raw);
	if (d === null) return { ok: false, code: "NOT_A_NUMBER" };
	const exp = currencyExponent(currency);
	const extra = d.frac.slice(exp);
	if (/[1-9]/.test(extra)) return { ok: false, code: "DECIMALS" };
	const minor = Number(`${d.int}${d.frac.slice(0, exp).padEnd(exp, "0")}`);
	if (!Number.isSafeInteger(minor)) return { ok: false, code: "NOT_A_NUMBER" };
	return { ok: true, minor: d.neg ? -minor : minor };
}

/** Input text of a minor-unit amount in major units ("1500.5"; no trailing zeros). */
export function minorToInput(minor: number, currency: string): string {
	const exp = currencyExponent(currency);
	const s = String(Math.abs(minor)).padStart(exp + 1, "0");
	const text = exp === 0 ? s : `${s.slice(0, -exp)}.${s.slice(-exp)}`;
	const trimmed = text.includes(".") ? text.replace(/0+$/, "").replace(/\.$/, "") : text;
	return minor < 0 ? `-${trimmed}` : trimmed;
}

// ---- dates ----------------------------------------------------------------------------------------------------------

const YMD = /^(\d{4})-(\d{2})-(\d{2})$/;
const LOCAL_DT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const pad = (n: number) => String(n).padStart(2, "0");

/** A real calendar day as a local Date (no timezone shift, unlike `new Date("YYYY-MM-DD")`); null when malformed. */
export function ymdToDate(s: string): Date | null {
	const m = YMD.exec(s);
	if (!m) return null;
	const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
	const dt = new Date(y, mo - 1, d);
	return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d ? dt : null;
}

/** Picker value `YYYY-MM-DDTHH:mm` (local) to an ISO instant; null when malformed. */
export function localInputToIso(s: string): string | null {
	const m = LOCAL_DT.exec(s.trim());
	if (!m) return null;
	const [y, mo, d, hh, mm] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5])];
	const dt = new Date(y, mo - 1, d, hh, mm);
	if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d || hh > 23 || mm > 59) return null;
	return dt.toISOString();
}

/** ISO instant to the picker's local `YYYY-MM-DDTHH:mm`; "" when not a date. */
export function isoToLocalInput(iso: string): string {
	const dt = new Date(iso);
	if (Number.isNaN(dt.getTime())) return "";
	return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

// ---- options --------------------------------------------------------------------------------------------------------

const byPos = (a: PropertyOption, b: PropertyOption) => a.position - b.position || a.value.localeCompare(b.value);
export const optionsOf = (p: PropertyDef): PropertyOption[] => [...p.options].sort(byPos);
const activeValues = (p: PropertyDef): Set<string> => new Set(p.options.filter((o) => !o.archived).map((o) => o.value));

/** Choices of a select input: the active options, plus the currently stored archived ones (so an unchanged value stays selectable and labelled). */
export function choicesFor(p: PropertyDef, current: Draft | undefined): PropertyOption[] {
	const keep = new Set(Array.isArray(current) ? current : typeof current === "string" && current !== "" ? [current] : []);
	return optionsOf(p).filter((o) => !o.archived || keep.has(o.value));
}

// ---- value <-> draft ------------------------------------------------------------------------------------------------

const asStrings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

/** Input text of a stored value. */
export function draftFromValue(p: PropertyDef, value: unknown): Draft {
	switch (p.type) {
		case "checkbox":
			return value === true;
		case "multi_select":
			return asStrings(value);
		case "number":
			return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
		case "currency":
			return typeof value === "number" && Number.isSafeInteger(value) ? minorToInput(value, p.currency ?? "EGP") : "";
		case "date":
			return typeof value === "string" ? value.slice(0, 10) : "";
		case "datetime":
			return typeof value === "string" ? isoToLocalInput(value) : "";
		default:
			return typeof value === "string" ? value : "";
	}
}

export const isEmptyDraft = (p: PropertyDef, d: Draft): boolean =>
	p.type === "checkbox" ? d === false : Array.isArray(d) ? d.length === 0 : typeof d !== "string" || d.trim() === "";

export function sameDraft(a: Draft, b: Draft): boolean {
	if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && [...a].sort().join("\u0000") === [...b].sort().join("\u0000");
	return a === b;
}

const codePoints = (s: string): number => [...s].length;

export type Parsed = { ok: true; value: unknown } | { ok: false; issue: Issue };
const bad = (code: IssueCode, extra: Omit<Issue, "code"> = {}): Parsed => ({ ok: false, issue: { code, ...extra } });

/**
 * Wire value of a draft: `ok:true` with `null` for an empty input (clears / omits), or the typed value; `ok:false` with the
 * first client-side issue (mirrors the registry's `validation`: max_length, min/max, max_selected). `original` lets an unchanged
 * archived option pass.
 */
export function parseDraft(p: PropertyDef, d: Draft, original?: unknown): Parsed {
	const v = p.validation;
	if (p.type === "checkbox") return { ok: true, value: d === true };
	if (p.type === "multi_select") {
		const picked = Array.isArray(d) ? d : [];
		if (picked.length === 0) return { ok: true, value: null };
		const ok = activeValues(p);
		const had = new Set(asStrings(original));
		if (picked.some((x) => !ok.has(x) && !had.has(x))) return bad("OPTION_INVALID");
		if (v.max_selected !== undefined && picked.length > v.max_selected) return bad("TOO_MANY", { max: v.max_selected });
		return { ok: true, value: picked };
	}
	const text = typeof d === "string" ? d : "";
	if (text.trim() === "") return { ok: true, value: null };
	switch (p.type) {
  case "email": case "phone": case "url": {
   const value=p.type === "email" ? normalizeEmail(text) : p.type === "phone" ? normalizePhone(text) : normalizeUrl(text);
   return value ? {ok:true,value} : bad("INVALID_VALUE");
  }
		case "number": {
			const n = parseNumber(text);
			if (n === null) return bad("NOT_A_NUMBER");
			if (v.min !== undefined && n < v.min) return bad("TOO_SMALL", { min: v.min });
			if (v.max !== undefined && n > v.max) return bad("TOO_LARGE", { max: v.max });
			return { ok: true, value: n };
		}
		case "currency": {
			const cur = p.currency ?? "EGP";
			const r = parseMinor(text, cur);
			if (!r.ok) return bad(r.code, { currency: cur });
			const exp = currencyExponent(cur);
			if (v.min !== undefined && r.minor < v.min) return bad("TOO_SMALL", { min: v.min / 10 ** exp, currency: cur });
			if (v.max !== undefined && r.minor > v.max) return bad("TOO_LARGE", { max: v.max / 10 ** exp, currency: cur });
			return { ok: true, value: r.minor };
		}
		case "date":
			return ymdToDate(text.trim()) === null ? bad("DATE_INVALID") : { ok: true, value: text.trim() };
		case "datetime": {
			const iso = localInputToIso(text);
			return iso === null ? bad("DATE_INVALID") : { ok: true, value: iso };
		}
		case "single_select": {
			const o = p.options.find((x) => x.value === text);
			return o === undefined || (o.archived && original !== text) ? bad("OPTION_INVALID") : { ok: true, value: text };
		}
		case "user":
			return { ok: true, value: text };
		default: {
			// text / long_text
			const trimmed = text.trim();
			if (v.max_length !== undefined && codePoints(trimmed) > v.max_length) return bad("TOO_LONG", { max: v.max_length });
			return { ok: true, value: trimmed };
		}
	}
}

// ---- patch / create body --------------------------------------------------------------------------------------------

export type PropertiesBuild = { patch: Values; issues: Record<string, Issue> };

/**
 * The partial `properties` map to send. `edit`: only keys whose draft differs from the stored value (an unchanged draft is never
 * re-validated: old rows may predate a rule); clearing a required key is refused here. `create`: required keys must be filled,
 * optional empty keys are left out. read_only properties are never sent.
 */
export function buildProperties(
	defs: readonly PropertyDef[],
	original: Values,
	drafts: Drafts,
	mode: "edit" | "create",
): PropertiesBuild {
	const patch: Values = {};
	const issues: Record<string, Issue> = {};
	for (const p of defs) {
		if (p.read_only || p.is_system) continue;
		const base = mode === "edit" ? draftFromValue(p, original[p.key]) : draftFromValue(p, undefined);
		const d = drafts[p.key] ?? base;
		if (mode === "edit" && sameDraft(d, base)) continue;
		const r = parseDraft(p, d, original[p.key]);
		if (!r.ok) {
			issues[p.key] = r.issue;
			continue;
		}
		if (p.type === "checkbox") {
			if (mode === "edit" || r.value === true || p.required) patch[p.key] = r.value;
			continue;
		}
		if (r.value === null) {
			if (p.required) issues[p.key] = { code: "REQUIRED" };
			else if (mode === "edit") patch[p.key] = null;
			continue;
		}
		patch[p.key] = r.value;
	}
	return { patch, issues };
}

/** Adds `properties` to a record PATCH body; a custom-only change still needs the command and version (base). Null when there is nothing to send. */
export function withProperties(
	body: Record<string, unknown> | null,
	patch: Values,
	base: { commandId: string; version: number },
): Record<string, unknown> | null {
	if (Object.keys(patch).length === 0) return body;
	return { ...(body ?? { command_id: base.commandId, expected_version: base.version }), properties: patch };
}

// ---- server errors (422 VALIDATION_FAILED, errors[{field:"properties.<key>", code}]) ------------------------------------

const PROP_FIELD = /^properties(?:\.|\[["']?)([^\]"']+)/;

/** First server code per property key, and the issues that point elsewhere (those stay with the record form). */
export function serverPropertyIssues(issues: readonly FieldIssue[]): { byKey: Record<string, string>; other: FieldIssue[] } {
	const byKey: Record<string, string> = {};
	const other: FieldIssue[] = [];
	for (const i of issues) {
		const m = PROP_FIELD.exec(i.field);
		const key = m?.[1];
		if (key === undefined) other.push(i);
		else if (byKey[key] === undefined) byKey[key] = i.code;
	}
	return { byKey, other };
}

/** Message key suffix of a server issue code (`cf.err.<suffix>`); unknown codes fall back to the generic message. */
export function serverIssueSuffix(code: string): "REQUIRED" | "TYPE" | "RANGE" | "LENGTH" | "OPTION_INVALID" | "READONLY" | "generic" {
	const c = code.toUpperCase();
	if (c === "MAX_LENGTH") return "LENGTH";
	if (c === "MIN_VALUE" || c === "MAX_VALUE" || c === "MAX_SELECTED") return "RANGE";
	if (c === "INVALID_TYPE" || c === "INVALID_VALUE") return "TYPE";
	if (c === "OPTION_UNKNOWN" || c === "OPTION_ARCHIVED") return "OPTION_INVALID";
	if (c === "REQUIRED" || c === "VALUE_REQUIRED") return "REQUIRED";
	if (c === "READ_ONLY" || c === "FIELD_NOT_WRITABLE" || c === "NOT_WRITABLE") return "READONLY";
	if (/OPTION|ARCHIVED/.test(c)) return "OPTION_INVALID";
	if (/TOO_LONG|LENGTH/.test(c)) return "LENGTH";
	if (/RANGE|TOO_SMALL|TOO_LARGE|MIN|MAX|TOO_MANY/.test(c)) return "RANGE";
	if (/TYPE|NUMBER|INTEGER|DATE|BOOLEAN|INVALID/.test(c)) return "TYPE";
	return "generic";
}

// ---- read view ------------------------------------------------------------------------------------------------------

export type Chip = { value: string; label: string; color: string | null; archived: boolean };
export type ReadValue =
	| { kind: "empty" }
	| { kind: "plain"; text: string }
	| { kind: "multiline"; text: string }
	| { kind: "num"; text: string }
	| { kind: "money"; text: string }
	| { kind: "link"; text: string; href: string }
	| { kind: "chips"; chips: Chip[] };

export type ReadCtx = {
	locale: Locale;
	number: (n: number) => string;
	moneyMinor: (minor: number, currency: string) => string;
	date: (d: Date) => string;
	dateTime: (iso: string) => string;
	yes: string;
	no: string;
	userName: (id: string) => string;
};

const URL_RE = /^https?:\/\/[^\s<>"]+$/i;
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;
const PHONE_RE = /^\+?[\d\s().-]{7,25}$/;

/** A text value that is, as a whole, a web address / email / phone becomes a link (the registry has no url/email/phone type yet; `text` covers them). */
export function linkOf(text: string, type: string): { href: string } | null {
	const s = text.trim();
	if (type === "long_text") return null;
	if (URL_RE.test(s)) return { href: s };
	if (EMAIL_RE.test(s)) return { href: `mailto:${s}` };
	if (PHONE_RE.test(s) && (s.match(/\d/g) ?? []).length >= 7) return { href: `tel:${s.replace(/[^\d+]/g, "")}` };
	return null;
}

export function readValue(p: PropertyDef, raw: unknown, ctx: ReadCtx): ReadValue {
	if (raw === null || raw === undefined || raw === "" || (Array.isArray(raw) && raw.length === 0)) return { kind: "empty" };
	switch (p.type) {
		case "checkbox":
			return { kind: "plain", text: raw === true ? ctx.yes : ctx.no };
		case "number":
			return typeof raw === "number" ? { kind: "num", text: ctx.number(raw) } : { kind: "plain", text: String(raw) };
		case "currency":
			return typeof raw === "number" ? { kind: "money", text: ctx.moneyMinor(raw, p.currency ?? "EGP") } : { kind: "plain", text: String(raw) };
		case "date": {
			const d = typeof raw === "string" ? ymdToDate(raw.slice(0, 10)) : null;
			return d === null ? { kind: "plain", text: String(raw) } : { kind: "num", text: ctx.date(d) };
		}
		case "datetime":
			return typeof raw === "string" && !Number.isNaN(new Date(raw).getTime())
				? { kind: "num", text: ctx.dateTime(raw) }
				: { kind: "plain", text: String(raw) };
		case "single_select":
		case "multi_select": {
			const values = p.type === "single_select" ? (typeof raw === "string" ? [raw] : []) : asStrings(raw);
			const chips = values.map((value): Chip => {
				const o = p.options.find((x) => x.value === value);
				return o
					? { value, label: pickLabel(o.label, ctx.locale, o.value), color: o.color, archived: o.archived }
					: { value, label: value, color: null, archived: true };
			});
			return chips.length === 0 ? { kind: "empty" } : { kind: "chips", chips };
		}
		case "user":
			return typeof raw === "string" ? { kind: "plain", text: ctx.userName(raw) } : { kind: "plain", text: String(raw) };
		default: {
			const text = String(raw);
			if (p.type === "long_text") return { kind: "multiline", text };
			const link = linkOf(text, p.type);
			return link ? { kind: "link", text, href: link.href } : { kind: "plain", text };
		}
	}
}

/** Create body with the (required) custom values; nothing is added when there are none. */
export function withCreateProperties(body: Record<string, unknown>, patch: Values): Record<string, unknown> {
	return Object.keys(patch).length === 0 ? body : { ...body, properties: patch };
}
