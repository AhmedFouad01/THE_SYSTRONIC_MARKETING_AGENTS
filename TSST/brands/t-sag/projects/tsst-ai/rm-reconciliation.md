# TSST Real Memory reconciliation — proposed change set RM-CS-001

status: **APPLIED 2026-10-04 (user-approved; D-012 APPROVED; CS-08 deferred)**
prepared: 2026-10-04 · target: `REAL_MEMORY/TSST_REAL_MEMORY/` · protocol: `07_SYNC_INBOX/chatgpt-gradual/PROCESS_PROTOCOL.md`

## Findings

| # | finding | evidence |
|---|---|---|
| F1 | All durable files are dated **2026-09-23** (setup baseline). They omit DEV_AG, Context OS, CRM M0–M2, CRM UI, runtime routing, brands. | START_HERE, CURRENT_STATUS, PROJECT_* , TIMELINE |
| F2 | Canonical inbox = `07_SYNC_INBOX/chatgpt-gradual/` (has README, PROCESS_PROTOCOL, PACKET_SCHEMA, PACKET_TEMPLATE, `processed/`, `evidence/`, `rejected/`). | folder listing |
| F3 | `07_SYNC_INBOX/chatgpt-gradual (1)/` is a duplicate sibling (Drive copy artifact): `incoming/` only, no protocol, holds 4 `.md` + 6 `.gdoc` packets. | folder listing |
| F4 | 9 packets are `.gdoc` and **unreadable in the Claude runtime**: canonical `TSST-RM-20260927-0521-001`, `TSST-SYNC-20260928-1220-DEV_AG-IMPLEMENTATION`, `TSST-RM-20261004-0456-001`; duplicate folder `…1644-CRM-M1-CLOSURE`, `…0102-CRM-M2-MVP-DIRECTION`, `…1356-CRM-MVP-UIUX-SPRINT`, `…2342-CRM-UI-SYSTEM-BASELINE`, `…0218-SECOND-BRAIN-RUNBOOK`, `…CRM-UI-MVP-FOUNDATION`. | read failure |
| F5 | `PROJECT_SOURCE_MAP.md` points at `Real Memory OS/USERS/AHMED_FOUAD/PROJECTS/TSST/` — **does not exist**; canonical TSST memory is in the repo. | path check |
| F6 | Gate TSST-001A (operating baseline v0.1) is still open in durable memory while CRM work and DEV_AG governance advanced. Packets flag this divergence correctly. | 4 readable packets |

## Conflicts and resolution rule applied
- C1 CRM M1: closure packet unreadable → **repo evidence wins**: `f54fbf6` M0 closed (2026-10-02), `93bd92a` M1 closed (2026-10-02), `a926b9d`/`3bd3fcb` M2 closed (2026-10-04), `4ff20bd` hardening.
- C2 DEV_AG: packet 0711 proposes; `TSST/decisions/TSST-ADR-002.md` records user approval → apply as governance-APPROVED, NOT_READY.
- C3 Codex-worker rule (packet 0129) is self-labelled *proposed* → record as PROPOSED decision only.
- C4 Gate TSST-001A: **not closed by this change set**. Only the user can approve baseline v0.1.

## Change set (exact targets)

| id | target | change |
|---|---|---|
| CS-01 | `01_CURRENT_STATUS/CURRENT_STATUS.md` | Add "State as of 2026-10-04": team = Lead + LENS, CREATIVE, SPARK, DEV (DEV governance-APPROVED per ADR-002; all NOT_READY); operating spine `TSST/context/boot.md` + `TSST/core/portfolio.yaml`; CRM = T.SAG project, M0–M2 CLOSED (pointer `TSST/brands/t-sag/projects/crm/project.md`); TSST-001A remains OPEN. |
| CS-02 | `02_PROJECT_MEMORY/PROJECT_DECISIONS.md` | Append D-007 DEV_AG registration (ADR-002) · D-008 CRM custom-build foundation (boundary only; CRM ADRs live in `CRM_APP/ADR-001.md`) · D-009 PROPOSED: temporary Codex workers are not TSST agents · D-010 portable boot + thin runtime adapters + logical tiers · D-011 brand-first pointer registry (`TSST/brands/`), on-demand memory, no duplication · D-012 PROPOSED: operating hierarchy MARKETING(LENS)/STUDIO(CREATIVE)/BUILD(DEV), SPARK as performance capability. |
| CS-03 | `04_SOURCE_MAP/PROJECT_SOURCE_MAP.md` | Replace stale path (F5) with repo `REAL_MEMORY/TSST_REAL_MEMORY/`; add sources: Git `master` (external gitdir), `/CRM_APP`, `/CRM_BLUEPRINT`, `/CRM_UI_HANDOFF`, MagicPath `457118534846255104`, `TSST/context/`, `TSST/brands/`. |
| CS-04 | `05_TIMELINE/PROJECT_TIMELINE.md` | Add: 09-28 DEV_AG approved · 10-01 CRM custom-build M0 baseline · 10-02 M0 closed, M1 closed · 10-03 M2 delivered, CRM UI/UX sprint · 10-04 M2 closed + hardening · 10-04 TSST core consolidation session 1. |
| CS-05 | `02_PROJECT_MEMORY/PROJECT_PROFILE.md`, `PROJECT_MEMORY_MAP.md` | Roles include DEV_AG; add pointer to `TSST/core/portfolio.yaml` and `TSST/brands/`. |
| CS-06 | `02_PROJECT_MEMORY/PROJECT_CHANGELOG.md` | One entry per applied CS item with packet ids. |
| CS-07 | inbox | Move the 4 readable packets from `chatgpt-gradual (1)/incoming/` → `chatgpt-gradual/processed/` with an `evidence/` record each. Move the 6 `.gdoc` packets → `chatgpt-gradual/incoming/` **unreviewed**. Leave the empty `chatgpt-gradual (1)` folder in place until the user confirms deletion. |
| CS-08 | `.gdoc` packets (F4) | **Not applied.** Review in a Drive-read runtime (Gemini/ChatGPT) or after export to `.md`; then produce RM-CS-002. |

Not included: brand memory consolidation, root moves/merges, deletion, TSST-001A closure.

## Approval
Reply with one of: `approve RM-CS-001` · `approve RM-CS-001 except <ids>` · `reject RM-CS-001`.

## Apply record (2026-10-04, user approval in chat 2026-10-04)
Deviation from proposal: D-012 recorded as APPROVED (user change); D-009 stays PROPOSED; TSST-001A remains OPEN. Decision ids written as TSD-007..TSD-012 to match file convention. Evidence records in `07_SYNC_INBOX/chatgpt-gradual/evidence/`.

| CS | file | result |
|---|---|---|
| CS-01 | `01_CURRENT_STATUS/CURRENT_STATUS.md` | done |
| CS-02 | `02_PROJECT_MEMORY/PROJECT_DECISIONS.md` | done |
| CS-03 | `04_SOURCE_MAP/PROJECT_SOURCE_MAP.md` | done |
| CS-04 | `05_TIMELINE/PROJECT_TIMELINE.md` | done |
| CS-05 | `PROJECT_PROFILE.md`, `PROJECT_MEMORY_MAP.md` | done |
| CS-06 | `PROJECT_CHANGELOG.md` | done |
| CS-07 | inbox: 4 .md → `processed/` + 4 evidence records; 6 .gdoc → `chatgpt-gradual/incoming/` (unreviewed); `chatgpt-gradual (1)` kept (empty) | done |
| CS-08 | `.gdoc` packets | deferred (not applied) |