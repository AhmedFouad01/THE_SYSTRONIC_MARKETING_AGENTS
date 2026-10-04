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
| ChatGPT (Drive source) | `SOURCE_AVAILABLE` — read on demand (bridge) |
| Gemini (Workspace) | `SOURCE_AVAILABLE` where enabled |
| Claude / Codex (filesystem) | `SOURCE_UNREADABLE_IN_CURRENT_RUNTIME` → request bridge read of `CURRENT_STATUS` only |

Pointer-only: the VILL tree is not exported into the repo. Do not guess VILL state.
