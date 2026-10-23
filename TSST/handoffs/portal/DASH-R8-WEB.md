# DASH-R8 web — package v2, time, bonus, client header infographic, timeline, feedback, milestone scopes (Codex)

Round R8 (plan `DASH-R8-PLAN.md`). R8A is live (heading system `web/qa/R8A/HEADINGS.md` applies to every new screen).
ROLE A (team runtime, front end). Bounded: `web/` only, no deploy, no push, no secrets, no backend files. Effort: High.
Cost rules R52: read only what is named; ONE commit per step (3 steps; Ahmed sends "Step 1", "Step 2", "Step 3");
3–4 screenshots of the changed area per step; front-end gates only until Step 3; reply in 3 lines, plain Egyptian Arabic.
Rules: `C:/Work/TSST/TSST/core/rules.md` R49–R53, DS tokens, `npm run ds:check`, HeroUI v3 only (charts stay Chart.js).

## Where
Folder `C:\Work\tsst-portal-web`. First: `git switch -c dash-r8-web main` (main = 309a595, contract v1.12 + v1.12b).
Keep untracked `web/qa/AUDIT-003/`, `web/qa/R6/real/`, `web/qa/R7/real/` as they are; COMMIT `web/qa/R8/design/`
with Step 1 (it is the approved spec). The backend is built in parallel (Antigravity, branch `dash-r8`): build against
`docs/DASH-API.md` with the mock; a contract gap goes into your reply.

## Read first (only these)
- `docs/DASH-API.md`: section "v1.12 R8" (incl. v1.12b `BonusTone`, `BrandHeader`), types `PackageCard`, `Milestone`.
- APPROVED DESIGN: `web/qa/R8/design/DECISIONS.md` and `client-header.html` (round 2; `r1/` is history). Build it as
  drawn, with these Lead rules on top:
  - The credits ring reuses the ring already used on Home package cards (same component / Chart.js doughnut), no new
    hand-made SVG ring. Pip and bar meters = HeroUI ProgressBar or the existing DS meter.
  - Owner answers: gradient angle = slider only; header image = cover, centred; the 6 bonus tones are final; no
    active bonus → no bonus tile, next milestone widens; dark header default stays royal #00338D.
  - New tone tokens `--tn-*` go in the DS token file; each text/background pair ≥ 4.5:1 in light and dark (note the
    measured values in your Step 2 reply).
- Code: `web/src/pages/ClientDetail.tsx`, `web/src/pages/client/ClientHome.tsx`, `ClientShell.tsx`, `ClientSummary.tsx`,
  `web/src/pages/settings/Packages.tsx`, `settings/Clients.tsx`, `components/ds/HeaderColorPicker.tsx`,
  `components/ds/MilestoneMap.tsx`, `pages/Home.tsx`, `pages/Job.tsx`, `pages/Review.tsx`, `web/src/api/**`.

## Step 1 — data layer + owner and team tools (commit)
- API client + mock for every v1.12 / v1.12b endpoint and changed read (time, feedback, milestones, bonuses,
  time-estimates, plans fields, `maker`, BrandHeader, Bonus.tone). Mock fixtures: Starter Pack 4 credits + bonus
  +2 credits (cyan, until 15 Nov), 1 extra edit, 94.5 / 110 h, 4 open feedback, 5 timeline milestones (2 done).
- Settings → Packages: plan form gains Hours (team only), Edit credits, Services (chips input, ≤ 8). Bonuses per client
  (list + Add / Edit / Delete; kind, amount, label for "Other", start–end, note, tone picker) as in the design.
  Time estimates (6 minute fields + AI factor) in the same tab, owner only.
- Settings → Clients: header control from the design (Solid / Gradient / Image segmented, colours, angle slider, image
  drop zone with the existing upload kit, overlay slider with the "below 30 %" hint, live preview).
- Job page: "Log time" (minutes, date, note; on the job or on an item from its card menu) + the job's time list in
  Overview (own entries editable; owner all). Item menu and bulk bar: "Mark as AI-made" / "Made by the team" (`maker`).
Screenshots (4): plan + bonus form 1440 light; header control (image) 1440 dark; Log time on an item 390 light;
time list in Overview 1440 dark.

## Step 2 — client header infographic + timeline (commit)
- One shared `ClientHeader` (identity block, BrandHeader background, tiles, timeline) used by the client view
  (`ClientHome`) and the team client hub (`ClientDetail`); team-only parts (hours, extra edits in #FF003C, open
  feedback link, bonus note, milestone scope/owner) only in the team view. States: 0 credits (calm grey in the client
  view), no package, no logo, wide and squarish logos. Image style uses `image_url` with the overlay.
- Client hub: "Feedback" section (FeedbackItem list: thumb, title, note, by, age, extra chip; links to the item).
Screenshots (4): client view 1440 light (gradient header); client view 390 dark (image header); team hub 1440 dark;
0-credits client 390 light.

## Step 3 — milestones by scope + review + colour fix (commit)
- Milestone create / edit: scope (Job / Client / Agency), owner select, client-visible switch (hidden for Agency). Client
  milestones live in the client hub, agency ones on Home ("Agency" filter); Home `MilestoneMap` shows a scope badge.
- Review: items with an open client request show its note (`client_request`) and stay listed.
- R51 fix: Request edit / extra red token = #FF003C (today `--sy-button-edit` is #E0264B; hover a step darker).
- Gates: `npm run ds:check`, `typecheck`, `lint` (0 errors), `test:api`, `VITE_API=live npm run build`.
Screenshots (3): milestone editor (client scope) 1440 light; Home with scope badges 1440 dark; Review with a client
request note 390 light.

## Reply (3 lines per step, Egyptian Arabic)
Step n done · gates pass / fail · contract gaps or open items.
