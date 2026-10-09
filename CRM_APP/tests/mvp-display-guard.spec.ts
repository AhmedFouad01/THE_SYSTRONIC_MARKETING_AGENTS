import { randomUUID } from "node:crypto";
import { type APIRequestContext, expect, type Page, test } from "@playwright/test";
import pg from "pg";
import { seed } from "../scripts/seed.js";

process.loadEnvFile(".env");

// Display-layer guard (UX_AUDIT cross-cutting 8): no dev/technical leakage in visible text on any MVP screen,
// in both languages, and every rendered date/count follows the locale's digits. Credentials are never logged.
async function fixture() {
	const admin = new pg.Client({ connectionString: process.env.ADMIN_DATABASE_URL });
	await admin.connect();
	const f = await seed(admin);
	// Seed rows are labelled "Synthetic ..." (data, not UI). Give the visible ones realistic names so the
	// "Synthetic" check below can only trip on UI-owned wording.
	await admin.query("UPDATE crm.principal SET name='Mona Adel' WHERE id=$1", [f.ids.manager]);
	await admin.query("UPDATE crm.contact SET display_name='Layla Hassan' WHERE tenant_id=$1", [f.ids.a]);
	await admin.end();
	return f;
}
type Fixture = Awaited<ReturnType<typeof fixture>>;

const headers = (f: Fixture, key = randomUUID()) => ({
	Authorization: `Bearer ${f.tokens.manager}`,
	"X-Tenant-ID": f.ids.a,
	"Idempotency-Key": key,
});

async function post(request: APIRequestContext, f: Fixture, path: string, data: Record<string, unknown>) {
	const command_id = randomUUID();
	const res = await request.post(path, { headers: headers(f, command_id), data: { command_id, ...data } });
	expect(res.status()).toBe(201);
	return (await res.json()).data as { id: string; contact_id?: string };
}

async function seedData(request: APIRequestContext, f: Fixture) {
	const lead = await post(request, f, "/v1/leads", {
		title: "Kitchen inquiry",
		source_evidence: "Referred by a neighbour",
		contact: { display_name: "Alex Carter", email: "ui-fixture@example.test" },
	});
	const pipe = await post(request, f, "/v1/pipelines", {
		name: "Flow",
		stages: [{ name: "New" }, { name: "Won", outcome: "won" }],
		transitions: [[0, 1]],
	});
	const list = (await (await request.get("/v1/pipelines", { headers: headers(f) })).json()).data as Array<{
		id: string;
		stages: Array<{ id: string; name: string }>;
	}>;
	const stage = list.find((p) => p.id === pipe.id)?.stages.find((s) => s.name === "New");
	await post(request, f, "/v1/deals", {
		contact_id: lead.contact_id,
		pipeline_id: pipe.id,
		stage_id: stage?.id,
		title: "Kitchen fit-out",
		amount_minor: 125050,
		currency: "EGP",
	});
	await post(request, f, "/v1/tasks", {
		title: "Call back",
		contact_id: lead.contact_id,
		due_at: new Date(Date.now() - 3 * 86_400_000).toISOString(),
	});
}

const SCREENS = ["dashboard", "leads", "contacts", "deals", "pipeline", "tasks", "reporting"] as const;
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const HEX8 = /\b[0-9a-f]{8}\b/i;
const LATIN_DATE = /\d{1,2}\/\d{1,2}\/\d{2,4}|\b\d{4}-\d{2}-\d{2}\b/; // slash / ISO dates are never shown
const CLOCK_TAIL = /\b[ap]\s\d{1,2}:\d{2}\b/i; // reversed "p 2:03" pieces (UX-01)

// The guard's own patterns must flag known-bad samples, otherwise a green run proves nothing.
test("display guard patterns detect known leaks", () => {
	expect("id 7c9e6679-7425-40de-944b-e27d5d93c2a1").toMatch(UUID);
	expect("lead 7c9e6679 saved").toMatch(HEX8);
	expect("Version 3").toMatch(/\bversion\b|الإصدار/i);
	expect("الإصدار ٣").toMatch(/\bversion\b|الإصدار/i);
	expect("2026-10-05").toMatch(LATIN_DATE);
	expect("5/10/2026").toMatch(LATIN_DATE);
	expect("p 2:03").toMatch(CLOCK_TAIL);
	expect("Oct 5, 2026, 2:03 PM").not.toMatch(LATIN_DATE);
	expect("Kitchen fit-out").not.toMatch(HEX8);
});

