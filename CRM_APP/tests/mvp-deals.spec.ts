import { randomUUID } from "node:crypto";
import {
	type APIRequestContext,
	expect,
	type Page,
	test,
} from "@playwright/test";
import pg from "pg";
import { seed } from "../scripts/seed.js";
import { pickDay, pickValue } from "./select-helper.js";

// Money follows the locale (Intl currency): Arabic shows the Egyptian pound symbol, not the ISO code.
const egp = (language: "ar" | "en") => (language === "ar" ? "ج.م" : "EGP");

process.loadEnvFile(".env");

// Seeds a synthetic fixture per test. Credentials stay in memory; never logged or asserted by value.
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

type Stage = { id: string; name: string };
type Pipe = { id: string; stages: Stage[] };

// New -> Qualified -> Won | Lost; New -> Lost. New -> Won is NOT an allowed edge.
async function makePipeline(
	request: APIRequestContext,
	f: Fixture,
): Promise<Pipe> {
	const command_id = randomUUID();
	const res = await request.post("/v1/pipelines", {
		headers: headers(f, command_id),
		data: {
			command_id,
			name: "Sales flow",
			stages: [
				{ name: "New" },
				{ name: "Qualified" },
				{ name: "Won", outcome: "won" },
				{ name: "Lost", outcome: "lost" },
			],
			transitions: [
				[0, 1],
				[0, 3],
				[1, 2],
				[1, 3],
			],
		},
	});
	expect(res.status()).toBe(201);
	const id = (await res.json()).data.id as string;
	const list = (
		await (await request.get("/v1/pipelines", { headers: headers(f) })).json()
	).data as Pipe[];
	const p = list.find((x) => x.id === id);
	if (!p) throw new Error("pipeline not listed");
	p.stages.sort(
		(a, b) =>
			["New", "Qualified", "Won", "Lost"].indexOf(a.name) -
			["New", "Qualified", "Won", "Lost"].indexOf(b.name),
	);
	return p;
}

async function makeLead(request: APIRequestContext, f: Fixture, title: string) {
	const command_id = randomUUID();
	const res = await request.post("/v1/leads", {
		headers: headers(f, command_id),
		data: {
			command_id,
			title,
			source_evidence: "synthetic",
			contact: { display_name: `Contact ${title}` },
		},
	});
	expect(res.status()).toBe(201);
	return (await res.json()).data as { id: string; contact_id: string };
}

async function makeDeal(
	request: APIRequestContext,
	f: Fixture,
	p: Pipe,
	title: string,
	amount_minor = 150000,
	currency = "EGP",
) {
	const lead = await makeLead(request, f, `L ${title}`);
	const command_id = randomUUID();
	const res = await request.post("/v1/deals", {
		headers: headers(f, command_id),
		data: {
			command_id,
			contact_id: lead.contact_id,
			pipeline_id: p.id,
			stage_id: p.stages[0]?.id,
			title,
			amount_minor,
			currency,
		},
	});
	expect(res.status()).toBe(201);
	return (await res.json()).data as {
		id: string;
		version: number;
		contact_id: string;
	};
}

