import { useState } from "react";
import { isApiError } from "../../api/errors.ts";
import { BidiText, Button, Dialog, IconButton, Input, type MessageKey, useI18n, useMediaQuery } from "../../ui/index.ts";
import { createOption, orderOptions, patchOption } from "./api.ts";
import { ColorDot, ColorPicker, MoveButtons } from "./controls.tsx";
import {
	activeOptions,
	classifyWriteError,
	deriveOptionValue,
	issueMessageKey,
	type Lang,
	moveItem,
	type ObjectKey,
	type ObjectSchema,
	OPTIONS_MAX,
	pickLabel,
	type PropertyDef,
	type PropertyOption,
	type WriteErrorKind,
} from "./model.ts";
import { useCommand } from "./useCommand.ts";

const BANNER: Record<WriteErrorKind, MessageKey> = {
	validation: "props.err.validation",
	conflict: "props.conflict",
	exists: "props.err.exists",
	forbidden: "props.err.forbidden",
	network: "props.err.network",
	limit: "props.err.limit",
	notEmpty: "props.err.notEmpty",
	system: "props.err.system",
	other: "props.err.other",
};

const lang = (en: string, ar: string): Lang => ({ ...(en.trim() ? { en: en.trim() } : {}), ...(ar.trim() ? { ar: ar.trim() } : {}) });

