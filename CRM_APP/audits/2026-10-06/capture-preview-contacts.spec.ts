import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import pg from "pg";
import { seed } from "../../scripts/seed.js";

process.loadEnvFile(".env");

const NAMES = [
	"شركة النور للتجارة والتوريدات العامة - Nile Office",
	"Acme Logistics",
	"Zahra Trading Co. شركة الزهراء",
	"Hotel Nile View",
	"أحمد فؤاد",
	"Delta Foods",
	"Orbit Systems",
	"مؤسسة الأمل",
];

for (const language of ["en", "ar"] as const)
	for (const theme of ["light", "dark"] as const)
		for (const width of [1440, 375] as const)
			test(`shot contacts ${language} ${theme} ${width}`, async ({ page, request }) => {
				const admin = new pg.Client({ connectionString: process.env.ADMIN_DATABASE_URL });
				await admin.connect();
				const f = await seed(admin);
				await admin.end();
				for (const [i, name] of NAMES.entries()) {
					const command_id = randomUUID();
					const res = await request.post("/v1/contacts", {
						headers: { Authorization: `Bearer ${f.tokens.manager}`, "X-Tenant-ID": f.ids.a, "Idempotency-Key": command_id },
						data: {
							command_id,
							display_name: name,
							identifiers: [{ kind: "email", value: `c${i}-${command_id.slice(0, 6)}@example.test`, provenance: "manual_entry" }],
						},
					});
					expect(res.status()).toBe(201);
				}
				await page.setViewportSize({ width, height: width === 1440 ? 900 : 812 });
				await page.addInitScript(([l, th]) => {
					localStorage.setItem("sy.locale", l as string);
					localStorage.setItem("sy.theme", th as string);
				}, [language, theme]);
				await page.goto("/app/contacts");
				await page.locator("input[name=token]").fill(f.tokens.manager);
				await page.locator("input[name=tenant]").fill(f.ids.a);
				await page.getByTestId("connect-submit").click();
				await expect(page.getByTestId("grid-row").first()).toBeVisible();
				const target = page.getByTestId("grid-row").filter({ hasText: "شركة النور" }).first();
				await target.scrollIntoViewIfNeeded();
				await target.click({ position: { x: 24, y: 10 } });
				await expect(page.getByTestId("contact-detail")).toBeVisible();
				await expect(page.getByTestId("identifiers")).toBeVisible();
				await page.waitForTimeout(500);
				await page.screenshot({ path: `audits/2026-10-06/shots-preview-contacts/contacts-${language}-${theme}-${width}.png`, fullPage: false });
			});
