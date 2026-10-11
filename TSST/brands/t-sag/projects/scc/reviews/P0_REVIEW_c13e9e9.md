# SCC Phase 0 review: commit c13e9e9 (branch fix/scc-phase0-keys)

Reviewer: DEV_AG. Paths relative to `systronic-control-center/`.

## Verdict: ACCEPT-WITH-FIXES

The security design is correct and the unit-level checks pass. But the commit breaks callers it did not update (e2e, security tests, simulator), the production key check is not a startup check, and two required tests are missing or weak. Do not merge until fixes 1-4 are done.

## Verification (fresh, this session)
- `npm run typecheck`: pass. `npm run lint`: pass.
- `npm run test:unit`: 5 files, **16** tests pass (commit message claims 19; minor discrepancy).
- **Docker daemon not running** (`docker compose up -d postgres` failed: engine pipe missing); no local Postgres. Integration, e2e and security suites were NOT run. Their status below is from static evidence only.
- No files modified. `.local/keys/` created by unit tests is gitignored (git status clean).

## Checklist
| Requirement | Result | Evidence |
|---|---|---|
| Persistent keys from SCC_KEYS_DIR | PASS | signing.ts:21-41 |
| kid = RFC 7638 thumbprint | PASS | signing.ts:36,54; generate-keys.ts:21 |
| Multi-key verify, sign with current | PASS (SDK list); server loads one key | SDK index.ts:252-256, 299-303 |
| Production refuses missing keys, no auto-gen | PARTIAL: throws, but lazily (see F2) | signing.ts:44-48 |
| generate-keys: no private output, 0600 | PASS (mode applies to new files only; Windows shows 644, runbook covers ACL) | generate-keys.ts:25-31 |
| SDK pinned keys, selected by kid, server key ignored | PASS (kid read from server offer only as selector) | index.ts:236-270, 292-305 |
| Offline grace unchanged | PASS (verifyGrant untouched) | shared/security.ts |
| Config refuses default/short JWT, default DB pw | PASS | config.ts:1-24 |
| Seed refuses production | PASS | seed.ts:4-6 |
| .env.example + runbook | PASS | .env.example:9; LOCAL_DEVELOPMENT.md |
| .gitignore keys dir | PASS by luck: `.local/` already ignored (default dir). Custom SCC_KEYS_DIR is not covered | .gitignore |
| No secret in commit | PASS (no key files tracked) | git ls-files |

## Suspicions answered
- **.gitignore**: not changed, but root `.gitignore` already has `.local/`, so default dev keys (`.local/keys/`) cannot be committed. `*.key`/`*.pem` do not match `*.private.json`; a custom dir inside the repo would be exposed. Add explicit patterns (fix 6).
- **Dependencies**: no new packages. Only lock/version bumps of existing devDeps (@types/node 22.20.1 to 22.20.5, tsx 4.23.1 to 4.23.15, typescript 5.9.2 to 5.9.3). Unrelated to the brief and unjustified, harmless. Prefer reverting (fix 7).
- **environment.ts**: `npm.cmd` + `shell: true` only on win32; Linux CI still uses `npm`. Fine. The `execFileSync` options type cast is ugly but OK.
- **API behaviour**: no route change. One side effect: release rows already in DB were signed with dead ephemeral keys and store a kid-less public_key_jwk; they will fail `missing_key_id`/signature. Re-create releases after deploy (note in runbook).

## Required tests
| Test | Status |
|---|---|
| (a) restart + offline via SDK | **MISSING**. signing.test.ts only asserts the same cached promise (comment admits it cannot reset). No vi.resetModules, no grant issued then re-verified |
| (b) tampered update offer | **WEAK**. update.test.ts uses signature "some-sig" and an unknown kid; never signs with a real attacker key. No test with attacker key presenting the legitimate kid (should give artifact_signature_invalid). No positive valid-offer test in unit suite |
| (c) unknown kid grant | OK (licensing.test.ts) |
| (d) production config | OK (default pw, default JWT, short JWT, strong). Missing: absent JWT_SECRET/DATABASE_URL cases |
| (e) rotation | OK at SDK level (old+new trusted). Server-side key reload not covered |
| Extra: prod missing keys throws, seed refuses prod | none |

