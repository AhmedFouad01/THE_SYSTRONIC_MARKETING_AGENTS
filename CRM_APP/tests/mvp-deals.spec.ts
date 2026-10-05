import { randomUUID } from "node:crypto";
import {
	type APIRequestContext,
	expect,
	type Page,
	test,
} from "@playwright/test";
import pg from "pg";
import { seed } from "../scripts/seed.js";

// Money follows the locale (Intl currency): Arabic shows the Egyptian pound symbol, not the ISO code.
const egp = (language: "ar" | "en") => (language === "ar" ? "ج.م." : "EGP");

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
			currency: "EGP",
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
		await expect(dialog.locator("select[name=contact]")).toBeDisabled();
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

test("deals en: stage menu is keyboard operable and offers only allowed edges; history lists entries", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const p = await makePipeline(request, f);
	await makeDeal(request, f, p, "Menu deal");
	await open(page, f, "en");
	await pick(page, "Menu deal");
	await expect(page.getByTestId("deal-stage")).toHaveText("New");

	// New -> Won is not an edge: only Qualified and Lost are offered
	const trigger = page.getByTestId("stage-menu");
	await trigger.focus();
	await page.keyboard.press("ArrowDown");
	await expect(page.getByRole("menuitem")).toHaveText(["Qualified", "Lost"]);
	await expect(page.getByRole("menuitem", { name: "Won" })).toHaveCount(0);
	await expect(page.getByRole("menuitem", { name: "Qualified" })).toBeFocused();
	await page.keyboard.press("Escape");
	await expect(page.getByRole("menu")).toHaveCount(0);
	await expect(trigger).toBeFocused();

	await page.keyboard.press("ArrowDown");
	await page.keyboard.press("Enter");
	await expect(page.getByTestId("deal-stage")).toHaveText("Qualified");
	await expect(page.getByTestId("deal-version")).toHaveText("1");

	// Qualified offers Won and Lost
	await page.getByTestId("stage-menu").click();
	await expect(page.getByRole("menuitem")).toHaveText(["Won", "Lost"]);
	await page.keyboard.press("Escape");

	await page.getByRole("tab", { name: "History" }).click();
	await expect(page.getByTestId("history-item")).toHaveCount(1);
	await expect(page.getByTestId("history-item").first()).toContainText(
		"New to Qualified",
	);
});

test("deals en: Lost requires a reason via confirm dialog; terminal stage has no moves", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const p = await makePipeline(request, f);
	await makeDeal(request, f, p, "Lost deal");
	await open(page, f, "en");
	await pick(page, "Lost deal");

	await page.getByTestId("stage-menu").click();
	await page.getByRole("menuitem", { name: "Lost" }).click();
	const dialog = page.getByTestId("lost-dialog");
	await expect(dialog).toBeVisible();
	await expect(dialog).toContainText("Mark deal as lost?");
	await dialog.getByRole("button", { name: "Mark lost" }).click();
	await expect(dialog).toContainText("Enter a reason.");
	await expect(dialog).toBeVisible();
	await expect(page.getByTestId("deal-stage")).toHaveText("New");

	await dialog.locator("textarea[name=reason]").fill("Budget cut");
	await dialog.getByRole("button", { name: "Mark lost" }).click();
	await expect(dialog).toHaveCount(0);
	await expect(page.getByTestId("deal-stage")).toHaveText("Lost");
	await expect(page.getByTestId("stage-none")).toBeVisible();
	await expect(page.getByTestId("stage-menu")).toHaveCount(0);

	await page.getByRole("tab", { name: "History" }).click();
	await expect(page.getByTestId("history-item").first()).toContainText(
		"Reason: Budget cut",
	);
});

test("deals en: stale transition shows 409 conflict and reload recovers", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const p = await makePipeline(request, f);
	const deal = await makeDeal(request, f, p, "Stale deal");
	await open(page, f, "en");
	await pick(page, "Stale deal");
	await expect(page.getByTestId("deal-stage")).toHaveText("New");

	// someone else moves the deal first
	const command_id = randomUUID();
	const res = await request.post(`/v1/deals/${deal.id}/transitions`, {
		headers: headers(f, command_id),
		data: {
			command_id,
			to_stage_id: p.stages[1]?.id,
			expected_version: deal.version,
			reason: "",
		},
	});
	expect(res.status()).toBe(200);

	await page.getByTestId("stage-menu").click();
	await page.getByRole("menuitem", { name: "Qualified" }).click();
	await expect(page.getByTestId("stage-conflict")).toBeVisible();
	await expect(page.getByTestId("deal-stage")).toHaveText("New");
	await page.getByTestId("stage-reload").click();
	await expect(page.getByTestId("stage-conflict")).toHaveCount(0);
	await expect(page.getByTestId("deal-stage")).toHaveText("Qualified");
	await expect(page.getByTestId("deal-version")).toHaveText("1");
});
