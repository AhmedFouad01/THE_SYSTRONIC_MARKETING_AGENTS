import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { isCommonPassword } from "./common-passwords.js";

// Slice A1 (AUTH_PLAN section 5, D2, D3). Only node:crypto primitives; no custom crypto.
// Stored format: scrypt$v1$<pepper kid>$<N>$<r>$<p>$<salt b64>$<hash b64>

export interface ScryptParams {
	N: number;
	r: number;
	p: number;
	keylen: number;
	saltLen: number;
	maxmem: number;
}

/** D2 production parameters. Tests inject a smaller N; a test pins these values. */
export const PRODUCTION_SCRYPT_PARAMS: Readonly<ScryptParams> = Object.freeze({
	N: 2 ** 17,
	r: 8,
	p: 1,
	keylen: 32,
	saltLen: 16,
	maxmem: 256 * 1024 * 1024,
});
export const MAX_CONCURRENT_HASHES = 2;
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;
export const PEPPER_MIN_BYTES = 32;

const FORMAT = "scrypt";
const VERSION = "v1";
const KID_RE = /^[A-Za-z0-9]{1,16}$/;
// Bounds applied to parameters read from a stored string: a corrupt or hostile
// row must never make us allocate unbounded memory.
const MAX_N = 2 ** 18;
const MAX_R = 16;
const MAX_P = 4;

export class HashBusyError extends Error {
	readonly code = "HASH_BUSY";
	constructor() {
		super("password hashing capacity exhausted");
	}
}
export class PepperConfigError extends Error {
	readonly code = "PEPPER_CONFIG";
}

// ---------------------------------------------------------------- pepper keyring

export interface PepperKeyring {
	activeId: string;
	keys: ReadonlyMap<string, Buffer>;
	/** true when no pepper was configured outside production (random per process). */
	ephemeral: boolean;
}

/**
 * Reads CRM_AUTH_PEPPER_<id> (base64, >= 32 bytes) for every id present, and
 * CRM_AUTH_PEPPER_ACTIVE=<id>. Older ids stay loaded for verification during rotation.
 * Production (NODE_ENV=production): missing/short/invalid pepper throws. Elsewhere a
 * missing pepper yields an ephemeral random key under id "dev" (hashes do not survive
 * a restart); a malformed value still throws.
 */
export function loadPepperKeyring(env: NodeJS.ProcessEnv = process.env): PepperKeyring {
	const production = env.NODE_ENV === "production";
	const keys = new Map<string, Buffer>();
	for (const [name, value] of Object.entries(env)) {
		const m = /^CRM_AUTH_PEPPER_([A-Za-z0-9]{1,16})$/.exec(name);
		if (!m || m[1] === "ACTIVE" || value === undefined || value === "") continue;
		const key = Buffer.from(value, "base64");
		if (key.length < PEPPER_MIN_BYTES) {
			throw new PepperConfigError(`pepper ${m[1]} is shorter than ${PEPPER_MIN_BYTES} bytes`);
		}
		keys.set(m[1] as string, key);
	}
	const activeId = env.CRM_AUTH_PEPPER_ACTIVE?.trim();
	if (activeId && keys.has(activeId)) return { activeId, keys, ephemeral: false };
	if (production || activeId || keys.size > 0) {
		throw new PepperConfigError("CRM_AUTH_PEPPER_ACTIVE must name a configured CRM_AUTH_PEPPER_<id>");
	}
	keys.set("dev", randomBytes(PEPPER_MIN_BYTES));
	return { activeId: "dev", keys, ephemeral: true };
}

/** HMAC-SHA256(pepper, NFKC(password)): the value that is fed to scrypt. */
export function pepperPrehash(password: string, key: Buffer): Buffer {
	return createHmac("sha256", key).update(password.normalize("NFKC"), "utf8").digest();
}

// ---------------------------------------------------------------- encoding

interface Decoded {
	kid: string;
	params: Pick<ScryptParams, "N" | "r" | "p">;
	salt: Buffer;
	hash: Buffer;
}

function encode(kid: string, p: ScryptParams, salt: Buffer, hash: Buffer): string {
	return [FORMAT, VERSION, kid, p.N, p.r, p.p, salt.toString("base64"), hash.toString("base64")].join("$");
}

function posInt(s: string | undefined): number | null {
	return s !== undefined && /^[1-9]\d{0,9}$/.test(s) ? Number(s) : null;
}

/** Returns null for anything malformed or out of bounds (callers fail closed). */
export function decodeHash(stored: string): Decoded | null {
	if (typeof stored !== "string" || stored.length > 512) return null;
	const parts = stored.split("$");
	if (parts.length !== 8 || parts[0] !== FORMAT || parts[1] !== VERSION) return null;
	const kid = parts[2] as string;
	const N = posInt(parts[3]);
	const r = posInt(parts[4]);
	const p = posInt(parts[5]);
	if (!KID_RE.test(kid) || N === null || r === null || p === null) return null;
	if (N < 2 || (N & (N - 1)) !== 0 || N > MAX_N || r > MAX_R || p > MAX_P) return null;
	const b64 = /^[A-Za-z0-9+/]+={0,2}$/;
	if (!b64.test(parts[6] as string) || !b64.test(parts[7] as string)) return null;
	const salt = Buffer.from(parts[6] as string, "base64");
	const hash = Buffer.from(parts[7] as string, "base64");
	if (salt.length < 8 || hash.length < 16 || hash.length > 64) return null;
	return { kid, params: { N, r, p }, salt, hash };
}

