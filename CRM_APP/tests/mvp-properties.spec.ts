import { createHash, randomBytes, randomUUID } from "node:crypto";
import { type APIRequestContext, expect, type Page, test } from "@playwright/test";
import pg from "pg";
import { seed } from "../scripts/seed.js";
import { pickLabel } from "./select-helper.js";

process.loadEnvFile(".env");

// P1b B2 UI: Settings > Properties (schema API). Synthetic fixture per test; credentials stay in memory.
async function fixture() {
	const admin = new pg.Client({ connectionString: process.env.ADMIN_DATABASE_URL });
	await admin.connect();
	const f = await seed(admin);
	// a rep (read-only on the schema) in tenant A; the seed has no rep
	const repToken = randomBytes(32).toString("hex");
	const rep = randomUUID();
	await admin.query("INSERT INTO crm.principal VALUES($1,$2)", [rep, "UI rep"]);
	await admin.query(
		"INSERT INTO crm.session(token_hash,principal_id,expires_at,mfa_verified) VALUES($1,$2,now()+interval '1 day',true)",
		[createHash("sha256").update(repToken).digest("hex"), rep],
	);
	await admin.query("INSERT INTO crm.membership(tenant_id,id,principal_id,role) VALUES($1,$2,$3,'rep')", [f.ids.a, randomUUID(), rep]);
	await admin.end();
	return { ...f, tokens: { ...f.tokens, rep: repToken } };
}
type Fixture = Awaited<ReturnType<typeof fixture>>;

const auth = (f: Fixture, who: "manager" | "rep" = "manager") => ({
	Authorization: `Bearer ${f.tokens[who]}`,
	"X-Tenant-ID": f.ids.a,
});

async function apiCreate(request: APIRequestContext, f: Fixture, key: string, en: string, ar: string) {
	const command_id = randomUUID();
	const r = await request.post("/v1/schema/contact/properties", {
		headers: { ...auth(f), "Idempotency-Key": command_id },
		data: { command_id, key, type: "text", label: { en, ar } },
	});
	expect(r.status()).toBe(201);
	return (await r.json()).data.property as { version: number };
}

async function open(page: Page, f: Fixture, language: "en" | "ar", who: "manager" | "rep" = "manager", width = 1440) {
	await page.setViewportSize({ width, height: 900 });
	await page.addInitScript((l) => localStorage.setItem("sy.locale", l), language);
	await page.goto("/app/settings/properties");
	await page.locator("input[name=token]").fill(f.tokens[who]);
	await page.locator("input[name=tenant]").fill(f.ids.a);
	await page.getByTestId("connect-submit").click();
	await expect(page.getByTestId("properties-page")).toBeVisible();
	await expect(page.getByTestId("property-row").first()).toBeVisible();
	await expect(page.locator("html")).toHaveAttribute("dir", language === "ar" ? "rtl" : "ltr");
}

const row = (page: Page, key: string) => page.locator(`[data-testid=property-row][data-key=${key}]`);
const keys = (page: Page) => page.getByTestId("property-row").evaluateAll((els) => els.map((e) => e.getAttribute("data-key")));
const T = {
	en: { single: "Single select", reserved: /reserved/i, conflict: /changed elsewhere/i },
	ar: { single: "اختيار واحد", reserved: /محجوز/, conflict: /من مكان آخر/ },
} as const;

