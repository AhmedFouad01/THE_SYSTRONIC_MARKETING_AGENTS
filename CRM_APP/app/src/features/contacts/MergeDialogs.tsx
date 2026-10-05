import { useEffect, useMemo, useRef, useState } from "react";
import {
	Button,
	Dialog,
	LoadingState,
	ErrorState,
	type MessageKey,
	useI18n,
} from "../../ui/index.ts";
import { fetchContact, mergeContacts, previewMerge } from "./api.ts";
import {
	buildMergeBody,
	classifyMergeError,
	type Contact,
	type ContactRow,
	type Duplicate,
	type MergeErrorKind,
	type MergePreview,
	mergeFieldRows,
} from "./model.ts";

const ERR_KEY: Record<MergeErrorKind, MessageKey> = {
	stale: "contacts.merge.err.stale",
	forbidden: "contacts.merge.err.forbidden",
	network: "contacts.merge.err.network",
	other: "contacts.merge.err.other",
};

type Loaded = { preview: MergePreview; source: Contact };

/**
 * Two-step merge: Dialog 1 shows the field-by-field preview (POST merge-previews), Dialog 2 confirms (danger) and
 * POSTs merges with the preview's versions (a stale preview is a 409). Mounted only while a merge is in progress.
 */
export function MergeDialogs({
	duplicate,
	target,
	ownerName,
	onClose,
	onMerged,
}: {
	duplicate: Duplicate;
	target: ContactRow;
	ownerName: (ownerId: string | null) => string;
	onClose: () => void;
	onMerged: (sourceId: string) => void;
}) {
	const { t } = useI18n();
	const [loaded, setLoaded] = useState<Loaded | null>(null);
	const [loadFailed, setLoadFailed] = useState(false);
	const [step, setStep] = useState<"preview" | "confirm">("preview");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<MergeErrorKind | null>(null);
	// One command id per preview: a retry of the same merge replays instead of re-running.
	const commandId = useRef<string | null>(null);

	useEffect(() => {
		let live = true;
		Promise.all([
			previewMerge(duplicate.id, target.id),
			fetchContact(duplicate.id),
		])
			.then(([preview, source]) => {
				if (live) setLoaded({ preview, source });
			})
			.catch(() => {
				if (live) setLoadFailed(true);
			});
		return () => {
			live = false;
		};
	}, [duplicate.id, target.id]);

	const fields = useMemo(
		() =>
			loaded
				? mergeFieldRows(
						{
							display_name: loaded.source.display_name,
							ownerName: ownerName(loaded.source.owner_id),
							source: loaded.source.source,
						},
						{
							display_name: target.display_name,
							ownerName: target.ownerName,
							source: target.source,
						},
					)
				: [],
		[loaded, target, ownerName],
	);

	const confirm = async () => {
		if (!loaded) return;
		commandId.current ??= crypto.randomUUID();
		const key = commandId.current;
		setBusy(true);
		setError(null);
		try {
			await mergeContacts(buildMergeBody(loaded.preview, key), key);
			onMerged(duplicate.id);
		} catch (e) {
			setError(classifyMergeError(e));
		} finally {
			setBusy(false);
		}
	};

	const names = {
		source: loaded?.source.display_name ?? duplicate.display_name,
		target: target.display_name,
	};
	const p = loaded?.preview;
	return (
		<>
			<Dialog
				open={step === "preview"}
				onClose={onClose}
				title={t("contacts.merge.title")}
				testId="merge-preview-dialog"
				footer={
					<>
						<Button onClick={onClose}>{t("common.cancel")}</Button>
						<Button
							variant="primary"
							disabled={!loaded}
							onClick={() => setStep("confirm")}
							data-testid="merge-continue"
						>
							{t("contacts.merge.continue")}
						</Button>
					</>
				}
			>
				{loadFailed ? (
					<ErrorState title={t("contacts.merge.previewFailed")} />
				) : !loaded || !p ? (
					<LoadingState />
				) : (
					<div>
						<p>{t("contacts.merge.intro", names)}</p>
						<table className="sy-contacts__table" data-testid="merge-fields">
							<thead>
								<tr>
									<th scope="col">{t("contacts.merge.field")}</th>
									<th scope="col">{t("contacts.merge.source")}</th>
									<th scope="col">{t("contacts.merge.target")}</th>
									<th scope="col">{t("contacts.merge.result")}</th>
								</tr>
							</thead>
							<tbody>
								{fields.map((f) => (
									<tr key={f.field} data-differs={String(f.differs)}>
										<th scope="row">
											{t(`contacts.merge.field.${f.field}` as MessageKey)}
										</th>
										<td>{f.source}</td>
										<td>{f.target}</td>
										<td>
											<b>{f.result}</b>
										</td>
									</tr>
								))}
							</tbody>
						</table>
						<p data-testid="merge-affected">
							{t("contacts.merge.affected", {
								leads: String(p.affected.leads),
								deals: String(p.affected.deals),
								tasks: String(p.affected.tasks),
								identifiers: String(p.affected.identifiers),
							})}
						</p>
						{p.conflicts.length > 0 ? (
							<p className="sy-contacts__muted">
								{t("contacts.merge.conflicts")}:{" "}
								{p.conflicts.map((c) => (
									<bdi key={c} dir="ltr" className="sy-ltr">
										{c}
									</bdi>
								))}
							</p>
						) : null}
					</div>
				)}
			</Dialog>
			<Dialog
				open={step === "confirm"}
				onClose={() => {
					if (!busy) setStep("preview");
				}}
				title={t("contacts.merge.confirmTitle")}
				testId="merge-confirm-dialog"
				confirm={{
					label: t("contacts.merge.confirm"),
					onConfirm: () => void confirm(),
					tone: "danger",
					loading: busy,
				}}
			>
				<p>{t("contacts.merge.confirmBody", names)}</p>
				{error ? (
					<p
						className="sy-contacts__banner"
						role="alert"
						data-testid="merge-error"
					>
						{t(ERR_KEY[error])}
					</p>
				) : null}
			</Dialog>
		</>
	);
}
