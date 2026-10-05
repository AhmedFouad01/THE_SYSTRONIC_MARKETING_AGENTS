import { type ColorTokens, darkColors, lightColors } from "./colors.ts";
import {
	elevation,
	focus,
	fonts,
	motion,
	radius,
	spacing,
	typeScale,
} from "./scales.ts";

export const VAR_PREFIX = "--sy-";

/** surface2 -> surface-2, chart1 -> chart-1, primaryFg -> primary-fg */
export function kebab(key: string): string {
	return key.replace(/([a-z])([A-Z0-9])/g, "$1-$2").toLowerCase();
}

export function varName(key: string): string {
	return `${VAR_PREFIX}${kebab(key)}`;
}

/** `var(--sy-...)` reference for a color/elevation token, for inline styles: style={{ color: cssVar("text") }} */
export function cssVar(
	key: keyof typeof lightColors | keyof typeof elevation.light,
): string {
	return `var(${varName(key)})`;
}

type Entry = [string, string];

function decls(entries: Entry[]): string {
	return entries.map(([k, v]) => `${k}:${v};`).join("");
}

function modeDecls(
	colors: ColorTokens,
	shadows: Record<string, string>,
): string {
	return decls([
		...Object.entries(colors).map(([k, v]): Entry => [varName(k), v]),
		...Object.entries(shadows).map(([k, v]): Entry => [varName(k), v]),
	]);
}

function sharedDecls(): string {
	const out: Entry[] = [];
	for (const [k, v] of Object.entries(spacing))
		out.push([varName(`space-${k}`), v]);
	for (const [k, v] of Object.entries(radius))
		out.push([varName(`radius-${k}`), v]);
	for (const [role, t] of Object.entries(typeScale)) {
		out.push([varName(`type-${kebab(role)}-size`), `${t.size}px`]);
		out.push([varName(`type-${kebab(role)}-line`), `${t.line}px`]);
		out.push([varName(`type-${kebab(role)}-weight`), String(t.weight)]);
	}
	out.push([varName("focus-width"), focus.width]);
	out.push([varName("focus-offset"), focus.offset]);
	out.push([varName("focus-offset-input"), focus.offsetInput]);
	out.push([varName("motion-spinner"), motion.spinnerDuration]);
	return decls(out);
}

function fontDecls(locale: "en" | "ar"): string {
	const f = fonts[locale];
	return decls([
		[varName("font-body"), f.body],
		[varName("font-heading"), f.heading],
		[varName("font-data"), f.data],
	]);
}

function arabicLineDecls(): string {
	return decls(
		Object.entries(typeScale).map(
			([role, t]): Entry => [
				varName(`type-${kebab(role)}-line`),
				`${t.lineAr}px`,
			],
		),
	);
}

/** Full custom-property stylesheet: light is the default, data-theme="dark" overrides, Arabic overrides fonts/line-heights. */
export function buildTokensCss(): string {
	return [
		`:root{${sharedDecls()}${fontDecls("en")}}`,
		`:root[lang="ar"]{${fontDecls("ar")}${arabicLineDecls()}}`,
		`:root,:root[data-theme="light"]{color-scheme:light;${modeDecls(lightColors, elevation.light)}}`,
		`:root[data-theme="dark"]{color-scheme:dark;${modeDecls(darkColors, elevation.dark)}}`,
	].join("\n");
}
