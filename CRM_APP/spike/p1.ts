import { createHash } from "node:crypto";
import { betterAuth } from "better-auth";
import { createPasswordService, loadPepperKeyring } from "../src/auth/password.js";
import { client, logs, makeOptions, migrate, ok, setup, show, teardown } from "./lib.js";

(globalThis as any).__mail = [];
(globalThis as any).__invites = [];

const { adminPool, appPool } = await setup();
const svc = createPasswordService({ keyring: loadPepperKeyring({ NODE_ENV: "test" } as any) });
const spy = { hash: 0, verify: 0, lastVerifyHashPrefix: "", lastVerifyKeys: [] as string[] };
const hash = async (p: string) => {
	spy.hash++;
	return svc.hash(p);
};
const verify = async (d: { hash: string; password: string }) => {
	spy.verify++;
	spy.lastVerifyHashPrefix = d.hash.slice(0, 18);
	spy.lastVerifyKeys = Object.keys(d);
	return (await svc.verify(d.password, d.hash)).ok;
};
const opts = makeOptions(appPool, { hash, verify, extra: { rateLimit: { enabled: true, storage: "database" } } });
try {
	const mig = await migrate(adminPool, opts);
	show("migration created tables", mig.toBeCreated);
	const cols = await adminPool.query(
		`select table_name, column_name, data_type from information_schema.columns where table_schema='auth' and (column_name='id' or column_name ilike '%Id') order by 1,2`,
	);
	show("U3 id-ish columns", cols.rows.map((r) => `${r.table_name}.${r.column_name}:${r.data_type}`));
	const allCols = await adminPool.query(
		`select column_name, data_type from information_schema.columns where table_schema='auth' and table_name='session' order by ordinal_position`,
	);
	show("auth.session columns", allCols.rows.map((r) => `${r.column_name}:${r.data_type}`));
	const pubTables = await adminPool.query(`select count(*) from information_schema.tables where table_schema='public'`);
	show("U4 public tables created", pubTables.rows[0].count);
	show(
		"U4 spike role privileges",
		(
			await adminPool.query(
				`select has_schema_privilege('crm_spike_auth','public','USAGE') pub_usage, has_schema_privilege('crm_spike_auth','public','CREATE') pub_create, has_schema_privilege('crm_spike_auth','auth','USAGE') auth_usage`,
			)
		).rows[0],
	);

	const auth = betterAuth(opts as any) as any;
	const c = client(auth);
	const pw = "correct horse battery staple 42";
	const su = await c.call("/sign-up/email", { body: { email: "a@example.com", password: pw, name: "Alice" } });
	show("sign-up status/body", { status: su.status, user: su.json?.user?.id, token: su.json?.token });
	ok(spy.hash >= 1, `U2/D1 hash called on sign-up via A1: ${spy.hash}`);
	const acct = await adminPool.query(`select password from auth.account where "providerId"='credential'`);
	show("D1 stored credential hash prefix", acct.rows[0].password.slice(0, 22));
	ok(acct.rows[0].password.startsWith("scrypt$v1$"), "D1 stored hash is A1 format");

	const before = spy.hash;
	const un = await c.call("/sign-in/email", { body: { email: "nobody@example.com", password: pw } });
	show("U2 unknown-email sign-in", { status: un.status, body: un.json, hashCalls: spy.hash - before });
	const wp = await c.call("/sign-in/email", { body: { email: "a@example.com", password: "wrong wrong wrong 1234" } });
	show("U2 wrong-password sign-in", { status: wp.status, body: wp.json });
	ok(JSON.stringify(un.json) === JSON.stringify(wp.json), "unknown vs wrong body identical");

	const v0 = spy.verify;
	const si = await c.call("/sign-in/email", { body: { email: "a@example.com", password: pw } });
	show("sign-in", {
		status: si.status,
		tokenInBody: !!si.json?.token,
		setCookie: si.setCookies.map((s) => s.replace(/=[^;]+/, "=<v>")),
	});
	show("D1 verify args", { calls: spy.verify - v0, keys: spy.lastVerifyKeys, hashArgPrefix: spy.lastVerifyHashPrefix });
	const row = (await adminPool.query(`select * from auth.session`)).rows[0];
	const rawTok = si.json.token as string;
	show("U1 session row token vs body token", {
		rowToken: `${row.token.slice(0, 6)}...`,
		bodyEquals: row.token === rawTok,
		len: row.token.length,
		sha256ofBodyTokenEqualsRow: createHash("sha256").update(rawTok).digest("hex") === row.token,
	});
	const cookieVal = decodeURIComponent([...c.jar.values()][0] ?? "");
	show("U1 cookie value shape", { startsWithRawToken: cookieVal.startsWith(rawTok), cookieNames: [...c.jar.keys()] });
	const gs = await c.call("/get-session");
	ok(gs.status === 200 && gs.json?.user?.email === "a@example.com", "get-session via cookie");
	const forged = await c.call("/get-session", { cookie: `better-auth.session_token=${rawTok}` });
	show("U1 raw token as unsigned cookie accepted?", { status: forged.status, body: forged.json });
	const bear = await c.call("/get-session", { cookie: " ", headers: { authorization: `Bearer ${rawTok}` } });
	show("Bearer w/o bearer plugin", { status: bear.status, body: bear.json });

	await adminPool.query(
		`update auth.session set "createdAt" = now() - interval '400 days', "expiresAt" = now() + interval '1 minute', "updatedAt" = now() - interval '2 days'`,
	);
	const aged = await c.call("/get-session");
	const row2 = (await adminPool.query(`select "createdAt","expiresAt" from auth.session`)).rows[0];
	show("U9 session created 400d ago, expires in 1m, then get-session", {
		status: aged.status,
		createdAt: row2.createdAt,
		expiresAt: row2.expiresAt,
		now: new Date(),
	});

	const c2 = client(auth);
	await c2.call("/sign-in/email", { body: { email: "a@example.com", password: pw } });
	const cnt1 = (await adminPool.query(`select count(*)::int n from auth.session`)).rows[0].n;
	const so = await c2.call("/sign-out", { body: {} });
	const cnt2 = (await adminPool.query(`select count(*)::int n from auth.session`)).rows[0].n;
	show("U10 sign-out deletes row", { resp: so.json, before: cnt1, after: cnt2 });
	const rs = await c.call("/revoke-sessions", { body: {} });
	show("U10 revoke-sessions", {
		status: rs.status,
		remaining: (await adminPool.query(`select count(*)::int n from auth.session`)).rows[0].n,
	});

	const statuses: number[] = [];
	for (let i = 0; i < 12; i++) {
		const r = await c.call("/sign-in/email", {
			cookie: " ",
			headers: { "x-forwarded-for": `203.0.113.${i + 10}` },
			body: { email: "a@example.com", password: `bad bad bad bad ${i}` },
		});
		statuses.push(r.status);
	}
	const good = await c.call("/sign-in/email", {
		cookie: " ",
		headers: { "x-forwarded-for": "203.0.113.200" },
		body: { email: "a@example.com", password: pw },
	});
	show("U8 12 wrong attempts from 12 IPs then correct", { statuses, goodStatus: good.status });
	const rl: number[] = [];
	for (let i = 0; i < 6; i++) {
		const r = await c.call("/sign-in/email", {
			cookie: " ",
			headers: { "x-forwarded-for": "192.0.2.50" },
			body: { email: "a@example.com", password: "bad bad bad bad 1234" },
		});
		rl.push(r.status);
	}
	show("T1 same-IP sign-in rate limit", rl);
	show("rateLimit rows", (await adminPool.query(`select key, count from auth."rateLimit" limit 5`)).rows);
	show("log lines mentioning schema/validate", logs.filter((l) => /schema|valid|migrat/i.test(l)).slice(0, 10));
	show("warn/error logs (first 12)", logs.filter((l) => /^(warn|error)/.test(l)).slice(0, 12));
} finally {
	if (!process.env.SPIKE_KEEP) await teardown(adminPool, appPool);
}
process.exit(0);
