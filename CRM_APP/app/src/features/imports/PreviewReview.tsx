import { useEffect, useRef } from "react";
import { Bdi, type MessageKey, useI18n } from "../../ui/i18n/index.ts";
import { Button, Select } from "../../ui/primitives/index.ts";
import { serverIssueSuffix } from "../properties/values.ts";
import type { ImportDraft, ImportOptions } from "./model.ts";
import { reviewGate, type PreviewIssue, type PreviewRow } from "./preview.ts";

const STATUS: Record<PreviewRow["status"], MessageKey> = { create: "import.count.create", update: "import.count.update", skip: "import.count.skip", error: "import.count.error" };
const ROW_ERRORS: Record<string, MessageKey> = {
	REQUIRED: "import.row.required", INVALID_EMAIL: "import.row.email", INVALID_PHONE: "import.row.phone", MAX_LENGTH: "import.row.length", INVALID_VALUE: "import.row.value",
	CONTACT_REQUIRED: "import.row.contact", AMBIGUOUS_MATCH: "import.row.ambiguous", INVALID_TYPE: "import.row.type", OPTION_UNKNOWN: "import.row.option", UNKNOWN_PROPERTY: "import.error.target", FIELD_NOT_WRITABLE: "import.error.target",
};
export function rowErrorKey(code: string, field = ""): MessageKey | null {
	if (field.startsWith("properties.")) {
		const suffix = serverIssueSuffix(code);
		if (suffix !== "generic") return `cf.err.${suffix}`;
	}
	return ROW_ERRORS[code] ?? null;
}
export function PreviewReview({ draft, busy, issues, onChange, onPreview, onBack, onPolicy }: {
	draft: ImportDraft; busy: boolean; issues: string[]; onChange: (options: ImportOptions) => void; onPreview: () => void; onBack: () => void; onPolicy: () => void;
}) {
	const { t, tx, formatCount } = useI18n();
	const data = draft.preview?.data;
	const gate = reviewGate(draft, issues);
	const summaryRef = useRef<HTMLElement>(null);
	useEffect(() => { if (data?.summary.error) summaryRef.current?.focus(); }, [data]);
	const issueText = (issue: PreviewIssue) => {
		const key = rowErrorKey(issue.code, issue.field);
		return key ? t(key) : issue.safe_message || t("import.row.unknown");
	};
	const rowTable = (rows: PreviewRow[], errors: boolean) => (
		<div className="sy-import__table-wrap"><table className="sy-import__table"><caption>{t(errors ? "import.errorRows" : "import.previewRows")}</caption><thead><tr><th>{t("import.rowNumber")}</th><th>{t("import.outcome")}</th><th>{t("import.rowDetails")}</th></tr></thead><tbody>
			{rows.map((row) => <tr id={`import-${errors ? "error" : "sample"}-row-${row.row}`} tabIndex={-1} key={row.row}><th scope="row">{formatCount(row.row)}</th><td>{t(STATUS[row.status])}{row.reason ? <p>{t(row.reason === "DUPLICATE" ? "import.reason.duplicate" : row.reason === "DUPLICATE_AMBIGUOUS" ? "import.reason.ambiguous" : row.reason === "NO_CHANGE" ? "import.reason.noChange" : "import.row.unknown")}</p> : null}</td><td>
				{row.errors.map((issue) => <p key={`${issue.field}:${issue.code}`}><Bdi>{issue.field}</Bdi>: <Bdi>{issueText(issue)}</Bdi></p>)}
				{row.warnings.map((warning) => <p key={warning}>{warning.startsWith("FORMULA_LIKE:") ? <>{t("import.formulaWarning")} <Bdi>{warning.slice(13)}</Bdi></> : <>{t("import.warningUnknown")} <Bdi>{warning}</Bdi></>}</p>)}
				<details><summary>{t("import.mappedValues")}</summary>{Object.entries(row.values).map(([target, value]) => <p key={target}><Bdi>{target}</Bdi>: <Bdi>{String(value ?? "").slice(0, 120)}</Bdi></p>)}</details>
			</td></tr>)}
		</tbody></table></div>
	);
	return <div className="sy-import__form">
		<p>{t("import.previewReadOnly")}</p>
		<p>{t(draft.object === "contact" ? "import.match.contact" : "import.match.lead")}</p>
		<p>{t("import.match.file")}</p><p>{t("import.blankPreserves")}</p><p>{t("import.formulaWarning")}</p>
		{draft.step === "policy" ? <>
			<Select label={t("import.duplicatePolicy")} value={draft.options.duplicate_mode} onChange={(event) => onChange({ ...draft.options, duplicate_mode: event.target.value as ImportOptions["duplicate_mode"] })}>
				<option value="skip">{t("import.policy.skip")}</option><option value="update">{t("import.policy.update")}</option><option value="create">{t(draft.object === "contact" ? "import.policy.createContacts" : "import.policy.createLeads")}</option>
			</Select>
			<p>{t(draft.options.duplicate_mode === "skip" ? "import.policy.skipHelp" : draft.options.duplicate_mode === "update" ? "import.policy.updateHelp" : "import.policy.createHelp")}</p>
			<Select label={t("import.invalidPolicy")} value={draft.options.error_policy} onChange={(event) => onChange({ ...draft.options, error_policy: event.target.value as ImportOptions["error_policy"] })}>
				<option value="skip">{t("import.policy.skipErrors")}</option><option value="abort">{t("import.policy.abort")}</option>
			</Select>
			<p>{t("import.atomic")}</p>
		</> : null}
		{issues.length ? <p role="alert">{t("import.inputsInvalid")}</p> : null}
		{busy ? <p role="status">{t("import.previewLoading")}</p> : null}
		{gate === "stale" ? <p role="status">{t("import.previewRequired")}</p> : null}
		<div className="sy-import__actions"><Button variant="primary" loading={busy} disabled={issues.length > 0} onClick={onPreview}>{t(data ? "import.rePreview" : "import.runPreview")}</Button>{busy ? <Button onClick={onBack}>{t("import.cancelPreview")}</Button> : null}</div>
		{data ? <>
			<section ref={summaryRef} tabIndex={-1} className="sy-import__review-summary" aria-label={t("import.summary")}>
				<h3>{t("import.summary")}</h3><p>{tx("import.totalRows", { total: formatCount(data.total_rows) })}</p>
				<dl className="sy-import__counts">{(["create", "update", "skip", "error", "warnings"] as const).map((key) => <div key={key}><dt>{t(key === "warnings" ? "import.count.warnings" : STATUS[key])}</dt><dd>{formatCount(data.summary[key])}</dd></div>)}</dl>
				{data.error_rows.length ? <p>{t("import.correctRows")}: {data.error_rows.map((row) => <a key={row.row} href={`#import-error-row-${row.row}`}>{formatCount(row.row)}{" "}</a>)}</p> : null}
			</section>
			<p>{tx("import.previewSample", { shown: formatCount(data.rows.length), total: formatCount(data.total_rows) })}</p>{rowTable(data.rows, false)}
			<p>{tx("import.errorSample", { shown: formatCount(data.error_rows.length), total: formatCount(data.summary.error) })}</p>
			{data.error_rows_truncated ? <p role="status">{t("import.errorsTruncated")}</p> : null}
			{data.error_rows.length ? rowTable(data.error_rows, true) : null}
			{data.already_imported ? <p>{t("import.priorJob")}: <Bdi>{data.already_imported.job_id}</Bdi></p> : null}
			{gate === "abort" ? <p role="alert">{t("import.abortBlocked")}</p> : gate === "empty" || gate === "invalid" ? <p role="alert">{t("import.noValidRows")}</p> : <p role="status">{t("import.reviewReady")}</p>}
		</> : null}
		<div className="sy-import__actions"><Button onClick={onBack}>{t("import.backMapping")}</Button>{draft.step === "preview" ? <Button disabled={!data || busy} onClick={onPolicy}>{t("import.nextPolicy")}</Button> : <Button disabled>{t("import.commitUnavailable")}</Button>}</div>
	</div>;
}
