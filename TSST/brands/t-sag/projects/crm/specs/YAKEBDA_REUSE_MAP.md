# YAKEBDA MS Code Reuse Map

This document evaluates the potential for reusing code, patterns, and decisions from the `YAKEBDA_MS` repository into the new CRM.

## YAKEBDA decisions we adopt

The following structural and architectural decisions from YAKEBDA_MS are adopted for the CRM:

1. **Strict Tenant and Permission Isolation**  
   *Source:* `PROJECT_DECISIONS.md` (Existing approved decisions)  
   *Application:* The CRM will enforce tenant, branch, and actor isolation via Postgres RLS and Better Auth, treating security as a non-negotiable foundation.
2. **Idempotent and Immutable Financial Events**  
   *Source:* `PROJECT_DECISIONS.md` (D-2026-07-12-05)  
   *Application:* CRM invoicing and billing will use idempotency keys and append-only financial records (reversals instead of edits) to ensure auditability.
3. **Server-Authoritative Quoting**  
   *Source:* `PROJECT_DECISIONS.md` (D-2026-07-12-04)  
   *Application:* The CRM frontend will not calculate final invoice totals. The backend will resolve prices, discounts, and taxes, returning a definitive snapshot.
4. **Separation of Sources and Pricelists**  
   *Source:* `ADR-002-order-sources-channel-menus-pricelists.md`  
   *Application:* The CRM will separate lead/deal sources from pricing rules (e.g., B2B vs. B2C pricing tiers), avoiding duplicated products.
5. **Phased Finance Rollout**  
   *Source:* `ADR-003-sequencing-inventory-drivers-finance.md`  
   *Application:* The CRM will build operational quoting and billing first, delaying any complex ledger or external accounting integrations until the foundation is stable.

## Reuse Evaluation Table

| Need | YAKEBDA Path(s) | Stack / Library | Verdict | Adaptation Effort | Target CRM Batch |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **HubSpot-style grid** (column chooser, reorder, freeze, inline edit) | N/A | N/A | **Skip**. YAKEBDA uses plain HTML `<table>` elements with custom CSS. No advanced grid exists. | N/A | - |
| **Pipeline drag & drop and stage settings** | N/A | N/A | **Skip**. YAKEBDA is a POS/finance system and lacks sales pipeline or kanban modules. | N/A | - |
| **Chart theme** | `apps/admin/src/pages/reports/components/chartSetup.ts`, `ReportChart.tsx` | Chart.js, react-chartjs-2 | **Adapt**. We can reuse the tree-shaking setup and component wrapper, but must rewrite styling for Tailwind. | M | Reporting |
| **Reports/insights** | `apps/admin/src/pages/Reports.tsx`, `reportApi.ts` | React 18, Custom CSS | **Adapt**. The API fetching and dimension-grouping logic is reusable, but the UI needs a complete rewrite. | L | Reporting |
| **Phone/email/url fields and validation** (+20) | N/A | N/A | **Skip**. YAKEBDA relies on basic native HTML inputs without specialized compound validation primitives. | N/A | - |
| **File upload** | `apps/admin/src/pages/menu/ImageUpload.tsx`, `LogoUploadField.tsx` | React 18, DOM API | **Adapt**. The drag-and-drop state machine, size/type validation, and base64 conversion are excellent, though we must swap CSS for Tailwind. | S | Core UI |
| **Date and time pickers** | N/A | N/A | **Skip**. YAKEBDA uses native `<input type="date">`. The CRM needs accessible React Aria pickers. | N/A | - |
| **Tables, empty states and filters** | `apps/admin/src/components/ui/primitives.tsx`, `InventoryLevelsTable.tsx` | React 18, Custom CSS | **Adapt**. Structural patterns like `EmptyState` can be ported, but tables must be rewritten using React Aria `Table` and Tailwind. | M | Core UI |
| **RTL utilities** | `apps/admin/src/global-colors.css`, `theme.css` | Plain CSS | **Skip**. YAKEBDA uses bespoke CSS (`.imgup-box`, `dir="rtl"`). The CRM uses Tailwind 4.3.3 native RTL features (`ms-`, `me-`, `rtl:`). | N/A | - |
| **Robust quoting / pricing logic** | `apps/admin/src/pages/pos/usePosQuote.ts`, `logic.ts` | React Hooks, TS | **Adapt**. The deterministic client-side quote state and rule application can heavily accelerate CRM quote/invoice generation. | M | Quotes / Invoicing |

## Dependency and Licensing Conflicts

- **UI Framework Mismatch:** YAKEBDA MS uses plain React 18 with custom CSS. The CRM mandates **React Aria 1.21.1** for accessible interactivity and **Tailwind 4.3.3** for styling. This means zero UI components can be copy-pasted directly; every visual component requires a structural and stylistic rewrite.
- **Routing:** YAKEBDA uses `react-router-dom`. If the CRM uses a different router (e.g., Next.js App Router or TanStack Router), navigation patterns must be adapted.

## Top 5 Highest-Value Reuses

1. **Server-Authoritative Pricing Logic:** Adapting the POS quoting rules (`usePosQuote.ts`, `logic.ts`) will save significant time in building the CRM's quoting/invoicing engine.
2. **Immutable Financial Events Pattern:** Reusing the architectural decision to enforce idempotency and reversals ensures immediate auditability for CRM billing.
3. **File Upload Handlers:** The `ImageUpload.tsx` logic for drag-and-drop, validation, and Base64 preparation is rock-solid and requires only a CSS swap.
4. **Chart.js Tree-Shaking Setup:** Reusing `chartSetup.ts` ensures the CRM reporting dashboard remains lightweight without re-inventing the bundle optimization.
5. **Empty State and Badge Structures:** The component props and structural layout for `EmptyState` and `Badge` provide a clear blueprint for the React Aria rewrites.

**Realistic Effort Saved:** 
Reusing YAKEBDA MS will save roughly **2-3 weeks** of architectural planning, business logic development (especially around quotes and financial immutability), and basic wiring. However, it saves **zero time on UI development**, as the strict requirement for React Aria and Tailwind means all views and inputs must be built from scratch.
