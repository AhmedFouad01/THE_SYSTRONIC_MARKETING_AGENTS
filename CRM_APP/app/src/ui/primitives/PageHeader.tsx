import type { ReactNode } from "react";
import "./page-header.css";

export type PageHeaderProps = {
	title: ReactNode;
	eyebrow?: ReactNode;
	subtitle?: ReactNode;
	/** Buttons / controls at the inline-end of the title row. */
	actions?: ReactNode;
	/** KPI strip rendered under the title row. */
	kpis?: ReactNode;
	testId?: string;
	titleTestId?: string;
};

/** Shared screen header: identical h1 position/size on every screen (UX_AUDIT cross-cutting 1). */
export function PageHeader({
	title,
	eyebrow,
	subtitle,
	actions,
	kpis,
	testId,
	titleTestId,
}: PageHeaderProps) {
	return (
		<header className="sy-page-header" data-testid={testId}>
			<div className="sy-page-header__row">
				<div className="sy-page-header__titles">
					{eyebrow ? (
						<p className="sy-page-header__eyebrow">{eyebrow}</p>
					) : null}
					<h1 className="sy-page-header__title" data-testid={titleTestId}>
						{title}
					</h1>
					{subtitle ? (
						<p className="sy-page-header__subtitle">{subtitle}</p>
					) : null}
				</div>
				{actions ? (
					<div className="sy-page-header__actions">{actions}</div>
				) : null}
			</div>
			{kpis ? <div className="sy-page-header__kpis">{kpis}</div> : null}
		</header>
	);
}
