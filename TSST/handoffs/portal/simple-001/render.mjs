// DASH-SIMPLE-001: render all simplified mocks to PNG + run 6 R55 checks.
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const require = createRequire('C:/Users/10/tsst-tools/code-motion/package.json');
const { chromium } = require('playwright');
const here = dirname(fileURLToPath(import.meta.url));

const jobs = [
  ['client-home-en', 'client-home.html', ''],
  ['client-home-ar', 'client-home.html', 'lang=ar'],
  ['client-review-en', 'client-review.html', ''],
  ['client-review-ar', 'client-review.html', 'lang=ar'],
  ['client-work-en', 'client-work.html', ''],
  ['client-work-ar', 'client-work.html', 'lang=ar'],
  ['client-requests-en', 'client-requests.html', ''],
  ['client-requests-ar', 'client-requests.html', 'lang=ar'],
  ['team-home', 'team-home.html', ''],
  ['team-client', 'team-client.html', ''],
  ['team-job', 'team-job.html', ''],
  ['controls', 'controls.html', ''],
];

// R55 proof: (a) text < 13px, (b) title edges, (c) overflow, (d) 390 card edges, (e) row right edges, (f) one-line chips.
const audit = () => {
  const out = { small: [], edges: [], overflow: [], cards: [], rowEdges: [], chips: [] };
  const vis = el => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return cs.visibility !== 'hidden' && cs.display !== 'none' && r.width > 1 && r.height > 1 && !el.closest('.sr-only');
  };
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = tw.nextNode());) {
    const el = n.parentElement;
    if (!n.textContent.trim() || !el || !vis(el)) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < 13) out.small.push(`${fs}px "${n.textContent.trim().slice(0, 40)}"`);
    const rg = document.createRange();
    rg.selectNodeContents(n);
    const tr = rg.getBoundingClientRect();
    if (tr.width < 1) continue;
    for (let a = el; a && a !== document.body; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (/(auto|scroll)/.test(cs.overflowX)) break;
      if (cs.display === 'inline' || cs.display === 'contents') continue;
      const b = a.getBoundingClientRect();
      if (tr.left < b.left - 1 || tr.right > b.right + 1) {
        out.overflow.push(`"${n.textContent.trim().slice(0, 40)}" outside .${(a.className || a.tagName).toString().split(' ')[0]} by ${Math.max(b.left - tr.left, tr.right - b.right).toFixed(1)}px`);
        break;
      }
    }
  }
  const textRect = el => {
    const r = document.createRange();
    r.selectNodeContents(el);
    return r.getBoundingClientRect();
  };
  const refRect = el => {
    const d = getComputedStyle(el).display;
    if (/inline-(flex|block|grid)/.test(d)) return el.getBoundingClientRect();
    return textRect(el);
  };
  const cmp = (label, head, ref, end) => {
    if (!vis(head) || !ref || !vis(ref)) return;
    const h = textRect(head);
    const r = end ? (ref.tagName === 'TD' ? textRect(ref) : ref.getBoundingClientRect()) : refRect(ref);
    const d = end ? Math.abs(h.right - r.right) : Math.abs(h.left - r.left);
    if (d > 1) out.edges.push(`${label} "${head.textContent.trim()}" off by ${d.toFixed(1)}px`);
  };
  for (const t of document.querySelectorAll('table')) {
    const ths = [...t.querySelectorAll('thead th')];
    const row = [...t.querySelectorAll('tbody tr')].find(r => !r.classList.contains('group'));
    if (!row) continue;
    ths.forEach((th, i) => {
      if (!th.textContent.trim()) return;
      const td = row.children[i];
      if (!td) return;
      const end = getComputedStyle(th).textAlign === 'end' || getComputedStyle(th).textAlign === 'right';
      cmp('table', th, end ? (td.firstElementChild || td) : (td.firstElementChild || td), end);
    });
  }
  for (const h of document.querySelectorAll('[data-col]')) {
    const ref = document.querySelector(`[data-col-ref="${h.dataset.col}"]`);
    const end = h.dataset.align === 'end';
    cmp('col', h, end ? ref : (ref && (ref.querySelector('.v') || ref)), end);
  }
  // (d) at phone width every card shares one left and right edge
  if (innerWidth < 768) {
    const cs = [...document.querySelectorAll('.card:not(.kpi)')].filter(vis).map(c => c.getBoundingClientRect());
    if (cs.length) {
      const l = Math.min(...cs.map(r => r.left)), r0 = Math.max(...cs.map(r => r.right));
      cs.forEach((r, i) => {
        if (Math.abs(r.left - l) > 1 || Math.abs(r.right - r0) > 1) {
          out.cards.push(`card ${i + 1} edges ${r.left.toFixed(0)}..${r.right.toFixed(0)} vs ${l.toFixed(0)}..${r0.toFixed(0)}`);
        }
      });
    }
  }
  // (e) row right edges inside each [data-row-group]
  for (const grp of document.querySelectorAll('[data-row-group]')) {
    if (!vis(grp)) continue;
    if (grp.classList.contains('pk-stats') && innerWidth >= 768) continue;
    const ends = [...grp.querySelectorAll('[data-row-end]')].filter(vis).map(el => el.getBoundingClientRect().right);
    if (ends.length > 1) {
      const rMax = Math.max(...ends);
      ends.forEach((r, i) => {
        if (Math.abs(r - rMax) > 1) out.rowEdges.push(`${grp.dataset.rowGroup} row ${i + 1} right ${r.toFixed(1)} vs ${rMax.toFixed(1)}`);
      });
    }
  }
  // (f) one-line chips
  for (const ch of document.querySelectorAll('.chip')) {
    if (!vis(ch)) continue;
    const r = ch.getBoundingClientRect();
    const tr = textRect(ch);
    if (r.height > 28 || tr.height > 20) {
      out.chips.push(`"${ch.textContent.trim()}" height ${r.height.toFixed(1)}px (text ${tr.height.toFixed(1)}px)`);
    }
  }
  return out;
};

