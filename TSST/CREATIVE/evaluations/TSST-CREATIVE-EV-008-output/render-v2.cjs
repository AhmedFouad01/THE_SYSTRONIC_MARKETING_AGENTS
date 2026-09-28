const { chromium } = require('C:\\Users\\10\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\playwright');
const path = require('path');
const { pathToFileURL } = require('url');

const root = __dirname;
const jobs = [
  ['social-ad-v2.html', 'social-ad-v2.png', 1080, 1350],
  ['executive-slide-v2.html', 'executive-slide-v2.png', 1920, 1080],
  ['web-hero-desktop-v2.html', 'web-hero-desktop-v2.png', 1440, 900],
  ['web-hero-mobile-v2.html', 'web-hero-mobile-v2.png', 390, 844],
];

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  });
  try {
    for (const [html, png, width, height] of jobs) {
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
      await page.goto(pathToFileURL(path.join(root, html)).href, { waitUntil: 'load' });
      await page.screenshot({ path: path.join(root, png), fullPage: false });
      await page.close();
    }
  } finally {
    await browser.close();
  }
})();
