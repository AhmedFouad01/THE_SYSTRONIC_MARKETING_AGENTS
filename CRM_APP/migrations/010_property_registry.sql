-- 010 / ADR-002 P1b B1 (S5). ADDITIVE ONLY, schema only: no endpoint, no UI, no API output reads any of this yet.
-- Old application code keeps working: it ignores the new tables/columns (COLUMNS in query.ts is unchanged, so `custom` is never projected).
-- Rollback = forward-fix: stop reading the new tables/columns; never drop populated columns. Decisions: P1B_DECISIONS 7 (no GIN), 10 (never backfill `custom`).

-- ---------------------------------------------------------------------------------------------------------------------------
-- 1. Registry tables (ADR-002 4.2). Composite (tenant_id,..) FKs, key regex, size/shape limits, ENABLE+FORCE RLS (initplan form).
-- ---------------------------------------------------------------------------------------------------------------------------
CREATE TABLE crm.object_type(
 tenant_id uuid NOT NULL REFERENCES crm.tenant,
 key text NOT NULL CHECK(key ~ '^[a-z][a-z0-9_]{0,62}$'),
 kind text NOT NULL CHECK(kind IN ('standard','custom')),
 label jsonb NOT NULL CHECK(jsonb_typeof(label)='object' AND pg_column_size(label)<=2048 AND (coalesce(label->>'en','')<>'' OR coalesce(label->>'ar','')<>'')),
 schema_rev integer NOT NULL DEFAULT 1 CHECK(schema_rev>=1),
 version integer NOT NULL DEFAULT 0 CHECK(version>=0),
 archived boolean NOT NULL DEFAULT false,
 PRIMARY KEY(tenant_id,key));

CREATE TABLE crm.property_group(
 tenant_id uuid NOT NULL,
 id uuid NOT NULL,
 object_type text NOT NULL,
 key text NOT NULL CHECK(key ~ '^[a-z][a-z0-9_]{0,62}$'),
 label jsonb NOT NULL CHECK(jsonb_typeof(label)='object' AND pg_column_size(label)<=2048 AND (coalesce(label->>'en','')<>'' OR coalesce(label->>'ar','')<>'')),
 position integer NOT NULL DEFAULT 0 CHECK(position BETWEEN 0 AND 1000000),
 PRIMARY KEY(tenant_id,id),
 UNIQUE(tenant_id,object_type,key),
 UNIQUE(tenant_id,object_type,id),
 FOREIGN KEY(tenant_id,object_type) REFERENCES crm.object_type);

CREATE TABLE crm.property_definition(
 tenant_id uuid NOT NULL,
 id uuid NOT NULL,
 object_type text NOT NULL,
 key text NOT NULL CHECK(key ~ '^[a-z][a-z0-9_]{0,62}$'),
 type text NOT NULL CHECK(type IN ('text','long_text','number','currency','date','datetime','single_select','multi_select','checkbox','user')),
 display text NOT NULL DEFAULT 'default' CHECK(display ~ '^[a-z][a-z0-9_]{0,31}$'),
 label jsonb NOT NULL CHECK(jsonb_typeof(label)='object' AND pg_column_size(label)<=2048 AND (coalesce(label->>'en','')<>'' OR coalesce(label->>'ar','')<>'')),
 description jsonb CHECK(description IS NULL OR (jsonb_typeof(description)='object' AND pg_column_size(description)<=4096)),
 group_id uuid,
 position integer NOT NULL DEFAULT 0 CHECK(position BETWEEN 0 AND 1000000),
 storage text NOT NULL DEFAULT 'custom' CHECK(storage IN ('column','custom','record')),
 column_name text CHECK(column_name IS NULL OR column_name ~ '^[a-z][a-z0-9_]{0,62}$'),
 is_system boolean NOT NULL DEFAULT false,
 required boolean NOT NULL DEFAULT false,
 read_only boolean NOT NULL DEFAULT false,
 sensitive boolean NOT NULL DEFAULT false,
 searchable boolean NOT NULL DEFAULT false,
 indexed boolean NOT NULL DEFAULT false,
 show_default boolean NOT NULL DEFAULT false,
 validation jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(validation)='object' AND pg_column_size(validation)<=4096),
 currency char(3) CHECK(currency IS NULL OR currency ~ '^[A-Z]{3}$'),
 version integer NOT NULL DEFAULT 0 CHECK(version>=0),
 archived_at timestamptz,
 PRIMARY KEY(tenant_id,id),
 UNIQUE(tenant_id,object_type,key),
 FOREIGN KEY(tenant_id,object_type) REFERENCES crm.object_type,
 FOREIGN KEY(tenant_id,object_type,group_id) REFERENCES crm.property_group(tenant_id,object_type,id),
 CHECK((storage='column')=(column_name IS NOT NULL)),
 CHECK(NOT is_system OR storage='column'),
 CHECK((type='currency')=(currency IS NOT NULL)));
