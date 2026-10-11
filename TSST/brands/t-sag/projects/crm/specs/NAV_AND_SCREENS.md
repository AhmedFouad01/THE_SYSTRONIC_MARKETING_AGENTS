# Navigation and screens — CRM-PLAN-UX

Status: **NOT_READY — implementation specification**. Scope: T-SAG agency/client workspaces; AR RTL and EN LTR; 1440 desktop / 375 mobile; both themes. “Live” means a route appears in the current AppShell, not a production-readiness claim. Proposed paths below are reserved design targets, not existing routes.

## 1. Final sidebar tree

Order is top-to-bottom; indentation below defines nesting. M = manager, P = rep, R = reader. Role defaults are proposals where the allowed sources lack authority details; capabilities and object scope always decide access. Hide denied leaves and empty groups in desktop, mobile and any existing command entry. Coming-soon leaves are non-navigating text with a visible badge, never fake links.

| Ordered group / child | AR / EN label | Existing icon name | Route / availability | Role and authority gate |
|---|---|---|---|---|
| 1 Overview | نظرة عامة / Overview | home | Group, expanded initially | M/P/R |
| ↳ Dashboard | لوحة المعلومات / Dashboard | home | `/dashboard`, `/` alias: live operational dashboard; C1–C5 coming soon | M/P/R with `crm.read`; P assigned, M/R tenant; chart endpoints reject agency grants |
| 2 CRM | إدارة العملاء / CRM | contacts | Group, expanded initially | M/P/R, scoped |
| ↳ Leads | العملاء المحتملون / Leads | leads | `/leads`: live | `crm.read`; mutations require `crm.write` |
| ↳ Contacts | جهات الاتصال / Contacts | contacts | `/contacts`: live | Same; identifiers/merge additionally require their sensitive/merge capabilities |
| ↳ Deals | الصفقات / Deals | deals | `/deals`: live | `crm.read`; writes scoped by `crm.write` |
| ↳↳ Pipeline | مسار المبيعات / Pipeline | route | `/pipeline`: live; child view of Deals | Same read gate; stage configuration separately requires `pipeline.manage` |
| ↳ Tasks | المهام / Tasks | tasks | `/tasks`: live | `crm.read`; create/complete requires `crm.write` |
| ↳ Segments | الشرائح / Segments | contacts | Proposed `/segments`: coming soon | Proposed M/P/R read; creation/edit rights need a future contract |
| ↳ Import | استيراد البيانات / Import | more | Proposed `/imports`: coming soon UI; server live | M only, MFA + `crm.import` + `crm.write`; sensitive mapping needs sensitive rights; P/R and agency grants denied |
| 3 Insights | الرؤى / Insights | report | Group, expanded initially | Capability-scoped |
| ↳ Reports | التقارير / Reports | report | `/reporting`, `/reporting-v2` alias: live | M/P/R only with `report.read`; calculation separately requires `report.calculate` |
| ↳ Journeys & tracking | رحلات العملاء والتتبع / Journeys & tracking | route | Proposed `/journeys`: coming soon consolidated screen | Proposed M/P/R subject to reporting/object grants; existing contact journey stays accessible |
| 4 Administration | الإدارة / Administration | settings | Group, collapsed initially | M by proposed default; actual capabilities authoritative |
| ↳ Integrations | التكاملات / Integrations | route | Proposed `/settings/integrations`: coming soon; Meta/Google/TikTok within screen | M + `integration.manage`; provider workflows outside this spec |
| ↳ Users & roles | المستخدمون والأدوار / Users & roles | contacts | Proposed `/settings/users`: coming soon | M proposed; authorization contract required before enabling |
| ↳ Settings | الإعدادات / Settings | settings | Disclosure, no landing route | Show with any permitted child |
| ↳↳ Properties | الخصائص / Properties | settings | `/settings/properties`: live | Current shell documents `schema.read`; M/P/R visibility follows actual capability; edits need verified schema-write authority |
| ↳↳ Security | الأمان / Security | lock | Proposed `/settings/security`: coming soon | M proposed; authority contract required |

Icons intentionally reuse only names evidenced in AppShell. Group icons are optional; upcoming Import uses `more` until an approved import icon is available. This adds no icon dependency.

