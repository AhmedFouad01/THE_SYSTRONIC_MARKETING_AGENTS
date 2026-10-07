-- 011 / ADR-002 P1b B2 (S6): permissions + ledger references for the schema API. ADDITIVE ONLY.
-- Rollback = forward-fix: stop calling the routes (no data other than registry rows is written; rows stay inert).

-- ---------------------------------------------------------------------------------------------------------------------------
-- 1. Fixed permission catalogue (ADR-002 4.5; no generic ACL engine). All new actions are tenant-wide and NOT record-scoped:
--    object_authorized() only honours scope 'assigned' for record kinds, so a non-record kind ('property','view') needs 'tenant'.
--    property.manage -> manager (MFA enforced centrally by can_object -> mfa_ok). schema.read -> everyone with crm.read.
--    Agency grants are fixed-deal only (object_authorized: grant => kind 'deal') and the worker has no normal CRM action: both get none.
-- ---------------------------------------------------------------------------------------------------------------------------
INSERT INTO crm.role_permission VALUES
 ('manager','schema.read','tenant'),('rep','schema.read','tenant'),('reader','schema.read','tenant'),
 ('manager','property.manage','tenant'),
 ('manager','view.manage','tenant'),
 ('manager','view.write','tenant'),('rep','view.write','tenant'),('reader','view.write','tenant'),('analyst','view.write','tenant')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------------------------------------------------------
-- 2. Groups need optimistic concurrency and archive (010 created them without either). No DELETE for runtime.
-- ---------------------------------------------------------------------------------------------------------------------------
ALTER TABLE crm.property_group ADD COLUMN version integer NOT NULL DEFAULT 0 CHECK(version>=0), ADD COLUMN archived boolean NOT NULL DEFAULT false;
GRANT UPDATE(version,archived) ON crm.property_group TO crm_runtime;

-- ---------------------------------------------------------------------------------------------------------------------------
-- 3. Ledger references (decision 11): audit_log / business_event / outbox / inbox may point at a property definition
--    ('property') or a property group ('property_group'). Same finite typed check as 003, same definer + search_path.
-- ---------------------------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION crm.check_object_reference() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,crm AS $$
DECLARE k text; i uuid; tbl text; found boolean;
BEGIN
 IF TG_TABLE_NAME='inbox' THEN k=NEW.result_kind;i=NEW.result_id; ELSE k=NEW.object_kind;i=NEW.object_id; END IF;
 IF k IS NULL AND i IS NULL THEN RETURN NEW; END IF;
 tbl=CASE k WHEN 'contact' THEN 'contact' WHEN 'lead' THEN 'lead' WHEN 'deal' THEN 'deal' WHEN 'task' THEN 'task' WHEN 'pipeline' THEN 'pipeline' WHEN 'automation' THEN 'automation_rule' WHEN 'merge' THEN 'merge_job'
  WHEN 'property' THEN 'property_definition' WHEN 'property_group' THEN 'property_group' END;
 IF tbl IS NULL OR i IS NULL THEN RAISE foreign_key_violation USING MESSAGE='Invalid object reference'; END IF;
 EXECUTE format('SELECT EXISTS(SELECT 1 FROM crm.%I WHERE tenant_id=$1 AND id=$2)',tbl) INTO found USING NEW.tenant_id,i;
 IF NOT found THEN RAISE foreign_key_violation USING MESSAGE='Invalid object reference'; END IF;
 RETURN NEW;
END $$;
-- CREATE OR REPLACE keeps the ACL; restate it so the migration is self-evidently closed (guard test: no PUBLIC EXECUTE in schema crm).
REVOKE ALL ON FUNCTION crm.check_object_reference() FROM PUBLIC,crm_runtime;
