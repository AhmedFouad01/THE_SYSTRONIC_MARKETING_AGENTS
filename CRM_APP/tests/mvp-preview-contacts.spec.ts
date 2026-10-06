import { randomUUID } from "node:crypto";
import { type APIRequestContext, expect, type Page, test } from "@playwright/test";
import pg from "pg";
import { seed } from "../scripts/seed.js";

process.loadEnvFile(".env");

// UI R4 C, increment 2: Contacts uses the shared preview slide-over (same PreviewPanel as Leads).
// Credentials stay in memory; never logged or asserted by value.
async function fixture() {
	const admin = new pg.Client({ connectionString: process.env.ADMIN_DATABASE_URL });
	await admin.connect();
	const f = await seed(admin);
	await admin.end();
	return f;
}
type Fixture = Awaited<ReturnType<typeof fixture>>;

async function makeContact(request: APIRequestContext, f: Fixture, name: string, email?: string) {
	const command_id = randomUUID();
	const res = await request.post("/v1/contacts", {
		headers: {
			Authorization: `Bearer ${f.tokens.manager}`,
			"X-Tenant-ID": f.ids.a,
			"Idempotency-Key": command_id,
		},
		data: {
			command_id,
			display_name: name,
			...(email ? { identifiers: [{ kind: "email", value: email, provenance: "manual_entry" }] } : {}),
		},
	});
	expect(res.status()).toBe(201);
	return (await res.json()).data as { id: string };
}

/** "Contact 01" ... "Contact NN"; the grid lists them by name ascending (Contact 01 = row 1). */
async function makeContacts(request: APIRequestContext, f: Fixture, n: number) {
	const out: Array<{ id: string; name: string }> = [];
	for (let i = 1; i <= n; i++) {
		const name = `Contact ${String(i).padStart(2, "0")}`;
		out.push({ id: (await makeContact(request, f, name)).id, name });
	}
	return out;
}

async function start(
	page: Page,
	f: Fixture,
	o: { language?: "ar" | "en"; width?: number; theme?: "light" | "dark"; path?: string } = {},
) {
	await page.setViewportSize({ width: o.width ?? 1440, height: 900 });
	await page.addInitScript(
		([l, th]) => {
			localStorage.setItem("sy.locale", l as string);
			if (th) localStorage.setItem("sy.theme", th as string);
		},
		[o.language ?? "en", o.theme ?? ""],
	);
	await page.goto(o.path ?? "/app/contacts");
	await page.locator("input[name=token]").fill(f.tokens.manager);
	await page.locator("input[name=tenant]").fill(f.ids.a);
	await page.getByTestId("connect-submit").click();
	await expect(page.getByTestId("actor")).toBeVisible();
}

const rows = (page: Page) => page.getByTestId("grid-row");
const panel = (page: Page) => page.getByTestId("contact-detail");
const title = (page: Page) => page.getByTestId("contact-detail-title");
const row = (page: Page, name: string) => rows(page).filter({ hasText: name });
const open = (page: Page, name: string) => row(page, name).locator(".sy-cell-id").click();
const previewParam = (page: Page) => new URL(page.url()).searchParams.get("preview");

test("contacts preview en 1440: no auto-open, table keeps its width, focus heading, Esc closes and returns focus to the row, URL follows", async ({
	page,
	request,
}) => {
	const f = await fixture();
	await makeContacts(request, f, 3);
	await start(page, f);
	await expect(rows(page)).toHaveCount(4); // 3 created + the fixture's "Synthetic A"
	await expect(panel(page)).toHaveCount(0);
	await expect(page.getByTestId("contact-detail-empty")).toHaveCount(0);
	expect(previewParam(page)).toBeNull();
	const before = await page.getByTestId("grid-table").boundingBox();

	await open(page, "Contact 02");
	await expect(panel(page)).toBeVisible();
	await expect(panel(page)).toHaveAttribute("role", "dialog");
	await expect(panel(page)).toHaveAttribute("aria-modal", "false");
	await expect(panel(page)).toHaveAttribute("aria-label", "Contact details");
	await expect(title(page)).toHaveText("Contact 02");
	await expect(panel(page).getByRole("heading").first()).toBeFocused();
	await expect(panel(page).getByRole("heading").first()).toHaveText("Contact 02");
	await expect(row(page, "Contact 02")).toHaveAttribute("aria-current", "true");
	expect(previewParam(page)).not.toBeNull();
	const after = await page.getByTestId("grid-table").boundingBox();
	expect(after?.width).toBe(before?.width);
	await expect(panel(page).getByRole("button", { name: /open full record/i })).toHaveCount(0);
	// the three tabs are inside the panel
	await expect(panel(page).getByRole("tab")).toHaveCount(3);

	await page.keyboard.press("Escape");
	await expect(panel(page)).toHaveCount(0);
	await expect(row(page, "Contact 02")).toBeFocused();
	expect(previewParam(page)).toBeNull();

	await open(page, "Contact 03");
	await panel(page).getByTestId("preview-close").click();
	await expect(panel(page)).toHaveCount(0);
	await expect(row(page, "Contact 03")).toBeFocused();

	// outside click (page header) closes; a row click swaps in place
	await open(page, "Contact 01");
	await open(page, "Contact 02");
	await expect(title(page)).toHaveText("Contact 02");
	await expect(panel(page)).toHaveCount(1);
	await page.getByRole("heading", { level: 1 }).click();
	await expect(panel(page)).toHaveCount(0);
});

