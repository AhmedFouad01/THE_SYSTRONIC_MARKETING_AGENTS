import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, memberAc, ownerAc } from "better-auth/plugins/organization/access";
import { client, logs, makeOptions, migrate, setup, show, teardown, totpNow } from "./lib.js";

(globalThis as any).__mail = [];
(globalThis as any).__invites = [];
const { adminPool, appPool } = await setup();
const ev: string[] = [];
const ac = createAccessControl(defaultStatements);
const roles = {
	manager: ac.newRole(ownerAc.statements),
	rep: ac.newRole(memberAc.statements),
	reader: ac.newRole(memberAc.statements),
};
const dbHooks = {
	session: {
		create: { after: async (s: any) => { ev.push(`session.create ${String(s.userId).slice(0, 6)}`); } },
		delete: { after: async (s: any) => { ev.push(`session.delete ${String(s.userId).slice(0, 6)}`); } },
	},
};
const refuseTrust = createAuthMiddleware(async (ctx: any) => {
	if (/^\/two-factor\/verify-/.test(ctx.path) && ctx.body?.trustDevice) throw new APIError("BAD_REQUEST", { message: "trustDevice refused" });
});
const base = makeOptions(appPool, { orgOpts: { ac, roles }, extra: { databaseHooks: dbHooks } });
const opts2 = makeOptions(appPool, { orgOpts: { ac, roles }, extra: { databaseHooks: dbHooks, hooks: { before: refuseTrust } } });
try {
	const mig = await migrate(adminPool, base);
	await adminPool.query(`create temp table _x(a int)`).catch(() => {});
	const auth = betterAuth(base as any) as any;
	const auth2 = betterAuth(opts2 as any) as any;
	const pw = "correct horse battery staple 42";
	const c = client(auth);
	await c.call("/sign-up/email", { body: { email: "m@example.com", password: pw, name: "M" } });
	await c.call("/sign-in/email", { body: { email: "m@example.com", password: pw } });
	const en = await c.call("/two-factor/enable", { body: { password: pw } });
	const flag = async () => (await adminPool.query(`select "twoFactorEnabled" f from auth."user" where email='m@example.com'`)).rows[0].f;
	show("U5 enable", { status: en.status, hasUri: !!en.json?.totpURI, backup: en.json?.backupCodes?.length, flagBeforeVerify: await flag() });
	const v = await c.call("/two-factor/verify-totp", { body: { code: await totpNow(en.json.totpURI) } });
	show("U5 verify-totp (enrolment)", { status: v.status, flagAfterVerify: await flag() });

	// fresh sign-in of a 2FA user
	ev.length = 0;
	const c2 = client(auth);
	const si = await c2.call("/sign-in/email", { body: { email: "m@example.com", password: pw } });
	show("U5 2FA user sign-in", {
		status: si.status,
		body: si.json,
		cookies: si.setCookies.map((s: string) => s.replace(/=[^;]+/, "=<v>").slice(0, 70)),
		sessionRowsForUser: (await adminPool.query(`select count(*)::int n from auth.session s join auth."user" u on u.id=s."userId" where u.email='m@example.com' and s.id <> (select id from auth.session order by "createdAt" asc limit 1)`)).rows[0].n,
		sessionEvents: [...ev],
	});
	const gs = await c2.call("/get-session");
	show("U5 get-session between steps", { status: gs.status, body: gs.json });

	// trustDevice on the unhardened instance
	const vt = await c2.call("/two-factor/verify-totp", { body: { code: await totpNow(en.json.totpURI), trustDevice: true } });
	const trust = [...c2.jar].find(([k]) => /trust_device/.test(k));
	show("U5 verify-totp trustDevice:true (no hook)", { status: vt.status, trustCookieSet: !!trust });
	const c3 = client(auth);
	if (trust) c3.jar.set(trust[0], trust[1]);
	const sb = await c3.call("/sign-in/email", { body: { email: "m@example.com", password: pw } });
	show("U5 sign-in presenting trust cookie, NO second factor", { status: sb.status, twoFactorRedirect: sb.json?.twoFactorRedirect ?? false, tokenIssued: !!sb.json?.token });

	// refused on hardened instance (a new 2FA challenge on auth2)
	const c4 = client(auth2);
	await c4.call("/sign-in/email", { body: { email: "m@example.com", password: pw } });
	const vr = await c4.call("/two-factor/verify-totp", { body: { code: await totpNow(en.json.totpURI), trustDevice: true } });
	show("U5 hook refusal", { status: vr.status, body: vr.json, trustCookieSet: [...c4.jar.keys()].some((k) => /trust_device/.test(k)) });
	const vok = await c4.call("/two-factor/verify-totp", { body: { code: await totpNow(en.json.totpURI) } });
	show("U5 same challenge without trustDevice after refusal", { status: vok.status });

	// backup code single use
	const c5 = client(auth);
	await c5.call("/sign-in/email", { body: { email: "m@example.com", password: pw } });
	const code = en.json.backupCodes[0];
	const b1 = await c5.call("/two-factor/verify-backup-code", { body: { code } });
	const c6 = client(auth);
	await c6.call("/sign-in/email", { body: { email: "m@example.com", password: pw } });
	const b2 = await c6.call("/two-factor/verify-backup-code", { body: { code } });
	show("U5 backup code use then reuse", { first: b1.status, second: b2.status });

	// 2FA account lockout (bad codes)
	const st: number[] = [];
	for (let i = 0; i < 12; i++) {
		const cc = client(auth);
		await cc.call("/sign-in/email", { body: { email: "m@example.com", password: pw } });
		const r = await cc.call("/two-factor/verify-totp", { body: { code: "000000" } });
		st.push(r.status);
	}
	show("U8 2FA wrong codes x12 (fresh challenge each)", st);

	// ---- U7 organization
	await c.call("/sign-out", { body: {} });
	const co = client(auth);
	const ou = await co.call("/sign-up/email", { body: { email: "o@example.com", password: pw, name: "O" } });
	const oid = ou.json.user.id;
	const org = await auth.api.createOrganization({ body: { name: "Tenant A", slug: "tenant-a", userId: oid } });
	const mem = (await adminPool.query(`select role, "organizationId"::text oid from auth.member`)).rows;
	show("U7 server createOrganization({userId}) with allowUserToCreateOrganization=false", { orgId: org.id, members: mem });
	await co.call("/sign-in/email", { body: { email: "o@example.com", password: pw } });
	const http = await co.call("/organization/create", { body: { name: "Evil", slug: "evil" } });
	show("U7 HTTP organization/create by user", { status: http.status, body: http.json });
	const inv: Record<string, unknown> = {};
	for (const role of ["rep", "reader", "owner", "admin", "member", "bogus"]) {
		const r = await co.call("/organization/invite-member", { body: { email: `${role}@example.com`, role, organizationId: org.id } });
		inv[role] = { status: r.status, msg: r.json?.message ?? r.json?.role ?? null };
	}
	show("U7 invite-member roles as manager (custom roles manager/rep/reader)", inv);
	show("U7 invitation rows", (await adminPool.query(`select email, role, status from auth.invitation order by email`)).rows);
	const lm = await co.call("/organization/leave", { body: { organizationId: org.id } });
	show("U7 sole manager leaves org", { status: lm.status, body: lm.json, memberRows: (await adminPool.query(`select count(*)::int n from auth.member`)).rows[0].n });
	show("U4 schema-validation logs", logs.filter((l) => /schema/i.test(l) && !/PostgreSQL migration|does not exist yet|Found 0/.test(l)).slice(0, 5));
	// U4 negative: break schema, boot fresh instance
	await adminPool.query(`alter table auth."user" rename column image to image_x`);
	logs.length = 0;
	process.on("uncaughtException", (e: any) => { logs.push(`UNCAUGHT ${e?.code}: ${String(e?.message).replace(/\s+/g, " ").slice(0, 120)}`); });
	const auth3 = betterAuth(makeOptions(appPool, { orgOpts: { ac, roles } }) as any) as any;
	await client(auth3).call("/get-session").catch(() => {});
	await new Promise((r) => setTimeout(r, 800));
	show("U4 validateSchema with a drifted table", logs.filter((l) => /^(error|warn|UNCAUGHT)/.test(l)).slice(0, 4));
	show("tables", mig.toBeCreated);
} finally {
	if (!process.env.SPIKE_KEEP) await teardown(adminPool, appPool);
}
process.exit(0);
