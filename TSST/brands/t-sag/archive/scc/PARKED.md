# SCC — PARKED · 2026-10-07

Ahmed parked SCC after the first local run. He said the dashboard looks bad: «شكله قذر … ارميه دلوقتي». Nothing was deleted.

State at park:
- Repo AhmedFouad01/systronic-control-center: PRIVATE; `main` @ 3b1d0d4 is the default branch; CI is green; the app is at the repo root. Old branches are kept.
- Local clone: C:\dev\systronic-control-center. Local login: `.local/LOCAL_LOGIN.txt` (gitignored).
- Evidence: reviews/ (P0, MVP review, MVP demo log 16/16 PASS).

Open issues to handle before resuming:
1. UI: needs a real design pass with the studio team (tsst-creative), not a patch. The login page is still English and asks for a tenant ID.
2. Local run: simulators logged "sent heartbeat", but installations/devices last_seen_at stayed NULL, so both showed RED. The cause has not been diagnosed. The DEV demo passed with its own script, so compare its setup with `npm run dev`.
3. The API resolves SCC_KEYS_DIR relative to apps/api (it generated new keys on `npm run dev`). Resolve it from the repo root before any deploy.
4. Not done: VPS deploy, YAKEBDA connection (its memory roots must be reconciled first), and GlitchTip / MeshCentral / Velopack.
