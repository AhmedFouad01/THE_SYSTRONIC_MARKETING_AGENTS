# GEM-SCC-002 — Lead review · 2026-10-07

Output: pasted by Ahmed in chat (Claude session 2026-10-07), not saved as a file. Gemini Deep Research, Arabic.
Verdict: **ACCEPTED WITH CORRECTIONS.** Output is input (R2). Reviewed by the Lead with two spot-checks, not by a LENS round, to save tokens.

## Acceptance checks
- Each row has URL + date + grade: mostly yes. Several links are wrapped in google.com/search redirects; the target URL is recoverable.
- No invented prices: yes. Unknown prices are marked UNKNOWN.
- Grades inflated: a Microsoft Q&A forum answer is graded A, but should be B. The Daftra/MeshCentral link is weak (C).

## Accepted facts
| Fact | Note |
|---|---|
| Uptime Kuma supports push (heartbeat) monitors; Telegram/email channels; one light container | Resolves the dispute in LENS's packet |
| GlitchTip: Postgres 14+, Redis/Valkey, about 256–512 MB; uses Sentry SDKs | |
| MeshCentral is Apache-2.0; CVE-2024-26135 (fixed) | Keep it patched, behind strong login |
| RustDesk server is AGPL (obligation applies to modifications) | |
| Velopack: .NET / Electron / C++ / Rust; delta updates; static hosting (S3 or similar) | Fit depends on YAKEBDA's stack |
| Keygen: free Dev tier up to 100 users; Std about $49/mo (B); offline signed licenses with Ed25519 | |
| Cryptlex $50/mo (B); LicenseSpring $199/mo (B) | |
| Telegram Bot API is free | Use for Ahmed's alerts |
| Daftra-style local POS apps run offline-first and sync later | Pattern only |

## Corrections
1. **EV certificate claim is outdated.** Since about August 2024, EV certificates no longer get instant SmartScreen reputation; EV and OV build reputation the same way. Do NOT buy EV at about $536/yr for this reason. Sources: todesktop.com/blog/posts/windows-apps-psa-ev-certs-do-not-grant-immediate-reputation-anymore, ngrok.com/blog/windows-ev-certificate (2026-02).
2. **Keygen CE is not "no restrictions".** It is under the Fair Core License (non-compete). Licensing your own products is allowed. Offering it to others as a licensing service is not. Each version becomes Apache-2.0 after 2 years. Source: keygen.sh/license.
3. Trusted Signing being US/CA-only comes from a forum answer (B). It does not matter now, because signing is deferred.
4. WhatsApp prices are muddled (service vs utility). This is irrelevant, because Telegram is chosen.
5. The claim "Egyptian vendors use MeshCentral" is UNSUPPORTED: the source is a generic blog.

## Plan impact (proposals; Ahmed decides)
- Alerts → Telegram bot. Remote → MeshCentral. Heartbeat → Uptime Kuma push plus SCC's own table. Errors → GlitchTip. Updates → Velopack (gate: YAKEBDA stack).
- Licensing → keep SCC's own after Phase 0. Plan B is now stronger: Keygen CE, self-hosted, free, own keys.
- Code signing → defer. Ahmed installs on site, and in-app updates are not browser downloads, so SmartScreen likely does not fire. Pilot test: run a Velopack update on a pilot PC and check for a SmartScreen prompt.
- Still open: YAKEBDA stack; go/no-go on the hybrid plan and Phase 0.
