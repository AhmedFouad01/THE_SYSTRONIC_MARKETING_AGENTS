-- Preserve existing keys/ciphertext; runtime may validate/use keys, never provision them.
ALTER TABLE crm.identifier_secret ADD COLUMN key_fingerprint text;
UPDATE crm.identifier_secret SET key_fingerprint=encode(public.digest(key,'sha256'),'hex');
ALTER TABLE crm.identifier_secret ALTER COLUMN key_fingerprint SET NOT NULL;

CREATE FUNCTION crm.identifier_key(t uuid) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,crm AS $$
DECLARE secret text; fingerprint text;
BEGIN
 SELECT key,key_fingerprint INTO secret,fingerprint FROM crm.identifier_secret WHERE tenant_id=t FOR SHARE;
 IF secret IS NULL OR secret !~ '^[0-9a-f]{64}$' OR fingerprint IS DISTINCT FROM encode(public.digest(secret,'sha256'),'hex') THEN
  RAISE EXCEPTION USING ERRCODE='PCK01',MESSAGE='PROTECTED_KEY_UNAVAILABLE';
 END IF;
 RETURN secret;
END $$;

-- Owner-only, explicit new-tenant provisioning. No overwrite/recovery/rotation path.
CREATE FUNCTION crm.provision_identifier_key(t uuid) RETURNS void LANGUAGE plpgsql SET search_path=pg_catalog,crm AS $$
DECLARE secret text;
BEGIN
 PERFORM 1 FROM crm.tenant WHERE id=t FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'TENANT_NOT_FOUND'; END IF;
 IF EXISTS(SELECT 1 FROM crm.identifier_secret WHERE tenant_id=t) THEN
  PERFORM crm.identifier_key(t); RETURN;
 END IF;
 IF EXISTS(SELECT 1 FROM crm.contact_identifier WHERE tenant_id=t) THEN
  RAISE EXCEPTION USING ERRCODE='PCK01',MESSAGE='PROTECTED_KEY_UNAVAILABLE';
 END IF;
 secret=encode(public.gen_random_bytes(32),'hex');
 INSERT INTO crm.identifier_secret(tenant_id,key,key_fingerprint) VALUES(t,secret,encode(public.digest(secret,'sha256'),'hex'));
END $$;

CREATE OR REPLACE FUNCTION crm.encrypt_identifier(v text) RETURNS bytea LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,crm AS $$
BEGIN
 IF NOT crm.can_object('sensitive.write','contact',NULL) THEN RAISE EXCEPTION 'Forbidden'; END IF;
 RETURN public.pgp_sym_encrypt(v,crm.identifier_key(crm.context_tenant()));
END $$;
CREATE OR REPLACE FUNCTION crm.identifier_digest(v text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,crm AS $$
BEGIN
 IF NOT crm.tenant_access(crm.context_tenant()) THEN RAISE EXCEPTION 'Forbidden'; END IF;
 RETURN encode(public.hmac(v,crm.identifier_key(crm.context_tenant()),'sha256'),'hex');
END $$;
CREATE OR REPLACE FUNCTION crm.identifier_value(i uuid) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,crm AS $$
DECLARE encrypted bytea; secret text;
BEGIN
 SELECT c.encrypted_value INTO encrypted FROM crm.contact_identifier c WHERE c.tenant_id=crm.context_tenant() AND c.id=i AND crm.can_object('sensitive.read','contact',c.contact_id);
 IF NOT FOUND THEN RETURN NULL; END IF;
 secret=crm.identifier_key(crm.context_tenant());
 BEGIN RETURN public.pgp_sym_decrypt(encrypted,secret);
 EXCEPTION WHEN OTHERS THEN RAISE EXCEPTION USING ERRCODE='PCK01',MESSAGE='PROTECTED_KEY_UNAVAILABLE'; END;
END $$;

CREATE FUNCTION crm.assert_identifier_configuration() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,crm AS $$
DECLARE tenant uuid; secret text; encrypted bytea;
BEGIN
 FOR tenant IN SELECT id FROM crm.tenant LOOP
  secret=crm.identifier_key(tenant);
  FOR encrypted IN SELECT encrypted_value FROM crm.contact_identifier WHERE tenant_id=tenant LOOP
   BEGIN PERFORM public.pgp_sym_decrypt(encrypted,secret);
   EXCEPTION WHEN OTHERS THEN RAISE EXCEPTION USING ERRCODE='PCK01',MESSAGE='PROTECTED_KEY_UNAVAILABLE'; END;
  END LOOP;
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION crm.identifier_key(uuid),crm.provision_identifier_key(uuid) FROM PUBLIC,crm_runtime;
GRANT EXECUTE ON FUNCTION crm.assert_identifier_configuration() TO crm_runtime;
