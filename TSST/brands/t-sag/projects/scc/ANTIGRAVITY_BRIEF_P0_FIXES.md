# Antigravity follow-up — SCC Phase 0 fixes · 2026-10-07

> **للتشغيل:**
> 1. **شغّل Docker Desktop الأول** واستنى لحد ما يقول إنه شغال. من غيره اختبارات قاعدة البيانات مش هتشتغل تاني.
> 2. في Antigravity: **نفس المحادثة بتاعة المرحلة 0** (عشان فاكر الشغل)، نفس الموديل.
> 3. الصق اللي تحت "PROMPT".
>
> المصدر: مراجعة DEV `reviews/P0_REVIEW_c13e9e9.md`، والحكم: مقبول بشرط التصليحات.

## PROMPT
```
Thanks. A code review of commit c13e9e9 accepted the design but found issues. Fix them on the same branch fix/scc-phase0-keys, as NEW commits (do not amend). Docker Desktop is now running.

BLOCKING
1. Callers not updated: the SDK now requires trustedLicenseKeys/trustedUpdateKeys, but these still omit them:
   tests/e2e/milestones.test.ts:45, tests/security/security.test.ts:71 and :77, examples/client-simulator/index.ts:12.
   - Tests: add a helper that reads `${SCC_KEYS_DIR}/license.public.json` and `update.public.json` (with kid) and pass them in.
   - Simulator: read the public key files from env/file paths.
   - These files are outside the `tsc -b` project references, so typecheck missed it. Make typecheck cover tests/ and examples/ (tsconfig reference or a separate `tsc --noEmit -p` step in `npm run typecheck`).

IMPORTANT
2. Startup check: add `export async function assertKeysReady()` in apps/api/src/signing.ts that loads both key pairs; call it before the server starts listening (API entry / buildServer) and in the worker entry if it signs. In production it must throw when key files are missing. Today the check only happens on the first licence issue or release creation.
3. No silent regeneration: in loadOrGenerate (signing.ts ~L43) generate ONLY when both files are missing (ENOENT). Any other error (corrupt JSON, permission, one file missing) must throw with the file name (never key content). After loading, verify the private and public `x` match and recompute the kid from the public key.
4. Missing/weak tests:
   a. Restart: write keys to a temp SCC_KEYS_DIR, load, sign a licence grant, `vi.resetModules()`, re-import and reload; assert same kid AND the grant verifies through SystronicClient.validateLicense with an offline store.
   b. Update offer: (i) offer signed with an attacker key + attacker kid → `unknown_key_id`; (ii) offer signed with an attacker key but carrying the legitimate kid → signature rejected; (iii) a valid offer signed with the pinned key → accepted.
   c. Production with key files missing → assertKeysReady throws.
   d. Config with JWT_SECRET or DATABASE_URL absent in production → throws.
   e. seed refuses NODE_ENV=production.
5. Full verification with Postgres: from systronic-control-center/ run `docker compose up -d postgres`, `npm run db:migrate`, then `npm run typecheck`, `npm run lint`, `npm test` (all suites: unit, integration, e2e, security, ui). Fix what fails. Then `docker compose stop` (keep the volume).

HOUSEKEEPING
6. .gitignore: add `keys/` and `*.private.json`.
7. Revert the unrelated devDependency version bumps in package.json and package-lock.json (typescript, tsx, @types/node) back to the base branch versions.
8. Runbook (docs/runbooks/LOCAL_DEVELOPMENT.md): existing releases signed with the old ephemeral keys will fail verification; re-create releases after the key change.

RULES (same as before): only these fixes; no push, no merge, no PR; no secrets or keys in code, logs, commits or the report; do not run global installs or change anything outside this repository (last time you ran `npm install -g npm@latest`: please don't).

REPORT (plain Egyptian Arabic; file names/commands in English)
1. Fix by fix: what you changed (one line each).
2. Commands + pass/fail summary lines, with the test count per suite (unit, integration, e2e, security, ui).
3. Anything not done or not verified, and why.
4. git log --oneline fix/scc-phase0-keys (all commits since 4af003c).
```
