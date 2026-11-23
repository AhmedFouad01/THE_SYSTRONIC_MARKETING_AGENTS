# Evaluation re-run, area 6: Deploy and quality (2026-11-23)

Subject: `/Users/fouad/Work/tsst-portal-s603` at `e758f9a` (`next`, NOT deployed). Live = `main` = `6a28ba3`. Read-only; no suite run, nothing fetched. Every claim below is about `next` unless it says "live".

## 1. Findings of 5 Nov

**"No CI at all": PARTLY. The file exists; whether it runs is not knowable from the repo, and the sprint's own record says it does not run.**
- `git show 6290115:.github/workflows` fails ("not in 6290115"). Now `.github/workflows/ci.yml` (80 lines). It runs on PRs and pushes to main/next: server typecheck + lint + vitest in 2 shards (lines 38-52), web typecheck, `test:api`, `ds:check`, live build, `check-live-build.sh` (lines 62-80).
- Owner's board (`TSST/handoffs/portal/sprint/BOARD.md:27, 39`): the jobs are refused since 2026-11-17 22:54Z ("recent account payments have failed..."). Merges since 2026-11-19 (PRs #68 to #97) went in on "ادمج بالمحلي" local checks (e.g. BOARD:13, 15, 20, 38, 39).
- Meaning for quality: the 30-odd PRs after 11-17 had no automatic gate, no independent machine, no shared record. Their safety rests on one person's local run (BOARD:15: "1419 passed, 9 skipped, 0 failed", not re-run by me, not verified) and on review passes written in the board. CI never exercised `next` as a whole at its current head. On top of that, CI skips web eslint (265 old errors, `ci.yml:4`) and the Playwright suite (`ci.yml:4`).
- Also: branch protection is not available on this plan (BOARD:149), so nothing in GitHub forces CI green even when it works.

**"deploy.sh runs no typecheck or tests": OPEN.** `grep -n -E 'typecheck|vitest|npm (run )?test|lint' scripts/deploy.sh` returns nothing. `git diff 6290115 e758f9a -- scripts/deploy.sh` is empty: the script is byte-identical. Its only quality gate is the web build plus mock/map/inline-script markers (`deploy.sh:74-93`). `check-live-build.sh` (22 lines, new) copies that check for CI; its own header (line 4) admits the two copies must be "kept in step until deploy.sh calls this file". It is a build check, not site monitoring.

**"The page test asserted the same wrong list": FIXED on `next`.** `tests/spa.test.ts:63-76` now reads `web/src/App.tsx` and compares its route paths with `shared/routes.json` (list file introduced after 5 Nov; `git ls-tree 6a28ba3 shared/` shows it is also on live). Newer pages add a spa test line (commit `d82a7d7`, `46db590`). Live `main` already holds this test (`git show 6a28ba3:tests/spa.test.ts | grep -c App.tsx` = 10).

**"Deploy and backup tools made for Windows": OPEN (documented, not fixed).** `git diff 6290115 e758f9a -- scripts/pull-backup.py scripts/deploy.sh` is empty. Windows defaults: `deploy.sh:2, 16, 18` (Git Bash paths); `pull-backup.py:14-17` (Windows target folder and log path), key/host defaults at `pull-backup.py:29-30` and `deploy.sh:17` (a built-in public address: file and line only). RUNBOOK 4 and 7 tell you to pass `TSST_*` and `--target`. BOARD:14 records these as warnings "scripts NOT changed". The nightly backup is outside the repo (RUNBOOK 7: "not verified from the repo").

**"Nobody ever restored from a backup": PARTLY.** BOARD:186 and 90: a restore drill (S1-02) passed on 2026-11-06 (restore, counts, rollback format, migrations 031-033 rehearsed; the drill folder is gone). Migrations 036-038 have NOT been rehearsed on a restored copy: RUNBOOK:136-138 (tests `tests/migrate-036/037/038.test.ts` exist but "are not the rehearsal"), RUNBOOK:205-206 (whether old code runs on schema 036-038 is "not verified"). RUNBOOK section 6 is a fuller, ordered restore, but no nightly-dump format is verified (RUNBOOK:260).

