# MARKETING team — manager LENS_AG

Scope: research · strategy · positioning · messaging · content & campaign planning ·
customer/market intelligence · performance reasoning · measurement coordination · Radar.

Agents: `TSST/LENS/AGENT.md` (manager) · `TSST/SPARK/AGENT.md` (performance capability)

## Skill map (existing packages, no moves)
| need | skill |
|---|---|
| research plan | `TSST/LENS/skills/tsst-lens-sk-001-research-planning` |
| evidence grading | `TSST/LENS/skills/tsst-lens-sk-002-source-validation-evidence-grading` |
| competitors | `TSST/LENS/skills/tsst-lens-sk-003-competitor-intelligence` |
| customer / ICP / JTBD | `TSST/LENS/skills/tsst-lens-sk-004-customer-icp-jtbd` |
| positioning / messaging | `TSST/LENS/skills/tsst-lens-sk-005-positioning-messaging` |
| marketing / content / campaign plan | `TSST/LENS/skills/tsst-lens-sk-006-marketing-planning` |
| paid media strategy | `TSST/SPARK/skills/tsst-spark-sk-001-paid-media-strategy` |
| measurement | `TSST/SPARK/skills/tsst-spark-sk-002-measurement-architecture` |
| attribution | `TSST/SPARK/skills/tsst-spark-sk-003-attribution-fundamentals` |
| Meta | `TSST/SPARK/skills/tsst-spark-sk-004-meta-campaign-creative-fundamentals` |
| Google Search | `TSST/SPARK/skills/tsst-spark-sk-005-google-search-performance-fundamentals` |
| TikTok | `TSST/SPARK/skills/tsst-spark-sk-006-tiktok-ads-fundamentals` |
| runtime orchestration (Gemini) | `.agents/skills/tsst-marketing-orchestrator`, `tsst-lens-strategy`, `tsst-spark-performance` |

## Radar (capability, not an agent) — status UNVALIDATED
Watches signals that could improve TSST: new models/capability changes, tools, pricing,
image/video tooling, agent skills, engineering tools, platform changes.

```
SIGNAL → relevance check → possible benefit → target team → test requirement → route
```
- Record a signal as one row in the brand-neutral log `TSST/teams/marketing/radar.md`.
- Route: visual/video → STUDIO tests · engineering/agents/model routing → BUILD evaluates
  · marketing/platform → MARKETING.
- Adoption only after the target team's test passes; then update the relevant skill/rule
  or `TSST/context/adapters/*` model mapping. Trends without evidence are not adopted.
- Radar never spends, signs up, or installs tools without user approval.

Boundaries: no spend, publication or client contact without user approval.
