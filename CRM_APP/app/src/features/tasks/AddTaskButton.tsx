import { useState } from "react";
import { Button, useI18n, useToast } from "../../ui/index.ts";
import { type Assignee, fetchAssignees } from "./api.ts";
import { NewTaskDialog } from "./NewTaskDialog.tsx";

/**
 * "Add task" action for the Lead / Contact / Deal detail panels. Opens the create dialog prefilled with the
 * record (contact and/or deal); the task is created in place and the user stays on the current screen.
 */
export function AddTaskButton({
	contactId,
	dealId,
	label,
	onCreated,
}: {
	contactId: string | null;
	dealId: string | null;
	/** Human name of the record the task is attached to. */
	label: string;
	/** Called after the task was created (e.g. to refresh a task list). */
	onCreated?: () => void;
}) {
	const { t } = useI18n();
	const toast = useToast();
	const [open, setOpen] = useState(false);
	const [assignees, setAssignees] = useState<readonly Assignee[]>([]);
	const openDialog = () => {
		setOpen(true);
		fetchAssignees()
			.then(setAssignees)
			.catch(() => undefined);
	};
	return (
		<>
			<Button
				size="sm"
				icon="tasks"
				onClick={openDialog}
				data-testid="add-task"
			>
				{t("tasks.action.add")}
			</Button>
			<NewTaskDialog
				open={open}
				onClose={() => setOpen(false)}
				assignees={assignees}
				contacts={[]}
				prefill={{ contactId, dealId, label }}
				onCreated={() => {
					setOpen(false);
					toast.notify(t("tasks.new.created"), "success");
					onCreated?.();
				}}
			/>
		</>
	);
}
