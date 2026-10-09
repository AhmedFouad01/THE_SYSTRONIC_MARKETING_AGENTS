import { randomUUID } from "node:crypto";
import { type APIRequestContext, expect, type Page, test } from "@playwright/test";
import pg from "pg";
import { seed } from "../scripts/seed.js";
import { pickValue } from "./select-helper.js";

process.loadEnvFile(".env");

// P1b B4 UI: custom fields as list columns, typed filter and sort on the Leads list. Synthetic fixture per test.
async function fixture() {
	const admin = new pg.Client({ connectionString: process.env.ADMIN_DATABASE_URL });
	await admin.connect();
	const f = await seed(admin);
	await admin.end();
	return f;
}
type Fixture = Awaited<ReturnType<typeof fixture>>;
const auth = (f: Fixture) => ({ Authorization: `Bearer ${f.tokens.manager}`, "X-Tenant-ID": f.ids.a });

async function createProp(request: APIRequestContext, f: Fixture, body: Record<string, unknown>) {
	const command_id = randomUUID();
	const r = await request.post("/v1/schema/lead/properties", { headers: { ...auth(f), "Idempotency-Key": command_id }, data: { command_id, ...body } });
	expect(r.status()).toBe(201);
}
async function makeLead(request: APIRequestContext, f: Fixture, title: string, properties: Record<string, unknown>) {
	const command_id = randomUUID();
	const r = await request.post("/v1/leads", {
		headers: { ...auth(f), "Idempotency-Key": command_id },
		data: { command_id, title, source_evidence: "synthetic", contact: { display_name: `Contact ${title}`, email: "ui-fixture@example.test" }, properties },
	});
	expect(r.status()).toBe(201);
}

const T = {
	en: { seats: "Seats", plan: "Plan", pro: "Professional", basic: "Basic" },
	ar: { seats: "عدد المقاعد", plan: "الباقة", pro: "احترافية", basic: "أساسية" },
} as const;

async function setup(request: APIRequestContext, f: Fixture) {
	await createProp(request, f, { key: "seats", type: "number", label: { en: T.en.seats, ar: T.ar.seats } });
	await createProp(request, f, {
		key: "plan",
		type: "single_select",
		label: { en: T.en.plan, ar: T.ar.plan },
		options: [
			{ value: "basic", label: { en: T.en.basic, ar: T.ar.basic }, color: "gray" },
			{ value: "pro", label: { en: T.en.pro, ar: T.ar.pro }, color: "green" },
		],
	});
	await makeLead(request, f, "Alpha lead", { seats: 100, plan: "basic" });
	await makeLead(request, f, "Bravo lead", { seats: 500, plan: "pro" });
	await makeLead(request, f, "Charlie lead", { seats: 300, plan: "pro" });
}

async function start(page: Page, f: Fixture, language: "en" | "ar", width = 1440, theme: "light" | "dark" = "light") {
	await page.setViewportSize({ width, height: 900 });
	await page.addInitScript(
		([l, th]) => {
			localStorage.setItem("sy.locale", l as string);
			localStorage.setItem("sy.theme", th as string);
		},
		[language, theme],
	);
	await page.goto("/app/leads");
	await page.locator("input[name=token]").fill(f.tokens.manager);
	await page.locator("input[name=tenant]").fill(f.ids.a);
	await page.getByTestId("connect-submit").click();
	await expect(page.getByTestId("actor")).toBeVisible();
	await expect(page.locator("html")).toHaveAttribute("dir", language === "ar" ? "rtl" : "ltr");
	await expect(page.getByTestId("grid-row")).toHaveCount(3);
}

async function showColumn(page: Page, key: string) {
	await page.getByTestId("cc-picker").click();
	await page.getByTestId(`cc-col-${key}`).locator("input").check();
	await page.keyboard.press("Escape");
}
const titles = (page: Page) =>
	page.getByTestId("grid-row").evaluateAll((rows) => rows.map((r) => (r.textContent ?? "").match(/(Alpha|Bravo|Charlie)/)?.[1] ?? "?"));

