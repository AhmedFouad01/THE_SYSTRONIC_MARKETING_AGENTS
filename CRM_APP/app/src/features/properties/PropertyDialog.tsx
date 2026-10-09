import { useId, useState } from "react";
import { isApiError } from "../../api/errors.ts";
import { Button, Dialog, Input, type MessageKey, Select, useI18n, useMediaQuery } from "../../ui/index.ts";
import { createProperty, patchProperty } from "./api.ts";
import { Check } from "./controls.tsx";
import {
	activeGroups,
	buildCreateBody,
	buildPatchBody,
	classifyWriteError,
	draftOf,
	EMPTY_DRAFT,
	hasDraftErrors,
	isSearchableType,
	isSelectType,
	issueMessageKey,
	type ObjectKey,
	type ObjectSchema,
	contentLabel,
	type PropertyDef,
	type PropertyDraft,
	type PropType,
	type ServerFieldErrors,
	serverFieldErrors,
	validateDraft,
	type WriteErrorKind,
	withLabel,
	withType,
} from "./model.ts";
import { OptionsEditor } from "./OptionsEditor.tsx";
import { useCommand } from "./useCommand.ts";

const BANNER: Record<Exclude<WriteErrorKind, "conflict">, MessageKey> = {
	validation: "props.err.validation",
	exists: "props.err.exists",
	forbidden: "props.err.forbidden",
	network: "props.err.network",
	limit: "props.err.limit",
	notEmpty: "props.err.notEmpty",
	system: "props.err.system",
	other: "props.err.other",
};

