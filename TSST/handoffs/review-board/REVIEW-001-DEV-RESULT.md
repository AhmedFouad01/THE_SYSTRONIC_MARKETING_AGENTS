# REVIEW-001 - DEV result

Agent: tsst-dev (build). Skills: TSST-DEV-SK-004, SK-011, SK-015. Not committed (Lead commits).

## Built
- `TSST/services/review/review.py` - stdlib server, 127.0.0.1 only, port 8790 (next free up to +19; reuses a board already running). `--open`, `--port`, `--root` (scratch only).
- `TSST/services/review/board.html` - the page (dark, RTL Arabic labels, inline CSS/JS).
- `TSST/services/review/test_review.py` - 19 tests (temp trees).
- `REVIEW.bat` (repo root) - starts the server and opens the browser.
- One paragraph in `TSST/services/delivery/README.md`.

## Behaviour
- Brands = folders under `TSST/brands` with `projects/` (names starting `_` skipped). Jobs = every folder under `projects/` with `brief.md`, `README.md`, `DELIVERY.json`, `work/` or `final/`; nested allowed; `work/`, `final/` and noise folders are not searched for jobs.
- Files: everything under `work/` and `final/` plus `brief.md` / `00_BRIEF.md`; newest first; hidden files and Thumbs.db skipped. Images: lazy thumbnails + lightbox (arrow keys). Video: player (HTTP Range works). `.md`/`.txt`: text box, `dir=auto`, first 20,000 chars. Others: name, size, open link.
- Collapsed group = a directory whose path holds `qa, _qa, observations, external, inputs, refs, parts, shots`, or with more than 40 files directly inside. Elements are created only on click.
- "جديد" = modified after the last open of that job (browser localStorage, never the repo). First open of a job: everything counts as new.
- Pending (the sidebar count and "مستني قرار" filter) = image/video/text files that are not in a noise-named folder, not the brief, with no approved/rejected decision.
- Decision: POST `/api/decision` -> `<job>/DELIVERY.json` `"review"[<path rel. to job>] = {status, note, date, by:"Ahmed"}`. Other keys, key order, indent (spaces/tab), CRLF and trailing-newline state preserved; `ensure_ascii=False`; temp file + `os.replace`. Missing manifest: minimal `{title, status:"progress", review}` created on first decision. Then `sync_jobs.py <brand>` runs; its last line is shown in the page.
- Safety: job/file paths validated segment by segment (no `..`, `.`-names, drive letters, backslashes), then `os.path.abspath` containment and a realpath check; only `work/`, `final/` and the brief are readable/decidable. Host header must be loopback, POST needs JSON content-type and a loopback Origin. HTML/SVG files are served with `sandbox`. Writes: only the job's DELIVERY.json (plus its short-lived temp file).
- `build_delivery.py` untouched; it ignores `review` (a scratch job with a `review` block built clean, leak scan clean).

## Extensions beyond the brief (small)
- Comment-only save keeps the current status (or writes `"pending"` if none). Status `"pending"` is also accepted so a decision can be reset.
- `00_BRIEF.md` shown like `brief.md`; board reuses an already running instance.

## Evidence
- `python -m unittest discover -s TSST/services/review -p "test_*.py"` -> Ran 19, OK.
- `python -m unittest discover -s TSST/services/delivery -p "test_*.py"` -> Ran 39, OK.
- Live (real client root, GET only): 6 brands (akyro-studio, t-sag, yakebda-ms have no jobs), anvil 4 jobs, vill-studio 10 jobs. anvil/campaign-01: 105-106 files (84 images, 4 video, 10 text, 8 other), 4 collapsed groups (qa/delivery 32, refs x3). vill-studio/kitchen-campaign-01: 81 files (54 images, 6 text, 21 other), 1 collapsed group (inputs 10). Real PNG served (1.99 MB). Headless browser: 0 JS errors, images/copy render.
- Decision test on a scratch copy only: approve + Arabic comment on a copied kitchen DELIVERY.json -> diff vs original = only the added `review` block (same 2-space indent, no trailing newline kept); job without manifest -> minimal manifest created. Real files unchanged (md5 equal).
- `sync_jobs.py` run on an isolated scratch repo copy with the decided manifest: exit 0, `wrote TSST/brands/vill-studio/JOBS.md (1 jobs)`. Not run on the real brands (it would rewrite JOBS.md, status.md, portfolio.yaml, outside the write scope).

