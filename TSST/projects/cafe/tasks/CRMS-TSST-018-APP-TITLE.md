# CRMS-TSST-018 — Arabic page title and installed-app name

Date: 2026-11-11 · Done by: TSST Lead (Claude, R61), no bus task · Owner OK: "ابدأ" (chat 2026-11-11, the 3-item list after the Android run)
Team: build · Skills applied: TSST-DEV-SK-011 (tests), TSST-DEV-SK-015 (verification)
Found in: real Android run 2026-11-11. The Chrome tab on the phone and on the PC said "CRMS Edge".

## Fix — Cafe branch `claude/crms-app-title-018`, `b5ac7e0` (from `47b5747`), pushed, no PR

- `apps/pwa/index.html`: `<title>` is "نظام إدارة الكافيه والمطعم" (the login heading).
- `apps/pwa/vite.config.ts` manifest: `name` is the same; `short_name` "الكافيه" (was "CRMS").
- New `apps/pwa/src/app/app-title.test.ts` (2 tests): there is no "Edge" in the title or the manifest.

## Gates

Run on `f6be50f` (019, built on this branch). See `CRMS-TSST-019-EDGE-WORDING.md`.

## Next

CRMS-TSST-019.