-- A column-stored property is always system-owned and has a unique target column: runtime can never map a property onto a column.
CREATE UNIQUE INDEX property_definition_column ON crm.property_definition(tenant_id,object_type,column_name) WHERE column_name IS NOT NULL;

CREATE TABLE crm.property_option(
 tenant_id uuid NOT NULL,
 property_id uuid NOT NULL,
 value text NOT NULL CHECK(char_length(value) BETWEEN 1 AND 64 AND value !~ '[[:cntrl:]]'),
 label jsonb NOT NULL CHECK(jsonb_typeof(label)='object' AND pg_column_size(label)<=1024 AND (coalesce(label->>'en','')<>'' OR coalesce(label->>'ar','')<>'')),
 color text CHECK(color IS NULL OR color ~ '^[a-z][a-z0-9_-]{0,31}$'),
 position integer NOT NULL DEFAULT 0 CHECK(position BETWEEN 0 AND 1000000),
 archived boolean NOT NULL DEFAULT false,
 PRIMARY KEY(tenant_id,property_id,value),
 FOREIGN KEY(tenant_id,property_id) REFERENCES crm.property_definition);

DO $$ DECLARE n text; BEGIN
 FOREACH n IN ARRAY ARRAY['object_type','property_group','property_definition','property_option'] LOOP
  EXECUTE format('ALTER TABLE crm.%I ENABLE ROW LEVEL SECURITY',n);
  EXECUTE format('ALTER TABLE crm.%I FORCE ROW LEVEL SECURITY',n);
  EXECUTE format('CREATE POLICY tenant_boundary ON crm.%I USING (tenant_id=(SELECT crm.context_tenant_if_allowed())) WITH CHECK (tenant_id=(SELECT crm.context_tenant_if_allowed()))',n);
 END LOOP;
END $$;

-- Runtime: SELECT + INSERT/UPDATE on listed columns only. No DELETE (archive only), no DDL, no TRUNCATE.
-- key / type / object_type / storage / column_name / is_system are immutable for runtime (not in any UPDATE list) and
-- storage / column_name / is_system are not insertable either (defaults 'custom' / NULL / false): only seed_system_properties
-- (owner-only) can create system or column-mapped rows. object_type rows are seeded; runtime only bumps schema_rev/version.
GRANT SELECT ON crm.object_type,crm.property_group,crm.property_definition,crm.property_option TO crm_runtime;
GRANT UPDATE(schema_rev,version) ON crm.object_type TO crm_runtime;
GRANT INSERT(tenant_id,id,object_type,key,label,position) ON crm.property_group TO crm_runtime;
GRANT UPDATE(label,position) ON crm.property_group TO crm_runtime;
GRANT INSERT(tenant_id,id,object_type,key,type,display,label,description,group_id,position,required,read_only,sensitive,searchable,indexed,show_default,validation,currency,version,archived_at) ON crm.property_definition TO crm_runtime;
GRANT UPDATE(display,label,description,group_id,position,required,read_only,sensitive,searchable,indexed,show_default,validation,version,archived_at) ON crm.property_definition TO crm_runtime;
GRANT INSERT(tenant_id,property_id,value,label,color,position,archived) ON crm.property_option TO crm_runtime;
GRANT UPDATE(label,color,position,archived) ON crm.property_option TO crm_runtime;

