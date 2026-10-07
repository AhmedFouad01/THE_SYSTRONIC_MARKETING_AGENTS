-- AUTH_PLAN v2 B2 (migration 016): the bridge between Better Auth sessions and the CRM request context.
-- 1. crm.session.kind: dev/service sessions (tests, worker, bootstrap) stay valid and keep their own mfa_verified.
-- 2. auth.live_session_user(): the single definition of "a Better Auth session is alive" for the raw token in GUC crm.token.
--    D3: idle 8h + absolute 14 days. Idle is Better Auth's sliding expiresAt (B3 must configure session.expiresIn = 8h); the DB
--    additionally refuses any session whose expiresAt is more than 8h5m ahead, so a misconfigured longer idle window fails loudly
--    instead of silently extending the cap. The absolute cap is createdAt + 14 days (Better Auth has none, B0 U9).
-- 3. crm.actor(): legacy crm.session (hashed lookup, unchanged) OR the live Better Auth session. A forged or stale crm.token cannot
--    create an actor; a revoked session (row deleted by Better Auth) is a 401 on the next request.
-- 4. crm.platform_flag('mfa_required') = ONE platform switch, default OFF (D2: TOTP enforcement deferred to pre-launch). It only
--    governs Better Auth sessions: with it ON an active manager (direct or via agency grant) needs auth."user"."twoFactorEnabled",
--    evaluated live. Legacy crm.session rows keep their own mfa_verified either way. A missing row counts as ON (fail closed).
--    TURN ON BEFORE ANY EXTERNAL CLIENT GETS ACCESS:  UPDATE crm.platform_flag SET enabled=true,updated_at=now() WHERE name='mfa_required';
-- 5. crm.role_permission: user.read / user.invite / user.manage for manager.
-- Same signatures and ACLs as 001/003 (CREATE OR REPLACE keeps owner and grants). Rollback = forward-fix: re-create the 001/003 bodies.

ALTER TABLE crm.session ADD COLUMN kind text NOT NULL DEFAULT 'dev' CHECK(kind IN ('dev','service'));

CREATE TABLE crm.platform_flag(
 name text PRIMARY KEY CHECK(name ~ '^[a-z][a-z_]*$'),
 enabled boolean NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now());
INSERT INTO crm.platform_flag(name,enabled) VALUES('mfa_required',false);
-- Platform configuration, no tenant_id: like crm.session it is read only through definer functions and writable only by the owner.
REVOKE ALL ON crm.platform_flag FROM PUBLIC,crm_runtime,crm_auth;

CREATE FUNCTION auth.live_session_user() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT s."userId" FROM auth.session s
 WHERE s.token=nullif(current_setting('crm.token',true),'')
  AND s."expiresAt">now() AND s."expiresAt"<=now()+interval '8 hours 5 minutes'
  AND s."createdAt">now()-interval '14 days'
  AND EXISTS(SELECT 1 FROM crm.principal p WHERE p.id=s."userId")
$$;
REVOKE EXECUTE ON FUNCTION auth.live_session_user() FROM PUBLIC;

CREATE OR REPLACE FUNCTION crm.actor() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,crm AS $$
 SELECT coalesce(
  (SELECT principal_id FROM crm.session WHERE token_hash=encode(public.digest(current_setting('crm.token',true),'sha256'),'hex') AND expires_at>now()),
  auth.live_session_user())
$$;

CREATE OR REPLACE FUNCTION crm.mfa_ok(p uuid,t uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,crm AS $$
 SELECT NOT EXISTS(SELECT 1 FROM crm.membership m WHERE m.principal_id=p AND m.active AND m.role='manager' AND (m.tenant_id=t OR EXISTS(SELECT 1 FROM crm.agency_grant g WHERE g.tenant_id=t AND g.agency_tenant_id=m.tenant_id AND g.membership_id=m.id AND g.revoked_at IS NULL AND g.expires_at>now())))
  OR EXISTS(SELECT 1 FROM crm.session WHERE principal_id=p AND token_hash=encode(public.digest(current_setting('crm.token',true),'sha256'),'hex') AND expires_at>now() AND mfa_verified)
  OR (coalesce(auth.live_session_user()=p,false)
   AND (NOT coalesce((SELECT f.enabled FROM crm.platform_flag f WHERE f.name='mfa_required'),true)
    OR coalesce((SELECT u."twoFactorEnabled" FROM auth."user" u WHERE u.id=p),false)))
$$;
REVOKE EXECUTE ON FUNCTION crm.actor(),crm.mfa_ok(uuid,uuid) FROM PUBLIC;

INSERT INTO crm.role_permission VALUES ('manager','user.read','tenant'),('manager','user.invite','tenant'),('manager','user.manage','tenant') ON CONFLICT DO NOTHING;
