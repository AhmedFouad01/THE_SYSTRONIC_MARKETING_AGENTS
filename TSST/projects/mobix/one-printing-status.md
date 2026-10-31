# MOBIX ONE — TSST printing checkpoint (MO-PRINT-001)
Date: 2026-10-31
Mode: supervised manual TSST routing; DEV_AG NOT_READY; no autonomous agent dispatched.

## Repo / refs
- Mobix One: `Do7a193/Mobix-One`
- Branch: `fix/MO-PRINT-001-mbx066-isolated-print-foundation`
- Verified GitHub code head at this checkpoint: `02382eca4d48538ef974cf15e92595f2571f34ee`
- Baseline: `71cc7387a37c84292da3c9daaae95f7d4b11c907`
- Reference Desktop MBX-066: `4c37ff6ee32383b65a5efecf9769211c94410a66`
- Source handoff: `docs/print/MO-PRINT-001-TSST-HANDOFF.md`

## Supervised TSST skills
- TSST-DEV-SK-009 — isolate printer/Winspool failure, timeout/partial print and retries.
- TSST-DEV-SK-011 — contract Node and Windows build, test-boundary parity.
- TSST-DEV-SK-012 — review cross-repository patch and preserve Mobix One preview-denial.
- TSST-DEV-SK-015 — restrict PASS claims to fresh exact-head operator evidence.
These skills are UNVALIDATED; applying their written procedures does not start or certify DEV_AG.

## Source work staged
- Port MBX-066 isolated worker, worker client and print routes into separate One branch; retain One accounting/project changes.
- Add three report preview routes without direct window.print. Preserve preview printer blocking and identity/data isolation.
- Import five dedicated MBX-066 contract test sources plus existing PowerShell gate; add One preview safety source gate.

## Verification
- GitHub source paths/branch: present (code staging only).
- No Node/PowerShell/Windows build executed for One; no 61/61 claim on One.
- No independent One PDF QA, native Windows test, SQL, physical USB/thermal printer or real driver exercised.
- Desktop-only 61/61 Node + dual Release build and synthetic PDF evidence is source provenance only.
- Physical printer currently unavailable; do not repeatedly ask for USB tests.

## Next single owner gate
Check out exact head on Windows, run `Tests/Run-MO-PRINT001-Preview-Safety-Gate.ps1` and `Tests/Run-MBX066-Print-P0-Gate.ps1 -Compile`, collect full failures/success and exact SHA. Then synthetic PDF QA without physical printer and a non-production isolated `MobixTest_*` database. Fix observed failures on One print branch before review.

## Governance
No GitHub Actions, merges, commercial ZIP, license bypass, client data operations, SQL modifications, GL cutover, TSST portfolio changes or CORE/DEV runtime activation.
Real Memory OS proposal-only sync pending; canonical apply requires controlled review.

## Owner Windows evidence and source follow-up (2026-10-31)
- On exact clone HEAD `f0605e1`: clean branch checkout confirmed; `Tests/Run-MO-PRINT001-Preview-Safety-Gate.ps1` SOURCE PASS (not Windows printing runtime).
- Inherited `Run-MBX066-Print-P0-Gate.ps1 -Compile` STOPPED at original unsafe iframe stocktaking print call; Node and MSBuild were **not** reached.
- One fix `cbbd8b2`: replaced only stocktaking browser-print export function with complete native document model (8 headings, all rows) and added five Node stocktaking route checks; remapped desktop feature-base check to One base commit; staged 3 missing PDF-only scripts with One-specific branch guards.
- One fix `79ca915`: updated supplier return print from browser `window.print()` to isolated native preview; added four Node cases preserving full document and failing closed for absent bridge/incomplete data.
- **Exact-head Windows acceptance at `79ca915` remains NOT RUN.** Preview static guard PASS pertains to earlier `f0605e1` only; no new results asserted.
- Next: fast-forward local clone to `79ca915`, rerun preview static gate and combined Node + dual Release build. Resolve first observed failure without treating historical Desktop results as One evidence.

## 2026-10-31 follow-up — missing WebView2 PackageReference restore
- Owner Windows evidence on One source `79ca915`: Node behavior/source tests PASS and PrintWorker Release compile PASS, main Mobix.exe compile FAILED with CS0234/CS0246 for Microsoft.Web.WebView2, WebView2, CoreWebView2 events/types.
- Root cause from source: Mobix.csproj already pins WebView2 `1.0.2592.51`; the Print P0 gate previously started Rebuild without restoring the PackageReference in a fresh clone. This is a build prerequisite diagnosis, not independent proof that all errors are resolved.
- Mobix One new HEAD `02382eca4d48538ef974cf15e92595f2571f34ee`: gate updated to perform MSBuild `/t:Restore`, verify NuGet project.assets.json contains WebView2 1.0.2592.51, fail closed on restore failure, then compile. No package version, financial, SQL, or app startup changes.
- Updated exact-head Windows RESTORE/BUILD still NOT_RUN. Previous owner results must not be promoted to a new-head PASS.

