# TSST-CREATIVE-SK-002 Evaluation — Brand Guidelines Engineering

Status: `PASS`  
Skill status: `LAB_VALIDATED`

## Task

Given a fictional approved brand specification and asset manifest, create `BRAND.md` and `AGENT_GUIDE.md` that a human and an agent can use consistently.

## Required deliverables

- canonical repository map and precedence;
- complete brand and agent guidance;
- token/asset links rather than duplicated values;
- deterministic asset-selection and escalation rules;
- version/change metadata;
- three prompt-based ambiguity tests.

## Test conditions

The fixture contains dark/light assets, a deprecated token, one ambiguous rule, and an unauthorized reference repository. A blind reviewer must correctly handle all four.

## Evaluation emphasis

Score discoverability, ambiguity resistance, one-source-of-truth behavior, explicit constraints, and blind-review reproducibility.

## Automatic failures

Copying the reference brand; conflicting canonical values; missing version/owner; or guidance that requires unstated author knowledge.

## Evaluation record

Evaluation ID: `TSST-CREATIVE-EV-002`  
Skill ID and skill version: `TSST-CREATIVE-SK-002`, package v0.1  
Agent: CREATIVE_AG — Visual Identity & Creative Agent  
Date: 2026-09-20  
Evaluator: TSST Lead, with an independent blind handoff reviewer  
Input fixture version: `MADAR-FLEET-BRAND-FIXTURE-v1.0`  
Artifact paths:

- `CREATIVE/evaluations/TSST-CREATIVE-EV-002-actual-output.md`
- `CREATIVE/evaluations/TSST-CREATIVE-EV-002-blind-review.md`

### Test brief

Create versioned `BRAND.md` and `AGENT_GUIDE.md` content for the fictional bilingual Madar Fleet brand. The fixture contained approved dark/light logo variants, canonical token and asset-manifest sources, a deprecated token, a conflicting noncanonical urgency note, a rights-restricted photo, missing semantic/chart palettes, and an unauthorized GitHub identity reference. A blind reviewer then had to resolve the four required conditions without access to the author or scorecard.

### Expected output

- A canonical repository map and subject-specific precedence.
- Complete human-readable brand guidance and deterministic agent operating guidance.
- Token and asset references without duplicating canonical values.
- Explicit logo, language, theme, rights, status, chart, and escalation decisions.
- Version, owner, approval, review, and change-control metadata.
- At least three ambiguity tests.
- Correct blind handling of dark/light selection, the deprecated token, the conflicting legacy note, and the unauthorized external reference.

### Actual output

The candidate produced complete `BRAND.md` and `AGENT_GUIDE.md` content with a canonical map, subject-specific precedence, deterministic condition-to-action tables, token and asset references, bilingual RTL/LTR behavior, rights controls, QA checklists, escalation ownership, version/change controls, examples, and six ambiguity tests. It did not copy the reference identity or duplicate canonical token values.

The independent reviewer correctly handled all four required cases without author intervention:

1. Selected `madar-lockup-dark.svg`, dark-theme token roles, Arabic RTL/English LTR behavior, and no logo mirroring or recoloring.
2. Rejected `color.brand.primary` for new work, directed migration to `color.brand.core`, and preserved coordinated compatibility until approved v2.0 removal.
3. Rejected the noncanonical bright-green urgency rule, required an explicit state label, allowed only an approved non-color cue, and escalated a new semantic treatment.
4. Rejected GitHub identity imitation, Mona Sans, GitHub-like dark styling, and contribution-grid textures; returned the work to Madar tokens, typography, assets, attributes, and the required 16:9 deck format.

### Category scores and evidence

| Category | Score | Evidence |
| --- | ---: | --- |
| Objective and scope fit | 10/10 | Delivered only the requested brand-guideline system and tests; no campaign or final creative was produced. |
| Evidence and source fidelity | 18/20 | Canonical ownership and precedence were explicit, values were not duplicated, and reference/legacy sources were bounded. The actual token and manifest files were not included or integrity-bound in the handoff package. |
| Method application | 20/20 | Applied the full workflow: canonical map, retrieval order, subject precedence, condition-to-action logic, QA, escalation, and change protocol. |
| Output contract | 15/15 | Both required documents and all required sections, metadata, links, and tests were present. |
| Guardrails and risk control | 15/15 | Protected logo integrity, asset rights, language parity, accessibility claims, token lifecycle, and reference-brand boundaries. |
| Quality assurance | 8/10 | Six author tests and an independent four-scenario blind review were completed. No machine validation of linked token/manifest schemas, versions, or availability occurred. |
| Repeatability and handoff clarity | 8/10 | The reviewer reproduced all required policy decisions without author help. Full package-only execution remains dependent on external canonical files and unresolved approved component/layout details. |

Critical failures: none  
Total score: **94/100**  
Result: **PASS**  
Recommended validation state: **`LAB_VALIDATED`**  
Source freshness checked: Fixture versions and dates were checked inside the submitted guidance; no live external-source or production-repository verification was performed.

### Exact weaknesses

1. `tokens/brand.tokens.json`, `assets/manifest.yml`, and `strategy/positioning.md` were referenced but not included or cryptographically/version-integrity bound to the handoff. A package-only consumer can choose the correct roles but cannot retrieve actual values or verify current asset approval.
2. Version freshness, token schema validity, manifest schema validity, and broken-link behavior are manual checks; no automated stale-version, hash, or schema gate was demonstrated.
3. No approved icon/component inventory identifies an available non-color urgency cue. The safe text-label fallback is deterministic, but richer execution requires approval.
4. Exact deck grid, type scale, and safe-area rules remain intentionally undefined. The guide correctly stops or constrains work, but it cannot generate a fully specified deck without the missing canonical decisions.
5. The test was synthetic. It included no live repository retrieval, rendered output, production deployment, accessibility audit, Legal review, or actual end-user/human-team use.

### Recommended remediation

- Bundle or immutably bind the applicable canonical token, manifest, and strategy versions in the next test while retaining one-source-of-truth references.
- Add automated schema, link, version, and stale-dependency checks, including explicit missing/corrupt-file failure tests.
- Define or inventory approved non-color status components and document their asset/rights state.
- Add approved deck layout/type rules only through the named governance process, then test them in a real 16:9 export.
- Run a bounded pilot with real files, asset retrieval, bilingual rendering, accessibility evidence, and Brand Operations/Legal sign-off before considering `PILOT_VALIDATED`.

Retest ID: not required for the lab pass; use `TSST-PILOT-001` for the recommended real-world pilot.

The skill is not `PILOT_VALIDATED` or `PRODUCTION_VALIDATED`; there is no real-world execution evidence.
