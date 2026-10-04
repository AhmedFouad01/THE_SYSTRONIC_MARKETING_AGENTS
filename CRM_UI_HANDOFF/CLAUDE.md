# Systronic CRM — Claude Implementation Contract


## Authority
Read every document under docs/ui-system/ before changing frontend code.
The canonical UI/UX sources are:
- UI Design System: MagicPath component 457127428263931904, revision 457288478946893824.
- CRM MVP Shared Architecture: MagicPath component 457264765073510400, revision 457288463620911104.
- MagicPath project: https://www.magicpath.ai/files/457118534846255104


Do not redesign approved UI patterns silently.


## Required working method
1. Audit existing frontend code before implementation.
2. Reuse canonical tokens/components before introducing new patterns.
3. Separate production code into theme, tokens, icons, primitives, shell, data-grid, i18n, and feature modules.
4. Do not copy the prototype as one giant source file into production.
5. Preserve backend/business rules; UI migration must not reinvent calculations or domain logic.
6. Before a broad implementation, produce an affected-file map and migration plan.


## UI rules
- Visual direction: Clean, Formal, Minimal, Premium, Organized, Aligned, Systematic, Obvious.
- Light and Dark are first-class modes.
- English typography: Inter.
- Arabic typography: Cairo, Alexandria, IBM Plex Sans Arabic.
- English LTR and Arabic RTL are first-class.
- Components consume semantic tokens; feature screens must not hard-code semantic colors.
- Do not use decorative colored top/side strokes as the default status-card treatment.
- Brand Navy/Magenta are emphasis colors, not status colors.
- Create, Success, Warning and Danger keep independent semantic roles.
- Fake interactive controls are forbidden. Wire them or render them disabled.
- Bidirectional-sensitive values such as money, percentages and IDs must remain stable in RTL.


## Production target architecture
src/ui/
  theme/
  tokens/
  icons/
  primitives/
  shell/
  data-grid/
  i18n/


src/features/
  leads/
  contacts/
  deals/
  pipeline/
  tasks/
  dashboard/
  reporting/


## Acceptance
Every implemented screen must pass:
- canonical token compliance
- Light/Dark parity
- English/Arabic parity
- LTR/RTL behavior
- keyboard operation
- visible focus
- responsive behavior
- semantic HTML/accessibility
- loading/empty/error/disabled states where applicable
- regression checks
- no fake active controls


See docs/ui-system/ACCEPTANCE_GATES.md for detailed gates.