## Known limits
- Real-root sync path (`run_sync`, subprocess on the real repo) was exercised only via stub in unit tests and via the isolated copy above, never on real records.
- A job created by the board (no manifest before) may fail `status_sync` if its brand has no project.md/status.md pointer; the page shows the sync line, the decision is already saved.
- No delete/undo besides setting status back to `pending`. Entries for files later removed stay in `review`.
- Tree scan reads every job on each refresh (about 0.9 s on the live tree); fine for now, would need caching at several thousand files.
- Large images load full size (no thumbnail cache). Video seeking relies on the browser's Range support (implemented).
- Windows + Google Drive: `os.replace` retries on PermissionError; the temp file may briefly sync to Drive.
- Not covered by tests: the browser UI (checked headless by hand only).

skill_friction: none

## Round 2 (2026-10-17) - brand sections, project-only jobs, lazy counts

Skills: TSST-DEV-SK-004 (increments: discovery -> API -> page -> tests -> live check), TSST-DEV-SK-011 (tests first for each rule), TSST-DEV-SK-015 (fresh runs below).

Changes (all in `TSST/services/review/`: `review.py`, `board.html`, `test_review.py`):
- Tree: every brand shows four sections in order: المشروعات, المعتمد (`approved/`), الصور (`photos/`), الأرشيف (`archive/`). A brand is listed if it has `projects/` or any of the three folders.
- Entries: each first-level subfolder = one entry (recursive file view). `archive/outside/*` and `archive/pilot-001/*` are entries one level deeper. Loose files at a section root = one entry named after the section (`approved`, `archive`); loose files directly in `archive/outside` or `archive/pilot-001` = one entry named after that folder (non-recursive). Loose files of any type are listed (not only `.md`), e.g. `approved/ASSETS.yaml`.
- Same file view as jobs (thumbnails, lightbox, video, text `dir=auto`, collapse rule, newest first, "جديد" badge). View-only: no buttons, no status line, no filters, label "عرض فقط", not in pending counts.
- Jobs: every first-level folder under `projects/` is a job (even empty); deeper folders still need a marker; `project.md` is now a marker and shown like `brief.md` (so `switch-pilot` shows its project.md).
- Lazy: `/api/tree` only lists entries (no file counted or stat-ed for sections). Counts come from `/api/counts?brand&section` when a section is opened in the page (one `os.scandir` walk per entry, no stat), cached in memory per server run; the تحديث button calls `/api/tree?refresh=1` which clears the cache.
- New read endpoints: `/api/entry`, `/api/counts`, and `entry=` on `/file` and `/api/text`. Path rules: segment check, abspath containment under the section, realpath check, shallow entries accept one segment only.
- Write surface unchanged: `/api/decision` refuses any payload with `entry`/`section` (403 view-only); a `job` that is not under `projects/` is 404/400.
- Changed behaviour in an old test: `empty-folder` is now a job (brief item 4).

Evidence (fresh):
- `python -B -m unittest discover -s TSST/services/review -p "test_*.py"` -> Ran 29, OK (19 old + 10 new: section discovery/order, lazy counts + cache + refresh, entry view recursive/shallow, collapse in entries, path-escape on entries, POST on entry/non-job path refused (unit + HTTP, nothing written, sync not called), project.md-only job, nested project.md marker, section-only brand).
- `python -B -m unittest discover -s TSST/services/delivery -p "test_*.py"` -> Ran 39, OK.
- Live (real root, GET only, port 8791, server stopped after): tree load 0.67 s / 0.80 s (5 brands, 16 jobs, 0 section files scanned). ANVIL: jobs campaign-01 121 files, marketing-week-01 110, product-photo-bank 829, rollup-pre-hell 60, switch-pilot 1 (project.md). Headless Chromium: 0 JS errors; approved/logo 8/8 images, real-memory-video 4 players, product-master thumbnails, chatgpt-continuation text renders, no action buttons on entries, refresh keeps 49 entries.
- No real client file written (md5/mtime not touched; no POST sent to the live server).

Limits:
- Section counts are file counts incl. non-media (fonts, yaml); they are cached until تحديث, so files added meanwhile show the old number.
- Entry view lists every file (cap 20,000, flagged in the page); `photos/bank` has 131 sub-folders -> 131 groups (one collapsible group per folder), not merged.
- Job tree load still reads every job (0.7-0.8 s now).
- `TSST/services/delivery/README.md` paragraph not updated for Round 2 (outside the write scope given).

skill_friction: none