## 2026-10-31 — Owner Windows screenshot: full source and compilation gate PASS
- Owner PowerShell screenshot: Node TAP total **70 tests, 70 pass, 0 fail, 0 skipped**. `MBX-066 INVOICE + WORKER SOURCE CONTRACTS: PASS` explicitly printed.
- Pinned Microsoft.Web.WebView2 `1.0.2592.51` restored successfully in 4.42 seconds; source gate reports `MO-PRINT-001 WebView2 NuGet restore: PASS (package graph only)`.
- Windows MSBuild `18.9.1` compiled `Mobix.PrintWorker.exe` and `Mobix.exe` in the Mobix One Release output; `MBX-066 STATIC + WINDOWS COMPILATION GATE: PASS` explicitly printed.
- Expected source after last user update: `02382eca4d48538ef974cf15e92595f2571f34ee`. Screenshot does not display `git rev-parse HEAD`; confirm local SHA before binding final evidence to exact revision.
- Scope: code/contract and compilation only; NOT proof of successful PDF appearance, physical printer behavior, isolated database startup, real financial posting, licensing, installer or customer readiness.
- Next accepted step: run owner-controlled synthetic multi-page A4 PDF fixture with `-RunPdf`, explicitly select `Microsoft Print to PDF` in Windows PrintDialog, inspect pages 1 through last for repeated headers, lines 001-075 and footer. Do not launch Mobix.exe or access SQL for this fixture. Physical printer deferred.
- No GitHub Actions, PR merge, production SQL change, customer data use, firmware/driver install or runtime AV claimed. TSST DEV_AG NOT_READY, supervised method only.

## 2026-10-31 — multi-page A4 PDF screenshot evidence (3 pages)
- User supplied 5 Acrobat screenshots from `MO_ONE_MULTIPAGE_QA.pdf` after explicitly selecting the synthetic `Microsoft Print to PDF` route.
- The Acrobat page indicator shows 3 pages. Repeated 3-column headings (`Item`, `Quantity`, `Amount`) visible at start of pages 1, 2 and 3.
- Visible rows include 001-011 on page 1, 026-034 and 037-051 on page 2, 052-062 and 065-075 on page 3. The final row `TEST ITEM 075` with amount `225.00` is clearly present.
- `MBX-066 - TEST DOCUMENT` footer and page numbers visible on all 3 pages; wrapped long-name items 010/030/040/050/060/070 visible without obvious clipping in shown regions. No obvious page-break/header defect in screenshots.
- **Acceptance: SCREENSHOT VISUAL CHECK PARTIAL PASS** for repeat headers, last row, footer, 3-page layout; full 75-row PDF integrity, text extraction, all values and pixel QA NOT independently verified because actual PDF file not supplied. Do not assert complete PDF PASS or physical printer PASS.
- No source code changes, merge, actions, financial posting, SQL, commercial release or printer hardware used for this evidence.
- Next: run synthetic stocktaking 80-row A4 Landscape PDF fixture with `-RunPdf`, choose only Microsoft Print to PDF; inspect 8 headings, every row, signatures, Arabic shaping and page breaks; then Invoice and SupplierReturn fixtures. Keep physical printer and app runtime gates OPEN.

## 2026-10-31 — Owner-confirmed stocktaking synthetic PDF
- Owner reports: "كل حاجه مظبوطه و الجداول ظاهره" after running the synthetic `Run-MBX066-Stocktaking-A4-QA.ps1 -RunPdf` flow. Register **OWNER VISUAL ACCEPTANCE: PASS (reported)** for visible tables/layout on the A4 Landscape 80-row, eight-column Arabic stocktaking QA scenario.
- User did not upload the actual PDF or new screenshots. Row-by-row completeness, every 1-80 value, Arabic shaping and footer on every page are **not independently verified by assistant**. Preserve distinction between operator acceptance and file-level audit.
- Scope: synthetic file only, read-only worker fixture; no stock writes or real printer used. Prior 70/70 Node + dual MSBuild PASS and earlier 3-page A4 screenshot partial PASS remain unchanged.
- Next gate: two separate financial synthetic PDF tests: `-Scenario Invoice -RunPdf` (12 rows / four columns) and `-Scenario SupplierReturn -RunPdf` (43 rows / five columns), always Microsoft Print to PDF. Check last line, totals, headings, long descriptions and footer, and do not claim customer/business financial QA from synthetic PDFs.
- Physical print, licensing, isolated SQL app startup, installer and PR merge remain OPEN. DEV_AG not dispatched; no Actions.
