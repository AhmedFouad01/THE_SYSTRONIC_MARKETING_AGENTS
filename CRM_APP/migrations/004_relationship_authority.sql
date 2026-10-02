-- Keep scheduled-event authority on the actual bounded worker principal.
CREATE OR REPLACE FUNCTION crm.job_authorized(j uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,crm AS $$
 SELECT crm.can_action('automation.execute',NULL) AND EXISTS(
  SELECT 1 FROM crm.outbox o JOIN crm.business_event e ON (e.tenant_id,e.id)=(o.tenant_id,o.event_id)
  WHERE o.tenant_id=crm.context_tenant() AND o.id=j AND CASE
   WHEN e.name='task.escalated' THEN crm.authorized(o.actor_id,o.tenant_id,'automation.execute',NULL,NULL) AND EXISTS(SELECT 1 FROM crm.task t WHERE t.tenant_id=o.tenant_id AND t.id=o.object_id AND crm.assignment_ok(t.owner_id))
   WHEN o.deal_id IS NOT NULL THEN crm.authorized(o.actor_id,o.tenant_id,'crm.write',o.deal_id,o.grant_id)
   ELSE crm.object_authorized(o.actor_id,o.tenant_id,'crm.write',o.object_kind,o.object_id,o.grant_id) END)
$$;
-- Deferred checks allow an explicit merge to move every related row atomically.
CREATE FUNCTION crm.check_relationship_agreement() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,crm AS $$
BEGIN
 IF TG_TABLE_NAME='task' THEN
  IF EXISTS(SELECT 1 FROM crm.task t JOIN crm.deal d ON (d.tenant_id,d.id)=(t.tenant_id,t.deal_id) WHERE t.tenant_id=NEW.tenant_id AND t.id=NEW.id AND t.contact_id IS NOT NULL AND t.contact_id<>d.contact_id) THEN RAISE check_violation USING MESSAGE='Task contact/deal disagreement'; END IF;
 ELSE
  IF EXISTS(SELECT 1 FROM crm.deal d JOIN crm.lead l ON (l.tenant_id,l.id)=(d.tenant_id,d.lead_id) WHERE d.tenant_id=NEW.tenant_id AND d.id=NEW.id AND d.contact_id<>l.contact_id) OR EXISTS(SELECT 1 FROM crm.task t JOIN crm.deal d ON (d.tenant_id,d.id)=(t.tenant_id,t.deal_id) WHERE d.tenant_id=NEW.tenant_id AND d.id=NEW.id AND t.contact_id IS NOT NULL AND t.contact_id<>d.contact_id) THEN RAISE check_violation USING MESSAGE='Deal relationship disagreement'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER task_relationship_agreement AFTER INSERT OR UPDATE ON crm.task DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION crm.check_relationship_agreement();
CREATE CONSTRAINT TRIGGER deal_relationship_agreement AFTER INSERT OR UPDATE ON crm.deal DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION crm.check_relationship_agreement();
