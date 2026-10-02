-- Additive M2. No updates to existing rows, keys or ciphertext.
INSERT INTO crm.role_permission VALUES
 ('manager','integration.ingest','tenant'),('manager','integration.manage','tenant'),
 ('manager','report.read','tenant'),('manager','report.calculate','tenant'),('manager','conversion.normalize','tenant'),
 ('analyst','report.read','tenant');
CREATE TABLE crm.collection_site(tenant_id uuid NOT NULL REFERENCES crm.tenant,id uuid NOT NULL,public_key uuid NOT NULL UNIQUE,origin text NOT NULL,enabled boolean NOT NULL DEFAULT true,policy_version text NOT NULL DEFAULT 'analytics-v1',PRIMARY KEY(tenant_id,id));
CREATE TABLE crm.visitor(tenant_id uuid NOT NULL,id uuid NOT NULL,site_id uuid NOT NULL,external_id uuid NOT NULL,PRIMARY KEY(tenant_id,id),UNIQUE(tenant_id,site_id,external_id),UNIQUE(tenant_id,site_id,id),FOREIGN KEY(tenant_id,site_id) REFERENCES crm.collection_site);
CREATE TABLE crm.journey_session(tenant_id uuid NOT NULL,id uuid NOT NULL,site_id uuid NOT NULL,visitor_id uuid NOT NULL,external_id uuid NOT NULL,started_at timestamptz NOT NULL,ended_at timestamptz NOT NULL,PRIMARY KEY(tenant_id,id),UNIQUE(tenant_id,site_id,external_id),UNIQUE(tenant_id,visitor_id,id),FOREIGN KEY(tenant_id,site_id,visitor_id) REFERENCES crm.visitor(tenant_id,site_id,id),CHECK(ended_at>=started_at));
ALTER TABLE crm.business_event ADD COLUMN source text,ADD COLUMN source_event_id text,ADD COLUMN received_at timestamptz NOT NULL DEFAULT now(),ADD COLUMN contact_id uuid,ADD COLUMN visitor_id uuid,ADD COLUMN session_id uuid,ADD COLUMN properties jsonb NOT NULL DEFAULT '{}',ADD FOREIGN KEY(tenant_id,contact_id) REFERENCES crm.contact,ADD FOREIGN KEY(tenant_id,visitor_id) REFERENCES crm.visitor,ADD FOREIGN KEY(tenant_id,visitor_id,session_id) REFERENCES crm.journey_session(tenant_id,visitor_id,id);
CREATE UNIQUE INDEX business_source_identity ON crm.business_event(tenant_id,source,source_event_id);
CREATE TABLE crm.source_receipt(tenant_id uuid NOT NULL REFERENCES crm.tenant,namespace text NOT NULL,source_id text NOT NULL,request_hash text NOT NULL,event_id uuid NOT NULL,PRIMARY KEY(tenant_id,namespace,source_id),FOREIGN KEY(tenant_id,event_id) REFERENCES crm.business_event);
CREATE TABLE crm.identity_link(tenant_id uuid NOT NULL,id uuid NOT NULL,visitor_id uuid NOT NULL,contact_id uuid NOT NULL,evidence_type text NOT NULL CHECK(evidence_type IN ('form','authentication','order')),evidence_ref text NOT NULL,evidence_event_id uuid NOT NULL,valid_from timestamptz NOT NULL,valid_to timestamptz NOT NULL,revoked_at timestamptz,corrects_id uuid,actor_id uuid NOT NULL REFERENCES crm.principal,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(tenant_id,id),UNIQUE(tenant_id,visitor_id,evidence_type,evidence_ref),FOREIGN KEY(tenant_id,visitor_id) REFERENCES crm.visitor,FOREIGN KEY(tenant_id,contact_id) REFERENCES crm.contact,FOREIGN KEY(tenant_id,evidence_event_id) REFERENCES crm.business_event,FOREIGN KEY(tenant_id,corrects_id) REFERENCES crm.identity_link,CHECK(valid_to>valid_from));
CREATE TABLE crm.campaign(tenant_id uuid NOT NULL REFERENCES crm.tenant,id uuid NOT NULL,source text NOT NULL,account_id text NOT NULL,external_id text NOT NULL,name text NOT NULL,currency text NOT NULL CHECK(currency ~ '^[A-Z]{3}$'),timezone text NOT NULL,PRIMARY KEY(tenant_id,id),UNIQUE(tenant_id,source,account_id,external_id));
CREATE TABLE crm.touchpoint(tenant_id uuid NOT NULL,id uuid NOT NULL,event_id uuid NOT NULL,visitor_id uuid NOT NULL,session_id uuid NOT NULL,occurred_at timestamptz NOT NULL,source text NOT NULL,medium text,utm_campaign text,ad_id text,campaign_id uuid,landing_path text NOT NULL,referrer_category text NOT NULL,click_id text,analytics_consent boolean NOT NULL,advertising_consent boolean NOT NULL,policy_version text NOT NULL,PRIMARY KEY(tenant_id,id),UNIQUE(tenant_id,event_id),FOREIGN KEY(tenant_id,event_id) REFERENCES crm.business_event,FOREIGN KEY(tenant_id,visitor_id,session_id) REFERENCES crm.journey_session(tenant_id,visitor_id,id),FOREIGN KEY(tenant_id,campaign_id) REFERENCES crm.campaign);
CREATE TABLE crm.spend_fact(tenant_id uuid NOT NULL,campaign_id uuid NOT NULL,reporting_date date NOT NULL,grain text NOT NULL CHECK(grain='campaign_day'),breakdown_key text NOT NULL DEFAULT '',currency text NOT NULL CHECK(currency ~ '^[A-Z]{3}$'),spend_minor bigint NOT NULL CHECK(spend_minor>=0),fetched_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(tenant_id,campaign_id,reporting_date,grain,breakdown_key),FOREIGN KEY(tenant_id,campaign_id) REFERENCES crm.campaign);
CREATE TABLE crm.commerce_order(tenant_id uuid NOT NULL REFERENCES crm.tenant,id uuid NOT NULL,source text NOT NULL,external_id text NOT NULL,contact_id uuid,order_status text NOT NULL CHECK(order_status IN ('placed','cancelled')),placed_at timestamptz NOT NULL,status_at timestamptz NOT NULL,currency text NOT NULL CHECK(currency ~ '^[A-Z]{3}$'),net_minor bigint NOT NULL CHECK(net_minor>=0),PRIMARY KEY(tenant_id,id),UNIQUE(tenant_id,source,external_id),FOREIGN KEY(tenant_id,contact_id) REFERENCES crm.contact);
CREATE TABLE crm.payment(tenant_id uuid NOT NULL,id uuid NOT NULL,order_id uuid NOT NULL,external_id text NOT NULL,occurred_at timestamptz NOT NULL,amount_minor bigint NOT NULL CHECK(amount_minor>0),currency text NOT NULL CHECK(currency ~ '^[A-Z]{3}$'),event_id uuid NOT NULL,PRIMARY KEY(tenant_id,id),UNIQUE(tenant_id,order_id,external_id),FOREIGN KEY(tenant_id,order_id) REFERENCES crm.commerce_order,FOREIGN KEY(tenant_id,event_id) REFERENCES crm.business_event);
CREATE TABLE crm.fulfillment(tenant_id uuid NOT NULL,id uuid NOT NULL,order_id uuid NOT NULL,external_id text NOT NULL,occurred_at timestamptz NOT NULL,status text NOT NULL CHECK(status IN ('shipped','delivered','returned')),event_id uuid NOT NULL,PRIMARY KEY(tenant_id,id),UNIQUE(tenant_id,order_id,external_id),FOREIGN KEY(tenant_id,order_id) REFERENCES crm.commerce_order,FOREIGN KEY(tenant_id,event_id) REFERENCES crm.business_event);
CREATE TABLE crm.refund(tenant_id uuid NOT NULL,id uuid NOT NULL,order_id uuid NOT NULL,payment_id uuid NOT NULL,external_id text NOT NULL,occurred_at timestamptz NOT NULL,amount_minor bigint NOT NULL CHECK(amount_minor>0),currency text NOT NULL CHECK(currency ~ '^[A-Z]{3}$'),event_id uuid NOT NULL,PRIMARY KEY(tenant_id,id),UNIQUE(tenant_id,order_id,external_id),FOREIGN KEY(tenant_id,order_id) REFERENCES crm.commerce_order,FOREIGN KEY(tenant_id,payment_id) REFERENCES crm.payment,FOREIGN KEY(tenant_id,event_id) REFERENCES crm.business_event);
CREATE TABLE crm.conversion(tenant_id uuid NOT NULL,id uuid NOT NULL,event_id uuid NOT NULL,conversion_type text NOT NULL CHECK(conversion_type IN ('deal_won','payment_captured','refund_recorded')),contact_id uuid,order_id uuid,deal_id uuid,business_outcome_key text NOT NULL,definition_version text NOT NULL DEFAULT 'commerce-paid-v1',occurred_at timestamptz NOT NULL,value_minor bigint NOT NULL,currency text NOT NULL CHECK(currency ~ '^[A-Z]{3}$'),evidence_kind text NOT NULL,reversal_of_id uuid,PRIMARY KEY(tenant_id,id),UNIQUE(tenant_id,conversion_type,business_outcome_key),FOREIGN KEY(tenant_id,event_id) REFERENCES crm.business_event,FOREIGN KEY(tenant_id,contact_id) REFERENCES crm.contact,FOREIGN KEY(tenant_id,order_id) REFERENCES crm.commerce_order,FOREIGN KEY(tenant_id,deal_id) REFERENCES crm.deal,FOREIGN KEY(tenant_id,reversal_of_id) REFERENCES crm.conversion,CHECK((order_id IS NULL)<>(deal_id IS NULL)),CHECK((conversion_type='refund_recorded' AND reversal_of_id IS NOT NULL AND value_minor<0) OR (conversion_type<>'refund_recorded' AND reversal_of_id IS NULL AND value_minor>=0)));
CREATE TABLE crm.attribution_run(tenant_id uuid NOT NULL REFERENCES crm.tenant,id uuid NOT NULL,model_version text NOT NULL CHECK(model_version='deterministic-v1'),lookback_days integer NOT NULL CHECK(lookback_days BETWEEN 1 AND 365),as_of timestamptz NOT NULL DEFAULT now(),evidence_hash text NOT NULL,actor_id uuid NOT NULL REFERENCES crm.principal,PRIMARY KEY(tenant_id,id));
CREATE TABLE crm.attribution_credit(tenant_id uuid NOT NULL,run_id uuid NOT NULL,conversion_id uuid NOT NULL,model text NOT NULL CHECK(model IN ('first_touch','last_non_direct')),touchpoint_id uuid,source text NOT NULL,weight numeric NOT NULL CHECK(weight=1),value_minor bigint NOT NULL,PRIMARY KEY(tenant_id,run_id,conversion_id,model),FOREIGN KEY(tenant_id,run_id) REFERENCES crm.attribution_run,FOREIGN KEY(tenant_id,conversion_id) REFERENCES crm.conversion,FOREIGN KEY(tenant_id,touchpoint_id) REFERENCES crm.touchpoint);
CREATE TABLE crm.collection_rate(tenant_id uuid NOT NULL,site_id uuid NOT NULL,minute timestamptz NOT NULL,n integer NOT NULL,PRIMARY KEY(tenant_id,site_id,minute),FOREIGN KEY(tenant_id,site_id) REFERENCES crm.collection_site);
DO $$ DECLARE n text; BEGIN
 FOREACH n IN ARRAY ARRAY['collection_site','visitor','journey_session','source_receipt','identity_link','campaign','touchpoint','spend_fact','commerce_order','payment','fulfillment','refund','conversion','attribution_run','attribution_credit','collection_rate'] LOOP
 EXECUTE format('ALTER TABLE crm.%I ENABLE ROW LEVEL SECURITY',n);
 EXECUTE format('ALTER TABLE crm.%I FORCE ROW LEVEL SECURITY',n);
 EXECUTE format('CREATE POLICY tenant_boundary ON crm.%I USING (crm.tenant_access(tenant_id)) WITH CHECK (crm.tenant_access(tenant_id))',n);
 EXECUTE format('GRANT SELECT,INSERT ON crm.%I TO crm_runtime',n);
 END LOOP;
