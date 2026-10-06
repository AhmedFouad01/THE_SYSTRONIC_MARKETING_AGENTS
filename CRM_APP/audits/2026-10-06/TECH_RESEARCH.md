# TECH_RESEARCH — dynamic object/property CRM: architecture, libraries, skills, interaction patterns

Date 2026-10-06 (all web access 2026-10-06). Author: LENS_AG (TSST marketing/research) for DEV_AG ADR-002. Status: research only; nothing installed, no sign-ups, no spend. Readiness NOT_READY.
Skills applied (all UNVALIDATED): TSST-LENS-SK-001 (decision-first question framing), SK-002 (source/claim grading), SK-003 (competitor comparison, OBSERVED/INFERRED/UNKNOWN labels).
Our baseline (verified in `CRM_APP/package.json`): runtime deps = `pg 8.23.1` only; React 19.3.0, Vite 8, TS 7, Vitest 5. So the UI has NO component/grid/dnd dependencies yet: every pick below is a new, exact-pinned dependency and must pass a BUILD test before adoption.

Grades: A = vendor/official current primary (docs, npm registry metadata, repo); B = reputable secondary or snippet of primary seen through the search tool; C = aggregator/unverified. Labels: [O] observed, [I] inferred, [U] unknown. Registry facts (versions, licenses, peers) come from `npm view` (read-only metadata query, A).

## 1. Executive summary (picks)

| Area | Pick | Runner-up | Reject | Key reason |
|---|---|---|---|---|
| Data architecture | Hybrid, as ADR-002 option D: property registry + typed real columns for system fields + JSONB `custom` + ONE server-side query compiler; optional typed side-index table for hot properties (spike) | none | Per-tenant DDL (Twenty/Baserow style); pure EAV | Our runtime role cannot run DDL, RLS is per-row, DB-level integrity must stay; evidence section 3 |
| Data grid | TanStack Table 9.2.6 (MIT, headless) + TanStack Virtual 3.14.13 | AG Grid Community 36.2.0 (MIT) | Glide Data Grid 6.0.3 | Own markup = full logical-CSS/bidi control; Glide peers React <=18 and is canvas (no DOM a11y/bidi) |
| Drag & drop | dnd-kit (`@dnd-kit/core` 6.3.1 + `@dnd-kit/sortable` 10.0.0), plus mandatory non-drag "Move to..." alternative | `@dnd-kit/react` 0.5.0 (pre-1.0); Atlassian pragmatic-dnd 4.0.0 | react-beautiful-dnd family | Built-in KeyboardSensor + screen-reader announcements; RTL horizontal behavior must be tested [U] |
| Headless UI primitives | React Aria Components 1.21.1 (Apache-2.0) | Base UI 1.8.0 (MIT); Ark UI 5.39.3 (MIT) | build-from-scratch | Only option with documented RTL keyboard navigation, 30+ locales incl. Arabic, Intl number/date, DnD a11y, official agent skill |
| Fetch/cache/optimistic | TanStack Query 5.104.1 (MIT) | SWR 2.5.1 | hand-rolled fetch hooks | Mutation lifecycle (`onMutate/onError/onSettled`) fits `expected_version` 409 rollback; infinite queries fit cursor lists |
| Forms/validation | React Hook Form 7.89.0 + Zod 4.6.5; schemas GENERATED from the property registry | Valibot 1.5.0 (smaller bundle) | - | Dynamic per-object property forms; same registry-built validator can run on server |
| Filter builder UI | react-querybuilder 8.24.3 (MIT), producing a JSON rule AST only | custom filter-chip UI on React Aria | using its `formatQuery` SQL output | Server compiles the AST with an allowlist; never trust client SQL |
| Formula engine | In-house: `jsep` 1.4.0 (MIT) parse -> whitelisted AST evaluator; computed on server, stored value | `filtrex` 3.1.0 (MIT) | HyperFormula 3.4.0 (GPL-3.0-only), expr-eval 2.0.2 (stale), mathjs | GPL = commercial flag; safe by construction; P3 only |
| Animation | CSS first; `motion` 14.0.0 (MIT) only via lazy subset for layout/drag animation | - | page-wide framer usage | Bundle + reduced-motion |
| Server query building | Raw `pg` + small parameterized compiler (~property->SQL-expression map) | Kysely 0.29.6 as pure SQL builder only if compiler grows | Drizzle 0.45.3 | No ORM needed; RLS `set_config` per tx must remain ours |
| Skills (BUILD gap) | Import via SK-023: React Aria skill, TanStack Intent skills, Supabase postgres-best-practices, Vercel web-design-guidelines + react-best-practices; author in-house RTL/bidi QA skill | wshobson wcag-audit-patterns | bulk aggregator packs | Section 4 |

