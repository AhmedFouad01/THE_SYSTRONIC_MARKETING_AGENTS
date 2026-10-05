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
	const order = ["New", "Qualified", "Won", "Lost"];
	p.stages.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
	return p;
}

async function makeDeal(
	request: APIRequestContext,
	f: Fixture,
	p: Pipe,
	title: string,
	amount_minor = 150000,
) {
	const leadCmd = randomUUID();
	const leadRes = await request.post("/v1/leads", {
		headers: headers(f, leadCmd),
		data: {
			command_id: leadCmd,
			title: `L ${title}`,
			source_evidence: "synthetic",
			contact: { display_name: `Contact ${title}` },
		},
	});
	expect(leadRes.status()).toBe(201);
	const lead = (await leadRes.json()).data as { contact_id: string };
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

const noPageOverflow = (page: Page) =>
	page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

const open = async (
	page: Page,
	f: Fixture,
	language: "ar" | "en",
	pipelineName: string | null = "Sales flow",
) => {
	await page.addInitScript(
		(l) => localStorage.setItem("sy.locale", l),
		language,
	);
	await page.goto("/app/pipeline");
	await connect(page, f.tokens.manager, f.ids.a);
	if (pipelineName !== null) {
		await expect(page.getByTestId("pipeline-board")).toBeVisible();
		await page
			.getByTestId("pipeline-select")
			.selectOption({ label: pipelineName });
	}
};

const column = (page: Page, name: string) =>
	page.getByTestId("pipeline-column").filter({
		has: page.getByRole("heading", { name, exact: true }),
	});
const cards = (page: Page, stage: string) =>
	column(page, stage).getByTestId("pipeline-card");
const cardOf = (page: Page, title: string) =>
	page.getByTestId("pipeline-card").filter({ hasText: title });

for (const width of [360, 1280])
	for (const language of ["ar", "en"] as const)
		test(`pipeline ${language} ${width}px: stage columns, counts, totals, terminal columns, no page overflow`, async ({
			page,
			request,
		}) => {
			const f = await fixture();
			const p = await makePipeline(request, f);
			await makeDeal(request, f, p, "Alpha deal", 100000);
			await makeDeal(request, f, p, "Bravo deal", 250000);
			const errors: string[] = [];
			page.on("pageerror", (e) => errors.push(e.message));
			await page.setViewportSize({ width, height: 800 });
			await open(page, f, language);
			await expect(page.locator("html")).toHaveAttribute(
				"dir",
				language === "ar" ? "rtl" : "ltr",
			);
			await expect(page.getByTestId("pipeline-column")).toHaveCount(4);
			await expect(
				page.getByTestId("pipeline-column").getByRole("heading"),
			).toHaveText(["New", "Qualified", "Won", "Lost"]);
			const counts = page.getByTestId("column-count");
			await expect(counts.nth(0)).toHaveText(/[2٢]/);
			await expect(counts.nth(1)).toHaveText(/[0٠]/);
			await expect(
				column(page, "New").getByTestId("column-total"),
			).toContainText(egp(language));
			await expect(cards(page, "New")).toHaveCount(2);
			await expect(
				column(page, "Qualified").getByTestId("column-empty"),
			).toBeVisible();
			await expect(column(page, "Won")).toHaveAttribute("data-kind", "won");
			await expect(column(page, "Lost")).toHaveAttribute("data-kind", "lost");
			await expect(cardOf(page, "Alpha deal")).toContainText(egp(language));
			await expect(cardOf(page, "Alpha deal")).toContainText(
				"Contact Alpha deal",
			);
			expect(await noPageOverflow(page)).toBe(true);
			if (width === 360) {
				// columns scroll horizontally inside the board instead of widening the page
				expect(
					await page
						.getByTestId("pipeline-board")
						.evaluate((el) => el.scrollWidth > el.clientWidth),
				).toBe(true);
			}
			expect(errors).toEqual([]);
		});

test("pipeline en: no pipeline configured shows an empty state with a disabled admin control", async ({
	page,
}) => {
	const f = await fixture();
	await page.route("**/v1/pipelines", (r) =>
		r.fulfill({ json: { data: [], next_cursor: null } }),
	);
	await open(page, f, "en", null);
	await expect(page.getByTestId("state-empty")).toContainText(
		"No pipeline is configured",
	);
	await expect(page.getByTestId("pipeline-admin-link")).toBeDisabled();
});

test("pipeline en: pipeline without deals shows an empty-pipeline state and empty columns", async ({
	page,
	request,
}) => {
	const f = await fixture();
	await makePipeline(request, f);
	await open(page, f, "en");
	await expect(page.getByTestId("state-empty")).toContainText(
		"No deals in this pipeline yet",
	);
	await expect(page.getByTestId("column-empty")).toHaveCount(4);
});

test("pipeline en: keyboard Move menu offers only allowed edges and moves the card", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const p = await makePipeline(request, f);
	const deal = await makeDeal(request, f, p, "Menu deal");
	await open(page, f, "en");
	await expect(column(page, "New").getByTestId("column-count")).toHaveText("1");

	const trigger = page.getByTestId(`move-menu-${deal.id}`);
	await trigger.focus();
	await page.keyboard.press("ArrowDown");
	// New -> Won is not an edge
	await expect(page.getByRole("menuitem")).toHaveText(["Qualified", "Lost"]);
	await expect(page.getByRole("menuitem", { name: "Won" })).toHaveCount(0);
	await page.keyboard.press("Escape");
	await expect(trigger).toBeFocused();

	await page.keyboard.press("ArrowDown");
	await page.keyboard.press("Enter");
	await expect(cards(page, "Qualified")).toHaveCount(1);
	await expect(cards(page, "New")).toHaveCount(0);
	await expect(
		column(page, "Qualified").getByTestId("column-count"),
	).toHaveText("1");
	await expect(column(page, "New").getByTestId("column-count")).toHaveText("0");

	// Qualified offers Won and Lost
	await page.getByTestId(`move-menu-${deal.id}`).click();
	await expect(page.getByRole("menuitem")).toHaveText(["Won", "Lost"]);
	await page.getByRole("menuitem", { name: "Won" }).click();
	await expect(cards(page, "Won")).toHaveCount(1);
	// Won is final: no menu
	await expect(page.getByTestId(`move-menu-${deal.id}`)).toHaveCount(0);
	await expect(column(page, "Won").getByTestId("pipeline-final")).toBeVisible();
});

