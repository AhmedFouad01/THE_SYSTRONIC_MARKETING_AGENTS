Skills used: TSST-CREATIVE-SK-030 (post-implementation audit and heuristic pass), TSST-CREATIVE-SK-026 (RTL/bidi/numerals/plurals check), TSST-CREATIVE-SK-025 (form dialog, options editor and flags check). All three are UNVALIDATED. Read-only gate, screenshots only. No code or live interaction was checked.

# GATE: /app/settings/properties (P1b B2)

## Verdict: PASS-WITH-FIXES

Consistent with the rest of the app (ADR-002 §9.1). Same tokens, tabs, buttons, badges and card list as the contacts page. No bidi breakage and no clipping defects in RTL.

## Per-shot verdicts

| Shot | Verdict | Notes |
|---|---|---|
| en-light-1440 | PASS-WITH-FIXES | Hierarchy is clear (title, helper text, object tabs, toolbar, group header with count, row card). Badges (System/Required/Read-only/Sensitive) are readable. Defect M3 below. |
| ar-light-1440 | PASS-WITH-FIXES | Full mirror is correct: nav on the right, tabs and rows right-aligned, up/down arrows mirrored, mixed API names (`display_name`) stay LTR and intact. Defects M1 and M2 below. |
| ar-dark-1440 (create dialog) | PASS | Dark tokens are correct. The checkboxes, the 8-color swatches plus a "none" swatch, and the selected-swatch ring are visible. The AR and EN option-name fields are labelled clearly. The first-row up and last-row down arrows are disabled. The primary and cancel buttons are in the correct RTL positions. Only the middle of the dialog is visible, so the header and name fields were not reviewed. |
| ar-light-375 | PASS-WITH-FIXES | Rows stack cleanly and the bottom nav is fine. The 4th tab (المهام) is cut off with no visible scroll cue. Defect L1 below. |

## Must-fix (real defects)

- M1 Numerals are inconsistent with the app. The contacts page (2026-10-06 reference) renders Arabic-Indic digits (٩, ١٠, ٣٠). The properties page renders Latin digits ("8 خاصية", "الخيار 1", "الخيار 2"). Route these through the same locale number formatter used elsewhere.
- M2 Wrong Arabic plural. "8 خاصية" should be "8 خصائص" (3–10 takes the plural noun). Use the existing plural helper with the Arabic forms: 1 خاصية, 2 خاصيتان, 3–10 خصائص, 11+ خاصية.
- M3 The row action cluster is not column-aligned (visible in EN, and in AR mirrored). Rows with Options and a trash icon shift the up/down arrows and Edit button inward relative to the other rows. Give the actions a fixed-width grid with reserved slots (Options and Delete). Rows with different button sets should still align.

## Later (non-blocking)

- L1 Mobile 375: the tab strip cuts the 4th tab. Add a fade or edge cue and confirm it scrolls horizontally, with the active tab scrolled into view.
- L2 The search field has no placeholder or icon, unlike the contacts search ("بحث" with icon). Consider a placeholder and a search icon.
- L3 The sidebar footer (user and role block) is not visible in the properties shots, but it is in the contacts shot. Likely a viewport or capture difference. Verify.
- L4 The chevron and icon buttons are about 32px, under the 44px touch target on mobile.
- L5 In the dialog, the colour choice is conveyed by colour plus a ring only. Add a title or aria-label per swatch (the color name) if not already present.
- L6 The dialog top (title, name EN/AR fields, type) is outside the capture. Capture a top-scrolled shot next round to review the EN+AR label fields and the type selector.