test("contacts preview en 1440: Esc leaves edit first; unsaved changes ask before discarding", async ({ page, request }) => {
	const f = await fixture();
	await makeContacts(request, f, 2);
	await start(page, f);
	await open(page, "Contact 02");
	await page.getByTestId("record-edit").click();
	const input = panel(page).getByLabel("Name");
	await expect(input).toBeVisible();
	await input.focus();
	await page.keyboard.press("Escape");
	await expect(panel(page).getByLabel("Name")).toHaveCount(0);
	await expect(panel(page)).toBeVisible();

	await page.getByTestId("record-edit").click();
	await panel(page).getByLabel("Name").fill("Changed draft");
	await page.keyboard.press("Escape");
	const confirm = page.getByTestId("preview-discard-dialog");
	await expect(confirm).toBeVisible();
	await confirm.getByTestId("dialog-cancel").click();
	await expect(panel(page).getByLabel("Name")).toHaveValue("Changed draft");
	await open(page, "Contact 01");
	await expect(confirm).toBeVisible();
	await confirm.getByTestId("dialog-confirm").click();
	await expect(title(page)).toHaveText("Contact 01");
	await expect(panel(page).getByLabel("Name")).toHaveCount(0);
});

for (const language of ["en", "ar"] as const)
	test(`contacts preview ${language} 1440: tabs, Add identifier (Select + popover), Add task and Create deal work inside the panel`, async ({
		page,
		request,
	}) => {
		const f = await fixture();
		await makeContact(request, f, "Tabbed Person", `tab-${randomUUID()}@example.test`);
		await start(page, f, { language });
		await open(page, "Tabbed Person");
		await expect(panel(page)).toBeVisible();
		await page.waitForTimeout(350);
		expect(await panel(page).evaluate((el) => getComputedStyle(el).transform)).toBe("none");

		// Overview / Journey / Duplicates
		const tabs = panel(page).getByRole("tab");
		await expect(tabs).toHaveCount(3);
		await tabs.nth(1).click();
		await expect(page.getByTestId("journey")).toBeVisible();
		await tabs.nth(2).click();
		await expect(panel(page).getByRole("tabpanel")).toBeVisible();
		await tabs.nth(0).click();
		await expect(page.getByTestId("identifiers-hidden").or(page.getByTestId("identifiers"))).toBeVisible();

		// "+ Add" popover with a Select inside the panel: the list sits under its trigger, inside the viewport, panel stays open
		await page.getByTestId("identifier-add").click();
		const pop = page.getByRole("dialog", { name: language === "ar" ? /.+/ : "Add a phone or email" }).last();
		await expect(pop).toBeVisible();
		const trigger = pop.getByRole("combobox").first();
		await trigger.click();
		const list = page.getByRole("listbox");
		await expect(list).toBeVisible();
		const t = await trigger.boundingBox();
		const l = await list.boundingBox();
		if (!t || !l) throw new Error("no boxes");
		expect(l.x).toBeGreaterThanOrEqual(0);
		expect(l.x + l.width).toBeLessThanOrEqual(1440);
		expect(Math.abs(l.y - (t.y + t.height)) < 16 || Math.abs(l.y + l.height - t.y) < 16).toBe(true);
		expect(l.x < t.x + t.width && l.x + l.width > t.x).toBe(true);
		await list.getByRole("option").nth(1).click();
		await expect(list).toHaveCount(0);
		await expect(panel(page)).toBeVisible();
		await pop.getByRole("textbox").fill("added@example.test");
		await pop.getByTestId("identifier-add-submit").click();
		await expect(page.getByTestId("toast").first()).toBeVisible();
		await expect(panel(page)).toBeVisible();
		await expect(page.getByTestId("identifiers-hidden").or(page.getByTestId("identifiers"))).toBeVisible();

		// Add task dialog from the panel: centred on the viewport, scrim click keeps the panel, Esc closes only the dialog
		await page.getByTestId("add-task").click();
		const dialog = page.getByTestId("new-task-dialog");
		await expect(dialog).toBeVisible();
		const d = await dialog.boundingBox();
		if (!d) throw new Error("no dialog box");
		expect(Math.abs(d.x + d.width / 2 - 720)).toBeLessThan(2);
		expect(d.y).toBeGreaterThanOrEqual(0);
		expect(d.y + d.height).toBeLessThanOrEqual(900);
		await page.mouse.click(30, 450);
		await expect(panel(page)).toBeVisible();
		await dialog.focus();
		await page.keyboard.press("Escape");
		await expect(dialog).toHaveCount(0);
		await expect(panel(page)).toBeVisible();
		await expect(page.getByTestId("add-task")).toBeFocused();

		// Create deal leaves for /deals; browser Back returns to the list with the same contact open
		await page.getByTestId("contact-create-deal").click();
		await expect(page).toHaveURL(/\/app\/deals/);
		await page.goBack();
		await expect(page).toHaveURL(/\/app\/contacts\?preview=/);
		await expect(title(page)).toHaveText("Tabbed Person");
	});

