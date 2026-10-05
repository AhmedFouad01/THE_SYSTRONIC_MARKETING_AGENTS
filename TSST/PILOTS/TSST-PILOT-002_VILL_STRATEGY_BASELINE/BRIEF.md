# TSST-PILOT-002 — VILL Studio Strategy Baseline + Brand Look (C7 live-project pilot)

Status: PLAN APPROVED by user 2026-10-05 (with scope change below) · Brand: `vill-studio` (isolated) · Gate: C7 · Baseline v0.1 (TSD-013)

## Brief
- **Goal:** close VILL-001 with ONE approved Strategy Baseline and a written Brand Look direction, consolidating existing VILL work (no new discovery).
- **Sources (canonical, read-only):** `drive:Real Memory/real-memory-os/USERS/AHMED_FOUAD/PROJECTS/VILL_STUDIO/` — read the `.md` export beside each Doc (`PROJECT_MASTER`, `CURRENT_STATUS`, `DECISIONS`, `MILESTONE_LOG`, `CHANGELOG`, `VILL_STUDIO_PROJECT_INSTRUCTIONS`). Existing VILL materials are a floor to exceed, not approved finals.
- **User decisions (chat 2026-10-05):**
  - VILL-ADR-003 (refined): company scope = full interior design / fit-out. **Content strategy covers the whole scope.** Kitchen-first applies to **paid acquisition**: ads may run kitchen campaigns as the entry offer.
  - Numbers: existing planning figures, each marked `ASSUMPTION`, plus a list of actual numbers still needed.
  - Language: Arabic + English mix (terms in English).
  - Brand Look is in scope as a written visual direction; image/video generation is a separate step needing user approval.
- **Out of scope:** new brand facts, image/video generation (until approved), publishing, spend, client contact.
- **Rules:** FACT / ASSUMPTION / HYPOTHESIS / RECOMMENDATION labelled; every FACT cites its source file; no generic copy; no other brand; LF line endings.

## Steps (bus tasks)
| task | step | team | runtime · model | output (this folder) |
|---|---|---|---|---|
| C7-VILL-01 | Strategy Baseline draft | LENS (+SPARK capability) | codex · gpt-6.1-sol medium | `STRATEGY_BASELINE_v0.1.md`, `OPEN_DATA_REQUESTS.md` |
| C7-VILL-02 | Independent review (SPARK: paid/measurement; CREATIVE: positioning coherence) | SPARK + CREATIVE | gemini · Gemini 3.8 Flash high | `REVIEW_STRATEGY_v0.1.md` |
| C7-VILL-03 | One revision on the review | LENS | codex · gpt-6.1-sol medium | `STRATEGY_BASELINE_v0.2.md` |
| C7-VILL-04 | Brand Look direction from the baseline | CREATIVE | gemini · Gemini 3.8 Flash high | `BRAND_LOOK_DIRECTION_v0.1.md` |
| C7-VILL-05 | Independent review of the Brand Look | CREATIVE QA | codex · gpt-6.1-sol medium | `REVIEW_BRAND_LOOK_v0.1.md` |
| C7-VILL-06 | Revise Brand Look on review (added 2026-10-05: review verdict REVISE, 4 MAJOR) | CREATIVE | gemini · Gemini 3.8 Flash high | `BRAND_LOOK_DIRECTION_v0.2.md` |
| — | Acceptance (DEEP) → user approval → VILL change set for the canonical Docs | Lead → user | claude | change set |

Reviewer runtime ≠ producer runtime. No spend; all WORK tier.

### Content requirements
- **Strategy Baseline (≤ ~6 pages):** positioning; segments + areas; offer architecture (full fit-out, with kitchen as paid entry offer and upgrade path to whole home); content strategy pillars across the whole scope; paid-media structure (kitchen campaigns first); acquisition → conversion journey; measurement plan (events, CRM stages); 8-week roadmap; unit economics as ASSUMPTION; open decisions.
- **Brand Look direction (≤ ~4 pages):** brand character and design principles; colour palette (hex + usage); typography (Arabic + Latin pairing); photography/render style; layout and grid principles for social and ads; dos/don'ts; a written moodboard (references described, no generated images); how kitchen-campaign visuals stay inside the whole-home brand.

## C7 measurements (first KPI review)
- Quality: review findings by severity; rounds to Lead acceptance; user verdict.
- Cost: models per step (bus log).
- Speed: elapsed time brief → user approval.
- Commercial: n/a for documents — recorded as not measurable in this pilot.