Top 3 risks: (1) TanStack Table v9 is a new major (still ships, 9.2.6) while our team has no v8 experience to lean on; (2) RTL behavior of grid pinning/dnd horizontal sorting is UNVERIFIED for every library: must be a BUILD spike gate; (3) JSONB planner blindness at 1M rows (Heap) needs the hot-property promotion path from day 1.

## 2. Q1 — Architecture: how leading CRMs do objects/properties/views

| System | Storage pattern | Metadata | Query/filter engine | Views / associations / formulas | Evidence (grade) | Fit for us |
|---|---|---|---|---|---|---|
| Twenty (AGPL core, `/ee` commercial, TS/NestJS/React/PG) | DDL: dedicated PostgreSQL schema PER WORKSPACE; every object = real table, every field = real column (composite types flattened); `search_path` per datasource | `objectMetadata`, `fieldMetadata`, view, view filter/sort, page-layout entities; cached in memory; "metadata version counter" invalidates | Metadata -> generated GraphQL schema (filters, order-bys, aggregations, group-bys) -> TypeORM expressions; same engine feeds REST + MCP | Fields auto-create views/search vectors/relation companion fields; migrations run as transactional "flat-entity diff -> side-effects -> handler registry" pipeline | [O] pyshine source tour (B, secondary reading of repo); docs.twenty.com custom-objects (A, thin: 3 tables DataSource/Object/Field, no migration detail); repo page (A): 58k stars, AGPL, Jotai+Linaria | Study for metadata->UI design only. Per-tenant DDL conflicts with our no-DDL runtime role, composite-FK RLS and exact-pinned simplicity. AGPL: code reuse is a licensing risk (flag), do not copy |
| Attio (closed SaaS; stack per StackShare: Node/TS/React/PG) | [U] internal storage not published; no engineering post found | Public model: Objects, Lists (with own attributes), Records, Attributes (17 types incl. status, select, rating, currency, record-reference, actor-reference, interaction) | [U] | Values carry `active_from/active_until` (history kept, "most endpoints return only active values"); `is_multiselect` flag on attributes; "attributes behave differently when creating, viewing, filtering and sorting" | docs.attio.com (A for API shape); StackShare (C) | Copy the PUBLIC model, not internals: Lists = per-collection attributes on top of records is a strong pattern for pipelines/boards (deal pipeline = list with `stage` attribute). Value history = ADR-002 "field history P2" |
| HubSpot (closed) | [U] internal; API shows property-centric model | Objects (standard + custom, Enterprise only), properties with `type` + `fieldType` (string/text default), groups; association labels (Pro/Ent) | Search API on properties; calculated properties Pro/Ent | Association schema API (v4) with category/typeId/label and `maxToObjectIds` limits; custom objects auto-associate to notes/tasks/calls/etc. Numeric limits are subscription-dependent and NOT published in the KB page [U] | developers.hubspot.com schemas/associations guides (A); knowledge.hubspot.com limits (A, no numbers) | Property = (type, fieldType) split matches ADR-002 "single-select with display dropdown\|radio". Associations as first-class labeled links = P2 |
| Salesforce (closed, published architecture) | Shared schema: one wide `MT_Data` table with `Value0..ValueN` flex columns (all variable-length strings); typed pivot tables (e.g. `Indexes`) synchronously copy indexed field values into typed columns | Universal Data Dictionary: objects/fields/triggers exist only as metadata rows (`MT_Objects`, `MT_Fields`) mapping fields to slots | Runtime metadata compiler/optimizer plans queries using tenant-aware statistics; "pivot index" for selective filters | Formula fields computed at read time from metadata; strong limits regime (large-data-volume guidance) | developer.salesforce.com multitenant architecture + architect.salesforce.com + Weissman SIGMOD paper (A) | Validates: (a) registry as single truth, (b) generic storage needs a typed side-index for performance. Our version: JSONB + expression indexes or a typed `property_index` side table (decide in spike) |
| Baserow (MIT core) | DDL: each Baserow table = a real PostgreSQL table; each field = column `field_<id>`; `database_table`/`database_field` metadata | Field-id based column naming (rename-safe) | SQL over real columns | Documented limits: PostgreSQL 1600-column ceiling hit when columns are changed often (type change leaves backup column for undo); internal search columns | Community.baserow.io + docs (A/B) | Confirms DDL-per-field works but brings column ceilings, backup columns, lock risk; `field_<id>` stable naming is a good idea for JSON keys too (use immutable property id/key, label separate) |
| NocoDB | Metadata DB (`nc_*` tables) layered over the user's existing databases; schema untouched unless user creates tables | Introspection + own metadata (views, column display, ACL) | Translates UI edits to SQL against the real schema | Views are metadata only | nocodb.com architecture doc (A) | Relevant idea: views/column-display state live in metadata, not in data. We already have this (ViewState) |
| EspoCRM (GPL) | Entity Manager defines entities in metadata JSON, then "Rebuild" creates real DB tables/columns (MySQL) [I from product knowledge; blog fetch did not confirm] | JSON metadata files + DB | ORM over real columns | Formula scripting language built in; just shipped an MCP server (2026-09-30) | espocrm.com blog (B, no architecture detail) | Same DDL family. Low incremental insight; GPL |

