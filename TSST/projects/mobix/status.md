# MOBIX — TSST current checkpoint
Date: 2026-10-29
State: MOBIX_DESKTOP ACTIVE_SUPERVISED / MBX-066 PRINT P0 IN_PROGRESS; TSST DEV_AG runtime NOT_READY and NOT dispatched.

## Active workstream — MOBIX Desktop
- Repository: `Do7a193/Mobix`; branch: `fix/MBX-066-print-p0-isolation-failclosed`; draft PR #49 remains unmerged.
- Current source checkpoint: `docs/print/MBX-066-P0-IMPLEMENTATION.md` on that feature branch (code/documentation as of 2026-10-29).
- Native invoice preview response corrected: `Mobix/Ui/printer-settings.js` commit `08259791`; obsolete `useSystemDialog` does not fall back to WebView `window.print()`; preview opened is no longer falsely described as printer submission.
- Executable JS regression `Tests/MBX066-PrinterInvoiceResponse.test.cjs` commit `1c976ba`; PowerShell gate update `839bdb0`; documentation commit `bb8828b`.
- 2026-10-29 operator Windows evidence at exact checkout SHA `37b784a`: **Node invoice regression 5/5 PASS** (0 failures) and **MBX-066 STATIC + WINDOWS COMPILATION GATE: PASS**. Both `Mobix.PrintWorker.exe` and `Mobix.exe` were built in the Release output with Visual Studio Community MSBuild 18.9.1.
- Source packaging review: both projects output beside one another; commercial packaging scripts require and stage `Mobix.PrintWorker.exe` but **no installer or staged package was executed/verified**. Checkpoint recorded in Desktop `docs/print/MBX-066-P0-IMPLEMENTATION.md` commit `2a8e571`; this is documentation only after the tested source SHA.
- **Synthetic one-page A4 PDF smoke visual PASS (2026-10-29):** isolated PrintWorker produced `MBX066_A4_TEST.pdf`; screenshot shows title, subtitle, two body lines, 3 headers and 2 complete synthetic rows. Footer and actual A4 pagination unverified; no production DB or real invoice. Recorded on Desktop feature branch doc commit `2d52694`.
- **A4 multi-page finding (2026-10-29):** operator's 75 synthetic-row PDF has 3 pages; pages 2/3 visibly omit column headings while rendering the visible row data. Last row 075 and footer not shown/confirmed. Source root cause: table headings were guarded by `rowIndex == 0`.
- **A4 repeat-header fix built on Windows:** code commit `d1951d9` and source regression `969ebc1` were included in operator's `a8c538a` checkout; 5/5 invoice Node checks and both Release builds **PASS**. Corrected 75-row PDF still **NOT VERIFIED**.
- **QA harness race identified:** the synthetic A4 PDF runner used `& $worker $payload` against a GUI WinExe, which can return to Windows PowerShell before process exit, letting the script delete the JSON payload. Operator screenshot shows `Worker exited normally` next to a GUI `payload file missing` error. Code-only harness fix `47bf920` now uses `Start-Process -Wait -PassThru`; source gate `0a50198` prevents async regression; print report doc `80b4592`. **New runner Windows result remains NOT_RUN**.
- **Operator UX follow-up 2026-10-29:** a second PDF QA attempt was cancelled because the Save As filename was typed at the `Type PDF` PowerShell confirmation prompt (source `80b4592`); no new PDF was produced. QA-only script now takes explicit `-RunPdf` switch (commit `8be7798`) and no longer asks for a confirmation string; static gate commit `395a30e`, Desktop documentation commit `90e335d`. No worker/DB/installer changes. New QA execution remains OPEN.
- **Next:** fast-forward the feature branch and run `Tests/Run-MBX066-A4-Page-Header-QA.ps1 -RunPdf`, choose Microsoft Print to PDF manually, enter output filename in Windows Save As, then verify repeated column headers, `TEST ITEM 075` and complete footer.
- **Physical printer and release QA still OPEN:** revised A4 multi-page/PDF first/last row and footer, thermal 58/80 mm, XP-233B barcode RAW/GDI, real invoice UI and output parity, spooler/driver faults, printer queue outcome, stocktaking multi-page and supplier return, and remaining `window.print()` routes. No automatic retries.
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
