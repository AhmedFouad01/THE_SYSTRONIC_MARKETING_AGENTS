# DASH-AG-001 — currency per plan (EGP / USD) — Antigravity request

ROLE B (external tool via Ahmed, R41): bounded code task, no deploy, no push, no spend, no secrets.
Model: Gemini 4 Argon, effort Medium. Cost rules R52: read only the files named here; reply in 3 lines.

## Where
Folder `C:\Work\tsst-portal-ag`, branch `dash-currency` (its own worktree). Work and commit ONLY there.
Never touch `C:\Work\tsst-portal`, `C:\Work\tsst-portal-web` (Codex works there) or any client folder.

## Task (X3 S3.1)
A plan has a currency: `EGP` or `USD` (default `EGP`; existing plans stay EGP).
1. New migration `migrations/009_currency.sql` (number 009 is reserved for you; never edit 001–004):
   `portal.plans.currency text NOT NULL DEFAULT 'EGP' CHECK (currency IN ('EGP','USD'))`.
2. Backend: `Plan.currency`, package cards and payments use the plan's currency; `POST/PATCH /api/v1/settings/plans`
   accept `currency`; reports `billing` gets one row per brand per currency, and nothing ever sums EGP with USD.
   Files: `src/service/dash/packages.ts`, `src/service/dash/reports.ts`, `src/service/dash/types.ts`,
   `src/server/v1/owner.ts`, tests in `tests/` (add `tests/v1-currency.test.ts`).
3. Front end: `web/src/api/types.ts` (currency on Plan / Payment / billing), Packages & billing screen: a currency
   choice in the plan form (HeroUI segmented control EGP | USD, rule R51: not a filled button), money shown with the
   right symbol everywhere it appears (`Intl.NumberFormat`, "EGP 15,000" / "$1,200"). No native controls (R39, R50).

## Checks before the reply
Root: `npm run typecheck`, `npm run lint`, `npx vitest run tests/v1-currency.test.ts tests/v1-packages.test.ts`.
`web/`: `npm run typecheck`, `VITE_API=live npm run build`. One commit on `dash-currency`.

## Reply (3 lines)
What changed · checks pass / fail · contract changes (for the Lead to write into DASH-API).
