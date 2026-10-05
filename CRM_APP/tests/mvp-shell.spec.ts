import { get } from "node:http";
import { test, expect } from "@playwright/test";

// Raw request: no client-side URL normalisation, so encoded traversal reaches the server intact.
function rawStatus(path: string): Promise<number> {
	return new Promise((ok, fail) => {
		get({ host: "127.0.0.1", port: 4317, path }, (res) => {
			res.resume();
			ok(res.statusCode ?? 0);
		}).on("error", fail);
	});
}

test("new client shell loads RTL at /app/", async ({ page }) => {
	await page.goto("/app/");
	await expect(page).toHaveTitle("Systronic CRM");
	await expect(page.locator("html")).toHaveAttribute("lang", "ar");
	await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
	await expect(
		page.getByRole("heading", { name: "Systronic CRM" }),
	).toBeVisible();
	await expect(page.getByTestId("route")).toHaveText("/");
});

test("client routes fall back to the shell and navigate", async ({ page }) => {
	for (const route of [
		"leads",
		"contacts",
		"deals",
		"pipeline",
		"tasks",
		"dashboard",
		"reporting-v2",
	]) {
		await page.goto(`/app/${route}`);
		await expect(page.getByTestId("route")).toHaveText(`/${route}`);
	}
	await page.goto("/app/leads");
	await page.getByRole("link", { name: "/deals" }).click();
	await expect(page).toHaveURL(/\/app\/deals$/);
	await expect(page.getByTestId("route")).toHaveText("/deals");
});

test("asset route serves js and rejects traversal", async ({
	page,
	request,
}) => {
	await page.goto("/app/");
	const src = await page.locator("script[type=module]").getAttribute("src");
	expect(src).toMatch(/^\/app\/assets\/.+\.js$/);
	const ok = await request.get(src as string);
	expect(ok.status()).toBe(200);
	expect(ok.headers()["content-type"]).toContain("text/javascript");
	for (const bad of [
		"/app/assets/..%2f..%2fpackage.json",
		"/app/assets/%2e%2e/package.json",
		"/app/assets/a%00.js",
		"/app/assets/missing.js",
	])
		expect(await rawStatus(bad)).toBe(404);
	expect(await rawStatus("/app/assets/../../package.json")).toBe(404);
	expect(await rawStatus("/app/assets//etc/passwd")).toBe(404);
});

test("legacy pages still load", async ({ page }) => {
	await page.goto("/");
	await expect(page.locator("html")).toHaveAttribute("lang", /./);
	await expect(page.locator("body")).toBeVisible();
	expect(page.url()).toMatch(/\/$/);
	await page.goto("/foundation");
	await expect(page.locator("#submit")).toBeVisible();
	const reporting = await page.request.get("/reporting");
	expect(reporting.status()).toBe(200);
});
