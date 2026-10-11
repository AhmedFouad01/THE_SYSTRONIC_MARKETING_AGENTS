# T.SAG — memory source (pointer only)

Authority bridge. T.SAG's durable memory **is** the canonical TSST Real Memory; it is not
copied here. Do not create a second copy of TSST memory under this folder.

| field | value |
|---|---|
| canonical | repo `REAL_MEMORY/TSST_REAL_MEMORY/` (also on Drive: `drive:THE_SYSTRONIC_MARKETING_AGENTS/REAL_MEMORY/TSST_REAL_MEMORY/`) |
| format | `.md` (readable) for core files; sync packets mixed `.md` / `.gdoc` |
| entry | `00_START_HERE/START_HERE.md` → `01_CURRENT_STATUS/CURRENT_STATUS.md` |
| durable as of | 2026-10-11 for TSST Core status (CURRENT_STATUS 2026-10-11 section, TSD-022 / ADR-005 Motion AG; earlier base 2026-10-05 packet `TSST-SYNC-20261005-1800-CORE-V0.2`) — still **lags** CRM M0–M2 / CRM UI detail |
| pending | sync packets in `07_SYNC_INBOX/` — proposals only; see `TSST/brands/t-sag/projects/tsst-ai/rm-reconciliation.md` |
| legacy | `REAL_MEMORY/THE_SYSTRONIC_LEGACY_REAL_MEMORY/` — history only; never default |
| Drive-native draft | `REAL_MEMORY/TSST_REAL_MEMORY/BRANDS/*` (`.gdoc`, earlier brand registration draft). Superseded for filesystem runtimes by `TSST/brands/`; content reconciliation pending |

Project state for CRM is recovered from repo evidence first (`projects/crm/project.md`),
because durable Real Memory has not yet absorbed M0–M2.
