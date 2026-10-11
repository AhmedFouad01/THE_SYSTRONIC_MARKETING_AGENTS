# CRM-F3 — done (technical; visual review pending)
Commit: 4243168 on feat/crm-review-fix1; no push/merge.
R06 done-when: sidebar/Import/switch announcement use existing display-name metadata or localized CRM Workspace fallback; UUID is tooltip/copy only.
Contract limitation: approved session/workspaces contain tenantId/grantId but no actual workspace name; no API/storage/name invention; unknown choice labels numbered locally.
UUID audit: Import prior job/results/actor/ledger/errors, record technical details, generic grid UUIDs and reporting UUID references use labels with preserved binding/copy values.
Upcoming navigation: same-height inert aria-disabled rows; amber warning-token dot at logical end; RAC pointer/focus/Escape tooltip Coming soon / قريبًا; no badge text.
Checks C: lint 380 files; typecheck 2 TS projects; test:unit 67 files / 670 tests passed; build 1514 modules passed (existing >500kB chunk warning).
Eyeball: sidebar + mobile More upcoming rows and hover/Tab/Escape tooltip; workspace switch; Import upload/prior-job/results/ledger/errors; record details/copy; Reports UUID cells; EN/AR RTL, light/dark, 1440/375px.
Visual skipped: initial browser sandbox helper_unknown_error; retry trusted Node process exited unexpectedly before browser state.
Skills used: TSST-DEV-SK-005 (preserved session/API and ID-binding contracts), TSST-DEV-SK-011 (name/UUID/disabled-nav regressions), TSST-DEV-SK-015 (fresh C and diff review).
Skills skipped: none. skill_friction: none. Manual design fallback; Impeccable absent, installation approval absent. Readiness: NOT_READY.