const report = [];
const checkPage = async (page, label) => {
  const r = await page.evaluate(audit);
  report.push({ label, ...r });
};

const only = process.argv[2] || '';
const browser = await chromium.launch();
for (const [name, file, q] of jobs) {
  if (only && !name.startsWith(only) && only !== 'all') continue;
  for (const w of [1440, 1024, 390]) for (const theme of ['light', 'dark']) {
    if (w === 1024 && theme === 'dark') continue;
    const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(join(here, file)).href + '?' + [q, 'theme=' + theme].filter(Boolean).join('&'));
    await page.evaluate(() => document.fonts.ready);
    await page.setViewportSize({ width: w, height: await page.evaluate(() => document.documentElement.scrollHeight) });
    await checkPage(page, `${name}-${w}-${theme}`);
    if (w !== 1024) await page.screenshot({ path: join(here, `${name}-${w}-${theme}.png`), fullPage: true });
    await page.close();
  }
}
await browser.close();

let small = 0, edges = 0, over = 0, cards = 0, rowEdges = 0, chips = 0;
for (const r of report) {
  small += r.small.length;
  edges += r.edges.length;
  over += r.overflow.length;
  cards += r.cards.length;
  rowEdges += r.rowEdges.length;
  chips += r.chips.length;
  for (const x of r.cards) console.log(`CARD  ${r.label}: ${x}`);
  for (const x of r.overflow) console.log(`OVER  ${r.label}: ${x}`);
  for (const x of r.small) console.log(`SMALL ${r.label}: ${x}`);
  for (const x of r.edges) console.log(`EDGE  ${r.label}: ${x}`);
  for (const x of r.rowEdges) console.log(`ROWE  ${r.label}: ${x}`);
  for (const x of r.chips) console.log(`CHIP  ${r.label}: ${x}`);
}
console.log(`check: ${report.length} pages · text < 13px: ${small} · title edges: ${edges} · overflow: ${over} · 390 card edges: ${cards} · row right edges: ${rowEdges} · one-line chips: ${chips}`);
