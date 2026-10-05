import { randomUUID } from "node:crypto";
import { type APIRequestContext, expect, type Page, test } from "@playwright/test";
import pg from "pg";
import { seed } from "../scripts/seed.js";

process.loadEnvFile(".env");

// Batch 1c: DataGrid parts (active-only sort icon, numbered pager, bulk overlay) and RecordPanel
// (auto-select, read-first, edit-on-demand with dirty-only footer, mobile cards + record sheet).
// Credentials stay in memory; never logged or asserted by value.
async function fixture() {
	const admin = new pg.Client({ connectionString: process.env.ADMIN_DATABASE_URL });
	await admin.connect();
	const f = await seed(admin);
	await admin.end();
	return f;
}
type Fixture = Awaited<ReturnType<typeof fixture>>;

async function makeLead(request: APIRequestContext, f: Fixture, title: string) {
	const command_id = randomUUID();
	const res = await request.post("/v1/leads", {
		headers: {
			Authorization: `Bearer ${f.tokens.manager}`,
			"X-Tenant-ID": f.ids.a,
			"Idempotency-Key": command_id,
		},
		data: { command_id, title, source_evidence: "synthetic", contact: { display_name: `Contact ${title}` } },
	});
	expect(res.status()).toBe(201);
}

async function connect(page: Page, token: string, tenant: string) {
	await page.locator("input[name=token]").fill(token);
	await page.locator("input[name=tenant]").fill(tenant);
	await page.getByTestId("connect-submit").click();
	await expect(page.getByTestId("actor")).toBeVisible();
}

const rows = (page: Page) => page.getByTestId("grid-row");
const noPageOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

test("grid + record panel en 1440: active-only sort icon, numbered pager, row click, auto-select, edit-on-demand", async ({
	page,
	request,
}) => {
	const f = await fixture();
	for (let i = 1; i <= 12; i++) await makeLead(request, f, `Lead ${String(i).padStart(2, "0")}`);
	await page.addInitScript(() => localStorage.setItem("sy.locale", "en"));
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/app/leads");
	await connect(page, f.tokens.manager, f.ids.a);
	await expect(rows(page)).toHaveCount(10);

	// UX-10: desktop opens the first row automatically; the empty "select a lead" card never shows.
	await expect(page.getByTestId("lead-detail")).toBeVisible();
	await expect(rows(page).first()).toHaveAttribute("aria-selected", "true");
	await expect(page.getByTestId("lead-detail-empty")).toHaveCount(0);

	// UX-06: the sort arrow exists only on the active column (default order = Created, newest first).
	await expect(page.getByTestId("sort-mark")).toHaveCount(1);
	await expect(page.getByTestId("sort-created").getByTestId("sort-mark")).toHaveCount(1);
	await page.getByTestId("sort-lead").click();
	await expect(page.getByTestId("sort-mark")).toHaveCount(1);
	await expect(page.getByTestId("sort-lead").getByTestId("sort-mark")).toHaveText("▲");
	await expect(page.getByTestId("sort-created").getByTestId("sort-mark")).toHaveCount(0);

	// UX-08: one footer row, range at the start, numbered pager; the current page is aria-current.
	await expect(page.getByTestId("grid-range")).toHaveText("1–10 of 12");
	await expect(page.getByTestId("grid-page-1")).toHaveAttribute("aria-current", "page");
	await expect(page.getByTestId("grid-prev")).toBeDisabled();
	await page.getByTestId("grid-page-2").click();
	await expect(page.getByTestId("grid-range")).toHaveText("11–12 of 12");
	await expect(rows(page)).toHaveCount(2);
	await expect(page.getByTestId("grid-page-2")).toHaveAttribute("aria-current", "page");
	await expect(page.getByTestId("grid-next")).toBeDisabled();
	await page.getByTestId("grid-prev").click();
	await expect(rows(page)).toHaveCount(10);

	// UX-26: the whole row opens the record (click in the middle of a cell, not the checkbox corner).
	const third = rows(page).nth(2);
	const label = (await third.locator(".sy-cell-id__name").innerText()).trim();
	await third.locator(".sy-cell-id").click();
	await expect(third).toHaveAttribute("aria-selected", "true");
	await expect(page.getByTestId("lead-detail-title")).toHaveText(label);

	// UX-11: read-first. No form, no Save/Discard, no Email/Call placeholders.
	const detail = page.getByTestId("lead-detail");
	await expect(page.getByTestId("record-facts")).toBeVisible();
	await expect(detail.getByLabel("Title")).toHaveCount(0);
	await expect(page.getByTestId("lead-save")).toHaveCount(0);
	await expect(page.getByTestId("record-footer")).toHaveCount(0);
	await expect(detail.getByRole("button", { name: /^(Email|Call)$/ })).toHaveCount(0);
	await expect(page.getByText(/not in MVP/i)).toHaveCount(0);

	// Edit on demand; the footer appears only while the draft differs from the record.
	await page.getByTestId("record-edit").click();
	await expect(detail.getByLabel("Title")).toBeVisible();
	await expect(page.getByTestId("record-footer")).toHaveCount(0);
	await detail.getByLabel("Title").fill("Edited title");
	await expect(page.getByTestId("record-footer")).toBeVisible();
	// Footer = Save + Cancel only (no separate Discard); Cancel drops the draft and leaves edit mode.
	await expect(page.getByTestId("record-discard")).toHaveCount(0);
	await expect(page.getByTestId("record-footer").getByRole("button")).toHaveCount(2);
	await page.getByTestId("record-edit-cancel").click();
	await expect(page.getByTestId("record-footer")).toHaveCount(0);
	await expect(page.getByTestId("record-editor")).toHaveCount(0);
	await expect(page.getByTestId("lead-detail-title")).not.toHaveText("Edited title");
	await page.getByTestId("record-edit").click();
	await expect(detail.getByLabel("Title")).not.toHaveValue("Edited title");
	await detail.getByLabel("Title").fill("Edited title");
	await page.getByTestId("lead-save").click();
	await expect(page.getByTestId("toast").filter({ hasText: "Lead updated." })).toBeVisible();
	await expect(page.getByTestId("lead-detail-title")).toHaveText("Edited title");
	await expect(page.getByTestId("record-edit")).toBeVisible();
	await expect(page.getByTestId("record-footer")).toHaveCount(0);
});

