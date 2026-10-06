import { randomUUID } from "node:crypto";
import { type APIRequestContext, expect, type Page, test } from "@playwright/test";
import pg from "pg";
import { seed } from "../scripts/seed.js";
import { pickLabel } from "./select-helper.js";

process.loadEnvFile(".env");

// UI R4 C, increment 1: the preview slide-over on Leads (shared PreviewPanel primitive).
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
	return (await res.json()).data as { id: string };
}

async function makeLeads(request: APIRequestContext, f: Fixture, n: number) {
	const out: Array<{ id: string; title: string }> = [];
	for (let i = 1; i <= n; i++) {
		const title = `Lead ${String(i).padStart(2, "0")}`;
		out.push({ id: (await makeLead(request, f, title)).id, title });
	}
	return out; // created oldest first; the grid lists newest first (last created = row 1)
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
	await page.goto(o.path ?? "/app/leads");
	await page.locator("input[name=token]").fill(f.tokens.manager);
	await page.locator("input[name=tenant]").fill(f.ids.a);
	await page.getByTestId("connect-submit").click();
	await expect(page.getByTestId("actor")).toBeVisible();
}

const rows = (page: Page) => page.getByTestId("grid-row");
const panel = (page: Page) => page.getByTestId("lead-detail");
const title = (page: Page) => page.getByTestId("lead-detail-title");
const row = (page: Page, name: string) => rows(page).filter({ hasText: name });
const open = (page: Page, name: string) => row(page, name).locator(".sy-cell-id").click();
const previewParam = (page: Page) => new URL(page.url()).searchParams.get("preview");

test("preview en 1440: open, table keeps its width, focus heading, Esc closes and returns focus to the row, URL follows", async ({
	page,
	request,
}) => {
	const f = await fixture();
	await makeLeads(request, f, 3);
	await start(page, f);
	await expect(rows(page)).toHaveCount(3);
	// no auto-open, no empty column, URL clean
	await expect(panel(page)).toHaveCount(0);
	expect(previewParam(page)).toBeNull();
	const before = await page.getByTestId("grid-table").boundingBox();

	await open(page, "Lead 02");
	await expect(panel(page)).toBeVisible();
	await expect(panel(page)).toHaveAttribute("role", "dialog");
	await expect(panel(page)).toHaveAttribute("aria-modal", "false");
	await expect(title(page)).toHaveText("Lead 02");
	await expect(panel(page).getByRole("heading")).toBeFocused();
	// the header carries the record name; "Lead details" stays the accessible name of the dialog
	await expect(panel(page).getByRole("heading")).toHaveText("Lead 02");
	await expect(panel(page)).toHaveAttribute("aria-label", "Lead details");
	await expect(row(page, "Lead 02")).toHaveAttribute("aria-current", "true");
	expect(previewParam(page)).not.toBeNull();
	const after = await page.getByTestId("grid-table").boundingBox();
	expect(after?.width).toBe(before?.width);
	// "Open full record" is not offered for Leads (decision D3)
	await expect(panel(page).getByRole("button", { name: /open full record/i })).toHaveCount(0);

	await page.keyboard.press("Escape");
	await expect(panel(page)).toHaveCount(0);
	await expect(row(page, "Lead 02")).toBeFocused();
	expect(previewParam(page)).toBeNull();

	// the close button works the same way and also returns focus to the row
	await open(page, "Lead 03");
	await panel(page).getByTestId("preview-close").click();
	await expect(panel(page)).toHaveCount(0);
	await expect(row(page, "Lead 03")).toBeFocused();
});

