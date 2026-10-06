import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { useI18n } from "../i18n/index.ts";
import { Dialog } from "../overlays/Dialog.tsx";
import type { PreviewGuard } from "../overlays/previewGuard.tsx";
import { PreviewPanel, type PreviewNav } from "../overlays/PreviewPanel.tsx";
import { Button } from "./Button.tsx";
import { Panel } from "./Panel.tsx";
import { RecordDetails, type RecordDetailsRow } from "./RecordDetails.tsx";
import { useRecordSheet } from "./useMediaQuery.ts";
import "./record-panel.css";

/** Lets the sticky edit footer offer Cancel (leave edit mode). */
const RecordCancelContext = createContext<{ cancel: () => void } | null>(null);
/** Dirty reporting from the edit footer to the preview guard (null outside a guarded preview). */
const RecordGuardContext = createContext<PreviewGuard | null>(null);

/** Slide-over mode (UI R4 C): the record opens as an overlay instead of the inline column. */
export type RecordPreview = {
	nav?: PreviewNav;
	guard?: PreviewGuard;
	returnFocus?: () => HTMLElement | null;
};

export type RecordFact = { label: string; value: ReactNode; testId?: string };

export type RecordPanelProps = {
	/** Accessible name of the surface ("Lead details"). */
	label: string;
	testId: string;
	/** Changing record resets edit mode. */
	recordKey: string;
	title: ReactNode;
	titleTestId?: string;
	subtitle?: ReactNode;
	/** Status chip at the inline-end of the title. */
	chip?: ReactNode;
	chipTestId?: string;
	/** Action row under the title (primary actions); the Edit button is appended by the panel. */
	actions?: ReactNode;
	/** Two-column fact grid shown in read mode. */
	facts?: readonly RecordFact[];
	/** Read-mode area under the facts (related records, activity, tabs); hidden while editing. */
	children?: ReactNode;
	/** Always rendered, in read and edit mode (banners, completion state). Receives the current mode. */
	persistent?: (editing: boolean) => ReactNode;
	/** Edit-on-demand form. `done` leaves edit mode (call after a successful save). Omit for read-only records. */
	editor?: (done: () => void) => ReactNode;
	/** Shows the Edit button without an `editor` (the form is rendered through `persistent` with controlled `editing`). */
	editable?: boolean;
	/** Technical details disclosure (ids, revision): never in the visible layer. */
	details?: readonly RecordDetailsRow[];
	/** Closes the record (back button of the sheet below 1024px). */
	onClose: () => void;
	/** Controlled edit mode (optional). */
	editing?: boolean;
	onEditingChange?: (editing: boolean) => void;
	/** Plain-text record name shown in the preview header (single line); defaults to `label`. */
	heading?: string;
	/** Render as the preview slide-over (docked right, non-modal on desktop, full-screen sheet below 1024px) instead of the inline column. */
	preview?: RecordPreview;
};

/**
 * Shared record surface (UX_AUDIT cross-cutting 5): read-first summary card, edit on demand with a dirty-only sticky
 * footer (see RecordEditFooter), technical details disclosure. From 1024px it is an inline panel; below it opens as a
 * full-screen sheet from the inline-end edge with a back button and focus return.
 */
export function RecordPanel(props: RecordPanelProps) {
	const sheet = useRecordSheet();
	const body = <RecordBody key={props.recordKey} {...props} />;
	if (props.preview) {
		const { nav, guard, returnFocus } = props.preview;
		const close = () => (guard ? guard.request(props.onClose) : props.onClose());
		return (
			<RecordGuardContext.Provider value={guard ?? null}>
				<PreviewPanel
					label={props.label}
					testId={props.testId}
					onClose={close}
					{...(props.heading ? { heading: props.heading } : {})}
					{...(nav ? { nav } : {})}
					{...(returnFocus ? { returnFocus } : {})}
				>
					{body}
				</PreviewPanel>
			</RecordGuardContext.Provider>
		);
	}
	if (sheet)
		return (
			<Dialog
				open
				onClose={props.onClose}
				title={props.label}
				placement="side"
				testId={props.testId}
			>
				{body}
			</Dialog>
		);
	return (
		<Panel
			as="aside"
			title={props.label}
			className="sy-record-panel"
			data-testid={props.testId}
			aria-label={props.label}
		>
			{body}
		</Panel>
	);
}

