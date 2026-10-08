import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "../../ui/i18n/index.ts";
import { ContactChannels } from "./ContactFields.tsx";
const render=(masked:boolean|undefined,email=" A@EXAMPLE.COM ",phone="٠١٠٠١٢٣٤٥٦٧")=>renderToStaticMarkup(<I18nProvider><ContactChannels record={{sensitive_masked:masked,email,phone}}/></I18nProvider>);
describe("R09 record channel actions",()=>{
 it("uses only canonical visible mailto/tel/WhatsApp values",()=>{
  const html=render(false);expect(html).toContain('href="mailto:a%40example.com"');expect(html).toContain('href="tel:+201001234567"');expect(html).toContain('href="https://wa.me/201001234567"');
 });
 it("hides actions and values when masked or permission is unknown",()=>{
  expect(render(true)).toBe("");expect(render(undefined)).toBe("");
 });
 it("encodes email URI delimiters as part of the recipient",()=>{
  const html=render(false,"person?subject=oops@example.com","");expect(html).toContain("mailto:person%3Fsubject%3Doops%40example.com");expect(html).not.toContain("mailto:person?subject");
 });
 it("does not generate actions for invalid channel values",()=>{
  const html=render(false,"invalid","bad");expect(html).not.toContain("href=");
 });
});
