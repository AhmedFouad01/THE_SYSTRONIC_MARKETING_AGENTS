# MOBIX — TSST current checkpoint
Date: 2026-10-29
State: MOBIX_DESKTOP ACTIVE_SUPERVISED / MBX-066 PRINT P0 IN_PROGRESS; TSST DEV_AG runtime NOT_READY and NOT dispatched.

## Active workstream — MOBIX Desktop
- Repository: `Do7a193/Mobix`; branch: `fix/MBX-066-print-p0-isolation-failclosed`; draft PR #49 remains unmerged.
- Current source checkpoint: `docs/print/MBX-066-P0-IMPLEMENTATION.md` on that feature branch (code/documentation as of 2026-10-28).
- Native invoice preview response corrected: `Mobix/Ui/printer-settings.js` commit `08259791`; obsolete `useSystemDialog` does not fall back to WebView `window.print()`; preview opened is no longer falsely described as printer submission.
- Executable JS regression `Tests/MBX066-PrinterInvoiceResponse.test.cjs` commit `1c976ba`; PowerShell gate update `839bdb0`; documentation commit `bb8828b`.
- 2026-10-29 operator Windows evidence at exact checkout SHA `37b784a`: **Node invoice regression 5/5 PASS** (0 failures) and **MBX-066 STATIC + WINDOWS COMPILATION GATE: PASS**. Both `Mobix.PrintWorker.exe` and `Mobix.exe` were built in the Release output with Visual Studio Community MSBuild 18.9.1.
- Source packaging review: both projects output beside one another; commercial packaging scripts require and stage `Mobix.PrintWorker.exe` but **no installer or staged package was executed/verified**. Checkpoint recorded in Desktop `docs/print/MBX-066-P0-IMPLEMENTATION.md` commit `2a8e571`; this is documentation only after the tested source SHA.
- **Physical printer and release QA still OPEN:** thermal 58/80 mm, XP-233B barcode RAW/GDI, A4 print-to-PDF/paper comparison, spooler/driver faults, printer queue outcome, stocktaking multi-page and supplier return, and remaining `window.print()` routes. No automatic retries.
- Next: controlled test environment and printer/PDF acceptance at exact tested source; preserve production data and verified business logic. No customer installer or PR merge until approved.
- No merge, Actions, release, deployment, SQL mutations, financial logic changes or real client data operations.

## Paused workstream — MOBIX_WEB
- Repository: Do7a193/Mobix.Web; branch: architecture/MBX-WEB-CA03-inventory-core.
- Current source checkpoint: docs/testing/MBX-WEB-TSST-SUPERVISED-CLOSEOUT-2026-10-28.md (Web feature branch).
- Code-only guarded independent API customer GET helper: scripts/Test-MBX-WEB-CA03-Customer-Persistence-ReadOnly.ps1. **Not yet Windows-executed.**
- 2026-10-28 source-only P0 principal hardening: test script commit `399b674`; closeout document commit `acc74e5`. Nine manual source-contract assertions PASS, but **PowerShell/Windows runtime remains NOT_RUN** and independent customer GET remains OPEN.
- Independent P1 source risk logged: browser may restore an expired access token from `sessionStorage` and display empty catalog rows after 401; do not misclassify this as proof that customer SQL data disappeared.
- Existing verified CA03 test-only SQL supplier/customer/product restart persistence PASS; customer UI edit and browser refresh PASS; independent GET still OPEN.
- Next: start clean Windows CA03 local API/Web, then execute independent fixture customer GET and capture exact source SHA/result. Later product/supplier UI and private-HTTPS Android, exact-head full gates.
- UX01 and CA03 branches diverged materially: selective audited integration required before Sales; no blind merge.
- No GitHub Actions, SQL migrations, real customer data, merge or deployment performed.

## Other products
- MOBIX Web: P0 independent customer GET remains OPEN; paused under the owner's explicit switch to Desktop. Its CA03 source checkpoint and tests remain intact.
- MOBIX_ONE: no change, separate repo/project.

## Governance
- TSST Lead supervision and DEV method references: SK-011, SK-012, SK-015 (UNVALIDATED); **no autonomous agent started**, TSST Core/portfolio untouched and frozen through 2026-11-15.
- Canonical Real Memory controlled review/apply remains pending for MOBIX, MOBIX_WEB, MOBIX_ONE. No production or skills readiness promotion.
- Do not repeat completed MBX-065 (Desktop) or CA01 and accepted CA02/CA03 (Web) gates without change-risk; no Actions without specific owner approval.
