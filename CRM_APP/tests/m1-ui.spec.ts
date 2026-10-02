import assert from "node:assert/strict";
import { test, expect } from "@playwright/test";
import pg from "pg";
import { seed } from "../scripts/seed.js";
import { randomUUID } from "node:crypto";
process.loadEnvFile(".env");
for (const width of [360, 1280])
	for (const language of ["ar", "en"]) {
		test(`M1 ${language} ${width}px operational contact → lead → deal → task`, async ({
			page,
			request,
		}) => {
			const admin = new pg.Client({
				connectionString: process.env.ADMIN_DATABASE_URL,
			});
			await admin.connect();
			const fixture = await seed(admin);
			await admin.end();
			const headers = {
				Authorization: `Bearer ${fixture.tokens.manager}`,
				"X-Tenant-ID": fixture.ids.a,
			};
			const errors: string[] = [];
			page.on("pageerror", (e) => errors.push(e.message));
			await page.setViewportSize({ width, height: 900 });
			await page.goto("/");
			if (language === "en") await page.locator("#language").click();
			await expect(page.locator("html")).toHaveAttribute(
				"dir",
				language === "ar" ? "rtl" : "ltr",
			);
			await page.locator("#token").fill(fixture.tokens.manager);
			await page.locator("#token").focus();
			await page.keyboard.press("Tab");
			await expect(page.locator("#tenant")).toBeFocused();
			await page.locator("#tenant").fill(fixture.ids.a);
			await page.locator("#connect button").click();
			await expect(page.locator("#workspace")).toBeVisible();
			await page.locator("#pipelineForm button").click();
			await expect(page.locator("#ruleStage option")).toHaveCount(7);
			const nav = async (name: string) => {
				await page.locator("#nav button").filter({ hasText: name }).click();
				await expect(page.locator("#heading")).toHaveText(name);
			};
			await nav(language === "ar" ? "جهات الاتصال" : "Contacts");
			await page.locator("#new").click();
			await page.locator("#field-display_name").fill("UI Synthetic Contact");
			await page.locator("#field-phone").fill("+201000000077");
			await page.locator("#save").click();
			await expect(page.locator("#content")).toContainText(
				"UI Synthetic Contact",
			);
			const contacts = (
				await (await request.get("/v1/contacts", { headers })).json()
			).data as { id: string; display_name: string }[];
			const contact = contacts.find(
				(c) => c.display_name === "UI Synthetic Contact",
			);
			assert.ok(contact);
			await nav(language === "ar" ? "الاستفسارات" : "Leads");
			await expect(page.locator("#content")).toContainText(
				language === "ar" ? "لا توجد سجلات" : "No accessible records",
			);
			await page.locator("#new").click();
			await page.locator("#field-title").fill("UI inquiry");
			await page.locator("#field-contact_id").selectOption(contact.id);
			await page
				.locator("#field-source_evidence")
				.fill("Synthetic browser intake");
			await page.locator("#save").click();
			await expect(page.locator("#content")).toContainText("UI inquiry");
			const leads = (await (await request.get("/v1/leads", { headers })).json())
				.data as { id: string }[];
			const pipelines = (
				await (await request.get("/v1/pipelines", { headers })).json()
			).data as {
				id: string;
				name: string;
				stages: { id: string; name: string }[];
			}[];
			const pipeline = pipelines.find((p) => p.name === "Synthetic reference");
			assert.ok(pipeline);
			await nav(language === "ar" ? "الصفقات والمراحل" : "Deals / pipeline");
			await page.locator("#new").click();
			await page.locator("#field-title").fill("UI opportunity");
			await page.locator("#field-contact_id").selectOption(contact.id);
			await page.locator("#field-lead_id").selectOption(leads[0].id);
			await page.locator("#field-pipeline_id").selectOption(pipeline.id);
			await page.locator("#field-stage_id").selectOption(pipeline.stages[0].id);
			await page.locator("#save").click();
			await expect(page.locator("#content")).toContainText("UI opportunity");
			await page
				.locator("#content tr")
				.filter({ hasText: "UI opportunity" })
				.getByRole("button")
				.click();
			await expect(page.locator("#detail form")).toBeVisible();
			const deals = (await (await request.get("/v1/deals", { headers })).json())
				.data as { id: string; title: string }[];
			const deal = deals.find((d) => d.title === "UI opportunity");
			assert.ok(deal);
			// Another real API client moves the record while this browser retains its old version.
			const moved = await request.post(`/v1/deals/${deal.id}/transitions`, {
				headers: { ...headers, "Idempotency-Key": randomUUID() },
				data: {
					command_id: randomUUID(),
					expected_version: 0,
					to_stage_id: pipeline.stages[1].id,
					reason: "Concurrent browser test",
				},
			});
			expect(moved.status()).toBe(200);
			await page.locator("#detail form input").fill("Stale browser attempt");
			await page.locator("#detail form button").click();
			await expect(page.locator("#status")).toContainText("VERSION_CONFLICT");
			await page.locator("#refresh").click();
			await page
				.locator("#content tr")
				.filter({ hasText: "UI opportunity" })
				.getByRole("button")
				.click();
			await page
				.locator("#detail form select")
				.selectOption(pipeline.stages[2].id);
			await page.locator("#detail form input").fill("Won from browser");
			await page.locator("#detail form button").click();
			await expect(
				page.locator("#content tr").filter({ hasText: "UI opportunity" }),
			).toContainText("Won");
			await nav(language === "ar" ? "المتابعات" : "Follow-ups");
			await page.locator("#new").click();
			await page.locator("#field-title").fill("UI callback");
			await page.locator("#field-contact_id").selectOption(contact.id);
			await page.locator("#field-due_at").fill("2026-01-01T12:00");
			await page.locator("#save").click();
			await expect(page.locator("#content")).toContainText("UI callback");
			await page.locator("#due").selectOption("overdue");
			await expect(page.locator("#content")).toContainText("UI callback");
			await page
				.locator("#content tr")
				.filter({ hasText: "UI callback" })
				.getByRole("button")
				.click();
			await page
				.locator("#detail button")
				.filter({
					hasText: language === "ar" ? "إكمال المهمة" : "Complete task",
				})
				.click();
			await expect(page.locator("#content")).not.toContainText("UI callback");
			expect(
				await page.evaluate(
					() => document.documentElement.scrollWidth <= innerWidth,
				),
			).toBe(true);
			expect(errors).toEqual([]);
			await page.locator("#due").selectOption("");
			await expect(page.locator("#content")).toContainText("UI callback");
			await page.locator("#token").fill("");
			await page.screenshot({
				path: `test-results/m1-${language}-${width}.png`,
				fullPage: true,
			});
		});
	}
