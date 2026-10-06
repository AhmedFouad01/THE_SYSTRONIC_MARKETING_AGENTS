import { randomUUID } from "node:crypto";
import {
	type APIRequestContext,
	expect,
	type Locator,
	type Page,
	test,
} from "@playwright/test";
import pg from "pg";
import { seed } from "../scripts/seed.js";

process.loadEnvFile(".env");

// UX re-audit r2 regressions (UX-R2-01/02/03/05/06/07/08 + UX-01/11/12/15 residues). Synthetic fixture per test.
async function fixture() {
	const admin = new pg.Client({
		connectionString: process.env.ADMIN_DATABASE_URL,
	});
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

async function makeLead(
	request: APIRequestContext,
	f: Fixture,
	title: string,
	evidence = "synthetic",
	contact = `Contact ${title.slice(0, 20)}`,
) {
	const command_id = randomUUID();
	const res = await request.post("/v1/leads", {
		headers: headers(f, command_id),
		data: {
			command_id,
			title,
			source_evidence: evidence,
			contact: { display_name: contact },
		},
	});
	expect(res.status()).toBe(201);
	return (await res.json()).data as { id: string; contact_id: string };
}

async function makeTask(
	request: APIRequestContext,
	f: Fixture,
	contactId: string,
	title: string,
	dueMs: number,
) {
	const command_id = randomUUID();
	const res = await request.post("/v1/tasks", {
		headers: headers(f, command_id),
		data: {
			command_id,
			title,
			contact_id: contactId,
			due_at: new Date(dueMs).toISOString(),
		},
	});
	expect(res.status()).toBe(201);
}

async function makePipelineDeal(
	request: APIRequestContext,
	f: Fixture,
	title: string,
) {
	const lead = await makeLead(request, f, `L ${title}`);
	let command_id = randomUUID();
	const pr = await request.post("/v1/pipelines", {
		headers: headers(f, command_id),
		data: {
			command_id,
			name: "Flow",
			stages: [{ name: "New" }, { name: "Won", outcome: "won" }],
			transitions: [[0, 1]],
		},
	});
	expect(pr.status()).toBe(201);
	const pid = (await pr.json()).data.id as string;
	const list = (
		await (await request.get("/v1/pipelines", { headers: headers(f) })).json()
	).data as Array<{ id: string; stages: Array<{ id: string; name: string }> }>;
	const stage = list
		.find((p) => p.id === pid)
		?.stages.find((s) => s.name === "New");
	command_id = randomUUID();
	const res = await request.post("/v1/deals", {
		headers: headers(f, command_id),
		data: {
			command_id,
			contact_id: lead.contact_id,
			pipeline_id: pid,
			stage_id: stage?.id,
			title,
			amount_minor: 29690000,
			currency: "EGP",
		},
	});
	expect(res.status()).toBe(201);
}

async function open(
	page: Page,
	f: Fixture,
	language: "ar" | "en",
	path: string,
) {
	await page.addInitScript(
		(l) => localStorage.setItem("sy.locale", l),
		language,
	);
	await page.goto(path);
	await page.locator("input[name=token]").fill(f.tokens.manager);
	await page.locator("input[name=tenant]").fill(f.ids.a);
	await page.getByTestId("connect-submit").click();
	await expect(page.getByTestId("actor")).toBeVisible();
}

const rows = (page: Page) => page.getByTestId("grid-row");
const DAY = 24 * 3_600_000;

const LONG_MIXED_LATIN =
	"Kitchen inquiry for the Haddad family villa renovation phase two with joinery متابعة";
const LONG_MIXED_ARABIC =
	"استفسار مطبخ عائلة حداد لتجديد الفيلا المرحلة الثانية مع النجارة Kitchen";

/** True when the START of the element's logical text is visible (clip + ellipsis fall on the end of the string). */
async function startIsVisible(el: Locator) {
	return el.evaluate((node) => {
		const box = node.getBoundingClientRect();
		const text = node.firstChild;
		if (!text) return false;
		const range = document.createRange();
		range.setStart(text, 0);
		range.setEnd(text, 1);
		const first = range.getBoundingClientRect();
		const rtl = getComputedStyle(node).direction === "rtl";
		return rtl ? first.right <= box.right + 1 : first.left >= box.left - 1;
	});
}

test("R2-01/02 leads en 1440: title column keeps >=240px and nothing overflows the grid; mixed text clips at its logical end", async ({
	page,
	request,
}) => {
	const f = await fixture();
	await makeLead(request, f, LONG_MIXED_LATIN);
	await makeLead(request, f, LONG_MIXED_ARABIC);
	await page.setViewportSize({ width: 1440, height: 900 });
	await open(page, f, "en", "/app/leads");
	await expect(rows(page)).toHaveCount(2);
	const scroll = page.locator(".sy-grid__scroll");
	const fits = await scroll.evaluate((n) => n.scrollWidth <= n.clientWidth + 1);
	expect(fits).toBe(true);
	const names = page.locator(".sy-cell-id__name .sy-bidi-text");
	for (let i = 0; i < 2; i++) {
		const box = await names.nth(i).boundingBox();
		expect(box?.width ?? 0).toBeGreaterThanOrEqual(240 - 20);
		expect(await startIsVisible(names.nth(i))).toBe(true);
	}
	// Directions follow the content, not the page.
	const dirs = await names.evaluateAll((els) =>
		els.map((e) => getComputedStyle(e).direction),
	);
	expect([...dirs].sort()).toEqual(["ltr", "rtl"]);
});

test("R2-02 leads ar 1440: a Latin title in the Arabic UI keeps its head (ellipsis at the end), also on 375 cards", async ({
	page,
	request,
}) => {
	const f = await fixture();
	await makeLead(request, f, LONG_MIXED_LATIN);
	await page.setViewportSize({ width: 1440, height: 900 });
	await open(page, f, "ar", "/app/leads");
	const name = page.locator(".sy-cell-id__name .sy-bidi-text").first();
	await expect(name).toBeVisible();
	expect(await name.evaluate((n) => n.scrollWidth > n.clientWidth)).toBe(true);
	expect(await name.evaluate((n) => getComputedStyle(n).direction)).toBe("ltr");
	expect(await startIsVisible(name)).toBe(true);
	await page.setViewportSize({ width: 375, height: 800 });
	const card = page.locator(".sy-cell-id__name .sy-bidi-text").first();
	await expect(card).toBeVisible();
	expect(await startIsVisible(card)).toBe(true);
});

for (const width of [1440, 1280])
	test(`R2-03 tasks en ${width}: Complete + Owner inside the grid, no horizontal overflow`, async ({
		page,
		request,
	}) => {
		const f = await fixture();
		const lead = await makeLead(
			request,
			f,
			"Tasks width",
			"synthetic",
			"Alex Carter",
		);
		for (let i = 1; i <= 3; i++)
			await makeTask(
				request,
				f,
				lead.contact_id,
				`Call back Alex Carter about the kitchen quote ${i}`,
				Date.now() - i * DAY,
			);
		await page.setViewportSize({ width, height: 900 });
		await open(page, f, "en", "/app/tasks");
		await expect(rows(page)).toHaveCount(3);
		const scroll = page.locator(".sy-grid__scroll");
		const sbox = await scroll.boundingBox();
		const cbox = await rows(page)
			.first()
			.getByTestId("row-complete")
			.boundingBox();
		expect(sbox && cbox).toBeTruthy();
		expect((cbox?.x ?? 0) + (cbox?.width ?? 0)).toBeLessThanOrEqual(
			(sbox?.x ?? 0) + (sbox?.width ?? 0) + 0.5,
		);
		expect((cbox?.x ?? 0) + (cbox?.width ?? 0)).toBeLessThanOrEqual(width);
		expect(
			await scroll.evaluate((n) => n.scrollWidth <= n.clientWidth + 1),
		).toBe(true);
		// Owner column visible and not clipped to an ellipsis.
		const owner = rows(page).first().locator("td").nth(4);
		await expect(owner).toBeVisible();
		expect(
			await owner
				.locator(".sy-bidi-text")
				.evaluate((n) => n.scrollWidth <= n.clientWidth + 1),
		).toBe(true);
		const title = await rows(page)
			.first()
			.locator(".sy-cell-id__name")
			.boundingBox();
		expect(title?.width ?? 0).toBeGreaterThanOrEqual(220);
	});

test("R2-06 tasks en 375: card shows the due line (no stray placeholder) and a labelled Complete", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const lead = await makeLead(request, f, "Card", "synthetic", "Alex Carter");
	await makeTask(
		request,
		f,
		lead.contact_id,
		"Call back Alex Carter",
		Date.now() - DAY,
	);
	await page.setViewportSize({ width: 375, height: 800 });
	await open(page, f, "en", "/app/tasks");
	const row = rows(page).first();
	await expect(row).toBeVisible();
	const due = row.locator('td[data-mobile="meta"]').first();
	await expect(due).toContainText("Overdue");
	expect(await due.evaluate((n) => n.scrollWidth <= n.clientWidth + 1)).toBe(
		true,
	);
	expect((await due.textContent()) ?? "").not.toContain("…");
	const complete = row.getByTestId("row-complete");
	await expect(complete).toContainText("Complete");
	const cbox = await complete.boundingBox();
	expect((cbox?.x ?? 0) + (cbox?.width ?? 0)).toBeLessThanOrEqual(375);
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= innerWidth,
		),
	).toBe(true);
});

