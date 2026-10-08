import { afterEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nProvider } from "../../ui/i18n/index.ts";
import { Check, ColorPicker } from "./controls.tsx";

afterEach(() => vi.unstubAllGlobals());
it("property flags keep labelled checked and disabled native input semantics", () => {
 const html = renderToStaticMarkup(<Check label="Required" checked disabled testId="flag" onChange={() => undefined} />);
 expect(html).toContain("Required");
 const input = html.match(/<input[^>]*type="checkbox"[^>]*>/)?.[0];
 expect(input).toContain('checked=""');
 expect(input).toContain('disabled=""');
 expect(html).toContain('data-disabled="true"');
});
it("color choices retain named radios, selected value, and the no-color option", () => {
 vi.stubGlobal("window", { localStorage: { getItem: () => "en" } });
 const html = renderToStaticMarkup(<I18nProvider><ColorPicker value="blue" colors={["blue", "green"]} label="Option color" onChange={() => undefined} /></I18nProvider>);
 expect(html).toContain('role="radiogroup"');
 expect(html).toContain('aria-label="Option color"');
 expect(html.match(/<input[^>]*value="blue"[^>]*>/)?.[0]).toContain('checked=""');
 expect(html).toContain('aria-label="Blue"');
 expect(html).toContain('title="Blue"');
 expect(html).toContain('data-testid="color-none"');
 expect(html.match(/type="radio"/g)).toHaveLength(3);
});
