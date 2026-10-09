import { randomUUID } from "node:crypto";
import { type APIRequestContext, expect, type Page, test } from "@playwright/test";
import pg from "pg";
import { seed } from "../scripts/seed.js";
import { pickValue } from "./select-helper.js";

process.loadEnvFile(".env");

// Server-side list query (P1A S4) at volume: 170+ rows per list, so the first loaded page is NOT everything.
// Proves: search reaches rows that are not on a loaded page, sort is the server's order across pages, totals are the
// server's `total_count`, filters narrow on the server, names come from `expand` (no contacts directory is fetched),
// search is debounced and a stale response never overwrites a newer query. AR (RTL) and EN both run.

const N = 170;
type Fixture = Awaited<ReturnType<typeof seed>>;
const headers = (f: Fixture, key = randomUUID()) => ({
	Authorization: `Bearer ${f.tokens.manager}`,
	"X-Tenant-ID": f.ids.a,
	"Idempotency-Key": key,
});

const ZEBRA = "Zebra Needle";
const AR_TITLE = "Item 000 عميل الإبرة";
const AR_NEEDLE = "الإبرة";

let f: Fixture;
let totals = { leads: 0, contacts: 0, deals: 0, tasks: 0 };

async function inChunks<T>(items: readonly T[], size: number, fn: (x: T, i: number) => Promise<unknown>) {
	for (let i = 0; i < items.length; i += size)
		await Promise.all(items.slice(i, i + size).map((x, j) => fn(x, i + j)));
}

async function post<T>(request: APIRequestContext, path: string, data: Record<string, unknown>): Promise<T> {
	const command_id = randomUUID();
	const res = await request.post(path, { headers: headers(f, command_id), data: { command_id, ...data } });
	expect(res.status(), path).toBe(201);
	return (await res.json()).data as T;
}

async function total(request: APIRequestContext, path: string, extra = ""): Promise<number> {
	const res = await request.get(`/v1/${path}?sort=-created_at&limit=1&include_total=1${extra}`, { headers: headers(f) });
	expect(res.status(), `${path} ${await res.text()}`).toBe(200);
	const body = (await res.json()) as { total_count: { value: number; exact: boolean } };
	expect(body.total_count, `${path} ${JSON.stringify(body).slice(0, 300)}`).toBeDefined();
	expect(body.total_count.exact).toBe(true);
	return body.total_count.value;
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ playwright }) => {
	test.setTimeout(240_000);
	const admin = new pg.Client({ connectionString: process.env.ADMIN_DATABASE_URL });
	await admin.connect();
	f = await seed(admin);
	await admin.end();
	const request = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL as string });

	// Leads (each creates its contact). The two "needles" are created FIRST = oldest = last in newest-first order.
	type L = { id: string; contact_id: string; version: number };
	const lead = (title: string) =>
		post<L>(request, "/v1/leads", { title, source_evidence: "synthetic", contact: { display_name: `Contact ${title}`, email: "ui-fixture@example.test" } });
	const leads: L[] = [await lead(ZEBRA), await lead(AR_TITLE)];
	const titles = Array.from({ length: N - 2 }, (_, i) => `Item ${String(i + 1).padStart(3, "0")}`);
	await inChunks(titles, 10, async (t) => {
		leads.push(await lead(t));
	});
	// Three of the OLDEST leads are qualified (not on any early page of the default order).
	for (const l of leads.slice(0, 3)) {
		const command_id = randomUUID();
		const res = await request.patch(`/v1/leads/${l.id}`, {
			headers: headers(f, command_id),
			data: { command_id, expected_version: l.version, status: "qualified" },
		});
		expect(res.status()).toBe(200);
	}

	// Tasks: 4 overdue (created first), the needle far in the future, the rest in the near future.
	const day = 86_400_000;
	const task = (title: string, contact_id: string, due: number) =>
		post(request, "/v1/tasks", { title, contact_id, due_at: new Date(Date.now() + due).toISOString() });
	for (let i = 0; i < 4; i++) await task(`Late ${i + 1}`, leads[i]?.contact_id as string, -(i + 1) * day);
	await task(`Task ${ZEBRA}`, leads[0]?.contact_id as string, 300 * day);
	await inChunks(Array.from({ length: N - 5 }, (_, i) => i), 10, (i) =>
		task(`Task ${String(i + 1).padStart(3, "0")}`, leads[i % leads.length]?.contact_id as string, (i + 2) * 3_600_000 + 2 * day),
	);

	// Deals: the oldest has the biggest amount; three oldest-but-one are moved to Qualified.
	const pRes = await post<{ id: string }>(request, "/v1/pipelines", {
		name: "Sales flow",
		stages: [{ name: "New" }, { name: "Qualified" }, { name: "Won", outcome: "won" }],
		transitions: [[0, 1], [1, 2]],
	});
	const pipes = ((await (await request.get("/v1/pipelines", { headers: headers(f) })).json()) as { data: { id: string; stages: { id: string; name: string }[] }[] }).data;
	const pipe = pipes.find((p) => p.id === pRes.id);
	const stage = (name: string) => pipe?.stages.find((s) => s.name === name)?.id as string;
	const deal = (title: string, contact_id: string, amount_minor: number) =>
		post<{ id: string; version: number }>(request, "/v1/deals", {
			contact_id,
			pipeline_id: pRes.id,
			stage_id: stage("New"),
			title,
			amount_minor,
			currency: "EGP",
		});
	const deals = [await deal(`Deal ${ZEBRA}`, leads[0]?.contact_id as string, 99_999_900)];
	await inChunks(Array.from({ length: N - 1 }, (_, i) => i), 10, async (i) => {
		deals.push(await deal(`Deal ${String(i + 1).padStart(3, "0")}`, leads[(i + 1) % leads.length]?.contact_id as string, (i + 1) * 100));
	});
	for (const d of deals.slice(0, 3)) {
		const command_id = randomUUID();
		const res = await request.post(`/v1/deals/${d.id}/transitions`, {
			headers: headers(f, command_id),
			data: { command_id, to_stage_id: stage("Qualified"), expected_version: d.version, reason: "" },
		});
		expect(res.status()).toBe(200);
	}

	totals = {
		leads: await total(request, "leads"),
		contacts: await total(request, "contacts"),
		deals: await total(request, "deals"),
		tasks: await total(request, "tasks"),
	};
	for (const v of Object.values(totals)) expect(v).toBeGreaterThan(150);
	await request.dispose();
});

