# TSST — PROJECT DECISIONS

## TSD-001 — Use `TSST` as the project key

- Date: `2026-09-23`
- Status: `ACCEPTED`
- Decision: The Real Memory project key is `TSST` and the display name is `The Systronic Smart Agents`.

## TSD-002 — Keep TSST isolated

- Date: `2026-09-23`
- Status: `ACCEPTED`
- Decision: TSST has its own Real Memory project folder and must not absorb durable memory from THE_SYSTRONIC or client/product projects by default.

## TSD-003 — TSST Lead is the orchestration layer

- Date: `2026-09-23`
- Status: `SEED / TO VALIDATE DURING ONBOARDING`
- Decision: `TSST Lead` is the primary user-facing orchestrator above specialist agents.

## TSD-004 — Initial specialist agents

- Date: `2026-09-23`
- Status: `SEED / TO VALIDATE DURING ONBOARDING`
- Decision: Initial specialist agent names are `CREATIVE_AG`, `LENS_AG`, and `SPARK_AG`.

## TSD-005 — Onboarding before broad execution

- Date: `2026-09-23`
- Status: `ACCEPTED`
- Decision: TSST Lead must complete a structured requirements/governance intake and freeze the first operating baseline before TSST is considered production-ready.

## TSD-006 — Gradual Real Memory sync

- Date: `2026-09-23`
- Status: `ACCEPTED`
- Decision: Meaningful memory updates use `RM_SYNC_NOW`, enter the TSST gradual-sync inbox, are reviewed, and are applied only after explicit approval.

## TSD-007 — DEV_AG registration

- Date: `2026-10-04`
- Status: `ACCEPTED` (governance registration only; DEV_AG remains `NOT_READY`)
- Decision: `DEV_AG` (Software Engineering & Solutions) is registered under TSST Lead per `TSST/decisions/TSST-ADR-002.md` (user approval 2026-09-28). No PILOT_READY/PRODUCTION_READY status or autonomous authority is granted.
- Source: packet `TSST-SYNC-20260928-0711-DEV_AG`; apply authority RM-CS-001 CS-02 (user approval in chat 2026-10-04).

## TSD-008 — CRM custom-build foundation

- Date: `2026-10-04`
- Status: `ACCEPTED` (boundary only)
- Decision: CRM is a custom-build T.SAG project. This entry records the boundary only; CRM architecture decisions live in `CRM_APP/ADR-001.md`.
- Source: packets `TSST-SYNC-20261001-1301-CRM-M0-DECISIONS`, `TSST-SYNC-20261002-0040-CRM-M0-CLOSURE`; repo `f54fbf6`, `93bd92a`, `3bd3fcb`, `a926b9d`, `4ff20bd`; RM-CS-001 CS-02.

## TSD-009 — Temporary Codex workers are not TSST agents

- Date: `2026-10-04`
- Status: `ACCEPTED` (user approval in chat 2026-10-04, final Session 2 review)
- Decision: Temporary Codex workers are execution tools and are not TSST agents.
- Source: packet `TSST-SYNC-20261002-0129-CODEX-WORKER-GOVERNANCE` (self-labelled proposed); RM-CS-001 CS-02 / C3.

## TSD-010 — Portable boot, thin runtime adapters, logical tiers

- Date: `2026-10-04`
- Status: `ACCEPTED`
- Decision: TSST uses a portable boot context (`TSST/context/boot.md`), thin runtime adapters, and logical model tiers rather than runtime-specific duplication.
- Source: RM-CS-001 CS-02 (user approval in chat 2026-10-04).

## TSD-011 — Brand-first pointer registry

- Date: `2026-10-04`
- Status: `ACCEPTED`
- Decision: Brand/project knowledge is organized in a brand-first pointer registry (`TSST/brands/`) with on-demand memory loading and no duplication of source content.
- Source: RM-CS-001 CS-02 (user approval in chat 2026-10-04).

## TSD-012 — Operating hierarchy

- Date: `2026-10-04`
- Status: `APPROVED` (user approval in chat 2026-10-04; changed from PROPOSED in RM-CS-001)
- Decision: Operating hierarchy: TSST LEAD; MARKETING managed by LENS (SPARK remains the Performance / Paid Media specialist capability under MARKETING); STUDIO managed by CREATIVE; BUILD managed by DEV. Changes operating hierarchy only; does NOT change specialist readiness or grant new autonomous authority.
- Source: RM-CS-001 CS-02.

Note: RM-CS-001 labels these D-007..D-012; they are numbered TSD-007..TSD-012 here to match this file's convention.

## TSD-013 — Operating Baseline v0.1 frozen; TSST-001A closed

- Date: `2026-10-05`
- Status: `APPROVED` (user approval in chat 2026-10-05)
- Decision: Freeze Operating Baseline v0.1 from the TSST-001A intake (mission, success order quality → cost → speed, runtime/tool decision rights, independent cross-runtime review, single reroute on failure, end-of-phase reporting, no new agents before C7) and close gate TSST-001A. Does NOT change readiness (`NOT_READY`) or validate any skill; next gate is the C7 pilot on VILL Studio.
- Source: `TSST/onboarding/INTAKE_TSST-001A.md`; `TSST/TSST_OPERATING_PROFILE.md` v1.1; `TSST/TSST_DECISION_RIGHTS.md` v1.1.

## TSD-014 — Fixed team roster, central skill index, enforced Skill Plan

- Date: `2026-10-05`
- Status: `APPROVED` (user approval in chat 2026-10-05)
- Decision: The TSST team agents are the runtime agents; generic tier workers retired. One skill entry point `TSST/skills/index.yaml`; ≤3 skills per dispatch via a Skill Plan; skill gaps go through intake `TSST-CTX-SK-023`; rules R1–R10. Agents are fixed, skills evolve. No readiness change.
- Source: `TSST/decisions/TSST-ADR-003.md`; `TSST/core/rules.md`.

## TSD-015 — Runtime-neutral roster for Claude + Codex; Antigravity retired

- Date: `2026-10-05`
- Status: `APPROVED` (user approval in chat 2026-10-05)
- Decision: One neutral roster (`TSST/context/roster.yaml` + `agent-contract.md`) generates Claude and Codex agents; logical tier → model per runtime and plan (Claude Pro / ChatGPT Plus) only in `TSST/bus/runtimes.yaml` and adapters; Gemini/Antigravity retired.
- Source: `TSST/decisions/TSST-ADR-004.md`; PR #6 → master `eac4446`.
