import { type ReactNode, useState } from "react";
import { Ltr, useI18n } from "../i18n/index.ts";
import "./record-details.css";

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
export function RecordDetails({ rows, children }: { rows: readonly RecordDetailsRow[]; children?: ReactNode }) {
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
		<details className="sy-record-details" data-testid="record-details">
			<summary className="sy-record-details__summary">{t("common.details")}</summary>
			<dl className="sy-record-details__list">
				{rows.map((r) => (
					<div key={r.label} className="sy-record-details__row">
						<dt>{r.label}</dt>
						<dd data-testid={r.testId}>
							<Ltr>{r.value}</Ltr>
							{r.copyable ? (
								<button
									type="button"
									className="sy-record-details__copy"
									aria-label={t("common.copyValue", { label: r.label })}
									onClick={() => void copy(r.label, String(r.value))}
								>
									{copied === r.label ? t("common.copied") : t("common.copy")}
								</button>
							) : null}
						</dd>
					</div>
				))}
			</dl>
			{children}
		</details>
	);
}
