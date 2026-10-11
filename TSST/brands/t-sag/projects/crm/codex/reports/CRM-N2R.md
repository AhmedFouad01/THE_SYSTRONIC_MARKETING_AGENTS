# CRM-N2R - Workspace and disclosure behavior
Status: technically complete within approved catalog limitation; NOT_READY; Lead acceptance/visual review pending.
Commit: b2612914036e04268daab880ea536087dc274808 (feat/crm-v3-nav-import).
Files (14): CRM_APP/app/src/App.tsx; api/{index.ts,session.ts,session.test.ts,workspaces.ts,workspaces.test.ts}; features/properties/hooks.ts; ui/i18n/{ar.ts,en.ts}; ui/shell/{AppShell.tsx,WorkspaceSwitcher.tsx,disclosures.ts,disclosures.test.ts,shell.css} (paths under app/src).
Environment: C:/Work/tsst-crm-codex/CRM_APP; Node 24.18.0/npm 12.2.0; 2026-10-07; npm ci not repeated.
Check lint: final PASS exit 0; 298 files; first attempt 2 dependency errors + 1 warning corrected, no suppressions; no second failure.
Check typecheck: final PASS exit 0; both server/app tsc --noEmit commands.
Check test:unit: final PASS exit 0; 43 files, 496 tests, 0 failed (+21 tests versus N1).
Check build: final PASS exit 0; 180 Vite modules plus server/assets; existing >500kB bundle warning.
Evidence: C:/Users/10/AppData/Local/Temp/crm-n2r-{lint,typecheck,test-unit,build}.log; initial lint evidence crm-n2r-lint-first.log.
done_when switch: each remembered option and chosen target rechecks GET /v1/session; fresh flags published only after authorization; failed/revoked/mismatched actor/stale responses fail closed.
done_when reload/reset: actor+tenant+grant component key remounts features/shell, clears selections/drawers/future local import drafts, drops URL record handoffs before publishing; assignees/schema probes reload per context.
done_when persistence: disclosure choices persist per actor/tenant/grant in best-effort localStorage; active route/aliases reopen ancestors; saved choices survive pending older-server permission probes.
done_when mobile/RTL: pinned desktop context plus mobile topbar/More context; single-column scrollable right-docked sheets, logical nesting, explicit return-focus refs and workspace announcements; existing reduced-motion/focus-trap implementation reused.
done_when agency: selecting a direct context clears prior grant; explicit validated grant tuple stays attached; agency/rep/reader manager badges stay denied; backend rights are unchanged.
Workflow evidence: connect A then connect B through the existing gate records both; switches revalidate using current actor token; single remembered context shows context with no switch action.
Approved deviation: no authorized workspace directory/names in baseline; root approved actor-bound previously validated tab-local contexts (maximum 20) with isolated tenant-ID display, no invented names or discovery API/migration.
API contract evidence (005): unchanged session schema/envelopes/authorization; existing adapter now forwards AbortSignal; read-only calls have 10s deadlines, no retries/writes; history is never authority and contains no credentials.
Unit coverage (011): target capability/reset sequencing, history restore, revoked options/current access, actor isolation, grant clearing, arbitrary-target denial, abort/network errors, stale switches, disclosure restoration/aliases.
Verification (015): all four checks freshly rerun after final persistence fix; cached diff whitespace check PASS; 14 files LF; unrelated CODEX_BRIEF_P1A_S5.md untouched.
Remaining unverified: live API/DB tenancy and actual 375px/RTL focus/layout; no UI suite/manual smoke per brief. Actual import draft screens begin I1R and remain inert until I3R.
Skills used: TSST-DEV-SK-005 (producer/consumer and bounded authorization contract); TSST-DEV-SK-011 (deterministic state/adapter tests); TSST-DEV-SK-015 (current-version acceptance evidence).
Skills skipped: none. skill_friction: none. No bus changes, secrets, port changes, push/merge/rebase/deploy.