-- Count limits (ADR/plan: 100 active custom properties per object, 200 active options per property), enforced in the database
-- as well as in the B2 validator. The parent row is locked FOR NO KEY UPDATE so concurrent inserts serialise (and FK checks are not blocked).
CREATE FUNCTION crm.enforce_registry_limits() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,crm AS $$
BEGIN
 IF TG_TABLE_NAME='property_definition' THEN
  IF NEW.is_system OR NEW.archived_at IS NOT NULL OR (TG_OP='UPDATE' AND OLD.archived_at IS NULL) THEN RETURN NEW; END IF;
  PERFORM 1 FROM crm.object_type WHERE tenant_id=NEW.tenant_id AND key=NEW.object_type FOR NO KEY UPDATE;
  IF (SELECT count(*) FROM crm.property_definition d WHERE d.tenant_id=NEW.tenant_id AND d.object_type=NEW.object_type AND NOT d.is_system AND d.archived_at IS NULL AND d.id<>NEW.id)>=100 THEN
   RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='PROPERTY_LIMIT_EXCEEDED';
  END IF;
 ELSE
  IF NEW.archived OR (TG_OP='UPDATE' AND NOT OLD.archived) THEN RETURN NEW; END IF;
  PERFORM 1 FROM crm.property_definition WHERE tenant_id=NEW.tenant_id AND id=NEW.property_id FOR NO KEY UPDATE;
  IF (SELECT count(*) FROM crm.property_option o WHERE o.tenant_id=NEW.tenant_id AND o.property_id=NEW.property_id AND NOT o.archived AND o.value<>NEW.value)>=200 THEN
   RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='OPTION_LIMIT_EXCEEDED';
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER property_definition_limits BEFORE INSERT OR UPDATE ON crm.property_definition FOR EACH ROW EXECUTE FUNCTION crm.enforce_registry_limits();
CREATE TRIGGER property_option_limits BEFORE INSERT OR UPDATE ON crm.property_option FOR EACH ROW EXECUTE FUNCTION crm.enforce_registry_limits();

-- ---------------------------------------------------------------------------------------------------------------------------
-- 2. `custom` + `custom_search` on the four object tables. Constant DEFAULT = metadata-only on PG 17 (no rewrite).
--    NO backfill (decision 10: a bulk write of `custom` cost 557 s / 43 GB WAL per 1M rows in B0) and NO GIN (decision 7).
--    The CHECKs are added NOT VALID (instant, new writes enforced) and then VALIDATEd (SHARE UPDATE EXCLUSIVE scan, writes continue).
-- ---------------------------------------------------------------------------------------------------------------------------
ALTER TABLE crm.contact ADD COLUMN custom jsonb NOT NULL DEFAULT '{}', ADD COLUMN custom_search text NOT NULL DEFAULT '';
ALTER TABLE crm.lead ADD COLUMN custom jsonb NOT NULL DEFAULT '{}', ADD COLUMN custom_search text NOT NULL DEFAULT '';
ALTER TABLE crm.deal ADD COLUMN custom jsonb NOT NULL DEFAULT '{}', ADD COLUMN custom_search text NOT NULL DEFAULT '';
ALTER TABLE crm.task ADD COLUMN custom jsonb NOT NULL DEFAULT '{}', ADD COLUMN custom_search text NOT NULL DEFAULT '';
ALTER TABLE crm.contact ADD CONSTRAINT contact_custom_shape CHECK(jsonb_typeof(custom)='object' AND pg_column_size(custom)<=32768) NOT VALID,
 ADD CONSTRAINT contact_custom_search_size CHECK(octet_length(custom_search)<=8192) NOT VALID;
ALTER TABLE crm.lead ADD CONSTRAINT lead_custom_shape CHECK(jsonb_typeof(custom)='object' AND pg_column_size(custom)<=32768) NOT VALID,
 ADD CONSTRAINT lead_custom_search_size CHECK(octet_length(custom_search)<=8192) NOT VALID;
