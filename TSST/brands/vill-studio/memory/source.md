# VILL_STUDIO — memory source (pointer only)

| field | value |
|---|---|
| canonical | `drive:Real Memory/real-memory-os/USERS/AHMED_FOUAD/PROJECTS/VILL_STUDIO/` |
| format | **Google-native Docs only** (8 files, all `.gdoc`) |
| entry | `00_START_HERE/VILL_STUDIO_PROJECT_INSTRUCTIONS` → `01_CURRENT_STATUS/CURRENT_STATUS` |
| last dated file seen | 2026-10-02 (file metadata) |
| also | `05_DECISIONS_ADR/DECISIONS`, `03_MILESTONES/MILESTONE_LOG`, `08_PROMPTS/GEMINI_TSST_VILL_STUDIO_BRIDGE_v0.1` |
| Drive-native draft | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/VILL_STUDIO/*.gdoc` |

## Access by runtime
| runtime | state |
|---|---|
| Claude / Codex / Gemini (filesystem) | read the `.md` export beside each Doc (same `drive:` folder, written in place by `exportBrandRoots` in `TSST/context/tools_export_gdocs.gs`) → `SOURCE_AVAILABLE`. No `.md` yet, or `.gdoc` newer than its `.md` → `SOURCE_UNREADABLE_IN_CURRENT_RUNTIME`: ask the user to run `exportBrandRoots`; do not guess |
| ChatGPT | `off` on the bus (2026-10-04); no Drive bridge in use |

Pointer-only: the VILL tree is not exported into the repo. Do not guess VILL state.

## Verified draft fold — 2026-10-04

Verified draft source pointer: https://drive.google.com/drive/folders/1EX3mDhbQwRpEuwjUhLJDI-UgGlMdXyxZ

Source structure includes START_HERE, CURRENT_STATUS, PROJECT_MASTER, milestones, changelog, decisions, sync inbox, prompts, exports, assets and archive. Import mode: POINTER-FIRST / CONTROLLED HANDOFF. Physical migration requires conflict/duplicate review and an explicit migration step.

Source: `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/VILL_STUDIO/memory/source.md`.
