import type { ElementType, HTMLAttributes, ReactNode } from "react";

export type PanelProps = HTMLAttributes<HTMLElement> & {
	as?: ElementType;
	title?: ReactNode;
	actions?: ReactNode;
	children?: ReactNode;
};

export function Panel({
	as: Tag = "section",
	title,
	actions,
	children,
	className,
	...rest
}: PanelProps) {
	return (
		<Tag {...rest} className={`sy-panel min-w-0 p-16 border border-solid border-border rounded-12 bg-surface shadow-subtle${className ? ` ${className}` : ""}`}>
			{title || actions ? (
				<div className="sy-panel__head flex items-center justify-between gap-12 mb-12">
					{title ? <h2 className="sy-panel__title m-0">{title}</h2> : <span />}
					{actions ? <div className="sy-panel__actions flex flex-wrap gap-8">{actions}</div> : null}
				</div>
			) : null}
			{children}
		</Tag>
	);
}

export const Card = Panel;
