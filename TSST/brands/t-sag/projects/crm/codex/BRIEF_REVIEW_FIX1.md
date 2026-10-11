# BRIEF — Review fix batch 1 ("Foundation"): R02, R03, R06, R11, R12

ROLE A (TSST team runtime). Scope = exactly these rows of `TSST/brands/t-sag/projects/crm/review/VISUAL_REVIEW_2026-10-08.md`, including the "Ahmed clarifications 2026-10-09" section and the screenshots in that folder. **Nothing else.**

- **Worktree:** `C:\Work\tsst-crm-codex`, branch `feat/crm-review-fix1` (from `feat/crm-mvp-ui` 0692d0d). One commit per task. Never push or merge.
- **Design method:** if the Impeccable skill (github.com/pbakaus/impeccable) is installed in your runtime, use its spatial/typography/color guidance and its `/audit`-style detector checks on the touched screens. If it is not installed, apply the same principles manually: one spacing scale, a consistent control height, vertical rhythm, and OKLCH-harmonised colours.
- **Rules:**
  - Arabic is full RTL; mixed text never breaks.
  - Use `--sy-*` tokens only.
  - **No unstyled native controls, ever (R12).**
  - Behaviour and API unchanged.
- **Checks:** C (lint, typecheck, test:unit, build).
- **Visual verification:** if the in-app browser is unavailable, skip it, and list exactly which screens Ahmed should eyeball.
- **Failures:** fix normal errors yourself (about 5 tries). Block only on a scope or design question.

## Tasks, in order
1. **CRM-F1 — R02 + R11:**
   - A kit layout rule: one control height (36px), page-header actions on one baseline, and visually-hidden labels for header selects (fix the sr-only selector).
   - Field hints never shift sibling fields.
   - Write the spacing/height/line-height scale into the kit docs plus a short reviewer checklist.
2. **CRM-F2 — R03:**
   - Delete the navy tone everywhere.
   - Add an **extended palette derived from the brand colours at equal saturation and brightness** (OKLCH), as tokens, light and dark.
   - Add a guard test: no colour literals outside the tokens.
3. **CRM-F3 — R06:**
   - The sidebar shows the workspace **name**; the UUID appears only in a tooltip or copy action. Do the same everywhere a raw UUID is shown, including the Import header.
   - Upcoming nav items are disabled, with an amber/orange dot at the logical end and a "Coming soon / قريبًا" tooltip. No badge text.
4. **CRM-F4 — R12:**
   - A kit `FileDropZone` (RAC DropZone + FileTrigger) with a file chip (name, size, remove), AR/EN, used in Import.
   - Replace every other native control.
   - Add a lint/test guard against bare `<input type="file">` (and other unstyled natives) outside the kit.

**Report:** `codex/reports/CRM-Fn.md` (≤ 12 lines) with the commit, checks with counts, done-when per review row, the screens to eyeball, and `Skills used:`. Then run `bus done`.
