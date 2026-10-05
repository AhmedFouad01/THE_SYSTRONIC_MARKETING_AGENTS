import { randomUUID } from "node:crypto";
import { type APIRequestContext, expect, type Page, test } from "@playwright/test";
import pg from "pg";
import { seed } from "../scripts/seed.js";
import { pickLabel, pickValue } from "./select-helper.js";

process.loadEnvFile(".env");

// Seeds a synthetic fixture plus one extra tenant-A member (role rep) who can own leads.
// Credentials stay in memory; never logged or asserted by value.
async function fixture() {
	const admin = new pg.Client({ connectionString: process.env.ADMIN_DATABASE_URL });
	await admin.connect();
	const f = await seed(admin);
	const rep = randomUUID();
	await admin.query("INSERT INTO crm.principal VALUES($1,$2)", [rep, "Synthetic rep"]);
	await admin.query(
		"INSERT INTO crm.membership(tenant_id,id,principal_id,role) VALUES($1,$2,$3,'rep')",
		[f.ids.a, randomUUID(), rep],
	);
	await admin.end();
	return { ...f, rep };
}
type Fixture = Awaited<ReturnType<typeof fixture>>;

const headers = (f: Fixture, key = randomUUID()) => ({
	Authorization: `Bearer ${f.tokens.manager}`,
	"X-Tenant-ID": f.ids.a,
	"Idempotency-Key": key,
});

async function makeLead(request: APIRequestContext, f: Fixture, title: string, owner?: string) {
	const command_id = randomUUID();
	const res = await request.post("/v1/leads", {
		headers: headers(f, command_id),
		data: {
			command_id,
			title,
			source_evidence: "synthetic",
			...(owner ? { owner_id: owner } : {}),
			contact: { display_name: `Contact ${title}` },
		},
	});
	expect(res.status()).toBe(201);
	return (await res.json()).data as { id: string; version: number };
}

async function connect(page: Page, token: string, tenant: string) {
	await page.locator("input[name=token]").fill(token);
	await page.locator("input[name=tenant]").fill(tenant);
	await page.getByTestId("connect-submit").click();
	await expect(page.getByTestId("actor")).toBeVisible();
}

const rows = (page: Page) => page.getByTestId("grid-row");
const noPageOverflow = (page: Page) =>
	page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

for (const width of [360, 1280])
	for (const language of ["ar", "en"] as const)
		test(`leads ${language} ${width}px: list, search, detail, dialog focus, no page overflow`, async ({
			page,
			request,
		}) => {
			const f = await fixture();
			await makeLead(request, f, "Alpha lead");
			await makeLead(request, f, "Bravo lead");
			const errors: string[] = [];
			page.on("pageerror", (e) => errors.push(e.message));
			await page.addInitScript((l) => localStorage.setItem("sy.locale", l), language);
			await page.setViewportSize({ width, height: 800 });
			await page.goto("/app/leads");
			await connect(page, f.tokens.manager, f.ids.a);
			await expect(page.getByTestId("leads-view")).toBeVisible();
			await expect(page.locator("html")).toHaveAttribute("dir", language === "ar" ? "rtl" : "ltr");
			await expect(rows(page)).toHaveCount(2);

			await page.getByTestId("grid-search").fill("bravo");
			await expect(rows(page)).toHaveCount(1);
			await page.getByTestId("grid-search").fill("");
			await expect(rows(page)).toHaveCount(2);

			await rows(page).filter({ hasText: "Alpha lead" }).click({ position: { x: 10, y: 10 } });
			await expect(page.getByTestId("lead-detail-title")).toHaveText("Alpha lead");
			expect(await noPageOverflow(page)).toBe(true);

			// Dialog: focus enters the first field and returns to the opener on Esc.
			const opener = page.getByTestId("new-lead");
			await opener.focus();
			await page.keyboard.press("Enter");
			await expect(page.getByRole("dialog")).toBeVisible();
			expect(await noPageOverflow(page)).toBe(true);
			await page.keyboard.press("Escape");
			await expect(page.getByRole("dialog")).toHaveCount(0);
			await expect(opener).toBeFocused();
			expect(errors).toEqual([]);
		});

