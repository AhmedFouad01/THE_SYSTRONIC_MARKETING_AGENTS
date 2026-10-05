import { useId, useRef, useState } from "react";
import {
	DatePicker,
	Button,
	Dialog,
	Input,
	type MessageKey,
	Select,
	useI18n,
} from "../../ui/index.ts";
import { classifyCreateError, type CreateErrorKind } from "../leads/model.ts";
import { type Assignee, type ContactRef, createTask } from "./api.ts";
import {
	buildCreateBody,
	EMPTY_NEW_TASK,
	type KeyMemo,
	keyFor,
	type NewTaskErrors,
	type NewTaskField,
	type NewTaskInput,
	type Task,
	type TaskIssue,
	validateNewTask,
} from "./model.ts";
import "./tasks.css";

const ISSUE_KEY: Record<TaskIssue, MessageKey> = {
	required: "tasks.issue.required",
	tooLong: "tasks.issue.tooLong",
	date: "tasks.issue.date",
};
const ERROR_KEY: Record<CreateErrorKind, MessageKey> = {
	validation: "tasks.new.err.validation",
	assignment: "tasks.new.err.assignment",
	conflict: "tasks.new.err.conflict",
	forbidden: "tasks.new.err.forbidden",
	network: "tasks.new.err.network",
	other: "tasks.new.err.other",
};

/** Context the dialog was opened from. `label` is the human name of the related record (shown, not editable). */
export type NewTaskPrefill = {
	contactId: string | null;
	dealId: string | null;
	label: string;
};

function NewTaskForm({
	assignees,
	contacts,
	prefill,
	formId,
	onCreated,
	onBusy,
}: {
	assignees: readonly Assignee[];
	contacts: readonly ContactRef[];
	prefill: NewTaskPrefill | null;
	formId: string;
	onCreated: (task: Task) => void;
	onBusy: (busy: boolean) => void;
}) {
	const { t } = useI18n();
	const [input, setInput] = useState<NewTaskInput>(() => ({
		...EMPTY_NEW_TASK,
		contactId: prefill?.contactId ?? "",
		dealId: prefill?.dealId ?? "",
	}));
	const [touched, setTouched] = useState(false);
	const [serverError, setServerError] = useState<CreateErrorKind | null>(null);
	const memo = useRef<KeyMemo | null>(null);
	const errors: NewTaskErrors = touched ? validateNewTask(input) : {};
	const err = (f: NewTaskField) =>
		errors[f] ? t(ISSUE_KEY[errors[f]]) : undefined;
	const set = (patch: Partial<NewTaskInput>) => {
		setServerError(null);
		setInput((p) => ({ ...p, ...patch }));
	};

	const submit = async () => {
		setTouched(true);
		if (Object.keys(validateNewTask(input)).length > 0) return;
		memo.current = keyFor(memo.current, input, () => crypto.randomUUID());
		const key = memo.current.key;
		onBusy(true);
		setServerError(null);
		try {
			onCreated(await createTask(buildCreateBody(input, key), key));
		} catch (e) {
			setServerError(classifyCreateError(e));
		} finally {
			onBusy(false);
		}
	};

	return (
		<form
			id={formId}
			className="sy-tasks__form"
			noValidate
			onSubmit={(e) => {
				e.preventDefault();
				void submit();
			}}
		>
			{serverError ? (
				<p
					className="sy-tasks__banner"
					role="alert"
					data-testid="new-task-error"
				>
					{t(ERROR_KEY[serverError])}
				</p>
			) : null}
			<Input
				label={t("tasks.field.title")}
				name="title"
				required
				value={input.title}
				maxLength={160}
				error={err("title")}
				data-autofocus
				onChange={(e) => set({ title: e.target.value })}
			/>
			<DatePicker
				label={t("tasks.field.due")}
				name="due"
				required
				value={input.due}
				error={err("due")}
				onChange={(e) => set({ due: e.target.value })}
			/>
			{prefill ? (
				<p className="sy-tasks__related" data-testid="new-task-related">
					<span className="sy-tasks__muted">{t("tasks.field.related")}: </span>
					<b>{prefill.label}</b>
				</p>
			) : (
				<Select
					label={t("tasks.field.contact")}
					name="contact"
					required
					value={input.contactId}
					error={err("contactId")}
					onChange={(e) => set({ contactId: e.target.value })}
				>
					<option value="">{t("tasks.new.contactPick")}</option>
					{contacts.map((c) => (
						<option key={c.id} value={c.id}>
							{c.display_name}
						</option>
					))}
				</Select>
			)}
			<Select
				label={t("tasks.field.owner")}
				name="owner"
				value={input.ownerId}
				onChange={(e) => set({ ownerId: e.target.value })}
			>
				<option value="">{t("tasks.new.ownerMe")}</option>
				{assignees.map((a) => (
					<option key={a.id} value={a.id}>
						{a.name}
					</option>
				))}
			</Select>
		</form>
	);
}

export function NewTaskDialog({
	open,
	onClose,
	assignees,
	contacts,
	prefill,
	onCreated,
}: {
	open: boolean;
	onClose: () => void;
	assignees: readonly Assignee[];
	contacts: readonly ContactRef[];
	prefill: NewTaskPrefill | null;
	onCreated: (task: Task) => void;
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
			title={t("tasks.new.title")}
			testId="new-task-dialog"
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
						data-testid="new-task-submit"
					>
						{t("tasks.new.create")}
					</Button>
				</>
			}
		>
			<NewTaskForm
				assignees={assignees}
				contacts={contacts}
				prefill={prefill}
				formId={formId}
				onBusy={setBusy}
				onCreated={onCreated}
			/>
		</Dialog>
	);
}
