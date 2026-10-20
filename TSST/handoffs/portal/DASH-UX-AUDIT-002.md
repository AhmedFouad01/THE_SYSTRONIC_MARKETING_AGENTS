# DASH-UX-AUDIT-002 — strict UX/UI audit of the Dash as it is now (read-only)

Build: `C:\Work\tsst-portal\web` main (c389969ad), run in MOCK mode at 390 / 1536 / 1920, light + dark (all captured; 16 PNG kept in `ux-audit-002/`).
Real Dash logos (DASH1 for light, DASH2 for dark) were rendered to PNG and downsized to 512 px wide, as the server does.
Skills used: TSST-CREATIVE-SK-030 (heuristic audit, severity), SK-020 (IA / dead ends), SK-011 (post frames), SK-028 (responsive), SK-021 (shell/navigation).
Severity: P1 broken/confusing · P2 clearly wrong · P3 polish.
Evidence limit: mock has no identity-type job, so item 3 is proven from code (posts.ts), not from a screenshot. 1920 captured, not kept as PNG (same layout as 1536, only wider empty space).

## Top 10 fixes (in order)
1. Posts rule: a post exists only when a folder has media AND a copy file with a platform label. No copy = no post (Identity job → 0 posts, files stay in the Images tab).
2. Rebuild PostFrame as a real platform post (IG / FB / LinkedIn spec in B). Carousel dots go inside the media.
3. Drawer logo: fill the drawer width (232 px), "by The Systronic" under it.
4. Drawer tools: icon colour is wrong on navy in light mode (moon invisible). Own colour token for sidebar controls.
5. Logo upload accepts only PNG/JPEG/WebP; Ahmed's SVGs are rejected. Server shrinks to 512×512 max. Accept SVG (sanitised) or tell him to export a wide PNG ≥1600 px; raise the 512 cap for wide logos.
6. Job page order: tabs first (Overview | Posts | Deliverables | Log); Posts get their own tab, not a block above the tabs.
7. Client job page repeats everything: posts, then the same images again as "Deliverables", and a floating "Job details" card. Show posts; list only non-post files.
8. Client numbers contradict: header "0 to review / 100% reviewed 9 of 9" while posts say "Pending review"; client Home says "0 of 9 reviewed" for the same job. One counter source.
9. Page grids waste the width: Jobs, Clients, Review use 2 columns at 1536 with an empty right third; Home packages leave a dead area. One responsive grid: auto-fill, min 300 px.
10. Remove the second search (top bar "Search jobs" + the page's own search), and teach the Drive convention in the UI (B3).

## A. Drawer / shell
| # | Sev | Problem (root cause) | Fix | Done when |
|---|---|---|---|---|
| A1 | P1 | Logo tiny. `system.css` `.workspace-logo` / `.sidebar__logo` = 120×32 px box; contain-fit makes a 1105×75 wordmark ≈120×8 px. (screenshot home-1536-light) | `.sidebar__logo { width:100%; height:auto; aspect-ratio:auto }`, `img{width:100%;height:auto}`. Drawer padding 24 px → logo 216 px wide. "by The Systronic" 12 px muted under it, 8 px gap. Top bar (mobile) logo: max-height 20 px, width auto. | Logo ≥ 200 px wide at 1536; no blur at 2×. |
| A2 | P1 | Dark-mode toggle invisible in light. `.sy-icon-button.button { color: var(--sy-text) !important }` is dark navy; drawer is navy in both themes. Same bug hits the search icon and the avatar ring. | `.sidebar .sy-icon-button.button { color: var(--ref-white-100) !important }` + hover fill white 12%. Rule: controls inside the drawer never use page text tokens. | Moon/sun visible in both themes (contrast ≥4.5). |
| A3 | P1 | Logo files: SVG rejected by `LogoPicker` (png/jpeg/webp only) and by `normalizeLogo`; server resizes to 512×512 `fit:inside`, so a wide logo is 512×35 (blurry on retina at 232 px). | Accept SVG (strip scripts server-side) or allow width up to 1600 for wide logos. Show the hint "wide logos work best". | Upload DASH1/DASH2 works, sharp at 2×. |
| A4 | P2 | Theme toggle and search exist twice (drawer + top bar); the top bar is a half-empty band with one search box on every page. | Desktop: no top bar. Search lives in the drawer (or ⌘K). Mobile keeps one top bar. | One search, one theme toggle per viewport. |
| A5 | P2 | Search says "Search jobs" on every page, and Jobs adds its own "Search jobs" below. | Global search only on the drawer; Jobs keeps its filter. Placeholder "Search jobs, clients". | |
| A6 | P2 | Mobile (390): bottom bar has 6 items, Settings is owner-only but takes a slot; header row of job page crams chip + Edit + Archive. | Bottom bar max 5 (Home, Jobs, Review, Clients, More). Edit/Archive → ⋯ menu below 640. | |
| A7 | P3 | Active nav has a plain raised fill only (OK, R53). Footer line is correct (one). | none | |

## B. Posts

### B1 Rule: when is something a post?
A post = ONE folder inside the job that has (1) at least one image or video AND (2) one copy file with a platform label (Instagram / Facebook / LinkedIn).
- No copy file → not a post. Its files appear in Images / Video tabs only. (Today `buildPosts` creates a post for every folder with media on the team side; `requireCopy` is only set on the client side. File: `src/service/dash/posts.ts`, call `jobs.ts:444`.)
- Job type matters: type `identity` (and `plan`) never builds posts. Only `content` and `campaign` do.
- Files in the job root with no sub-folder: never a post. Folders named `ref`, `qa`, `old`, `final-files` stay excluded (zone rule exists).
- One folder = one post. 2+ images = carousel (max 10). One video = video post.
- Fix `buildPosts(items, title, { requireCopy: true })` for both sides, plus `type` gate. Done when: ANVIL Identity (13 images, no copy) shows 0 posts and the Posts tab is hidden.

### B2 Frame spec (generic, no Meta/LinkedIn logos; DS tokens; width 100% of card, card max 420 px at ≥768, full width at 390)
Common: card = `--sy-surface`, radius `--r-panel`, no border, shadow `--sy-shadow-panel`. Text `--sy-text`, muted `--sy-text-3`. Dark: surface `--ref-dk-1`. Status chip sits OUTSIDE the frame (above the card, with the platform tab), so the frame looks like the real post.

**Instagram**
- Header 56 px: padding 12 px; avatar 32 px round (client logo or initial); handle (bold 14 px) ; right ⋯ icon 20 px.
- Media: 1:1 square, `object-fit: cover`; 4:5 allowed when all images are 4:5 (max height = width × 1.25). Background `--sy-surface-sunk`, never letterboxed grey for square images.
- Carousel: dots + counter INSIDE the media: counter pill "2/5" top-right (12 px, black 60% bg, white text, radius 12), dots centred 8 px from bottom (6 px dots, 4 px gap; active white, others white 50%). Swipe on touch; arrows 32 px circles appear on hover/desktop only, vertically centred, at the edges.
- Action row 44 px, padding 12: heart, comment, share on the left (24 px icons, 16 px gap), save on the right. Icons only, no numbers, not clickable (decorative, `aria-hidden`).
- Caption: 14 px / 20 px, handle bold then text, 3 lines then "more". Padding 0 12 12.

**Facebook**
- Header 56 px: avatar 40 px round, page name bold 15 px, line 2 "Sponsored/Just now" replaced by the date (muted 13 px), ⋯ right.
- Text ABOVE media: 15 px / 20 px, padding 4 12 12, 4 lines then "See more".
- Media: full bleed, 1.91:1 for single link-style, 1:1 or 4:5 for photos; carousel uses the same inside-counter as IG.
- Reaction bar 40 px: divider line removed (R53 no borders), three icon+label items Like / Comment / Share, evenly spaced, muted, non-interactive.

**LinkedIn**
- Header 64 px: avatar 48 px (square radius 4 for company), name bold 14 px, line 2 industry/followers-free text "Sample Client A · Supplement store" (muted 12 px), line 3 date; ⋯ right.
- Text above media: 14 px / 20 px, 3 lines then "…more", padding 0 16 8.
- Media: 1.91:1 or 1:1, full bleed; carousel inside-counter as IG (LinkedIn documents are rare, treat as carousel).
- Reaction bar 48 px: Like, Comment, Repost, Send (icons + labels), muted.

Platform switch: segmented control above the card (IG | FB | LI), labels full words, not "FB/IG". Only platforms found in `caption.md` appear. `PostPlatform` and `platformsOfLabel` need `linkedin` (today only facebook/instagram; mock shows a LinkedIn caption that never becomes a post).
Video: play overlay centred 56 px circle, mute button bottom-left inside media. Arabic: header and actions mirror (RTL), media does not.
Review actions (Approve / Request edit) sit under the card, outside the frame. Developer note: replace `MediaCarousel` dots row (`media-carousel__nav`) with the overlay above; `post-frame__platform` moves out of the card.

### B3 Drive convention (simplest)
```
projects/<job>/<post-name>/
    01.jpg 02.jpg ...        (several = carousel)  or  video.mp4
    caption.md
```
`caption.md`:
```
**Instagram:** caption text
**Facebook:** caption text
**LinkedIn:** caption text
```
Same text for all platforms: one `**All:**` block. Folder with images and no caption.md = just files (not a post). Classic jobs (final/, captions.md#key cards) keep working: they still show in the Images / Copy tabs; they become posts only if they follow the folder rule.
How the Dash teaches it:
- Create job modal, step 2 (folder picker): one line under the tree: "Posts are folders with images + caption.md" with "See example".
- Posts tab empty state: small diagram of the folder tree above and a "Copy folder template" button; text "No posts yet. Add a folder with pictures and a caption.md."
- Identity/Brand jobs: Posts tab hidden; Images tab says "Brand files, not posts".
- Sample: the mock `@social-launch` becomes the in-app "Example job".

## C. Every screen (1536 view unless stated; 390 notes where different)
**Login / Invite / PIN gate (390–1920):** centred card, OK. P2 login shows the tiny logo: use the A1 logo at 240 px. P3 PIN page could not be opened from a fake token in mock (inactive state); verify with a real link in a live-like test.

**Home (team)** P1 KPI tiles are 165 px high for one number and a caption: make 96 px. P1 "Client packages" cards 420 px with the right 330 px empty, then "Upcoming milestones" 780 px, "Waiting for review" 420 px tall column: grid not aligned (two different column systems). Fix: 12-col grid; row 1 = Packages (8) + Waiting for review (4); row 2 = Milestones (12). P2 "Overdue" on every package with demo data: make it a row, not a chip with a dot; P2 milestone map has 4 points on a 30-day rail, most of the width is empty; list the next 5 as rows with dates instead. P2 chart axis labels are saturated brand blue (low contrast on light). First thing the owner needs: what needs my decision today. Move "Waiting for review" to the top-left, KPIs under it.

**Jobs** P2 two columns at 1536, right third empty; auto-fill min 320. P2 double search. P2 filter selects look like plain text (no chevron contrast); P3 "4 jobs - 2 clients" uses a hyphen. Best display: table/list toggle (owner scans 30+ jobs); cards show client first, then status, then a single next action ("3 to review").

**Job (team)** P1 Posts block above the tabs; tabs are hidden below the fold (screenshot job-social-1536-light). Fix: header, then tabs Overview | Posts | Deliverables | Log. P1 identity jobs: see B1. P2 video post shows a blank blue box (no poster); use the poster frame / first frame. P2 posts frames use letterboxed grey bands. P2 Archive (red) next to Edit job: destructive action should be in a ⋯ menu with a confirm. P2 milestones form is always open inside the overview; collapse it behind "Add milestone". P2 390: tab list clips "Decisions log" (use scroll fade or 3 tabs). P3 "0 pending review" shown for a job with 9 approved: say "All approved".
Edit job modal: keep fields grouped (Title, Client description, Dates, Platforms); not captured separately; no overflow found at 390.
"Edit for client" (ClientItemEditor): OK in layout; P3 explain that edits change only what the client sees.
Preview (lightbox): not captured; no horizontal overflow found.

**Create job modal** P1 no explanation of the post folder convention (B3). P2 taken folders are disabled with no reason on hover (text shows only after click). Otherwise good (breadcrumb, 409/404 messages tested earlier).

**Review** P1 cards use 2 of 3 columns; buttons right-aligned in a card with the Preview link left-aligned underneath (copy cards): put Preview inside the media/caption, actions right. P2 text cards have a 100 px blank gap above the buttons (equal-height rows). P2 cards do not tell which post an item belongs to: show "Post: post-01". P3 keyboard hint line is useful but sits like body copy; make it a "?" tooltip. "0 reviewed in this session" top right is noise.

**Reports** (captured, not individually viewed beyond overflow check): no overflow, small controls (<32 px) 8 on the page, mainly chart download/CSV buttons. P3 raise to 32 px.

**Clients** P1 only two small cards on a page 1000 px tall; no client logo / header colour though Settings defines them. Show the logo tile + brand colour strip, packages usage, pending count. P3 "1 active jobs" plural bug (use plural rules).
**Client detail** P2 payments table shows "Overdue" twice with demo data; unpaid has no chip (inconsistent). P2 Jobs list has no status colour differentiation beyond chip; progress bars thick. Best first view: what is pending from this client (their review items), then package, then payments. "Manage in Settings" next to "Create job" both primary-blue: make Manage secondary.

**Settings (tabs)** P2 tab strip sits above a page title; ok. 
- Clients: P1 colour picker shows "Choose colour" chip and a "Hex colour" field twice plus a swatch row (three controls for one value): keep swatches + hex. P2 logo drop zone is huge for a tiny initial tile; preview uses the saved colour correctly.
- Workspace: P1 dark logo drop zone text and the remove "X" are dark on dark (invisible); SVG rejected (A3).
- Team: not inspected in detail; no overflow.
- Client access: P1 job choices are round radio-looking dots for a multi-select (should be checkboxes); P2 "Require a PIN" toggle sits tight under the last job (no spacing) and its explanation is far to the right; P2 date shows dd/mm/yyyy while the rest of the app shows "21 Oct 2026".
- Visibility: P2 same 3 toggles + 4 checkboxes repeated for every client; with 20 clients it's a 6000 px page. Use a table (rows = clients, columns = what they see) with "Default" as the first row. Floating Save card is fine.
- Packages: 15 controls under 32 px; P3.

**Client area (link + PIN)**
- Client Home (screenshot client-home-1536-light): P1 shows "Overdue" payment to the client (billing visibility default is ON in Settings → Visibility; default should be OFF for overdue/billing). P1 counts contradict the job page (see top 8). P2 job cards: second card shows only a document icon and "CONTENT", no thumbnail; P2 milestone map is mostly empty; "Items for review 12" repeats approve buttons 5 times: for the client, one "Review all" button + latest 3.
- Client Job (client-job-social-1536-dark): P1 floating "Job details" panel at the far right, detached from the page title; P1 duplicate posts + deliverables (top 7); P2 "Pending review" chips on posts while header says "0 to review". Best display: title, one line "3 posts to review", posts in a 2-column feed (IG-like), approve under each post.
- Dark: client area works in dark; card blue on navy is low contrast between surface levels (P3).

## D. Why it was missed + next-review checklist
1. Proof used placeholder data and no logo: the demo job had copy files in every folder (so posts looked right) and the logo was empty, so a tiny wide wordmark never showed.
2. Review looked at components/specs, not at "does this screen answer the owner's first question"; only dark mode was checked on the drawer.
3. No one tested the real workflow: Ahmed's own folder (13 images, no copy) and his real logo files.
Next review must include: (a) real logos uploaded (wide + square), (b) 3 real job shapes: Identity (images only), Content (post folders + caption.md), Classic (final/); (c) every screen at 390 / 1536 / 1920 in light AND dark, drawer visible in both; (d) one task per screen written first ("approve a post", "find where Identity files are"); (e) compare with the owner reference image side by side (22.png); (f) click path from Drive file to post in ≤3 steps.
