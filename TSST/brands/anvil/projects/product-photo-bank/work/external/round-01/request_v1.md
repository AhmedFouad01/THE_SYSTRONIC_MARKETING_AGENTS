# ANVIL — ROLE B / Round 01: PhotoBank sorting only

ROLE: EXTERNAL TOOL
SURFACE: Antigravity (file-capable IDE); Ahmed manually passes this request and returns the report.
BUDGET: local cached CLIP processing only; zero image-generation calls, zero paid API calls, no automatic rerolls.

Status: bounded manual bridge request; awaiting Ahmed's dispatch. Readiness: NOT_READY. This is an intake checkpoint, not image production or delivery approval.

## Assignment

Use the existing TSST PhotoBank CLIP workflow to sort the entire source folder in one round. Ahmed/TSST Lead owns decisions and acceptance. Produce the sorted bank, evidence and report, then STOP for review. The approved future direction is clean product photos on white backgrounds; do not edit, retouch, generate or export those images in this round. Delivery requires a separate instruction after approval.

Source (read only): `G:/My Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/brands/anvil/assets/Anvil products`

Allowed output root: `G:/My Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/brands/anvil/projects/product-photo-bank/work/external/round-01/`

Bank: the output root's `bank/` subfolder. All logs, labels, metadata and report stay under this round's root. No repository-wide edits, source renaming/moving/deletion, tool changes, alternate indexing scripts, memory writes, publication or delivery. Retain every duplicate and every angle. Do not overwrite an existing round's work; report any collision before proceeding.

## Execution

1. Read `TSST/context/external-production.md`, the existing PhotoBank README, and `sort.py` at the canonical repository above. Verify source access and inventory the expected **95 JPG files**. Record actual count and filenames; stop and report a count mismatch or colliding basenames before running the bank. Create a source manifest with relative path, size, SHA-256, dimensions, source/owner/rights provenance (unknown where undocumented), intended bank destination and review status. Originals must remain byte-identical.
2. Use only `C:/Users/10/tsst-tools/clip-venv/Scripts/python.exe` and `G:/My Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/CREATIVE/tools/photo-bank/photobank.py`. Require locally cached CLIP and existing dependencies; prohibit network model fetching, paid calls, downloads and installs. Set offline mode supported by the installed stack and verify the required model cache before commands. Missing dependency/cache or inability to prevent downloads → stop and report, without changing the tool.
3. Run the existing CLI in this order, replacing the placeholders with the absolute paths above and recording command/output logs:

   ```text
   <python> <photobank.py> embed <source> <bank> --profile supplements
   <python> <photobank.py> group <bank> --profile supplements
   ```

4. Inspect contact sheets and open original full-resolution images to verify product identity and small label text. CLIP clusters/tags and similarity scores are suggestions, never proof of brand, size, servings, ingredients or benefits. Split mixed clusters using `include_files` in `labels.json`; use the actual `sort.py` schema. Suggested hierarchy: `brand/product_type/product/sku_variant`, using safe relative path segments and only verified values. Keep distinct sizes, formulations and flavors separate even when packaging looks similar. A SKU variant here is a local catalog key, not an invented manufacturer SKU. Unknown identity belongs in `_review`.
5. Audit every exact/near-duplicate candidate visually. `sort.py` routes both cluster duplicate lists and `files.json` duplicate flags into `_duplicates`, overriding labels. Correct false-positive flags only in the round-local bank `_work` metadata, preserve the original generated metadata as evidence and log each correction. Never classify a different size/flavor/formula as a duplicate. Keep true duplicate copies in `_duplicates` and link each to its verified SKU/reference file in the sidecar manifest. Then run:

   ```text
   <python> <photobank.py> sort <bank> --labels <round-root>/labels.json
   <python> <photobank.py> catalog <bank> --profile supplements
   ```

## Product metadata and evidence

Keep the native PhotoBank outputs intact. Its supplements profile describes visual packaging/settings; it does **not** natively extract exact SKU, label text or product benefits. Add a separate spreadsheet-filterable `PRODUCTS.csv` (one row per verified product variant) and `SOURCE_MANIFEST.csv` (one row per source image). Do not claim these fields are native PhotoBank filters.

`PRODUCTS.csv` fields: local SKU key; brand; product name; product type; formulation; flavor; pack size value/unit (including capsule/tablet count where applicable); serving_count; serving_size as stated (including unit); suggested_use verbatim only if visible; goal_tags; benefit_tags; linked image IDs; review status. Preserve printed units and wording; do not conflate pack size, number of servings, serving size or suggested use. Do not recommend doses.

For every extracted field, provide value, evidence image/path and label location (or exact supplied master record), short supporting text, verification state and confidence. Use `unknown` for unreadable/absent evidence and `unverified` for tentative interpretations; avoid confident guesses or conversions. Store detailed per-field evidence in `FIELD_EVIDENCE.csv`, keyed by SKU and field, with image IDs traceable to the source manifest. If evidence conflicts, retain both readings and flag for review.

Goal/benefit tags must be multi-valued and limited to **explicit wording on the label or an exact, supplied and existing read-only product master path**. No master path is supplied in this request: do not search broad memory or substitute web/general supplement knowledge. No medical claims, inferred efficacy or inferred target audience from product category/CLIP. Unknown benefits stay unknown. Mark label claims as label-stated, not independently substantiated. The requested filters are brand, size, serving count/size, type, goal and benefit.

## Review packet and stop condition

Provide native `INDEX.md`, `CATALOG.csv`, `BANK.html`, contact sheets and generated bank metadata; `labels.json`; the three sidecar CSVs; logs; and a readable `REPORT.md` linking all outputs. Report actual file count, unique verified variants, every unknown/conflict, duplicate decisions, command failures, and any limitations of existing catalog filters.

Reconcile **95 source images = sorted + duplicates + review**, counting each source exactly once in the primary mapping. Preserve additional previews separately from this count. Verify every mapped destination exists and its SHA-256 matches its source; recheck source hashes after the run. Reconcile CSV source rows, bank records and physical copies, not just printed CLI totals. The report must name any missing/unreadable file explicitly. Do not declare completion with unexplained omissions.

End the report with `Awaiting Ahmed/TSST Lead review. White-background production and delivery have not started.` Do not continue to production, delivery, Git commits/pushes or durable memory updates.
