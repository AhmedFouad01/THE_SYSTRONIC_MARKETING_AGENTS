import { randomUUID } from "node:crypto";
import { type APIRequestContext, expect, type Page, test } from "@playwright/test";
import pg from "pg";
import { seed } from "../scripts/seed.js";

process.loadEnvFile(".env");

// UI R4 C, increment 5: the three Reporting detail panes (Campaigns, Conversions, Orders) use the shared preview
// slide-over; the permanent detail column and its "pick a row" placeholder are gone. Credentials stay in memory.
async function fixture(request: APIRequestContext) {
	const admin = new pg.Client({ connectionString: process.env.ADMIN_DATABASE_URL });
	await admin.connect();
	let f: Awaited<ReturnType<typeof seed>>;
	try {
		f = await seed(admin);
	} finally {
		await admin.end();
	}
	const h = (key = randomUUID()) => ({
		Authorization: `Bearer ${f.tokens.manager}`,
		"X-Tenant-ID": f.ids.a,
		"Idempotency-Key": key,
	});
	// three orders, each with a captured payment (-> three conversions once the calculation is published)
	for (const n of [1, 2, 3]) {
		const base = {
			source: "ui",
			external_order_id: `ORD-00${n}`,
			contact_id: f.ids.contact,
			currency: "EGP",
			amount_minor: 10000 * n,
			occurred_at: new Date(Date.now() - 60_000 * n).toISOString(),
		};
		for (const b of [
			{ ...base, source_event_id: randomUUID(), kind: "order", status: "placed" },
			{ ...base, source_event_id: randomUUID(), kind: "payment", external_id: `pay-${n}` },
		]) {
			const r = await request.post("/v1/journey/commerce", { headers: h(), data: b });
			expect(r.status()).toBe(200);
		}
	}
	const calc = await request.post("/v1/journey/calculate", { headers: h(), data: { lookback_days: 30 } });
	expect(calc.status()).toBeLessThan(300);
	return f;
}
type Fixture = Awaited<ReturnType<typeof fixture>>;

const REPORT_URL = "**/v1/reports/campaign-performance*";
const CAMPAIGNS = ["Alpha", "Beta", "Gamma"];
const mockCampaigns = (page: Page) =>
	page.route(REPORT_URL, (r) =>
		r.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				data: {
					model: "last_non_direct",
					version: "deterministic-v1",
					lookback_days: 30,
					run_id: "run-1",
					as_of: "2026-10-05T10:00:00.000Z",
					rows: CAMPAIGNS.map((name, i) => ({
						campaign_id: name.toLowerCase(),
						campaign_name: name,
						source: "ads",
						currency: "EGP",
						conversion_type: "payment_captured",
						value_minor: 1_000_000 - i * 100_000,
						outcomes: 3 - i,
					})),
					spend: [],
				},
			}),
		}),
	);

async function start(
	page: Page,
	f: Fixture,
	o: { language?: "ar" | "en"; width?: number; theme?: "light" | "dark" } = {},
) {
	await page.setViewportSize({ width: o.width ?? 1440, height: 900 });
	await page.addInitScript(
		([l, th]) => {
			localStorage.setItem("sy.locale", l as string);
			if (th) localStorage.setItem("sy.theme", th as string);
		},
		[o.language ?? "en", o.theme ?? ""],
	);
	await page.goto("/app/reporting");
	await page.locator("input[name=token]").fill(f.tokens.manager);
	await page.locator("input[name=tenant]").fill(f.ids.a);
	await page.getByTestId("connect-submit").click();
	await expect(page.getByTestId("reporting-view")).toBeVisible();
}

const TABS = {
	en: { campaigns: "Campaign performance", conversions: "Conversions", orders: "Orders / payments / refunds" },
	ar: { campaigns: "أداء الحملات", conversions: "التحويلات", orders: "الطلبات والمدفوعات والاسترداد" },
} as const;
const PLACEHOLDER = /Select a row to see|اختر صفًا لعرض/;
const KEYS = ["campaigns", "conversions", "orders"] as const;
type Tab = (typeof KEYS)[number];