ALTER TABLE crm.deal ADD CONSTRAINT deal_custom_shape CHECK(jsonb_typeof(custom)='object' AND pg_column_size(custom)<=32768) NOT VALID,
 ADD CONSTRAINT deal_custom_search_size CHECK(octet_length(custom_search)<=8192) NOT VALID;
ALTER TABLE crm.task ADD CONSTRAINT task_custom_shape CHECK(jsonb_typeof(custom)='object' AND pg_column_size(custom)<=32768) NOT VALID,
 ADD CONSTRAINT task_custom_search_size CHECK(octet_length(custom_search)<=8192) NOT VALID;
ALTER TABLE crm.contact VALIDATE CONSTRAINT contact_custom_shape;
ALTER TABLE crm.contact VALIDATE CONSTRAINT contact_custom_search_size;
ALTER TABLE crm.lead VALIDATE CONSTRAINT lead_custom_shape;
ALTER TABLE crm.lead VALIDATE CONSTRAINT lead_custom_search_size;
ALTER TABLE crm.deal VALIDATE CONSTRAINT deal_custom_shape;
ALTER TABLE crm.deal VALIDATE CONSTRAINT deal_custom_search_size;
ALTER TABLE crm.task VALIDATE CONSTRAINT task_custom_shape;
ALTER TABLE crm.task VALIDATE CONSTRAINT task_custom_search_size;
-- contact/lead/task already hold table-wide UPDATE (002); deal holds a column list, so the new columns are added explicitly.
GRANT UPDATE(custom,custom_search) ON crm.contact,crm.lead,crm.deal,crm.task TO crm_runtime;

