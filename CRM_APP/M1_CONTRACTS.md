# M1 core CRM — API and local operation

The M1 boundary is the manual CRM slice. Request validation is executable in `src/api.ts`, `src/crm.ts` and `src/transition.ts`; real HTTP/DB fixtures exercise it. All routes below require a current opaque session, active tenant membership or the existing fixed-deal grant, action/object/field permission, and manager MFA evidence. No API provisions privileged sessions or bypasses tenant scope.

Headers: `Authorization: Bearer <local session>`, `X-Tenant-ID`, optional `X-Grant-ID`. Mutations require `Idempotency-Key`; effect-producing JSON commands also require a UUID `command_id`, stable across retry. Replay always reauthorizes and filters current fields. A changed body/key or command conflicts with409. Manual durable receipts and seven-day retry caches are separate. Lists return `data`, `next_cursor`; pass `?cursor=<UUID>` for the next50. Error envelope: `code`, `safe_message`, `request_id`, `retryable`.

| Routes | Contract |
|---|---|
| GET `/v1/session`, `/v1/assignees` | Current actor/capability booleans; tenant-local assignable IDs/display names only |
| GET/POST `/v1/contacts`; GET/PATCH `/v1/contacts/{id}` | Create: `display_name`, optional `source`, `owner_id`, `identifiers[]`. Patch: `expected_version`, allowed name/owner/identifier additions. Identifiers: `kind=phone|email`, `value`, `provenance`; phone is explicit international E.164. Email normalized for candidate lookup. No identity proof or automatic merge |
| GET `/v1/contacts/{id}/duplicates`, `/journey` | Accessible shared-identifier candidates; authorized contact/lead/deal/task and transition audit timeline. Sensitive identifiers need separate permission |
| POST `/v1/contacts/merge-previews` | `source_id`, `target_id`; no command_id because no effect. Returns both versions, conflicts and affected counts |
| POST `/v1/contacts/merges` | Same IDs plus `source_version`, `target_version`, `command_id`.202 completed bounded merge job, preserving source tombstone, original identifier provenance, immutable audits, moved references and bumped child versions. Target fields win explicitly; stale preview409 |
| GET/POST `/v1/leads`; GET/PATCH `/v1/leads/{id}` | Create: `contact_id` OR inline `contact={display_name,source?,identifiers?}`, `title`, `source_evidence`, optional `owner_id`. Source is always manual. Patch title/owner/status=open|qualified|closed plus expected_version |
| GET/POST `/v1/deals`; GET/PATCH `/v1/deals/{id}` | Create contact, optional matching lead, configured pipeline/stage, title/owner/amount_minor/currency. Initial stage must be nonterminal. Patch title/owner/amount/currency plus expected_version; stage writes only through transition command |
| POST `/v1/deals/{id}/transitions`; GET `/history` | Existing M0 command: to_stage_id, expected_version, reason, command_id. Invalid edge422, stale409. Lost requires nonempty reason. Stage audit/event/outbox atomic. First won records one immutable internal commercial-outcome identity; reopening/re-winning adds history, never another outcome |
| GET/POST `/v1/tasks`; GET/PATCH `/v1/tasks/{id}` | Create title/owner/due_at and contact_id or deal_id; both must agree. UTC ISO timestamp required. Patch title/owner/due_at/status=open|completed/outcome plus expected_version. Task deal_id relinking requires crm.write on both task and target deal, with current tenant/assignment checks and matching contact; null unlinks only when a contact remains. Replay rechecks target authority. `?due=overdue|today` (today means next24hours) |
| GET/POST `/v1/pipelines` | GET requires crm.read; POST requires pipeline.manage. POST name, stages[{name,outcome?:won|lost}], transitions[[fromIndex,toIndex]].2–20 stages, <=100 edges. Configurations are immutable after creation; no deletion. UI provides an explicitly synthetic reference; custom configuration uses this route |
| GET/POST `/v1/automations`; PATCH `/v1/automations/{id}` | Manager configures immutable stage_id/title/delay_minutes version. PATCH enabled boolean. No generic workflow builder. One task/run per rule-version/event; current enablement locked before effect |
| GET `/v1/audit`, `/v1/outbox` | Manager-only restricted internal visibility; no raw identifier values/credentials. Outbox pending/retry/processed/blocked/dead and safe error codes |

Unknown fields reject rather than mass-assign. Internal relationship IDs are not writable through PATCH except the explicitly authorized task deal_id change/unlink described above. An owner must be an active direct member with crm.write; reps can create/assign only to themselves. Existing scoped agency grants remain fixed-deal only and cannot broaden to general contact/lead/task access. Assignee display names are the explicit operational directory field policy, not raw contact identifiers.

| Principal | CRM scope | Identifier fields | Merge/config/audit | Worker |
|---|---|---|---|---|
| manager + MFA | Tenant | read/write | Explicit allowed actions | No automation.execute |
| rep | Assigned contact/lead/deal/task | Assigned read/write | Denied | Denied |
| reader | Tenant read | Redacted; writes denied | Denied | Denied |
| agency manager + MFA | Current fixed deal/action grant | No general identifier access | Denied outside grant | Pending effect rechecks grant |
| worker | No normal CRM read/write action | No readable identifier endpoint | No normal management API | Tenant automation.execute; recheck initiating authority/assignment |

Local use: retain M0 setup below, run `npm run migrate`, then `npm run seed` to issue a new synthetic MFA-marked fixture (old sessions are not silently promoted). Run `npm run api` and `npm run worker` in separate terminals. Open loopback port4317, enter tenant/session from ignored `local-fixture.json`, configure the synthetic reference pipeline, then Contacts → Leads → Deals → Follow-ups. The old transition demonstration remains `/foundation` for its unchanged visual regressions. Never copy fixture credentials or native data to Drive.

Migration/recovery:001 remains immutable;002 adds CRM tables/fields/RBAC;003 finite typed ledger reference guards and agency MFA;004 deferred related-contact checks and explicit scheduled-worker authority;005 fail-closed protected-key validation and owner-only explicit provisioning, preserving existing key/ciphertext. Upgrade is additive and serialized by the existing migration lock. Failed migration rolls back. Keep the matching database/configuration backup; restore it with M0 recovery tooling for rollback—do not drop new columns against populated data. Runtime cannot update/delete audit/history/receipts/rule versions. No production availability/RPO/RTO claim.

Operational limits: local synthetic sessions demonstrate enforcement, not a deployed identity provider/MFA enrollment system. Identifier encryption keys are tenant-specific in a protected DB table; external key custody/rotation is a deployment follow-up. Native PG is proven; Docker and Drive dependency installation remain unverified. No external integrations, real customer data, hosting, exports, generic automation or M2+ features are introduced.
