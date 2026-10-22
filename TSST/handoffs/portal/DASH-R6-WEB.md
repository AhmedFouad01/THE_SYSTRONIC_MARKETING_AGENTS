# DASH-R6 — broken screens + Files tab (Codex)

ROLE A (team runtime, front end). Bounded: `web/` only, no deploy, no push, no secrets, no backend files. Effort: High.
Cost rules R52: read only what is named; ONE commit per step (2 steps; Ahmed sends "Step 1", then "Step 2");
3 screenshots per step; front-end gates only; reply in 3 lines, in plain Egyptian Arabic (Ahmed reads it directly).
Source: your own DASH-AUDIT-003 (`web/qa/AUDIT-003/REPORT.md`, round R0). Do not redesign sizes or navigation here
(that is a later round): fix what is broken, using the existing components.

## Where
Folder `C:\Work\tsst-portal-web`. First: `git switch dash-r6-web` (= `main` with contract v1.10). Keep
`web/qa/AUDIT-003/` untracked as it is. The backend is built in parallel (DASH-AG-010, branch `dash-r6`): build
against `docs/DASH-API.md` v1.10 with the mock. A contract gap goes into your reply. Rules:
`C:/Work/TSST/TSST/core/rules.md` R50–R53, DS tokens, `npm run ds:check`.

## Read first (only these)
`docs/DASH-API.md` rules "v1.10 R6 fixes" and types `Tab`, `Payment`, `Deliverable.file`, `Visibility`; your notes
for S1-01, S2-01..05, S3-01, S4-01, S4-02, S4-10, S4-11; code `web/src/components/ds/system.css` (line ~1146),
`web/src/pages/Job.tsx`, `web/src/components/ds/PostEditor.tsx`, `web/src/pages/settings/Packages.tsx`,
`web/src/pages/settings/Clients.tsx`, `web/src/pages/settings/Visibility.tsx`,
`web/src/components/review/Deliverables.tsx`, `web/src/pages/client/ClientJob.tsx`, `web/src/api/**`.

## Step 1 — broken screens (commit)
- Modals (S1-01, S2-02, S3-01): one layout for every modal: header and footer always visible, the body scrolls
  inside `min(90dvh, …)`; remove the `max-height: none; overflow: visible` rule. Check Create job (with "See example"
  open, from Jobs and from Client detail), Edit job, New post, create access link, Request edit, at 390 and 1536.
- Restore (S2-03): Archive / Restore never crash (no menu item that changes its id); after Restore the job page shows
  the job right away.
- New post picker (S2-05): also lists images / videos / PDFs of the `ref` zone under a "Work folders" group (never
  `qa` / `old`); the showcase-01-reel video must be pickable.
- Editing an approved post (S2-04): when the post has a team or client decision that is not pending and a content
  field (format, platforms, ratio, media, captions) changed, show under the Save button: "Saving sends this post back
  to review (team and client)." After save the card shows the state the API returns.
- Packages (S4-01, S4-02): after Save plan, reload every client detail on the page (no mix of old and new amounts);
  a paid row shows its own `amount` + `currency` from the API.
- Logo picker (S4-10, my bug): Remove logo clears the picked tile; picking the same tile again works.
Screenshots (3): Create job + example open at 390 light (footer and folders both reachable); job page right after
Restore 1536 dark; New post picker showing the showcase video at 390 dark.

## Step 2 — Files tab (commit)
- Deliverables: a "Files" tab after Plans. Compact rows (≤ 72 px tall, not big cards): type icon (lucide), name,
  ext chip, size, pages for PDFs, PDF page-1 thumb when `file.page_thumb` exists; Open (PDF, new tab) / Download;
  Approve / Request edit / Show to client / client title, and bulk select, exactly like the other tabs.
- Settings → Visibility: "Files" in "Formats clients can see".
- Client job page: a Files section with the same rows (Open PDF / Download, Approve / Request edit), only what the
  API sends.
- Mock: `anvil/@locked-assets` gets a PDF, a DOCX, an XLSX and an SVG as `files` items, one of them approved + shown.
- Gates: `npm run ds:check`, `typecheck`, `lint` (0 errors), `test:api`, `VITE_API=live npm run build`.
Screenshots (3): team Files tab 1536 light; client Files section 390 dark; Visibility with Files 1536 light.

## Reply (3 lines per step, Egyptian Arabic)
Step n done · gates pass / fail · contract gaps or open items.
