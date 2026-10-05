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
	4: "4px",
	6: "6px",
	8: "8px",
	10: "10px",
	12: "12px",
	14: "14px",
	16: "16px",
	22: "22px",
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
	},
	dark: {
		shadow: "0 12px 30px rgba(0,0,0,.28)",
		shadowSubtle: "0 1px 2px rgba(16,24,40,.04)",
		shadowMenu: "0 14px 34px rgba(0,0,0,.16)",
		shadowModal: "0 24px 70px rgba(0,0,0,.26)",
	},
} as const satisfies Record<Mode, Record<string, string>>;

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