test("R2-05 deals ar: money is one RTL isolate; the symbol has no trailing period (see mvp-ux-r3 for rendered edge)", async ({
	page,
	request,
}) => {
	const f = await fixture();
	await makePipelineDeal(request, f, "Money deal");
	await page.setViewportSize({ width: 1440, height: 900 });
	await open(page, f, "ar", "/app/deals");
	const money = page.locator("tbody bdi.sy-money").first();
	await expect(money).toBeVisible();
	expect(await money.getAttribute("dir")).toBe("rtl");
	const text = (await money.textContent()) ?? "";
	// a lone zero amount is the legible Western "0" (UX-R3-03); every other amount is Arabic-Indic
	expect(text.replace(/[‎‏ \s]/g, "")).toMatch(/^(?:[٠-٩٬٫]+|0)ج\.م$/);
});

test("R2-07 reporting ar: meta is three short lines and KPI values use Western digits", async ({
	page,
	request,
}) => {
	const f = await fixture();
	await makeLead(request, f, "Reporting seed");
	await page.setViewportSize({ width: 1440, height: 900 });
	await open(page, f, "ar", "/app/reporting");
	// UX-18: provenance now sits in a collapsed "About this calculation" block
	await page.getByTestId("report-about").locator("summary").click();
	const meta = page.getByTestId("report-meta");
	await expect(meta).toBeVisible();
	await expect(meta.locator(".sy-rep__meta-line")).toHaveCount(3);
	const kpis = page.getByTestId("report-kpis");
	// Money KPIs now share the Dashboard's locale money display; ratio/count KPIs keep Western digits.
	const values = await kpis
		.locator(
			'[data-testid="kpi-roas"] .sy-kpi__value, [data-testid="kpi-conversions"] .sy-kpi__value, [data-testid="kpi-unattributed"] .sy-kpi__value',
		)
		.allTextContents();
	expect(values.length).toBe(3);
	for (const v of values) expect(v).not.toMatch(/[٠-٩]/);
});

