# TSST Real Memory Gradual Sync Packet


- Packet ID: `TSST-SYNC-20261003-0102-CRM-M2-MVP-DIRECTION`
- Project Key: `TSST`
- Date/Time: `2026-10-03 01:02 Africa/Cairo`
- Source Chat/Topic: Systronic CRM — M2 implementation checkpoint and decision to accelerate toward MVP
- Current TSST Milestone: `TSST-001 — Foundation & Agent Operating Model`
- Current TSST Gate: `TSST-001A — Requirements & Governance Intake`
- Packet Type: gradual sync / incoming only


## Confirmed facts added or changed


1. CRM product branch: `feat/crm-m2-journey-reporting`.
2. M1 closure documentation commit: `93bd92a2a148d0f751a2f8735ae3896a25b3532e`.
3. M2 implementation commit: `ba841c90b64e8bc4bb49c47247bd724f36e3a3a6`.
4. M2 evidence follow-up/documentation SHA: `acd0398`.
5. M2 bounded implementation covers:
   - TRK-01/02/03;
   - CMP-01/02;
   - ATR-01/02;
   - COM-01.
6. M2 implementation includes migration `006_journey_reporting.sql`, Journey service, Reporting UI, tests/verification tools, contracts and `CRM_APP/M2_EVIDENCE.md`.
7. M2 local validation status:
   - **82 passed / 0 failed / 0 skipped**;
   - all prior M0/M1 tests remain **55/55 PASS**;
   - lint/typecheck/build/diff checks PASS;
   - clean install and M1→M2 upgrade PASS;
   - 48 pre-upgrade rows across 30 existing tables preserved;
   - protected keys/ciphertext unchanged;
   - 17 new M2 tables use FORCE RLS;
   - tenant/RBAC/security checks passed on real PostgreSQL.
8. M2 bounded local implementation verdict is **PASS**, but M2 is **not yet closed** because the independent M2 audit has not yet been completed.
9. No M3+, memory sync beyond this packet, Git push, Git merge, or sub-agent execution was performed as part of the M2 implementation.
10. User direction is now to **prioritize completing the MVP quickly** rather than mechanically completing the entire long roadmap before a usable pilot.


## Current M2 capability checkpoint


- Server-side web/form collection with tenant/site isolation and durable dedup.
- Explicit identity linking/correction with provenance and no silent shared-identifier merge.
- Separate commerce order/payment/fulfillment/refund truth with no fabricated deals or double counting.
- Deterministic attribution v1:
  - First Touch;
  - Last Non-Direct Touch;
  - default configurable 30-day lookback;
  - late-event recalculation;
  - explicit unknown/unattributed behavior.
- Journey/reporting UI with Arabic RTL / English LTR and narrow/desktop coverage.


## Proposed MVP direction — NOT YET AN APPROVED BASELINE


The working MVP completion proposal is to optimize for a usable pilot flow:


Lead / Intake
→ Contact
→ Deal
→ Pipeline
→ Follow-up Task
→ Won/Lost
→ Journey / Reporting


Proposed MVP completion scope:
- login/auth + permissions + multi-tenant isolation;
- Contacts / Leads / Deals / Pipelines;
- Tasks / follow-up and narrow automation;
- web/form intake;
- journey, conversions and basic attribution;
- Arabic RTL + English LTR;
- responsive desktop/mobile;
- audit log;
- basic reporting/dashboard;
- one real lead-source integration only for the first pilot, with Meta Lead Ads suggested as the likely first provider, or a generic webhook if speed is prioritized;
- pilot deployment;
- minimum safe production auth/secrets/backup setup.


Proposed defer-until-after-MVP items:
- additional Google Ads / GA4 / Shopify/provider integrations beyond the selected first source;
- segments/audience sync;
- agency operations;
- SaaS billing;
- advanced attribution;
- AI scoring;
- multiple provider integrations.


This scope remains **Needs decision** until the user explicitly approves the MVP baseline and first real integration/provider.


## Pending items


1. Run one independent M2 audit against `ba841c90b64e8bc4bb49c47247bd724f36e3a3a6` + evidence follow-up.
2. If audit passes without blockers, close M2.
3. Explicitly approve the MVP scope and first live integration/provider.
4. Convert the roadmap from milestone-completion mode to bounded `MVP Pilot Ready` gate if approved.
5. Implement only the missing MVP gaps required for a real end-to-end pilot.
6. Run one final MVP E2E audit before declaring MVP ready.


## Risks / blockers


- M2 has not yet received independent audit closure.
- Docker/direct-Drive execution remains unverified.
- Production identity/MFA and external secret custody/KMS remain unverified.
- Production bot mitigation/capacity is not established.
- Pre-M2 service outcomes lack historical amount snapshots; first M2 normalization snapshots current deal value unless separate historical source evidence is provided.
- MVP scope/provider choice is still open and must not be silently treated as approved.


## Proposed exact memory targets


1. `05_TIMELINE/PROJECT_TIMELINE.md`
   - Add M2 bounded implementation checkpoint and user direction to prioritize MVP completion.
2. `02_PROJECT_MEMORY/PROJECT_BACKLOG.md`
   - Add independent M2 audit as immediate next gate.
   - Add `MVP Pilot Ready` scope-definition/approval item.
3. `02_PROJECT_MEMORY/PROJECT_MEMORY_MAP.md`
   - Update CRM external workstream pointer: M1 closed, M2 implemented/pending independent audit, MVP acceleration requested.
4. `04_SOURCE_MAP/PROJECT_SOURCE_MAP.md`
   - Keep CRM Blueprint/CRM_APP as detailed engineering source; TSST memory stores orchestration/status only.
5. `01_CURRENT_STATUS/CURRENT_STATUS.md`
   - Do not change TSST-001A automatically. Optional external-workstream note only.
6. `02_PROJECT_MEMORY/PROJECT_DECISIONS.md`
   - Do NOT record the proposed MVP scope as accepted until explicit approval.
   - Record only the user-confirmed strategic direction: prioritize MVP completion over completing the full roadmap first.


## Confidence / uncertainty notes


- High confidence: branch, commit SHAs, test counts, implemented M2 scope and local PASS are supported by current M2 evidence.
- High confidence: M2 is not independently closed yet.
- High confidence: the user's strategic priority is to finish the MVP quickly.
- Medium confidence: the exact MVP scope and first live integration/provider remain open because the user has not yet explicitly approved the proposed baseline.
- No production-readiness claim is inferred.


## Review instruction


Before durable apply:
- validate this packet belongs to TSST;
- detect duplicates/conflicts with prior CRM M0/M1 sync packets;
- preserve the TSST-vs-CRM product boundary;
- keep M2 as pending independent audit until audit evidence exists;
- do not promote the proposed MVP scope to an accepted decision without explicit approval;
- keep TSST-001A unchanged unless separately approved.