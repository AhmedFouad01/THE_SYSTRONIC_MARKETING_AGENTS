import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ICON_ALIASES, ICON_NAMES, Icon, resolveGlyph } from "./Icon.tsx";

describe("icons", () => {
	it("every icon (incl. aliases) renders 24x24 viewBox, 2px stroke, currentColor", () => {
		for (const name of ICON_NAMES) {
			const html = renderToStaticMarkup(<Icon name={name} />);
			expect(html, name).toContain('viewBox="0 0 24 24"');
			expect(html, name).toContain('stroke-width="2"');
			expect(html, name).toContain('stroke="currentColor"');
			expect(html, name).toContain('aria-hidden="true"');
		}
	});

	it("aliases resolve to canonical glyphs", () => {
		for (const [alias, glyph] of Object.entries(ICON_ALIASES))
			expect(resolveGlyph(alias as keyof typeof ICON_ALIASES)).toBe(glyph);
	});

	it("directional icons carry the mirror flag; status/object icons do not", () => {
		expect(renderToStaticMarkup(<Icon name="advance" />)).toContain(
			'data-mirror-rtl="true"',
		);
		expect(renderToStaticMarkup(<Icon name="arrow" />)).toContain(
			'data-mirror-rtl="true"',
		);
		expect(renderToStaticMarkup(<Icon name="drill" />)).toContain(
			'data-mirror-rtl="true"',
		);
		expect(renderToStaticMarkup(<Icon name="success" />)).not.toContain(
			"data-mirror-rtl",
		);
		expect(renderToStaticMarkup(<Icon name="phone" />)).not.toContain(
			"data-mirror-rtl",
		);
	});

	it("mirrorInRtl prop overrides the default", () => {
		expect(renderToStaticMarkup(<Icon name="phone" mirrorInRtl />)).toContain(
			'data-mirror-rtl="true"',
		);
		expect(
			renderToStaticMarkup(<Icon name="advance" mirrorInRtl={false} />),
		).not.toContain("data-mirror-rtl");
	});

	it("label makes the icon an accessible image", () => {
		const html = renderToStaticMarkup(<Icon name="search" label="Search" />);
		expect(html).toContain('role="img"');
		expect(html).toContain('aria-label="Search"');
		expect(html).not.toContain("aria-hidden");
	});
});
