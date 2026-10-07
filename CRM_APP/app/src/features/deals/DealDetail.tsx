import { useEffect, useState } from "react";
import { isApiError, isForbidden, isVersionConflict } from "../../api/index.ts";
import {
	Badge,
	type BadgeTone,
	Bdi,
	Button,
	ForbiddenState,
	Input,
	MenuButton,
	type MessageKey,
	RecordEditFooter,
	Select,
	useI18n,
	useToast,
} from "../../ui/index.ts";
import { type CustomFields, CustomFieldsEdit, useCustomDraft, withProperties } from "../properties/index.ts";
import { fetchDeal, fetchHistory, patchDeal, transitionDeal } from "./api.ts";
import {
	type Assignee,
	applyTransition,
	buildPatchBody,
	buildTransitionBody,
	classifyTransitionError,
	currencyChoices,
	type Deal,
	type DealIssue,
	type DealRow,
	draftOf,
	groupAmount,
	type HistoryEntry,
	isDirty,
	type Pipeline,
	sanitizeAmountInput,
	type Stage,
	type StageMoves,
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

/**
 * Money input: shows the amount with thousands separators while the draft keeps plain decimal text ("296900.5").
 * Typed separators, Arabic digits and stray characters are normalised; the caret stays after the same digit.
 */
export function AmountField({
	label,
	value,
	onChange,
	error,
	name = "amount",
}: {
	label: string;
	value: string;
	onChange: (plain: string) => void;
	error?: string | undefined;
	name?: string;
}) {
	return (
		<Input
			label={label}
			name={name}
			inputMode="decimal"
			dir="ltr"
			autoComplete="off"
			value={groupAmount(value)}
			error={error}
			onChange={(e) => {
				const el = e.target;
				const plain = sanitizeAmountInput(el.value);
				const caret = el.selectionStart ?? el.value.length;
				const before = sanitizeAmountInput(el.value.slice(0, caret)).length;
				onChange(plain);
				if (caret >= el.value.length) return;
				requestAnimationFrame(() => {
					const shown = groupAmount(plain);
					let seen = 0;
					let pos = 0;
					while (pos < shown.length && seen < before) {
						if (shown[pos] !== ",") seen++;
						pos++;
					}
					el.setSelectionRange(pos, pos);
				});
			}}
		/>
	);
}

/** Currency select: the ISO codes used in the data (EGP default), never free text. */
export function CurrencySelect({
	label,
	value,
	onChange,
	choices,
	error,
}: {
	label: string;
	value: string;
	onChange: (code: string) => void;
	choices: readonly string[];
	error?: string | undefined;
}) {
	const options = currencyChoices(choices, value);
	return (
		<Select
			label={label}
			name="currency"
			value={value}
			error={error}
			onChange={(e) => onChange(e.target.value)}
		>
			{options.map((c) => (
				<option key={c} value={c}>
					{c}
				</option>
			))}
		</Select>
	);
}

/** Keyed by deal id + version by the parent: a reload (new version) remounts it with a fresh draft. */
export function DealEditor({
	deal,
	assignees,
	currencies,
	cf,
	onUpdated,
	onDone,
}: {
	deal: DealRow;
	cf: CustomFields;
	assignees: readonly Assignee[];
	currencies: readonly string[];
	onUpdated: (d: Deal) => void;
	/** Leaves edit mode (after a save, or on Cancel - which drops the draft with the form). */
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
	const custom = useCustomDraft(cf, "edit");
	const dirty = isDirty(deal, draft) || custom.dirty;
	const ownerOptions =
		assignees.some((a) => a.id === deal.owner_id) || !deal.owner_id
			? assignees
			: [...assignees, { id: deal.owner_id, name: deal.ownerName }];

	const save = async () => {
		setTouched(true);
		if (Object.keys(validateEdit(draft)).length > 0) return;
		const c = custom.prepare();
		if (!c.ok) return;
		const id = crypto.randomUUID();
		const body = withProperties(buildPatchBody(deal, draft, id), c.patch, { commandId: id, version: deal.version });
		if (body === null) return;
		setSaving(true);
		setError(null);
		try {
			onUpdated(await patchDeal(deal.id, body));
			toast.notify(t("deals.edit.saved"), "success");
			onDone();
		} catch (e) {
			if (custom.fail(e)) return;
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
			<div className="sy-deals__pair">
				<AmountField
					label={t("deals.field.amount")}
					value={draft.amount}
					error={issue("amount")}
					onChange={(amount) => {
						setTouched(false);
						setDraft({ ...draft, amount });
					}}
				/>
				<CurrencySelect
					label={t("deals.field.currency")}
					value={draft.currency}
					choices={currencies}
					error={issue("currency")}
					onChange={(currency) => {
						setTouched(false);
						setDraft({ ...draft, currency });
					}}
				/>
			</div>
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
			<CustomFieldsEdit cf={cf} draft={custom} mode="edit" />
			<RecordEditFooter
				dirty={dirty}
				saving={saving}
				onCancel={onDone}
				saveLabel={t("deals.edit.save")}
				saveTestId="deal-save"
			/>
		</form>
	);
}

// ---- stage moves ------------------------------------------------------------------------------------------

export type StageMove = {
	busy: boolean;
	error: TransitionErrorKind | null;
	reloading: boolean;
	/** Runs the transition; resolves true when the server accepted it. */
	run: (target: Stage, reason: string) => Promise<boolean>;
	reload: () => Promise<void>;
};

/** Transition command state for one deal: busy flag, classified error, reload after a 409. */
export function useStageMove(
	deal: DealRow,
	onUpdated: (d: Deal) => void,
): StageMove {
	const { t } = useI18n();
	const toast = useToast();
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<TransitionErrorKind | null>(null);
	const [reloading, setReloading] = useState(false);
	const run = async (target: Stage, reason: string) => {
		if (validateReason(target, reason) !== null) return false;
		setBusy(true);
		setError(null);
		try {
			const res = await transitionDeal(
				deal.id,
				buildTransitionBody(deal, target, reason, crypto.randomUUID()),
			);
			onUpdated(applyTransition(deal, res));
			toast.notify(t("deals.stage.moved", { stage: target.name }), "success");
			return true;
		} catch (e) {
			setError(classifyTransitionError(e));
			return false;
		} finally {
			setBusy(false);
		}
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
	return { busy, error, reloading, run, reload };
}

/** Banners for a failed move: 409 offers a reload, everything else a plain message. */
export function StageFeedback({ move }: { move: StageMove }) {
	const { t } = useI18n();
	if (move.error === null) return null;
	if (move.error === "conflict")
		return (
			<ConflictBanner
				onReload={() => void move.reload()}
				reloading={move.reloading}
				testId="stage-conflict"
				reloadTestId="stage-reload"
				body="deals.err.stale"
			/>
		);
	return (
		<p className="sy-deals__banner" role="alert" data-testid="stage-error">
			{t(TRANSITION_ERR[move.error])}
		</p>
	);
}

/**
 * Header actions of the deal record: Mark lost (danger) / Mark won (success) only when the pipeline has such an edge
 * from the current stage; every other allowed edge sits in the stage menu. No edges = terminal note.
 */
export function StageActions({
	moves,
	busy,
	onLost,
	onWon,
	onMove,
}: {
	moves: StageMoves;
	busy: boolean;
	onLost: (s: Stage) => void;
	onWon: (s: Stage) => void;
	onMove: (s: Stage) => void;
}) {
	const { t } = useI18n();
	const none =
		moves.won === null && moves.lost === null && moves.others.length === 0;
	if (none)
		return (
			<span className="sy-deals__muted" data-testid="stage-none">
				{t("deals.stage.none")}
			</span>
		);
	return (
		<>
			{moves.others.length > 0 ? (
				<MenuButton
					label={t("deals.stage.change")}
					icon="dots"
					testId="stage-menu"
					items={moves.others.map((s) => ({
						id: s.id,
						label: s.name,
						testId: `stage-option-${s.id}`,
						disabled: busy,
						onSelect: () => onMove(s),
					}))}
				/>
			) : null}
			{moves.lost ? (
				<Button
					variant="danger"
					icon="critical"
					disabled={busy}
					onClick={() => onLost(moves.lost as Stage)}
					data-testid="deal-mark-lost"
				>
					{t("action.markLost")}
				</Button>
			) : null}
			{moves.won ? (
				<Button
					variant="success"
					icon="success"
					loading={busy}
					onClick={() => onWon(moves.won as Stage)}
					data-testid="deal-mark-won"
				>
					{t("action.markWon")}
				</Button>
			) : null}
		</>
	);
}

export function StageBadge({ deal }: { deal: DealRow }) {
	return (
		<Badge tone={toneOf(deal.stageOutcome)}>
			<span data-testid="deal-stage">{deal.stageName}</span>
		</Badge>
	);
}

// ---- activity ---------------------------------------------------------------------------------------------

type HistState =
	| { s: "loading" }
	| { s: "error" }
	| { s: "ready"; items: HistoryEntry[] };

export function HistoryList({
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
