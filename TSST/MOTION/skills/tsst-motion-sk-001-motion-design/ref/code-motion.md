# SK-015 ref: code-motion (code-drawn video: one HTML file, captured to MP4)

Status: UNVALIDATED method. Source: GEM-CR-007 (shallow; Lead-filtered) + public index (`ref/code-motion/code-motion-stats.md`). Frequency claims and "short vs long prompt" rules from GEM-CR-007 are NOT adopted. Nothing here has been rendered end-to-end by TSST yet; the first run is the validation. HTML/prompt/storyboard alone = PREVIS; the MP4 needs render QA (FINAL_ASSET_GATE).

## 1. When to use which

| Need | Code-motion (HTML + GSAP/SVG/Canvas) | After Effects | AI video |
|---|---|---|---|
| Typography, UI, charts, logo reveal, explainers | BEST: exact text, exact brand hex, browser shapes Arabic | Good, slower to iterate | Poor (garbled text) |
| Photoreal people/places/products | No | Compositing only | BEST |
| Exact repeatable edits (change a word, re-export) | BEST (edit text, re-render) | OK | Re-roll, not editable |
| Complex 3D / physics / camera | Limited | Plug-ins / Blender | Good |
| Cost / tooling | Free; Node + Chromium + ffmpeg | Licence | Credits |

Use code-motion for type/graphic-led shots; mix with AI-video shots in the edit. GSAP licence note: `ref/web.md`.

## 2. Prompt template for the coding agent (fill every `{}`)

```
ROLE B external coding agent. Build ONE self-contained HTML motion piece. Do not start coding until I approve the scene table.
FORMAT: {1080x1920 | 1920x1080}, {25|30} fps, {N} seconds, background {hex}.
BEAT SHEET (LENS SK-016, in seconds): {0.0-1.2 hook: ...; 1.2-3.0 ...; ...; end card}. Beat grid: {BPM}; 1 beat = 60/BPM s; hits on beats.
BRAND: colours {exact hex list}; fonts {file paths}, loaded with @font-face and awaited via document.fonts.ready; logo {file path} placed as <img>/<image> as-is, never redrawn, recoloured or traced.
ARABIC/RTL: Arabic lines in dir=rtl, lang=ar; animate whole words or whole lines only, NEVER per letter/character (breaks joining); no mixed AR/EN inside one line (separate elements); Arabic font loaded before the first frame; Arabic size >= {n}px, on screen >= {n} s.
MOTION: one motion family: {e.g. mask-up reveals}; easings only from {expo.out, power3.out, power2.inOut, sine.inOut, ...} (ref/easing.md); primary element first, support second, logo last.
BANNED: shockwave/expanding rings, particle bursts, glow pulses, lens flares, neon gradients, bouncing logos, random floating shapes, generic tech grids, any effect with no job in the beat sheet; plus {brand-specific bans}.
DETERMINISM: no setTimeout/setInterval, no rAF-driven or CSS animation/transition timing, no Date.now/Math.random (seeded PRNG only). Build one gsap.timeline({paused:true}) (+ canvas drawn from t). Expose window.seek = t => { tl.pause(); tl.time(t,false); /* redraw canvas from t */ } and call seek(0) on load. Same t must give the same pixels.
OUTPUT: index.html + assets/ only; GSAP from a pinned version URL or local file. Safe zone: text/logo inside {margins}.
STEP 1 (STORYBOARD GATE): return a table [scene | start-end s | on screen | motion + easing | text AR / EN] and STOP. Wait for my "approved".
```

Storyboard gate: CREATIVE_AG checks the table against the beat sheet and brand block before releasing step 2. Beat grid: frames = round(seconds x fps); at 120 BPM and 30 fps, 1 beat = 0.5 s = 15 frames, 1 bar (4/4) = 60 frames; snap hit times to whole frames.

## 3. Capture method

