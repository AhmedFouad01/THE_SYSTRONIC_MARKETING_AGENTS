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

## TSD-016 — Usage discipline rules R11–R14

- Date: `2026-10-06`
- Status: `APPROVED` (user approval in chat 2026-10-06)
- Decision: Add usage-discipline rules to `TSST/core/rules.md`: one-pass batches (R11), resume an unfinished agent instead of re-dispatching (R12), phase-bounded Lead sessions with handoff (R13), cheapest reader first and no generic/retired agents (R14). Based on the CRM MVP session audit (46 dispatches; ~10 "verify + finish" re-dispatches; per-agent cache reads up to ~17M tokens). No roster, readiness or authority change.
- Source: `TSST/core/rules.md` § Usage discipline.

## TSD-017 — Local AI reader parked

- Date: `2026-10-06`
- Status: `PARKED` (user decision in chat 2026-10-06)
- Decision: Local AI (Ollama + headless Claude Code, read-only) is not adopted for now. Benchmark of `qwen3:14b` (num_ctx 32768, 5 read-only TSST tasks, one run each): tool calling worked and all cited paths existed, but counts, "latest version" judgements and rule locations were wrong in every answered task; ~108 s/task; VRAM 15.3/16 GB. Haiku baseline not run (CLI auth expired). Next candidate if resumed: `gpt-oss:20b`, reusing the same scripts. Do not repeat the qwen3:14b benchmark.
- Source: `TSST/brands/t-sag/projects/tsst-ai/local-ai-bench/RESULTS.md` (Drive only, not committed).

## TSD-018 — Gemini Desktop as a manual external tool

- Date: `2026-10-06`
- Status: `APPROVED` (user approval in chat 2026-10-06)
- Decision: Gemini Desktop is available as an external tool, not a TSST agent or runtime (not Antigravity; no GEMINI_AG). Any agent may recommend it; the responsible agent prepares the handoff (objective, context, files, references, prompt, constraints, acceptance); the Lead packages it; Ahmed runs it manually and returns the output; the agent reviews and the Lead accepts. Output is input, not a deliverable; creative passes FINAL_ASSET_GATE; no secrets ever; sensitive client data only with explicit user approval + privacy check per request. No roster, routing, readiness or governance change.
- Amended 2026-10-06 (user): data rule changed from "Keep Activity off" to approval + privacy check (Activity off breaks Connected Apps); ADR-004 note moved to Appendix A.
- Source: `TSST/context/adapters/gemini-desktop.md`; `TSST/decisions/TSST-ADR-004.md` Appendix A.

## TSD-019 — CREATIVE_AG live training on VILL; production rules installed

- Date: `2026-10-07`
- Status: `APPROVED` (user direction and approvals in chat 2026-10-07)
- Decision: The main goal is to develop CREATIVE_AG's execution, using VILL Studio as the live training ground. Every creative round delivers the work AND writes its lesson back into the team. Rules installed (all `UNVALIDATED`):
  - `TSST/CREATIVE/INTAKE_GATE.md`: stage 0, 12 blocking fields and 6 questions, no render before they are answered.
  - FINAL_ASSET_GATE: open or measure every asset before writing rules, upscale at most 1.25x, scored self-review.
  - SK-006 v0.2: colours are named by measured hue.
  - SK-008 v0.2: references become a style sheet.
  - SK-010 v0.3: no feature is "invented" without all views plus owner confirmation.
  - SK-011 v0.2: design types and logo on photos.
  - SK-014 v0.7: manual image bridge and product-fidelity protocol. The card captures the signature form first and the owner confirms it. Edit the real photo rather than generating from references. One continuous chat per product. Staged rounds, at most 3 per stage. Owner acceptance may override the numeric gate.
  - SK-019 v0.2: layered build.
  - Tools: `contrast.py`, `phone_preview.py`, `geometry_compare.py`.
  - Examples: EX-001 and EX-002.
- Image production stays a manual bridge via Ahmed (ChatGPT image edit, Magnific premium). Blender (installed) is deferred to a later phase. No runtime has a verified IMAGE capability.
- VILL decisions the same day:
  - The brand main colour is PETROL `#01304A`, not navy. The palette is the 3 logo colours plus deep petrol, terracotta, stone and cream; sage and brass are removed.
  - Direction B, "light leads the eye", with Lugar Nefertiti set-up quality as the floor.
  - The dresser-01 product track was paused by the user after studio round 2.
