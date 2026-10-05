import { get } from "node:http";
import { type Page, test, expect } from "@playwright/test";

// Locale/theme/disconnect live in the workspace-actions menu (prototype): open it, then choose the item.
async function pick(page: Page, testId: string) {
	await page.getByTestId("workspace-actions").click();
	await page.getByTestId(testId).click();
}
// Raw request: no client-side URL normalisation, so encoded traversal reaches the server intact.
function rawStatus(path: string, base: string): Promise<number> {
	const { hostname, port } = new URL(base);
	return new Promise((ok, fail) => {
		get({ host: hostname, port: Number(port), path }, (res) => {
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
	baseURL,
}) => {
	const base = baseURL ?? "http://127.0.0.1:4317";
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
		expect(await rawStatus(bad, base)).toBe(404);
	expect(await rawStatus("/app/assets/../../package.json", base)).toBe(404);
	expect(await rawStatus("/app/assets//etc/passwd", base)).toBe(404);
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
	await pick(page, "locale-toggle");
	await expect(html).toHaveAttribute("lang", "en");
	await expect(html).toHaveAttribute("dir", "ltr");
	await page.reload();
	await expect(html).toHaveAttribute("dir", "ltr");
	await pick(page, "locale-toggle");
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
	await pick(page, "theme-toggle");
	await expect(html).toHaveAttribute("data-theme", "dark");
	expect(await canvas()).toBe("#090D14");
	await page.reload();
	await expect(html).toHaveAttribute("data-theme", "dark");
	await pick(page, "theme-toggle");
	await expect(html).toHaveAttribute("data-theme", "light");
});

test("toggle buttons show a visible focus ring on keyboard focus", async ({
	page,
}) => {
	await page.goto("/app/");
	await page.keyboard.press("Tab"); // skip-link is first
	await expect(page.locator(".sy-skip")).toBeFocused();
	await page.keyboard.press("Tab"); // search is disabled -> workspace-actions menu button
	const toggle = page.getByTestId("workspace-actions");
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

for (const language of ["en", "ar"] as const)
	test(`workspace-actions menu ${language}: keyboard contract, focus return, placement`, async ({ page }) => {
		await page.addInitScript((l) => localStorage.setItem("sy.locale", l), language);
		await page.goto("/app/");
		const trigger = page.getByTestId("workspace-actions");
		const menu = page.getByRole("menu");
		const items = page.getByRole("menuitem");
		await expect(trigger).toHaveAttribute("aria-haspopup", "menu");
		await expect(trigger).toHaveAttribute("aria-expanded", "false");
		await expect(menu).toHaveCount(0);

		// ArrowDown on the trigger opens; focus enters the first item
		await trigger.focus();
		await page.keyboard.press("ArrowDown");
		await expect(trigger).toHaveAttribute("aria-expanded", "true");
		await expect(items.nth(0)).toBeFocused();

		// not connected: locale + theme only. Arrows wrap; Home/End jump.
		await expect(items).toHaveCount(2);
		await page.keyboard.press("ArrowDown");
		await expect(items.nth(1)).toBeFocused();
		await page.keyboard.press("ArrowDown");
		await expect(items.nth(0)).toBeFocused();
		await page.keyboard.press("ArrowUp");
		await expect(items.nth(1)).toBeFocused();
		await page.keyboard.press("Home");
		await expect(items.nth(0)).toBeFocused();
		await page.keyboard.press("End");
		await expect(items.nth(1)).toBeFocused();

		// placement uses logical properties: the menu's end edge meets the trigger's end edge (mirrors in RTL)
		const t = await trigger.boundingBox();
		const m = await menu.boundingBox();
		if (!t || !m) throw new Error("no boxes");
		if (language === "ar") expect(Math.abs(m.x - t.x)).toBeLessThanOrEqual(1);
		else expect(Math.abs(m.x + m.width - (t.x + t.width))).toBeLessThanOrEqual(1);

		// Escape closes and returns focus to the trigger
		await page.keyboard.press("Escape");
		await expect(menu).toHaveCount(0);
		await expect(trigger).toBeFocused();
		await expect(trigger).toHaveAttribute("aria-expanded", "false");

		// Enter opens; selecting an item acts, closes, and returns focus to the trigger
		await page.keyboard.press("Enter");
		await expect(items.nth(0)).toBeFocused();
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");
		await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
		await expect(menu).toHaveCount(0);
		await expect(trigger).toBeFocused();

		// outside click closes without stealing focus back
		await trigger.click();
		await expect(menu).toBeVisible();
		await page.locator("main").click({ position: { x: 5, y: 200 } });
		await expect(menu).toHaveCount(0);
	});

test("workspace-actions menu: typeahead and Tab close", async ({ page }) => {
	await page.addInitScript(() => localStorage.setItem("sy.locale", "en"));
	await page.goto("/app/");
	const trigger = page.getByTestId("workspace-actions");
	await trigger.click();
	await page.keyboard.type("sw"); // "Switch to Dark mode" (the first item is the Arabic label)
	await expect(page.getByTestId("theme-toggle")).toBeFocused();
	await page.keyboard.press("Tab");
	await expect(page.getByRole("menu")).toHaveCount(0);
});