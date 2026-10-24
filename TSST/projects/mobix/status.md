# MOBIX — TSST current checkpoint

Date: 2026-10-24
State: SETUP_STAGED; pending RM review/apply and TSST registry activation.
Products: `MOBIX` Desktop, `MOBIX_WEB`, `MOBIX_ONE`; separate repositories, separate release/test status.
Completed: verified repository names and canonical Real Memory OS repo; created 3 isolated `rm-sync` packets; created TSST project entry.
Not done: current per-repo HEAD/build/QA audit; accepted memory write plan; portfolio registration; code changes.
Lead: TSST Lead. Engineering route: DEV_AG (readiness NOT_READY; no automatic dispatch).
Next: review the 3 setup packets against latest code + older checkpoints; approve the exact RM targets and apply via controlled flow; then choose one product's current gate.
Blockers: unverified product-specific latest build/QA gates; TSST Core freeze through 2026-11-15.
do_not_repeat: no rewrites from scratch; don't repeat closed Windows/CI gates; don't equate One with legacy; don't start MBX-WEB-MKT01 integrations; don't assume master/main is deployed; don't use client databases for destructive tests.