function RecordBody(p: RecordPanelProps) {
	const { t } = useI18n();
	const [innerEditing, setInnerEditing] = useState(false);
	const editing = p.editing ?? innerEditing;
	const canEdit = p.editable ?? Boolean(p.editor);
	const guard = useContext(RecordGuardContext);
	const setEditing = (v: boolean) => {
		setInnerEditing(v);
		p.onEditingChange?.(v);
	};
	return (
		<RecordCancelContext.Provider
			value={{ cancel: () => setEditing(false) }}
		>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: Escape leaves edit mode; popovers (Select) consume their own Escape first */}
			<div
				className="sy-record"
				data-editing={editing || undefined}
				onKeyDown={(e) => {
					if (e.key !== "Escape" || !editing || !canEdit || e.defaultPrevented)
						return;
					e.preventDefault();
					e.stopPropagation();
					// First Esc leaves edit mode; with unsaved changes it asks before discarding.
					if (guard) guard.request(() => setEditing(false));
					else setEditing(false);
				}}
			>
				<div className="sy-record__head">
					<div className="sy-record__titles">
						<p className="sy-record__title" data-testid={p.titleTestId}>
							<bdi dir="auto">{p.title}</bdi>
						</p>
						{p.subtitle ? (
							<p className="sy-record__subtitle">{p.subtitle}</p>
						) : null}
					</div>
					{p.chip ? <span data-testid={p.chipTestId}>{p.chip}</span> : null}
				</div>
				<div className="sy-record__actions">
					{p.actions}
					{canEdit && !editing ? (
						<Button
							size="sm"
							icon="edit"
							onClick={() => setEditing(true)}
							data-testid="record-edit"
						>
							{t("record.edit")}
						</Button>
					) : null}
				</div>
				{p.persistent?.(editing)}
				{editing && canEdit ? (
					p.editor ? (
						<div className="sy-record__edit" data-testid="record-editor">
							{p.editor(() => setEditing(false))}
						</div>
					) : null
				) : (
					<>
						{p.facts && p.facts.length > 0 ? (
							<dl className="sy-record__facts" data-testid="record-facts">
								{p.facts.map((f) => (
									<div key={f.label} className="sy-record__fact">
										<dt>{f.label}</dt>
										<dd data-testid={f.testId}>{f.value}</dd>
									</div>
								))}
							</dl>
						) : null}
						{p.children}
					</>
				)}
				{p.details ? <RecordDetails rows={p.details} /> : null}
			</div>
		</RecordCancelContext.Provider>
	);
}

/** Desktop-only placeholder when no record is selected (the sheet has nothing to show). */
export function RecordEmpty({
	label,
	hint,
	testId,
}: {
	label: string;
	hint: string;
	testId: string;
}) {
	const sheet = useRecordSheet();
	if (sheet) return null;
	return (
		<Panel
			as="aside"
			title={label}
			className="sy-record-panel"
			data-testid={testId}
		>
			<p className="sy-record__muted">{hint}</p>
		</Panel>
	);
}

/**
 * Sticky Save / Cancel footer of an edit form (UI_R4_SPEC D). Always rendered while editing: Save is disabled until
 * the draft differs from the record, Cancel discards the draft and leaves edit mode (the editor unmounts, so its draft
 * state is dropped); there is no separate Discard.
 */
export function RecordEditFooter({
	dirty,
	saving,
	onCancel,
	saveLabel,
	saveTestId,
	disabled,
}: {
	dirty: boolean;
	saving: boolean;
	/** Leaves edit mode; defaults to the surrounding RecordPanel's cancel. */
	onCancel?: () => void;
	saveLabel: string;
	saveTestId: string;
	disabled?: boolean;
}) {
	const { t } = useI18n();
	const ctx = useContext(RecordCancelContext);
	const guard = useContext(RecordGuardContext);
	useEffect(() => {
		guard?.setDirty(dirty);
		return () => guard?.setDirty(false);
	}, [guard, dirty]);
	const cancel = onCancel ?? ctx?.cancel;
	const noChanges = !dirty && !saving;
	return (
		<div className="sy-record__footer" data-testid="record-footer">
			<Button
				type="submit"
				variant="primary"
				size="sm"
				loading={saving}
				disabled={(disabled ?? false) || !dirty}
				aria-disabled={noChanges || undefined}
				title={noChanges ? t("record.noChanges") : undefined}
				data-testid={saveTestId}
			>
				{saveLabel}
			</Button>
			{cancel ? (
				<Button
					size="sm"
					variant="ghost"
					disabled={saving}
					onClick={cancel}
					data-testid="record-edit-cancel"
				>
					{t("record.cancelEdit")}
				</Button>
			) : null}
		</div>
	);
}