const rows = (page: Page) => page.getByTestId("grid-row");
const panel = (page: Page) => page.getByTestId("report-detail");
const gotoTab = (page: Page, language: "en" | "ar", tab: Tab) =>
	page.getByRole("tab", { name: TABS[language][tab], exact: true }).click();
const openRow = (page: Page, i: number) => rows(page).nth(i).locator("td").first().click();

for (const language of ["en", "ar"] as const)
	test(`reporting preview ${language} 1440: each tab opens the slide-over on row click; no placeholder; table keeps its width; Esc closes and returns focus to the row`, async ({
		page,
		request,
	}) => {
		const f = await fixture(request);
		await mockCampaigns(page);
		await start(page, f, { language });
		for (const tab of KEYS) {
			await gotoTab(page, language, tab);
			await expect(rows(page)).toHaveCount(3);
			await expect(panel(page)).toHaveCount(0);
			await expect(page.getByTestId("reporting-view")).not.toContainText(PLACEHOLDER);
			await expect(page.locator(".sy-rep__detail")).toHaveCount(0);
			const before = await page.getByTestId("grid-table").boundingBox();
			expect(before?.width ?? 0).toBeGreaterThan(900); // full width: no second column

			await openRow(page, 1);
			await expect(panel(page)).toBeVisible();
			await expect(panel(page)).toHaveAttribute("role", "dialog");
			await expect(panel(page)).toHaveAttribute("aria-modal", "false");
			await expect(panel(page).getByRole("heading").first()).toBeFocused();
			await expect(rows(page).nth(1)).toHaveAttribute("aria-current", "true");
			if (tab === "campaigns") await expect(panel(page).getByRole("heading").first()).toHaveText("Beta");
			else await expect(panel(page).getByTestId("detail-body")).toBeVisible();
			await expect(panel(page).getByTestId("preview-position")).toHaveText(language === "ar" ? "٢ من ٣" : "2 of 3");
			const after = await page.getByTestId("grid-table").boundingBox();
			expect(after?.width).toBe(before?.width);

			await page.keyboard.press("Escape");
			await expect(panel(page)).toHaveCount(0);
			await expect(rows(page).nth(1)).toBeFocused();
		}
	});

for (const language of ["en", "ar"] as const)
	test(`reporting preview ${language} 1440: docked at the inline end (EN right, AR left) below the topbar, entering from that side`, async ({
		page,
		request,
	}) => {
		const f = await fixture(request);
		await mockCampaigns(page);
		await start(page, f, { language });
		await expect(page.locator("html")).toHaveAttribute("dir", language === "ar" ? "rtl" : "ltr");
		for (const tab of KEYS) {
			await gotoTab(page, language, tab);
			await expect(rows(page)).toHaveCount(3);
			await openRow(page, 0);
			await expect(panel(page)).toBeVisible();
			const startX = await panel(page).evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41);
			if (language === "ar") expect(startX).toBeLessThanOrEqual(0);
			else expect(startX).toBeGreaterThanOrEqual(0);
			await page.waitForTimeout(350);
			expect(await panel(page).evaluate((el) => getComputedStyle(el).transform)).toBe("none");
			const box = await panel(page).boundingBox();
			if (!box) throw new Error("no panel box");
			if (language === "ar") expect(Math.abs(box.x)).toBeLessThanOrEqual(1);
			else expect(Math.abs(box.x + box.width - 1440)).toBeLessThanOrEqual(1);
			expect(Math.abs(box.y - 56)).toBeLessThanOrEqual(1);
			expect(Math.abs(box.y + box.height - 900)).toBeLessThanOrEqual(1);
			// the sidebar and the page title stay uncovered
			for (const loc of [page.getByTestId("nav-contacts"), page.getByRole("heading", { level: 1 })]) {
				const b = await loc.boundingBox();
				if (!b) throw new Error("no box");
				expect(b.x >= box.x + box.width - 1 || b.x + b.width <= box.x + 1).toBe(true);
			}
			await page.keyboard.press("Escape");
			await expect(panel(page)).toHaveCount(0);
		}
	});