async function moveTo(
	request: APIRequestContext,
	f: Fixture,
	deal: { id: string; version: number },
	stageId: string | undefined,
) {
	const command_id = randomUUID();
	const res = await request.post(`/v1/deals/${deal.id}/transitions`, {
		headers: headers(f, command_id),
		data: {
			command_id,
			to_stage_id: stageId,
			expected_version: deal.version,
			reason: "",
		},
	});
	expect(res.status()).toBe(200);
	return { ...deal, version: deal.version + 1 };
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
const open = async (
	page: Page,
	f: Fixture,
	language: "ar" | "en",
	path = "/app/deals",
) => {
	await page.addInitScript(
		(l) => localStorage.setItem("sy.locale", l),
		language,
	);
	await page.goto(path);
	await connect(page, f.tokens.manager, f.ids.a);
};
const pick = (page: Page, text: string) =>
	rows(page)
		.filter({ hasText: text })
		.click({ position: { x: 10, y: 10 } });

for (const width of [360, 1280])
	for (const language of ["ar", "en"] as const)
		test(`deals ${language} ${width}px: list, search, money, detail, no page overflow`, async ({
			page,
			request,
		}) => {
			const f = await fixture();
			const p = await makePipeline(request, f);
			await makeDeal(request, f, p, "Alpha deal");
			await makeDeal(request, f, p, "Bravo deal");
			const errors: string[] = [];
			page.on("pageerror", (e) => errors.push(e.message));
			await page.setViewportSize({ width, height: 800 });
			await open(page, f, language);
			await expect(page.getByTestId("deals-view")).toBeVisible();
			await expect(page.locator("html")).toHaveAttribute(
				"dir",
				language === "ar" ? "rtl" : "ltr",
			);
			// seeded fixture deal + 2 created deals
			await expect(rows(page)).toHaveCount(3);
			await expect(rows(page).filter({ hasText: "Alpha deal" })).toContainText(egp(language));

			await page.getByTestId("grid-search").fill("bravo");
			await expect(rows(page)).toHaveCount(1);
			await page.getByTestId("grid-search").fill("");
			await expect(rows(page)).toHaveCount(3);

			await pick(page, "Alpha deal");
			await expect(page.getByTestId("deal-detail-title")).toHaveText(
				"Alpha deal",
			);
			await expect(page.getByTestId("deal-stage")).toHaveText("New");
			expect(await noPageOverflow(page)).toBe(true);
			expect(errors).toEqual([]);
		});

for (const language of ["ar", "en"] as const)
	test(`deals ${language}: create deal from lead keeps Lead->Contact->Deal context`, async ({
		page,
		request,
	}) => {
		const f = await fixture();
		await makePipeline(request, f);
		const lead = await makeLead(request, f, "Context lead");
		await open(page, f, language, "/app/leads");
		await pick(page, "Context lead");
		await page.getByTestId("lead-create-deal").click();

		await expect(page).toHaveURL(/\/app\/deals\?/);
		await expect(page.getByTestId("deal-context")).toBeVisible();
		await expect(page.getByTestId("context-lead")).toContainText(
			"Context lead",
		);
		await expect(page.getByTestId("context-contact")).toContainText(
			"Contact Context lead",
		);

		// dialog opens prefilled; the contact is locked to the context
		const dialog = page.getByTestId("new-deal-dialog");
		await expect(dialog).toBeVisible();
		await expect(dialog.locator("input[name=title]")).toHaveValue(
			"Context lead",
		);
		await expect(dialog.locator("[role=combobox][data-name=contact]")).toBeDisabled();
		await dialog.locator("input[name=amount]").fill("2500.50");
		await page.getByTestId("new-deal-submit").click();
		await expect(dialog).toHaveCount(0);

		// deal selected, strip shows the deal and links back
		await expect(page.getByTestId("deal-detail-title")).toHaveText(
			"Context lead",
		);
		await expect(page.getByTestId("context-deal")).toContainText(
			"Context lead",
		);
		await expect(rows(page).filter({ hasText: "Context lead" })).toHaveCount(1);
		const linked = await (
			await request.get("/v1/deals", { headers: headers(f) })
		).json();
		expect(
			(linked.data as Array<{ lead_id: string | null }>).some(
				(d) => d.lead_id === lead.id,
			),
		).toBe(true);

		await page.getByTestId("context-lead").locator("a").click();
		await expect(page).toHaveURL(/\/app\/leads\?select=/);
		await expect(page.getByTestId("lead-detail-title")).toHaveText(
			"Context lead",
		);
	});

test("deals en: contact detail Create deal carries a contact-only context", async ({
	page,
	request,
}) => {
	const f = await fixture();
	await makePipeline(request, f);
	await makeLead(request, f, "Only contact");
	await open(page, f, "en", "/app/contacts");
	await pick(page, "Contact Only contact");
	await page.getByTestId("contact-create-deal").click();
	await expect(page).toHaveURL(/\/app\/deals\?contact=/);
	await expect(page.getByTestId("context-lead")).toHaveCount(0);
	await expect(page.getByTestId("context-contact")).toContainText(
		"Contact Only contact",
	);
	await expect(page.getByTestId("new-deal-dialog")).toBeVisible();
	await page
		.getByTestId("new-deal-dialog")
		.locator("input[name=title]")
		.fill("From contact");
	await page.getByTestId("new-deal-submit").click();
	await expect(page.getByTestId("deal-detail-title")).toHaveText(
		"From contact",
	);
});

const steps = (page: Page) => page.getByTestId("deal-step");
const stepStates = (page: Page) =>
	steps(page).evaluateAll((els) =>
		els.map(
			(e) =>
				`${(e.textContent ?? "").replace(/(completed|current stage|upcoming|won|lost)$/i, "").trim()}:${e.getAttribute("data-state")}`,
		),
	);
const toast = (page: Page, text: string) =>
	page.getByTestId("toast").filter({ hasText: text });
const dayInput = (days: number) => {
	const d = new Date(Date.now() + days * 86_400_000);
	const p = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T09:00`;
};

for (const language of ["ar", "en"] as const)
	test(`deals ${language} 1440: record page has header, stepper, stats and tabs; list returns with Back`, async ({
		page,
		request,
	}) => {
		const f = await fixture();
		const p = await makePipeline(request, f);
		await makeDeal(request, f, p, "Record deal", 296900_00);
		const errors: string[] = [];
		page.on("pageerror", (e) => errors.push(e.message));
		await page.setViewportSize({ width: 1440, height: 900 });
		await open(page, f, language);
		// No auto-opened record: the list comes first.
		await expect(page.getByTestId("deal-detail")).toHaveCount(0);
		await pick(page, "Record deal");

		const record = page.getByTestId("deal-detail");
		await expect(record).toBeVisible();
		await expect(page.getByTestId("deal-sheet")).toHaveCount(0);
		await expect(record.locator("h1")).toHaveCount(1);
		await expect(page.getByTestId("deal-detail-title")).toHaveText(
			"Record deal",
		);
		await expect(record.locator(".sy-page-header__eyebrow")).toHaveText(
			language === "ar" ? "صفقة" : "Deal",
		);
		await expect(page.getByTestId("deal-detail-subtitle")).toContainText(
			"Contact L Record deal",
		);
		await expect(page.getByTestId("deal-detail-subtitle")).toContainText(
			"Sales flow",
		);
		// Stat cards: only real data (value, stage, progress, owner); no probability / expected close.
		await expect(
			page.getByTestId("deal-stats").locator(".sy-deals__stat"),
		).toHaveCount(4);
		await expect(page.getByTestId("deal-detail-value")).toContainText(
			egp(language),
		);
		await expect(page.getByTestId("deal-stat-owner")).toBeVisible();
		await expect(record).not.toContainText(
			/probability|expected close|الاحتمال|الإغلاق المتوقع/i,
		);
		// Header actions: New -> Won is not an edge, so no Mark won; Mark lost and the stage menu are offered.
		await expect(page.getByTestId("deal-mark-lost")).toBeVisible();
		await expect(page.getByTestId("deal-mark-won")).toHaveCount(0);
		await expect(page.getByTestId("stage-menu")).toBeVisible();
		// Tabs, in order.
		await expect(record.getByRole("tab")).toHaveCount(3);
		await expect(record.getByRole("tab").first()).toHaveAttribute(
			"aria-selected",
			"true",
		);
		await expect(page.getByTestId("deal-overview")).toBeVisible();
		// Technical ids stay out of the visible layer.
		await expect(record.locator(".sy-record__facts")).not.toContainText(
			/[0-9a-f]{8}-[0-9a-f]{4}-/,
		);
		expect(await noPageOverflow(page)).toBe(true);

		await page.getByTestId("deal-back").click();
		await expect(page.getByTestId("deal-detail")).toHaveCount(0);
		await expect(rows(page).filter({ hasText: "Record deal" })).toBeVisible();
		expect(errors).toEqual([]);
	});

test("deals en: stepper marks done, current and upcoming; terminal stages are handled", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const p = await makePipeline(request, f);
	await makeDeal(request, f, p, "Step deal");
	await page.setViewportSize({ width: 1440, height: 900 });
	await open(page, f, "en");
	await pick(page, "Step deal");

	// Lost is off the forward path: New -> Qualified -> Won.
	expect(await stepStates(page)).toEqual([
		"New:current",
		"Qualified:upcoming",
		"Won:upcoming",
	]);
	await expect(steps(page).nth(0)).toHaveAttribute("aria-current", "step");
	await expect(steps(page).nth(1)).not.toHaveAttribute("aria-current", "step");
	await expect(page.getByTestId("deal-stat-progress")).toContainText(
		"Step 1 of 3",
	);

	await page.getByTestId("stage-menu").click();
	await page.getByRole("menuitem", { name: "Qualified" }).click();
	await expect(toast(page, "Deal moved to Qualified.")).toBeVisible();
	await expect
		.poll(() => stepStates(page))
		.toEqual(["New:done", "Qualified:current", "Won:upcoming"]);
	await expect(steps(page).nth(0).locator("svg")).toHaveCount(1); // check mark on done
	await expect(steps(page).nth(1).locator("svg")).toHaveCount(0);
	await expect(page.getByTestId("deal-stat-progress")).toContainText(
		"Step 2 of 3",
	);

	// Qualified -> Won is an allowed edge: Mark won appears, the stage menu has nothing left to offer.
	await expect(page.getByTestId("deal-mark-won")).toBeVisible();
	await expect(page.getByTestId("stage-menu")).toHaveCount(0);
	await page.getByTestId("deal-mark-won").click();
	await expect(toast(page, "Deal moved to Won.")).toBeVisible();
	await expect
		.poll(() => stepStates(page))
		.toEqual(["New:done", "Qualified:done", "Won:won"]);
	await expect(page.getByTestId("deal-stage")).toHaveText("Won");
	await expect(page.getByTestId("stage-none")).toBeVisible();
	await expect(page.getByTestId("deal-mark-won")).toHaveCount(0);
	await expect(page.getByTestId("deal-mark-lost")).toHaveCount(0);
});

test("deals en: stage menu is keyboard operable and offers only the other allowed edges; activity lists entries", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const p = await makePipeline(request, f);
	await makeDeal(request, f, p, "Menu deal");
	await page.setViewportSize({ width: 1440, height: 900 });
	await open(page, f, "en");
	await pick(page, "Menu deal");
	await expect(page.getByTestId("deal-stage")).toHaveText("New");

	// New -> Won is not an edge; Lost is the Mark lost button, so the menu holds only Qualified.
	const trigger = page.getByTestId("stage-menu");
	await trigger.focus();
	await page.keyboard.press("ArrowDown");
	await expect(page.getByRole("menuitem")).toHaveText(["Qualified"]);
	await expect(page.getByRole("menuitem", { name: "Qualified" })).toBeFocused();
	await page.keyboard.press("Escape");
	await expect(page.getByRole("menu")).toHaveCount(0);
	await expect(trigger).toBeFocused();

	await page.keyboard.press("ArrowDown");
	await page.keyboard.press("Enter");
	await expect(page.getByTestId("deal-stage")).toHaveText("Qualified");
	await expect(page.getByTestId("deal-version")).toHaveText("1");

	await page.getByRole("tab", { name: "Activity" }).click();
	await expect(page.getByTestId("history-item")).toHaveCount(1);
	await expect(page.getByTestId("history-item").first()).toContainText(
		"New to Qualified",
	);
});

for (const language of ["ar", "en"] as const)
	test(`deals ${language}: tabs follow the keyboard model; Tasks lists the deal's tasks`, async ({
		page,
		request,
	}) => {
		const f = await fixture();
		const p = await makePipeline(request, f);
		const deal = await makeDeal(request, f, p, "Tab deal");
		const command_id = randomUUID();
		const created = await request.post("/v1/tasks", {
			headers: headers(f, command_id),
			data: {
				command_id,
				title: "Call the buyer",
				contact_id: deal.contact_id,
				deal_id: deal.id,
				due_at: new Date(Date.now() + 2 * 86_400_000).toISOString(),
			},
		});
		expect(created.status()).toBe(201);
		await page.setViewportSize({ width: 1440, height: 900 });
		await open(page, f, language);
		await pick(page, "Tab deal");

		const tabs = page.getByTestId("deal-detail").getByRole("tab");
		const next = language === "ar" ? "ArrowLeft" : "ArrowRight";
		const prev = language === "ar" ? "ArrowRight" : "ArrowLeft";
		await tabs.nth(0).focus();
		await page.keyboard.press(next);
		await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
		await expect(tabs.nth(1)).toBeFocused();
		await page.keyboard.press("End");
		await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "true");
		await expect(page.getByTestId("deal-task")).toHaveCount(1);
		await expect(page.getByTestId("deal-task")).toContainText("Call the buyer");
		await expect(page.getByTestId("add-task")).toBeVisible();
		await page.keyboard.press(prev);
		await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
		await page.keyboard.press("Home");
		await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
		await expect(page.getByTestId("deal-overview")).toBeVisible();
	});

