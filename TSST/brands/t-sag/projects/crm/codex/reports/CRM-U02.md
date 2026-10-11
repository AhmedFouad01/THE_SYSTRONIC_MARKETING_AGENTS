# CRM-U02 — locale and form adapters
Agent: DEV_AG / tsst-dev; runtime: Codex gpt-6.1-sol (CODE/high); readiness NOT_READY.
Commit: 4f8db268c6207fc50ab140c0631cf31e67c18ac7; completed existing aab7398 WIP.
Changed: native Button event compatibility, forwarded input refs, title/busy attributes; RAC locale/Input/Button adapters retained.
C fresh: lint 349 files clean; typecheck pass; test:unit 60 files / 625 tests pass; build pass.
Build: CSS 78.70 kB; JS 943.99 kB; existing >500 kB chunk warning remains.
done_when: bounded Playwright fixture 14/14 pass: Enter submit, duplicate loading prevention, refs/error focus/link, mixed email, AR/EN direction, dark/light.
Evidence: final C outputs at current commit; isolated no-DB preview on 4318, temporary fixture removed.
Remaining: full rendered visual acceptance/browser suite deferred per brief; no DB/UI suite run.
Deviation: one completion commit follows existing U02 WIP; selector now matches native disabled attribute rather than utility text.
Skills used: TSST-DEV-SK-005 (preserved native consumer contract); TSST-DEV-SK-011 (regression + bounded browser fixture); TSST-DEV-SK-015 (fresh C/evidence gate).
Skills skipped: none. skill_friction: none. Next: CRM-U03.