test("R2-08 lead edit en: Cancel lives in the sticky footer, Esc leaves edit mode", async ({
	page,
	request,
}) => {
	const f = await fixture();
	await makeLead(request, f, "Edit me");
	await page.setViewportSize({ width: 1440, height: 900 });
	await open(page, f, "en", "/app/leads");
	// UI R4 C: nothing opens by itself; the row opens the preview slide-over.
	await rows(page).first().locator(".sy-cell-id").click();
	const panel = page.getByTestId("lead-detail");
	await expect(panel).toBeVisible();
	await page.getByTestId("record-edit").click();
	await expect(page.getByTestId("record-editor")).toBeVisible();
	const cancel = page.getByTestId("record-edit-cancel");
	await expect(cancel).toBeVisible();
	await expect(
		panel.locator(".sy-record__actions").getByTestId("record-edit-cancel"),
	).toHaveCount(0);
	await expect(
		panel.locator(".sy-record__footer").getByTestId("record-edit-cancel"),
	).toHaveCount(1);
	// A dirty draft swaps the Cancel bar for the Save/Cancel footer, which still offers exactly one Cancel.
	await page.getByLabel("Title").fill("Edited title");
	await expect(page.getByTestId("record-footer")).toBeVisible();
	await expect(page.getByTestId("record-edit-cancel")).toHaveCount(1);
	await expect(
		panel.locator(".sy-record__footer").getByTestId("record-edit-cancel"),
	).toBeVisible();
	// Save + Cancel only: Cancel discards the draft and exits edit mode.
	await expect(page.getByTestId("record-discard")).toHaveCount(0);
	await expect(page.getByTestId("record-footer").getByRole("button")).toHaveCount(2);
	await page.getByTestId("record-edit-cancel").click();
	await expect(page.getByTestId("record-editor")).toHaveCount(0);
	await expect(page.getByTestId("record-footer")).toHaveCount(0);
	await expect(page.getByTestId("lead-detail-title")).not.toHaveText("Edited title");
	await page.getByTestId("record-edit").click();
	await expect(page.getByLabel("Title")).not.toHaveValue("Edited title");
	// Escape from inside a field leaves edit mode.
	await page.getByLabel("Title").focus();
	await page.keyboard.press("Escape");
	await expect(page.getByTestId("record-editor")).toHaveCount(0);
	await expect(page.getByTestId("record-edit")).toBeVisible();
	// Escape in an open Select closes only the list and keeps edit mode.
	await page.getByTestId("record-edit").click();
	await panel.getByRole("combobox").first().click(); // scoped: a click on a page-level control is an outside click and closes the slide-over
	await expect(page.getByRole("listbox")).toBeVisible();
	await page.keyboard.press("Escape");
	await expect(page.getByRole("listbox")).toHaveCount(0);
	await expect(page.getByTestId("record-editor")).toBeVisible();
});

