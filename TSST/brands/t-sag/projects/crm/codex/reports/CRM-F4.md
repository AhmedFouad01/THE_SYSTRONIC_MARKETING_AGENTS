# CRM-F4 — R12
Commit: 760cfdc30c2f47fc72a2927a0a227511c2ea0df5 (feat/crm-review-fix1); no push/merge.
Done-when R12: kit FileDropZone uses RAC DropZone + FileTrigger; localized browse/drop/empty/error text and filename/size/remove chip; Import uses it.
Behaviour/API: existing file validation/inspection unchanged; removal resets file/base64/inspection/mapping/sheet via resetInspection; cancellation preserves selection; first actual file only; disabled and stale-drop guards.
Audit/guard: no native input/select/textarea/button outside ui kit; existing feature RAC controls styled; AST guard rejects bare natives, unstyled RAC aliases/namespaces, and kit/Aria Input browser-widget types including file/date/color/range.
Checks C PASS: lint 384 files/0 warnings; typecheck 2 projects; test:unit 69 files/684 tests; build 1516 modules (existing >500kB chunk warning only).
Evidence: 14 new tests cover AR/EN accessible hidden picker/accept/filename/size, cancellation/reselect/disable/read errors, pending-drop removal/browse races and native guard fixtures/source scan; generated token/drop/focus CSS verified.
Visual skipped: in-app browser setup failed helper_unknown_error; single retry exited/reset trusted Node process.
Ahmed eyeball: Import Upload empty/selected/long mixed AR-EN filename chip, browse/cancel/reselect/drop/remove, CSV/XLSX acceptance/errors, processing disabled, keyboard focus/drop; AR/EN RTL/LTR, light/dark, 1440/375px.
Skills used: TSST-DEV-SK-005 (API/binding preservation), TSST-DEV-SK-011 (regression/guard coverage), TSST-DEV-SK-015 (fresh C + evidence); manual kit audit per brief, Impeccable absent/no install approval.
Readiness: NOT_READY pending human visual check; skill_friction: TypeScript 7 has no legacy parser API, used existing Rolldown AST parser without dependency changes. Stop after CRM-F4.
