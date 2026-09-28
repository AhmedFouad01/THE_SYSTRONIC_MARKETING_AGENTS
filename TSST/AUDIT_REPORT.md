# TSST migration and team audit

Date: 2026-09-20. Scope: naming, structure, evidence integrity, governance, skill definitions, sources and readiness. This is a repository audit, not a practical skill evaluation. No evaluation, campaign or onboarding was executed.

## Inventory and preserved outcomes

62 registered skills: 30 LEAD, 10 CREATIVE, 10 LENS, 12 SPARK. There are 49 installed packages and 13 specialist backlog entries. The 19 specialist packages retain their methods and guardrails, with naming substitutions only. Lead packages are new and UNVALIDATED.

The 19 existing evaluation files contain four completed runs and 16 queued evaluations. The art-direction record contains both its initial failure and remediation. Current specialist states remain 1 VALIDATED, 2 LAB_VALIDATED and 29 UNVALIDATED; Lead adds 30 UNVALIDATED skills. See [evaluation index](EVALUATION_INDEX.md).

| Skill | Preserved result | Scope limitation |
| --- | --- | --- |
| TSST-CREATIVE-SK-001 | 95/100, PASS, VALIDATED | Brand architecture only; asset inspection, licensed fonts, rendered production/accessibility and downstream QA remain unproven. |
| TSST-CREATIVE-SK-002 | 94/100, PASS, LAB_VALIDATED | Synthetic policy and blind-handoff test; canonical files were not bundled. |
| TSST-CREATIVE-SK-008 | Run 01: 82/100, FAIL, UNVALIDATED; remediation: 88/100, PASS, LAB_VALIDATED | Static lab evidence only; physical projector, licensed fonts, interactive accessibility and publication remain unproven. |

The illustrative states in the migration request differ from the latest repository records. No regrading or downgrade was performed. All score tables, weaknesses, remediation history and validation ceilings remain unchanged except canonical names/IDs. The [manifest](migration/PRESERVATION_MANIFEST.json) records pre-migration and naming-transformed hashes for all 460 original files, including 429 files under evaluation directories and 11 original PNGs. Hidden browser profile/cache artifacts were retained as historical execution artifacts, not active configuration. Their byte contents were not rewritten.

## References and integrity

- No rename-induced missing file links found. Canonical skill packages, evaluation records, evidence directories, agent links and HTML stylesheet dependencies resolve.
- Ten link occurrences in the historical Guidelines actual-output artifact target seven absent fixture paths: `strategy/positioning.md`, `tokens/brand.tokens.json`, `assets/manifest.yml`, `AGENT_GUIDE.md`, `BRAND.md`, `legacy/social-notes.md`, and `references/github-brand-guidelines.pdf`. The two document bodies are embedded in the output rather than separate files. Missing canonical retrieval evidence was already an explicit weakness in its 94/100 evaluation. These historical links remain unresolved; creating invented targets would alter the meaning of the test. This is the sole exception to a completely clean local-link gate.
- The historical workbook has migrated sheet names, agent labels and skill IDs. Its original 32-skill/three-specialist scope, cells, numerical values, formulas, styles, tables and chart definitions are retained aside from naming text. It is not the authoritative current four-agent registry. Artifact Tool imported it, recalculated in memory, found no scanned formula-error values, and rendered representative changed ranges on all five tabs. Longer IDs wrap within existing cells. The OOXML naming patch deliberately avoids a broad workbook regeneration.
- Original evaluator names were mapped to the current Lead display name for naming consistency; this does not assert that the newly installed Lead performed historical tests. [Legacy map](../LEGACY_ID_MAP.md) preserves the original identities and paths.

## Ownership and duplication

