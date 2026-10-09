// Import, server half: the MAPPING CONTRACT and per-row normalisation. Pure (no I/O): the same functions serve preview and commit,
// so a preview row and the job row can never disagree. Custom property values go through the ONE validator (properties.ts
// `validateProperties`); this file only turns a spreadsheet cell into the JSON value that validator expects.
import { normalizeEmail, normalizePhone } from "./contactformat.js";
import { Fault } from "./db.js";
import type { Cell } from "./importfile.js";
import {
	type Actor,
	type Def,
	type Registry,
	type Row,
	validateProperties,
} from "./properties.js";
import { BAD_TEXT, KEY_RE } from "./schemarules.js";

export type ImportObject = "contact" | "lead";
export type MappingColumn = { column: number; target: string };
export type Issue = { field: string; code: string };
export type DuplicateMode = "skip" | "update" | "create";
export type ImportOptions = {
	duplicate_mode: DuplicateMode;
	error_policy: "skip" | "abort";
	owner_id: string | null;
	default_country_code: string | null;
	sheet: number | string | null;
};

// Fixed (non-custom) targets per object. `property:<key>` is added dynamically from the tenant's registry.
export const FIXED_TARGETS: Record<
	ImportObject,
	{ target: string; required: boolean; label: string }[]
> = {
	contact: [
		{ target: "display_name", required: true, label: "Display name" },
		{ target: "email", required: false, label: "Email" },
		{ target: "phone", required: false, label: "Phone" },
	],
	lead: [
		{ target: "title", required: true, label: "Lead title" },
		{ target: "contact_name", required: false, label: "Contact name" },
		{ target: "email", required: false, label: "Contact email" },
		{ target: "phone", required: false, label: "Contact phone" },
		{ target: "source_evidence", required: false, label: "Source evidence" },
	],
};
export const MAX_MAPPING_COLUMNS = 100;
const NAME_MAX = 160;
const EVIDENCE_MAX = 500;

// ---- cell helpers ------------------------------------------------------------------------------------------------------------
const ARABIC_INDIC = /[٠-٩۰-۹]/g;
export const foldDigits = (s: string) =>
	s.replace(ARABIC_INDIC, (c) =>
		String(
			c.charCodeAt(0) >= 0x06f0
				? c.charCodeAt(0) - 0x06f0
				: c.charCodeAt(0) - 0x0660,
		),
	);
const LONE_SURROGATE = /[\ud800-\udfff]/u;
function cellText(c: Cell): string | undefined {
	if (c === null) return undefined;
	let s: string;
	if (typeof c === "string") s = c;
	else if (typeof c === "number")
		s = Number.isInteger(c) ? c.toFixed(0) : String(c);
	else if (typeof c === "boolean") s = c ? "true" : "false";
	else s = c.toISOString();
	s = s.normalize("NFC").trim();
	return s === "" ? undefined : s;
}
// A cell that a spreadsheet application would run as a formula. It is STORED AS TEXT, never evaluated; flagged only as a warning.
export function formulaLike(c: Cell): boolean {
	if (typeof c !== "string") return false;
	const t = c.trimStart();
	if (!/^[=+\-@]/.test(t)) return false;
	return !/^[+-]?[\d٠-٩۰-۹][\d٠-٩۰-۹.,\s()-]*$/.test(t.trim());
}

export { normalizeEmail, normalizePhone } from "./contactformat.js";
function parseNumber(c: Cell): number | null {
	if (typeof c === "number") return Number.isFinite(c) ? c : null;
	const t = cellText(c);
	if (t === undefined) return null;
	const s = foldDigits(t)
		.replace(/٫/g, ".")
		.replace(/[٬,\s]/g, "");
	return /^[+-]?\d+(\.\d+)?$/.test(s) ? Number(s) : null;
}
const TRUE = new Set(["true", "yes", "y", "1", "نعم"]);
const FALSE = new Set(["false", "no", "n", "0", "لا"]);