test("contacts preview en 1440: deep link beyond the loaded pages, legacy ?select=, panel survives a filter that hides its row, unknown id", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const contacts = await makeContacts(request, f, 30);
	const last = contacts[29];
	const first = contacts[0];
	if (!last || !first) throw new Error("no contact");
	await start(page, f, { path: `/app/contacts?preview=${last.id}` });
	await expect(title(page)).toHaveText(last.name);
	await expect(row(page, last.name)).toHaveCount(0); // row 30 is past the first loaded page: fetched by id
	expect(previewParam(page)).toBe(last.id);

	await page.getByTestId("grid-search").fill("Contact 02");
	await expect(rows(page)).toHaveCount(1);
	await expect(title(page)).toHaveText(last.name);

	await page.goto(`/app/contacts?select=${first.id}`);
	await expect(title(page)).toHaveText(first.name);
	await expect.poll(() => previewParam(page)).toBe(first.id);
	expect(new URL(page.url()).searchParams.get("select")).toBeNull();

	// reload keeps the panel
	await page.reload();
	await expect(title(page)).toHaveText(first.name);

	await page.goto(`/app/contacts?preview=${randomUUID()}`);
	await expect(page.getByTestId("contact-detail-missing")).toBeVisible();
	await panel(page).getByTestId("preview-close").click();
	await expect(panel(page)).toHaveCount(0);
});

test("contacts preview en 1440: Prev/Next walk the rows across a grid page and a server page; J/K; ignored while typing", async ({
	page,
	request,
}) => {
	const f = await fixture();
	await makeContacts(request, f, 30);
	await start(page, f);
	await expect(page.getByTestId("grid-range")).toHaveText("1–10 of 31");
	await open(page, "Contact 01");
	await expect(panel(page).getByTestId("preview-position")).toHaveText("1 of 31");
	await expect(panel(page).getByTestId("preview-prev")).toBeDisabled();
	await panel(page).getByTestId("preview-next").click();
	await expect(title(page)).toHaveText("Contact 02");
	await panel(page).getByTestId("preview-prev").click();
	await expect(title(page)).toHaveText("Contact 01");
	await page.keyboard.press("j");
	await expect(title(page)).toHaveText("Contact 02");
	await page.keyboard.press("k");
	await expect(title(page)).toHaveText("Contact 01");

	// grid page edge (row 10 -> 11)
	await open(page, "Contact 10");
	await panel(page).getByTestId("preview-next").click();
	await expect(title(page)).toHaveText("Contact 11");
	await expect(page.getByTestId("grid-range")).toHaveText("11–20 of 31");
	await expect(row(page, "Contact 11")).toHaveAttribute("aria-current", "true");
	await expect(row(page, "Contact 11")).toBeInViewport();

	// server page edge (25 rows are loaded first): row 25 -> 26 loads the next page
	await panel(page).getByTestId("preview-close").click();
	await page.getByTestId("grid-page-3").click();
	await open(page, "Contact 25");
	await expect(panel(page).getByTestId("preview-position")).toHaveText("25 of 31");
	await panel(page).getByTestId("preview-next").click();
	await expect(title(page)).toHaveText("Contact 26");
	await expect(panel(page).getByTestId("preview-position")).toHaveText("26 of 31");
	await expect(row(page, "Contact 26")).toHaveAttribute("aria-current", "true");
	for (let i = 0; i < 5; i++) await panel(page).getByTestId("preview-next").click();
	await expect(title(page)).toHaveText("Synthetic A");
	await expect(panel(page).getByTestId("preview-next")).toBeDisabled();

	await page.getByTestId("grid-search").fill("j");
	await expect(page.getByTestId("grid-search")).toHaveValue("j");
	await expect(title(page)).toHaveText("Synthetic A");
});

