-- AUTH_PLAN v2 B3 (migration 017): per-account password lockout (B0 U8: Better Auth has none) + append-only auth audit.
-- 1. auth.login_throttle: failed-sign-in counter per account KEY = sha256(lower(email)) computed in Node, so it applies
--    identically to unknown emails (no enumeration) and the DB never stores a plain address here.
--    Policy: 5 consecutive failures inside a 15-minute window lock the key for 15 minutes; a lock refuses even the correct
--    password (the lock is checked before any password work). A success clears the counter.
-- 2. auth.auth_event: append-only audit of sign-in outcomes (key hash only, never a password or token). UPDATE, DELETE and
--    TRUNCATE are refused for every role including the owner; retention pruning needs a dedicated migration or owner action.
-- 3. Both tables are written ONLY through the three SECURITY DEFINER functions below. crm_auth has EXECUTE on those three and
--    NO privilege on the tables; crm_runtime has nothing. Tenant RLS does not apply (global tables): ENABLE RLS with no policy
--    for anyone but the owner, which bypasses it (not FORCE), so an accidental grant would still read zero rows.
-- Same conventions as 015/016: fixed search_path, REVOKE EXECUTE FROM PUBLIC, entry in the migrate.ts repair block.

CREATE TABLE auth.login_throttle(
 key text PRIMARY KEY CHECK(key ~ '^[0-9a-f]{64}$'),
 failures integer NOT NULL CHECK(failures>=0),
 window_start timestamptz NOT NULL,
 locked_until timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX login_throttle_updated_idx ON auth.login_throttle(updated_at);

CREATE TABLE auth.auth_event(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 at timestamptz NOT NULL DEFAULT now(),
 event text NOT NULL CHECK(event IN ('signin_ok','signin_fail','signin_refused_locked','lock_started')),
 key text CHECK(key ~ '^[0-9a-f]{64}$'));
CREATE INDEX auth_event_at_idx ON auth.auth_event(at);

CREATE FUNCTION auth.auth_event_append_only() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN RAISE EXCEPTION 'auth.auth_event is append-only' USING ERRCODE='23514'; END $$;
CREATE TRIGGER auth_event_no_update_delete BEFORE UPDATE OR DELETE ON auth.auth_event FOR EACH ROW EXECUTE FUNCTION auth.auth_event_append_only();
CREATE TRIGGER auth_event_no_truncate BEFORE TRUNCATE ON auth.auth_event FOR EACH STATEMENT EXECUTE FUNCTION auth.auth_event_append_only();

ALTER TABLE auth.login_throttle ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.auth_event ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON auth.login_throttle, auth.auth_event FROM PUBLIC, crm_auth, crm_runtime;

-- Seconds the key is still locked (0 = open). Records a refusal event when locked.
CREATE FUNCTION auth.login_gate(k text) RETURNS integer LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE s integer;
BEGIN
 SELECT greatest(0,ceil(extract(epoch FROM t.locked_until-now())))::integer INTO s FROM auth.login_throttle t WHERE t.key=k AND t.locked_until>now();
 IF coalesce(s,0)>0 THEN INSERT INTO auth.auth_event(event,key) VALUES('signin_refused_locked',k); RETURN s; END IF;
 RETURN 0;
END $$;

-- One failed attempt. Returns the lock length in seconds if this failure started (or the key already had) a lock, else 0.
CREATE FUNCTION auth.login_failed(k text) RETURNS integer LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE r auth.login_throttle; s integer := 0;
BEGIN
 DELETE FROM auth.login_throttle WHERE updated_at<now()-interval '1 day' AND key<>k;
 INSERT INTO auth.login_throttle AS t(key,failures,window_start,updated_at) VALUES(k,1,now(),now())
 ON CONFLICT(key) DO UPDATE SET
  failures=CASE WHEN t.window_start<now()-interval '15 minutes' AND coalesce(t.locked_until,'-infinity')<now() THEN 1 ELSE t.failures+1 END,
  window_start=CASE WHEN t.window_start<now()-interval '15 minutes' AND coalesce(t.locked_until,'-infinity')<now() THEN now() ELSE t.window_start END,
  locked_until=CASE WHEN t.window_start<now()-interval '15 minutes' AND coalesce(t.locked_until,'-infinity')<now() THEN NULL ELSE t.locked_until END,
  updated_at=now()
 RETURNING * INTO r;
 INSERT INTO auth.auth_event(event,key) VALUES('signin_fail',k);
 IF r.failures>=5 AND coalesce(r.locked_until,'-infinity')<now() THEN
  UPDATE auth.login_throttle SET locked_until=now()+interval '15 minutes' WHERE key=k;
  INSERT INTO auth.auth_event(event,key) VALUES('lock_started',k);
  s := 900;
 END IF;
 RETURN s;
END $$;

CREATE FUNCTION auth.login_succeeded(k text) RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 DELETE FROM auth.login_throttle WHERE key=k;
 INSERT INTO auth.auth_event(event,key) VALUES('signin_ok',k);
END $$;

REVOKE EXECUTE ON FUNCTION auth.login_gate(text),auth.login_failed(text),auth.login_succeeded(text),auth.auth_event_append_only() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION auth.login_gate(text),auth.login_failed(text),auth.login_succeeded(text) TO crm_auth;