for (const language of ["en", "ar"] as const) {
	test.describe(`custom columns ${language}`, () => {
		test("picker lists readable custom fields, shows a column with a typed value and remembers it", async ({ page, request }) => {
			const f = await fixture();
			await setup(request, f);
			await start(page, f, language);
			await expect(page.getByTestId("cc-cell-seats")).toHaveCount(0);
			await page.getByTestId("cc-picker").click();
			await expect(page.getByTestId("cc-col-seats")).toBeVisible();
			await expect(page.getByTestId("cc-col-plan")).toBeVisible();
			await page.getByTestId("cc-col-seats").locator("input").check();
			await page.getByTestId("cc-col-plan").locator("input").check();
			await page.keyboard.press("Escape");
			await expect(page.getByTestId("sort-cf:seats")).toBeVisible();
			await expect(page.getByTestId("cc-cell-seats")).toHaveCount(3);
			// numbers are formatted per locale (Arabic-Indic digits in AR); the option shows its label chip
			const all = (await page.getByTestId("cc-cell-seats").allTextContents()).join(" ");
			expect(all).toContain(language === "ar" ? "٣٠٠" : "300");
			await expect(page.getByTestId("cc-cell-plan").getByTestId("cf-chip").first()).toBeVisible();
			// toggling off removes the column; the choice survives a reload
			await page.getByTestId("cc-picker").click();
			await page.getByTestId("cc-col-plan").locator("input").uncheck();
			await page.keyboard.press("Escape");
			await expect(page.getByTestId("cc-cell-plan")).toHaveCount(0);
			await page.reload();
			await expect(page.getByTestId("grid-row")).toHaveCount(3);
			await expect(page.getByTestId("cc-cell-seats")).toHaveCount(3);
			await expect(page.getByTestId("cc-cell-plan")).toHaveCount(0);
		});

		test("sorts by a custom column header, both directions", async ({ page, request }) => {
			const f = await fixture();
			await setup(request, f);
			await start(page, f, language);
			await showColumn(page, "seats");
			await page.getByTestId("sort-cf:seats").click();
			await expect.poll(() => titles(page)).toEqual(["Alpha", "Charlie", "Bravo"]);
			await expect(page.locator("th[aria-sort=ascending]")).toBeVisible();
			await page.getByTestId("sort-cf:seats").click();
			await expect.poll(() => titles(page)).toEqual(["Bravo", "Charlie", "Alpha"]);
			await expect(page.locator("th[aria-sort=descending]")).toBeVisible();
		});

		test("filters by typed custom conditions (number, then select), shows chips and clears", async ({ page, request }) => {
			const f = await fixture();
			await setup(request, f);
			await start(page, f, language);
			await page.getByTestId("grid-filters").click();
			await page.getByTestId("cc-add-filter").click();
			const row = page.getByTestId("cc-filter-row").first();
			await pickValue(row.getByTestId("cc-field"), "seats");
			await pickValue(row.getByTestId("cc-op"), "gte");
			await row.getByTestId("cc-value").fill(language === "ar" ? "٣٠٠" : "300");
			await expect(page.getByTestId("cc-chip")).toHaveCount(1);
			await expect(page.getByTestId("grid-row")).toHaveCount(2);
			await expect.poll(async () => (await titles(page)).sort()).toEqual(["Bravo", "Charlie"]);
			// the filter works without the column being shown; a second row narrows by the option
			await page.getByTestId("cc-add-filter").click();
			const second = page.getByTestId("cc-filter-row").nth(1);
			await pickValue(second.getByTestId("cc-field"), "plan");
			await pickValue(second.getByTestId("cc-value"), "pro");
			await expect(page.getByTestId("cc-chip")).toHaveCount(2);
			await pickValue(row.getByTestId("cc-op"), "gt");
			await expect(page.getByTestId("grid-row")).toHaveCount(1);
			await expect(page.getByTestId("grid-row")).toContainText("Bravo");
			// a chip's remove button drops that row; Clear filters resets the rest
			await page.getByTestId("cc-chip").first().getByRole("button").click();
			await expect(page.getByTestId("cc-chip")).toHaveCount(1);
			await page.getByRole("button", { name: language === "ar" ? "مسح الفلاتر" : "Clear filters" }).first().click();
			await expect(page.getByTestId("cc-chip")).toHaveCount(0);
			await expect(page.getByTestId("grid-row")).toHaveCount(3);
		});
	});
}

test("at 375px (AR, dark) the custom column, filter row and sheet do not clip or overflow", async ({ page, request }) => {
	const f = await fixture();
	await setup(request, f);
	await start(page, f, "ar", 375, "dark");
	await page.getByTestId("grid-filters").click();
	const sheet = page.getByTestId("grid-sheet");
	await expect(sheet).toBeVisible();
	await sheet.getByTestId("cc-col-seats").locator("input").check();
	await sheet.getByTestId("cc-add-filter").click();
	const row = sheet.getByTestId("cc-filter-row").first();
	await pickValue(row.getByTestId("cc-field"), "seats");
	await pickValue(row.getByTestId("cc-op"), "gte");
	await row.getByTestId("cc-value").fill("٣٠٠");
	await page.getByTestId("grid-sheet-done").click();
	await expect(page.getByTestId("grid-row")).toHaveCount(2);
	await expect(page.getByTestId("cc-cell-seats").first()).toBeVisible();
	const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
	expect(overflow).toBeLessThanOrEqual(0);
});

// Audit screenshots (only when SHOTS_DIR is set): same data, one custom column plus an active custom filter.
if (process.env.SHOTS_DIR) {
	const shots: Array<{ name: string; language: "en" | "ar"; width: number; theme: "light" | "dark" }> = [
		{ name: "en-light-1440", language: "en", width: 1440, theme: "light" },
		{ name: "ar-light-1440", language: "ar", width: 1440, theme: "light" },
		{ name: "ar-dark-1440", language: "ar", width: 1440, theme: "dark" },
		{ name: "ar-light-375", language: "ar", width: 375, theme: "light" },
	];
	for (const s of shots) {
		test(`shot ${s.name}`, async ({ page, request }) => {
			const f = await fixture();
			await setup(request, f);
			await start(page, f, s.language, s.width, s.theme);
			const mobile = s.width < 600;
			await page.getByTestId("grid-filters").click();
			const scope = mobile ? page.getByTestId("grid-sheet") : page;
			await scope.getByTestId("cc-add-filter").click();
			const row = scope.getByTestId("cc-filter-row").first();
			await pickValue(row.getByTestId("cc-field"), "seats");
			await pickValue(row.getByTestId("cc-op"), "gte");
			await row.getByTestId("cc-value").fill(s.language === "ar" ? "٢٠٠" : "200");
			if (mobile) {
				await scope.getByTestId("cc-col-seats").locator("input").check();
				await scope.getByTestId("cc-col-plan").locator("input").check();
				await page.getByTestId("grid-sheet-done").click();
			} else {
				await showColumn(page, "seats");
				await showColumn(page, "plan");
			}
			await expect(page.getByTestId("grid-row")).toHaveCount(2);
			await expect(page.getByTestId("cc-cell-seats").first()).toBeVisible();
			await page.screenshot({ path: `${process.env.SHOTS_DIR}/${s.name}.png` });
		});
	}
}
