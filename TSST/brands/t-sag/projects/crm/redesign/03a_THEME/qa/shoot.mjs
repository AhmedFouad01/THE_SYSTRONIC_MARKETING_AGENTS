// QA shooter: 8 shots (1440x900, 375x812) x (light, dark) x (en, ar), plus DOM checks.
// Usage: node shoot.mjs [suffix]   (suffix "" for first pass, "-r2" for the re-shoot)
import { chromium } from "file:///C:/Users/10/tsst-tools/code-motion/node_modules/playwright/index.mjs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

const here = path.dirname(fileURLToPath(import.meta.url));
const page_url = pathToFileURL(path.join(here, "..", "theme-preview.html")).href;
const suffix = process.argv[2] || "";
const sizes = { desktop: { width: 1440, height: 900 }, mobile: { width: 375, height: 812 } };
const report = [];

const browser = await chromium.launch();
for (const [sz, vp] of Object.entries(sizes)) {
  for (const theme of ["light", "dark"]) {
    for (const lang of ["en", "ar"]) {
      const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, hasTouch: sz === "mobile" });
      const page = await ctx.newPage();
      await page.goto(`${page_url}?lang=${lang}&theme=${theme}`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(400);
      const name = `${sz}-${theme}-${lang}${suffix}`;
      await page.screenshot({ path: path.join(here, `${name}.png`), fullPage: true });

      const res = await page.evaluate(() => {
        const out = { overflowX: document.documentElement.scrollWidth - innerWidth, clipped: [], pureBlack: [], native: [], fonts: {}, tnum: [], mirror: [], btnOnLine: 0 };
        const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
        // clipped text
        document.querySelectorAll("body *").forEach(e => {
          if (!vis(e) || e.closest("svg")) return;
          const cs = getComputedStyle(e);
          if (e.scrollWidth > e.clientWidth + 1 && cs.overflow === "visible" && e.children.length === 0 && e.textContent.trim()) out.clipped.push(e.tagName + "." + e.className + ":" + e.textContent.trim().slice(0, 30));
          const r = e.getBoundingClientRect();
          if (r.right > innerWidth + 1 || r.left < -1) { if (!e.closest(".side") && !e.closest(".pop")) out.clipped.push("outside:" + e.tagName + "." + e.className); }
          for (const p of ["color", "backgroundColor", "borderTopColor"]) {
            if (/rgba?\(0, 0, 0(, 1)?\)$/.test(cs[p]) && !(p === "borderTopColor" && cs.borderTopWidth === "0px")) out.pureBlack.push(e.tagName + "." + e.className + ":" + p);
          }
        });
        // native controls: visible
        document.querySelectorAll("select,input[type=date],input[type=file],input[type=color],input[type=range],progress,meter").forEach(e => { if (vis(e)) out.native.push(e.tagName + ":" + e.type); });
        document.querySelectorAll("input[type=checkbox]").forEach(e => { if (getComputedStyle(e).opacity !== "0") out.native.push("checkbox visible"); });
        // fonts used
        out.fonts.body = getComputedStyle(document.body).fontFamily;
        out.fonts.loaded = [...document.fonts].filter(f => f.status === "loaded").map(f => f.family.replace(/"/g, "") + " " + f.weight).slice(0, 12);
        // tabular numbers
        document.querySelectorAll("td.num,.kpi .v,.num").forEach(e => { if (!/tabular/.test(getComputedStyle(e).fontVariantNumeric)) out.tnum.push(e.className); });
        // mirrored icons in rtl
        if (document.dir === "rtl") document.querySelectorAll("svg.flip").forEach(e => out.mirror.push(getComputedStyle(e).transform));
        // buttons vs lines: any border-block on an ancestor/sibling with a visible line
        const lines = [...document.querySelectorAll("body *")].filter(e => vis(e) && !e.closest("svg") && ((parseFloat(getComputedStyle(e).borderBottomWidth) > 0 && e.tagName !== "INPUT" && e.tagName !== "BUTTON" && !e.closest(".cb") && !e.closest(".date")) || e.tagName === "HR"));
        out.btnOnLine = lines.length; out.lineEls = lines.map(e=>e.tagName+"."+e.className).slice(0,5);
        // row alignment: control heights in page header and form rows
        const h = s => [...document.querySelectorAll(s)].filter(vis).map(e => Math.round(e.getBoundingClientRect().height));
        out.actionHeights = h(".acts > *, .acts .btn, .acts .in");
        out.topHeights = h(".top .switch, .top .in, .top .avatar");
        // bidi: names
        out.names = [...document.querySelectorAll(".who b bdi")].map(e => e.textContent + "|" + e.getAttribute("dir"));
        // text overlap in table cells (rough): who small taller than line
        out.tableRowH = [...document.querySelectorAll("#rows tr")].filter(vis).map(e => Math.round(e.getBoundingClientRect().height));
        return out;
      });
      // focus ring check
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      const ring = await page.evaluate(() => { const e = document.activeElement; const cs = getComputedStyle(e); return { tag: e.tagName + "." + e.className, outline: cs.outlineStyle + " " + cs.outlineWidth + " " + cs.outlineColor }; });
      res.ring = ring;
      report.push({ name, ...res });
      await ctx.close();
    }
  }
}
await browser.close();
fs.writeFileSync(path.join(here, `qa-data${suffix}.json`), JSON.stringify(report, null, 1));
for (const r of report) console.log(r.name, "overflowX", r.overflowX, "clipped", r.clipped.length, "black", r.pureBlack.length, "native", r.native.length, "tnumMiss", r.tnum.length, "lines", r.btnOnLine, "ring", r.ring.outline);