test("reporting preview en 1440: Prev/Next and J/K walk the loaded rows, a row click swaps in place, an outside click closes", async ({
	page,
	request,
}) => {
	const f = await fixture(request);
	await mockCampaigns(page);
	await start(page, f);
	const heading = panel(page).getByRole("heading").first();
	// Campaigns: the heading carries the campaign name; rows are ordered by revenue (Alpha first)
	await openRow(page, 0);
	await expect(heading).toHaveText("Alpha");
	await expect(panel(page).getByTestId("preview-prev")).toBeDisabled();
	await panel(page).getByTestId("preview-next").click();
	await expect(heading).toHaveText("Beta");
	await page.keyboard.press("j");
	await expect(heading).toHaveText("Gamma");
	await expect(panel(page).getByTestId("preview-next")).toBeDisabled();
	await page.keyboard.press("k");
	await expect(heading).toHaveText("Beta");
	await panel(page).getByTestId("preview-prev").click();
	await expect(heading).toHaveText("Alpha");
	await openRow(page, 2);
	await expect(heading).toHaveText("Gamma");
	await expect(panel(page)).toHaveCount(1);
	await page.getByRole("heading", { level: 1 }).click(); // outside click
	await expect(panel(page)).toHaveCount(0);

	// Orders: Prev/Next swap the fetched detail
	await gotoTab(page, "en", "orders");
	await expect(rows(page)).toHaveCount(3);
	await openRow(page, 0);
	await expect(panel(page).getByTestId("detail-body")).toBeVisible();
	const first = await heading.innerText();
	await panel(page).getByTestId("preview-next").click();
	await expect(rows(page).nth(1)).toHaveAttribute("aria-current", "true");
	await expect.poll(async () => heading.innerText()).not.toBe(first);
	await expect(panel(page).getByTestId("detail-body")).toBeVisible();
	await panel(page).getByTestId("preview-close").click();
	await expect(panel(page)).toHaveCount(0);

	// switching tabs while a preview is open closes it (a tab click is an outside click)
	await gotoTab(page, "en", "conversions");
	await openRow(page, 0);
	await expect(panel(page)).toBeVisible();
	await gotoTab(page, "en", "campaigns");
	await expect(panel(page)).toHaveCount(0);
});

test("reporting preview en 1440: the explicit Details button opens the same preview; opening a campaign shows credits, spend and unknown note", async ({
	page,
	request,
}) => {
	const f = await fixture(request);
	await start(page, f); // real report: the seeded outcome is the unknown / unattributed campaign
	await expect(rows(page)).toHaveCount(1);
	await page.getByTestId("campaign-detail").first().click();
	await expect(panel(page)).toBeVisible();
	await expect(panel(page).getByRole("heading").first()).toHaveText("Unknown / unattributed");
	await expect(panel(page)).toContainText("Credited outcomes");
	await expect(panel(page)).toContainText("Outcomes with no campaign touchpoint");
	await expect(panel(page).getByTestId("preview-next")).toBeDisabled();
	await expect(panel(page).getByTestId("preview-prev")).toBeDisabled();
});

for (const language of ["en", "ar"] as const)
	test(`reporting preview ${language} 375: each tab opens a full-screen sheet from the right with Back; Esc and browser Back close it`, async ({
		page,
		request,
	}) => {
		const f = await fixture(request);
		await mockCampaigns(page);
		await start(page, f, { language, width: 375 });
		const base = await page.evaluate(() => history.length);
		for (const tab of KEYS) {
			await gotoTab(page, language, tab);
			await expect(rows(page).first()).toBeVisible();
			await expect(page.getByTestId("reporting-view")).not.toContainText(PLACEHOLDER);
			await page.getByTestId(`${tab === "campaigns" ? "campaign" : tab === "conversions" ? "conversion" : "order"}-detail`).first().click();
			await expect(panel(page)).toBeVisible();
			await expect(panel(page)).toHaveAttribute("aria-modal", "true");
			expect(await panel(page).evaluate((el) => getComputedStyle(el).animationName)).toBe("sy-sheet-in");
			await page.waitForTimeout(400);
			const box = await panel(page).boundingBox();
			expect(box?.x ?? -1).toBeCloseTo(0, 0);
			expect(box?.width ?? 0).toBeCloseTo(375, 0);
			await expect(page.getByTestId("sheet-back")).toBeVisible();
			await expect.poll(() => page.evaluate(() => history.length)).toBe(base + 1);
			await page.keyboard.press("Escape");
			await expect(panel(page)).toHaveCount(0);
			await expect(page.getByTestId("grid-table").locator(":focus")).toHaveCount(1);
			expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
		}
		await gotoTab(page, language, "orders");
		await page.getByTestId("order-detail").first().click();
		await expect(panel(page)).toBeVisible();
		await page.goBack();
		await expect(panel(page)).toHaveCount(0);
		await expect(page).toHaveURL(/\/app\/reporting$/);
		await expect(page.getByTestId("reporting-view")).toBeVisible();
	});