const rows = (page: Page) => page.getByTestId("grid-row");
const num = (n: number, language: "ar" | "en") => new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en-EG").format(n);

async function open(page: Page, path: string, language: "ar" | "en") {
	await page.addInitScript((l) => localStorage.setItem("sy.locale", l), language);
	await page.goto(path);
	await page.locator("input[name=token]").fill(f.tokens.manager);
	await page.locator("input[name=tenant]").fill(f.ids.a);
	await page.getByTestId("connect-submit").click();
	await expect(page.getByTestId("actor")).toBeVisible();
	await expect(page.locator("html")).toHaveAttribute("dir", language === "ar" ? "rtl" : "ltr");
}

/** URLs of every `/v1/<path>` list request made by the page. */
function watch(page: Page, path: string) {
	const urls: URL[] = [];
	const contacts: string[] = [];
	page.on("request", (r) => {
		const u = new URL(r.url());
		if (u.pathname === `/v1/${path}`) urls.push(u);
		if (u.pathname === "/v1/contacts") contacts.push(r.url());
	});
	return { urls, contacts };
}

for (const language of ["en", "ar"] as const)
	test(`leads ${language}: server total, search beyond the loaded page, server sort across pages, server filter, names from expand`, async ({
		page,
	}) => {
		const w = watch(page, "leads");
		await open(page, "/app/leads", language);
		// total = the server's total_count (not the number of loaded rows); 10 shown per grid page
		await expect(page.getByTestId("grid-range")).toContainText(`${num(1, language)}–${num(10, language)}`);
		await expect(page.getByTestId("grid-range")).toContainText(num(totals.leads, language));
		await expect(page.getByTestId("grid-count")).toContainText(num(totals.leads, language));
		await expect(rows(page)).toHaveCount(10);
		// the sample copy is gone
		await expect(page.getByTestId("grid-sample")).toHaveCount(0);
		// first page of a query asks for the total, every request is sorted (never the legacy id order) and embeds names
		const first = w.urls[0];
		expect(first?.searchParams.get("include_total")).toBe("1");
		expect(first?.searchParams.get("sort")).toBe("-received_at");
		expect(first?.searchParams.get("expand")).toBe("contact,owner");

		// search: the needle is the OLDEST lead, i.e. on none of the first loaded pages
		const needle = language === "ar" ? AR_NEEDLE : ZEBRA;
		await page.getByTestId("grid-search").fill(needle);
		await expect(rows(page)).toHaveCount(1);
		await expect(rows(page).first()).toContainText(language === "ar" ? "Item 000" : ZEBRA);
		await expect(page.getByTestId("grid-count")).toContainText(num(1, language));
		// related name from expand: the contact of the row is named without a contacts directory request
		await expect(rows(page).first()).toContainText(`Contact ${language === "ar" ? AR_TITLE : ZEBRA}`);
		expect(w.contacts).toEqual([]);
		await page.getByTestId("grid-search").fill("");
		await expect(rows(page)).toHaveCount(10);

		// sort: descending by lead title puts Zebra first although it is the oldest; the last page ends with it ascending
		await page.getByTestId("sort-lead").click(); // asc
		await expect(rows(page).first()).toContainText("Item 000");
		await page.getByTestId("grid-page-17").click();
		await expect(rows(page).last()).toContainText(ZEBRA);
		await page.getByTestId("sort-lead").click(); // desc
		await expect(rows(page).first()).toContainText(ZEBRA);
		expect(w.urls.some((u) => u.searchParams.get("sort") === "-title")).toBe(true);
		await page.getByTestId("sort-lead").click(); // none -> default order again

		// filter: qualified leads are 3 and none of them is on the first page of the default order
		await page.getByTestId("grid-filters").click();
		await pickValue(page.locator(".sy-grid__filters").getByRole("combobox").first(), "qualified");
		await expect(page.getByTestId("grid-count")).toContainText(num(3, language));
		await expect(rows(page)).toHaveCount(3);
		expect(w.urls.some((u) => (u.searchParams.get("filter") ?? "").includes('"status"'))).toBe(true);
		// KPI strip: exact server counts per status
		await expect(page.getByTestId("leads-kpi-qualified")).toContainText(num(3, language));
		await expect(page.getByTestId("leads-kpi-open")).toContainText(num(totals.leads - 3, language));
	});

