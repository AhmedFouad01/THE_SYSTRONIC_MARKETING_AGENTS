# CRM-I3R - Commit and result ledger
Status: technically complete; NOT_READY; Lead acceptance/visual review pending. Final Track A task; stop here.
Commit: 7411549be304154b80585940c68f0c0c5ee4a080 (feat/crm-v3-nav-import).
Files (21): CRM_APP/app/src/{App.tsx,api/{client.ts,client.test.ts},router.ts,ui/i18n/{ar.ts,en.ts},ui/shell/{navigation.ts,navigation.test.ts,shell.test.ts},features/imports/{ImportResults.tsx,ImportWizard.tsx,PreviewReview.tsx,access.ts,access.test.ts,api.ts,commit.ts,commit.test.ts,draft.ts,jobs.ts,jobs.test.ts,model.ts}}.
Environment: C:/Work/tsst-crm-codex/CRM_APP; Node 24.18.0/npm 12.2.0; 2026-10-08 Africa/Cairo; npm ci not repeated.
Check lint: final PASS exit 0; 317 files; first effect-dependency finding corrected using explicit retry/replay read generations, no suppressions.
Check typecheck: final PASS exit 0; both server/app tsc --noEmit; first test factory UUID-return inference corrected to API-compatible string key.
Check test:unit: final PASS exit 0; 51 files, 543 tests, 0 failed (+17 versus I2R).
Check build: final PASS exit 0; 191 Vite modules plus server/assets; >500kB bundle advisory.
Evidence: C:/Users/10/AppData/Local/Temp/crm-i3r-{lint,typecheck,test-unit,build}.log; initial outputs *-first.log; no check failed twice.
done_when atomic/synchronous: one POST /v1/imports through existing transaction contract; reviewed body captured before await; command identity locks double-submit; visible synchronous pending state without percent, background jobs, polling or undo.
done_when outcomes: result shows original job/file/format/object/mode/error policy/actor/time and all created/updated/skipped/failed counts; completion announcement; safe rejection/request details; rejected draft stays editable and requires preview again.
done_when uncertainty/replay: cloned reviewed body, file hash and one Idempotency-Key retained; network/5xx/401/invalid-response uncertainty locks inputs and retries identical body/key; replay preserves original job time and explicitly refetches job+ledger despite empty replay error_rows.
done_when ledger/history: history reachable before upload and after result; next_cursor pages at 50 jobs; outcome-filtered next_after pages at 200 rows; bounded previous/next pages, loading/empty/read errors and existing CRM return links.
done_when reauth: memory retains draft, pending command/request across same actor/tenant/grant reauth/unmount; actual scope switch/disconnect clears; stale response cannot publish after clear/reopen or overwrite newer command.
done_when live/gates: /imports now live CRM/More leaf; App requires scope+session-bound validated GET /fields preflight, pending/error/403 fails closed; cosmetic configure/merge flags cannot expose it; agency hidden; direct screen gates object before samples.
Policy gates retained: current fields/owner allowlist validates retained mappings after reauth; fresh preview required for input/policy changes; stale/all-zero/all-invalid/abort-error states cannot submit; valid duplicate skips may create ledger-only jobs.
Contract audit (005): existing commit/job/list/row schemas, atomicity/content idempotency and authority unchanged; optional validated client nextAfter appears only for next_after envelopes, preserving other shapes; strict IDs/counts/file identity/paging and safe errors.
Test evidence (011): double-submit, exact body/key uncertain retry/replay, definite abort/401, same-context reauth, switch/reopen/discard stale responses, mismatched file, 50/200 bounds, cursor/filter IDs and actual fields-adapter preflight/denial/staleness.
Verification (015): final C passed corrected code; cached diff whitespace PASS; 21 task files LF committed; unrelated CODEX_BRIEF_P1A_S5.md untouched.
Localization: EN/AR result/policy/outcome/paging copy; original times formatted by locale helper; IDs/files/raw reasons Bdi, counts localized, logical existing mobile row layout reused.
Deviations: no server/session authority projection, API route, migration or dependency changes; live nav conservatively requires contact /fields authority, selected object screen gates remain independent.
Remaining unverified: live API/DB commit/replay/paging and mobile/RTL/focus rendering; UI suite/manual smoke prohibited. Approval deadline interrupted 3 final checks and report write before execution; permitted retries, no bypass.
Skills used: TSST-DEV-SK-005; TSST-DEV-SK-011; TSST-DEV-SK-015. Skills skipped: none. skill_friction: none. No bus/secrets/port/push/merge/rebase/deploy actions.
