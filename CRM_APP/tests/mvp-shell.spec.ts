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
	// Not connected: the connect gate renders inside the shell (feature routes need a session: see mvp-app.spec.ts).
	await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
	await expect(page.locator("input[name=token]")).toBeVisible();
	await expect(page.getByRole("navigation")).toHaveCount(0);
});

test("client routes fall back to the shell (connect gate when no session)", async ({
	page,
}) => {
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
		await expect(page.locator("input[name=token]")).toBeVisible();
	}
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

test("locale toggle flips html lang/dir and persists", async ({ page }) => {
	await page.goto("/app/");
	const html = page.locator("html");
	await expect(html).toHaveAttribute("dir", "rtl");
	await page.getByTestId("locale-toggle").click();
	await expect(html).toHaveAttribute("lang", "en");
	await expect(html).toHaveAttribute("dir", "ltr");
	await page.reload();
	await expect(html).toHaveAttribute("dir", "ltr");
	await page.getByTestId("locale-toggle").click();
	await expect(html).toHaveAttribute("lang", "ar");
	await expect(html).toHaveAttribute("dir", "rtl");
});

test("theme toggle flips data-theme, tokens follow, and persists", async ({
	page,
}) => {
	await page.goto("/app/");
	const html = page.locator("html");
	await expect(html).toHaveAttribute("data-theme", "light");
	const canvas = () =>
		page.evaluate(() =>
			getComputedStyle(document.documentElement)
				.getPropertyValue("--sy-canvas")
				.trim(),
		);
	expect(await canvas()).toBe("#F3F5F7");
	await page.getByTestId("theme-toggle").click();
	await expect(html).toHaveAttribute("data-theme", "dark");
	expect(await canvas()).toBe("#090D14");
	await page.reload();
	await expect(html).toHaveAttribute("data-theme", "dark");
	await page.getByTestId("theme-toggle").click();
	await expect(html).toHaveAttribute("data-theme", "light");
});

test("toggle buttons show a visible focus ring on keyboard focus", async ({
	page,
}) => {
	await page.goto("/app/");
	await page.keyboard.press("Tab"); // skip-link is first
	await expect(page.locator(".sy-skip")).toBeFocused();
	await page.keyboard.press("Tab"); // search is disabled -> locale toggle
	const toggle = page.getByTestId("locale-toggle");
	await expect(toggle).toBeFocused();
	const ring = await toggle.evaluate((el) => {
		const s = getComputedStyle(el);
		return {
			style: s.outlineStyle,
			width: s.outlineWidth,
			color: s.outlineColor,
		};
	});
	expect(ring.style).toBe("solid");
	expect(ring.width).toBe("2px");
	// ring color is the light-theme focus token (#009FD4)
	expect(ring.color).toBe("rgb(0, 159, 212)");
});
