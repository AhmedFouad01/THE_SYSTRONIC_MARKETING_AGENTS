import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "../i18n/index.ts";
import { Badge, Input, RecordEditFooter, Textarea } from "./index.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const css = (f: string) => readFileSync(join(HERE, f), "utf8");

// UI_R4_SPEC batch 1: section I (bidi inputs/chips), D (always-visible Save), F1 (Select list sizing).
const MIXED = ["اجتماع مع Ahmed Corp غداً", "عميل VIP - شركة Orange Egypt", "Meeting with أحمد الشريف tomorrow"];

describe("bidi inputs (UI_R4_SPEC I)", () => {
	it.each(MIXED)("text input / textarea with a value take dir=auto: %s", (value) => {
		const input = renderToString(<Input label="Name" value={value} onChange={() => undefined} />);
		const area = renderToString(<Textarea label="Notes" value={value} onChange={() => undefined} />);
		expect(input).toContain('dir="auto"');
		expect(area).toContain('dir="auto"');
	});
	it("an empty field keeps the UI direction (default locale is AR: stays right-aligned)", () => {
		const ar = renderToString(
			<I18nProvider>
				<Input label="Name" value="" onChange={() => undefined} />
			</I18nProvider>,
		);
		expect(ar).toContain('dir="rtl"');
		expect(renderToString(<Input label="Name" value="" onChange={() => undefined} />)).toContain('dir="ltr"');
	});
	it("email/phone/url/number inputs are LTR islands; an explicit dir wins", () => {
		for (const type of ["email", "tel", "url", "number"])
			expect(renderToString(<Input label="x" type={type} value="a@b.c" onChange={() => undefined} />)).toContain('dir="ltr"');
		expect(renderToString(<Input label="x" dir="rtl" value="abc" onChange={() => undefined} />)).toContain('dir="rtl"');
	});
	it("CSS: text-align follows the resolved dir (start); LTR islands align to the end in RTL; textarea is plaintext", () => {
		const f = css("field.css");
		expect(f).toMatch(/\.sy-field__control\s*\{[^}]*text-align:\s*start/);
		expect(f).toMatch(/:root\[dir="rtl"\] \.sy-field__control\[dir="ltr"\]\s*\{\s*text-align:\s*end/);
		expect(f).toMatch(/--area\s*\{\s*unicode-bidi:\s*plaintext/);
	});
	it("chips isolate record text in <bdi>", () => {
		expect(renderToString(<Badge>{MIXED[1]}</Badge>)).toContain("<bdi>");
	});
});

describe("RecordEditFooter (UI_R4_SPEC D)", () => {
	it("is rendered while clean: Save disabled with a 'No changes' hint, Cancel present", () => {
		const html = renderToString(
			<I18nProvider>
				<RecordEditFooter dirty={false} saving={false} onCancel={() => undefined} saveLabel="Save" saveTestId="x-save" />
			</I18nProvider>,
		);
		expect(html).toContain('data-testid="x-save"');
		expect(html).toMatch(/<button[^>]*disabled=""[^>]*data-testid="x-save"|<button[^>]*data-testid="x-save"[^>]*disabled=""/);
		expect(html).toContain('title="لا توجد تغييرات"');
		expect(html).toContain('data-testid="record-edit-cancel"');
	});
	it("dirty enables Save", () => {
		const html = renderToString(
			<I18nProvider>
				<RecordEditFooter dirty saving={false} onCancel={() => undefined} saveLabel="Save" saveTestId="x-save" />
			</I18nProvider>,
		);
		expect(html).not.toMatch(/data-testid="x-save"[^>]* disabled=""/);
		expect(html).not.toMatch(/ disabled=""[^>]*data-testid="x-save"/);
	});
});

describe("Select list sizing (UI_R4_SPEC F1)", () => {
	const s = css("select.css");
	it("is content-sized with a 160px floor, never the trigger width, and options never wrap per character", () => {
		expect(s).toMatch(/\.sy-select__list\s*\{[^}]*min-inline-size:\s*max\(var\(--sy-trigger-w, 0px\), 160px\)/);
		expect(s).toMatch(/\.sy-select__list\s*\{[^}]*inline-size:\s*max-content/);
		expect(s).toMatch(/\.sy-select__list\s*\{[^}]*max-inline-size:\s*min\(360px/);
		const label = s.match(/\.sy-select__option-label\s*\{[^}]*\}/)?.[0] ?? "";
		expect(label).toContain("white-space: nowrap");
		expect(label).toContain("text-overflow: ellipsis");
		expect(label).not.toContain("anywhere");
	});
});
