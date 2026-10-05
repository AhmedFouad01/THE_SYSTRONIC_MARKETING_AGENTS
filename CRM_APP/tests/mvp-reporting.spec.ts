import { randomUUID } from "node:crypto";
import {
	type APIRequestContext,
	expect,
	type Page,
	test,
} from "@playwright/test";
import pg from "pg";
import { seed } from "../scripts/seed.js";

process.loadEnvFile(".env");

// Synthetic fixture per test (order + payment for the seeded contact). Credentials stay in memory only.
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
type Fixture = Awaited<ReturnType<typeof fixture>>;

async function open(
	page: Page,
	f: Fixture,
	language: "ar" | "en",
	width = 1280,
) {
	await page.setViewportSize({ width, height: 900 });
	await page.addInitScript(
		(l) => localStorage.setItem("sy.locale", l),
		language,
	);
	await page.goto("/app/reporting"); // deep link: served by the SPA fallback
	await page.locator("input[name=token]").fill(f.tokens.manager);
	await page.locator("input[name=tenant]").fill(f.ids.a);
	await page.getByTestId("connect-submit").click();
	await expect(page.getByTestId("reporting-view")).toBeVisible();
}

const noPageOverflow = (page: Page) =>
	page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

// Money is grouped per locale (10,000 / ١٠٬٠٠٠).
const AMOUNT = /10[,٬]?000|١٠[,٬]?٠٠٠/;

const T = {
	en: {
		tabs: [
			"Campaign performance",
			"Conversions",
			"Orders / payments / refunds",
			"Contact journey",
		],
		unknown: "Unknown / unattributed",
		payment: "Payment captured",
		done: "Calculation published.",
		denied: "Your role cannot publish calculations.",
	},
	ar: {
		tabs: [
			"أداء الحملات",
			"التحويلات",
			"الطلبات والمدفوعات والاسترداد",
			"رحلة جهة الاتصال",
		],
		unknown: "غير معروف / غير منسوب",
		payment: "تحصيل دفعة",
		done: "تم نشر الحساب.",
		denied: "دورك لا يسمح بنشر حسابات الإسناد.",
	},
} as const;

test("deep link /app/reporting is served by the SPA fallback (not 404)", async ({
	request,
}) => {
	for (const p of ["/app/reporting", "/app/reporting/"]) {
		const res = await request.get(p, {
			headers: { accept: "text/html" },
		});
		expect(res.status(), p).toBe(200);
		expect(res.headers()["content-type"]).toContain("text/html");
	}
	// legacy page is untouched
	expect((await request.get("/reporting")).status()).toBe(200);
});

for (const width of [360, 1280])
	for (const language of ["en", "ar"] as const)
		test(`reporting ${language} ${width}px: KPIs, confirm-gated publish, drill-downs, journey`, async ({
			page,
			request,
		}) => {
			const f = await fixture(request);
			const t = T[language];
			await open(page, f, language, width);
			await expect(page.locator("html")).toHaveAttribute(
				"dir",
				language === "ar" ? "rtl" : "ltr",
			);

			// decision-first header
			await expect(page.getByTestId("report-kpis")).toBeVisible();
			for (const id of [
				"roas",
				"revenue",
				"spend",
				"conversions",
				"unattributed",
			])
				await expect(page.getByTestId(`kpi-${id}`)).toBeVisible();

			// publish is confirm-gated: cancel sends nothing, confirm calls the API once
			let posts = 0;
			page.on("request", (r) => {
				if (r.method() === "POST" && r.url().includes("/v1/journey/calculate"))
					posts++;
			});
			await page.getByTestId("report-calculate").click();
			await expect(page.getByTestId("publish-dialog")).toBeVisible();
			await page.getByTestId("dialog-cancel").click();
			await expect(page.getByTestId("publish-dialog")).toBeHidden();
			expect(posts).toBe(0);
			await page.getByTestId("report-calculate").click();
			await page.getByTestId("dialog-confirm").click();
			await expect(page.getByText(t.done)).toBeVisible();
			expect(posts).toBe(1);
			await expect(page.getByTestId("report-meta")).toContainText(
				"deterministic-v1",
			);

			// campaign drill-down (the unknown/unattributed campaign carries the seeded outcome)
			await expect(page.getByTestId("grid-row").first()).toContainText(
				t.unknown,
			);
			await page.getByTestId("campaign-detail").first().click();
			await expect(page.getByTestId("report-detail")).toBeVisible();

			// conversions -> detail with credits
			await page.getByRole("tab", { name: t.tabs[1], exact: true }).click();
			await expect(page.getByTestId("grid-row").first()).toContainText(AMOUNT);
			await page.getByTestId("conversion-detail").first().click();
			await expect(page.getByTestId("detail-body")).toContainText(
				"deterministic-v1",
			);

			// orders -> detail
			await page.getByRole("tab", { name: t.tabs[2], exact: true }).click();
			await expect(page.getByTestId("grid-row").first()).toBeVisible();
			await page.getByTestId("order-detail").first().click();
			await expect(page.getByTestId("detail-body")).toContainText(AMOUNT);

			// contact journey
			await page.getByRole("tab", { name: t.tabs[3], exact: true }).click();
			await page.getByTestId("journey-contact").selectOption(f.ids.contact);
			await expect(
				page.getByTestId("grid-row").filter({ hasText: t.payment }),
			).toHaveCount(1);

			expect(await noPageOverflow(page)).toBe(true);
		});

