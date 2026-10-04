# TSST-CREATIVE-SK-025 — Forms, Validation & Error Recovery


Status: `UNVALIDATED`
Installed: 2026-10-03
Owner: CREATIVE_AG
Scope: Product UI/UX for the Systronic CRM MVP and future enterprise SaaS interfaces.


## Objective
Design CRM forms that prevent errors, explain failures clearly and preserve user work during correction.


## Trigger
Use for lead/contact/deal/task forms, filters, imports, settings, authentication and any transactional input.


## Sources
- https://design-system.service.gov.uk/components/error-message/
- https://design-system.service.gov.uk/patterns/validation/
- https://www.nngroup.com/articles/ten-usability-heuristics/


## Workflow
1. Reduce fields to task-essential inputs.
2. Group related fields and use sensible defaults.
3. Place labels/hints consistently and explicitly mark optionality.
4. Validate at the right time; prevent impossible states before submission.
5. Show field-level errors plus summary for multi-error forms.
6. Preserve entered values after errors.
7. Write recovery messages that state what happened and how to fix it.


## Output contract
Form anatomy; validation timing; error-state copy; save/cancel behavior; dirty-state handling; success/undo rules.


## Guardrails
- Never clear user input after validation failure.
- Do not use generic invalid-input messages.
- Do not rely on color alone.
- Do not use destructive defaults or surprise auto-submit.


## Practical evaluation
Redesign Add Lead, Edit Deal and Task-link forms with 8 adversarial error cases; users must recover without data loss.


## Validation rule
Installation is not validation. Keep this skill `UNVALIDATED` until CREATIVE_AG produces evidence on the CRM MVP and TSST Lead accepts the evaluation result.