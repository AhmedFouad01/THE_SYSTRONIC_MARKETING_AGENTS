# Dashboard + Leads KPI strip spec (UX-R2-04, UX-09)
CREATIVE_AG, 2026-10-05, SPEC only (no product code). Status NOT_READY until DEV build + CREATIVE re-audit.
Sources: UX_RULES, DESIGN_TOKENS, COMPONENT_CONTRACTS, MVP_UI_IMPLEMENTATION_MAP s7, M1/M2_CONTRACTS, KpiCard.tsx, PageHeader.tsx.

## 1. Purpose / jobs
- Who: sales rep / manager opening the app first (Dashboard is nav item 1). Marketing analyst is secondary (report.read).
- Decision 1: "What must I act on now?" -> overdue + next-24h follow-ups (exact).
- Decision 2: "Is marketing paying off?" -> attributed revenue, spend, ROAS, conversions (exact, bounded tenant evidence).
- Not a BI page: no chart in v1 (no question needs one; SK-029 "no chart without a question"). Top campaigns = text table.
- Role scope is server-enforced: rep sees assigned tasks only; reader/rep without report.read gets the Permission state in the marketing block (never hidden silently).

## 2. Layout (shared PageHeader + KpiCard; no new patterns, UX_RULES 15)
PageHeader: title "Dashboard"/"لوحة المتابعة"; subtitle (text-2, 14px) = scope line; actions = New task (create), New lead (secondary) - real dialogs only (rule 8); `kpis` slot = 4 KpiCards.
**1440** (content max ~1200, 12-col, gap 16/12 in strip):
- Row A (header kpis): [Overdue][Next 24h][Attributed revenue][ROAS] = 4 equal cols, gap 12.
- Row B: Follow-ups list (cols 1-8) | Marketing snapshot panel: spend, conversions, refunds, model/as-of meta (cols 9-12).
- Row C: Top campaigns table (cols 1-12), 5 rows max, "View full report" link to /app/reporting.
**375** (single column, 16px page padding, no horizontal scroll):
1 title+subtitle; 2 actions row (2 buttons, full-width split); 3 KPI grid 2x2 (gap 10); 4 Follow-ups (cards, 48px+ rows); 5 Marketing snapshot (stacked key/value rows); 6 Top campaigns as cards (name, revenue, ROAS, conversions) - no table. Touch targets >=44px.
RTL: logical start/end only; row order mirrors; money/numbers `<bdi dir=ltr>`, names `<bdi>`; directional chevrons mirror, status icons do not.

## 3. KPI emphasis rules
- Max 2 filled cards, never default. Overdue = navy ONLY when count > 0 (operational priority). Attributed revenue = magenta ONLY when value > 0 and report is non-stale (critical outcome). Else neutral. All other cards neutral. Never colour by status; use semantic chips (warningFg/successFg) for status.
- If only one of the two conditions holds, only one card is filled.
- Contrast: use KpiCard tones as shipped; do not hard-code hex (tokens only).

## 4. Widgets
Common states: Loading = shared skeleton (card keeps size, aria-busy); Error = shared error pattern + Retry, per-widget (one failing widget never blanks the page); Permission (403) = shared permission pattern naming the missing capability in plain words; Empty = explains next action. "Exact" = computed from a complete server answer; "capped" = exact lower bound shown as `50+` (page 1 had next_cursor); "sample" = forbidden in v1.

| # | Widget | Data / call | Calculation | Exactness |
|---|---|---|---|---|
| W1 | Overdue follow-ups (KpiCard) | GET /v1/tasks?due=overdue (page 1) | count = data.length; if next_cursor != null show `50+` | exact / capped |
| W2 | Next 24 hours (KpiCard) | GET /v1/tasks?due=today (server: next 24h) | same; label MUST say 24 hours, not "today" | exact / capped |
| W3 | Attributed revenue (KpiCard) | GET /v1/reports/campaign-performance (default last_non_direct) | deriveKpis(report).revenue in primary currency (existing fn, reporting/model.ts) | exact for bounded evidence |
| W4 | ROAS (KpiCard) | same response | revenue / spend, primary currency; spend = 0 -> "-" with sub "No spend recorded" | exact; spend is synthetic internal snapshot |
| W5 | Follow-ups list | W1 response (reuse, no extra call) + /v1/contacts or /v1/deals refs already used by Tasks | first 5 by due_at asc: title, related name, due chip ("Overdue 12d") | exact |
| W6 | Marketing snapshot | W3 response | spend, conversions, refunds (signed), unknown-source share; meta lines: model, window (lookback_days), as_of | exact |
| W7 | Top campaigns | W3 response rows | aggregateCampaigns, sort revenue desc, top 5, same currency as W3; other currencies listed under "Other currencies" note, never summed | exact |
| W8 | Quick actions | none | open existing New task / New lead dialogs | n/a |

Multi-currency: W3/W4/W7 use the primary currency from deriveKpis and show a sub-line "+N other currency" when others exist (M2: never mix currencies). Models: never sum first_touch + last_non_direct.
Loading/Empty/Error per widget:
- W1/W2 empty value = 0 (valid, not empty); sub "Nothing overdue" / "Nothing due soon". Error: value "-" + Retry.
- W3/W4/W6/W7 empty (no run / rows = []): "No attribution results yet" + sub "Results appear after a calculation run" + link to /app/reporting. as_of null => show "Not calculated yet".
- W5 empty: "No follow-ups due. Add one to stay on track." + New task button.

