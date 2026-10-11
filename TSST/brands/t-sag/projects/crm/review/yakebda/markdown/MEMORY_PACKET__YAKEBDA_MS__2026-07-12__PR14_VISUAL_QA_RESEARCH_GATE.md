YAKEBDA MS — PR #14 Visual QA Research Gate


Project Key: YAKEBDA_MS
Date: 2026-07-12
Status: Active Development / PR #14 Draft / Visual QA not accepted


Confirmed baseline
- main contains merged PR #13 at 732d862a7ee086c2f2b73b75f3cc6e8a89a19c96.
- PR #13 Runtime Reliability is merged and closed.
- API tests: 95/95.
- Admin production build: Passed.
- npm audit after dependency upgrades: 0 vulnerabilities.


PR #14
- Branch: audit/dependency-ui-legacy-cleanup.
- Confirmed head after Shift Dialog: dc2bbeb67de76c3ccdb1dcc127dd691b572bdc99.
- CI run #131: Success.
- Contrast / Cart Drawer patch scaffold commit: 4592c2ccfa569a6fa0b886098726d33882888c43.
- PR remains Draft and must not be merged yet.


Completed
- Secure SheetJS 0.20.3.
- Vite 8.1.4, plugin-react 6.0.3, Vitest 4.1.0.
- Removed embedded Item Manager and offers placeholder from POS.
- Removed dead OptionPicker / ProductEditor flows.
- Unified AppShell icons with SVG and added Not Found route.
- Replaced shift window.prompt with validated in-app modal; manual smoke test passed.


Not accepted / still open
- Global contrast and color hierarchy remain inconsistent.
- Classic browser-like buttons, inputs, selects and checkboxes remain across screens.
- KDS status/timer/action colors need a consistent semantic system.
- Order Detail mobile readability is poor.
- Settings permissions UI is low-contrast and visually unfinished.
- Menu editing buttons are inconsistent.
- Mobile POS toolbar and cart trigger layout are not accepted.
- Cart Drawer is still under QA and not confirmed final.


Next approved action
Research current UI/UX color organization and accessibility guidance from authoritative sources, then define a role-based color system and reusable component states before further CSS changes.


Merge gate
Do not mark PR #14 Ready until research is reviewed, visual fixes are accepted on desktop and mobile, npm audit is 0, 95/95 tests pass, admin build passes, diff check is clean, and CI succeeds on the final head.