Tool: `TSST/CREATIVE/tools/code-motion/capture.mjs` (README and sample.html beside it). Chosen library: Playwright (screenshot API https://playwright.dev/docs/api/class-page#page-screenshot ; browsers https://playwright.dev/docs/browsers). Why: one install command fetches a pinned Chromium, so output does not depend on the installed Chrome version; clean async API. Puppeteer would also work (untested). URLs cited from knowledge, checked by Lead 2026-10-08.

Per frame n: `t = n/fps` -> (once) `document.fonts.ready` -> `window.seek(t)` -> wait two rAFs -> PNG screenshot (device scale 1, viewport = output size). Slower than realtime but exact; no dropped frames.

Encode (frames f00000.png ...):
```
ffmpeg -y -framerate 30 -i frames/f%05d.png -r 30 -c:v libx264 -pix_fmt yuv420p -crf 16 -preset slow -movflags +faststart out.mp4
```
Sizes 1080x1920 or 1920x1080 (even dimensions), 25 or 30 fps. ffmpeg: `C:\Users\10\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe`.

Optional motion blur: `--blur 4` captures 4 subframes per output frame (rate fps x 4) and blends them: `-framerate 120 -i f%05d.png -vf "tmix=frames=4,select='not(mod(n\,4))'" -r 30 ...` (tmix doc: https://ffmpeg.org/ffmpeg-filters.html#tmix). Costs 4x capture time; use for fast moves only; blur softens text, so keep text moves slow.

Audio mux after (video untouched): `ffmpeg -i out.mp4 -i music.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest final.mp4`. Hits are aligned by the beat grid; no audio inside the page.

## 4. QA (with SK-010 and SK-019 `ref/post-finishing.md`)

1. Frame strip: `ffmpeg -i out.mp4 -vf "fps=2,scale=270:-1,tile=8x3" strip.png`; check pacing, empty frames, clutter.
2. Text sharpness: full-res stills at settled moments (`-ss t -frames:v 1`); edges at 100%, no ghosting from tmix.
3. Arabic joining: letters connect, no gaps or isolated forms, diacritics intact, and no mid-animation mask cuts a word shape.
4. Safe zone: platform UI margins clear of text and logo; check at phone size.
5. Beat alignment: list hit times from the page; confirm each lands on a beat frame; inspect hit +-1 frame.
6. Brand: sample hex from a still against the brand block; logo identical to the file; first and last frame deliberate.
7. Determinism: render twice, compare a few frames; they must match.

## 5. Failure patterns and fixes

| Symptom | Cause | Fix |
|---|---|---|
| Repeated frames / stutter | animation driven by timers, CSS or rAF | everything from `tl.time(t)`; remove CSS transitions |
| Fallback font / wrong glyphs | font not loaded at capture | local `@font-face`, await `document.fonts.ready`, check a still |
| Arabic letters separated | per-letter split | animate whole word/line; `dir=rtl` |
| Text pops late or flickers | screenshot before layout settled | two rAF waits; no lazy images |
| Time jumps | GSAP lagSmoothing | `gsap.ticker.lagSmoothing(0)`; seek with `time(t,false)` |
| Different result each render | Math.random / Date | seeded PRNG |
| Banding on gradients | 8-bit yuv420p | subtle noise; crf 14-16 |
| Colour differs from brand | colour profile / player | check a still on phone; stay sRGB |
| Capture very slow | oversize viewport/canvas, blur 8+ | capture at output size; blur only where needed |
| Generic "AI look" | no banned list, no concept | banned list + a purpose per scene from the beat sheet |

## 6. Example links (public lists; link only; unvalidated; no prompts copied)

| post_url | why useful | tech |
|---|---|---|
| https://x.com/moritzkremb/status/2103066071838466494 | ad-like, GSAP timeline on SVG | svg, gsap |
| https://x.com/deedydas/status/2102787937482252537 | very short brief, ad-like | svg, gsap |
| https://x.com/sudo_kiran/status/2103761658745335993 | ad-like, canvas + SVG + GSAP mix | canvas, svg, gsap, css |
| https://x.com/viktoroddy/status/2103802280617402509 | ad-like, layered UI feel | canvas, svg, gsap, css |
| https://x.com/alex_prompter/status/2103499977632997524 | ad-like, GSAP choreography | svg, gsap |
| https://x.com/hqmank/status/2103831140033241156 | ad-like, compact brief | canvas, svg, gsap |
| https://x.com/gouthamjay8/status/2103816261339910269 | ad-like, SVG sequence | svg, gsap |
| https://x.com/twoclipping/status/2103273003555402193 | long structured SVG ad brief (study structure) | svg |
| https://x.com/__morse/status/2103485566570369333 | long SVG ad brief, similar structure | svg |
| https://x.com/op7418/status/2101152767863849401 | product_ad: codebase-to-promo pipeline idea | motion graphics UI |
| https://x.com/Miguel07Code/status/2102441708395041170 | product_ad: app launch promo | motion graphics UI |
| https://x.com/Goldiez2599/status/2102463234586685869 | product_ad: app promo | motion graphics UI |
| https://x.com/bridgemindai/status/2102462889160286423 | product_ad: merch launch, product-focused | motion graphics UI |
| https://x.com/trymirage/status/2102429594804429138 | product_ad: terminal/ASCII style variant | motion graphics UI |
| https://x.com/YouWareAI/status/2102448782776697055 | product_ad: pure SVG character animation | flat vector |

More rows: filter `code-motion-index.csv` by `ad_like` or category `product_ad`. Judge by motion quality in our own renders, not by the lists.
