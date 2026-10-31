# MOBIX ONE — TSST printing checkpoint (MO-PRINT-001)
Date: 2026-10-31
Mode: supervised manual TSST routing; DEV_AG NOT_READY; no autonomous agent dispatched.

## Repo / refs
- Mobix One: `Do7a193/Mobix-One`
- Branch: `fix/MO-PRINT-001-mbx066-isolated-print-foundation`
- Verified GitHub code head at this checkpoint: `f0605e1154a7aed46cea7eb40c763dd351948d27`
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
