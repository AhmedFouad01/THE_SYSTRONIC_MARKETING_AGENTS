-- AUTH_PLAN v2 B2 (migration 015): projection triggers auth.* -> crm.* . Better Auth writes identity, orgs and members;
-- crm.principal / crm.tenant / crm.membership are projections maintained here, atomic with Better Auth's own write.
--   auth."user"      -> crm.principal   (same uuid; user rows are never hard-deleted: DELETE is refused)
--   auth.organization-> crm.tenant      (same uuid)
--   auth.member      -> crm.membership  (key = (tenant_id, principal_id); roles {manager,rep,reader}, owner -> manager;
--                                        removal sets active=false, never DELETE; worker memberships are never touched)
--   last-manager guard: a change that would leave a tenant (still existing) with zero active managers is refused (23514).
-- All functions: SECURITY DEFINER (owner = migrator), fixed search_path, every object schema-qualified, REVOKE EXECUTE FROM PUBLIC
-- and no grant to anyone (triggers do not need EXECUTE at fire time). No tenant GUC is involved: Better Auth connects as crm_auth,
-- which has no privilege on schema crm; the write into crm.* happens as the owner inside the same transaction.
-- Rollback = forward-fix (drop the triggers; crm.* rows stay valid). Down-migration is not recovery.

-- crm.membership is FORCE ROW LEVEL SECURITY. A superuser/BYPASSRLS migrator is unaffected; a least-privilege migrator that owns the
-- table is not, so give the owner (and therefore its definer functions) an explicit policy. crm_runtime is untouched (tenant_boundary).
DO $$ BEGIN
 EXECUTE format('CREATE POLICY projection_owner ON crm.membership FOR ALL TO %I USING (true) WITH CHECK (true)', current_user);
END $$;

CREATE FUNCTION auth.project_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 IF TG_OP='UPDATE' AND NEW.id<>OLD.id THEN RAISE EXCEPTION 'auth.user id is immutable' USING ERRCODE='23514'; END IF;
 INSERT INTO crm.principal(id,name) VALUES(NEW.id,NEW.name) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name;
 RETURN NULL;
END $$;

CREATE FUNCTION auth.refuse_user_delete() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 RAISE EXCEPTION 'auth.user rows are never deleted (audit and agency-grant rows reference the principal)' USING ERRCODE='23514';
END $$;

CREATE FUNCTION auth.project_organization() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 IF TG_OP='UPDATE' AND NEW.id<>OLD.id THEN RAISE EXCEPTION 'auth.organization id is immutable' USING ERRCODE='23514'; END IF;
 INSERT INTO crm.tenant(id,name) VALUES(NEW.id,NEW.name) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name;
 RETURN NULL;
END $$;

-- Serialises concurrent manager removals per tenant (NO KEY UPDATE does not block ordinary tenant data inserts), then checks the
-- state this transaction has already written. Called AFTER the projection, so the count includes the change being guarded.
CREATE FUNCTION auth.assert_tenant_has_manager(t uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 PERFORM 1 FROM crm.tenant WHERE id=t FOR NO KEY UPDATE;
 IF NOT EXISTS(SELECT 1 FROM crm.membership WHERE tenant_id=t AND role='manager' AND active) THEN
  RAISE EXCEPTION 'tenant % would be left without an active manager', t USING ERRCODE='23514';
 END IF;
END $$;

CREATE FUNCTION auth.project_member() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE r text; cur_role text;
BEGIN
 IF TG_OP='DELETE' THEN
  UPDATE crm.membership SET active=false WHERE tenant_id=OLD."organizationId" AND principal_id=OLD."userId" AND role<>'worker';
  -- Deleting a whole organization cascades its members; only a removal from a surviving tenant is guarded.
  IF OLD.role IN ('manager','owner') AND EXISTS(SELECT 1 FROM auth.organization WHERE id=OLD."organizationId") THEN
   PERFORM auth.assert_tenant_has_manager(OLD."organizationId");
  END IF;
  RETURN NULL;
 END IF;
 IF TG_OP='UPDATE' AND (NEW."organizationId"<>OLD."organizationId" OR NEW."userId"<>OLD."userId") THEN
  RAISE EXCEPTION 'auth.member organization and user are immutable' USING ERRCODE='23514';
 END IF;
 r := CASE NEW.role WHEN 'owner' THEN 'manager' WHEN 'manager' THEN 'manager' WHEN 'rep' THEN 'rep' WHEN 'reader' THEN 'reader' END;
 IF r IS NULL THEN RAISE EXCEPTION 'role % is not allowed for a member', NEW.role USING ERRCODE='23514'; END IF;
 SELECT m.role INTO cur_role FROM crm.membership m WHERE m.tenant_id=NEW."organizationId" AND m.principal_id=NEW."userId";
 IF NOT FOUND THEN
  INSERT INTO crm.membership(tenant_id,id,principal_id,role,active) VALUES(NEW."organizationId",NEW.id,NEW."userId",r,true);
 ELSIF cur_role='worker' THEN
  RAISE EXCEPTION 'worker memberships are not managed through auth.member' USING ERRCODE='23514';
 ELSE
  -- Re-adding a previously removed person reuses the old row (its id is referenced by agency grants and audit rows).
  UPDATE crm.membership SET role=r, active=true WHERE tenant_id=NEW."organizationId" AND principal_id=NEW."userId";
 END IF;
 IF TG_OP='UPDATE' AND OLD.role IN ('manager','owner') AND r<>'manager' THEN
  PERFORM auth.assert_tenant_has_manager(NEW."organizationId");
 END IF;
 RETURN NULL;
END $$;

REVOKE EXECUTE ON FUNCTION auth.project_user(),auth.refuse_user_delete(),auth.project_organization(),auth.assert_tenant_has_manager(uuid),auth.project_member() FROM PUBLIC;

CREATE TRIGGER project_user AFTER INSERT OR UPDATE OF id,name ON auth."user" FOR EACH ROW EXECUTE FUNCTION auth.project_user();
CREATE TRIGGER refuse_user_delete BEFORE DELETE ON auth."user" FOR EACH ROW EXECUTE FUNCTION auth.refuse_user_delete();
CREATE TRIGGER project_organization AFTER INSERT OR UPDATE OF id,name ON auth.organization FOR EACH ROW EXECUTE FUNCTION auth.project_organization();
CREATE TRIGGER project_member AFTER INSERT OR UPDATE OR DELETE ON auth.member FOR EACH ROW EXECUTE FUNCTION auth.project_member();

-- Backfill (idempotent; the auth tables are empty before B3, this only matters if rows were created by hand). Re-fires the triggers.
UPDATE auth."user" SET name=name;
UPDATE auth.organization SET name=name;
UPDATE auth.member SET role=role;