**Tenant context:** pinned beneath the brand and above groups, outside scrolling navigation; agency staff see “مساحة العمل / Workspace” plus a bidi-isolated client name and “تبديل العميل / Switch client”. Mobile shows the same control in the topbar and More header. Only authorized tenants appear. Switching reloads capabilities/data, clears cross-tenant selection/drawers and import drafts, and announces the new workspace. A tenant switch is not an agency grant bypass: imports/charts require eligible direct membership. Single-tenant members see context without a switch action.

**Collapse / mobile:** desktop sidebar on logical start (right in AR), group disclosures with `aria-expanded`; persist group state per actor/tenant, auto-expand the active branch. Keep Deals linked and give its Pipeline disclosure a separate button. Prefer group collapse over an icon-only rail. At the existing ≤720px breakpoint retain Leads, Contacts, Deals, Tasks + More; at 375 use a single-column, scrollable More sheet with the same hierarchy, gates and badges. AR navigation and detail sheets enter from the right; reduced motion removes travel. Close returns focus to its trigger. Language/theme/session controls remain in Workspace actions.

**Depth / recovery:** direct live leaves take one activation from an expanded group; Pipeline at most two; Properties at most three from closed Administration/Settings. More adds one mobile activation. Leads → contact detail/journey; Contacts → detail/edit/authorized merge; Deals → detail/stage history; Pipeline → stage work; Tasks → contextual completion; Reports → conversions/orders evidence; Dashboard → work priorities; Import → five-step review. Each path retains list filters, scroll and record context on return. Missing upcoming screens have no navigable dead ends. Existing navigation/search commands retain aliases and visible mouse/touch paths; no new palette or shortcut project is included.

## 2. Import screens

Manager-only workspace workflow: **Upload → Mapping → Preview → Duplicate policy → Result**. Step headings expose position and current step. Back preserves file/mapping/options; changing inputs invalidates the preview and requires recalculation before commit. Visible buttons support keyboard focus order; errors focus a summary with links to the affected field/row. Never leave the tenant implicit.

| Step | Content and actions | Empty / loading / error / partial behavior |
|---|---|---|
| Upload | Contact or lead; CSV UTF-8 / XLSX picker and drop zone; file name, size, sheet (first by default), country code and owner (caller default). Display limits: 5 MiB, 5,000 rows, 100 columns; no deals/tasks/company import. | Empty: choose a file. Parsing: retain filename and announce progress without invented percent. Reject format mismatch, malformed/unsupported encoding, unsafe archive, absent header/sheet or limits with safe error and replacement action. Do not upload another file silently. |
| Mapping | Fetch `/v1/imports/fields?object=...`; source index/header/sample → fixed or `property:<key>` target, or Ignore. Contact requires `display_name`; lead requires `title`. Each target once. Include tenant active writable custom properties and select options. | Loading: labeled skeleton/disabled Next. Field-fetch failure: Retry. Mapping errors inline + summary. No user-typed, archived, read-only or unauthorized sensitive property targets; no property creation in this wizard. |
| Preview | Call preview: writes nothing. Summary create/update/skip/error/warnings, total rows; sample up to 100 and error rows up to 100. Show spreadsheet row number (header row 1), affected target, safe message and warning text. | Empty file: replace upload. Show all-zero/invalid summary without enabled commit. Partial preview means sampling/truncation, not partial writes: explicitly state shown N of total and truncated errors. Return to mapping/upload for correction. |
| Duplicate policy | Default Skip duplicates; alternatives Update matches / Create contacts. Explain contact email-then-phone matching and earlier-file duplicates. Lead duplicate = same contact + same title, not closed; lead import always reuses matching contacts even in create mode. Choose Skip invalid rows (default) or Abort on any error. Re-preview after policy change, then review counts and confirm import. | Ambiguous contact match: Skip skips; Update fails row. No identifiers means unmatched create. Blank cells never clear values; Update can produce No change skips. Abort + errors blocks commit. Sensitive mapping requires appropriate rights. |
| Result | POST `/v1/imports`; show job ID, file, mode, actor, timestamp and created/updated/skipped/failed counts. Links to job history and row ledger, then live Contacts/Leads. Ledger filters by outcome; 200-row paging; history 50-job paging. | Committing: prevent double-submit; no fabricated asynchronous job/polling. Network uncertainty: safe retry with identical content/mapping/options; replay shows existing job and refetches ledger. Skip-invalid success may contain failed rows but is one atomic transaction. Abort rejection writes nothing. No undo promise. |

