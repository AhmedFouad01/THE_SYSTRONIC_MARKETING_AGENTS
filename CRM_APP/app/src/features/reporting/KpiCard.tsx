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
}: {
	label: string;
	value: ReactNode;
	sub?: ReactNode;
	tone?: KpiTone;
	testId?: string;
}) {
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
