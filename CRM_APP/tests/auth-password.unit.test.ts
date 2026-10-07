import { describe, expect, it } from "vitest";
import {
	HashBusyError,
	MAX_CONCURRENT_HASHES,
	PRODUCTION_SCRYPT_PARAMS,
	type PepperKeyring,
	type ScryptParams,
	PepperConfigError,
	checkPasswordPolicy,
	constantTimeEqual,
	createPasswordService,
	decodeHash,
	loadPepperKeyring,
} from "../src/auth/password.js";

// Test-only peppers (not secrets): 32 bytes, base64.
const PEPPER_1 = Buffer.alloc(32, 1);
const PEPPER_2 = Buffer.alloc(32, 2);
const ring = (activeId: string, ids: Record<string, Buffer>): PepperKeyring => ({
	activeId,
	keys: new Map(Object.entries(ids)),
	ephemeral: false,
});
const FAST: ScryptParams = { ...PRODUCTION_SCRYPT_PARAMS, N: 2 ** 10 };
const PW = "correct pony staple 42";

describe("production defaults (AUTH_PLAN D2)", () => {
	it("are exactly N=2^17, r=8, p=1, 32-byte key, 16-byte salt, 256 MiB maxmem, 2 concurrent", () => {
		expect(PRODUCTION_SCRYPT_PARAMS).toEqual({
			N: 131072,
			r: 8,
			p: 1,
			keylen: 32,
			saltLen: 16,
			maxmem: 268435456,
		});
		expect(MAX_CONCURRENT_HASHES).toBe(2);
	});
});

describe("hash / verify", () => {
	const svc = createPasswordService({ keyring: ring("a1", { a1: PEPPER_1 }), params: FAST });

	it("round-trips and encodes a self-describing string", async () => {
		const h = await svc.hash(PW);
		expect(h).toMatch(/^scrypt\$v1\$a1\$1024\$8\$1\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
		expect(await svc.verify(PW, h)).toEqual({ ok: true, needsRehash: false });
		expect(h).not.toContain(PW);
	});
	it("uses a fresh salt per hash", async () => {
		expect(await svc.hash(PW)).not.toBe(await svc.hash(PW));
	});
	it("rejects a wrong password", async () => {
		const h = await svc.hash(PW);
		expect((await svc.verify(`${PW}x`, h)).ok).toBe(false);
	});
	it("treats NFKC-equivalent passwords as equal", async () => {
		const h = await svc.hash("ｆｕｌｌｗｉｄｔｈ-pass-1");
		expect((await svc.verify("fullwidth-pass-1", h)).ok).toBe(true);
	});
	it("rejects a 129-character password in hash and verify", async () => {
		const long = "a".repeat(129);
		await expect(svc.hash(long)).rejects.toThrow(RangeError);
		const h = await svc.hash(PW);
		expect((await svc.verify(long, h)).ok).toBe(false);
		await expect(svc.hash("a".repeat(128))).resolves.toBeTypeOf("string");
	});
});

describe("param upgrade and pepper rotation", () => {
	it("flags a hash made with older params for rehash, after a successful verify", async () => {
		const old = createPasswordService({ keyring: ring("a1", { a1: PEPPER_1 }), params: FAST });
		const next = createPasswordService({
			keyring: ring("a1", { a1: PEPPER_1 }),
			params: { ...FAST, N: 2 ** 11 },
		});
		const h = await old.hash(PW);
		expect(old.needsRehash(h)).toBe(false);
		expect(next.needsRehash(h)).toBe(true);
		expect(await next.verify(PW, h)).toEqual({ ok: true, needsRehash: true });
		expect(await next.verify("wrong password 123", h)).toEqual({ ok: false, needsRehash: false });
		const upgraded = await next.hash(PW);
		expect(next.needsRehash(upgraded)).toBe(false);
		expect(decodeHash(upgraded)?.params.N).toBe(2 ** 11);
	});
	it("verifies old pepper ids during rotation, flags rehash, and fails without the old key", async () => {
		const v1 = createPasswordService({ keyring: ring("a1", { a1: PEPPER_1 }), params: FAST });
		const h = await v1.hash(PW);
		const rotated = createPasswordService({
			keyring: ring("b2", { a1: PEPPER_1, b2: PEPPER_2 }),
			params: FAST,
		});
		expect(await rotated.verify(PW, h)).toEqual({ ok: true, needsRehash: true });
		expect(decodeHash(await rotated.hash(PW))?.kid).toBe("b2");
		const dropped = createPasswordService({ keyring: ring("b2", { b2: PEPPER_2 }), params: FAST });
		expect((await dropped.verify(PW, h)).ok).toBe(false);
	});
	it("a different pepper under the same id does not verify", async () => {
		const a = createPasswordService({ keyring: ring("a1", { a1: PEPPER_1 }), params: FAST });
		const b = createPasswordService({ keyring: ring("a1", { a1: PEPPER_2 }), params: FAST });
		expect((await b.verify(PW, await a.hash(PW))).ok).toBe(false);
	});
});

describe("malformed stored hashes fail closed", () => {
	const svc = createPasswordService({ keyring: ring("a1", { a1: PEPPER_1 }), params: FAST });
	it.each([
		"",
		"plaintext",
		"scrypt$v1$a1$1024$8$1$AAAA",
		"scrypt$v2$a1$1024$8$1$AAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
		"scrypt$v1$a1$1000$8$1$AAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", // N not a power of 2
		"scrypt$v1$a1$1099511627776$8$1$AAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", // memory bomb
		"scrypt$v1$a1$1024$8$99$AAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
		"scrypt$v1$a1$1024$8$1$not base64!$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
		"scrypt$v1$zz$1024$8$1$AAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", // unknown kid
		`scrypt$v1$a1$1024$8$1$${"A".repeat(600)}$AAAA`,
	])("verify returns false for %j", async (stored) => {
		expect(await svc.verify(PW, stored)).toEqual({ ok: false, needsRehash: false });
	});
	it("needsRehash is true for garbage (never trusted as current)", () => {
		expect(svc.needsRehash("garbage")).toBe(true);
	});
});

describe("constant-time compare", () => {
	it("compares equal/unequal buffers and lengths", () => {
		expect(constantTimeEqual(Buffer.from("abc"), Buffer.from("abc"))).toBe(true);
		expect(constantTimeEqual(Buffer.from("abc"), Buffer.from("abd"))).toBe(false);
		expect(constantTimeEqual(Buffer.from("abc"), Buffer.from("abcd"))).toBe(false);
	});
});

describe("dummy verify", () => {
	const params: ScryptParams = { ...PRODUCTION_SCRYPT_PARAMS, N: 2 ** 13 };
	const svc = createPasswordService({ keyring: ring("a1", { a1: PEPPER_1 }), params });
	const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] as number;
	const time = async (fn: () => Promise<unknown>) => {
		const t = performance.now();
		await fn();
		return performance.now() - t;
	};

	it("always returns false, even for the dummy's own cost inputs", async () => {
		expect(await svc.dummyVerify(PW)).toBe(false);
		expect(await svc.dummyVerify("")).toBe(false);
		expect(await svc.dummyVerify("a".repeat(500))).toBe(false);
	});
	it("costs within 30% of a real verify (median of 7)", async () => {
		const real = await svc.hash(PW);
		await svc.dummyVerify(PW); // warm-up + builds the dummy hash
		await svc.verify(PW, real);
		const realT: number[] = [];
		const dummyT: number[] = [];
		for (let i = 0; i < 7; i++) {
			realT.push(await time(() => svc.verify("wrong password 123", real)));
			dummyT.push(await time(() => svc.dummyVerify("wrong password 123")));
		}
		const ratio = median(dummyT) / median(realT);
		expect(ratio).toBeGreaterThan(0.7);
		expect(ratio).toBeLessThan(1.3);
	});
});