-- ---------------------------------------------------------------------------------------------------------------------------
-- 3. Owner-only system-property seed (same pattern as provision_identifier_key, 005): never callable by crm_runtime.
--    Idempotent (ON CONFLICT DO NOTHING: an existing row, including a tenant's later edits, is never overwritten; a re-run only
--    adds rows that are missing). System properties are the standard columns with storage='column' (ADR 4.3); id/foreign-key
--    columns (contact_id, pipeline_id, stage_id, lead_id, deal_id) are not properties in P1b (no reference type yet).
-- ---------------------------------------------------------------------------------------------------------------------------
CREATE FUNCTION crm.seed_system_properties(t uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,crm AS $$
BEGIN
 PERFORM 1 FROM crm.tenant WHERE id=t FOR NO KEY UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'TENANT_NOT_FOUND'; END IF;
 INSERT INTO crm.object_type(tenant_id,key,kind,label) VALUES
  (t,'contact','standard','{"en":"Contacts","ar":"جهات الاتصال"}'),
  (t,'lead','standard','{"en":"Leads","ar":"العملاء المحتملون"}'),
  (t,'deal','standard','{"en":"Deals","ar":"الصفقات"}'),
  (t,'task','standard','{"en":"Tasks","ar":"المهام"}')
 ON CONFLICT DO NOTHING;
 INSERT INTO crm.property_group(tenant_id,id,object_type,key,label,position)
  SELECT t,gen_random_uuid(),o,'general','{"en":"General","ar":"عام"}'::jsonb,0 FROM unnest(ARRAY['contact','lead','deal','task']) o
 ON CONFLICT DO NOTHING;
 INSERT INTO crm.property_definition(tenant_id,id,object_type,key,type,label,group_id,position,storage,column_name,is_system,required,read_only,searchable,show_default)
  SELECT t,gen_random_uuid(),s.o,s.k,s.ty,jsonb_build_object('en',s.en,'ar',s.ar),g.id,s.pos,'column',s.k,true,s.req,s.ro,s.srch,s.sd
  FROM (VALUES
   ('contact','display_name','text','Name','الاسم',10,true,false,true,true),
   ('contact','source','text','Source','المصدر',20,false,false,false,true),
   ('contact','owner_id','user','Owner','المسؤول',30,false,false,false,true),
   ('contact','created_at','datetime','Created','تاريخ الإنشاء',40,false,true,false,false),
   ('contact','updated_at','datetime','Updated','آخر تحديث',50,false,true,false,false),
   ('lead','title','text','Title','العنوان',10,true,false,true,true),
   ('lead','source','text','Source','المصدر',20,false,false,false,true),
   ('lead','status','single_select','Status','الحالة',30,false,false,false,true),
   ('lead','owner_id','user','Owner','المسؤول',40,false,false,false,true),
   ('lead','received_at','datetime','Received','تاريخ الاستلام',50,false,true,false,true),
   ('lead','created_at','datetime','Created','تاريخ الإنشاء',60,false,true,false,false),
   ('lead','updated_at','datetime','Updated','آخر تحديث',70,false,true,false,false),
   ('deal','title','text','Title','العنوان',10,true,false,true,true),
   ('deal','amount_minor','number','Amount','المبلغ',20,false,false,false,true),
   ('deal','currency','text','Currency','العملة',30,false,false,false,true),
   ('deal','owner_id','user','Owner','المسؤول',40,false,false,false,true),
   ('deal','created_at','datetime','Created','تاريخ الإنشاء',50,false,true,false,false),
   ('deal','updated_at','datetime','Updated','آخر تحديث',60,false,true,false,false),
   ('task','title','text','Title','العنوان',10,true,false,true,true),
   ('task','due_at','datetime','Due','موعد الاستحقاق',20,true,false,false,true),
   ('task','status','single_select','Status','الحالة',30,false,false,false,true),
   ('task','outcome','text','Outcome','النتيجة',40,false,false,false,false),
   ('task','owner_id','user','Owner','المسؤول',50,false,false,false,true),
   ('task','completed_at','datetime','Completed','تاريخ الإكمال',60,false,true,false,false),
   ('task','created_at','datetime','Created','تاريخ الإنشاء',70,false,true,false,false),
   ('task','updated_at','datetime','Updated','آخر تحديث',80,false,true,false,false)
  ) s(o,k,ty,en,ar,pos,req,ro,srch,sd)
  JOIN crm.property_group g ON g.tenant_id=t AND g.object_type=s.o AND g.key='general'
 ON CONFLICT DO NOTHING;
 INSERT INTO crm.property_option(tenant_id,property_id,value,label,position)
  SELECT t,d.id,s.v,jsonb_build_object('en',s.en,'ar',s.ar),s.pos
  FROM (VALUES
   ('lead','status','open','Open','مفتوح',10),
   ('lead','status','qualified','Qualified','مؤهل',20),
   ('lead','status','closed','Closed','مغلق',30),
   ('task','status','open','Open','مفتوحة',10),
   ('task','status','completed','Completed','مكتملة',20)
  ) s(o,k,v,en,ar,pos)
  JOIN crm.property_definition d ON d.tenant_id=t AND d.object_type=s.o AND d.key=s.k
 ON CONFLICT DO NOTHING;
END $$;

-- ---------------------------------------------------------------------------------------------------------------------------
-- 4. Privileges. PostgreSQL grants EXECUTE on every new function to PUBLIC; the schema-level ALTER DEFAULT PRIVILEGES in 001 does
--    not cancel that (the 008 lesson). Close it for EVERY function in schema crm, old and new (a permanent catalog test guards
--    this). Runtime keeps exactly the explicit grants made by 001-009; trigger functions need no EXECUTE at fire time.
-- ---------------------------------------------------------------------------------------------------------------------------
DO $$ DECLARE f regprocedure; BEGIN
 FOR f IN SELECT p.oid::regprocedure FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='crm' LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC',f);
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION crm.seed_system_properties(uuid) FROM PUBLIC,crm_runtime;
REVOKE ALL ON FUNCTION crm.enforce_registry_limits() FROM PUBLIC,crm_runtime;

-- ---------------------------------------------------------------------------------------------------------------------------
-- 5. Seed every existing tenant (new tenants are seeded by scripts/seed.ts and, later, by privileged tooling).
-- ---------------------------------------------------------------------------------------------------------------------------
DO $$ DECLARE t uuid; BEGIN
 FOR t IN SELECT id FROM crm.tenant LOOP PERFORM crm.seed_system_properties(t); END LOOP;
END $$;
