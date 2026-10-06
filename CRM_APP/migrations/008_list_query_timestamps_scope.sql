-- 008 / ADR-002 P1a (S2 + S3). ADDITIVE ONLY (expand step): no column/data is dropped or rewritten destructively.
-- Old application code keeps working: it ignores the new columns, and the policy form below is semantically identical.
-- Rollback = forward-fix (restore the previous policy text from 001/002; keep the columns). Never drop populated columns.

-- S3: created_at/updated_at on contact/deal/task/lead. Constant-default ADD COLUMN is metadata-only on PG 17 (no table rewrite).
ALTER TABLE crm.contact ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(), ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE crm.deal    ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(), ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE crm.task    ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(), ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE crm.lead    ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(), ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

-- Backfill (deterministic: derived only from existing immutable evidence, so re-running yields the same values).
-- lead: created_at := received_at (exact). contact/deal/task: earliest "<kind>.created" audit row (M1+ writes it);
-- M0-era / directly-seeded rows have none and keep the migration time: honestly "unknown", never a guessed value.
-- updated_at := latest known evidence (audit row, deal stage transition) but never earlier than created_at.
UPDATE crm.lead SET created_at=received_at, updated_at=greatest(received_at,coalesce((SELECT max(a.occurred_at) FROM crm.audit_log a WHERE a.tenant_id=lead.tenant_id AND a.object_kind='lead' AND a.object_id=lead.id),received_at));
UPDATE crm.contact c SET created_at=a.first_at, updated_at=greatest(a.first_at,a.last_at)
 FROM (SELECT tenant_id,object_id,min(occurred_at) FILTER (WHERE action='contact.created') first_at,max(occurred_at) last_at FROM crm.audit_log WHERE object_kind='contact' GROUP BY tenant_id,object_id) a
 WHERE a.tenant_id=c.tenant_id AND a.object_id=c.id AND a.first_at IS NOT NULL;
UPDATE crm.task c SET created_at=a.first_at, updated_at=greatest(a.first_at,a.last_at)
 FROM (SELECT tenant_id,object_id,min(occurred_at) FILTER (WHERE action='task.created') first_at,max(occurred_at) last_at FROM crm.audit_log WHERE object_kind='task' GROUP BY tenant_id,object_id) a
 WHERE a.tenant_id=c.tenant_id AND a.object_id=c.id AND a.first_at IS NOT NULL;
UPDATE crm.deal c SET created_at=a.first_at,
  updated_at=greatest(a.first_at,a.last_at,coalesce((SELECT max(t.occurred_at) FROM crm.stage_transition t WHERE t.tenant_id=c.tenant_id AND t.deal_id=c.id),a.first_at))
 FROM (SELECT tenant_id,object_id,min(occurred_at) FILTER (WHERE action='deal.created') first_at,max(occurred_at) last_at FROM crm.audit_log WHERE object_kind='deal' GROUP BY tenant_id,object_id) a
 WHERE a.tenant_id=c.tenant_id AND a.object_id=c.id AND a.first_at IS NOT NULL;
-- Deals with no .created audit row but with stage transitions: updated_at = last transition (created_at stays "unknown").
UPDATE crm.deal c SET updated_at=greatest(c.created_at,(SELECT max(t.occurred_at) FROM crm.stage_transition t WHERE t.tenant_id=c.tenant_id AND t.deal_id=c.id))
 WHERE EXISTS(SELECT 1 FROM crm.stage_transition t WHERE t.tenant_id=c.tenant_id AND t.deal_id=c.id) AND NOT EXISTS(SELECT 1 FROM crm.audit_log a WHERE a.tenant_id=c.tenant_id AND a.object_kind='deal' AND a.object_id=c.id AND a.action='deal.created');

-- The backfill queued deferred relationship-agreement trigger events on deal/task; flush them now (data is valid: they must pass)
-- because PostgreSQL refuses further DDL on a table with pending trigger events.
SET CONSTRAINTS ALL IMMEDIATE;
SET CONSTRAINTS ALL DEFERRED;