| Overlap | Resolution |
| --- | --- |
| Lead strategy vs LENS positioning/planning | LENS owns evidence and proposals; Lead integrates commercial strategy within user decision rights. |
| Lead creative literacy vs CREATIVE craft | Lead judges strategic fit; CREATIVE retains visual identity, graphic design, art direction and visual QA. |
| Lead investment literacy vs SPARK media | Lead recommends capital allocation; SPARK owns platform mechanics, measurement and optimization evidence. |
| Lead learning portfolio vs experiment design | Portfolio skill prioritizes what to learn; experiment-design skill specifies how to obtain credible evidence. LENS and SPARK retain domain execution. |
| Lead growth loops vs lifecycle strategy | Loops model reinvestment mechanics; lifecycle plans customer-stage interventions and retention. Shared metrics must use one dictionary. |
| LENS experiment backlog vs SPARK creative testing | One hypothesis record; LENS governs strategic learning, SPARK specifies paid-media tests and measurement. |
| LENS presentation vs CREATIVE design | LENS owns business analysis, storyline, evidence and charts; CREATIVE owns visual system and craft review. |

No exact duplicate installed skill bodies were found. Related subjects have intentional decision-versus-execution boundaries; no specialist package was deleted or rewritten to consolidate them.

## Weak definitions, source risks and gaps

1. LENS research planning and evidence grading rely on an archived NASA presentation guide, as already disclosed in their source notes. It is a structural reference, not a complete modern research/evidence standard. Replace or supplement it before production validation. External research was not used to refresh specialist sources during this task.
2. Google Skillshop, TikTok Academy, Think with Google and broad brand/GitHub resources are entry points or examples. Several specialist registry entries lack source snapshots, edition pins or precise freshness dates. Check feature-specific official documentation before volatile platform use. A current external freshness audit remains outstanding.
3. CREATIVE typography/color examples do not by themselves establish Arabic typography, licensing or accessibility compliance. The Lead's W3C reference supports review literacy; it does not retroactively validate specialist work.
4. Backlog entries are objective-level definitions, not executable installed skills. Missing packages include CREATIVE 007/009/010, LENS 007–010 and SPARK 007–012. Advanced presentations are registered but not yet packaged or validated; Lead executive communication does not fill that production gap.
5. Further specialist coverage is needed for privacy/consent governance, advertising-policy review, CRO/landing-page accessibility, brand voice/copy and Arabic editorial QA, SEO/organic content, creative rights and synthetic-media disclosure. Lead adds lifecycle/CRM, financial and statistical oversight; specialist execution remains unproven.
6. All 30 Lead packages record reference provenance, bounded methods, inputs, outputs and ownership. The detailed methods are TSST-authored synthesis; references establish concepts, not demonstrated competence. The Lead registry is not a validated training result. Statistical, financial and negotiation references do not confer professional sign-off.
7. Existing art-direction evidence uses a domain-specific scorecard with its own readability/production floors. The generic team scorecard does not describe that historical specialization. Both are preserved; a future evaluation protocol must explicitly declare its rubric before execution.
8. Sixteen specialist foundation evaluations and all Lead evaluations remain unrun. Cross-agent integration and production/policy checks are absent. No agent is PILOT_READY or PRODUCTION_READY.

## Onboarding and operating readiness

All four agents are NOT_READY for pilot/production. Progressive Deep Onboarding is prepared for supervised use when explicitly requested. The profile shell contains no inferred company facts. It covers identity, offers, markets, customers, commercial and financial model, targets, sales/channels, brand/creative quality, resources, competitors, partnerships, risk, reporting and decision rights in eight stages.

The next user-authorized action may be to begin Deep Onboarding. This audit does not begin it, schedule it or authorize campaign execution.

## Static verification

[Repository integrity checker](migration/verify_migration.py) passed: all 460 originals remain accessible; all 429 evaluation-directory files match their naming-transformed hashes; all 11 original PNGs match their pre-migration hashes; 49 packages have valid names/frontmatter fields, no unfinished scaffolds and no exact duplicate bodies. The 30 Lead packages contain valid quoted YAML scalar descriptions. The bundled skill-creator validator could not start because PyYAML is absent, so equivalent checks for these simple frontmatter fields were performed by the local checker. No practical or behavioral evaluation was substituted or run.

Local links and HTML dependencies pass except the ten documented historical fixture references. Workbook XML parses, all five canonical tab names are present, and retired identifiers are absent from its XML. Historical scores and status text were preserved by hash verification of the evaluation records, not by running their tests again.