test("deals en: Add task from the Tasks tab creates a linked task that shows in the list", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const p = await makePipeline(request, f);
	await makeDeal(request, f, p, "Task deal");
	await page.setViewportSize({ width: 1440, height: 900 });
	await open(page, f, "en");
	await pick(page, "Task deal");
	await page.getByRole("tab", { name: "Tasks" }).click();
	await expect(page.getByTestId("deal-tasks-empty")).toBeVisible();
	await page.getByTestId("add-task").click();
	const dialog = page.getByTestId("new-task-dialog");
	await dialog.getByLabel("Title").fill("Prepare contract");
	await pickDay(dialog.getByLabel("Due"), dayInput(2));
	await page.getByTestId("new-task-submit").click();
	await expect(dialog).toHaveCount(0);
	await expect(page.getByTestId("deal-task")).toContainText("Prepare contract");
	await expect(page.getByTestId("deal-tasks-empty")).toHaveCount(0);
});

test("deals en: Lost requires a reason via confirm dialog; terminal stage has no moves", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const p = await makePipeline(request, f);
	await makeDeal(request, f, p, "Lost deal");
	await page.setViewportSize({ width: 1440, height: 900 });
	await open(page, f, "en");
	await pick(page, "Lost deal");

	await page.getByTestId("deal-mark-lost").click();
	const dialog = page.getByTestId("lost-dialog");
	await expect(dialog).toBeVisible();
	await expect(dialog).toContainText("Mark deal as lost?");
	await dialog.getByRole("button", { name: "Mark lost" }).click();
	await expect(dialog).toContainText("Enter a reason.");
	await expect(dialog).toBeVisible();
	await expect(page.getByTestId("deal-stage")).toHaveText("New");

	// Cancel keeps the deal open and unchanged.
	await dialog.getByTestId("dialog-cancel").click();
	await expect(dialog).toHaveCount(0);
	await expect(page.getByTestId("deal-stage")).toHaveText("New");

	await page.getByTestId("deal-mark-lost").click();
	await dialog.locator("textarea[name=reason]").fill("Budget cut");
	await dialog.getByRole("button", { name: "Mark lost" }).click();
	await expect(dialog).toHaveCount(0);
	await expect(page.getByTestId("deal-stage")).toHaveText("Lost");
	await expect(page.getByTestId("stage-none")).toBeVisible();
	await expect(page.getByTestId("stage-menu")).toHaveCount(0);
	await expect(page.getByTestId("deal-mark-lost")).toHaveCount(0);
	// Lost deals keep the path upcoming and end with the lost step.
	expect(await stepStates(page)).toEqual([
		"New:upcoming",
		"Qualified:upcoming",
		"Won:upcoming",
		"Lost:lost",
	]);
	await expect(page.getByTestId("deal-stat-progress")).toHaveCount(0);

	await page.getByRole("tab", { name: "Activity" }).click();
	await expect(page.getByTestId("history-item").first()).toContainText(
		"Reason: Budget cut",
	);
});

