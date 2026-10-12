# TSST — CURRENT STATUS

## TSST workflow repair — 2026-10-12 (owner-authorized, TSD-027 / ADR-006)

- **FACT:** REVIEW-001 findings implemented in the canonical Drive repository on `tsst-core/owner-rules`. One shared `TSST/context/workflow.md`, complete seven-field plan checks, canonical workspace/branch preflight, normalized path boundaries, strict friction parsing and manifest-bound delivery status checks replace divergent/incomplete instructions. Actual native agent loading and cross-runtime end-to-end enforcement remain unverified.
- **DECISION:** reuse existing explicit scoped authority; one packet, minimum context, same unfinished specialists, one checkpoint. Manual surfaces without repo/shell prepare the packet; the receiving file-capable host validates before applying it. Direct Lead work needs no dummy bus task; no automatic daily-board startup. No readiness/skill promotion, spend or publication.
- **Branch coordination:** all chats sharing G: share one checkout/branch. Another chat's owner-requested switch to `vill-studio` interrupted the repair branch. The current owner instructed: save the repairs on TSST's feature branch, then return `vill-studio`. This is not evidence of per-chat branches. Core merge/propagation remains a separate reserved action; old checkouts do not automatically receive a feature commit.
- **Evidence and next:** `TSST/handoffs/decisions-review/REPAIR-001-RESULT.md`; `TSST/decisions/TSST-ADR-006.md`. Review the scoped repair commit for integration into the common branch; exercise the actual Claude runtime before claiming end-to-end parity. Existing brand jobs need their next authorized mirror sync for strict delivery PASS; no live brand state was regenerated in this repair.
- **do_not_repeat:** do not rerun historical evaluations, redo completed client work, launch full onboarding or reinstall dependencies for this checkpoint. Earlier dated status/PASS statements below are historical, not fresh validation under the new checker.

## Repo cleanup — 2026-10-11 (owner-approved apply)

- **FACT / problem:** TSST core/delivery and ANVIL work shared the ANVIL branch; CRM UI (122 commits) and the auth spike had never been pushed as backups; a 185 MB rollup TIF blocked a normal ANVIL push.
- **FACT / fixed:** historical cleanup verified gitleaks had no real secrets (one reviewed source-hash false positive), pushed CRM UI + spike, scrubbed ANVIL in a scratch clone, and advanced master linearly. Step 3 deleted six merged local branches and archived the retained spike with a local tag. Step 4 moved the last two unpushed TSST commits (5973ad7 / d97fb10) to tsst-core/owner-rules and reset only the local ANVIL ref with --mixed; pre-existing main-tree WIP hashes stayed unchanged. No push in Steps 3–4; CRM merge remains separate.
- **DECISION:** R21 requires one branch per track; R22 makes TSST the single Lead memory across runtimes; R23–R40 were moved from Claude-private memory into TSST/core/rules.md. No readiness or skill-validation change.
- **Sources:** TSST/core/lessons.md L-006; TSST/core/rules.md R21–R40; TSST/handoffs/repo-cleanup/ (STEP1-RESULT, STEP3-RESULT, STEP4-RESULT). This entry supersedes the older current-status assertion that the 185 MB TIF still blocks the scrubbed ANVIL branch; the original historical text is retained.

## Update 2026-10-11 (evening, owner-approved Real Memory apply)

