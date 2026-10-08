import { useEffect, useMemo, useRef, useState } from "react";
import { isApiError } from "../../api/errors.ts";
import { navigate } from "../../router.ts";
import { Bdi, useI18n } from "../../ui/i18n/index.ts";
import { Button, Identity, Select } from "../../ui/primitives/index.ts";
import { fetchImportHistory, fetchImportJob, fetchImportRows } from "./api.ts";
import { rowErrorKey } from "./PreviewReview.tsx";
import type { CommitState, Job, LedgerRow } from "./jobs.ts";

export function ImportResults({ commit, onRetry, onNew, onEdit, onDenied }: { commit: CommitState; onRetry: () => void; onNew: () => void; onEdit: () => void; onDenied: () => void }) {
	const { t, tx, formatCount, formatDateTime } = useI18n();
	const [view, setView] = useState<"ledger" | "history">(commit.result ? "ledger" : "history");
	const [job, setJob] = useState<Job | null>(commit.result?.job ?? null);
	const [jobId, setJobId] = useState<string | null>(commit.result?.job.id ?? null);
	const [history, setHistory] = useState<Job[]>([]);
	const [cursors, setCursors] = useState<(string | null)[]>([null]);
	const [nextCursor, setNextCursor] = useState<string | null>(null);
	const [rows, setRows] = useState<LedgerRow[]>([]);
	const [pages, setPages] = useState([0]);
	const [nextAfter, setNextAfter] = useState<number | null>(null);
	const [outcome, setOutcome] = useState("");
	const [loading, setLoading] = useState(false);
	const [failure, setFailure] = useState<unknown>(null);
	const [reload, setReload] = useState(0);
	const titleRef = useRef<HTMLHeadingElement>(null);
	// Retry and replay create a new read generation even when the original job ID is unchanged.
	const readGeneration = useMemo(() => ({ retry: reload, result: commit.result }), [reload, commit.result]);
	const latestRead = useRef(readGeneration);
	const cursor = cursors.at(-1) ?? null;
	const after = pages.at(-1) ?? 0;
	useEffect(() => { if (commit.phase !== "idle") titleRef.current?.focus(); }, [commit.phase]);
	useEffect(() => {
		if (!commit.result) return;
		setJob(commit.result.job); setJobId(commit.result.job.id); setPages([0]); setOutcome(""); setView("ledger");
	}, [commit.result]);
	useEffect(() => {
		latestRead.current = readGeneration;
		const controller = new AbortController();
		const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]);
		setFailure(null); setLoading(true); setRows([]); setHistory([]); setNextCursor(null); setNextAfter(null);
		const read = async () => {
			if (view === "history") {
				const page = await fetchImportHistory(cursor, signal);
				if (!signal.aborted && latestRead.current === readGeneration) { setHistory(page.jobs); setNextCursor(page.next); }
			} else if (jobId) {
				const [currentJob, page] = await Promise.all([fetchImportJob(jobId, signal), fetchImportRows(jobId, after, outcome, signal)]);
				if (!signal.aborted && latestRead.current === readGeneration) { setJob(currentJob); setRows(page.rows); setNextAfter(page.next); }
			}
		};
		void read().catch((error: unknown) => {
			if (controller.signal.aborted || latestRead.current !== readGeneration) return;
			setFailure(error);
			if (isApiError(error) && error.kind === "forbidden") onDenied();
		}).finally(() => { if (!controller.signal.aborted && latestRead.current === readGeneration) setLoading(false); });
		return () => controller.abort();
	}, [view, cursor, jobId, after, outcome, readGeneration, onDenied]);
	const error = isApiError(failure) ? failure : null;
	const reasonText = (reason: string) => {
		const key = reason === "DUPLICATE" ? "import.reason.duplicate" : reason === "DUPLICATE_AMBIGUOUS" ? "import.reason.ambiguous" : reason === "NO_CHANGE" ? "import.reason.noChange" : rowErrorKey(reason);
		return key ? t(key) : t("import.row.unknown");
	};
	const metadata = (job: Job) => <>
		<p>{t("import.jobId")}: <Identity value={job.id} label={job.file.name} /></p><p><Bdi>{job.file.name}</Bdi> · <Bdi>{job.file.format.toUpperCase()}</Bdi></p>
		<p>{t("import.actor")}: <Identity value={job.actor_id} label={t("common.unknownUser")} /> · {formatDateTime(job.created_at)}</p>
		<p>{t("import.jobStatus")}: <Bdi>{job.status}</Bdi> · {t(job.object === "contact" ? "nav.contacts" : "nav.leads")}</p>
		<p>{t(job.duplicate_mode === "skip" ? "import.policy.skip" : job.duplicate_mode === "update" ? "import.policy.update" : job.object === "contact" ? "import.policy.createContacts" : "import.policy.createLeads")} · {t(job.error_policy === "skip" ? "import.policy.skipErrors" : "import.policy.abort")}</p>
		<dl className="flex flex-wrap gap-16 [&_dd]:ms-0 [&_dd]:font-[600]">{(["created", "updated", "skipped", "failed"] as const).map((key) => <div key={key}><dt>{t(`import.outcome.${key}`)}</dt><dd>{formatCount(job[key])}</dd></div>)}</dl>
	</>;
	return <div className="grid gap-12 min-w-0">
		<h2 ref={titleRef} tabIndex={-1}>{t("import.step.result")}</h2>
		{commit.phase === "submitting" ? <p role="status">{t("import.committing")}</p> : null}
		{commit.phase === "uncertain" ? <><p role="alert">{t("import.uncertain")}</p><Button onClick={onRetry}>{t("import.retryIdentical")}</Button></> : null}
		{commit.phase === "failed" ? <><p role="alert">{t(commit.failure?.code === "IMPORT_REJECTED" ? "import.rejected" : "import.commitFailed")}</p><Button onClick={onEdit}>{t("import.backMapping")}</Button></> : null}
		{commit.failure ? <div role="alert">{commit.failure.safeMessage ? <p><Bdi>{commit.failure.safeMessage}</Bdi></p> : null}<p>{t(commit.failure.retryable ? "import.retryable" : "import.correctBeforeRetry")}</p>{commit.failure.requestId ? <details><summary>{t("import.errorDetails")}</summary><Identity value={commit.failure.requestId} label={t("import.errorDetails")} /></details> : null}</div> : null}
		{commit.result ? <p role="status" aria-live="polite">{t(commit.result.replayed ? "import.replayed" : "import.completed")} {tx("import.completeCounts", { created: formatCount(commit.result.job.created), updated: formatCount(commit.result.job.updated), skipped: formatCount(commit.result.job.skipped), failed: formatCount(commit.result.job.failed) })}</p> : null}
		{commit.phase === "submitting" || commit.phase === "uncertain" ? <p>{t("import.lockedInputs")}</p> : <Button onClick={onNew}>{t("import.newImport")}</Button>}
		<div className="flex flex-wrap gap-8 mt-12"><Button disabled={loading && view === "history"} onClick={() => { setView("history"); setCursors([null]); setReload((n) => n + 1); }}>{t("import.history")}</Button>{jobId ? <Button onClick={() => setView("ledger")}>{t("import.ledger")}</Button> : null}<Button onClick={() => navigate(job?.object === "lead" ? "/leads" : "/contacts")}>{t("import.returnCrm")}</Button></div>
		{failure ? <div role="alert"><p>{error?.safeMessage ? <Bdi>{error.safeMessage}</Bdi> : t("import.readFailed")}</p>{error?.requestId ? <details><summary>{t("import.errorDetails")}</summary><Identity value={error.requestId} label={t("import.errorDetails")} /></details> : null}<Button onClick={() => setReload((n) => n + 1)}>{t("state.retry")}</Button></div> : null}
		{loading ? <p role="status">{t("import.ledgerLoading")}</p> : null}
		{view === "history" ? <section aria-label={t("import.history")}>
			<h3>{t("import.history")}</h3><p>{tx("import.historyPage", { count: formatCount(history.length), max: formatCount(50) })}</p>
			{!loading && !history.length && !failure ? <p>{t("import.historyEmpty")}</p> : null}
			{history.map((item) => <article key={item.id} className="border border-solid border-border rounded-8 p-12">{metadata(item)}<Button onClick={() => { setJob(item); setJobId(item.id); setPages([0]); setOutcome(""); setView("ledger"); }}>{t("import.viewLedger")}</Button></article>)}
			<div className="flex flex-wrap gap-8 mt-12"><Button disabled={loading || cursors.length === 1} onClick={() => setCursors((previous) => previous.slice(0, -1))}>{t("import.previousPage")}</Button><Button disabled={loading || !nextCursor || cursors.includes(nextCursor)} onClick={() => { if (nextCursor) setCursors((previous) => [...previous, nextCursor]); }}>{t("import.nextPage")}</Button></div>
		</section> : job ? <section aria-label={t("import.ledger")}>
			{metadata(job)}<h3>{t("import.ledger")}</h3>
			<Select label={t("import.outcome")} value={outcome} onChange={(event) => { setOutcome(event.target.value); setPages([0]); }}><option value="">{t("import.allOutcomes")}</option>{(["created", "updated", "skipped", "failed"] as const).map((key) => <option key={key} value={key}>{t(`import.outcome.${key}`)}</option>)}</Select>
			<p>{tx("import.ledgerPage", { count: formatCount(rows.length), max: formatCount(200) })}</p>
			{!loading && !rows.length && !failure ? <p>{t("import.ledgerEmpty")}</p> : null}
			<div className="overflow-x-auto max-w-full"><table className="border-collapse w-full [&_th]:p-10 [&_th]:text-start [&_th]:align-top [&_th]:border-b [&_th]:border-solid [&_th]:border-border [&_td]:p-10 [&_td]:text-start [&_td]:align-top [&_td]:border-b [&_td]:border-solid [&_td]:border-border [&_td]:min-w-[160px] [&_td]:[overflow-wrap:anywhere] [&_caption]:text-start [&_caption]:my-8 [&_caption]:font-[600] max-mobile:block max-mobile:[&_tbody]:block max-mobile:[&_thead]:sr-only max-mobile:[&_tr]:grid max-mobile:[&_tr]:py-8 max-mobile:[&_tr]:border-b max-mobile:[&_tr]:border-solid max-mobile:[&_tr]:border-border max-mobile:[&_th]:block max-mobile:[&_th]:border-0 max-mobile:[&_th]:min-w-0 max-mobile:[&_td]:block max-mobile:[&_td]:border-0 max-mobile:[&_td]:min-w-0 [&_tr:target]:outline-2 [&_tr:target]:outline-border-strong [&_tr:target]:outline-offset-[-2px]"><caption>{t("import.ledger")}</caption><thead><tr><th>{t("import.rowNumber")}</th><th>{t("import.outcome")}</th><th>{t("import.record")}</th></tr></thead><tbody>{rows.map((row) => <tr key={row.row_no}><th scope="row">{formatCount(row.row_no)}</th><td>{t(`import.outcome.${row.outcome}`)}{row.reason ? <p>{reasonText(row.reason)} <Bdi>{row.reason}</Bdi></p> : null}</td><td>{row.record_kind ? t(row.record_kind === "contact" ? "nav.contacts" : "nav.leads") : null} {row.record_id ? <Identity value={row.record_id} /> : null}</td></tr>)}</tbody></table></div>
			<div className="flex flex-wrap gap-8 mt-12"><Button disabled={loading || pages.length === 1} onClick={() => setPages((previous) => previous.slice(0, -1))}>{t("import.previousPage")}</Button><Button disabled={loading || nextAfter === null || pages.includes(nextAfter)} onClick={() => { if (nextAfter !== null) setPages((previous) => [...previous, nextAfter]); }}>{t("import.nextPage")}</Button></div>
		</section> : null}
	</div>;
}
