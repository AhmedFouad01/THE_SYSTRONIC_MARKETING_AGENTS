import { useCallback, useEffect, useRef, useState } from "react";
import { isApiError, useSession } from "../../api/index.ts";
import { workspaceKey } from "../../api/workspaces.ts";
import { navigate } from "../../router.ts";
import { Bdi, type MessageKey, useI18n } from "../../ui/i18n/index.ts";
import { Button, Input, LoadingState, PageHeader, Panel, Select } from "../../ui/primitives/index.ts";
import { fetchAssignees } from "../leads/api.ts";
import type { Assignee } from "../leads/model.ts";
import { bytesToBase64, fetchImportFields, inspectUpload, previewImport } from "./api.ts";
import { importDraftStore } from "./draft.ts";
import { changeDraft, cleanFilename, fileFormat, fileIssue, type ImportDraft, type ImportFields, type ImportObject, mappingIssues, optionIssues, sampleText, setColumn, sheetOption, type Target } from "./model.ts";
import { createPreviewGate } from "./preview.ts";
import { PreviewReview } from "./PreviewReview.tsx";
import type { ApiError } from "../../api/errors.ts";
import "./imports.css";

const FIXED_LABELS: Record<string, MessageKey> = {
	display_name: "import.target.displayName", title: "import.target.title", contact_name: "import.target.contactName",
	email: "common.email", phone: "common.phone", source_evidence: "import.target.evidence",
};
const ERRORS: Record<string, MessageKey> = {
	EMPTY_FILE: "import.error.empty", FILE_TOO_LARGE: "import.error.fileSize", TOO_MANY_ROWS: "import.error.rows", TOO_MANY_COLUMNS: "import.error.columns",
	CELL_TOO_LONG: "import.error.cell", FORMAT_MISMATCH: "import.error.format", CSV_MALFORMED: "import.error.csv", INVALID_ENCODING: "import.error.encoding",
	UNSUPPORTED_ENCODING: "import.error.encoding", NOT_TEXT: "import.error.encoding", NOT_XLSX: "import.error.xlsx", SHEET_NOT_FOUND: "import.error.sheet",
	INVALID_SHEET: "import.error.sheet", DUPLICATE_TARGET: "import.error.duplicate", UNKNOWN_TARGET: "import.error.target", REQUIRED_TARGET: "import.error.required",
	COLUMN_OUT_OF_RANGE: "import.error.columnRange", INVALID_COUNTRY: "import.error.country", INVALID_OWNER: "import.error.owner", HEADER_MISSING: "import.error.header", INVALID_POLICY: "import.error.policy", UNKNOWN_PROPERTY: "import.error.target", FIELD_NOT_WRITABLE: "import.error.target",
};