/** One cell -> the JSON value `validateProperties` expects for this definition (undefined = blank cell = leave the property alone). */
export function coerceCell(d: Def, c: Cell): unknown {
	const t = cellText(c);
	if (t === undefined) return undefined;
	switch (d.type) {
		case "email":
		case "phone":
		case "url":
		case "text":
		case "long_text":
			// Raw text, newlines kept for long_text; the validator trims, NFC-normalises and length-checks.
			return typeof c === "string" ? c : t;
		case "number":
		case "currency": {
			const n = parseNumber(c);
			return n === null ? t : n; // unparsable stays a string so the validator reports INVALID_TYPE
		}
		case "checkbox": {
			if (typeof c === "boolean") return c;
			const k = t.toLowerCase();
			return TRUE.has(k) ? true : FALSE.has(k) ? false : t;
		}
		case "date":
			return c instanceof Date ? c.toISOString().slice(0, 10) : foldDigits(t);
		case "datetime":
			return c instanceof Date ? c.toISOString() : foldDigits(t);
		case "multi_select":
			return t
				.split(/[;|]/)
				.map((x) => x.trim())
				.filter(Boolean);
		default:
			return t; // single_select, user
	}
}

// ---- mapping validation ------------------------------------------------------------------------------------------------------
/** `props` = the properties this caller may map (active, writable, sensitive only when readable+writable), by key. */
export function validateMapping(
	object: ImportObject,
	raw: unknown,
	width: number,
	props: ReadonlyMap<string, Def>,
): MappingColumn[] {
	const issues: Issue[] = [];
	const cols: MappingColumn[] = [];
	if (!Array.isArray(raw))
		throw new Fault(422, "VALIDATION_FAILED", [
			{ field: "mapping.columns", code: "INVALID_TYPE" },
		]);
	if (raw.length === 0 || raw.length > MAX_MAPPING_COLUMNS)
		throw new Fault(422, "VALIDATION_FAILED", [
			{
				field: "mapping.columns",
				code: raw.length ? "TOO_MANY_COLUMNS" : "REQUIRED",
			},
		]);
	const fixed = new Set(FIXED_TARGETS[object].map((t) => t.target));
	const seen = new Set<string>();
	raw.forEach((m, i) => {
		const f = `mapping.columns[${i}]`;
		if (!m || typeof m !== "object" || Array.isArray(m)) {
			issues.push({ field: f, code: "INVALID_TYPE" });
			return;
		}
		const { column, target, ...extra } = m as Record<string, unknown>;
		if (Object.keys(extra).length)
			issues.push({ field: f, code: "FIELD_NOT_WRITABLE" });
		if (
			!Number.isInteger(column) ||
			(column as number) < 0 ||
			(column as number) >= width
		)
			issues.push({ field: `${f}.column`, code: "COLUMN_OUT_OF_RANGE" });
		if (typeof target !== "string") {
			issues.push({ field: `${f}.target`, code: "INVALID_TYPE" });
			return;
		}
		if (seen.has(target))
			issues.push({ field: `${f}.target`, code: "DUPLICATE_TARGET" });
		seen.add(target);
		if (target.startsWith("property:")) {
			const key = target.slice(9);
			if (!KEY_RE.test(key) || !props.has(key))
				issues.push({ field: `${f}.target`, code: "UNKNOWN_PROPERTY" });
		} else if (!fixed.has(target))
			issues.push({ field: `${f}.target`, code: "UNKNOWN_TARGET" });
		cols.push({ column: column as number, target });
	});
	for (const t of FIXED_TARGETS[object])
		if (t.required && !seen.has(t.target))
			issues.push({
				field: "mapping.columns",
				code: `REQUIRED_TARGET_${t.target.toUpperCase()}`,
			});
	if (issues.length) throw new Fault(422, "MAPPING_INVALID", issues);
	return cols;
}