test("deals en: stale Mark won and stale Mark lost show a 409 conflict and reload recovers", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const p = await makePipeline(request, f);
	const won = await makeDeal(request, f, p, "Stale won");
	const wonAtQualified = await moveTo(request, f, won, p.stages[1]?.id);
	const lost = await makeDeal(request, f, p, "Stale lost");
	const lostAtQualified = await moveTo(request, f, lost, p.stages[1]?.id);
	await page.setViewportSize({ width: 1440, height: 900 });
	await open(page, f, "en");

	// Stale Mark won: someone else already won it.
	await pick(page, "Stale won");
	await expect(page.getByTestId("deal-stage")).toHaveText("Qualified");
	await moveTo(request, f, wonAtQualified, p.stages[2]?.id);
	await page.getByTestId("deal-mark-won").click();
	await expect(page.getByTestId("stage-conflict")).toBeVisible();
	await expect(page.getByTestId("deal-stage")).toHaveText("Qualified");
	await page.getByTestId("stage-reload").click();
	await expect(page.getByTestId("stage-conflict")).toHaveCount(0);
	await expect(page.getByTestId("deal-stage")).toHaveText("Won");
	expect(await stepStates(page)).toEqual([
		"New:done",
		"Qualified:done",
		"Won:won",
	]);
	await expect(page.getByTestId("stage-none")).toBeVisible();

	// Stale Mark lost goes through the reason dialog and conflicts the same way.
	await page.getByTestId("deal-back").click();
	await pick(page, "Stale lost");
	await expect(page.getByTestId("deal-stage")).toHaveText("Qualified");
	await moveTo(request, f, lostAtQualified, p.stages[2]?.id);
	await page.getByTestId("deal-mark-lost").click();
	const dialog = page.getByTestId("lost-dialog");
	await dialog.locator("textarea[name=reason]").fill("Too late");
	await dialog.getByRole("button", { name: "Mark lost" }).click();
	await expect(page.getByTestId("stage-conflict")).toBeVisible();
	await expect(dialog).toHaveCount(0);
	await page.getByTestId("stage-reload").click();
	await expect(page.getByTestId("deal-stage")).toHaveText("Won");
	await expect(page.getByTestId("deal-version")).toHaveText("2");
});

