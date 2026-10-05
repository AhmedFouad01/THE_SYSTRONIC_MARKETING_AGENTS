# CRM MVP UI Implementation Map (CRM_UI_HANDOFF -> CRM_APP)

Status: DRAFT for TSST Lead decision. Read-only analysis; no code changed. Branch feat/crm-mvp-ui.
Sources: CRM_UI_HANDOFF/CLAUDE.md, docs/ui-system/{IMPLEMENTATION_SEQUENCE,ACCEPTANCE_GATES,UI_ARCHITECTURE,COMPONENT_CONTRACTS,DESIGN_TOKENS,RTL_RESPONSIVE,CRM_DATA_WORKSPACE}.md, prototype/*.tsx|css; CRM_APP README, package.json, src/api.ts, src/crm.ts, src/journey.ts, M1/M2_CONTRACTS.md, MVP_SCREEN_INVENTORY.md, CRM_MVP_SPRINT_PLAN_v0.1.md (Wave 5/7).

## 1. Current state
- Stack: Node 24.18, TS 7.0.2 (NodeNext, strict), plain `node:http` server `src/api.ts` (242 lines), `pg` is the ONLY runtime dep. Dev deps: biome, playwright, tsx, typescript, @types.
- Web UI: 3 hand-written single-file HTML pages in `web/` (inline CSS + inline vanilla JS, no build, no framework, no shared module). `src/api.ts:75` serves exactly `/` (index.html, Arabic-first), `/foundation`, `/reporting` via `readFile` per request. `npm run build` = `tsc` + `scripts/build-assets.ts` (just copies web/ and migrations/ to dist/). No static-asset route exists.
- Screens today: `/` = one view-switcher (overview, contacts, leads, deals, tasks, audit, outbox, pipeline+automation config, contact detail/journey/duplicates/merge, deal transition+history, task complete); `/reporting` = campaign perf, conversions, orders, contact journey, publish calculation; `/foundation` = M0 proof (not MVP nav). Auth = paste token + tenant (+grant) into form; headers Authorization/X-Tenant-ID/X-Grant-ID; writes need Idempotency-Key.
- API envelope: `{data,next_cursor?,request_id}`; errors `{code,safe_message,request_id,retryable}`. Lists = 50 rows, cursor only. NO server-side search/filter/sort/page-size params (only `cursor`; src/crm.ts:466).
- Endpoints usable by UI (M1_CONTRACTS/M2_CONTRACTS): GET /v1/session (actor + configure/merge/audit flags), /assignees; contacts, leads, deals, tasks (GET list/POST, GET/PATCH id, expected_version); contacts/{id}/journey|duplicates; POST contacts/merge-previews|merges; POST deals/{id}/transitions, GET deals/{id}/history; GET/POST pipelines (stages+transitions embedded); automations; audit; outbox; GET /v1/conversions, /v1/journey/{orders,campaigns,...}, /v1/reports/campaign-performance; POST /v1/journey/calculate.
- Prototype (CRM_UI_HANDOFF/docs/ui-system/prototype): all four exist as readable exports. CRMMVPSharedArchitecture.tsx (76 KB, React, single `import React` + css; routes only Leads/Contacts/Deals), SystronicUIDesignSystem.tsx (97 KB, tokens/primitives), 2 css. Pipeline/Tasks/Dashboard/Reporting are NOT in the CRM prototype (only sequence-listed); compose from design system.
- Handoff target dirs: `src/ui/{theme,tokens,icons,primitives,shell,data-grid,i18n}` and `src/features/{leads,contacts,deals,pipeline,tasks,dashboard,reporting}`.
- Env: no `node_modules` content in Drive checkout (only desktop.ini); no `.env` (only `.env.example`). Tests/DB not runnable here (see 5).

## 2. Target mapping (MVP screens -> API)  [GAP kinds: UI / API / M3]
| Screen / component | API available | GAP |
|---|---|---|
| Tokens/theme Light+Dark, AR/EN locale+dir, icons, primitives, AppShell, overlays | none needed | UI (all new; web/ has ad-hoc CSS) |
| Connect/session gate (token, tenant, grant) | GET /session | UI (restyle inside shell; no real auth product = M0 limit) |
| Leads data-workspace (search, saved views, sort+aria-sort, columns, density, multi-select, pagination, master-detail, empty) | GET/POST/PATCH leads, assignees | UI. API: no server search/filter/sort/page size -> client-side over loaded cursor pages (decision D3). Saved views = client-side only (D3) |
| Bulk "Assign to me" | PATCH leads/{id} owner_id + expected_version; session.actor | UI (N sequential PATCHes; no batch endpoint; partial-failure UX) |
| Contacts workspace + detail/journey/duplicates/merge | contacts*, merge-previews, merges | UI |
| Deals workspace + Lead->Contact->Deal context | deals*, contacts, leads | UI |
| Pipeline (Kanban/stages, transitions, Lost reason) | pipelines, deals, POST transitions, history | UI (Phase 3.1; client groups deals by stage; allowed edges from pipeline.transitions) |
| Tasks / Follow-up (due filters, complete, create) | tasks*, automations | UI (due filter client-side) |
| Dashboard / KPI widgets | none dedicated | API GAP: no aggregate endpoint. MVP: derive from list pages + campaign-performance, or defer (D4) |
| Reporting (decision-first, drill-down) | /reports/campaign-performance, /conversions, /journey/orders, calculate | UI (port web/reporting.html logic) |
| Global search / command palette | none | API GAP (server search); UI client-side only over loaded data; palette = Wave5 priority 10, optional |
| New Lead form | POST /leads (inline contact) | UI (Phase 4 wiring) |
| Import | none (no import endpoint) | API missing -> out of MVP; render disabled |
| Email / Call actions | none | M3 (connectors) -> render disabled with explicit label |
| Audit / Outbox views | GET /audit, /outbox | UI (admin area, permission-gated; secondary) |
| Pipeline/automation config | POST pipelines, automations | UI (admin area; keep) |

## 3. Proposed slices (one coding session each; gate IDs from ACCEPTANCE_GATES A..G)
Each slice also runs `npm run lint`, `typecheck`, `build`; regressions: existing test:db + 3 specs stay green.
- S0 Tooling/skeleton (Phase 0+1.0). Create client workspace (per D1), build pipeline, static/SPA serving in `src/api.ts` (assets route, fallback for /leads etc., keep `/foundation` and `/reporting` working until replaced). Gate: G (regression). Test: playwright smoke that `/` and `/foundation` still load; unit test for static route path-traversal safety (non-DB).
- S1 tokens/theme/i18n/icons (Phase 1.1-1.3). `ui/tokens` (values from DESIGN_TOKENS + prototype Tokens type), `ui/theme` (light/dark, prefers-reduced-motion), `ui/i18n` (AR/EN dict, dir, Intl formatting, `<bdi dir=ltr>` helper), `ui/icons` (24x24/2px, directional mirror flag). Gates: A, D, G(parity). Test: unit (token parity light/dark key sets, EN/AR dict key parity, bidi helper); no hex outside tokens lint check.
- S2 primitives + AppShell (1.4-1.5). Button(4 intents, loading/aria-busy), Input(error/aria-invalid), Badge, Panel, Tabs(roving, RTL arrows), state patterns, AppShell (nav, mobile bottom nav <=720, connect gate, language/theme toggle). Gates: A, B, C, D, E. Test: playwright keyboard+focus-visible, AR/EN x 360/1280 (reuse ui.spec patterns), axe optional.
- S3 overlays + data-grid primitives (1.6-1.7). Dialog (aria-modal, trap, Esc, return focus), Menu/Popover, Toast; DataGrid (search, filter, sort+aria-sort, column visibility, density, select, page, empty). Gates: B, C, F. Test: component-level unit (sort/filter/selection model separate from detail selection) + playwright dialog/menu keyboard.
- S4 Leads workspace (Phase 2.1) in `features/leads`: list, saved views (All/My/Unassigned), master-detail, Assign-to-me, New Lead form. Gates: A-G. Test: playwright leads journey AR+EN, 360+1280, version conflict + permission denied states.
- S5 Contacts (2.2): list/detail/journey/duplicates/merge, sensitive identifiers gated. Gates: A-G. Test: playwright contact + merge preview flow.
- S6 Deals (2.3) + Lead->Contact->Deal context preservation. Gates: A-G. Test: playwright create deal from lead retains context.
- S7 Pipeline (3.1): stage columns (h-scroll mobile), transition via menu (keyboard-operable, not drag-only), Lost reason dialog, history. Gates: B, C, D, E. Test: playwright transition + invalid-edge + stale 409.
- S8 Tasks/Follow-up (3.2): list, due filters, create, complete, automation-generated tasks visible. Gates: A-G. Test: playwright task create/complete.
- S9 Reporting (3.4): port /reporting views into `features/reporting`; retire web/reporting.html only after parity. Gates: A-G. Test: adapt tests/m2-ui.spec.ts to new DOM.
- S10 Dashboard (3.3) per D4; KPI widget (neutral/navy/magenta, max 1-2 emphasized). Gates: A, D, E, G. Test: playwright render + empty/error.
- S11 Admin (audit/outbox/pipeline+automation config) + disabled-control audit (Import/Email/Call explicit disabled). Gates: B, G. Test: assert no enabled control without handler (scripted DOM check).
- S12 E2E gate (Sprint Wave 7): New lead -> Contact -> Deal -> Pipeline -> Task -> Won/Lost -> Journey -> Reporting, AR+EN, desktop+360, no direct DB. Gates: all. Then remove obsolete web/*.html + update README/EXPORTS.yaml.
Note: prior ui specs (tests/ui.spec.ts, m1-ui.spec.ts, m2-ui.spec.ts) target old DOM; migrate per screen slice, do not delete before replacement passes.

## 4. Decision points for Lead
- D1 Framework/build. Evidence: prototype is React TSX (single-file, MagicPath generated); handoff CLAUDE.md mandates split modules + `ui/` and `features/` layout; web/ is inline vanilla with no build; deps pinned exact; no static serving. Recommend: Vite + React + TS (exact-pinned) client in new `CRM_APP/app/` (own tsconfig, DOM lib) with `app/ui`, `app/features` mirroring handoff names; build output to `dist/web/`; `src/api.ts` gains a small static/SPA route only. Reasons: prototype reuse, no logic rewrite; keeps server tsconfig (NodeNext, no DOM) untouched. Reject placing under `src/` (server tsc include would typecheck client with wrong settings). Alternative vanilla TS+esbuild: smaller deps but discards prototype reuse; not recommended.
- D2 Dependency install on Drive. node_modules is empty here and README says Drive can reject npm writes. Recommend: build/verify in a local non-Drive copy per README fallback, hash-compare back; ADD deps requires Lead approval (react, react-dom, vite, @vitejs/plugin-react, @types/react*, optionally vitest + axe).
- D3 Data-workspace limits: API has no search/filter/sort/size. Recommend client-side over loaded pages (load-more/auto-fetch to bound), saved views in localStorage per tenant+actor, and NO API change in MVP; log "server-side search/filter" as a bounded API gap for later (Sprint rule: API change must go to Lead first).
- D4 Dashboard: no aggregate endpoint. Recommend minimal dashboard from existing lists + campaign-performance, labelled as loaded-sample if paginated; or defer to after S9. Lead to choose; no new endpoint without approval.
- D5 Routing/serving: recommend path routes (/leads, /deals, ...) with SPA fallback; keep `/foundation` and `/reporting` until S9. Language default stays Arabic RTL (README) with theme/light default; confirm.
- D6 Auth gate stays token/tenant paste (M0 limitation); confirm no auth product work.

## 5. Test/run baseline (this checkout, 2026-10-05)
- Scripts: lint (biome), typecheck (tsc --noEmit), build, test:db (needs Postgres via .env DATABASE_URL/admin URL; compose.yaml = postgres:17.10 on 127.0.0.1:55432, or native fallback scripts/native-local.ps1), test:ui (playwright, webServer=`npm run api`, needs DB too), test:bootstrap (needs embedded PG binaries), test = all.
- Not runnable here: `node_modules` empty (Drive) and no `.env`. `npx tsc --noEmit` -> "not the tsc command" (typescript absent; npx used the stub). `npx biome lint` and `npx tsx --test tests/native-bootstrap.test.ts` resolved via npx download; bootstrap test FAILED (assertion /Prior bootstrap password preserved/ undefined) = environment (no PG binaries/deps), not a code finding. No non-DB unit test suite exists today (all tests need DB or browser).
- Last recorded green baseline (M2_EVIDENCE): lint PASS 26 files, typecheck PASS, npm test 82 passed (64 DB, 4 bootstrap, 14 Chromium), build PASS. Not re-verified here.
- Action before S0: create local non-Drive verification copy, `npm ci`, run `local.ps1`/native-local (Lead authorizes DB start), re-establish 82/82.

## 6. Lead decisions (2026-10-05, user instruction "build the CRM MVP"; user asleep — reversible, local-only)
- D1 ACCEPT: Vite + React + TS, exact-pinned. Client root `CRM_APP/app/` (own tsconfig, DOM lib); handoff layout mirrored as `app/src/{ui,features}`. Build → `dist/web/`. Server gets static/SPA route only.
- D2 ACCEPT: dev deps react, react-dom, vite, @vitejs/plugin-react, @types/react, @types/react-dom (+ vitest for non-DB unit tests). No new runtime server deps. Work in git worktree `C:\Work\tsst-crm-mvp` (off Drive); node_modules/.env/DB stay off Drive.
- D3 ACCEPT: client-side search/filter/sort over loaded pages; saved views in localStorage keyed tenant+actor. No API change. Server search = logged future gap.
- D4: Dashboard derived client-side from lists + campaign-performance, labelled "loaded sample" when paginated; built after S9; no new endpoint.
- D5 ACCEPT: path routes + SPA fallback; keep `/foundation`, `/reporting` until S9 parity. Default Arabic RTL, light theme.
- D6 ACCEPT: token/tenant paste gate stays; no auth product work.
- Boundaries: no deploy, no push/merge without user, no M3, no redesign; local loopback dev DB only with script-generated synthetic credentials.

## 7. API gaps found during build (no server change in MVP; future bounded API work)
- G1 leads payload lacks contact name → UI resolves via bounded GET /contacts.
- G2 leads.owner_id NOT NULL → "Unassigned" view is always empty.
- G3 VALIDATION_FAILED has no per-field detail → form-level error only.
- G4 owner filter keyed on display name (duplicate names collapse).
- G5 prototype Leads KPI strip + score/value/activity columns have no API fields → omitted.
- G6 no server search/filter/sort (D3) · no dashboard aggregate (D4) · no Import endpoint.
- G7 GET /contacts lacks identifiers/created date → no email/phone grid columns; /session has no sensitive-data flag (UI infers from redaction/403).
- G8 journey returns M2 business events (not M1 audit rows); /duplicates returns id/display_name/version only; merge-preview `conflicts` is free text → client computes field results (target wins).
- G9 deals have no created_at/updated_at and list is id-ordered → no "updated" column/newest-first; deal payload lacks contact/owner/stage names (client-resolved); contact picker limited to loaded pages.
