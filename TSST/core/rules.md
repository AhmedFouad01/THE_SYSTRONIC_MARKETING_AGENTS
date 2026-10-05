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