test("deals en: edit on demand uses a formatted money input and a currency select; footer is Save + Cancel", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const p = await makePipeline(request, f);
	await makeDeal(request, f, p, "Edit deal", 296900_00);
	await makeDeal(request, f, p, "Dollar deal", 1000_00, "USD");
	await page.setViewportSize({ width: 1440, height: 900 });
	await open(page, f, "en");
	await pick(page, "Edit deal");

	// Read first: no permanent form.
	await expect(page.locator("input[name=title]")).toHaveCount(0);
	await expect(page.getByTestId("record-footer")).toHaveCount(0);
	await page.getByTestId("record-edit").click();
	const amount = page.locator("input[name=amount]");
	await expect(amount).toHaveValue("296,900");
	await expect(page.getByTestId("record-footer")).toHaveCount(0);

	// Typing groups thousands and drops stray characters; currency is a select of codes in the data.
	await amount.fill("1234567.5x");
	await expect(amount).toHaveValue("1,234,567.5");
	const currency = page.locator("[role=combobox][data-name=currency]");
	await currency.click();
	await expect(page.getByRole("option")).toHaveText(["EGP", "USD"]);
	await page.keyboard.press("Escape");
	await expect(page.getByRole("listbox")).toHaveCount(0);

	// Footer: Save + Cancel only. Cancel discards the draft and leaves edit mode.
	const footer = page.getByTestId("record-footer");
	await expect(footer.getByRole("button")).toHaveCount(2);
	await expect(page.getByTestId("deal-save")).toBeVisible();
	await expect(page.getByTestId("record-discard")).toHaveCount(0);
	await page.getByTestId("record-edit-cancel").click();
	await expect(page.getByTestId("record-editor")).toHaveCount(0);
	await expect(footer).toHaveCount(0);
	await expect(page.getByTestId("deal-detail-value")).toContainText("296,900");
	await page.getByTestId("record-edit").click();
	await expect(page.locator("input[name=amount]")).toHaveValue("296,900");

	// Save a new value and currency.
	await page.locator("input[name=amount]").fill("2500.5");
	await pickValue(currency, "USD");
	await page.getByTestId("deal-save").click();
	await expect(toast(page, "Deal updated.")).toBeVisible();
	await expect(page.getByTestId("record-editor")).toHaveCount(0);
	const saved = (
		await (await request.get("/v1/deals", { headers: headers(f) })).json()
	).data as Array<{ title: string; amount_minor: number; currency: string }>;
	expect(saved.find((d) => d.title === "Edit deal")).toMatchObject({
		amount_minor: 250050,
		currency: "USD",
	});

	// Escape also leaves edit mode.
	await page.getByTestId("record-edit").click();
	await page.locator("input[name=title]").focus();
	await page.keyboard.press("Escape");
	await expect(page.getByTestId("record-editor")).toHaveCount(0);
});

