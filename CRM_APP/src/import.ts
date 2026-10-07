// Import, server half (roadmap v2 item 3). Routes under /v1/imports; contract in IMPORT_CONTRACTS.md. Threat model: the uploaded file is
// untrusted bytes. importfile.ts bounds and parses it; importmap.ts turns cells into values and runs the ONE property validator; this
// file owns authority (crm.import = manager + MFA, tenant scope, no agency grant), the duplicate decision, idempotency and evidence.
//
// One import = one database transaction. Preview and commit run the SAME `plan()`, so what the preview showed is what the job does.
// Idempotency is by CONTENT: import_key = sha256(file sha256 + object + normalised mapping + options). Re-submitting the same file with
// the same mapping returns the stored job (`replayed: true`) and writes nothing; UNIQUE(tenant, object, import_key) is the backstop.
import { createHash, randomUUID } from "node:crypto";
import type pg from "pg";
import { evidence as _unused, id as uuidOf, permit, type Body } from "./crm.js";
import { type Context, Fault, transaction } from "./db.js";
import {
	type Cell,
	FileError,
	type Grid,
	IMPORT_LIMITS,
	parseFile,
	sha256,
} from "./importfile.js";
import {
	buildRow,
	checkProps,
	FIXED_TARGETS,
	type ImportObject,
	type ImportOptions,
	type Issue,
	type MappingColumn,
	type RowValue,
	validateMapping,
} from "./importmap.js";
import {
	type Actor,
	type Def,
	LIMITS as PROP_LIMITS,
	loadRegistry,
	type Registry,
	type Row,
	searchSource,
	truncateBytes,
} from "./properties.js";
import { KEY_RE } from "./schemarules.js";

void _unused;
export const isImport = (p: string) => p === "/v1/imports" || p.startsWith("/v1/imports/");
// base64 of a max-size file plus the small JSON envelope
export const IMPORT_BODY_LIMIT = Math.ceil((IMPORT_LIMITS.fileBytes * 4) / 3) + 64 * 1024;
const PREVIEW_DEFAULT = 20;
const PREVIEW_MAX = 100;
const ERROR_ROWS_RETURNED = 100;
const ROWS_PAGE = 200;
const BATCH = 500;

type Db = pg.PoolClient;
type Outcome = "create" | "update" | "skip" | "error";
type Plan = {
	object: ImportObject;
	grid: Grid;
	cols: MappingColumn[];
	items: Item[];
	registry: Registry;
	actor: Actor;
	owner: string;
	summary: { create: number; update: number; skip: number; error: number; warnings: number };
};
type Item = {
	row: number; // spreadsheet row number
	status: Outcome;
	reason?: string;
	errors?: Issue[];
	warnings: string[];
	value?: RowValue;
	// contact reference: an existing contact id, or "new:<row>" for a contact created earlier in this same job
	contactRef?: string;
	leadId?: string; // existing lead to update
	custom?: Row; // full blob to store
	search?: string; // filled at commit
	changed?: string[];
	addIdentifiers?: { kind: "email" | "phone"; value: string }[];
	setName?: string;
};

// ---- helpers -------------------------------------------------------------------------------------------------------------------
const canonical = (v: unknown): string =>
	Array.isArray(v)
		? `[${v.map(canonical).join(",")}]`
		: v && typeof v === "object"
			? `{${Object.entries(v)
					.sort(([a], [b]) => (a < b ? -1 : 1))
					.map(([k, x]) => `${JSON.stringify(k)}:${canonical(x)}`)
					.join(",")}}`
			: JSON.stringify(v);
