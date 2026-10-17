# REVIEW-001 — Owner review board (brief)

Owner: Ahmed. Approved 2026-10-17 as the one R46 freeze exception. Plan: `REVIEW-001-DEV-PLAN.json`.

## Problem
Delivery pages show only what someone hand-registered in `DELIVERY.json`. ANVIL campaign-01 page
shows 11 images; the ANVIL job folders hold ~680 media files; 8 of 15 ANVIL/VILL jobs have no page.
No approve button exists (static pages cannot write). Ahmed digs through folders.

## Build
1. `TSST/services/review/review.py` — Python stdlib only (`http.server`), binds `127.0.0.1` only,
   free port (default 8790). Root = `TSST/brands` resolved with `os.path.abspath` (it is a folder
   link to `G:/My Drive/TSST-Clients`; do not `resolve()`).
2. `REVIEW.bat` at repo root: starts the server and opens the browser. Double-click = done.
3. Page (one HTML served by the script, inline CSS/JS, dark, Arabic-first RTL with EN switch is
   NOT needed — Arabic UI labels, file names as-is):
   - Left: brands → jobs (every folder under `projects/` that has `brief.md`, `README.md`,
     `DELIVERY.json`, `work/` or `final/`; nested jobs allowed). Count of items waiting for decision.
   - Job view: all files under `work/` and `final/` (plus `brief.md`), newest first.
     Images (png/jpg/jpeg/webp/gif) as thumbnails with a click-to-enlarge view; video (mp4/webm/mov)
     with a player; `.md`/`.txt` rendered as readable text (`dir="auto"`, keep Arabic RTL);
     other files listed with name + open link.
   - Folders named `qa`, `_qa`, `observations`, `external`, `inputs`, `refs`, `parts`, `shots`,
     or holding more than 40 files: collapsed group, shown on click (lazy-load thumbnails).
   - "جديد" badge on files modified after the last time Ahmed opened that job (store last-seen
     per job in the browser's localStorage; never in the repo).
   - Each file: buttons موافق / مرفوض / تعليق, and its current decision shown.
   - Filter: الكل / مستني قرار / موافق / مرفوض.
4. Decision write: POST to the server → the job's `DELIVERY.json` gets
   `"review": {"<path relative to job>": {"status": "approved|rejected", "note": "...", "date": "YYYY-MM-DD", "by": "Ahmed"}}`.
   - Preserve everything else. Detect the file's existing indent (1 or 2) and write back with the
     same indent and `ensure_ascii=False`, trailing newline as before. Atomic write (temp + replace).
   - Job without `DELIVERY.json`: create a minimal one (`title` = folder name, `status` = "progress",
     `review` block) only when the first decision is saved.
   - Then run `python TSST/services/delivery/sync_jobs.py <brand>` and show its result line.
   - Reject any path outside `TSST/brands/<brand>/projects/<job>/`; no deletes, no moves, no other writes.
5. Do NOT change `build_delivery.py` client output in this round (client pages stay as they are).
6. Tests: `TSST/services/review/test_review.py` (unittest, temp tree): job discovery incl. nested,
   file classification, collapse rule, decision write keeps other keys + indent, minimal manifest
   creation, path-escape rejection. Existing 39 delivery tests must still pass.
7. Live check: start the server, open ANVIL campaign-01 and VILL kitchen-campaign-01 in a browser,
   confirm images/copy render; save one decision on a scratch copy only (never on real client
   records during testing).
8. One paragraph added to `TSST/services/delivery/README.md` pointing to the board.
   Result: `REVIEW-001-DEV-RESULT.md` (what was built, test output, limits).

## Round 2 (2026-10-17, owner: "عايز كل اللي عملناه")
Ahmed opened the board: most ANVIL work was missing, because it lives outside `projects/`.
All scattered ANVIL work is now copied into the brand folder (`archive/outside/*`, `approved/logo`,
`approved/visual-identity`, `photos/product-master`).
1. Each brand in the tree shows four sections, in this order: المشروعات (jobs, as now),
   المعتمد (`approved/`), الصور (`photos/`), الأرشيف (`archive/`).
2. Under المعتمد / الصور / الأرشيف, every first-level subfolder is one entry (for `archive/`, also
   second level under `archive/outside/` and `archive/pilot-001/`), opened with the same file view
   (thumbnails, video, text, collapse rule, newest first). Loose `.md` files at the section root
   are one entry named after the section.
3. These brand-level entries are view-only (no approve/reject, no write, not counted in pending).
4. Every folder under `projects/` is a job, even with only `project.md` (e.g. `switch-pilot`).
5. Lazy-load: never scan all brand sections on tree load; count files per entry cheaply
   (one `os.scandir` walk per entry, cached per server run, refreshed by the تحديث button).
6. Tests for: section discovery, view-only (POST on a non-job path refused), job with only project.md.

## Round 3 (2026-10-17, owner: menu and sub-menu look the same, "تايه منها")
Make the left tree read as clear levels. UI only (board.html, plus review.py only if a field is needed).
1. Level 1 brand: large bold row, accent bar on the side, pending badge; accordion — opening a
   brand closes the others; last open brand remembered (localStorage).
2. Level 2 section (المشروعات / المعتمد / الصور / الأرشيف): small muted header with an icon and
   a thin divider above, clearly a heading, not a row; المشروعات open by default, the rest closed.
3. Level 3 job / entry: indented row, normal size, hover + selected state, count on the side.
4. Archive: entries under `outside/` and `pilot-001/` grouped under their own level-3 sub-heading
   (collapsible), children at level 4 (more indent, smaller) with the prefix removed
   (show "identity-generations-2026-10-05", not "outside/identity-generations-2026-10-05").
5. Main area header: breadcrumb "ANVIL › المشروعات › campaign-01" and one line saying what this
   is ("مشروع — تقدر توافق أو ترفض" / "عرض فقط").
6. Empty state (nothing selected): 3 short Arabic lines on how to use the board.
7. Clean names: strip leading numbers like "01_" in pilot-001 sub-entries? NO — keep real folder
   names (they are paths); only remove the group prefix as in item 4.
Keep all behaviour, endpoints, safety and tests; add a test only if review.py changes.

## Round 4 (2026-10-17, owner: buttons slow; page "سحيل" — heavy, can't follow it)
1. Speed: موافق / مرفوض / تعليق must feel instant. Today save_decision waits for sync_jobs.py
   (rebuilds pages on Drive, seconds). Write the decision, reply at once, update the card in place
   (no full reload). Run sync in ONE background worker, debounced per brand (e.g. 3 s after the last
   click), never two at once; show a small status "بيتحدّث…" / "اتحدّث ✓" / error line at the top.
   Comment = small inline box on the card, not a prompt dialog.
2. Split the job view by type, as tabs at the top of the main area (with counts):
   الصور (images) · الفيديو · الكوبي (.md / .txt) · ملفات تانية.
   Default tab = الصور if any, else الكوبي. "ملفات تانية" (py, json, ttf, cjs, jsx, aep, csv…) has no
   decision buttons and is not counted in pending.
3. Images tab: clean grid, bigger thumbnails, name + date small under each, buttons small on hover
   (always visible on touch). Group by folder with a clear folder heading, newest group first.
4. Copy tab: one card per file showing title (first heading) + first 3 lines; click to open the full
   text in a reading view (wide, readable line length, dir=auto). Buttons on the card.
5. Less noise: hide `desktop.ini`, `.DS_Store`, thumbnails/cache files; status words short.
Keep endpoints, safety, tests passing; add tests for the debounced background sync (decision
returns before sync runs; two quick decisions → one sync).

## Round 5 (2026-10-17, owner: the الكوبي tab is full of our internal chat/process files, not copy)
Split text files (.md/.txt) into three tabs by file name (case-insensitive, on the base name) and folder:
1. الكوبي (decision buttons, counted as pending): name contains `copy`, `caption`, `script`,
   `beat_sheet`, `hashtag`, `bio`, or the file sits in a folder named `copy` / `captions` —
   EXCEPT names that also contain `review`, `qa`, `request`, `log`, `checkpoint`.
   (Real names: 03_COPY.md, COPY.md, COPY_REVEAL.md, COPY_DECK.md, CLIENT_COPY.md, CLIENT_COPY_AR.md,
   caption-v01.txt, BEAT_SHEET.md. Not copy: 03b_PILOT_COPY_REVIEW.md.)
2. الخطط (decision buttons, counted as pending): name contains `strategy`, `plan`, `calendar`,
   `measurement`, `creative_brief`, `shot_list`, `look_direction`, `scorecard`, `content_strategy`,
   and the job's own `brief.md` / `00_BRIEF.md` — with the same EXCEPT list.
3. ملاحظات الشغل (view only, NOT pending): everything else — README, project.md, scope, REPORT,
   RESULT, REVIEW, GATE_REVIEW, CHECKPOINT, DECISIONS, QA, LOG, REQUEST, HANDOVER, INDEX, RECIPE,
   RUN_ME, DIFF, transcripts, GEM-*, ANTIGRAVITY_*, source_ref.txt, …  (unknown → here).
Tab order: الصور · الفيديو · الكوبي · الخطط · ملاحظات الشغل · ملفات تانية. Hide a tab with 0 files.
Default tab: الصور, else الكوبي, else الخطط.
Card preview (copy + plans): skip metadata lines before the real text — lines starting with
`Agent`, `Team`, `Skills`, `State`, `Status`, `Date`, `Role`, `الحالة`, `التاريخ`, `الدور`, `>`, and
front matter. Existing decisions on files that move to ملاحظات الشغل stay saved but are not shown
as pending. Classification lives in review.py (one function) with unit tests on the real names above.

## Round 6 (2026-10-17) — formal, organised, fast review. Owner: "خليه فورمال، ظبط الحاجات البايظة، افصل المنشورات، حط كل حاجة في مكانها، عايز أراجع بسرعة"
Lead review findings (F1–F15) → required changes. Keep all endpoints' safety, tests green.

### A. Broken / wrong today
F1  Grouping uses every leaf folder → product-photo-bank shows ~100 groups of 1 image.
    → Group key = path up to TWO levels under `work/` (e.g. `work/external/round-02`); deeper
      sub-path shown small on the card. `final/` = one group.
F2  Titles fall back to slugs / English. → Job title = DELIVERY.json `ar.title` if present, else
    `title`, else first `#` heading of `brief.md`, else prettified slug; slug small under it.
    Brand name = `name:` from TSST/core/portfolio.yaml (fallback slug).
F3  Rejected/old work shows as pending. → Folders named `rejected`, `old`, `archive`, `superseded`,
    `unused`, `trash` (any level): files not reviewable, not pending, group shown LAST with label
    "قديم / مرفوض".
F4  QA screenshots fill the الصور tab (marketing-week-01: all 98 images are QA). → Image/video files
    under noise folders (`qa`, `_qa`, `observations`, `inspection_crops`, `contact_sheets`, `thumbs`,
    `_catalog`, `scripts`) go to ملاحظات الشغل (view only). `refs` stays in الصور, collapsed, last,
    view only, label "مراجع".
F5  Default tab = first tab (in tab order) with pending > 0; else first non-empty.
F6  `CLIENT_COPY*.md` are delivery-page source, not copy → ملاحظات الشغل.
F7  Each decision rewrites DELIVERY.json → job pages older than manifest → job_check FAIL c)
    (happens now on real ANVIL campaign-01). → Background worker: for each touched job that
    already has DELIVERY.html, run `build_delivery.py <job>` (both audiences) BEFORE
    `sync_jobs.py <brand>`. Jobs without pages: sync only. Same debounce, one worker.
