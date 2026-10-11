**HANDOFF 2026-10-07 16:15 (latest) → new session "TSST CRM MVP 3": read `HANDOFF_MVP3.md` first.**
- feat/crm-mvp-ui @ 2df5e7b. P1b B1–B4 done.
- Sign-in from scratch ON HOLD: Better Auth vs Cognito awaits the user.
- Sprint task paused.
- STATUS 2026-10-07 16:03 sprint run: no commit. The import server agent died on a network error (ENOTFOUND) and the retry was blocked by the safety check. Then the pause above was seen, so the run exited. The tree should be clean (no IMPORT_PLAN.md), but git status was not verified.

**SPRINT ACTIVE (user, 2026-10-07 07:55 → 2026-10-09 10:00):** see `SPRINT_SELLABLE.md`.
- Scheduled task `crm-sprint-sellable` fires every 2h at :17 and runs one roadmap item per fresh session.
- Same lock (C:/Work/crm-night.lock) and stop at 99% weekly usage (user, 2026-10-07).
- At handoff, B4 server was being built by the day session; check git log and the tree.

# CRM MVP — morning questions (2026-10-05)

**NIGHT RUN ACTIVE (user-authorised 2026-10-06 22:45 +03:00, until 2026-10-07 10:00):** playbook NIGHT_RUN.md. Scheduled runs crm-night-run-1/2/3 fire at 01:52, 04:22 and 06:57. Lock: C:/Work/crm-night.lock. Stop when weekly usage reaches 99% (user, 2026-10-07). Report: NIGHT_RUN_REPORT.md.

**NIGHT RESUME POINT (2026-10-07 08:25, latest — night run ended):** feat/crm-mvp-ui @ 2df5e7b.
- P1b B1–B4 DONE. B4 UI is 0641b45, and the full UI suite passed 274/274.
- Sign-in plan: b268076 (AUTH_PLAN.md, decisions D1–D13 Lead-provisional). A1 (scrypt primitives) is 2df5e7b, unit 451.
- STOPPED before A2: it rewrites actor()/mfa_ok() and depends on D1 (mandatory TOTP for managers), so it needs the user's confirmation.
NEXT: the user confirms D1–D13, then A2 (migration 013).
Note: in PowerShell, `npx playwright` cannot find the browsers. Run the UI suite from Bash.

(older) **NIGHT RESUME POINT (2026-10-07 07:55):** feat/crm-mvp-ui @ c0b284c. Run 3 work:
- B3 CREATIVE gate PASS-WITH-FIXES, with the fixes committed in b4e0599.
- B4 server committed in c0b284c (migration 012 applied; unit 407, db 137, bootstrap 4).
NEXT:
1. B4 UI: grid columns and filters for custom fields, plus a CREATIVE gate.
2. Full UI suite once.
3. Real sign-in.

(older) **NIGHT RESUME POINT (2026-10-07 03:00):** feat/crm-mvp-ui @ 8165ec7. B3 is DONE: server fd38748, UI 8165ec7.
NEXT, in order:
1. CREATIVE gate for B3 UI on `CRM_APP/audits/2026-10-07/shots-record-properties/` (4 shots).
2. B4: filter and sort by custom fields. Server: the `props=`-aware compiler, row-value keyset, default null ordering. UI: grid columns and filters. One agent per half, run sequentially.
3. Full UI suite once.
4. Roadmap v2 item 2: real sign-in (NIGHT_RUN.md §5).
Known B3 risk: custom_search is not rebuilt when a property's searchable/sensitive flag changes; it needs a bounded rebuild job. Its rebuild hook belongs with B4.
The day session stopped at 88% of the 5h limit.

(older) **NIGHT RESUME POINT (2026-10-07 02:55, latest):** feat/crm-mvp-ui @ c0a2300. Done tonight:
- B0 spike: f2ce35a
- decisions: 1be1728
- keyset fix: e738ea1
- B1 migration 010: a47884c
- B2 server, migration 011 + schema API: bd0fb2d
- B2 UI properties page: c724a5b, c0a2300

DONE ALSO: B3 server fd38748. IN PROGRESS: B3 UI (uncommitted in app/; fixing 4 failing tests in mvp-record-properties.spec.ts:124/146 EN+AR), then commit. NEXT: B3 UI commit (custom fields on record forms/panels), then B4 (filter/sort by custom fields), then the full UI suite once, then roadmap v2 item 2 (real sign-in).

