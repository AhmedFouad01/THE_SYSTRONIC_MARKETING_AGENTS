# TSST-PILOT-002 — VILL Studio Strategy Baseline + Brand Look (C7 live-project pilot)

Status: DELIVERED · user-approved 2026-10-05 (see ACCEPTANCE.md) · plan approved with scope change below · Brand: `vill-studio` (isolated) · Gate: C7 · Baseline v0.1 (TSD-013)

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

## Phase 2 — Brand Look production (approved 2026-10-05)

**Why:** readiness cannot be judged on documents; CREATIVE must produce real assets through `TSST/CREATIVE/FINAL_ASSET_GATE.md`.

**New source of truth (user, 2026-10-05):** VILL has an existing identity. Inputs copied from the user's folder `D:\Work v2\VILL STUDIO\` into `inputs/`:
`Logo.png` (+ `Logo.psd`) = **primary logo**; `inputs/VI/` = VI deck "Dark Luxury DNA" (palette Obsidian #0E0E0F, Ink Blue #0F1E34, Warm Ivory #F2EFE6, Aged Bronze #B07A3C, Smoked Oak #2A2119, Soft Stone #B8B6B0; distribution 60/20/10/5/3/2); `inputs/company-profile/` = profile/portfolio pages (real project photography where present).
- **Decision:** `Logo.png` is primary; the palette is harmonised **around the logo's navy and orange** (exact values sampled from the file), keeping the VI neutrals aligned to them. Same colours, tuned — no new colours.
- `BRAND_LOOK_DIRECTION_v0.2.md` §2 palette and §3 type pair are **superseded** (they were written without these assets); its RTL, proof-claim and kitchen-containment rules stay valid.
- Out of the folder on purpose: the ANVIL financial plan file (other brand), WhatsApp archive.

**Scope:** social templates (carousel 4:5, Reel cover 9:16, single post 4:5 / 1:1) and mockups (kitchen paid-entry ad + whole-home post). Editable source + rendered PNG for each. Image generation on Codex approved by user; prefer real VILL photography from `inputs/`; any generated imagery is labelled CONCEPT (proof rule).

| task | step | team | runtime · model | output |
|---|---|---|---|---|
| C7-VILL-07 | Brand Look v0.3: palette tokens around Logo.png navy+orange (sampled hex) + VI neutrals, contrast table, typography from VI deck + Arabic pair, logo usage | CREATIVE | gemini · Claude Opus 5.5 high | `BRAND_LOOK_DIRECTION_v0.3.md` |
| C7-VILL-08 | Templates + mockups (editable SVG/HTML + PNG renders) | CREATIVE production | codex · gpt-6.1-sol medium (image generation) | `assets/` |
| C7-VILL-09 | Independent CREATIVE QA against FINAL_ASSET_GATE + v0.3 | CREATIVE QA | gemini · Claude Opus 5.5 high | `REVIEW_ASSETS_v0.1.md` |
