# CRM-I1R - Upload and mapping
Status: technically complete; NOT_READY; Lead acceptance/visual review pending.
Commit: 63aa776bbc813cca7c3e2324005d5dd53a636588 (feat/crm-v3-nav-import).
Files (20): CRM_APP/{IMPORT_CONTRACTS.md,src/import.ts,tests/import-inspect.unit.test.ts}; app/src/{App.tsx,api/index.ts,router.ts,ui/i18n/{ar.ts,en.ts},ui/shell/{AppShell.tsx,navigation.ts,navigation.test.ts,shell.test.ts},features/imports/{ImportWizard.tsx,api.ts,api.test.ts,draft.ts,draft.test.ts,imports.css,model.ts,model.test.ts}}.
Environment: C:/Work/tsst-crm-codex/CRM_APP; Node 24.18.0/npm 12.2.0; 2026-10-07; npm ci not repeated.
Check lint: final PASS exit 0; 307 files; first semantic/control-regex findings corrected without suppressions.
Check typecheck: final PASS exit 0; both server/app tsc --noEmit.
Check test:unit: final PASS exit 0; 47 files, 516 tests, 0 failed (+20 versus N2R).
Check build: final PASS exit 0; 185 Vite modules plus server/assets; >500kB bundle advisory.
Evidence: C:/Users/10/AppData/Local/Temp/crm-i1r-{lint,typecheck,test-unit,build}.log; initial outputs retained as *-first.log; no check failed twice.
done_when gated route: direct /imports loads the existing authorized /fields contract before any upload/sample UI; agency denied; CSV/XLSX input/drop zone only accepts contract formats.
done_when targets: fixed/custom labels, types and select options come from /fields; required/duplicate/unknown/out-of-range mappings rejected; user/read-only/archived/sensitive unauthorized targets excluded.
done_when limits: pre-read file size <=5MiB; authoritative guarded parser enforces 5000 rows/100 columns/20k cell chars and existing archive/encoding limits; adapter rejects malformed or oversized response shapes.
done_when defaults: XLSX first sheet defaults to 1 with index/name override; blank country keeps server default, Arabic digits normalize; owner defaults to caller with existing authorized assignees.
done_when bidi samples: first three original-numbered raw rows use Bdi; filename/header/option values isolated; samples display <=120 chars, ISO date/type hints and EN/AR copy; formula-like text never evaluated.
Approved deviation: additive writes-free POST /v1/imports/inspect was necessary for unmapped samples; strict schema/shared reader/parser; existing crm.import+crm.write/no-agency gate runs before decoding/parsing.
Compatible /fields addition: sensitive_mapping exposes existing read+write authority; absent/false conservatively hides email/phone and sensitive custom targets. No CRM matching, writes, migrations or dependencies added.
Staged delivery: sidebar Import remains inert until I3R; /imports is explicitly accounted as staged rather than claiming all routes have navigation; preview/commit remain unavailable.
Draft lifecycle: one actor/tenant/grant memory scope preserves same-context reauthentication; actual scope switch/disconnect clears bytes, samples and mappings; stale/aborted inspection cannot update scope.
Test evidence (011): actual CSV/XLSX inspect handler with denied-before-parser injection, hard/schema failures; mapping authorization/duplicate/limits; adapter payload/base64; draft/route coverage.
Contract audit (005): bounded producer/consumer envelopes, strict inspect request, unchanged preview/commit schema and backend authority; optional authority field fails closed; safe field errors/request references.
Verification (015): all four C checks freshly passed after parser-order/lint corrections; cached diff whitespace PASS; 20 task files committed LF; unrelated CODEX_BRIEF_P1A_S5.md preserved.
Remaining unverified: live API/DB gate and actual mobile/RTL layout/focus; UI suite/manual visual smoke prohibited by brief; Lead reviews later.
Skills used: TSST-DEV-SK-005; TSST-DEV-SK-011; TSST-DEV-SK-015. Skills skipped: none. skill_friction: none. No bus/secret/port/push/merge/rebase/deploy actions.
