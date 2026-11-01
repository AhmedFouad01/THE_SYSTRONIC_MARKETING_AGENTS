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

## 2026-10-31 — Synthetic sales-invoice PDF screenshots (partial visual PASS)
- Two user-supplied Acrobat screenshots show a single-page Arabic mock sales invoice (`QA-INV-0001`) in the Invoice fixture of `Tests/Run-MBX066-Financial-A4-QA.ps1 -Scenario Invoice -RunPdf`.
- Four column headers are visibly legible in RTL (product, quantity, unit sale price, line total). Product rows 001-012 are visible across the two screenshots; the long `QA PRODUCT 009` description wraps without obvious clipping.
- Displayed expected total `294.00` matches the sum of the fixture line totals: 22+12+26+14+30+16+34+18+38+20+42+22=294.
- Large blank space below the 12-row A4 table is expected for a fixed-height page and is not itself a failure. However, page footer is **not visible in supplied screenshots**; do not assert absent from the PDF or complete footer PASS. Worker source includes `Footer(...)` in the generic page renderer; verify actual PDF bottom edge or original PDF to close this item.
- **Evidence classification:** screenshots reviewed, PARTIAL VISUAL PASS for Arabic heading, 12 rows, four columns, wrapping and arithmetic. Full one-page PDF extraction, footer, real invoice branding/logo, customer/tax/discount data, runtime print bridge and physical printer NOT verified. Do not infer commercial readiness.
- Next: synthetic `SupplierReturn` PDF, 43 rows and 5 columns. Save via Microsoft Print to PDF only, then inspect page breaks/repeated headings, totals, final row, Arabic, footer. No printer or SQL required.

## 2026-10-31 — SupplierReturn synthetic PDF screenshot gate
- Owner supplied four Acrobat screenshots from MO_ONE_SUPPLIER_RETURN_QA.pdf (2 pages, QA-RETURN-0001, synthetic data only).
- Arabic title, five columns and RTL headers visible. Page 1 includes visible items 001-020; page 2 begins with item 021 and clearly includes final item 043. Numbered page footers are visible for both pages.
- Repeated five-column headings visible on page 2. Longer descriptions (items 009, 018, 027, 036) wrap without obvious clipping in supplied screenshots.
- Expected synthetic total 2080.00 is shown, and arithmetic is consistent with fixture generation (43 lines, alternating quantities 2 and 1 and prices 11..53).
- SCREENSHOT VISUAL PARTIAL PASS for inspected sections. Actual PDF bytes and every row were not independently audited. This is not live supplier-return, database, physical-printer, or deployment acceptance.
- Printer QA next: read-only Windows environment preflight, then a separately gated disposable MobixTest_* / legitimate preview license startup review. Hardware, packaging, merge and Actions remain closed/unapproved. TSST DEV_AG remains NOT_READY.

## 2026-10-31 — Windows read-only preflight evidence
- Owner PowerShell screenshot shows repo at `C:\Users\Do7a\MobixOne-PrintQA`, branch `fix/MO-PRINT-001-mbx066-isolated-print-foundation`, HEAD `a2ebf437d0fe77e04a7f4ff6b3888968e810ff51`, working tree clean.
- `MO-ONE-Windows-Preflight.ps1`: solution, Mobix project, PrintWorker project, UI index all TRUE; MSBuild discovered; .NET Framework >=4.8 TRUE; SqlLocalDB command exists TRUE. `Test database variable valid: False` means `MOBIX_TEST_DATABASE` was unset/invalid in that process.
- This is READ-ONLY operator preflight only: no program launch, database connection, SQL writes, licensing test or packaging. Red PowerShell errors above preflight are stray pasted test-output lines interpreted as commands, not evidence of this preflight failing.
- Next: set `MOBIX_TEST_DATABASE=MobixTest_OnePreview01` only in current shell, re-run preflight and query LocalDB `master` only for candidate name existence, without opening Mobix.exe. Confirm a legitimate isolated preview license and runtime paths before any startup.

