import { useId, useMemo, useRef, useState } from "react";
import {
	Button,
	Dialog,
	Input,
	type MessageKey,
	Select,
	useI18n,
} from "../../ui/index.ts";
import { CustomFieldsEdit, useCustomDraft, useCustomFields, withCreateProperties } from "../properties/index.ts";
import { createDeal } from "./api.ts";
import { AmountField, CurrencySelect } from "./DealDetail.tsx";
import {
	type Assignee,
	buildCreateBody,
	type Contact,
	type CreateErrorKind,
	classifyCreateError,
	type Deal,
	type DealIssue,
	EMPTY_NEW_DEAL,
	initialStages,
	type KeyMemo,
	keyFor,
	type NewDealErrors,
	type NewDealField,
	type NewDealInput,
	type Pipeline,
	validateNewDeal,
} from "./model.ts";

const ISSUE_KEY: Record<DealIssue, MessageKey> = {
	required: "deals.issue.required",
	tooLong: "deals.issue.tooLong",
	amount: "deals.issue.amount",
	currency: "deals.issue.currency",
};
const ERROR_KEY: Record<CreateErrorKind, MessageKey> = {
	validation: "deals.new.err.validation",
	stage: "deals.new.err.stage",
	assignment: "deals.new.err.assignment",
	conflict: "deals.new.err.conflict",
	forbidden: "deals.new.err.forbidden",
	network: "deals.new.err.network",
	other: "deals.new.err.other",
};

export type NewDealPrefill = {
	contactId: string;
	leadId: string | null;
	title: string;
};

function NewDealForm({
	contacts,
	pipelines,
	assignees,
	currencies,
	prefill,
	formId,
	onCreated,
	onBusy,
}: {
	contacts: readonly Contact[];
	pipelines: readonly Pipeline[];
	assignees: readonly Assignee[];
	currencies: readonly string[];
	prefill: NewDealPrefill | null;
	formId: string;
	onCreated: (deal: Deal) => void;
	onBusy: (busy: boolean) => void;
}) {
	const { t } = useI18n();
	const [input, setInput] = useState<NewDealInput>(() => {
		const p = pipelines[0];
		return {
			...EMPTY_NEW_DEAL,
			contactId: prefill?.contactId ?? "",
			title: prefill?.title ?? "",
			pipelineId: p?.id ?? "",
			stageId: p ? (initialStages(p)[0]?.id ?? "") : "",
		};
	});
	const [touched, setTouched] = useState(false);
	const [serverError, setServerError] = useState<CreateErrorKind | null>(null);
	const cf = useCustomFields("deal", "deals", null, null);
	const custom = useCustomDraft(cf, "create");
	const memo = useRef<KeyMemo | null>(null);
	const leadId = prefill?.leadId ?? null;
	const locked = prefill !== null;
	const errors: NewDealErrors = touched ? validateNewDeal(input) : {};
	const err = (f: NewDealField) =>
		errors[f] ? t(ISSUE_KEY[errors[f]]) : undefined;
	const set = (patch: Partial<NewDealInput>) => {
		setServerError(null);
		setInput((p) => ({ ...p, ...patch }));
	};
	const pipeline = pipelines.find((p) => p.id === input.pipelineId);
	const stages = useMemo(
		() => (pipeline ? initialStages(pipeline) : []),
		[pipeline],
	);

	const submit = async () => {
		setTouched(true);
		if (Object.keys(validateNewDeal(input)).length > 0) return;
		if (cf.status === "loading") return;
		const c = custom.prepare();
		if (!c.ok) return;
		memo.current = keyFor(memo.current, input, leadId, () => crypto.randomUUID(), c.patch);
		const key = memo.current.key;
		onBusy(true);
		setServerError(null);
		try {
			onCreated(await createDeal(withCreateProperties(buildCreateBody(input, leadId, key), c.patch), key));
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
			className="sy-deals__form flex flex-col gap-10"
			noValidate
			onSubmit={(e) => {
				e.preventDefault();
				void submit();
			}}
		>
			{serverError ? (
				<p
					className="sy-deals__banner m-0 p-10 rounded-8 bg-info-bg text-info-fg [&_p]:m-0 [&_p]:mt-4 [&_p]:mb-8"
					role="alert"
					data-testid="new-deal-error"
				>
					{t(ERROR_KEY[serverError])}
				</p>
			) : null}
			<Input
				label={t("deals.field.title")}
				name="title"
				required
				value={input.title}
				maxLength={160}
				error={err("title")}
				data-autofocus
				onChange={(e) => set({ title: e.target.value })}
			/>
			<Select
				label={t("deals.new.contact")}
				name="contact"
				required
				value={input.contactId}
				disabled={locked}
				error={err("contactId")}
				onChange={(e) => set({ contactId: e.target.value })}
			>
				<option value="">{t("deals.new.contactPick")}</option>
				{contacts.map((c) => (
					<option key={c.id} value={c.id}>
						{c.display_name}
					</option>
				))}
			</Select>
			<Select
				label={t("deals.new.pipeline")}
				name="pipeline"
				required
				value={input.pipelineId}
				error={err("pipelineId")}
				onChange={(e) => {
					const p = pipelines.find((x) => x.id === e.target.value);
					set({
						pipelineId: e.target.value,
						stageId: p ? (initialStages(p)[0]?.id ?? "") : "",
					});
				}}
			>
				{input.pipelineId === "" ? (
					<option value="">{t("deals.new.pipelinePick")}</option>
				) : null}
				{pipelines.map((p) => (
					<option key={p.id} value={p.id}>
						{p.name}
					</option>
				))}
			</Select>
			<Select
				label={t("deals.new.stage")}
				name="stage"
				required
				value={input.stageId}
				error={err("stageId")}
				onChange={(e) => set({ stageId: e.target.value })}
			>
				{stages.map((s) => (
					<option key={s.id} value={s.id}>
						{s.name}
					</option>
				))}
			</Select>
			<div className="sy-deals__pair grid grid-cols-[minmax(0,1fr)_minmax(96px,140px)] gap-10 items-start">
				<AmountField
					label={t("deals.field.amount")}
					value={input.amount}
					error={err("amount")}
					onChange={(amount) => set({ amount })}
				/>
				<CurrencySelect
					label={t("deals.field.currency")}
					value={input.currency}
					choices={currencies}
					error={err("currency")}
					onChange={(currency) => set({ currency })}
				/>
			</div>
			<Select
				label={t("deals.new.owner")}
				name="owner"
				value={input.ownerId}
				onChange={(e) => set({ ownerId: e.target.value })}
			>
				<option value="">{t("deals.new.ownerMe")}</option>
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

export function NewDealDialog({
	open,
	onClose,
	contacts,
	pipelines,
	assignees,
	currencies,
	prefill,
	onCreated,
}: {
	open: boolean;
	onClose: () => void;
	contacts: readonly Contact[];
	pipelines: readonly Pipeline[];
	assignees: readonly Assignee[];
	currencies: readonly string[];
	prefill: NewDealPrefill | null;
	onCreated: (deal: Deal) => void;
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
			title={t("deals.new.title")}
			testId="new-deal-dialog"
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
						data-testid="new-deal-submit"
					>
						{t("deals.new.create")}
					</Button>
				</>
			}
		>
			<NewDealForm
				contacts={contacts}
				pipelines={pipelines}
				assignees={assignees}
				currencies={currencies}
				prefill={prefill}
				formId={formId}
				onBusy={setBusy}
				onCreated={onCreated}
			/>
		</Dialog>
	);
}
