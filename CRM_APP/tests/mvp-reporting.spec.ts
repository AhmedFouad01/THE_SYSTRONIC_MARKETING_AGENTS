import { randomUUID } from "node:crypto";
import {
	type APIRequestContext,
	expect,
	type Page,
	test,
} from "@playwright/test";
import pg from "pg";
import { seed } from "../scripts/seed.js";
import { pickValue } from "./select-helper.js";

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

// 10000 minor EGP units shown as the app-wide currency display (EGP 100 / ١٠٠ ج.م), same as the Dashboard.
const AMOUNT = /100|١٠٠/;

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
			await pickValue(page.getByTestId("journey-contact"), f.ids.contact);
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

// ---- UX-18 / UX-23 (Reporting restyle, empty + loading states) ------------------------------------------------

const REPORT_URL = "**/v1/reports/campaign-performance*";
const reportBody = (rows: unknown[], spend: unknown[] = []) =>
	JSON.stringify({
		data: {
			model: "last_non_direct",
			version: "deterministic-v1",
			lookback_days: 30,
			run_id: "run-1",
			as_of: "2026-10-05T10:00:00.000Z",
			rows,
			spend,
		},
	});
const SEEDED_ROWS = [
	{
		campaign_id: "a",
		campaign_name: "Alpha",
		source: "ads",
		currency: "EGP",
		conversion_type: "payment_captured",
		value_minor: 12345678,
		outcomes: 3,
	},
];
const SEEDED_SPEND = [
	{
		campaign_id: "a",
		name: "Alpha",
		currency: "EGP",
		spend_minor: 4000000,
		reporting_date: "2026-10-01",
		timezone: "UTC",
	},
];

test("reporting en 1280 (UX-18): constrained controls, collapsed provenance, equal KPI heights, detail only with rows, no 'Minor units' label", async ({
	page,
	request,
}) => {
	const f = await fixture(request);
	await page.route(REPORT_URL, (r) =>
		r.fulfill({
			status: 200,
			contentType: "application/json",
			body: reportBody(SEEDED_ROWS, SEEDED_SPEND),
		}),
	);
	await open(page, f, "en");
	await expect(page.getByTestId("report-kpis")).toBeVisible();

	// controls are constrained, not stretched
	const model = await page.getByTestId("report-model").boundingBox();
	const days = await page.getByTestId("report-days").boundingBox();
	expect(model?.width).toBeLessThanOrEqual(241);
	expect(days?.width).toBeLessThanOrEqual(97);

	// provenance lives in a collapsed "About this calculation" block (12px, text-3)
	const about = page.getByTestId("report-about");
	await expect(about.locator("summary")).toHaveText("About this calculation");
	expect(await about.evaluate((d) => (d as HTMLDetailsElement).open)).toBe(false);
	await expect(page.getByTestId("report-meta")).toBeHidden();
	await expect(about).toHaveCSS("font-size", "12px");
	await expect(about).toHaveCSS("margin-top", "16px");
	await about.locator("summary").click();
	await expect(page.getByTestId("report-meta")).toBeVisible();
	await expect(page.getByTestId("report-meta")).toContainText(
		"deterministic-v1",
	);

	// KPI cards: equal heights, 12px label, 24px value
	const heights = await page
		.locator('[data-testid="report-kpis"] > .sy-kpi')
		.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
	expect(heights).toHaveLength(5);
	expect(new Set(heights).size).toBe(1);
	await expect(
		page.getByTestId("kpi-roas").locator(".sy-kpi__label"),
	).toHaveCSS("font-size", "12px");
	await expect(
		page.getByTestId("kpi-roas").locator(".sy-kpi__value"),
	).toHaveCSS("font-size", "24px");

	// one money display: no "Minor units" label anywhere, currency-formatted values
	await expect(page.getByTestId("reporting-view")).not.toContainText(
		"Minor units",
	);
	await expect(page.getByTestId("reporting-view")).not.toContainText(
		"minor units",
	);

	// detail panel exists only once a row exists
	await expect(page.getByTestId("report-detail")).toBeVisible();
	await page.unroute(REPORT_URL);
	await page.route(REPORT_URL, (r) =>
		r.fulfill({
			status: 200,
			contentType: "application/json",
			body: reportBody([]),
		}),
	);
	await page.getByTestId("report-refresh").click();
	await expect(page.getByTestId("state-empty")).toBeVisible();
	await expect(page.getByTestId("report-detail")).toHaveCount(0);
});

