# TSST-CREATIVE-SK-028 — Responsive & Adaptive SaaS Layouts


Status: `UNVALIDATED`
Installed: 2026-10-03
Owner: CREATIVE_AG
Scope: Product UI/UX for the Systronic CRM MVP and future enterprise SaaS interfaces.


## Objective
Create scalable layouts and component behavior across desktop, laptop, tablet and mobile without shrinking desktop UI mechanically.


## Trigger
Use for CRM shell, tables, record details, pipeline, reports and forms across viewport sizes.


## Sources
- https://www.figma.com/blog/design-systems-102-how-to-build-your-design-system/
- https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma
- https://atlassian.design/get-started/about-atlassian-design-system


## Workflow
1. Define content priority before breakpoints.
2. Specify behavior changes per component, not just width changes.
3. Create responsive tokens for spacing/type/density where useful.
4. Decide when sidebars collapse, tables transform, panels stack and actions move.
5. Design mobile task flows around highest-value actions.
6. Test orientation, zoom and narrow-width overflow.


## Output contract
Responsive behavior matrix; breakpoint guidance; mobile IA; component reflow rules; overflow policy.


## Guardrails
- No desktop squeezed into phone.
- Do not hide critical actions on mobile without an alternative.
- Avoid breakpoint proliferation; use content-driven behavior.
- Respect touch target and text scaling requirements.


## Practical evaluation
Design the same four core CRM tasks at 360px, tablet and desktop; task priority and context must remain intact.


## Validation rule
Installation is not validation. Keep this skill `UNVALIDATED` until CREATIVE_AG produces evidence on the CRM MVP and TSST Lead accepts the evaluation result.