test("preview en 1440: outside click closes, a row click swaps in place, clicks in a Select list do not close", async ({
	page,
	request,
}) => {
	const f = await fixture();
	await makeLeads(request, f, 3);
	await start(page, f);
	await open(page, "Lead 01");
	await expect(title(page)).toHaveText("Lead 01");
	// another row swaps the record, the panel stays mounted
	await open(page, "Lead 02");
	await expect(title(page)).toHaveText("Lead 02");
	await expect(panel(page)).toHaveCount(1);

	// a Select list opened inside the editor is not "outside"
	await page.getByTestId("record-edit").click();
	await pickLabel(panel(page).getByRole("combobox", { name: "Status" }), "Qualified");
	await expect(panel(page)).toBeVisible();
	await page.getByTestId("record-edit-cancel").click();

	// the page header is outside the panel: closes
	await page.getByRole("heading", { level: 1 }).click();
	await expect(panel(page)).toHaveCount(0);
});

test("preview en 1440: Esc leaves edit first; unsaved changes ask before discarding; Esc then closes", async ({
	page,
	request,
}) => {
	const f = await fixture();
	await makeLeads(request, f, 2);
	await start(page, f);
	await open(page, "Lead 02");
	await page.getByTestId("record-edit").click();
	const input = panel(page).getByLabel("Title");
	await expect(input).toBeVisible();
	// clean form: first Esc cancels the edit, the panel stays
	await input.focus();
	await page.keyboard.press("Escape");
	await expect(panel(page).getByLabel("Title")).toHaveCount(0);
	await expect(panel(page)).toBeVisible();

	// dirty form: Esc asks; "Cancel" keeps editing and the draft
	await page.getByTestId("record-edit").click();
	await panel(page).getByLabel("Title").fill("Changed draft");
	await page.keyboard.press("Escape");
	const confirm = page.getByTestId("preview-discard-dialog");
	await expect(confirm).toBeVisible();
	await confirm.getByTestId("dialog-cancel").click();
	await expect(confirm).toHaveCount(0);
	await expect(panel(page).getByLabel("Title")).toHaveValue("Changed draft");
	// swapping rows with a dirty form asks as well; Discard proceeds
	await open(page, "Lead 01");
	await expect(confirm).toBeVisible();
	await confirm.getByTestId("dialog-confirm").click();
	await expect(title(page)).toHaveText("Lead 01");
	await expect(panel(page).getByLabel("Title")).toHaveCount(0);
});

for (const language of ["en", "ar"] as const)
	test(`preview ${language} 1440: a nested dialog and a Select inside the panel are positioned against the viewport and keep the panel open`, async ({
		page,
		request,
	}) => {
		const f = await fixture();
		await makeLeads(request, f, 2);
		await start(page, f, { language });
		await open(page, "Lead 02");
		await expect(panel(page)).toBeVisible();
		await page.waitForTimeout(350); // slide-in finished: no transform may remain on the panel
		expect(await panel(page).evaluate((el) => getComputedStyle(el).transform)).toBe("none");

		// Select inside the editor
		await page.getByTestId("record-edit").click();
		const trigger = panel(page).getByRole("combobox", { name: language === "ar" ? /الحالة/ : "Status" });
		await trigger.click();
		const list = page.getByRole("listbox");
		await expect(list).toBeVisible();
		const t = await trigger.boundingBox();
		const l = await list.boundingBox();
		if (!t || !l) throw new Error("no boxes");
		expect(l.x).toBeGreaterThanOrEqual(0);
		expect(l.x + l.width).toBeLessThanOrEqual(1440);
		// anchored to the trigger: directly below it (or flipped above), horizontally overlapping it
		const below = Math.abs(l.y - (t.y + t.height)) < 16;
		const above = Math.abs(l.y + l.height - t.y) < 16;
		expect(below || above).toBe(true);
		expect(l.x < t.x + t.width && l.x + l.width > t.x).toBe(true);
		await page.keyboard.press("Escape"); // closes the list only
		await expect(list).toHaveCount(0);
		await expect(panel(page)).toBeVisible();
		await page.getByTestId("record-edit-cancel").click();

		// Nested dialog (Add task) opened from the panel: centred on the viewport, Esc closes only it, focus returns
		await page.getByTestId("add-task").click();
		const dialog = page.getByTestId("new-task-dialog");
		await expect(dialog).toBeVisible();
		const d = await dialog.boundingBox();
		if (!d) throw new Error("no dialog box");
		expect(Math.abs(d.x + d.width / 2 - 720)).toBeLessThan(2);
		expect(d.y).toBeGreaterThanOrEqual(0);
		expect(d.y + d.height).toBeLessThanOrEqual(900);
		// a click on its scrim must not close the panel behind it
		await page.mouse.click(30, 450);
		await expect(panel(page)).toBeVisible();
		await dialog.focus(); // the scrim click moved focus to the page; Esc is handled on the dialog itself
		await page.keyboard.press("Escape");
		await expect(dialog).toHaveCount(0);
		await expect(panel(page)).toBeVisible();
		await expect(page.getByTestId("add-task")).toBeFocused();
	});