Formula-like cells are plain text, with visible warning; show source identifiers/filenames as bidi-isolated text. Arabic-Indic input is supported. Dates use contract ISO forms; explain currency minor units, checkbox values and multi-select separators when the matching property needs them. Keep `request_id` in expandable error details; show the server's safe message and retryability, never raw stack traces. MFA/session expiry preserves local draft pending reauthentication; denied access offers return to CRM, without exposing file contents to another tenant.

**Copy keys (interpolated variables isolated; numbers localized):**

| Key | AR | EN |
|---|---|---|
| `import.step.upload` | رفع الملف | Upload file |
| `import.step.mapping` | ربط الأعمدة | Map columns |
| `import.step.preview` | معاينة الصفوف | Preview rows |
| `import.step.policy` | سياسة التكرار | Duplicate policy |
| `import.step.result` | نتيجة الاستيراد | Import result |
| `import.empty` | اختر ملف CSV أو XLSX للبدء | Choose a CSV or XLSX file to start |
| `import.loading` | جارٍ تجهيز البيانات… | Preparing data… |
| `import.error` | تعذّر الاستيراد: {message} | Import failed: {message} |
| `import.rowError` | الصف {row}، {field}: {message} | Row {row}, {field}: {message} |
| `import.previewSample` | عرض {shown} من {total} صف؛ قد توجد أخطاء أخرى | Showing {shown} of {total} rows; additional errors may exist |
| `import.partial` | تم الاستيراد مع تعذّر {failed} صف | Import completed with {failed} failed rows |
| `import.policy.skip` | تخطّي المكرّر | Skip duplicates |
| `import.policy.update` | تحديث المطابق | Update matches |
| `import.policy.create` | إنشاء جهات اتصال جديدة | Create new contacts |
| `import.policy.skipErrors` | تخطّي الصفوف غير الصالحة | Skip invalid rows |
| `import.policy.abort` | إلغاء الاستيراد عند أي خطأ | Abort on any error |
| `import.replayed` | هذا الاستيراد منفّذ سابقًا؛ لم تُكتب بيانات جديدة | This import already ran; no new data was written |
| `import.confirm` | استيراد {count} صف صالح | Import {count} valid rows |
| `common.retry` | إعادة المحاولة | Retry |

Translate mapping/row error codes (including property validators) through localized error keys; retain unknown safe messages as fallback. Completion announcement includes all outcome counts.

## 3. Dashboard

Keep the existing operational surface; augment with these five independent widgets. Desktop: 12-column grid; mobile: full-width widgets in the same reading order. M/R figures are tenant-wide; P figures assigned-only and titled “الخاصة بي / Mine” using response `scope`, never client-side filtering. Reader sees data tables and read drill-downs without mutation controls.

| Role order | Widget / desktop width | Payload and presentation |
|---|---|---|
| M/R: C1,C2,C3,C4,C5; P: C4,C1,C2,C3,C5 | C1 Pipeline / 6 | `pipeline-stages`; horizontal counts, stage-position order; zero stages preserved; archived only if holding deals. Include won/lost, label them. Pipeline selector; value secondary with separate currency selector. |
| Same | C2 Leads / 6 | `leads-breakdown`; stacked horizontal open/qualified/closed; status KPI strip; Other (N sources) final row. |
| Same | C3 Outcomes / 6 | `deals-outcomes`; grouped won/lost columns; default 12 months, week toggle; optional won-value line for one selected currency. |
| Same | C4 Tasks / 6 | `tasks-due`; exact overdue/next-24h KPIs plus seven day columns and later. Next-24h overlaps days: never stack/add that KPI into the partition. |
| Same | C5 Activity / 12 | `activity`; 12 Saturday-start weeks, distinguish contacts/leads/deals/tasks created and tasks completed. These are records, not audit events. |

