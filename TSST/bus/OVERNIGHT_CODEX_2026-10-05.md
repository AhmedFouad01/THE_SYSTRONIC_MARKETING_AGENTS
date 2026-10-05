# Overnight run — Codex (2026-10-05)

The user is asleep. Nobody will answer. Work until both tasks are done or truly blocked.

1. `python TSST/bus/bus.py claim C7-VILL-10 --me codex --model "<your model>" --hours 10` → follow its spec (BRIEF Phase 2b).
   After each step: `bus.py progress C7-VILL-10 --me codex --note "<done; next>" --hours 10`.
2. Finished → `bus.py done C7-VILL-10 --me codex --result TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/assets/README.md`.
3. Stuck on something only the user could answer → do NOT wait: choose the most conservative option, write it under "Assumptions" in the README and continue. Truly blocked (tool/capability failure) → `bus.py block C7-VILL-10 --me codex --note "<reason>"`.
4. Then (done or blocked) claim `ANVIL-R02` the same way and do it. Brand isolation: never mix VILL and ANVIL files, assets or wording.
5. Never: publish, spend, contact anyone, edit Real Memory, edit files outside the task write scope, run git commands other than `git status`. Write text files with LF.
6. Use spawned agents on the model the bus prints if useful; keep the main session as coordinator.
