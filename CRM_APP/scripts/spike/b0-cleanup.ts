// THROWAWAY (P1b B0 spike): drops ONLY the disposable database crm_spike_b0 and the spike-only role crm_spike_b0_rt.
import pg from "pg";
import { SPIKE_DB, SPIKE_ROLE, adminUrl } from "./b0-lib.js";
const c = new pg.Client({ connectionString: adminUrl("postgres") });
await c.connect();
const snap = async () => ({
	dbs: (await c.query("select datname from pg_database order by 1")).rows.map((r) => r.datname),
	roles: (await c.query("select rolname from pg_roles where rolname like 'crm%' order by 1")).rows.map((r) => r.rolname),
});
const before = await snap();
await c.query(`DROP DATABASE IF EXISTS ${SPIKE_DB} WITH (FORCE)`);
await c.query(`DROP ROLE IF EXISTS ${SPIKE_ROLE}`);
const after = await snap();
console.log(JSON.stringify({ before, after }, null, 1));
await c.end();
