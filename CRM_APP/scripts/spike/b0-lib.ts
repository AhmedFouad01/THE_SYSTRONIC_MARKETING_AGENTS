// THROWAWAY (P1b B0 performance spike). Not promoted, not part of `npm test`. Do not import from src/ or app/.
// Connection strings are derived in code from ADMIN_DATABASE_URL / DATABASE_URL (db name swapped); never printed.
import pg from "pg";

export const SPIKE_DB = "crm_spike_b0";
export const SPIKE_ROLE = "crm_spike_b0_rt";

function swapDb(url: string, db: string): URL {
	const u = new URL(url);
	u.pathname = `/${db}`;
	return u;
}
export const adminUrl = (db = SPIKE_DB) =>
	swapDb(process.env.ADMIN_DATABASE_URL ?? "", db).toString();
// Spike runtime role connection: same host/port, spike-only user + spike-only random password.
export const roleUrl = (password: string) => {
	const u = swapDb(process.env.ADMIN_DATABASE_URL ?? "", SPIKE_DB);
	u.username = SPIKE_ROLE;
	u.password = password;
	return u.toString();
};
export const adminClient = (db = SPIKE_DB) =>
	new pg.Client({ connectionString: adminUrl(db) });

export const pct = (a: number[], p: number) => {
	const s = [...a].sort((x, y) => x - y);
	return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)];
};
export const median = (a: number[]) => pct(a, 50);
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export const fmt = (n: number) => (Math.round(n * 10) / 10).toString();
