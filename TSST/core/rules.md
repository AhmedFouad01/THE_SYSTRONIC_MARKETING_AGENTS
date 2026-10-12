# TSST core rules (global)

Apply to every brand, project and runtime. A brand `rules.md` may add stricter rules; it
may never relax these. Historical governance remains in `TSST/TEAM_CONSTITUTION.md` and
`TSST/TSST_DECISION_RIGHTS.md`; where they are more specific, they win.

## Must
1. Run `TSST/context/boot.md`; pointer first, context second.
2. Work on one brand at a time; never load another brand's memory "for context".
3. Recover the latest verified checkpoint before acting; respect `do_not_repeat`.
4. Resolve source access per runtime (`SOURCE_AVAILABLE` / `SOURCE_UNREADABLE_IN_CURRENT_RUNTIME`
   → bridge / `SOURCE_UNAVAILABLE`); never guess missing state.
5. Treat incoming sync packets as proposals until applied through the approval gate.
6. End meaningful work with an evidence-backed checkpoint/handoff.
7. Route work to the lowest sufficient logical tier (`TSST/context/models.yaml`).
8. Keep provider model names out of durable logic; they belong in adapters only.
9. **Team + skills, never ad hoc** (user rule 2026-10-05). Every piece of TSST work is done by
   the routed team (`TSST/teams/<team>/team.md` → its agent file) applying its matched skills
   (boot steps 11–12). A model never works from its own general judgement alone. Deliverables
   state which agent files and skills were applied; the Lead rejects work that shows none.
   On the bus this is enforced by `team`/`skills` fields and `done --skills-used`.

## Team roster & skills (TSST-ADR-003, 2026-10-05)
- **R1 Fixed roster, every runtime.** Deliverables come only from LENS_AG, SPARK_AG, CREATIVE_AG, DEV_AG
  (runtime agents `tsst-lens|spark|creative|dev`) under the Lead. No temporary or generic
  agent delivers TSST work. Roster changes need an ADR.
- **R2 Utility readers.** `tsst-reader` (Claude: also `Explore`) only read, inventory, classify;
  their output is input, never a deliverable.
- **R3 Skill Plan first.** No dispatch without `TEAM / AGENT / SKILLS / NOT_SELECTED / TIER /
  ACCEPTANCE / SKILL_GAP` (template: `TSST/skills/README.md`). Enforced by the dispatch hook
  and the bus.
- **R4 ≤3 skills** per dispatch unless the plan names and justifies more.
- **R5 Index only.** Find skills through `TSST/skills/index.yaml` (team slice). Never load a
  whole registry or every agent file.
- **R6 Lead judges, team executes.** Lead skills (TSST-LEAD-*) are for decision and review;
  execution uses the specialist's method skills.
- **R7 Gap → intake.** No matching skill = `SKILL_GAP` → `TSST-CTX-SK-023`. Never fill a gap
  with the model's general judgement.
- **R8 External skills** = security review → user approval → `UNVALIDATED`. File existence is
  never validation.
- **R9 Evolution.** Skills change by version + changelog line; agents report `skill_friction`;
  promotion only with CTX-SK-018 evidence.
- **R10 Evidence.** Every deliverable lists `Skills used:`; the Lead rejects work without it.

## Usage discipline (TSD-016, 2026-10-06)
Evidence: CRM MVP session audit 2026-10-06 — cost came from re-read context (cache reads up to
~17M tokens per agent with a few k output), "verify + finish" re-dispatches and a 2-day Lead session.
- **R11 One-pass batches.** Size each dispatch so the agent finishes and verifies in one run
  (one slice, explicit file list, explicit test command). A batch that needed a "finish" agent
  is split smaller next time, not re-dispatched whole.
- **R12 Resume, don't restart.** An unfinished agent is continued (SendMessage / same agent
  id) with only the missing step, never re-dispatched from zero to re-read everything.
- **R13 Phase-bounded sessions.** Close the Lead session at each phase end with a short
  handoff/checkpoint (Must 6) and start a new one; no multi-day Lead sessions.
- **R14 Cheapest reader first.** Exploration, inventory and evidence gathering go to
  `tsst-reader` (FAST) before any WORK/CODE agent or the Lead reads widely. Retired or generic
  agents (`general-purpose`, `tsst-*-worker`) are never dispatched.

## Lead ↔ owner conversation (owner rule, 2026-10-09)
- **R15 Clear, short, exact.** Whatever runtime acts as Lead answers the owner clearly, briefly
  and precisely: verdict first, no padding, nothing unverified stated as fact.
- **R16 Ask before dispatch.** While discussing, the Lead asks the owner the open questions and
  confirms scope + cost before delegating to any agent or runtime; no dispatch mid-discussion.

