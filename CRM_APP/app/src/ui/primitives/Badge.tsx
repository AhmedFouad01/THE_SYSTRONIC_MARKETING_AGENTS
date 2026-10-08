import type { ReactNode } from "react";
import { Icon, type IconName } from "../icons/index.ts";
const badgeBase =
	"inline-flex items-center gap-4 max-w-full py-2 px-8 rounded-6 text-data font-[600] whitespace-nowrap";
const tones: Record<BadgeTone, string> = {
	neutral: "bg-surface-3 text-text-2",
	info: "bg-info-bg text-info-fg",
	success: "bg-success-bg text-success-fg",
	warning: "bg-warning-bg text-warning-fg",
	danger: "bg-danger-bg text-danger-fg",
};

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

const TONE_ICON: Record<BadgeTone, IconName | null> = {
	neutral: null,
	info: "info",
	success: "success",
	warning: "warning",
	danger: "critical",
};

/** Status is never color-only: StatusPill always carries an icon + text. */
export function Badge({
	tone = "neutral",
	children,
}: {
	tone?: BadgeTone;
	children: ReactNode;
}) {
	return (
		<span className={`sy-badge sy-badge--${tone} ${badgeBase} ${tones[tone]}`}>
			<bdi>{children}</bdi>
		</span>
	);
}

export function StatusPill({
	tone = "neutral",
	children,
}: {
	tone?: BadgeTone;
	children: ReactNode;
}) {
	const icon = TONE_ICON[tone];
	return (
		<span
			className={`sy-badge sy-badge--pill sy-badge--${tone} ${badgeBase} rounded-pill ${tones[tone]}`}
		>
			{icon ? <Icon name={icon} size={14} /> : null}
			<bdi>{children}</bdi>
		</span>
	);
}
