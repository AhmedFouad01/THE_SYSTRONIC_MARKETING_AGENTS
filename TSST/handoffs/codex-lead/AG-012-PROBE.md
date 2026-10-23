# AG-012-PROBE — Antigravity Runtime Self-Probe

Sample Task: "write 3 Instagram captions for ANVIL creatine week"

## 1. Routing & Agent
- Team: marketing
- Agent: `tsst-lens` (LENS_AG)
- Logical Tier: WORK
- Runtime Model: Gemini Pro · high (selected via Antigravity model picker)

## 2. Skills (≤3 per task, indexed via TSST/skills/index.yaml)
- `TSST-LENS-SK-011`: Conversion and brand copywriting (captions, hooks, CTAs)
- `TSST-LENS-SK-012`: Arabic and Egyptian dialect copywriting
- `TSST-LENS-SK-013`: Organic social content system (platform native formats)

## 3. Files Loaded
- Root: `AGENTS.md`
- Core rules: `TSST/core/rules.md`
- Task pack: `TSST/core/rules/marketing.md`
- Brand context: `TSST/brands/anvil/brand.md`
- Current state: `TSST/brands/anvil/status.md`
- Skills bodies:
  - `TSST/LENS/skills/tsst-lens-sk-011-conversion-brand-copywriting/SKILL.md`
  - `TSST/LENS/skills/tsst-lens-sk-012-arabic-egyptian-copywriting/SKILL.md`
  - `TSST/LENS/skills/tsst-lens-sk-013-organic-social-content-system/SKILL.md`

## 4. What Antigravity Could NOT Do
- Cannot publish, post, or schedule content directly to Instagram (R41, reserved to owner).
- Cannot allocate, launch, or spend ad budget (reserved to Ahmed).
- Cannot autonomously spawn or delegate to sub-agents (Claude Lead manages task breakdown).
- Cannot switch models or reasoning effort dynamically during execution (set per brief in UI).
- Cannot mark the task approved or bypass Lead acceptance and owner review in Dash.
