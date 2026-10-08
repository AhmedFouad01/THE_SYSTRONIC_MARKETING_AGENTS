import type { ReactNode } from "react";

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
		<header
			className="sy-page-header flex flex-col gap-14 min-w-0"
			data-testid={testId}
		>
			<div className="sy-page-header__row flex flex-wrap items-start justify-between gap-12">
				<div className="sy-page-header__titles min-w-0">
					{eyebrow ? (
						<p className="sy-page-header__eyebrow m-0 mb-4 text-[11px] font-[800] tracking-[0.08em] uppercase text-text-3">
							{eyebrow}
						</p>
					) : null}
					<h1
						className="sy-page-header__title m-0 text-page-title text-text max-mobile:text-[24px]! max-mobile:leading-[32px]!"
						data-testid={titleTestId}
					>
						{title}
					</h1>
					{subtitle ? (
						<p className="sy-page-header__subtitle m-0 mt-4 text-body text-text-2">
							{subtitle}
						</p>
					) : null}
				</div>
				{actions ? (
					<div className="sy-page-header__actions flex flex-wrap items-center gap-8 ms-auto">
						{actions}
					</div>
				) : null}
			</div>
			{kpis ? <div className="sy-page-header__kpis min-w-0">{kpis}</div> : null}
		</header>
	);
}
