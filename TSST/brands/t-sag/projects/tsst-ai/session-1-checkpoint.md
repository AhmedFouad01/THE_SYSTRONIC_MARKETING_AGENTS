# TSST core consolidation — session 1 checkpoint

date: 2026-10-04 · git `master` @ `4ff20bd` (= origin/master) · gitdir external, healthy
status: **PARTIAL** — session 2 in progress; only bridge-dependent tasks paused.
nothing committed, nothing pushed, no Real Memory written.

## Done
- Portable core: `TSST/context/{boot.md,router.yaml,models.yaml}`, `TSST/core/{portfolio.yaml,rules.md,lessons.md}`.
- Adapters: `TSST/context/adapters/{claude,gemini,codex,chatgpt}.md`; root `AGENTS.md` + `GEMINI.md` get a boot pointer (existing content preserved); new thin `CLAUDE.md`.
- Brands (pointer-only): `TSST/brands/{t-sag,akyro-studio,vill-studio,yakebda-ms,anvil,_template}`.
- Projects: `t-sag/projects/{crm,tsst-ai}`, `anvil/projects/switch-pilot`.
- Teams: `TSST/teams/{README.md,marketing,studio,build}` mapping existing skills (no moves/renames); Radar capability + log.
- RM change set RM-CS-001: `rm-reconciliation.md` (PROPOSED).
- Validator: `python TSST/context/tests/validate_spine.py` (structure, neutrality, isolation, cold-start A–E).

## Blocked (Claude runtime)
`.gdoc` Google-native Docs are unreadable from the filesystem, and the attached Drive connector has no read tool. Affected:
CRM_UI_HANDOFF (all 15 files), CRM_APP `MVP_*`/UI docs (13), VILL_STUDIO memory (8), YAKEBDA R1 newest status, 9 sync packets, `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/*` drafts.

## Session 2 (bounded)
1. Export `.gdoc` → repo-native: CRM_UI_HANDOFF docs as `.md`, prototype as real `.tsx/.css` (Google Docs → File → Download → Markdown/plain text, or a Drive-read runtime). Keep `.gdoc` originals; record provenance (MagicPath ids) in a new README inside the CRM_UI_HANDOFF folder.
2. Read exported `BRANDS/*` drafts; fold verified facts into `TSST/brands/*` (no new facts).
3. Review the 9 `.gdoc` packets → RM-CS-002.
4. Apply RM-CS-001 if approved.
5. Cold-start in Gemini/Antigravity and Codex using cases A–D; ChatGPT via adapter setup.
6. Commit spine on a branch after user review (`.gdoc` stubs stay untracked).

## do_not_repeat
Inventory of 2026-10-04 (this file is the result); Drive root map (in brand `source.md` files).

---

# Session 2 progress — 2026-10-04 (user decisions applied)

- RM-CS-001 **APPLIED** (D-012 recorded as APPROVED → `PROJECT_DECISIONS.md` TSD-012; TSD-009 still PROPOSED; TSST-001A OPEN). 4 `.md` packets → `processed/` + `evidence/`; 6 `.gdoc` packets → canonical `incoming/` (9 total, unreviewed); empty `chatgpt-gradual (1)` folder kept.
- Source access is now per runtime: `SOURCE_AVAILABLE` / `SOURCE_UNREADABLE_IN_CURRENT_RUNTIME` → bridge / `SOURCE_UNAVAILABLE` (`TSST/context/boot.md`, `TSST/context/bridge.md`, adapters, brand `source.md`). ChatGPT (Drive source) = designated bridge. No manual exports requested.
- Export intake prepared: empty `EXPORTS.yaml` in `CRM_UI_HANDOFF/`, `CRM_APP/`, `…/chatgpt-gradual/`, `…/BRANDS/`; validator checks each row (source exists, export beside it, sha256).
- CRM paused until TSST Core is accepted; no M3, no UI rediscovery.
- Validator 26/26 PASS.

## Waiting on bridge material (paused tasks only)
1. CRM_UI_HANDOFF + CRM_APP UX docs verbatim exports → normalise, fill manifests.
2. 9 `.gdoc` packets → RM-CS-002 (proposal only).
3. BRANDS drafts → fold verified facts into `TSST/brands/*`.
Then: Gemini + Codex cold-starts (cases A–D) → final DEEP review → commit on dedicated branch.