// CREATIVE gate F1-F3: mixed AR/EN campaign names align on the start edge in both UI languages (central BidiText), and
// the AR counters render real Arabic-Indic digits for the right numbers (U+0665 for 5 looks like a "0" in some fonts).
const MIXED = [
	"Ramadan Sale - حملة رمضان",
	"Summer Launch 2026",
	"عرض الجمعة البيضاء",
	"Retargeting - Cart abandoners",
	"حملة الواتساب - WhatsApp Broadcast",
];
const mockMixed = (page: Page) =>
	page.route(REPORT_URL, (r) =>
		r.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				data: {
					model: "last_non_direct",
					version: "deterministic-v1",
					lookback_days: 30,
					run_id: "run-1",
					as_of: "2026-10-05T10:00:00.000Z",
					rows: MIXED.map((name, i) => ({
						campaign_id: `c${i}`,
						campaign_name: name,
						source: "ads",
						currency: "EGP",
						conversion_type: "payment_captured",
						value_minor: 1_000_000 - i * 100_000,
						outcomes: 5 - i,
					})),
					spend: [],
				},
			}),
		}),
	);

for (const language of ["en", "ar"] as const)
	test(`reporting preview ${language} 1440: mixed Arabic/Latin campaign names start-align in the first column; counters carry the right digits`, async ({
		page,
		request,
	}) => {
		const f = await fixture(request);
		await mockMixed(page);
		await start(page, f, { language });
		await expect(rows(page)).toHaveCount(5);
		// start edge of the value inside each first-column cell (EN: left edge, AR: right edge) is the same for every row
		const edges = await rows(page).evaluateAll((trs, ar) =>
			trs.map((tr) => {
				const el = tr.querySelector("td .sy-bidi-text");
				if (!el) return Number.NaN;
				const b = el.getBoundingClientRect();
				return Math.round(ar ? b.right : b.left);
			}),
		language === "ar");
		expect(edges.every((e) => !Number.isNaN(e))).toBe(true);
		expect(Math.max(...edges) - Math.min(...edges)).toBeLessThanOrEqual(1);
		// the value keeps its own resolved direction (Arabic-first names are rtl, Latin-first ltr) and is not zig-zagged
		const dirs = await rows(page).evaluateAll((trs) =>
			trs.map((tr) => getComputedStyle(tr.querySelector("td .sy-bidi-text") as Element).direction),
		);
		expect(dirs).toEqual(["ltr", "ltr", "rtl", "ltr", "rtl"]);

		const cp = (s: string) => Array.from(s, (c) => c.codePointAt(0)?.toString(16).padStart(4, "0")).join(" ");
		await openRow(page, 1);
		const pos = await panel(page).getByTestId("preview-position").innerText();
		const range = await page.getByTestId("grid-range").innerText();
		if (language === "ar") {
			// 2 / 5 in Arabic-Indic digits: U+0662 and U+0665; never a Latin 0 (U+0030)
			expect(cp(pos)).toBe(cp("٢ من ٥"));
			expect(cp(range)).toBe(cp("١–٥ من ٥"));
			expect(pos + range).not.toContain("0");
		} else {
			expect(pos).toBe("2 of 5");
			expect(range).toBe("1–5 of 5");
		}
	});