test("leads en: search is debounced and a stale response never wins", async ({ page }) => {
	const w = watch(page, "leads");
	await open(page, "/app/leads", "en");
	await expect(rows(page)).toHaveCount(10);
	// hold the answer of the first (stale) query back
	await page.route("**/v1/leads?*", async (route) => {
		if (new URL(route.request().url()).searchParams.get("q") === ZEBRA) await new Promise((r) => setTimeout(r, 1500));
		await route.continue();
	});
	const before = w.urls.length;
	await page.getByTestId("grid-search").pressSequentially(ZEBRA, { delay: 20 });
	await page.waitForTimeout(450); // debounce elapsed: the Zebra request is in flight (held)
	await page.getByTestId("grid-search").fill("Item 001");
	await expect(rows(page)).toHaveCount(1);
	await expect(rows(page).first()).toContainText("Item 001");
	await page.waitForTimeout(1800); // the stale Zebra answer arrives now
	await expect(rows(page)).toHaveCount(1);
	await expect(rows(page).first()).toContainText("Item 001");
	const qs = w.urls.slice(before).map((u) => u.searchParams.get("q"));
	// 12 keystrokes at 20ms did not become 12 requests
	expect(qs.filter((q) => q !== null && q !== ZEBRA && q !== "Item 001")).toEqual([]);
	const searches = qs.filter((q) => q !== null);
	expect(searches.length).toBeLessThanOrEqual(3);
	expect(searches.at(-1)).toBe("Item 001");
});

/** The contact the SERVER sorts last by name (the fixture also holds other contacts, so no name is assumed). */
async function lastContact(request: APIRequestContext): Promise<string> {
	const res = await request.get("/v1/contacts?sort=-display_name&limit=1", { headers: headers(f) });
	return ((await res.json()) as { data: { display_name: string }[] }).data[0]?.display_name as string;
}

