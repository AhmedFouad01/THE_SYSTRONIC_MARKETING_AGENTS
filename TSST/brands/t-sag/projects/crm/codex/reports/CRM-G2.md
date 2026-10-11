# CRM-G2 — R09 complete
Commit: 552d120438dbe1afa9d6878cd35ca29f8372e548 (feat/crm-review-fix2; 35 scoped files).
Runtime: Codex; dispatched gpt-6.1-sol/high (no runtime introspection).
Migration: 028_contact_system_properties.sql; migrate.ts updated; additive populated rehearsal preserves counts/ciphertext.
R09 done-when: Email/Phone system properties on contacts/leads; Company/Job title on contacts; default grids/panels/create/edit fields.
Permissions: masked without sensitive.read; lead/contact row gates; assigned reps verified; actions absent while masked.
Storage: identifiers remain encrypted, historical values/provenance retained; company/title encrypted; custom-key collisions preserved via system_field.
Validation/actions: email/phone(+20 default)/url on client/server; normalized mailto/tel/WhatsApp with recipient URI encoding.
D green: lint 389 files; typecheck 2 configs; unit 693/693 (71 files); build pass; full DB 219/219, 0 failed/skipped.
DB log: C:/Work/crm-g2-db-final.log (289.49s); migration repeat, collision, RLS, masking, patch/import rollback and dedup covered.
API contract: CRM_APP/docs/R09_CONTACT_FIELDS.md; fixed import remains email/phone; company/title use create/edit/scalar APIs.
Skills used: TSST-DEV-SK-006, TSST-DEV-SK-005, TSST-DEV-SK-011; skill_friction: none. No push/merge/bus mutations; prior untracked paths preserved.
