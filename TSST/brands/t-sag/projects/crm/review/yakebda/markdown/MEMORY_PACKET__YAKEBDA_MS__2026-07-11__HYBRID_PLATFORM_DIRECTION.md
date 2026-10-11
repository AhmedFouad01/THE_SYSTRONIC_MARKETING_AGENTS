YAKEBDA_MS Hybrid Platform Direction


Date: 2026-07-11
Project Key: YAKEBDA_MS
Real Memory: v0.6.3
Status: Approved direction. Implementation starts only after YKMS-02F is reviewed and accepted.


PRODUCT DIRECTION DECISION
YAKEBDA MS will preserve the current React/API restaurant system and later extend it into:
- Windows desktop POS/KDS for Windows 10 and newer.
- Hybrid online/offline operation.
- Local SQLite storage on operational devices.
- Cloud API with managed PostgreSQL.
- Role-focused mobile applications.
- Shared permissions and business rules across Web, Desktop, and Mobile.


This direction is merged with YKMS-02F and does not replace it.


SEQUENCING DECISION
Do not interrupt Claude/Fable's current YKMS-02F task with desktop, offline-sync, cloud-deployment, or mobile implementation.


Execution order:
1. Let Claude/Fable finish YKMS-02F.
2. Review its branch, commits, changed files, screenshots, tests, build, POS behavior, Product Editor, Settings RBAC/UI, and Kitchen timer.
3. Fix YKMS-02F regressions before starting platform work.
4. Start a separate platform architecture milestone only after acceptance.


No platform milestone is considered started yet.


TARGET PLATFORM ARCHITECTURE
Web Back Office: existing React application.
Windows POS/KDS Desktop: proposed Tauri 2 with React.
Mobile Apps: proposed React Native / Expo.
Cloud path: all clients -> Cloud API -> Managed PostgreSQL.
Offline desktop path: Desktop App -> Local SQLite -> Outbox/Sync Queue -> Cloud API when online.


The proposed technologies are a direction for a dedicated architecture spike, not a final implementation commitment.


FUTURE ARCHITECTURE GUARDRAILS
1. Clients use the API; no direct cloud-database access from Desktop or Mobile.
2. Use UUIDs for syncable business records.
3. Add device_id, updated_at, record version, and sync metadata where required.
4. Order and payment commands must support idempotency.
5. Implement real outbox/inbox synchronization with retry and conflict handling.
6. Snapshot prices, taxes, discounts, and totals at transaction time.
7. Keep local readable copies of menu, prices, settings, permissions, and branch configuration.
8. Printing uses a local queue and hardware-adapter layer.
9. Do not embed cloud credentials or database credentials in clients.
10. Audit sensitive operations.
11. Show connection state, last sync, pending queue, and sync errors.
12. Move shared business rules into reusable packages when practical.


DESKTOP AND MOBILE DIRECTION
Desktop requirements: Windows 10+, Setup EXE and/or MSI, local SQLite, online-first release followed by controlled offline capability, local printing, cash drawer, barcode scanner, device registration, branch assignment, and auto-update strategy. Offline transactions and conflict resolution require dedicated tests and are not only a packaging task.


Mobile roles:
- Owner/Manager: sales, reports, shifts, alerts, approvals, unavailable items, and kitchen/delivery monitoring.
- Driver: assigned orders, customer contact/address, delivery status, cash collection, and settlement.
- Optional Kitchen/Tablet: KDS queue, live timers, preparation, and ready status.


TENTATIVE POST-YKMS-02F ROADMAP
YKMS-03A — Platform and Sync Architecture
YKMS-03B — Windows Desktop Online-First Installer
YKMS-03C — Local SQLite and Offline Orders
YKMS-03D — Cloud Deployment and Managed PostgreSQL
YKMS-03E — Mobile Applications
YKMS-03F — Hardware Integration and Auto Update


NEXT ACTION WHEN CLAUDE/FABLE FINISHES
Before giving new platform instructions, inspect the final branch and commit SHA, GitHub push state, full diff, any RBAC bypass, Product Editor and POS-state preservation, Settings editability through real RBAC, Kitchen timestamps and running timer, payment-action visibility at 1366x768, API tests, and admin build. Then create YKMS-03A instructions from the actual accepted repository state.


CURRENT SUMMARY
Finish and review YKMS-02F first. Preserve the React/API foundation. Add Desktop, offline sync, Cloud PostgreSQL, Mobile, and hardware through later staged milestones.