### Pattern comparison (our decision)

| Pattern | Used by | Filter/sort cost | Integrity/RLS | Ops cost | Verdict for us |
|---|---|---|---|---|---|
| Real columns / tables via runtime DDL | Twenty, Baserow, EspoCRM | Best (native stats, indexes) | Best | Needs DDL privileges, per-tenant migrations, cache invalidation, 1600-column ceiling, lock risk | Reject (no-DDL role, schema-per-tenant vs RLS-per-row, rollback of DDL) |
| Flex columns + pivot index | Salesforce | Good via pivot tables; strings everywhere | Soft | Heavy custom optimizer | Take the idea of a typed side index only |
| EAV rows | many; Attio-like value tables are [U] | Poor with N joins for N filters | Soft | Heavy | Reject for main path (ADR-002 agrees) |
| JSONB per record + registry | common in modern SaaS | Fine at 50k; needs GIN + expression indexes at 1M | Inherits table RLS, record-level `version` | Low | Pick (ADR-002 D) |

JSONB evidence: PostgreSQL keeps no per-key statistics for JSONB values so the planner falls back to default selectivity (Heap: 300 ms with columns vs 584 s with JSONB for one join query; JSONB table 164 MB vs 79 MB; rule of thumb "extract keys present in more than ~1/80 of rows") (B: single vendor case study, extreme example, but mechanism is real). Mitigation to spike in P1-S10 [I]: expression indexes on hot properties (ANALYZE gathers statistics for expression indexes), promote hot properties to generated columns, cap property count (ADR limit 100), keep filter AST depth/conditions limits.

Formula fields (all systems): stored/computed outside the filter path or computed at read time; Salesforce computes at read time. Pick: compute on write server-side into `custom` (filterable/sortable like any property), dependency graph capped; P3.