(older) **NIGHT RESUME POINT (2026-10-07 00:55):** P1B_PLAN + P1B_DECISIONS committed (662e793). B0 spike IN PROGRESS, not committed. Measurements are done: `CRM_APP/audits/2026-10-07/spike-b0/` (results.json, plans_A..H, leakproof_experiment.json); scripts are in `CRM_APP/scripts/spike/`. REMAINING for B0: have tsst-dev (SK-002/006/014) write `audits/2026-10-07/P1B_B0_SPIKE.md` from results.json (pass/fail vs P1B_PLAN §2 bars, B1 shape, pg_trgm need), then clean up: drop DB `crm_spike_b0` + spike role ONLY. Then the Lead reviews, commits scripts + doc, and starts B1 (migration 010). The day session stopped at 95% of the 5h limit.

**ROADMAP v2 — SELLABLE FIRST (user, 2026-10-07, ADR-002 §9.2):**
1. P1b essentials B1–B4 (registry, fields page, values on records, filter/sort).
2. Real sign-in + users.
3. Excel/CSV import.
4. Dashboard charts (aggregates + MagicPath §10–12).
5. Hosting on the user's AWS EC2 (domain, HTTPS, daily backups; deploy only with the user's go).
6. After first customers: P2, B5–B7, R4 polish, P3.

Deferred costly gates: B6 1M perf.

(older) **ROADMAP (user-approved 2026-10-06, ADR-002 §9.1, commit a81f074):** backend-first; each server feature ships with a plain working UI on the current components.
1. P1b property engine. The user tries it and accepts it.
2. Server aggregates for charts and widgets.
3. P2 custom objects.
4. UI polish: MagicPath sections 10–12 charts and widgets, plus the deferred R4 items.
5. P3 after real usage.

Stack: NO full RAC+Tailwind migration. React Aria per complex widget only, each one approved by the user. Tailwind is dropped and glass is deferred.

**STATUS 2026-10-06 close:** feat/crm-mvp-ui @ 76693b3 (not pushed). UI R4 batch 2 item C (preview slide-over) DONE on Leads/Contacts/Tasks/Reporting + permanent-column code removed (e0ace0c, b098c37). Merged (user OK): feat/crm-server-search (7f65efc, P1a S5) and feat/crm-p1b@6ca52bf (P1a security review: revoke PUBLIC EXECUTE on 3 definer functions). `npm run migrate` applied 009 + the revoke repair to crm_m0 (row counts unchanged). Checks on 76693b3: lint 0, unit 307, db 96, bootstrap 4, ui 246, build ok. Second session (feat/crm-p1b): step 2 (P1B_PLAN) NOT started — the user held it to save plan usage. The brief is still valid: C:/Work/tsst-crm-p1b/SESSION_BRIEF_P1B.md step 2. FOUND: charts/trends/progress widgets exist only in the MagicPath design system (component 457127428263931904, sections 10 Widgets, 11 Data Visualization, 12 Reporting Composition; hand-drawn SVG, no chart lib). They were deferred in MVP_UI_IMPLEMENTATION_MAP.md (no aggregate API) and never built. NEXT (awaiting user): a "charts & widgets" track (server aggregate endpoints + UI sections 10–12), or the deferred batch-2 items.

**STATUS 2026-10-06 night:** feat/crm-mvp-ui @ 45901cf (not pushed): preview slide-over done for Leads, Contacts (143266a) and Tasks (45901cf). CREATIVE gates: Contacts PASS-WITH-FIXES (fixed), Tasks PASS. In progress: Reporting + cleanup (tsst-dev). Parallel: **feat/crm-server-search @ fcd57c5** (Codex: P1a S5 Arabic fold, related search/sort, sources; 001 role guard; db 95), worktree C:/Work/tsst-crm-codex, DB crm_codex, NOT merged (needs user). **feat/crm-p1b** worktree C:/Work/tsst-crm-p1b (from fcd57c5, DB crm_p1b, port 4319): second session, brief SESSION_BRIEF_P1B.md (P1a security review → P1B_PLAN, stop for user). Later items: AR datetime comma "،"; header "New task" reachable while preview is open; wire S5 sorts/sources into the UI after the merge.

**STATUS 2026-10-06 late:** branch feat/crm-mvp-ui @ d0d1b6d (not pushed). UI R4 batch 2 item C started: impact assessed (audits/2026-10-06/PREVIEW_IMPACT_DEV.md + _CREATIVE.md), decisions D1–D7 in PREVIEW_DECISIONS.md — **D7 (user): desktop preview at inline end = right EN / LEFT AR; sheet <1024 from right in both**. Inc 1 Leads preview done (5c847d4; CREATIVE gate FAIL AR → re-gate PASS-WITH-FIXES) + central mixed AR/EN isolation fix (53885ad). Checks: lint 0, unit 306, db 91, bootstrap 4, ui 213. NEXT (same track): Contacts (merge-dialog regression test) → Tasks → cleanup (RecordEmpty/autoSelectFirst/split CSS) → Reporting; Deals out of batch 2. CREATIVE "later": header name only after body title scrolls; interactive check of exit animation/Back.

