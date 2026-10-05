import type { ReactNode } from "react";
import { Icon, type IconName } from "../icons/index.ts";
import "./badge.css";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

const TONE_ICON: Record<BadgeTone, IconName | null> = {
	neutral: null,
	info: "info",
	success: "success",
	warning: "warning",
	danger: "critical",
};

/** Status is never color-only: StatusPill always carries an icon + text. */
export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
	return <span className={`sy-badge sy-badge--${tone}`}>{children}</span>;
}

export function StatusPill({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
	const icon = TONE_ICON[tone];
	return (
		<span className={`sy-badge sy-badge--pill sy-badge--${tone}`}>
			{icon ? <Icon name={icon} size={14} /> : null}
			{children}
		</span>
	);
}
