import { createHash, randomBytes, randomUUID } from "node:crypto";
import { type APIRequestContext, expect, type Page, test } from "@playwright/test";
import pg from "pg";
import { seed } from "../scripts/seed.js";
import { pickLabel } from "./select-helper.js";

process.loadEnvFile(".env");

// P1b B3 UI: custom field values on records (Leads preview and create dialog). Synthetic fixture per test; credentials stay in memory.
async function fixture() {
	const admin = new pg.Client({ connectionString: process.env.ADMIN_DATABASE_URL });
	await admin.connect();
	const f = await seed(admin);
	const repToken = randomBytes(32).toString("hex");
	const rep = randomUUID();
	await admin.query("INSERT INTO crm.principal VALUES($1,$2)", [rep, "UI rep"]);
	await admin.query(
		"INSERT INTO crm.session(token_hash,principal_id,expires_at,mfa_verified) VALUES($1,$2,now()+interval '1 day',true)",
		[createHash("sha256").update(repToken).digest("hex"), rep],
	);
	await admin.query("INSERT INTO crm.membership(tenant_id,id,principal_id,role) VALUES($1,$2,$3,'rep')", [f.ids.a, randomUUID(), rep]);
	await admin.end();
	return { ...f, repId: rep, tokens: { ...f.tokens, rep: repToken } };
}
type Fixture = Awaited<ReturnType<typeof fixture>>;
type Who = "manager" | "rep";

const auth = (f: Fixture, who: Who = "manager") => ({ Authorization: `Bearer ${f.tokens[who]}`, "X-Tenant-ID": f.ids.a });

async function createProp(request: APIRequestContext, f: Fixture, body: Record<string, unknown>) {
	const command_id = randomUUID();
	const r = await request.post("/v1/schema/lead/properties", { headers: { ...auth(f), "Idempotency-Key": command_id }, data: { command_id, ...body } });
	expect(r.status()).toBe(201);
	return (await r.json()).data.property as { key: string; version: number };
}
async function patchProp(request: APIRequestContext, f: Fixture, key: string, version: number, body: Record<string, unknown>) {
	const command_id = randomUUID();
	const r = await request.patch(`/v1/schema/lead/properties/${key}`, {
		headers: { ...auth(f), "Idempotency-Key": command_id },
		data: { command_id, expected_version: version, ...body },
	});
	expect(r.status()).toBe(200);
}
async function makeLead(request: APIRequestContext, f: Fixture, title: string, extra: Record<string, unknown> = {}) {
	const command_id = randomUUID();
	const r = await request.post("/v1/leads", {
		headers: { ...auth(f), "Idempotency-Key": command_id },
		data: { command_id, title, source_evidence: "synthetic", contact: { display_name: `Contact ${title}`, email: "ui-fixture@example.test" }, ...extra },
	});
	expect(r.status()).toBe(201);
	return (await r.json()).data as { id: string };
}
async function leadProps(request: APIRequestContext, f: Fixture, id: string) {
	const r = await request.get(`/v1/leads/${id}`, { headers: auth(f) });
	expect(r.status()).toBe(200);
	return (await r.json()).data.properties as Record<string, unknown>;
}

async function start(page: Page, f: Fixture, language: "en" | "ar", path: string, who: Who = "manager", width = 1440) {
	await page.setViewportSize({ width, height: 900 });
	await page.addInitScript((l) => localStorage.setItem("sy.locale", l), language);
	await page.goto(path);
	await page.locator("input[name=token]").fill(f.tokens[who]);
	await page.locator("input[name=tenant]").fill(f.ids.a);
	await page.getByTestId("connect-submit").click();
	await expect(page.getByTestId("actor")).toBeVisible();
	await expect(page.locator("html")).toHaveAttribute("dir", language === "ar" ? "rtl" : "ltr");
}

