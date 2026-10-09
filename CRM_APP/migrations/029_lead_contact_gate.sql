-- R10: active channels preserve encrypted identifier history; legacy leads are retained.
ALTER TABLE crm.contact_identifier ADD COLUMN is_active boolean NOT NULL DEFAULT true;
CREATE INDEX contact_active_channel ON crm.contact_identifier(tenant_id,contact_id,kind) WHERE is_active;
-- Invoker uses existing tenant RLS; exposes presence only, never decrypts identifiers.
CREATE FUNCTION crm.contact_has_channel(c uuid) RETURNS boolean
 LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog,crm AS $$
 SELECT EXISTS(SELECT 1 FROM crm.contact_identifier WHERE tenant_id=crm.context_tenant() AND contact_id=c AND is_active AND kind IN ('email','phone'))
$$;
REVOKE ALL ON FUNCTION crm.contact_has_channel(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION crm.contact_has_channel(uuid) TO crm_runtime;
