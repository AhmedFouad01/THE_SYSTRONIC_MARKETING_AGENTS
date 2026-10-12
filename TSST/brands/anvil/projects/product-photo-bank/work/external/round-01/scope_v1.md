# ANVIL PhotoBank — scope checkpoint, 2026-10-12

State: intake / request prepared for manual external dispatch. NOT_READY. No sorting, image production or delivery executed by this agent.

- Confirmed user direction: clean product photos with white backgrounds; sort FIRST using existing CLIP PhotoBank, across the whole source folder in one round.
- Requested classification: brand, pack size, servings/serving size, product type, goal and explicit benefit. Preserve distinct formulations/flavors and all originals/duplicates.
- Round 01: existing `embed → group → visual naming → sort → catalog`, with field-level verified metadata in separate CSVs and a source reconciliation report. Expected input: 95 JPG from the Lead's inventory; executor must verify.
- Authority: Ahmed/TSST Lead reviews and decides. External ROLE B executes only the bounded sorting request. White-background image production and delivery each remain outside this round; delivery requires a separate instruction after approval.
- Native tool limitation: the supplements profile handles visual tags/scoring; exact label/SKU/benefit metadata requires visual reading and sidecar evidence. CLIP cannot establish claims or serving quantities. No new tool/scripts or broad source lookup is authorized.
- Source integrity: immutable source folder; fresh round-local bank; false duplicate flags audited before sort; all 95 mapped once, copies/hash/source checks and unknowns reported.
- No final-asset declaration, DELIVERY package or durable memory write is authorized by this checkpoint.

## Preparation evidence

Opened TSST-CREATIVE-SK-019 (manifest, source intake via PhotoBank, provenance, QA) and TSST-CREATIVE-SK-013 (source preservation/product truth boundary; retouching workflow deferred). Checked repository-local `photobank.py`, `sort.py` and `profiles/supplements.yaml`: labels support `folder_name`, `description`, `include_files`, `review_files`; duplicate flags override labels. Commands and schema in request match these reads.

Canonical external-production guide was already read by the Lead and its scope supplied in the brief. This child could not read the G: guide (access denied), and no guide exists in this checkout; it does not claim to have read that source. The external executor must read the canonical guide before execution. This checkpoint uses only the Lead's explicit boundaries and verified local tool behavior.

Artifacts owned by this agent: `request.md`, `scope.md` only. Canonical Drive copy and dispatch belong to the Lead. No actual source inventory or label extraction performed by this agent.