F8  "جديد" on everything at first visit. → First visit: only files modified in the last 72 h;
    later visits: since last visit (localStorage).
F9  Layout breaks below ~900 px (main column squeezed to 70 px). → < 980 px: sidebar becomes a
    drawer opened by "☰ البراندات" in the header; main full width; grids reflow.

### B. Split posts (copy + plans)
F10 One card per post, not per file. For .md in الكوبي/الخطط:
    - Card = smallest heading section: `###` if the `##` has `###` children, else `##`.
      File with no `##` → one card.
    - Text before the first `##` (file intro) + any metadata lines → collapsed "تفاصيل داخلية"
      at the top of that file's block, never in a card.
    - Internal sections (title contains: policy, risk, bidi, qa, check, proof, why, pick, source,
      decision, next, page, about, items, texts_intro, options, gloss, internal, الإثبات, اختبار,
      مراجعة, ملاحظ, داخلي, مصادر, قرارات) → one collapsed "ملاحظات داخلية" box per file, no buttons.
    - Inside a card, bold-label paragraphs `**Label:**` whose label has a platform word
      (Facebook, Instagram, TikTok, LinkedIn, Stories, Story, X, Snapchat, كابشن, بطاقات, سيناريو)
      render as a small platform chip + its text; labels with internal words (ملاحظة داخلية,
      Gloss, internal, note, ملاحظة) → collapsed "ملاحظة" under the card.
    - Metadata lines anywhere (regex, case-insensitive): `Skills used`, `TSST-[A-Z]+-SK`,
      `NOT_?READY`, `\bDRAFT\b`, `PENDING`, `_AG\b`, `^(Agent|Team|Role|State|Status|Date)\s*:`,
      `^(الحالة|التاريخ|الدور)\s*:`, `Reuse map`, `^Source:` → moved into "تفاصيل داخلية".
    - Decision key per card = `<file path>#<anchor>`, anchor = heading text slug (keep Arabic
      letters, spaces → `-`, lowercase Latin) + `-2`, `-3` for repeats. Stored in the same
      `review` block. Old whole-file decisions stay shown on the file block header.
    - Card head: post title (heading text, numbering like "W1-M01 —" kept), platform chips row,
      then the text. Group header = file title ("خطة النصوص" etc.) with its card count.
    - Minimal safe markdown renderer in the page (escape everything; then bold, italic, lists,
      tables, blockquote, line breaks, hashtags as chips). No raw HTML.

