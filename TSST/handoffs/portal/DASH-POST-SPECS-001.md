# DASH-POST-SPECS-001 — organic post specs (IG / FB / LinkedIn)
Checked 2026-10-21 by LENS (SK-001 scoped questions, SK-002 grading). Status NOT_READY (unvalidated skills).
Grades: **A** = official page read directly · **B** = official page, content seen only via search excerpt (page is JS-rendered, not opened) · **C** = third-party / ad-spec proxy, flagged · **?** = no usable source, do not hard-code.

## Instagram
| Format | Ratios | Recommended px | Items | Video | Caption | Grid / feed crop | Source (grade) |
|---|---|---|---|---|---|---|---|
| Feed single image | 1.91:1 to 4:5 kept as-is; outside range is cropped. **CONFLICT:** another help page says portrait limit 3:4 (h up to 1440) | 1080 w; 566-1350 h (or 1440 if 3:4 holds) | 1 | - | ? (2,200 widely cited, no official source retrieved) | Feed shows full image; **profile grid crops to 3:4** (since Jan 2025) | help.instagram.com/1631821640426723 (B); grid: oktopost.com/blog/instagram-grid-size-guide (C, published 2025-01-28) |
| Carousel | Slide 1 sets ratio; others cropped to it. **CONFLICT:** Storrito says no mixed ratios; Kapwing (2026) says a "Mixed" option exists | 1080x1350 (4:5) | 2-20 photos and/or videos | per-clip length ? (60 s cited by third parties only) | as above | Grid shows 3:4 crop of slide 1 | limit 20: socialmediatoday.com/news/instagram-expands-carousels-to-20-frames/723792 (C, 2024-08-08); ratio: C only |
| Reels | 9:16 (range 1.91:1 to 9:16 accepted) | 1080x1920; cover 420x654 (1:1.55) per help | 1 | up to 20 min per third parties citing Help; >3 min not pushed to non-followers. **Unconfirmed officially** | ? | Feed 9:16; grid shows cover at **3:4 (1080x1440)** | help.instagram.com/1038071743007909 (B); length/grid: C |
| Stories | 9:16 (ad spec accepts 9:16 to 1.91:1) | 1080x1920 | 1 per story | ? (ad: 15 s) | - | full screen | facebook.com/business/help/188477725155524 (C, ad proxy) |

## Facebook (Page)
| Format | Ratios | Recommended px | Items | Video | Caption | Crop | Source (grade) |
|---|---|---|---|---|---|---|---|
| Feed single image | no organic ratio source retrieved | ? | 1 | - | ? | ? | photo file: JPEG/PNG etc., under 15 MB, facebook.com/help/121317464722113 (A, via fetch) |
| Multi-image post | ? | ? | ? | - | ? | ? | none (gap) |
| Reels / all video | **Any length, any orientation** since Sep 2025; 9:16 still the recommended shape | 1080x1920 (C) | 1 | no length limit; all videos publish as Reels (not Stories/Live). Old pages still say 60-90 s (Android composer 90 s, Lite 60 s) | ? | Reel 9:16 | about.fb.com/news/2025/06/making-it-easier-create-videos-facebook (A, 2025-06-17); help/121317464722113 (A) |
| Stories | 9:16 (ad spec 9:16 to 1.91:1) | 1080x1920 | 1 | ad: 15 s vs ad chart 1-120 s (**CONFLICT**) | - | full screen | business/help/188477725155524, business/m/one-sheeters/video-requirements (C, ad proxy) |
| Link post preview | keep near 1.91:1 (no feed crop) | >=1200x630; min 600x315; og:image under 8 MB | 1 | - | ? | uncropped at 1.91:1 | developers.facebook.com/documentation/sharing/webmasters/images (A per search excerpt, B) |

## LinkedIn (Page)
| Format | Ratios | Recommended px | Items | Video | Caption | Crop | Source (grade) |
|---|---|---|---|---|---|---|---|
| Single image | 3:1 to 4:5 (w:h) | min 552x276; 1080 w recommended; 5 MB | 1 | - | 3,000 chars | shown at ratio, no crop | linkedin.com/help/linkedin/answer/a527229 (A) |
| Multi-image | render max 4:5 | as above | up to 20 | - | 3,000 | max 4:5 | same (A) |
| Document (PDF) | all pages same size | flatten layers | 1 file, up to 300 pages | no video/animation (static) | 3,000 | page view | linkedin.com/help/linkedin/answer/97459 (A): PDF/PPT/PPTX/DOC/DOCX, 100 MB, 300 pages |
| Video | 1:2.4 to 2.4:1 | 256x144 to 4096x2304; 5 GB; 10-60 fps; MP4, MOV not supported on Pages guide | 1 | 3 s min; **CONFLICT: Pages guide a1311816 = 10 min; general upload a548372 = 15 min** | 3,000 | uncropped | a1311816, a548372 (A both) |
| Link preview | 1.91:1 | 1200x627; width >200 px or shown as small left thumbnail | 1 | - | 3,000 | mobile never cropped, white padding | a566445, a563309 (A); caption: a528176 (A) |

## Biggest changes since 2024
1. Instagram profile grid 1:1 -> 3:4 (Jan 2025): every post/Reel cover is center-cropped for the grid. 2. IG carousel 10 -> 20 (Aug 2024). 3. Facebook: all video is a Reel, no length/orientation limit (Jun-Sep 2025).

## Product rules for the Dash
1. Ask platform + format first; each frame has its own ratio set. Never use one square frame.
2. IG feed image: accept 1.91:1 to 4:5; warn outside; default design target 4:5 (1080x1350).
3. IG carousel: 2-20 items, all slides take the first slide's ratio (warn on mismatch; treat "mixed" as unverified); prefer 4:5.
4. IG profile-grid preview: show a second thumbnail at 3:4 center crop for every feed post, carousel (slide 1) and Reel cover; flag key content outside the center.
5. IG/FB Reels and Stories: 9:16 (1080x1920); keep Reel cover safe in the 3:4 center band.
6. Facebook video: no hard length limit; only flag non-9:16 as "will not fill the Reel frame". Do not enforce 60/90 s.
7. LinkedIn: caption max 3,000 chars; single image 3:1 to 4:5, multi-image max 20 and rendered at 4:5 max; document PDF max 300 pages / 100 MB, one page size.
8. LinkedIn video: warn above 10 min for Pages (hard stop 15 min); ratio 1:2.4 to 2.4:1.
9. Link posts: preview card 1.91:1 (FB 1200x630, LinkedIn 1200x627); never crop.
10. Fields marked "?" (IG/FB caption limits, IG/FB Story length, FB multi-image) stay soft warnings until verified; version the spec table with its checked date.

## Open / uncertain
Instagram Help and Meta Help pages are JS-rendered and could not be opened; IG figures are search-tool excerpts of official pages (grade B) plus third parties. IG 4:5 vs 3:4 portrait limit, IG mixed-ratio carousel, Reels 20 min, FB organic image/Story/caption specs: need a manual look in a browser (Ahmed) or a Gemini pass.
