# DASH-POST-ADS-001 S1: SPARK answers (plans only; nothing launched)

## 1. Goal to funnel default (confirmed, editable)
| Goal | Funnel | Reason |
|---|---|---|
| awareness | acquisition | reach / first contact |
| traffic | acquisition | brings new visitors in |
| engagement | activation | first interaction with the brand |
| leads | activation | first valuable action (form / message) |
| app_promotion | activation | install = first use; team may switch to revenue if it optimises purchases |
| sales | revenue | purchase event |
| retention, referral | manual only | no Meta objective means them; stays a team pick |
Suggest retention / referral from a "retargeting" flag? **No.** Retargeting is an audience choice, not a funnel stage (it can serve revenue as much as retention); it would add a field we cannot verify by manual entry. Keep two manual options in the funnel dropdown.

## 2. Ad life-status (6 words, set by hand)
| Value | EN label | Egyptian Arabic | Client sees | Reason |
|---|---|---|---|---|
| draft | Draft | مسودة | no (review chip only) | not approved yet |
| in_review | In Meta review | تحت مراجعة ميتا | yes | explains delay after approval; "Meta" avoids clash with our "Pending review" |
| active | Active | شغّال | yes | running |
| paused | Paused | متوقف مؤقتًا | yes | keep "Paused": plain, matches the spec; Meta's "Off" is a toggle word |
| completed | Completed | خلص | yes | end date passed / closed |
| rejected | Rejected by Meta | مرفوض من ميتا | yes | client must know why an ad is not running |
Dropped: Scheduled (show "starts <date>" from `ad.start` on an Active/In review ad instead), Learning (auction state, not manual, no decision for the client).
Data change vs spec: `life` enum gains `in_review` and `rejected` (spec has 4 ad values). Lead to update contract v1.21.

## 3. Instagram organic 3:4 chip
| Item | Decision | Reason |
|---|---|---|
| IG organic Single image + Carousel | **Yes, add 3:4 chip; default stays 4:5** | team posts by hand in the app, so the API 4:5 cap does not apply; the grid tile is 3:4 (fact B) so 3:4 shows uncropped there |
| Video / Reel, Story | no | 9:16 only |
| Facebook, LinkedIn, all Ads | no | fact is IG-app organic only; ad placements are grade A and have no 3:4 |
Conditions: show as a soft preview (never blocks, per spec). Not in the spec, so unverified: how the IG home feed frame displays 3:4 (assume full, no crop); if the Dash ever publishes through the API, hide 3:4 there (4:5 cap). I did not re-verify on the live page: the answer does not hinge on it, because the chip only changes a preview.

Skills used: TSST-SPARK-SK-001 (funnel role, objective before structure; step 2 journey map); TSST-SPARK-SK-004 (Meta objectives and placement ratios, step 3). Skipped: none opened beyond these two.
skill_friction: none worth logging (both skills target campaign planning, not UI status vocabulary; no step was missing for these 3 answers).
