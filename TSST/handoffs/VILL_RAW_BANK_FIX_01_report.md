# VILL Photo Bank Catalog — Fix 01 Delivery Report

**Client**: VILL (Interior Finishing & Custom Furniture)  
**Execution Context**: ROLE B — External Tool Implementation (Local Execution, No Commits / No Pushes)  
**Author**: TSST (The Systronic Smart Team) Lead & Toolchain Worker  
**Date**: 2026-10-10  
**Reference Assets**:
- Master Catalog CSV: [`portfolio/CATALOG.csv`](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/brands/vill-studio/assets/source/portfolio/CATALOG.csv)
- Interactive Visual Browser: [`portfolio/_catalog/BANK.html`](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/brands/vill-studio/assets/source/portfolio/_catalog/BANK.html)
- Curated Studio Picks: [`portfolio/STUDIO_PICKS.md`](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/brands/vill-studio/assets/source/portfolio/STUDIO_PICKS.md)
- Search CLI: [`portfolio/_catalog/search.py`](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/brands/vill-studio/assets/source/portfolio/_catalog/search.py)
- Default View Screenshot: [`portfolio/_catalog/bank_default_view.png`](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/brands/vill-studio/assets/source/portfolio/_catalog/bank_default_view.png)

---

## 1. Executive Summary of Changes (Fixes 1, 2, 3)

All requested changes have been executed with surgical precision while preserving `BANK.html`'s exact owner-approved visual design, color palette, custom styled controls, and 100% offline functionality:

1. **Fix 1 — Production Stage Refinement (Showroom Eliminated)**:
   - Removed the `"showroom"` category entirely.
   - Re-tagged all rows using zero-shot embeddings across the three authentic production stages only: `workshop/raw frame`, `under installation`, and `finished/handover`.
   - Updated `tag_prompts.py`, `tag.py`, `CATALOG.csv`, `catalog_data.json` (embedded in `BANK.html`), and purged all occurrences of "showroom" from `STUDIO_PICKS.md`.
2. **Fix 2 — Review Items Hidden by Default**:
   - Added a custom-styled toggle `"Show review items"` in `BANK.html`'s header actions bar (off by default, styled switch with gold active accent, no browser-native unstyled controls).
   - In `search.py`, `_review/` files are skipped by default and only included when the explicit `--include-review` CLI argument is supplied.
   - Dynamic card counter displays the visible card count (866 in default view; 955 when review items are toggled on).
3. **Fix 3 — Near-Twin Shot Collapsing & Diversity Guardrail**:
   - Automatically identified all photo takes within the same project folder taken $\le 2$ minutes apart with open_clip ViT-L-14 embedding cosine similarity $\ge 0.93$.
   - Grouped into 254 deterministic twin clusters.
   - In `BANK.html`'s gallery grid, exactly **ONE primary card** (highest `ai_score`) is displayed per twin group, featuring an elegant gold badge: `+N similar` (e.g. `+1 similar`, `+4 similar`).
   - Clicking the badge or opening the inspector modal surfaces the **"Near-Twin Takes"** strip, displaying interactive mini-cards for all members with live switching of image previews, score breakdowns, full file paths, and clipboard copy buttons.
   - Added `twin_group` column to `CATALOG.csv` (populated with `TWIN_001` through `TWIN_254`, or blank if singleton).
   - Enforced maximum **one photo per twin group** in `STUDIO_PICKS.md` to prevent duplicate takes from crowding out unique pieces.

---

## 2. Quantitative Verification & Metrics

### A. Stage Counts After Fix (1,530 Catalog Items)
The previous 568 "showroom" items were re-assigned based on their true physical context (clean residential handovers vs. on-site joinery vs. workshop fabrication):

| Stage | Previous Count | New Count | Difference | % of Catalog |
|---|---|---|---|---|
| `under installation` | 533 | **715** | +182 | 46.7% |
| `finished/handover` | 326 | **640** | +314 | 41.8% |
| `workshop/raw frame` | 103 | **175** | +72 | 11.4% |
| `showroom` | 568 | **0** | -568 | 0.0% |
| **Total** | 1,530 | **1,530** | 0 | 100.0% |

### B. Near-Twin Detection Statistics
- **Total near-twin pairs satisfying criteria** ($\Delta t \le 120\text{s} \land \cos \theta \ge 0.93$): **962 pairs**
- **Total twin groups formed**: **254 groups**
  - Project folder groups: 248 groups
  - Review folder groups: 6 groups
- **Total photos belonging to a twin group**: **829 photos**
- **Total hidden cards collapsed into primary cards**: **575 cards**
  - Project folders: 566 hidden cards
  - Review folder: 9 hidden cards