for (const language of ["en", "ar"] as const)
	test(`same revenue string on Dashboard and Reporting (${language})`, async ({
		page,
		request,
	}) => {
		const f = await fixture(request);
		await page.route(REPORT_URL, (r) =>
			r.fulfill({
				status: 200,
				contentType: "application/json",
				body: reportBody(SEEDED_ROWS, SEEDED_SPEND),
			}),
		);
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.addInitScript(
			(l) => localStorage.setItem("sy.locale", l),
			language,
		);
		await page.goto("/app/dashboard");
		await page.locator("input[name=token]").fill(f.tokens.manager);
		await page.locator("input[name=tenant]").fill(f.ids.a);
		await page.getByTestId("connect-submit").click();
		const dash = page.getByTestId("kpi-revenue").locator(".sy-money");
		await expect(dash).toBeVisible();
		const dashText = (await dash.innerText()).trim();
		const dashRoas = (
			await page.getByTestId("kpi-roas").locator(".sy-kpi__value").innerText()
		).trim();

		await page.getByTestId("nav-reporting").click();
		await expect(page.getByTestId("reporting-view")).toBeVisible();
		const rep = page.getByTestId("kpi-revenue").locator(".sy-money");
		await expect(rep).toBeVisible();
		const repText = (await rep.innerText()).trim();

		expect(dashText.length).toBeGreaterThan(0);
		expect(repText).toBe(dashText);
		// ROAS and the unattributed share use locale digits like the Dashboard (consistency decision)
		const repRoas = (
			await page.getByTestId("kpi-roas").locator(".sy-kpi__value").innerText()
		).trim();
		const repShare = (
			await page
				.getByTestId("kpi-unattributed")
				.locator(".sy-kpi__value")
				.innerText()
		).trim();
		expect(repRoas).toBe(dashRoas);
		expect(repRoas).toMatch(language === "ar" ? /^[^0-9]*[٠-٩]/ : /\d/);
		if (language === "ar") {
			expect(repRoas).not.toMatch(/[0-9]/);
			// a lone zero is the legible Western "0" (UX-R3-03); any other value uses Arabic-Indic digits only
			if (/^0(?![0-9٠-٩٫٬])/.test(repShare)) expect(repShare).not.toMatch(/[1-9٠-٩]/);
			else {
				expect(repShare).not.toMatch(/[0-9]/);
				expect(repShare).toMatch(/[٠-٩]/);
			}
		}
		// 12,345,678 minor units = 123,456.78 in EGP; locale digits (Arabic-Indic in AR, Latin in EN)
		if (language === "ar") expect(repText).not.toMatch(/[0-9]/);
		else expect(repText).toMatch(/123,456\.78/);
	});

test("reporting en (UX-23): empty state has a primary 'Publish calculation' CTA that opens the confirm dialog", async ({
	page,
	request,
}) => {
	const f = await fixture(request);
	await page.route(REPORT_URL, (r) =>
		r.fulfill({
			status: 200,
			contentType: "application/json",
			body: reportBody([]),
		}),
	);
	await open(page, f, "en");
	const cta = page.getByTestId("report-empty-publish");
	await expect(page.getByTestId("state-empty")).toBeVisible();
	await expect(cta).toBeVisible();
	await expect(cta).toBeEnabled();
	await expect(cta).toHaveText("Publish calculation");
	await cta.click();
	await expect(page.getByTestId("publish-dialog")).toBeVisible();
});

test("reporting en (UX-23): loading shows six skeleton rows with aria-busy, not a lone spinner", async ({
	page,
	request,
}) => {
	const f = await fixture(request);
	let release: () => void = () => undefined;
	const gate = new Promise<void>((resolve) => {
		release = resolve;
	});
	await page.route(REPORT_URL, async (r) => {
		await gate;
		await r.fulfill({
			status: 200,
			contentType: "application/json",
			body: reportBody(SEEDED_ROWS, SEEDED_SPEND),
		});
	});
	await open(page, f, "en");
	const busy = page.locator('[role="tabpanel"] [aria-busy="true"]');
	await expect(busy).toBeVisible();
	await expect(busy.getByTestId("skeleton-row")).toHaveCount(6);
	await expect(page.getByTestId("report-kpis-loading")).toHaveAttribute(
		"aria-busy",
		"true",
	);
	release();
	await expect(page.getByTestId("report-kpis")).toBeVisible();
	await expect(page.getByTestId("skeleton-row")).toHaveCount(0);
});