test("preview en 1440: deep link to a row beyond the loaded pages, legacy ?select=, panel survives a filter that hides its row", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const leads = await makeLeads(request, f, 30);
	const oldest = leads[0];
	if (!oldest) throw new Error("no lead");
	await start(page, f, { path: `/app/leads?preview=${oldest.id}` });
	await expect(title(page)).toHaveText(oldest.title);
	await expect(row(page, oldest.title)).toHaveCount(0); // not on the loaded first pages: it came from fetch-by-id
	expect(previewParam(page)).toBe(oldest.id);

	// a search that excludes the record keeps the panel (retained record)
	await page.getByTestId("grid-search").fill("Lead 30");
	await expect(rows(page)).toHaveCount(1);
	await expect(title(page)).toHaveText(oldest.title);

	// legacy hand-off param opens the same panel and is rewritten to ?preview=
	const second = leads[1];
	if (!second) throw new Error("no lead");
	await page.goto(`/app/leads?select=${second.id}`);
	await expect(title(page)).toHaveText(second.title);
	await expect.poll(() => previewParam(page)).toBe(second.id);
	expect(new URL(page.url()).searchParams.get("select")).toBeNull();

	// an unknown id shows an error state with Close, never a blank panel
	await page.goto(`/app/leads?preview=${randomUUID()}`);
	await expect(page.getByTestId("lead-detail-missing")).toBeVisible();
	await panel(page).getByTestId("preview-close").click();
	await expect(panel(page)).toHaveCount(0);
});