### C. Visible Card Count by Default
- Total catalog items: 1,530 items
- Total review folder items (`_review`): 98 items (hidden by default)
- Project folder photos: $1,530 - 98 = 1,432$ items
- Non-review hidden near-twin cards: 566 cards
- **Visible card count in default view**: **866 cards** ($1,432 - 566 = 866$)
- **Visible card count with "Show review items" toggled ON**: **955 cards** ($866 + 98 - 9 = 955$)

---

## 3. Visual Browser Default View Screenshot

A full headless browser render ($1600 \times 1050$ px) was captured directly from Microsoft Edge:

- **Screenshot Path**:  
  [`TSST/brands/vill-studio/assets/source/portfolio/_catalog/bank_default_view.png`](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/brands/vill-studio/assets/source/portfolio/_catalog/bank_default_view.png)
- **Visual Features Verified in Screenshot**:
  1. Header shows `Showing 866 cards` counter.
  2. Custom styled `Show review items` toggle switch is in the default inactive state.
  3. Filter bar contains styled dropdowns (`Piece: All`, `Material: All`, `Colour: All`, `Stage: All`, `Angle: All`, `Folder: All`), Score Pills, and Sort dropdown.
  4. Gallery grid displays single primary cards for twin takes with prominent `+1 similar`, `+3 similar`, and `+4 similar` badges.
  5. Cards reflect updated stage chips (`finished/handover` and `workshop/raw frame` visible on top cards, zero `showroom` chips).
  6. Zero browser-native unstyled elements exist.

---

## 4. Master Catalog CSV Schema & Sample Rows

In [`portfolio/CATALOG.csv`](file:///G:/My%20Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/brands/vill-studio/assets/source/portfolio/CATALOG.csv), the new column `twin_group` is appended at column 15:

```text
file,folder,piece,material,colour,stage,angle,space_tag,ai_score,score_parts,width,height,date,project folder note (from INDEX.md),twin_group
20171128_020539.jpg,01-custom-furniture-console-dressing-kitchen,dressing table/vanity,white lacquer,navy/blue,under installation,three-quarter,furniture-pieces,3.2,"res:5.0,shp:1.3,exp:4.5,clut:3.2,dom:3.1",2988,5312,2017-11-28,"Custom blue-white vanity desk, reception mirror, and kitchen installations",TWIN_001
20171128_020619.jpg,01-custom-furniture-console-dressing-kitchen,dining chairs,white lacquer,grey,finished/handover,three-quarter,furniture-pieces,3.7,"res:5.0,shp:3.8,exp:4.5,clut:3.9,dom:2.2",2988,5312,2017-11-28,"Custom blue-white vanity desk, reception mirror, and kitchen installations",
20171128_020623.jpg,01-custom-furniture-console-dressing-kitchen,dressing table/vanity,white lacquer,navy/blue,under installation,three-quarter,furniture-pieces,3.6,"res:5.0,shp:3.8,exp:4.3,clut:2.9,dom:2.8",2988,5312,2017-11-28,"Custom blue-white vanity desk, reception mirror, and kitchen installations",TWIN_001
```

*Note*: Photos `20171128_020539.jpg` (score 3.2) and `20171128_020623.jpg` (score 3.6) belong to `TWIN_001`. `20171128_020623.jpg` is selected as the primary card and displayed with `+1 similar` in `BANK.html`. `20171128_020619.jpg` is a singleton and has a blank `twin_group`.

---

## 5. Verification Commands

To verify search and catalog capabilities locally:

```powershell
# 1. Default text search (skips _review automatically)
& "C:\Users\10\tsst-tools\clip-venv\Scripts\python.exe" "TSST\brands\vill-studio\assets\source\portfolio\_catalog\search.py" "modern minimalist kitchen black marble counter" --top 5

# 2. Text search explicitly including _review
& "C:\Users\10\tsst-tools\clip-venv\Scripts\python.exe" "TSST\brands\vill-studio\assets\source\portfolio\_catalog\search.py" "modern minimalist kitchen black marble counter" --top 5 --include-review

# 3. Filtered search by piece and minimum score
& "C:\Users\10\tsst-tools\clip-venv\Scripts\python.exe" "TSST\brands\vill-studio\assets\source\portfolio\_catalog\search.py" "curved velvet sofa" --piece sofa --min-score 3.5

# 4. Similar-take photo lookup
& "C:\Users\10\tsst-tools\clip-venv\Scripts\python.exe" "TSST\brands\vill-studio\assets\source\portfolio\_catalog\search.py" --like 20171128_020539.jpg --top 5
```