View definition (consensus pattern from Twenty/Attio/NocoDB/HubSpot): a view = (object, ordered visible property ids + widths, filter tree, sorts, grouping, density/page size, owner, shared flag, default flag). Store property IDs, never labels. Our `ViewState` already matches; add `groupBy` for board views.

## 3. Q2 — Libraries per category (versions/licenses from npm registry, grade A; exact-pin at BUILD time)

### 3.1 Data grid
| Option | Version / license | React 19 | RTL / a11y evidence | Bundle/complexity | Notes |
|---|---|---|---|---|---|
| TanStack Table + Virtual | 9.2.6 MIT / 3.14.13 MIT | peer react >=18 [O] | Headless: we own DOM, `role=grid`, logical CSS. v9 docs mention column pinning/visibility/ordering/sizing/resizing as opt-in features; RTL pinning semantics [U] (v8 pins `'left'\|'right'` physically: map start/end ourselves) | v9 tree-shakable: "~6-7 kB for small tables vs 15-20 kB v8" (B, docs snippet, not measured by us) | Ships agent skills in-package (section 4). New major: risk of churn |
| AG Grid Community | 36.2.0 MIT | peer includes 19 | Real RTL: `enableRtl=true`, mirrored columns, pinned scrollbar side; BUT initial-only (language switch recreates the grid) (A) | Large (21.6 MB unpacked package; gzip size [U]); many useful features (row grouping, column menus, set filters, master-detail, integrated charts, server-side row model) are Enterprise = commercial: FLAG | Fastest to feature-rich grid; fights our UI_R4 visual spec and bidi `<bdi>` cell rules |
| Glide Data Grid | 6.0.3 MIT | peer react <=18.x only (blocks React 19) | Canvas rendering: no DOM a11y, bidi text shaping [U] | - | Reject |
| Others not evaluated: MUI X DataGrid (community MIT, Pro/Premium commercial), react-data-grid (MIT) [U] | | | | | Candidates only if TanStack spike fails |

Pick: TanStack Table 9 + Virtual in manual (server-side) mode: server owns filter/sort/cursor (ADR F-01/F-02), client virtualizes rows and maps `ColumnDef[]` from the property registry. Gate: BUILD spike must prove 10k rows scroll, column reorder, hide, keyboard cell navigation (grid roving tabindex), Arabic+Latin mixed cells.

### 3.2 Drag and drop
| Option | Version / license | Keyboard + SR | RTL evidence | Notes |
|---|---|---|---|---|
| dnd-kit legacy (core/sortable) | 6.3.1 / 10.0.0 MIT; last publish Dec 2024 | KeyboardSensor + live-region announcements built in (A docs) | Horizontal strategies not documented for RTL; a dnd-timeline project reports `dir="rtl"` works (C) [U for us] | Stable API, huge install base; maintenance quiet |
| `@dnd-kit/react` | 0.5.0 MIT (2026-09-12), peers 18/19 | Same family, new architecture (sensors/plugins/modifiers, DragDropManager) | [U] | Pre-1.0: pin exact, expect API breaks |
| Atlassian pragmatic-drag-and-drop | 4.0.0 Apache-2.0 | Core is native HTML5 DnD: no built-in keyboard; Atlassian provides a11y guidelines + optional packages; we must build the keyboard path (A, thin) | [U] | Smallest/fastest, framework-agnostic; more build effort for our hard a11y criterion |
| React Aria DnD (inside RAC) | within 1.21.1 | Best-documented: Enter to grab, Tab between drop targets, arrows pick insertion position, Esc cancel, SR announcements, explicit drag-handle affordance (A) | Inherits RAC RTL keyboard handling | Covers lists/tables/listbox/gridlist reorder; has NO kanban component |

Pick: dnd-kit for kanban + column reorder (it handles multi-container and sensors); use React Aria DnD semantics (drag handle + keyboard) for list reorder inside chooser popovers if RAC is adopted. Regardless of library: every drag operation needs a non-dragging alternative (menu "Move to stage...", "Move left/right") for WCAG 2.2 SC 2.5.7 Dragging Movements (AA) and for touch/keyboard (A, W3C criterion).

