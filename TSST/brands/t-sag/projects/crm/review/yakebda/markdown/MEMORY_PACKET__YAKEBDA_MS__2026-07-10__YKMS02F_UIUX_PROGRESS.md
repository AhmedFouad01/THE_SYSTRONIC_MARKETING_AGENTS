MEMORY PACKET — YAKEBDA_MS — YKMS-02F UI/UX Progress
Date: 2026-07-10
Project Key: YAKEBDA_MS
Storage: Google Drive project memory


STATUS
YKMS-02E implementation is confirmed on GitHub. YKMS-02F work has started only inside Claude/Fable local workspace and has not been pushed to GitHub yet.


CONFIRMED GITHUB STATE
Repository: AhmedFouad01/yakebda-ms


PR #6
Title: Ykms 02e settings implementation
State: open, mergeable, not draft
Base: main
Head: ykms-02e-settings-implementation
Head SHA: 28d07e78933e18bf60a444b7f5898b96aefd91e5
Local validation confirmed by user: api:test 46/46 passed; admin:build passed.
Important: PR #6 currently targets main, not ykms-02e-settings-architecture.


PR #5
Title: YKMS-02E Settings architecture and operational configuration
State: open draft
Base: ykms-02d-cashier-pos-os
Head: ykms-02e-settings-architecture
Head SHA: 5632cf1df28c1161834f4d2c64fb55cee83f1851


PR #4
Title: YKMS-02D Cashier POS operating system
State: open draft
Base: ykms-02c-pos-settings
Head: ykms-02d-cashier-pos-os
Head SHA: a61f6e2c6fd467e7b23b0d57bc7da449e2b8b091


YKMS-02F REMOTE STATUS
Planned branch: ykms-02f-ui-ux-operational-completion
GitHub check returned: No commit found for this ref.
Therefore the branch does not exist remotely and no checkpoint commit is confirmed on GitHub.


YKMS-02F GOALS
1. Build AppShell and global navigation.
2. Add Dashboard, Back, Settings, and system navigation to POS.
3. Stabilize POS at 100dvh and 1366x768.
4. Keep cart totals and payment buttons always visible.
5. Replace raw browser/.NET-looking controls with reusable modern UI components.
6. Add a full Product Editor from the product تعديل action.
7. Fix Settings permissions through real RBAC, not frontend bypass.
8. Rebuild Settings UX with cards, modern switches, save/cancel, dirty state, view-only display, and feedback.
9. Add exact kitchen timestamps and a live timer derived from server timestamps.
10. Preserve YKMS-02E backend behavior and the verified test baseline.


CURRENT VISUAL PROBLEMS
Settings: prototype appearance, large empty spaces, native checkboxes, inconsistent field widths, whole page appears locked, no proper save/cancel or dirty state, and developer-facing labels remain visible.
POS: no reliable return navigation, crowded header, calculator consumes cart space, conditional rows can push payment actions off-screen, dense product cards, weak image treatment, and unstable scrolling.
Kitchen: must show exact received date/time plus a live MM:SS or HH:MM:SS timer using submitted_at or a valid server timestamp.


CLAUDE/FABLE PROGRESS BEFORE LIMIT
- Quick audit completed.
- Reusable UI framework files and CSS started.
- App.tsx started moving from the old Shell to AppShell.
- Dead imports started being removed.
- POS header and cart CSS inspected.
- A real POS bug was identified: fixed grid rows inside .posx-cart shift when conditional messages appear, which can grow cart lines and push payment actions outside the viewport.
- Planned fix: convert cart to flex-column, make cart lines flexible with min-height:0 and overflow, keep totals/actions flex-shrink:0, and collapse calculator by default.
- Planned consolidation of item/shift/offers/settings actions into one الإدارة menu.
No YKMS-02F commit SHA or remote branch has been confirmed.


MANDATORY RBAC CORRECTION
Do not keep any frontend bypass such as:
if (me.roles?.includes("owner") || me.roles?.includes("admin")) return true;


Correct behavior:
- can() relies on permissions returned by /auth/me.
- Seed Owner/Admin with settings.manage and required permissions.
- Verify role_permissions joins.
- Verify /auth/me output.
- Verify frontend permission keys.
- Add tests proving Owner/Admin settings access.
- Do not hide RBAC defects with role-name overrides.


REQUIRED PRODUCT EDITOR
Pressing تعديل must open a professional drawer or dedicated edit route with: Arabic name, optional English name, category, SKU, description, ingredients, image URL and square preview, base price, variants and price deltas, discountable, active/available, unavailability reason, visible in POS/reports, send to kitchen, prep station, prep time, and kitchen printing.
Allowed variants only: لقمة فينو، هامر فينو، لقمة سياحي، هامر سياحي، كبسولة، رغيف.
Allowed modifiers only: طحينة، باربيكيو، شيدر، بطاطس.
Opening and closing the editor must preserve cart, selected category, order type, and scroll position.


NEXT SAFE CONTINUATION
First run:
git branch --show-current
git status --short
git diff --stat
git log -3 --oneline


Confirm branch: ykms-02f-ui-ux-operational-completion
If changes are uncommitted, create checkpoint:
git add .
git commit -m "wip: YKMS-02F AppShell and POS layout checkpoint"


Then continue:
1. Finish AppShell/global navigation.
2. Finish POS blocking/payment visibility.
3. Run npm run admin:build.
4. Build full Product Editor.
5. Fix Settings RBAC and modern UI.
6. Add Kitchen exact timestamps and running timer.
7. Run API tests, admin build, and manual 1366x768 verification.


ACCEPTANCE CRITERIA
- Product editing fully usable.
- POS has Dashboard/Back/system navigation.
- Payment actions stay visible at 1366x768.
- No double page scroll.
- Settings editable for authorized Owner/Admin users.
- Modern Settings controls and clear view-only mode.
- Kitchen exact timestamps and running timer.
- POS/cart state survives product editing.
- api:test passes.
- admin:build passes.
- YKMS-02F checkpoint is pushed to GitHub.


RISK
The chat is long and YKMS-02F work is not confirmed remotely. The next Claude/Fable session must create and push a checkpoint before more work.
