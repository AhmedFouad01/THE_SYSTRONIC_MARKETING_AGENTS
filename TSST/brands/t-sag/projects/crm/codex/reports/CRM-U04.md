# CRM-U04 — overlay focus ownership
Agent: DEV_AG / tsst-dev; runtime Codex gpt-6.1-sol (CODE/high); readiness NOT_READY.
Commit: d6bd5e4b2962f387dc877ad2a6902af9f4844118.
Changed: RAC Modal/Dialog/Menu/Popover owns containment, scroll locking and nested dismissal; explicit initial/return refs retained; toast close uses kit.
C fresh: lint 352 files clean; typecheck pass; test:unit 60 files / 625 tests pass; build pass.
Build: CSS 81.84 kB; JS 1098.58 kB; existing >500 kB warning remains.
done_when: 42/42 bounded Playwright assertions pass: modal naming/initial/trap/return/scroll, nested Select/dialog Escape, menu keys/action/return, non-modal popover close/return.
Evidence: persistent error >8.5s, success dismissed after 5s; AR/EN dark 375x812 sheet/side contained after normal animation, no overflow.
Deviation: RAC modal portals have no SSR markup; assertion reflects portal mounting; browser checks retain former role/name semantics.
Remaining: original side-sheet/toast CSS retained for placement/preview coexistence until later migration and U20 visual acceptance; full UI/DB suite not run.
Skills used: TSST-DEV-SK-005 (wrapper consumer contracts); TSST-DEV-SK-011 (regression + browser fixture); TSST-DEV-SK-015 (fresh C/evidence gate).
Skills skipped: none. skill_friction: none. Next: CRM-U05; context-heavy handoff; fixtures removed and port 4318 server stopped.
