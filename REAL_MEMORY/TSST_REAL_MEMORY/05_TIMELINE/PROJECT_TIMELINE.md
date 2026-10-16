# TSST — PROJECT TIMELINE

| Date | Event | Status | Next |
|---|---|---|---|
| 2026-09-23 | TSST isolated Real Memory project initialized | Done | Connect TSST folder to ChatGPT Project |
| 2026-09-23 | Initial Project Instructions created | Done | Start `TSST_SETUP_CONTINUE` |
| 2026-09-23 | `TSST-001A — Requirements & Governance Intake` opened | Active | Complete onboarding and approve baseline v0.1 |
| 2026-09-28 | DEV_AG approved (governance registration, ADR-002; NOT_READY) | Done | Route technical scope only as needed |
| 2026-10-01 | CRM custom-build M0 baseline | Done | Close M0 |
| 2026-10-02 | CRM M0 closed (`f54fbf6`), M1 closed (`93bd92a`) | Done | M2 |
| 2026-10-03 | CRM M2 delivered; CRM UI/UX sprint | Done | Close M2 |
| 2026-10-04 | CRM M2 closed (`a926b9d`, `3bd3fcb`) + hardening (`4ff20bd`) | Done | Next milestone per user |
| 2026-10-04 | TSST core consolidation session 1 | Done | `TSST-001A` still OPEN; baseline v0.1 awaits user approval |
| 2026-10-05 | C7 phase 1 delivered (VILL Strategy Baseline v0.2 + Brand Look Direction v0.2) | Done | Phase 2c |
| 2026-10-05 | TSST Core v0.2 merged (ADR-003/004, PR #6 `eac4446`) | Done | C7-VILL-11 |
| 2026-10-05 | C7-VILL-11 issued to codex / studio (final VILL identity from logo) | Open | Lead review |
| 2026-10-11 | Delivery System gap found (Codex week-01 work outside the system) → rules R18–R20 wired into every runtime (`0f95d46`, TSD-023) | Done | — |
| 2026-10-11 | Job layout unified (`3fc8b57`); VILL active jobs moved into the brand (`2e42b03`) | Done | — |
| 2026-10-11 | Delivery System v1.1 (plan sections, JOBS.md sync) + week-01 DELIVERY pages VILL/ANVIL (`0829776`, `9688160`) | Done | Owner review |
| 2026-10-11 | JOB_LAYOUT owner-approved (`a54ca35`) + new_job.py scaffold (`5973ad7`) | Done | Use for every new job |
| 2026-10-11 | Repo cleanup: mixed tracks / 122 unpushed CRM UI commits / 185 MB TIF → gitleaks no real secrets, CRM + spike backups pushed, ANVIL scrubbed, master linear, six merged local branches deleted; final two TSST commits relocated locally. R21 branch per track, R22 one Lead memory, R23–R40 migrated from Claude memory. Evidence: lessons.md L-006; TSST/handoffs/repo-cleanup/ | Done; local Step 4 | Lead reviews STEP4-RESULT; no CRM merge or new push |
| 2026-10-12 | Owner-authorized REVIEW-001 repairs and recent process simplification (TSD-027 / ADR-006): shared packet/preflight, strict scope/friction/delivery checks; source preservation and regression evidence in REPAIR-001-RESULT | Implemented on TSST feature branch; no master merge or runtime readiness claim | Initial Claude read-only review done; bus findings fixed and locally reviewed (24 tests); final delta egress approval pending; end-to-end parity unverified |
| 2026-10-12 | TSST workflow repairs saved on tsst-core/owner-rules as e5579c7 +80e94dc; canonical checkout returned to vill-studio per owner; unrelated WIP retained | Feature only; no master merge | Initial Claude review done and findings fixed;24 regressions +61 protocol assertions PASS; final delta sending approval pending; full parity unverified |
