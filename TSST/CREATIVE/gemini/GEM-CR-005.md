GEMINI REQUEST GEM-CR-005 · TSST (team-level) · CREATIVE capability · photo composition + layout knowledge bank · from Lead (for CREATIVE_AG) · 2026-10-08
(Team-level: becomes CREATIVE composition/layout skill references for every brand. VILL is only the test case.)
MODE: Gemini **Deep Research**. Attach: TSST/CREATIVE/library/visme_non-designers-guide-visual-slides.pdf (user-supplied guide).

ROLE:         EXTERNAL TOOL — research. You are NOT a TSST agent: do not claim TSST roles, teams, agents, skills or tiers, and do not run the TSST boot.
              WRITE: only TSST/CREATIVE/gemini/GEM-CR-005_out.md (or reply with text only).
              DO NOT: edit, move or delete any other file; create bus tasks; commit; **run shell commands, scripts or downloads on this machine** (browse and read only).
              Your output is INPUT for CREATIVE_AG; the Lead reviews it before anything enters TSST.
OBJECTIVE:    Build a practical, sourced reference on photo composition, cropping and layout for social posts and carousels, so our team can judge and build layouts like an art director.
CONTEXT:      TSST is a marketing agency and production house (Egypt; Arabic + English). Our design agent builds layouts in code from real photos (no manual Photoshop), so every rule must be checkable: written as numbers, ratios or a measurable test. Main use now: interior / furniture / fit-out photography (real phone photos, 3:4, 1086×1448) turned into Instagram 4:5 carousels, Facebook albums, LinkedIn PDF posts and 9:16 stories.
REFERENCES:   Prefer pages that open without login: photography education (Cambridge in Colour, Digital Photography School, Adobe/Canon/Nikon learn pages, Magnum learn), interior/architectural photography guides (verticals, camera height, lens), editorial and grid design (Josef Müller-Brockmann summaries, Material layout, The Grid System, Canva/Adobe design school), Behance case studies. Platform crop and safe-zone facts only from official Meta / Instagram / LinkedIn help pages. Note each page's own date or "no date shown".
PROMPT:
  Write a reference document in 6 parts. Every rule must be measurable (a ratio, a %, a grid value or a pass/fail test). Cite a URL for every claim and example. Summarise in your own words.

  PART 1 — Composition principles that matter for social
  Rule of thirds and phi grid, leading lines, symmetry and one-point perspective, framing, figure-ground, visual weight and balance, eye path (Z/F), negative space, scale cues, colour and light as focal points. For each: definition | how to test it on an existing photo | how to crop for it | common mistake.

  PART 2 — Interior and product photography specifics
  Verticals (keystone correction and its limits), camera height, wide-angle distortion, one-point vs two-point views, the hero/wide/medium/detail shot set, styling vignettes, showing material texture, using window light, before/after pairing from the same angle.

  PART 3 — Cropping and reframing
  Turning 3:4 into 4:5, 1:1, 9:16 and 1.91:1 without losing the subject. Crop priority (subject, light, lines, text space), maximum upscale before quality loss, when to frame (passe-partout) instead of cropping, panoramic/continuous carousels (one image split across slides): how to align the seams.

  PART 4 — Finding text space in a photo (most important)
  How designers find the empty, quiet plane for text (sky, ceiling, wall, floor). Measurable tests for quietness: low edge density, low luminance variance, minimum area relative to the text box, distance from the subject. How to choose text colour from the plane. When no quiet plane exists: options in order (re-crop, frame, type-only slide) before any overlay. Include any public algorithms or tools for saliency / empty-region detection (OpenCV saliency, edge maps) with URLs.

  PART 5 — Layout systems for posts and carousels
  Margins and safe zones for 1080×1350 and 1080×1920 (from official sources), column grids for social, baseline and spacing scales, alignment, layout types (full-bleed, framed, split 2-up, grid 3-up, type-only, detail crop, collage) with when to use each, rhythm across a 6–10-slide carousel (how to vary layouts without losing consistency), cover design patterns, how the logo sits in a layout system.

  ATTACHED GUIDE (Visme, non-designer's guide to visual slides; supplied by our owner): extract every layout, image, colour, contrast, alignment, white-space and consistency rule it gives, with its PAGE NUMBER, in your own words. Merge each one into Parts 1–5 tagged [VISME p.N]. Mark which rules are specific to presentation slides and which also hold for social posts and LinkedIn PDF carousels. Note where it disagrees with other sources.

  PART 6 — Critique method and 10 exercises
  A scored critique sheet (8–10 criteria, 0–3 each) an art director uses on a layout, and 10 exercises with input, target and pass/fail checks.
CONSTRAINTS:  Sources required; write "not confirmed" instead of guessing. Never invent posts, studios or URLs. English output.
OUTPUT:       One Markdown file GEM-CR-005_out.md beside this file: Parts 1–6 as headings, tables where helpful, and a final "Sources" list (URL + the page's own date, or "no date shown"). If too long, split as GEM-CR-005_out_part1.md, _part2.md … in order.
ACCEPTANCE:   Lead opens 8+ URLs to check them; CREATIVE turns Part 4 into a measurable text-space finder tool and tests Parts 3–5 on the VILL photos; accepted parts are distilled into CREATIVE skills (SK-004 layout, SK-008 art direction, or a new photo-composition skill).
