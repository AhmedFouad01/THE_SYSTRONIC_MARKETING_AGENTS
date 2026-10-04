# TSST-CREATIVE-SK-024 — Command Palette & Keyboard-First Productivity


Status: `UNVALIDATED`
Installed: 2026-10-03
Owner: CREATIVE_AG
Scope: Product UI/UX for the Systronic CRM MVP and future enterprise SaaS interfaces.


## Objective
Create optional expert shortcuts, command palette and keyboard flows that accelerate frequent CRM tasks without harming novice usability.


## Trigger
Use for global commands, quick create, navigation, frequent mutations, power-user workflows and searchable actions.


## Sources
- https://attio.com/help/reference/managing-your-data/records/create-and-view-records
- https://attio.com/help/reference/productivity-collaborating/navigating-your-workspace
- https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/
- https://www.radix-ui.com/primitives/docs/components/toolbar


## Workflow
1. List high-frequency commands and navigation targets.
2. Design one global command entry point such as Ctrl/Cmd+K.
3. Group commands by navigation/create/action/search.
4. Make shortcuts discoverable in menus/tooltips.
5. Define predictable focus and keyboard movement.
6. Ensure every shortcut action also has a visible mouse/touch path.


## Output contract
Command taxonomy; palette wireframe; shortcut map; focus rules; discoverability rules; conflict list.


## Guardrails
- Keyboard shortcuts augment, never replace visible UI.
- Avoid browser/OS shortcut conflicts.
- Do not expose unauthorized commands.
- Use user-language verbs, not internal jargon.


## Practical evaluation
Complete create lead, create deal, add task, open contact, change stage and open reports using keyboard-only, with no inaccessible dead ends.


## Validation rule
Installation is not validation. Keep this skill `UNVALIDATED` until CREATIVE_AG produces evidence on the CRM MVP and TSST Lead accepts the evaluation result.