const panel = (page: Page) => page.getByTestId("lead-detail");
const T = {
	en: { note: "Account note", plan: "Plan", seats: "Seats", region: "Region", badge: "Badge", pro: "Professional", basic: "Basic" },
	ar: { note: "ملاحظة الحساب", plan: "الباقة", seats: "عدد المقاعد", region: "المنطقة", badge: "الشارة", pro: "احترافية", basic: "أساسية" },
} as const;

for (const language of ["en", "ar"] as const) {
	const L = T[language];
	test.describe(`record custom fields ${language}`, () => {
		test("manager edits text, single-select and number values on a lead preview and sees them formatted", async ({ page, request }) => {
			const f = await fixture();
			await createProp(request, f, { key: "account_note", type: "text", label: { en: T.en.note, ar: T.ar.note } });
			await createProp(request, f, {
				key: "plan",
				type: "single_select",
				label: { en: T.en.plan, ar: T.ar.plan },
				options: [
					{ value: "basic", label: { en: T.en.basic, ar: T.ar.basic }, color: "gray" },
					{ value: "pro", label: { en: T.en.pro, ar: T.ar.pro }, color: "green" },
				],
			});
			await createProp(request, f, { key: "seats", type: "number", label: { en: T.en.seats, ar: T.ar.seats } });
			const lead = await makeLead(request, f, "Props lead");
			await start(page, f, language, `/app/leads?preview=${lead.id}`);
			await expect(panel(page)).toBeVisible();
			// empty values show "Not set"; the section is grouped
			await expect(page.getByTestId("cf-read")).toBeVisible();
			await expect(page.getByTestId("cf-group")).toHaveCount(1);
			await expect(page.getByTestId("cf-value-seats")).toContainText(language === "ar" ? "غير محدد" : "Not set");

			await page.getByTestId("record-edit").click();
			const edit = page.getByTestId("cf-edit");
			await expect(edit).toBeVisible();
			await edit.getByTestId("cf-input-account_note").fill("Renewal due");
			await pickLabel(edit.getByRole("combobox", { name: L.plan }), L.pro);
			await edit.getByTestId("cf-input-seats").fill(language === "ar" ? "١٢٣٤" : "1234");
			await page.getByTestId("lead-save").click();

			// read view: formatted per type (AR digits in AR), option label + colour chip
			await expect(page.getByTestId("record-editor")).toHaveCount(0);
			await expect(page.getByTestId("cf-value-account_note")).toHaveText("Renewal due");
			await expect(page.getByTestId("cf-value-plan").getByTestId("cf-chip")).toHaveText(L.pro);
			await expect(page.getByTestId("cf-value-plan").getByTestId("cf-chip")).toHaveAttribute("data-color", "green");
			await expect(page.getByTestId("cf-value-seats")).toHaveText(language === "ar" ? /^[٠-٩٬٫]+$/ : "1,234");
			expect(await leadProps(request, f, lead.id)).toMatchObject({ account_note: "Renewal due", plan: "pro", seats: 1234 });

			// clearing a value sends null and the read view falls back to "Not set"
			await page.getByTestId("record-edit").click();
			await page.getByTestId("cf-edit").getByTestId("cf-input-account_note").fill("");
			await page.getByTestId("lead-save").click();
			await expect(page.getByTestId("cf-value-account_note")).toContainText(language === "ar" ? "غير محدد" : "Not set");
			expect((await leadProps(request, f, lead.id)).account_note ?? null).toBeNull();
		});

		test("a required custom field blocks creating a lead until it is filled", async ({ page, request }) => {
			const f = await fixture();
			await createProp(request, f, { key: "region", type: "text", required: true, label: { en: T.en.region, ar: T.ar.region } });
			await start(page, f, language, "/app/leads");
			await page.getByTestId("new-lead").click();
			const dialog = page.getByTestId("new-lead-dialog");
			await expect(dialog.getByTestId("cf-edit")).toBeVisible();
			await dialog.locator("[name=title]").fill("Needs region");
			await dialog.locator("[name=contactName]").fill("Ada Lovelace");
			await dialog.locator("[name=email]").fill("ada@example.test");
			await dialog.locator("[name=evidence]").fill("synthetic");
			await page.getByTestId("new-lead-submit").click();
			await expect(dialog.getByTestId("cf-field-region").locator(".sy-field__error")).toBeVisible();
			await expect(dialog).toBeVisible();
			await dialog.getByTestId("cf-input-region").fill("Cairo");
			await page.getByTestId("new-lead-submit").click();
			await expect(dialog).toHaveCount(0);
			const list = await request.get("/v1/leads", { headers: auth(f) });
			const created = ((await list.json()).data as Array<{ id: string; title: string }>).find((l) => l.title === "Needs region");
			expect(created).toBeTruthy();
			expect(await leadProps(request, f, (created as { id: string }).id)).toMatchObject({ region: "Cairo" });
		});

		test("a server validation error is shown on its own field and the form stays open", async ({ page, request }) => {
			const f = await fixture();
			const note = await createProp(request, f, { key: "account_note", type: "text", label: { en: T.en.note, ar: T.ar.note }, validation: { max_length: 10 } });
			const lead = await makeLead(request, f, "Strict lead");
			await start(page, f, language, `/app/leads?preview=${lead.id}`);
			await page.getByTestId("record-edit").click();
			await expect(page.getByTestId("cf-edit")).toBeVisible();
			// the rule tightens after the form loaded the schema: the client accepts the value, the server refuses it
			await patchProp(request, f, "account_note", note.version, { validation: { max_length: 3 } });
			await page.getByTestId("cf-edit").getByTestId("cf-input-account_note").fill("abcdefgh");
			await page.getByTestId("lead-save").click();
			await expect(page.getByTestId("cf-field-account_note").locator(".sy-field__error")).toBeVisible();
			await expect(page.getByTestId("cf-banner")).toBeVisible();
			await expect(page.getByTestId("record-editor")).toBeVisible();
			expect((await leadProps(request, f, lead.id)).account_note ?? null).toBeNull();
			// editing the field clears its server message
			await page.getByTestId("cf-edit").getByTestId("cf-input-account_note").fill("abc");
			await expect(page.getByTestId("cf-field-account_note").locator(".sy-field__error")).toHaveCount(0);
		});

		test("a rep sees a read-only property's value but gets no input for it", async ({ page, request }) => {
			const f = await fixture();
			const badge = await createProp(request, f, { key: "badge", type: "text", label: { en: T.en.badge, ar: T.ar.badge } });
			const lead = await makeLead(request, f, "Rep lead", { owner_id: f.repId, properties: { badge: "Gold" } });
			await patchProp(request, f, "badge", badge.version, { read_only: true });
			await start(page, f, language, `/app/leads?preview=${lead.id}`, "rep");
			await expect(panel(page)).toBeVisible();
			await expect(page.getByTestId("cf-value-badge")).toHaveText("Gold");
			await page.getByTestId("record-edit").click();
			await expect(page.getByTestId("cf-readonly-badge")).toHaveText("Gold");
			await expect(page.getByTestId("cf-input-badge")).toHaveCount(0);
		});
	});
}

test("custom fields in the preview at 375px dark theme: no horizontal overflow", async ({ page, request }) => {
	const f = await fixture();
	await createProp(request, f, { key: "account_note", type: "text", label: { en: T.en.note, ar: T.ar.note } });
	const lead = await makeLead(request, f, "Narrow lead", { properties: { account_note: "x".repeat(60) } });
	await page.addInitScript(() => localStorage.setItem("sy.theme", "dark"));
	await start(page, f, "ar", `/app/leads?preview=${lead.id}`, "manager", 375);
	await expect(page.getByTestId("cf-read")).toBeVisible();
	const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
	expect(overflow).toBeLessThanOrEqual(0);
});
