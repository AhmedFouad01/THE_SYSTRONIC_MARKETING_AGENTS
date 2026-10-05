import { resolve, sep, extname } from "node:path";

/** The new client is mounted under this base until it reaches parity with web/. */
export const APP_BASE = "/app";
export const APP_ASSET_PREFIX = `${APP_BASE}/assets/`;
const appRoutes = [
	"/",
	"/leads",
	"/contacts",
	"/deals",
	"/pipeline",
	"/tasks",
	"/dashboard",
	"/reporting-v2",
];

const types: Record<string, string> = {
	".js": "text/javascript; charset=utf-8",
	".mjs": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".html": "text/html; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".map": "application/json; charset=utf-8",
	".svg": "image/svg+xml",
	".png": "image/png",
	".jpg": "image/jpeg",
	".webp": "image/webp",
	".ico": "image/x-icon",
	".woff": "font/woff",
	".woff2": "font/woff2",
	".txt": "text/plain; charset=utf-8",
};

export function contentType(file: string): string {
	return types[extname(file).toLowerCase()] ?? "application/octet-stream";
}

/** True when the raw request path (no query) is a client route to answer with index.html. */
export function isAppRoute(rawPath: string): boolean {
	if (rawPath !== APP_BASE && !rawPath.startsWith(`${APP_BASE}/`)) return false;
	const rest = rawPath.slice(APP_BASE.length) || "/";
	const clean = rest.length > 1 ? rest.replace(/\/$/, "") : rest;
	return appRoutes.includes(clean);
}

/**
 * Map a RAW (not URL-normalised) request path under `prefix` to a file inside `root`.
 * Returns null for anything that is not a plain, in-root, relative file path.
 * Rejects: NUL, backslash, drive/colon, empty/"."/".." segments, any percent-encoded
 * dot/slash/backslash/NUL, undecodable input, and results escaping root.
 */
export function resolveAsset(
	root: string,
	rawPath: string,
	prefix: string = APP_ASSET_PREFIX,
): string | null {
	if (!rawPath.startsWith(prefix)) return null;
	const rel = rawPath.slice(prefix.length);
	if (!rel) return null;
	if (/[\0\\:]|%(?:00|2e|2f|5c)/i.test(rel)) return null;
	let decoded: string;
	try {
		decoded = decodeURIComponent(rel);
	} catch {
		return null;
	}
	if (/[\0\\:]/.test(decoded)) return null;
	const parts = decoded.split("/");
	if (parts.some((p) => p === "" || p === "." || p === "..")) return null;
	const base = resolve(root);
	const target = resolve(base, ...parts);
	return target.startsWith(base + sep) ? target : null;
}