test("M1 UI displays loading, error, retry and permission-denied states", async ({
	page,
}) => {
	const admin = new pg.Client({
		connectionString: process.env.ADMIN_DATABASE_URL,
	});
	await admin.connect();
	const f = await seed(admin);
	await admin.end();
	await page.goto("/");
	await page.locator("#language").click();
	await page.locator("#token").fill("invalid");
	await page.locator("#tenant").fill(f.ids.a);
	await page.locator("#connect button").click();
	await expect(page.locator("#status")).toContainText("Permission denied");
	await page.locator("#token").fill(f.tokens.reader);
	await page.locator("#connect button").click();
	await expect(page.locator("#workspace")).toBeVisible();
	await page.locator("#nav button").filter({ hasText: "Contacts" }).click();
	await page.locator("#new").click();
	await page.locator("#field-display_name").fill("Denied UI create");
	await page.locator("#field-owner_id").selectOption(f.ids.manager);
	await page.locator("#save").click();
	await expect(page.locator("#status")).toContainText("Permission denied");
	await page.route("**/v1/contacts?**", async (route) => {
		await new Promise((r) => setTimeout(r, 250));
		await route.continue();
	});
	await page.locator("#nav button").filter({ hasText: "Contacts" }).click();
	await expect(page.locator("#status")).toContainText("Loading");
	await expect(page.locator("#content table")).toBeVisible();
	await page.unroute("**/v1/contacts?**");
	await page.route("**/v1/contacts?**", (route) => route.abort());
	await page.locator("#nav button").filter({ hasText: "Contacts" }).click();
	await expect(page.locator("#status")).toContainText("Connection failed");
	await expect(page.locator("#content button")).toHaveText("Retry");
	await page.unroute("**/v1/contacts?**");
	await page.locator("#content button").click();
	await expect(page.locator("#content table")).toBeVisible();
});
