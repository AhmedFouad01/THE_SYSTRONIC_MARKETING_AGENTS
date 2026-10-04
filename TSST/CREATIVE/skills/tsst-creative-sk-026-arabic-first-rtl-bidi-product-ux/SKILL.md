# TSST-CREATIVE-SK-026 — Arabic-First RTL/Bidi Product UX


Status: `UNVALIDATED`
Installed: 2026-10-03
Owner: CREATIVE_AG
Scope: Product UI/UX for the Systronic CRM MVP and future enterprise SaaS interfaces.


## Objective
Design Arabic-first interfaces that correctly handle RTL layout, mixed-direction content, numbers, emails, phone numbers, dates and Latin technical identifiers.


## Trigger
Use for every bilingual/Arabic CRM screen and component.


## Sources
- https://www.w3.org/International/i18n-drafts/techniques/authoring-html.en.html
- https://www.w3.org/International/i18n-drafts/nav/about


## Workflow
1. Treat Arabic as a first-class layout mode, not mirrored afterthought.
2. Define page direction at document level and component exceptions deliberately.
3. Use logical start/end spacing and alignment tokens.
4. Test mixed Arabic/English names, email, URLs, currency, phone and IDs.
5. Specify icon mirroring rules per meaning, not globally.
6. Test tables, charts, forms, drawers and command palette in both directions.


## Output contract
RTL/LTR layout rules; bidi field rules; typography pairing; icon-mirroring matrix; mixed-content test fixtures.


## Guardrails
- Never manually reverse text order.
- Do not mirror all icons blindly.
- Do not force LTR data strings into RTL without isolation.
- Arabic line-height and shaping must be visually inspected.


## Practical evaluation
Render all MVP core screens in Arabic and English with mixed-direction fixtures; zero broken ordering, clipped shaping or ambiguous alignment.


## Validation rule
Installation is not validation. Keep this skill `UNVALIDATED` until CREATIVE_AG produces evidence on the CRM MVP and TSST Lead accepts the evaluation result.