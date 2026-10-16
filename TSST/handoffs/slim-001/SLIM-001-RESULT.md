# SLIM-001 result — 2026-10-16

Scope: Ahmed-approved slimming plan (Claude chat). Branch `tsst-core/owner-rules`. Plan + preflight receipt beside this file.
Skills used: TSST-CTX-SK-007, TSST-CTX-SK-001. skill_friction: none.

Done
- Start = `AGENTS.md` + `TSST/core/rules.md`: 1,079 words (was 4,461 core + ~3,000 boot-step files, 18 steps).
- 42 rules → 5 core sections; task packs `TSST/core/rules/{delivery,creative,build,marketing}.md`; R-numbers kept as IDs.
- Full original rules.md + AGENTS.md verbatim: `TSST/decisions/rules-history.md` (nothing deleted).
- `boot.md` 18 steps → 5 (reference only); `CLAUDE.md`, adapters, `tsst-router` skill repointed. No code changed.

Evidence: spine 25/29 (same 4 pre-existing failures as baseline: brand paths, brand model names, VILL-W1/CRM bus rows, ANVIL router case); bus, enforcement (24), preflight, gen --check, skill-index, runtime-agents, friction, neutrality-exempt: PASS.

Open
- Adapters still ~400–500 words (now on-demand, not startup); deeper trim not done.
- `workflow.md` unchanged (on-demand reference).
- `preflight.py` crashes printing Arabic on a cp1252 console unless `PYTHONIOENCODING=utf-8` (not fixed; DEV item).
- Cold-start test not run yet: `COLD-START-TEST.md`.

do_not_repeat: don't re-split rules; don't edit rules-history.md.
Next: Ahmed runs the Codex cold-start test, then commit/merge decision.
