# TSST — CURRENT STATUS

Project Key: `TSST`  
Project Name: `The Systronic Smart Agents`  
Last Updated: `2026-10-08`  
State: `BASELINE_FROZEN`  
Confidence: `Operating Baseline v0.1 frozen; readiness NOT_READY until C7`

## Current Phase

`TSST-001 — Foundation & Agent Operating Model`

## Active Gate

`TSST-001A — Requirements & Governance Intake` — `CLOSED` 2026-10-05 (user approval).

`C7` live-project pilot on VILL Studio — phase 1 (C7-VILL-01..06) `DELIVERED` 2026-10-05; phase 2c `C7-VILL-11` (final identity from approved logo) `DONE` (codex, Lead-accepted 2026-10-05; user approved colour direction, template execution not approved); `C7-VILL-12` Brand Guidelines v1.0 (24 pp.) codex done 2026-10-05, Lead review: system accepted as base, book not client-ready, round 2 needed (not yet issued). TSST Core v0.2 (ADR-003/004) merged to master `eac4446` (PR #6) 2026-10-05.

2026-10-07: C7 is now also the live training ground for CREATIVE_AG (TSD-019). Rules were installed, the VILL palette was corrected to petrol `#01304A`, direction B was chosen, the post-01 layered carousel was built (PREVIS), and the dresser-01 product track was paused by the user after studio round 2.

2026-10-08 (TSD-021): the user rejected VILL showcase-01 v1 (overlays and a template look). The team got a showcase grammar (no overlays on project photos, solid dark-petrol type grounds, logo on the cover and the last slide only) and new craft skills for typography (SK-005) and composition (SK-004), with tools. VILL brand fonts were corrected to Alexandria + Inter. v2 direction is approved; v3 (Inter + Alex Brush accent) awaits owner review.

## Current Objective

Complete TSST onboarding and freeze the first operational baseline before treating the agent team as production-ready.

## Confirmed Baseline

- Project key: `TSST`.
- Display name: `The Systronic Smart Agents`.
- TSST is isolated from other Real Memory projects.
- `TSST Lead` is the lead/orchestrator and primary user-facing agent.
- Seed specialist agents: `CREATIVE_AG`, `LENS_AG`, `SPARK_AG`.
- The first operational interaction must continue requirements/onboarding before broad autonomous execution.
- Real Memory gradual-sync rules apply.
- Fixed team roster = runtime agents in Claude Code and Codex (`tsst-lens/spark/creative/dev` + `tsst-reader`), generated from `TSST/context/roster.yaml`; skills via `TSST/skills/index.yaml`; rules R1–R10 (TSD-014, TSD-015). Gemini/Antigravity retired.

## Open / Not Yet Frozen

All eleven items frozen in Operating Baseline v0.1 (2026-10-05): `TSST/TSST_OPERATING_PROFILE.md` v1.1, `TSST/TSST_DECISION_RIGHTS.md` v1.1, intake record `TSST/onboarding/INTAKE_TSST-001A.md`. Still open by design: numeric KPI baselines (set at end of C7); user-deferred items (revenue model, client qualification, market priority).

## Pending Tasks

1. C7 phase 2c: Lead issues `C7-VILL-12` round 2 (fix list in `LEAD_REVIEW_C7-VILL-12.md`) → Lead re-review → user acceptance; native review of `VERBAL_IDENTITY_v1.0.md` (user).
2. First real job under the new Creative rules (TSD-019) validates them end-to-end. Before any paid launch, re-verify the platform specs in `TSST/CREATIVE/gemini/GEM-CR-001_out.md`.
3. VILL showcase-01 v3 visuals APPROVED by the user (2026-10-08), along with the Lens CHANGED lines. Still open before posting: the new AR caption lines (native review), the unverified LinkedIn "most clients" claim, and the CTA channel. The C7-VILL-12 round 2 must use petrol `#01304A` and Alexandria + Inter (the draft says navy and Cairo).
4. At C7 end: first KPI review (quality, cost, speed, commercial) and readiness reassessment.

## Blockers

- Production readiness stays `NOT_READY` until the C7 pilot is completed and reviewed.

## Next Recommended Action

Lead issues `C7-VILL-12` round 2 → review → user accepts brand guidelines + native-reviews verbal identity. Then commit the PILOTS assets and run the C7 KPI review.

## State as of 2026-10-04

Applied via RM-CS-001 (CS-01), user approval in chat 2026-10-04. Sources: packets `TSST-SYNC-20260928-0711-DEV_AG`, `TSST-SYNC-20261001-1301-CRM-M0-DECISIONS`, `TSST-SYNC-20261002-0040-CRM-M0-CLOSURE`, `TSST-SYNC-20261002-0129-CODEX-WORKER-GOVERNANCE`; repo evidence `f54fbf6`, `93bd92a`, `3bd3fcb`, `a926b9d`, `4ff20bd`; `TSST/decisions/TSST-ADR-002.md`.

- Team: TSST Lead + `LENS_AG`, `CREATIVE_AG`, `SPARK_AG`, `DEV_AG`. `DEV_AG` is governance-`APPROVED` (ADR-002); all specialists remain `NOT_READY`.
- Operating hierarchy: see TSD-012 (`APPROVED`; changes hierarchy only, not readiness or autonomous authority).
- Operating spine: `TSST/context/boot.md` + `TSST/core/portfolio.yaml`.
- CRM is a T.SAG project; milestones M0, M1, M2 are `CLOSED` (pointer: `TSST/brands/t-sag/projects/crm/project.md`). CRM status is a separate product-workstream pointer, not the global TSST next action. Recover latest CRM state from TSST/brands/t-sag/projects/crm/project.md; UI work is paused pending TSST Core acceptance; M3/provider/deployment work is not approved by these packets.
- Gate `TSST-001A` `CLOSED` 2026-10-05; Operating Baseline v0.1 frozen (TSD-013).
- Reviewed: nine Google-native packet exports in RM-CS-002 (9/9 registered hashes match). CS2-01..04 applied 2026-10-04 with user approval; all other packet claims rejected or deferred per `TSST/brands/t-sag/projects/tsst-ai/rm-cs-002.md`; packets stay in `incoming/`. Original Google Docs were not independently compared.