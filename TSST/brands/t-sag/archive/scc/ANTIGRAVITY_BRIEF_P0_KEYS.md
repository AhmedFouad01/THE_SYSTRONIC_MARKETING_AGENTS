# Antigravity brief — SCC Phase 0 (signing keys + default secrets) · 2026-10-07

> **للتشغيل:**
> 1. افتح Antigravity على فولدر الريبو، والريبو لازم يكون متنزّل بـ git، مش ZIP (اقرا التنبيه تحت).
> 2. اختار موديل **Gemini 3.1 Pro (High)**.
> 3. انسخ كل اللي تحت "PROMPT" والصقه.
> 4. لما يخلّص، احفظ تقريره جنب الملف ده باسم `ANTIGRAVITY_P0_REPORT.md`، أو الصقه في الشات. فريق DEV هيراجع التعديلات قبل أي دمج.
>
> **تنبيه:** لو اسم الفولدر `systronic-control-center-feat-scc-m1-m5-implementation`، يبقى غالباً اتنزل ZIP ومفيهوش git، ولا هيعرف يعمل فرع ولا حفظات. نزّله بـ git الأول.
>
> **حوكمة:** Antigravity متقاعد كـ runtime في TSST (ADR-004). هنا بنستخدمه كأداة خارجية بنفس قاعدة Gemini Desktop: اللي يطلّعه "مدخل" مش تسليم نهائي، وDEV لازم يراجعه، والقائد يقبله.

Source of truth for findings: TSST DEV evaluation 2026-10-07 (risks S1–S4) and report https://claude.ai/artifact/QD25wzNdddHGEEpuh63VZW
Exit test (from DEV): restart the API → an existing licence still verifies offline; a tampered update offer with a swapped public key is rejected by the SDK.

## PROMPT
```
You are working in the Systronic Control Center (SCC) repository. The application lives in the nested folder `systronic-control-center/` (run all npm commands from there). Base branch: `feat/scc-m1-m5-implementation`.

GOAL — "Phase 0": make licence and update signing trustworthy and stop the app from running on default secrets. Nothing else.

FIRST
1. Confirm this folder is a git repository (`git status`). If it is NOT, stop immediately and tell me; do not continue.
2. Create a branch `fix/scc-phase0-keys` from `feat/scc-m1-m5-implementation`.
3. Read: README.md, apps/api/src/signing.ts, apps/api/src/config.ts, apps/api/src/routes/change.ts, apps/api/src/routes/commercial.ts, packages/client-sdk/src/index.ts, infrastructure/migrations/001_initial.sql, infrastructure/local/seed.ts, and the existing tests under tests/.
4. Before editing, write me a short plan (files and changes). Then proceed.

PROBLEMS TO FIX (verified by code review)
S3 — Ephemeral signing keys: `apps/api/src/signing.ts` calls generateKeyPair() in memory on every process start (key ids "dev-license-1", "dev-update-1"). After any restart, stored licence grants no longer verify.
S1 — Circular update trust: the update offer (`apps/api/src/routes/change.ts` ~L207-236) carries the artifact, checksum, signature AND the public key, and the SDK verifies with `offer.publicKey` (`packages/client-sdk/src/index.ts` ~L262). Whoever controls the server response can push any code.
S2 — Licence public key is server-delivered: `refreshLicense` / `validateLicense` in the SDK (~L218-235) store and trust the `publicKey` returned by `/device/v1/license` (`commercial.ts` ~L362-381) instead of a key pinned in the product.
S4 — Default secrets: `apps/api/src/config.ts` falls back to a known JWT secret ("development-only-secret-change-me-32-characters") and a DB URL with password "scc_app_dev_password"; the migration and seed contain dev passwords; nothing refuses to start with defaults in production.

REQUIRED CHANGES
1. Persistent keys (S3)
   - Load the licence and update Ed25519 key pairs from files in a directory given by config (e.g. `SCC_KEYS_DIR`).
   - Add a script `npm run keys:generate` that creates the key files once (private keys never printed or logged). On POSIX set file mode 0600; on Windows document in the runbook that the folder must be ACL-restricted to the service account.
   - Development: if keys are missing, generate them once into the dev keys dir and log a warning.
   - Production (`NODE_ENV=production`): refuse to start if the key files are missing. Never auto-generate in production.
   - Key id = stable JWK thumbprint (RFC 7638) of the public key, not a fixed string.
   - Verification must accept a list of trusted public keys (current + previous) so keys can be rotated later; signing uses the current key only.
   - Add the keys directory to .gitignore. Never commit any key material.
2. Pinned keys in the SDK (S1, S2)
   - The SDK takes trusted licence and update public keys (JWK or list of JWKs) as constructor/config input supplied by the product at build/config time.
   - Licence grants and update offers are verified ONLY against those pinned keys, selected by `kid`. Ignore any public key sent by the server for trust purposes (the server may keep sending it for backward compatibility; the SDK must not use it).
   - Unknown `kid` or bad signature → reject with a clear typed error.
   - Keep the offline grace behaviour unchanged.
3. Refuse defaults (S4)
   - In production, config must throw at startup if: JWT_SECRET is missing, equals the known default, or is shorter than 32 bytes; DATABASE_URL is missing or contains "scc_app_dev_password".
   - seed.ts must refuse to run when NODE_ENV=production.
   - Do NOT rewrite the already-applied 001_initial.sql in a way that changes existing databases. If the role password is hardcoded there, add a note to the runbook that production must run `ALTER ROLE ... PASSWORD` with a generated secret at deploy time, and add a startup check as above. A new migration is acceptable only if needed.
   - Update .env.example with the new variables (placeholder values only) and docs/runbooks/LOCAL_DEVELOPMENT.md with the key-generation step.

TESTS (add, all must pass)
   a. Restart: issue a licence grant, reset/re-initialise the signing module (simulate a process restart reading the same key files), the stored grant still verifies, including offline via the SDK.
   b. Tampered update offer: an offer whose embedded publicKey and signature come from an attacker key is rejected by the SDK.
   c. Licence grant signed by an unknown key is rejected.
   d. Production config with the default JWT secret → startup throws; with a strong secret → starts.
   e. Rotation: a grant signed with the previous key still verifies when both keys are trusted.
Then run from `systronic-control-center/`: `npm run typecheck`, `npm run lint`, `npm test`. If Docker/Postgres is not available for integration tests, say exactly which suites you could not run and why. Do not skip or weaken existing tests.

CONSTRAINTS
- Only Phase 0. Do not touch tenancy/RLS, RBAC, the dashboard UI, the worker, the docs restructuring, or anything else.
- Keep the public API routes working; the only behavioural change is the SDK no longer trusting server-sent keys.
- No new dependencies unless unavoidable (jose is already present); justify any you add.
- Do not print, log or commit secrets or private keys.
- Small, focused commits on `fix/scc-phase0-keys`. Do NOT push, do NOT merge, do NOT open a PR.
- If something is ambiguous or a fix would need a larger redesign, stop and ask instead of guessing.

REPORT (write it in plain Egyptian Arabic; keep file names, commands and identifiers in English)
1. What changed, file by file (one line each).
2. The exact commands you ran and their pass/fail result (paste the summary lines).
3. Anything not done or not verified, and why.
4. Follow-ups: in particular, the SDK now needs pinned keys, so the YAKEBDA integration branch `feat/scc-client-sdk-pilot` (in the separate yakebda-ms repo) must pass the public keys at config time. List it; do not touch that repo.
5. `git log --oneline` of your branch.
```
