import { describe, expect, it } from "vitest";
import { darkColors, lightColors } from "./colors.ts";
import { buildTokensCss, cssVar, kebab, varName } from "./css.ts";
import { elevation, spacing, typeScale } from "./scales.ts";

const COLOR_VALUE = /^(#[0-9A-F]{6}|rgba\(\d{1,3},\d{1,3},\d{1,3},\.\d+\))$/;

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

	it("every color value is a well-formed hex or rgba literal", () => {
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

	it("emits shared scale vars and Arabic overrides", () => {
		for (const k of Object.keys(spacing))
			expect(css).toContain(`--sy-space-${k}:`);
		for (const role of Object.keys(typeScale))
			expect(css).toContain(`--sy-type-${kebab(role)}-size:`);
		expect(css).toContain(':root[lang="ar"]{');
		expect(css).toContain("--sy-font-body:Cairo");
	});

	it("kebab/varName/cssVar naming", () => {
		expect(kebab("surface2")).toBe("surface-2");
		expect(kebab("primaryFg")).toBe("primary-fg");
		expect(kebab("chart1")).toBe("chart-1");
		expect(varName("focus")).toBe("--sy-focus");
		expect(cssVar("text2")).toBe("var(--sy-text-2)");
	});
});
