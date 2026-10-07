import { useState } from "react";
import { isApiError } from "../../api/errors.ts";
import { BidiText, Button, Dialog, IconButton, Input, type MessageKey, useI18n, useMediaQuery } from "../../ui/index.ts";
import { archiveGroup, createGroup, orderGroups, patchGroup } from "./api.ts";
import { MoveButtons } from "./controls.tsx";
import {
	activeGroups,
	classifyWriteError,
	deriveKey,
	issueMessageKey,
	KEY_RE,
	type Lang,
	moveItem,
	type ObjectKey,
	type ObjectSchema,
	pickLabel,
	type SchemaGroup,
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

/** Create, rename, archive and reorder the groups of one object. The seeded `general` group cannot be archived (it always holds system properties). */
export function GroupsDialog({
	object,
	schema,
	onClose,
	reload,
	onConflict,
}: {
	object: ObjectKey;
	schema: ObjectSchema;
	onClose: () => void;
	reload: () => Promise<void>;
	onConflict: () => void;
}) {
	const { t, locale } = useI18n();
	const sheet = useMediaQuery("(max-width: 720px)");
	const command = useCommand();
	const groups = activeGroups(schema);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<{ kind: WriteErrorKind; code?: string } | null>(null);
	const [editing, setEditing] = useState<string | null>(null);
	const [draft, setDraft] = useState({ en: "", ar: "" });
	const [add, setAdd] = useState({ en: "", ar: "", key: "", keyTouched: false });
	const [confirm, setConfirm] = useState<SchemaGroup | null>(null);

	const run = async (call: () => Promise<void>): Promise<boolean> => {
		setBusy(true);
		setError(null);
		try {
			await call();
			await reload();
			return true;
		} catch (e) {
			setError({ kind: classifyWriteError(e), ...(isApiError(e) && e.kind !== "version_conflict" && e.issues[0] ? { code: e.issues[0].code } : {}) });
			return false;
		} finally {
			setBusy(false);
		}
	};
	const move = (i: number, dir: -1 | 1) => {
		const next = moveItem(groups, i, dir);
		if (!next) return;
		void run(() => orderGroups(object, command("order", { keys: next.map((g) => g.key), expected_schema_rev: schema.schema_rev })));
	};
	const saveEdit = async (g: SchemaGroup) => {
		if (!draft.en.trim() && !draft.ar.trim()) return setError({ kind: "validation", code: "LABEL_REQUIRED" });
		const ok = await run(() => patchGroup(object, g.key, command(`edit:${g.key}`, { expected_version: g.version, label: lang(draft.en, draft.ar) })));
		if (ok) setEditing(null);
	};
	const addGroup = async () => {
		if (!add.en.trim() && !add.ar.trim()) return setError({ kind: "validation", code: "LABEL_REQUIRED" });
		if (!KEY_RE.test(add.key)) return setError({ kind: "validation", code: "KEY_INVALID" });
		const ok = await run(() => createGroup(object, command("add", { key: add.key, label: lang(add.en, add.ar) })));
		if (ok) setAdd({ en: "", ar: "", key: "", keyTouched: false });
	};
	const archive = async (g: SchemaGroup) => {
		await run(() => archiveGroup(object, g.key, command(`arch:${g.key}`, { expected_version: g.version })));
		setConfirm(null);
	};

	return (
		<Dialog
			open
			onClose={onClose}
			title={t("props.grp.title")}
			testId="groups-dialog"
			placement={sheet ? "sheet" : "center"}
			footer={
				<Button variant="primary" onClick={onClose} data-testid="groups-close">
					{t("props.grp.close")}
				</Button>
			}
		>
			{error?.kind === "conflict" ? (
				<div className="sy-props__banner" role="alert" data-testid="groups-conflict">
					<p>{t("props.conflict")}</p>
					<Button onClick={onConflict}>{t("props.reload")}</Button>
				</div>
			) : error ? (
				<p className="sy-props__banner sy-props__banner--error" role="alert" data-testid="groups-error">
					{error.code ? t(issueMessageKey(error.code)) : t(BANNER[error.kind])}
				</p>
			) : null}
			<ul className="sy-props__optlist" data-testid="groups-list">
				{groups.map((g, i) => (
					<li key={g.key} className="sy-props__opt" data-testid="group-row">
						{editing === g.key ? (
							<div className="sy-props__optedit">
								<div className="sy-form-row">
									<Input label={t("props.grp.labelEn")} value={draft.en} maxLength={80} data-testid="edit-group-en" onChange={(e) => setDraft({ ...draft, en: e.target.value })} />
									<Input label={t("props.grp.labelAr")} value={draft.ar} maxLength={80} data-testid="edit-group-ar" onChange={(e) => setDraft({ ...draft, ar: e.target.value })} />
								</div>
								<div className="sy-props__optactions">
									<Button variant="primary" loading={busy} data-testid="edit-group-save" onClick={() => void saveEdit(g)}>
										{t("props.grp.save")}
									</Button>
									<Button onClick={() => setEditing(null)} disabled={busy}>
										{t("props.grp.cancel")}
									</Button>
								</div>
							</div>
						) : (
							<>
								<span className="sy-props__optname">
									<BidiText>{pickLabel(g.label, locale, g.key)}</BidiText>
									<code className="sy-props__code sy-ltr">{g.key}</code>
								</span>
								<span className="sy-props__optactions">
									<MoveButtons
										idPrefix={`group-${g.key}`}
										upLabel={t("props.grp.up")}
										downLabel={t("props.grp.down")}
										disableUp={i === 0}
										disableDown={i === groups.length - 1}
										busy={busy}
										onUp={() => move(i, -1)}
										onDown={() => move(i, 1)}
									/>
									<IconButton
										icon="edit"
										size="sm"
										aria-label={t("props.grp.edit")}
										disabled={busy}
										data-testid="group-edit"
										onClick={() => {
											setEditing(g.key);
											setDraft({ en: g.label.en ?? "", ar: g.label.ar ?? "" });
										}}
									/>
									{g.key === "general" ? null : (
										<Button size="sm" disabled={busy} data-testid="group-archive" onClick={() => setConfirm(g)}>
											{t("props.grp.archive")}
										</Button>
									)}
								</span>
							</>
						)}
					</li>
				))}
			</ul>
			<fieldset className="sy-props__options">
				<legend className="sy-props__legend">{t("props.grp.add")}</legend>
				<div className="sy-form-row">
					<Input
						label={t("props.grp.labelEn")}
						value={add.en}
						maxLength={80}
						data-testid="add-group-en"
						onChange={(e) => setAdd({ ...add, en: e.target.value, key: add.keyTouched ? add.key : deriveKey(e.target.value) })}
					/>
					<Input label={t("props.grp.labelAr")} value={add.ar} maxLength={80} data-testid="add-group-ar" onChange={(e) => setAdd({ ...add, ar: e.target.value })} />
				</div>
				<Input
					label={t("props.grp.key")}
					dir="ltr"
					value={add.key}
					maxLength={63}
					data-testid="add-group-key"
					error={add.key !== "" && !KEY_RE.test(add.key) ? t("props.issue.keyInvalid") : undefined}
					onChange={(e) => setAdd({ ...add, key: e.target.value, keyTouched: true })}
				/>
				<Button icon="plus" loading={busy} data-testid="add-group-submit" onClick={() => void addGroup()}>
					{t("props.grp.add")}
				</Button>
			</fieldset>
			<Dialog
				open={confirm !== null}
				onClose={() => setConfirm(null)}
				title={t("props.grp.archive")}
				description={t("props.grp.archiveBody")}
				testId="group-archive-dialog"
				confirm={{ label: t("props.archive.confirm"), loading: busy, onConfirm: () => confirm && void archive(confirm) }}
			>
				{confirm ? (
					<p>
						<BidiText>{pickLabel(confirm.label, locale, confirm.key)}</BidiText>
					</p>
				) : null}
			</Dialog>
		</Dialog>
	);
}
