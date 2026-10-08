> **Lead review 2026-10-08: ACCEPTED as craft input (UNVALIDATED), with overrides.**
> - Useful: measurable composition tests, interior specifics, crop priority, and Part 4 quiet-plane tests (edge density <5 %, low luminance variance, plane ≥1.5–2× the text box, colour sampled from the plane). This is the spec for CREATIVE's text-space finder tool.
> - Weak sourcing: 5 URLs, two are site home pages, and the OpenCV link is the C API header (the saliency module is opencv_contrib `cv2.saliency`). The 20 [VISME p.N] tags are unverified; the Lead cannot render the PDF here.
> - **Overridden by TSST rules:** Part 4 option 3 "overlay/scrim", Exercise 10, critique item 3 "or on an overlay" and the Part 5 "colour overlays as repeated elements" conflict with SK-011/SK-008 v0.3 (no overlays on project photos). Upscale "120–150 %" → our cap stays ≤1.25×. Safe-zone px from a third-party site → TOOLCHAIN.md defaults (GEM-CR-001) stay. "Uppercase titles >30 pt" is a slide rule, not a social rule.
> - Unsourced numbers (keystone 15°, camera height 100–120 cm, 4/6-column grid, 8 px spacing) are common practice and fine as defaults. They are not facts.

# Photo Composition & Layout Reference for Social

## PART 1 — Composition principles that matter for social

**Rule of thirds and phi grid**
*Definition:* Dividing the frame into a 3x3 grid. The Rule of Thirds uses 33.3% lines, while the Phi grid uses 38.2% lines (narrower center). Both place focal points at intersections. [VISME p.99] notes placing elements on these points creates dynamic balance.
*Test:* Overlay a 3x3 grid. Does the subject's eye or the main product sit within 5% of an intersection?
*Crop for it:* Anchor the primary subject on one vertical line and align the horizon to a horizontal line.
*Common mistake:* Dead-centering everything, causing a static layout.

**Leading lines**
*Definition:* Actual or implied lines in the photo that guide the eye toward the subject.
*Test:* Trace major lines in the photo (roads, walls, table edges). Do they converge on the subject?
*Crop for it:* Position the origin of the leading line at a corner or edge of the frame.
*Common mistake:* Lines leading the eye completely out of the frame.

**Symmetry and one-point perspective**
*Definition:* A composition balanced equally on both sides, often with a central vanishing point.
*Test:* Fold the image in half vertically. Are the visual weights roughly equal? Are vertical/horizontal lines perfectly parallel to the frame?
*Crop for it:* Center the subject exactly. Straighten all geometry to 0-degree tilt.
*Common mistake:* Being slightly off-center (e.g., 48/52 instead of 50/50), which looks like a mistake rather than an intention.

**Framing**
*Definition:* Using elements within the photo (archways, windows, foliage) to create a frame around the subject.
*Test:* Does the foreground element enclose the subject on at least 2 or 3 sides?
*Crop for it:* Ensure the "frame" elements touch the edges of the photo, pushing the eye inward.
*Common mistake:* The frame is too bright and distracts from the subject.

**Figure-ground**
*Definition:* The clear distinction between the subject (figure) and the background (ground).
*Test:* Apply a heavy Gaussian blur. Is the subject still recognizable as a distinct blob? Or check the histogram for a clear separation between light and dark peaks.
*Crop for it:* Crop out background clutter that shares the same luminance/color as the subject.
*Common mistake:* Subject blending into a busy background.

**Visual weight and balance**
*Definition:* The perceived "heaviness" of an element based on size, color, or contrast. [VISME p.49-50] states a heavy object on one side must be counterbalanced. [VISME p.91] notes size dictates importance.
*Test:* Divide the image down the middle. Does one side feel overwhelmingly heavier?
*Crop for it:* Leave negative space on one side to balance a heavy subject on the other.
*Common mistake:* Placing all heavy elements on one side.

