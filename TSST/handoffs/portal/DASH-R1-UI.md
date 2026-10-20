# DASH-R1 — Round 1 UI: real post frames, posts written in the Dash, shell + P1 fixes (Codex)

ROLE A (team runtime, front end). Bounded: no deploy, no push, no secrets, no new paid tools. Cost rules R52: read only
what is named; commit per phase; reply in 5 lines. Effort: High.

## Where
Folder `C:\Work\tsst-portal-web`, branch `dash-r1-web` (from `main` 8eeea23). `web/` only. The backend is built in
parallel on another branch against the SAME contract: build against `docs/DASH-API.md` v1.7 with the mock. A contract
gap goes into your reply, never into backend files.

## Read first (only these)
1. `C:/Work/TSST/TSST/handoffs/portal/DASH-UX-AUDIT-002.md` — the whole report (this round = Top 10, A1–A6, all of
   B, and every **P1** in C; P2/P3 in C are NOT this round).
2. `docs/DASH-API.md` v1.7: `PostPlatform`, `Post`, `PostInput`, `Deliverable.post`, `/posts` endpoints, the v1.7 rules.
3. `C:/Work/TSST/TSST/core/rules.md` R49–R53. Ahmed's reference frame:
   `C:\Users\10\AppData\Local\Temp\claude\G--My-Drive-THE-SYSTRONIC-MARKETING-AGENTS\13b4dbd4-6dab-406e-ba85-b9b9991a012e\images\22.png`.
4. Code: `web/src/components/ds/**`, `web/src/api/**`, the pages the audit names.

## Ahmed's decisions (final)
- A post = one folder with images/video + a caption file, OR a post written in the Dash. Both. Images always come from
  Drive (job files); captions can be written in the Dash. A post is reviewed as ONE item (Request edit · Approve).
- Frames look like the real platform (audit B2): Instagram, Facebook, LinkedIn; carousel counter + dots INSIDE the
  media; decorative action icons, no numbers, no platform logos. Status chip and review buttons sit OUTSIDE the frame.
- The client never sees an overdue payment: no "Overdue" anywhere in the client area.
- Drawer: the Dash logo fills the drawer width, "by The Systronic" under it; drawer controls visible in light AND dark.

## Phase 1 — Shell + logos (commit)
A1–A6 from the audit. Logo pickers accept SVG too (the server rasterises it); hint "Wide logos work best". One search,
one theme toggle per viewport; mobile bottom bar max 5 items.

## Phase 2 — Posts (commit)
- API + mock to v1.7: posts with `key/source/id/team/client/shown/updated`; mock jobs = one Identity job (13 images, no
  caption → 0 posts, Posts tab hidden), one content job with Drive posts (IG carousel 5, FB single, LinkedIn single,
  one `all` caption), one Dash-written post, one Drive post edited in the Dash.
- `PostFrame` rebuilt to B2 for `instagram | facebook | linkedin` (light + dark), `MediaCarousel` with inside counter +
  dots, swipe, hover arrows; video poster + play. Platform `Segmented` (full words) above the card when > 1 platform.
- Job page: header, then tabs Overview | Posts | Deliverables | Log (Posts tab only when the job has posts or is a
  content/campaign job). Posts tab: grid of frames; each card: status chip + Shown toggle + Edit ⋯ outside the frame;
  "New post" primary button.
- **Post editor** (modal or side sheet, one component for New and Edit): title; pick media from the job's images /
  videos (thumbnail grid, numbered selection = carousel order, drag or arrows to reorder, max 10); captions with tabs
  Instagram / Facebook / LinkedIn / All (char counter 2200, `dir="auto"`); live preview = the real `PostFrame` beside
  the form (stacked below 1024). Edit on a Drive post creates the Dash version (`folder` set); "Reset to Drive
  version" = delete. Errors in plain words.
- Review: team Approve / Request edit on the post key (one call); client the same. Client job page: posts feed first
  (2 columns ≥ 1024, 1 below), then only files that are not in a post; no floating "Job details" card; counts from the
  API only.
- Teach the convention: Create job folder step one line + "See example"; empty Posts tab = small folder diagram
  (`<post-name>/ 01.jpg 02.jpg caption.md`) + "New post" button.

## Phase 3 — P1 screens from audit C (commit)
Home (decision-first layout, KPI tiles 96 px, one grid), Jobs / Clients / Review grids (auto-fill, min 300 px, no
empty third), Clients cards with logo + brand colour, Review cards (preview inside, actions right, no blank gap),
Settings → Workspace dark drop zone visible, Client access job choices = checkboxes, client Home ("Review all" + latest
3, every job card has a cover), no client "Overdue".

## Phase 4 — Proof (commit)
- Gates: `npm run ds:check`, `typecheck`, `lint` (0 errors), `test:api`, `VITE_API=live npm run build`; root `npm test`.
- Proof MUST use: Ahmed's real logos `D:\Work v2\Systronic Team\DASH1.svg` + `DASH2.svg` uploaded in mock; the three job
  shapes above; every screen light AND dark with the drawer visible.
- Playwright: no inner scrollbars / `scrollWidth <= clientWidth` at 390 / 1536 / 1920; New post flow (pick 3 images,
  reorder, write IG + LinkedIn, save, frame shows 1/3 counter); Identity job has no Posts tab.
- Screenshots `web/qa/R1/` (12 max): drawer light + dark; job Posts tab 1536 light; IG / FB / LinkedIn frame close-ups
  light + one dark; post editor 1536; client job 1536 light + 390; team Home 1536 dark; Review 1536 light.
- `web/qa/R1/REPORT.md` (≤ 1 page): audit item → done / not done.

## Reply (5 lines)
Phases done · gates pass / fail · audit items done / open · contract gaps (if any) · screenshot folder.
