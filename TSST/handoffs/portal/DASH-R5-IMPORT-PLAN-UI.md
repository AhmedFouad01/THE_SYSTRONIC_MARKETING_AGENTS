# DASH-R5 — R7 web: Import plan, a job without a folder, uploads on Dash jobs (Codex)

Round R7 (DASH-AUDIT-003 REPORT: the Dash works without Drive). R6 is live (Files tab, modal layout, approval reset).
ROLE A (team runtime, front end). Bounded: `web/` only, no deploy, no push, no secrets, no backend files. Effort: High.
Cost rules R52: read only what is named; ONE commit per step (2 steps; Ahmed sends "Step 1", then "Step 2");
3 screenshots per step; front-end gates only; reply in 3 lines, in plain Egyptian Arabic (Ahmed reads it directly).
Use the existing components and the R6 modal layout; no size or navigation redesign (later round).

## Where
Folder `C:\Work\tsst-portal-web`. First: `git switch dash-r5-web` (= `main` 47c9698, contract v1.11). Keep
`web/qa/AUDIT-003/` and `web/qa/R6/real/` untracked as they are. The backend is built in parallel (DASH-AG-009,
branch `dash-r5`): build against `docs/DASH-API.md` with the mock. A contract gap goes into your reply. Rules:
`C:/Work/TSST/TSST/core/rules.md` R50–R53, DS tokens, `npm run ds:check`.

## Read first (only these)
`docs/DASH-API.md`: `JobCard.source`, `PlanIssue`, `PlanPreview`, `PlanImport`, `MediaUpload`, the 4 new team
endpoints, `POST /jobs`, rules "v1.9 Import plan" and "v1.11 R7"; `docs/IMPORT-PLAN.md`; `docs/examples/anvil-plan.md`;
code `web/src/pages/Jobs.tsx`, the Create job modal, `web/src/components/ds/PostEditor.tsx`,
`web/src/components/review/Deliverables.tsx`, `web/src/api/**`.

## Step 1 — Import plan + a job without a folder (commit)
- API + mock: `previewPlan`, `importPlan`; the mock parses with the same rules for the fixtures it needs (ANVIL example
  = 3 jobs / 4 milestones / 5 posts, plus one file with 3 errors). `createJob` sends no `folder` for a Dash job.
- Create job: first choice "Start in the Dash" (default, no folder: client + title → Create) or "Link a Drive folder"
  (today's folder steps). After create, open the new job.
- Jobs page: "Import plan" button next to "Create job" (secondary). Modal, 3 steps like New post:
  1 client (select) + file (drop zone or "Choose file", styled kit only, `.md` / `.txt`, ≤ 300 KB) or paste text;
  2 preview: errors first ("Line 14: …", each clickable → scrolls a read-only numbered view of the file to that line),
  warnings, then the tree: job (type, platforms, dates) → milestones (date) → posts (format chip + platform chips);
  3 confirm "Create 3 jobs" (disabled while errors) → success → open the first new job.
- A link "How to write a plan" opens the format + the ChatGPT prompt (from IMPORT-PLAN.md) with a Copy button.
Screenshots (3): Import preview with errors 1536 light; ANVIL tree 1536 dark; Create job "Start in the Dash" at 390.

## Step 2 — uploads on Dash jobs (commit)
- Dash jobs (`source: "dash"`) show a small "Dash only" chip on the card and the job header.
- Deliverables of a Dash job: "Upload files" (drop zone, multi-file): images, videos, PDF, Word, Excel, PowerPoint,
  ZIP → `PUT /media` with progress per file and plain errors (too big, wrong type, disk full); files appear in their tab
  (Images / Video / Files) at once. Remove = `DELETE /media` when no post uses it.
- Posts without media show "Add images" in the frame; New post / edit step 2 on a Dash job has the same drop zone
  ("Drop images or videos here"); uploaded files appear in the picker, selected in drop order. Word / Excel / ZIP never
  appear in the post picker. Format rules and warnings from R3 unchanged.
- Gates: `npm run ds:check`, `typecheck`, `lint` (0 errors), `test:api`, `VITE_API=live npm run build`.
Screenshots (3): drop zone with 2 uploads in progress 1536 light; carousel post after upload 1536 dark; Files tab of a
Dash job after a DOCX upload at 390 light.

## Reply (3 lines per step, Egyptian Arabic)
Step n done · gates pass / fail · contract gaps or open items.
