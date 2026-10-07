import { describe, expect, it } from "vitest";
import { resolve, sep } from "node:path";
import {
	APP_ASSET_PREFIX,
	contentType,
	isAppRoute,
	resolveAsset,
} from "../src/static.js";

const root = resolve("fixture-root", "app");
const p = APP_ASSET_PREFIX;

describe("resolveAsset", () => {
	it("resolves plain files inside root", () => {
		expect(resolveAsset(root, `${p}index-abc.js`)).toBe(
			resolve(root, "index-abc.js"),
		);
		expect(resolveAsset(root, `${p}sub/dir/a.css`)).toBe(
			resolve(root, "sub", "dir", "a.css"),
		);
		expect(resolveAsset(root, `${p}a%20b.js`)).toBe(resolve(root, "a b.js"));
	});
	it.each([
		"",
		"..",
		"../x",
		"a/../../x",
		"a/./b",
		"%2e%2e/x",
		"%2E%2E%2Fx",
		"..%2fx",
		"..%5cx",
		"a%2fb",
		"..\\x",
		"a\\b",
		"/etc/passwd",
		"a//b",
		"C:/Windows/x",
		"C%3A/x",
		"a\0b",
		"a%00b",
		"%zz",
		"%c0%ae%c0%ae/x",
	])("rejects %j", (rel) => {
		expect(resolveAsset(root, p + rel)).toBeNull();
	});
	it("rejects wrong prefix", () => {
		expect(resolveAsset(root, "/assets/a.js")).toBeNull();
		expect(resolveAsset(root, "/app/assetsx/a.js")).toBeNull();
		expect(resolveAsset(root, "/v1/contacts")).toBeNull();
	});
	it("never escapes root", () => {
		const r = resolveAsset(root, `${p}ok.js`);
		expect(r?.startsWith(resolve(root) + sep)).toBe(true);
	});
});

describe("isAppRoute", () => {
	it("accepts client routes only", () => {
		for (const r of [
			"/app",
			"/app/",
			"/app/leads",
			"/app/contacts/",
			"/app/deals",
			"/app/pipeline",
			"/app/tasks",
			"/app/dashboard",
			"/app/reporting",
			"/app/reporting-v2",
			"/app/settings/properties",
		])
			expect(isAppRoute(r)).toBe(true);
	});
	it("does not shadow legacy or unknown paths", () => {
		for (const r of [
			"/",
			"/foundation",
			"/reporting",
			"/leads",
			"/app/foundation",
			"/application",
			"/app/leads/x",
			"/app/assets/a.js",
		])
			expect(isAppRoute(r)).toBe(false);
	});
});

describe("contentType", () => {
	it("maps extensions", () => {
		expect(contentType("a.js")).toContain("text/javascript");
		expect(contentType("a.CSS")).toContain("text/css");
		expect(contentType("a.woff2")).toBe("font/woff2");
		expect(contentType("a.bin")).toBe("application/octet-stream");
	});
});
