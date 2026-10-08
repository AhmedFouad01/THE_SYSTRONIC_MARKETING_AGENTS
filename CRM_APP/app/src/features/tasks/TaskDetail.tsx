import { useEffect, useState } from "react";
import { isApiError, isForbidden, isVersionConflict, useIsAdmin } from "../../api/index.ts";
import {
	DatePicker,
	Badge,
	Button,
	ForbiddenState,
	Input,
	Bdi,
	type MessageKey,
	PreviewPanel,
	RecordEditFooter,
	RecordPanel,
	type RecordPreview,
	Select,
	StatusPill,
	useI18n,
	useToast,
} from "../../ui/index.ts";
import { type Assignee, fetchTask, patchTask } from "./api.ts";
import { type CustomFields, CustomFieldsEdit, CustomFieldsRead, useCustomDraft, useCustomFields, withProperties } from "../properties/index.ts";
import { DueLabel } from "./DueLabel.tsx";
import {
	buildPatchBody,
	completeBody,
	draftOf,
	type EditIssue,
	type Task,
	type TaskRow,
	validateEdit,
} from "./model.ts";
import { RelatedLink } from "./RelatedLink.tsx";

type EditError = null | "conflict" | "forbidden" | "other";

export const SOURCE_KEY: Record<TaskRow["sourceKind"], MessageKey> = {
	manual: "tasks.source.manual",
	automation: "tasks.source.automation",
	unknown: "tasks.source.unknown",
};

/** Result of a failed row/detail write, shared with the grid's row action. */
export function writeErrorKind(e: unknown): Exclude<EditError, null> {
	return isVersionConflict(e)
		? "conflict"
		: isForbidden(e)
			? "forbidden"
			: "other";
}

type EditorProps = {
	task: TaskRow;
	assignees: readonly Assignee[];
	cf: CustomFields;
	onUpdated: (task: Task) => void;
	/** Edit mode: the form is shown; otherwise only banners and the Complete action. */
	editing: boolean;
	onDone: () => void;
};

/** Keyed by task id + version by the parent: a reload (new version) remounts it with a fresh draft. */
function TaskEditor({ task, assignees, cf, onUpdated, editing, onDone }: EditorProps) {
	const { t } = useI18n();
	const toast = useToast();
	const [draft, setDraft] = useState(() => draftOf(task));
	const [saving, setSaving] = useState(false);
	const [completing, setCompleting] = useState(false);
	const [reloading, setReloading] = useState(false);
	const [error, setError] = useState<EditError>(null);
	const [issues, setIssues] = useState<EditIssue>({});

	const custom = useCustomDraft(cf, "edit");
	const dirty = buildPatchBody(task, draft, "x") !== null || custom.dirty;
	const ownerOptions = assignees.some((a) => a.id === task.owner_id)
		? assignees
		: [...assignees, { id: task.owner_id, name: task.ownerName }];

	const fail = (e: unknown) => {
		const kind = writeErrorKind(e);
		setError(kind);
		if (kind === "other")
			toast.notify(
				isApiError(e) && e.safeMessage ? e.safeMessage : t("tasks.edit.failed"),
				"error",
			);
	};

	const save = async () => {
		const found = validateEdit(draft);
		setIssues(found);
		if (Object.keys(found).length > 0) return;
		const c = custom.prepare();
		if (!c.ok) return;
		const id = crypto.randomUUID();
		const body = withProperties(buildPatchBody(task, draft, id), c.patch, { commandId: id, version: task.version });
		if (body === null) return;
		setSaving(true);
		setError(null);
		try {
			onUpdated(await patchTask(task.id, body));
			toast.notify(t("tasks.edit.saved"), "success");
			onDone();
		} catch (e) {
			if (!custom.fail(e)) fail(e);
		} finally {
			setSaving(false);
		}
	};

	const complete = async () => {
		setCompleting(true);
		setError(null);
		try {
			onUpdated(
				await patchTask(task.id, completeBody(task, crypto.randomUUID())),
			);
			toast.notify(t("tasks.complete.done"), "success");
		} catch (e) {
			fail(e);
		} finally {
			setCompleting(false);
		}
	};

	const reload = async () => {
		setReloading(true);
		try {
			onUpdated(await fetchTask(task.id));
			setError(null);
		} catch {
			toast.notify(t("tasks.edit.failed"), "error");
		} finally {
			setReloading(false);
		}
	};

	return (
		<>
			{error === "conflict" ? (
				<div
					className="sy-tasks__banner m-0 p-10 rounded-8 bg-info-bg text-info-fg [&_p]:m-0 [&_p]:mt-4 [&_p]:mb-8"
					role="alert"
					data-testid="task-conflict"
				>
					<b>{t("tasks.conflict.title")}</b>
					<p>{t("tasks.conflict.body")}</p>
					<Button
						size="sm"
						variant="primary"
						loading={reloading}
						onClick={() => void reload()}
						data-testid="task-reload"
					>
						{t("tasks.conflict.reload")}
					</Button>
				</div>
			) : null}
			{error === "forbidden" ? (
				<div data-testid="task-forbidden">
					<ForbiddenState
						title={t("tasks.forbidden.title")}
						hint={t("tasks.forbidden.body")}
					/>
				</div>
			) : null}
			{task.status === "open" && !editing ? (
				<div className="sy-tasks__actions flex flex-wrap gap-8 my-10">
					<Button
						size="sm"
						variant="primary"
						icon="success"
						loading={completing}
						disabled={saving}
						onClick={() => void complete()}
						data-testid="task-complete"
					>
						{t("tasks.action.complete")}
					</Button>
				</div>
			) : null}
			{editing ? (
			<form
				className="sy-tasks__form flex flex-col gap-10"
				onSubmit={(e) => {
					e.preventDefault();
					void save();
				}}
				noValidate
			>
				<Input
					label={t("tasks.field.title")}
					name="title"
					value={draft.title}
					maxLength={160}
					error={issues.title ? t(`tasks.issue.${issues.title}`) : undefined}
					onChange={(e) => {
						setIssues({});
						setDraft({ ...draft, title: e.target.value });
					}}
				/>
				<DatePicker
					label={t("tasks.field.due")}
					name="due"
					value={draft.due}
					error={issues.due ? t("tasks.issue.date") : undefined}
					onChange={(e) => {
						setIssues({});
						setDraft({ ...draft, due: e.target.value });
					}}
				/>
				<Select
					label={t("tasks.field.owner")}
					name="owner"
					value={draft.ownerId}
					onChange={(e) => setDraft({ ...draft, ownerId: e.target.value })}
				>
					{ownerOptions.map((a) => (
						<option key={a.id} value={a.id}>
							{a.name}
						</option>
					))}
				</Select>
				<CustomFieldsEdit cf={cf} draft={custom} mode="edit" />
				<RecordEditFooter
					dirty={dirty}
					saving={saving}
					disabled={completing}
					saveLabel={t("tasks.edit.save")}
					saveTestId="task-save"
				/>
			</form>
			) : null}
		</>
	);
}