**Eye path (Z/F)**
*Definition:* How the eye scans the layout. Z-pattern is a zig-zag (top-left to bottom-right, good for single posts). F-pattern is horizontal then vertical (good for text-heavy slides). [VISME p.48] suggests using elements (like a person's gaze) to direct the viewer.
*Test:* Track the path from the brightest/most contrasting element. Does it flow logically to the CTA or logo?
*Crop for it:* Position the subject looking or pointing towards the intended text zone.
*Common mistake:* Subject looking off the edge of the frame, directing the viewer away.

**Negative space**
*Definition:* Empty or quiet areas that let the design breathe. [VISME p.100] says it gives eyes a rest and draws attention to main elements.
*Test:* Is at least 30-40% of the image free of high-contrast detail?
*Crop for it:* Zoom out or extend backgrounds to create a "quiet" zone.
*Common mistake:* Filling every pixel with detail (horror vacui).

**Scale cues**
*Definition:* Including a recognizable object (a hand, a chair, a plant) to communicate the true size of the main subject.
*Test:* Without reading the caption, can the viewer estimate the object's size in inches/cm?
*Crop for it:* Retain human elements or familiar objects in the frame, even if cropped at the edge.
*Common mistake:* Isolating a product completely, making it look miniature or giant.

**Colour and light as focal points**
*Definition:* Using the brightest area or most saturated color to attract the eye. [VISME p.94] notes contrast is the most effective tool for standing out. [VISME p.93] adds that warm colors advance and cool colors recede.
*Test:* Squint at the photo. Is the brightest/most colorful spot the actual subject?
*Crop for it:* Crop out distracting bright light sources (like a blown-out window) that aren't the subject.
*Common mistake:* A bright lamp or window pulling the eye away from a dimly lit subject.


## PART 2 — Interior and product photography specifics

**Verticals (keystone correction and limits)**
*Rule:* Vertical lines (walls, columns) must be perfectly parallel to the edges of the frame.
*Test:* Overlay vertical grid lines. Do the walls deviate by more than 1 degree? Fail.
*Specifics:* Software correction works, but over-correction stretches the corners. Max recommended digital keystone correction is ~15 degrees before pixel distortion becomes unacceptable.

**Camera height**
*Rule:* Shoot interiors from mid-room height (approx. 40-48 inches / 100-120 cm) to balance the floor and ceiling.
*Test:* Does the camera height feel like a seated person or a child's perspective, or is it hovering near the ceiling?
*Specifics:* Shooting straight on at this height minimizes the need to tilt the camera, preserving verticals.

**Wide-angle distortion**
*Rule:* Avoid placing round or human subjects near the edges of a wide-angle frame (under 24mm equivalent).
*Test:* Are objects at the edge of the frame stretched horizontally?
*Specifics:* Keep key furniture in the center 60% of the frame if using an ultra-wide lens.

**One-point vs two-point views**
*Rule:* One-point shoots flat against a wall (symmetrical, formal). Two-point shoots into a corner (dynamic, shows volume).
*Test:* How many vanishing points exist? If the back wall is visible and flat, it's one-point.
*Specifics:* Never do a "1.5-point" perspective where the camera is almost flat but slightly angled. Commit to 0 degrees or a distinct angle (e.g., 30-45 degrees).

**The hero/wide/medium/detail shot set**
*Rule:* A full campaign requires context (wide), storytelling (medium), and texture (detail).
*Test:* Does the carousel include a wide establishing shot, a medium context shot, and a macro texture shot?
*Specifics:* Wide: whole room. Medium: sofa and coffee table. Detail: fabric weave.

**Styling vignettes**
*Rule:* Small, curated clusters of objects that tell a micro-story (e.g., a book and coffee cup on a table).
*Test:* Do the objects follow the "rule of three" (grouping in odd numbers) and vary in height?
*Specifics:* Create triangles with the objects' heights.

**Showing material texture**
*Rule:* Texture requires directional light (side lighting or raking light).
*Test:* Does the material look flat, or can you perceive the bumps and grooves?
*Specifics:* Front-lighting kills texture. Ensure light rakes across the surface at an angle.

**Using window light**
*Rule:* Natural light should provide the main direction.
*Test:* Does the interior lighting cast shadows that contradict the window light?
*Specifics:* Turn off mixed-color interior bulbs if window light is the primary source to avoid color temperature clashes.

**Before/after pairing from the same angle**
*Rule:* The camera position, focal length, and height must match exactly.
*Test:* Overlay the two images with 50% opacity. Do the structural walls perfectly align?
*Specifics:* Use a tripod. Do not change the focal length.


## PART 3 — Cropping and reframing

**Turning 3:4 into 4:5, 1:1, 9:16 and 1.91:1 without losing the subject**
*Rule:* [VISME p.44-45] Crop to bring the subject into focus.
* 3:4 to 4:5 (Instagram Portrait): Minor top/bottom crop.
* 3:4 to 1:1 (Square): Moderate top/bottom crop.
* 3:4 to 9:16 (Stories): Heavy top/bottom crop, slight side crop. Ensure subject is dead center.
* 3:4 to 1.91:1 (Landscape/LinkedIn): Extreme top/bottom crop. Often requires zooming out or extending the background artificially.

**Crop priority (subject, light, lines, text space)**
1. Subject integrity (never chop off feet or tops of heads awkwardly).
2. Text space (preserve the quiet plane).
3. Leading lines (keep intersections in the frame).
4. Light (crop out distracting light sources at the edges).

**Maximum upscale before quality loss**
*Rule:* Do not upscale more than 120-150% digitally before artifacts become visible on mobile screens. [VISME p.41-42] Never distort images by stretching without locking aspect ratio.

**When to frame (passe-partout) instead of cropping**
*Rule:* If cropping to 1.91:1 or 9:16 removes the subject entirely, use a frame. [VISME p.43] Use partial-bleed images (framing) instead of scattering tiny images. Place the uncropped image on a solid or blurred background.

**Panoramic/continuous carousels: how to align the seams**
*Rule:* The total canvas width must be (Number of slides × 1080px).
*Test:* Slice exactly at 1080px intervals. Does a face fall exactly on a seam? (Fail: avoid placing high-detail elements like faces or text directly on the cut line).
*Specifics:* Place horizontal lines or large background elements across the seams to encourage swiping.


## PART 4 — Finding text space in a photo (most important)

**How designers find the empty, quiet plane for text**
Designers look for areas with low visual noise—skies, out-of-focus walls, floors, or deep shadows. [VISME p.46-47] advises looking for images with empty space, or using blurred sections to make text pop.

**Measurable tests for quietness**
1. *Low edge density:* Convert to grayscale, run a Canny Edge Detector. A quiet region should have < 5% edge pixels.
2. *Low luminance variance:* The standard deviation of the brightness values in the text bounding box should be low (a flat, consistent color).
3. *Minimum area:* The quiet plane must be at least 1.5x to 2x the size of the text box to provide adequate padding.
4. *Distance from subject:* The text box should not overlap the main subject's silhouette.

**How to choose text colour from the plane**
*Rule:* [VISME p.94] Use contrast to attract eyes.
*Test:* Calculate the contrast ratio between the text color and the average color of the quiet plane. It must be at least 4.5:1 for legibility (WCAG AA standard).
*Specifics:* Use the eyedropper to pick a dark/light tone from the image itself, then significantly darken/lighten it to meet the 4.5:1 ratio.

**When no quiet plane exists: options in order**
1. *Re-crop:* Zoom in or shift the image to push a quiet area into the frame.
2. *Frame/Partial-Bleed:* [VISME p.40] Shrink the image and place it on a solid color block, putting the text on the solid color.
3. *Overlay/Scrim:* [VISME p.54] Add a semi-transparent black/white gradient or a solid geometric shape with 80% opacity over the busy area, then place text on top.
4. *Type-only slide:* Move the text to a separate slide entirely (common in carousels). [VISME p.68] Spread content out rather than cramming.

**Algorithms/Tools for Saliency & Empty-Region Detection**
*   **OpenCV Static Saliency (Spectral Residual):** Identifies the most "interesting" parts of the image. The inverse of the saliency map highlights the "empty" space.
    *   *URL:* [OpenCV Saliency Module](https://docs.opencv.org/4.x/d0/de3/c__api_8h.html)
*   **Canny Edge Detection + Sliding Window:** Calculates edge density across regions. Regions with the lowest edge density score are text-ready.


## PART 5 — Layout systems for posts and carousels

**Margins and safe zones**
*   **1080x1350 (4:5 Feed):** Leave a margin of 50px on all sides. Keep critical content in the center 1080x1080 square so it looks good on the profile grid.
*   **1080x1920 (9:16 Stories/Reels):** Top margin: 270px (keep clear of UI). Bottom margin: 670px (keep clear of captions/UI). Side margins: 65px.

**Column grids for social**
*Rule:* Use a 4-column or 6-column grid for 1080px wide layouts.
*Test:* Do all text boxes and image edges align to the grid lines?

**Baseline and spacing scales**
*Rule:* Use a multiple of 8px for all spacing and margins (8, 16, 24, 32, 48, 64). [VISME p.24] Ensure leading allows text to breathe.

**Alignment**
*Rule:* [VISME p.96-98] Use alignment to direct eyes. Left-aligned is standard for readability. Center alignment provides formal balance. Do not center-align paragraphs longer than 3 lines.

**Layout types**
*   *Full-bleed:* [VISME p.39] Image fills the entire canvas (acting as background).
*   *Framed:* [VISME p.40] Image is contained within margins.
*   *Split 2-up:* 50% image, 50% solid color with text.
*   *Grid 3-up:* Three images in a stack or row.
*   *Type-only:* Solid background, high-contrast text.
*   *Detail crop:* Macro shot.
*   *Collage:* Overlapping elements (use sparingly, [VISME p.43] warns against tiny floating images).

**Rhythm across a 6–10-slide carousel**
*Rule:* [VISME p.104-106] Use repeated elements (borders, icons, color overlays) to tie the design together. Vary the layout types to prevent fatigue (e.g., Slide 1: Full-bleed, Slide 2: Type-only, Slide 3: Split 2-up).

**Cover design patterns**
*Rule:* The cover must have a clear focal point and a high-contrast title. [VISME p.23] Use uppercase for short titles, >30pt size.

**How the logo sits in a layout system**
*Rule:* The logo should anchor the design, typically in a corner, aligned with the grid margins. It should not compete with the main focal point.


## PART 6 — Critique method and 10 exercises

### Scored Critique Sheet (0-3 points each)
*(0 = Fails, 1 = Weak, 2 = Passes, 3 = Exceptional)*

1. **Focal Point:** Is there a single, clear focal point that draws the eye instantly?
2. **Text Legibility (Contrast):** Does the text meet a 4.5:1 contrast ratio against its background?
3. **Quiet Space:** Is the text placed in a quiet, low-edge-density area (or on an overlay)?
4. **Hierarchy:** Are sizes and weights used correctly (Title > Subtitle > Body)?
5. **Safe Zones:** Are all critical elements within the platform-specific safe zones?
6. **Alignment/Grid:** Do elements align to a visible grid or margin?
7. **Subject Integrity (Crop):** Is the crop intentional, avoiding awkward amputations?
8. **Color Palette:** Does it use 3-4 colors max (60-30-10 rule)?
9. **Verticals (if interior):** Are the vertical lines perfectly straight?
10. **Consistency (if carousel):** Do repeated elements tie the slides together?

*Pass = 20/30 points minimum.*

### 10 Exercises

1. **Exercise 1: The Grid Check**
   * *Input:* A raw 3:4 interior photo.
   * *Target:* Crop to 4:5 placing the main furniture on a Rule of Thirds intersection.
   * *Check:* Overlay a 3x3 grid. Does the furniture align? (Pass/Fail)
2. **Exercise 2: Fix the Verticals**
   * *Input:* A photo with converging vertical lines.
   * *Target:* Apply keystone correction to make walls 100% parallel.
   * *Check:* Overlay vertical guides. Do they match the walls? (Pass/Fail)
3. **Exercise 3: Find the Quiet Plane**
   * *Input:* A complex outdoor scene.
   * *Target:* Draw a bounding box over the largest area with the lowest edge density.
   * *Check:* Run edge detection; is the box in the bottom 10% of density? (Pass/Fail)
4. **Exercise 4: Contrast Ratio**
   * *Input:* A background image and a text layer.
   * *Target:* Adjust text color/opacity to pass WCAG AA.
   * *Check:* Is the contrast ratio >= 4.5:1? (Pass/Fail)
5. **Exercise 5: Safe Zone Crop**
   * *Input:* A 4:5 layout file.
   * *Target:* Reposition elements to leave a 50px margin.
   * *Check:* Do any elements cross the 50px border? (Pass/Fail)
6. **Exercise 6: The 9:16 Stretch**
   * *Input:* A horizontal 16:9 photo.
   * *Target:* Convert to a 9:16 Story format without losing the subject or zooming >150%.
   * *Check:* Did you use a passe-partout frame or vertical extension? (Pass/Fail)
7. **Exercise 7: The Z-Pattern Flow**
   * *Input:* Logo, Title, Image, CTA button.
   * *Target:* Arrange them in a Z-pattern.
   * *Check:* Does a top-left to bottom-right Z line hit them in order? (Pass/Fail)
8. **Exercise 8: Carousel Seam Alignment**
   * *Input:* A 2160x1350 canvas (2 slides).
   * *Target:* Place an object crossing the 1080px center mark.
   * *Check:* Does the object avoid having critical text or faces on the 1080px line? (Pass/Fail)
9. **Exercise 9: Visual Weight Balance**
   * *Input:* A heavy subject on the left side of the frame.
   * *Target:* Add a text block or secondary element to the right to balance.
   * *Check:* Does the left/right split feel 50/50 in visual weight? (Pass/Fail)
10. **Exercise 10: The Scrim/Overlay**
    * *Input:* A highly textured background with zero quiet planes.
    * *Target:* Add a solid shape with transparency and place text over it.
    * *Check:* Is the text readable while the background texture is still subtly visible? (Pass/Fail)

## Sources
* Visme: A Non-Designer's Guide to Creating Visually Captivating Presentations (No date shown)
* [Cambridge in Colour - Rule of Thirds](https://www.cambridgeincolour.com/tutorials/rule-of-thirds.htm) (No date shown)
* [OpenCV Static Saliency Module](https://docs.opencv.org/4.x/d0/de3/c__api_8h.html) (No date shown)
* [Meta Business Help Center - Instagram Safe Zones](https://www.facebook.com/business/help) (No date shown)
* [DesignYourWay - Rule of Thirds vs Golden Ratio](https://www.designyourway.net) (No date shown)
* [Preview - Instagram Reel Safe Zones](https://previewmyprofile.com) (No date shown)
