// One-off benchmark for D2: cost of hash+verify at the production scrypt parameters.
// Usage: npx tsx scripts/bench-scrypt.ts [rounds]   (uses an ephemeral pepper; stores nothing)
import { randomBytes } from "node:crypto";
import { PRODUCTION_SCRYPT_PARAMS, createPasswordService } from "../src/auth/password.js";

const rounds = Number(process.argv[2] ?? 3);
const svc = createPasswordService({
	keyring: { activeId: "bench", keys: new Map([["bench", randomBytes(32)]]), ephemeral: true },
});
const pw = randomBytes(18).toString("base64");
const times: number[] = [];
let stored = "";
for (let i = 0; i < rounds; i++) {
	const t0 = performance.now();
	stored = await svc.hash(pw);
	times.push(performance.now() - t0);
}
const t1 = performance.now();
const ok = (await svc.verify(pw, stored)).ok;
const verifyMs = performance.now() - t1;
const { N, r, p } = PRODUCTION_SCRYPT_PARAMS;
console.log(
	JSON.stringify({
		N,
		r,
		p,
		rounds,
		hashMs: times.map((t) => Math.round(t)),
		verifyMs: Math.round(verifyMs),
		verifyOk: ok,
		rssMiB: Math.round(process.memoryUsage().rss / 1048576),
		node: process.version,
		platform: process.platform,
		note: "target 100-250 ms on the EC2 size (AUTH_PLAN D2)",
	}),
);