### 3.3 Headless accessible primitives (RTL/i18n)
| Option | Version / license | RTL/i18n evidence | Components relevant to CRM |
|---|---|---|---|
| React Aria Components | 1.21.1 Apache-2.0 | 30+ locales incl. Arabic; `I18nProvider`/`useLocale`; RTL keyboard nav; locale-aware date/number via `@internationalized`; docs tell to use logical CSS (A) | ComboBox, Select, Menu, Popover, Dialog, Table, GridList, ListBox, TagGroup, DatePicker, Tabs, Toast, Autocomplete/command-style, DnD |
| Base UI | 1.8.0 MIT (stable since rc.0 in 2026-07) | Accessibility doc (A); RTL provider evidence not found in this pass [U] | Menu, Combobox, Dialog, Popover, Field/Form; peer deps include `date-fns` |
| Ark UI (Zag) | 5.39.3 MIT | [U] (Zag has locale/direction context; not confirmed here) | Large set incl. combobox, tags-input, date-picker |
| Radix Primitives | `@radix-ui/react-popover` 1.2.0 MIT | `DirectionProvider` makes all primitives honor `dir` (A) | No Table/GridList/DnD; no number/date i18n |

Pick RAC. Caveat [I]: adds ~one bundle chunk per component; import per component path. Pair with our own CSS (logical properties) to keep UI_R4 visual spec.

### 3.4 Data fetching / forms / query UI / formula / animation / server
| Category | Pick (version, license) | Why tied to our constraints | Rejected + reason |
|---|---|---|---|
| Fetch/cache | TanStack Query 5.104.1 MIT | `useMutation` optimistic update + rollback on 409 (`expected_version` conflict) then refetch; `useInfiniteQuery` for cursor lists; query keys = (object, view, filters) | SWR 2.5.1: lighter, weaker mutation/optimistic ergonomics for our conflict flow |
| Forms | RHF 7.89.0 MIT + Zod 4.6.5 MIT | Build Zod object from `property_definition` at runtime; same registry drives server validation (server currently has no validator lib: write a mirrored allowlist validator or share a tiny schema module) | TanStack Form 1.33.5 (viable, younger); Valibot 1.5.0 if bundle bites |
| Filter UI | react-querybuilder 8.24.3 MIT (React >=18, Redux Toolkit dep: size [U]) | Nested AND/OR, custom operators, i18n translations, DnD of rules; used only as an editor of OUR JSON AST | Using its SQL export (injection surface); custom-build if RAC-styled chips suffice for P1 |
| Formula | `jsep` 1.4.0 MIT + own evaluator; or `filtrex` 3.1.0 MIT | Whitelist functions, no property access, step/length limits, deterministic, same code client preview + server truth | HyperFormula 3.4.0: GPL-3.0-only; commercial/proprietary use needs a paid licence from Handsontable (A, docs) = COMMERCIAL FLAG. expr-eval 2.0.2: last release 2022 (maintained fork `expr-eval-fork` 3.0.3; historical prototype-pollution advisories [U, recheck]). json-logic-js 2.0.5: fine for rules/conditions, not arithmetic formulas UX. mathjs 15.2.0 Apache: heavy, broad surface |
| Animation | CSS transitions + `motion` 14.0.0 MIT (lazy features) | Reduced-motion respect; UI_R4 panel slide is CSS-doable | Whole-page framer-motion |
| Server SQL | Raw `pg` + compiler: registry allowlist -> parameterized SQL expression (`custom->>'key'` cast by type), keyset cursor `(sort_value, id)` | RLS tx wrapper unchanged; no new abstraction over `set_config` | Drizzle 0.45.3: schema-first, poor fit for runtime-defined JSONB properties. Kysely 0.29.6 (0.x): usable as dialect-agnostic SQL builder with `sql` templates; defer unless compiler > ~300 lines |