for (const language of ["ar", "en"] as const)
	test(`display layer ${language}: no ids, versions, seed wording or garbled dates/counts on any screen`, async ({
		page,
		request,
	}) => {
		const f = await fixture();
		await seedData(request, f);
		const errors: string[] = [];
		page.on("pageerror", (e) => errors.push(e.message));
		await page.addInitScript((l) => localStorage.setItem("sy.locale", l), language);
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto("/app/leads");
		await page.locator("input[name=token]").fill(f.tokens.manager);
		await page.locator("input[name=tenant]").fill(f.ids.a);
		await page.getByTestId("connect-submit").click();
		await expect(page.getByTestId("actor")).toBeVisible();

		const visibleText = (p: Page) => p.locator("body").innerText();
		const check = async (where: string) => {
			const text = await visibleText(page);
			expect(text, `${where}: uuid`).not.toMatch(UUID);
			expect(text, `${where}: 8-hex`).not.toMatch(HEX8);
			expect(text, `${where}: Version`).not.toMatch(/\bversion\b|الإصدار/i);
			expect(text, `${where}: Synthetic`).not.toMatch(/synthetic/i);
			expect(text, `${where}: slash/ISO date`).not.toMatch(LATIN_DATE);
			expect(text, `${where}: reversed clock`).not.toMatch(CLOCK_TAIL);
			if (language === "ar") {
				// grid counts/pages are in Arabic-Indic digits; the one deliberate exception is a lone zero, which is the
				// legible Western "0" (the Arabic-Indic zero is a bare dot, UX-R2-07/R3-03) - "٣٠" or "٠٫٥" never contain it
				for (const id of ["grid-range", "grid-count"]) {
					const el = page.getByTestId(id);
					if (await el.count())
						expect((await el.first().innerText()).replace(/(?<![0-9٠-٩٫٬])0(?![0-9٠-٩٫٬])/g, ""), `${where}: ${id}`).not.toMatch(/[0-9]/);
				}
			}
			expect(await page.locator("[data-testid=actor]").innerText(), `${where}: actor`).toContain("Mona Adel");
		};

		for (const screen of SCREENS) {
			await page.goto(`/app/${screen}`);
			await expect(page.getByTestId("actor")).toBeVisible();
			if (["leads", "contacts", "deals", "tasks"].includes(screen)) {
				const rows = page.getByTestId("grid-row");
				await expect(rows.first()).toBeVisible();
				// pager is ONE locale message "{from}-{to} of {total}" with the locale's digits (AR: Arabic-Indic)
				const digits = language === "ar" ? "[٠-٩]+" : "[0-9]+";
				const range = language === "ar" ? `^${digits}[–-]${digits} من ${digits}$` : `^${digits}[–-]${digits} of ${digits}$`;
				await expect(page.getByTestId("grid-range").first(), `${language}/${screen}: pager`).toHaveText(new RegExp(range));
				await rows.first().click({ position: { x: 10, y: 10 } });
				// the technical details disclosure exists in the selected record and is collapsed
				await expect(page.getByTestId("record-details").first()).toBeAttached();
				expect(await page.getByTestId("record-details").first().evaluate((d) => (d as HTMLDetailsElement).open)).toBe(false);
			}
			await page.waitForTimeout(250);
			await check(`${language}/${screen}`);
		}
		expect(errors).toEqual([]);

		// Opening the disclosure is where ids/revision live: copy control present, values shown LTR.
		await page.goto("/app/leads");
		await page.getByTestId("grid-row").first().click({ position: { x: 10, y: 10 } });
		await page.getByTestId("record-details").first().locator("summary").click();
		await expect(page.getByTestId("lead-version")).toBeVisible();
		await expect(page.getByTestId("record-details").first().getByRole("button")).toHaveCount(1);
	});