-- updated_at is maintained by the database (not trusted to callers); created_at is immutable after insert.
-- Trigger-set columns need no extra column GRANT for crm_runtime (privileges apply to the statement's target list).
CREATE FUNCTION crm.touch_row() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN NEW.created_at=OLD.created_at; NEW.updated_at=now(); RETURN NEW; END $$;
CREATE TRIGGER contact_touch BEFORE UPDATE ON crm.contact FOR EACH ROW EXECUTE FUNCTION crm.touch_row();
CREATE TRIGGER lead_touch BEFORE UPDATE ON crm.lead FOR EACH ROW EXECUTE FUNCTION crm.touch_row();
CREATE TRIGGER deal_touch BEFORE UPDATE ON crm.deal FOR EACH ROW EXECUTE FUNCTION crm.touch_row();
CREATE TRIGGER task_touch BEFORE UPDATE ON crm.task FOR EACH ROW EXECUTE FUNCTION crm.touch_row();

-- Keyset/default-order indexes (newest first; "assigned" scope variant). Created non-concurrently inside the migration
-- transaction: the migration runner is transactional and today's volume is small. For large tables create them
-- CONCURRENTLY out of band first (same names) -> IF NOT EXISTS makes this a no-op.
CREATE INDEX IF NOT EXISTS contact_tenant_created ON crm.contact(tenant_id,created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS contact_tenant_owner_created ON crm.contact(tenant_id,owner_id,created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS lead_tenant_created ON crm.lead(tenant_id,created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS lead_tenant_owner_created ON crm.lead(tenant_id,owner_id,created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS deal_tenant_created ON crm.deal(tenant_id,created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS deal_tenant_owner_created ON crm.deal(tenant_id,owner_id,created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS task_tenant_created ON crm.task(tenant_id,created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS task_tenant_owner_created ON crm.task(tenant_id,owner_id,created_at DESC,id DESC);

-- S2: hoist authorization out of per-row SECURITY DEFINER calls.
-- (a) Tenant boundary: tenant_access(row.tenant_id) was evaluated per row. The row-independent form below is an InitPlan
--     (evaluated once per statement). Semantics are identical: the old predicate was `t = context AND access(t)`; the new one
--     is `t = (context if access(context) else NULL)`. A NULL result denies USING and fails WITH CHECK, like false.
CREATE FUNCTION crm.context_tenant_if_allowed() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,crm AS $$
 SELECT CASE WHEN crm.tenant_access(crm.context_tenant()) THEN crm.context_tenant() END
$$;
-- (b) Object scope for list paths, resolved ONCE per request instead of crm.can_object() per row.
--     Returns exactly one row (mode='tenant'|'assigned', actor) when the caller holds `a` in the context tenant via a direct,
--     active membership with MFA satisfied; no row otherwise (-> caller answers 403, as can_object() did). Agency grants are
--     fixed-deal only (object_authorized: grant + NULL object is always false), so a grant header yields no list scope.
CREATE FUNCTION crm.object_scope(a text,g uuid DEFAULT NULL) RETURNS TABLE(mode text,actor uuid) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,crm AS $$
 SELECT r.scope,m.principal_id FROM crm.membership m JOIN crm.role_permission r ON r.role=m.role
 WHERE g IS NULL AND crm.tenant_access(crm.context_tenant()) AND crm.mfa_ok(crm.actor(),crm.context_tenant())
   AND m.tenant_id=crm.context_tenant() AND m.principal_id=crm.actor() AND m.active AND r.action=a
$$;
-- (c) Owner display names for `expand=owner`: same population and policy as crm.assignees() (active members holding crm.write
--     in the context tenant, caller must hold crm.read); names only, restricted to the ids asked for (max 200).
CREATE FUNCTION crm.owner_names(ids uuid[]) RETURNS TABLE(id uuid,name text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,crm AS $$
 SELECT p.id,p.name FROM crm.principal p JOIN crm.membership m ON m.principal_id=p.id
 WHERE m.tenant_id=crm.context_tenant() AND m.active AND p.id=ANY(ids) AND cardinality(ids)<=200
   AND EXISTS(SELECT 1 FROM crm.role_permission r WHERE r.role=m.role AND r.action='crm.write')
   AND (SELECT crm.can_object('crm.read','contact',NULL))
$$;
GRANT EXECUTE ON FUNCTION crm.context_tenant_if_allowed(),crm.object_scope(text,uuid),crm.owner_names(uuid[]) TO crm_runtime;

ALTER POLICY tenant_boundary ON crm.contact USING (tenant_id=(SELECT crm.context_tenant_if_allowed())) WITH CHECK (tenant_id=(SELECT crm.context_tenant_if_allowed()));
ALTER POLICY tenant_boundary ON crm.lead USING (tenant_id=(SELECT crm.context_tenant_if_allowed())) WITH CHECK (tenant_id=(SELECT crm.context_tenant_if_allowed()));
ALTER POLICY tenant_boundary ON crm.deal USING (tenant_id=(SELECT crm.context_tenant_if_allowed())) WITH CHECK (tenant_id=(SELECT crm.context_tenant_if_allowed()));
ALTER POLICY tenant_boundary ON crm.task USING (tenant_id=(SELECT crm.context_tenant_if_allowed())) WITH CHECK (tenant_id=(SELECT crm.context_tenant_if_allowed()));
