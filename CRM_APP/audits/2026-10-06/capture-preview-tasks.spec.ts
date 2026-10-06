import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import pg from "pg";
import { seed } from "../../scripts/seed.js";

process.loadEnvFile(".env");

const NAMES = [
	"متابعة عرض السعر مع شركة النور - Nile Office",
	"Send renewal proposal",
	"Call Zahra Trading شركة الزهراء",
	"Confirm hotel booking",
	"تحديث بيانات العميل",
	"Prepare onboarding deck",
	"Review contract Delta Foods",
	"مراجعة الفاتورة",
];

for (const language of ["en", "ar"] as const)
	for (const theme of ["light", "dark"] as const)
		for (const width of [1440, 375] as const)
			test(`shot tasks ${language} ${theme} ${width}`, async ({ page, request }) => {
				const admin = new pg.Client({ connectionString: process.env.ADMIN_DATABASE_URL });
				await admin.connect();
				const f = await seed(admin);
				await admin.end();
				const h = (k: string) => ({ Authorization: `Bearer ${f.tokens.manager}`, "X-Tenant-ID": f.ids.a, "Idempotency-Key": k });
				let command_id = randomUUID();
				const c = await request.post("/v1/contacts", { headers: h(command_id), data: { command_id, display_name: "شركة النور - Nile Office" } });
				const contact = (await c.json()).data as { id: string };
				for (const [i, title] of NAMES.entries()) {
					command_id = randomUUID();
					const res = await request.post("/v1/tasks", {
						headers: h(command_id),
						data: { command_id, title, contact_id: contact.id, due_at: new Date(Date.now() + (i - 1) * 86_400_000 + 3_600_000).toISOString() },
					});
					expect(res.status()).toBe(201);
				}
				await page.setViewportSize({ width, height: width === 1440 ? 900 : 812 });
				await page.addInitScript(([l, th]) => {
					localStorage.setItem("sy.locale", l as string);
					localStorage.setItem("sy.theme", th as string);
				}, [language, theme]);
				await page.goto("/app/tasks");
				await page.locator("input[name=token]").fill(f.tokens.manager);
				await page.locator("input[name=tenant]").fill(f.ids.a);
				await page.getByTestId("connect-submit").click();
				await expect(page.getByTestId("grid-row").first()).toBeVisible();
				const target = page.getByTestId("grid-row").filter({ hasText: "متابعة عرض السعر" }).first();
				await target.scrollIntoViewIfNeeded();
				if (width === 1440) await target.locator(".sy-cell-id").click();
				else await target.click({ position: { x: 24, y: 10 } });
				await expect(page.getByTestId("task-detail")).toBeVisible();
				await page.waitForTimeout(500);
				await page.screenshot({ path: `audits/2026-10-06/shots-preview-tasks/tasks-${language}-${theme}-${width}.png`, fullPage: false });
			});
