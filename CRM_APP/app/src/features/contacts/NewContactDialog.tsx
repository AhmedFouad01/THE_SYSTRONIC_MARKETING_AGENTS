import { useId, useRef, useState } from "react";
import {
	Button,
	Dialog,
	Input,
	type MessageKey,
	Select,
	useI18n,
} from "../../ui/index.ts";
import { CustomFieldsEdit, useCustomDraft, useCustomFields, withCreateProperties } from "../properties/index.ts";
import { createContact } from "./api.ts";
import {
	type Assignee,
	buildCreateContactBody,
	type Contact,
	type CreateContactError,
	classifyCreateContactError,
	EMPTY_NEW_CONTACT,
	type NewContactInput,
	validateNewContact,
} from "./model.ts";

const ERROR_KEY: Record<CreateContactError, MessageKey> = {
	validation: "contacts.new.err.validation",
	assignment: "contacts.new.err.assignment",
	forbidden: "contacts.new.err.forbidden",
	network: "contacts.new.err.network",
	other: "contacts.new.err.other",
};

function NewContactForm({
	assignees,
	formId,
	onCreated,
	onBusy,
}: {
	assignees: readonly Assignee[];
	formId: string;
	onCreated: (c: Contact) => void;
	onBusy: (busy: boolean) => void;
}) {
	const { t } = useI18n();
	const [input, setInput] = useState<NewContactInput>(EMPTY_NEW_CONTACT);
	const [touched, setTouched] = useState(false);
	const [serverError, setServerError] = useState<CreateContactError | null>(null);
	// One idempotency key per distinct payload: a retry after a network failure replays, an edit starts afresh.
	const cf = useCustomFields("contact", "contacts", null, null);
	const custom = useCustomDraft(cf, "create");
	const memo = useRef<{ fingerprint: string; key: string } | null>(null);
	const errors = touched ? validateNewContact(input) : {};
	const set = (patch: Partial<NewContactInput>) => {
		setServerError(null);
		setInput((p) => ({ ...p, ...patch }));
	};

	const submit = async () => {
		setTouched(true);
		if (Object.keys(validateNewContact(input)).length > 0) return;
		if (cf.status === "loading") return;
		const c = custom.prepare();
		if (!c.ok) return;
		const fingerprint = JSON.stringify([buildCreateContactBody(input, ""), c.patch]);
		if (memo.current?.fingerprint !== fingerprint)
			memo.current = { fingerprint, key: crypto.randomUUID() };
		const key = memo.current.key;
		onBusy(true);
		setServerError(null);
		try {
			onCreated(await createContact(withCreateProperties(buildCreateContactBody(input, key), c.patch), key));
		} catch (e) {
			if (custom.fail(e)) return;
			setServerError(classifyCreateContactError(e));
		} finally {
			onBusy(false);
		}
	};

	return (
		<form
			id={formId}
			className="sy-contacts__form"
			noValidate
			onSubmit={(e) => {
				e.preventDefault();
				void submit();
			}}
		>
			{serverError ? (
				<p className="sy-contacts__banner" role="alert" data-testid="new-contact-error">
					{t(ERROR_KEY[serverError])}
				</p>
			) : null}
			<Input
				label={t("contacts.new.name")}
				name="name"
				required
				value={input.name}
				maxLength={160}
				error={errors.name ? t("contacts.edit.nameRequired") : undefined}
				data-autofocus
				onChange={(e) => set({ name: e.target.value })}
			/>
			<div className="sy-form-row">
				<Input
					label={t("contacts.new.phone")}
					name="phone"
					type="tel"
					dir="ltr"
					value={input.phone}
					error={errors.phone ? t("contacts.issue.phone") : undefined}
					onChange={(e) => set({ phone: e.target.value })}
				/>
				<Input
					label={t("contacts.new.email")}
					name="email"
					type="email"
					dir="ltr"
					value={input.email}
					error={errors.email ? t("contacts.issue.email") : undefined}
					onChange={(e) => set({ email: e.target.value })}
				/>
			</div>
			<Select
				label={t("contacts.new.owner")}
				name="owner"
				value={input.ownerId}
				onChange={(e) => set({ ownerId: e.target.value })}
			>
				<option value="">{t("contacts.new.ownerMe")}</option>
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

export function NewContactDialog({
	open,
	onClose,
	assignees,
	onCreated,
}: {
	open: boolean;
	onClose: () => void;
	assignees: readonly Assignee[];
	onCreated: (c: Contact) => void;
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
			title={t("contacts.new.title")}
			testId="new-contact-dialog"
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
						data-testid="new-contact-submit"
					>
						{t("contacts.new.create")}
					</Button>
				</>
			}
		>
			<NewContactForm
				assignees={assignees}
				formId={formId}
				onBusy={setBusy}
				onCreated={onCreated}
			/>
		</Dialog>
	);
}
