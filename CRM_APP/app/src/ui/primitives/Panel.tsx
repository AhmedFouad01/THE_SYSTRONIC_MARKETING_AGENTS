import type { ElementType, HTMLAttributes, ReactNode } from "react";
import "./panel.css";

export type PanelProps = HTMLAttributes<HTMLElement> & {
	as?: ElementType;
	title?: ReactNode;
	actions?: ReactNode;
	children?: ReactNode;
};

export function Panel({ as: Tag = "section", title, actions, children, className, ...rest }: PanelProps) {
	return (
		<Tag {...rest} className={`sy-panel${className ? ` ${className}` : ""}`}>
			{title || actions ? (
				<div className="sy-panel__head">
					{title ? <h2 className="sy-panel__title">{title}</h2> : <span />}
					{actions ? <div className="sy-panel__actions">{actions}</div> : null}
				</div>
			) : null}
			{children}
		</Tag>
	);
}

export const Card = Panel;