- **Problem found:** Codex (VILL Lead) ran `marketing-week-01` for VILL and ANVIL without The Systronic Delivery System: VILL work landed in `TSST/PILOTS/`, two different file shapes, no DELIVERY pages, portfolio not synced. Root cause: the Delivery System and the "jobs live inside the brand" agreement were written only in `TSST/services/`, outside the chain every runtime reads.
- **Fixed (Track A, commit `0f95d46`, TSD-023):** core rules R18 (job home `TSST/brands/<id>/projects/<job>/`; PILOTS = read-only archive), R19 (every job ends with `DELIVERY.json` → `DELIVERY.html` + `DELIVERY_INTERNAL.html`), R20 (same-round sync of DELIVERY.json + project.md + status.md + portfolio.yaml). Wired into AGENTS.md, boot, both adapters, tsst-router and all 12 generated agents. Checker: `TSST/services/delivery/job_check.py`.
- **marketing-week-01 (commit `14f7471`):** VILL + ANVIL week-one organic plans by LENS + SPARK, REVIEW DRAFT, not published, no spend. ANVIL first FB post NOT published (owner correction; same Shark page will be renamed). Both fail `job_check` today (no DELIVERY page; VILL in the wrong home).
- **Tracks C/B/D done 2026-10-11:** C `3fc8b57` one job layout (`TSST/services/delivery/JOB_LAYOUT.md`); B `2e42b03` VILL active jobs moved into `TSST/brands/vill-studio/projects/` (showcase-01-reel stays in PILOTS for the owner's AE edit; `PILOTS/.../MOVED.md`); D `0829776` + fix round: Delivery System v1.1 (plan sections, `sync_jobs.py` → `TSST/brands/<id>/JOBS.md`, job_check f), bidi fixes) and DELIVERY pages for both marketing-week-01 jobs, in review. All 4 jobs pass `job_check`. Open: owner review of both pages + Arabic captions; generator does not apply the brand Arabic font yet.
- **Job structure approved + scaffold (owner 2026-10-11):** `TSST/services/delivery/JOB_LAYOUT.md` is the owner-approved standard for every new job (commit `a54ca35`). New jobs start with `python TSST/services/delivery/new_job.py <brand> <job-path> --service … --title …` (commit `5973ad7`): creates README + 00_BRIEF + DELIVERY.json stub, registers the job, runs sync_jobs + job_check; refuses PILOTS paths, existing folders, unknown brands.
- **Session closed 2026-10-11 (R13).** Next Lead session starts from this section. Waiting on the owner: review of both marketing-week-01 DELIVERY pages, Arabic captions, VILL LinkedIn language, ANVIL start date + page rename timing. Restart any open Codex session so it loads R18–R20. Optional later: apply the brand Arabic font in the generator; tighten job_check d) matching; GitHub push blocked by a 185 MB TIF in rollup-pre-hell.
- Brand canonical Real Memory for VILL/ANVIL is Google Docs on Drive (`.gdoc`); not writable from the filesystem runtimes. Repo `status.md` + `portfolio.yaml` carry the state until the owner syncs the Docs.

---

## State as of 2026-10-11 (owner-approved Real Memory apply)

Overall readiness: `NOT_READY` (unchanged). Pointer-first; details live in the cited files.

**Team roster (fixed, runtime agents in Claude Code + Codex, generated from `TSST/context/roster.yaml`):** Lead + `tsst-lens` (LENS_AG), `tsst-spark` (SPARK_AG), `tsst-creative` (CREATIVE_AG), `tsst-dev` (DEV_AG), `tsst-motion` (MOTION_AG, new) + `tsst-reader`.

**Motion AG / MOTION_AG (new, TSST-ADR-005, commit `d5bb15e`, TSD-022):**
- Independent team `motion`, a peer of CREATIVE. CREATIVE_AG no longer owns video or motion; it keeps static design, brand and UI and does the final brand check on video.
- Skills TSST-MOTION-SK-001..004 (formerly TSST-CREATIVE-SK-015..018), all `UNVALIDATED`. Readiness `NOT_READY`.
- Generation is manual through Ahmed (no spend, publication or client contact without approval).
- v1 spec = Balanced setup, run Budget-first: `TSST/brands/t-sag/projects/tsst-ai/motion-ag/LENS-MO-001_*.md` and `SPARK-MO-001_*.md`, Lead-accepted 2026-10-10.
- Next: MOTION_AG writes 6 new motion skills (2 rounds), then a pilot 15 s Egyptian teaser as its first job.

**Work since 2026-10-08 (from `git log`):**
- ANVIL campaign-01: folder, reveal v2 pack, AE text-scene script, Lead handoff to Codex; roll-up Pre-Hell in progress (`TSST/brands/anvil/projects/campaign-01/`).
- Photo-bank tool (local CLIP, all brands) + VILL raw bank of 1,583 sorted photos (`TSST/CREATIVE/tools/`).
- The Systronic Delivery System v1.0 (`TSST/services/delivery/`) and service playbooks SV-01..06 (`TSST/services/`).
- Rules R15-R16 (Lead replies clear/short/exact; ask owner before dispatch) and R17 (locked daily board, "ابدأ اليوم"): `TSST/core/rules.md`, `TSST/daily/`.
- VILL social-setup-01 HANDOVER (owner approved) + SV-01 first-job lessons.
- Skill friction log + repeat detector (`TSST/core/friction-log.md`); code-drawn motion method + HTML-to-MP4 capture tool.
- C7-VILL-12 Brand Guidelines v1.0: unchanged since 2026-10-05, Lead review says system accepted, book not client-ready, round 2 not yet issued (`LEAD_REVIEW_C7-VILL-12.md`).

**Open items:**
- `TSST-001A`: resolved 2026-10-11 — CLOSED 2026-10-05 (TSD-013); portfolio.yaml corrected.
- Motion AG skills and first pilot; all skills remain `UNVALIDATED`.
- C7-VILL-12 round 2; VILL OPEN_DATA_REQUESTS; ANVIL campaign-01 reveal re-run + QA.
- Test baseline `validate_spine` 27/29: failing checks `neutrality` (provider model names in research files) and `bus` (hash mismatches on CRM-PLAN-BUILD, VB-1).

---

Project Key: `TSST`  
Project Name: `The Systronic Smart Agents`  
Last Updated: `2026-10-11`  
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