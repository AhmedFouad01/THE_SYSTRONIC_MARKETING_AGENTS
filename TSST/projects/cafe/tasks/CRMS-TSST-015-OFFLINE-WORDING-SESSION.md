# CRMS-TSST-015 — Edge outage: Arabic offline state and session survival (QA F4)

Date: 2026-11-10 · Done by: TSST Lead (Claude, R61), no bus task · Owner OK: "ابدأ F4" (chat 2026-11-10)
Team: build · Skills applied: TSST-DEV-SK-009 (resilience/failure), TSST-DEV-SK-011 (tests), TSST-DEV-SK-015 (verification)
Found in: Beta QA run, Cafe `docs/gates/CRMS-BETA-QA-RUN-2026-11-10.md` (F4, rows 8.1–8.3).

## Cause (proven at `15e31e2`)

- In QA the PWA reaches the Edge through a proxy (`vite preview`, same origin `/api/v1`). With the Edge stopped, the proxy answers `502 text/plain` itself. `lib/edge-api/client.ts` mapped that to `http_error` with `Edge API request failed with HTTP 502`. `health.ts` then said `degraded` ("الاتصال محدود"), so POS still allowed writes, and a write showed the raw English message.
- `session/SessionProvider.tsx` bootstrap cleared the saved refresh token on **any** refresh failure. A page load during the outage therefore logged staff out.

## Fix — Cafe branch `claude/crms-offline-session-015`, `44fa3bfdc7cc86bdf064b0ba14316a87f0a0a43c` (from `15e31e2`), pushed, no PR

12 files, +261/−14, PWA only. No API, SQL or permission change.

- Client: 502/503/504 **without** the Edge's JSON body → code `network` with `EDGE_OFFLINE_MESSAGE` ("النظام غير متصل. حاول تاني أول ما الاتصال يرجع."). An Edge JSON 503 stays `http_error` with its message. The fallback timeout and HTTP messages are now Egyptian Arabic, so no "Edge API …" English is left.
- Session: new status `reconnecting`. An outage (`network`, `timeout`, or 5xx) during bootstrap keeps the token, shows `SessionReconnecting` ("النظام غير متصل دلوقتي. جلستك محفوظة… لو الانقطاع طوّل، كمّل على الورق."), and retries every 5 s. Only a real Edge answer (401 or another 4xx, or a non-Edge error) clears the token. 401 recovery during an outage also keeps the session. `ProtectedRoute` and `PermissionRoute` show the reconnecting screen instead of sending the user to `/login`.
- Wording: Billing, Cash and the login screen no longer say "Edge". Manager screens (BackOffice, Workforce, Administration, Printing) still do, and are left for later.

## Tests and gates on `44fa3bf`

- New: client (gateway 502/503/504 offline in Arabic, Edge JSON 503 kept, 500 in Arabic, timeout in Arabic, network message), health (502 → `unavailable`, not-ok → `degraded`), session (outage keeps the token and resumes after retries, a 401 refresh still logs out, 401 recovery during the outage keeps the session), route (reconnecting shows the message, not login). 12 tests.
- PWA 26 files, 219/219. PWA `typecheck` and `lint` exit 0, `build` PASS, `static-verify` PASS. 002w/002s/002e were not rerun, because the API and DB are unchanged since `15e31e2`, where they passed.
- No RED run against `15e31e2`.

## QA environment and browser check

- QA clone detached at `44fa3bf`. Only the PWA was rebuilt (PowerShell, `/api/v1`), the CA was copied, and the HTTPS preview restarted. The Edge, which has the same code, was stopped and restarted for the test.
- As `qa-cashier` on the loopback copy (session removed afterwards): the Edge was stopped, and the proxy answered `502 text/plain`. Within one health poll POS showed "النظام غير متصل", and adding an item was blocked with "النظام غير متصل؛ الإرسال هيرجع أول ما الاتصال يرجع." (no English). A reload during the outage showed the reconnecting screen on `/pos`, with the token kept. After the Edge restarted, the refresh returned 201 after 4 retries that got 502, and the app went back to POS ("النظام متصل", QA cashier) with no login.

## Left open

- The Edge rotates the refresh token on every refresh (`identity.service.ts` `refresh`). If a refresh commits on the Edge but its reply is lost (timeout), the client retries with the old token, gets 401, and logs out. This is rare. A fix needs an Edge-side grace window for the previous token; that would be a separate task.

## Cafe records

`docs/gates/CRMS-CLOUD-HANDOFF.md` row on `codex/crms-cashier-first-036` (`470fb92`, pushed).

## Next

F5 (Billing page: bill labels by table/takeaway, translated status, quantities, default amount, cash confirm).