function fileFault(e: FileError): Fault {
	const where = e.detail?.row !== undefined ? `file.row.${e.detail.row}${e.detail.column !== undefined ? `.column.${e.detail.column}` : ""}` : "file";
	return new Fault(e.code === "FILE_TOO_LARGE" ? 413 : 422, e.code, [{ field: where, code: e.code }]);
}
function only(b: Body, allowed: string[]) {
	const extra = Object.keys(b).filter((k) => !allowed.includes(k));
	if (extra.length) throw new Fault(422, "FIELD_NOT_WRITABLE", extra.map((k) => ({ field: k, code: "FIELD_NOT_WRITABLE" })));
}
function bad(field: string, code = "INVALID_VALUE"): never {
	throw new Fault(422, "VALIDATION_FAILED", [{ field, code }]);
}
type Input = {
	object: ImportObject;
	format: "csv" | "xlsx";
	filename: string;
	file: Buffer;
	fileSha: string;
	mapping: unknown;
	options: ImportOptions;
	preview: number;
};
const B64 = /^[A-Za-z0-9+/]*={0,2}$/;
function readInput(b: Body, preview: boolean): Input {
	only(b, ["object", "format", "filename", "file_base64", "mapping", "options", ...(preview ? ["preview_rows"] : [])]);
	const object = b.object;
	if (object !== "contact" && object !== "lead") bad("object");
	const format = b.format;
	if (format !== "csv" && format !== "xlsx") bad("format");
	const name = b.filename;
	if (typeof name !== "string" || !name.trim() || name.length > 255) bad("filename");
	// eslint-style control-character strip: the name is stored in the ledger and shown in the UI
	// biome-ignore lint/suspicious/noControlCharactersInRegex: intentional
	const filename = (name as string).replace(/[\u0000-\u001f\u007f-\u009f‪-‮⁦-⁩]/g, "").trim();
	if (!filename) bad("filename");
	const b64 = b.file_base64;
	if (typeof b64 !== "string" || !b64.length) bad("file_base64", "REQUIRED");
	if ((b64 as string).length > Math.ceil((IMPORT_LIMITS.fileBytes * 4) / 3) + 4) throw new Fault(413, "FILE_TOO_LARGE");
	if (!B64.test(b64 as string) || (b64 as string).length % 4 !== 0) bad("file_base64", "INVALID_BASE64");
	const file = Buffer.from(b64 as string, "base64");
	if (file.length > IMPORT_LIMITS.fileBytes) throw new Fault(413, "FILE_TOO_LARGE");
	if (!file.length) throw new Fault(422, "EMPTY_FILE");
	const zip = file.length > 3 && file[0] === 0x50 && file[1] === 0x4b && file[2] === 0x03 && file[3] === 0x04;
	if ((format === "xlsx") !== zip) throw new Fault(422, "FORMAT_MISMATCH", [{ field: "format", code: "FORMAT_MISMATCH" }]);
	const m = b.mapping;
	if (!m || typeof m !== "object" || Array.isArray(m)) bad("mapping", "INVALID_TYPE");
	only(m as Body, ["columns"]);
	const o = (b.options ?? {}) as Body;
	if (!o || typeof o !== "object" || Array.isArray(o)) bad("options", "INVALID_TYPE");
	only(o, ["duplicate_mode", "error_policy", "owner_id", "default_country_code", "sheet"]);
	const dup = o.duplicate_mode ?? "skip";
	if (dup !== "skip" && dup !== "update" && dup !== "create") bad("options.duplicate_mode");
	const pol = o.error_policy ?? "skip";
	if (pol !== "skip" && pol !== "abort") bad("options.error_policy");
	const cc = o.default_country_code ?? null;
	if (cc !== null && (typeof cc !== "string" || !/^\+?[1-9]\d{0,3}$/.test(cc))) bad("options.default_country_code");
	const sheet = o.sheet ?? null;
	if (sheet !== null && !(typeof sheet === "string" && sheet.length > 0 && sheet.length <= 255) && !(Number.isInteger(sheet) && (sheet as number) >= 1 && (sheet as number) <= 255))
		bad("options.sheet");
	if (sheet !== null && format === "csv") bad("options.sheet", "NOT_APPLICABLE");
	const owner = o.owner_id ?? null;
	if (owner !== null) uuidOf(owner);
	const pr = b.preview_rows ?? PREVIEW_DEFAULT;
	if (!Number.isInteger(pr) || (pr as number) < 1 || (pr as number) > PREVIEW_MAX) bad("preview_rows");
	return {
		object,
		format,
		filename,
		file,
		fileSha: sha256(file),
		mapping: (m as Body).columns,
		options: {
			duplicate_mode: dup,
			error_policy: pol,
			owner_id: owner as string | null,
			default_country_code: cc as string | null,
			sheet: sheet as number | string | null,
		},
		preview: pr as number,
	};
}

// ---- registry slice for the mapped properties ----------------------------------------------------------------------------------
async function propertyContext(db: Db, ctx: Context, object: ImportObject, mapping: unknown) {
	const keys: string[] = [];
	if (Array.isArray(mapping))
		for (const m of mapping) {
			const t = (m as { target?: unknown })?.target;
			if (typeof t === "string" && t.startsWith("property:") && KEY_RE.test(t.slice(9))) keys.push(t.slice(9));
		}
	const registry = await loadRegistry(db, ctx, object, keys.slice(0, PROP_LIMITS.patchKeys), true);
	const actor: Actor = { sensitiveRead: false, sensitiveWrite: false, assignable: new Set() };
	if ([...registry.defs.values()].some((d) => d.sensitive)) {
		const q = async (a: string) =>
			(await db.query("SELECT crm.can_object($1,$2,NULL,NULL) ok", [a, object])).rows[0].ok === true;
		actor.sensitiveRead = await q("sensitive.read");
		actor.sensitiveWrite = await q("sensitive.write");
	}
	// Properties a mapping may name: active, writable, and (when sensitive) readable AND writable by this caller. `user` properties
	// are refused in v1 (each value would need a per-row assignment check).
	const mappable = new Map<string, Def>();
	for (const d of registry.defs.values())
		if (!d.archived && !d.read_only && d.type !== "user" && (!d.sensitive || (actor.sensitiveRead && actor.sensitiveWrite))) mappable.set(d.key, d);
	return { registry, actor, mappable };
}

