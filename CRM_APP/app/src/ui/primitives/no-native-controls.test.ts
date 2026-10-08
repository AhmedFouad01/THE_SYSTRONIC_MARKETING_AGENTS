import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parseSync, Visitor } from "rolldown/utils";
import { describe, expect, it } from "vitest";

const SRC = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const NATIVES = new Set(["input", "select", "textarea", "button"]);
const ARIA_CONTROLS = new Set(["Input", "TextArea", "Button", "Select", "Checkbox", "CheckboxGroup", "Radio", "RadioGroup", "Switch", "Slider", "TextField", "NumberField", "DateField", "DatePicker", "ComboBox", "SearchField"]);
const TEXT_TYPES = new Set(["text", "email", "password", "search", "tel", "url", "number"]);

// Parse JSX instead of matching source text: comments, data and RAC-generated DOM are irrelevant.
function violations(source: string, filename = "feature.tsx"): string[] {
 const result = parseSync(filename, source, { lang: filename.endsWith(".tsx") ? "tsx" : "ts" });
 if (result.errors.length) throw new Error(`Guard parse failed: ${result.errors.map((error) => error.message).join("; ")}`);
 const aria = new Map<string, string>();
 const kitInputs = new Set<string>();
 const namespaces = new Set<string>();
 const kitNamespaces = new Set<string>();
 for (const node of result.program.body) {
  if (node.type !== "ImportDeclaration") continue;
  const module = node.source.value;
  for (const entry of node.specifiers) {
   if (module === "react-aria-components" && entry.type === "ImportNamespaceSpecifier") namespaces.add(entry.local.name);
   if (module.includes("ui/") && entry.type === "ImportNamespaceSpecifier") kitNamespaces.add(entry.local.name);
   if (entry.type !== "ImportSpecifier") continue;
   const original = entry.imported.type === "Identifier" ? entry.imported.name : entry.imported.value;
   if (module === "react-aria-components") aria.set(entry.local.name, original);
   if (module.includes("ui/") && original === "Input") kitInputs.add(entry.local.name);
  }
 }
 const hits: string[] = [];
 new Visitor({ JSXOpeningElement(node) {
   const tag = source.slice(node.name.start, node.name.end);
   const attributes = node.attributes.filter((attribute) => attribute.type === "JSXAttribute");
   const type = attributes.find((attr) => attr.name.type === "JSXIdentifier" && attr.name.name === "type")?.value;
   const staticType = type && (type.type === "Literal" && typeof type.value === "string" ? type.value : type.type === "JSXExpressionContainer" && type.expression.type === "Literal" && typeof type.expression.value === "string" ? type.expression.value : null);
   const imported = aria.get(tag) ?? (tag.includes(".") && namespaces.has(tag.split(".")[0] ?? "") ? tag.split(".")[1] : undefined);
   const styled = attributes.some((attr) => attr.name.type === "JSXIdentifier" && ["className", "style"].includes(attr.name.name) && !!attr.value && (attr.value.type !== "Literal" || typeof attr.value.value === "string" && !!attr.value.value.trim()));
   if (NATIVES.has(tag)) hits.push(`${tag}: use the UI kit`);
   const kitInput = kitInputs.has(tag) || tag.endsWith(".Input") && kitNamespaces.has(tag.split(".")[0] ?? "");
   if ((kitInput || imported === "Input") && type && (!staticType || !TEXT_TYPES.has(staticType.toLowerCase()))) hits.push(`${tag}: native widget type ${staticType ?? "dynamic"}`);
   if (imported && ARIA_CONTROLS.has(imported) && !styled) hits.push(`${tag}: missing kit styling`);
 } }).visit(result.program);
 return hits;
}
function walk(dir: string): string[] {
 return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => { const path = join(dir, entry.name); return entry.isDirectory() ? walk(path) : [path]; });
}
describe("no native or unstyled controls outside the UI kit", () => {
 it("catches every native control, including multiline and styled native elements", () => {
  for (const tag of NATIVES) expect(violations(`<${tag}\n className="existing" />`)).toHaveLength(1);
 });
 it("rejects styled kit Input file/date/time/color/range and dynamic widget bypasses", () => {
  for (const type of ["file", "FILE", "date", "datetime-local", "time", "month", "week", "color", "range", "checkbox", "radio"]) expect(violations(`import { Input as Field } from "../../ui/primitives/index.ts"; <Field type={"${type}"} />`)).toHaveLength(1);
  expect(violations('import { Input } from "../../ui/index.ts"; <Input type={kind} />')).toHaveLength(1);
  expect(violations('import * as Kit from "../../ui/primitives/index.ts"; <Kit.Input type="file" />')).toHaveLength(1);
 });
 it("checks RAC aliases/namespaces for explicit styling and unsafe Input widgets", () => {
  expect(violations('import { Button as B } from "react-aria-components"; <B />')).toHaveLength(1);
  expect(violations('import * as RAC from "react-aria-components"; <RAC.TextArea />')).toHaveLength(1);
  expect(violations('import { Input as I } from "react-aria-components"; <I className="sy-field__control" type="file" />')).toHaveLength(1);
  expect(violations('import { Radio, Input } from "react-aria-components"; <Radio className="sy-props__swatch" />; <Input type="search" className="sy-grid__search" />')).toEqual([]);
 });
 it("ignores comments/data and allows ordinary kit fields", () => {
  expect(violations('/* <input type="file" /> */ const hint = "<textarea />"; import { Input } from "../../ui/primitives/index.ts"; <Input type="password" />; <Input />')).toEqual([]);
 });
 it("all delivery app source outside ui uses styled accessible controls", () => {
  const hits: string[] = [];
  for (const file of walk(SRC)) {
   const path = relative(SRC, file);
   if (path.startsWith(`ui${sep}`) || !/\.tsx?$/.test(file) || /\.test\.tsx?$/.test(file)) continue;
   for (const hit of violations(readFileSync(file, "utf8"), file)) hits.push(`${path}: ${hit}`);
  }
  expect(hits).toEqual([]);
 });
});
