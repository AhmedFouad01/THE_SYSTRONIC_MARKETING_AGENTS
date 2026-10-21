# DASH-IMPORT-PLAN-001 — Import a whole client plan from one file (spec, Lead)

Owner request (2026-10-21, via the Lead session): "prepare a whole client plan in ChatGPT and upload one file, so Dash
sets everything up itself with no Drive folders and no caption.md". Example: ANVIL = a new campaign, social media setup,
branding and visual assets, each its own Job. Images: Ahmed drags them onto each post inside the Dash; they are stored on
the server, never on Drive. Errors in plain English with the line number.

## 1. The file: `plan.md` (strict Markdown, one client per file)
Chosen over JSON because ChatGPT writes it reliably, Ahmed can read and fix it by hand, and every error has a line.

```
# Plan: <plan title>
Client: <brand id, e.g. anvil>

## Job: <job title>
Type: campaign | content | identity | research | website | other
Platforms: instagram, facebook, linkedin          (any of these; at least one for a job with posts)
Start: YYYY-MM-DD
End: YYYY-MM-DD
Description: <one line the client sees, optional>

### Milestone: <title> | YYYY-MM-DD

### Post: <post title>
Format: feed | carousel | reel | story | document  (feed = single image, carousel = 2–20 images, reel = 1 video)
Platforms: instagram, facebook                    (optional; default = the job's platforms; must be a subset)

#### Instagram
<caption, any number of lines, Markdown allowed>

#### Facebook
<caption>

#### All
<one caption for every platform of the post; a platform section overrides it>
```

Rules (each broken rule = one error `Line N: <what is wrong>. <how to fix>`; nothing is created while any error exists):
- Line 1 must be `# Plan: …`; `Client:` must be an existing client id; exactly one `Client:`.
- Every `## Job:` needs `Type`, `Start`, `End` (End ≥ Start). Titles unique per client (also against existing jobs).
- `### Milestone:` = `title | date`; date inside or after the job's Start.
- `### Post:` needs `Format`; the format must exist on each of the post's platforms (post-formats.json: Story only
  Instagram / Facebook, Document only LinkedIn). Story has no caption sections; every other format needs ≥ 1 caption.
  LinkedIn caption ≤ 3,000 characters (hard), IG / FB 2,200 = warning only.
- Unknown keys / headings = error (no silent ignore). Blank lines and `<!-- comments -->` are ignored. Max 300 KB,
  50 jobs, 500 posts per file.
- Posts are created WITHOUT media; they show "Add images" until Ahmed drops files on them (Section 3).

## 2. Data (migration 013)
- A Dash job = `portal.job_sources` row with `kind = 'dash'` (new column, default `'drive'`) and `folder` = a path
  inside `DASH_MEDIA_ROOT` (new env, default `/srv/tsst/dash-media`, outside the Drive mirror and outside BRANDS_ROOT):
  `<brand>/<job-slug>/`. All existing readers (scanJob, posts, /file, /thumb, measurement) then work on that folder
  unchanged; `jobLoc` resolves the root by `kind`. The Drive mirror never touches it; the Dash never writes to Drive.
- Job meta (type, platforms, start, end, client description) → `portal.job_meta` (exists). Milestones →
  `portal.milestones` (exists). Posts → `portal.posts` (exists; media = paths inside the Dash folder).
- `portal.plan_imports` (id, brand, title, file text, created_at, created_by, jobs created) = the audit trail.

## 3. Media upload (server storage)
- `PUT /api/v1/media?brand=&job=&name=` raw body (no base64), team only, Dash jobs only. Streamed to a temp file,
  checked (magic bytes: JPEG / PNG / WebP / MP4 / MOV / PDF), then renamed into `<folder>/media/<safe-name>`.
- Caps (sensible for the 18 GB free): image ≤ 25 MB, video ≤ 300 MB, PDF ≤ 100 MB; ≤ 2 GB per job; refuse new uploads
  when the disk has < 3 GB free. Plain-English 413 / 422 messages.
- `DELETE /api/v1/media?brand=&job=&path=` (team, Dash jobs only; refused while a post uses the file).
- Backups: `pre-deploy` dumps cover the DB only; add `DASH_MEDIA_ROOT` to the server notes as "not on Drive — back up
  with the nightly tar" (ops follow-up, not this round).

## 4. API (contract DASH-API v1.9)
- `POST /api/v1/plans/preview` body `{ brand, text }` → `{ ok, errors: {line, message}[], warnings: {line, message}[],
  jobs: [{ title, type, platforms, start, end, milestones: n, posts: [{ title, format, platforms }] }] }`. No writes.
- `POST /api/v1/plans/import` same body → 201 `{ import_id, jobs: [{ brand, job }] }`; 422 with the same errors when
  invalid; one transaction (all or nothing).
- `GET /api/v1/plans/format` → the format text (for the UI help panel).

## 5. UI
- Jobs page: "Import plan" button → modal: 1 pick client, 2 drop / choose `plan.md` (or paste), 3 preview tree
  (jobs → milestones → posts with format chips) with errors listed by line (click = scroll to the line in a read-only
  view), 4 "Create N jobs" (disabled while errors). After import → the first new job.
- Post card / New post step 2 on a Dash job: a drop zone "Drop images or videos here" → upload with progress, then the
  file appears in the picker and is attached to the post. Same format rules (R3).
- Dash jobs show a small "Dash only" chip (no Drive folder).

## 6. ChatGPT prompt + example
`docs/IMPORT-PLAN.md` in the portal repo: the format (Section 1), a ready-to-paste ChatGPT prompt that makes ChatGPT
output exactly that file, and `docs/examples/anvil-plan.md`. Written by the Lead.

## Rounds
1. AG-009 (Antigravity, server): migration 013, DASH_MEDIA_ROOT, parser + preview + import, media upload/delete,
   tests (parser line errors, all-or-nothing import, upload caps, Dash job read through every existing path, client
   visibility unchanged).
2. R5 (Codex, web): Import plan modal + upload drop zone + "Dash only" chip, against DASH-API v1.9 with the mock.
3. Lead: merge, real-file local test with the ANVIL example, deploy with Ahmed's OK (creates `/srv/tsst/dash-media`).
