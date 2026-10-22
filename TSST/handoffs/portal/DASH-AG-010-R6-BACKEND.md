# DASH-AG-010 — R6 backend: approval follows content, paid amounts kept, Files tab, whole-folder classic jobs

ROLE B (external tool via Ahmed, R41): bounded code task, no deploy, no push, no spend, no secrets.
Model: Gemini 4 Argon, effort High. Cost rules R52: read only what is named; reply in 3 lines, in plain Egyptian Arabic.
Source: DASH-AUDIT-003 (REPORT.md problems 1, 2, 3, 5, 7; findings S2-04, S4-01, S2-01, S4-11, S2-05, S1-02).

## Where
Folder `C:\Work\tsst-portal-ag`. First: `git switch dash-r6` (= `main` with contract v1.10). Write ONLY `src/**`,
`migrations/013_*.sql`, `tests/**`. No new dependency. Do NOT touch `web/**` (Codex builds the UI on `dash-r6-web`)
or `docs/**` (a contract gap goes into your reply).

## Read first (only these)
1. `docs/DASH-API.md` v1.10: rules "v1.10 R6 fixes", types `Tab`, `Payment`, `Deliverable.file`, `Visibility`, and
   the client serving rule for `/file`.
2. Code: `src/server/v1/posts.ts` (POST with `folder`, PATCH), `src/db/repo.ts` (`insertDecision`),
   `src/server/v1/team-write.ts` and `src/server/v1/client.ts` (decision endpoints), `src/service/dash/packages.ts`
   (`marks`, `paymentsOf`, visibility defaults / validation), `src/server/v1/owner.ts` (payments/paid),
   `migrations/003_dash.sql` (payments), `src/core/constants.ts`, `src/core/kinds.ts`, `src/core/scan.ts`,
   `src/core/discovery.ts`, `src/service/dash/jobs.ts`, `src/service/dash/client-view.ts`, `src/server/app.ts`
   (/file, /thumb), `src/service/dash/media-info.ts`.

## Task (each = the v1.10 rule of the same name, exactly)
1. **Approval follows content.** In PATCH /posts and POST /posts with `folder`: compare the saved format, platforms,
   ratio, media and captions with the new ones; when any really differs, in the same transaction append `pending`
   on each track whose current decision is not `pending` (team by = editor name, client by = "The Systronic", note
   "Edited after review"). Title-only / identical saves reset nothing. v1 decision endpoints: a missing `note` is
   written as `""` (the old board's merge stays as it is).
2. **Paid amounts kept.** Migration 013: `portal.payments` + `amount integer NULL`, `currency text NULL`, CHECK paid ⇔
   both set; backfill paid rows from the brand's current plan. paid:true stores the plan values of that moment;
   paid:false clears them; `paymentsOf` returns stored values for paid rows, plan values for unpaid ones.
3. **Files tab.** Tab `files` for the listed extensions outside `qa` / `old` (in `@` and classic jobs); a review tab
   (pending counts, decisions, batch, `shown`, client title). `Deliverable.file` = ext, bytes, PDF pages and
   `page_thumb` (reuse media-info; null without pdftoppm). `client_tabs` accepts `files`; migration 013 adds it to a
   stored global setting and the code default. `/file`: PDF inline, everything else `attachment` with its real type,
   SVG never inline (team and client). Client: only files items its job page lists.
4. **Classic jobs without work/ or final/** scan the whole folder like an `@` job (sub-folders that are jobs skipped).
5. **Post media from the `ref` zone** is accepted (never `qa` / `old`) and a client can fetch it when the post is
   visible to it.

## Tests `tests/v1-r6.test.ts`
Approved post → caption PATCH → team and client both `pending`, gone from client view, back after team approve;
title-only PATCH keeps `approved`; identical PATCH keeps it. Approve after changes_requested without note → note "".
Mark paid at 10, change plan to 99 → that payment still 10 and the next unpaid one 99; undo paid → follows the plan.
A job with a PDF, DOCX, XLSX, SVG, `.py`: first four in `files`, `.py` in `other`; client sees an approved + shown
DOCX only with `files` in client_tabs; client GET of a hidden one → 404; DOCX and SVG served as attachment.
A classic job with images at its root and no work/final → its files counted. A post using a `ref`-zone video →
created, and the client fetches it once the post is approved + shown; a `qa` file → 422.
Existing tests stay green (say which you changed and why).

## Checks before the reply
Root: `npm run typecheck`, `npm run lint` (0 new warnings), `npx vitest run` (full suite). One commit on `dash-r6`.

## Reply (3 lines, Egyptian Arabic)
What changed · checks pass / fail · contract gaps / tests changed (for the Lead).
