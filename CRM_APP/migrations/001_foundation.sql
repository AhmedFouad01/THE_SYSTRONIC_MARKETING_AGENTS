CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA crm;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
CREATE ROLE crm_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
GRANT USAGE ON SCHEMA crm TO crm_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA crm REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

CREATE TABLE crm.tenant(id uuid PRIMARY KEY, name text NOT NULL);
CREATE TABLE crm.principal(id uuid PRIMARY KEY, name text NOT NULL);
CREATE TABLE crm.role_permission(role text NOT NULL, action text NOT NULL, scope text NOT NULL CHECK(scope IN ('tenant','assigned')), PRIMARY KEY(role,action));
INSERT INTO crm.role_permission VALUES ('manager','crm.read','tenant'),('manager','crm.write','tenant'),('rep','crm.read','assigned'),('rep','crm.write','assigned'),('reader','crm.read','tenant'),('worker','automation.execute','tenant');
CREATE TABLE crm.membership(tenant_id uuid REFERENCES crm.tenant, id uuid NOT NULL, principal_id uuid NOT NULL REFERENCES crm.principal, role text NOT NULL, active boolean NOT NULL DEFAULT true, PRIMARY KEY(tenant_id,id), UNIQUE(tenant_id,principal_id));
CREATE TABLE crm.session(token_hash text PRIMARY KEY, principal_id uuid NOT NULL REFERENCES crm.principal, expires_at timestamptz NOT NULL);
CREATE TABLE crm.contact(tenant_id uuid REFERENCES crm.tenant, id uuid NOT NULL, display_name text NOT NULL, PRIMARY KEY(tenant_id,id));
CREATE TABLE crm.pipeline(tenant_id uuid REFERENCES crm.tenant, id uuid NOT NULL, name text NOT NULL, PRIMARY KEY(tenant_id,id));
CREATE TABLE crm.stage(tenant_id uuid NOT NULL, id uuid NOT NULL, pipeline_id uuid NOT NULL, name text NOT NULL, PRIMARY KEY(tenant_id,id), UNIQUE(tenant_id,pipeline_id,id), FOREIGN KEY(tenant_id,pipeline_id) REFERENCES crm.pipeline);
CREATE TABLE crm.allowed_transition(tenant_id uuid NOT NULL, pipeline_id uuid NOT NULL, from_stage uuid NOT NULL, to_stage uuid NOT NULL, PRIMARY KEY(tenant_id,pipeline_id,from_stage,to_stage), FOREIGN KEY(tenant_id,pipeline_id,from_stage) REFERENCES crm.stage(tenant_id,pipeline_id,id), FOREIGN KEY(tenant_id,pipeline_id,to_stage) REFERENCES crm.stage(tenant_id,pipeline_id,id));
CREATE TABLE crm.deal(tenant_id uuid NOT NULL, id uuid NOT NULL, contact_id uuid NOT NULL, pipeline_id uuid NOT NULL, stage_id uuid NOT NULL, owner_id uuid NOT NULL REFERENCES crm.principal, version integer NOT NULL DEFAULT 0 CHECK(version>=0), PRIMARY KEY(tenant_id,id), FOREIGN KEY(tenant_id,contact_id) REFERENCES crm.contact, FOREIGN KEY(tenant_id,pipeline_id,stage_id) REFERENCES crm.stage(tenant_id,pipeline_id,id));
CREATE TABLE crm.agency_grant(tenant_id uuid REFERENCES crm.tenant, id uuid NOT NULL, agency_tenant_id uuid NOT NULL, membership_id uuid NOT NULL, deal_id uuid NOT NULL, action text NOT NULL CHECK(action IN ('crm.read','crm.write')), expires_at timestamptz NOT NULL, revoked_at timestamptz, PRIMARY KEY(tenant_id,id), FOREIGN KEY(agency_tenant_id,membership_id) REFERENCES crm.membership, FOREIGN KEY(tenant_id,deal_id) REFERENCES crm.deal);
CREATE TABLE crm.stage_transition(tenant_id uuid NOT NULL, id uuid NOT NULL, deal_id uuid NOT NULL, pipeline_id uuid NOT NULL, from_stage uuid NOT NULL, to_stage uuid NOT NULL, actor_id uuid NOT NULL REFERENCES crm.principal, grant_id uuid, command_id uuid NOT NULL, deal_version integer NOT NULL, reason text NOT NULL, occurred_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(tenant_id,id), UNIQUE(tenant_id,deal_id,deal_version), FOREIGN KEY(tenant_id,deal_id) REFERENCES crm.deal, FOREIGN KEY(tenant_id,pipeline_id,from_stage) REFERENCES crm.stage(tenant_id,pipeline_id,id), FOREIGN KEY(tenant_id,pipeline_id,to_stage) REFERENCES crm.stage(tenant_id,pipeline_id,id), FOREIGN KEY(tenant_id,grant_id) REFERENCES crm.agency_grant);
CREATE TABLE crm.business_event(tenant_id uuid NOT NULL, id uuid NOT NULL, transition_id uuid NOT NULL, name text NOT NULL DEFAULT 'deal.stage_changed', schema_version integer NOT NULL DEFAULT 1, occurred_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(tenant_id,id), UNIQUE(tenant_id,transition_id), FOREIGN KEY(tenant_id,transition_id) REFERENCES crm.stage_transition);
CREATE TABLE crm.command_receipt(tenant_id uuid NOT NULL, actor_id uuid NOT NULL REFERENCES crm.principal, operation text NOT NULL, command_id uuid NOT NULL, request_hash text NOT NULL, transition_id uuid NOT NULL, PRIMARY KEY(tenant_id,actor_id,operation,command_id), FOREIGN KEY(tenant_id,transition_id) REFERENCES crm.stage_transition);
CREATE TABLE crm.api_retry(tenant_id uuid NOT NULL, actor_id uuid NOT NULL REFERENCES crm.principal, operation text NOT NULL, key text NOT NULL, request_hash text NOT NULL, transition_id uuid NOT NULL, expires_at timestamptz NOT NULL DEFAULT now()+interval '7 days', PRIMARY KEY(tenant_id,actor_id,operation,key), FOREIGN KEY(tenant_id,transition_id) REFERENCES crm.stage_transition);
CREATE TABLE crm.outbox(tenant_id uuid NOT NULL, id uuid NOT NULL, event_id uuid NOT NULL, actor_id uuid NOT NULL REFERENCES crm.principal, grant_id uuid, deal_id uuid NOT NULL, status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','retry','processed','blocked')), attempts integer NOT NULL DEFAULT 0, next_attempt_at timestamptz NOT NULL DEFAULT now(), processed_at timestamptz, error_code text, PRIMARY KEY(tenant_id,id), UNIQUE(tenant_id,event_id), FOREIGN KEY(tenant_id,event_id) REFERENCES crm.business_event, FOREIGN KEY(tenant_id,deal_id) REFERENCES crm.deal, FOREIGN KEY(tenant_id,grant_id) REFERENCES crm.agency_grant);
CREATE INDEX outbox_pending ON crm.outbox(tenant_id,status,next_attempt_at);
CREATE TABLE crm.worker_effect(tenant_id uuid NOT NULL, outbox_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(tenant_id,outbox_id), FOREIGN KEY(tenant_id,outbox_id) REFERENCES crm.outbox);
CREATE TABLE crm.audit_log(tenant_id uuid NOT NULL, id uuid NOT NULL, actor_id uuid NOT NULL REFERENCES crm.principal, grant_id uuid, transition_id uuid NOT NULL, action text NOT NULL, request_id uuid NOT NULL, occurred_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(tenant_id,id), UNIQUE(tenant_id,transition_id), FOREIGN KEY(tenant_id,transition_id) REFERENCES crm.stage_transition, FOREIGN KEY(tenant_id,grant_id) REFERENCES crm.agency_grant);

-- Opaque credentials are checked against a protected table, not a caller-supplied actor GUC.
CREATE FUNCTION crm.actor() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,crm AS $$
 SELECT principal_id FROM crm.session WHERE token_hash=encode(public.digest(current_setting('crm.token',true),'sha256'),'hex') AND expires_at>now()
$$;
CREATE FUNCTION crm.context_tenant() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('crm.tenant',true),'')::uuid $$;
CREATE FUNCTION crm.tenant_access(t uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,crm AS $$
 SELECT t=crm.context_tenant() AND (EXISTS(SELECT 1 FROM crm.membership m WHERE m.tenant_id=t AND m.principal_id=crm.actor() AND m.active)
 OR EXISTS(SELECT 1 FROM crm.agency_grant g JOIN crm.membership m ON (m.tenant_id,m.id)=(g.agency_tenant_id,g.membership_id) WHERE g.tenant_id=t AND m.principal_id=crm.actor() AND m.active AND g.revoked_at IS NULL AND g.expires_at>now()))
$$;
-- Private predicate: only wrapper functions can choose an actor for worker reauthorization.
CREATE FUNCTION crm.authorized(p uuid,t uuid,a text,d uuid,g uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,crm AS $$
 SELECT CASE WHEN g IS NULL THEN EXISTS(SELECT 1 FROM crm.membership m JOIN crm.role_permission r ON r.role=m.role WHERE m.tenant_id=t AND m.principal_id=p AND m.active AND r.action=a AND (r.scope='tenant' OR EXISTS(SELECT 1 FROM crm.deal x WHERE x.tenant_id=t AND x.id=d AND x.owner_id=p)))
 ELSE EXISTS(SELECT 1 FROM crm.agency_grant x JOIN crm.membership m ON (m.tenant_id,m.id)=(x.agency_tenant_id,x.membership_id) JOIN crm.role_permission r ON r.role=m.role AND r.action=x.action WHERE x.tenant_id=t AND x.id=g AND x.deal_id=d AND x.action=a AND x.revoked_at IS NULL AND x.expires_at>now() AND m.principal_id=p AND m.active AND (r.scope='tenant' OR EXISTS(SELECT 1 FROM crm.deal y WHERE y.tenant_id=t AND y.id=d AND y.owner_id=p))) END
$$;
CREATE FUNCTION crm.can_action(a text,d uuid,g uuid DEFAULT NULL) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,crm AS $$ SELECT crm.tenant_access(crm.context_tenant()) AND crm.authorized(crm.actor(),crm.context_tenant(),a,d,g) $$;
CREATE FUNCTION crm.job_authorized(j uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,crm AS $$ SELECT crm.can_action('automation.execute',NULL) AND EXISTS(SELECT 1 FROM crm.outbox o WHERE o.tenant_id=crm.context_tenant() AND o.id=j AND crm.authorized(o.actor_id,o.tenant_id,'crm.write',o.deal_id,o.grant_id)) $$;
GRANT EXECUTE ON FUNCTION crm.actor(),crm.context_tenant(),crm.tenant_access(uuid),crm.can_action(text,uuid,uuid),crm.job_authorized(uuid) TO crm_runtime;

DO $$ DECLARE n text; BEGIN
 FOREACH n IN ARRAY ARRAY['membership','contact','pipeline','stage','allowed_transition','deal','agency_grant','stage_transition','business_event','command_receipt','api_retry','outbox','worker_effect','audit_log'] LOOP
  EXECUTE format('ALTER TABLE crm.%I ENABLE ROW LEVEL SECURITY',n);
  EXECUTE format('ALTER TABLE crm.%I FORCE ROW LEVEL SECURITY',n);
  EXECUTE format('CREATE POLICY tenant_boundary ON crm.%I USING (crm.tenant_access(tenant_id)) WITH CHECK (crm.tenant_access(tenant_id))',n);
 END LOOP;
END $$;
GRANT SELECT ON crm.contact,crm.pipeline,crm.stage,crm.allowed_transition,crm.deal,crm.stage_transition,crm.business_event,crm.command_receipt,crm.api_retry,crm.outbox,crm.worker_effect,crm.audit_log TO crm_runtime;
GRANT UPDATE(stage_id,version) ON crm.deal TO crm_runtime;
GRANT INSERT ON crm.stage_transition,crm.business_event,crm.command_receipt,crm.api_retry,crm.outbox,crm.worker_effect,crm.audit_log TO crm_runtime;
GRANT UPDATE ON crm.api_retry,crm.outbox TO crm_runtime;
-- Runtime cannot administer credentials, roles, membership/grants, or mutate immutable evidence.
