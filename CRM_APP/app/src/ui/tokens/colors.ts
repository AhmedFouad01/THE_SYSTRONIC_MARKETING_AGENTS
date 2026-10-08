// Canonical color tokens. Source: CRM_UI_HANDOFF/docs/ui-system/DESIGN_TOKENS.md +
// prototype/CRMMVPSharedArchitecture.tsx (THEMES, Tokens type) + prototype/SystronicUIDesignSystem.tsx (theme).
// Where the two prototypes overlap, values are identical except `disabledBg` (dark): the CRM
// prototype (#1A2230) is used because it is the app-level token set; the Design System board used #202936.
// This is the ONLY place raw colors may live (enforced by no-raw-colors.test.ts).

export const brand = {
	cyan: "#00BEF6",
	cyanDark: "#007EA9",
	magenta: "#FF003C",
	magentaDark: "#E50036",
	teal: "#00BFA6",
	violet: "#7067CF",
} as const;

// R03: hue rotations of the approved cyan anchors. Each mode holds OKLCH lightness and chroma
// equal across all eight series; only hue changes. No alternate app theme is introduced.
export const paletteAnchors = {
 light: { lightness: 0.55639, chroma: 0.11243, hue: 231.206 }, // cyanDark
 dark: { lightness: 0.74875, chroma: 0.14644, hue: 228.273 }, // cyan
} as const;
export function extendedPalette(mode: "light" | "dark") {
 const { lightness, chroma, hue } = paletteAnchors[mode];
 const at = (rotation: number) => `oklch(${lightness} ${chroma} ${(hue + rotation) % 360})`;
 return {
  series1: at(0), series2: at(45), series3: at(90), series4: at(135),
  series5: at(180), series6: at(225), series7: at(270), series8: at(315),
 } as const;
}
/** Chart.js's colour adapter accepts sRGB strings; derive aliases from the same canonical OKLCH series. */
export function chartColor(value: string): string {
 const parts = /^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/.exec(value);
 if (!parts) throw new Error("Expected a canonical OKLCH series token");
 const L = Number(parts[1]); const C = Number(parts[2]); const h = Number(parts[3]) * Math.PI / 180;
 const a = C * Math.cos(h); const b = C * Math.sin(h);
 const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
 const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
 const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
 const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s].map((linear) => {
  const clipped = Math.max(0, Math.min(1, linear));
  return Math.round(255 * (clipped <= 0.0031308 ? 12.92 * clipped : 1.055 * clipped ** (1 / 2.4) - 0.055));
 });
 return `#${rgb.map((channel) => channel.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}
const lightSeries = extendedPalette("light");
const darkSeries = extendedPalette("dark");

export const lightColors = {
	...lightSeries,
	canvas: "#F3F5F7",
	overlay: "rgba(32,41,54,.45)",
	surface: "#FFFFFF",
	surface2: "#F7F9FB",
	surface3: "#EEF2F6",
	raised: "#FFFFFF",
	nav: "#FBFCFD",
	hover: "#EEF2F6",
	selected: "#D8F4FA",
	disabledBg: "#F2F4F7",
	border: "#DDE3EA",
	borderStrong: "#C9D1DB",
	divider: "#E8ECF1",
	text: "#202936",
	text2: "#475467",
	text3: "#667085",
	textDisabled: "#98A2B3",
	icon: "#344054",
	iconMuted: "#667085",
	primary: "#007EA9",
	primaryFg: "#FFFFFF",
	primaryHover: "#006E94",
	primaryPressed: "#005C7D",
	create: "#00BFA6",
	createFg: "#042F2A",
	createHover: "#00A991",
	createPressed: "#008C79",
	interactive: "#007EA9",
	focus: "#009FD4",
	focusRing: "rgba(0,159,212,.16)",
	infoBg: "#EEF6FF",
	infoFg: "#1557A0",
	infoIcon: "#3B82F6",
	successBg: "#DDF7E8",
	successFg: "#087443",
	successIcon: "#16B364",
	warningBg: "#FFF6E5",
	warningFg: "#915A00",
	warningIcon: "#F5A524",
	dangerBg: "#FFF0F4",
	dangerFg: "#B0002C",
	dangerIcon: "#FF315C",
	dangerHover: "#FFE0E8",
	dangerPressed: "#FFC9D6",
	dangerFieldBg: "#FFF7F9",
	// KPI emphasis (UX_RULES 5 / DESIGN_TOKENS "KPI emphasis"): scarce brand emphasis, not status.
	kpiMagentaBg: "#FF003C",
	kpiMagentaFg: "#0D1020",
	kpiMagentaSub: "rgba(13,16,32,.74)",
	chart1: chartColor(lightSeries.series1),
	chart2: chartColor(lightSeries.series2),
	chart3: chartColor(lightSeries.series3),
	chart4: chartColor(lightSeries.series4),
	chart5: chartColor(lightSeries.series5),
	chart6: chartColor(lightSeries.series6),
	chart7: chartColor(lightSeries.series7),
	chart8: chartColor(lightSeries.series8),
} as const;

export type ColorTokenKey = keyof typeof lightColors;
export type ColorTokens = { readonly [K in ColorTokenKey]: string };

export const darkColors: ColorTokens = {
	...darkSeries,
	canvas: "#090D14",
	overlay: "rgba(0,0,0,.6)",
	surface: "#111722",
	surface2: "#171E29",
	surface3: "#202936",
	raised: "#1C2532",
	nav: "#0D121B",
	hover: "#1D2632",
	selected: "#0B3A47",
	disabledBg: "#1A2230",
	border: "#2B3442",
	borderStrong: "#3B4656",
	divider: "#202936",
	text: "#F7F9FC",
	text2: "#C3CAD4",
	text3: "#98A2B3",
	textDisabled: "#667085",
	icon: "#D0D5DD",
	iconMuted: "#98A2B3",
	primary: "#00BEF6",
	primaryFg: "#0D1020",
	primaryHover: "#3FD3FC",
	primaryPressed: "#00A8DD",
	create: "#00BFA6",
	createFg: "#042F2A",
	createHover: "#00A991",
	createPressed: "#008C79",
	interactive: "#7DE2FF",
	focus: "#7DE2FF",
	focusRing: "rgba(125,226,255,.22)",
	infoBg: "#102A43",
	infoFg: "#9DCCFF",
	infoIcon: "#3B82F6",
	successBg: "#0D2D20",
	successFg: "#7CE5AA",
	successIcon: "#16B364",
	warningBg: "#35290C",
	warningFg: "#FFD16A",
	warningIcon: "#F5A524",
	dangerBg: "#3A121C",
	dangerFg: "#FF9CB0",
	dangerIcon: "#FF315C",
	dangerHover: "#4C1824",
	dangerPressed: "#5B1B2A",
	dangerFieldBg: "#241319",
	kpiMagentaBg: "#E50036",
	kpiMagentaFg: "#FFFFFF",
	kpiMagentaSub: "rgba(255,255,255,.78)",
	chart1: chartColor(darkSeries.series1),
	chart2: chartColor(darkSeries.series2),
	chart3: chartColor(darkSeries.series3),
	chart4: chartColor(darkSeries.series4),
	chart5: chartColor(darkSeries.series5),
	chart6: chartColor(darkSeries.series6),
	chart7: chartColor(darkSeries.series7),
	chart8: chartColor(darkSeries.series8),
};
