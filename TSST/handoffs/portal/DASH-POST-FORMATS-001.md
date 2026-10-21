# DASH-POST-FORMATS-001 — posts per platform and format (review today + spec to build)
2026-10-21 · CREATIVE_AG (SK-011 social formats, SK-030 heuristic audit, SK-020 task flow/IA) · read-only, mock mode · NOT_READY
Numbers come ONLY from DASH-POST-SPECS-001 (grades A/B/C). `?` = no source, soft warning only, never blocks. `D` = a Dash design choice, not a platform number.
Screenshots: `post-formats-001/01..07-*.png` (scratch script `shots.mjs` beside them).

## 1. Audit of today (confirmed in code and in the mock app)
| # | Finding | Evidence | Sev |
|---|---|---|---|
| 1 | One square frame for everything. Stage is `aspect-ratio:1` and `object-fit:cover`; it becomes 4:5 only when EVERY item is exactly 4:5 (±0.02, probe in `MediaCarousel.tsx`). A 4:3 image or 16:9 video is silently cut to a square. Mock proof: 640x360 reel shown in a 1:1 stage (screens 03, 07). | `workflows.css:71-72`, `MediaCarousel.tsx` probe | 1 |
| 2 | No Reel / Story. "Video / Reel" = one video in the feed frame; no 9:16 phone frame, no Story at all, no cover/grid check. | `PostEditor.tsx` type list `single / carousel / video` | 1 |
| 3 | No format per platform. One "Where" checkbox row + one type list for all 3 channels (screen 02). FB and LinkedIn show the exact same carousel as IG (screens 05, 06). Facebook multi-image is a collage, LinkedIn multi-image / PDF document do not exist. | `PostEditor.tsx` step 0; `PostFrame.tsx` uses one `MediaCarousel` for all | 1 |
| 4 | No ratio choice and no ratio warning. User cannot pick 4:5 / 1:1 / 1.91:1; no "this will be cropped" message; no resolution check. | no ratio state anywhere | 1 |
| 5 | Limits are one set for all: carousel max 10 (IG and LinkedIn allow 20), caption 2200 for all (LinkedIn 3,000), label "Carousel (2–10)" is hard-coded. | `max = …10 : 1`, `maxLength={2200}`, `DASH-API.md` PostInput | 2 |
| 6 | No Document (PDF). Media picker only lists image/video; media kind is `image\|video`. | `PostEditor.tsx` `files` filter; `Post.media.kind` | 2 |
| 7 | No IG profile-grid (3:4) preview, though IG grid is 3:4 since Jan 2025. | no code | 2 |
| 8 | Contract has no `format` or `ratio`; the post type is guessed from media count when editing (`>1 = carousel`), so a Story or a 2-image FB post cannot round-trip. | `Post`, `PostInput` v1.7 | 1 |
| 9 | Link-post card (1.91:1) from the earlier frame spec (AUDIT-002 B2) was never built. | `PostFrame.tsx` | 3 |
| OK | Counter pill and dots already sit inside the media; swipe works; no platform logos; tokens only. Keep. | screens 04-06 | - |

## 2. The format model
Generic format ids (stored): `single · multi · video · story · document`. Platform names are labels.
| Platform | Format (label) | Allowed ratios | Default | Items | Media | Caption | Frame |
|---|---|---|---|---|---|---|---|
| IG | Post (`single`) | 1.91:1 to 4:5 kept; outside = cropped (B). Portrait limit 4:5 vs 3:4 CONFLICT, see Open | 4:5 (1080x1350) | 1 | image | 2,200 ? | IG feed + 3:4 grid thumb |
| IG | Carousel (`multi`) | slide 1 sets the ratio, all slides follow (mixed = unverified) | 4:5 | 2–20 (C) | image / video | 2,200 ? | IG feed, inside dots + n/N + grid thumb of slide 1 |
| IG | Reel (`video`) | 9:16 (1.91:1–9:16 accepted) | 9:16 (1080x1920) | 1 | video; cover 3:4 centre band | 2,200 ? | 9:16 phone frame |
| IG | Story (`story`) | 9:16 | 9:16 | 1 | image / video | none | 9:16 phone frame |
| FB | Post (`single`) | no organic source `?` | 4:5 D (chips 4:5 · 1:1 · 1.91:1, all soft) | 1 | image | ? | FB feed |
| FB | Multi-image (`multi`) | `?` | 4:5 D | `?` (soft cap 10 D) | image | ? | FB collage 2 / 3 / 4 / 5+ (layouts `?`) |
| FB | Reel (`video`) | any orientation and length since Sep 2025 (A); 9:16 recommended | 9:16 | 1 | video | ? | 9:16 phone frame; non-9:16 = "will not fill the frame" |
| FB | Story (`story`) | 9:16 (ad spec 9:16–1.91:1, C) | 9:16 | 1 | image / video | none | 9:16 phone frame |
| LinkedIn | Image (`single`) | 3:1 to 4:5 (A), shown at ratio, no crop | 1:1 D | 1 | image | 3,000 (A) | LI feed |
| LinkedIn | Multi-image (`multi`) | renders max 4:5 (A) | 4:5 | up to 20 (A) | image | 3,000 | LI feed collage (`?`), tap = swipe |
| LinkedIn | Document (`document`) | all pages same size (A) | page's own | 1 PDF, up to 300 pages, 100 MB (A) | pdf | 3,000 | LI feed, page swipe n/N |
| LinkedIn | Video (`video`) | 1:2.4 to 2.4:1 (A) | 9:16 allowed | 1 | video, 3 s min; warn above 10 min, stop at 15 (A, conflict) | 3,000 | LI feed video, uncropped |

