# CRM-N1 — Navigation restructure
Status: technically complete; NOT_READY; Lead acceptance/visual review pending.
Commit: eaaa3519d846cd2517a998cae8c1273d085f2396 (feat/crm-v3-nav-import).
Files: CRM_APP/app/src/App.tsx; ui/shell/{AppShell.tsx,navigation.ts,navigation.test.ts,shell.css,shell.test.ts}; ui/i18n/{ar.ts,en.ts} (ui paths under app/src).
Environment: C:/Work/tsst-crm-codex/CRM_APP; Node 24.18.0; npm 12.2.0; 2026-10-07.
Check lint: PASS exit 0; 293 files checked, no fixes.
Check typecheck: PASS exit 0; both server/client tsc --noEmit commands.
Check test:unit: PASS exit 0; 41 files, 475 tests, 0 failed; includes 8 new navigation cases.
Check build: PASS exit 0; 177 Vite modules, server/assets build succeeded; bundle >500kB warning.
Other verification: git diff --cached --check PASS; all eight source files written with LF.
Evidence logs: C:/Users/10/AppData/Local/Temp/crm-n1-{lint,typecheck,test-unit,build}.log.
done_when groups: Overview/CRM/Insights/Administration ordered; first three open initially; shared filtered tree renders desktop and More.
done_when nesting/mobile: linked Deals has a separate Pipeline disclosure; Administration > Settings > Properties; four mobile shortcuts plus More; logical nesting and scrollable navigation.
done_when upcoming: six noninteractive badge leaves have no route/href; reserved routes remain rejected; import stays inert until I3.
done_when compatibility: exact ten-route set/aliases asserted; existing nav keys retained; breadcrumb labels follow hierarchy; list/view/router modules unchanged and existing state suites pass.
Permission evidence: denied leaves/descendants/empty groups/mobile shortcuts removed; authorized Properties remains visible for non-managers; Segments/Journeys remain scoped read placeholders.
Deviation: session has no read/import/integration capability projection; inert manager badges use existing configure/merge role defaults and deny agency grants. No new live access is enabled.
Deferred per brief: no UI suite/manual visual smoke; 1440/375/theme/RTL rendering reserved for Ahmed review; workspace persistence/switching/active-branch updates remain N2.
Install: npm ci once; 76 packages, 0 vulnerabilities; npm blocked esbuild postinstall but all checks succeeded.
Skills used: TSST-DEV-SK-005 (session producer/navigation consumer contract audit); TSST-DEV-SK-011 (risk-to-unit coverage); TSST-DEV-SK-015 (fresh C evidence/claim audit).
API audit (005): GET /v1/session requires crm.read; unchanged data={actor,configure,merge,audit,schema_read,property_manage}, auth/tenant/grant headers, typed errors and schema_read absent-flag probe; N1 consumes existing fields only.
API audit evidence: unchanged producer/adapter diff; prior 475-test PASS includes 5 session + 12 client cases and 8 navigation cases; no new calls, writes/retries/cursors/timeouts; live API/DB behavior unverified. Skills skipped: none.
skill_friction: none. No bus mutations, push, merge, rebase, deploy, secret reads or port changes.