test("reporting en: calculate denied (403) disables the control with a visible reason", async ({
	page,
	request,
}) => {
	const f = await fixture(request);
	await open(page, f, "en");
	await page.route("**/v1/journey/calculate", (route) =>
		route.fulfill({
			status: 403,
			contentType: "application/json",
			body: JSON.stringify({ code: "FORBIDDEN" }),
		}),
	);
	await page.getByTestId("report-calculate").click();
	await page.getByTestId("dialog-confirm").click();
	await expect(page.getByTestId("calc-denied")).toHaveText(T.en.denied);
	await expect(page.getByTestId("report-calculate")).toBeDisabled();
	await expect(page.getByTestId("report-kpis")).toBeVisible(); // reading still works
});

test("reporting en: read permission denied clears the data and shows the forbidden state", async ({
	page,
	request,
}) => {
	const f = await fixture(request);
	await open(page, f, "en");
	await expect(page.getByTestId("report-kpis")).toBeVisible();
	await page.route("**/v1/reports/campaign-performance*", (route) =>
		route.fulfill({
			status: 403,
			contentType: "application/json",
			body: JSON.stringify({ code: "FORBIDDEN" }),
		}),
	);
	await page.getByTestId("report-refresh").click();
	await expect(page.getByTestId("report-kpis")).toHaveCount(0);
	await expect(page.getByTestId("calc-denied")).toBeVisible();
	await expect(page.getByTestId("report-calculate")).toBeDisabled();
});

test("reporting en: invalid lookback blocks publish; a changed lookback after a failed publish uses a new idempotency key", async ({
	page,
	request,
}) => {
	const f = await fixture(request);
	await open(page, f, "en");
	await page.getByTestId("report-days").fill("0");
	await expect(page.getByTestId("report-calculate")).toBeDisabled();
	await page.getByTestId("report-days").fill("30");
	const keys: string[] = [];
	await page.route("**/v1/journey/calculate", (route) => {
		keys.push(route.request().headers()["idempotency-key"] ?? "");
		return route.fulfill({
			status: 500,
			contentType: "application/json",
			body: JSON.stringify({ code: "INTERNAL" }),
		});
	});
	await page.getByTestId("report-calculate").click();
	await page.getByTestId("dialog-confirm").click();
	await expect(page.getByTestId("publish-dialog")).toBeHidden();
	await page.getByTestId("report-days").fill("45");
	await page.getByTestId("report-calculate").click();
	await page.getByTestId("dialog-confirm").click();
	await expect(page.getByTestId("publish-dialog")).toBeHidden();
	expect(keys).toHaveLength(2);
	expect(keys[0]).not.toBe(keys[1]);
});
