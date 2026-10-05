import { useState } from "react";
import { isApiError, isForbidden, isVersionConflict } from "../../api/index.ts";
import {
	Badge,
	Bdi,
	Button,
	ForbiddenState,
	Input,
	RecordEditFooter,
	RecordEmpty,
	RecordPanel,
	Select,
	sourceEvidenceLabel,
	sourceLabel,
	useI18n,
	useToast,
} from "../../ui/index.ts";
import { navigate } from "../../router.ts";
import { dealContextSearch } from "../deals/model.ts";
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

type EditError = null | "conflict" | "forbidden" | "other";

type EditorProps = {
	lead: LeadRow;
	assignees: readonly Assignee[];
	onUpdated: (lead: Lead) => void;
	onDone: () => void;
};

/** Keyed by lead id + version by the parent: a reload (new version) remounts it with a fresh draft. */
function LeadEditor({ lead, assignees, onUpdated, onDone }: EditorProps) {
	const { t } = useI18n();
	const toast = useToast();
	const [draft, setDraft] = useState(() => draftOf(lead));
	const [saving, setSaving] = useState(false);
	const [reloading, setReloading] = useState(false);
	const [error, setError] = useState<EditError>(null);
	const [titleIssue, setTitleIssue] = useState(false);

	const dirty = buildPatchBody(lead, draft, "x") !== null;
	const ownerOptions =
		assignees.some((a) => a.id === lead.owner_id) || !lead.owner_id
			? assignees
			: [...assignees, { id: lead.owner_id, name: lead.ownerName }];

	const save = async () => {
		if (draft.title.trim() === "") {
			setTitleIssue(true);
			return;
		}
		const body = buildPatchBody(lead, draft, crypto.randomUUID());
		if (body === null) return;
		setSaving(true);
		setError(null);
		try {
			const updated = await patchLead(lead.id, body);
			onUpdated(updated);
			toast.notify(t("leads.edit.saved"), "success");
			onDone();
		} catch (e) {
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
			className="sy-leads__form"
			onSubmit={(e) => {
				e.preventDefault();
				void save();
			}}
			noValidate
		>
			{error === "conflict" ? (
				<div
					className="sy-leads__banner"
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
			<RecordEditFooter
				dirty={dirty}
				saving={saving}
				onDiscard={() => {
					setDraft(draftOf(lead));
					setError(null);
				}}
				saveLabel={t("leads.edit.save")}
				discardLabel={t("leads.edit.revert")}
				saveTestId="lead-save"
			/>
		</form>
	);
}

export function LeadDetail({
	lead,
	assignees,
	onUpdated,
	onClose,
}: {
	lead: LeadRow | null;
	assignees: readonly Assignee[];
	onUpdated: (lead: Lead) => void;
	onClose: () => void;
}) {
	const { t, formatDateTime } = useI18n();
	if (lead === null)
		return (
			<RecordEmpty
				label={t("leads.detail.title")}
				hint={t("leads.detail.empty")}
				testId="lead-detail-empty"
			/>
		);
	const evidence = sourceEvidenceLabel(lead.source_evidence, t);
	return (
		<RecordPanel
			label={t("leads.detail.title")}
			testId="lead-detail"
			recordKey={lead.id}
			title={<Bdi>{lead.title}</Bdi>}
			titleTestId="lead-detail-title"
			subtitle={<Bdi>{lead.contactName}</Bdi>}
			chip={
				<Badge tone={STATUS_TONE[lead.status]}>
					{t(STATUS_KEY[lead.status])}
				</Badge>
			}
			onClose={onClose}
			actions={
				<>
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
					onUpdated={onUpdated}
					onDone={done}
				/>
			)}
			details={[
				{ label: t("leads.detail.id"), value: lead.id, copyable: true },
				{
					label: t("leads.detail.version"),
					value: lead.version,
					testId: "lead-version",
				},
			]}
		/>
	);
}