## 2026-11-01 — Mobix One isolated preview LocalDB preflight READY (read-only; no DB created)
- **Owner Windows PowerShell screenshot** from `C:\Users\Do7a\MobixOne-PrintQA`: `MO-ONE-Windows-Preflight.ps1` reports solution, main/worker project files, UI index all **True**; branch `fix/MO-PRINT-001-mbx066-isolated-print-foundation`; exact HEAD `a2ebf437d0fe77e04a7f4f66b3888968e810ff51` (also matches current remote One feature branch), clean working tree **True**, MSBuild discovered, .NET Framework >=4.8 **True**, SQL LocalDB tool **True**, and `MOBIX_TEST_DATABASE` candidate naming valid **True**.
- Owner set `$env:USERPROFILE\MobixOne-PrintQA` as checkout and in this PowerShell session set `$env:MOBIX_TEST_DATABASE = 'MobixTest_OnePreview01'`. Using `System.Data.SqlClient.SqlConnection` to `(localdb)\\MSSQLLocalDB;Initial Catalog=master;Integrated Security=true`, user executed **parameterized read-only** `SELECT COUNT(*) FROM sys.databases WHERE name=@name`. Result **SQL connection PASS; Test database name available: True**, meaning matching DB does **not exist yet**. This is not an executed startup or database creation. No customer data, mutations, migration, licensing, packaging or print job demonstrated.
- **Next safe phase:** read-only `Tests/Run-MO-PRINT001-Preview-Safety-Gate.ps1` source protection gate and inspection/confirmation of preview license plus explicit isolation of DB connection paths before any Mobix.exe launch, SQL CREATE DATABASE, migration or disposable runtime smoke. Preview license must be legitimate. Do not mistake the unused DB name for an isolated app: the application may default to existing databases if connection handling is not established.
- **Workstream separation:** this screenshot pertains to MOBIX_ONE / MO-PRINT-001. The **Desktop MBX-066 66/66 Windows gate** was a separate source/product and is not newly tested here. No merge, Actions, commercial installer, physical XP-233B or GL cutover. TSST DEV_AG remains NOT_READY.