END $$;
REVOKE ALL ON crm.collection_rate FROM crm_runtime;
GRANT UPDATE ON crm.collection_site,crm.campaign,crm.spend_fact,crm.commerce_order TO crm_runtime;
GRANT UPDATE(revoked_at) ON crm.identity_link TO crm_runtime;
-- Public telemetry has no authenticated CRM authority. The finite definer function
-- resolves its own tenant; origin is only an abuse signal, never proof of identity.
CREATE FUNCTION crm.collect_event(site_key uuid,request_origin text,b jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,crm AS $$
DECLARE s crm.collection_site; v uuid; sess uuid; e uuid; old crm.source_receipt; h text; ts timestamptz; hits int; campaign_ref uuid;
BEGIN
 SELECT * INTO s FROM crm.collection_site WHERE public_key=site_key AND enabled AND origin=request_origin;
 IF s.id IS NULL THEN RAISE EXCEPTION USING ERRCODE='P2001',MESSAGE='Invalid site'; END IF;
 IF jsonb_typeof(b)<>'object' OR octet_length(b::text)>8192 OR EXISTS(SELECT 1 FROM jsonb_object_keys(b) k WHERE k NOT IN ('event_id','visitor_id','session_id','name','schema_version','occurred_at','consent','landing_path','source','medium','utm_campaign','campaign_id','ad_id','click_id','referrer_category','website')) OR NOT b ?& ARRAY['event_id','visitor_id','session_id','name','schema_version','occurred_at','consent','landing_path'] THEN RAISE EXCEPTION USING ERRCODE='P2002',MESSAGE='Invalid telemetry'; END IF;
 IF b->>'name' NOT IN ('page_view','form_submitted') OR b->>'schema_version'<>'1' OR b->'consent'->>'analytics'<>'true' OR b->'consent'->>'advertising' NOT IN ('true','false') OR (b->>'website') IS NOT NULL AND b->>'website'<>'' OR jsonb_typeof(b->'consent')<>'object' OR EXISTS(SELECT 1 FROM jsonb_object_keys(b->'consent') k WHERE k NOT IN ('analytics','advertising')) THEN RAISE EXCEPTION USING ERRCODE='P2002',MESSAGE='Invalid consent or event'; END IF;
 IF b->'consent'->>'analytics' IS NULL OR b->'consent'->>'advertising' IS NULL THEN RAISE EXCEPTION USING ERRCODE='P2002',MESSAGE='Consent required'; END IF;
 IF b->>'landing_path' !~ '^/[a-zA-Z0-9/_-]{0,199}$' OR EXISTS(SELECT 1 FROM jsonb_each_text(b) x WHERE x.key IN ('source','medium','utm_campaign','ad_id','click_id','referrer_category') AND x.value !~ '^[a-zA-Z0-9_.:-]{1,100}$') OR coalesce(b->>'referrer_category','unknown') NOT IN ('direct','search','social','referral','unknown') THEN RAISE EXCEPTION USING ERRCODE='P2002',MESSAGE='Unsafe fields'; END IF;
 ts=(b->>'occurred_at')::timestamptz;
 IF NOT isfinite(ts) OR ts>now()+interval '5 minutes' OR ts<now()-interval '365 days' THEN RAISE EXCEPTION USING ERRCODE='P2002',MESSAGE='Event age rejected'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_each(b) x WHERE x.key<>'consent' AND (x.value='null'::jsonb OR jsonb_typeof(x.value) NOT IN ('string','number'))) OR jsonb_typeof(b->'schema_version')<>'number' OR jsonb_typeof(b->'consent'->'analytics')<>'boolean' OR jsonb_typeof(b->'consent'->'advertising')<>'boolean' THEN RAISE EXCEPTION USING ERRCODE='P2002',MESSAGE='Invalid field types'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(s.tenant_id::text,2));
 h=encode(public.digest(b::text,'sha256'),'hex');
 PERFORM pg_advisory_xact_lock(hashtextextended(s.id::text,0));
 SELECT * INTO old FROM crm.source_receipt WHERE tenant_id=s.tenant_id AND namespace='site:'||s.id AND source_id=(b->>'event_id')::uuid::text;
 IF old.event_id IS NOT NULL THEN
 IF old.request_hash<>h THEN RAISE EXCEPTION USING ERRCODE='P2003',MESSAGE='Source conflict'; END IF;
 RETURN old.event_id; END IF;
 INSERT INTO crm.collection_rate VALUES(s.tenant_id,s.id,date_trunc('minute',now()),1) ON CONFLICT(tenant_id,site_id,minute) DO UPDATE SET n=crm.collection_rate.n+1 RETURNING n INTO hits;
 IF hits>120 THEN RAISE EXCEPTION USING ERRCODE='P2004',MESSAGE='Rate limited'; END IF;
 INSERT INTO crm.visitor VALUES(s.tenant_id,public.gen_random_uuid(),s.id,(b->>'visitor_id')::uuid) ON CONFLICT(tenant_id,site_id,external_id) DO NOTHING;
 SELECT id INTO v FROM crm.visitor WHERE tenant_id=s.tenant_id AND site_id=s.id AND external_id=(b->>'visitor_id')::uuid;
 SELECT id INTO sess FROM crm.journey_session WHERE tenant_id=s.tenant_id AND site_id=s.id AND external_id=(b->>'session_id')::uuid AND visitor_id<>v;
 IF sess IS NOT NULL THEN RAISE EXCEPTION USING ERRCODE='P2003',MESSAGE='Session conflict'; END IF;
 INSERT INTO crm.journey_session VALUES(s.tenant_id,public.gen_random_uuid(),s.id,v,(b->>'session_id')::uuid,ts,ts) ON CONFLICT(tenant_id,site_id,external_id) DO UPDATE SET started_at=least(crm.journey_session.started_at,ts),ended_at=greatest(crm.journey_session.ended_at,ts) RETURNING id INTO sess;
 IF b ? 'campaign_id' THEN
 SELECT id INTO campaign_ref FROM crm.campaign WHERE tenant_id=s.tenant_id AND id=(b->>'campaign_id')::uuid AND source=b->>'source';
 IF campaign_ref IS NULL THEN RAISE EXCEPTION USING ERRCODE='P2002',MESSAGE='Invalid campaign'; END IF;
 END IF;
 e=public.gen_random_uuid();
 INSERT INTO crm.business_event(tenant_id,id,name,source,source_event_id,occurred_at,visitor_id,session_id,properties) VALUES(s.tenant_id,e,b->>'name','site:'||s.id,b->>'event_id',ts,v,sess,jsonb_build_object('analytics',true,'advertising',(b->'consent'->>'advertising')::boolean,'policy_version',s.policy_version));
 INSERT INTO crm.touchpoint VALUES(s.tenant_id,public.gen_random_uuid(),e,v,sess,ts,coalesce(b->>'source',CASE WHEN b->>'referrer_category'='direct' THEN 'direct' ELSE 'unknown' END),b->>'medium',b->>'utm_campaign',b->>'ad_id',campaign_ref,b->>'landing_path',coalesce(b->>'referrer_category','unknown'),CASE WHEN b->'consent'->>'advertising'='true' THEN b->>'click_id' END,true,(b->'consent'->>'advertising')::boolean,s.policy_version);
 INSERT INTO crm.source_receipt VALUES(s.tenant_id,'site:'||s.id,b->>'event_id',h,e);
 RETURN e;
