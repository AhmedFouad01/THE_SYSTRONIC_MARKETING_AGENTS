import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import pg from "pg";
import { seed } from "../../scripts/seed.js";

process.loadEnvFile(".env");

const CAMPAIGNS = ["حملة رمضان - Ramadan Sale", "Summer Launch 2026", "عرض الجمعة البيضاء", "Retargeting - Cart abandoners", "حملة الواتساب - WhatsApp Broadcast"];

for (const language of ["en", "ar"] as const)
	for (const theme of ["light", "dark"] as const)
		for (const width of [1440, 375] as const)
			test(`shot reporting ${language} ${theme} ${width}`, async ({ page, request }) => {
				const admin = new pg.Client({ connectionString: process.env.ADMIN_DATABASE_URL });
				await admin.connect();
				const f = await seed(admin);
				await admin.end();
				void request;
				void randomUUID;
				await page.route("**/v1/reports/campaign-performance*", (r) =>
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
									campaign_id: `c${i}`,
									campaign_name: name,
									source: i % 2 ? "ads" : "email",
									currency: "EGP",
									conversion_type: "payment_captured",
									value_minor: 12_000_000 - i * 1_500_000,
									outcomes: 20 - i * 3,
								})),
								spend: CAMPAIGNS.map((name, i) => ({
									campaign_id: `c${i}`,
									name,
									currency: "EGP",
									spend_minor: 3_000_000 + i * 200_000,
									reporting_date: "2026-10-01",
									timezone: "UTC",
								})),
							},
						}),
					}),
				);
				await page.setViewportSize({ width, height: width === 1440 ? 900 : 812 });
				await page.addInitScript(
					([l, th]) => {
						localStorage.setItem("sy.locale", l as string);
						localStorage.setItem("sy.theme", th as string);
					},
					[language, theme],
				);
				await page.goto("/app/reporting");
				await page.locator("input[name=token]").fill(f.tokens.manager);
				await page.locator("input[name=tenant]").fill(f.ids.a);
				await page.getByTestId("connect-submit").click();
				await expect(page.getByTestId("grid-row").first()).toBeVisible();
				const target = page.getByTestId("grid-row").nth(1);
				if (width === 1440) await target.locator("td").first().click();
				else await target.getByTestId("campaign-detail").click();
				await expect(page.getByTestId("report-detail")).toBeVisible();
				await page.waitForTimeout(500);
				await page.screenshot({ path: `audits/2026-10-06/shots-preview-reporting/reporting-${language}-${theme}-${width}.png`, fullPage: false });
			});
