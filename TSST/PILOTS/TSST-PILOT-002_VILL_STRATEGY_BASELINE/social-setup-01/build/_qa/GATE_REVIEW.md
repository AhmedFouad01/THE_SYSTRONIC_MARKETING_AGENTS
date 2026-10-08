# GATE_REVIEW · VILL social-setup-01 stage C · CREATIVE_AG · 2026-10-08
State: **FINAL_FOR_USER_REVIEW candidate (PRODUCTION_DRAFT until Ahmed's review; not for publication)**. All exports opened and inspected before scoring. Skills UNVALIDATED.
Evidence: `_qa/contrast.txt` (tools/contrast.py, rendered pixels), `_qa/*.png`, `contact-sheet.png`, `layers/<asset>/layers.json`.

## Scores (0-3; item 5 n/a for organic setup assets; total proportional)
| # | Item | Score | Note |
|---|---|---|---|
| 1 | Thumb-stop 300-360 px | 2 | Avatar and covers read; highlight glyphs are quiet by design (small at 64 px) |
| 2 | Focal point in 1 s | 3 | One idea per asset |
| 3 | Image quality/realism | 3 | Real photos, scale 0.64-0.99 (no upscale); #9 retouch = owner-approved plate removal; story crop is sky+sea only |
| 4 | Safe zones | 3 | Story text y303-461 and wordmark y1458-1535 inside 269-1536; reel content inside 3:4 band; FB text clear of all avatar overlays; LI lower-left clear |
| 5 | CTA | n/a | CTA channel still pending (bio shows `[CTA: pending]`) |
| 6 | Hierarchy/legibility | 2 | Reel "Made to" sits at a bright cove edge (worst 4.19:1, passes, but busy); EN only |
| 7 | Native to placement | 3 | Each size recomposed, FB for 16:9 + 2.4:1 |
| 8 | Real variation | 2 | Named dimension per asset (photo + placement), but story/reel share one grammar (photo band on dark petrol) |
**Total 18/21 = 20.6/24 (>= 18). No score <=2 on items 1,2,3,8 without a fix path** (1: glyph scale; 8: story/reel could diverge in round 2).

## Contrast (SK-006 v0.4)
Text on photo gate worst-pixel >= 3 (large text): story 3.75 PASS, reel 4.19 PASS, feed 3.03 PASS (borderline, p50 4.94). Text on solid #011C2C 15.86. Orange on petrol 5.25, orange script on #011C2C 6.64. Logos: gate p50 >= 3: all PASS (solid grounds 15.86; feed wordmark on floor p50 8.11, p95 2.05 flagged for eye check, looked fine).

## Logo decisions
Opened and pixel-sampled all 11 variants. Avatar uses `IconicMark Light-Highlight.png` (opaque tile, bg sampled exactly #01304A, white mark + orange V): composited, tile URL line cropped out, mark scaled to 90 % of circle radius. The missing white transparent Iconic did NOT block. Covers/templates use `Wordmark Dark Transparent.png` (white wordmark = for dark backgrounds); feed picks automatically by background contrast.

## Open defects / caveats
- Highlight, grid, story-zone and Facebook overlap values are practice defaults / indicative overlays (CONFIRMED only: FB 320 px, FB 16:9 + 2.4:1, LinkedIn 1512x256, IG reel cover 420x654, IG feed 3:4).
- Facebook cover 1640x924 JPG is above Meta's 851x315 fast-load size: consider the lighter file if Facebook recompresses.
- AR-locale Pages mirror the avatar overlap to the right; design keeps both lower corners free of text (photo/ground only). Real AR Page check still needed.
- TikTok avatar: mark spans ~90 % of the circle; TikTok ad profile spec wants key element in centre 66/98 px: organic spec unconfirmed.
- Profile mock is indicative (handle and counts are placeholders); grid shows showcase s01 + new post + reel cover.

---
# v2 (stage D fix loop, round 2 of max 3) · CREATIVE_AG · 2026-10-08
All exports re-opened and inspected after rebuild (contact sheet, profile mock, reel crops, avatar circle test). Evidence: `contrast.txt` (r2 lines), `_qa/*.png`.

## v1 -> v2 diff
| # | Fix | v1 | v2 |
|---|---|---|---|
| 1 | Grid variety | feed = wall #9 (same stone as tile 1) | feed = photo #10 sea view + approved line "One team, start to finish." (white, upper sky). Grid row: wall (s01) > sea > living (reel). Photo scale 0.994, text worst 3.20 (large gate 3.0; first try at y96 failed 2.82, moved up to y62) |
| 2 | Avatar margin | mark = 90 % of circle, STUDIO tag kept | mark circumscribed circle = 78 % of diameter (scale 0.768). STUDIO tag measured 31 px in source = 2.4 px at 110 px (floor 7) -> dropped. Circle test 110/176/98/64 re-run on white + dark: mark clear of the edge at all sizes |
| 3 | Story band | photo band y230-1430, empty petrol above/below | passe-partout: frame x64-1016, y300-1360 (952x1060, scale 0.877), line + wordmark on one row y1402-1449, 64 px margins. Content y300-1449 inside UI zones 269-1536. Text on solid #011C2C 15.86 |
| 3 | Reel band | wordmark in bottom band only, top band empty | wordmark top band (y150), vill-studio.com bottom band (y1735), both on the 64 px left grid and inside the 420x654 crop (y119-1801). Photo band still = 3:4 crop exactly |
| 4 | Reel text | "Made to live in." at x64 on bright cove edge (worst 4.19) | moved to ceiling plane x600, y365 via `text_space.py` rank 1 (edge 0.89 %, std 16.0); worst 4.89 (p50 5.93). Visible in 420x654, 3:4 and 120 px thumb |
| 5 | LinkedIn cover | "Interior fit-out and furniture studio in Egypt." (casual) | formal, from the final tagline minus the name already in the wordmark: "Interior fit-out, lighting and bespoke furniture / manufactured by VILL \| Egypt". No script, white on #011C2C 15.86, lower-left keep-out clear |
| 6 | Mock | bio with `[CTA: pending]` | name "VILL Studio", bio IG pick A + "Projects and contact: link below", link line "vill-studio.com" (link field, blue) under it; @handle placeholder kept |

## Scores v2 (0-3)
| # | Item | v1 | v2 | Note |
|---|---|---|---|---|
| 1 | Thumb-stop | 2 | 2 | Highlights remain quiet by design |
| 2 | Focal point | 3 | 3 | |
| 3 | Image quality | 3 | 3 | no upscale (0.64-0.99) |
| 4 | Safe zones | 3 | 3 | story content y300-1449; reel items inside 420x654 crop |
| 5 | CTA | n/a | 3 | website is the CTA: IG link field in mock, reel band URL; no URL typed in IG bio |
| 6 | Hierarchy/legibility | 2 | 3 | reel line off the cove edge; story/LI text on solid ground |
| 7 | Native to placement | 3 | 3 | |
| 8 | Real variation | 2 | 3 | story = framed, reel = full-bleed band, feed = sea photo; grid wall/sea/living |
**Total 21/24 (>= 18), no score <= 2 except item 1 (glyph scale: fix path = bolder highlight glyph if Ahmed asks).** State stays PRODUCTION_DRAFT, NOT_READY until Ahmed's review.

## Open v2 caveats
- Story: bottom 1449-1920 stays empty (UI zone), top 0-300 too; framed layout makes it read as margin, not letterbox, but Ahmed to judge.
- Story and feed both use photo #10 (different crops, story is ephemeral). Reel URL on cover is a design choice (website = only contact channel); drop if unwanted.
- Feed wordmark p95 2.10 on bright deck glass (p50 6.72 PASS); eye check OK.
- Mock link colour and layout are indicative, not Instagram-verified.