test("preview en 1440: Prev/Next walk the rows across a grid page and a server page; J/K and Alt+Arrows; ignored while typing", async ({
	page,
	request,
}) => {
	const f = await fixture();
	await makeLeads(request, f, 30);
	await start(page, f);
	await expect(page.getByTestId("grid-range")).toHaveText("1–10 of 30");
	await open(page, "Lead 30"); // row 1 (newest first)
	await expect(title(page)).toHaveText("Lead 30");
	await expect(panel(page).getByTestId("preview-position")).toHaveText("1 of 30");
	await expect(panel(page).getByTestId("preview-prev")).toBeDisabled();

	await panel(page).getByTestId("preview-next").click();
	await expect(title(page)).toHaveText("Lead 29");
	await expect(panel(page).getByTestId("preview-position")).toHaveText("2 of 30");
	await expect(panel(page).getByTestId("preview-prev")).toBeEnabled();
	await panel(page).getByTestId("preview-prev").click();
	await expect(title(page)).toHaveText("Lead 30");

	// J = next, K = previous (physical keys), Alt+ArrowDown/Up as well
	await page.keyboard.press("j");
	await expect(title(page)).toHaveText("Lead 29");
	await page.keyboard.press("k");
	await expect(title(page)).toHaveText("Lead 30");
	await page.keyboard.press("Alt+ArrowDown");
	await expect(title(page)).toHaveText("Lead 29");
	await page.keyboard.press("Alt+ArrowUp");
	await expect(title(page)).toHaveText("Lead 30");

	// crossing the grid page edge (row 10 -> 11): the grid switches page and shows the row
	await open(page, "Lead 21"); // row 10
	await expect(panel(page).getByTestId("preview-position")).toHaveText("10 of 30");
	await panel(page).getByTestId("preview-next").click();
	await expect(title(page)).toHaveText("Lead 20");
	await expect(page.getByTestId("grid-range")).toHaveText("11–20 of 30");
	await expect(row(page, "Lead 20")).toHaveAttribute("aria-current", "true");
	await expect(row(page, "Lead 20")).toBeInViewport();

	// crossing the server page edge (25 rows are loaded first): row 25 -> 26 loads the next page
	await panel(page).getByTestId("preview-close").click();
	await page.getByTestId("grid-page-3").click();
	await open(page, "Lead 06"); // row 25 is the 5th row of page 3
	await expect(panel(page).getByTestId("preview-position")).toHaveText("25 of 30");
	await panel(page).getByTestId("preview-next").click();
	await expect(title(page)).toHaveText("Lead 05");
	await expect(panel(page).getByTestId("preview-position")).toHaveText("26 of 30");
	await expect(row(page, "Lead 05")).toHaveAttribute("aria-current", "true");

	// the true end: Next is disabled
	for (let i = 0; i < 4; i++) await panel(page).getByTestId("preview-next").click();
	await expect(title(page)).toHaveText("Lead 01");
	await expect(panel(page).getByTestId("preview-next")).toBeDisabled();

	// typing "j" in the search box must not step
	await page.getByTestId("grid-search").fill("j");
	await expect(page.getByTestId("grid-search")).toHaveValue("j");
	await expect(title(page)).toHaveText("Lead 01");
});

for (const language of ["en", "ar"] as const)
	test(`preview ${language} 1440: docked at the inline end (EN right edge = viewport right, AR left edge = 0) below the topbar; table, sidebar, title and names stay uncovered`, async ({
		page,
		request,
	}) => {
		const f = await fixture();
		await makeLeads(request, f, 2);
		await start(page, f, { language });
		await expect(page.locator("html")).toHaveAttribute("dir", language === "ar" ? "rtl" : "ltr");
		const tableBefore = await page.getByTestId("grid-table").boundingBox();
		await open(page, "Lead 02");
		await expect(panel(page)).toBeVisible();
		// slide direction follows the dock: from the right in EN (+X), from the left in AR (-X); never the other way
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
		expect(Math.abs(box.width - 432)).toBeLessThanOrEqual(1); // clamp(360px, 30vw, 440px) at 1440
		const tableAfter = await page.getByTestId("grid-table").boundingBox();
		expect(tableAfter?.width).toBe(tableBefore?.width);
		expect(tableAfter?.x).toBe(tableBefore?.x);
		// nothing important is under the panel: sidebar nav, page title, the lead-name cell of the open row
		const apart = async (loc: ReturnType<typeof page.locator>) => {
			const b = await loc.boundingBox();
			if (!b) throw new Error("no box");
			return b.x >= box.x + box.width - 1 || b.x + b.width <= box.x + 1;
		};
		expect(await apart(page.getByTestId("nav-tasks"))).toBe(true);
		expect(await apart(page.getByRole("heading", { level: 1 }))).toBe(true);
		expect(await apart(row(page, "Lead 02").locator(".sy-cell-id"))).toBe(true);
		// the sidebar link really receives the click (the old AR right dock covered it)
		const navBox = await page.getByTestId("nav-tasks").boundingBox();
		if (!navBox) throw new Error("no nav box");
		const hit = await page.evaluate(
			([x, y]) => document.elementFromPoint(x as number, y as number)?.closest("[data-testid]")?.getAttribute("data-testid"),
			[navBox.x + navBox.width / 2, navBox.y + navBox.height / 2],
		);
		expect(hit).toBe("nav-tasks");
		// topbar stays reachable above the panel; the animation left nothing that re-bases fixed children
		const topbar = await page.locator(".sy-topbar").boundingBox();
		expect((topbar?.y ?? 99) + (topbar?.height ?? 0)).toBeLessThanOrEqual(box.y + 1);
		const style = await panel(page).evaluate((el) => {
			const s = getComputedStyle(el);
			return { transform: s.transform, willChange: s.willChange, filter: s.filter, backdrop: s.backdropFilter };
		});
		expect(style).toEqual({ transform: "none", willChange: "auto", filter: "none", backdrop: "none" });
		// content follows the UI direction
		expect(await panel(page).evaluate((el) => getComputedStyle(el).direction)).toBe(language === "ar" ? "rtl" : "ltr");
	});

