import { afterEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nProvider } from "../i18n/index.ts";
import { PreviewPanel } from "./PreviewPanel.tsx";
afterEach(()=>vi.unstubAllGlobals());
it("desktop preview retains non-modal body access and native disabled navigation/tooltips",()=>{
 vi.stubGlobal("window", {localStorage:{getItem:()=>"en"}});
 const html=renderToStaticMarkup(<I18nProvider><PreviewPanel label="Record details" heading="اسم English" testId="preview" onClose={()=>undefined} nav={{onPrev:null,onNext:()=>undefined,busy:true,position:"1 of 2"}}><p>Record body</p></PreviewPanel></I18nProvider>);
 expect(html).toContain('aria-modal="false"');
 expect(html).toContain('Record body');
 expect(html).toContain('<bdi dir="auto">اسم English</bdi>');
 for(const id of ['preview-prev','preview-next']) expect(html.match(new RegExp(`<button[^>]*data-testid="${id}"[^>]*>`))?.[0]).toContain('disabled=""');
 expect(html.match(/<button[^>]*data-testid="preview-prev"[^>]*>/)?.[0]).toContain('title="Previous record"');
 expect(html.match(/<button[^>]*data-testid="preview-next"[^>]*>/)?.[0]).toContain('title="Next record"');
 expect(html).toContain('data-testid="preview-close"');
});