**"No monitoring between deploys": OPEN.** `grep -i -E 'uptime|monitor' docs/RUNBOOK.md` finds no monitoring; section 9 is manual first aid. Post-deploy health asks two URLs (`deploy.sh:143-148`); the "live smoke" of RUNBOOK:185 says "this generic one was not run". Not verified: anything outside the repo.

**"No tags": PARTLY.** `git tag` = 1 tag, `v-before-sprint` → `6290115` (BOARD:185). No tag for the live release `6a28ba3` or earlier deploys.

**"43 merged branches not deleted": WORSE (stale refs, no fetch).** `git branch -r | grep -v HEAD | wc -l` = 119; merged into `origin/main`: 77; merged into `e758f9a`: 105; unmerged: 14.

## 2. Counts (by command)
- Server test files: `find tests -name '*.test.ts' | wc -l` = 140 now (74 at `6290115`; 96 at `6a28ba3`). Test cases: `grep -rhoE '^\s*(it|test)(\.each...)?\(' tests | wc -l` = 1324 (598 at `6290115`).
- Web unit tests (`web/**/*.test.{ts,tsx,mjs}`) = 78 files (33 at `6290115`); `test:api` cases: 460 (grep).
- Browser gates: `find web/qa -name gate.mjs | wc -l` = 20 (0 at `6290115`); 49 QA folders (29 at `6290115`); 84 script files under `web/qa`.
- `next` vs live: `git rev-list --count 6a28ba3..e758f9a` = **327 commits**; `git diff --shortstat` = 326 files, +33,073 / -1,700. Only `src` and `web/src`: 230 files, +13,653 / -1,564. Tests and QA: 87 files, +18,049. Migrations 036, 037, 038 are new (`git diff --name-status ... -- migrations`).

## 3. New problems (introduced by the sprint)
- **High: the next deploy is one very large step.** 327 commits, three schema migrations, about 14,000 changed product lines, never run by CI at its head and not seen on a real server. Migrations are forward-only (`deploy.sh:156` comment). If the health check fails after migrating, the script's rollback runs old code on the new schema (RUNBOOK:173); the restore then loses all data written since the dump.
- **High: hazards of `deploy.sh` confirmed against the script (RUNBOOK 4-6):** portfolio file replaced before the dump, never restored (`deploy.sh:110`); `rm -rf "$R"` of the release folder with no guard that the name is not `current` or `previous` (`:111`); `previous` set to the old current at `:139`, then the auto-rollback at `:158` points `current` to the same release, so `--rollback` afterwards swaps two equal links; no `previous` on a first deploy means the broken release stays linked (`:158-159`); `--rollback` asks `/login` only (`:31`); dump is taken with the app running (`:125-131`). All are documented, none fixed.
- **Medium: gates run on a mock, not the real server.** The 20 `gate.mjs` files are Playwright against the mock web build with the page served from disk by request interception (`web/qa/S6-02/gate.mjs:1-8`). Only `web/qa/live-contract.mjs` hits a real local server, by hand, and is not in CI. The real server and client are joined only by `tests/` and by hand.
- **Medium: no real phone or Safari.** `grep -l -E 'webkit|firefox' web/qa/*/gate.mjs | wc -l` = 0; all 20 use Chromium (default channel "chrome", `gate.mjs:9`); `web/playwright.config.ts:14` and `web/qa/x3.config.ts:13` are `chromium`. 390 px is a Chrome window, not an iPhone. The BOARD has no real-device record (grep: none).
- **Low: process.** Only the three migration unit tests; the rehearsal is a human step recorded as pending (RUNBOOK:136-138).

## 4. Score
**4 of 5 for the code and test base (was 3), but release safety is at 2.5 of 5; overall 3 of 5, the same as on 5 Nov.** Tests and gates grew a lot, the route-list bug is closed with a real test, and the runbook is far better; but CI does not run, `deploy.sh` and the backup tool are untouched, there is no monitoring, and the biggest, least-proven release the product has had is waiting.

## 5. Not looked at
Contents of RUNBOOK 1-3 and 8; the test suite itself (not run); whether the tests assert the right thing beyond `spa.test.ts`; `scripts/checks`, `scripts/wipe`; the server's real state (migrations on production, backups, nightly job); GitHub itself (CI state, branch list was local refs, not fetched); `check-live-build.sh` run results; the CI file's result on any commit.
