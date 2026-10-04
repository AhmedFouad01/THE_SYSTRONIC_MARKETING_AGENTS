# TSST-PILOT-002 — VILL Studio Strategy Baseline (C7 live-project pilot)

Status: BRIEF + PLAN — awaiting user approval before any specialist runs · 2026-10-05
Brand: `vill-studio` (isolated) · Gate: C7 · Baseline: Operating Baseline v0.1 (TSD-013)

## Brief
- **Goal:** close VILL-001 with ONE approved Strategy Baseline that consolidates the existing VILL strategy work.
- **Sources (canonical, read-only):** `drive:Real Memory/real-memory-os/USERS/AHMED_FOUAD/PROJECTS/VILL_STUDIO/` — read the `.md` export beside each Doc (`PROJECT_MASTER`, `CURRENT_STATUS`, `DECISIONS`, `MILESTONE_LOG`, `CHANGELOG`, `VILL_STUDIO_PROJECT_INSTRUCTIONS`).
- **User decisions (chat 2026-10-05):**
  - VILL-ADR-003: Kitchen-first is the acquisition entry layer; company scope stays full interior design / fit-out. (Was a working interpretation; now user-approved.)
  - Numbers: use the existing planning figures, each marked `ASSUMPTION`, plus a list of the actual numbers still needed.
  - Language: Arabic + English mix (terms in English).
- **In scope:** positioning, audience/segments, offer architecture (Kitchen-first → whole home), acquisition + conversion journey, content and paid-media structure, measurement plan, 8-week roadmap, unit-economics model as assumptions, open decisions.
- **Out of scope:** new brand facts, Brand Look/visual identity, image/video generation, publishing, spend, client contact.
- **Rules:** FACT / ASSUMPTION / HYPOTHESIS / RECOMMENDATION labelled; every FACT cites its source file; no generic copy; no other brand.
- **Acceptance:** one document `STRATEGY_BASELINE_v0.1.md` (≤ ~6 pages) + `OPEN_DATA_REQUESTS.md`; independent review passed; Lead acceptance; user approval.

## Plan
| # | step | owner (team) | runtime · model | output |
|---|---|---|---|---|
| 1 | Draft the baseline from the sources | LENS (marketing) | codex · gpt-6.1-sol medium (WORK) | `STRATEGY_BASELINE_v0.1.md`, `OPEN_DATA_REQUESTS.md` |
| 2 | Independent review: paid media + measurement (SPARK lens), positioning/brand coherence (CREATIVE lens) | SPARK + CREATIVE | gemini · Gemini 3.8 Flash high (WORK) | `REVIEW_v0.1.md` (≤ 40 lines) |
| 3 | Revise once on the review | LENS | codex · same | v0.2 |
| 4 | Acceptance (DEEP) | Lead | claude · main | accept / return with criteria |
| 5 | User approval → VILL change set (ADR-003 accepted, VILL-001 closed) proposed for the canonical Docs | Lead → user | — | change set; user applies in the Docs |

No spend; all tasks FAST/WORK tier. Reviewer runtime ≠ producer runtime.

## C7 measurements (first KPI review)
- Quality: review findings by severity; rounds to Lead acceptance; user verdict.
- Cost: models used per step (bus log) and runtime turns.
- Speed: elapsed time brief → user approval.
- Commercial: n/a for a baseline document — recorded as not measurable in this pilot.
