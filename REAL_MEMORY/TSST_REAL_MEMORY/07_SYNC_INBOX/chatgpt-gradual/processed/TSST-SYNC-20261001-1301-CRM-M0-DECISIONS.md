# TSST Gradual Sync Packet

- **Packet ID:** `TSST-SYNC-20261001-1301-CRM-M0-DECISIONS`
- **Project Key:** `TSST`
- **Date/Time:** `2026-10-01 13:01 Africa/Cairo`
- **Source chat/topic:** CRM Engineering Blueprint v0.2 audit, owner decisions, and M0 preparation
- **Current TSST milestone:** `TSST-001 — Foundation & Agent Operating Model`
- **Current TSST gate:** `TSST-001A — Requirements & Governance Intake`
- **Packet state:** `INCOMING / NOT YET APPLIED`

## Confirmed facts added / changed

1. The working repository folder is `THE_SYSTRONIC_MARKETING_AGENTS` on Google Drive/local synced drive.
2. `CRM_BLUEPRINT/` exists in that working repository and currently contains the 11-document engineering blueprint (`README.md` + `01` through `10`).
3. CRM Blueprint v0.1 was preserved in local Git commit:
   - `bb89734f30522532e720111c90c76095db00405f`
4. CRM Blueprint v0.2 audit remediation was preserved in local Git commit:
   - `e09446c54ae202a7415006fd61b891242b0e7f7f`
5. Branch reported by the local execution was `master`.
6. No push occurred for either commit.
7. No CRM application/product code had been implemented at the v0.2 checkpoint.
8. Audit result reported after remediation: `PASS WITH OPEN DECISIONS`.
9. Owner has now explicitly selected **Custom Build** as the CRM product foundation.
10. Owner direction for the remaining defaults: use standard scalable patterns that support future growth rather than short-lived shortcuts.
11. Working baseline defaults confirmed for M0 planning:
    - fixed RBAC/action catalogue + scoped grants; deny by default;
    - tenant isolation with `tenant_id`, tenant-equal composite references, application authorization and PostgreSQL RLS;
    - API retry-cache idempotency separated from durable source/business deduplication and provider-delivery idempotency;
    - complete authorized tenant portability/export as a workflow distinct from privacy subject export/delete;
    - deterministic First Touch + Last Non-Direct Touch attribution baseline with configurable default 30-day lookback;
    - conversion truth separated by business profile: services/agency default to `deal_won`; commerce keeps ordered/paid/delivered separate with `payment_captured` as default revenue truth unless explicitly overridden.
12. M0 is now a **Custom-Build Foundation Spike**, not a Twenty/Frappe/custom selection exercise.

## Files / links created or changed

Working source folder:
- `THE_SYSTRONIC_MARKETING_AGENTS/CRM_BLUEPRINT/`
- Drive folder ID: `1qSpc65lzBs2VOBGYmB-i-6fJCdTeGVYP`

Drive files updated on 2026-10-01 to reflect owner decisions:
- `CRM_BLUEPRINT/README.md`
- `CRM_BLUEPRINT/03_ARCHITECTURE.md`
- `CRM_BLUEPRINT/08_DELIVERY_PLAN.md`
- `CRM_BLUEPRINT/09_DECISIONS_RISKS.md`

The Drive updates confirm Custom Build, M0 custom-build exit gates, scalable RBAC/tenancy/idempotency/export/attribution/conversion defaults, and preserve the statement that implementation evidence has not yet been produced.

## Decisions made

### Product-level decisions (CRM project artifact; do not copy wholesale into TSST durable memory)
- Custom Build selected as CRM foundation.
- Modular monolith + workers remains the intended architecture direction.
- Standard scalable defaults above are approved as the baseline direction.
- M0 proves/finalizes concrete libraries, versions, security/isolation behavior, recovery and evidence; it does not reopen upstream CRM foundation selection.

### TSST orchestration boundary
- `CRM_BLUEPRINT` remains a product engineering artifact in the working repository.
- TSST memory should retain only orchestration state, source pointers, handoff/checkpoint information and approved cross-project boundary decisions.
- Do **not** merge the 11 CRM product documents into TSST durable memory as canonical TSST content.

## Pending items

- Run M0 Custom-Build Foundation Spike on a dedicated feature branch (recommended: `feat/crm-m0-foundation`).
- Freeze concrete TypeScript/frontend/backend libraries and versions after dependency/security/license review.
- Produce synthetic evidence for tenant isolation, RBAC/revocation, one controlled CRM transition, business event + outbox/worker idempotency, audit, RTL/LTR, migrations and backup/restore.
- OQ-01–OQ-12 remain configuration/evidence inputs or explicit override decisions; they no longer reopen the foundation choice.
- TSST operating baseline v0.1 is still not approved in durable Real Memory; `TSST-001A` remains open until separately approved.

## Risks / blockers

- Product implementation may move ahead operationally in the working repository while TSST governance onboarding is still incomplete; this must not be misrepresented as TSST baseline approval.
- Google Drive sync and local Git history are different mechanisms; Drive content updates do not create a Git commit by themselves.
- M0 must not be treated as passed until executable evidence exists.
- No provider eligibility, production security, load, backup/restore or integration success may be claimed from documentation alone.

## Proposed exact memory targets (for review before durable apply)

1. `04_SOURCE_MAP/PROJECT_SOURCE_MAP.md`
   - Add `THE_SYSTRONIC_MARKETING_AGENTS/CRM_BLUEPRINT/` as an explicitly connected **working/external product source**, not canonical TSST memory.
   - Record the Drive folder ID `1qSpc65lzBs2VOBGYmB-i-6fJCdTeGVYP` and the isolation rule.

2. `05_TIMELINE/PROJECT_TIMELINE.md`
   - Add 2026-10-01 checkpoint: CRM Blueprint v0.1 preserved, v0.2 audit remediation completed, Custom Build selected, M0 preparation opened.

3. `02_PROJECT_MEMORY/PROJECT_DECISIONS.md`
   - Add only a TSST boundary/orchestration decision: product engineering artifacts such as CRM_BLUEPRINT stay outside TSST durable product memory; TSST stores pointers and orchestration checkpoints.
   - Do **not** copy CRM ADR-001..015 into TSST decisions.

4. `02_PROJECT_MEMORY/PROJECT_BACKLOG.md`
   - Add an orchestration item to define/approve the CRM product handoff pattern and ownership between TSST Lead and DEV_AG as part of TSST operating-baseline onboarding.

5. `01_CURRENT_STATUS/CURRENT_STATUS.md`
   - No automatic gate change proposed. Optionally note the CRM working-source checkpoint while retaining `TSST-001A` as the authoritative active gate.

## Confidence / uncertainty notes

- High confidence: Drive file existence/content, Drive update results, owner statements in this chat, and commit SHAs reported by the local Codex run.
- Medium confidence: local Git branch/commit state is user/Codex-reported and was not independently inspected through a local filesystem Git tool in this ChatGPT session.
- Explicit uncertainty: no M0 implementation evidence exists yet; concrete package versions, hosting, provider access and production sizing remain unresolved.

## Review instruction

Validate this packet against current TSST memory and existing incoming packets. Detect duplicates/conflicts before proposing durable changes. Apply nothing to durable TSST memory until explicit user approval of the change set.
