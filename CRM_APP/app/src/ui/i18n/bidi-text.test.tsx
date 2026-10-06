import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BidiText } from "./Bdi.tsx";

const base = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "theme", "base.css"), "utf8");

describe("BidiText (user content, UI_R4_SPEC I)", () => {
	it("renders the value alone in its own dir=auto element, with the full value in title when given", () => {
		const html = renderToStaticMarkup(<BidiText title="Contact شركة">Contact شركة</BidiText>);
		expect(html).toBe(
			'<span class="sy-bidi-wrap"><span dir="auto" class="sy-bidi-text" title="Contact شركة">Contact شركة</span></span>',
		);
	});
	it("wrap mode is a modifier class (several lines for titles), same dir=auto isolate", () => {
		const html = renderToStaticMarkup(<BidiText wrap>شركة النور</BidiText>);
		expect(html).toContain('dir="auto"');
		expect(html).toContain("sy-bidi-text sy-bidi-text--wrap");
	});
	it("CSS: the UI-direction wrapper aligns with text-align:start (no per-value flip, no physical left/right); wrap variant balances lines", () => {
		const wrapRule = base.match(/\.sy-bidi-wrap\s*\{[^}]*\}/)?.[0] ?? "";
		expect(wrapRule).toMatch(/text-align:\s*start/);
		const rule = base.match(/\.sy-bidi-text\s*\{[^}]*\}/)?.[0] ?? "";
		expect(rule).toMatch(/display:\s*inline-block/);
		expect(rule).toMatch(/text-overflow:\s*ellipsis/);
		expect(rule).not.toMatch(/text-align/);
		expect(base).not.toMatch(/:root\[dir="rtl"\]\s*\.sy-bidi-(text|wrap)/);
		expect(base.match(/\.sy-bidi-text--wrap\s*\{[^}]*\}/)?.[0] ?? "").toMatch(/text-wrap:\s*balance/);
	});
});