**Which platforms can share a post:** `single` IG+FB+LI · `multi` IG+FB+LI · `video` IG+FB+LI (9:16 works on all three) · `story` IG+FB only · `document` LinkedIn only. Step 1 greys out a platform that has no such format and says why ("LinkedIn has no Stories"). Shared limits = the strictest known one (e.g. multi with FB = soft cap 10, else 20). Ratio sets with no overlap (e.g. FB chip 1.91:1 vs IG carousel): the editor shows one ratio chip row PER chosen platform.

## 3. Editor behaviour (the 3 steps stay)
**Step 1 Where and what.** Pick platforms first (multi-select). Then ONE format list = formats that exist on every chosen platform; others shown disabled with the reason. Format card shows its own rule line ("Carousel · 2–20 · first slide sets the ratio"). Title as today.
**Step 2 Media.** Picker is filtered by format (single = 1 image; multi = images/videos in order; video/story = video or image per table; document = PDFs only). Under the grid: **ratio chips per platform** (4:5 · 1:1 · 1.91:1 for feed; 9:16 for Reel/Story; "Page size" for document), default per table, IG carousel chip applies to all slides. Each selected item in the tray gets a status line from its real width/height (measured by the backend, not the browser):
- fits: nothing shown (small tick);
- crop: "Will be cropped to 4:5: 40% of the width is cut" (formula: image wider than target → cut `1 − target/ratio` of width; taller → cut `1 − ratio/target` of height; 4:3 into 4:5 = 40%);
- outside platform range: "Instagram crops this to 1.91:1" / "LinkedIn shows at most 4:5";
- video not 9:16 in Reel/Story: "Will not fill the frame (black bars)"; Facebook never blocks on length (rule 6);
- low resolution: width under 864 px for a 1080 slot (SK-011 L5, max upscale 1.25x) "Looks soft";
- LinkedIn Document: "Pages differ in size" if not all equal; "301 pages, limit 300".
Warnings never block Next. Hard blocks only for item count, wrong kind, PDF over 300 pages / 100 MB.
**Carousel order rules** (SK-011 L7): slide 1 = cover and sets the ratio (label "Cover · sets the ratio"); last slide labelled "Closing"; drag + arrow buttons stay; changing slide 1 re-runs all warnings; counter "n / 20".
**Step 3 Caption.** One tab per platform, counter uses that platform's limit (LinkedIn 3,000 hard; IG/FB 2,200 shown as soft `?` warning, not a block). Story: caption step replaced by "Stories have no caption". Preview on the right = ONE frame for the active platform and ratio, with a small switch "Feed | Profile grid" on IG (grid = 3:4 centre crop of slide 1 / Reel cover, with a faint inner guide for the safe centre). Reel and Story preview in the phone frame.

## 4. Frames (DS tokens only, no platform logos, no numbers or fake counts, R53 no borders; card `--sy-surface`, `--r-panel`, `--sy-shadow-panel`; dark uses `--ref-dk-1`)
| Frame | Spec |
|---|---|
| IG Post / Carousel | Header 56 px (avatar 32, handle, ⋯). Media at the chosen ratio (4:5 default, 1:1, 1.91:1), `object-fit: cover` only when it matches, never letterbox for in-range images. Inside the media: pill n/N top-right, dots bottom-centre, hover arrows. Actions row 44 px, caption 3 lines + "more". Unchanged from AUDIT-002 B2 except the ratio is now read, not forced. |
| IG profile grid | 3:4 tile (width 120 px, `--r-control`) of slide 1 / Reel cover, centre crop; shown beside or under the frame. |
| IG / FB Reel, IG / FB Story | Phone frame: 9:16 rectangle, width 270 px (≤1024: 240), `--r-panel`, dark `--ref-dk-1` surround, media `cover`. Overlay: top row = avatar + name + time, bottom = caption (Reel only, 2 lines) with action icons stacked at the end edge, drawn with `--post-overlay`. Safe zones as a dashed-free tint band (no border): Reel cover safe = 3:4 centre band (75% of height, derived); Story top and bottom bands `?` (about 14% / 20%, not in the research; mark "guide") toggled by a "Show safe zones" switch. Video play/mute as today. |
| FB Post | Header 56 px (avatar 40, name, date, ⋯), text ABOVE media (4 lines + "See more"), media at chosen ratio full bleed, reaction bar Like / Comment / Share, no divider. |
| FB Multi-image collage `?` (no FB source, Dash approximation) | 2 = two 1:1 cells side by side · 3 = one large left (4:5 area) + two stacked right · 4 = 2x2 · 5+ = 2 on top, 3 below, "+N" scrim on the last cell. 4 px gaps via `--space-1`, no borders. Tap = swipe lightbox in the Dash preview. |
| LinkedIn Image / Multi | Header 64 px (avatar 48, square-ish radius, name, "Company", date), text above (3 lines + "…more"), media at ratio (max 4:5, min 3:1 for single), reactions Like / Comment / Repost / Send. Multi = collage as FB layouts `?` with max 4:5 cell height. |
| LinkedIn Document | Same header and text; media area = page ratio (from the PDF), page image, pill "Page 2 / 3", dots bottom (max 8 then "n / N" only), swipe + arrows, first page = cover. A thin title strip below ("Document · 3 pages") in `--sy-text-3`. |
| Video poster | Poster = first frame (or backend still); centred play 56 px `--post-overlay`, mute bottom-start inside; duration pill bottom-end only if the backend returns it. Reel cover check = poster inside the 3:4 band. LinkedIn video keeps its own ratio, uncropped. |
| Link-post card (later) | 1.91:1 card, never cropped (FB 1200x630, LI 1200x627). Not in this build. |

