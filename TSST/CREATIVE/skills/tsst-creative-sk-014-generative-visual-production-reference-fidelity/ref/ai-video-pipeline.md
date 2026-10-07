# AI video pipeline (per shot)

Distilled from GEM-CR-004 PART 3 + the s06-stonewall pilot (2026-10-08). UNVALIDATED. Model capabilities: see `models.md`. Gemini's per-model prompt advice has no official URL: treated as "not confirmed" starting points, tested per shot.

## Owner rules (2026-10-08)
1. Raw client photos and videos are REFERENCE ONLY. Never deliver zoom/pan slideshows of raw material (v1 of showcase-01-reel was rejected for exactly this). Every shot = professional AI still, then image-to-video.
2. Fidelity: edit the real photo (keeps form). Text-only generation drifts to generic archetypes. Structure exact, about 95% likeness acceptable.
3. Cost: Magnific Premium+ unlimited works in the web app, NOT via MCP (MCP spends credits). Bulk generation in the app; MCP only for small approved jobs; estimate with `simulate_cost` first and ask the owner.

## Per-shot pipeline
| Step | Action | Gate |
|---|---|---|
| 0 | LENS beat -> shot-list row (SK-016 ref/shot-grammar.md) | beat sheet approved |
| 1 | Reference: real photo, flagged reference only; product card if a product (SK-014 protocol) | structure counts and ratios written |
| 2 | Pro still: Expand to 9:16, Relight only if light is weak, Upscale creative (subtle) | side-by-side vs original; geometry_compare.py |
| 3 | Image-to-video: start frame (end frame optional), one move | cost quote approved |
| 4 | QA: frame strip (SK-019 ref/post-finishing.md) | no morph, flicker, drift |
| 5 | Accept / re-run (max 3 rounds per stage, name the defect) | owner view if borderline |

## Shot-list row format
| Field | Content |
|---|---|
| Shot # / beat | id from LENS beat sheet |
| Reference | path, "reference only" |
| Start frame | path of pro still |
| End frame | path or none (adds control and cost) |
| Camera move | one move, speed, distance |
| Duration | seconds (clip about 1 s longer than needed) |
| Model | slug + resolution + aspect |
| Prompt | scene + move + light + mood |
| Negative | morphing, warping, flicker, extra objects, text, people, camera shake |
| Cost est. | `simulate_cost` credits, date |

## Consistency across shots
| Method | Note |
|---|---|
| Same source photo/room and same grading words in every prompt | main lever; state light colour and direction |
| Same upscale settings for every still | avoids texture jumps |
| Models with references (Seedance, Kling 3.0, MiniMax): pass the approved still as image/product reference | per `models.md` limits |
| Seed locking | Gemini claim, tool-dependent: not confirmed in the Magnific catalog |
| One colour pass across all clips afterwards | SK-019 post-finishing.md |

## Camera-motion prompt wording
| Intent | Wording | Notes |
|---|---|---|
| Push | "slow dolly-in, steady, about one metre, camera stays level" | safest |
| Reveal | "slow dolly-out revealing the room" | |
| Vertical wall | "slow tilt up along the wall" | suits 9:16 |
| Static | "locked-off, static camera, only light shifts" | when move must be zero |
| Avoid | stacked moves, "fast", "dynamic", "orbit" on architecture | one move per clip |
Always add in the negative field: morphing, warping walls, flicker, added objects, text, people, handheld shake. Gemini notes Runway uses camera sliders and Veo prefers prose; neither verified (no URL).

## Worked example: s06-stonewall (pilot 2026-10-08)
Path: `TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/showcase-01-reel/shots/s06-stonewall/` (RECIPE_STILL.md, RECIPE_VIDEO.md, out/).
| Step | Setting | Credits |
|---|---|---|
| Real still (bedroom, 3:4) uploaded | reference only | 0 |
| Expand to 9:16 | top/bottom only | 50 |
| Relight | skipped: light already good | 0 |
| Upscale creative 2x | subtle, FilmAndPhotography, resemblance 6, creativity -2; 736x1312 to 1472x2624 | 90 |
| Kling 2.5 video | 5 s, 1080p, 9:16, start frame only, slow dolly-in + tilt prompt, negative prompt | 325 |
| Total | | about 465 |
Result: geometry held across all frames. Defect: motion very subtle, so next time ask for a stronger (still single) move. Comparison: Seedance 2.5 6 s 1080p quoted 4,740 credits, about 15x Kling; use only after owner approves.

## Cost rule
Quote before every generation, in the report to the owner; web app for bulk (unlimited plan), MCP only for small approved jobs; cap at 3 rounds per stage; draft on a cheap model, finish only the accepted shot.
