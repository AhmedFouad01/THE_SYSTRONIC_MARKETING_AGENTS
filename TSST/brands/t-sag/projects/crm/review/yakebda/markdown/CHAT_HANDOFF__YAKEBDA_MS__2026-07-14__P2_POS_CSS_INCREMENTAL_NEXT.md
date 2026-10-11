CHAT HANDOFF — YAKEBDA_MS — NEXT: P2 POS CSS INCREMENTAL CHECKPOINT
Generated: 2026-07-14 07:22 Africa/Cairo


Start state
Use C:\Users\10\Downloads\yakebda-p2-clean on recovery/p2-ui-regression. Required exact HEAD: 7ffc96fa512acef2da33958c9b7b226206b8d4af. Verify a clean tree and local safety ref backup/p2-recovered-ui-7ffc96f. Remote PR #34 remains untouched at last verified head 3862b673cd7dc71a367360cca925b7f790aa5c2b.


Decision lock
Keep recovery commit 7ffc96f intact. It is the stable visual checkpoint. Do not split, amend, reset, or push it. R8 must be rebuilt incrementally rather than by another bulk CSS collapse.


Next task scope
Consolidate POS structural CSS only in theme.css and global-colors.css. Include POS shell/workspace, product grid/cards, category rail, cart, history presentation, and responsive variants. Do not edit KDS, Menu, Customers, Users, Settings, Reports, API, migrations, or business logic.


Preserve
Accepted AppShell geometry, five-product Full-HD grid, cart width and internal scrolling, fixed totals and submit area, category rail, product-card dimensions, image ratios, source and order-type controls, POS history, RTL, portal overlays, full-width navigation states, and Light/Dark semantic colors.


global-colors.css remains last and color-only. theme.css owns geometry. Add no raw colors and no new !important. Remove duplicate POS rules component-by-component using source order and scoped specificity. Do not chase metrics by deleting required visual rules.


Validation and stop
After each major selector group run Admin tests, Admin build, color contract, and git diff check. Final POS review must cover 1366x768 and 1920x1080 in Light/Dark, including closed POS with populated cart, category rail, cart totals, history drawer, and AppShell navigation drawer.


Stop before commit and return changed groups, before/after CSS LOC and !important counts, selector-definition counts, screenshot paths, validation results, git status, and diff stat for manual approval.


Later sequence
After POS: KDS; shared Admin/forms/tables/drawers; Settings/Menu/CRM; remaining cascade to 148 or fewer !important; then usePosConfiguration and usePosShellBindings extraction; then the full 24-image p2-after pack; final CI; explicit approval before Ready or merge.
