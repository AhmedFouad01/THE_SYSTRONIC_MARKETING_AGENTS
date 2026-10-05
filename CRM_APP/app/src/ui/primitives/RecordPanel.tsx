import { type ReactNode, useState } from "react";
import { useI18n } from "../i18n/index.ts";
import { Dialog } from "../overlays/Dialog.tsx";
import { Button } from "./Button.tsx";
import { Panel } from "./Panel.tsx";
import { RecordDetails, type RecordDetailsRow } from "./RecordDetails.tsx";
import { useRecordSheet } from "./useMediaQuery.ts";
import "./record-panel.css";

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
};

/**
 * Shared record surface (UX_AUDIT cross-cutting 5): read-first summary card, edit on demand with a dirty-only sticky
 * footer (see RecordEditFooter), technical details disclosure. From 1024px it is an inline panel; below it opens as a
 * full-screen sheet from the inline-end edge with a back button and focus return.
 */
export function RecordPanel(props: RecordPanelProps) {
	const sheet = useRecordSheet();
	const body = <RecordBody key={props.recordKey} {...props} />;
	if (sheet)
		return (
			<Dialog open onClose={props.onClose} title={props.label} placement="side" testId={props.testId}>
				{body}
			</Dialog>
		);
	return (
		<Panel as="aside" title={props.label} className="sy-record-panel" data-testid={props.testId} aria-label={props.label}>
			{body}
		</Panel>
	);
}

function RecordBody(p: RecordPanelProps) {
	const { t } = useI18n();
	const [innerEditing, setInnerEditing] = useState(false);
	const editing = p.editing ?? innerEditing;
	const canEdit = p.editable ?? Boolean(p.editor);
	const setEditing = (v: boolean) => {
		setInnerEditing(v);
		p.onEditingChange?.(v);
	};
	return (
		<div className="sy-record" data-editing={editing || undefined}>
			<div className="sy-record__head">
				<div className="sy-record__titles">
					<p className="sy-record__title" data-testid={p.titleTestId}>
						{p.title}
					</p>
					{p.subtitle ? <p className="sy-record__subtitle">{p.subtitle}</p> : null}
				</div>
				{p.chip ? <span data-testid={p.chipTestId}>{p.chip}</span> : null}
			</div>
			<div className="sy-record__actions">
				{p.actions}
				{canEdit ? (
					editing ? (
						<Button size="sm" variant="ghost" onClick={() => setEditing(false)} data-testid="record-edit-cancel">
							{t("record.cancelEdit")}
						</Button>
					) : (
						<Button size="sm" icon="edit" onClick={() => setEditing(true)} data-testid="record-edit">
							{t("record.edit")}
						</Button>
					)
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
	);
}

/** Desktop-only placeholder when no record is selected (the sheet has nothing to show). */
export function RecordEmpty({ label, hint, testId }: { label: string; hint: string; testId: string }) {
	const sheet = useRecordSheet();
	if (sheet) return null;
	return (
		<Panel as="aside" title={label} className="sy-record-panel" data-testid={testId}>
			<p className="sy-record__muted">{hint}</p>
		</Panel>
	);
}

/** Sticky Save / Discard footer of an edit form. Rendered only while the draft differs from the record. */
export function RecordEditFooter({
	dirty,
	saving,
	onDiscard,
	saveLabel,
	discardLabel,
	saveTestId,
	disabled,
}: {
	dirty: boolean;
	saving: boolean;
	onDiscard: () => void;
	saveLabel: string;
	discardLabel: string;
	saveTestId: string;
	disabled?: boolean;
}) {
	if (!dirty) return null;
	return (
		<div className="sy-record__footer" data-testid="record-footer">
			<Button type="submit" variant="primary" size="sm" loading={saving} disabled={disabled ?? false} data-testid={saveTestId}>
				{saveLabel}
			</Button>
			<Button size="sm" variant="ghost" disabled={saving} onClick={onDiscard} data-testid="record-discard">
				{discardLabel}
			</Button>
		</div>
	);
}
