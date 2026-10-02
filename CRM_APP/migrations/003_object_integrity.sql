-- Object references use a finite typed integrity check because the ledger spans tables.
CREATE FUNCTION crm.check_object_reference() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,crm AS $$
DECLARE k text; i uuid; tbl text; found boolean;
BEGIN
 IF TG_TABLE_NAME='inbox' THEN k=NEW.result_kind;i=NEW.result_id; ELSE k=NEW.object_kind;i=NEW.object_id; END IF;
 IF k IS NULL AND i IS NULL THEN RETURN NEW; END IF;
 tbl=CASE k WHEN 'contact' THEN 'contact' WHEN 'lead' THEN 'lead' WHEN 'deal' THEN 'deal' WHEN 'task' THEN 'task' WHEN 'pipeline' THEN 'pipeline' WHEN 'automation' THEN 'automation_rule' WHEN 'merge' THEN 'merge_job' END;
 IF tbl IS NULL OR i IS NULL THEN RAISE foreign_key_violation USING MESSAGE='Invalid object reference'; END IF;
 EXECUTE format('SELECT EXISTS(SELECT 1 FROM crm.%I WHERE tenant_id=$1 AND id=$2)',tbl) INTO found USING NEW.tenant_id,i;
 IF NOT found THEN RAISE foreign_key_violation USING MESSAGE='Invalid object reference'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER inbox_object_ref BEFORE INSERT OR UPDATE ON crm.inbox FOR EACH ROW EXECUTE FUNCTION crm.check_object_reference();
CREATE TRIGGER event_object_ref BEFORE INSERT OR UPDATE ON crm.business_event FOR EACH ROW EXECUTE FUNCTION crm.check_object_reference();
CREATE TRIGGER audit_object_ref BEFORE INSERT OR UPDATE ON crm.audit_log FOR EACH ROW EXECUTE FUNCTION crm.check_object_reference();
CREATE TRIGGER outbox_object_ref BEFORE INSERT OR UPDATE ON crm.outbox FOR EACH ROW EXECUTE FUNCTION crm.check_object_reference();
CREATE OR REPLACE FUNCTION crm.mfa_ok(p uuid,t uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,crm AS $$ SELECT NOT EXISTS(SELECT 1 FROM crm.membership m WHERE m.principal_id=p AND m.active AND m.role='manager' AND (m.tenant_id=t OR EXISTS(SELECT 1 FROM crm.agency_grant g WHERE g.tenant_id=t AND g.agency_tenant_id=m.tenant_id AND g.membership_id=m.id AND g.revoked_at IS NULL AND g.expires_at>now()))) OR EXISTS(SELECT 1 FROM crm.session WHERE principal_id=p AND token_hash=encode(public.digest(current_setting('crm.token',true),'sha256'),'hex') AND expires_at>now() AND mfa_verified) $$;
