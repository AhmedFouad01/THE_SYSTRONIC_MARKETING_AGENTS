# BRIEF · VB-1 — Visual blueprint inventory
ROLE A — team runtime (Codex, TEAM marketing / LENS). Owner goal 2026-10-09: every big project and the TSST system itself gets visual blueprints (system diagram, flowchart, roadmap), drawn later in MagicPath.

**Read (skim, don't deep-read):** `TSST/core/portfolio.yaml`, `TSST/brands/*/projects/*/project.md`, `TSST/brands/*/status.md`, `TSST/context/boot.md`, `TSST/context/bus.md`, `TSST/services/` (catalogue), `CRM_APP/` top level. Search the repo for existing visuals (`*.mmd`, `*.svg`, `*.drawio`, mermaid blocks, "diagram", "flowchart", "roadmap").

**Output** `TSST/handoffs/visual-blueprints/VB1_INVENTORY.md` — one table:
`area | type (system / project / service / process) | existing visuals (path or none) | missing: system diagram / flowchart / roadmap | source docs (paths) | size S/M/L`
Cover: TSST system itself (boot → router → teams → bus → review), each brand project (CRM, SCC, tsst-ai, VILL, ANVIL…), services SV-01..06, delivery system.

**Rules:** facts only from files (cite path); no client-private details beyond names; ≤ 1 page table + 5-line summary. Report `Skills used:` + `skill_friction:`. No commit.