### C. Formal look (match our delivery pages)
F11 Light theme with delivery tokens: bg `#F3F5FA`, cards `#FFFFFF`, borders `#D5D9E4`, text `#33394F`,
    muted `#585F7A`, header bar `#181D36` with white Systronic mark (`TSST/services/delivery/assets/
    mark_white_96.png`) + "لوحة المراجعة", thin red accent `#E7213A` under the header, link/active
    `#29BCEF`, موافق `#1F9D5B`, مرفوض `#E7213A`, مستني `#E8A917`. Fonts: IBM Plex Sans Arabic
    (Regular/Medium/SemiBold/Bold) + Poppins for Latin, served from `TSST/services/delivery/fonts/`
    through a whitelisted `/fonts/<file>` route (and `/assets/<file>` for the mark). All UI text Arabic.
    Calm spacing, radius 10, soft shadow; no emoji icons — simple inline SVG or none.

### D. Fast review
F12 Lightbox = review mode: big image/video, counter "12 / 48", ←/→ (and swipe) to move,
    A = موافق, R = مرفوض, C = تعليق, Esc = close; after a decision auto-advance to the next
    pending item in the same tab. Same keys in the copy reading view (moves between post cards).
F13 Group header buttons: "موافق على الكل" / "رفض الكل" for that group's pending items, inline
    confirm "متأكد؟ (N)". One POST per item is fine; worker debounce covers sync.
F14 Thumbnails: if Pillow imports, `/thumb?…&w=480` returns a cached JPEG; cache in
    `%LOCALAPPDATA%\tsst-review\thumbs` keyed by sha1(abs path + mtime + size + w). NEVER write
    inside client folders. Without Pillow → original file. Videos `preload="metadata"`.
F15 REVIEW.bat: console title "لوحة المراجعة — سيب الشباك ده مفتوح"; prints that line in Arabic
    (chcp 65001); if the board already runs, just open the browser.

Tests to add: section split on real-shaped samples (03_COPY.md shape with `##` + `**Facebook — …:**`;
COPY_REVEAL shape with `##`/`###` + Policy/Bidi sections), anchors stable + unique, metadata moved,
group depth 2, rejected-folder rule, QA images → notes, CLIENT_COPY → notes, default-tab rule input,
thumb cache outside root + fallback, fonts route whitelist + traversal refused, worker runs
build_delivery only for jobs with DELIVERY.html then sync (stubbed). Existing tests keep passing.
