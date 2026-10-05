import { useState } from "react";
import { isApiError, isForbidden, isVersionConflict } from "../../api/index.ts";
import {
	Badge,
	Button,
	ForbiddenState,
	Input,
	Bdi,
	type MessageKey,
	Panel,
	RecordDetails,
	Select,
	StatusPill,
	useI18n,
	useToast,
} from "../../ui/index.ts";
import { type Assignee, fetchTask, patchTask } from "./api.ts";
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
	onUpdated: (task: Task) => void;
};

/** Keyed by task id + version by the parent: a reload (new version) remounts it with a fresh draft. */
function TaskEditor({ task, assignees, onUpdated }: EditorProps) {
	const { t } = useI18n();
	const toast = useToast();
	const [draft, setDraft] = useState(() => draftOf(task));
	const [saving, setSaving] = useState(false);
	const [completing, setCompleting] = useState(false);
	const [reloading, setReloading] = useState(false);
	const [error, setError] = useState<EditError>(null);
	const [issues, setIssues] = useState<EditIssue>({});

	const dirty = buildPatchBody(task, draft, "x") !== null;
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
		const body = buildPatchBody(task, draft, crypto.randomUUID());
		if (body === null) return;
		setSaving(true);
		setError(null);
		try {
			onUpdated(await patchTask(task.id, body));
			toast.notify(t("tasks.edit.saved"), "success");
		} catch (e) {
			fail(e);
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
					className="sy-tasks__banner"
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
			{task.status === "open" ? (
				<div className="sy-tasks__actions">
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
			<form
				className="sy-tasks__form"
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
				<Input
					label={t("tasks.field.due")}
					name="due"
					type="datetime-local"
					dir="ltr"
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
				<div className="sy-tasks__actions">
					<Button
						type="submit"
						variant="primary"
						size="sm"
						loading={saving}
						disabled={!dirty || completing}
						data-testid="task-save"
					>
						{t("tasks.edit.save")}
					</Button>
					<Button
						size="sm"
						variant="ghost"
						disabled={!dirty || saving}
						onClick={() => {
							setDraft(draftOf(task));
							setIssues({});
							setError(null);
						}}
					>
						{t("tasks.edit.revert")}
					</Button>
				</div>
			</form>
		</>
	);
}

export function TaskDetail({
	task,
	assignees,
	now,
	onUpdated,
}: {
	task: TaskRow | null;
	assignees: readonly Assignee[];
	now: Date;
	onUpdated: (task: Task) => void;
}) {
	const { t, formatDateTime } = useI18n();
	if (task === null)
		return (
			<Panel
				as="aside"
				title={t("tasks.detail.title")}
				className="sy-tasks__detail"
				data-testid="task-detail-empty"
			>
				<p className="sy-tasks__muted">{t("tasks.detail.empty")}</p>
			</Panel>
		);
	return (
		<Panel
			as="aside"
			title={t("tasks.detail.title")}
			className="sy-tasks__detail"
			data-testid="task-detail"
			aria-label={t("tasks.detail.title")}
		>
			<div className="sy-tasks__head">
				<div>
					<p className="sy-tasks__name" data-testid="task-detail-title">
						{task.title}
					</p>
					<p className="sy-tasks__muted">
						<RelatedLink row={task} />
					</p>
				</div>
				<span data-testid="task-detail-status">
					{task.status === "completed" ? (
						<StatusPill tone="success">
							{t("tasks.status.completed")}
						</StatusPill>
					) : (
						<Badge tone="info">{t("tasks.status.open")}</Badge>
					)}
				</span>
			</div>
			<p className="sy-tasks__due-line">
				<DueLabel dueAt={task.due_at} bucket={task.bucket} now={now} />
			</p>
			<TaskEditor
				key={`${task.id}:${task.version}`}
				task={task}
				assignees={assignees}
				onUpdated={onUpdated}
			/>
			<dl className="sy-tasks__facts">
				<dt>{t("common.source")}</dt>
				<dd>{t(SOURCE_KEY[task.sourceKind])}</dd>
				{task.completed_at ? (
					<>
						<dt>{t("tasks.detail.completedAt")}</dt>
						<dd>
							<Bdi>{formatDateTime(task.completed_at)}</Bdi>
						</dd>
					</>
				) : null}
				</dl>
			<RecordDetails
				rows={[
					{ label: t("tasks.detail.id"), value: task.id, copyable: true },
					{ label: t("tasks.detail.version"), value: task.version, testId: "task-version" },
				]}
			/>
		</Panel>
	);
}
