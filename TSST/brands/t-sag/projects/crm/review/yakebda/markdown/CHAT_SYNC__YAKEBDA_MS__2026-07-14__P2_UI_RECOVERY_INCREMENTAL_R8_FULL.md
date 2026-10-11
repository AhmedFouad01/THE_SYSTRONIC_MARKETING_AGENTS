CORRECTION — LITERAL TRANSCRIPT ADDED
The original document below is an execution summary. A separate verbatim user-message transcript has now been created: CHAT_TRANSCRIPT__YAKEBDA_MS__2026-07-14__P2_UI_RECOVERY_R8_LITERAL.


Future full chat syncs must include a literal transcript in addition to status and handoff documents.


==================================================


YAKEBDA_MS Full Chat Sync — 2026-07-14
Generated: 2026-07-14 07:22 Africa/Cairo


Scope and decision
The active phase is P2 Maintainability on PR #34. UI V2 remains a future planning track after P2, not current implementation. Any future modernization needs a separate ADR and RTL-first proof of concept.


Verified remote GitHub state
Repository: AhmedFouad01/yakebda-ms. PR #34 is Open, Draft, mergeable, unmerged, and targets main. The last live-verified remote head is 3862b673cd7dc71a367360cca925b7f790aa5c2b. Its description is stale. The local recovery work has not been pushed or applied to the PR.


Safe local state — user/Codex reported
Worktree: C:\Users\10\Downloads\yakebda-p2-clean. Branch: recovery/p2-ui-regression. Current local HEAD: 7ffc96fa512acef2da33958c9b7b226206b8d4af. Working tree reported clean. Safety ref backup/p2-recovered-ui-7ffc96f points to the same SHA. The original dirty checkout remains protected and was not used for recovery edits.


Recovery history
The earlier bulk R8 CSS collapse caused severe visual regressions in AppShell, POS, KDS, drawers, backdrops, and Light/Dark contrast. A recovery revert restored the overall layout and the overlay system was then repaired. Commit 7ffc96f is the first stable visual checkpoint and is protected by the backup ref.


Recovery commit contents
The recovery changes nine Admin frontend files: theme.css, global-colors.css, overlays.tsx, overlays.test.tsx, AppShell.tsx, Orders.tsx, PosCartLine.tsx, PosCart.tsx, and PosWorkspace.tsx. The shared overlay implementation now mounts outside page containers, supports Escape, focus trap and restoration, ref-counted body scroll locking, backdrop close behavior, RTL right-side drawers, a shared stacking contract, and a DialogLayer for Orders detail. AppShell navigation uses the shared Drawer and full-width interaction rows.


Visual recovery status
Representative POS and Orders states were manually reviewed in Light/Dark and at 1366/1920 sizes. Portal mounting, scroll lock/unlock, Escape, backdrop close, readable Light Mode, full-width navigation states, and product-image rendering were confirmed. KDS, Menu, Customers, and Users were not all captured individually after recovery, so final parity is still open.


Product images
The broken-image finding was classified as local environment/data rather than a P2 code regression. Uploads are gitignored. Files copied locally for review are not part of the commit, and missing assets must not be hidden with CSS.


Critical R8 result
The stable recovery restored the legacy cascade. Exact audit metrics: 2 imported CSS files, 9,745 CSS LOC, and 1,450 !important declarations. The frozen baseline is 1,483 and the target is 148 or fewer, so the current reduction is only 2.23%. R8 is not complete. Major restored groups include POS about 546 and KDS 131. Current selector-definition counts include .posx-head 0, .posx-grid 9, .posx-card 0, .uif-overlay 3, .uif-drawer 5, .modal-back 2, and .modal 11.


Recovery decomposition decision
Keep commit 7ffc96f intact. The CSS diff contains more than 1,000 rollback hunks and a mixed hunk in theme.css, so a blind split risks another regression. Use the commit and backup ref as the stable safety checkpoint, then re-consolidate by domain.


Incremental R8 sequence
1. POS structural CSS.
2. KDS CSS.
3. Shared Admin, forms, tables, and drawers.
4. Settings, Menu, and CRM.
5. Remaining cascade until total !important is 148 or fewer.
Each checkpoint requires Admin tests, Admin build, color contract, diff check, and Light/Dark visual review at 1366x768 and 1920x1080. Avoid another bulk rewrite.


Immediate next gate — POS CSS
Start only from exact local HEAD 7ffc96fa512acef2da33958c9b7b226206b8d4af with a clean tree and verified backup ref. Limit changes to POS structural CSS in theme.css and global-colors.css. Preserve accepted AppShell geometry, five-product Full-HD grid, cart width and internal scroll, fixed totals and submit area, category rail, product cards, source and order-type controls, POS history, RTL, and Light/Dark semantics. global-colors.css remains final and color-only; theme.css owns geometry. Consolidate component-by-component and stop before commit for manual approval.


R9 and R10
Pos.tsx is 7 LOC, but usePosController.ts remains 404 LOC. After CSS stability, extract usePosConfiguration and usePosShellBindings as coherent ownership units, targeting roughly 285–300 LOC without duplicated state. The Admin safety net currently reports 11 tests across three files.


Validation contradiction
One recovery report recorded API TypeScript failures and one read-permissions test failure that also occurred on main. A later audit reported no known baseline failure. This remains unresolved. Final validation must rerun API typecheck, full API tests, and migration idempotency on the eventual final head and compare any failure with an exact main checkout.


Visual parity
The accepted p2-before pack contains 24 images plus a manifest for POS, KDS, Orders detail, Menu, Customers, and Users at two resolutions and both themes. The p2-after pack is missing. Final acceptance requires all 24 after images and real manual review.


Safety and stop conditions
Keep the temporary automation blocklist: .github/p2-temp, the two P2 apply/enable workflows, and scripts/.p2-capture-after.mjs. The approved visual-baseline script remains scripts/p2-capture-visual-baseline.mjs. PR #34 stays Draft. No claim of push, CI success, full visual acceptance, Ready, merge, deployment, or sync is valid without direct confirmation.


Finish incremental R8, complete R9, generate and review the full after pack, run exact final validation and CI, update the PR body, and obtain explicit approval before Ready or merge.