/** Options of an EXISTING property. Every action is one API call using the property version as the concurrency token; the schema reloads after each. */
export function ManageOptionsDialog({
	object,
	schema,
	propertyKey,
	onClose,
	reload,
	onConflict,
}: {
	object: ObjectKey;
	schema: ObjectSchema;
	propertyKey: string;
	onClose: () => void;
	reload: () => Promise<void>;
	onConflict: () => void;
}) {
	const { t, locale } = useI18n();
	const sheet = useMediaQuery("(max-width: 720px)");
	const property: PropertyDef | undefined = schema.properties.find((p) => p.key === propertyKey);
	const command = useCommand();
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<{ kind: WriteErrorKind; code?: string } | null>(null);
	const [editing, setEditing] = useState<string | null>(null);
	const [draft, setDraft] = useState({ en: "", ar: "", color: "" });
	const [add, setAdd] = useState({ en: "", ar: "", color: "" });
	if (!property) return null;
	const system = property.is_system;
	const all = [...property.options].sort((a, b) => a.position - b.position);
	const active = activeOptions(property);

	const run = async (call: () => Promise<void>): Promise<boolean> => {
		setBusy(true);
		setError(null);
		try {
			await call();
			await reload();
			return true;
		} catch (e) {
			setError({ kind: classifyWriteError(e), ...(isApiError(e) && e.issues[0] ? { code: e.issues[0].code } : {}) });
			return false;
		} finally {
			setBusy(false);
		}
	};
	const body = (scope: string, b: Record<string, unknown>) => command(scope, { expected_version: property.version, ...b });

	const move = (i: number, dir: -1 | 1) => {
		const next = moveItem(active, i, dir);
		if (!next) return;
		void run(() => orderOptions(object, propertyKey, body("order", { values: next.map((o) => o.value) })));
	};
	const startEdit = (o: PropertyOption) => {
		setEditing(o.value);
		setDraft({ en: o.label.en ?? "", ar: o.label.ar ?? "", color: o.color ?? "" });
	};
	const saveEdit = async (o: PropertyOption) => {
		if (!draft.en.trim() && !draft.ar.trim()) return setError({ kind: "validation", code: "LABEL_REQUIRED" });
		const ok = await run(() =>
			patchOption(object, propertyKey, o.value, body(`edit:${o.value}`, { label: lang(draft.en, draft.ar), color: draft.color || null })),
		);
		if (ok) setEditing(null);
	};
	const setArchived = (o: PropertyOption, archived: boolean) =>
		void run(() => patchOption(object, propertyKey, o.value, body(`arch:${o.value}`, { archived })));
	const addOption = async () => {
		if (!add.en.trim() && !add.ar.trim()) return setError({ kind: "validation", code: "LABEL_REQUIRED" });
		const value = deriveOptionValue(add.en, new Set(all.map((o) => o.value)), all.length);
		const ok = await run(() =>
			createOption(object, propertyKey, body(`add:${value}`, { value, label: lang(add.en, add.ar), color: add.color || null })),
		);
		if (ok) setAdd({ en: "", ar: "", color: "" });
	};

	return (
		<Dialog
			open
			onClose={onClose}
			title={t("props.opt.manageTitle")}
			testId="options-dialog"
			placement={sheet ? "sheet" : "center"}
			footer={
				<Button variant="primary" onClick={onClose} data-testid="options-done">
					{t("props.opt.done")}
				</Button>
			}
		>
			<p className="sy-props__muted">
				<BidiText>{pickLabel(property.label, locale, property.key)}</BidiText>
			</p>
			{error?.kind === "conflict" ? (
				<div className="sy-props__banner" role="alert" data-testid="options-conflict">
					<p>{t("props.conflict")}</p>
					<Button onClick={onConflict}>{t("props.reload")}</Button>
				</div>
			) : error ? (
				<p className="sy-props__banner sy-props__banner--error" role="alert" data-testid="options-error">
					{error.code ? t(issueMessageKey(error.code)) : t(BANNER[error.kind])}
				</p>
			) : null}
			<ul className="sy-props__optlist" data-testid="options-list">
				{all.map((o) => {
					const idx = active.findIndex((a) => a.value === o.value);
					return (
						<li key={o.value} className={`sy-props__opt${o.archived ? " sy-props__opt--archived" : ""}`} data-testid="manage-option">
							{editing === o.value ? (
								<div className="sy-props__optedit">
									<div className="sy-form-row">
										<Input label={t("props.opt.labelEn")} value={draft.en} maxLength={80} data-testid="edit-option-en" onChange={(e) => setDraft({ ...draft, en: e.target.value })} />
										<Input label={t("props.opt.labelAr")} value={draft.ar} maxLength={80} data-testid="edit-option-ar" onChange={(e) => setDraft({ ...draft, ar: e.target.value })} />
									</div>
									<ColorPicker label={t("props.opt.color")} colors={schema.option_colors} value={draft.color} onChange={(color) => setDraft({ ...draft, color })} />
									<div className="sy-props__optactions">
										<Button variant="primary" loading={busy} data-testid="edit-option-save" onClick={() => void saveEdit(o)}>
											{t("props.opt.save")}
										</Button>
										<Button onClick={() => setEditing(null)} disabled={busy}>
											{t("common.cancel")}
										</Button>
									</div>
								</div>
							) : (
								<>
									<span className="sy-props__optname">
										<ColorDot color={o.color} />
										<BidiText>{pickLabel(o.label, locale, o.value)}</BidiText>
										<code className="sy-props__code sy-ltr">{o.value}</code>
										{o.archived ? <span className="sy-props__tag">{t("props.opt.archivedTag")}</span> : null}
									</span>
									<span className="sy-props__optactions">
										{o.archived ? null : (
											<MoveButtons
												idPrefix={`manage-option-${o.value}`}
												upLabel={t("props.opt.up")}
												downLabel={t("props.opt.down")}
												disableUp={idx <= 0}
												disableDown={idx < 0 || idx === active.length - 1}
												busy={busy}
												onUp={() => move(idx, -1)}
												onDown={() => move(idx, 1)}
											/>
										)}
										<IconButton icon="edit" size="sm" aria-label={t("props.opt.edit")} disabled={busy} data-testid="option-edit" onClick={() => startEdit(o)} />
										{system ? null : (
											<Button size="sm" disabled={busy} data-testid={o.archived ? "option-restore" : "option-archive"} onClick={() => setArchived(o, !o.archived)}>
												{o.archived ? t("props.opt.restore") : t("props.opt.archive")}
											</Button>
										)}
									</span>
								</>
							)}
						</li>
					);
				})}
			</ul>
			{system ? null : (
				<fieldset className="sy-props__options">
					<legend className="sy-props__legend">{t("props.opt.add")}</legend>
					<div className="sy-form-row">
						<Input label={t("props.opt.labelEn")} value={add.en} maxLength={80} data-testid="add-option-en" onChange={(e) => setAdd({ ...add, en: e.target.value })} />
						<Input label={t("props.opt.labelAr")} value={add.ar} maxLength={80} data-testid="add-option-ar" onChange={(e) => setAdd({ ...add, ar: e.target.value })} />
					</div>
					<ColorPicker label={t("props.opt.color")} colors={schema.option_colors} value={add.color} onChange={(color) => setAdd({ ...add, color })} />
					<Button icon="plus" loading={busy} disabled={active.length >= OPTIONS_MAX} data-testid="add-option-submit" onClick={() => void addOption()}>
						{t("props.opt.add")}
					</Button>
				</fieldset>
			)}
		</Dialog>
	);
}
