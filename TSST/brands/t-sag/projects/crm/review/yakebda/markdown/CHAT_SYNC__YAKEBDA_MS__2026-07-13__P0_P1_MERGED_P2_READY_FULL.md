# YAKEBDA_MS — FULL CHAT SYNC


Date: 2026-07-13
Trigger: RM_SYNC_NOW
Project Key: YAKEBDA_MS
Memory: REAL_MEMORY v0.6.3
Repository: AhmedFouad01/yakebda-ms


## Continuity


هذا الشات امتداد مباشر لشغل YAKEBDA MS. تم قبول إصلاحات واجهة POS بصريًا، ثم تقرر تجميد أي Feature جديدة وتنفيذ برنامج Audit بالترتيب P0 ثم P1 ثم P2 ثم P3. كل مرحلة لها PR مستقلة وCheckpoint commits واختبارات وCI قبل الدمج.


## Accepted UI baseline


- AppShell بدون Back button وبدون عنوان ظاهر نقطة البيع.
- Store control صغير بجوار Home، وShift history icon-only، والبحث بعدهما مباشرة.
- اسم المستخدم وإجراء الشيفت في cluster واحد، مع theme/logout compact.
- Arabic RTL محفوظ.
- Product Grid وKDS لا يتم تغييرهما إلا بطلب صريح.
- theme.css هو semantic token source.
- global-colors.css هو final color authority وآخر import إلى أن يتم consolidation منضبط في P2.


## Prior UI merge


تم دمج PR #19 إلى main. مرجع main بعده كان:
`d52ab28c928e57a75aff249f57032f18f379f27f`


## P0 — Security and Finance


PR #20 — branch `fix/p0-security-finance`
Final head: `0efd2d126704342604d0b11a258e7d109faf5375`
CI Run #278: success
Merged: yes
Merge SHA: `ecb0705ccbea4f375d27ed7481f6041b03461ee8`


Completed:
- Payment integrity at API/database boundaries; no zero/negative real payment, duplicate full payment, or overpayment; order row locking.
- Atomic order numbering regression protection; existing allocator uses PostgreSQL advisory transaction lock and numbering_key.
- Email/PIN abuse protection with rate limits, failed count, temporary lockout, and sanitized failed-login audit.
- settings.view and customers.view permissions, POS/KDS runtime allowlist, branch scoping, protected CRM list, operational lookup preserved.


## P1 — Operational Reliability


PR #28 — branch `fix/p1-reliability`
Final validated head: `09ed21a1e14e805ffa49790efabfe6041df3d1bf`
Final CI Run #288: success
Merged: yes
Merge SHA: `26bafdced9faa126a120cbdf8a564a84725aa2dd`


R5 completed:
- Atomic SKIP LOCKED print-job claim.
- retry attempts with terminal dead state.
- protected stuck-job recovery endpoint.
- Migration 20260713_018_print_job_reliability.


R6 completed:
- POST /api/v1/orders/:id/refund.
- Immutable negative refund rows linked to original payments, preserving method, shift, and reason.
- Over-refund prevention.
- Paid-order cancellation creates full reversal before cancelled; payment history remains.
- Shift totals include reversals; minor-unit money math.
- variance and over_short persisted; unsettled warnings shown without blocking close.
- Migration 20260713_019_refunds_shift_variance.


R7 completed:
- Standalone payment insert and payment.record audit execute in one transaction.
- Audit failure rolls payment back.
- Print enqueue happens after commit as best-effort and cannot roll back accepted money.




## Current verified GitHub state


- main is exactly `26bafdced9faa126a120cbdf8a564a84725aa2dd`.
- PR #20: closed and merged.
- PR #28: closed and merged.
- No open pull requests at sync time.
- No P2 branch or PR exists yet.
- No claim is made that old branches were deleted.


## P2 — Maintainability approved plan


Source brief: `YKMS-P2-MAINTAINABILITY-FIXES.md`
Planned branch: `refactor/p2-maintainability`
Base: live current main at execution start.
Scope only: R8 CSS consolidation, R9 Pos.tsx split, R10 frontend tests. No API or migration work.


### First checkpoint: inventory and visual freeze


Before any refactor:
- List every CSS import in `apps/admin/src/main.tsx`.
- Record line count and `!important` count for every stylesheet.
- Inventory duplicate definitions, especially `.posx-head`, `.posx-grid`, and `.posx-card`.
- Measure current LOC of `apps/admin/src/pages/Pos.tsx`.
- Create `docs/engineering/CSS_CONSOLIDATION_PLAN.md`.
- Capture reference screenshots at 1366x768 and 1920x1080 for POS, KDS, Orders detail, Menu, Customers, and Users.


### R10 safety net before R9


Wire Vitest and Testing Library into apps/admin, add `admin:test`, and add a CI step. Minimum coverage:
- cart totals and quantity/variant deltas;
- bread and size selection gating;
- payment gating, loading, failure retention, and clear-on-success only;
- `resolveAssetUrl`;
- overlay Escape and focus trap.


### R8 CSS consolidation


- Consolidation only, not redesign; screenshot parity is authoritative.
- Resolve duplicate selectors component by component.
- Target no more than three logical stylesheets: tokens/theme, base, and POS/KDS.
- Move rules first; delete final/fix/closure files only after emptying them.
- Reduce `!important` by at least 90 percent.
- Keep semantic color ownership and do not introduce raw colors into the global semantic layer.
- Fix RTL drawer animation so it enters from the right.
- Add shared `useFocusTrap` for Drawer and Modal.
- Replace remaining physical directional properties with logical properties.


### R9 Pos.tsx split


After the test safety net:
- Extract `Cart.tsx`.
- Extract `ProductGrid.tsx`.
- Extract `PaymentPanel.tsx`.
- Extract `OrderHistory.tsx`.
- Keep `Pos.tsx` as orchestrator with shared state only; do not duplicate state.
- Target less than roughly 300 LOC.
- Preserve mandatory source selection, variants and bread, one order action, clear only on success, OrderDetail history, and `resolveAssetUrl`.


## P2 definition of done


- One branch and one separate Draft PR for P2.
- Small checkpoint commits.
- No more than three CSS files.
- `!important` reduced by at least 90 percent.
- One authoritative definition per component.
- RTL drawer from the right and focus trap active.
- Pos.tsx orchestrator below roughly 300 LOC.
- Frontend tests wired into CI and green.
- Admin build, color contract, and visual parity green.
- Final report includes created/deleted files, CSS metrics before/after, Pos LOC before/after, and test count.


## Non-negotiable constraints


- No new feature work before the required remediation program is complete.
- No Ready, merge, rebase, or retarget without explicit user direction and live GitHub verification.
- Backend quote remains final pricing authority.
- No frontend final pricing or zero-price fallback.
- Source remains separate from order type, payment method, and delivery provider.
- No visual redesign in P2 except the specified drawer-direction and focus fixes.
- YKMS-11 versus YKMS-02H remains unresolved documentation alignment debt; no silent rename.


## Immediate next action


1. Read PROJECT_WORK_INSTRUCTIONS v1.5.
2. Read the latest CURRENT_STATUS, CHAT_HANDOFF, and this FULL CHAT SYNC.
3. Live-verify main and open PRs.
4. Create `refactor/p2-maintainability` from current main only.
5. Execute Inventory and Visual Freeze as the first checkpoint. Do not delete CSS or extract POS components before that checkpoint.
