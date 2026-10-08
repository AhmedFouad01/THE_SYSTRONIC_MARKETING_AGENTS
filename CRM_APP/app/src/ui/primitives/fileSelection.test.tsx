import { renderToStaticMarkup } from "react-dom/server";
import type { DropItem } from "react-aria-components";
import { afterEach, describe, expect, it, vi } from "vitest";
import { I18nProvider, ar, en } from "../i18n/index.ts";
import * as storage from "../storage.ts";
import { FileDropZone } from "./FileDropZone.tsx";
import { createFileSelection } from "./fileSelection.ts";

const file = new File(["a,b"], "مبيعات Q4.csv", { type: "text/csv" });
const item = (getFile = () => Promise.resolve(file)): DropItem => ({ kind: "file", name: file.name, type: file.type, getFile, getText: async () => "a,b" });
const setup = () => {
 const callbacks = { isDisabled: vi.fn(() => false), onSelect: vi.fn(), onError: vi.fn() };
 return { ...callbacks, selection: createFileSelection(callbacks) };
};
afterEach(() => vi.restoreAllMocks());
describe("file selection behaviour", () => {
 it("accepts the first actual file, ignoring text and directories", async () => {
  const c = setup();
  await c.selection.drop([{ kind: "text", types: new Set(["text/plain"]), getText: async () => "ignore" }, item(), item(() => Promise.resolve(new File([], "second.csv")))]);
  expect(c.onSelect).toHaveBeenCalledExactlyOnceWith(file);
  c.onSelect.mockClear();
  await c.selection.drop([{ kind: "directory", name: "folder", getEntries: async function* () {} }]);
  expect(c.onSelect).not.toHaveBeenCalled();
 });
 it("browse cancellation preserves selection; reselecting the same file is accepted", () => {
  const c = setup();
  c.selection.browse(null);
  c.selection.browse({ length: 0 } as FileList);
  expect(c.onSelect).not.toHaveBeenCalled();
  const files = { 0: file, length: 1 } as unknown as FileList;
  c.selection.browse(files); c.selection.browse(files);
  expect(c.onSelect).toHaveBeenCalledTimes(2);
 });
 it("removal/unmount invalidation prevents a pending read restoring the file", async () => {
  const c = setup();
  let resolve!: (file: File) => void;
  const pending = c.selection.drop([item(() => new Promise((done) => { resolve = done; }))]);
  c.selection.invalidate(); resolve(file); await pending;
  expect(c.onSelect).not.toHaveBeenCalled();
 });
 it("a newer browse selection supersedes an older asynchronous drop", async () => {
  const c = setup();
  let resolve!: (file: File) => void;
  const pending = c.selection.drop([item(() => new Promise((done) => { resolve = done; }))]);
  const next = new File([], "next.xlsx");
  c.selection.browse({ 0: next, length: 1 } as unknown as FileList);
  resolve(file); await pending;
  expect(c.onSelect).toHaveBeenCalledExactlyOnceWith(next);
 });
 it("disabling blocks browse/drop and a pending drop completion", async () => {
  const c = setup();
  let resolve!: (file: File) => void;
  const pending = c.selection.drop([item(() => new Promise((done) => { resolve = done; }))]);
  c.isDisabled.mockReturnValue(true);
  c.selection.browse({ 0: file } as unknown as FileList);
  await c.selection.drop([item()]); resolve(file); await pending;
  expect(c.onSelect).not.toHaveBeenCalled();
 });
 it("read failures are reported without changing the selected file", async () => {
  const c = setup();
  await c.selection.drop([item(() => Promise.reject(new Error("read")))]);
  expect(c.onError).toHaveBeenCalledOnce(); expect(c.onSelect).not.toHaveBeenCalled();
 });
});
describe("localized accessible FileDropZone markup", () => {
 for (const locale of ["ar", "en"] as const) it(`provides ${locale} browse/remove labels, filename isolation and hidden file picker`, () => {
  vi.spyOn(storage, "readPref").mockReturnValue(locale);
  const messages = locale === "ar" ? ar : en;
  const html = renderToStaticMarkup(<I18nProvider><FileDropZone label={messages["import.chooseFile"]} acceptedFileTypes={[".csv", ".xlsx"]} file={{ name: file.name, size: 2048 }} onSelect={() => {}} onRemove={() => {}} /></I18nProvider>);
  expect(html).toContain(messages["fileDrop.browse"]);
  expect(html).toContain(messages["fileDrop.remove"].replace("{name}", file.name));
  expect(html).toContain('type="file"'); expect(html).toContain('accept=".csv,.xlsx"');
  expect(html).toContain('style="display:none"'); expect(html).toContain(`<bdi>${file.name}</bdi>`);
  expect(html).toContain(new Intl.NumberFormat(locale).format(2));
  expect(html).toContain(messages["fileDrop.kib"]); expect(html).toContain('role="status"');
 });
 it("disables visible browse and remove buttons while processing", () => {
  const html = renderToStaticMarkup(<I18nProvider><FileDropZone label="File" acceptedFileTypes={[".csv"]} file={{ name: file.name, size: file.size }} disabled onSelect={() => {}} onRemove={() => {}} /></I18nProvider>);
  expect(html.match(/disabled=""/g)?.length).toBeGreaterThanOrEqual(2);
 });
});