- Source: `TSST/CREATIVE/TRAINING_STATUS.md`; `TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/DIRECTION_SHEET_v0.1.md`, `products/dresser-01/`; commit `166b084`.

## TSD-020 — Request role for every external tool or runtime

- Date: `2026-10-07`
- Status: `APPROVED` (user direction in chat 2026-10-07)
- Decision: The request decides the role, not the tool. Every request to a tool that can read or write files starts with ROLE A (team runtime: boot, write scope, Skills used) or ROLE B (external tool: not a TSST agent, writes only its output file, edits nothing else). This applies to Codex, ChatGPT, Gemini and any future tool. The trigger was GEM-CR-001, where Gemini labelled itself "Lead/SPARK" and edited TOOLCHAIN.md directly; the Lead reviewed it and accepted it partially.
- Source: `TSST/context/request-role.md`; pointers in the `adapters/` for claude, codex, chatgpt and gemini-desktop.

## TSD-021 — Showcase grammar + typography and composition craft for CREATIVE_AG; VILL fonts corrected

- Date: `2026-10-08`
- Status: `APPROVED` (user direction and approvals in chat 2026-10-08). All rules are `UNVALIDATED` until owner review of real output.
- Trigger: the user rejected VILL showcase-01 v1 ("level not acceptable at all"). The petrol overlays read grey and too light, they were overused behind the logo and text, and every slide used the same template. The user said the team is "completely lost" in typography and in photo composition/layout.
- Decision:
  - Showcase grammar, SK-011/008/006 v0.3:
    - No colour overlays, bands, hazes or vignettes on project photos. Legibility comes from crop and placement.
    - Brand colour as solid fields only. Type grounds use dark petrol `#011C2C`.
    - On-image text on 3–4 slides at most, placed in the photo's own quiet plane.
    - Small Before/After labels.
    - At least 3 layout types per carousel.
    - Logo small on the cover and the last slide only (the user's middle ground).
  - Craft skills:
    - SK-004 v0.2 composition and layout refs (from GEM-CR-005).
    - SK-005 v0.2 typography craft refs (from GEM-CR-006): hierarchy, lockups, pairing and bilingual, checklist.
    - Tools: `text_space.py` (quiet-plane finder plus brand text colour and contrast) and `font_metrics.py`.
    - Script test fonts Allura and Alex Brush (OFL, user-approved download) in `TSST/CREATIVE/fonts/`.
  - Research handling:
    - GEM-CR-003 Part 1 (examples) was rejected as evidence. The patterns were adopted as working rules after the user said "let the team make the right call itself".
    - Gemini requests take the next free GEM number, because parallel sessions collided on GEM-CR-004.
    - Gemini requests must not run shell commands on the PC.
    - Third-party guides (the Visme PDF) live in `TSST/CREATIVE/library/` on Drive, gitignored.
- VILL decisions the same day:
  - Brand fonts are **Alexandria (Arabic) + Inter (English)**, not Cairo/Barlow. The `BRAND_GUIDELINES_v1.0` draft is stale on fonts and colours.
  - Lockup is treatment C, a script accent word inside an Inter line, set in Alex Brush.
  - showcase-01 v2 direction is APPROVED.
  - The slide-5 socket/switch retouch is APPROVED.
  - v3 (Inter + Alex Brush) is built and awaits owner review.
- Source: commits `cb64934`, `d8abbf5`; `TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/showcase-01/REVIEW_v1.md`; Lead review headers in `TSST/CREATIVE/gemini/GEM-CR-003_out.md`, `GEM-CR-005_out.md` and `GEM-CR-006_out.md`; `TSST/brands/vill-studio/assets/ASSETS.yaml`.
- Amended `2026-10-08` (same day): the user APPROVED showcase-01 v3 and the Lens CHANGED lines. Captions are still open (AR lines, the LinkedIn "most clients" claim). Skill statuses stay `UNVALIDATED`; v3 is recorded as field evidence in `TSST/CREATIVE/TRAINING_STATUS.md`.

## TSD-022 — Motion AG: independent video/motion team (MOTION_AG)

- Date: `2026-10-11`
- Status: `APPROVED` (owner approval in chat 2026-10-10/11; governance registration only).
- Decision: new team `motion`, manager MOTION_AG (`tsst-motion`), peer of CREATIVE; skills TSST-CREATIVE-SK-015..018 became TSST-MOTION-SK-001..004 (`UNVALIDATED`); generation manual through the owner; MOTION_AG `NOT_READY`.
- Source: `TSST/decisions/TSST-ADR-005.md`, commit `d5bb15e`.
