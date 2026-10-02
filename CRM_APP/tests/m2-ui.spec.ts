import {
	test,
	expect,
	type Page,
	type APIRequestContext,
} from "@playwright/test";
import pg from "pg";
import { randomUUID } from "node:crypto";
import { seed } from "../scripts/seed.js";
process.loadEnvFile(".env");
async function fixture(request: APIRequestContext) {
	const admin = new pg.Client({
		connectionString: process.env.ADMIN_DATABASE_URL,
	});
	await admin.connect();
	let f: Awaited<ReturnType<typeof seed>>;
	try {
		f = await seed(admin);
	} finally {
		await admin.end();
	}
	const headers = {
		Authorization: `Bearer ${f.tokens.manager}`,
		"X-Tenant-ID": f.ids.a,
		"Idempotency-Key": randomUUID(),
	};
	const base = {
		source: "ui",
		external_order_id: randomUUID(),
		contact_id: f.ids.contact,
		currency: "EGP",
		amount_minor: 10000,
		occurred_at: new Date(Date.now() - 60000).toISOString(),
	};
	for (const b of [
		{ ...base, source_event_id: randomUUID(), kind: "order", status: "placed" },
		{
			...base,
			source_event_id: randomUUID(),
			kind: "payment",
			external_id: "pay-1",
		},
	]) {
		const r = await request.post("/v1/journey/commerce", { headers, data: b });
		expect(r.status()).toBe(200);
	}
	return f;
}
async function login(page: Page, f: Awaited<ReturnType<typeof seed>>) {
	await page.locator("#token").fill(f.tokens.manager);
	await page.locator("#tenant").fill(f.ids.a);
	await page.locator("#connect button").click();
	await expect(page.locator("#workspace")).toBeVisible();
}
for (const width of [360, 1280])
	for (const language of ["en", "ar"])
		test(`M2 ${language} ${width}px report, conversion detail, order and contact journey`, async ({
			page,
			request,
		}) => {
			const f = await fixture(request);
			await page.setViewportSize({ width, height: 900 });
			await page.goto("/reporting");
			if (language === "ar") await page.locator("#language").click();
			await expect(page.locator("html")).toHaveAttribute(
				"dir",
				language === "ar" ? "rtl" : "ltr",
			);
			await page.locator("#token").focus();
			await page.keyboard.press("Tab");
			await expect(page.locator("#tenant")).toBeFocused();
			await login(page, f);
			await expect(page.locator("#content")).toContainText(
				language === "ar" ? "لا توجد أدلة" : "No evidence",
			);
			await page.locator("#calculate").click();
			await expect(page.locator("#content")).toContainText(
				language === "ar" ? "غير معروف" : "Unknown / unattributed",
			);
			await expect(page.locator("#metadata")).toContainText("deterministic-v1");
			await expect(page.locator("#metadata")).toContainText("30");
			await page.locator("#model").selectOption("first_touch");
			await expect(page.locator("#metadata")).toContainText(
				language === "ar" ? "أول تفاعل" : "First Touch",
			);
			await page.locator("#view").selectOption("conversion");
			await expect(page.locator("#content")).toContainText("10000");
			await page.locator("#content button").first().click();
			await expect(page.locator(".details")).toContainText("deterministic-v1");
			await page.locator("#view").selectOption("order");
			await page.locator("#content button").first().click();
			await expect(page.locator(".details")).toContainText(
				language === "ar" ? "الاسترداد" : "Refunds",
			);
			await expect(page.locator(".details")).toContainText("10000");
			await page.locator("#view").selectOption("journey");
			await expect(page.locator("#content")).toContainText(
				language === "ar" ? "تحصيل دفعة" : "Payment captured",
			);
			expect(
				await page.evaluate(
					() => document.documentElement.scrollWidth <= innerWidth,
				),
			).toBe(true);
			await page.screenshot({
				path: `test-results/m2-${language}-${width}.png`,
				fullPage: true,
			});
		});
test("M2 reporting loading, permission and network error states clear prior data", async ({
	page,
	request,
}) => {
	const f = await fixture(request);
	await page.goto("/reporting");
	await login(page, f);
	await page.locator("#calculate").click();
	await expect(page.locator("#content")).toContainText("10000");
	await page.route("**/v1/reports/campaign-performance*", async (route) => {
		await new Promise((resolve) => setTimeout(resolve, 250));
		await route.fulfill({
			status: 403,
			contentType: "application/json",
			body: JSON.stringify({ code: "FORBIDDEN" }),
		});
	});
	await page.locator("#refresh").click();
	await expect(page.locator("#status")).toHaveText("Loading…");
	await expect(page.locator("#status")).toContainText("Permission denied");
	await expect(page.locator("#content")).toBeEmpty();
	await page.unroute("**/v1/reports/campaign-performance*");
	await page.route("**/v1/reports/campaign-performance*", (route) =>
		route.abort(),
	);
	await page.locator("#refresh").click();
	await expect(page.locator("#status")).not.toHaveText("Loading…");
	await expect(page.locator("#status")).toHaveClass("error");
});