## Daily board (owner rule, 2026-10-09)
- **R17 Locked daily board.** A working day starts when the owner says "ابدأ اليوم":
  `python TSST/daily/day.py collect` → the Lead plans every row (team / agent / skills / tier /
  executor / after / done_when; the owner's manual work = executor `ahmed`) → owner OK → `lock`.
  While locked, work runs only on board rows, one track at a time; any new request is `park`ed
  to tomorrow's inbox. It enters today only with the owner's explicit OK in chat
  (`add --owner-ok --swap <row>`), and the swapped row moves to tomorrow. Day end: `close`
  (unfinished → tomorrow) + project checkpoints (Must 6). Spec: `TSST/daily/README.md`.

## Job home, delivery, sync (owner rule, 2026-10-11)
- **R18 Job home.** Every client job lives in `TSST/brands/<id>/projects/<job>/` and is listed in that brand's project.md. Never create new work in `TSST/PILOTS/` (historical archive, read-only) or `TSST/projects/`. Layout: `TSST/services/delivery/JOB_LAYOUT.md`. Start new jobs with `new_job.py` (`TSST/services/delivery/new_job.py`).
- **R19 Delivery page.** Every job that reaches the owner or client ends with `<job>/DELIVERY.json` → `python TSST/services/delivery/build_delivery.py <job>` → `DELIVERY.html` (client) + `DELIVERY_INTERNAL.html`, per `TSST/services/delivery/README.md` (v1.0). The Lead sends the page, not a folder of markdown files.
- **R20 Same-round sync.** In the same round as the deliverable, update: the job's DELIVERY.json statuses, the brand project.md (job + state), brand `status.md` (Current), and the brand line in `TSST/core/portfolio.yaml`. A job is not done until the four agree. Check: `python TSST/services/delivery/job_check.py <job>`; refresh the brand index with `python TSST/services/delivery/sync_jobs.py <brand>` (generates `TSST/brands/<id>/JOBS.md`; job_check f) fails if it is stale).

## Branch per track (owner rule, 2026-10-11)
- **R21 Branch first.** The moment a brand, product or track comes up (ANVIL, VILL, CRM, SCC,
  skill validation, Motion…), whatever runtime acts as Lead checks `git branch --show-current`
  and, if it doesn't match, proposes switching to that track's branch (or creating
  `<brand|track>/<topic>`) before any commit. Never commit track X on track Y's branch;
  parallel sessions each use their own branch or worktree. Applies to every runtime and agent.

## One Lead memory (owner rule, 2026-10-11)
- **R22 Owner rules live in TSST.** Whatever the owner tells the Lead, in any runtime (Claude,
  Codex, Gemini, Antigravity…), is the same rule everywhere: the Lead writes it here in
  `TSST/core/rules.md` in the same turn. Runtime-private memory (e.g. Claude auto-memory) may
  only point to the rule number, never hold an owner rule that TSST doesn't have.

## Owner rules moved from runtime memory (owner rule, 2026-10-11, R22)
Lead conversation
- **R23 Arabic owner replies.** Every reply to the owner is plain Egyptian Arabic; English only for unavoidable identifiers (paths, IDs, commands), in code spans. Agent English never changes the reply language.
- **R24 Audit scope first.** No audit/review/fix round starts before the owner sees a numbered fix list (item, done-when, rough cost) and says OK. Never open-ended.
- **R25 One next step.** A finished track ends with a short state + at most one proposed next step, not a menu. State token cost before spawning several agents.
- **R26 Lead spends on analysis.** Lead tokens go to understanding, replying, reviewing team packets and skill validation; all doable work goes to the team.
- **R27 Visual first.** Systems, plans and roadmaps are explained with a diagram first; big projects keep a live visual blueprint (CREATIVE-SK-031).
Routing, cost, files
- **R28 Marketing order.** LENS (story/copy) → SPARK (formats/KPIs) → CREATIVE; parallel only when questions don't overlap.
- **R29 Research route.** Broad gathering, long reads and web research go first as a Gemini app request (ROLE B, paste-ready); launch-blocking facts are re-verified on the live official page.
- **R30 Plan first, light reviews.** Spec before build; per-slice checks stay light; heavy reviews (security, full UI, AR/EN visual gate) only pre-launch.
- **R31 Video fits the package.** Client video defaults to one-pass production, one credit quote, max one re-roll; shot-by-shot QA only for big budgets or training rounds.
- **R32 Limit handoff.** Near a usage limit, keep `TSST/handoffs/LIMIT_FALLBACK.md` current with paste-ready prompts; never hand off spend, publishing, account actions or paid generation.
- **R33 Next free ID.** Before creating any request/handoff/GEM file, list the folder and take the next free number; never overwrite (parallel sessions).
- **R34 Tiny handoff files.** Handoff and bus files are pointer-first, no recaps; enforce format in code, not prose.
- **R35 Log skill friction.** After every team report, a non-`none` skill_friction goes to `TSST/core/friction-log.md`, then run `TSST/context/friction_check.py`.
Creative, product, delivery
- **R36 Owner drafts are the floor.** Raise the owner's draft; keep what he accepted; ask before dropping any element.
- **R37 Measure brand facts.** Before saying something matches a brand, measure it against current approved assets (hex/hue/font) and name what was measured.
- **R38 AI shots, not raw slideshows.** Client raw media is reference only; plan video per shot (reference → AI still → AI video → assembly); confirm the pipeline with the owner first. CREATIVE + MOTION.
- **R39 No native controls.** No product ever ships browser-native unstyled controls (file, date, colour, range, select, checkbox); styled kit components only, stated in every UI brief.
- **R40 Client pages are formal.** DELIVERY.html shows no internal names, tools, IDs, spend gates, rejected work or sources; one language per sentence. Internal detail → DELIVERY_INTERNAL.html.

## Never (without explicit user approval in chat)
- publish, post, spend budget, contact clients, deploy
- durably apply Real Memory changes
- move, merge, duplicate or delete brand Real Memory roots or historical evidence
- expose or store credentials/secrets in memory or repo
- claim PILOT_READY / PRODUCTION_READY beyond `TSST/READINESS_REPORT.md`
- redesign approved work (e.g. MagicPath-approved CRM UI) without a concrete defect

## Creative
- Exact approved logos/brand marks are preserved or composited, never regenerated, when
  identity fidelity is required.
- HTML/browser layouts, prompts, briefs and storyboards are `PREVIS`; final assets require
  render QA through `TSST/CREATIVE/FINAL_ASSET_GATE.md`.

## Naming
- Folders: lowercase-kebab-case. Daily files: short semantic names (`status.md`,
  `project.md`, `checkpoint.yaml`). Long IDs only for immutable audit/history artifacts.

## Scoped owner rule — VILL image delivery (2026-10-12; R22)
For VILL transformed-photo deliveries, show each original source image followed by its final image, clearly paired/grouped and labeled. This requirement is scoped to VILL image work; it does not change unrelated jobs.

Scoped VILL imagery clarification (2026-10-12, R22): premium kitchen finish colors may vary; keep brand color feeling in lighting/grading/accents, not identical literal cabinetry colors. Owner authority and economical image-production preference recorded in `TSST/brands/vill-studio/rules.md`.

Scoped VILL next-round image direction (2026-10-12, R22): distinct bold cinematic concept per kitchen image, unusual camera angles and eye-catching composition; preserve recognizable design/premium brand feeling. Exact owner instruction in VILL brand rules.

## Unified brand delivery (owner rule, 2026-10-12; R22)
All brand work belongs in its canonical project/job under the brand and is shown, with its current status, in the shared brand Delivery System. New campaigns extend that system; they must not introduce a separate campaign-specific delivery system. The brand entry pages link to the shared job pages; refresh them with the job inventory whenever work is added or its status changes.

## External production with Lead review (owner rule, 2026-10-12; R22)
- **R41 Owner-approved external production.** Use the accepted method in `TSST/context/external-production.md`: confirm the brief with Ahmed; Lead handles direction and review; Ahmed bridges an English bounded request to Antigravity/Gemini. Stage 1 produces images and a comparison report only. Stage 2 integrates approved images into the existing brand Delivery System only after separate owner approval/request. Save readable requests, reports and review decisions. Reuse across brands, including ANVIL, with their own approved identities and product invariants. No automatic rerolls, unrestricted external writes, publication or unmeasured savings claims. External tools remain ROLE B, not TSST runtimes.

## Canonical workspace and runtime parity (owner rule, 2026-10-12; R22)
- **R42 Canonical workspace and runtime parity.** Ahmed requires work in the original repository `G:/My Drive/THE_SYSTRONIC_MARKETING_AGENTS` and its canonical TSST/Real Memory, with the active track branch visible beside the repository in the app. A runtime-local copy or worktree is not a replacement for the canonical workspace or its uncommitted state. TSST workflow, team routing, skills, approvals, delivery and memory rules are the same in Codex and Claude; only documented runtime access/tool mechanics may differ. Verify the actual workspace and branch; never claim that a shell working-directory change or a separate worktree changed the app binding. Preserve existing WIP; if it prevents switching, report the blocker before changing or hiding that WIP.
Source: Ahmed's explicit instruction in Codex chat, 2026-10-12 (Africa/Cairo): show the working branch beside the repo; keep work and memory in main TSST; the general working method must not change between Codex and Claude.
