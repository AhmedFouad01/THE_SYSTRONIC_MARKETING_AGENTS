# TSST global lessons

Reusable lessons learned across brands. Generalised wording only — no client names,
private facts, prices, or customer data.

## promotion_gate

A mistake is recorded first where it happened:
- brand-specific → `TSST/brands/<brand>/rules.md` (`## Lessons`)

It becomes a **global lesson candidate** only if all hold:
1. wording is generalised and contains no confidential brand/customer information
2. it applies beyond one brand
3. there is evidence or repeated confirmation
4. it does not conflict with `TSST/core/rules.md`

Candidates are listed below with status `CANDIDATE`; the TSST Lead (DEEP tier) or the
user promotes them to `ACCEPTED`. A stable, procedural lesson is then folded into the
relevant reusable skill and the entry here keeps only a pointer.

## Lessons

| id | status | lesson | evidence | folded into |
|----|--------|--------|----------|-------------|
| L-001 | ACCEPTED | Preserve/composite exact approved logos instead of regenerating them when identity fidelity is required. | CREATIVE production standard (2026-09-24) | `TSST/CREATIVE/CREATIVE_PRODUCTION_STANDARD.md` |
| L-002 | ACCEPTED | Different runtimes loading different entry files causes drift; all runtimes must boot from one portable core with thin adapters. | TSST core consolidation 2026-10-04 | `TSST/context/boot.md` |
| L-003 | ACCEPTED | Google-native Docs (`.gdoc`) are unreadable in filesystem runtimes but readable via Drive-connected runtimes; treat as a runtime capability gap (bridge/export), not as missing state. | consolidation 2026-10-04 (Claude runtime read failure) | `TSST/context/bridge.md` |
| L-004 | CANDIDATE | Delegated work counts as TSST team work only if the worker prompt names the routed team agent and its skill packages (boot steps 11–12) and the report cites skill IDs per finding/change; generic workers without team skills skip TSST quality gates. | t-sag/crm MVP UI build 2026-10-05: S0–S8 ran on generic workers with no DEV_AG/CREATIVE skills; user flagged quality and UX gaps | — |
| L-005 | ACCEPTED | Diagram / blueprint work (system maps, flowcharts, roadmaps) needs its own skill: type choice, sizing, review and MagicPath drawing; method skills for campaigns, IA or research planning do not cover it. | friction-log 2026-10-09: LENS-SK-001 (VB-1, VB-2), CREATIVE-SK-008 (VB-3), CREATIVE-SK-020 (VB-3 r2); owner approved 2026-10-09 | `TSST/CREATIVE/skills/tsst-creative-sk-031-diagrams-visual-blueprints/` |
| L-006 | ACCEPTED | One branch per track (R21). Mixed tracks on one branch + unpushed local-only work + raw design masters in git = costly cleanup. Before any first push: backup gitdir, gitleaks full history, blob-size check (<100MB GitHub hard limit), dry-run; raw masters (tif/psd/ai/big png) stay on Drive and are gitignored; filter-repo only in a fresh clone with `--refs <pushed>..<branch>` (it strips signed merges otherwise). | repo cleanup 2026-10-11: anvil branch carried 13 non-ANVIL commits; CRM 122 commits never pushed; 185MB TIF blocked push; fixed by scan → push CRM → scrub anvil → R21/R22 | `TSST/handoffs/repo-cleanup/` |
