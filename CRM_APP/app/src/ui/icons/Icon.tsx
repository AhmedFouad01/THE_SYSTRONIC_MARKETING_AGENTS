import type { ReactNode } from "react";
import "./icons.css";

// Glyphs copied from prototype/SystronicUIDesignSystem.tsx SysIcon (canonical, 24x24, 2px stroke, round caps).
// CRM-prototype names (reports, dots, check, close, arrow) are kept as aliases of the same glyphs.
const GLYPHS = {
	home: (
		<>
			<path d="M3 11.5 12 4l9 7.5" />
			<path d="M5.5 10.5V20h13v-9.5" />
			<path d="M9 20v-6h6v6" />
		</>
	),
	inbox: (
		<>
			<rect x="4" y="5" width="16" height="14" rx="2" />
			<path d="M4 13h4l2 3h4l2-3h4" />
		</>
	),
	tasks: (
		<>
			<rect x="5" y="4" width="14" height="16" rx="2" />
			<path d="m8 9 1.5 1.5L12 8" />
			<path d="M14 9h2.5M8 15h8.5" />
		</>
	),
	contacts: (
		<>
			<circle cx="9" cy="9" r="3" />
			<path d="M4.5 19c.7-3 2.3-4.5 4.5-4.5s3.8 1.5 4.5 4.5" />
			<circle cx="16.5" cy="8" r="2" />
			<path d="M14.5 14.5c2.6 0 4.4 1.2 5 3.5" />
		</>
	),
	leads: (
		<>
			<circle cx="9" cy="9" r="3" />
			<path d="M4.5 19c.8-3.1 2.3-4.5 4.5-4.5 1.7 0 3 1 3.8 2.7" />
			<path d="M17 13v6M14 16h6" />
		</>
	),
	deals: (
		<>
			<rect x="3.5" y="7" width="17" height="12" rx="2" />
			<path d="M8 7V5h8v2M3.5 12h17M10 12v2h4v-2" />
		</>
	),
	route: (
		<>
			<circle cx="6" cy="6" r="2" />
			<circle cx="18" cy="18" r="2" />
			<path d="M8 6h4c3 0 4 2 4 4s-1 4-4 4H9c-2 0-3 1.5-3 3v1" />
		</>
	),
	report: (
		<>
			<path d="M4 20V10h4v10M10 20V4h4v16M16 20v-7h4v7" />
			<path d="M3 20h18" />
		</>
	),
	settings: (
		<>
			<path d="M4 7h10M18 7h2M4 17h2M10 17h10M4 12h4M12 12h8" />
			<circle cx="16" cy="7" r="2" />
			<circle cx="8" cy="17" r="2" />
			<circle cx="10" cy="12" r="2" />
		</>
	),
	plus: <path d="M12 5v14M5 12h14" />,
	edit: (
		<>
			<path d="m5 19 3.5-.8L19 7.7 16.3 5 5.8 15.5 5 19Z" />
			<path d="m14.8 6.5 2.7 2.7" />
		</>
	),
	delete: <path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13M10 10v6M14 10v6" />,
	copy: (
		<>
			<rect x="8" y="8" width="11" height="11" rx="2" />
			<path d="M16 8V5H5v11h3" />
		</>
	),
	upload: (
		<>
			<path d="M12 16V5M8 9l4-4 4 4" />
			<path d="M5 15v4h14v-4" />
		</>
	),
	download: (
		<>
			<path d="M12 5v11M8 12l4 4 4-4" />
			<path d="M5 19h14" />
		</>
	),
	filter: <path d="M4 6h16l-6 7v5l-4 2v-7L4 6Z" />,
	more: (
		<>
			<circle cx="6" cy="12" r="1" />
			<circle cx="12" cy="12" r="1" />
			<circle cx="18" cy="12" r="1" />
		</>
	),
	mail: (
		<>
			<rect x="3" y="5" width="18" height="14" rx="2" />
			<path d="m4 7 8 6 8-6" />
		</>
	),
	phone: (
		<path d="M7 4 4.5 6.5c1 5.5 7.5 12 13 13L20 17l-4-3-2 2c-2.7-1.4-4.6-3.3-6-6l2-2-3-4Z" />
	),
	message: <path d="M4 5h16v12H9l-5 3V5Z" />,
	bell: (
		<>
			<path d="M6 17h12l-1.5-2V10a4.5 4.5 0 0 0-9 0v5L6 17Z" />
			<path d="M10 20h4" />
		</>
	),
	calendar: (
		<>
			<rect x="4" y="5" width="16" height="15" rx="2" />
			<path d="M8 3v4M16 3v4M4 9h16" />
		</>
	),
	clock: (
		<>
			<circle cx="12" cy="12" r="8" />
			<path d="M12 8v5l3 2" />
		</>
	),
	automation: (
		<>
			<path d="M4 7h4c5 0 5 10 10 10h2" />
			<path d="m17 14 3 3-3 3" />
			<path d="M4 17h4c2.2 0 3.3-1.8 4.2-3.6" />
			<path d="M16 7h4M17 4l3 3-3 3" />
		</>
	),
	advance: <path d="M5 12h14M14 7l5 5-5 5" />,
	play: (
		<>
			<circle cx="12" cy="12" r="8" />
			<path d="m10 8 6 4-6 4V8Z" />
		</>
	),
	pause: (
		<>
			<circle cx="12" cy="12" r="8" />
			<path d="M10 9v6M14 9v6" />
		</>
	),
	external: (
		<>
			<path d="M13 5h6v6M19 5l-8 8" />
			<path d="M10 6H5v13h13v-5" />
		</>
	),
	drill: <path d="m9 6 6 6-6 6" />,
	success: (
		<>
			<circle cx="12" cy="12" r="8" />
			<path d="m8.5 12 2.2 2.2L16 9" />
		</>
	),
	warning: (
		<>
			<path d="M12 4 21 20H3L12 4Z" />
			<path d="M12 9v5M12 17h.01" />
		</>
	),
	info: (
		<>
			<circle cx="12" cy="12" r="8" />
			<path d="M12 11v5M12 8h.01" />
		</>
	),
	critical: (
		<>
			<circle cx="12" cy="12" r="8" />
			<path d="m9 9 6 6M15 9l-6 6" />
		</>
	),
	trend: (
		<>
			<path d="M4 18V6M4 18h16" />
			<path d="m7 15 4-4 3 2 5-6" />
		</>
	),
	pie: (
		<>
			<path d="M12 4a8 8 0 1 0 8 8h-8V4Z" />
			<path d="M14 4.3A8 8 0 0 1 19.7 10H14V4.3Z" />
		</>
	),
	table: (
		<>
			<rect x="4" y="5" width="16" height="14" rx="1" />
			<path d="M4 10h16M9 5v14M15 5v14" />
		</>
	),
	growth: (
		<>
			<path d="M4 17 9 12l4 3 7-8" />
			<path d="M15 7h5v5" />
		</>
	),
	target: (
		<>
			<circle cx="12" cy="12" r="8" />
			<circle cx="12" cy="12" r="4" />
			<circle cx="12" cy="12" r="1" />
		</>
	),
	lock: (
		<>
			<rect x="5" y="10" width="14" height="10" rx="2" />
			<path d="M8 10V7a4 4 0 0 1 8 0v3" />
		</>
	),
	shield: (
		<>
			<path d="M12 3 19 6v6c0 4-2.6 7-7 9-4.4-2-7-5-7-9V6l7-3Z" />
			<path d="m9 12 2 2 4-4" />
		</>
	),
	key: (
		<>
			<circle cx="8" cy="12" r="4" />
			<path d="M12 12h8M17 12v3M20 12v2" />
		</>
	),
	database: (
		<>
			<ellipse cx="12" cy="6" rx="7" ry="3" />
			<path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
		</>
	),
	search: (
		<>
			<circle cx="10.5" cy="10.5" r="5.5" />
			<path d="m15 15 5 5" />
		</>
	),
	chevronUp: <path d="m6 15 6-6 6 6" />,
	chevronDown: <path d="m6 9 6 6 6-6" />,
	chevronRight: <path d="m9 6 6 6-6 6" />,
	menu: <path d="M4 7h16M4 12h16M4 17h16" />,
} as const satisfies Record<string, ReactNode>;