test("leads en: sort aria-sort cycle, built-in views, bulk assign with partial failure", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const alpha = await makeLead(request, f, "Alpha lead", f.rep);
	await makeLead(request, f, "Bravo lead", f.rep);
	const charlie = await makeLead(request, f, "Charlie lead", f.rep);
	await makeLead(request, f, "Mine lead");
	await page.addInitScript(() => localStorage.setItem("sy.locale", "en"));
	await page.goto("/app/leads");
	await connect(page, f.tokens.manager, f.ids.a);
	await expect(rows(page)).toHaveCount(4);
	await expect(page.getByRole("button", { name: "Assign to me" })).toHaveCount(0);

	// sort: none -> ascending -> descending -> none, announced on the header cell
	const th = page.getByTestId("sort-lead").locator("xpath=ancestor::th");
	await expect(th).toHaveAttribute("aria-sort", "none");
	await page.getByTestId("sort-lead").click();
	await expect(th).toHaveAttribute("aria-sort", "ascending");
	await expect(rows(page).first()).toContainText("Alpha lead");
	await page.getByTestId("sort-lead").click();
	await expect(th).toHaveAttribute("aria-sort", "descending");
	await expect(rows(page).first()).toContainText("Mine lead");
	await page.getByTestId("sort-lead").click();
	await expect(th).toHaveAttribute("aria-sort", "none");

	// built-in views from the session actor
	await page.getByRole("tab", { name: "My leads" }).click();
	await expect(rows(page)).toHaveCount(1);
	await expect(rows(page).first()).toContainText("Mine lead");
	await page.getByRole("tab", { name: "Unassigned" }).click();
	await expect(rows(page)).toHaveCount(0);
	await page.getByRole("tab", { name: "All leads" }).click();
	await expect(rows(page)).toHaveCount(4);

	// bulk assign: Charlie's PATCH is forced to fail with a version conflict
	await page.route(`**/v1/leads/${charlie.id}`, (route) =>
		route.request().method() === "PATCH"
			? route.fulfill({
					status: 409,
					contentType: "application/json",
					body: JSON.stringify({ code: "VERSION_CONFLICT", safe_message: "stale", request_id: "r", retryable: false }),
				})
			: route.continue(),
	);
	for (const name of ["Alpha lead", "Bravo lead", "Charlie lead"])
		await page.getByRole("checkbox", { name: `Select row ${name}` }).check();
	await expect(page.getByTestId("grid-batch")).toContainText("3 selected");
	await page.getByTestId("bulk-assign").click();
	const alert = page.locator('[role="alert"] [data-testid="toast"]');
	await expect(alert).toContainText("2 assigned to you, 1 failed");
	const owner = (title: string) => rows(page).filter({ hasText: title });
	await expect(owner("Alpha lead")).toContainText("Synthetic manager");
	await expect(owner("Bravo lead")).toContainText("Synthetic manager");
	await expect(owner("Charlie lead")).toContainText("Synthetic rep");
	await page.getByRole("tab", { name: "My leads" }).click();
	await expect(rows(page)).toHaveCount(3);

	// stale detail: the server really bumped nothing for Alpha beyond our PATCH
	const res = await request.get(`/v1/leads/${alpha.id}`, { headers: headers(f) });
	expect((await res.json()).data.version).toBe(alpha.version + 1);
});

test("leads en: grid keyboard (arrows, Enter opens detail, Space selects) and filters/columns/density", async ({
	page,
	request,
}) => {
	const f = await fixture();
	await makeLead(request, f, "Alpha lead", f.rep);
	await makeLead(request, f, "Bravo lead");
	await page.addInitScript(() => localStorage.setItem("sy.locale", "en"));
	await page.goto("/app/leads");
	await connect(page, f.tokens.manager, f.ids.a);
	await expect(rows(page)).toHaveCount(2);

	await rows(page).first().focus();
	await page.keyboard.press("ArrowDown");
	await expect(rows(page).nth(1)).toBeFocused();
	await page.keyboard.press("Enter");
	await expect(rows(page).nth(1)).toHaveAttribute("aria-current", "true");
	await expect(page.getByTestId("lead-detail")).toBeVisible();
	await page.keyboard.press("Space");
	await expect(rows(page).nth(1)).toHaveAttribute("data-selected", "true");
	await expect(page.getByTestId("grid-batch")).toContainText("1 selected");
	// detail selection and bulk selection stay independent
	await expect(rows(page).first()).not.toHaveAttribute("data-selected", "true");

	// owner filter (by owner name), column visibility, density
	await page.getByTestId("grid-filters").click();
	await pickLabel(page.getByTestId("data-grid").getByRole("combobox", { name: "Owner" }), "Synthetic rep");
	await expect(rows(page)).toHaveCount(1);
	await expect(rows(page).first()).toContainText("Alpha lead");
	await page.getByRole("button", { name: "Clear filters" }).first().click();
	await expect(rows(page)).toHaveCount(2);
	await page.getByTestId("grid-density").click();
	await expect(page.getByTestId("grid-table")).toHaveAttribute("data-density", "compact");
	await page.getByTestId("grid-columns").click();
	await page.getByRole("checkbox", { name: "Source" }).uncheck();
	await expect(page.getByRole("columnheader", { name: "Source" })).toHaveCount(0);
});