## Round 3 (2026-10-17) - menu hierarchy (UI only: `TSST/services/review/board.html`; review.py untouched)

Changes (items 1-6 of the brief; item 7 respected - real folder names kept):
- Level 1 brand: large bold uppercase row (18px), panel card with a thick side accent bar (blue when open, grey when closed), pending badge. Accordion: opening a brand closes the others; last open brand kept in `localStorage` (`rb:openbrand`, browser only; first load defaults to the first brand; clicking the open brand closes all).
- Level 2 section (المشروعات / المعتمد / الصور / الأرشيف): small muted heading, icon, thin divider above, no hover background (reads as a heading). المشروعات open by default, the rest closed (counts load lazily, only for the open brand).
- Level 3 job / entry: indented row, 14.5px, hover and selected state (tinted background + accent bar), count at the side.
- Archive: `outside/` and `pilot-001/` are level-3 collapsible sub-headings (derived from entry keys, no API change; their own loose files appear as "(ملفات مباشرة)"); children are level 4 (own guide line, more indent, 12.5px, dimmer) with the group prefix removed. The group holding the open entry stays open.
- Main header: breadcrumb "ANVIL › المشروعات › campaign-01" (entries: brand › section › path), title (entries show the last folder name), and one line: "مشروع - تقدر توافق أو ترفض" / "عرض فقط - للاطلاع، مفيش موافقة أو رفض هنا".
- Empty state: 3 short Arabic lines on how to use the board.
- Brand names are shown upper-case by CSS only (`title`/paths keep the real folder name).