// ---------------------------------------------------------------- primitives

/** Constant-time equality; unequal lengths are public information and return false. */
export function constantTimeEqual(a: Buffer, b: Buffer): boolean {
	return a.length === b.length && timingSafeEqual(a, b);
}

function maxmemFor(p: Pick<ScryptParams, "N" | "r" | "p">, floor: number): number {
	return Math.max(floor, 160 * p.N * p.r);
}

function scryptAsync(
	secret: Buffer,
	salt: Buffer,
	keylen: number,
	o: { N: number; r: number; p: number; maxmem: number },
): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		scrypt(secret, salt, keylen, o, (err, key) => (err ? reject(err) : resolve(key)));
	});
}

class Semaphore {
	private inUse = 0;
	constructor(private readonly max: number) {}
	async run<T>(fn: () => Promise<T>): Promise<T> {
		if (this.inUse >= this.max) throw new HashBusyError();
		this.inUse++;
		try {
			return await fn();
		} finally {
			this.inUse--;
		}
	}
}

// ---------------------------------------------------------------- policy

export type PolicyViolation = "too_short" | "too_long" | "equals_email" | "common";

/** NFKC-normalise, 12-128 characters, not the email, not in the common list. No composition rules. */
export function checkPasswordPolicy(password: string, email?: string): PolicyViolation | null {
	if (password.length > PASSWORD_MAX_LENGTH * 4) return "too_long"; // cheap guard before normalising
	const n = password.normalize("NFKC");
	const len = Array.from(n).length;
	if (len < PASSWORD_MIN_LENGTH) return "too_short";
	if (len > PASSWORD_MAX_LENGTH) return "too_long";
	if (email && n.toLowerCase() === email.normalize("NFKC").trim().toLowerCase()) return "equals_email";
	if (isCommonPassword(n)) return "common";
	return null;
}

// ---------------------------------------------------------------- service

export interface PasswordServiceOptions {
	keyring: PepperKeyring;
	params?: ScryptParams;
	maxConcurrent?: number;
}

export interface VerifyResult {
	ok: boolean;
	needsRehash: boolean;
}

export interface PasswordService {
	hash(password: string): Promise<string>;
	verify(password: string, stored: string): Promise<VerifyResult>;
	/** Full-cost scrypt against a throwaway hash; always false. For unknown users. */
	dummyVerify(password: string): Promise<false>;
	needsRehash(stored: string): boolean;
}

export function createPasswordService(opts: PasswordServiceOptions): PasswordService {
	const params = opts.params ?? PRODUCTION_SCRYPT_PARAMS;
	const { keyring } = opts;
	const sem = new Semaphore(opts.maxConcurrent ?? MAX_CONCURRENT_HASHES);
	const activeKey = keyring.keys.get(keyring.activeId);
	if (!activeKey) throw new PepperConfigError("active pepper id not in keyring");

	const tooLong = (pw: string) =>
		pw.length > PASSWORD_MAX_LENGTH * 4 || Array.from(pw.normalize("NFKC")).length > PASSWORD_MAX_LENGTH;

	const derive = (pw: string, key: Buffer, salt: Buffer, p: Pick<ScryptParams, "N" | "r" | "p">, keylen: number) =>
		scryptAsync(pepperPrehash(pw, key), salt, keylen, {
			N: p.N,
			r: p.r,
			p: p.p,
			maxmem: maxmemFor(p, params.maxmem),
		});

	async function hash(password: string): Promise<string> {
		if (tooLong(password)) throw new RangeError("password exceeds maximum length");
		const salt = randomBytes(params.saltLen);
		const out = await sem.run(() => derive(password, activeKey as Buffer, salt, params, params.keylen));
		return encode(keyring.activeId, params, salt, out);
	}

	const stale = (d: Decoded) =>
		d.kid !== keyring.activeId ||
		d.params.N !== params.N ||
		d.params.r !== params.r ||
		d.params.p !== params.p ||
		d.hash.length !== params.keylen;

	function needsRehash(stored: string): boolean {
		const d = decodeHash(stored);
		return d === null || stale(d);
	}

	async function verify(password: string, stored: string): Promise<VerifyResult> {
		const fail = { ok: false, needsRehash: false } as const;
		const d = decodeHash(stored);
		if (d === null || tooLong(password)) return fail;
		const key = keyring.keys.get(d.kid);
		if (!key) return fail; // unknown pepper id: fail closed
		const out = await sem.run(() => derive(password, key, d.salt, d.params, d.hash.length));
		const ok = constantTimeEqual(out, d.hash);
		return { ok, needsRehash: ok && stale(d) };
	}

	let dummy: Promise<string> | undefined;
	async function dummyVerify(password: string): Promise<false> {
		dummy ??= hash(randomBytes(24).toString("base64")).catch((e) => {
			dummy = undefined;
			throw e;
		});
		const stored = await dummy;
		await verify(password.length > PASSWORD_MAX_LENGTH * 4 ? "" : password, stored);
		return false;
	}

	return { hash, verify, dummyVerify, needsRehash };
}
