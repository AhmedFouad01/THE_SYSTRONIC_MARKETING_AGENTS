# BRIEF — Track C: auth B4 + B5 (Codex)

Moved from Claude to Codex on 2026-10-07 because Claude's weekly usage hit 94%. **Order: CRM-AUTH-B4, then CRM-AUTH-B5.** There is no bus gating, so claim them in that order.

## Where
- **Worktree:** `C:\Work\tsst-crm-mvp`, branch `feat/crm-mvp-ui`. Do not create a new branch.
- **Current state:** HEAD is `91706c1` (auth B3). Claude's agents have stopped; this worktree is yours.
- **Spec:** `CRM_APP/AUTH_PLAN.md` (branch-only), the B4 and B5 rows in its increment table, plus §5 (B0) and the "B3 results" section. D1–D5 are decided. TOTP/B6 is deferred and the `mfa_required` flag stays OFF.
- **One commit per increment:** `feat(crm): auth B4 — …` and `feat(crm): auth B5 — …`. Never push or merge.

## Handoff from B3 (Claude tsst-dev)
- **Sign-up:** `disableSignUp: true`. B4 adds the invite gate. Settle U6 with a 5-case test: no id, another email's id, valid, expired, replay. Then flip sign-up on behind `databaseHooks.user.create.before`, or use the invite accept path.
- **Allow-list:** endpoints are allow-listed in `src/auth/ba.ts` (the `ALLOW` map, with allowed body keys per endpoint). Extend it for each new endpoint.
- **Organization plugin:** not loaded yet. B4 needs it, with `creatorRole: "manager"`, the role allow-list {manager, rep, reader} and the existing DB CHECKs.
- **Routes:** `/v1/invites*` and `/v1/users*` are our routes behind `crm.can_action`. B2 added the `user.read`, `user.invite` and `user.manage` permissions for managers.
- **Bootstrap script (B4):** `scripts/create-tenant-admin.ts`. It creates the org and the first manager by SQL, using the same shape as the auth-b3 test seeds: `auth."user"`; `auth.account` (providerId `credential`, accountId = user id, password = A1 hash); `auth.member`. The projection trigger creates `crm.membership`. The script **must call `crm.seed_system_properties` for every new tenant**.
- **Error mapping:** SQLSTATE 23514 maps through `faultFromDbError`: last manager gives 409 `LAST_MANAGER_REQUIRED`. Add new codes to `src/auth/errors.ts` with AR/EN text.
- **B5 (D4a):** the reset flow uses a stub mailer and a copy-link shown to the manager. Reset-by-email stays OFF until SES exists. Void older reset tokens ourselves (U11). Never delete `verification` rows by `value=userId` alone. Put token links in the fragment, never in the query string.
- **Test cleanup:** tests that create committed tenants must clean up in `after()` (see `auth-b3.test.ts`: one transaction with `session_replication_role=replica`). Otherwise the lane DB breaks the protected-key and p1b tests.
- **AUTH_DATABASE_URL:** the auth tests provision it themselves (they set a random `crm_auth` password). It is not in `.env`.

## Rules
- Never read, print, `cat` or `wc` `.env`/`local-fixture.json`. Port 4317 is the user's.
- **DB isolation:** use database `crm_lane_auth` only.
  - Reuse the wrapper `C:\Work\lane-auth-b2\run.mjs`. It swaps only the DB name.
  - For focused runs, use `npm exec -- tsx`.
  - Never migrate the default DB.
- **Checks:** lint, typecheck, test:unit, build, test:db (full, on the lane DB) and test:bootstrap. No UI suite, no manual smoke.
- **No new dependency.** The organization plugin ships inside better-auth 1.7.7.
- **If a check fails twice:** commit WIP as `wip(crm): auth B4 …`, then `bus block` with one question.

## Report: `TSST/brands/t-sag/projects/crm/codex/reports/<ID>.md` (≤ 25 lines)
Include the commit, the files, each check with its counts, done_when evidence, deviations, "what the next increment must know", and `Skills used:`. Then run `bus done`.