test("pipeline en: Lost requires a reason; cancel keeps the card", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const p = await makePipeline(request, f);
	const deal = await makeDeal(request, f, p, "Lost deal");
	await open(page, f, "en");

	await page.getByTestId(`move-menu-${deal.id}`).click();
	await page.getByRole("menuitem", { name: "Lost" }).click();
	const dialog = page.getByTestId("lost-dialog");
	await expect(dialog).toBeVisible();
	await dialog.getByRole("button", { name: "Mark lost" }).click();
	await expect(dialog).toContainText("Enter a reason.");
	await expect(cards(page, "New")).toHaveCount(1);

	await dialog.getByRole("button", { name: "Cancel" }).click();
	await expect(dialog).toHaveCount(0);
	await expect(cards(page, "New")).toHaveCount(1);

	await page.getByTestId(`move-menu-${deal.id}`).click();
	await page.getByRole("menuitem", { name: "Lost" }).click();
	await dialog.locator("textarea[name=reason]").fill("Budget cut");
	await dialog.getByRole("button", { name: "Mark lost" }).click();
	await expect(dialog).toHaveCount(0);
	await expect(cards(page, "Lost")).toHaveCount(1);

	await expect
		.poll(async () => {
			const hist = await (
				await request.get(`/v1/deals/${deal.id}/history`, {
					headers: headers(f),
				})
			).json();
			return (hist.data as Array<{ reason: string }>).some(
				(h) => h.reason === "Budget cut",
			);
		})
		.toBe(true);
});

for (const language of ["ar", "en"] as const)
	test(`pipeline ${language}: stale move rolls back with a 409 banner; reload recovers`, async ({
		page,
		request,
	}) => {
		const f = await fixture();
		const p = await makePipeline(request, f);
		const deal = await makeDeal(request, f, p, "Stale deal");
		await open(page, f, language);
		await expect(cards(page, "New")).toHaveCount(1);

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

		await page.getByTestId(`move-menu-${deal.id}`).click();
		await page.getByTestId(`move-option-${p.stages[1]?.id}`).click();
		await expect(page.getByTestId("pipeline-conflict")).toBeVisible();
		// rolled back: card is back in New, Qualified still empty
		await expect(cards(page, "New")).toHaveCount(1);
		await expect(cards(page, "Qualified")).toHaveCount(0);
		await page.getByTestId("pipeline-reload").click();
		await expect(page.getByTestId("pipeline-conflict")).toHaveCount(0);
		await expect(cards(page, "Qualified")).toHaveCount(1);
		await expect(cards(page, "New")).toHaveCount(0);
	});

for (const language of ["ar", "en"] as const)
	test(`pipeline ${language}: opening a card navigates to the deal in Deals`, async ({
		page,
		request,
	}) => {
		const f = await fixture();
		const p = await makePipeline(request, f);
		const deal = await makeDeal(request, f, p, "Open me");
		await open(page, f, language);
		await cardOf(page, "Open me").getByTestId("pipeline-card-open").focus();
		await page.keyboard.press("Enter");
		await expect(page).toHaveURL(new RegExp(`/app/deals\\?select=${deal.id}`));
		await expect(page.getByTestId("deal-detail-title")).toHaveText("Open me");
	});
