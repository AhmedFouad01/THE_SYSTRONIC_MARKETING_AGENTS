import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import pg from "pg";
import { seed } from "../../scripts/seed.js";

process.loadEnvFile(".env");

const NAMES = [
	"شركة النور للتجارة والتوريدات العامة - طلب عرض سعر",
	"Acme Logistics - renewal 2026",
	"Zahra Trading Co. شركة الزهراء",
	"Hotel Nile View - group booking",
	"عميل محتمل - مؤتمر القاهرة",
	"Delta Foods",
	"Orbit Systems - pilot",
	"مؤسسة الأمل",
];

for (const language of ["ar"] as const)
	for (const theme of ["light", "dark"] as const)
		for (const width of [1440, 375] as const)
			test(`shot leads ${language} ${theme} ${width}`, async ({ page, request }) => {
				const admin = new pg.Client({ connectionString: process.env.ADMIN_DATABASE_URL });
				await admin.connect();
				const f = await seed(admin);
				await admin.end();
				for (const title of NAMES) {
					const command_id = randomUUID();
					const res = await request.post("/v1/leads", {
						headers: { Authorization: `Bearer ${f.tokens.manager}`, "X-Tenant-ID": f.ids.a, "Idempotency-Key": command_id },
						data: { command_id, title, source_evidence: "synthetic", contact: { display_name: `Contact ${title}` } },
					});
					expect(res.status()).toBe(201);
				}
				await page.setViewportSize({ width, height: width === 1440 ? 900 : 812 });
				await page.addInitScript(([l, th]) => {
					localStorage.setItem("sy.locale", l as string);
					localStorage.setItem("sy.theme", th as string);
				}, [language, theme]);
				await page.goto("/app/leads");
				await page.locator("input[name=token]").fill(f.tokens.manager);
				await page.locator("input[name=tenant]").fill(f.ids.a);
				await page.getByTestId("connect-submit").click();
				await expect(page.getByTestId("grid-row").first()).toBeVisible();
				// the longest Arabic name = created first = last row; open it (row 3 on desktop = a mixed name)
				const target = page.getByTestId("grid-row").filter({ hasText: language === "ar" ? "شركة النور" : "Zahra" }).first();
				await target.scrollIntoViewIfNeeded();
				await target.click({ position: { x: 24, y: 10 } });
				await expect(page.getByTestId("lead-detail")).toBeVisible();
				await page.waitForTimeout(500);
				await page.screenshot({ path: `audits/2026-10-06/shots-preview-leads/leads-${language}-${theme}-${width}.png`, fullPage: false });
			});
