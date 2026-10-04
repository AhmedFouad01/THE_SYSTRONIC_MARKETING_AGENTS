# Systronic CRM — MVP Core Task Flows


Status: Wave 1 / UX-01
Owners: TSST Lead + CREATIVE_AG


## 1. Review a new lead


Start: Home work queue or Leads view.
Path: open Leads → filter/open records → preview lead → review source/evidence/owner/contact → update owner/status or continue to deal.
Completion: lead has an explicit reviewed state/next action.
Recovery: denied → return to accessible list; conflict → reload latest and review proposed change; validation → keep draft and identify field.


## 2. Find/open a contact


Start: global search or Contacts.
Path: search/filter → open preview → review identity, journey and related sales objects.
Completion: correct contact context is established.
Recovery: no match → explicit empty/create path if authorized; sensitive fields remain permission-gated.


## 3. Convert/work a lead into a deal


Start: lead preview.
Path: confirm contact → Create Deal → select pipeline and valid stage → set title/owner/amount/currency → save with lead linkage.
Completion: deal exists in the intended pipeline/stage linked to the same contact/lead.
Recovery: invalid stage, reference mismatch or permission denial produces no partial mutation and preserves the draft where possible.


## 4. Move a deal through pipeline stages


Start: pipeline or deal preview.
Path: locate deal → choose allowed transition → provide reason → submit expected version → show new stage/history.
Completion: deal reaches intended stage and transition appears in history.
Recovery: version conflict reloads latest state; disallowed transition explains valid next stages; network retry preserves command identity.


## 5. Create/complete follow-up


Start: Tasks, Contact or Deal.
Path: create task → select owner/title/due time → task appears in view → open → complete/update.
Completion: follow-up is explicitly completed or updated.
Recovery: missing reference, invalid assignment or version conflict preserves context and avoids partial mutation.


## 6. Review customer journey


Start: Contact → Journey or Insights → Journey.
Path: select contact → read chronological evidence → distinguish occurred vs received time → paginate without losing contact context.
Completion: user understands available journey evidence.
Recovery: no evidence is an explicit empty state; denied evidence keeps contact context visible.


## 7. Inspect conversion/campaign reporting


Start: Insights.
Path: open campaign performance or conversions → keep model/version/lookback/as-of visible → review summary → drill into conversion/order evidence → inspect unknown/unattributed/unpublished states.
Completion: user can trace result to internal evidence and understand attribution basis.
Recovery: unpublished run, stale run and disconnected provider attribution each have explicit states/actions.


## 8. Manager/admin oversight


Start: Home or permission-gated secondary navigation.
Path: review scoped queues → configure pipelines/automation only with pipeline.manage → audit/outbox only with audit.read → reporting only with report.read → calculate only with report.calculate.
Completion: oversight/configuration is completed without exposing unauthorized data.
Recovery: unauthorized functions are not promoted as normal available actions; direct attempts show clear denied state.


## Cross-flow rules


1. Preserve active list/view/filter/scroll while previewing records.
2. Arabic RTL and English LTR remain equivalent.
3. Every shortcut has a visible UI path.
4. No UX path bypasses RLS/RBAC/object grants.
5. No provider integration is implied.
6. High-impact actions require prevention/confirmation/recovery.
7. Command palette accelerates existing visible actions; it does not create hidden-only functionality.


## Wave 1 acceptance


All eight core tasks have defined start, completion and recovery states. This is the input to UX-02 Interaction Architecture, not final high-fidelity UI.