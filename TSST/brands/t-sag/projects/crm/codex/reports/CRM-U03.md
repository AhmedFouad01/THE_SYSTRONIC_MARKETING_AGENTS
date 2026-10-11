# CRM-U03 — shared choices
Agent: DEV_AG / tsst-dev; runtime Codex gpt-6.1-sol (CODE/high); readiness NOT_READY.
Commit: eed3b102ff0c3a07e05ba20cb3d95faec2e54bf2.
Changed: RAC Select/Tabs, new Checkbox/ComboBox; token utilities and native value/onChange compatibility.
C fresh: lint 352 files clean; typecheck pass; test:unit 60 files / 625 tests pass; build pass.
Build: CSS 81.51 kB; JS 1083.38 kB; expected RAC collection growth; >500 kB warning remains.
done_when: 26/26 bounded Playwright checks pass for AR/EN tab arrows/Home/End, disabled skip, select value/Escape/focus, checkbox Space/indeterminate/disabled, combo filtering/selection.
Evidence: empty string All→Alpha roundtrips on both choices; exact accessible name remains stable; dark mode exercised.
Deviation: RAC SSR leaves tabs tabindex=-1 before client focus initialization; markup assertion adapted, pure keyboard tests retained and browser behavior verified.
Remaining: full visual acceptance and UI suite deferred per brief; old select CSS retained for DatePicker until its increment.
Skills used: TSST-DEV-SK-005 (consumer contract); TSST-DEV-SK-011 (regression + browser fixture); TSST-DEV-SK-015 (fresh C/evidence gate).
Skills skipped: none. skill_friction: none. Next: CRM-U04.
