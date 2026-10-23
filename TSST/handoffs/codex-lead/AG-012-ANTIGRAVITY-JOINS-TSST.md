# AG-012 — Antigravity joins TSST as a team runtime (ADR-005 draft + wiring + self-probe)

Owner decision (Ahmed, 2026-10-23, chat): Antigravity comes back into TSST; heavy work goes to Antigravity and Codex,
the Claude Lead reviews. This reverses TSST-ADR-004 point 4 for Antigravity only.
Model: Gemini Pro (highest you have), effort High. Folder `C:\Work\TSST`, branch master (R21). No push, no spend.
TEAM: build · AGENT: DEV_AG (system wiring) · TIER: WORK. Reply in 3 lines, Egyptian Arabic, + Skills used / skill_friction.

## Read (only these)
`AGENTS.md`, `TSST/core/rules.md`, `TSST/decisions/TSST-ADR-004.md`, `TSST/context/adapters/gemini.md`,
`TSST/context/adapters/codex.md` (the model to copy), `GEMINI.md` (first 10 lines), `TSST/bus/runtimes.yaml` (gemini block).

## Do
1. `TSST/decisions/TSST-ADR-005.md`, Status: PROPOSED (the Lead approves): Antigravity = TSST team runtime (ROLE A).
   Limits stated plainly: no sub-agents and no self model switch, so every brief names TEAM / AGENT / SKILLS / TIER and
   the model; the Lead splits work into steps and reviews. The permission-prompt and no-mobile reasons from ADR-004 stay
   known costs.
2. Rewrite `TSST/context/adapters/gemini.md` like `codex.md`: entry, tier → model table from YOUR model picker (list
   what you actually have, never from memory), how you load skills (`TSST/skills/index.yaml`, ≤3 per task), memory
   access, report format. Replace the RETIRED banner in `GEMINI.md` with a 2-line pointer to boot via `AGENTS.md` →
   `TSST/core/rules.md` → that adapter.
3. `TSST/bus/runtimes.yaml` gemini: `status: active` + tier map; `TSST/core/rules.md` §4 line on external tools:
   Antigravity is no longer listed there (Gemini app, ChatGPT stay ROLE B).
4. Self-probe `TSST/handoffs/codex-lead/AG-012-PROBE.md` (≤40 lines): for a sample task "write 3 Instagram captions
   for ANVIL creatine week" say which team, agent, skill ids and tier you would use, which files you loaded, and what
   you could NOT do. Do not do the task.
One commit: `feat(tsst): Antigravity back as team runtime (ADR-005 proposed, adapter, runtimes, probe)`.