## 5. Data needed (minimal, API v1.8, all backward compatible)
```
type PostFormat = "single" | "multi" | "video" | "story" | "document";
Post       += format: PostFormat;                       // old posts: derived (1 img=single, 2+=multi, 1 video=video)
              ratio:  Partial<Record<PostPlatform, string>>;   // "4:5" | "1:1" | "1.91:1" | "9:16" | "page"; null = default
              media[].w, media[].h, media[].pages?;     // measured by the backend (needed for warnings, doc preview)
              media[].kind: "image" | "video" | "document";   // + "document"
PostInput  += format: PostFormat (required on create);  ratio?: same map;
              media max 1–20 by format (was 1–10); captions limit per platform (LinkedIn 3000, others 2200)
```
Backend validates: platform×format exists; item count and kinds from the table; document = exactly 1 PDF ≤300 pages / ≤100 MB; ratio value ∈ allowed chips for that platform×format. It never rejects on crop or resolution (those are UI warnings). One shared table file `post-formats.json` (limits, ratios, grades, checked date) used by backend and web, version-stamped with the DASH-POST-SPECS-001 date. Drive posts: format inferred from the folder (1 image / 2+ images / 1 video / 1 pdf); Story and Reel need an optional `**Format:** story|reel` line in `caption.md`.

## 6. Build plan
**Backend (first)**
| # | Work | Done when |
|---|---|---|
| B1 | `post-formats.json` + types + DB column `format`, `ratio` (nullable), derive format for old rows | old posts load with a derived format; contract tests pass |
| B2 | Validate create/edit against the table (platform×format, counts, kinds, caption limits) | 12 positive/negative cases pass, incl. Story on LinkedIn = 422, 21 slides = 422 |
| B3 | Media probe: width/height for images and videos, PDF page count + page size, PDF page thumbnails | fixture dims returned exactly: 1080x1350 jpg, 1080x1920 mp4, 1200x627 jpg, 3-page PDF = `pages: 3` |
| B4 | Drive inference + `**Format:**` line; `DASH-API.md` v1.8 | the 4 fixture folders become 4 posts with the right formats |
**UI (after B1–B3)**
| # | Work | Done when |
|---|---|---|
| U1 | `postFormats.ts` (table reader) + `ratioFit()` helper with unit tests | 4:3 → 4:5 returns "cut 40% width"; 4:5 → 4:5 fits; 9:16 video in feed ratio warns |
| U2 | Step 1: platform first, shared format list, disabled reasons | with LinkedIn ticked, Story is disabled with its reason |
| U3 | Step 2: format-filtered picker, ratio chips, per-item warning lines, cover/closing labels, PDF picker | 4:5 carousel fixture shows no warning; 1.91:1 jpg in IG 4:5 shows crop %; 21st slide blocked |
| U4 | Frames: ratio-aware IG/FB/LI feed, phone frame, FB/LI collage, LI document, IG 3:4 grid | each fixture renders in its frame at 1536 and 390, light + dark; no square forcing |
| U5 | Step 3 + PostGrid use stored `format`/`ratio`; per-platform caption limits; Story hides caption | save → reopen round-trips format and ratio; Reel fixture shows the phone frame |
| U6 | QA with the 4 real-shape fixtures: 4:5 carousel, 9:16 reel mp4, 1.91:1 landscape jpg, 3-page PDF (≤10 screenshots) | all above + `ds:check`, typecheck, lint, `test:api` green |

## Open (need a human look, from SPECS-001)
IG portrait limit 4:5 vs 3:4; IG mixed-ratio carousel; Reel length; FB organic ratios, multi-image limit and layouts, FB caption limit; Story safe-zone percentages. All stay soft until Ahmed or a Gemini pass checks them in a browser.
