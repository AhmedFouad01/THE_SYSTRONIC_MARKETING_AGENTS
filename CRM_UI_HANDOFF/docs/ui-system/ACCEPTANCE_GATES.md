# UI Acceptance Gates


A screen/module is not accepted merely because it renders.


## Gate A — Design system
- uses canonical theme/tokens
- no feature-local semantic color system
- shared AppShell/components reused
- no decorative colored stroke regressions


## Gate B — Interaction
- all visually active controls have real actions
- unfinished actions are explicitly disabled
- focus-visible works
- menus/tabs/dialogs meet their keyboard contracts
- destructive actions are safe


## Gate C — Accessibility
- semantic HTML where appropriate
- accessible names
- aria-invalid/error associations for fields
- aria-sort for sortable table columns
- aria-modal and focus management for modal dialogs
- reduced motion respected


## Gate D — RTL / localization
- English LTR passes
- Arabic RTL passes
- directional icons behave correctly
- bidi-sensitive values remain stable
- Arabic font stack is applied


## Gate E — Responsive
- desktop
- compact desktop/tablet
- tablet
- mobile
- small mobile
- no critical content becomes unreachable


## Gate F — Data workspace
Where applicable:
- search/filter/sort work
- saved views work
- selection and detail context do not conflict
- pagination works
- density and visible columns work
- empty state works


## Gate G — Regression
- Light/Dark parity
- token reconciliation with Design System
- existing approved workflow behavior preserved
- no fake active controls


## Production note
Passing these prototype gates is not a production-readiness/security/deployment claim.