// ---- one row -----------------------------------------------------------------------------------------------------------------
export type RowValue = {
	displayName?: string; // contact: display_name; lead: contact_name
	title?: string; // lead
	email?: string;
	phone?: string;
	sourceEvidence?: string;
	patch: Row; // coerced custom property patch (keys with a non-blank cell only); validated by checkProps once the target is known
};
export type RowResult =
	| { ok: true; value: RowValue; warnings: string[] }
	| { ok: false; errors: Issue[] };

function nameField(
	raw: Cell,
	max: number,
	field: string,
	errors: Issue[],
): string | undefined {
	const t = cellText(raw);
	if (t === undefined) return undefined;
	if (LONE_SURROGATE.test(t) || BAD_TEXT.test(t))
		errors.push({ field, code: "INVALID_VALUE" });
	else if ([...t].length > max) errors.push({ field, code: "MAX_LENGTH" });
	return t;
}
export function buildRow(
	object: ImportObject,
	cols: readonly MappingColumn[],
	cells: readonly Cell[],
	registry: Registry,
	opts: Pick<ImportOptions, "default_country_code">,
): RowResult {
	const errors: Issue[] = [];
	const warnings: string[] = [];
	const v: RowValue = { patch: {} };
	for (const { column, target } of cols) {
		const cell = cells[column] ?? null;
		if (formulaLike(cell)) warnings.push(`FORMULA_LIKE:${target}`);
		if (target === "display_name" || target === "contact_name")
			v.displayName = nameField(cell, NAME_MAX, target, errors);
		else if (target === "title")
			v.title = nameField(cell, NAME_MAX, target, errors);
		else if (target === "source_evidence")
			v.sourceEvidence = nameField(cell, EVIDENCE_MAX, target, errors);
		else if (target === "email") {
			const t = cellText(cell);
			if (t !== undefined) {
				const e = normalizeEmail(t);
				if (e) v.email = e;
				else errors.push({ field: "email", code: "INVALID_EMAIL" });
			}
		} else if (target === "phone") {
			const t = cellText(cell);
			if (t !== undefined) {
				const p = normalizePhone(t, opts.default_country_code ?? "+20");
				if (p) v.phone = p;
				else errors.push({ field: "phone", code: "INVALID_PHONE" });
			}
		} else if (target.startsWith("property:")) {
			const key = target.slice(9);
			const d = registry.defs.get(key);
			if (!d) continue;
			const val = coerceCell(d, cell);
			if (val !== undefined) v.patch[key] = val;
		}
	}
	if (
		object === "contact" &&
		v.displayName === undefined &&
		!errors.some((e) => e.field === "display_name")
	)
		errors.push({ field: "display_name", code: "REQUIRED" });
	if (
		object === "lead" &&
		v.title === undefined &&
		!errors.some((e) => e.field === "title")
	)
		errors.push({ field: "title", code: "REQUIRED" });
	if (
		object === "lead" &&
		!v.email &&
		!v.phone &&
		!errors.length
	)
		errors.push({ field: "contact_channels", code: "CONTACT_REQUIRED" });
	return errors.length
		? { ok: false, errors }
		: { ok: true, value: v, warnings };
}

/** The single property validator on one row's patch: create semantics for a new record, update semantics (blank = leave alone) against the stored blob. */
export function checkProps(
	registry: Registry,
	object: ImportObject,
	patch: Row,
	actor: Actor,
	mode: "create" | "update",
	current: Row = {},
):
	| { ok: true; custom: Row; changed: string[] }
	| { ok: false; errors: Issue[] } {
	try {
		const r = validateProperties(registry, object, patch, actor, {
			mode,
			current,
		});
		return { ok: true, custom: r.custom, changed: r.changed };
	} catch (e) {
		if (e instanceof Fault && e.details)
			return {
				ok: false,
				errors: e.details.map((d) => ({ field: d.field, code: d.code })),
			};
		if (e instanceof Fault)
			return { ok: false, errors: [{ field: "properties", code: e.code }] };
		throw e;
	}
}
