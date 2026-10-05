import { useEffect, useState } from "react";
import { isApiError, isForbidden, isVersionConflict } from "../../api/index.ts";
import {
	Badge,
	Bdi,
	RecordEditFooter,
	RecordEmpty,
	RecordPanel,
	type BadgeTone,
	Button,
	Dialog,
	ForbiddenState,
	Input,
	Ltr,
	MenuButton,
	type MessageKey,
	Select,
	Tabs,
	Textarea,
	useI18n,
	useToast,
} from "../../ui/index.ts";
import { AddTaskButton } from "../tasks/index.ts";
import { fetchDeal, fetchHistory, patchDeal, transitionDeal } from "./api.ts";
import {
	type Assignee,
	allowedTargets,
	applyTransition,
	buildPatchBody,
	buildTransitionBody,
	classifyTransitionError,
	type Deal,
	type DealIssue,
	type DealRow,
	dealValueText,
	draftOf,
	type HistoryEntry,
	isDirty,
	type Pipeline,
	type Stage,
	type StageOutcome,
	type TransitionErrorKind,
	validateEdit,
	validateReason,
} from "./model.ts";

const OUTCOME_TONE: Record<"open" | "won" | "lost", BadgeTone> = {
	open: "info",
	won: "success",
	lost: "danger",
};
export const toneOf = (o: StageOutcome): BadgeTone => OUTCOME_TONE[o ?? "open"];

const ISSUE_KEY: Record<DealIssue, MessageKey> = {
	required: "deals.issue.required",
	tooLong: "deals.issue.tooLong",
	amount: "deals.issue.amount",
	currency: "deals.issue.currency",
};
export const TRANSITION_ERR: Record<
	Exclude<TransitionErrorKind, "conflict">,
	MessageKey
> = {
	forbidden: "deals.err.forbidden",
	invalid: "deals.err.invalid",
	reason: "deals.lost.reasonRequired",
	network: "deals.err.network",
	other: "deals.err.other",
};

type EditError = null | "conflict" | "forbidden" | "other";

export function ConflictBanner({
	onReload,
	reloading,
	testId,
	reloadTestId,
	body,
}: {
	onReload: () => void;
	reloading: boolean;
	testId: string;
	reloadTestId: string;
	body?: MessageKey;
}) {
	const { t } = useI18n();
	return (
		<div className="sy-deals__banner" role="alert" data-testid={testId}>
			<b>{t("deals.conflict.title")}</b>
			<p>{t(body ?? "deals.conflict.body")}</p>
			<Button
				size="sm"
				variant="primary"
				loading={reloading}
				onClick={onReload}
				data-testid={reloadTestId}
			>
				{t("deals.conflict.reload")}
			</Button>
		</div>
	);
}