for (const language of ["en", "ar"] as const)
	test(`contacts preview ${language} 1440: docked at the inline end (EN right, AR left) below the topbar; table, sidebar and title stay uncovered`, async ({
		page,
		request,
	}) => {
		const f = await fixture();
		await makeContacts(request, f, 2);
		await start(page, f, { language });
		await expect(page.locator("html")).toHaveAttribute("dir", language === "ar" ? "rtl" : "ltr");
		const tableBefore = await page.getByTestId("grid-table").boundingBox();
		// sort headers sit at the inline-start edge of their cell (AR: right, EN: left), not at the opposite end (th was LTR-resolved)
		for (const col of ["name", "source"]) {
			const th = await page.locator("th").filter({ has: page.getByTestId(`sort-${col}`) }).boundingBox();
			const btn = await page.getByTestId(`sort-${col}`).boundingBox();
			if (!th || !btn) throw new Error("no header boxes");
			if (language === "ar") expect(Math.abs(th.x + th.width - (btn.x + btn.width))).toBeLessThanOrEqual(12);
			else expect(Math.abs(btn.x - th.x)).toBeLessThanOrEqual(12);
		}
		await open(page, "Contact 02");
		await expect(panel(page)).toBeVisible();
		const startX = await panel(page).evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41);
		if (language === "ar") expect(startX).toBeLessThanOrEqual(0);
		else expect(startX).toBeGreaterThanOrEqual(0);
		await page.waitForTimeout(350);
		const box = await panel(page).boundingBox();
		if (!box) throw new Error("no panel box");
		if (language === "ar") expect(Math.abs(box.x)).toBeLessThanOrEqual(1);
		else expect(Math.abs(box.x + box.width - 1440)).toBeLessThanOrEqual(1);
		expect(Math.abs(box.y - 56)).toBeLessThanOrEqual(1);
		expect(Math.abs(box.y + box.height - 900)).toBeLessThanOrEqual(1);
		expect(Math.abs(box.width - 432)).toBeLessThanOrEqual(1);
		const tableAfter = await page.getByTestId("grid-table").boundingBox();
		expect(tableAfter?.width).toBe(tableBefore?.width);
		expect(tableAfter?.x).toBe(tableBefore?.x);
		const apart = async (loc: ReturnType<typeof page.locator>) => {
			const b = await loc.boundingBox();
			if (!b) throw new Error("no box");
			return b.x >= box.x + box.width - 1 || b.x + b.width <= box.x + 1;
		};
		expect(await apart(page.getByTestId("nav-tasks"))).toBe(true);
		expect(await apart(page.getByRole("heading", { level: 1 }))).toBe(true);
		// the name text itself (the cell is wider than its text, and the Source/Owner columns may sit under the panel)
		const nameBox = await row(page, "Contact 02")
			.locator(".sy-cell-id__name")
			.evaluate((el) => {
				const r = document.createRange();
				r.selectNodeContents(el.firstChild ?? el);
				const b = r.getBoundingClientRect();
				return { x: b.x, y: b.y, width: b.width, height: b.height };
			});
		expect(nameBox.x >= box.x + box.width - 1 || nameBox.x + nameBox.width <= box.x + 1).toBe(true);
		// the sidebar link really receives the click (AR: the panel is on the other side)
		const navBox = await page.getByTestId("nav-tasks").boundingBox();
		if (!navBox) throw new Error("no nav box");
		const hit = await page.evaluate(
			([x, y]) => document.elementFromPoint(x as number, y as number)?.closest("[data-testid]")?.getAttribute("data-testid"),
			[navBox.x + navBox.width / 2, navBox.y + navBox.height / 2],
		);
		expect(hit).toBe("nav-tasks");
		await page.getByTestId("nav-tasks").click();
		await expect(page).toHaveURL(/\/app\/tasks/);
		await expect(panel(page)).toHaveCount(0);
	});

