import { useEffect, useId, useState } from "react";
import { Button, DatePicker, Dialog, Input, Select, useI18n } from "../../ui/index.ts";
import {
	EMPTY_NEW_TASK,
	type NewTaskInput,
	validateNewTask,
} from "../tasks/model.ts";
import type { Assignee } from "./model.ts";

/** One dialog -> one task per selected lead (attached to that lead's contact). The caller runs the requests. */
export function BulkTaskDialog({
	open,
	onClose,
	count,
	assignees,
	onSubmit,
}: {
	open: boolean;
	onClose: () => void;
	count: number;
	assignees: readonly Assignee[];
	onSubmit: (input: NewTaskInput) => void;
}) {
	const { t, formatNumber } = useI18n();
	const formId = useId();
	const [input, setInput] = useState<NewTaskInput>(EMPTY_NEW_TASK);
	const [touched, setTouched] = useState(false);
	useEffect(() => {
		if (open) {
			setInput(EMPTY_NEW_TASK);
			setTouched(false);
		}
	}, [open]);
	// The contact comes from each lead; only title/due/owner are asked here.
	const errors = touched ? validateNewTask({ ...input, contactId: "bulk" }) : {};
	return (
		<Dialog
			open={open}
			onClose={onClose}
			title={t("bulk.addTask")}
			description={t("bulk.dialogCount", { count: formatNumber(count) })}
			testId="bulk-task-dialog"
			footer={
				<>
					<Button onClick={onClose}>{t("common.cancel")}</Button>
					<Button
						type="submit"
						form={formId}
						variant="primary"
						data-testid="bulk-task-submit"
					>
						{t("tasks.new.create")}
					</Button>
				</>
			}
		>
			<form
				id={formId}
				className="sy-tasks__form flex flex-col gap-10"
				noValidate
				onSubmit={(e) => {
					e.preventDefault();
					setTouched(true);
					if (Object.keys(validateNewTask({ ...input, contactId: "bulk" })).filter((k) => k !== "contactId").length > 0)
						return;
					onSubmit(input);
				}}
			>
				<Input
					label={t("tasks.field.title")}
					name="title"
					required
					value={input.title}
					maxLength={160}
					error={errors.title ? t(errors.title === "required" ? "tasks.issue.required" : "tasks.issue.tooLong") : undefined}
					data-autofocus
					onChange={(e) => setInput((p) => ({ ...p, title: e.target.value }))}
				/>
				<DatePicker
					label={t("tasks.field.due")}
					name="due"
					required
					value={input.due}
					error={errors.due ? t(errors.due === "required" ? "tasks.issue.required" : "tasks.issue.date") : undefined}
					onChange={(e) => setInput((p) => ({ ...p, due: e.target.value }))}
				/>
				<Select
					label={t("tasks.field.owner")}
					name="owner"
					value={input.ownerId}
					onChange={(e) => setInput((p) => ({ ...p, ownerId: e.target.value }))}
				>
					<option value="">{t("tasks.new.ownerMe")}</option>
					{assignees.map((a) => (
						<option key={a.id} value={a.id}>
							{a.name}
						</option>
					))}
				</Select>
			</form>
		</Dialog>
	);
}