/** Keyed by deal id + version by the parent: a reload (new version) remounts it with a fresh draft. */
function DealEditor({
	deal,
	assignees,
	onUpdated,
	onDone,
}: {
	deal: DealRow;
	assignees: readonly Assignee[];
	onUpdated: (d: Deal) => void;
	onDone: () => void;
}) {
	const { t } = useI18n();
	const toast = useToast();
	const [draft, setDraft] = useState(() => draftOf(deal));
	const [saving, setSaving] = useState(false);
	const [reloading, setReloading] = useState(false);
	const [error, setError] = useState<EditError>(null);
	const [touched, setTouched] = useState(false);
	const issues = touched ? validateEdit(draft) : {};
	const dirty = isDirty(deal, draft);
	const ownerOptions =
		assignees.some((a) => a.id === deal.owner_id) || !deal.owner_id
			? assignees
			: [...assignees, { id: deal.owner_id, name: deal.ownerName }];

	const save = async () => {
		setTouched(true);
		if (Object.keys(validateEdit(draft)).length > 0) return;
		const body = buildPatchBody(deal, draft, crypto.randomUUID());
		if (body === null) return;
		setSaving(true);
		setError(null);
		try {
			onUpdated(await patchDeal(deal.id, body));
			toast.notify(t("deals.edit.saved"), "success");
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
						: t("deals.edit.failed"),
					"error",
				);
		} finally {
			setSaving(false);
		}
	};
	const reload = async () => {
		setReloading(true);
		try {
			onUpdated(await fetchDeal(deal.id));
		} catch {
			toast.notify(t("deals.edit.failed"), "error");
		} finally {
			setReloading(false);
		}
	};
	const issue = (f: "title" | "amount" | "currency") =>
		issues[f] ? t(ISSUE_KEY[issues[f]]) : undefined;

	return (
		<form
			className="sy-deals__form"
			noValidate
			onSubmit={(e) => {
				e.preventDefault();
				void save();
			}}
		>
			{error === "conflict" ? (
				<ConflictBanner
					onReload={() => void reload()}
					reloading={reloading}
					testId="deal-conflict"
					reloadTestId="deal-reload"
				/>
			) : null}
			{error === "forbidden" ? (
				<div data-testid="deal-forbidden">
					<ForbiddenState
						title={t("deals.forbidden.title")}
						hint={t("deals.forbidden.body")}
					/>
				</div>
			) : null}
			<Input
				label={t("deals.field.title")}
				name="title"
				value={draft.title}
				maxLength={160}
				error={issue("title")}
				onChange={(e) => {
					setTouched(false);
					setDraft({ ...draft, title: e.target.value });
				}}
			/>
			<Input
				label={t("deals.field.amount")}
				name="amount"
				inputMode="decimal"
				dir="ltr"
				value={draft.amount}
				error={issue("amount")}
				onChange={(e) => {
					setTouched(false);
					setDraft({ ...draft, amount: e.target.value });
				}}
			/>
			<Input
				label={t("deals.field.currency")}
				name="currency"
				dir="ltr"
				maxLength={3}
				value={draft.currency}
				error={issue("currency")}
				onChange={(e) => {
					setTouched(false);
					setDraft({ ...draft, currency: e.target.value.toUpperCase() });
				}}
			/>
			<Select
				label={t("deals.field.owner")}
				name="owner"
				value={draft.ownerId}
				onChange={(e) => setDraft({ ...draft, ownerId: e.target.value })}
			>
				{deal.owner_id ? null : (
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
					setDraft(draftOf(deal));
					setError(null);
					setTouched(false);
				}}
				saveLabel={t("deals.edit.save")}
				discardLabel={t("deals.edit.revert")}
				saveTestId="deal-save"
			/>
		</form>
	);
}

type RunResult = "ok" | "invalid" | "failed";