**STATUS 2026-10-06 (earlier):** branch feat/crm-mvp-ui @ 4ad35c3 (worktree C:/Work/tsst-crm-mvp, not pushed). Done: UI R4 batch 1; ADR-002 ACCEPTED (Option D, stack RAC+Tailwind+TanStack+dnd-kit, spike GO 34/34); P1a S1-S4 server list query; grids wired to server query (Leads/Contacts/Deals/Tasks + Pipeline/Dashboard counts; closes DEV_REVIEW F-01/F-02; api.ts now forwards has_more/total_count) — lint 0, unit 294, db 91, bootstrap 4, ui 186. Known gaps (need server work, user to prioritise): no sort on contact/owner/pipeline/stage columns; `q` matches title/name only, no Arabic alef folding; contacts source filter lists loaded values only; Pipeline money totals loaded-only. NEXT: UI R4 batch 2 (preview slide-over on RAC), RAC+Tailwind migration, P1b property engine.

**HOLD (user, 2026-10-05):** CRM paused until TSST core skill architecture is fixed (other session) and agents verified. Resume point: (1) stash/repair S9 WIP (breaks build: `app/src/ui/i18n/ar.ts:449`); (2) rerun CREATIVE_AG UX audit (stopped mid-run; partial output may be in `C:/Work/tsst-crm-mvp/CRM_APP/audits/2026-10-05/` (capture.spec.ts + shots/)); (3) merge DEV_REVIEW (REWORK: 3 BLOCKER/10 MAJOR) + HUBSPOT_COMPETITOR_INTEL + UX_AUDIT into MVP v2 plan (API tranche first) → user approval.

Status: PAUSED (usage limit). Done+committed S0–S8 (HEAD 86f0e67, all green: unit 197, db 81, bootstrap 4, ui 82). S9 Reporting WIP UNCOMMITTED in worktree (unverified) — resume agent or rerun S9, then S10 Dashboard, S11 Admin, S12 E2E + retire old web/*.html. Branch `feat/crm-mvp-ui` in off-Drive worktree `C:\Work\tsst-crm-mvp` (not pushed). Local Postgres left running.
Lead decisions D1–D6: `CRM_APP/MVP_UI_IMPLEMENTATION_MAP.md` §6.

## Questions (recommended option first)
1. Push `feat/crm-mvp-ui` + open PR? → Recommend: yes, after review (not done overnight).
2. PowerShell 7 was installed via winget by a worker (needed by `scripts/native-local.ps1`). Keep? → Recommend: keep.
3. M2_EVIDENCE baseline says 82 tests; actual baseline is 99 (81 db incl. m1-remediation, 4 bootstrap, 14 ui). Correct the evidence line? → Recommend: yes, a one-line note.
4. Arabic copy for worker-written keys (6 in S1 marked `// new`, + S2/S3 shell, grid, overlay keys) (`locale.label`, `common.notAvailable`, `state.loading|empty|error|retry`) in `CRM_APP/app/src/ui/i18n/ar.ts` (marked `// new`) was written by the worker, not taken from the handoff. Native review? → Recommend: quick review by you.
5. Fonts: handoff gives font stacks only (system fallback; nothing loaded). Self-host font files? → Recommend: keep system stacks for MVP.
6. Dark `disabledBg` conflict: CRM prototype #1A2230 vs Design System #202936. Used CRM value. → Recommend: keep CRM value.
7. Mobile data grids (≤720px) stay horizontally scrollable tables (per RTL_RESPONSIVE), not card lists. → Recommend: keep.
8. API gaps G1–G6 (`CRM_APP/MVP_UI_IMPLEMENTATION_MAP.md` §7) were worked around client-side; e.g. Leads KPI strip/score columns omitted (no API fields). Schedule a bounded API slice after MVP? → Recommend: yes, post-MVP, separate approval.
9. Security note: a worker printed the LOCAL synthetic dev DB credentials (worktree `.env`, loopback 127.0.0.1:55432 only) into its own tool output once. Not written to any file/commit. Rotate local dev creds? → Recommend: yes, cheap — recreate the local cluster/.env (off-Drive, synthetic).
