# CRMS-TSST-019 — Manager screens say "النظام" instead of "Edge"

Date: 2026-11-11 · Done by: TSST Lead (Claude, R61), no bus task · Owner OK: "ابدأ" (chat 2026-11-11)
Team: build · Skills applied: TSST-DEV-SK-011 (tests), TSST-DEV-SK-015 (verification)
Found in: left open by CRMS-TSST-015 (staff screens were fixed there; manager screens were not).

## Fix — Cafe branch `claude/crms-edge-wording-019`, `f6be50f` (from `b5ac7e0`), pushed, no PR

10 files, +67/−24. PWA only, wording only. No logic, API or SQL change.

- New `lib/edge-api/connectionLabels.ts` `CONNECTION_LABELS` (checking / online / degraded / unavailable → Arabic). AppLayout's local map was moved there.
- Administration: the state chip and the access summary show the Arabic state, where they showed "Edge: online" and "Local Edge". The alert says "النظام غير متصل…", and the descriptions no longer say Local Edge.
- Workforce: the state chip is in Arabic, and the timeout/offline errors say "تعذر الاتصال بالنظام" / "النظام غير متصل".
- BackOffice, Printing and LocationBalancesPanel: the same error wording. Printing's mock notice is "تمت إضافة طابعة تجريبية (Mock)."
- Left as is: `FoundationPage.tsx` still says "Local Edge API", but nothing imports it, so no one can see it.
- New tests (8): the label map; 5 manager pages have no Edge wording in their source; Administration (unavailable) and Workforce (online) render Arabic, with no "Edge" or raw state.

## Gates on `f6be50f` (cover 018 too)

- PWA 29 files, 240/240. `static-verify`, `typecheck`, `lint` and `build` exit 0. `@crms/testing` 8/8.
- `002w` PASS twice (`crms002w-verify-cf09f9c14291`, `crms002w-verify-155babe9fb82`). `002s` PASS. `002e` PASS (integration 65/65, Git Bash).

## QA environment

QA clone detached at `f6be50f`. No Edge or infra diff from `47b5747`, so only the PWA was rebuilt (PowerShell, `/api/v1`), the CA was copied, and the preview restarted. HTTP check: the title and manifest show the new names, and login through the proxy works. The screens were not checked in a browser.

## Dropped: item 3 (refresh grace window)

This was the refresh-reply-lost logout left open by 015. Accepting the previous refresh token for a short window breaks the 002a security check `scripts/crms-002a-runtime-verify.mjs:194` ("rotated refresh token replay was accepted" → must be 401). Ahmed decided (chat 2026-11-11): "سيبه بره" (out of the Beta). No branch was kept.

## Cafe records

`docs/gates/CRMS-CLOUD-HANDOFF.md`: 2 rows (the Android run, and 018/019) on `codex/crms-cashier-first-036`, `7ccf592`, pushed.

## Next

Ahmed decides on merging the stack (`codex/crms-cashier-first-036` … `claude/crms-edge-wording-019`). All of it is pushed (2026-11-11, his OK "اعمل push").
