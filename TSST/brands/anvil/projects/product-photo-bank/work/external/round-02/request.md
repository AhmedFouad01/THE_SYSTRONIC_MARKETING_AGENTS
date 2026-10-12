# ANVIL — ROLE B / Round 02: white-background product images

ROLE: EXTERNAL TOOL. SURFACE: Antigravity, same conversation, manually bridged by Ahmed.
STAGE: image production for review only. TSST readiness: NOT_READY. No delivery or publication.
BUDGET: no paid external API purchases, new paid setup or credentials; no model downloads/installs. Native included-plan photo editing, if available, is capped at **one call per source, 95 calls total maximum**. Reuse/local editing may reduce calls. No exploratory variants, retries or automatic rerolls.

## Approved scope and paths

Ahmed accepted **1600 × 1600 opaque PNG**, one output for each of the **95 original source images**, keeping multi-shaker displays intact. Process the entire set in one batch. Clean product photography on white; no added marketing design, text, logo or CTA.

- Read-only source: `G:/My Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/brands/anvil/assets/Anvil products/`
- Read-only routing evidence: current `SOURCE_MANIFEST.csv` and `labels.json` under `G:/My Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/brands/anvil/projects/product-photo-bank/work/external/round-01/`.
- Write only: `G:/My Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/brands/anvil/projects/product-photo-bank/work/external/round-02/`.

Use the manifest's **95 exact source filenames** to select images; resolve originals from the source folder above. `relative_path` uses the ANVIL brand root as base. Round 01 bank contains 147 physical copies: 95 active primaries plus 52 historical copies. Do not recursively select bank images. The prior 13 identity swaps and TVN flavor mappings were corrected and reviewed. Nutritional/benefit sidecar caveats remain: never use those metadata values to rewrite or reconstruct packaging. Round 01 metadata fixes are separate; it is read-only in this production pass.

## Local execution and faithful editing

1. Inspect existing round-02 work before starting/resuming. Preserve earlier results, masks and logs. Reuse valid completed work only when the exact source/hash and specification match; log reuse. Stop only conflicting files for review rather than overwriting unexplained work. Verify source count and exact names; report any discrepancy.
2. Prefer existing local image-editing/masking tools and reuse. A local foreground model must already be installed/cached and verified offline. Antigravity/Gemini's existing native included-plan image editor may edit the **actual source photo** if available; verify this capability rather than assuming it. Cap native editing at one call per source and 95 total maximum; no fresh product generation, variants, retries or rerolls. Do not use unrelated external APIs, upload publicly or create new paid setup/credentials. If payment/credit purchase is required, stop that affected call and report it. No installs/downloads, CLIP, re-sorting, re-embedding or tool changes. If one path is unavailable, use another existing faithful workflow or flag affected files; continue unaffected work.
3. Inspect every original before editing. The previous visual screening found about 18 already-white sources and 77 retail/other-background images; verify per file. For already-white sources, preserve the clean original product art and adapt the canvas; report `REUSED_CANVAS` instead of claiming fresh retouching. For retail sources, use non-destructive masks/selections and restrained exposure/white-balance correction.
4. Preserve real product shape, perspective, colors, texture, marks, literal Arabic/English printing, seals, lids and visible contents. Do not redraw/regenerate products or logos, invent hidden labels/surfaces, add claims/callouts, alter packaging text, remove physical wrapping or turn displayed items into an invented sale bundle. Keep every item and color in each multi-item display; no individual cutout variants.
5. Hands, glare, occlusion, plastic wrapping, cropped products and watermarks need honest handling. Remove surrounding clutter only where a faithful product boundary is observable. Do not reconstruct hand-obscured product parts, erase watermarks without documented owner rights, or hide unresolved defects with fabricated printing. Flag `REVIEW` or `BLOCKED` with the exact issue; continue the rest. Known/unknown rights provenance remains explicit in the report, never on the art.

## Output and composition

- Save to `outputs/<original-stem>__white_v01.png`, preserving spaces/characters in the original stem. Exactly one primary output per source; no flavor/size guessing in filenames. On an authorized resume, preserve conflicting versions and report them rather than overwriting.
- Each output: **1600 × 1600 pixels, opaque PNG, sRGB**. Surrounding canvas **#FFFFFF**; natural product edges and a subtle credible contact shadow may contain gray. No transparency, tint, border, browser UI or production labels on artwork.
- Preserve aspect ratio; center optically with consistent safe margins, keeping the complete visible product/display. Use restrained, realistic shadow only where supported by geometry/light; no floating product, dramatic effects or fake reflections.
- Product-detail enlargement must stay **≤1.25× the original source crop's pixels**. A 1600-pixel canvas does not authorize stretching a small product to fill it. Use additional white margins; log source crop dimensions and actual placement scale. Do not promise new detail or conceal softness through aggressive sharpening.
- Keep recoverable source references, masks/editable layers, placement/scale and adjustments in `work/<original-stem>/`; original files remain unchanged. Save readable job-local helper scripts/settings if used. Do not require numbered text/logo layers where no such new elements exist.

## QA and review packet

Inspect **every actual PNG** at 100% and at 300–360-pixel viewing size. Check label/mark pixel fidelity against its exact source, item count, crop, edge halos, contact/shadow, color shifts, wrapping/occlusion and realistic detail. Native editor changes to labels, marks or product details fail QA: mark REVIEW, preserve the source and do not retry automatically. Record each defect, severity and fix/status; re-inspect local corrections. A batch contact sheet alone is insufficient.

Write round-02 `MANIFEST.csv` with one row for each source: exact original path/name, source SHA-256, output path/hash if present, status, source crop size, placement scale, dimensions, color mode/profile, opacity check, QA outcome, provenance and unresolved reason. Validate PNG dimensions and that every alpha sample is 255 if an alpha channel exists; embed/declare sRGB correctly. Recheck original hashes after processing.

Use mutually exclusive final statuses: `COMPLETED` (new cleanup passes QA), `REUSED_CANVAS` (original product art preserved with passing canvas adaptation), `REVIEW` (render exists but unresolved defect/rights), `BLOCKED` (no faithful output possible). **COMPLETED + REUSED_CANVAS + REVIEW + BLOCKED = 95**. Target 95 reviewable outputs; never fabricate missing product details merely to meet that target. Separate successful output count from all processed sources. Keep draft files clearly identified through paths/manifest, not an artwork watermark.

Provide paired before/after contact sheets with full source IDs, individual readable QA records and one concise `REPORT.md` linking outputs, masks/helpers, manifest and evidence. Log per-source editing tool and actual native image-call count; total must not exceed 95 or one per source. Report credits/cost only if displayed, otherwise `UNKNOWN`; never claim free or zero cost merely because an editor is included. Report external paid purchases and elapsed time only from measured evidence. Include applicable final-asset self-review scores with justified N/A for campaign-copy/CTA requirements. These are product packshots, not campaign templates; packaging variation is preserved source variation.

Stop after production and the report. External passes remain `PRODUCTION_DRAFT` pending TSST Lead/CREATIVE review of actual renders; do not self-grant release approval. No DELIVERY pages, delivery folders outside this round, public/unrelated-service uploads, publication, memory writes, commits/pushes or repository changes. End with: `Awaiting Ahmed/TSST Lead review. Delivery has not started.`