for (const width of [1440, 1100])
	for (const language of ["en", "ar"] as const)
		test(`shell ${language} ${width}: the sidebar brand block is as tall as the topbar`, async ({ page, request }) => {
			const f = await fixture();
			await makeLeads(request, f, 1);
			await start(page, f, { language, width });
			const brand = await page.locator(".sy-brand").first().boundingBox();
			const topbar = await page.locator(".sy-topbar").boundingBox();
			expect(Math.abs((brand?.height ?? 0) - 56)).toBeLessThanOrEqual(1);
			expect(Math.abs((brand?.y ?? 99) - (topbar?.y ?? 0))).toBeLessThanOrEqual(1);
		});

for (const language of ["en", "ar"] as const)
	test(`preview ${language} 375: full-screen sheet from the right with back button, focus returns to the row`, async ({
		page,
		request,
	}) => {
		const f = await fixture();
		await makeLeads(request, f, 2);
		await start(page, f, { language, width: 375 });
		await rows(page).filter({ hasText: "Lead 02" }).first().click({ position: { x: 20, y: 10 } });
		await expect(panel(page)).toBeVisible();
		await expect(panel(page)).toHaveAttribute("aria-modal", "true");
		// same slide-in keyframes in EN and AR (no RTL from-left override for the preview sheet)
		expect(await panel(page).evaluate((el) => getComputedStyle(el).animationName)).toBe("sy-sheet-in");
		await page.waitForTimeout(400);
		const box = await panel(page).boundingBox();
		expect(box?.x).toBe(0);
		expect(box?.width).toBe(375);
		expect((box?.x ?? 0) + (box?.width ?? 0)).toBe(375); // right edge = viewport right edge in both languages
		// the header carries the record name
		await expect(panel(page).locator(".sy-dialog__sidetitle")).toHaveText("Lead 02");
		await expect(page.getByTestId("sheet-back")).toBeVisible();
		await page.getByTestId("sheet-back").click();
		await expect(panel(page)).toHaveCount(0);
		await expect(rows(page).filter({ hasText: "Lead 02" }).first()).toBeFocused();
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
	});

for (const language of ["en", "ar"] as const)
	for (const theme of ["light", "dark"] as const)
		test(`preview ${language} ${theme} 1440: renders with a visible left-cast edge`, async ({ page, request }) => {
			const f = await fixture();
			await makeLeads(request, f, 2);
			await start(page, f, { language, theme });
			await open(page, "Lead 02");
			await expect(panel(page)).toBeVisible();
			await page.waitForTimeout(350);
			const s = await panel(page).evaluate((el) => {
				const c = getComputedStyle(el);
				return { shadow: c.boxShadow, border: c.borderInlineStartWidth, bg: c.backgroundColor };
			});
			// 1px hairline on the content-facing edge; shadow cast toward the content (left in EN, right in AR)
			expect(s.border).toBe("1px");
			expect(s.shadow).toMatch(language === "ar" ? /(?<!-)(12|16)px 0px (32|40)px/ : /-(12|16)px 0px (32|40)px/);
			if (theme === "dark") expect(s.shadow).toMatch(/0\.6\)/);
			expect(s.bg).not.toBe("rgba(0, 0, 0, 0)");
		});

