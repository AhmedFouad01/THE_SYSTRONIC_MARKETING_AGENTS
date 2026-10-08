import { useId, useRef, useState } from "react";
import {
	Button,
	Dialog,
	Input,
	Select,
	Textarea,
	useI18n,
	type MessageKey,
} from "../../ui/index.ts";
import { CustomFieldsEdit, useCustomDraft, useCustomFields, withCreateProperties } from "../properties/index.ts";
import { createLead } from "./api.ts";
import {
	type Assignee,
	buildCreateBody,
	classifyCreateError,
	type CreateErrorKind,
	EMPTY_NEW_LEAD,
	type FieldIssue,
	type KeyMemo,
	keyFor,
	type Lead,
	type NewLeadErrors,
	type NewLeadField,
	type NewLeadInput,
	validateNewLead,
} from "./model.ts";

const ISSUE_KEY: Record<FieldIssue, MessageKey> = {
	required: "leads.issue.required",
	tooLong: "leads.issue.tooLong",
	phone: "leads.issue.phone",
	email: "leads.issue.email",
};
const ERROR_KEY: Record<CreateErrorKind, MessageKey> = {
	validation: "leads.err.validation",
	assignment: "leads.err.assignment",
	conflict: "leads.err.conflict",
	forbidden: "leads.err.forbidden",
	network: "leads.err.network",
	other: "leads.err.other",
};

function NewLeadForm({
	assignees,
	formId,
	onCreated,
	onBusy,
}: {
	assignees: readonly Assignee[];
	formId: string;
	onCreated: (lead: Lead) => void;
	onBusy: (busy: boolean) => void;
}) {
	const { t } = useI18n();
	const [input, setInput] = useState<NewLeadInput>(EMPTY_NEW_LEAD);
	const [touched, setTouched] = useState(false);
	const [serverError, setServerError] = useState<CreateErrorKind | null>(null);
	const cf = useCustomFields("lead", "leads", null, null);
	const custom = useCustomDraft(cf, "create");
	const memo = useRef<KeyMemo | null>(null);
	const errors: NewLeadErrors = touched ? validateNewLead(input) : {};
	const set = (patch: Partial<NewLeadInput>) => {
		setServerError(null);
		setInput((p) => ({ ...p, ...patch }));
	};
	const err = (f: NewLeadField) =>
		errors[f] ? t(ISSUE_KEY[errors[f]]) : undefined;

	const submit = async () => {
		setTouched(true);
		if (Object.keys(validateNewLead(input)).length > 0) return;
		if (cf.status === "loading") return;
		const c = custom.prepare();
		if (!c.ok) return;
		memo.current = keyFor(memo.current, input, () => crypto.randomUUID(), c.patch);
		const key = memo.current.key;
		onBusy(true);
		setServerError(null);
		try {
			onCreated(await createLead(withCreateProperties(buildCreateBody(input, key), c.patch), key));
		} catch (e) {
			if (custom.fail(e)) return;
			setServerError(classifyCreateError(e));
		} finally {
			onBusy(false);
		}
	};

	return (
		<form
			id={formId}
			className="sy-leads__form flex flex-col gap-10"
			noValidate
			onSubmit={(e) => {
				e.preventDefault();
				void submit();
			}}
		>
			{serverError ? (
				<p
					className="sy-leads__banner m-0 p-10 rounded-8 bg-info-bg text-info-fg [&_p]:m-0 [&_p]:mt-4 [&_p]:mb-8"
					role="alert"
					data-testid="new-lead-error"
				>
					{t(ERROR_KEY[serverError])}
				</p>
			) : null}
			<Input
				label={t("leads.field.title")}
				name="title"
				required
				value={input.title}
				maxLength={160}
				error={err("title")}
				data-autofocus
				onChange={(e) => set({ title: e.target.value })}
			/>
			<Input
				label={t("leads.new.name")}
				name="contactName"
				required
				value={input.contactName}
				maxLength={160}
				error={err("contactName")}
				onChange={(e) => set({ contactName: e.target.value })}
			/>
			<div className="sy-form-row">
			<Input
				label={t("leads.new.phone")}
				name="phone"
				type="tel"
				dir="ltr"
				value={input.phone}
				error={err("phone")}
				onChange={(e) => set({ phone: e.target.value })}
			/>
			<Input
				label={t("leads.new.email")}
				name="email"
				type="email"
				dir="ltr"
				value={input.email}
				error={err("email")}
				onChange={(e) => set({ email: e.target.value })}
			/>
			</div>
			<Textarea
				label={t("leads.new.evidence")}
				name="evidence"
				required
				hint={t("leads.new.evidenceHint")}
				value={input.evidence}
				maxLength={500}
				error={err("evidence")}
				onChange={(e) => set({ evidence: e.target.value })}
			/>
			<Select
				label={t("leads.new.owner")}
				name="owner"
				value={input.ownerId}
				onChange={(e) => set({ ownerId: e.target.value })}
			>
				<option value="">{t("leads.new.ownerMe")}</option>
				{assignees.map((a) => (
					<option key={a.id} value={a.id}>
						{a.name}
					</option>
				))}
			</Select>
			<CustomFieldsEdit cf={cf} draft={custom} mode="create" />
		</form>
	);
}

export function NewLeadDialog({
	open,
	onClose,
	assignees,
	onCreated,
}: {
	open: boolean;
	onClose: () => void;
	assignees: readonly Assignee[];
	onCreated: (lead: Lead) => void;
}) {
	const { t } = useI18n();
	const formId = useId();
	const [busy, setBusy] = useState(false);
	return (
		<Dialog
			open={open}
			onClose={() => {
				if (!busy) onClose();
			}}
			title={t("leads.new.title")}
			testId="new-lead-dialog"
			footer={
				<>
					<Button onClick={onClose} disabled={busy}>
						{t("common.cancel")}
					</Button>
					<Button
						type="submit"
						form={formId}
						variant="primary"
						loading={busy}
						data-testid="new-lead-submit"
					>
						{t("leads.new.create")}
					</Button>
				</>
			}
		>
			<NewLeadForm
				assignees={assignees}
				formId={formId}
				onBusy={setBusy}
				onCreated={onCreated}
			/>
		</Dialog>
	);
}