test("grid en 1440: bulk bar overlays the toolbar without pushing the table", async ({ page, request }) => {
	const f = await fixture();
	await makeLead(request, f, "Alpha lead");
	await makeLead(request, f, "Bravo lead");
	await page.addInitScript(() => localStorage.setItem("sy.locale", "en"));
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/app/leads");
	await connect(page, f.tokens.manager, f.ids.a);
	await expect(rows(page)).toHaveCount(2);
	const before = await page.getByTestId("grid-table").boundingBox();
	await page.getByRole("checkbox", { name: "Select row Alpha lead" }).check();
	await expect(page.getByTestId("grid-batch")).toContainText("1 selected");
	await expect(page.getByTestId("bulk-assign")).toBeVisible();
	const after = await page.getByTestId("grid-table").boundingBox();
	expect(after?.y).toBe(before?.y);
	await page.getByTestId("grid-batch-clear").click();
	await expect(page.getByTestId("grid-batch")).toHaveCount(0);
});

for (const language of ["ar", "en"] as const)
	test(`leads ${language} 375px: rows are cards, no page overflow, record opens in a sheet with back and focus return`, async ({
		page,
		request,
	}) => {
		const f = await fixture();
		await makeLead(request, f, "Alpha lead");
		await makeLead(request, f, "Bravo lead");
		await page.addInitScript((l) => localStorage.setItem("sy.locale", l), language);
		await page.setViewportSize({ width: 375, height: 800 });
		await page.goto("/app/leads");
		await connect(page, f.tokens.manager, f.ids.a);
		await expect(rows(page)).toHaveCount(2);

		// No record is opened automatically on a phone, and nothing is clipped.
		await expect(page.getByRole("dialog")).toHaveCount(0);
		expect(await noPageOverflow(page)).toBe(true);
		const card = rows(page).first();
		const box = await card.boundingBox();
		expect(box && box.x >= 0 && box.x + box.width <= 375).toBe(true);
		await expect(card.locator("td").filter({ visible: true }).first()).toBeVisible();

		await rows(page).filter({ hasText: "Alpha lead" }).locator(".sy-cell-id").click();
		const sheet = page.getByRole("dialog");
		await expect(sheet).toBeVisible();
		await expect(page.getByTestId("lead-detail-title")).toHaveText("Alpha lead");
		await expect(page.getByTestId("sheet-back")).toBeFocused();
		const sheetBox = await sheet.boundingBox();
		expect(sheetBox?.width).toBe(375);
		expect(await noPageOverflow(page)).toBe(true);

		await page.getByTestId("sheet-back").click();
		await expect(page.getByRole("dialog")).toHaveCount(0);
		await expect(rows(page).filter({ hasText: "Alpha lead" })).toBeFocused();

		// Esc closes the sheet as well.
		await rows(page).filter({ hasText: "Bravo lead" }).locator(".sy-cell-id").click();
		await expect(page.getByRole("dialog")).toBeVisible();
		await page.keyboard.press("Escape");
		await expect(page.getByRole("dialog")).toHaveCount(0);
	});

test("leads en 768px: no clipped columns or page overflow, rows stay inside the viewport", async ({ page, request }) => {
	const f = await fixture();
	await makeLead(request, f, "Alpha lead");
	await page.addInitScript(() => localStorage.setItem("sy.locale", "en"));
	await page.setViewportSize({ width: 768, height: 900 });
	await page.goto("/app/leads");
	await connect(page, f.tokens.manager, f.ids.a);
	await expect(rows(page)).toHaveCount(1);
	expect(await noPageOverflow(page)).toBe(true);
	const box = await rows(page).first().boundingBox();
	expect(box && box.x >= 0 && box.x + box.width <= 768).toBe(true);
	const clipped = await page.evaluate(() =>
		[...document.querySelectorAll('[data-testid="grid-row"] td')]
			.filter((td) => td instanceof HTMLElement && td.offsetParent !== null)
			.filter((td) => td.scrollWidth > td.clientWidth + 1).length,
	);
	expect(clipped).toBe(0);
});