export function TaskDetail({
	task,
	state,
	assignees,
	now,
	onUpdated,
	onClose,
	preview,
}: {
	task: TaskRow | null;
	/** Why there is no record yet: still fetching by id, or the id does not exist / is not visible. */
	state: "loading" | "missing";
	assignees: readonly Assignee[];
	now: Date;
	onUpdated: (task: Task) => void;
	onClose: () => void;
	preview: RecordPreview;
}) {
	const { t, formatDateTime } = useI18n();
	const isAdmin = useIsAdmin();
	const [editing, setEditing] = useState(false);
	const taskId = task?.id ?? null;
	const cf = useCustomFields("task", "tasks", taskId, task?.version ?? null);
	// biome-ignore lint/correctness/useExhaustiveDependencies: leaving edit mode when another task is opened
	useEffect(() => setEditing(false), [taskId]);
	if (task === null)
		return (
			<PreviewPanel
				label={t("tasks.detail.title")}
				testId="task-detail"
				onClose={onClose}
				{...(preview.returnFocus ? { returnFocus: preview.returnFocus } : {})}
			>
				<p className="sy-record__muted" role="status" data-testid={`task-detail-${state}`}>
					{state === "loading" ? t("preview.loading") : t("preview.missing")}
				</p>
			</PreviewPanel>
		);
	return (
		<RecordPanel
			label={t("tasks.detail.title")}
			testId="task-detail"
			recordKey={task.id}
			heading={task.title}
			preview={preview}
			title={<Bdi>{task.title}</Bdi>}
			titleTestId="task-detail-title"
			subtitle={<RelatedLink row={task} />}
			chip={
				task.status === "completed" ? (
					<StatusPill tone="success">{t("tasks.status.completed")}</StatusPill>
				) : (
					<Badge tone="info">{t("tasks.status.open")}</Badge>
				)
			}
			chipTestId="task-detail-status"
			onClose={onClose}
			editable
			editing={editing}
			onEditingChange={setEditing}
			facts={[
				{
					label: t("tasks.field.due"),
					value: <DueLabel dueAt={task.due_at} bucket={task.bucket} now={now} />,
				},
				{ label: t("tasks.field.owner"), value: <Bdi>{task.ownerName}</Bdi> },
				// "Not recorded" carries no information: the Source row appears only when the origin is known.
				...(task.sourceKind !== "unknown"
					? [{ label: t("common.source"), value: t(SOURCE_KEY[task.sourceKind]) }]
					: []),
				...(task.completed_at
					? [
							{
								label: t("tasks.detail.completedAt"),
								value: <Bdi>{formatDateTime(task.completed_at)}</Bdi>,
							},
						]
					: []),
			]}
			persistent={(isEditing) => (
				<TaskEditor
					key={`${task.id}:${task.version}`}
					task={task}
					assignees={assignees}
					cf={cf}
					onUpdated={onUpdated}
					editing={isEditing}
					onDone={() => setEditing(false)}
				/>
			)}
			details={
				isAdmin
					? [
				{ label: t("tasks.detail.id"), value: task.id, copyable: true },
				{
					label: t("tasks.detail.version"),
					value: task.version,
					testId: "task-version",
				},
					]
					: undefined
			}
		>
			<CustomFieldsRead cf={cf} />
		</RecordPanel>
	);
}