for (const language of ["en", "ar"] as const) {
	test.describe(`properties ${language}`, () => {
		test("manager creates a text and a single-select property, edits, reorders, archives and finds it under show archived", async ({ page }) => {
			const f = await fixture();
			await open(page, f, language);
			await expect(page.getByTestId("property-new")).toBeVisible();
			// counts use the locale digits and the language's plural form (AR: 3-10 plural noun)
			await expect(page.getByTestId("property-group").first().locator(".sy-props__count")).toHaveText(language === "ar" ? "٥ خصائص" : "5 properties");

			// text property: one label, key derived from Latin content
			await page.getByTestId("property-new").click();
			const dialog = page.getByTestId("property-dialog");
			await expect(dialog).toBeVisible();
			await dialog.getByTestId("label").fill("Lead tier");
			await expect(dialog.getByTestId("key")).toHaveValue("lead_tier");
			await dialog.getByTestId("property-submit").click();
			await expect(dialog).toHaveCount(0);
			await expect(row(page, "lead_tier")).toBeVisible();
			await expect(row(page, "lead_tier").getByTestId("property-label")).toContainText("Lead tier");

			// single-select with two single-label options, colour and reorder buttons
			await page.getByTestId("property-new").click();
			await dialog.getByTestId("label").fill("Plan");
			await pickLabel(dialog.getByTestId("type"), T[language].single);
			await expect(dialog.getByTestId("options-editor")).toBeVisible();
			await dialog.getByTestId("option-add").click();
			await dialog.getByTestId("option-add").click();
			const rows = dialog.getByTestId("option-row");
			await expect(rows).toHaveCount(2);
			await expect(rows.nth(0).locator(".sy-props__optno")).toHaveText(language === "ar" ? "الخيار ١" : "Option 1");
			await rows.nth(0).getByTestId("option-label").fill("Basic");
			await rows.nth(1).getByTestId("option-label").fill("Pro");
			await rows.nth(1).getByTestId("color-blue").locator("input").check({ force: true });
			await dialog.getByTestId("option-1-up").click();
			await expect(rows.nth(0).getByTestId("option-label")).toHaveValue("Pro");
			await dialog.getByTestId("property-submit").click();
			await expect(dialog).toHaveCount(0);
			await expect(row(page, "plan")).toBeVisible();
			await expect(row(page, "plan").getByTestId("property-type")).toHaveText(T[language].single);
			await expect(page.getByTestId("property-group").first().locator(".sy-props__count")).toHaveText(language === "ar" ? "٧ خصائص" : "7 properties");
			// action slots are reserved: Edit / up / down line up between a system row, a text row and a select row
			const x = async (r: string, id: string) => Math.round((await row(page, r).getByTestId(id).boundingBox())?.x ?? -1);
			for (const id of ["edit", "up", "down"]) {
				const sel = id === "edit" ? "property-edit" : `prop-%K-${id}`;
				const at = (r: string) => x(r, sel.replace("%K", r));
				expect(await at("source")).toBe(await at("lead_tier"));
				expect(await at("source")).toBe(await at("plan"));
			}

			// the server stored the options in the chosen order
			const got = await (await page.request.get("/v1/schema/contact/properties/plan", { headers: auth(f) })).json();
			expect(got.data.property.options.map((o: { value: string }) => o.value)).toEqual(["pro", "basic"]);
			expect(got.data.property.options[0].color).toBe("blue");
			expect(got.data.property.options[0].label).toEqual({ en: "Pro", ar: "احترافية" });

			// edit the label
			await row(page, "lead_tier").getByTestId("property-edit").click();
			await expect(dialog.getByTestId("key")).toBeDisabled();
			await expect(dialog.getByTestId("type")).toBeDisabled();
			await dialog.getByTestId("label").fill("Customer tier");
			await dialog.getByTestId("property-submit").click();
			await expect(dialog).toHaveCount(0);
			await expect(row(page, "lead_tier").getByTestId("property-label")).toContainText("Customer tier");

			// reorder: lead_tier is before plan; move plan up
			const before = (await keys(page)).filter((k) => k === "lead_tier" || k === "plan");
			expect(before).toEqual(["lead_tier", "plan"]);
			await page.getByTestId("prop-plan-up").click();
			await expect.poll(async () => (await keys(page)).filter((k) => k === "lead_tier" || k === "plan")).toEqual(["plan", "lead_tier"]);
			await expect(page.getByTestId("prop-plan-up")).toBeFocused();

			// options dialog: add and reorder on an existing property
			await row(page, "plan").getByTestId("property-options").click();
			const od = page.getByTestId("options-dialog");
			await od.getByTestId("add-option-label").fill("Team");
			await od.getByTestId("add-option-submit").click();
			await expect(od.getByTestId("manage-option")).toHaveCount(3);
			await od.getByTestId("options-done").click();

			// archive with confirm, then find it under "show archived"
			await row(page, "lead_tier").getByTestId("property-archive").click();
			await page.getByTestId("archive-dialog").getByTestId("dialog-confirm").click();
			await expect(row(page, "lead_tier")).toHaveCount(0);
			await page.getByTestId("show-archived").locator("input").check();
			await expect(row(page, "lead_tier")).toBeVisible();
			await expect(row(page, "lead_tier").getByTestId("property-archive")).toHaveCount(0);

			// search
			await page.getByTestId("props-search").fill("plan");
			await expect(page.getByTestId("property-row")).toHaveCount(1);
		});

		test("server validation errors appear next to the right field", async ({ page }) => {
			const f = await fixture();
			await open(page, f, language);
			await page.getByTestId("property-new").click();
			const dialog = page.getByTestId("property-dialog");
			await dialog.getByTestId("label").fill("Identifier");
			await dialog.getByTestId("key").fill("id"); // valid shape, reserved by the server
			await dialog.getByTestId("property-submit").click();
			const keyField = dialog.locator(".sy-field:has([data-testid=key])");
			await expect(keyField.locator(".sy-field__error")).toContainText(T[language].reserved);
			await expect(dialog.getByTestId("property-error")).toBeVisible();
			await expect(dialog).toBeVisible();
			// live client validation of the key regex
			await dialog.getByTestId("key").fill("Bad Key");
			await expect(keyField.locator(".sy-field__error")).toBeVisible();
			await expect(dialog.getByTestId("property-error")).toHaveCount(0);
		});

		test("rep sees a read-only page (no create or manage controls)", async ({ page }) => {
			const f = await fixture();
			await apiCreate(page.request, f, "region", "Region", "المنطقة");
			await open(page, f, language, "rep");
			await expect(page.getByTestId("nav-properties")).toBeVisible();
			await expect(row(page, "region")).toBeVisible();
			await expect(page.getByTestId("props-readonly-note")).toBeVisible();
			for (const id of ["property-new", "groups-manage", "property-edit", "property-archive", "prop-region-up"])
				await expect(page.getByTestId(id)).toHaveCount(0);
			// the server agrees
			const r = await page.request.post("/v1/schema/contact/properties", {
				headers: { ...auth(f, "rep"), "Idempotency-Key": randomUUID() },
				data: { command_id: randomUUID(), key: "x", type: "text", label: "X" },
			});
			expect(r.status()).toBe(403);
		});

		test("a system property shows its immutable fields read-only", async ({ page }) => {
			const f = await fixture();
			await open(page, f, language);
			await expect(row(page, "display_name").getByText(language === "ar" ? "نظام" : "System", { exact: true })).toBeVisible();
			await expect(row(page, "display_name").getByTestId("property-archive")).toHaveCount(0);
			await row(page, "display_name").getByTestId("property-edit").click();
			const dialog = page.getByTestId("property-dialog");
			await expect(dialog.getByTestId("system-note")).toBeVisible();
			await expect(dialog.getByTestId("key")).toBeDisabled();
			await expect(dialog.getByTestId("key")).toHaveValue("display_name");
			await expect(dialog.getByTestId("type")).toBeDisabled();
			await expect(dialog.getByTestId("flag-required").locator("input")).toBeDisabled();
			await expect(dialog.getByTestId("flag-sensitive").locator("input")).toBeDisabled();
			await expect(dialog.getByTestId("label")).toBeEnabled();
			await expect(dialog.getByTestId("group")).toBeEnabled();
		});

		test("a stale edit shows the friendly changed-elsewhere message", async ({ page }) => {
			const f = await fixture();
			const p = await apiCreate(page.request, f, "region", "Region", "المنطقة");
			await open(page, f, language);
			await row(page, "region").getByTestId("property-edit").click();
			const dialog = page.getByTestId("property-dialog");
			// someone else edits the property first (version bumps)
			const command_id = randomUUID();
			const r = await page.request.patch("/v1/schema/contact/properties/region", {
				headers: { ...auth(f), "Idempotency-Key": command_id },
				data: { command_id, expected_version: p.version, label: "Region 2" },
			});
			expect(r.status()).toBe(200);
			await dialog.getByTestId("label").fill("Region mine");
			await dialog.getByTestId("property-submit").click();
			await expect(dialog.getByTestId("property-conflict")).toContainText(T[language].conflict);
			await dialog.getByTestId("property-reload").click();
			await expect(dialog).toHaveCount(0);
			await expect(row(page, "region").getByTestId("property-label")).toContainText("Region 2");
		});
	});
}

