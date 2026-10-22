# DASH-R5 — Import plan UI + media drop zone (Codex)

**ON HOLD until R6 is merged into main.** Then the Lead resets `dash-r5-web` to that main (contract v1.10).

ROLE A (team runtime, front end). Bounded: `web/` only, no deploy, no push, no secrets, no backend files. Effort: High.
Cost rules R52: read only what is named; ONE commit per step (2 steps); 2–3 screenshots per step; front-end gates only;
reply in 3 lines, in plain Egyptian Arabic (Ahmed reads it directly). Send only after DASH-R4 is finished.

## Where
Folder `C:\Work\tsst-portal-web`. First: `git switch dash-r5-web` (= `main` 9f0f7f5, contract v1.9). The backend is
built in parallel (DASH-AG-009, branch `dash-r5`): build against `docs/DASH-API.md` v1.9 with the mock. A contract gap
goes into your reply. Rules: `C:/Work/TSST/TSST/core/rules.md` R50–R53, DS tokens, `npm run ds:check`.

## Read first (only these)
`docs/DASH-API.md` v1.9 (`JobCard.source`, `PlanIssue`, `PlanPreview`, `PlanImport`, `MediaUpload`, the 4 new team
endpoints, rules "v1.9 Import plan"); `docs/IMPORT-PLAN.md`; `docs/examples/anvil-plan.md`; code `web/src/pages/Jobs.tsx`,
`web/src/components/ds/PostEditor.tsx`, `web/src/api/**`.

## Step 1 — Import plan (commit)
- API + mock: `previewPlan`, `importPlan`; the mock parses with the same rules for the fixtures it needs (ANVIL example
  = 3 jobs / 4 milestones / 5 posts, plus one file with 3 errors).
- Jobs page: "Import plan" button next to "Create job" (secondary). Modal, 3 steps like New post:
  1 client (select) + file (drop zone or "Choose file", styled kit only, `.md` / `.txt`, ≤ 300 KB) or paste text;
  2 preview: errors first ("Line 14: …", each clickable → scrolls a read-only numbered view of the file to that line),
  warnings, then the tree: job (type, platforms, dates) → milestones (date) → posts (format chip + platform chips);
  3 confirm "Create 3 jobs" (disabled while errors) → success → open the first new job.
- A link "How to write a plan" opens the format + the ChatGPT prompt (from IMPORT-PLAN.md) with a Copy button.
Screenshots (3): preview with errors 1536 light; ANVIL tree 1536 dark; step 1 at 390.

## Step 2 — Media on Dash jobs (commit)
- Dash jobs (`source: "dash"`) show a small "Dash only" chip on the card and the job header.
- Their posts without media show "Add images" in the frame; New post / edit step 2 on a Dash job gets a drop zone
  "Drop images or videos here" (multi-file) → `PUT /media` with progress per file, errors in plain words (too big,
  wrong type, disk full), then the files appear in the picker selected in drop order; remove = `DELETE /media` when
  unused. Format rules and warnings from R3 unchanged.
- Gates: `npm run ds:check`, `typecheck`, `lint` (0 errors), `test:api`, `VITE_API=live npm run build`.
Screenshots (3): drop zone with 2 uploads in progress 1536 light; carousel post after upload 1536 dark; 390 light.

## Reply (3 lines per step, Egyptian Arabic)
Step n done · gates pass / fail · contract gaps or open items.
