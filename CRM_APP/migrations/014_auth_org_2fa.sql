-- AUTH_PLAN v2 B1 (migration 014): Better Auth organization + twoFactor plugin tables.
-- Shapes match better-auth@1.7.7 output; hand-added: session.activeOrganizationId typed uuid with FK (B0 U3, the
-- generator emits text), role/status CHECKs (B0 U7: the library accepts owner/admin/member invitations even with
-- custom roles, so the {manager,rep,reader} allow-list is also enforced in the database), unique membership,
-- one twoFactor row per user. `owner` is never stored (creatorRole is "manager"); `worker` is never created here.
CREATE TABLE auth.organization(
 id uuid DEFAULT pg_catalog.gen_random_uuid() NOT NULL PRIMARY KEY,
 name text NOT NULL,
 slug text NOT NULL UNIQUE,
 logo text,
 "createdAt" timestamptz NOT NULL,
 metadata text
);
CREATE TABLE auth.member(
 id uuid DEFAULT pg_catalog.gen_random_uuid() NOT NULL PRIMARY KEY,
 "organizationId" uuid NOT NULL REFERENCES auth.organization(id) ON DELETE CASCADE,
 "userId" uuid NOT NULL REFERENCES auth."user"(id) ON DELETE CASCADE,
 role text NOT NULL CHECK(role IN ('manager','rep','reader')),
 "createdAt" timestamptz NOT NULL,
 UNIQUE("organizationId","userId")
);
CREATE TABLE auth.invitation(
 id uuid DEFAULT pg_catalog.gen_random_uuid() NOT NULL PRIMARY KEY,
 "organizationId" uuid NOT NULL REFERENCES auth.organization(id) ON DELETE CASCADE,
 email text NOT NULL CHECK(email=lower(email)),
 role text CHECK(role IS NOT NULL AND role IN ('manager','rep','reader')),
 status text NOT NULL CHECK(status IN ('pending','accepted','rejected','canceled')),
 "expiresAt" timestamptz NOT NULL,
 "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
 "inviterId" uuid NOT NULL REFERENCES auth."user"(id) ON DELETE CASCADE
);
CREATE TABLE auth."twoFactor"(
 id uuid DEFAULT pg_catalog.gen_random_uuid() NOT NULL PRIMARY KEY,
 secret text NOT NULL,
 "backupCodes" text NOT NULL,
 "userId" uuid NOT NULL UNIQUE REFERENCES auth."user"(id) ON DELETE CASCADE,
 verified boolean,
 "failedVerificationCount" integer CHECK("failedVerificationCount">=0),
 "lockedUntil" timestamptz
);
ALTER TABLE auth."user" ADD COLUMN "twoFactorEnabled" boolean;
ALTER TABLE auth.session ADD COLUMN "activeOrganizationId" uuid REFERENCES auth.organization(id) ON DELETE SET NULL;
CREATE INDEX "member_organizationId_idx" ON auth.member("organizationId");
CREATE INDEX "member_userId_idx" ON auth.member("userId");
CREATE INDEX "invitation_organizationId_idx" ON auth.invitation("organizationId");
CREATE INDEX "invitation_email_idx" ON auth.invitation(email);
CREATE INDEX "twoFactor_secret_idx" ON auth."twoFactor"(secret);

DO $$ DECLARE n text; BEGIN
 FOREACH n IN ARRAY ARRAY['organization','member','invitation','twoFactor'] LOOP
  EXECUTE format('ALTER TABLE auth.%I ENABLE ROW LEVEL SECURITY',n);
  EXECUTE format('CREATE POLICY crm_auth_only ON auth.%I FOR ALL TO crm_auth USING (true) WITH CHECK (true)',n);
  EXECUTE format('REVOKE ALL ON auth.%I FROM PUBLIC',n);
  EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON auth.%I TO crm_auth',n);
 END LOOP;
END $$;