## Findings

**BLOCKING**
- **F1 Callers not updated.** `trustedLicenseKeys`/`trustedUpdateKeys` are required in the SDK constructor, but `tests/e2e/milestones.test.ts:45`, `tests/security/security.test.ts:71,77` and `examples/client-simulator/index.ts:12` still omit them. `tsc` on the e2e file confirms TS2345. At runtime `[undefined].find(k => k.kid)` throws in `validateLicense` (e2e line 99) and `executeUpdate` (e2e line 154), so `npm run check` and CI will fail. `tsc -b` stays green only because tests and examples are outside the project references. Not run (no Postgres), static evidence only.

**IMPORTANT**
- **F2 Production key check is lazy.** `licenseKeys()`/`updateKeys()` run only on first licence issue or release creation (commercial.ts:258, change.ts:47). A production API starts fine without key files, contradicting "refuse to start".
- **F3 Catch-all silently regenerates keys.** signing.ts:43 `catch {}` treats corrupt/unreadable/half-present files as missing. In dev it overwrites the existing private key, invalidating all grants without a clear error. Only ENOENT on both files should trigger generation. No check that private and public `x` match.
- **F4 Test gaps** (a) and (b) as above.

**SUGGESTION**
- F5 Update signature covers only the checksum, not version/productId (pre-existing); offers can be relabelled with an older signed artifact. Track for a later phase.
- F6 Duplicate key-creation code in signing.ts and generate-keys.ts; share one helper.
- F7 SDK errors for updates are plain strings (`unknown_key_id`), not typed; acceptable for now.

## Exact fix list for the next Antigravity run
1. Update `tests/e2e/milestones.test.ts`, `tests/security/security.test.ts`, `examples/client-simulator/index.ts` to pass `trustedLicenseKeys`/`trustedUpdateKeys`. Test helper: read `${SCC_KEYS_DIR}/license.public.json` and `update.public.json` (kid included). Simulator: read from env/file paths. Run `npx tsc --noEmit` on those files or add them to a tsconfig so typecheck covers them.
2. Add `export async function assertKeysReady()` in signing.ts that loads both keys; call it before `listen()` in the API entry/`buildServer()`. In production it must throw if files are missing.
3. In `loadOrGenerate`: generate only when both files are ENOENT; any other error rethrows with the file name (no key content); verify private/public `x` match and recompute kid.
4. Add tests: (a) write keys to a temp SCC_KEYS_DIR, load, `signGrant`, `vi.resetModules()`, reload, assert same keyId and the grant verifies through `SystronicClient.validateLicense` with an offline store; (b) real update offer signed by attacker key, with attacker kid and with the legitimate kid (expect `unknown_key_id` / `artifact_signature_invalid`), plus a valid offer signed by the pinned key that succeeds; production with keys missing throws; config with JWT_SECRET/DATABASE_URL absent throws; seed refuses production.
5. Run integration, e2e and security suites against Postgres (not yet verified by anyone).
6. `.gitignore`: add `keys/` and `*.private.json`.
7. Revert unrelated version bumps in package.json and package-lock.json.
8. Runbook: note that existing releases must be re-created after the key change.

## Lead acceptance · 2026-10-07
Fix commits ec69443 + 20ad53b on fix/scc-phase0-keys. Re-verified by the Lead on C:\dev clone with Postgres up: typecheck PASS, lint PASS, `npm test` 10 files / 37 tests PASS. Fetch stub restored with vi.unstubAllGlobals. Lockfile reverted to base; no key material tracked.
Verdict: **Phase 0 ACCEPTED.** Not merged, not pushed. Open follow-ups: F5 (update signature should cover version/productId), F6 (shared key helper); YAKEBDA branch must pass pinned keys.
