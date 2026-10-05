import { useState } from "react";
import { isApiError, isForbidden, isVersionConflict } from "../../api/index.ts";
import {
	Badge,
	Button,
	ForbiddenState,
	Input,
	Ltr,
	Panel,
	Select,
	useI18n,
	useToast,
} from "../../ui/index.ts";
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
};

/** Keyed by lead id + version by the parent: a reload (new version) remounts it with a fresh draft. */
function LeadEditor({ lead, assignees, onUpdated }: EditorProps) {
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
			<div className="sy-leads__actions">
				<Button
					type="submit"
					variant="primary"
					size="sm"
					loading={saving}
					disabled={!dirty}
					data-testid="lead-save"
				>
					{t("leads.edit.save")}
				</Button>
				<Button
					size="sm"
					variant="ghost"
					disabled={!dirty || saving}
					onClick={() => {
						setDraft(draftOf(lead));
						setError(null);
					}}
				>
					{t("leads.edit.revert")}
				</Button>
			</div>
		</form>
	);
}

export function LeadDetail({
	lead,
	assignees,
	onUpdated,
}: {
	lead: LeadRow | null;
	assignees: readonly Assignee[];
	onUpdated: (lead: Lead) => void;
}) {
	const { t, formatDate } = useI18n();
	if (lead === null)
		return (
			<Panel
				as="aside"
				title={t("leads.detail.title")}
				className="sy-leads__detail"
				data-testid="lead-detail-empty"
			>
				<p className="sy-leads__muted">{t("leads.detail.empty")}</p>
			</Panel>
		);
	const notInMvp = (label: string) => t("leads.notInMvp", { label });
	return (
		<Panel
			as="aside"
			title={t("leads.detail.title")}
			className="sy-leads__detail"
			data-testid="lead-detail"
			aria-label={t("leads.detail.title")}
		>
			<div className="sy-leads__head">
				<div>
					<p className="sy-leads__name" data-testid="lead-detail-title">
						{lead.title}
					</p>
					<p className="sy-leads__muted">{lead.contactName}</p>
				</div>
				<Badge tone={STATUS_TONE[lead.status]}>
					{t(STATUS_KEY[lead.status])}
				</Badge>
			</div>
			<div className="sy-leads__actions">
				<Button
					size="sm"
					icon="mail"
					disabled
					aria-label={notInMvp(t("common.email"))}
				>
					{t("common.email")}
				</Button>
				<Button
					size="sm"
					icon="phone"
					disabled
					aria-label={notInMvp(t("common.call"))}
				>
					{t("common.call")}
				</Button>
			</div>
			<LeadEditor
				key={`${lead.id}:${lead.version}`}
				lead={lead}
				assignees={assignees}
				onUpdated={onUpdated}
			/>
			<dl className="sy-leads__facts">
				<dt>{t("common.source")}</dt>
				<dd>{lead.source}</dd>
				<dt>{t("leads.detail.evidence")}</dt>
				<dd>{lead.source_evidence}</dd>
				<dt>{t("common.created")}</dt>
				<dd>
					{formatDate(lead.received_at, {
						dateStyle: "medium",
						timeStyle: "short",
					})}
				</dd>
				<dt>{t("leads.detail.version")}</dt>
				<dd data-testid="lead-version">
					<Ltr>{lead.version}</Ltr>
				</dd>
				<dt>{t("leads.detail.id")}</dt>
				<dd>
					<Ltr>{lead.id}</Ltr>
				</dd>
			</dl>
		</Panel>
	);
}
