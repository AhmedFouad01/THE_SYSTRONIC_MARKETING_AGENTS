import { Color } from "@kurkle/color";
import { describe, expect, it } from "vitest";
import { darkColors, lightColors, extendedPalette, paletteAnchors } from "./colors.ts";
import { buildTokensCss, cssVar, kebab, varName } from "./css.ts";
import { elevation, spacing, typeScale } from "./scales.ts";

const COLOR_VALUE = /^(#[0-9A-F]{6}|rgba\(\d{1,3},\d{1,3},\d{1,3},\.\d+\)|oklch\([\d.]+ [\d.]+ [\d.]+\))$/;

describe("tokens: light/dark parity", () => {
	it("light and dark color sets have identical key sets", () => {
		expect(Object.keys(darkColors).sort()).toEqual(
			Object.keys(lightColors).sort(),
		);
	});

	it("elevation sets have identical key sets", () => {
		expect(Object.keys(elevation.dark).sort()).toEqual(
			Object.keys(elevation.light).sort(),
		);
	});

	it("every color value is a well-formed hex, rgba or OKLCH literal", () => {
		for (const [mode, set] of [
			["light", lightColors],
			["dark", darkColors],
		] as const)
			for (const [k, v] of Object.entries(set))
				expect(v, `${mode}.${k}`).toMatch(COLOR_VALUE);
	});

	it("keeps the DESIGN_TOKENS.md key semantic values", () => {
		expect(lightColors.canvas).toBe("#F3F5F7");
		expect(lightColors.focus).toBe("#009FD4");
		expect(lightColors.createFg).toBe("#042F2A");
		expect(darkColors.canvas).toBe("#090D14");
		expect(darkColors.primary).toBe("#00BEF6");
		expect(darkColors.focus).toBe("#7DE2FF");
		expect(darkColors.dangerFg).toBe("#FF9CB0");
	});
});

describe("tokens: css emission", () => {
	const css = buildTokensCss();

	it("emits a custom property for every color token in both modes", () => {
		const light = css.match(/:root,:root\[data-theme="light"\]\{([^}]*)\}/);
		const dark = css.match(/:root\[data-theme="dark"\]\{([^}]*)\}/);
		expect(light).not.toBeNull();
		expect(dark).not.toBeNull();
		for (const k of Object.keys(lightColors)) {
			expect(light?.[1]).toContain(`${varName(k)}:`);
			expect(dark?.[1]).toContain(`${varName(k)}:`);
		}
	});

	it("emits the preview panel tokens: left-cast panel shadow (stronger in dark), width, reserve (off), z-map", () => {
		expect(css).toContain("--sy-preview-w:clamp(360px, 30vw, 440px);");
		expect(css).toContain("--sy-preview-reserve:0px;");
		expect(css).toContain("--sy-z-panel:200;");
		expect(css).toContain("--sy-z-menu:300;");
		expect(elevation.light.shadowPanel).toMatch(/^-\d+px 0 /);
		expect(elevation.dark.shadowPanel).toMatch(/^-\d+px 0 /);
		expect(elevation.light.shadowPanelRtl).toMatch(/^\d+px 0 /);
		expect(elevation.dark.shadowPanelRtl).toMatch(/^\d+px 0 /);
		expect(elevation.dark.shadowPanel).not.toBe(elevation.light.shadowPanel);
		expect(css).toContain("--sy-shadow-panel:");
	});

	it("emits shared scale vars and Arabic overrides", () => {
		for (const k of Object.keys(spacing))
			expect(css).toContain(`--sy-space-${k}:`);
		for (const role of Object.keys(typeScale))
			expect(css).toContain(`--sy-type-${kebab(role)}-size:`);
		expect(css).toContain(':root[lang="ar"]{');
		expect(css).toContain("--sy-font-body:Cairo");
	});

	it("emits the page frame vars with responsive gutters (UI_R4_SPEC A)", () => {
		expect(css).toContain("--sy-page-max:1440px;");
		expect(css).toContain("--sy-topbar-h:56px;");
		expect(css).toContain("--sy-control-h:36px;");
		expect(css).toContain("--sy-gutter:24px;");
		expect(css).toContain("--sy-sidebar-w:228px;");
		expect(css).toContain("@media (max-width:1180px){:root{--sy-gutter:16px;--sy-sidebar-w:76px}}");
		expect(css).toContain("@media (max-width:720px){:root{--sy-gutter:12px}}");
		for (const k of ["2", "20", "24", "32", "40"]) expect(css).toContain(`--sy-space-${k}:`);
	});

	it("kebab/varName/cssVar naming", () => {
		expect(kebab("surface2")).toBe("surface-2");
		expect(kebab("primaryFg")).toBe("primary-fg");
		expect(kebab("chart1")).toBe("chart-1");
		expect(varName("focus")).toBe("--sy-focus");
		expect(cssVar("text2")).toBe("var(--sy-text-2)");
	});
});

describe("R03 extended palette", () => {
 it("hue rotations share the cyan anchor lightness/chroma in each mode", () => {
  for (const mode of ["light", "dark"] as const) {
   const values = Object.values(extendedPalette(mode)).map((v) => v.match(/oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)/)?.slice(1).map(Number));
   expect(values).toHaveLength(8);
   expect(new Set(values.map((v) => v?.[2])).size).toBe(8);
   for (const value of values) {
    expect(value?.[0]).toBe(paletteAnchors[mode].lightness);
    expect(value?.[1]).toBe(paletteAnchors[mode].chroma);
   }
  }
 });
 it("removes the unapproved tone and original pigment from both modes", () => {
  for (const colors of [lightColors, darkColors]) {
   expect(Object.keys(colors).some((key) => /navy/i.test(key))).toBe(false);
   expect(Object.values(colors)).not.toContain("#181D36");
  }
 });
});

it("all chart aliases support Chart.js hover and tooltip colour parsing", () => {
 for (const colors of [lightColors, darkColors]) {
  for (const [key, value] of Object.entries(colors)) {
   if (!key.startsWith("chart")) continue;
   const parsed = new Color(value);
   expect(parsed.valid).toBe(true);
   expect(parsed.saturate(0.5).darken(0.1).rgbString()).toMatch(/^rgb/);
  }
 }
});
