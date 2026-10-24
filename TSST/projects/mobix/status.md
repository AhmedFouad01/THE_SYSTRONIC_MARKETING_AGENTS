# MOBIX — TSST current checkpoint

Date: 2026-10-24
State: SETUP_STAGED; Desktop P0 print workstream IN_PROGRESS; pending RM controlled apply and TSST portfolio activation.
Products: `MOBIX` Desktop, `MOBIX_WEB`, `MOBIX_ONE`; separate repositories, release/test status and checkpoints.
Lead: TSST Lead. Skill methods: DEV SK-009, SK-011, SK-012, SK-015 (UNVALIDATED, DEV_AG NOT_READY).

## Active Desktop workstream — MBX-066

- Base: `Do7a193/Mobix` branch `fix/MBX-065-v15.5.17-canonical-database-identity`, commit `998763fdcfc03e51d255918283af5ba063d6e01f`.
- Working branch: `fix/MBX-066-print-p0-isolation-failclosed`.
- Draft PR: https://github.com/Do7a193/Mobix/pull/49 (**no merge**).
- Done at source level: fail closed on PrintPage exceptions; isolate getState/saveSettings/testPrinter/printBarcode via PrintWorker process while reusing existing RAW TSPL/GDI rendering; add bounded 90s wait and error/unknown outcome; add regression gate.
- Evidence: 8/8 direct source-contract assertions passed; `Tests/Run-MBX066-Print-P0-Gate.ps1` committed but not executed.
- NOT VERIFIED: Windows MSBuild, Windows runtime, printer driver fault/hang recovery, XP-233B prints, physical invoice output, installer packaging, production release.
- Remaining P0 risk: legacy browser-level `window.print()`/stocktaking iframe paths not yet isolated. Do not replace with unverified generic rendering; preserve landscape pagination and row fidelity.
- Implementation checkpoint: https://github.com/Do7a193/Mobix/blob/fix/MBX-066-print-p0-isolation-failclosed/docs/print/MBX-066-P0-IMPLEMENTATION.md
- Real Memory proposed packet: https://github.com/AhmedFouad01/real-memory-os/blob/main/05_GLOBAL_SYNC_INBOX/chatgpt/pending/2026-10-24_MOBIX_MBX066_PRINT_P0_PROGRESS.rm-sync.md
- Next: Windows `Tests/Run-MBX066-Print-P0-Gate.ps1 -Compile` and printer fault QA; isolate remaining WebView print paths with fidelity; request review before merge.

## Cross-product governance

The initial 3 isolated Real Memory setup packets remain pending review/apply. No canonical RM statuses have been auto-promoted, no portfolio auto-discovery changed. TSST Core is frozen through 2026-11-15; only the project pointer/status was updated. No client database, prices, licenses, configuration or customer data modified.
Do not repeat already closed accounting/Windows QA gates without changed-risk evidence. Do not confuse Desktop with Mobix Web or One. Keep GitHub Actions disabled unless explicitly authorized as necessary. Default branch is not presumed production.
