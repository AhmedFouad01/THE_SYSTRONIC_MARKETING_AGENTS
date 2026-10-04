# Bridge request BR-001 — Drive export

Total: 63 files · prepared 2026-10-04 · status: OPEN

For: bus task `BR-001` — any runtime with verified `drive_docs_read` + `fs_write` (`TSST/context/bus.md`). Skip rows whose export already has a manifest row; resume from the task's `progress`.

Task: export each `.gdoc` original below **verbatim** to its target path (same folder, `.gdoc` removed; no inner extension → `.md`) and add one row per file to the set's `EXPORTS.yaml` (`bridge_runtime: <your runtime id>`, `method: verbatim`; `sha256` may be empty).

- Code files (`.tsx`, `.css`): exact source text, no Markdown fences, straight quotes.
- Do not edit, move, rename or delete originals.
- Exported packets and brand drafts stay proposals: no Real Memory apply, no brand-fact changes.

## CRM UI handoff (15) — manifest `CRM_UI_HANDOFF/EXPORTS.yaml`

| # | original | export to |
|---|---|---|
| 1 | `CRM_UI_HANDOFF/CLAUDE.md.gdoc` | `CRM_UI_HANDOFF/CLAUDE.md` |
| 2 | `CRM_UI_HANDOFF/docs/ui-system/ACCEPTANCE_GATES.md.gdoc` | `CRM_UI_HANDOFF/docs/ui-system/ACCEPTANCE_GATES.md` |
| 3 | `CRM_UI_HANDOFF/docs/ui-system/COMPONENT_CONTRACTS.md.gdoc` | `CRM_UI_HANDOFF/docs/ui-system/COMPONENT_CONTRACTS.md` |
| 4 | `CRM_UI_HANDOFF/docs/ui-system/CRM_DATA_WORKSPACE.md.gdoc` | `CRM_UI_HANDOFF/docs/ui-system/CRM_DATA_WORKSPACE.md` |
| 5 | `CRM_UI_HANDOFF/docs/ui-system/DESIGN_TOKENS.md.gdoc` | `CRM_UI_HANDOFF/docs/ui-system/DESIGN_TOKENS.md` |
| 6 | `CRM_UI_HANDOFF/docs/ui-system/IMPLEMENTATION_SEQUENCE.md.gdoc` | `CRM_UI_HANDOFF/docs/ui-system/IMPLEMENTATION_SEQUENCE.md` |
| 7 | `CRM_UI_HANDOFF/docs/ui-system/README.md.gdoc` | `CRM_UI_HANDOFF/docs/ui-system/README.md` |
| 8 | `CRM_UI_HANDOFF/docs/ui-system/RTL_RESPONSIVE.md.gdoc` | `CRM_UI_HANDOFF/docs/ui-system/RTL_RESPONSIVE.md` |
| 9 | `CRM_UI_HANDOFF/docs/ui-system/UI_ARCHITECTURE.md.gdoc` | `CRM_UI_HANDOFF/docs/ui-system/UI_ARCHITECTURE.md` |
| 10 | `CRM_UI_HANDOFF/docs/ui-system/UX_RULES.md.gdoc` | `CRM_UI_HANDOFF/docs/ui-system/UX_RULES.md` |
| 11 | `CRM_UI_HANDOFF/docs/ui-system/reference/REFERENCE_INDEX.md.gdoc` | `CRM_UI_HANDOFF/docs/ui-system/reference/REFERENCE_INDEX.md` |
| 12 | `CRM_UI_HANDOFF/docs/ui-system/prototype/CRMMVPSharedArchitecture.css.gdoc` | `CRM_UI_HANDOFF/docs/ui-system/prototype/CRMMVPSharedArchitecture.css` |
| 13 | `CRM_UI_HANDOFF/docs/ui-system/prototype/CRMMVPSharedArchitecture.tsx.gdoc` | `CRM_UI_HANDOFF/docs/ui-system/prototype/CRMMVPSharedArchitecture.tsx` |
| 14 | `CRM_UI_HANDOFF/docs/ui-system/prototype/CRM_index.css.gdoc` | `CRM_UI_HANDOFF/docs/ui-system/prototype/CRM_index.css` |
| 15 | `CRM_UI_HANDOFF/docs/ui-system/prototype/SystronicUIDesignSystem.tsx.gdoc` | `CRM_UI_HANDOFF/docs/ui-system/prototype/SystronicUIDesignSystem.tsx` |

## CRM UX docs (13) — manifest `CRM_APP/EXPORTS.yaml`

