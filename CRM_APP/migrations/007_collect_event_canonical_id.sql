-- M2-F01 remediation (additive; 006 is delivered and version-tracked).
-- Public collection idempotency was case-inconsistent on event_id: lookup used the
-- canonical lowercase UUID, but business_event.source_event_id and source_receipt.source_id
-- stored the raw text, so UPPER/lower variants of one UUID produced duplicate events,
-- 422s or 409s. collect_event now canonicalizes once and uses the canonical value for
-- lookup, stores and the request hash. Existing rows are NOT rewritten: a legacy receipt
-- stored non-canonically is found through a canonical expression index and its original
-- raw-body hash is still accepted. Owner, SECURITY DEFINER, search_path and grants are
-- unchanged from 006.
-- R-03: source_receipt also holds non-site namespaces with non-UUID source_id, so the index and the
-- lookup cast source_id to uuid only behind a CASE whose WHEN is an exact check of the PostgreSQL
-- uuid input grammar (CASE order is guaranteed; the cast is unreachable for invalid text under any plan).
CREATE INDEX source_receipt_site_canonical ON crm.source_receipt(tenant_id,namespace,(CASE WHEN source_id ~ '^(\{[0-9A-Fa-f]{4}(-?[0-9A-Fa-f]{4}){7}\}|[0-9A-Fa-f]{4}(-?[0-9A-Fa-f]{4}){7})$' THEN (source_id::uuid)::text END)) WHERE namespace LIKE 'site:%';
CREATE OR REPLACE FUNCTION crm.collect_event(site_key uuid,request_origin text,b jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,crm AS $$
DECLARE s crm.collection_site; v uuid; sess uuid; e uuid; old crm.source_receipt; h text; ts timestamptz; hits int; campaign_ref uuid; orig jsonb; canon text;
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
 -- M2-F01: one canonical form (lowercase canonical UUID text) for every UUID that is part
 -- of replay identity. Applied once; all later lookups, stores and the hash use it.
 orig=b;
 canon=(b->>'event_id')::uuid::text;
 b=jsonb_set(jsonb_set(jsonb_set(b,'{event_id}',to_jsonb(canon)),'{visitor_id}',to_jsonb((b->>'visitor_id')::uuid::text)),'{session_id}',to_jsonb((b->>'session_id')::uuid::text));
 IF b ? 'campaign_id' THEN b=jsonb_set(b,'{campaign_id}',to_jsonb((b->>'campaign_id')::uuid::text)); END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(s.tenant_id::text,2));
 h=encode(public.digest(b::text,'sha256'),'hex');
 PERFORM pg_advisory_xact_lock(hashtextextended(s.id::text,0));
 SELECT * INTO old FROM crm.source_receipt WHERE tenant_id=s.tenant_id AND namespace='site:'||s.id AND namespace LIKE 'site:%' AND CASE WHEN source_id ~ '^(\{[0-9A-Fa-f]{4}(-?[0-9A-Fa-f]{4}){7}\}|[0-9A-Fa-f]{4}(-?[0-9A-Fa-f]{4}){7})$' THEN (source_id::uuid)::text END=canon ORDER BY (source_id=canon) DESC,source_id LIMIT 1;
 IF old.event_id IS NOT NULL THEN
 -- Legacy 006 receipts may hold a non-canonical id and a hash over the raw body.
 IF old.request_hash NOT IN (h,encode(public.digest(orig::text,'sha256'),'hex'),encode(public.digest(jsonb_set(b,'{event_id}',to_jsonb(old.source_id))::text,'sha256'),'hex')) THEN RAISE EXCEPTION USING ERRCODE='P2003',MESSAGE='Source conflict'; END IF;
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
 INSERT INTO crm.business_event(tenant_id,id,name,source,source_event_id,occurred_at,visitor_id,session_id,properties) VALUES(s.tenant_id,e,b->>'name','site:'||s.id,canon,ts,v,sess,jsonb_build_object('analytics',true,'advertising',(b->'consent'->>'advertising')::boolean,'policy_version',s.policy_version));
 INSERT INTO crm.touchpoint VALUES(s.tenant_id,public.gen_random_uuid(),e,v,sess,ts,coalesce(b->>'source',CASE WHEN b->>'referrer_category'='direct' THEN 'direct' ELSE 'unknown' END),b->>'medium',b->>'utm_campaign',b->>'ad_id',campaign_ref,b->>'landing_path',coalesce(b->>'referrer_category','unknown'),CASE WHEN b->'consent'->>'advertising'='true' THEN b->>'click_id' END,true,(b->'consent'->>'advertising')::boolean,s.policy_version);
 INSERT INTO crm.source_receipt VALUES(s.tenant_id,'site:'||s.id,canon,h,e);
 RETURN e;
END $$;
GRANT EXECUTE ON FUNCTION crm.collect_event(uuid,text,jsonb) TO crm_runtime;
