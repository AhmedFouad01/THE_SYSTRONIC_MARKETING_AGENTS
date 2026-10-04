# YAKEBDA_MS — memory source (pointer only, MULTI-ROOT)

Three candidate roots exist (R1–R3; R4 is a subfolder snapshot inside R1). **None is selected as universal truth.** Resolve authority
per task with the rule below; never load all roots.

| root | path | newest dated evidence (metadata) | format |
|---|---|---|---|
| R1 | `drive:Yakebda_MS_Newmap/` (root-level dated packets) | `CURRENT_STATUS__YAKEBDA_MS__2026-07-13__P0_P1_MERGED_P2_READY` + `CHAT_HANDOFF__YAKEBDA_MS__2026-07-13__P2_INVENTORY_GATE` | `.gdoc` (newest), older `.md` |
| R2 | `drive:Real Memory/real-memory-os/USERS/AHMED_FOUAD/PROJECTS/YAKEBDA_MS/` | `00_START_HERE/PROJECT_WORK_INSTRUCTIONS.md` 2026-07-12 | `.md` |
| R3 | `drive:Real Memory/real-memory-os/01_PROJECTS/YAKEBDA_MS/` | `01_CURRENT_STATUS/CURRENT_STATUS.md` 2026-07-08 | `.md` |
| R4 | `drive:Yakebda_MS_Newmap/YAKEBDA_MS/` | `01_CURRENT_STATUS/CURRENT_STATUS.md` 2026-07-08 | `.md` |

## Authority resolution (per task)
1. An explicit checkpoint/handoff named by the user wins.
2. Else the newest dated `CURRENT_STATUS__*` / `CHAT_HANDOFF__*` (currently R1, 2026-07-13).
3. Else R2 `PROJECT_WORK_INSTRUCTIONS.md` for operating rules.
4. Code state: the YAKEBDA_MS repository named in the winning checkpoint (not in this repo).
5. R3/R4 are older snapshots — use only to fill a named gap.

If the winning file is `.gdoc` and the runtime cannot read it → state
`SOURCE_UNREADABLE_IN_CURRENT_RUNTIME: yakebda-ms/R1 CURRENT_STATUS 2026-07-13`, request a
bridge read (ChatGPT Drive source; `TSST/context/bridge.md`) of that file only, and pause
state-dependent work. R2 may be cited only as **stale** context, never as current truth.
ChatGPT / Gemini with Drive access: `SOURCE_AVAILABLE`.

Isolation: never mix with AKYRO_STUDIO (sibling under `01_PROJECTS`).
Canonical-root consolidation is a separate future task (not approved now).

## Verified draft fold — 2026-10-04

Draft source locators (not a universal authority selection):
- Primary known source: https://drive.google.com/drive/folders/1G0YuMANM3jpX7vMUyxex4w2WMT-toAe2
- Historical/supporting: https://drive.google.com/drive/folders/1KC7m2L4Or-YcCA4qs5cGiVoeXeVC01Ww
- Historical/supporting: https://drive.google.com/drive/folders/16LX1uCZjGlP8OCbByLXBOSguUAP9k831

Import mode: POINTER-FIRST / CANONICAL RECONCILIATION REQUIRED. Resolve authority, duplicates, chronology and current repository state before physical migration. Existing per-task R1–R4 resolution above remains controlling.

Source: `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/YAKEBDA_MS/memory/source.md`.