test("deals en: a deep link (?select=) opens the record page", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const p = await makePipeline(request, f);
	const deal = await makeDeal(request, f, p, "Linked deal");
	await page.setViewportSize({ width: 1440, height: 900 });
	await open(page, f, "en", `/app/deals?select=${deal.id}`);
	await expect(page.getByTestId("deal-detail-title")).toHaveText("Linked deal");
	await expect(page.getByTestId("deal-sheet")).toHaveCount(0);
	await expect(steps(page)).toHaveCount(3);
});

for (const language of ["ar", "en"] as const)
	test(`deals ${language} 375: the record opens as a full-screen sheet with actions, stepper and tabs`, async ({
		page,
		request,
	}) => {
		const f = await fixture();
		const p = await makePipeline(request, f);
		await makeDeal(request, f, p, "Sheet deal");
		await page.setViewportSize({ width: 375, height: 800 });
		await open(page, f, language);
		await pick(page, "Sheet deal");

		const sheet = page.getByTestId("deal-sheet");
		await expect(sheet).toBeVisible();
		await expect(page.getByTestId("sheet-back")).toBeVisible();
		await expect(page.getByTestId("deal-back")).toHaveCount(0);
		await expect(page.getByTestId("deal-detail-title")).toHaveText(
			"Sheet deal",
		);
		await expect(page.getByTestId("deal-mark-lost")).toBeVisible();
		await expect(steps(page)).toHaveCount(3);
		await expect(sheet.getByRole("tab")).toHaveCount(3);
		await expect(page.getByTestId("deal-stats")).toBeVisible();
		expect(await noPageOverflow(page)).toBe(true);
		// The sheet slides in: wait until the action has settled, then it must sit inside the viewport.
		await expect
			.poll(async () => {
				const b = await page.getByTestId("deal-mark-lost").boundingBox();
				return b !== null && b.x >= 0 && b.x + b.width <= 375;
			})
			.toBe(true);

		await page.getByTestId("sheet-back").click();
		await expect(sheet).toHaveCount(0);
		await expect(rows(page).filter({ hasText: "Sheet deal" })).toBeVisible();
	});
