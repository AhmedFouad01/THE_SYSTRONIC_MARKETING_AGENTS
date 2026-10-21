# DASH-R4 — UI polish: every open P2/P3 from DASH-UX-AUDIT-002 (Codex)

ROLE A (team runtime, front end). Bounded: `web/` only, no deploy, no push, no secrets, no backend files. Effort: High.
Cost rules R52: ONE step per message (Ahmed sends "Step 1", then "Step 2", then "Step 3"); read only the section named
in the step; 2–4 screenshots of the changed area per step; front-end gates only until step 3; reply in 3 lines.

## Where
Folder `C:\Work\tsst-portal-web`, branch `dash-r4-web` (from `main` b58ca7d = live R3 + sign-in logo + phone top bar
fix). Run `git switch dash-r4-web` first. Rules for every step: `C:/Work/TSST/TSST/core/rules.md` R50–R53 (HeroUI only,
action-only button colours, no borders), DS tokens only, `npm run ds:check` must pass.

## Ahmed's words
"ظبطوا ال UI بقى زهقت" — he is tired of half-finished screens. Each item below is DONE only when it is visibly right at
1536 and 390, light and dark. If an item is already fixed, say so in the reply and skip it; never re-open settled
decisions (posts, frames, New post, formats).

Already fixed (do not touch): sign-in logo, phone top bar logo, posts/frames/New post (R1–R3), all P1 items of the audit.

## Step 1 — Home, Jobs, Job (team) (commit)
Read: `DASH-UX-AUDIT-002.md` section C, the paragraphs **Home (team)**, **Jobs**, **Job (team)** only.
- Home: KPI tiles 96 px high; one 12-column grid (row 1 = "Waiting for review" 4 + Packages 8 or the audit's order:
  what needs a decision first); "Overdue" as a row, not a dotted chip; milestones = next 5 as dated rows instead of a
  mostly empty 30-day rail; chart axis labels in a text token (not saturated brand blue).
- Jobs: grid auto-fill min 320 px (no empty right third); filter selects look like selects (chevron contrast);
  "4 jobs · 2 clients" (middle dot, plural rules); cards: client first, status, one next action ("3 to review").
- Job: Archive goes into the ⋯ menu with a confirm (no red button beside Edit); milestones form collapsed behind
  "Add milestone"; 390 tab list does not clip (scroll fade); "All approved" instead of "0 pending review" when nothing is
  pending.
Screenshots (3): Home 1536 light, Jobs 1536 dark, Job 390 light.

## Step 2 — Review, Clients, Client detail, Settings, Create job (commit)
Read: section C paragraphs **Create job modal**, **Review**, **Reports**, **Clients**, **Client detail**, **Settings**.
- Create job: taken folders show their reason on hover/focus, not only after click.
- Review: no 100 px blank gap on text cards (cards size to content); each card says which post it belongs to
  ("Post: post-01"); keyboard hint becomes a "?" tooltip; remove "0 reviewed in this session".
- Reports: every control ≥ 32 px.
- Clients: logo tile + brand colour strip + package usage + pending count per card; "1 active job" plural fix.
- Client detail: one "Overdue" (row state, not twice); unpaid gets its chip too; "Manage in Settings" secondary;
  first view = what is pending from this client, then package, then payments.
- Settings: client colour = swatches + one hex field (no third control); smaller logo drop zone; Client access job
  choices are checkboxes, "Require a PIN" spaced with its explanation under it, dates as "21 Oct 2026"; Visibility =
  one table (rows = clients, first row "Default", columns = what they see), not repeated blocks; Packages controls
  ≥ 32 px.
Screenshots (3): Review 1536 light, Client detail 1536 dark, Settings → Visibility 1536 light.

## Step 3 — Client side + proof (commit)
Read: section C paragraph **Client area (link + PIN)** and its dark note.
- Client Home: job cards always show a thumbnail (first image / post / document page), never a bare "CONTENT"
  icon; "Review all" + latest 3 instead of 5 repeated approve rows; milestone map → dated rows (same as team Home).
- Client Job: one line "3 posts to review" under the title, posts in a 2-column feed at ≥ 1024 px.
- Dark: raise the contrast between surface levels (card vs page) with tokens.
- Gates: `npm run ds:check`, `typecheck`, `lint` (0 errors), `test:api`, `VITE_API=live npm run build`.
- `web/qa/R4/REPORT.md` (≤ 1 page): every item above → done / already fine / not done (why). Screenshots (4): client
  Home 1536 light, client Job 390 dark, Home 390 dark, Jobs 1536 light.

## Reply (3 lines per step)
Step n done · gates pass / fail · items skipped or open (why).
