#!/usr/bin/env node
// TSST code-motion capture: deterministic frame capture of an HTML page that exposes window.seek(t).
// Usage: node capture.mjs --html sample.html --out ./frames --fps 30 --duration 4 --width 1080 --height 1920
//        [--blur 1] [--ffmpeg "C:\...\bin\ffmpeg.exe"] [--mp4 out.mp4]
// Without --ffmpeg it only prints the ffmpeg command. Needs: npm i -D playwright && npx playwright install chromium
import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const a = {};
for (let i = 2; i < process.argv.length; i += 2) a[process.argv[i].replace(/^--/, '')] = process.argv[i + 1];
const need = ['html', 'out'];
for (const k of need) if (!a[k]) { console.error('missing --' + k); process.exit(1); }
const fps = +(a.fps || 30), dur = +(a.duration || 4), W = +(a.width || 1080), H = +(a.height || 1920);
const blur = Math.max(1, +(a.blur || 1));           // subframes per output frame (motion blur via tmix)
const out = resolve(a.out), mp4 = resolve(a.mp4 || join(out, '..', 'out.mp4'));
const total = Math.round(fps * dur) * blur, capFps = fps * blur;
mkdirSync(out, { recursive: true });
for (const f of readdirSync(out)) if (/^f\d+\.png$/.test(f)) rmSync(join(out, f));

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.error('playwright not installed. Run once: npm i -D playwright && npx playwright install chromium'); process.exit(2); }

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(resolve(a.html)).href, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
if (!(await page.evaluate(() => typeof window.seek === 'function'))) { console.error('page has no window.seek(t)'); await browser.close(); process.exit(3); }
for (let n = 0; n < total; n++) {
  const t = n / capFps;
  await page.evaluate(t => window.seek(t), t);
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); // let layout/paint settle
  await page.screenshot({ path: join(out, `f${String(n).padStart(5, '0')}.png`), type: 'png' });
  if (n % capFps === 0) console.log(`t=${t.toFixed(2)}s  frame ${n + 1}/${total}`);
}
await browser.close();

const vf = blur > 1 ? `-vf "tmix=frames=${blur},select='not(mod(n\,${blur}))'" ` : '';
const exe = a.ffmpeg ? `"${a.ffmpeg}"` : 'ffmpeg';
const cmd = `${exe} -y -framerate ${capFps} -i "${join(out, 'f%05d.png')}" ${vf}-r ${fps} -c:v libx264 -pix_fmt yuv420p -crf 16 -preset slow -movflags +faststart "${mp4}"`;
console.log(cmd);
if (a.ffmpeg) { const r = spawnSync(cmd, { shell: true, stdio: 'inherit' }); process.exit(r.status ?? 1); }
