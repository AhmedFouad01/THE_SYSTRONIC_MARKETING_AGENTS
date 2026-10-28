# MOBIX — TSST current checkpoint
Date: 2026-10-28
State: MOBIX_DESKTOP ACTIVE_SUPERVISED / MBX-066 PRINT P0 IN_PROGRESS; TSST DEV_AG runtime NOT_READY and NOT dispatched.

## Active workstream — MOBIX Desktop
- Repository: `Do7a193/Mobix`; branch: `fix/MBX-066-print-p0-isolation-failclosed`; draft PR #49 remains unmerged.
- Current source checkpoint: `docs/print/MBX-066-P0-IMPLEMENTATION.md` on that feature branch (code/documentation as of 2026-10-28).
- Native invoice preview response corrected: `Mobix/Ui/printer-settings.js` commit `08259791`; obsolete `useSystemDialog` does not fall back to WebView `window.print()`; preview opened is no longer falsely described as printer submission.
- Executable JS regression `Tests/MBX066-PrinterInvoiceResponse.test.cjs` commit `1c976ba`; PowerShell gate update `839bdb0`; documentation commit `bb8828b`.
- Windows operator gate on source `f941e1c`: **stored Node invoice regression 5/5 PASS** and static source checks passed. The gate stopped before compilation because `msbuild.exe` was not found on PATH; .NET Framework 4.8 release builds, thermal 58/80 mm, A4, XP-233B printing and PDF fidelity are **NOT VERIFIED**.
- Script-only MSBuild discovery improvement committed as `0558511`; Windows rerun still pending. Desktop print report checkpoint `37b784a`. No installation or merge performed.
- Next: exact-HEAD Windows source gate + .NET Framework 4.8 build of Mobix and PrintWorker, printer fault-injection and print-to-PDF/paper parity; then audited plan for remaining report `window.print()` routes. No automatic rerun of paper jobs.
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
