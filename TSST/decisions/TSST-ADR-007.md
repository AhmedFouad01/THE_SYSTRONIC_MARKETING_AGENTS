# TSST-ADR-007 — Antigravity joins TSST as a team runtime (ROLE A)

Date: 2026-10-23. Decision owner: Ahmed (owner). Integration owner: TSST Lead.
Status: PROPOSED (Ahmed approves).
Extends: TSST-ADR-003, TSST-ADR-004, TSST-ADR-006.

## Authority
Owner decision (Ahmed, 2026-10-23, chat): Antigravity comes back into TSST; heavy work goes to Antigravity and Codex, the Claude Lead reviews. This reverses TSST-ADR-004 point 4 for Antigravity only.

## Limits
Limits stated plainly: no sub-agents and no self model switch, so every brief names TEAM / AGENT / SKILLS / TIER and the model; the Lead splits work into steps and reviews. The permission-prompt and no-mobile reasons from ADR-004 stay known costs.

## Decision
1. **Antigravity = TSST team runtime (ROLE A)**. Reverses ADR-004 §4 for Antigravity only. Bus runtime ID `gemini`.
2. **Work division**: Heavy execution goes to Antigravity and Codex; Claude Lead reviews, plans, and accepts.
3. **Model routing**: Antigravity UI model picker (Gemini 3.8 Flash, Gemini Pro). Briefs must specify the model and effort because Antigravity cannot switch models dynamically.
4. **Skills loading**: Loaded via `TSST/skills/index.yaml` (≤3 skills per task).
5. **Execution governance**: Follows `TSST/core/rules.md` and shared preflight (`TSST/context/preflight.py`). No spend, no publish, and no git push without explicit owner approval.