for (const language of ["en", "ar"] as const)
	test(`contacts preview ${language} 375: full-screen sheet from the right with Back; focus returns to the row; browser Back closes it`, async ({
		page,
		request,
	}) => {
		const f = await fixture();
		await makeContacts(request, f, 3);
		await start(page, f, { language, width: 375 });
		await expect(rows(page)).toHaveCount(4);
		const base = await page.evaluate(() => history.length);
		await row(page, "Contact 02").first().click({ position: { x: 20, y: 10 } });
		await expect(panel(page)).toBeVisible();
		await expect(panel(page)).toHaveAttribute("aria-modal", "true");
		expect(await panel(page).evaluate((el) => getComputedStyle(el).animationName)).toBe("sy-sheet-in");
		await page.waitForTimeout(400);
		const box = await panel(page).boundingBox();
		expect(box?.x ?? -1).toBeCloseTo(0, 0);
		expect(box?.width ?? 0).toBeCloseTo(375, 0);
		await expect(panel(page).locator(".sy-dialog__sidetitle")).toHaveText("Contact 02");
		await expect(page.getByTestId("sheet-back")).toBeVisible();
		await expect.poll(() => page.evaluate(() => history.length)).toBe(base + 1);
		await page.getByTestId("sheet-back").click();
		await expect(panel(page)).toHaveCount(0);
		await expect(row(page, "Contact 02").first()).toBeFocused();
		await expect(page).toHaveURL(/\/app\/contacts$/);
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

		await row(page, "Contact 03").first().click({ position: { x: 20, y: 10 } });
		await expect(panel(page)).toBeVisible();
		await page.goBack();
		await expect(panel(page)).toHaveCount(0);
		await expect(page).toHaveURL(/\/app\/contacts$/);
		await expect(rows(page)).toHaveCount(4);
	});

for (const language of ["en", "ar"] as const)
	test(`contacts preview ${language} 1440: the merge dialog stays mounted and working over the open panel; after merge the panel shows the surviving contact`, async ({
		page,
		request,
	}) => {
		const f = await fixture();
		const email = `dup-${randomUUID()}@example.test`;
		const target = await makeContact(request, f, "Target Person", email);
		await makeContact(request, f, "Source Person", email);
		await start(page, f, { language });
		await open(page, "Target Person");
		await expect(panel(page)).toBeVisible();
		await page.waitForTimeout(350);
		await panel(page).getByRole("tab").nth(2).click();
		const dup = page.getByTestId("duplicate-item");
		await expect(dup).toHaveCount(1);
		await panel(page).evaluate((el) => el.setAttribute("data-mark", "same-node")); // proves the panel is not remounted

		await page.getByTestId("duplicate-merge").click();
		const dialog = page.getByTestId("merge-preview-dialog");
		await expect(dialog).toBeVisible();
		// clicks inside the dialog and on its scrim (over the page, outside the panel) neither close the panel nor the dialog
		await dialog.getByTestId("merge-fields").click();
		await expect(dialog).toBeVisible();
		await expect(panel(page)).toBeVisible();
		await page.mouse.click(language === "ar" ? 1400 : 30, 450); // scrim, away from the dialog and the panel's side
		await page.mouse.click(720, 80); // scrim above the dialog (topbar area)
		await expect(dialog).toBeVisible();
		await expect(panel(page)).toBeVisible();
		await expect(dialog.getByTestId("merge-continue")).toBeVisible();
		expect(previewParam(page)).toBe(target.id);

		await dialog.getByTestId("merge-continue").click();
		const confirm = page.getByTestId("merge-confirm-dialog");
		await expect(confirm).toBeVisible();
		await page.mouse.click(language === "ar" ? 1400 : 30, 450);
		await expect(confirm).toBeVisible();
		await expect(panel(page)).toBeVisible();
		await confirm.getByTestId("dialog-confirm").click();
		await expect(page.getByTestId("toast").first()).toBeVisible();
		await expect(confirm).toHaveCount(0);

		// survivor: same panel (not re-opened), same record, merged-away row gone, fresh identifiers, back on the overview tab
		await expect(panel(page)).toHaveAttribute("data-mark", "same-node");
		await expect(title(page)).toHaveText("Target Person");
		expect(previewParam(page)).toBe(target.id);
		await expect(row(page, "Source Person")).toHaveCount(0);
		await expect(page.getByTestId("identifiers").locator("li")).toHaveCount(2);
		await expect(panel(page).getByRole("tab").first()).toHaveAttribute("aria-selected", "true");
	});
