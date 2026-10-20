# DASH-AG-003 — finish S1.2: client page = direction B on live data — Antigravity request

ROLE B (external tool via Ahmed, R41): bounded code task, no deploy, no push, no spend, no secrets.
Model: Gemini 4 Argon, effort Medium. Cost rules R52: read only what the task needs; reply in 3 lines.

## Where
Folder `C:\Work\tsst-portal-ag`, branch `dash-jobs` (it now holds everything: PIN, Clients/Workspace, your Edit job +
Archive, your currency work, and Codex's unfinished S1.2 start, commit ed513de). Work and commit ONLY there.

## Start from Codex's partial work (do not redo it)
Already started (uncommitted by Codex, now saved): `web/src/pages/client/ClientSummary.tsx`, `web/src/pages/client/workspace.ts`,
`web/src/components/ClientLogo.tsx`, `web/src/copy/client.ts`, edits in `App.tsx`, `PinGate.tsx`, `settings/Clients.tsx`,
`styles/branding.css`. Run `git show ed513de --stat`, read those files, then finish.

## Task
Spec: `C:\Work\tsst-portal\docs\DASH-CODEX.md` — read only "Cost rules" and the S1.2 bullet in "X3 sprints".
The approved look is the prototype in `web/src/pages/client/design/` (direction B after Steps 1b–1d).
1. The real `/client` and `/client/job` use direction B on live data: header (brand profile from Settings → Clients:
   logo, name, industry, header colour), package + period + usage rings, active jobs, items for review with thumbnails,
   milestone map with the pulse, preview modal, footer text from Workspace. Show `client_description` (your S2.1)
   under job titles. Money via the plan currency (your S3.1).
2. "Period start" dot = same colour as other done dots; less empty space above the milestone line.
3. PIN entry = 6 boxes (HeroUI InputOTP), no repeated helper sentence. No logo = the client's first letter, never an
   empty white square. In Settings → Clients, "Hex colour" sits on the same line as "Choose colour".
4. Remove the design-preview toolbar and prototype-only code from the live build (`VITE_API=live` must not include it).
Rules R39, R49, R50, R51 (`C:/Work/TSST/TSST/core/rules.md`).

## Checks before the reply
Root: `npm run typecheck`, `npm run lint`, `npx vitest run tests/v1-client-view.test.ts tests/v1-client-pin.test.ts tests/v1-branding.test.ts`.
`web/`: `npm run typecheck`, `VITE_API=live npm run build`. One commit on `dash-jobs`. Four screenshots max in
`web/qa/X3/S1.2/`: client home 1536 and 390, light and dark.

## Reply (3 lines)
What changed · checks pass / fail · contract changes (if any).
