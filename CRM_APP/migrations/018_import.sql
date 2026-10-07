-- 018 / roadmap v2 item 3 (import, server half): permission + job ledger. ADDITIVE ONLY. (013-017 are reserved for auth.)
-- Rollback = forward-fix: stop calling /v1/imports; rows stay inert. Imported records are ordinary contact/lead rows.

-- 1. One new tenant-wide action, manager only (MFA enforced centrally by can_object -> mfa_ok). Reps/readers/agency/worker get none.
INSERT INTO crm.role_permission VALUES ('manager','crm.import','tenant') ON CONFLICT DO NOTHING;

-- 2. Job ledger. A job row exists only for a COMPLETED import (the whole import is one transaction: all rows or the job aborts).
--    import_key = sha256(file sha256 + canonical(object, mapping, options)): the same file + mapping + options is the same job
--    for the tenant, so a re-submit returns the stored result instead of inserting again (UNIQUE is the concurrency backstop).
CREATE TABLE crm.import_job(
 tenant_id uuid NOT NULL REFERENCES crm.tenant,
 id uuid NOT NULL,
 object_type text NOT NULL CHECK(object_type IN ('contact','lead')),
 import_key text NOT NULL CHECK(import_key ~ '^[0-9a-f]{64}$'),
 file_sha256 text NOT NULL CHECK(file_sha256 ~ '^[0-9a-f]{64}$'),
 file_name text NOT NULL CHECK(char_length(file_name) BETWEEN 1 AND 255),
 format text NOT NULL CHECK(format IN ('csv','xlsx')),
 duplicate_mode text NOT NULL CHECK(duplicate_mode IN ('skip','update','create')),
 error_policy text NOT NULL CHECK(error_policy IN ('skip','abort')),
 actor_id uuid NOT NULL REFERENCES crm.principal,
 status text NOT NULL DEFAULT 'completed' CHECK(status IN ('completed')),
 total_rows integer NOT NULL CHECK(total_rows>=0),
 created_count integer NOT NULL CHECK(created_count>=0),
 updated_count integer NOT NULL CHECK(updated_count>=0),
 skipped_count integer NOT NULL CHECK(skipped_count>=0),
 failed_count integer NOT NULL CHECK(failed_count>=0),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(tenant_id,id),
 UNIQUE(tenant_id,object_type,import_key),
 CHECK(created_count+updated_count+skipped_count+failed_count=total_rows));

-- 3. Per-row outcome (immutable evidence of what the job did to which record).
CREATE TABLE crm.import_row(
 tenant_id uuid NOT NULL,
 job_id uuid NOT NULL,
 row_no integer NOT NULL CHECK(row_no>=2), -- spreadsheet numbering: row 1 is the header
 outcome text NOT NULL CHECK(outcome IN ('created','updated','skipped','failed')),
 reason text CHECK(reason IS NULL OR char_length(reason)<=64),
 record_kind text CHECK(record_kind IN ('contact','lead')),
 record_id uuid,
 PRIMARY KEY(tenant_id,job_id,row_no),
 FOREIGN KEY(tenant_id,job_id) REFERENCES crm.import_job);

DO $$ DECLARE n text; BEGIN
 FOREACH n IN ARRAY ARRAY['import_job','import_row'] LOOP
  EXECUTE format('ALTER TABLE crm.%I ENABLE ROW LEVEL SECURITY',n);
  EXECUTE format('ALTER TABLE crm.%I FORCE ROW LEVEL SECURITY',n);
  EXECUTE format('CREATE POLICY tenant_boundary ON crm.%I USING (tenant_id=(SELECT crm.context_tenant_if_allowed())) WITH CHECK (tenant_id=(SELECT crm.context_tenant_if_allowed()))',n);
 END LOOP;
END $$;
-- No UPDATE, no DELETE for the runtime: the ledger is append-only.
GRANT SELECT,INSERT ON crm.import_job,crm.import_row TO crm_runtime;

-- 4. Ledger references: audit_log / business_event may point at an import job (object kind 'import'). Same finite typed check as
--    003/011 plus 'import'; same definer + search_path; ACL restated so the migration is self-evidently closed.
CREATE OR REPLACE FUNCTION crm.check_object_reference() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,crm AS $$
DECLARE k text; i uuid; tbl text; found boolean;
BEGIN
 IF TG_TABLE_NAME='inbox' THEN k=NEW.result_kind;i=NEW.result_id; ELSE k=NEW.object_kind;i=NEW.object_id; END IF;
 IF k IS NULL AND i IS NULL THEN RETURN NEW; END IF;
 tbl=CASE k WHEN 'contact' THEN 'contact' WHEN 'lead' THEN 'lead' WHEN 'deal' THEN 'deal' WHEN 'task' THEN 'task' WHEN 'pipeline' THEN 'pipeline' WHEN 'automation' THEN 'automation_rule' WHEN 'merge' THEN 'merge_job'
  WHEN 'property' THEN 'property_definition' WHEN 'property_group' THEN 'property_group' WHEN 'import' THEN 'import_job' END;
 IF tbl IS NULL OR i IS NULL THEN RAISE foreign_key_violation USING MESSAGE='Invalid object reference'; END IF;
 EXECUTE format('SELECT EXISTS(SELECT 1 FROM crm.%I WHERE tenant_id=$1 AND id=$2)',tbl) INTO found USING NEW.tenant_id,i;
 IF NOT found THEN RAISE foreign_key_violation USING MESSAGE='Invalid object reference'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION crm.check_object_reference() FROM PUBLIC,crm_runtime;