export type GlyphName = keyof typeof GLYPHS;

/** CRM-prototype icon names mapped onto the canonical glyphs. */
export const ICON_ALIASES = {
	reports: "report",
	bars: "report",
	dots: "more",
	check: "success",
	close: "critical",
	arrow: "advance",
} as const satisfies Record<string, GlyphName>;

export type IconName = GlyphName | keyof typeof ICON_ALIASES;

/**
 * Directional glyphs flip in RTL (RTL_RESPONSIVE: "Directional arrows mirror").
 * Status/object icons stay literal. Override per use with the `mirrorInRtl` prop.
 */
export const DIRECTIONAL_GLYPHS: ReadonlySet<GlyphName> = new Set<GlyphName>([
	"advance",
	"drill",
	"chevronRight",
]);

export const ICON_NAMES: readonly IconName[] = [
	...(Object.keys(GLYPHS) as GlyphName[]),
	...(Object.keys(ICON_ALIASES) as Array<keyof typeof ICON_ALIASES>),
];

export function resolveGlyph(name: IconName): GlyphName {
	return name in ICON_ALIASES
		? ICON_ALIASES[name as keyof typeof ICON_ALIASES]
		: (name as GlyphName);
}

export type IconProps = {
	name: IconName;
	size?: number;
	/** Force mirror on/off in RTL; default comes from DIRECTIONAL_GLYPHS. */
	mirrorInRtl?: boolean;
	/** Accessible name. Omit for decorative icons (aria-hidden). */
	label?: string;
	className?: string;
};

export function Icon({
	name,
	size = 18,
	mirrorInRtl,
	label,
	className,
}: IconProps) {
	const glyph = resolveGlyph(name);
	const mirror = mirrorInRtl ?? DIRECTIONAL_GLYPHS.has(glyph);
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className ? `sy-icon ${className}` : "sy-icon"}
			data-icon={glyph}
			data-mirror-rtl={mirror ? "true" : undefined}
			role={label ? "img" : undefined}
			aria-label={label}
			aria-hidden={label ? undefined : true}
			focusable="false"
		>
			{GLYPHS[glyph]}
		</svg>
	);
}
