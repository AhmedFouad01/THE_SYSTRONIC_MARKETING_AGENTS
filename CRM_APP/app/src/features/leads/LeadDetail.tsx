import { ContactChannels, protectedFacts, ContactFieldsEdit, useContactFieldDraft } from "../contacts/ContactFields.tsx";
import { useState } from "react";
import { isApiError, isForbidden, isVersionConflict, useIsAdmin } from "../../api/index.ts";
import {
	Badge,
	Bdi,
	Button,
	ForbiddenState,
	Input,
	PreviewPanel,
	RecordEditFooter,
	RecordPanel,
	type RecordPreview,
	Select,
	sourceEvidenceLabel,
	sourceLabel,
	useI18n,
	useToast,
} from "../../ui/index.ts";
import { navigate } from "../../router.ts";
import { dealContextSearch } from "../deals/model.ts";
import { type CustomFields, CustomFieldsEdit, CustomFieldsRead, useCustomDraft, useCustomFields, withProperties } from "../properties/index.ts";
import { AddTaskButton } from "../tasks/index.ts";
import { fetchLead, patchLead } from "./api.ts";
import { STATUS_KEY, STATUS_TONE } from "./labels.ts";
import {
	buildPatchBody,
	draftOf,
	LEAD_STATUSES,
	type Assignee,
	type Lead,
	type LeadRow,
	type LeadStatus,
} from "./model.ts";

type EditError = null | "conflict" | "forbidden" | "other" | "contactRequired";

type EditorProps = {
	lead: LeadRow;
	assignees: readonly Assignee[];
	cf: CustomFields;
	onUpdated: (lead: Lead) => void;
	onDone: () => void;
};

/** Keyed by lead id + version by the parent: a reload (new version) remounts it with a fresh draft. */
function LeadEditor({ lead, assignees, cf, onUpdated, onDone }: EditorProps) {
	const { t } = useI18n();
	const toast = useToast();
	const [draft, setDraft] = useState(() => draftOf(lead));
	const [saving, setSaving] = useState(false);
	const [reloading, setReloading] = useState(false);
	const [error, setError] = useState<EditError>(null);
	const [titleIssue, setTitleIssue] = useState(false);

	const fields = useContactFieldDraft(lead, false);
	const custom = useCustomDraft(cf, "edit");
	const contactRequired = lead.sensitive_masked === false
		? !fields.draft.email?.trim() && !fields.draft.phone?.trim()
		: lead.missing_contact === true;
	const dirty = buildPatchBody(lead, draft, "x") !== null || custom.dirty || fields.dirty;
	const ownerOptions =
		assignees.some((a) => a.id === lead.owner_id) || !lead.owner_id
			? assignees
			: [...assignees, { id: lead.owner_id, name: lead.ownerName }];

	const save = async () => {
		if (draft.title.trim() === "") {
			setTitleIssue(true);
			return;
		}
		if (fields.errors.length) return;
		if (contactRequired) {setError("contactRequired"); return;}
		const c = custom.prepare();
		if (!c.ok) return;
		const id = crypto.randomUUID();
		const body = withProperties(fields.patch(buildPatchBody(lead, draft, id),id), c.patch, { commandId: id, version: lead.version });
		if (body === null) return;
		setSaving(true);
		setError(null);
		try {
			const updated = await patchLead(lead.id, body);
			onUpdated(updated);
			toast.notify(t("leads.edit.saved"), "success");
			onDone();
		} catch (e) {
			if (custom.fail(e)) return;
			if (isApiError(e) && e.code === "CONTACT_REQUIRED") {setError("contactRequired");return;}
			setError(
				isVersionConflict(e)
					? "conflict"
					: isForbidden(e)
						? "forbidden"
						: "other",
			);
			if (!isVersionConflict(e) && !isForbidden(e))
				toast.notify(
					isApiError(e) && e.safeMessage
						? e.safeMessage
						: t("leads.edit.failed"),
					"error",
				);
		} finally {
			setSaving(false);
		}
	};

	const reload = async () => {
		setReloading(true);
		try {
			onUpdated(await fetchLead(lead.id));
		} catch {
			toast.notify(t("leads.edit.failed"), "error");
		} finally {
			setReloading(false);
		}
	};

	return (
		<form
			className="sy-leads__form flex flex-col gap-10"
			onSubmit={(e) => {
				e.preventDefault();
				void save();
			}}
			noValidate
		>
			{error === "conflict" ? (
				<div
					className="sy-leads__banner m-0 p-10 rounded-8 bg-info-bg text-info-fg [&_p]:m-0 [&_p]:mt-4 [&_p]:mb-8"
					role="alert"
					data-testid="lead-conflict"
				>
					<b>{t("leads.conflict.title")}</b>
					<p>{t("leads.conflict.body")}</p>
					<Button
						size="sm"
						variant="primary"
						loading={reloading}
						onClick={() => void reload()}
						data-testid="lead-reload"
					>
						{t("leads.conflict.reload")}
					</Button>
				</div>
			) : null}
			{error === "forbidden" ? (
				<div data-testid="lead-forbidden">
					<ForbiddenState
						title={t("leads.forbidden.title")}
						hint={t("leads.forbidden.body")}
					/>
				</div>
			) : null}
			<Input
				label={t("leads.field.title")}
				value={draft.title}
				maxLength={160}
				error={
					titleIssue && draft.title.trim() === ""
						? t("leads.edit.titleRequired")
						: undefined
				}
				onChange={(e) => {
					setTitleIssue(false);
					setDraft({ ...draft, title: e.target.value });
				}}
				name="title"
			/>
			<Select
				label={t("leads.field.status")}
				value={draft.status}
				onChange={(e) =>
					setDraft({ ...draft, status: e.target.value as LeadStatus })
				}
				name="status"
			>
				{LEAD_STATUSES.map((s) => (
					<option key={s} value={s}>
						{t(STATUS_KEY[s])}
					</option>
				))}
			</Select>
			<Select
				label={t("leads.field.owner")}
				value={draft.ownerId}
				onChange={(e) => setDraft({ ...draft, ownerId: e.target.value })}
				name="owner"
			>
				{lead.owner_id ? null : (
					<option value="">{t("common.unassigned")}</option>
				)}
				{ownerOptions.map((a) => (
					<option key={a.id} value={a.id}>
						{a.name}
					</option>
				))}
			</Select>
			{error === "contactRequired" ? <p role="alert">{t("leads.contact.required")}</p> : null}
			<ContactFieldsEdit fields={fields} masked={lead.sensitive_masked !== false} />
			<CustomFieldsEdit cf={cf} draft={custom} mode="edit" />
			<RecordEditFooter
				dirty={dirty}
				saving={saving}
				saveLabel={t("leads.edit.save")}
				saveTestId="lead-save"
			/>
		</form>
	);
}

