# Shot grammar and LENS beat to shot-list row

Distilled from GEM-CR-004 PART 2 section 3 (2026-10-08) plus the TSST hand-off contract. UNVALIDATED. This is standard film craft; no vendor numbers.

## Shot sizes
| Size | Shows | Use in interiors/real estate |
|---|---|---|
| EWS | place, scale, exterior | arrival, project context |
| WS | whole room, geography | establish before detail |
| MS | zone with furniture | relationship of pieces |
| CU | one object/material | stone, wood grain, hardware |
| ECU | texture, edge | tactile hook or transition |

## Angles
| Angle | Reads as | Note |
|---|---|---|
| Eye level (about 1.2-1.5 m for interiors) | neutral, believable | default for architecture |
| Low | power, height, grandeur | tall feature walls; keep verticals straight |
| High | overview, vulnerability | plans/layouts; rarely premium-feeling |

## Camera moves and the emotion they carry
| Move | Emotion | AI-video note |
|---|---|---|
| Static / locked-off | calm, confidence, premium | most stable; best for detail shots |
| Slow dolly-in / push | intimacy, focus, anticipation | safest AI move; geometry held in s06 |
| Dolly-out / pull | reveal, release, scale | shows room context |
| Pan / tilt | following, scanning | tilt along a vertical wall suits 9:16 |
| Orbit | showcase a hero object | high morph risk on architecture |
| Parallax slide (truck) | depth, luxury | gives 3D feel from one still |
| Handheld | urgency, realism | off-tone for quiet-premium |

One move per clip (Gemini advice, consistent with the s06 result; vendor evidence not confirmed). Use "slow"/"gentle" and a named distance ("about a metre"). s06 lesson: its single slow dolly was too subtle; ask for a clearly visible move, still one move.

## Sequencing
| Pattern | Order | Effect |
|---|---|---|
| Establish | WS to MS to CU | orient, then detail; walkthroughs |
| Mystery/reveal | CU to MS to WS | detail first, ends on the reveal; fits LENS hook = reveal |
| Contrast | before WS to after WS, same framing | match cut for before/after |

Vary size between adjacent shots (no two CUs of the same object in a row). Changing axis needs the 180 degree rule.

## 180 degree rule and continuity (rooms)
Keep the camera on one side of the action axis. In a room: window/feature wall stays on the same screen side across shots, light direction constant, same time of day. AI shots from different stills can silently flip this; check in the contact sheet before assembly.

## LENS beat to CREATIVE shot-list row
Input: LENS beat sheet (TSST-LENS-SK-016 hand-off contract: seconds, purpose, subject/change, light, camera intent, detail in focus, text, sound, reference flagged "reference only", continuity, brand/safe-zone). No approved beat sheet = no shot list.

| Col | Filled from | Example (s06) |
|---|---|---|
| Shot # / beat | LENS beat id | 06 / Reveal |
| Seconds | LENS seconds, snapped to cut grid | 10.0-13.0 |
| Purpose | LENS purpose | payoff: textured stone glows |
| Size / angle | CREATIVE | MS, eye level |
| Camera move | LENS camera intent made specific | slow dolly-in + tilt up |
| Subject/change | LENS | light grazes stone, no people |
| Reference (REFERENCE ONLY) | LENS asset path | refs/ref1_PRIMARY_bedroom_still8.png |
| Still plan | CREATIVE | expand 9:16, upscale; relight skipped |
| Clip length | beat seconds + about 1 s handles | 5 s clip, use 3 s |
| Text / sound | LENS final wording, one language per line | none / pad |
| Continuity | LENS | warm light, window left |
| Safe zone / brand | LENS | keep text out of platform UI zones (exact margins: check current platform spec, not confirmed) |

AI production columns (model, prompt, negative, cost) live in SK-014 `ref/ai-video-pipeline.md`; keep one row per shot across both files.