## 4. Q3 — Agent skills for BUILD/STUDIO gaps (do NOT install; adoption via TSST-CTX-SK-023 + BUILD test)

| Candidate | Source | Covers | License / trust | Recommend |
|---|---|---|---|---|
| React Aria agent skill + MCP + llms.txt | react-aria.adobe.com/ai (`npx skills add https://react-aria.adobe.com`) | Correct RAC usage, a11y/RTL-aware patterns | Vendor (Adobe), Apache-2.0 lib; skill licence [U]. Trust: high (A) | IMPORT if RAC picked: best RTL/a11y coverage |
| TanStack Intent skills | shipped inside `@tanstack/table-core` etc. (`npx @tanstack/intent@latest install` writes into AGENTS.md/CLAUDE.md) | Table v9 core architecture, feature registration, migration, adapters | Vendor, MIT. Trust: high (A). Note installer edits agent config files: run only in a sandbox, review diff | IMPORT (versioned with the package) |
| supabase/agent-skills `supabase-postgres-best-practices` | github.com/supabase/agent-skills | 8 areas incl. schema design, indexes, RLS, locking, connection mgmt | MIT repo, 2.7k stars, pushed 2026-10-02 (A). Supabase-flavored | IMPORT for DEV_AG schema/JSONB-index/RLS reviews after trimming Supabase-specific rules |
| vercel-labs/agent-skills `web-design-guidelines` (100+ rules a11y/UX/perf), `react-best-practices` (40+ rules), `composition-patterns`, `react-view-transitions` | github.com/vercel-labs/agent-skills (32k stars) | UI audit checklists, React perf patterns (Next.js-leaning) | Repo licence NOT declared via GitHub API [U]: verify LICENSE before import. Trust: medium-high (A) | IMPORT as read-only audit references (closes the "no frontend-UI skill" gap partially); skip Next/deploy skills |
| anthropics/skills `frontend-design`, `webapp-testing`, `web-artifacts-builder` | github.com/anthropics/skills (180k stars) | Visual design direction; Playwright-based UI testing; artifact building | Per-skill licences (repo-level none via API) [U]. Trust: high | `webapp-testing` useful for BUILD UI evidence; `frontend-design` for STUDIO only (aesthetic, not RTL-aware) |
| wshobson/agents `wcag-audit-patterns` | github.com/wshobson/agents (40k stars, MIT) | WCAG audit patterns; our target is 2.2 and the listing says 2.1 [B] | MIT, community, medium trust | Reference only; adapt to 2.2 |
| accesslint-audit (WCAG 2.2, report + fix mode) | via sickn33/agentic-awesome-skills aggregator (C) | Report/fix loop with verification | Aggregator, provenance unclear; may run tools | Do not import before provenance + script review |
| i18n-localization / internationalization skills | sickn33 aggregator, secondsky/claude-skills (C) | i18next/Intl, ICU, generic RTL notes | Community, LTR-first; nothing Arabic-bidi-specific found [O] | Do NOT import; GAP remains |

Findings: (1) no third-party skill found for Arabic/Egyptian bidi QA, data-grid property registries, or RTL drag-and-drop: write two in-house skills (TSST RTL/bidi QA derived from UI_R4_SPEC section I and its CSS grep rule; "property-registry -> grid/view" implementation) via SK-023. (2) Any third-party skill can carry scripts/instructions: treat as untrusted code: pin commit SHA, read every script, no auto-installers, run BUILD test with a known-bad prompt set. (3) Registry listing sites (skills.sh, claudemarketplaces, vibeindex, tessl) are discovery only (C), never trust source.

## 5. Q4 — Interaction patterns to copy (with best-in-class references and our constraint)

