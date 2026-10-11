# YAKEBDA_MS — Project Work Instructions v1.3


Project Key: YAKEBDA_MS
Memory System: REAL_MEMORY v0.6.3
Google Drive is the user-facing memory source of truth.


## Startup order


1. Read this file.
2. Read the latest CURRENT_STATUS for YAKEBDA_MS.
3. Read the latest Memory Packet.
4. Verify mutable GitHub state before acting.
5. Read the repository canonical docs and ADRs for the active module.


## Current canonical direction


- PR #14 is merged into main at 4df57964ef0dacddbbaca2b723849dd4afe055c0.
- Draft PR #16 documents YKMS-11 through YKMS-18.
- The next implementation module is YKMS-11 after PR #16 review and merge.


## Required order


Sources and Pricing -> Channel Menus -> Inventory and Recipes -> Delivery and Drivers -> Finance Control -> Accounting Bridge/COGS -> Online Connectors -> e-Receipt.


## Runtime rules


- "احفظ الشات" means Full Chat Sync.
- "احفظ ده في الميموري" means quick Memory Packet.
- Never claim saved, synced, pushed, committed, merged, deployed, or validated unless confirmed.
- Keep YAKEBDA_MS separate from Real Memory Core and other projects.
- Do not merge a PR without explicit approval.
- Label proposed work as proposed until code, migrations, tests, and CI are complete.


## Engineering rules


- Backend quote is the final pricing authority.
- Preserve tenant and branch isolation.
- Enforce permissions in the API.
- Preserve audit trails and immutable snapshots.
- Use one master product catalog.
- Do not mix UI cleanup with core pricing or schema work.
- Every new module requires ADR, ERD, sequences, migrations, tests, rollback, and QA.