| # | original | export to |
|---|---|---|
| 1 | `CRM_APP/CRM_MVP_SPRINT_PLAN_v0.1.md.gdoc` | `CRM_APP/CRM_MVP_SPRINT_PLAN_v0.1.md` |
| 2 | `CRM_APP/CRM_UI_FOUNDATIONS_v0.1.md.gdoc` | `CRM_APP/CRM_UI_FOUNDATIONS_v0.1.md` |
| 3 | `CRM_APP/MVP_COMMAND_MAP.md.gdoc` | `CRM_APP/MVP_COMMAND_MAP.md` |
| 4 | `CRM_APP/MVP_CORE_TASK_FLOWS.md.gdoc` | `CRM_APP/MVP_CORE_TASK_FLOWS.md` |
| 5 | `CRM_APP/MVP_INFORMATION_ARCHITECTURE.md.gdoc` | `CRM_APP/MVP_INFORMATION_ARCHITECTURE.md` |
| 6 | `CRM_APP/MVP_INTERACTION_MODEL.md.gdoc` | `CRM_APP/MVP_INTERACTION_MODEL.md` |
| 7 | `CRM_APP/MVP_KEYBOARD_FOCUS_MAP.md.gdoc` | `CRM_APP/MVP_KEYBOARD_FOCUS_MAP.md` |
| 8 | `CRM_APP/MVP_LOFI_WORKSPACE_WIREFRAMES.md.gdoc` | `CRM_APP/MVP_LOFI_WORKSPACE_WIREFRAMES.md` |
| 9 | `CRM_APP/MVP_SCREEN_INVENTORY.md.gdoc` | `CRM_APP/MVP_SCREEN_INVENTORY.md` |
| 10 | `CRM_APP/MVP_STATE_OVERLAY_MATRIX.md.gdoc` | `CRM_APP/MVP_STATE_OVERLAY_MATRIX.md` |
| 11 | `CRM_APP/MVP_UI_DIRECTIONS_BRIEF_v0.1.md.gdoc` | `CRM_APP/MVP_UI_DIRECTIONS_BRIEF_v0.1.md` |
| 12 | `CRM_APP/MVP_UX_AUDIT.md.gdoc` | `CRM_APP/MVP_UX_AUDIT.md` |
| 13 | `CRM_APP/MVP_VISUAL_FOUNDATIONS_LOCK_v0.1.md.gdoc` | `CRM_APP/MVP_VISUAL_FOUNDATIONS_LOCK_v0.1.md` |

## TSST sync packets (9) — manifest `REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/EXPORTS.yaml`

| # | original | export to |
|---|---|---|
| 1 | `REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-RM-20260927-0521-001.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-RM-20260927-0521-001.md` |
| 2 | `REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-RM-20261004-0456-001.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-RM-20261004-0456-001.md` |
| 3 | `REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-SYNC-20260928-1220-DEV_AG-IMPLEMENTATION.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-SYNC-20260928-1220-DEV_AG-IMPLEMENTATION.md` |
| 4 | `REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-SYNC-20261002-1644-CRM-M1-CLOSURE.md.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-SYNC-20261002-1644-CRM-M1-CLOSURE.md` |
| 5 | `REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-SYNC-20261003-0102-CRM-M2-MVP-DIRECTION.md.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-SYNC-20261003-0102-CRM-M2-MVP-DIRECTION.md` |
| 6 | `REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-SYNC-20261003-1356-CRM-MVP-UIUX-SPRINT.md.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-SYNC-20261003-1356-CRM-MVP-UIUX-SPRINT.md` |
| 7 | `REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-SYNC-20261003-2342-CRM-UI-SYSTEM-BASELINE.md.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-SYNC-20261003-2342-CRM-UI-SYSTEM-BASELINE.md` |
| 8 | `REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-SYNC-20261004-0218-SECOND-BRAIN-RUNBOOK — العقل التاني وطريقة تشغيله.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-SYNC-20261004-0218-SECOND-BRAIN-RUNBOOK — العقل التاني وطريقة تشغيله.md` |
| 9 | `REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-SYNC-20261004-CRM-UI-MVP-FOUNDATION.md.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/TSST-SYNC-20261004-CRM-UI-MVP-FOUNDATION.md` |

## Brand drafts (26) — manifest `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/EXPORTS.yaml`

| # | original | export to |
|---|---|---|
| 1 | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/registry.md.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/registry.md` |
| 2 | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/AKYRO_STUDIO/brand.md.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/AKYRO_STUDIO/brand.md` |
| 3 | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/AKYRO_STUDIO/rules.md.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/AKYRO_STUDIO/rules.md` |
| 4 | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/AKYRO_STUDIO/scope.md.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/AKYRO_STUDIO/scope.md` |
| 5 | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/AKYRO_STUDIO/status.md.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/AKYRO_STUDIO/status.md` |
| 6 | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/AKYRO_STUDIO/memory/source.md.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/AKYRO_STUDIO/memory/source.md` |
| 7 | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/VILL_STUDIO/brand.md.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/VILL_STUDIO/brand.md` |
| 8 | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/VILL_STUDIO/rules.md.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/VILL_STUDIO/rules.md` |
| 9 | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/VILL_STUDIO/scope.md.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/VILL_STUDIO/scope.md` |
| 10 | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/VILL_STUDIO/status.md.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/VILL_STUDIO/status.md` |
| 11 | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/VILL_STUDIO/memory/source.md.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/VILL_STUDIO/memory/source.md` |
| 12 | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/YAKEBDA_MS/brand.md.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/YAKEBDA_MS/brand.md` |
| 13 | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/YAKEBDA_MS/rules.md.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/YAKEBDA_MS/rules.md` |
| 14 | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/YAKEBDA_MS/scope.md.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/YAKEBDA_MS/scope.md` |
| 15 | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/YAKEBDA_MS/status.md.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/YAKEBDA_MS/status.md` |
| 16 | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/YAKEBDA_MS/memory/source.md.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/YAKEBDA_MS/memory/source.md` |
| 17 | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/T.SAG/brand.md.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/T.SAG/brand.md` |
| 18 | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/T.SAG/rules.md.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/T.SAG/rules.md` |
| 19 | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/T.SAG/scope.md.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/T.SAG/scope.md` |
| 20 | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/T.SAG/status.md.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/T.SAG/status.md` |
| 21 | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/T.SAG/memory/source.md.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/T.SAG/memory/source.md` |
| 22 | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/ANVIL/brand.md.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/ANVIL/brand.md` |
| 23 | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/ANVIL/rules.md.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/ANVIL/rules.md` |
| 24 | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/ANVIL/scope.md.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/ANVIL/scope.md` |
| 25 | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/ANVIL/status.md.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/ANVIL/status.md` |
| 26 | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/ANVIL/memory/source.md.gdoc` | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/ANVIL/memory/source.md` |
