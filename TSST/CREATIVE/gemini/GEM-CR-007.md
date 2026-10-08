GEMINI REQUEST GEM-CR-007 · TSST (team-level, no brand) · CREATIVE capability · code-drawn motion for ads · from Lead (for CREATIVE_AG) · 2026-10-08 (rewritten for the Gemini app)
SURFACE: Gemini app (Deep Research, NEW chat)

FOR AHMED (not part of the paste):
1. Open a NEW chat in the Gemini app, choose Deep Research.
2. Upload this one file: TSST/CREATIVE/gemini/GEM-CR-007_upload.md (text only, ~160 KB: 124 ad-like prompts + 279 product/ad cases + 2 reviewer docs; third-party material, do not commit it).
3. Paste everything between the two lines "PASTE START" and "PASTE END".
4. Export the answer (Docs or copy) and save it as TSST/CREATIVE/gemini/GEM-CR-007_out.md.
Output is INPUT for CREATIVE_AG; the Lead reviews it before anything enters TSST.

----- PASTE START -----
Role: you are an external research tool. One job: analysis and research. Reply in the chat only.

Context: we are a marketing agency and production house in Egypt (Arabic + English, right-to-left). We make social ads, product launches and brand motion videos. A new way to make them: an AI model writes the whole animation as code (one HTML file with Canvas, SVG, GSAP or Three.js), and the page is recorded as an MP4. The attached file lists public examples of this: section A = 124 prompts that look like ads/product work (each with category, tech tags and the post link), section B = 279 product/ad cases with style, duration and reviewer notes, section C = two reviewer documents.

Task: extract reusable PATTERNS (not prompts) for ad/product/brand videos made this way. Work mainly from the attached text. You may use web research to confirm tools, recording methods and licences. For every pattern cite 2–3 example IDs from the file (A12, B40 …) plus their post link. Describe patterns in your own words; never paste a creator's prompt (at most 10 quoted words from any one prompt). Write "not confirmed" instead of guessing.

PART 1 — Anatomy of prompts that worked for ads/product videos
What parts a strong prompt has (format and duration, scene list with timings, brand colours, typography, motion verbs, camera, music or beat sync, "single HTML file", how it is recorded). Table: element | how often it appears (rough share of section A) | why it matters | example IDs. Then compare short prompts (~30 words) with long scene-by-scene prompts: when each works.

PART 2 — Recurring ad structures and visual devices
Typical sequences for a product/app/brand launch made in code (for example logo build → feature cards → UI mock → tagline). Recurring devices (kinetic type, UI mockups, device frames, particles, 3D product spin, number counters, beat-synced cuts …). Table: device | best for | tech used | difficulty | example IDs.

PART 3 — Tech choice and recording
When Canvas vs SVG vs GSAP vs Three.js vs shaders suits ad work, with trade-offs (visual quality, text sharpness, render time, file size). How creators turned the page into an MP4 (screen recording, headless browser capture, frame export), as reported in section B/C; mark unknown as "not confirmed". Name current tools for headless capture to MP4 with official links.

PART 4 — Failure patterns and limits
From the reviewer notes in sections B and C: what goes wrong (text jitter, timing drift, unreadable type, generic look, broken 3D, performance) and how to prevent each. Also list claims the reviewers could not verify.

PART 5 — Gaps for our market
What is missing for Arabic text (letter joining, right-to-left layout, Arabic fonts in Canvas/SVG/Three.js) and for strict brand work (fixed palette, fixed logo file, safe zones). List what we must add ourselves, with official documentation links where they exist.

Format: 5 headings, tables where asked, then a final list "Evidence IDs" (ID + link per pattern) and "Sources" (URL + date or "no date shown").
----- PASTE END -----

ACCEPTANCE: Lead checks that example IDs exist in GEM-CR-007_upload.md and that no long prompt is copied. CREATIVE then writes SK-015 ref/code-motion.md: a TSST prompt template (brand palette, logo as file, Arabic/RTL rules, scene timings, beat sync, single HTML), the production method (HTML → local MP4 capture → ffmpeg frame-strip QA), and links to the best 10–20 examples.