/** Stage control: keyboard-operable menu limited to the pipeline's allowed edges; Lost asks for a reason first. */
function StageControl({
	deal,
	pipeline,
	onUpdated,
}: {
	deal: DealRow;
	pipeline: Pipeline | undefined;
	onUpdated: (d: Deal) => void;
}) {
	const { t } = useI18n();
	const toast = useToast();
	const targets = allowedTargets(pipeline, deal.stage_id);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<TransitionErrorKind | null>(null);
	const [reloading, setReloading] = useState(false);
	const [lost, setLost] = useState<Stage | null>(null);
	const [reason, setReason] = useState("");
	const [reasonIssue, setReasonIssue] = useState<string | null>(null);

	const run = async (target: Stage, why: string): Promise<RunResult> => {
		const issue = validateReason(target, why);
		if (issue !== null) {
			setReasonIssue(
				t(
					issue === "reasonRequired"
						? "deals.lost.reasonRequired"
						: "deals.lost.reasonTooLong",
				),
			);
			return "invalid";
		}
		setBusy(true);
		setError(null);
		try {
			const res = await transitionDeal(
				deal.id,
				buildTransitionBody(deal, target, why, crypto.randomUUID()),
			);
			onUpdated(applyTransition(deal, res));
			toast.notify(t("deals.stage.moved", { stage: target.name }), "success");
			return "ok";
		} catch (e) {
			setError(classifyTransitionError(e));
			return "failed";
		} finally {
			setBusy(false);
		}
	};
	const closeLost = () => {
		if (busy) return;
		setLost(null);
		setReason("");
		setReasonIssue(null);
	};
	const reload = async () => {
		setReloading(true);
		try {
			onUpdated(await fetchDeal(deal.id));
			setError(null);
		} catch {
			toast.notify(t("deals.edit.failed"), "error");
		} finally {
			setReloading(false);
		}
	};
	const confirmLost = async () => {
		if (lost === null) return;
		const r = await run(lost, reason);
		if (r !== "invalid") {
			// ok: done. failed: the error is shown in the panel, not inside the dialog.
			setLost(null);
			setReason("");
		}
	};

	return (
		<section className="sy-deals__stage" aria-label={t("deals.stage.current")}>
			<div className="sy-deals__stagerow">
				<Badge tone={toneOf(deal.stageOutcome)}>
					<span data-testid="deal-stage">{deal.stageName}</span>
				</Badge>
				{targets.length > 0 ? (
					<MenuButton
						label={t("deals.stage.change")}
						icon="dots"
						testId="stage-menu"
						items={targets.map((s) => ({
							id: s.id,
							label: s.name,
							testId: `stage-option-${s.id}`,
							onSelect: () => {
								if (s.outcome === "lost") {
									setReason("");
									setReasonIssue(null);
									setLost(s);
								} else void run(s, "");
							},
						}))}
					/>
				) : (
					<span className="sy-deals__muted" data-testid="stage-none">
						{t("deals.stage.none")}
					</span>
				)}
				{busy ? (
					<span className="sy-deals__muted">{t("common.working")}</span>
				) : null}
			</div>
			{error === "conflict" ? (
				<ConflictBanner
					onReload={() => void reload()}
					reloading={reloading}
					testId="stage-conflict"
					reloadTestId="stage-reload"
					body="deals.err.stale"
				/>
			) : null}
			{error !== null && error !== "conflict" ? (
				<p className="sy-deals__banner" role="alert" data-testid="stage-error">
					{t(TRANSITION_ERR[error])}
				</p>
			) : null}
			<Dialog
				open={lost !== null}
				onClose={closeLost}
				title={t("deals.lost.title")}
				description={t("deals.lost.body")}
				testId="lost-dialog"
				confirm={{
					label: t("deals.lost.confirm"),
					tone: "danger",
					loading: busy,
					onConfirm: () => void confirmLost(),
				}}
			>
				<Textarea
					label={t("deals.lost.reason")}
					name="reason"
					required
					value={reason}
					maxLength={500}
					error={reasonIssue ?? undefined}
					onChange={(e) => {
						setReasonIssue(null);
						setReason(e.target.value);
					}}
				/>
			</Dialog>
		</section>
	);
}

type HistState =
	| { s: "loading" }
	| { s: "error" }
	| { s: "ready"; items: HistoryEntry[] };

