import type { ReactNode } from "react";
import { Ltr } from "../../ui/index.ts";

export type KpiTone = "neutral" | "navy" | "magenta";

/** Decision-first KPI card. navy/magenta are scarce emphasis (UX_RULES 5): at most two cards per view. */
export function KpiCard({
	label,
	value,
	sub,
	tone = "neutral",
	testId,
	loading = false,
}: {
	label: string;
	value: ReactNode;
	sub?: ReactNode;
	tone?: KpiTone;
	testId?: string;
	/** Skeleton: the card keeps its size and announces aria-busy. */
	loading?: boolean;
}) {
	if (loading)
		return (
			<div
				className="sy-kpi sy-kpi--neutral sy-kpi--loading"
				data-testid={testId}
				data-tone="neutral"
				aria-busy="true"
			>
				<p className="sy-kpi__label">{label}</p>
				<p className="sy-kpi__value" aria-hidden="true">
					<span className="sy-kpi__skeleton" />
				</p>
			</div>
		);
	return (
		<div
			className={`sy-kpi sy-kpi--${tone}`}
			data-testid={testId}
			data-tone={tone}
		>
			<p className="sy-kpi__label">{label}</p>
			<p className="sy-kpi__value">
				<Ltr>{value}</Ltr>
			</p>
			{sub ? <p className="sy-kpi__sub">{sub}</p> : null}
		</div>
	);
}
