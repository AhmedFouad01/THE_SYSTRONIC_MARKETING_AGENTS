-- S5 additive: immutable fold and stored values; runtime grants/projections remain explicit.
CREATE FUNCTION crm.normalize_search(v text) RETURNS text LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
SET search_path=pg_catalog AS $$
 SELECT lower(translate(regexp_replace(v, '[ؐ-ًؚ-ٰٟۖ-ۭـ]', '', 'g'), 'أإآىة', 'ااايه'))
$$;
GRANT EXECUTE ON FUNCTION crm.normalize_search(text) TO crm_runtime;
ALTER TABLE crm.contact ADD COLUMN search_normalized text GENERATED ALWAYS AS (crm.normalize_search(display_name)) STORED;
ALTER TABLE crm.lead ADD COLUMN search_normalized text GENERATED ALWAYS AS (crm.normalize_search(title)) STORED;
ALTER TABLE crm.deal ADD COLUMN search_normalized text GENERATED ALWAYS AS (crm.normalize_search(title)) STORED;
ALTER TABLE crm.task ADD COLUMN search_normalized text GENERATED ALWAYS AS (crm.normalize_search(title)) STORED;
CREATE INDEX contact_search_normalized ON crm.contact(tenant_id,search_normalized,id);
CREATE INDEX lead_search_normalized ON crm.lead(tenant_id,search_normalized,id);
CREATE INDEX deal_search_normalized ON crm.deal(tenant_id,search_normalized,id);
CREATE INDEX task_search_normalized ON crm.task(tenant_id,search_normalized,id);