// ---- the plan (shared by preview and commit) -----------------------------------------------------------------------------------
type Existing = { id: string; display_name: string; custom: Row };
async function plan(db: Db, ctx: Context, inp: Input, forWrite: boolean): Promise<Plan> {
	let grid: Grid;
	try {
		grid = await parseFile(inp.format, inp.file, inp.options.sheet ?? undefined);
	} catch (e) {
		if (e instanceof FileError) throw fileFault(e);
		throw e;
	}
	const { registry, actor, mappable } = await propertyContext(db, ctx, inp.object, inp.mapping);
	const cols = validateMapping(inp.object, inp.mapping, grid.headers.length, mappable);
	const usesIdentifiers = cols.some((c) => c.target === "email" || c.target === "phone");
	if (usesIdentifiers) await permit(db, ctx, "sensitive.write", "contact");
	const {
		rows: [who],
	} = await db.query("SELECT crm.actor() actor");
	let owner = who.actor as string;
	if (inp.options.owner_id) {
		const { rows: [ok] } = await db.query("SELECT crm.assignment_ok($1) ok", [inp.options.owner_id]);
		if (!ok.ok) throw new Fault(403, "ASSIGNMENT_DENIED");
		owner = inp.options.owner_id;
	}

	// 1. cell -> value, per row
	const items: Item[] = [];
	const built = grid.rows.map((cells, i) => ({ n: grid.rowNumbers[i], r: buildRow(inp.object, cols, cells, registry, inp.options) }));
	// 2. existing contacts by identifier digest (email/phone), one round trip per chunk
	const keyOf = (kind: string, v: string) => `${kind}:${v}`;
	const wanted = new Set<string>();
	for (const { r } of built)
		if (r.ok) {
			if (r.value.email) wanted.add(r.value.email);
			if (r.value.phone) wanted.add(r.value.phone);
		}
	const byKey = new Map<string, Set<string>>(); // "email:x" -> contact refs
	if (wanted.size) {
		const vals = [...wanted];
		const digestOf = new Map<string, string>();
		for (let i = 0; i < vals.length; i += 1000) {
			const part = vals.slice(i, i + 1000);
			const { rows } = await db.query("SELECT v,crm.identifier_digest(v) dg FROM unnest($1::text[]) v", [part]);
			for (const r of rows) if (r.dg) digestOf.set(r.dg as string, r.v as string);
		}
		const digests = [...digestOf.keys()];
		for (let i = 0; i < digests.length; i += 1000) {
			const { rows } = await db.query(
				"SELECT ci.kind,ci.keyed_lookup_digest dg,ci.contact_id FROM crm.contact_identifier ci JOIN crm.contact c ON (c.tenant_id,c.id)=(ci.tenant_id,ci.contact_id) WHERE ci.tenant_id=$1 AND ci.keyed_lookup_digest=ANY($2::text[]) AND c.merged_into_id IS NULL",
				[ctx.tenant, digests.slice(i, i + 1000)],
			);
			for (const r of rows) {
				const k = keyOf(r.kind as string, digestOf.get(r.dg as string) as string);
				if (!byKey.has(k)) byKey.set(k, new Set());
				byKey.get(k)?.add(r.contact_id as string);
			}
		}
	}
	// 3. the contacts any row may touch: names + custom blobs (locked when a write may follow)
	const state = new Map<string, Existing>();
	const touched = [...new Set([...byKey.values()].flatMap((s) => [...s]))].sort();
	for (let i = 0; i < touched.length; i += 1000) {
		const { rows } = await db.query(
			`SELECT id,display_name,custom FROM crm.contact WHERE tenant_id=$1 AND id=ANY($2::uuid[]) ORDER BY id ${forWrite && inp.options.duplicate_mode === "update" ? "FOR UPDATE" : ""}`,
			[ctx.tenant, touched.slice(i, i + 1000)],
		);
		for (const r of rows) state.set(r.id as string, { id: r.id, display_name: r.display_name, custom: (r.custom ?? {}) as Row });
	}
	// leads of those contacts (lead duplicate = same contact + same title, not closed)
	const leadsOf = new Map<string, Map<string, { id: string; custom: Row }>>();
	if (inp.object === "lead" && touched.length)
		for (let i = 0; i < touched.length; i += 1000) {
			const { rows } = await db.query(
				`SELECT id,contact_id,title,custom FROM crm.lead WHERE tenant_id=$1 AND contact_id=ANY($2::uuid[]) AND status<>'closed' ORDER BY id ${forWrite && inp.options.duplicate_mode === "update" ? "FOR UPDATE" : ""}`,
				[ctx.tenant, touched.slice(i, i + 1000)],
			);
			for (const r of rows) {
				const m = leadsOf.get(r.contact_id as string) ?? new Map();
				m.set(titleKey(r.title as string), { id: r.id, custom: (r.custom ?? {}) as Row });
				leadsOf.set(r.contact_id as string, m);
			}
		}

	// 4. decide row by row in file order (rows of this same file are visible to later rows)
	const summary = { create: 0, update: 0, skip: 0, error: 0, warnings: 0 };
	const mode = inp.options.duplicate_mode;
	for (const { n, r } of built) {
		const it: Item = { row: n, status: "error", warnings: [] };
		items.push(it);
		const done = () => {
			summary[it.status]++;
			if (it.warnings.length) summary.warnings++;
		};
		if (!r.ok) {
			it.errors = r.errors;
			done();
			continue;
		}
		it.value = r.value;
		it.warnings = r.warnings;
		const v = r.value;
		const keys: string[] = [];
		if (v.email) keys.push(keyOf("email", v.email));
		if (v.phone) keys.push(keyOf("phone", v.phone));
		const refs = new Set<string>();
		for (const k of keys) for (const c of byKey.get(k) ?? []) refs.add(c);
		const register = (ref: string) => {
			for (const k of keys) {
				if (!byKey.has(k)) byKey.set(k, new Set());
				byKey.get(k)?.add(ref);
			}
		};
		const fail = (errors: Issue[]) => {
			it.status = "error";
			it.errors = errors;
		};
		if (refs.size > 1) {
			if (mode === "create") refs.clear(); // explicit: always create
			else if (mode === "skip") {
				it.status = "skip";
				it.reason = "DUPLICATE_AMBIGUOUS";
				done();
				continue;
			} else {
				fail([{ field: "email", code: "AMBIGUOUS_MATCH" }]);
				done();
				continue;
			}
		}
		const match = refs.size === 1 ? [...refs][0] : null;
		const asNew = () => {
			// a brand-new contact (contact import, or lead import without a matching contact)
			const name = v.displayName ?? v.email ?? v.phone;
			if (!name) return fail([{ field: inp.object === "lead" ? "contact_name" : "display_name", code: "REQUIRED" }]);
			if (inp.object === "contact") {
				const p = checkProps(registry, "contact", v.patch, actor, "create");
				if (!p.ok) return fail(p.errors);
				it.custom = p.custom;
				it.changed = p.changed;
			}
			it.status = "create";
			it.contactRef = `new:${n}`;
			it.setName = name;
			it.addIdentifiers = idents(v);
			state.set(it.contactRef, { id: it.contactRef, display_name: name, custom: it.custom ?? {} });
			register(it.contactRef);
		};
		if (inp.object === "contact") {
			if (!match || mode === "create") asNew();
			else if (mode === "skip") {
				it.status = "skip";
				it.reason = "DUPLICATE";
				it.contactRef = match;
			} else {
				const cur = state.get(match);
				if (!cur) {
					fail([{ field: "email", code: "MATCH_UNAVAILABLE" }]);
					done();
					continue;
				}
				const p = checkProps(registry, "contact", v.patch, actor, "update", cur.custom);
				if (!p.ok) fail(p.errors);
				else {
					const known = new Set(keys.filter((k) => byKey.get(k)?.has(match)));
					const add = idents(v).filter((x) => !known.has(keyOf(x.kind, x.value)));
					const nameChange = v.displayName !== undefined && v.displayName !== cur.display_name;
					if (!p.changed.length && !add.length && !nameChange) {
						it.status = "skip";
						it.reason = "NO_CHANGE";
					} else {
						it.status = "update";
						it.contactRef = match;
						it.custom = p.custom;
						it.changed = p.changed;
						it.addIdentifiers = add;
						if (nameChange) it.setName = v.displayName;
						state.set(match, { ...cur, display_name: v.displayName ?? cur.display_name, custom: p.custom });
						for (const k of keys) byKey.get(k)?.add(match);
					}
				}
			}
		} else {
			// lead: the contact is reused whenever an identifier matches (never duplicated); the lead is the duplicate unit
			const titleK = titleKey(v.title as string);
			if (!match) {
				const pl = checkProps(registry, "lead", v.patch, actor, "create");
				if (!pl.ok) fail(pl.errors);
				else {
					asNew();
					if (it.status === "create") {
						it.custom = pl.custom;
						it.changed = pl.changed;
						const m = leadsOf.get(it.contactRef as string) ?? new Map();
						m.set(titleK, { id: `new:${n}`, custom: pl.custom });
						leadsOf.set(it.contactRef as string, m);
					}
				}
			} else {
				const existing = leadsOf.get(match)?.get(titleK);
				if (existing && mode !== "create") {
					if (mode === "skip") {
						it.status = "skip";
						it.reason = "DUPLICATE";
						it.contactRef = match;
					} else {
						const p = checkProps(registry, "lead", v.patch, actor, "update", existing.custom);
						if (!p.ok) fail(p.errors);
						else if (!p.changed.length) {
							it.status = "skip";
							it.reason = "NO_CHANGE";
						} else {
							it.status = "update";
							it.contactRef = match;
							it.leadId = existing.id;
							it.custom = p.custom;
							it.changed = p.changed;
							existing.custom = p.custom;
						}
					}
				} else {
					const pl = checkProps(registry, "lead", v.patch, actor, "create");
					if (!pl.ok) fail(pl.errors);
					else {
						it.status = "create";
						it.contactRef = match;
						it.custom = pl.custom;
						it.changed = pl.changed;
						const m = leadsOf.get(match) ?? new Map();
						m.set(titleK, { id: `new:${n}`, custom: pl.custom });
						leadsOf.set(match, m);
					}
				}
			}
		}
		done();
	}
	return { object: inp.object, grid, cols, items, registry, actor, owner, summary };
}
const titleKey = (t: string) => t.normalize("NFC").trim().toLowerCase();
const idents = (v: RowValue) => [
	...(v.email ? [{ kind: "email" as const, value: v.email }] : []),
	...(v.phone ? [{ kind: "phone" as const, value: v.phone }] : []),
];