test("leads en: new lead dialog - focus trap, validation, server error mapping, create selects row", async ({
	page,
	request,
}) => {
	const f = await fixture();
	await makeLead(request, f, "Existing lead");
	await page.addInitScript(() => localStorage.setItem("sy.locale", "en"));
	await page.goto("/app/leads");
	await connect(page, f.tokens.manager, f.ids.a);
	await expect(rows(page)).toHaveCount(1);

	const opener = page.getByTestId("new-lead");
	await opener.focus();
	await page.keyboard.press("Enter");
	const dialog = page.getByRole("dialog");
	await expect(dialog).toBeVisible();
	await expect(dialog.getByLabel("Title")).toBeFocused();
	const inside = () => page.evaluate(() => document.activeElement?.closest('[role="dialog"]') !== null);
	for (let i = 0; i < 14; i++) {
		await page.keyboard.press("Tab");
		expect(await inside()).toBe(true);
	}
	for (let i = 0; i < 14; i++) {
		await page.keyboard.press("Shift+Tab");
		expect(await inside()).toBe(true);
	}
	await page.keyboard.press("Escape");
	await expect(dialog).toHaveCount(0);
	await expect(opener).toBeFocused();

	// client validation
	await opener.click();
	await page.getByTestId("new-lead-submit").click();
	await expect(dialog.getByText("This field is required.")).toHaveCount(3);
	await dialog.getByLabel("Title").fill("Website enquiry");
	await dialog.getByLabel("Contact name").fill("Ada Lovelace");
	await dialog.getByLabel("Where did this lead come from?").fill("Called the office");
	await dialog.getByLabel("Phone").fill("0100");
	await page.getByTestId("new-lead-submit").click();
	await expect(dialog.getByText(/international format/)).toBeVisible();
	await dialog.getByLabel("Phone").fill("+201001234567");

	// server rejection is mapped to a form-level alert; input is kept
	await page.route("**/v1/leads", (route) =>
		route.request().method() === "POST"
			? route.fulfill({
					status: 422,
					contentType: "application/json",
					body: JSON.stringify({ code: "VALIDATION_FAILED", safe_message: "bad", request_id: "r", retryable: false }),
				})
			: route.continue(),
	);
	await page.getByTestId("new-lead-submit").click();
	await expect(page.getByTestId("new-lead-error")).toContainText("rejected some values");
	await expect(dialog.getByLabel("Title")).toHaveValue("Website enquiry");
	await page.unroute("**/v1/leads");

	// success: dialog closes, toast, row appears and is the active detail row
	await page.getByTestId("new-lead-submit").click();
	await expect(dialog).toHaveCount(0);
	await expect(page.getByTestId("toast").filter({ hasText: "Lead created." })).toBeVisible();
	const created = rows(page).filter({ hasText: "Website enquiry" });
	await expect(created).toHaveCount(1);
	await expect(created).toHaveAttribute("aria-current", "true");
	await expect(page.getByTestId("lead-detail-title")).toHaveText("Website enquiry");
	await expect(page.getByTestId("lead-detail")).toContainText("Ada Lovelace");
});

test("leads en: detail edit, simulated version conflict then reload and retry", async ({ page, request }) => {
	const f = await fixture();
	const lead = await makeLead(request, f, "Original title");
	await page.addInitScript(() => localStorage.setItem("sy.locale", "en"));
	await page.goto("/app/leads");
	await connect(page, f.tokens.manager, f.ids.a);
	await rows(page).first().click({ position: { x: 10, y: 10 } });
	await expect(page.getByTestId("lead-detail-title")).toHaveText("Original title");
	await expect(page.getByTestId("lead-version")).toHaveText("0");

	// another actor edits first: the UI still holds version 0
	const command_id = randomUUID();
	const other = await request.patch(`/v1/leads/${lead.id}`, {
		headers: headers(f, command_id),
		data: { command_id, expected_version: 0, title: "Changed elsewhere" },
	});
	expect(other.status()).toBe(200);

	const form = page.getByTestId("lead-detail");
	await form.getByLabel("Title").fill("Edited locally");
	await pickValue(form.getByLabel("Status"), "qualified");
	await page.getByTestId("lead-save").click();
	await expect(page.getByTestId("lead-conflict")).toBeVisible();
	await expect(page.getByTestId("lead-conflict")).toContainText("changed by someone else");

	await page.getByTestId("lead-reload").click();
	await expect(page.getByTestId("lead-detail-title")).toHaveText("Changed elsewhere");
	await expect(page.getByTestId("lead-version")).toHaveText("1");
	await expect(page.getByTestId("lead-conflict")).toHaveCount(0);

	await form.getByLabel("Title").fill("Edited twice");
	await page.getByTestId("lead-save").click();
	await expect(page.getByTestId("toast").filter({ hasText: "Lead updated." })).toBeVisible();
	await expect(page.getByTestId("lead-detail-title")).toHaveText("Edited twice");
	await expect(page.getByTestId("lead-version")).toHaveText("2");
	await expect(rows(page).first()).toContainText("Edited twice");
});

test("leads en: reader gets the Forbidden state when saving an edit (403)", async ({ page, request }) => {
	const f = await fixture();
	await makeLead(request, f, "Readable lead");
	await page.addInitScript(() => localStorage.setItem("sy.locale", "en"));
	await page.goto("/app/leads");
	await connect(page, f.tokens.reader, f.ids.a);
	await expect(rows(page)).toHaveCount(1);
	await rows(page).first().click({ position: { x: 10, y: 10 } });
	await page.getByTestId("lead-detail").getByLabel("Title").fill("Reader edit");
	await page.getByTestId("lead-save").click();
	await expect(page.getByTestId("lead-forbidden")).toBeVisible();
	await expect(page.getByTestId("lead-forbidden")).toContainText("You cannot edit this lead");
});
