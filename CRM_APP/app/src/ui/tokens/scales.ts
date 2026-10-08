// Non-color tokens. Sources (prototype values only, nothing invented):
// - type scale: SystronicUIDesignSystem.tsx TypographyMode board (size / line-height, weight).
// - font stacks: CRMMVPSharedArchitecture.tsx AppShell + TypographyMode board; RTL_RESPONSIVE.md.
// - radius / spacing: the discrete values the prototypes actually use (borderRadius, gap/padding), named by px.
// - elevation: prototype boxShadow values. motion: only the spinner duration and the reduced-motion rule exist.
// NOT FOUND in handoff (left undefined on purpose): a named spacing/radius scale, motion durations/easing,
// size tokens beyond the 4 typography-board roles.

export type Mode = "light" | "dark";
export type Locale = "ar" | "en";

export const fonts = {
	en: {
		body: "Inter, Arial, sans-serif",
		heading: "Inter, Arial, sans-serif",
		data: "Inter, Arial, sans-serif",
	},
	ar: {
		body: 'Cairo, Alexandria, "IBM Plex Sans Arabic", Arial, sans-serif',
		heading: "Alexandria, Cairo, sans-serif",
		data: '"IBM Plex Sans Arabic", Cairo, sans-serif',
	},
} as const satisfies Record<Locale, Record<string, string>>;

// px values. `sizeAr` = Latin size + 1px (Arabic glyphs read ~2px smaller at equal size: UX_AUDIT UX-13);
// `lineAr` is the Arabic line height (1.6 for body/data text, tighter for titles).
export const typeScale = {
	pageTitle: { size: 28, line: 36, sizeAr: 29, lineAr: 38, weight: 700 },
	sectionTitle: { size: 20, line: 28, sizeAr: 21, lineAr: 32, weight: 600 },
	body: { size: 14, line: 22, sizeAr: 15, lineAr: 24, weight: 400 },
	data: { size: 13, line: 20, sizeAr: 14, lineAr: 22, weight: 500 },
} as const;

export const spacing = {
	2: "2px",
	4: "4px",
	6: "6px",
	8: "8px",
	10: "10px",
	12: "12px",
	14: "14px",
	16: "16px",
	20: "20px",
	22: "22px",
	24: "24px",
	32: "32px",
	40: "40px",
} as const;

// UI_R4_SPEC section A: page frame. Gutter/sidebar steps per breakpoint are emitted by css.ts (media queries).
export const layout = {
	pageMax: "1440px",
	topbarH: "56px",
	controlH: "36px",
	controlHSm: "36px",
	rowH: "44px",
	gutter: { wide: "24px", mid: "16px", narrow: "12px" },
	sidebarW: { wide: "228px", mid: "76px" },
} as const;

export const radius = {
	6: "6px",
	7: "7px",
	8: "8px",
	9: "9px",
	10: "10px",
	11: "11px",
	12: "12px",
	pill: "999px",
} as const;

export const elevation = {
	light: {
		shadow: "0 8px 26px rgba(16,24,40,.08)",
		shadowSubtle: "0 1px 2px rgba(16,24,40,.04)",
		shadowMenu: "0 14px 34px rgba(0,0,0,.16)",
		shadowModal: "0 24px 70px rgba(0,0,0,.26)",
		// Preview slide-over, docked at the inline end: LTR (panel on the right) casts to the left, RTL (panel on the left) to the right.
		shadowPanel: "-12px 0 32px rgba(0,0,0,.14)",
		shadowPanelRtl: "12px 0 32px rgba(0,0,0,.14)",
	},
	dark: {
		shadow: "0 12px 30px rgba(0,0,0,.28)",
		shadowSubtle: "0 1px 2px rgba(16,24,40,.04)",
		shadowMenu: "0 14px 34px rgba(0,0,0,.16)",
		shadowModal: "0 24px 70px rgba(0,0,0,.26)",
		// Stronger on dark surfaces (the menu shadow is nearly invisible there) plus a 1px hairline.
		shadowPanel: "-16px 0 40px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.1)",
		shadowPanelRtl: "16px 0 40px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.1)",
	},
} as const satisfies Record<Mode, Record<string, string>>;

// Preview slide-over (UI R4 C). Z-map of the app, low to high: sticky th 2, batch bar 5, row/columns menus and popovers
// 300 (must open above the panel), topbar 45, bottom nav 60, preview panel 200, dialog scrim 1000, toasts 1100,
// select/date lists 1200. A dialog rendered inside the panel lives in the panel's stacking context.
export const preview = {
	width: "clamp(360px, 30vw, 440px)",
	/** Extra inline-start padding on the grid scroller while a preview is open (0 = pure overlay). Flip to ~400px only if the AR re-audit asks for it. */
	reserve: "0px",
	zPanel: "200",
	zMenu: "300",
} as const;

export const motion = {
	spinnerDuration: "0.7s",
} as const;

// Keyboard focus is a 2px outline (offset 2px; inputs 1px) in the `focus` color. Selected != focus (UX_RULES 4).
export const focus = {
	width: "2px",
	offset: "2px",
	offsetInput: "1px",
} as const;

// RTL_RESPONSIVE.md breakpoints (max-width). CSS custom properties cannot be used in media queries.
export const breakpoints = {
	compact: 1180,
	stacked: 920,
	mobile: 720,
	small: 480,
} as const;