// ---- preview -------------------------------------------------------------------------------------------------------------------
function itemView(it: Item, cols: MappingColumn[], grid: Grid) {
	const cells = grid.rows[grid.rowNumbers.indexOf(it.row)] ?? [];
	const values: Record<string, unknown> = {};
	for (const c of cols) {
		const cell: Cell = cells[c.column] ?? null;
		if (cell !== null) values[c.target] = cell instanceof Date ? cell.toISOString() : cell;
	}
	return {
		row: it.row,
		status: it.status,
		...(it.reason ? { reason: it.reason } : {}),
		...(it.errors ? { errors: it.errors } : {}),
		...(it.warnings.length ? { warnings: it.warnings } : {}),
		values,
	};
}
async function importKey(db: Db, ctx: Context, inp: Input): Promise<{ key: string; owner: string }> {
	let owner = inp.options.owner_id;
	if (!owner) owner = ((await db.query("SELECT crm.actor() actor")).rows[0].actor as string) ?? "";
	const cols = Array.isArray(inp.mapping)
		? (inp.mapping as MappingColumn[]).map((m) => ({ column: m.column, target: m.target })).sort((a, b) => a.column - b.column || (a.target < b.target ? -1 : 1))
		: inp.mapping;
	const key = createHash("sha256")
		.update(canonical({ v: 1, tenant: ctx.tenant, object: inp.object, file: inp.fileSha, format: inp.format, cols, options: { ...inp.options, owner_id: owner } }))
		.digest("hex");
	return { key, owner };
}
async function existingJob(db: Db, ctx: Context, object: string, key: string) {
	return (
		await db.query(
			"SELECT id,object_type,file_sha256,file_name,format,duplicate_mode,error_policy,actor_id,status,total_rows,created_count,updated_count,skipped_count,failed_count,created_at FROM crm.import_job WHERE tenant_id=$1 AND object_type=$2 AND import_key=$3",
			[ctx.tenant, object, key],
		)
	).rows[0];
}
async function gate(db: Db, ctx: Context, object: ImportObject) {
	// Agency grants are fixed-deal only and can never import. crm.import (manager, MFA) + crm.write (defence in depth).
	if (ctx.grant) throw new Fault(403, "FORBIDDEN");
	await permit(db, ctx, "crm.import", object);
	await permit(db, ctx, "crm.write", object);
}
async function preview(db: Db, ctx: Context, b: Body) {
	const inp = readInput(b, true);
	await gate(db, ctx, inp.object);
	const p = await plan(db, ctx, inp, false);
	const { key } = await importKey(db, ctx, inp);
	const prior = await existingJob(db, ctx, inp.object, key);
	const errorRows = p.items.filter((i) => i.status === "error");
	return {
		data: {
			object: inp.object,
			format: inp.format,
			file: { name: inp.filename, sha256: inp.fileSha, bytes: inp.file.length },
			headers: p.grid.headers,
			total_rows: p.items.length,
			summary: p.summary,
			options: inp.options,
			limits: { ...IMPORT_LIMITS },
			already_imported: prior ? { job_id: prior.id, created_at: prior.created_at } : null,
			rows: p.items.slice(0, inp.preview).map((i) => itemView(i, p.cols, p.grid)),
			error_rows: errorRows.slice(0, ERROR_ROWS_RETURNED).map((i) => itemView(i, p.cols, p.grid)),
			error_rows_truncated: errorRows.length > ERROR_ROWS_RETURNED,
		},
	};
}