for (const language of ["en", "ar"] as const)
	test(`contacts ${language}: server total, search beyond the loaded page, server sort across pages`, async ({
		page,
		request,
	}) => {
		const last = await lastContact(request);
		await open(page, "/app/contacts", language);
		await expect(page.getByTestId("grid-range")).toContainText(num(totals.contacts, language));
		await expect(rows(page)).toHaveCount(10);
		await page.getByTestId("grid-search").fill(language === "ar" ? AR_NEEDLE : ZEBRA);
		await expect(rows(page)).toHaveCount(1);
		await expect(rows(page).first()).toContainText(language === "ar" ? "Item 000" : ZEBRA);
		await page.getByTestId("grid-search").fill("");
		await expect(rows(page)).toHaveCount(10);
		// name A-Z is the server's order across pages: the last page ends with the server's last name
		await page.getByTestId(`grid-page-${Math.ceil(totals.contacts / 10)}`).click();
		await expect(rows(page).last()).toContainText(last);
	});

test("contacts en: sort descending is server-ordered", async ({ page, request }) => {
	const last = await lastContact(request);
	await open(page, "/app/contacts", "en");
	await expect(rows(page)).toHaveCount(10);
	// default sort (name, asc) -> header click cycles to desc: the server's last name comes first
	await page.getByTestId("sort-name").click();
	await expect(page.getByTestId("sort-name").locator("xpath=ancestor::th")).toHaveAttribute("aria-sort", "descending");
	await expect(rows(page).first()).toContainText(last);
});

for (const language of ["en", "ar"] as const)
	test(`tasks ${language}: server total, overdue tab is exact, search beyond the loaded page, names from expand`, async ({
		page,
	}) => {
		const w = watch(page, "tasks");
		await open(page, "/app/tasks", language);
		await expect(page.getByTestId("grid-range")).toContainText(num(totals.tasks, language));
		await expect(rows(page)).toHaveCount(10);
		await expect(page.getByTestId("grid-sample")).toHaveCount(0);
		// the needle task is due in 300 days: last in the due-ascending server order, found by search
		await page.getByTestId("grid-search").fill(ZEBRA);
		await expect(rows(page)).toHaveCount(1);
		await expect(rows(page).first()).toContainText(`Task ${ZEBRA}`);
		await expect(rows(page).first()).toContainText(`Contact ${ZEBRA}`); // contact name from expand
		await page.getByTestId("grid-search").fill("");
		await expect(rows(page)).toHaveCount(10);
		// Overdue = the server's own clock (`due=overdue`); exactly the 4 late tasks of the 170
		await page.getByRole("tab", { name: language === "ar" ? /المتأخرة/ : /Overdue/ }).click();
		await expect(page.getByTestId("grid-count")).toContainText(num(4, language));
		await expect(rows(page)).toHaveCount(4);
		expect(w.urls.some((u) => u.searchParams.get("due") === "overdue")).toBe(true);
		expect(w.contacts).toEqual([]);
	});

for (const language of ["en", "ar"] as const)
	test(`deals ${language}: server total, search, value sort across pages, stage filter, names from expand`, async ({
		page,
	}) => {
		const w = watch(page, "deals");
		await open(page, "/app/deals", language);
		await expect(page.getByTestId("grid-range")).toContainText(num(totals.deals, language));
		await expect(rows(page)).toHaveCount(10);
		await expect(page.getByTestId("grid-sample")).toHaveCount(0);
		await page.getByTestId("grid-search").fill(ZEBRA);
		await expect(rows(page)).toHaveCount(1);
		await expect(rows(page).first()).toContainText(`Deal ${ZEBRA}`);
		await expect(rows(page).first()).toContainText(`Contact ${ZEBRA}`);
		await page.getByTestId("grid-search").fill("");
		await expect(rows(page)).toHaveCount(10);
		// biggest amount belongs to the OLDEST deal: descending value puts it first
		await page.getByTestId("sort-value").click(); // asc
		await page.getByTestId("sort-value").click(); // desc
		await expect(rows(page).first()).toContainText(`Deal ${ZEBRA}`);
		expect(w.urls.some((u) => u.searchParams.get("sort") === "-amount_minor")).toBe(true);
		expect(w.contacts).toEqual([]);
		await page.getByTestId("sort-value").click(); // back to default order
		// stage filter: 3 deals were moved to Qualified
		await page.getByTestId("grid-filters").click();
		await pickValue(page.locator(".sy-grid__filters").getByRole("combobox").first(), "Qualified");
		await expect(page.getByTestId("grid-count")).toContainText(num(3, language));
		await expect(rows(page)).toHaveCount(3);
	});
