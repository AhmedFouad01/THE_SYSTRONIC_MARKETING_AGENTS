-- AUTH_PLAN v2 B1 (migration 013): schema `auth` + role `crm_auth` + Better Auth core tables.
-- Table shapes = what better-auth@1.7.7 generates (organization + twoFactor plugins, generateId "uuid",
-- schemaName "auth", rateLimit.storage "database"), reviewed and hardened by hand (B0 U3/U4):
-- FKs, CHECKs and UNIQUEs added, `public` USAGE denied to crm_auth, crm_runtime has no grant on `auth`,
-- crm_auth has no privilege on `crm`. Tenant RLS does not apply (these tables are global): isolation is
-- schema + role + grants, with ENABLE (not FORCE) RLS and one policy for crm_auth as defence in depth.
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='crm_auth') THEN CREATE ROLE crm_auth LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS CONNECTION LIMIT 10; END IF; END $$;

-- PUBLIC has USAGE on schema public by default; a role cannot be denied it individually. Revoke it from PUBLIC
-- and give it back to the one role that has always relied on it. crm_auth then cannot even name public objects.
REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO crm_runtime;

CREATE SCHEMA auth;
REVOKE ALL ON SCHEMA auth FROM PUBLIC;
GRANT USAGE ON SCHEMA auth TO crm_auth;
-- No ALTER DEFAULT PRIVILEGES here: a schema-level REVOKE cannot undo the global PUBLIC EXECUTE default, so every
-- future definer in auth must REVOKE EXECUTE FROM PUBLIC itself (015/016); the catalog test below guards it.

CREATE TABLE auth."user"(
 id uuid DEFAULT pg_catalog.gen_random_uuid() NOT NULL PRIMARY KEY,
 name text NOT NULL,
 email text NOT NULL UNIQUE CHECK(email=lower(email)),
 "emailVerified" boolean NOT NULL,
 image text,
 "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
 "updatedAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE auth.session(
 id uuid DEFAULT pg_catalog.gen_random_uuid() NOT NULL PRIMARY KEY,
 "expiresAt" timestamptz NOT NULL,
 token text NOT NULL UNIQUE,
 "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
 "updatedAt" timestamptz NOT NULL,
 "ipAddress" text,
 "userAgent" text,
 "userId" uuid NOT NULL REFERENCES auth."user"(id) ON DELETE CASCADE
);
CREATE TABLE auth.account(
 id uuid DEFAULT pg_catalog.gen_random_uuid() NOT NULL PRIMARY KEY,
 "accountId" text NOT NULL,
 "providerId" text NOT NULL,
 "userId" uuid NOT NULL REFERENCES auth."user"(id) ON DELETE CASCADE,
 "accessToken" text,
 "refreshToken" text,
 "idToken" text,
 "accessTokenExpiresAt" timestamptz,
 "refreshTokenExpiresAt" timestamptz,
 scope text,
 password text,
 "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
 "updatedAt" timestamptz NOT NULL,
 UNIQUE("providerId","accountId")
);
CREATE TABLE auth.verification(
 id uuid DEFAULT pg_catalog.gen_random_uuid() NOT NULL PRIMARY KEY,
 identifier text NOT NULL,
 value text NOT NULL,
 "expiresAt" timestamptz NOT NULL,
 "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
 "updatedAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE auth."rateLimit"(
 id uuid DEFAULT pg_catalog.gen_random_uuid() NOT NULL PRIMARY KEY,
 key text NOT NULL UNIQUE,
 count integer NOT NULL CHECK(count>=0),
 "lastRequest" bigint NOT NULL
);
CREATE INDEX "session_userId_idx" ON auth.session("userId");
CREATE INDEX "account_userId_idx" ON auth.account("userId");
CREATE INDEX "verification_identifier_idx" ON auth.verification(identifier);

DO $$ DECLARE n text; BEGIN
 FOREACH n IN ARRAY ARRAY['user','session','account','verification','rateLimit'] LOOP
  EXECUTE format('ALTER TABLE auth.%I ENABLE ROW LEVEL SECURITY',n);
  EXECUTE format('CREATE POLICY crm_auth_only ON auth.%I FOR ALL TO crm_auth USING (true) WITH CHECK (true)',n);
  EXECUTE format('REVOKE ALL ON auth.%I FROM PUBLIC',n);
  EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON auth.%I TO crm_auth',n);
 END LOOP;
END $$;
