import pg from "pg";
const c = new pg.Client({ connectionString: process.env.ADMIN_DATABASE_URL });
await c.connect();
await c.query("drop database if exists crm_spike_b0 with (force)");
await c.query("drop role if exists crm_spike_auth");
const r = await c.query("select (select count(*) from pg_database where datname='crm_spike_b0') db, (select count(*) from pg_roles where rolname='crm_spike_auth') role");
console.log(JSON.stringify(r.rows[0]));
await c.end();