/** Create (property undefined) or edit (system properties: label and group only; immutable fields shown read-only). */
export function PropertyDialog({
	object,
	schema,
	property,
	onClose,
	onSaved,
	onConflict,
}: {
	object: ObjectKey;
	schema: ObjectSchema;
	property?: PropertyDef;
	onClose: () => void;
	onSaved: (kind: "created" | "updated") => Promise<void> | void;
	onConflict: () => void;
}) {
	const { t, locale } = useI18n();
	const formId = useId();
	const sheet = useMediaQuery("(max-width: 720px)");
	const creating = property === undefined;
	const system = property?.is_system === true;
	const groups = activeGroups(schema);
	const [draft, setDraft] = useState<PropertyDraft>(() =>
		property
			? draftOf(property)
			: { ...EMPTY_DRAFT, group: groups.find((g) => g.key === "general")?.key ?? groups[0]?.key ?? "general" },
	);
	const [touched, setTouched] = useState(false);
	const [busy, setBusy] = useState(false);
	const [server, setServer] = useState<ServerFieldErrors | null>(null);
	const [banner, setBanner] = useState<WriteErrorKind | null>(null);
	const command = useCommand();

	const spec = schema.types.find((s) => s.type === draft.type);
	const errors = validateDraft(draft, creating, system);
	// live: the key and the label shows its problem as soon as something was typed; the rest after the first submit
	const live = {
		key: creating && draft.key !== "" ? errors.key : undefined,
		label: touched ? errors.label : undefined,
	};
	const set = (next: PropertyDraft) => {
		setServer(null);
		setBanner(null);
		setDraft(next);
	};
	const patch = (p: Partial<PropertyDraft>) => set({ ...draft, ...p });
	const msg = (client: string | undefined, key: keyof ServerFieldErrors): string | undefined => {
		if (client) return client;
		const code = server?.[key];
		return typeof code === "string" ? t(issueMessageKey(code)) : undefined;
	};
	const issue = (c: string | undefined) =>
		c ? t(`props.issue.${c}` as MessageKey) : undefined;
	const show = <K extends keyof typeof errors>(k: K) =>
		touched ? issue(errors[k] as string | undefined) : undefined;

	const submit = async () => {
		setTouched(true);
		if (hasDraftErrors(errors)) return;
		const body = creating ? buildCreateBody(draft, "") : buildPatchBody(property, draft, "");
		if (body === null) return onClose();
		setBusy(true);
		setBanner(null);
		try {
			const withId = command(creating ? "create" : `patch:${property.key}`, body);
			if (creating) await createProperty(object, withId);
			else await patchProperty(object, property.key, withId);
			await onSaved(creating ? "created" : "updated");
		} catch (e) {
			const kind = classifyWriteError(e);
			setBanner(kind);
			setServer(isApiError(e) ? serverFieldErrors(e.issues) : null);
		} finally {
			setBusy(false);
		}
	};

	const labelError = live.label ? issue(live.label) : msg(undefined, "label");
	const typeOptions = schema.types.map((s) => s.type);
	const displayChoices = spec?.displays ?? ["default"];
	const flagsError = show("flags") ?? msg(undefined, "flags");
	const lockedFlags = system;

	return (
		<Dialog
			open
			onClose={() => {
				if (!busy) onClose();
			}}
			title={creating ? t("props.dlg.createTitle") : t("props.dlg.editTitle")}
			testId="property-dialog"
			placement={sheet ? "sheet" : "center"}
			footer={
				<>
					<Button onClick={onClose} disabled={busy}>
						{t("common.cancel")}
					</Button>
					<Button type="submit" form={formId} variant="primary" loading={busy} data-testid="property-submit">
						{creating ? t("props.dlg.create") : t("props.dlg.save")}
					</Button>
				</>
			}
		>
			<form
				id={formId}
				className="sy-props__form"
				noValidate
				onSubmit={(e) => {
					e.preventDefault();
					void submit();
				}}
			>
				{banner === "conflict" ? (
					<div className="sy-props__banner" role="alert" data-testid="property-conflict">
						<p>{t("props.conflict")}</p>
						<Button onClick={onConflict} data-testid="property-reload">
							{t("props.reload")}
						</Button>
					</div>
				) : banner ? (
					<p className="sy-props__banner sy-props__banner--error" role="alert" data-testid="property-error">
						{t(BANNER[banner])}
					</p>
				) : null}
				{system ? (
					<p className="sy-props__note" data-testid="system-note">
						{t("props.system.note")}
					</p>
				) : null}
				<div className="sy-form-row">
					<Input
						label={t("props.f.label")}
						dir="auto"
						name="label"
						value={draft.label}
						maxLength={120}
						data-autofocus
						data-testid="label"
						error={labelError}
						hint={t("props.f.labelHint")}
						onChange={(e) => set(withLabel(draft, e.target.value, creating))}
					/>
				</div>
				<Input
					label={t("props.f.key")}
					name="key"
					dir="ltr"
					value={draft.key}
					maxLength={63}
					disabled={!creating}
					data-testid="key"
					error={issue(live.key) ?? msg(undefined, "key")}
					hint={creating ? t("props.f.keyHint") : t("props.f.keyLocked")}
					onChange={(e) => set({ ...draft, key: e.target.value, keyTouched: true })}
				/>
				<div className="sy-form-row">
					<Select
						label={t("props.f.type")}
						name="type"
						value={draft.type}
						disabled={!creating}
						data-testid="type"
						error={msg(undefined, "type")}
						onChange={(e) => set(withType(draft, e.target.value as PropType))}
					>
						{typeOptions.map((ty) => (
							<option key={ty} value={ty}>
								{t(`props.type.${ty}` as MessageKey)}
							</option>
						))}
					</Select>
					<Select
						label={t("props.f.group")}
						name="group"
						value={draft.group}
						data-testid="group"
						error={msg(undefined, "group")}
						onChange={(e) => patch({ group: e.target.value })}
					>
						{groups.map((g) => (
							<option key={g.key} value={g.key}>
								{contentLabel(g, locale, t, g.key)}
							</option>
						))}
					</Select>
				</div>
				{draft.type === "currency" ? (
					<Input
						label={t("props.f.currency")}
						name="currency"
						dir="ltr"
						value={draft.currency}
						maxLength={3}
						disabled={!creating}
						data-testid="currency"
						hint={t("props.f.currencyHint")}
						error={show("currency") ?? msg(undefined, "currency")}
						onChange={(e) => patch({ currency: e.target.value.toUpperCase() })}
					/>
				) : null}
				{displayChoices.length > 1 ? (
					<Select
						label={t("props.f.display")}
						name="display"
						value={draft.display}
						disabled={lockedFlags}
						data-testid="display"
						error={msg(undefined, "display")}
						onChange={(e) => patch({ display: e.target.value })}
					>
						{displayChoices.map((d) => (
							<option key={d} value={d}>
								{t(`props.display.${d}` as MessageKey)}
							</option>
						))}
					</Select>
				) : null}
				{spec?.validation.includes("max_length") ? (
					<Input
						label={t("props.f.maxLength")}
						name="max_length"
						type="number"
						value={draft.maxLength}
						disabled={lockedFlags}
						data-testid="max-length"
						error={show("maxLength") ?? msg(undefined, "maxLength")}
						onChange={(e) => patch({ maxLength: e.target.value })}
					/>
				) : null}
				{spec?.validation.includes("min") ? (
					<div className="sy-form-row">
						<Input
							label={t("props.f.min")}
							name="min"
							type="number"
							value={draft.min}
							disabled={lockedFlags}
							data-testid="min"
							error={show("min") ?? msg(undefined, "min")}
							onChange={(e) => patch({ min: e.target.value })}
						/>
						<Input
							label={t("props.f.max")}
							name="max"
							type="number"
							value={draft.max}
							disabled={lockedFlags}
							data-testid="max"
							error={show("max") ?? msg(undefined, "max")}
							onChange={(e) => patch({ max: e.target.value })}
						/>
					</div>
				) : null}
				{spec?.validation.includes("max_selected") ? (
					<Input
						label={t("props.f.maxSelected")}
						name="max_selected"
						type="number"
						value={draft.maxSelected}
						disabled={lockedFlags}
						data-testid="max-selected"
						error={show("maxSelected") ?? msg(undefined, "maxSelected")}
						onChange={(e) => patch({ maxSelected: e.target.value })}
					/>
				) : null}
				<fieldset className="sy-props__flags">
					<legend className="sy-props__legend">{t("props.f.flags")}</legend>
					<Check
						label={t("props.f.required")}
						checked={draft.required}
						disabled={lockedFlags}
						testId="flag-required"
						onChange={(v) => patch({ required: v })}
					/>
					<Check
						label={t("props.f.readOnly")}
						checked={draft.read_only}
						disabled={lockedFlags}
						testId="flag-read-only"
						onChange={(v) => patch({ read_only: v })}
					/>
					<Check
						label={t("props.f.sensitive")}
						checked={draft.sensitive}
						disabled={lockedFlags}
						testId="flag-sensitive"
						onChange={(v) => patch({ sensitive: v })}
					/>
					{isSearchableType(draft.type) ? (
						<Check
							label={t("props.f.searchable")}
							checked={draft.searchable}
							disabled={lockedFlags}
							testId="flag-searchable"
							onChange={(v) => patch({ searchable: v })}
						/>
					) : null}
					<Check
						label={t("props.f.showDefault")}
						checked={draft.show_default}
						disabled={lockedFlags}
						testId="flag-show-default"
						onChange={(v) => patch({ show_default: v })}
					/>
					{flagsError ? (
						<p className="sy-field__error" role="alert" data-testid="flags-error">
							{flagsError}
						</p>
					) : null}
				</fieldset>
				{creating && isSelectType(draft.type) ? (
					<OptionsEditor
						options={draft.options}
						colors={schema.option_colors}
						errors={touched ? errors.option : {}}
						serverRows={server?.optionRows ?? {}}
						listError={show("options") ?? msg(undefined, "options")}
						onChange={(options) => set({ ...draft, options })}
					/>
				) : null}
			</form>
		</Dialog>
	);
}