export function ImportWizard() {
	const { t, tx, locale, formatCount, formatNumber } = useI18n();
	const session = useSession();
	const actor = session.info?.actor ?? "";
	const workspace = session.workspace;
	const scope = workspace ? workspaceKey(actor, workspace) : "";
	const [draft, setDraft] = useState(() => importDraftStore.open(scope));
	const [fields, setFields] = useState<ImportFields | null>(null);
	const [gate, setGate] = useState<"loading" | "ready" | "denied" | "error">("loading");
	const [owners, setOwners] = useState<Assignee[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [requestId, setRequestId] = useState<string | null>(null);
	const [processing, setProcessing] = useState(false);
	const [previewing, setPreviewing] = useState(false);
	const [apiFailure, setApiFailure] = useState<ApiError | null>(null);
	const draftRef = useRef(draft);
	const previewGate = useRef(createPreviewGate());
	const previewController = useRef<AbortController | null>(null);
	const fieldsController = useRef<AbortController | null>(null);
	const uploadController = useRef<AbortController | null>(null);
	const uploadAttempt = useRef(0);
	const errorSummary = useRef<HTMLDivElement>(null);
	const update = (change: Partial<ImportDraft>) => {
		const next = changeDraft(draftRef.current, change);
		if (next.revision !== draftRef.current.revision) {
			previewGate.current.invalidate();
			previewController.current?.abort();
			setPreviewing(false);
		}
		draftRef.current = next;
		importDraftStore.save(scope, next);
		setDraft(next);
	};
	const loadFields = useCallback(() => {
		fieldsController.current?.abort();
		const controller = new AbortController();
		fieldsController.current = controller;
		setFields(null);
		setOwners([]);
		setGate("loading");
		const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]);
		fetchImportFields(draft.object, signal).then((targets) => {
			if (controller.signal.aborted) return;
			setFields(targets);
			setGate("ready");
			return fetchAssignees(signal).then((available) => { if (!controller.signal.aborted) setOwners(available); }).catch(() => undefined);
		}).catch((failure: unknown) => {
			if (!controller.signal.aborted) setGate(isApiError(failure) && failure.kind === "forbidden" ? "denied" : "error");
		});
	}, [draft.object]);
	useEffect(() => {
		loadFields();
		return () => fieldsController.current?.abort();
	}, [loadFields]);
	useEffect(() => () => { uploadAttempt.current++; uploadController.current?.abort(); previewGate.current.invalidate(); previewController.current?.abort(); }, []);
	useEffect(() => { if (error) errorSummary.current?.focus(); }, [error]);
	const resetInspection = (change: Partial<ImportDraft>) => {
		uploadAttempt.current++;
		uploadController.current?.abort();
		setProcessing(false);
		setError(null);
		setRequestId(null);
		setApiFailure(null);
		update({ ...change, inspection: null, mapping: [], step: "upload" });
	};
	const chooseFile = (file: File | undefined) => {
		if (!fields || gate !== "ready" || !file) return;
		const issue = fileIssue(file, fields);
		resetInspection({ file: issue ? null : file, file_base64: null, options: { ...draft.options, sheet: "1" } });
		if (issue) setError(issue);
	};
	const inspect = async () => {
		if (!fields || !draft.file || processing) return;
		const issue = fileIssue(draft.file, fields);
		if (issue) { setError(issue); return; }
		try { if (fileFormat(draft.file.name) === "xlsx") sheetOption(draft.options.sheet); }
		catch { setError("INVALID_SHEET"); return; }
		const attempt = ++uploadAttempt.current;
		const controller = new AbortController();
		uploadController.current?.abort();
		uploadController.current = controller;
		setProcessing(true);
		setError(null);
		setRequestId(null);
		setApiFailure(null);
		try {
			const encoded = draft.file_base64 ?? bytesToBase64(new Uint8Array(await draft.file.arrayBuffer()));
			if (attempt !== uploadAttempt.current || controller.signal.aborted) return;
			const next = { ...draft, file_base64: encoded };
			update({ file_base64: encoded });
			const inspection = await inspectUpload(next, fields, AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]));
			if (attempt === uploadAttempt.current && !controller.signal.aborted) update({ inspection });
		} catch (failure) {
			if (attempt !== uploadAttempt.current || controller.signal.aborted) return;
			setError(isApiError(failure) ? failure.code : "INVALID_IMPORT_RESPONSE");
			setRequestId(isApiError(failure) ? failure.requestId : null);
			setApiFailure(isApiError(failure) ? failure : null);
			if (isApiError(failure) && failure.kind === "forbidden") setGate("denied");
		} finally {
			if (attempt === uploadAttempt.current && !controller.signal.aborted) setProcessing(false);
		}
	};
	const cancelPreview = () => { previewGate.current.invalidate(); previewController.current?.abort(); setPreviewing(false); };
	const runPreview = async () => {
		if (!fields || previewing || !draftRef.current.inspection) return;
		const current = draftRef.current;
		if (mappingIssues(current.mapping, current.inspection?.headers.length ?? 0, fields).length || optionIssues(current.options, owners.map((owner) => owner.id)).length) return;
		const ticket = previewGate.current.begin(current.revision);
		const controller = new AbortController();
		previewController.current?.abort();
		previewController.current = controller;
		update({ preview: null, step: current.step === "policy" ? "policy" : "preview" });
		setPreviewing(true); setError(null); setRequestId(null); setApiFailure(null);
		try {
			const preview = await previewImport(current, fields, AbortSignal.any([controller.signal, AbortSignal.timeout(30_000)]));
			if (!controller.signal.aborted && previewGate.current.accepts(ticket, draftRef.current.revision)) update({ preview });
		} catch (failure) {
			if (controller.signal.aborted || !previewGate.current.accepts(ticket, draftRef.current.revision)) return;
			setError(isApiError(failure) ? failure.code : "INVALID_IMPORT_RESPONSE");
			setRequestId(isApiError(failure) ? failure.requestId : null);
			setApiFailure(isApiError(failure) ? failure : null);
			if (isApiError(failure) && failure.kind === "forbidden") setGate("denied");
		} finally {
			if (previewGate.current.accepts(ticket, draftRef.current.revision)) setPreviewing(false);
		}
	};
	const targetLabel = (target: Target): string => FIXED_LABELS[target.target] ? t(FIXED_LABELS[target.target]) : typeof target.label === "string" ? target.label : target.label[locale] ?? target.label.en ?? target.label.ar ?? target.target;
	const errorText = (code: string): string => t(ERRORS[code] ?? (code.startsWith("REQUIRED_TARGET_") ? "import.error.required" : code.startsWith("ZIP_") || code === "XML_DTD_FORBIDDEN" ? "import.error.archive" : "error.generic"));
	const ownerIds = owners.map((owner) => owner.id);
	const inspection = draft.inspection;
	const issues = fields && inspection ? [...mappingIssues(draft.mapping, inspection.headers.length, fields), ...optionIssues(draft.options, ownerIds)] : [];
	const columns = inspection?.headers.map((header, column) => ({ header, column })) ?? [];
	if (gate === "loading") return <LoadingState label={t("import.loadingFields")} />;
	if (gate !== "ready" || !fields || !workspace || workspace.grantId) return (
		<Panel title={t("nav.import")}>
			<p role="alert">{t(gate === "denied" || workspace?.grantId ? "import.denied" : "import.fieldsFailed")}</p>
			{gate === "error" ? <Button onClick={loadFields}>{t("state.retry")}</Button> : null}
			<Button onClick={() => navigate("/contacts")}>{t("import.returnCrm")}</Button>
		</Panel>
	);
	return (
		<div className="sy-import" data-testid="import-wizard">
			<PageHeader title={t("nav.import")} subtitle={tx("import.progress", { step: formatCount(draft.step === "upload" ? 1 : draft.step === "mapping" ? 2 : draft.step === "preview" ? 3 : 4), total: formatCount(5) })} />
			<p className="sy-import__workspace">{t("workspace.label")}: <Bdi>{workspace.tenantId}</Bdi></p>
			{error ? <div ref={errorSummary} tabIndex={-1} className="sy-import__error" role="alert"><p>{errorText(error)}</p>{apiFailure?.safeMessage ? <p><Bdi>{apiFailure.safeMessage}</Bdi></p> : null}{apiFailure ? <p>{t(apiFailure.retryable ? "import.retryable" : "import.correctBeforeRetry")}</p> : null}{apiFailure?.issues.map((issue) => <p key={`${issue.field}:${issue.code}`}><Bdi>{issue.field}</Bdi>: {errorText(issue.code)}</p>)}{requestId ? <details><summary>{t("import.errorDetails")}</summary><Bdi>{requestId}</Bdi></details> : null}</div> : null}
			{draft.step === "upload" ? <Panel title={t("import.step.upload")}>
				<div className="sy-import__form">
					<Select label={t("import.object")} value={draft.object} disabled={processing} onChange={(event) => {
						resetInspection({ ...newUpload(event.target.value as ImportObject), options: { ...draft.options, sheet: "1" } });
					}}>
						<option value="contact">{t("nav.contacts")}</option><option value="lead">{t("nav.leads")}</option>
					</Select>
					<p>{tx("import.limits", { mib: formatNumber(fields.limits.fileBytes / 1024 / 1024), rows: formatCount(fields.limits.rows), columns: formatCount(fields.limits.columns) })}</p>
					<section className="sy-import__drop" aria-label={t("import.drop")} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); if (!processing) chooseFile(event.dataTransfer.files[0]); }}>
						<Input label={t("import.chooseFile")} type="file" accept={fields.formats.map((format) => `.${format}`).join(",")} disabled={processing} onChange={(event) => chooseFile(event.target.files?.[0])} />
						<p>{t("import.drop")}</p>
					</section>
					{draft.file ? <p><Bdi>{inspection?.file.name ?? cleanFilename(draft.file.name)}</Bdi> · {formatNumber(draft.file.size / 1024)} {t("import.kib")}</p> : <p>{t("import.empty")}</p>}
					{draft.file && fileFormat(draft.file.name) === "xlsx" ? <Input label={t("import.sheet")} hint={t("import.sheetHint")} value={draft.options.sheet} disabled={processing} onChange={(event) => resetInspection({ options: { ...draft.options, sheet: event.target.value } })} /> : null}
					<Input label={t("import.country")} hint={t("import.countryHint")} value={draft.options.default_country_code} disabled={processing} dir="ltr" onChange={(event) => update({ options: { ...draft.options, default_country_code: event.target.value } })} />
					<Select label={t("common.owner")} value={draft.options.owner_id} disabled={processing} onChange={(event) => update({ options: { ...draft.options, owner_id: event.target.value } })}>
						<option value="">{t("import.ownerDefault")}</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
					</Select>
					{processing ? <p role="status">{t("import.loading")}</p> : null}
					{inspection ? <p>{tx("import.sampleCount", { shown: formatCount(inspection.samples.length), total: formatCount(inspection.total_rows) })}</p> : null}
					<div className="sy-import__actions"><Button disabled={!draft.file} loading={processing} onClick={() => void inspect()}>{t("import.inspect")}</Button><Button variant="primary" disabled={!inspection || processing || optionIssues(draft.options, ownerIds).length > 0} onClick={() => update({ step: "mapping" })}>{t("import.nextMapping")}</Button></div>
					{optionIssues(draft.options, ownerIds).map((issue) => <p key={issue} role="alert">{errorText(issue)}</p>)}
				</div>
			</Panel> : draft.step === "mapping" && inspection ? <Panel title={t("import.step.mapping")}>
				<p><Bdi>{inspection.file.name}</Bdi></p>
				<p>{tx("import.sampleCount", { shown: formatCount(inspection.samples.length), total: formatCount(inspection.total_rows) })}</p>
				<p>{t("import.sampleHint")}</p>
				<div className="sy-import__table-wrap"><table className="sy-import__table"><caption>{t("import.mappingCaption")}</caption><thead><tr><th>{t("import.column")}</th><th>{t("import.samples")}</th><th>{t("import.target")}</th></tr></thead><tbody>
					{columns.map(({ header, column }) => {
						const selected = draft.mapping.find((item) => item.column === column)?.target ?? "";
						const target = fields.targets.find((item) => item.target === selected);
						return <tr key={column}><th scope="row">{formatCount(column + 1)} · <Bdi>{header}</Bdi></th><td>{inspection.samples.map((sample) => <p key={sample.row}><Bdi>{sampleText(sample.cells[column] ?? null).slice(0, 120)}</Bdi></p>)}</td><td>
							<Select label={`${t("import.column")} ${formatCount(column + 1)}`} value={selected} onChange={(event) => update({ mapping: setColumn(draft.mapping, column, event.target.value) })}>
								<option value="">{t("import.ignore")}</option>{fields.targets.map((field) => <option key={field.target} value={field.target} disabled={draft.mapping.some((item) => item.target === field.target && item.column !== column)}>{targetLabel(field)}{field.required ? ` (${t("import.required")})` : ""}</option>)}
							</Select>
							{target?.property_required ? <p>{t("import.propertyRequired")}</p> : null}
							{target?.type ? <p>{t(typeHint(target.type))}</p> : null}
							{target?.options?.length ? <p>{t("import.allowedOptions")}: {target.options.map((option) => <span key={option}><Bdi>{option}</Bdi>{" "}</span>)}</p> : null}
						</td></tr>;
					})}
				</tbody></table></div>
				{issues.map((issue) => <p key={issue} role="alert">{errorText(issue)}</p>)}
				{!issues.length ? <p role="status">{t("import.mappingReady")}</p> : null}
				<div className="sy-import__actions"><Button onClick={() => update({ step: "upload" })}>{t("import.backUpload")}</Button><Button variant="primary" disabled={issues.length > 0} loading={previewing} onClick={() => void runPreview()}>{t("import.runPreview")}</Button></div>
			</Panel> : <Panel title={t(draft.step === "policy" ? "import.step.policy" : "import.step.preview")}>
				<PreviewReview draft={draft} busy={previewing} issues={issues} onChange={(options) => update({ options })} onPreview={() => void runPreview()} onBack={() => { cancelPreview(); setError(null); update({ step: "mapping" }); }} onPolicy={() => update({ step: "policy" })} />
			</Panel>}
		</div>
	);
}
function newUpload(object: ImportObject): Partial<ImportDraft> { return { object, file: null, file_base64: null }; }
function typeHint(type: string): MessageKey {
	return ({ currency: "import.hint.currency", date: "import.hint.date", datetime: "import.hint.datetime", checkbox: "import.hint.checkbox", multi_select: "import.hint.multiSelect", number: "import.hint.number" } as Record<string, MessageKey>)[type] ?? "import.hint.text";
}
