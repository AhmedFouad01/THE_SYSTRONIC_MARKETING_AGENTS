# CRM-U06 — Shell and navigation on kit
Agent: tsst-dev / DEV_AG; Runtime/model: Codex / gpt-6.1-sol high; readiness NOT_READY.
Commit: 19080fc605f73f3c8b819a8d51d9fbcf72d66512 (feat/crm-ui-migration).
Deliverable: CRM_APP/app/src/ui/shell/{AppShell,WorkspaceSwitcher}.tsx, shell/styles.ts, ui/tokens/tailwind.css; App.tsx announcement class only.
Implementation: shared logical token utilities replace shell.css import; RAC nav disclosure/More/workspace option buttons preserve native refs, selectors and current/expanded semantics.
Contract: navigation.ts/disclosures.ts, permission gates/aliases, switch request/abort/error logic, session/draft clearing and App scope keys unchanged.
Checks: fresh lint PASS (353 files); typecheck PASS; test:unit PASS (60 files / 625 tests); build PASS (1516 modules); diff check PASS.
Done_when: 161 fixture browser assertions PASS: AR/EN × light/dark desktop/mobile, gates, aliases, persisted groups, active pipeline, More focus return, workspace scope remount/clear and disconnect.
Geometry/visual QA: desktop 228px sidebar; mobile bar full viewport width at bottom; settled More sheet within viewport; screenshots inspected; zero browser page errors.
Deviations: restored missing spacing-zero bridge token; explicit zero border resets retain no-Preflight side borders; App live announcement retains sr-only utility after shell import removal.
Risks/blocks: none; existing >500 kB build warning; tenant checks use fixtures + existing session unit tests; no UI suite/DB/deploy; final visual acceptance pending.
Skills used: TSST-DEV-SK-005 shell/workspace contract preservation; TSST-DEV-SK-011 existing navigation/session regressions + fixture browser assertions; TSST-DEV-SK-015 fresh current-version checks.
Skills skipped: none. skill_friction: none. Next: CRM-U07 B7 sign-in; fresh generated tsst-dev context recommended.
