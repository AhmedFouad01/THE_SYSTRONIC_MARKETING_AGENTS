# Self-QA — C7-VILL-10

State: PRODUCTION_DRAFT for all seven renders. Design/export checks completed; no release authority claimed.

Actual PNGs were opened and visually inspected at full export size; 360 px phone previews were inspected in `contact-sheet.png`. Arabic joining, direction, line breaks and title diacritics appeared intact. The separate `bidi-test.png` verifies isolated English, number+unit, date, currency and parenthesis order plus vocalised Arabic. These test numbers are synthetic and appear in QA only, never in the assets.

Defects fixed: white-post footer initially lacked contrast; corrected to navy and extended the white panel to the full lower frame. An image decode race caused logo omission in some intermediate screenshots; renderer now waits for decode and two animation frames. Final PNG pixel checks confirm visible light logo pixels in all seven exports (≥6492). Intermediate PNGs overwritten with corrected exports; no approved historical evidence altered.

## Gate checks

- Seven rendered PNGs: six 1080×1350 and one 1080×1920; all editable HTML masters supplied separately. No browser chrome.
- Original `Logo.png` placed unchanged; visible mark approximately 200 px wide / V height about 76 px. Clear space to frame edges: left ~98 px, top ~111 px; nearest lower content ≥89 px in tightest layout. No other element touches mark exclusion zone.
- Bundled Cairo and Barlow loaded (both font checks true for every final export), all source images loaded, no text bounding-box canvas overflow; see render-checks.json. Fonts deliberately use native weights/shaping.
- Foreground/background ratios computed in Brand Look: white/navy and orange/navy pass; navy/orange CTA passes. Photo disclosures have opaque navy panels. Single footer now navy/white. No white/orange text.
- Every frame has a dominant interior focal subject; variation in subject, crop, scale, type, light/dark panel and split/sequence structure. The repeated kitchen photo is intentionally recomposed as carousel entry, vertical cover and CTA ad; it is not swapped-copy repetition.
- Crop/mask edges are clean; photographic material colour unchanged. Joinery source is only 335×325 and visibly softer at full export; screenshot crops are review material, replace with original high-resolution masters before release.
- Arabic readable at 360 px width; compact English footers/disclosures are supporting ~10–12 px at preview. Primary headlines ~20–40 px. Text and logo are never mirrored.
- Rights / source-type check: PENDING. User supplied pages, but no release records or original-photo/render provenance. Every asset says CONCEPT / SOURCE VISUAL. These are layout concepts made from supplied imagery, not generated images. Do not infer completed-project proof.
- Cover crop simulations retain main text/disclosure; top logo is outside central crop. Not a current-platform safe-zone certification. Request placement-specific crop/overlay adjustment at independent review; source remains editable.
- No campaign publication, spend, communication, tracking/page claim, Real Memory edit or other-brand content.

## Remaining gate limitations

Rights, source type and original image quality prevent FINAL_FOR_USER_REVIEW. Independent Antigravity/Lead review remains pending as requested by the brief. Completion of this production task does not approve launch or readiness. No capability blocker remains.