export function LeadDetail({
	lead,
	state,
	assignees,
	onUpdated,
	onClose,
	preview,
}: {
	lead: LeadRow | null;
	/** Why there is no record yet: still fetching by id, or the id does not exist / is not visible. */
	state: "loading" | "missing";
	assignees: readonly Assignee[];
	onUpdated: (lead: Lead) => void;
	onClose: () => void;
	preview: RecordPreview;
}) {
	const { t, formatDateTime } = useI18n();
	const isAdmin = useIsAdmin();
	const cf = useCustomFields("lead", "leads", lead?.id ?? null, lead?.version ?? null);
	if (lead === null)
		return (
			<PreviewPanel
				label={t("leads.detail.title")}
				testId="lead-detail"
				onClose={onClose}
				{...(preview.returnFocus ? { returnFocus: preview.returnFocus } : {})}
			>
				<p className="sy-record__muted m-0 mt-4 text-data text-text-3" role="status" data-testid={`lead-detail-${state}`}>
					{state === "loading" ? t("preview.loading") : t("preview.missing")}
				</p>
			</PreviewPanel>
		);
	const evidence = sourceEvidenceLabel(lead.source_evidence, t);
	return (
		<RecordPanel
			label={t("leads.detail.title")}
			testId="lead-detail"
			recordKey={lead.id}
			heading={lead.title}
			preview={preview}
			title={lead.title}
			titleTestId="lead-detail-title"
			subtitle={lead.contactName}
			chip={
				<Badge tone={STATUS_TONE[lead.status]}>
					{t(STATUS_KEY[lead.status])}
				</Badge>
			}
			onClose={onClose}
			actions={
				<>
					<ContactChannels record={lead}/>
					<Button
						size="sm"
						variant="primary"
						icon="deals"
						data-testid="lead-create-deal"
						onClick={() =>
							navigate(
								"/deals",
								dealContextSearch({
									contactId: lead.contact_id,
									leadId: lead.id,
									dealId: null,
								}),
							)
						}
					>
						{t("deals.action.create")}
					</Button>
					<AddTaskButton
						contactId={lead.contact_id}
						dealId={null}
						label={lead.contactName}
					/>
				</>
			}
			facts={[
				...protectedFacts(lead, false, t),
				{ label: t("leads.field.owner"), value: <Bdi>{lead.ownerName}</Bdi> },
				{ label: t("common.source"), value: sourceLabel(lead.source, t) },
				{
					label: t("common.created"),
					value: <Bdi>{formatDateTime(lead.received_at)}</Bdi>,
				},
				...(evidence !== null
					? [{ label: t("leads.detail.evidence"), value: <Bdi>{evidence}</Bdi> }]
					: []),
			]}
			editor={(done) => (
				<LeadEditor
					key={`${lead.id}:${lead.version}`}
					lead={lead}
					assignees={assignees}
					cf={cf}
					onUpdated={onUpdated}
					onDone={done}
				/>
			)}
			details={
				isAdmin
					? [
				{ label: t("leads.detail.id"), value: lead.id, copyable: true },
				{
					label: t("leads.detail.version"),
					value: lead.version,
					testId: "lead-version",
				},
					]
					: undefined
			}
		>
			{lead.missing_contact ? <p role="status">{t("leads.contact.missing")}</p> : null}
			<CustomFieldsRead cf={cf} />
		</RecordPanel>
	);
}