## 5. Copy (EN / AR)
| Key | EN | AR |
|---|---|---|
| Title | Dashboard | لوحة المتابعة |
| Subtitle | What needs action now and how campaigns are performing | ما يحتاج إلى إجراء الآن وأداء الحملات |
| W1 label / sub | Overdue follow-ups / Past their due time | متابعات متأخرة / تجاوزت موعدها |
| W2 label / sub | Due in next 24 hours / From now | مستحقة خلال ٢٤ ساعة / من الآن |
| capped hint | 50 or more; open Tasks for the full list | ٥٠ أو أكثر؛ افتح المهام للقائمة الكاملة |
| W3 label / sub | Attributed revenue / Last non-direct touch, 30 days | الإيراد المنسوب / آخر نقطة اتصال غير مباشرة، ٣٠ يومًا |
| W4 label / sub | Return on ad spend / Revenue per 1 spent | العائد على الإنفاق الإعلاني / الإيراد لكل ١ منفق |
| W5 title / link | Follow-ups to do / View all tasks | متابعات مطلوبة / عرض كل المهام |
| W6 title | Marketing snapshot | لمحة التسويق |
| W6 meta | As of {time} / Model: {model} / Window: {n} days | حتى {time} / النموذج: {model} / المدة: {n} يومًا |
| W7 title / link | Top campaigns / View full report | أفضل الحملات / عرض التقرير الكامل |
| Empty report | No attribution results yet | لا توجد نتائج إسناد بعد |
| Error | Could not load this section. Try again. | تعذّر تحميل هذا القسم. حاول مرة أخرى. |
| Permission | You do not have access to marketing reports. | ليس لديك صلاحية الوصول إلى تقارير التسويق. |
Model/source names: reuse reporting i18n labels (humanised, never raw enum). AR digits per locale; KPI values via KpiCard `<Ltr>`; money as one Intl.NumberFormat string in `<bdi dir=ltr>` (fixes UX-R2-05/07).
No brand facts invented: copy is functional only; the product name is not repeated.

## 6. Leads KPI strip (UX-09) - PageHeader `subtitle` + `kpis`
Subtitle EN: "Manage and qualify incoming leads" / AR: "إدارة العملاء المحتملين وتأهيلهم". (Reuse existing leads copy if present.)
Exact today: GET /v1/leads cursor pages carry `status` (open|qualified|closed). Counts are exact only when the grid's loaded pages are complete (next_cursor == null); otherwise lower bound `N+` with sub "Loaded so far". Use the grid's existing loaded list; no extra calls.
| Card | Calc | Tone | EN / AR |
|---|---|---|---|
| Open | count status=open | neutral | Open / مفتوحة |
| Qualified | count status=qualified | navy only if > 0 (the one emphasis) | Qualified / مؤهلة |
| Closed | count status=closed | neutral | Closed / مغلقة |
3 cards (not 4) at 1440 in a 3-col grid, gap 12; 375 = 3 compact cards in one row (label 11px wraps, value 20px) or 2+1 if label wraps >2 lines. Filtered view: counts reflect loaded rows, sub "In this view" when a filter is active.
Omitted, NOT faked (G5): Pipeline value (leads have no value), Avg response (no timestamps). Prototype magenta card is NOT reproduced (rule 5, 8). Loading = 3 skeleton cards; Error = strip hidden + grid error already shown; Empty = strip shows 0s.

## 7. NEEDS_API
- N1 GET /v1/dashboard/summary (or ?count=true on lists): totals for tasks overdue/next-24h (remove `50+`), leads by status, open deals count + value per currency, new leads this week.
- N2 Lead value + first_response_at on leads -> Pipeline value and Avg response cards (prototype P-01).
- N3 Deals aggregate by stage (GET /v1/pipelines/{id}/summary: count + sum amount_minor per stage/currency) -> Pipeline-by-stage widget. Not built from loaded deals (sample forbidden v1).
- N4 `?status=` filter + totals on /v1/leads -> exact Leads strip without full paging.
- N5 Task source/automation marker (G10) -> "Automation-created" badge on W5.

## 8. Acceptance - DEV
1. /app/dashboard renders; route text / "built in a later slice" string absent; nav item kept.
2. Only listed calls used; W1/W2 pass `?due=`; W5 reuses W1 data; no list endpoint is paged beyond page 1 on Dashboard.
3. Capped counts show `50+` with hint; no count ever exceeds what the server returned.
4. KpiCard/PageHeader/shared state patterns only; no hex literals; <=2 filled cards, conditions in s3 unit-tested.
5. Per-widget loading/empty/error/permission tested (403 on reports leaves W1/W2/W5 working).
6. Single-currency primary + "other currency" note unit-tested with mixed-currency fixture; refunds signed.
7. Leads strip: counts from loaded list, `N+` when next_cursor present, 3 cards, subtitle present.
8. RTL/LTR + 1440/375: no horizontal scroll at 375; money/IDs in bdi/ltr; keyboard order = reading order; focus ring visible; reduced motion respected.
9. Test ids on each KPI (kpi-overdue, kpi-next24h, kpi-revenue, kpi-roas, leads-kpi-open/qualified/closed).

## 9. Acceptance - CREATIVE re-audit
Capture EN/AR x light/dark x 1440/375 (16 shots incl. Leads). Pass if: one clear first read (Overdue); <=2 filled cards, none when conditions unmet; every number labelled with window/model/as-of; AR bidi clean (no ".ج.م" lead period, no broken meta punctuation); no invented figures (no sample-derived totals); 375 usable without horizontal scroll; empty/error states show a next action; Leads strip matches prototype rhythm (gap 10-12, 76px min height) minus omitted cards; score >= 4/5 vs P-01 on Leads. Then update UX_AUDIT UX-09 and UX-R2-04 to CLOSED.