| Pattern | Reference products [observed from public docs/marketing unless noted; UI behavior not re-tested by us] | Implement as | RTL / a11y requirement |
|---|---|---|---|
| Kanban drag between stages | HubSpot deal board, Attio list kanban, Twenty kanban view (A: product docs) | dnd-kit multi-container; stage change goes through existing transition command (guard, audit, outbox); optimistic move + rollback on 409/guard failure | Entry travels start->end per UI_R4 table; keyboard: Space grab, arrows move, Esc cancel, live announcements; plus card menu "Move to stage" (SC 2.5.7) |
| Column drag reorder + show/hide chooser | Attio, Twenty, Notion/Airtable-style property menus | Popover with checkbox list + drag handle (already in UI_R4 section on chooser); header drag secondary | Handle is a focusable button; arrow-key reorder; order persisted in saved view (property ids) |
| Inline cell editing | Airtable, Attio, Twenty table | Enter/F2 to edit, Esc cancel, Tab to next editable cell; type-specific editor from registry; optimistic with `expected_version` | `dir="auto"` per value (UI_R4 I); editing never reflows bidi text; announce save errors |
| Side preview / peek panel | Attio record side panel, HubSpot preview sidebar | Already specified: fixed physical-right dock in both languages (UI_R4) | Focus trap off (non-modal) or dialog semantics per spec; Esc closes |
| Command palette (Cmd/Ctrl+K) | Linear, Attio, Twenty, Raycast-style | RAC Autocomplete/ComboBox in a Dialog, or `cmdk` 1.1.1 (MIT, last release 2025-08) [U for RTL] | Verify Arabic IME composition and search normalization (alef/hamza/ta marbuta) |
| Saved views + tabs | HubSpot saved views, Attio views, Notion databases | Views dropdown in toolbar, private/shared/default, dirty-state "Save / Save as new" | Store property ids; unknown ids skipped gracefully when a property is archived |
| Filter chips + advanced builder | HubSpot advanced filters, Attio filters | Chips for simple; nested AND/OR in popover (react-querybuilder) | Operators/labels translated, values bidi-isolated |
| Optimistic updates | Linear-style instant feel | TanStack Query onMutate; visible pending state on rows; conflict toast with "reload row" | `aria-live=polite` for status |

## 6. Recommended target stack (for BUILD test plan, exact pins at install time)

Client: React 19.3.0, TanStack Table 9.2.6 + Virtual 3.14.13, TanStack Query 5.104.1, React Aria Components 1.21.1, dnd-kit 6.3.1/10.0.0 (revisit `@dnd-kit/react` at 1.0), RHF 7.89.0 + Zod 4.6.5, react-querybuilder 8.24.3 (JSON AST only), CSS logical properties + CSS transitions, `motion` 14.0.0 lazy only where needed. Server: Node 24 + `pg 8.23.1`, `property_definition` registry, hand-written filter/sort compiler (allowlist, parameterized, keyset cursor), expression indexes for hot properties, optional typed `property_index` side table decided by the P1-S10 spike. Formula (P3): `jsep` + own whitelist evaluator.
Adoption rule (Radar): each row below is `adopt -> BUILD test`, nothing enters `package.json` before its test passes.

| Candidate | BUILD test (pass criteria) | Owner |
|---|---|---|
| TanStack Table 9 + Virtual | 10k-row server-mode grid; column add/hide/reorder; keyboard cell nav; AR+EN mixed cells; bundle delta recorded; Playwright RTL screenshots | DEV_AG |
| React Aria Components | RTL keyboard nav in Menu/Combobox/Popover; Arabic digits/dates; focus return; CSS stays logical | DEV_AG + CREATIVE_AG |
| dnd-kit | Kanban + column reorder under `dir=rtl`, keyboard path with announcements, "Move to..." fallback, 409 rollback | DEV_AG |
| TanStack Query | Optimistic edit + version conflict rollback + cursor infinite list | DEV_AG |
| Filter compiler + react-querybuilder | Injection test corpus, AST depth/condition limits, 1M-row EXPLAIN on indexed vs unindexed property | DEV_AG (ADR-002 P1-S10) |
| Formula (P3) | Fuzz: no property/prototype access, step limit, deterministic | DEV_AG |

