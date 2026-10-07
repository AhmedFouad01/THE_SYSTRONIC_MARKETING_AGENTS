-- 012 / ADR-002 P1b B4: bounded, resumable rebuild of `custom_search` after a property's searchable/sensitive/archived change.
-- ADDITIVE ONLY. One queue row per (tenant, object); the rebuild itself is idempotent (it recomputes from `custom` + the current
-- registry and writes only rows whose text differs). Rollback = forward-fix: stop calling it; the table is inert data.

CREATE TABLE crm.search_rebuild(
 tenant_id uuid NOT NULL,
 object_type text NOT NULL,
 -- keyset position: every row with id <= cursor_id has been rebuilt in this pass (NULL = pass not started)
 cursor_id uuid,
 done boolean NOT NULL DEFAULT false,
 requested_rev integer NOT NULL CHECK(requested_rev>=1),
 requested_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(tenant_id,object_type),
 FOREIGN KEY(tenant_id,object_type) REFERENCES crm.object_type,
 CHECK(object_type IN ('contact','lead','deal','task')));
ALTER TABLE crm.search_rebuild ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.search_rebuild FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_boundary ON crm.search_rebuild USING (tenant_id=(SELECT crm.context_tenant_if_allowed())) WITH CHECK (tenant_id=(SELECT crm.context_tenant_if_allowed()));
-- No DELETE: a finished row stays as `done` and is reset by the next request.
GRANT SELECT,INSERT ON crm.search_rebuild TO crm_runtime;
GRANT UPDATE(cursor_id,done,requested_rev,requested_at,updated_at) ON crm.search_rebuild TO crm_runtime;

-- A rebuild writes only the derived `custom_search` column: it must not look like a user edit (updated_at drives "-updated_at" sorts
-- and cursors; search_normalized is GENERATED, so a BEFORE trigger sees it unset: excluded from the comparison). touch_row (008) keeps its behaviour for every real write, which always changes more than custom_search.
-- Restated with the same ACL (no new function: CREATE OR REPLACE keeps it) so this migration is self-evidently closed.
CREATE OR REPLACE FUNCTION crm.touch_row() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 NEW.created_at=OLD.created_at;
 IF NEW.custom_search IS DISTINCT FROM OLD.custom_search AND to_jsonb(NEW)-'custom_search'-'search_normalized'=to_jsonb(OLD)-'custom_search'-'search_normalized' THEN
  RETURN NEW; -- only the derived search text changed: keep updated_at
 END IF;
 NEW.updated_at=now();
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION crm.touch_row() FROM PUBLIC,crm_runtime;
