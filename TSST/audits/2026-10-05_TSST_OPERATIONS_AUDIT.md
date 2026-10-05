# TSST operations audit — 2026-10-05

Lead (DEEP) · scope: how TSST actually runs across Claude / Codex / Antigravity, judged on the
last 48 h of real work (bus, C7 VILL pilot, overnight run, CRM session). Not a file-by-file review.

## Verdict
The **plumbing works** (boot, bus, bridge, model tiers, CI, governance) and the **team does not
yet deliver**: when work reached creative quality, runtimes produced generic output because the
team and its skills were never actually in the loop. TSST is `NOT_READY` for client-grade
creative; the cause is fixable process + missing skills, not models.

## What works (keep)
- Pointer-first boot, brand isolation, per-runtime source access; 153 Drive Docs now readable.
- File bus: leases, rounds, protected paths, hashes, independent cross-runtime review — every
  independent review found real defects (strategy 3 MAJOR, brand look 4 MAJOR, assets: gate fail).
- Decision rights + baseline v0.1; CI on every PR; validator 28/28.

## Findings (severity · evidence · fix)
| # | finding | evidence | fix |
|---|---|---|---|
| F1 | **CRITICAL — team bypassed.** Bus tasks pointed at a BRIEF; boot steps 11–12 (team, skills) were skipped by every runtime. | Overnight VILL pack cites no agent/standard/skill; ANVIL R02 cites no skill; user verdict "very weak". | DONE: core rule Must 9; bus enforces `team`/`skills`/`--skills-used`; AGENTS.md + GEMINI.md. Open: Lead acceptance checklist must reject outputs without a "Loaded:" record (F3). |
| F2 | **CRITICAL — skill gaps for the work you sell.** No skills for: presentation & report design; Arabic/English copywriting (social, ads, decks); social-media management (calendar, community, reporting); website / landing pages / Shopify / SEO; photography & shoot direction; video scripting/storyboard. | Inventory: CREATIVE 29, LENS 6, SPARK 6, DEV 16 (generic engineering), LEAD 30 (strategy literacy). Weak copy came from having no copy skill. | Create 7 skill packages (below), each with method + checklist + failure patterns + example, owned by a team. |
| F3 | **HIGH — Lead acceptance was structural.** Lead closed tasks on section/label/hex checks; creative quality was judged only after the user complained. | C7-VILL-04 (1-min Flash) closed; overnight pack accepted as "structurally present". | Acceptance = independent review with the team's QA skills (CREATIVE SK-010, LENS SK-005) + rubric score; Lead never accepts creative alone. |
| F4 | **HIGH — brand material had no status.** Agents could not tell final from outdated. | v0.2 palette invented; v0.3 built on an outdated VI deck; screenshots used as photos. | DONE: `TSST/core/brand-assets.md` (final / source / reference / proposals / archive + `ASSETS.yaml`), folders created per brand, binaries kept out of git. |
| F5 | **HIGH — one giant session.** Core, VILL, ANVIL, CRM and bus ran in one Opus context: expensive and cross-brand. | This session's size; repeated re-reads. | DONE: `TSST/core/sessions.md` — one session per brand/project; checkpoint ≤ 30 lines at each block end. |
| F6 | **MEDIUM — no token meter.** Savings cannot be shown. | Runtimes don't report tokens; only Claude subagent totals exist (e.g. review 98k). | Add `tokens` to bus `done` (where known) and a per-session line in checkpoints; first KPI review uses it. |
| F7 | **MEDIUM — cross-runtime gaps.** Antigravity skills folder (`.agents/skills`, 8) predates current team maps; Codex main-model identity unverifiable; user relays every "continue". | Codex notes "model unavailable"; Opus quota exhaustion stalled a task. | Sync `.agents/skills` to point at team skill files; keep claim `--model` truthful; long runs = one bus task with internal steps (worked overnight). |
| F8 | **MEDIUM — skills unvalidated.** All skills `UNVALIDATED`; no golden tasks. | READINESS_REPORT; C7 shows creative failing gate. | One golden task per capability, run through the bus with team + skills, scored by an independent runtime; promote only on pass. |
| F9 | LOW — skill reading cut short. Worker read only ~45 lines of skills. | Review hand-back. | Skills are small (CREATIVE avg ~2.3 KB): rule = read the whole SKILL.md; it is cheap. |

## Capability coverage (what you asked TSST to do)
| capability | team | skills today | gap |
|---|---|---|---|
| marketing strategy / positioning | LENS + LEAD | LENS 001–006, LEAD 001–030 | ok (copy missing) |
| design / brand / key visuals | CREATIVE | 001–012 | ok, needs validation |
| social media design | CREATIVE | 011, 012 | ok |
| social media marketing (paid) | SPARK | 001–006 | ok |
| **social media management** (calendar, community, reporting) | LENS | — | **missing** |
| **copywriting AR/EN** | LENS | 005 (messaging only) | **missing** |
| video (motion, edit, sound, grade) | CREATIVE | 015–018 | ok; **scripting/storyboard missing** |
| UI/UX product | CREATIVE | 020–030 | ok (CRM-proven) |
| **presentation & report design** | CREATIVE + LENS | — | **missing (core to client work)** |
| software development | DEV | 001–016 | ok, generic |
| **website / landing / Shopify / SEO** | DEV + CREATIVE | — | **missing** |
| **photo / shoot direction** | CREATIVE | — | **missing** |

## Remediation plan
1. **Now (done in this PR):** rule + bus enforcement; asset contract; session model; GEMINI.md rule.
2. **Next (TSST core session):** write the 7 missing skills (presentation-report design, copywriting AR/EN, social-media management, web-landing-Shopify, SEO basics, photo/shoot direction, video scripting) — LENS/CREATIVE/DEV ownership; Lead acceptance checklist; sync Antigravity skills.
3. **Then:** golden-task benchmark per capability (one each, small, scored) → first real readiness review with token figures.
4. **Brand sessions** start only after the user loads `assets/final` for that brand.
