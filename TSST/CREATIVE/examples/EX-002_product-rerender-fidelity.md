# EX-002 Product re-render fidelity (brand-neutral)
Status: training note, 2026-10-07. Subject: furniture piece re-rendered by an external image tool from phone photos.
## What improved from Step A (edit-the-photo) to P1 (render-from-spec)
- Product card first: one measured spec (parts, counts, ratios, materials, stool) pasted into every prompt. Structure then came back exact on all 3 variants (7 drawers, no handles/legs, proud tops, wing wrap).
- Backdrop and clutter: a plain grey seamless backdrop removed every room, debris and wrap problem Step A kept hitting.
- Naming compliance: an explicit WRITE line with exact file names worked first time (no "Image ..." names).
- Fewer fixes per file: the failure moved from 6 structure+proportion items to proportions and camera only.
## What still drifts
- Camera: "locked 3/4 from the left" came back near-frontal (piece w:h 1.70-1.92 vs 1.17). Words about the camera are ignored when the spec also lists front-view ratios; give ONE view's ratios per prompt.
- Mirror reads 15-19% too wide; stool shape swings (0.69 to 0.98 vs 0.62).
- New inventions appear when a render is free: a lift-lid seam on the slab, a box behind the mirror.
## Rules to keep
1. Gate with numbers per file, not by eye; name each defect with its measured value in the re-run line.
2. Send only the ratios of the target view; put the camera as yaw degrees plus height, not "same as photo".
3. List invented details in NEVER, not only the expected parts.

## Round 2 (front re-target, P1f)
- Re-targeting to the straight front fixed the camera (all 3 symmetric, L/R 0.99-1.03), the slab seam and the box behind the mirror; mirror and stool-to-pedestal height landed within 10% on v1. A single view's ratios in the prompt worked.
- New root defect: pedestals 0.23 of piece width (target 0.29, -20%), so the piece reads 13-21% too wide (1.99-2.14 vs 1.76). The tool keeps the wing/overall silhouette and shrinks the part we did not name; name every ratio that has a measured miss.
- Still none passed (4-6 ratios out). Tool hue drift vs a LED-lit original is meaningless: compare hue to the card value.
