# CRM-U05 — DatePicker/Badge/States/PageHeader
Agent: tsst-dev / DEV_AG; Runtime/model: Codex / gpt-6.1-sol high; readiness NOT_READY.
Commit: 56fa9d2a2fcdd892c189a4c2b534f164d0bbdaa3 (feat/crm-ui-migration).
Deliverable: CRM_APP/app/src/ui/primitives/{DatePicker,Badge,States,PageHeader}.tsx; ui/tokens/tailwind.css.
Contract: RAC Calendar + modal Popover keep Gregorian local ISO/event shape, time selections, hooks and descriptions; no API changes/dependencies added.
Styles: logical token utilities, bidi status text, static state semantics, responsive header and motion-safe loading pulse; legacy CSS imports removed.
Checks: fresh lint PASS (352 files); typecheck PASS; test:unit PASS (60 files / 625 tests); build PASS (1516 modules).
Done_when: ISO roundtrip tests and 121 isolated browser QA assertions PASS: AR/EN × light/dark, desktop/mobile, keyboard/calendar, focus return, fields, static states/header and reduced motion.
Evidence: Chromium harness zero page errors; screenshots inspected; final typography/focus changes rechecked in all four locale/theme combinations; temporary harness removed.
Deviations: optional readOnly support added; native render preserves invalid/description attrs; limited important typography utilities preserve retained global base rules.
Risks/blocks: none; existing >500 kB build warning; no UI suite/DB/deploy; Ahmed visual acceptance remains pending.
Skills used: TSST-DEV-SK-005 contract preservation; TSST-DEV-SK-011 existing regression suites + independent browser assertions; TSST-DEV-SK-015 fresh exact-version verification.
Skills skipped: none. skill_friction: none. Next: CRM-U06 shell/nav on kit.
