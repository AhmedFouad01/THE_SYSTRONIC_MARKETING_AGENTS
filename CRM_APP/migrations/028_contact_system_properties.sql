-- R09: protected system contact properties; no plaintext copy of identifiers or business fields.
ALTER TABLE crm.contact_identifier ADD COLUMN is_primary boolean NOT NULL DEFAULT false;
-- Preserve every historical identifier; choose a stable initial primary per kind.
UPDATE crm.contact_identifier i SET is_primary=true FROM (SELECT DISTINCT ON(tenant_id,contact_id,kind) tenant_id,id FROM crm.contact_identifier ORDER BY tenant_id,contact_id,kind,id) x WHERE (i.tenant_id,i.id)=(x.tenant_id,x.id);
ALTER TABLE crm.contact ADD COLUMN company_encrypted bytea, ADD COLUMN job_title_encrypted bytea;
GRANT UPDATE(company_encrypted,job_title_encrypted) ON crm.contact TO crm_runtime;
ALTER TABLE crm.property_definition ADD COLUMN system_field text CHECK(system_field IN ('email','phone','company','job_title'));
DO $$ DECLARE c text; BEGIN
 FOR c IN SELECT conname FROM pg_constraint WHERE conrelid='crm.property_definition'::regclass AND contype='c' AND (pg_get_constraintdef(oid) LIKE '%storage%' OR pg_get_constraintdef(oid) LIKE '%type = ANY%') LOOP
  EXECUTE format('ALTER TABLE crm.property_definition DROP CONSTRAINT %I',c);
 END LOOP;
END $$;
ALTER TABLE crm.property_definition ADD CONSTRAINT registry_types CHECK(type IN ('text','long_text','email','phone','url','number','currency','date','datetime','single_select','multi_select','checkbox','user')),
 ADD CONSTRAINT registry_storage CHECK(storage IN ('column','custom','record','protected')),
 ADD CONSTRAINT registry_column CHECK((storage='column')=(column_name IS NOT NULL)),
 ADD CONSTRAINT registry_system CHECK(NOT is_system OR storage IN ('column','protected')),
 ADD CONSTRAINT registry_protected CHECK((storage='protected')=(system_field IS NOT NULL));
CREATE UNIQUE INDEX property_definition_system_field ON crm.property_definition(tenant_id,object_type,system_field) WHERE system_field IS NOT NULL;
CREATE FUNCTION crm.identifier_value_scoped(i uuid,g uuid DEFAULT NULL) RETURNS text
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,crm AS $$
DECLARE encrypted bytea;
BEGIN
 SELECT encrypted_value INTO encrypted FROM crm.contact_identifier WHERE tenant_id=crm.context_tenant() AND id=i AND crm.can_object('sensitive.read','contact',contact_id,g);
 IF NOT FOUND THEN RETURN NULL; END IF;
 BEGIN RETURN public.pgp_sym_decrypt(encrypted,crm.identifier_key(crm.context_tenant()));
 EXCEPTION WHEN OTHERS THEN RAISE EXCEPTION USING ERRCODE='PCK01',MESSAGE='PROTECTED_KEY_UNAVAILABLE'; END;
END $$;
REVOKE ALL ON FUNCTION crm.identifier_value_scoped(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION crm.identifier_value_scoped(uuid,uuid) TO crm_runtime;
CREATE FUNCTION crm.contact_business_fields(c uuid,g uuid DEFAULT NULL) RETURNS TABLE(company text,job_title text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,crm AS $$
 SELECT public.pgp_sym_decrypt(x.company_encrypted,crm.identifier_key(x.tenant_id)),public.pgp_sym_decrypt(x.job_title_encrypted,crm.identifier_key(x.tenant_id))
 FROM crm.contact x
 WHERE x.tenant_id=crm.context_tenant() AND x.id=c AND crm.can_object('sensitive.read','contact',x.id,g)
$$;
REVOKE ALL ON FUNCTION crm.contact_business_fields(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION crm.contact_business_fields(uuid,uuid) TO crm_runtime;
CREATE FUNCTION crm.seed_contact_system_properties(t uuid) RETURNS void
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,crm AS $$
DECLARE f record; candidate text; suffix int;
BEGIN
 PERFORM 1 FROM crm.tenant WHERE id=t FOR NO KEY UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'TENANT_NOT_FOUND'; END IF;
 FOR f IN SELECT * FROM (VALUES
  ('contact','email','email','Email','البريد الإلكتروني',15),('contact','phone','phone','Phone','الهاتف',16),
  ('contact','company','text','Company','الشركة',17),('contact','job_title','text','Job title','المسمى الوظيفي',18),
  ('lead','email','email','Email','البريد الإلكتروني',15),('lead','phone','phone','Phone','الهاتف',16)
 ) x(o,k,ty,en,ar,pos) LOOP
  IF EXISTS(SELECT 1 FROM crm.property_definition WHERE tenant_id=t AND object_type=f.o AND system_field=f.k) THEN CONTINUE; END IF;
  candidate=f.k; suffix=0;
  WHILE EXISTS(SELECT 1 FROM crm.property_definition WHERE tenant_id=t AND object_type=f.o AND key=candidate) LOOP
   suffix=suffix+1; candidate='system_'||f.k||CASE WHEN suffix=1 THEN '' ELSE '_'||suffix END;
  END LOOP;
  INSERT INTO crm.property_definition(tenant_id,id,object_type,key,type,label,group_id,position,storage,is_system,sensitive,show_default,system_field)
   SELECT t,gen_random_uuid(),f.o,candidate,f.ty,jsonb_build_object('en',f.en,'ar',f.ar),id,f.pos,'protected',true,true,true,f.k FROM crm.property_group WHERE tenant_id=t AND object_type=f.o AND key='general';
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION crm.seed_contact_system_properties(uuid) FROM PUBLIC,crm_runtime;
-- Keep earlier owner-only seeds intact, and append new system metadata for every future tenant.
ALTER FUNCTION crm.seed_system_properties(uuid) RENAME TO seed_system_properties_pre028;
CREATE FUNCTION crm.seed_system_properties(t uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,crm AS $$
BEGIN PERFORM crm.seed_system_properties_pre028(t); PERFORM crm.seed_contact_system_properties(t); END $$;
REVOKE ALL ON FUNCTION crm.seed_system_properties(uuid) FROM PUBLIC,crm_runtime;
DO $$ DECLARE t uuid; BEGIN FOR t IN SELECT id FROM crm.tenant LOOP PERFORM crm.seed_contact_system_properties(t); END LOOP; END $$;
-- Existing encrypted email/phone values are immediately projected; custom property key collisions coexist without renaming/data loss.
