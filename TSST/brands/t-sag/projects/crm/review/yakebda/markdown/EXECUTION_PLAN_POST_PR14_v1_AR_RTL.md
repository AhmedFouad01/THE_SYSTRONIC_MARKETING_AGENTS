<div dir="rtl" align="right">


# Execution Plan — Post PR #14 v1.1


**التاريخ:** 2026-07-12  
**الحالة:** Active execution baseline  
**ملاحظة:** PR #14 مدموجة ومغلقة؛ لا توجد بوابة UI معلقة.


## Gate 0 — Completed baseline


- PR #14 merged at `4df57964ef0dacddbbaca2b723849dd4afe055c0`.
- Final head: `14b1d12befeddf0700e083edd1374700366c0e53`.
- CI #159 successful.
- API 95/95 and Admin build passed.
- Final UI and dependency memory checkpoint completed.


## Gate 1 — Documentation PR #16


- Review the canonical planning package.
- Confirm Project Master v1.3, Instructions v1.3, SRS v2, Roadmap v2.1, Diagrams v2.1, ADR-002, ADR-003, and Decision Log v1.1.
- Current confirmed head: `2686c4607694cbe8a29537b3c58deaed8448604e`.
- CI #179 successful.
- Merge only on explicit user approval.


## Gate 2 — YKMS-11 Order Sources & Pricing Context


### Architecture before code
- source taxonomy;
- ERD;
- pricing precedence;
- quote API contract;
- migration and backfill plan;
- order and order-item snapshot fields;
- permissions and settings;
- test matrix.


### Implementation
- migrations;
- source CRUD and branch configuration;
- pricelist CRUD and rules;
- quote integration;
- source-aware order creation and reporting;
- cart re-quote and confirmation UI;
- tests and RTL QA.


## Gate 3 — YKMS-12 Channel Menus & External Mappings


- channel menu CRUD;
- categories, items, variants, and modifiers;
- source and branch availability and schedules;
- external IDs and mappings;
- validation, publication, synchronization state, and logs;
- admin UI and tests.


## Gate 4 — YKMS-13 Inventory & Recipes


- UOM and conversions;
- items and locations;
- suppliers, purchasing, and receiving;
- recipes and packaging;
- movements and transfers;
- counts, waste, and adjustments;
- costing policy foundation;
- tests and operational QA.


## Gate 5 — YKMS-14 Delivery & Drivers


- delivery ownership and providers;
- dispatch and assignment;
- task lifecycle and timestamps;
- internal and platform driver behavior;
- COD custody;
- driver settlement and differences;
- permissions, audit, reports, and QA.


## Gate 6 — YKMS-15 Finance Control


- expenses and approvals;
- cash and shift reconciliation;
- card, wallet, bank, source, and platform reconciliation;
- driver settlement integration;
- finance dashboard;
- taxes, refunds, closing, and lock dates;
- exceptions, exports, permissions, and audit.


## Gate 7 — YKMS-16 Accounting Bridge, COGS & Profitability


- financial event outbox;
- chart and journal mapping;
- balanced posting and reversal;
- period lock;
- inventory valuation and COGS;
- profitability dimensions;
- external accounting adapter;
- dry-run, backfill, and reconciliation.


## Gate 8 — YKMS-17 Online / QR / Platform Connectors


- public ordering API;
- connector adapters;
- idempotency and authentication;
- menu synchronization and webhooks;
- retries, logs, and monitoring.


## Gate 9 — YKMS-18 Egyptian e-Receipt & Compliance


- legal and accountant validation;
- fiscal identity and payload;
- submission and signing boundary;
- retry, rejection, and audit flow;
- compliance reports and retention.


## Release discipline


Every gate requires:


- focused branch and PR;
- reversible migrations where practical;
- tenant and branch isolation tests;
- permission and audit tests;
- API tests and Admin production build;
- focused manual Arabic and RTL QA;
- verified PR and CI state;
- Google Drive memory update and handoff.


</div>
