import type { ImportBody } from "./preview.ts";
export type Job = { id: string; object: "contact" | "lead"; status: string; file: { name: string; sha256: string; format: "csv" | "xlsx" }; duplicate_mode: "skip" | "update" | "create"; error_policy: "skip" | "abort"; actor_id: string; total_rows: number; created: number; updated: number; skipped: number; failed: number; created_at: string };
export type LedgerRow = { row_no: number; outcome: "created" | "updated" | "skipped" | "failed"; reason: string | null; record_kind: "contact" | "lead" | null; record_id: string | null };
export type CommitResult = { job: Job; replayed: boolean };
export type CommitState = { phase: "idle" | "submitting" | "uncertain" | "failed" | "complete"; pending: { body: ImportBody; key: string; scope: string; fileHash: string } | null; result: CommitResult | null; failure: { code: string; safeMessage: string; requestId: string | null; retryable: boolean; status: number } | null };
export const emptyCommit = (): CommitState => ({ phase: "idle", pending: null, result: null, failure: null });
const record = (v: unknown): Record<string, unknown> => { if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error("INVALID_IMPORT_RESPONSE"); return v as Record<string, unknown>; };
const str = (v: unknown, max = 255): string => { if (typeof v !== "string" || v.length > max) throw new Error("INVALID_IMPORT_RESPONSE"); return v; };
const num = (v: unknown): number => { if (!Number.isInteger(v) || (v as number) < 0 || (v as number) > 5000) throw new Error("INVALID_IMPORT_RESPONSE"); return v as number; };
export const validJobId = (v: string): boolean => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export function parseJob(v: unknown): Job {
	const raw = record(v); const file = record(raw.file);
	if (!validJobId(str(raw.id)) || !validJobId(str(raw.actor_id)) || !["contact", "lead"].includes(raw.object as string) || !["csv", "xlsx"].includes(file.format as string) || !["skip", "update", "create"].includes(raw.duplicate_mode as string) || !["skip", "abort"].includes(raw.error_policy as string) || !/^[a-f0-9]{64}$/.test(str(file.sha256)) || !Number.isFinite(Date.parse(str(raw.created_at)))) throw new Error("INVALID_IMPORT_RESPONSE");
	const job = { id: str(raw.id), object: raw.object as Job["object"], status: str(raw.status), file: { name: str(file.name), sha256: str(file.sha256), format: file.format as Job["file"]["format"] }, duplicate_mode: raw.duplicate_mode as Job["duplicate_mode"], error_policy: raw.error_policy as Job["error_policy"], actor_id: str(raw.actor_id), total_rows: num(raw.total_rows), created: num(raw.created), updated: num(raw.updated), skipped: num(raw.skipped), failed: num(raw.failed), created_at: str(raw.created_at) };
	if (job.created + job.updated + job.skipped + job.failed !== job.total_rows) throw new Error("INVALID_IMPORT_RESPONSE");
	return job;
}
export function parseCommit(v: unknown, body: ImportBody): CommitResult {
	const raw = record(v); const job = parseJob(raw.job);
	if (typeof raw.replayed !== "boolean" || job.object !== body.object || job.file.format !== body.format || job.duplicate_mode !== body.options.duplicate_mode || job.error_policy !== body.options.error_policy || !Array.isArray(raw.error_rows) || raw.error_rows.length > 100) throw new Error("INVALID_IMPORT_RESPONSE");
	return { job, replayed: raw.replayed };
}
export function parseHistory(v: unknown, cursor: string | null): { jobs: Job[]; next: string | null } {
	if (!Array.isArray(v) || v.length > 50 || (cursor !== null && !validJobId(cursor))) throw new Error("INVALID_IMPORT_RESPONSE");
	const jobs = v.map(parseJob); if (new Set(jobs.map((j) => j.id)).size !== jobs.length) throw new Error("INVALID_IMPORT_RESPONSE");
	if (cursor !== null && cursor !== jobs.at(-1)?.id) throw new Error("INVALID_IMPORT_RESPONSE");
	return { jobs, next: cursor };
}
export function parseLedger(v: unknown, next: number | null | undefined, after: number, outcome: string): { rows: LedgerRow[]; next: number | null } {
	if (!Array.isArray(v) || v.length > 200 || next === undefined || (next !== null && (!Number.isSafeInteger(next) || next <= after))) throw new Error("INVALID_IMPORT_RESPONSE");
	let previous = after;
	const rows = v.map((v) => {
		const raw = record(v); const row = raw.row_no;
		if (!Number.isSafeInteger(row) || (row as number) <= previous || !["created", "updated", "skipped", "failed"].includes(raw.outcome as string) || (outcome && raw.outcome !== outcome) || (raw.record_kind !== null && raw.record_kind !== "contact" && raw.record_kind !== "lead") || (raw.record_id !== null && !validJobId(str(raw.record_id)))) throw new Error("INVALID_IMPORT_RESPONSE");
		previous = row as number;
		return { row_no: row as number, outcome: raw.outcome as LedgerRow["outcome"], reason: raw.reason === null ? null : str(raw.reason), record_kind: raw.record_kind as LedgerRow["record_kind"], record_id: raw.record_id as string | null };
	});
	if (next !== null && (!rows.length || next !== rows.at(-1)?.row_no)) throw new Error("INVALID_IMPORT_RESPONSE");
	return { rows, next };
}