## 7. Risks and unknowns

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | RTL behavior of grid pinning, dnd horizontal sorting, RQB layout unverified for every library | High | BUILD RTL gate before adoption; fallback AG Grid Community for grid |
| R2 | TanStack Table v9 new major (churn, fewer community answers) | Medium | Pin exact; isolate behind our `gridModel`; v8 as fallback |
| R3 | JSONB planner statistics at 1M rows (Heap case is an extreme single-vendor example) | High | Spike with EXPLAIN; expression indexes/promotion path; limits |
| R4 | Licences: HyperFormula GPL/commercial; Twenty AGPL (+ `/ee` commercial); AG Grid Enterprise features commercial; Radix/others MIT fine | Medium | No GPL/AGPL code in product; flagged in table |
| R5 | `@dnd-kit/react` pre-1.0 and legacy dnd-kit unmaintained since 2024-12 | Medium | Pin legacy now; track 1.0; pragmatic-dnd as plan B |
| R6 | Third-party skills are executable-instruction supply chain | Medium | SK-023 quarantine, SHA pin, script review |
| R7 | Dependency count rises from 0 UI deps to ~10 with a bundle budget not yet defined | Medium | Set budget (e.g. gz KB per route) before BUILD tests; measure, not trust docs claims |
| U1 | Attio and HubSpot internal storage not public; competitor storage claims are [U] | Low | Only public API model used |

## 8. Sources (grade, access 2026-10-06)

| # | Source | Grade | Used for |
|---|---|---|---|
| 1 | npm registry metadata (`npm view`) for all packages named | A | versions, licenses, peers, last publish |
| 2 | docs.twenty.com custom-objects; github.com/twentyhq/twenty | A | metadata tables, AGPL, stack |
| 3 | pyshine.com Twenty Metadata Engine Source Tour | B | schema-per-workspace, migration pipeline, caches (secondary reading of source) |
| 4 | docs.attio.com attribute-types, data model help pages; StackShare Attio | A / C | attribute types, value history, stack |
| 5 | developers.hubspot.com schemas + associations guides; knowledge.hubspot.com data limits | A | properties/associations model, tier limits |
| 6 | developer.salesforce.com + architect.salesforce.com multitenant architecture; Weissman SIGMOD p889 | A | MT_Data flex columns, UDD, pivot index |
| 7 | community.baserow.io column/cell limits; baserow.io database-plugin docs | A/B | field_<id> columns, 1600 limit |
| 8 | nocodb.com architecture docs | A | metadata-over-existing-DB |
| 9 | espocrm.com blog | B | MCP server date only; entity-manager mechanism [I] |
| 10 | heap.io "When to avoid JSONB" | B | JSONB stats/space evidence |
| 11 | ag-grid.com RTL docs | A | enableRtl, initial-only |
| 12 | react-aria.adobe.com quality#internationalization, /dnd, /ai | A | i18n, DnD a11y, skill |
| 13 | atlassian.design pragmatic-drag-and-drop; dndkit.com | A (thin) | features |
| 14 | base-ui.com accessibility; radix-ui.com DirectionProvider | A | a11y, direction |
| 15 | tanstack.com/table docs (migrating, agent-skills) | A/B | v9 features, Intent skills |
| 16 | react-querybuilder.js.org | A | features |
| 17 | hyperformula.handsontable.com licensing | A | GPLv3 vs commercial key |
| 18 | GitHub API: vercel-labs/agent-skills, anthropics/skills, supabase/agent-skills, wshobson/agents | A | stars, licence field, skill directory |
| 19 | claudemarketplaces / vibeindex / skillselion / tessl / claudeskills.info listings | C | discovery only |
| 20 | Repo files: CRM_APP/package.json, ADR-002, UI_R4_SPEC.md | A (ours) | baseline |

Not fetched/unverified: Attio and HubSpot internals; library gzip bundle sizes; RTL behavior of dnd-kit, TanStack v9 pinning, RQB, cmdk; WCAG 2.2 SC 2.5.7 cited from W3C knowledge without fetch this session (B).
