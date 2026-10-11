# Cuts, rhythm, finishing order (short-form)

Distilled from GEM-CR-004 PART 2 (2026-10-08). Status UNVALIDATED. Gemini cited no full URLs: every number below is "not confirmed" unless a URL is given. Input to this file is a LENS beat sheet (TSST-LENS-SK-016); cut decisions serve its beats.

## Cut types
| Cut | Says | Use when | Looks cheap when |
|---|---|---|---|
| Hard cut | continuity or contrast | default; action/gaze/info change | never cheap, but arbitrary timing is |
| Match cut (shape/motion/colour) | thematic link, time or place jump | empty shell to finished room, same framing | frames not truly aligned; forced |
| J cut (audio first) / L cut (audio last) | smooth flow | VO or music bridging two shots | no real audio to bridge |
| Jump cut | urgency, casual | same subject, time skip | used to hide weak footage |
| Whip / motion-match | energy | fast move into fast move | every transition |
| Cross-dissolve | time passing, softness | slow luxury reveals, light change | default between unrelated shots |

AI-shot note: with 5 s i2v clips, cut on the camera move (start the next shot mid-move in the same direction) so motion carries across the cut; avoid dissolves that expose two different AI textures.

## Pacing and shot length
| Claim | Value | Status |
|---|---|---|
| Short-form ads average shot length | 1.5-2.5 s | not confirmed (Gemini, no URL) |
| Project/establishing shots | 3-5 s | not confirmed |
| "Change visuals every ~3 s" | working rule | direction only: https://ads.tiktok.com/help/article/creative-best-practices (hook early); the exact interval is not confirmed |
| TSST quiet-premium default | 2.5-5 s per shot, 3-6 shots per 15 s | TSST working default (owner tone), not a platform rule |

Rules: vary lengths (long-short-long), one idea per shot, a longer wide shot as the "breath" before the reveal. Tension = tighter and faster; release = wider and longer.

## Cutting to the beat
frames per beat = fps x 60 / BPM. Cut on beat (every beat, every 2 beats, or every bar of 4).
| BPM | 24 fps | 25 fps | 30 fps |
|---|---|---|---|
| 80 | 18 | 18.75 | 22.5 |
| 90 | 16 | 16.7 | 20 |
| 100 | 14.4 | 15 | 18 |
| 120 | 12 | 12.5 | 15 |
| 128 | 11.25 | 11.7 | 14.1 |
| 140 | 10.3 | 10.7 | 12.9 |

Non-integer = place cuts by seconds (beat = 60/BPM s), snap to the nearest frame, never accumulate drift; check the last cut against the track end. Quiet-premium: cut every 2 or 4 beats (4 beats at 90 BPM = 2.7 s), not every beat. Read BPM from the licensed track; do not guess.

## Murch rule of six (adapted)
Source: Walter Murch, In the Blink of an Eye (book; no official URL; weights not confirmed online). Order and weights: emotion 51, story 23, rhythm 10, eye trace 7, two-dimensional plane 5, three-dimensional space 4.
| Test | Short-form check |
|---|---|
| Emotion | does the cut keep or raise the feeling the beat promises? |
| Story | does it carry the LENS beat purpose? |
| Rhythm | on the music/pacing grid; no equal-length monotony |
| Eye trace | the focal point (stone wall, window) sits where the eye already is, inside the 9:16 safe zone |
| 2D plane | screen direction and framing consistent across the cut |
| 3D space | room geography consistent (180 deg rule, see shot-grammar.md) |

Gemini put the 180-degree rule under "2D plane"; in Murch's order it belongs to 3D space. Its advice "audiences forgive spatial errors" is opinion; with AI rooms a geometry jump is a defect, so we do not trade it away.

## Finishing order and per-stage checklist
| # | Stage | Gate (do not proceed until yes) |
|---|---|---|
| 1 | Assembly (selects on timeline) | every LENS beat has a shot; none is raw client footage |
| 2 | Rough | story reads muted; hook in first frames |
| 3 | Fine | cuts on action/beat; L/J cuts placed; no dead frames |
| 4 | Sound | music licensed, levels, ducking; sound-off still works |
| 5 | Colour | one grade across shots from different models (SK-019 ref/post-finishing.md) |
| 6 | Titles | one language per line, safe zones, logo/CTA does not cover the reveal |
| 7 | Export | per SK-019 spec; frame-strip QA; muted and with-sound review |

Tools: Premiere, After Effects (assembly/titles/logo via ExtendScript; build_reel.jsx ran in AE 2026), DaVinci Resolve (colour), CapCut (quick social). Gemini's tool prices: not confirmed, official pricing pages not checked.