describe("concurrency semaphore", () => {
	it("rejects the third concurrent hash with HashBusyError, then recovers", async () => {
		const svc = createPasswordService({
			keyring: ring("a1", { a1: PEPPER_1 }),
			params: { ...FAST, N: 2 ** 14 },
		});
		const results = await Promise.allSettled([svc.hash(PW), svc.hash(PW), svc.hash(PW)]);
		expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(2);
		const rejected = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
		expect(rejected.reason).toBeInstanceOf(HashBusyError);
		await expect(svc.hash(PW)).resolves.toBeTypeOf("string");
	});
});

describe("pepper keyring from env", () => {
	const b64 = (b: Buffer) => b.toString("base64");
	it("loads a keyring with older ids", () => {
		const k = loadPepperKeyring({
			CRM_AUTH_PEPPER_1: b64(PEPPER_1),
			CRM_AUTH_PEPPER_2: b64(PEPPER_2),
			CRM_AUTH_PEPPER_ACTIVE: "2",
			NODE_ENV: "production",
		});
		expect(k.activeId).toBe("2");
		expect([...k.keys.keys()].sort()).toEqual(["1", "2"]);
		expect(k.ephemeral).toBe(false);
	});
	it("refuses in production when the pepper is missing, short or the active id is unknown", () => {
		expect(() => loadPepperKeyring({ NODE_ENV: "production" })).toThrow(PepperConfigError);
		expect(() =>
			loadPepperKeyring({ NODE_ENV: "production", CRM_AUTH_PEPPER_1: b64(PEPPER_1) }),
		).toThrow(PepperConfigError);
		expect(() =>
			loadPepperKeyring({
				NODE_ENV: "production",
				CRM_AUTH_PEPPER_1: b64(Buffer.alloc(16, 1)),
				CRM_AUTH_PEPPER_ACTIVE: "1",
			}),
		).toThrow(PepperConfigError);
		expect(() =>
			loadPepperKeyring({
				NODE_ENV: "production",
				CRM_AUTH_PEPPER_1: b64(PEPPER_1),
				CRM_AUTH_PEPPER_ACTIVE: "9",
			}),
		).toThrow(PepperConfigError);
	});
	it("outside production a missing pepper gives an ephemeral dev key; a bad value still throws", () => {
		const k = loadPepperKeyring({});
		expect(k.ephemeral).toBe(true);
		expect(k.activeId).toBe("dev");
		expect(() => loadPepperKeyring({ CRM_AUTH_PEPPER_1: "c2hvcnQ=", CRM_AUTH_PEPPER_ACTIVE: "1" })).toThrow(
			PepperConfigError,
		);
	});
});

describe("password policy", () => {
	it("enforces length 12-128 on the NFKC form", () => {
		expect(checkPasswordPolicy("short1")).toBe("too_short");
		expect(checkPasswordPolicy("a-reasonable-pass-1")).toBeNull();
		expect(checkPasswordPolicy(`${"x".repeat(128)}!`)).toBe("too_long");
		expect(checkPasswordPolicy("x".repeat(700))).toBe("too_long");
	});
	it("rejects the email address and common passwords, with stem and case variants", () => {
		expect(checkPasswordPolicy("Ahmed@Example.com", "ahmed@example.com")).toBe("equals_email");
		for (const p of ["password1234", "PASSWORD12345", "Qwertyuiop123", "iloveyou1234", "passwordpassword", "Password2024!!!!"]) {
			expect(checkPasswordPolicy(p)).toBe("common");
		}
	});
	it("applies no composition rules", () => {
		expect(checkPasswordPolicy("alllowercasebutlongenough")).toBeNull();
	});
});
