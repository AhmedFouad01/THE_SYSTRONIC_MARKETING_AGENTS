# BRIEF — Track U: UI migration to React Aria + Tailwind (Codex)

ROLE A (TSST team runtime). Spec: `specs/UI_MIGRATION_PLAN.md`. Bus task `CRM-U07` = plan task #7.

- **Worktree:** `C:\Work\tsst-crm-codex`, branch `feat/crm-ui-migration`. It is already checked out from `feat/crm-mvp-ui` 5e65067, so auth B1–B5, nav, import and charts are all in.
- **Order:** strictly U01 → U19. The bus does not gate the tasks; the title shows k/19. Do not wait for the Lead.
- **Task 20 (retire old CSS) is NOT queued.** It waits for Ahmed's visual acceptance.
- **Commits:** one commit per task, `feat(crm): U07 — <goal>`. Never push, merge or rebase.
- **Pins (approved):** react-aria-components 1.21.1, tailwindcss 4.3.3, @tailwindcss/vite 4.3.3. These are exact; no other new dependency.
- **Behaviour:** this is a UI-only swap. Behaviour, API calls and existing tests stay unchanged. Update tests only for selector or markup changes.
- **AR/EN:** Arabic is full RTL and mixed text never breaks. Use logical utilities, dark and light themes, and the `--sy-*` tokens.
- **Checks:** C = lint, typecheck, test:unit, build. No UI suite and no DB, except for B7/B8 server wiring, which follows the plan.
- **One session = at most 4 tasks.** Then `bus release <next> --note "<resume point>"` and stop.
- **Failures (Lead update):** ordinary lint, type or test errors while coding are normal; fix them yourself, up to about 5 attempts. Use `bus block` ONLY for a scope or design question, or for something that is truly stuck after 5 attempts. Never block for a type error you can fix.
- Never read or print `.env` or secrets. Port 4317 is the user's.
- **Report:** `TSST/brands/t-sag/projects/crm/codex/reports/CRM-Uxx.md` (pattern) (≤ 15 lines). Include the commit, the checks with counts, done_when, deviations and `Skills used:`. Then run `bus done`.
