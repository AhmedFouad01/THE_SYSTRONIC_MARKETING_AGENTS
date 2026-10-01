# Software Requirements Specification v0.1

Priority: P0 = pilot gate; P1 = subsequent release; P2 = commercialization. All requirements are proposed implementation specifications derived from the confirmed scope.

| ID | Priority | Requirement | Acceptance criterion |
|---|---|---|---|
| TEN-01 | P0 | Every business record belongs to exactly one tenant | Tenant A cannot list/read/change/export tenant B records through UI, API, jobs or files |
| TEN-02 | P0 | Explicit scoped agency grants with expiry/revocation | Revoking a grant blocks new requests and pending privileged actions; audit identifies real actor |
| IAM-01 | P0 | Role and action permissions, MFA for privileged roles | Sales rep cannot export contacts or connect ad accounts without permission |
| CRM-01 | P0 | Intake from web form, CSV, manual entry and Meta adapter | Source identifiers retained; same source event replay creates no extra lead |
| CRM-02 | P0 | Contacts separate from leads and deals | One contact can have several inquiries/deals; direct order does not require a deal |
| CRM-03 | P0 | Controlled duplicate review and merge | Shared phone produces a review candidate; explicit merge retains provenance and audit |
| CRM-04 | P0 | Configurable pipelines with transition rules | Invalid transition rejected; accepted transition records actor, old/new stage and time atomically |
| CRM-05 | P0 | Owner, next action, due date and escalation | Overdue task appears to owner/manager; repeated job does not create repeated escalation |
| CRM-06 | P0 | Loss reasons, reopen history and version checks | Stale concurrent stage update returns conflict; reopening does not resend old conversion |
| TRK-01 | P0 | Event ingestion with schema versions and consent context | Invalid schema rejected; forbidden fields stripped/rejected; invalid event not counted |
| TRK-02 | P0 | Explicit tenant-local identity linkage | Known form submission links eligible prior session events; shared IP never merges users |
| TRK-03 | P0 | Separate business event from transport delivery | Browser/server copies of one action produce one canonical outcome; retries preserve identity |
| CMP-01 | P0 | Campaign/ad identifiers and UTM capture | Name changes do not break historical joins; unknown source stays unknown |
| CMP-02 | P0 | Import costs with source account/timezone/currency/grain | Reloading a reporting interval updates it without duplicating spend |
| ATR-01 | P0 | Versioned attribution model and lookback | Same inputs/model version yield same credits; excluded/out-of-window touches receive no credit |
| ATR-02 | P0 | Business, internal-attribution and provider reports distinct | Dashboard labels window, time basis and source; provider conversions are not summed as unique sales |
| INT-01 | P0 | OAuth/credential lifecycle and owned destination mapping | Disconnect stops deliveries; tenant cannot route data to another tenant's destination |
| INT-02 | P0 | Durable outbox, retry, per-item errors, dead-letter handling | Simulated crash/retry loses no committed conversion and creates no new logical conversion |
| INT-03 | P0 | Meta lead intake and eligible conversion events | Test lead imported once; test conversion receipt and diagnostic evidence attached |
| INT-04 | P0 | Google Ads eligible conversion route, separate GA4 adapter | Capability probe selects supported route; partial failures surfaced per event |
| SEG-01 | P0 | Versioned AND/OR rule segments with preview | Preview and materialization agree on fixed fixture; membership records rule version/as-of time |
| SEG-02 | P0 | Audience sync only for eligible destinations/subjects | Opt-out prevents addition and queues supported removal; failed removal remains visible |
| COM-01 | P0 | Order, fulfillment, payment, refund stored separately | Cancelled/unpaid orders cannot inflate paid revenue; event reversal retains original history |
| SRV-01 | P0 | Survey appointment and quote/deal references | Rescheduling keeps appointment history; accepting one quote doesn't accept other versions |
| OPS-01 | P1 | Monthly plans, tasks, asset versions and client approvals | Approval binds to exact version; replacement requires new approval |
| OPS-02 | P1 | Service project milestones after sale | Winning a deal creates at most one linked project using a repeatable command |
| WF-01 | P0 | Narrow internal automation: trigger/condition/task/notification | Execution ledger prevents repeated side effect; disabled rule stops future runs |
| WF-02 | P1 | Outbound messaging through approved channel adapters | Current channel permissions checked at send time; quiet hours and opt-out respected |
| DAT-01 | P0 | Export/deletion/retention workflow | Export excludes unauthorized fields; deletion removes identifiers from active stores and schedules supported provider removals |
| SAS-01 | P2 | Plan entitlements and usage metering | Disabled entitlement enforced server-side; retry cannot bill twice |

## Proposed nonfunctional acceptance targets
| ID | Target | Verification |
|---|---|---|
| NFR-01 | API p95 <500ms for indexed core reads, excluding external calls | Staging benchmark: 10 tenants, 100k contacts/tenant, 1m events/tenant, 50 concurrent active users total |
| NFR-02 | Valid intake durably acknowledged p95 <1s at 50 events/s total | Sustained 30-minute load; no accepted-event loss across worker restart |
| NFR-03 | Internal segment/report freshness ≤15min under benchmark | Measure ingestion-to-visible lag; show stale timestamp when missed |
| NFR-04 | Proposed production availability 99.9% monthly; RPO ≤15min, RTO ≤4h | Restore drill and operational evidence before promising these to customers |
| NFR-05 | RTL/LTR, keyboard flows, contrast and mobile layout | Manual review of lead intake, pipeline, contact timeline and reporting at 360px and desktop |
| NFR-06 | Traceable privileged mutations and secret-free logs | Audit tests plus log scanning of auth/integration/error paths |

Third-party processing latency is not included in internal freshness guarantees. Numeric targets must be re-estimated against the chosen foundation and hosting cost in M0.
