import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nProvider } from "../i18n/index.ts";
import { DataGrid } from "./DataGrid.tsx";
const rows = [{id:"one",name:"اسم English"},{id:"two",name:"Another name"}];
const columns = [{id:"name",header:"Name",value:(row:typeof rows[number])=>row.name,sortable:true,hideable:false,mobile:"title" as const}];
afterEach(()=>vi.unstubAllGlobals());
function render(status:"loading"|"ready"|"error"="ready", visibleRows=rows) {
 vi.stubGlobal("window", {localStorage:{getItem:()=>"en"}});
 return renderToStaticMarkup(<I18nProvider><DataGrid gridId="fixture" label="Records" rows={visibleRows} columns={columns} getRowId={row=>row.id} status={status} selectable /></I18nProvider>);
}
describe("grid adapter semantic contracts",()=>{
 it("retains table/sort/selection/search labels, bidi row text and disabled pager boundaries",()=>{
  const html=render();
  expect(html).toContain('<caption class="sy-grid__sr">Records</caption>');
  expect(html).toContain('aria-sort="none"');
  expect(html).toContain('data-testid="sort-name"');
  expect(html).toContain('type="search"');
  expect(html).toContain('data-testid="grid-search"');
  expect(html.match(/type="checkbox"/g)).toHaveLength(3);
  expect(html).toContain('Select all rows on this page');
  expect(html).toContain('Select row اسم English');
  expect(html).toMatch(/<button[^>]*data-testid="grid-prev"[^>]*disabled=""/);
  expect(html).toMatch(/<button[^>]*data-testid="grid-next"[^>]*disabled=""/);
  expect(html.match(/data-testid="grid-row"/g)).toHaveLength(2);
  expect(html).toContain('data-row-id="one"');
  expect(html).toContain('data-mobile="title"');
 });
 it("loading and failed states do not expose stale selectable rows",()=>{
  expect(render("loading", [])).not.toContain('data-testid="grid-row"');
  expect(render("error")).not.toContain('data-testid="grid-row"');
  expect(render("loading")).toContain('data-testid="grid-row"');
 });
});