// ---- commit --------------------------------------------------------------------------------------------------------------------
async function bulk(db: Db, table: string, cols: string[], rows: unknown[][], casts: Record<string, string> = {}) {
	for (let i = 0; i < rows.length; i += BATCH) {
		const part = rows.slice(i, i + BATCH);
		const params: unknown[] = [];
		const tuples = part.map((r) => `(${r.map((v, k) => { params.push(v); return `$${params.length}${casts[cols[k]] ? `::${casts[cols[k]]}` : ""}`; }).join(",")})`);
		await db.query(`INSERT INTO ${table}(${cols.join(",")}) VALUES ${tuples.join(",")}`, params);
	}
}
async function foldSearch(db: Db, registry: Registry, customs: (Row | undefined)[]): Promise<string[]> {
	const src = customs.map((c) => (c ? searchSource(registry, c) : ""));
	const out = src.map(() => "");
	const idx = src.map((s, i) => (s ? i : -1)).filter((i) => i >= 0);
	for (let i = 0; i < idx.length; i += 1000) {
		const part = idx.slice(i, i + 1000);
		const { rows } = await db.query("SELECT crm.normalize_search(x) s FROM unnest($1::text[]) WITH ORDINALITY t(x,o) ORDER BY o", [part.map((k) => src[k])]);
		part.forEach((k, j) => {
			out[k] = truncateBytes(rows[j].s as string, PROP_LIMITS.searchBytes);
		});
	}
	return out;
}
async function commit(db: Db, ctx: Context, b: Body, request: string) {
	const inp = readInput(b, false);
	await gate(db, ctx, inp.object);
	const { key } = await importKey(db, ctx, inp);
	await db.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [`import:${ctx.tenant}:${key}`]);
	const prior = await existingJob(db, ctx, inp.object, key);
	if (prior) return { status: 200, data: { job: jobView(prior), replayed: true, error_rows: [] } };

	const p = await plan(db, ctx, inp, true);
	if (inp.options.error_policy === "abort" && p.summary.error)
		throw new Fault(
			422,
			"IMPORT_REJECTED",
			p.items.filter((i) => i.status === "error").slice(0, ERROR_ROWS_RETURNED).flatMap((i) => (i.errors ?? []).map((e) => ({ field: `row.${i.row}.${e.field}`, code: e.code }))),
		);
	const {
		rows: [who],
	} = await db.query("SELECT crm.actor() actor");
	const actor = who.actor as string;
	const job = randomUUID();
	const provenance = `import:${job}`;
	const evidenceText = `import:${inp.filename}`.slice(0, 500);
	const searches = await foldSearch(db, p.registry, p.items.map((i) => (i.status === "create" || i.status === "update" ? i.custom : undefined)));
	p.items.forEach((it, i) => {
		it.search = searches[i];
	});

	const ids = new Map<string, string>(); // "new:<row>" -> contact id
	const leadIds = new Map<string, string>();
	const rowsOut: unknown[][] = [];
	const ledger: { kind: "contact" | "lead"; id: string; action: string; changed: string[] }[] = [];
	const addIdentifiers = async (contact: string, list: { kind: string; value: string }[]) => {
		for (const x of list) {
			const {
				rows: [enc],
			} = await db.query("SELECT crm.encrypt_identifier($1) value", [x.value]);
			await db.query("INSERT INTO crm.contact_identifier VALUES($1,$2,$3,$4,$5,crm.identifier_digest($6),$7,$3)", [ctx.tenant, randomUUID(), contact, x.kind, enc.value, x.value, provenance]);
		}
	};
	const counts = { created: 0, updated: 0, skipped: 0, failed: 0 };
	for (const it of p.items) {
		if (it.status === "error") {
			counts.failed++;
			rowsOut.push([ctx.tenant, job, it.row, "failed", (it.errors?.[0]?.code ?? "INVALID").slice(0, 64), null, null]);
			continue;
		}
		if (it.status === "skip") {
			counts.skipped++;
			const ref = it.contactRef?.startsWith("new:") ? ids.get(it.contactRef) : it.contactRef;
			rowsOut.push([ctx.tenant, job, it.row, "skipped", it.reason ?? null, p.object, p.object === "contact" ? (ref ?? null) : null]);
			continue;
		}
		// the contact this row lands on
		let contact = it.contactRef?.startsWith("new:") ? ids.get(it.contactRef) : it.contactRef;
		if (p.object === "contact") {
			if (it.status === "create") {
				contact = randomUUID();
				ids.set(`new:${it.row}`, contact);
				await db.query("INSERT INTO crm.contact(tenant_id,id,display_name,owner_id,source,custom,custom_search) VALUES($1,$2,$3,$4,'import',$5::jsonb,$6)", [
					ctx.tenant, contact, it.setName, p.owner, JSON.stringify(it.custom ?? {}), it.search ?? "",
				]);
				await addIdentifiers(contact, it.addIdentifiers ?? []);
				ledger.push({ kind: "contact", id: contact, action: "contact.created", changed: ["display_name", "owner_id", "source", "import", ...((it.addIdentifiers?.length ?? 0) ? ["identifiers"] : []), ...(it.changed ?? []).map((k) => `custom:${k}`)] });
				counts.created++;
			} else {
				if (!contact) throw new Fault(500, "INTERNAL_ERROR");
				const sets = ["custom=$3::jsonb", "custom_search=$4", "version=version+1"];
				const args: unknown[] = [ctx.tenant, contact, JSON.stringify(it.custom ?? {}), it.search ?? ""];
				if (it.setName !== undefined) {
					args.push(it.setName);
					sets.push(`display_name=$${args.length}`);
				}
				await db.query(`UPDATE crm.contact SET ${sets.join(",")} WHERE tenant_id=$1 AND id=$2`, args);
				await addIdentifiers(contact, it.addIdentifiers ?? []);
				ledger.push({ kind: "contact", id: contact, action: "contact.updated", changed: ["import", ...(it.setName !== undefined ? ["display_name"] : []), ...((it.addIdentifiers?.length ?? 0) ? ["identifiers"] : []), ...(it.changed ?? []).map((k) => `custom:${k}`)] });
				counts.updated++;
			}
			rowsOut.push([ctx.tenant, job, it.row, it.status === "create" ? "created" : "updated", null, "contact", contact]);
			continue;
		}
		// lead rows
		if (!contact) {
			contact = randomUUID();
			ids.set(`new:${it.row}`, contact);
			await db.query("INSERT INTO crm.contact(tenant_id,id,display_name,owner_id,source,custom,custom_search) VALUES($1,$2,$3,$4,'import','{}'::jsonb,'')", [ctx.tenant, contact, it.setName, p.owner]);
			await addIdentifiers(contact, it.addIdentifiers ?? []);
			ledger.push({ kind: "contact", id: contact, action: "contact.created", changed: ["display_name", "owner_id", "source", "import", ...((it.addIdentifiers?.length ?? 0) ? ["identifiers"] : [])] });
		}
		if (it.status === "create") {
			const lead = randomUUID();
			leadIds.set(`new:${it.row}`, lead);
			await db.query("INSERT INTO crm.lead(tenant_id,id,contact_id,owner_id,title,source,source_evidence,custom,custom_search) VALUES($1,$2,$3,$4,$5,'import',$6,$7::jsonb,$8)", [
				ctx.tenant, lead, contact, p.owner, it.value?.title, it.value?.sourceEvidence ?? evidenceText, JSON.stringify(it.custom ?? {}), it.search ?? "",
			]);
			ledger.push({ kind: "lead", id: lead, action: "lead.created", changed: ["contact_id", "owner_id", "title", "source", "source_evidence", "import", ...(it.changed ?? []).map((k) => `custom:${k}`)] });
			counts.created++;
			rowsOut.push([ctx.tenant, job, it.row, "created", null, "lead", lead]);
		} else {
			const lead = it.leadId?.startsWith("new:") ? leadIds.get(it.leadId.replace(/^new:/, "new:")) : it.leadId;
			if (!lead) throw new Fault(500, "INTERNAL_ERROR");
			await db.query("UPDATE crm.lead SET custom=$3::jsonb,custom_search=$4,version=version+1 WHERE tenant_id=$1 AND id=$2", [ctx.tenant, lead, JSON.stringify(it.custom ?? {}), it.search ?? ""]);
			ledger.push({ kind: "lead", id: lead, action: "lead.updated", changed: ["import", ...(it.changed ?? []).map((k) => `custom:${k}`)] });
			counts.updated++;
			rowsOut.push([ctx.tenant, job, it.row, "updated", null, "lead", lead]);
		}
	}
	// the job row first (the import_row FK and the 'import' ledger reference need it), then rows, then evidence
	await db.query(
		"INSERT INTO crm.import_job(tenant_id,id,object_type,import_key,file_sha256,file_name,format,duplicate_mode,error_policy,actor_id,total_rows,created_count,updated_count,skipped_count,failed_count) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)",
		[ctx.tenant, job, inp.object, key, inp.fileSha, inp.filename, inp.format, inp.options.duplicate_mode, inp.options.error_policy, actor, p.items.length, counts.created, counts.updated, counts.skipped, counts.failed],
	);
	await bulk(db, "crm.import_row", ["tenant_id", "job_id", "row_no", "outcome", "reason", "record_kind", "record_id"], rowsOut);
	// per-record evidence = exactly what a manual create/update writes (audit + business event + outbox), in bulk
	const ev = ledger.map((l) => ({ ...l, event: randomUUID() }));
	await bulk(db, "crm.audit_log", ["tenant_id", "id", "actor_id", "grant_id", "action", "request_id", "object_kind", "object_id", "changed_fields"], ev.map((l) => [ctx.tenant, randomUUID(), actor, null, l.action, request, l.kind, l.id, l.changed]), { changed_fields: "text[]" });
	await bulk(db, "crm.business_event", ["tenant_id", "id", "name", "object_kind", "object_id"], ev.map((l) => [ctx.tenant, l.event, l.action, l.kind, l.id]));
	await bulk(db, "crm.outbox", ["tenant_id", "id", "event_id", "actor_id", "grant_id", "deal_id", "object_kind", "object_id"], ev.map((l) => [ctx.tenant, randomUUID(), l.event, actor, null, null, l.kind, l.id]));
	// the job's own evidence row (audit + event; no outbox: nothing downstream consumes an import)
	await db.query("INSERT INTO crm.audit_log(tenant_id,id,actor_id,grant_id,action,request_id,object_kind,object_id,changed_fields) VALUES($1,$2,$3,NULL,'import.completed',$4,'import',$5,$6)", [
		ctx.tenant, randomUUID(), actor, request, job,
		[`object:${inp.object}`, `rows:${p.items.length}`, `created:${counts.created}`, `updated:${counts.updated}`, `skipped:${counts.skipped}`, `failed:${counts.failed}`],
	]);
	await db.query("INSERT INTO crm.business_event(tenant_id,id,name,object_kind,object_id) VALUES($1,$2,'import.completed','import',$3)", [ctx.tenant, randomUUID(), job]);
	const saved = await existingJob(db, ctx, inp.object, key);
	return {
		status: 201,
		data: {
			job: jobView(saved),
			replayed: false,
			error_rows: p.items.filter((i) => i.status === "error").slice(0, ERROR_ROWS_RETURNED).map((i) => itemView(i, p.cols, p.grid)),
		},
	};
}
// biome-ignore lint/suspicious/noExplicitAny: DB row
function jobView(r: any) {
	return {
		id: r.id,
		object: r.object_type,
		status: r.status,
		file: { name: r.file_name, sha256: r.file_sha256, format: r.format },
		duplicate_mode: r.duplicate_mode,
		error_policy: r.error_policy,
		actor_id: r.actor_id,
		total_rows: r.total_rows,
		created: r.created_count,
		updated: r.updated_count,
		skipped: r.skipped_count,
		failed: r.failed_count,
		created_at: r.created_at,
	};
}