END $$;
GRANT EXECUTE ON FUNCTION crm.collect_event(uuid,text,jsonb) TO crm_runtime;
-- Snapshot a newly accepted M1 commercial outcome in its original transaction.
CREATE FUNCTION crm.normalize_won_outcome() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,crm AS $$
BEGIN
 INSERT INTO crm.conversion(tenant_id,id,event_id,conversion_type,contact_id,deal_id,business_outcome_key,definition_version,occurred_at,value_minor,currency,evidence_kind)
 SELECT NEW.tenant_id,gen_random_uuid(),NEW.event_id,'deal_won',d.contact_id,d.id,NEW.outcome_key,'service-won-v1',e.occurred_at,d.amount_minor,d.currency,'crm_outcome' FROM crm.deal d JOIN crm.business_event e ON e.tenant_id=d.tenant_id AND e.id=NEW.event_id WHERE d.tenant_id=NEW.tenant_id AND d.id=NEW.deal_id ON CONFLICT DO NOTHING;
 RETURN NEW;
END $$;
CREATE TRIGGER normalize_won AFTER INSERT ON crm.commercial_outcome FOR EACH ROW EXECUTE FUNCTION crm.normalize_won_outcome();
ALTER TABLE crm.payment ADD UNIQUE(tenant_id,order_id,id);
ALTER TABLE crm.refund ADD FOREIGN KEY(tenant_id,order_id,payment_id) REFERENCES crm.payment(tenant_id,order_id,id);
CREATE INDEX touchpoint_journey ON crm.touchpoint(tenant_id,visitor_id,occurred_at);
CREATE INDEX identity_contact ON crm.identity_link(tenant_id,contact_id,visitor_id) WHERE revoked_at IS NULL;
CREATE INDEX event_journey ON crm.business_event(tenant_id,contact_id,occurred_at,id);
CREATE INDEX conversion_occurrence ON crm.conversion(tenant_id,occurred_at,id);
-- Recalculation queue: uses the existing worker loop, with both worker and
-- originating authority checked again before each bounded tenant calculation.
INSERT INTO crm.role_permission VALUES ('worker','report.calculate','tenant'),('worker','conversion.normalize','tenant');
ALTER TABLE crm.collection_site ADD COLUMN actor_id uuid REFERENCES crm.principal;
CREATE TABLE crm.attribution_job(tenant_id uuid NOT NULL REFERENCES crm.tenant,id uuid NOT NULL,actor_id uuid NOT NULL REFERENCES crm.principal,action text NOT NULL CHECK(action IN ('integration.manage','integration.ingest')),site_id uuid,event_id uuid,conversion_id uuid,status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processed','blocked')),created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(tenant_id,id),FOREIGN KEY(tenant_id,site_id) REFERENCES crm.collection_site,FOREIGN KEY(tenant_id,event_id) REFERENCES crm.business_event,FOREIGN KEY(tenant_id,conversion_id) REFERENCES crm.conversion,CHECK((event_id IS NULL)<>(conversion_id IS NULL)));
ALTER TABLE crm.attribution_job ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.attribution_job FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_boundary ON crm.attribution_job USING(crm.tenant_access(tenant_id)) WITH CHECK(crm.tenant_access(tenant_id));
GRANT SELECT,INSERT,UPDATE ON crm.attribution_job TO crm_runtime;
CREATE INDEX attribution_pending ON crm.attribution_job(tenant_id,status,created_at);
CREATE FUNCTION crm.queue_collected_attribution() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,crm AS $$
BEGIN
 INSERT INTO crm.attribution_job(tenant_id,id,actor_id,action,site_id,event_id)
 SELECT NEW.tenant_id,gen_random_uuid(),s.actor_id,'integration.manage',s.id,NEW.event_id FROM crm.visitor v JOIN crm.collection_site s ON (s.tenant_id,s.id)=(v.tenant_id,v.site_id) WHERE v.tenant_id=NEW.tenant_id AND v.id=NEW.visitor_id AND s.actor_id IS NOT NULL;
 RETURN NEW;
END $$;
CREATE TRIGGER touchpoint_recalculate AFTER INSERT ON crm.touchpoint FOR EACH ROW EXECUTE FUNCTION crm.queue_collected_attribution();
CREATE FUNCTION crm.attribution_job_allowed(j uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,crm AS $$
 SELECT crm.can_action('report.calculate',NULL) AND EXISTS(SELECT 1 FROM crm.attribution_job q WHERE q.tenant_id=crm.context_tenant() AND q.id=j AND crm.object_authorized(q.actor_id,q.tenant_id,q.action,'report',NULL,NULL) AND (q.site_id IS NULL OR EXISTS(SELECT 1 FROM crm.collection_site s WHERE (s.tenant_id,s.id)=(q.tenant_id,q.site_id) AND s.enabled)))
$$;
GRANT EXECUTE ON FUNCTION crm.attribution_job_allowed(uuid) TO crm_runtime;
CREATE FUNCTION crm.collection_origin_allowed(o text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,crm AS $$ SELECT EXISTS(SELECT 1 FROM crm.collection_site WHERE enabled AND origin=o) $$;
GRANT EXECUTE ON FUNCTION crm.collection_origin_allowed(text) TO crm_runtime;
