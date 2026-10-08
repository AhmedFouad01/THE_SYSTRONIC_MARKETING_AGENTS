import { isUuid } from "../../ui/primitives/Identity.tsx";
import { type ReactNode, useEffect, useMemo, useRef } from "react";
import { PreviewPanel, previewStep, useI18n } from "../../ui/index.ts";

export type ReportPreviewProps = {
	/** Accessible name of the surface ("Campaign details"). */
	label: string;
	/** Plain-text record name for the header. */
	heading: string;
	/** Open row id (null = closed). */
	activeId: string | null;
	/** Row ids in the order of the loaded rows (Prev/Next walk them, no wrap). */
	ids: readonly string[];
	/** More rows exist on the server than are loaded: the position shows the index only (the loaded total would mislead). */
	partial?: boolean;
	onChange: (id: string | null) => void;
	children: ReactNode;
};

/**
 * Reporting row detail as the shared preview slide-over (UI R4 C): same dock, Esc / outside-click, focus return and
 * mobile sheet as Leads, Contacts and Tasks. Reporting rows are client-mode grid rows, so Prev/Next walk the loaded
 * rows. The three tabs (Campaigns, Conversions, Orders) all render through this one component.
 */
export function ReportPreview({ label, heading, activeId, ids, partial, onChange, children }: ReportPreviewProps) {
	const { t, formatNumber } = useI18n();
	const step = useMemo(() => previewStep(ids, activeId, false), [ids, activeId]);
	const lastActive = useRef<string | null>(null);
	useEffect(() => {
		if (activeId !== null) lastActive.current = activeId;
	}, [activeId]);
	return (
		<PreviewPanel
			label={label}
			heading={isUuid(heading) ? label : heading}
			testId="report-detail"
			onClose={() => onChange(null)}
			returnFocus={() =>
				lastActive.current === null
					? null
					: document.querySelector<HTMLElement>(`tr[data-row-id="${CSS.escape(lastActive.current)}"]`)
			}
			nav={{
				onPrev: step.prevId !== null ? () => onChange(step.prevId) : null,
				onNext: step.nextId !== null ? () => onChange(step.nextId) : null,
				...(step.index >= 0
					? {
							position: partial
								? formatNumber(step.index + 1)
								: t("preview.position", {
										index: formatNumber(step.index + 1),
										total: formatNumber(step.total),
									}),
						}
					: {}),
			}}
		>
			<div className="sy-rep__pbody">{children}</div>
		</PreviewPanel>
	);
}