**Chart.js 4.5.1 configuration requirements:** AR legend and tooltip `rtl: true`, `textDirection: 'rtl'`; EN false/`'ltr'`. C1/C2 `indexAxis: 'y'`, x reversed in AR. Preserve chronological reading order and localize ticks/tooltips/legend/status labels consistently. Format Arabic counts with locale `ar-EG` and Arabic numbering; EN uses English digits. Format minor-unit decimal strings using existing bigint-safe `toBig` and currency formatting; never sum currencies or coerce large money strings to lossy numbers. Bidi-isolate raw stage/pipeline/source names in surrounding DOM and accessible tables; canvas labels require direction-aware shaping/isolation.

Send the browser IANA timezone to C3/C4/C5 and display timezone + `as_of`. **Saturday weeks require server-supported rebucketing**, as mandated by CHARTS §6: current Monday aggregate data cannot be accurately shifted/relabelled in the UI. Coordinate week-start query/SQL contract before weekly C3 or C5 ships; monthly C3 can proceed independently. Do not store a tenant timezone.

**Themes/accessibility:** bind canvas text, gridlines, surfaces, focus and categorical/state colors to resolved existing `--sy-*` semantic roles in each theme; refresh charts on theme changes. Allowed sources do not expose exact token names/values, so implementation must verify bindings and measure 4.5:1 normal text, 3:1 meaningful graphics/focus in both themes. No contrast pass is claimed. Won/lost/open statuses also have labels; C5 series use distinct markers/dashes and legend text, not color alone. Animations on unless reduced motion requests none.

Each canvas has a localized aria-label containing widget name, scope, period, timezone and measure; adjacent “عرض جدول البيانات / Show data table” reveals a keyboard-accessible table from the identical payload, with caption, headers, currency and date ranges. Announce state changes without reading every plotted point.

Independent states: skeleton + loading label; all-zero payload → “لا توجد بيانات لهذه الفترة / No data for this period” and authorized CRM entry action; valid zero stages remain in C1 table. Error → safe message + widget Retry. 403 → permission message without hiding healthy widgets. Rep empty → “لا توجد سجلات مسندة إليك / No records assigned to you”. No invented attribution/provider charts; existing reporting stays unchanged.

## 4. Migration notes

| Change | Compatibility / implementation obligation |
|---|---|
| Flat CRM list → nested groups; Pipeline under Deals; Reports under Insights; Properties under Administration → Settings | Keep existing paths, nav keys, permission filtering and record/list state. Labels/headings change; update breadcrumbs, More and any existing command/search labels together. |
| Dashboard gains charts | Keep `/dashboard` and `/` alias and existing operational work priorities. Do not imply charts are live before UI exists. |
| Reporting label becomes Reports | Keep `/reporting` and `/reporting-v2` alias. Contact journey remains in record context; new consolidated tracking screen stays coming soon. |
| Upcoming reserved paths | Do not add them to live `NAV_ROUTES` until screens/router/gates exist. Existing `ALL_ROUTES_HAVE_NAV` assumes flat routes; adapt it to linked leaves, excluding disclosures and badges. |
| Tenant switcher | Authorized context only; chart/import agency-grant restrictions remain. Capability/scope refresh is mandatory. |
| Legacy inventory surfaces | Audit/outbox/pipeline configuration/automation are not current AppShell routes. Preserve existing authorized entrypoints; no new primary route is asserted. Raw ingest and foundation proof stay outside daily navigation. |
| Weekly charts / future admin gates / palette | Backend Saturday buckets, users/security/segments authority contracts and measured token contrast are open implementation dependencies. |

### Skills used

- **TSST-CREATIVE-SK-020:** task/object hierarchy, global versus record context, eight task paths, click depth and dead-end prevention.
- **TSST-CREATIVE-SK-024:** existing navigation command/label migration, permission parity, keyboard focus and visible action paths; new palette/shortcut design skipped as outside this brief.
- **TSST-CREATIVE-SK-006:** semantic theme binding, non-color status/series cues and contrast acceptance criteria. Measured matrix/render QA deferred: token values and renders are outside authorized sources/mode.

Evidence: `MVP_INFORMATION_ARCHITECTURE.md`; `MVP_SCREEN_INVENTORY.md`; `app/src/ui/shell/AppShell.tsx`; `IMPORT_CONTRACTS.md`; `CHARTS_CONTRACTS.md` including §6. No external sources, implementation, renders or test runs.