## Final-review cleanup item (user decision 2026-10-04)
`REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual (1)/` = **LEGACY_EMPTY_PENDING_FINAL_CLEANUP**. Do not touch before final review. At final review, delete it only if all PASS:
1. folder still empty; 2. all intended packets present in canonical `chatgpt-gradual/`;
3. processed/evidence records complete; 4. no source map, pointer, adapter, packet or doc references it;
5. no runtime depends on it. Then record the deletion in `PROJECT_CHANGELOG.md` and this checkpoint.

# Session 2 progress — 2026-10-04 (bus + bridge)

- Runtime bus live: `TSST/context/bus.md`, `TSST/bus/` (bus.py, runtimes.yaml, tests `TSST/context/tests/test_bus.py`). Lead = claude only. Tier → model per runtime in `runtimes.yaml#tier_*`; Codex profiles fast/work/code/deep in `~/.codex/config.toml` (default work).
- Bridge done: 63/63 `.gdoc` exported verbatim (user-run `TSST/context/tools_export_gdocs.gs`, text/plain), registered with sha256 in 4 `EXPORTS.yaml` (BR-003, closed). Antigravity has no Drive read (PROBE-001); ChatGPT bridge off.
- Codex verified: fs_read, fs_write, shell (REVIEW-001: 3 bus defects found and fixed).
- Queued: COLD-CODEX, COLD-GEMINI (cases `TSST/context/tests/cold_start.md`), RM-CS-002 (proposal), BRANDS-FOLD (after RM-CS-002).
- Next: those tasks → final DEEP review → commit on dedicated branch → push to `origin` (GitHub) with user approval. Validator 28/28.
- 2026-10-04 later: COLD-CODEX + COLD-GEMINI closed (gemini first copy rejected; rerun accepted) → router.yaml continuation rule + budget scope. RM-CS-002 applied (CS2-01..05, user-approved). BRANDS-FOLD closed (155 cited additions). Gemini verified fs_read/fs_write/shell. Remaining: final DEEP review → PR; `chatgpt-gradual (1)` cleanup check; TSD-009 decision; TSST-001A gate.
- Final Session 2 review: no blockers (tests 28/28 + bus + 38 reference tests; no secrets; no readiness promotion). User decisions: TSD-009 ACCEPTED; CREATIVE UI/UX ownership re-confirmed; `chatgpt-gradual (1)` deleted. TSST-001A OPEN. Next: PR to master, then TSST-001A intake / C7 pilot.
- 2026-10-05: CI workflow `.github/workflows/tsst-spine.yml`; 19 more repo exports (82 rows); brand roots exported in place (VILL 8, YAKEBDA R1 57, AKYRO 6 overwrote authored .md from 07-09: user decision pending, prior versions in Drive history); `brand_only_entry` routing rule.
- 2026-10-05 user decisions: AKYRO keeps Doc-derived .md (prior versions remain in Drive history; tag via `acceptAkyroExports`); Drive "Convert uploads" OFF; `brand_only_entry` verified by user in a fresh session (VILL). CI green on PR #1.
- 2026-10-05: TSST-001A intake done (4 stages) → Operating Baseline v0.1 frozen, gate CLOSED (TSD-013). Next: C7 pilot on VILL Studio.
- 2026-10-05: C7 pilot (TSST-PILOT-002, VILL) delivered and user-approved; first KPI review in its ACCEPTANCE.md. Next: readiness reassessment (READINESS_REPORT) + proposed lessons → user.
- 2026-10-05: PR #3 merged. User: actual VILL numbers deferred (not now); readiness reassessment deferred until Brand Look is actually produced (rendered assets, not only written direction).
- 2026-10-05: operations audit `TSST/audits/2026-10-05_TSST_OPERATIONS_AUDIT.md` (2 CRITICAL: team bypassed — fixed; 7 missing skills). Asset contract `TSST/core/brand-assets.md`, sessions model `TSST/core/sessions.md`. From now: one session per brand/project; this session = TSST core. Next core work: write 7 missing skills + acceptance checklist + Antigravity skill sync, then golden-task benchmark.