test("AR geometry: the page starts from the right", async ({ page }) => {
	const f = await fixture();
	await open(page, f, "ar");
	const m = await page.evaluate(() => {
		const vw = document.documentElement.clientWidth;
		const box = (sel: string) => {
			const el = document.querySelector(sel) as HTMLElement;
			const r = document.createRange();
			r.selectNodeContents(el);
			const b = r.getBoundingClientRect();
			return { left: Math.round(b.left), right: Math.round(b.right), vw };
		};
		const page = (document.querySelector("[data-testid=properties-page]") as HTMLElement).getBoundingClientRect();
		return { title: box("[data-testid=props-title]"), name: box("[data-testid=property-label] .sy-bidi-text"), page: { left: Math.round(page.left), right: Math.round(page.right) }, vw };
	});
	expect(m.title.right).toBeGreaterThan(m.page.right - 12);
	expect(m.title.left).toBeGreaterThan(m.vw / 2);
	expect(m.name.right).toBeGreaterThan(m.vw / 2);
	// first tab sits at the right edge (tablist starts from the inline start)
	const tab = await page.getByRole("tab").first().boundingBox();
	const last = await page.getByRole("tab").last().boundingBox();
	expect((tab?.x ?? 0) > (last?.x ?? 0)).toBe(true);
});

test("375: stacked layout with a sheet dialog and no horizontal overflow", async ({ page }) => {
	const f = await fixture();
	await open(page, f, "ar", "manager", 375);
	await page.getByTestId("property-new").click();
	const dialog = page.getByTestId("property-dialog");
	await expect(dialog).toBeVisible();
	const box = await dialog.boundingBox();
	expect(Math.round(box?.width ?? 0)).toBeGreaterThanOrEqual(373);
	await page.keyboard.press("Escape");
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