## 2026-11-01 — Owner Windows preview print protection source gate PASS
- Owner screenshot in `C:\Users\Do7a\MobixOne-PrintQA`, following the read-only preflight / parameterized LocalDB master name check: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Tests\Run-MO-PRINT001-Preview-Safety-Gate.ps1` outputs **`MO-PRINT-001 Preview protection SOURCE gate PASS (runtime not validated)`**. The static code patterns for One barcode/thermal print denial, document preview guards, external worker denial, and three report UI routes were found. Exact screenshot preflight HEAD `a2ebf437d0fe77e04a7f4f66b3888968e810ff51` and clean tree; upstream One branch was independently checked at this exact revision.
- **Not proven:** preview licensing valid, fresh database created/migrated, real app startup, real session access controls, physical printing, installer/package, business/financial results. Candidate `MobixTest_OnePreview01` was confirmed **absent** from LocalDB; availability is not database creation.
- **Next read-only gate:** check for **presence only** of a legitimately signed `license.allic` under the isolated `MobixOnePreview` data roots (ProgramData, LocalAppData, Temp fallback), and existence of the two local Release EXEs and WebView2 loader/UI resources. Do **not** copy customer/legacy licenses or share license contents; mere file presence is not signature/license validity. `Program.Main` checks the license before running `PreMigrationBackupGuard`, `DatabaseInitializer.EnsureDatabase` and multiple schema `Ensure` calls, therefore **do not launch `Mobix.exe` yet**. Complete isolated database write-path audit/explicit approval before startup. PR/merge/Actions/real printers remain blocked.

## 2026-11-01 — Owner preview artifacts/license *presence* check PASS (no app launch)
- Owner PowerShell screenshot at `C:\Users\Do7a\MobixOne-PrintQA`: branch `fix/MO-PRINT-001-mbx066-isolated-print-foundation`, short SHA `a2ebf43`, `Clean: True`, `PreviewLicensePresent: True`, `MobixExePresent: True`, `PrintWorkerPresent: True`, `UIIndexPresent: True`. The check only queried file existence across `ProgramData/MobixOnePreview`, `LocalAppData/MobixOnePreview`, `Temp/MobixOnePreview` and the existing `Mobix/bin/Release` folder.
- **Scope:** no proof the signed preview license is valid, currently selected `AppPaths.SharedDataRoot` contains the license (ProgramData takes precedence when writable), or the existing binaries were built from the current exact head. No application launch, DB creation/write, migration, physical print or package approval; isolated LocalDB candidate remains unused.
- **Next step:** owner Windows **manual Release rebuild from verified clean checkout**, capture compile output / source SHA / both EXE hashes and read-only listing of candidate license locations (presence only; never share license contents). Build requires MSBuild and writes only isolated checkout build outputs. Do not launch `Mobix.exe --preview` until actual preview license selected path, DB startup init / migration safety gates and non-client data isolation are reviewed. Print protection SOURCE gate previously PASS; runtime remains NOT VALIDATED.

## 2026-11-01 — Preview Release files + SHA-256 + ProgramData-only license presence (owner screenshot)
- Owner Windows PowerShell screenshot in `C:\Users\Do7a\MobixOne-PrintQA` reports **PASS** on file existence for `Mobix.exe`, `Mobix.PrintWorker.exe` and `Ui/index.html` in `Mobix\bin\Release`. SHA-256 hashes for both EXEs are displayed, but source SHA/provenance is **not established** by local file hashes.
- A separate `Write-Host 'RELEASE BUILD: PASS'` message appears; **actual MSBuild command output/exit status is not visible in the supplied frame**, so do **not** claim independent verified build-pass solely from this screenshot.
- License file presence: `ProgramData\MobixOnePreview\license.allic=True`, `LocalAppData\MobixOnePreview\license.allic=False`, `Temp\MobixOnePreview\license.allic=False`. ProgramData is first candidate but `AppPaths.ResolveSharedDataRoot` verifies writability then falls back: its **effective selected path is still not runtime-confirmed**. Presence is NOT signature, product, device/clock, or license-state validation.
- **Next safe non-mutating owner action**: use PowerShell .NET reflection to call the isolated current EXE's existing private `AlAsdekaaERP.Licensing.LicenseService.TryReadSignedPayload(path, out payload)` against ProgramData license. This method performs read-only envelope/base64, RSA-SHA256 signature with current/legacy embedded public keys, payload parse and `ProductCode` equality only; print **booleans only**, never license contents, customer details, device fingerprint, or signing keys. This is NOT full `ValidateInstalledLicense` (which updates protected runtime state) nor proof of a genuine active license. Do NOT start `Mobix.exe` or create SQL until explicit isolated startup test gate.
- Product isolation: this is **MOBIX_ONE / MO-PRINT-001**, not MOBIX Desktop MBX-066. No application launch, SQL create/migration, printing, Actions, PR merge, installer or license reactivation.

## 2026-11-01 — Owner reports signed preview license / expiry check SUCCESS (self-reported)
- Owner confirmed "تمام نجحت" after correcting the PowerShell reflection argument type for `LicenseService.TryReadSignedPayload`. This is a **user-reported** `SignatureAndProductValid=True` and `LicenseExpiryCheck=PASS` outcome; an output screenshot of the successful rerun was **not attached**. Prior failed screenshot showed only a PowerShell parameter conversion error, which must not be misclassified as an invalid license.
- **Remaining blockers:** the signed payload alone does **not** check the device fingerprint, clock rollback protection, stored runtime state, or effective AppPaths preview license location. `LicenseService.ValidateLicenseFile(path, false)` explicitly validates signature, product, issued/expiry timestamps, read-only runtime clock anchors and hardware binding, without SaveLastSeen (its `AppPaths.SharedDataRoot` locator uses a transient create/delete writability probe in the preview folder). Verify the selected `LicensePath` equals the ProgramData preview license and pinned `Db.DatabaseName == MobixTest_OnePreview01` **without opening SQL**. Do not run the executable or migrate/create a database before those gates and explicit isolation approval.
- No Actions, merge, printer, installation, customer DB or application startup. This concerns **MOBIX_ONE / MO-PRINT-001**, not Desktop MBX-066.

## 2026-11-01 — New isolated preview identity gate staged (NOT RUN)
- MOBIX_ONE print feature branch only: `fix/MO-PRINT-001-mbx066-isolated-print-foundation`; commit `7d69d7d6622dc4be1053f4258a767a66c333bc97`.
- New isolated PowerShell preflight: `Tests/Run-MO-PRINT001-Preview-Identity-Preflight.ps1`. It loads the locally built Release assembly for inspection WITHOUT invoking Program.Main, pins `MOBIX_TEST_DATABASE=MobixTest_OnePreview01`, validates resulting SQL connection targets `(localdb)\\MSSQLLocalDB`, asserts the effective `MobixOnePreview` data/license root, invokes `LicenseService.ValidateLicenseFile(path, false)` for full read-only license validation, and checks LocalDB master catalog for name collision using parameterized SELECT.
- Existing AppPaths directory selection performs a temporary write/delete probe ONLY in the isolated MobixOnePreview folder; no customer data/SQL mutation. License runtime last-seen updates are disabled by passing false. Do not print signed license or device details.
- GitHub source file existence verified, Windows script **NOT RUN**; compile-to-current-SHA provenance not proven and no runtime PASS claimed. No Mobix.exe startup, DB creation/migration, physical printer, installer, merge, GitHub Actions or DEV_AG dispatch.
- **Next owner gate:** on clean local feature checkout, `git pull --ff-only` then `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\\Tests\\Run-MO-PRINT001-Preview-Identity-Preflight.ps1`; retain only the PASS/BLOCKED output. Do not launch the application until database/filesystem/startup isolation has separate acceptance.

## 2026-11-01 — Owner exact-head preview identity preflight PASS; build provenance gate staged
- Owner PowerShell screenshot from `C:\Users\Do7a\MobixOne-PrintQA`: clean feature branch HEAD `7d69d7d6622dc4be1053f4258a767a66c333bc97`. The first attempted pasted command was malformed and returned BLOCKED, but the subsequent standalone invocation completed with `MO-PRINT-001 PREVIEW IDENTITY PREFLIGHT: PASS`. This successful rerun supersedes the malformed attempt.
- Explicit PASS lines: isolated database identifier, branch, SHA, clean tree, Release EXE presence, pinned preview DB, SQL connection isolation, effective preview data directory, legacy path rejection, effective preview license path, selected license file, `ValidateLicenseFile(path,false)` full read-only license validation, LocalDB master read-only target and unused test DB name.
- Important limit: `Mobix.exe` was **not launched**. `MobixTest_OnePreview01` does **not exist**. `ValidateLicenseFile(false)` reads signature/product/expiry/clock/device and does not persist last-seen state; `AppPaths` may create/delete a transient writeability probe in preview folders. Existing Release binaries were loaded for inspection; their exact build-to-source SHA provenance remains unverified.
- Next source-only tooling commit `9160350f2d33a5944e1d377c6ede6848a5546a9b`: new `Tests/Run-MO-PRINT001-Exact-Source-Build-Gate.ps1` checks clean branch+SHA, runs existing One safety source gate, 70 Node source contracts plus pinned WebView2 restore and dual Release rebuild, then records main/worker SHA-256 and same source SHA. **NOT RUN** on owner Windows yet; no runtime/SQL/printing PASS.
- Next owner command: `git pull --ff-only`, then `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Tests\Run-MO-PRINT001-Exact-Source-Build-Gate.ps1`. Do not run Mobix.exe until startup write-path and disposable SQL fixture approvals. No Actions, merge, installer, production database, printer, license bypass or autonomous DEV_AG.


## 2026-11-01 — Exact-source One Windows build BLOCKED: PowerShell EXE file lock (owner screenshot)
- Owner Windows screenshot from `C:\Users\Do7a\MobixOne-PrintQA` after running `Tests/Run-MO-PRINT001-Exact-Source-Build-Gate.ps1`.
- `Mobix.PrintWorker.exe` target was reported built; main `Mobix.exe` Rebuild could not overwrite `Mobix/bin/Release/Mobix.exe` because **Windows PowerShell PID 2316** held a lock. Visible MSB3061/MSB3026 retries ended with **MSB3027** and subsequent `MBX-066 Mobix Release compile failed`; wrapper concluded `MO-PRINT-001 EXACT-SOURCE WINDOWS BUILD GATE: BLOCKED`.
- Most likely cause is preceding PowerShell .NET `Assembly.LoadFrom` inspection of the same Release EXE in a still-open Windows PowerShell host. This is an environment/file-lock blocker, not evidence of a source compiler error, and does not constitute a Windows dual-build PASS at the new HEAD. Do not modify source or delete EXE/obj files to work around it.
- Owner next: close the old PowerShell session(s) holding the executable (check PID 2316 if needed), open a **fresh** PowerShell window, navigate to `$env:USERPROFILE\MobixOne-PrintQA` and rerun `powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\Tests\Run-MO-PRINT001-Exact-Source-Build-Gate.ps1"`. No app launch, SQL changes, customer data, printer, installer, Actions, or PR merge.
