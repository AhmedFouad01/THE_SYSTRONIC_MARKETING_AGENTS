# PROJECT_BACKLOG — YAKEBDA_MS


Last Updated: 2026-07-12


## P0 — Documentation gate


- Review Draft PR #16.
- Confirm Project Master v1.3, Instructions v1.3, SRS v2, Execution Roadmap v2.1, Diagrams v2.1, ADR-002, ADR-003, and Planning Decision Log v1.1.
- Merge PR #16 only after explicit user approval.
- After merge, create `feature/ykms-11-order-sources` from the latest `main`.
- Do not mix documentation cleanup with YKMS-11 runtime implementation.


## P1 — YKMS-11 Order Sources & Pricing Context


- Define source taxonomy and lifecycle.
- Define source and branch configuration.
- Specify pricing precedence and quote contract.
- Define snapshots, idempotency, permissions, settings, migration, and backfill.
- Implement source tables, price lists, quote integration, reporting dimensions, and tests.
- Add source selection, server re-quote, confirmation, and RTL QA.


## P2 — YKMS-12 Channel Menus & External Mappings


- Define channel menus, categories, items, variants, and modifier groups.
- Add source and branch availability and schedules.
- Support source-specific names, descriptions, and ordering.
- Add external product and modifier mappings.
- Add publication validation, synchronization state, logs, and missing-data checks.


## P3 — YKMS-13 Inventory & Recipes


- Define inventory items, categories, units, and conversions.
- Add suppliers, purchasing, receiving, locations, movements, and transfers.
- Add recipes, packaging, sale/cancel/refund movements, waste, counts, and adjustments.
- Define negative-stock and costing policies with low-stock alerts.


## P4 — YKMS-14 Delivery & Driver Operations


- Define delivery provider and ownership models.
- Add dispatch, assignment, lifecycle timestamps, and internal/platform driver behavior.
- Add COD custody, settlements, shortages, overages, zones, fees, permissions, and reports.


## P5 — YKMS-15 Finance Control


- daily finance dashboard;
- expense categories, expenses, approvals, and attachments;
- cash in/out and shift reconciliation;
- card, wallet, bank, source, and platform reconciliation;
- source commissions, fees, and settlement cycles;
- driver settlement integration;
- tax, refund, closing, and lock-date controls;
- exceptions queue, exports, permissions, and audit.


## P6 — YKMS-16 Accounting Bridge, COGS & Profitability


- financial event outbox;
- chart and journal mapping;
- balanced immutable journal entries;
- reversal and period lock;
- inventory valuation and COGS;
- profitability by product, source, and branch;
- external accounting adapters;
- dry-run, backfill, and reconciliation controls.


## P7 — YKMS-17 Online / QR / Platform Connectors


- public ordering contracts;
- connector adapters and authentication;
- inbound order idempotency;
- menu publication and synchronization;
- webhook and event delivery;
- observability and retry controls.


## P8 — YKMS-18 Egyptian e-Receipt & Compliance


- accountant and legal validation;
- branch, device, and receipt identity;
- fiscal payload and signing boundary;
- submission, retry, rejection, and audit handling;
- compliance reporting and retention.


## Research and validation backlog


- confirm operational price rules per real source;
- obtain platform contracts and settlement statements;
- confirm tax treatment with accountant or legal advisor;
- define inventory costing method;
- define real driver and COD process;
- identify target external accounting software and API capabilities.
