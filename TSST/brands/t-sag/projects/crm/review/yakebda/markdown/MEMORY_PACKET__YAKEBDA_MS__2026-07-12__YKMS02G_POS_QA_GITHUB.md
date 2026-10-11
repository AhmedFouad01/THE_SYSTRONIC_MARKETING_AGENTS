YAKEBDA MS — MEMORY PACKET
Date: 2026-07-12
Packet: YKMS-02G / POS Operational QA / GitHub Workflow
Project Key: YAKEBDA_MS
Owner: Ahmed Fouad
Storage Layer: Google Drive / Real Memory project memory


1. Confirmed repository state
- Local repository: C:\Users\10\Downloads\yakebda_github_repo
- GitHub repository: AhmedFouad01/yakebda-ms
- PR #8 "YKMS-02G: Product, CRM, Orders, and RBAC Refinement" was merged into main.
- Merge commit: ec2e2835a97f01d738a1da6efce131efadecfd5a
- YKMS-02G included POS, Kitchen, Orders, Menu, Image Upload, Excel Import/Export, CRM, Users/Roles/Permissions, and QA polish.
- YKMS-02G validation before merge: 75/75 API tests and clean admin production build.


2. Current local checkpoint
- Active local branch: ykms-02g-e-pos-operational-qa-fixes
- This branch was created from updated main after PR #8 merge.
- The branch is not yet confirmed as pushed to GitHub.
- Current local implementation passed 75/75 API tests.
- Admin production build passed after adding apps/admin/src/vite-env.d.ts with Vite type references.
- The current changes are not yet confirmed committed or pushed.


3. Current local modified source set
- apps/admin/src/lib/api.ts
- apps/admin/src/pages/Menu.tsx
- apps/admin/src/pages/Pos.tsx
- apps/admin/src/pages/menu/ImageUpload.tsx
- apps/admin/src/ykms-02f.css
- apps/admin/vite.config.ts
- apps/admin/src/vite-env.d.ts
- apps/api/src/modules/menu.ts
- apps/api/src/modules/orders.ts
- apps/api/src/modules/shifts.ts


4. Implemented in the current local 02G-E checkpoint
- Single primary POS CTA: "طلب الآن".
- Current-shift order-history endpoint and POS history UI.
- Order creation flow can include payment in the order operation.
- Uploaded image URLs resolve through a shared asset URL helper.
- Vite development proxies /uploads to the API.
- Product image upload updates image_url and returns the updated product row.
- POS, Menu, and Product Editor use API-aware image URLs.
- Cashier can read their own active shift.


5. User-identified unresolved POS issues
- Shift controls and order-history controls are still visually positioned below/behind the main header.
- The product grid still renders too many cards per row and remains crowded.
- Current cards do not match the approved visual sample.
- Current-shift history presentation is not yet visually aligned with the active cart/order panel.
- Historical-order data mapping must be audited because payment, kitchen state, totals, timestamps, item count, and previous-order details may not match the intended operating model.


6. Approved next POS card direction
- Product card is for ordering only.
- No product editing controls inside the card.
- Product editing remains available from the top admin/management control.
- Card visual model: large image at top, large centered Arabic name, clear price, dark surface with YAKEBDA yellow accents, size row, bread row, quantity control at bottom.
- Grid target: maximum 4 cards per row on large desktop, 3 medium, 2 small, 1 narrow.
- No horizontal overflow; product panel scrolls vertically.


7. Approved card interaction
- Left click on product card: increment/add one item.
- Right click on product card: decrement/remove one item.
- Prevent browser context menu for this interaction.
- Required variant/bread/modifier choices cannot be bypassed.
- Quantity controls remain understandable and accessible.


8. Approved POS top layout
Directly below AppShell header, on top and without hidden overlap:
1. branch selector
2. cashier and shift state
3. open/close shift action
4. search
5. order-history control
6. admin control
7. category tabs
8. product grid


The fix must address layout structure, sticky offsets, stacking context, grid rows, and padding. Negative-margin or visibility-only workarounds are not accepted.


9. Approved order-history redesign
- Show current cashier orders from actual active-shift opening time, not "today".
- Each order row/card includes ordered-item images similar to the current cart/order panel.
- Reuse existing OrderDetail for full details.
- Audit and correctly map order number/prefix, order type, overall status, kitchen status, payment status/paid amount, totals, item quantities/count, product image, modifiers/variant/bread/notes, and all operational timestamps.


10. GitHub workflow decision
- Future development is preserved through GitHub branches, focused commits, and pull requests.
- Current local changes must be committed and pushed before the next stage is developed from GitHub.
- Temporary patch/helper scripts are not project source and must not be committed.
- Do not claim a branch/checkpoint is on GitHub until push is confirmed.


11. Windows application direction
Preferred future architecture, not yet implemented:
- Windows App SDK + WinUI 3 native shell
- WebView2 hosting existing React/Vite interface
- .NET native hardware bridge for printers, cash drawer, scanner, device identity, kiosk/startup, and customer display
- Preserve React as primary operating UI rather than rewriting POS in XAML


12. Immediate next actions
1. Commit validated current 02G-E local changes.
2. Push ykms-02g-e-pos-operational-qa-fixes to GitHub.
3. Continue from GitHub with focused checkpoints:
   A. POS top-toolbar structural alignment
   B. Product-card redesign and 4-column responsive grid
   C. Left-click add / right-click remove
   D. Remove edit operations from cards
   E. Order-history image presentation
   F. Historical-order data audit and correction
   G. Tests, build, viewport QA, and PR


13. FINAL CONFIRMED UPDATE — 2026-07-12


- The earlier unresolved/local-state sections in this packet are superseded by this final update.
- PR #9 was pushed, reviewed visually, marked ready, and merged into `main`.
- Final PR title: `fix(pos): finalize ordering workflow, product cards, and shift history`.
- Merge commit: `6d48d20100f0806b3de36367ec3b1ca7bf2fe1f1`.
- GitHub Actions run 48 succeeded; API tests passed 75/75; Admin production build passed.
- Manual desktop POS QA was accepted.
- Final POS baseline: visible toolbar below AppShell, deterministic four-column desktop grid, square images, corner price badge, selected-configuration quantity badge, stable card zones, no card overlap, inline size/bread selection, left-click increment, right-click decrement, image-based active-order lines, one `طلب الآن` CTA, active-shift order history, and safe image/product management.
- Repository documentation governance and AI workflow rules are active.
- Cloud-first + Windows client + offline-capable platform direction remains approved; the Windows framework remains pending an architecture spike.
- Authoritative current files were updated: `CURRENT_STATUS.md`, `PROJECT_MEMORY_MAP__YAKEBDA_MS.md`, and `CHAT_SYNC__YAKEBDA_MS__2026-07-12__PR9_FINAL_MERGE_POS_CARD_SYSTEM.md`.
