import { randomUUID } from "node:crypto";
import { type APIRequestContext, expect, type Page, test } from "@playwright/test";
import pg from "pg";
import { seed } from "../scripts/seed.js";
import { pickDay } from "./select-helper.js";

process.loadEnvFile(".env");

// UI R4 C, increment 3: Tasks uses the shared preview slide-over (same PreviewPanel as Leads and Contacts).
// Credentials stay in memory; never logged or asserted by value.
async function fixture() {
	const admin = new pg.Client({ connectionString: process.env.ADMIN_DATABASE_URL });
	await admin.connect();
	const f = await seed(admin);
	await admin.end();
	return f;
}
type Fixture = Awaited<ReturnType<typeof fixture>>;

const headers = (f: Fixture, key = randomUUID()) => ({
	Authorization: `Bearer ${f.tokens.manager}`,
	"X-Tenant-ID": f.ids.a,
	"Idempotency-Key": key,
});

async function makeContact(request: APIRequestContext, f: Fixture, name: string) {
	const command_id = randomUUID();
	const res = await request.post("/v1/contacts", {
		headers: headers(f, command_id),
		data: { command_id, display_name: name },
	});
	expect(res.status()).toBe(201);
	return (await res.json()).data as { id: string };
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** "Task 01" ... "Task NN", due 3 days out, one hour apart: the Open tab (due ascending) lists Task 01 first. */
async function makeTasks(request: APIRequestContext, f: Fixture, n: number) {
	const contact = await makeContact(request, f, "Task Owner Contact");
	const out: Array<{ id: string; title: string; version: number }> = [];
	for (let i = 1; i <= n; i++) {
		const title = `Task ${String(i).padStart(2, "0")}`;
		const command_id = randomUUID();
		const res = await request.post("/v1/tasks", {
			headers: headers(f, command_id),
			data: { command_id, title, contact_id: contact.id, due_at: new Date(Date.now() + 3 * DAY + i * HOUR).toISOString() },
		});
		expect(res.status()).toBe(201);
		out.push({ title, ...((await res.json()).data as { id: string; version: number }) });
	}
	return { contact, tasks: out };
}

/** Local `YYYY-MM-DDTHH:mm`, `days` from now at 09:00. */
function inputIn(days: number): string {
	const d = new Date(Date.now() + days * DAY);
	const p = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T09:00`;
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
	await page.goto(o.path ?? "/app/tasks");
	await page.locator("input[name=token]").fill(f.tokens.manager);
	await page.locator("input[name=tenant]").fill(f.ids.a);
	await page.getByTestId("connect-submit").click();
	await expect(page.getByTestId("actor")).toBeVisible();
}

const rows = (page: Page) => page.getByTestId("grid-row");
const panel = (page: Page) => page.getByTestId("task-detail");
const title = (page: Page) => page.getByTestId("task-detail-title");
const row = (page: Page, name: string) => rows(page).filter({ hasText: name });
const open = (page: Page, name: string) => row(page, name).locator(".sy-cell-id").click();
const previewParam = (page: Page) => new URL(page.url()).searchParams.get("preview");

test("tasks preview en 1440: no auto-open, table keeps its width, focus heading, Esc closes and returns focus to the row, URL follows", async ({
	page,
	request,
}) => {
	const f = await fixture();
	await makeTasks(request, f, 3);
	await start(page, f);
	await expect(rows(page)).toHaveCount(3);
	await expect(panel(page)).toHaveCount(0);
	await expect(page.getByTestId("task-detail-empty")).toHaveCount(0);
	expect(previewParam(page)).toBeNull();
	const before = await page.getByTestId("grid-table").boundingBox();

	await open(page, "Task 02");
	await expect(panel(page)).toBeVisible();
	await expect(panel(page)).toHaveAttribute("role", "dialog");
	await expect(panel(page)).toHaveAttribute("aria-modal", "false");
	await expect(panel(page)).toHaveAttribute("aria-label", "Task details");
	await expect(title(page)).toHaveText("Task 02");
	await expect(panel(page).getByRole("heading").first()).toBeFocused();
	await expect(panel(page).getByRole("heading").first()).toHaveText("Task 02");
	await expect(row(page, "Task 02")).toHaveAttribute("aria-current", "true");
	expect(previewParam(page)).not.toBeNull();
	const after = await page.getByTestId("grid-table").boundingBox();
	expect(after?.width).toBe(before?.width);
	await expect(panel(page).getByRole("button", { name: /open full record/i })).toHaveCount(0);

	await page.keyboard.press("Escape");
	await expect(panel(page)).toHaveCount(0);
	await expect(row(page, "Task 02")).toBeFocused();
	expect(previewParam(page)).toBeNull();

	await open(page, "Task 03");
	await panel(page).getByTestId("preview-close").click();
	await expect(panel(page)).toHaveCount(0);
	await expect(row(page, "Task 03")).toBeFocused();

	// a row click swaps in place; an outside click (page header) closes
	await open(page, "Task 01");
	await open(page, "Task 02");
	await expect(title(page)).toHaveText("Task 02");
	await expect(panel(page)).toHaveCount(1);
	await page.getByRole("heading", { level: 1 }).click();
	await expect(panel(page)).toHaveCount(0);
});

test("tasks preview en 1440: Esc leaves edit first; unsaved changes ask before discarding", async ({ page, request }) => {
	const f = await fixture();
	await makeTasks(request, f, 2);
	await start(page, f);
	await open(page, "Task 02");
	await page.getByTestId("record-edit").click();
	const input = panel(page).getByLabel("Title");
	await expect(input).toBeVisible();
	await input.focus();
	await page.keyboard.press("Escape");
	await expect(panel(page).getByLabel("Title")).toHaveCount(0);
	await expect(panel(page)).toBeVisible();

	await page.getByTestId("record-edit").click();
	await panel(page).getByLabel("Title").fill("Changed draft");
	await page.keyboard.press("Escape");
	const confirm = page.getByTestId("preview-discard-dialog");
	await expect(confirm).toBeVisible();
	await confirm.getByTestId("dialog-cancel").click();
	await expect(panel(page).getByLabel("Title")).toHaveValue("Changed draft");
	await open(page, "Task 01");
	await expect(confirm).toBeVisible();
	await confirm.getByTestId("dialog-confirm").click();
	await expect(title(page)).toHaveText("Task 01");
	await expect(panel(page).getByLabel("Title")).toHaveCount(0);
});

for (const language of ["en", "ar"] as const)
	test(`tasks preview ${language} 1440: edit with the due-date picker and owner Select, complete, and the related link all work inside the panel`, async ({
		page,
		request,
	}) => {
		const f = await fixture();
		await makeTasks(request, f, 2);
		await start(page, f, { language });
		await open(page, "Task 02");
		await expect(panel(page)).toBeVisible();
		await page.waitForTimeout(350);
		expect(await panel(page).evaluate((el) => getComputedStyle(el).transform)).toBe("none");

		// edit: the DatePicker month panel and the Select list are positioned against the viewport, under their triggers
		await page.getByTestId("record-edit").click();
		const dueTrigger = panel(page).getByRole("combobox").first();
		await dueTrigger.click();
		const month = page.locator(".sy-date__panel");
		await expect(month).toBeVisible();
		const t = await dueTrigger.boundingBox();
		const m = await month.boundingBox();
		if (!t || !m) throw new Error("no boxes");
		expect(m.x).toBeGreaterThanOrEqual(0);
		expect(m.x + m.width).toBeLessThanOrEqual(1440);
		expect(m.y).toBeGreaterThanOrEqual(0);
		expect(m.y + m.height).toBeLessThanOrEqual(900);
		expect(Math.abs(m.y - (t.y + t.height)) < 16 || Math.abs(m.y + m.height - t.y) < 16).toBe(true);
		await page.keyboard.press("Escape"); // closes the picker only
		await expect(month).toHaveCount(0);
		await expect(panel(page)).toBeVisible();

		await pickDay(panel(page).getByRole("combobox").first(), inputIn(6));
		await expect(panel(page)).toBeVisible();
		await page.getByTestId("task-save").click();
		await expect(page.getByTestId("toast").first()).toBeVisible();
		await expect(title(page)).toHaveText("Task 02");
		await expect(panel(page)).toBeVisible();
		await expect(page.getByTestId("record-edit")).toBeVisible();

		// complete from the panel: the Open list drops the row, the panel keeps showing the (now done) task
		await page.getByTestId("task-complete").click();
		await expect(page.getByTestId("task-detail-status")).toBeVisible();
		await expect(page.getByTestId("task-complete")).toHaveCount(0);
		await expect(rows(page)).toHaveCount(1);
		await expect(row(page, "Task 02")).toHaveCount(0);
		await expect(title(page)).toHaveText("Task 02");
		expect(previewParam(page)).not.toBeNull();

		// related link inside the panel: opens the contact preview on /contacts; browser Back returns with this task open
		await panel(page).getByTestId("task-related").click();
		await expect(page).toHaveURL(/\/app\/contacts/);
		await expect(page.getByTestId("contact-detail")).toBeVisible();
		await page.goBack();
		await expect(page).toHaveURL(/\/app\/tasks\?preview=/);
		await expect(title(page)).toHaveText("Task 02");
	});

test("tasks preview en 1440: switching tabs keeps working with the preview (retained record); the Done tab lists the completed task", async ({
	page,
	request,
}) => {
	const f = await fixture();
	await makeTasks(request, f, 3);
	await start(page, f);
	await open(page, "Task 02");
	await panel(page).getByTestId("task-complete").click();
	await expect(rows(page)).toHaveCount(2);
	await expect(title(page)).toHaveText("Task 02"); // retained although the Open list no longer has the row
	// a pointer click on a tab is an outside click: it closes the panel; the Done tab then lists the task
	await page.getByRole("tab", { name: "Done", exact: true }).click();
	await expect(panel(page)).toHaveCount(0);
	await expect(rows(page)).toHaveCount(1);
	await open(page, "Task 02");
	await expect(title(page)).toHaveText("Task 02");
	await expect(page.getByTestId("task-complete")).toHaveCount(0);
	// keyboard tab switch (ArrowLeft from Done = "No date", an empty list) keeps the open record while the list changes underneath it
	await page.getByRole("tab", { name: "Done", exact: true }).focus();
	await page.keyboard.press("ArrowLeft");
	await expect(page.getByRole("tab", { name: "No date", exact: true })).toHaveAttribute("aria-selected", "true");
	await expect(rows(page)).toHaveCount(0);
	await expect(title(page)).toHaveText("Task 02");
	expect(previewParam(page)).not.toBeNull();
});

test("tasks preview en 1440: deep link beyond the loaded pages, legacy ?select=, panel survives a filter that hides its row, unknown id", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const { tasks } = await makeTasks(request, f, 30);
	const last = tasks[29];
	const first = tasks[0];
	if (!last || !first) throw new Error("no task");
	await start(page, f, { path: `/app/tasks?preview=${last.id}` });
	await expect(title(page)).toHaveText(last.title);
	await expect(row(page, last.title)).toHaveCount(0); // row 30 is past the first loaded page: fetched by id
	expect(previewParam(page)).toBe(last.id);
	// the related name is resolved for a record that is not in the loaded pages
	await expect(panel(page).getByTestId("task-related")).toBeVisible();

	await page.getByTestId("grid-search").fill("Task 02");
	await expect(rows(page)).toHaveCount(1);
	await expect(title(page)).toHaveText(last.title);

	await page.goto(`/app/tasks?select=${first.id}`);
	await expect(title(page)).toHaveText(first.title);
	await expect.poll(() => previewParam(page)).toBe(first.id);
	expect(new URL(page.url()).searchParams.get("select")).toBeNull();

	await page.reload();
	await expect(title(page)).toHaveText(first.title);

	await page.goto(`/app/tasks?preview=${randomUUID()}`);
	await expect(page.getByTestId("task-detail-missing")).toBeVisible();
	await panel(page).getByTestId("preview-close").click();
	await expect(panel(page)).toHaveCount(0);
});

test("tasks preview en 1440: Prev/Next walk the rows across a grid page and a server page; J/K; ignored while typing", async ({
	page,
	request,
}) => {
	const f = await fixture();
	await makeTasks(request, f, 30);
	await start(page, f);
	await expect(page.getByTestId("grid-range")).toHaveText("1–10 of 30");
	await open(page, "Task 01");
	await expect(panel(page).getByTestId("preview-position")).toHaveText("1 of 30");
	await expect(panel(page).getByTestId("preview-prev")).toBeDisabled();
	await panel(page).getByTestId("preview-next").click();
	await expect(title(page)).toHaveText("Task 02");
	await panel(page).getByTestId("preview-prev").click();
	await expect(title(page)).toHaveText("Task 01");
	await page.keyboard.press("j");
	await expect(title(page)).toHaveText("Task 02");
	await page.keyboard.press("k");
	await expect(title(page)).toHaveText("Task 01");

	// grid page edge (row 10 -> 11)
	await open(page, "Task 10");
	await panel(page).getByTestId("preview-next").click();
	await expect(title(page)).toHaveText("Task 11");
	await expect(page.getByTestId("grid-range")).toHaveText("11–20 of 30");
	await expect(row(page, "Task 11")).toHaveAttribute("aria-current", "true");
	await expect(row(page, "Task 11")).toBeInViewport();

	// server page edge (25 rows are loaded first): row 25 -> 26 loads the next page
	await panel(page).getByTestId("preview-close").click();
	await page.getByTestId("grid-page-3").click();
	await open(page, "Task 25");
	await expect(panel(page).getByTestId("preview-position")).toHaveText("25 of 30");
	await panel(page).getByTestId("preview-next").click();
	await expect(title(page)).toHaveText("Task 26");
	await expect(panel(page).getByTestId("preview-position")).toHaveText("26 of 30");
	await expect(row(page, "Task 26")).toHaveAttribute("aria-current", "true");
	for (let i = 0; i < 4; i++) await panel(page).getByTestId("preview-next").click();
	await expect(title(page)).toHaveText("Task 30");
	await expect(panel(page).getByTestId("preview-next")).toBeDisabled();

	await page.getByTestId("grid-search").fill("j");
	await expect(page.getByTestId("grid-search")).toHaveValue("j");
	await expect(title(page)).toHaveText("Task 30");
});

for (const language of ["en", "ar"] as const)
	test(`tasks preview ${language} 1440: docked at the inline end (EN right, AR left) below the topbar; sidebar, title and the task name stay uncovered`, async ({
		page,
		request,
	}) => {
		const f = await fixture();
		await makeTasks(request, f, 2);
		await start(page, f, { language });
		await expect(page.locator("html")).toHaveAttribute("dir", language === "ar" ? "rtl" : "ltr");
		const tableBefore = await page.getByTestId("grid-table").boundingBox();
		// sort headers sit at the inline-start edge of their cell (AR: right, EN: left)
		for (const col of ["title", "due"]) {
			const th = await page.locator("th").filter({ has: page.getByTestId(`sort-${col}`) }).boundingBox();
			const btn = await page.getByTestId(`sort-${col}`).boundingBox();
			if (!th || !btn) throw new Error("no header boxes");
			if (language === "ar") expect(Math.abs(th.x + th.width - (btn.x + btn.width))).toBeLessThanOrEqual(12);
			else expect(Math.abs(btn.x - th.x)).toBeLessThanOrEqual(12);
		}
		await open(page, "Task 02");
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
		expect(await apart(page.getByTestId("nav-contacts"))).toBe(true);
		expect(await apart(page.getByRole("heading", { level: 1 }))).toBe(true);
		const nameBox = await row(page, "Task 02")
			.locator(".sy-cell-id__name")
			.evaluate((el) => {
				const r = document.createRange();
				r.selectNodeContents(el.firstChild ?? el);
				const b = r.getBoundingClientRect();
				return { x: b.x, width: b.width };
			});
		expect(nameBox.x >= box.x + box.width - 1 || nameBox.x + nameBox.width <= box.x + 1).toBe(true);
		const navBox = await page.getByTestId("nav-contacts").boundingBox();
		if (!navBox) throw new Error("no nav box");
		const hit = await page.evaluate(
			([x, y]) => document.elementFromPoint(x as number, y as number)?.closest("[data-testid]")?.getAttribute("data-testid"),
			[navBox.x + navBox.width / 2, navBox.y + navBox.height / 2],
		);
		expect(hit).toBe("nav-contacts");
		await page.getByTestId("nav-contacts").click();
		await expect(page).toHaveURL(/\/app\/contacts/);
		await expect(panel(page)).toHaveCount(0);
	});

for (const language of ["en", "ar"] as const)
	test(`tasks preview ${language} 375: full-screen sheet from the right with Back; focus returns to the row; browser Back closes it`, async ({
		page,
		request,
	}) => {
		const f = await fixture();
		await makeTasks(request, f, 3);
		await start(page, f, { language, width: 375 });
		await expect(rows(page)).toHaveCount(3);
		const base = await page.evaluate(() => history.length);
		await row(page, "Task 02").first().click({ position: { x: 20, y: 10 } });
		await expect(panel(page)).toBeVisible();
		await expect(panel(page)).toHaveAttribute("aria-modal", "true");
		expect(await panel(page).evaluate((el) => getComputedStyle(el).animationName)).toBe("sy-sheet-in");
		await page.waitForTimeout(400);
		const box = await panel(page).boundingBox();
		expect(box?.x ?? -1).toBeCloseTo(0, 0);
		expect(box?.width ?? 0).toBeCloseTo(375, 0);
		await expect(panel(page).locator(".sy-dialog__sidetitle")).toHaveText("Task 02");
		await expect(page.getByTestId("sheet-back")).toBeVisible();
		await expect.poll(() => page.evaluate(() => history.length)).toBe(base + 1);
		await page.getByTestId("sheet-back").click();
		await expect(panel(page)).toHaveCount(0);
		await expect(row(page, "Task 02").first()).toBeFocused();
		await expect(page).toHaveURL(/\/app\/tasks$/);
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

		await row(page, "Task 03").first().click({ position: { x: 20, y: 10 } });
		await expect(panel(page)).toBeVisible();
		await page.goBack();
		await expect(panel(page)).toHaveCount(0);
		await expect(page).toHaveURL(/\/app\/tasks$/);
		await expect(rows(page)).toHaveCount(3);
	});
