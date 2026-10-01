# Architecture design

## Proposed approach
One deployable modular backend and separately runnable workers. One relational primary database, object storage for private attachments, durable outbox, background queue and replaceable provider adapters. This is a logical architecture, not a declaration that a particular framework has been selected.

```mermaid
flowchart LR
  UI[Arabic / English web app] --> API[Authenticated application API]
  WEB[First-party forms and tracking] --> ING[Validated ingestion edge]
  PROVIDERS[Store and lead webhooks] --> ING
  ING --> CORE[CRM and event modules]
  API --> CORE
  CORE --> DB[(Tenant-scoped relational data)]
  CORE --> FILES[Private object storage]
  DB --> OUT[Transactional outbox]
  OUT --> WORK[Workers and execution ledger]
  WORK --> REPORT[Segments and attribution projections]
  REPORT --> DB
  WORK --> ADAPTER[Destination adapters]
  ADAPTER --> META[Meta]
  ADAPTER --> GOOGLE[Google Ads / Data Manager]
  ADAPTER --> GA4[GA4]
  WORK --> OBS[Metrics, redacted logs, traces]
```

## Module ownership
| Module | Owns | Does not own |
|---|---|---|
| Identity/tenancy | Memberships, agency grants, permission decisions | CRM identity matching |
| CRM | Contacts, inquiries, opportunities, stage history, tasks | Orders as accounting truth |
| Journey | Immutable business events, touches, identity-link evidence | Provider-reported attribution |
| Campaigns | External IDs, spend snapshots, taxonomy | Ad budget changes |
| Attribution | Versioned credit calculations and read models | Rewriting source events |
| Segments | Rule AST, membership, audience intent | Provider delivery receipts |
| Integrations | Connections, destinations, inbox/outbox deliveries | Business definitions of qualified/won |
| Operations | Plans, deliverables, approvals, projects | Sales pipeline semantics |

Modules communicate through application services and versioned events; avoid arbitrary cross-module writes. Read models may join through documented tenant-scoped views.

## Transaction boundaries
Lead creation or stage change, business event and outbox record commit in one database transaction. Provider calls happen afterward. Queue loss is recoverable by scanning undelivered outbox records. Workers are at-least-once; effects are idempotent. No claim of distributed exactly-once delivery.

```mermaid
sequenceDiagram
  participant Sales
  participant API
  participant DB
  participant Worker
  participant Provider
  Sales->>API: Move deal with expected version
  API->>DB: Authorize and atomically update + history + event + outbox
  DB-->>API: Commit
  API-->>Sales: Updated record
  Worker->>DB: Claim outbox with lease
  Worker->>Provider: Eligible mapped event, stable delivery key
  Provider-->>Worker: Receipt / per-item error
  Worker->>DB: Persist result, retry time or dead letter
```

## Tenant isolation choices
Preferred custom-build baseline: tenant_id on every business table, composite foreign keys, application authorization plus PostgreSQL row-level security. Runtime DB role must not own/bypass RLS; transaction-local tenant context must be reset safely with connection pooling. Jobs establish tenant context from trusted queue records, not browser input.

If Frappe is chosen, use its site/database-per-tenant architecture and implement explicit agency access through scoped APIs. If Twenty is chosen, verify workspace isolation, enterprise feature boundaries and upgrade behavior. Do not retrofit the custom PostgreSQL model blindly into an upstream framework.

Agency dashboard requests only authorized tenant projections. Platform operations are a separate control plane; cross-tenant customer queries are not a default admin feature.

## Stack evaluation
Custom candidate: TypeScript web/backend, PostgreSQL, Redis-backed queue with DB outbox recovery, S3-compatible private storage. Libraries and versions selected in M0 after dependency review. Frappe brings a different stack; framework choice is open, not a mandate to combine stacks.

Start with database indexes and scheduled aggregate tables. Add warehouse/search infrastructure only when measured query or event volume requires it. Scale ingestion and workers independently before splitting business services.

## Deployment topology
Development with synthetic data; isolated staging with test destinations; production with managed database backups, secrets manager, TLS and private storage. Separate provider credentials per environment. Database migrations follow expand → backfill → validate → switch → later contract. Backward-compatible event readers cover rolling deployments.