Evidence (fresh):
- `python -B TSST/services/review/test_review.py` -> Ran 29, OK. `python -B -m unittest discover -s TSST/services/delivery -p "test*.py"` -> Ran 39, OK.
- Live (port 8795, headless Chromium, read-only GET, server stopped after): 0 JS errors. Screenshots in `C:\Users\10\AppData\Local\Temp\claude\review-r3\`: `1-empty.png`, `2-anvil-projects.png`, `3-anvil-archive-outside.png`.

Limits: no new test (no review.py change; the tree logic is in page JS and was checked by screenshot only). Level-4 names wrap instead of truncating. `delivery/README.md` still not updated for Round 2/3 (outside write scope).

## Round 4 (2026-10-17) - speed + job view split by type (`TSST/services/review/`)

Changes:
- Speed: `POST /api/decision` now only writes `DELIVERY.json` (atomic) and returns. `sync_jobs.py` runs in ONE background worker (`SyncWorker`): debounced per brand (3 s after the last click, never later than 30 s after the first unsynced one), never two at once, a decision during a running sync queues exactly one more run. A failed/crashed sync is kept in `/api/sync` (`last[brand]`) and shown red at the top; the worker survives it. `--sync-delay` flag. The page updates optimistically, replaces only the clicked card (no reload, no tree re-read; left counts computed locally), undoes it if the server refuses, and shows "بيتحدّث…" / "اتحدّث ✓" / error in the header.
- Comment = small inline box on the card (Ctrl+Enter saves), no dialog.
- Job/entry view split into sticky tabs with counts: الصور · الفيديو · الكوبي (.md/.txt) · ملفات تانية. Default = الصور if any, else الكوبي. "ملفات تانية" = plain list (name, type, size, date, open link), no buttons, never pending.
- Images: square grid (min 230 px), name + date + size small under each, small buttons on hover (always visible on touch), status mark on the tile, folder groups with a clear folder heading (parent dim, last segment bold), newest group first, collapse rule kept, 60 cards per folder then "عرض كمان".
- Copy: one card per file = first heading + 3 lines (loaded lazily via `/api/text?limit=900`), buttons on the card; click opens a wide reading view (760 px, 17 px, `dir=auto`) with موافق/مرفوض and Esc to close.
- Noise: `desktop.ini`, `.DS_Store`, `Thumbs.db`, `ehthumbs*.db`, `~$*`, `*.tmp/.pyc`, and folders `cache`, `thumbnails`, `__thumbs__`, `node_modules`, `__pycache__` are never listed or counted. Status words shortened (مستني / موافق / مرفوض).

Measured (scratch copy of ANVIL, 121 files in campaign-01, real `sync_jobs.py` in a scratch repo layout, 6 decisions in a row):
- Before: decision POST 0.997-1.028 s each (median 1.00 s), 6 syncs for 6 decisions. This is the local warm sync; on Google Drive the sync is slower, so the owner's wait was longer.
- After: POST 0.007-0.018 s each (median 0.018 s), 1 background sync for the 6 decisions (finished ~4 s after the last click = 3 s debounce + 1 s run).
- Browser (headless, decision POST stubbed locally): click -> card shows approved in 22-43 ms.

Tests (fresh): `python -B -m unittest discover -s TSST/services/review -p "test_*.py"` -> Ran 38, OK (was 29; +9: debounce/burst/overlap/crash/starvation of the worker, POST returns before sync + two quick decisions = one sync over HTTP, noise files/dirs, other kinds never reviewable/pending, text preview limit). Delivery: `python -B -m unittest discover -s TSST/services/delivery -p "test_*.py"` -> Ran 39, OK.

Live: second server on port 8791 (real root, GET only; every decision POST was stubbed in the browser; server stopped after), 0 JS errors. Screenshots `C:\Users\10\AppData\Local\Temp\claude\review-r4\`: `1-images.png`, `1b-images-hover.png`, `1c-images-approved.png`, `2-video.png`, `3-copy.png`, `4-other.png`, `5-reading.png`. ANVIL campaign-01 tabs: images 94, video 4, copy 12, other 11.

Limits:
- A server started before this round (e.g. port 8790) still runs the old code in memory: restart it to get the background sync and `/api/sync`; with the new page on the old server decisions still work but stay slow and the sync line shows "تعذر قراءة حالة التحديث".
- Thumbnails are still the original files (stdlib only, no resizing): lazy loading + 60-per-folder paging keeps the page light, but very large PNGs still download in full. Server-side thumbnails would need Pillow (not stdlib).
- The sync waits 3 s after the last click; JOBS.md/pages on Drive are therefore up to ~3 s + sync time behind the decision (the decision itself is already in `DELIVERY.json`). If the board is closed in that window the sync still runs while the server lives.
- Page JS (tabs, reading view, optimistic update) was verified by headless screenshots and one timed click, not by automated browser tests. Measured on local disk, not on Drive.
- `delivery/README.md` not touched (outside write scope).

skill_friction: none

## Round 5 (2026-10-17) - copy / plans / work-notes tabs
- review.py: new `tab_of(name, folder, job_brief)` = the one classification function (image|video|copy|plan|notes|other); every file now carries `tab`. `kind` unchanged. Keywords match the base name from the start of a word (so `description` is not `script`, `explanation` is not `plan`; `qa`/`log`/`bio` need whole words). EXCEPT list (review, request, checkpoint, qa, log) wins over copy, plan and the copy/captions folder rule. Job-root `brief.md`/`00_BRIEF.md` = plan; `project.md` = notes; unknown text = notes.
- `reviewable` = tab in image/video/copy/plan (and not a noise folder). Notes have no buttons and are not pending; old decisions on them stay in DELIVERY.json, but are not counted (pending/approved/rejected). Job-root brief is now a pending plan (was non-reviewable).
- board.html: tabs الصور / الفيديو / الكوبي / الخطط / ملاحظات الشغل / ملفات تانية; empty tabs hidden; default tab image > copy > plan > video > notes > other; notes tab has no filter bar and no decision UI; preview skips Agent/Team/Skills/State/Status/Date/Role/الحالة/التاريخ/الدور lines, `>` lines, front matter and table separator rows. Also applies to view-only entries (no decisions there).
- test_review.py: new class TextTabs (10 tests, real names: 03_COPY.md, COPY.md, COPY_REVEAL.md, COPY_DECK.md, CLIENT_COPY(.AR).md, caption-v01.txt, BEAT_SHEET.md; 03b_PILOT_COPY_REVIEW.md is notes); one existing summary test switched from brief.md to project.md (brief is now a pending plan by design). Tests were added after the code (no RED step).
- Verification: review 48 tests OK; delivery 39 tests OK. Live GET-only check on port 8791 (stopped after) against the real root.
- ANVIL campaign-01: copy = work/creatine-01/caption-v01.txt, work/copy/CLIENT_COPY.md, CLIENT_COPY_AR.md, COPY_REVEAL.md; plan = brief.md; notes = QA-v01.md, REVEAL_V2_PACK.md, work/README.md, text_scenes/build_log.txt, final/REPORT.md, MOTION_PREVIS_ADDENDUM.md, FINAL-QA.md.
- ANVIL marketing-week-01: copy = work/03_COPY.md; plan = 05_MEASUREMENT, 02_PLAN, 01b_CONTENT_STRATEGY, 01_STRATEGY, brief.md; notes = README, 08_LEAD_CHECKPOINT, 07_DECISIONS, 05b_SPARK_REVIEW, 03b_PILOT_COPY_REVIEW; other = 06_SCORECARD.csv (not text).
- Limit: the Lead's server on 8790 serves the old board.html/review.py until restarted.

## Round 6 (2026-10-17) - formal, organised, fast review (F1-F15)
Files: `TSST/services/review/review.py`, `board.html` (rewritten), `test_review.py`, `REVIEW.bat`.
- F1 group key = work + 2 levels (`group_key`), `final/` = one group, deeper sub-path shown small on the card (`sub`). product-photo-bank images: 1 group (was ~100).
- F2 titles: `ar.title` > `title` > first `#` of brief.md > prettified slug (slug shown small); brand name from portfolio.yaml `name:` (line parser, fallback slug).
- F3 zones: folders rejected/old/archive/superseded/unused/trash -> not reviewable, not pending, group last "قديم / مرفوض".
- F4 QA/observations/inspection_crops/contact_sheets/thumbs/_catalog/scripts media -> ملاحظات الشغل (view only); refs/inputs/parts/shots stay in الصور, collapsed, last, view only, "مراجع". `external` is no longer a noise folder (needed for the photo bank groups).
- F5 default tab = first tab with pending, else first non-empty (`default_tab`, also returned as `default_tab` by /api/job).
- F6 `CLIENT_COPY*` -> ملاحظات الشغل (existing Round 5 test list updated for this).
- F7 worker: `schedule(brand, job)`; per run: `run_build` (build_delivery.py <job>, both audiences) for each touched job that has DELIVERY.html, then `sync_jobs.py`. Failed build is shown red and the sync still runs.
- F8 first visit: "جديد" = last 72 h only; later = since last visit (localStorage).
- F9 < 980 px: sidebar = drawer ("البراندات" button), main full width, grids reflow.
- F10 posts: `parse_doc` (server) -> one card per `###`/`##`, intro + metadata lines -> "تفاصيل داخلية", internal sections -> one "ملاحظات داخلية" box, platform labels -> chips, internal labels -> "ملاحظة" fold, decision key `<file>#<anchor>` (Arabic slug, -2/-3 repeats; validated on save: unknown anchor = 404). No-## file or .txt = one card keyed by the file path. Whole-file legacy decisions still returned and shown on the file header; cards without their own decision inherit an approved/rejected file decision (so the 24 saved decisions are not reset to pending). Markdown renderer builds DOM nodes only (no raw HTML); hashtags = chips.
- F11 light theme with delivery tokens, navy header + Systronic mark + red line, IBM Plex Sans Arabic + Poppins via whitelisted `/fonts/<file>.ttf` and `/assets/{mark_white_96,favicon_64}.png`, no emoji. Link text uses darker cyan #0B7FAA (contrast); #29BCEF is used for active bars/borders.
- F12 review overlay (images, video, post cards): counter, arrows (RTL: left = next), swipe, A/R/C (by key code, works on the Arabic layout), Esc, auto-advance to the next pending item in the same tab (wraps; toast when none).
- F13 group / file-block header: "موافق على الكل (N)" / "رفض الكل" with inline "متأكد؟ (N)"; sent as ONE batch POST (`paths`, one DELIVERY.json write; max 500).
- F14 `/thumb?...&w=480` JPEG cache in `%LOCALAPPDATA%\tsst-review\thumbs` (env TSST_REVIEW_CACHE for tests), key sha1(path+mtime+size+w); refused if the cache dir is inside the client root; no Pillow / gif / small image / any error -> original; video preload=metadata.
- F15 REVIEW.bat: chcp 65001, Arabic title + line; `review.py --open` already just opens the browser if the board runs.
Fix found by the live check: `inside()` raised on different drives (G: vs C:) -> now False (thumb route 500s).
Tests: `python -B TSST/services/review/test_review.py` -> Ran 73, OK (was 48; +25 incl. HTTP class re-run). Delivery: Ran 39, OK.
Live: GET-only on the real root (8801) + scratch copy of ANVIL campaign-01/marketing-week-01 (8802); both stopped. Screenshots: `C:\Users\10\AppData\Local\Temp\claude\review-r6\`.
Limits: JS verified by headless Chromium only; Lead's 8790/8792 servers still run old code until restarted; delivery/README.md not updated (outside scope).