test("UX-15 New task dialog: no native date input; the DatePicker grid is used", async ({
	page,
	request,
}) => {
	const f = await fixture();
	await makeLead(request, f, "Dialog seed");
	await page.setViewportSize({ width: 1440, height: 900 });
	await open(page, f, "en", "/app/tasks");
	await page.getByTestId("new-task").click();
	const dialog = page.getByTestId("new-task-dialog");
	await expect(dialog).toBeVisible();
	await expect(
		dialog.locator(
			'input[type="date"], input[type="datetime-local"], input[type="time"]',
		),
	).toHaveCount(0);
	const trigger = dialog.getByLabel("Due");
	await expect(trigger).toHaveAttribute("role", "combobox");
	await trigger.click();
	const panel = page.locator(".sy-date__panel");
	await expect(panel).toBeVisible();
	await expect(panel.locator("button.sy-date__day")).toHaveCount(42);
	await panel
		.locator("button.sy-date__day:not([data-outside])")
		.nth(14)
		.click();
	await panel.getByTestId("date-done").click();
	await expect(panel).toHaveCount(0);
	await expect(trigger).toHaveAttribute(
		"data-value",
		/^\d{4}-\d{2}-\d{2}T09:00$/,
	);
	// Escape closes the picker without closing the dialog.
	await trigger.click();
	await expect(panel).toBeVisible();
	await page.keyboard.press("Escape");
	await expect(panel).toHaveCount(0);
	await expect(dialog).toBeVisible();
});

test("UX-01 ar dates carry no Latin comma; UX-11/12 evidence + task source are labelled, never raw", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const lead = await makeLead(request, f, "Evidence", "referral");
	await makeTask(request, f, lead.contact_id, "Source check", Date.now() + DAY);
	await page.setViewportSize({ width: 1440, height: 900 });
	await open(page, f, "ar", "/app/leads");
	await rows(page).first().locator(".sy-cell-id").click();
	const facts = page.getByTestId("record-facts");
	await expect(facts).toBeVisible();
	const text = (await facts.textContent()) ?? "";
	expect(text).toContain("إحالة");
	expect(text.toLowerCase()).not.toContain("referral");
	expect(text).not.toContain(",");

	// AR: the panel docks at the left (inline end), so the sidebar navigation stays reachable while it is open
	await page.getByRole("link", { name: "مهامي" }).click();
	await expect(rows(page).first()).toBeVisible();
	await rows(page).first().locator(".sy-cell-id").click(); // no auto-open: the preview opens on demand
	const taskFacts =
		(await page.getByTestId("record-facts").textContent()) ?? "";
	expect(taskFacts).not.toContain(",");
	expect(taskFacts).not.toContain("غير مسجّل");
});

test("UX-11 en: source evidence 'referral' shows its label; unknown task source row is omitted", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const lead = await makeLead(request, f, "Evidence en", "referral");
	await makeTask(
		request,
		f,
		lead.contact_id,
		"Source check en",
		Date.now() + DAY,
	);
	await page.setViewportSize({ width: 1440, height: 900 });
	await open(page, f, "en", "/app/leads");
	await rows(page).first().locator(".sy-cell-id").click();
	const facts = page.getByTestId("record-facts");
	await expect(facts).toContainText("Referral");
	expect((await facts.textContent()) ?? "").not.toContain("referral");
	await page.getByRole("link", { name: "My tasks" }).click();
	await expect(rows(page).first()).toBeVisible();
	await rows(page).first().locator(".sy-cell-id").click(); // no auto-open: the preview opens on demand
	const taskFacts = page.getByTestId("record-facts");
	await expect(taskFacts).not.toContainText("Not recorded");
	await expect(taskFacts).not.toContainText("Source");
});
