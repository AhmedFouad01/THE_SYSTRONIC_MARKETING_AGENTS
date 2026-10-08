import { Button as AriaButton } from "react-aria-components";
import { type ReactNode, useState } from "react";
import { Identity, isUuid } from "./Identity.tsx";
import { Ltr, useI18n } from "../i18n/index.ts";

export type RecordDetailsRow = {
	label: string;
	value: string | number;
	testId?: string;
	/** Adds a copy button (identifiers). */
	copyable?: boolean;
};

/**
 * Technical record data (ids, revision) lives here, collapsed by default, never in the visible detail layer
 * (UX_AUDIT cross-cutting 8). Values render LTR; identifiers get a copy button.
 */
export function RecordDetails({
	rows,
	children,
}: {
	rows: readonly RecordDetailsRow[];
	children?: ReactNode;
}) {
	const { t } = useI18n();
	const [copied, setCopied] = useState<string | null>(null);
	const copy = async (label: string, value: string) => {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(label);
			setTimeout(() => setCopied((c) => (c === label ? null : c)), 1500);
		} catch {
			// clipboard unavailable: the value stays selectable in the disclosure
		}
	};
	return (
		<details className="sy-record-details mt-12 text-text-3 text-data [line-height:var(--sy-type-data-line)]" data-testid="record-details">
			<summary className="sy-record-details__summary cursor-pointer w-fit text-text-2 font-[600] focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2">
				{t("record.technical")}
			</summary>
			<dl className="sy-record-details__list grid gap-6 m-0 mt-8">
				{rows.map((r) => (
					<div key={r.label} className="sy-record-details__row grid grid-cols-[auto_minmax(0,1fr)] gap-10 [&_dd]:flex [&_dd]:items-center [&_dd]:flex-wrap [&_dd]:gap-8 [&_dd]:m-0 [&_dd]:[overflow-wrap:anywhere] [&_dd]:text-start">
						<dt>{r.label}</dt>
						<dd data-testid={r.testId}>
							{isUuid(r.value) ? <Identity value={r.value} label={r.label} /> : <Ltr>{r.value}</Ltr>}
							{r.copyable ? (
								<AriaButton
									type="button"
									className="sy-record-details__copy py-2 px-8 border border-solid border-border rounded-6 bg-surface text-text-2 cursor-pointer data-[focus-visible]:outline-2 data-[focus-visible]:outline-focus data-[focus-visible]:outline-offset-1"
									aria-label={t("common.copyValue", { label: r.label })}
									onClick={() => void copy(r.label, String(r.value))}
								>
									{copied === r.label ? t("common.copied") : t("common.copy")}
								</AriaButton>
							) : null}
						</dd>
					</div>
				))}
			</dl>
			{children}
		</details>
	);
}
