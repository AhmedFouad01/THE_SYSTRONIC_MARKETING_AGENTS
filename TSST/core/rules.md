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
