# MOBIX — TSST current checkpoint
Date: 2026-10-28
State: MOBIX_WEB ACTIVE_SUPERVISED / NOT_RELEASE_READY; TSST DEV_AG runtime NOT_READY and NOT dispatched.

## Active workstream — MOBIX_WEB
- Repository: Do7a193/Mobix.Web; branch: architecture/MBX-WEB-CA03-inventory-core.
- Current source checkpoint: docs/testing/MBX-WEB-TSST-SUPERVISED-CLOSEOUT-2026-10-28.md (Web feature branch).
- Code-only guarded independent API customer GET helper: scripts/Test-MBX-WEB-CA03-Customer-Persistence-ReadOnly.ps1. **Not yet Windows-executed.**
- Existing verified CA03 test-only SQL supplier/customer/product restart persistence PASS; customer UI edit and browser refresh PASS; independent GET still OPEN.
- Next: start clean Windows CA03 local API/Web, then execute independent fixture customer GET and capture exact source SHA/result. Later product/supplier UI and private-HTTPS Android, exact-head full gates.
- UX01 and CA03 branches diverged materially: selective audited integration required before Sales; no blind merge.
- No GitHub Actions, SQL migrations, real customer data, merge or deployment performed.

## Other products
- MOBIX Desktop: MBX-066 print P0 remains IN_PROGRESS, draft PR #49 unmerged; previous checkpoint preserved in status-history.md.
- MOBIX_ONE: no change, separate repo/project.

## Governance
- TSST Lead supervision and DEV method references: SK-011, SK-012, SK-015 (UNVALIDATED); **no autonomous agent started**, TSST Core/portfolio untouched and frozen through 2026-11-15.
- Canonical MOBIX_WEB Real Memory controlled review/apply still pending. No production or skills readiness promotion.
- Do not repeat CA01 and accepted CA02/CA03 gates without change-risk; no Actions without specific owner approval.
