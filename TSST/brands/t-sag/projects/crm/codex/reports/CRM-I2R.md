# CRM-I2R - Preview and policy
Status: technically complete; NOT_READY; Lead acceptance/visual review pending.
Commit: bbc25d08aa1c312ae572813ce36359b340db15eb (feat/crm-v3-nav-import).
Files (11): CRM_APP/app/src/features/imports/{ImportWizard.tsx,PreviewReview.tsx,api.ts,api.test.ts,imports.css,model.ts,model.test.ts,preview.ts,preview.test.ts}; app/src/ui/i18n/{ar.ts,en.ts}.
Environment: C:/Work/tsst-crm-codex/CRM_APP; Node 24.18.0/npm 12.2.0; 2026-10-08 Africa/Cairo; npm ci not repeated.
Check lint: final PASS exit 0; 310 files; first 4 index-key/ARIA/effect findings corrected without suppressions.
Check typecheck: final PASS exit 0; both server/app tsc --noEmit; first unknown boolean return corrected.
Check test:unit: final PASS exit 0; 48 files, 526 tests, 0 failed (+10 versus I1R).
Check build: final PASS exit 0; 187 Vite modules plus server/assets; >500kB bundle advisory.
Evidence: C:/Users/10/AppData/Local/Temp/crm-i2r-{lint,typecheck,test-unit,build}.log; initial outputs *-first.log; no check failed twice.
done_when writes-free: POST /v1/imports/preview only; requests 100 sampled rows; existing server parser/authority/duplicate planner unchanged; no commit/job creation call.
done_when rerun: file/bytes/object/inspection/mapping/sheet/country/owner/duplicate/error policy changes clear snapshot and increment revision; request-attempt+revision and abort guards reject edits, cancellation, unmount and superseded results.
done_when policies: Skip duplicates + Skip invalid defaults; Update/Create and Abort selectors; changes require preview again; abort+errors/all-zero/all-invalid/stale/revoked mapping states block readiness, duplicate-only valid rows remain ledgerable.
done_when matching: localized contact email-then-phone/non-merged matching; lead same-contact+case-insensitive-title+not-closed distinction; matching contacts reused even Create; earlier file rows count; no identifiers create unmatched records; ambiguity skip/update explained.
done_when blanks/formulas: blank cells never clear existing values; No change skip explained; formula-like cells remain Bdi plain text with explicit warning; type hints from I1 retained.
done_when errors: localized fixed/property validator codes with unknown safe-message fallback; spreadsheet row/target/status/reason/warnings; focusable summary links affected rows; expandable safe request reference, retryability and API field issues.
done_when samples: shown/total row and invalid counts; both arrays capped at 100 and error_rows_truncated announced; shortened values are explicitly samples, not partial writes; atomic skip-invalid/abort behavior explained.
Contract audit (005): common normalized body snapshots file/mapping/options; preview_rows added only in preview adapter, never stored for commit; object/format/hash/bytes/headers/counts/shape/targets validated; existing API envelope/errors and server authority remain unchanged.
Authority refresh: same-scope draft retained across reauth, but latest /fields mapping allowlist and current owner/options checks feed local reviewGate; denied preview returns CRM gate; actual scope changes still clear all memory.
Test evidence (011): input/policy invalidation, navigation preservation, async stale/cancel gate, skip/abort/invalid/duplicate-only states, revoked sensitive targets, immutable body, malformed/bounded/truncated safe results and writes-free adapter failure.
Verification (015): all four C checks freshly pass corrected version; cached whitespace PASS; 11 task files committed LF; unrelated CODEX_BRIEF_P1A_S5.md preserved.
Deviations: no API/schema/dependency/migration change; proposed paths use existing features/imports structure. /imports remains explicitly staged and sidebar inert until I3R; confirmation unavailable.
Remaining unverified: live API/DB matching and actual mobile/RTL/focus rendering; UI suite/manual visual smoke prohibited. One temporary approval-review usage-limit interruption resolved after parent renewed continuation; no bypass.
Skills used: TSST-DEV-SK-005; TSST-DEV-SK-011; TSST-DEV-SK-015. Skills skipped: none. skill_friction: none. No bus/secrets/port/push/merge/rebase/deploy actions.
