# TSST-CREATIVE-SK-027 — Accessible Interaction & WCAG 2.2


Status: `UNVALIDATED`
Installed: 2026-10-03
Owner: CREATIVE_AG
Scope: Product UI/UX for the Systronic CRM MVP and future enterprise SaaS interfaces.


## Objective
Embed accessibility in interaction design, including keyboard operation, focus visibility, target sizing, names/roles/states and predictable behavior.


## Trigger
Use for every interactive component and screen before high-fidelity approval.


## Sources
- https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
- https://www.w3.org/WAI/ARIA/apg/practices/
- https://www.radix-ui.com/primitives/docs/overview/accessibility


## Workflow
1. Set WCAG 2.2 AA as the default product baseline unless a different approved requirement applies.
2. Audit keyboard-only navigation and logical focus order.
3. Specify visible focus and overlay focus return.
4. Check contrast and non-color status cues.
5. Check target sizes, spacing, zoom and responsive behavior.
6. Provide accessible names for icon-only controls.
7. Use semantic HTML first; ARIA only when needed.
8. Document component-level accessibility acceptance.


## Output contract
Accessibility annotations; keyboard map; focus states; contrast/target checks; component acceptance checklist.


## Guardrails
- No hover-only action.
- No hidden focus.
- No inaccessible custom control when native element works.
- ARIA does not compensate for incorrect interaction design.


## Practical evaluation
Keyboard-only completion of core MVP flows plus WCAG 2.2 AA review of representative screens; blocker issues must be fixed before UI sign-off.


## Validation rule
Installation is not validation. Keep this skill `UNVALIDATED` until CREATIVE_AG produces evidence on the CRM MVP and TSST Lead accepts the evaluation result.