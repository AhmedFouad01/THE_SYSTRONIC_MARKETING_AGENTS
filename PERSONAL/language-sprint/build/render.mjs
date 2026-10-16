// Render booklet HTML files to PDF with Playwright Chromium.
// Usage: node render.mjs <html> <pdf> [<html> <pdf> ...]
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire('C:/Users/10/tsst-tools/code-motion/package.json');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage();
for (let i = 0; i < args.length; i += 2) {
  await page.goto(pathToFileURL(resolve(args[i])).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: resolve(args[i + 1]), preferCSSPageSize: true, printBackground: true });
  console.log('pdf', args[i + 1]);
}
await browser.close();