function HistoryList({
	dealId,
	version,
	pipeline,
	actors,
}: {
	dealId: string;
	version: number;
	pipeline: Pipeline | undefined;
	actors: ReadonlyMap<string, string>;
}) {
	const { t, tx, formatDateTime } = useI18n();
	const [state, setState] = useState<HistState>({ s: "loading" });
	// biome-ignore lint/correctness/useExhaustiveDependencies: history is re-read when the deal version changes
	useEffect(() => {
		const ctrl = new AbortController();
		fetchHistory(dealId, ctrl.signal)
			.then((items) => setState({ s: "ready", items }))
			.catch((e: unknown) => {
				if (!(e instanceof DOMException)) setState({ s: "error" });
			});
		return () => ctrl.abort();
	}, [dealId, version]);
	const name = (id: string) =>
		pipeline?.stages.find((s) => s.id === id)?.name ?? t("deals.unknownStage");
	if (state.s === "loading")
		return (
			<p className="sy-deals__muted" role="status">
				{t("deals.history.loading")}
			</p>
		);
	if (state.s === "error")
		return <p role="alert">{t("deals.history.failed")}</p>;
	if (state.items.length === 0)
		return (
			<p className="sy-deals__muted" data-testid="history-empty">
				{t("deals.history.empty")}
			</p>
		);
	return (
		<ol className="sy-deals__history" data-testid="deal-history">
			{[...state.items].reverse().map((h) => (
				<li key={h.id} className="sy-deals__item" data-testid="history-item">
					<b>
						{tx("deals.history.entry", {
							from: name(h.from_stage),
							to: name(h.to_stage),
						})}
					</b>
					<span className="sy-deals__muted">
						<Bdi>{formatDateTime(h.occurred_at)}</Bdi>
						{" · "}
						<Bdi>{actors.get(h.actor_id) ?? t("common.unknownUser")}</Bdi>
					</span>
					{h.reason ? (
						<span>{t("deals.history.reason", { reason: h.reason })}</span>
					) : null}
				</li>
			))}
		</ol>
	);
}

export function DealDetail({
	deal,
	pipeline,
	assignees,
	actors,
	onUpdated,
	onClose,
}: {
	deal: DealRow | null;
	pipeline: Pipeline | undefined;
	assignees: readonly Assignee[];
	actors: ReadonlyMap<string, string>;
	onUpdated: (deal: Deal) => void;
	onClose: () => void;
}) {
	const { t, formatMoney } = useI18n();
	const [tab, setTab] = useState<"overview" | "history">("overview");
	if (deal === null)
		return (
			<RecordEmpty
				label={t("deals.detail.title")}
				hint={t("deals.detail.empty")}
				testId="deal-detail-empty"
			/>
		);
	return (
		<RecordPanel
			label={t("deals.detail.title")}
			testId="deal-detail"
			recordKey={deal.id}
			title={<Bdi>{deal.title}</Bdi>}
			titleTestId="deal-detail-title"
			subtitle={
				<span data-testid="deal-detail-value">
					<Ltr>{dealValueText(deal, formatMoney)}</Ltr>
				</span>
			}
			onClose={onClose}
			actions={
				<AddTaskButton
					contactId={deal.contact_id}
					dealId={deal.id}
					label={deal.title}
				/>
			}
			facts={[
				{
					label: t("deals.detail.contact"),
					value: <Bdi>{deal.contactName}</Bdi>,
				},
				{
					label: t("deals.detail.pipeline"),
					value: <Bdi>{deal.pipelineName}</Bdi>,
				},
				{ label: t("common.owner"), value: <Bdi>{deal.ownerName}</Bdi> },
			]}
			editor={(done) => (
				<DealEditor
					key={`${deal.id}:${deal.version}`}
					deal={deal}
					assignees={assignees}
					onUpdated={onUpdated}
					onDone={done}
				/>
			)}
			details={[
				{ label: t("deals.detail.id"), value: deal.id, copyable: true },
				{
					label: t("deals.detail.version"),
					value: deal.version,
					testId: "deal-version",
				},
			]}
		>
			<Tabs
				label={t("deals.tabs")}
				value={tab}
				onChange={(id) => setTab(id as "overview" | "history")}
				tabs={[
					{
						id: "overview",
						label: t("deals.tab.overview"),
						panel: (
							<StageControl
								key={deal.id}
								deal={deal}
								pipeline={pipeline}
								onUpdated={onUpdated}
							/>
						),
					},
					{
						id: "history",
						label: t("deals.tab.history"),
						panel: (
							<HistoryList
								dealId={deal.id}
								version={deal.version}
								pipeline={pipeline}
								actors={actors}
							/>
						),
					},
				]}
			/>
		</RecordPanel>
	);
}
