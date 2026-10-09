-- R08: one canonical user-content value; legacy data remains available for forward recovery.
-- Existing tenants default to English because the preceding schema has no language setting.
ALTER TABLE crm.tenant ADD COLUMN primary_language text NOT NULL DEFAULT 'en'
 CHECK (primary_language IN ('en','ar'));
COMMENT ON COLUMN crm.tenant.primary_language IS 'Primary language for content backfill; defaults to en for existing tenants.';
CREATE FUNCTION crm.single_content_value(v jsonb, lang text) RETURNS jsonb
 LANGUAGE sql IMMUTABLE SET search_path=pg_catalog AS $$
 SELECT CASE WHEN v IS NULL THEN NULL WHEN jsonb_typeof(v)='string' THEN v ELSE
 to_jsonb(coalesce(nullif(btrim(v->>lang),''),nullif(btrim(v->>CASE WHEN lang='ar' THEN 'en' ELSE 'ar' END),''),'')) END
$$;
REVOKE ALL ON FUNCTION crm.single_content_value(jsonb,text) FROM PUBLIC;
-- Compatibility for owner-only system seeds from earlier migrations. API writes accept strings only.
CREATE FUNCTION crm.normalize_single_content() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,crm AS $$
DECLARE lang text; alternate text;
BEGIN
 SELECT primary_language INTO lang FROM crm.tenant WHERE id=NEW.tenant_id;
 IF jsonb_typeof(NEW.label)='object' THEN
  NEW.label_legacy=coalesce(NEW.label_legacy,NEW.label);
  NEW.label=crm.single_content_value(NEW.label,coalesce(lang,'en'));
  alternate=nullif(btrim(NEW.label_legacy->>CASE WHEN lang='ar' THEN 'en' ELSE 'ar' END),'');
  IF alternate IS NOT NULL AND alternate<>NEW.label#>>'{}' THEN
   NEW.content_audit_note=jsonb_build_object('reason','R08 single content backfill','primary_language',lang,'alternate_label',alternate);
  END IF;
 END IF;
 IF TG_TABLE_NAME='property_definition' THEN
  IF jsonb_typeof(NEW.description)='object' THEN
   NEW.description_legacy=coalesce(NEW.description_legacy,NEW.description);
   NEW.description=crm.single_content_value(NEW.description,coalesce(lang,'en'));
   NEW.content_audit_note=NEW.content_audit_note || jsonb_build_object('original_description',NEW.description_legacy);
  END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION crm.normalize_single_content() FROM PUBLIC;
DO $$ DECLARE n text; c text; BEGIN
 FOREACH n IN ARRAY ARRAY['object_type','property_group','property_definition','property_option'] LOOP
  EXECUTE format('ALTER TABLE crm.%I ADD COLUMN label_legacy jsonb, ADD COLUMN content_audit_note jsonb NOT NULL DEFAULT ''{}''',n);
  FOR c IN SELECT conname FROM pg_constraint WHERE conrelid=format('crm.%I',n)::regclass AND contype='c' AND pg_get_constraintdef(oid) LIKE '%jsonb_typeof(label)%' LOOP
   EXECUTE format('ALTER TABLE crm.%I DROP CONSTRAINT %I',n,c);
  END LOOP;
  EXECUTE format('CREATE TRIGGER single_content BEFORE INSERT OR UPDATE OF label ON crm.%I FOR EACH ROW EXECUTE FUNCTION crm.normalize_single_content()',n);
 END LOOP;
END $$;
ALTER TABLE crm.property_definition ADD COLUMN description_legacy jsonb;
ALTER TABLE crm.property_definition DROP CONSTRAINT property_definition_description_check;
-- Backfill executes through the same normalizer used by later seeds. No rows or values are discarded.
UPDATE crm.object_type SET label=label;
UPDATE crm.property_group SET label=label;
UPDATE crm.property_definition SET label=label;
UPDATE crm.property_option SET label=label;
DO $$ DECLARE n text; BEGIN
 FOREACH n IN ARRAY ARRAY['object_type','property_group','property_definition','property_option'] LOOP
  EXECUTE format('ALTER TABLE crm.%I ADD CONSTRAINT single_label CHECK(jsonb_typeof(label)=''string'' AND length(btrim(label#>>''{}''))>0 AND pg_column_size(label)<=2048)',n);
 END LOOP;
END $$;
ALTER TABLE crm.property_definition ADD CONSTRAINT single_description CHECK(description IS NULL OR (jsonb_typeof(description)='string' AND pg_column_size(description)<=4096));
-- Existing RLS policies remain enabled and forced; recovery columns have no runtime write grant.
