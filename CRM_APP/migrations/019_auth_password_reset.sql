-- B5 / U11: only the current known reset identifier per user, never a raw token.
-- Verification rows for 2FA/trusted devices can share value=userId and must be preserved.
CREATE TABLE auth.password_reset_latest(
 user_id uuid PRIMARY KEY REFERENCES auth."user"(id) ON DELETE CASCADE,
 identifier text NOT NULL UNIQUE CHECK(identifier ~ '^[A-Za-z0-9_-]{43}$'),
 expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE auth.password_reset_latest ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_auth_only ON auth.password_reset_latest FOR ALL TO crm_auth USING(true) WITH CHECK(true);
REVOKE ALL ON auth.password_reset_latest FROM PUBLIC,crm_runtime;
GRANT SELECT,INSERT,UPDATE,DELETE ON auth.password_reset_latest TO crm_auth;