for (const language of ["en", "ar"] as const)
	test(`preview ${language} 1440: a toast does not cover the panel footer (offset by the panel width)`, async ({ page, request }) => {
		const f = await fixture();
		await makeLeads(request, f, 2);
		await start(page, f, { language });
		await open(page, "Lead 02");
		await page.getByTestId("record-edit").click();
		await panel(page).locator("input[name=title]").fill("Saved while open");
		await page.getByTestId("lead-save").click();
		const toast = page.getByTestId("toast").first();
		await expect(toast).toBeVisible();
		const t = await toast.boundingBox();
		const p = await panel(page).boundingBox();
		if (!t || !p) throw new Error("no boxes");
		if (language === "ar") expect(t.x).toBeGreaterThanOrEqual(p.x + p.width - 1);
		else expect(t.x + t.width).toBeLessThanOrEqual(p.x + 1);
	});

for (const language of ["en", "ar"] as const)
	test(`preview ${language} 1440: the Columns popover is not painted over by the panel and the panel exits with an animation`, async ({
		page,
		request,
	}) => {
		const f = await fixture();
		await makeLeads(request, f, 2);
		await start(page, f, { language });
		await open(page, "Lead 02");
		await expect(panel(page)).toBeVisible();
		await page.waitForTimeout(300);
		// keyboard open: a pointer click on a page control is an "outside click" and would close the slide-over first
		await page.getByTestId("grid-columns").focus();
		await page.keyboard.press("Enter");
		const pop = page.locator(".sy-popover").first();
		await expect(pop).toBeVisible();
		const b = await pop.boundingBox();
		if (!b) throw new Error("no popover box");
		const hit = await page.evaluate(
			([x, y]) => !!document.elementFromPoint(x as number, y as number)?.closest(".sy-popover"),
			[b.x + b.width / 2, b.y + 20],
		);
		expect(hit).toBe(true); // nothing (the panel included) paints over the menu
		await page.keyboard.press("Escape");
		await expect(pop).toHaveCount(0);

		// exit: a non-interactive ghost plays the exit keyframes, then is gone (no pop-out)
		await panel(page).getByTestId("preview-close").click();
		await expect(panel(page)).toHaveCount(0);
		await expect(page.locator(".sy-preview.sy-ghost")).toHaveCount(1);
		await expect(page.locator(".sy-preview.sy-ghost")).toHaveCount(0, { timeout: 2000 });
	});

for (const language of ["en", "ar"] as const)
	test(`preview ${language} 375: browser Back closes the sheet and keeps the list; closing with the button leaves no stale history entry`, async ({
		page,
		request,
	}) => {
		const f = await fixture();
		await makeLeads(request, f, 3);
		await start(page, f, { language, width: 375 });
		await expect(rows(page)).toHaveCount(3);
		const base = await page.evaluate(() => history.length);
		await rows(page).filter({ hasText: "Lead 02" }).first().click({ position: { x: 20, y: 10 } });
		await expect(panel(page)).toBeVisible();
		await expect.poll(() => page.evaluate(() => history.length)).toBe(base + 1);
		await page.goBack();
		await expect(panel(page)).toHaveCount(0);
		await expect(page).toHaveURL(/\/app\/leads$/);
		await expect(rows(page)).toHaveCount(3);

		// button close: the pushed entry is popped again (Back from the list does not land on a stale sheet entry)
		await rows(page).filter({ hasText: "Lead 02" }).first().click({ position: { x: 20, y: 10 } });
		await expect(panel(page)).toBeVisible();
		await expect.poll(() => page.evaluate(() => history.length)).toBe(base + 1);
		await page.getByTestId("sheet-back").click();
		await expect(panel(page)).toHaveCount(0);
		await expect(page).toHaveURL(/\/app\/leads$/);
		await expect(rows(page)).toHaveCount(3);
		// the entry we are on is the list itself, not a leftover sheet entry
		await expect.poll(() => page.evaluate(() => history.state?.syPreviewSheet === true)).toBe(false);
	});