// ---- reads ---------------------------------------------------------------------------------------------------------------------
async function fields(db: Db, ctx: Context, objectParam: string | null) {
	if (objectParam !== "contact" && objectParam !== "lead") bad("object");
	const object = objectParam as ImportObject;
	await gate(db, ctx, object);
	const { rows: sens } = await db.query("SELECT crm.can_object('sensitive.read',$1,NULL,NULL) r,crm.can_object('sensitive.write',$1,NULL,NULL) w", [object]);
	const both = sens[0].r === true && sens[0].w === true;
	const { rows } = await db.query(
		`SELECT d.key,d.type,d.label,d.required,d.sensitive,
 CASE WHEN d.type IN ('single_select','multi_select') THEN coalesce((SELECT jsonb_agg(o.value ORDER BY o.position,o.value) FROM crm.property_option o WHERE o.tenant_id=d.tenant_id AND o.property_id=d.id AND NOT o.archived),'[]'::jsonb) END options
 FROM crm.property_definition d WHERE d.tenant_id=$1 AND d.object_type=$2 AND d.storage='custom' AND NOT d.is_system AND d.archived_at IS NULL AND NOT d.read_only AND d.type<>'user' AND ($3::boolean OR NOT d.sensitive)
 ORDER BY d.position,d.key LIMIT 200`,
		[ctx.tenant, object, both],
	);
	return {
		data: {
			object,
			limits: { ...IMPORT_LIMITS },
			formats: ["csv", "xlsx"],
			duplicate_modes: ["skip", "update", "create"],
			error_policies: ["skip", "abort"],
			targets: [
				...FIXED_TARGETS[object],
				...rows.map((r) => ({ target: `property:${r.key}`, required: false, label: r.label, type: r.type, property_required: r.required, sensitive: r.sensitive, ...(r.options ? { options: r.options } : {}) })),
			],
		},
	};
}
async function list(db: Db, ctx: Context, query: URLSearchParams) {
	await permit(db, ctx, "crm.import", "contact");
	const cursor = query.get("cursor");
	if (cursor) uuidOf(cursor);
	const { rows } = await db.query(
		"SELECT id,object_type,file_sha256,file_name,format,duplicate_mode,error_policy,actor_id,status,total_rows,created_count,updated_count,skipped_count,failed_count,created_at FROM crm.import_job WHERE tenant_id=$1 AND ($2::uuid IS NULL OR id>$2) ORDER BY id LIMIT 51",
		[ctx.tenant, cursor],
	);
	return { data: rows.slice(0, 50).map(jobView), next_cursor: rows.length > 50 ? rows[49].id : null };
}
async function one(db: Db, ctx: Context, job: string, rowsPart: boolean, query: URLSearchParams) {
	await permit(db, ctx, "crm.import", "contact");
	const { rows } = await db.query(
		"SELECT id,object_type,file_sha256,file_name,format,duplicate_mode,error_policy,actor_id,status,total_rows,created_count,updated_count,skipped_count,failed_count,created_at FROM crm.import_job WHERE tenant_id=$1 AND id=$2",
		[ctx.tenant, job],
	);
	if (!rows[0]) throw new Fault(404, "NOT_FOUND");
	if (!rowsPart) return { data: jobView(rows[0]) };
	const outcome = query.get("outcome");
	if (outcome !== null && !["created", "updated", "skipped", "failed"].includes(outcome)) bad("outcome");
	const after = Number(query.get("after") ?? 0);
	if (!Number.isInteger(after) || after < 0) bad("after");
	const part = await db.query(
		"SELECT row_no,outcome,reason,record_kind,record_id FROM crm.import_row WHERE tenant_id=$1 AND job_id=$2 AND row_no>$3 AND ($4::text IS NULL OR outcome=$4) ORDER BY row_no LIMIT $5",
		[ctx.tenant, job, after, outcome, ROWS_PAGE + 1],
	);
	return { data: part.rows.slice(0, ROWS_PAGE), next_after: part.rows.length > ROWS_PAGE ? part.rows[ROWS_PAGE - 1].row_no : null };
}

export async function importRequest(ctx: Context, method: string, path: string, query: URLSearchParams, b: Body, _key: string, request: string) {
	const segs = path.split("/").filter(Boolean).slice(2);
	const [a, sub] = segs;
	const isId = (s?: string) => !!s && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
	let op: "fields" | "preview" | "commit" | "list" | "job" | "rows" | null = null;
	if (segs.length === 0) op = method === "POST" ? "commit" : method === "GET" ? "list" : null;
	else if (segs.length === 1 && a === "fields" && method === "GET") op = "fields";
	else if (segs.length === 1 && a === "preview" && method === "POST") op = "preview";
	else if (segs.length === 1 && isId(a) && method === "GET") op = "job";
	else if (segs.length === 2 && isId(a) && sub === "rows" && method === "GET") op = "rows";
	if (!op) throw new Fault(404, "NOT_FOUND");
	return transaction(ctx, async (db) => {
		if (op === "fields") return fields(db, ctx, query.get("object"));
		if (op === "preview") return preview(db, ctx, b);
		if (op === "commit") return commit(db, ctx, b, request);
		if (op === "list") return list(db, ctx, query);
		return one(db, ctx, a, op === "rows", query);
	});
}
