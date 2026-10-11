# CRM-G1 — R08 single user-content names
Commit: 24d13520cf2999a82c5f044eb315297b135d8706 (feat/crm-review-fix2); no push/merge.
Migration: 027; scalar JSONB labels/descriptions, originals retained, alternate audit notes; RLS/ACL intact.
Done-when R08: one label through API/validation/search/import/dialog/display; dir=auto/Bdi; pipeline/stage names already single.
UI chrome remains AR/EN, including untouched system labels; renamed labels stay verbatim.
Tenant primary_language: en/ar; existing tenants default en (no earlier language field); empty preferred values fall back.
Checks D green: lint 384 files; typecheck 2 configs; unit 686/686 (69 files); build pass; DB 213/213, 0 skipped.
DB: crm_lane_fix2 only; full suite, populated 027 rehearsal, ar/en/fallback/audit/RLS regressions and migration replay pass.
BUILD_PLAN_v3 S2: authoritative primary specs file updated from AR/EN definitions to one user name plus bilingual chrome.
Skills used: TSST-DEV-SK-006 migration/recovery; TSST-DEV-SK-005 scalar contracts; TSST-DEV-SK-011 regression/full verification.
Runtime/model: Codex; dispatched gpt-6.1-sol/high (no runtime introspection). Readiness remains NOT_READY.
skill_friction: none. Wrapper/logs: C:/Work/crm-fix2-lane.mjs and crm-g1-{db,unit,build}-final.log; existing untracked files preserved.
