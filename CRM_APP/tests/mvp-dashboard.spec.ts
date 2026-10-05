import { randomUUID } from "node:crypto";
import {
	type APIRequestContext,
	expect,
	type Page,
	type Route,
	test,
} from "@playwright/test";
import pg from "pg";
import { seed } from "../scripts/seed.js";

process.loadEnvFile(".env");

// Dashboard + Leads KPI strip (DASHBOARD_SPEC, UX-R2-04 / UX-09). Synthetic fixture per test; credentials stay in memory.
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
	return (await res.json()).data as {
		id: string;
		contact_id: string;
		version: number;
	};
}

async function setLeadStatus(
	request: APIRequestContext,
	f: Fixture,
	lead: { id: string; version: number },
	status: "qualified" | "closed",
) {
	const command_id = randomUUID();
	const res = await request.patch(`/v1/leads/${lead.id}`, {
		headers: headers(f, command_id),
		data: { command_id, expected_version: lead.version, status },
	});
	expect(res.status()).toBe(200);
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

async function open(
	page: Page,
	f: Fixture,
	language: "ar" | "en",
	width = 1440,
	path = "/app/dashboard",
	ready = "dashboard-view",
) {
	await page.setViewportSize({ width, height: 900 });
	await page.addInitScript((l) => localStorage.setItem("sy.locale", l), language);
	await page.goto(path);
	await page.locator("input[name=token]").fill(f.tokens.manager);
	await page.locator("input[name=tenant]").fill(f.ids.a);
	await page.getByTestId("connect-submit").click();
	await expect(page.getByTestId(ready)).toBeVisible();
}

const noPageOverflow = (page: Page) =>
	page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

const HOUR = 3_600_000;
const json = (route: Route, status: number, body: unknown) =>
	route.fulfill({
		status,
		contentType: "application/json",
		body: JSON.stringify(body),
	});

/** Route handler for GET /v1/tasks?due=<due> only (other calls pass through). */
const mockTasks = (
	page: Page,
	due: "overdue" | "today",
	respond: (route: Route) => Promise<void>,
) =>
	page.route(
		(url) => url.pathname === "/v1/tasks" && url.searchParams.get("due") === due,
		respond,
	);

const REPORT_PATH = (url: URL) => url.pathname === "/v1/reports/campaign-performance";

const reportBody = (over: Record<string, unknown> = {}) => ({
	data: {
		model: "last_non_direct",
		version: "deterministic-v1",
		lookback_days: 30,
		run_id: "run-1",
		as_of: "2026-10-05T10:00:00.000Z",
		rows: [
			{ campaign_id: "a", campaign_name: "Alpha", source: "ads", currency: "EGP", conversion_type: "payment_captured", value_minor: 100000, outcomes: 3 },
			{ campaign_id: "b", campaign_name: "Beta", source: "ads", currency: "EGP", conversion_type: "payment_captured", value_minor: 50000, outcomes: 2 },
			{ campaign_id: "a", campaign_name: "Alpha", source: "ads", currency: "EGP", conversion_type: "refund_recorded", value_minor: -10000, outcomes: 1 },
			{ campaign_id: "z", campaign_name: "Zed", source: "ads", currency: "USD", conversion_type: "payment_captured", value_minor: 700, outcomes: 1 },
		],
		spend: [
			{ campaign_id: "a", name: "Alpha", currency: "EGP", spend_minor: 40000, reporting_date: "2026-10-01", timezone: "UTC" },
		],
		...over,
	},
});

const fakeTask = (i: number, dueMs: number) => ({
	id: randomUUID(),
	contact_id: null,
	deal_id: null,
	owner_id: randomUUID(),
	title: `Mock ${i}`,
	due_at: new Date(dueMs).toISOString(),
	status: "open",
	outcome: null,
	version: 1,
	completed_at: null,
});

const filled = (page: Page) =>
	page.locator('[data-testid="dash-kpis"] [data-tone]:not([data-tone="neutral"])');

test("dashboard en 1440: eight widgets with exact data, emphasis limited to two cards, no placeholder text", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const lead = await makeLead(request, f, "Dash");
	const now = Date.now();
	await makeTask(request, f, lead.contact_id, "Older call", now - 72 * HOUR);
	await makeTask(request, f, lead.contact_id, "Newer call", now - HOUR);
	await makeTask(request, f, lead.contact_id, "Soon call", now + 3 * HOUR);
	await makeTask(request, f, lead.contact_id, "Far call", now + 72 * HOUR);
	await page.route(REPORT_PATH, (r) => json(r, 200, reportBody()));
	await open(page, f, "en");

	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Dashboard");
	await expect(page.getByText("What needs action now and how campaigns are performing")).toBeVisible();
	await expect(page.getByText("This screen is built in a later slice.")).toHaveCount(0);

	// W1/W2
	await expect(page.getByTestId("kpi-overdue")).toContainText("Overdue follow-ups");
	await expect(page.getByTestId("kpi-overdue")).toContainText("2");
	await expect(page.getByTestId("kpi-overdue")).toHaveAttribute("data-tone", "navy");
	await expect(page.getByTestId("kpi-next24h")).toContainText("Due in next 24 hours");
	await expect(page.getByTestId("kpi-next24h").locator(".sy-kpi__value")).toHaveText("1");
	await expect(page.getByTestId("kpi-next24h")).toHaveAttribute("data-tone", "neutral");
	// W3/W4 (EGP only; USD is noted, never summed): 100000 + 50000 - 10000 minor = 1,400 EGP, spend 400 -> 3.50x
	await expect(page.getByTestId("kpi-revenue")).toContainText(/1,400/);
	await expect(page.getByTestId("kpi-revenue")).toContainText("Other currencies: 1");
	await expect(page.getByTestId("kpi-revenue")).toHaveAttribute("data-tone", "magenta");
	await expect(page.getByTestId("kpi-roas")).toContainText("3.50");
	await expect(page.getByTestId("kpi-roas")).toHaveAttribute("data-tone", "neutral");
	await expect(filled(page)).toHaveCount(2);

	// W5: oldest overdue first, the far task is not listed
	const rows = page.getByTestId("dash-followup");
	await expect(rows).toHaveCount(3);
	await expect(rows.first()).toContainText("Older call");
	await expect(rows.nth(2)).toContainText("Soon call");
	await expect(page.getByTestId("dash-followups")).not.toContainText("Far call");
	await expect(rows.first().getByTestId("dash-overdue-chip")).toBeVisible();

	// W6
	await expect(page.getByTestId("dash-spend")).toContainText(/400/);
	await expect(page.getByTestId("dash-conversions")).toHaveText("6"); // all attributed outcomes (every currency), refunds excluded
	await expect(page.getByTestId("dash-refunds")).toContainText("100");
	await expect(page.getByTestId("dash-meta")).toContainText("As of");
	await expect(page.getByTestId("dash-meta")).toContainText("Last Non-Direct Touch");
	await expect(page.getByTestId("dash-meta")).toContainText("30");

	// W7: primary currency only, top revenue first
	const camp = page.getByTestId("dash-campaign-row");
	await expect(camp).toHaveCount(2);
	await expect(camp.first()).toContainText("Alpha");
	await expect(page.getByTestId("dash-campaigns")).not.toContainText("Zed");
	await page.getByTestId("dash-report-link").click();
	await expect(page.getByTestId("reporting-view")).toBeVisible();

	// W8: real dialogs
	await page.getByRole("link", { name: "Dashboard" }).first().click();
	await page.getByTestId("dash-new-task").click();
	await expect(page.getByTestId("new-task-dialog")).toBeVisible();
	await page.keyboard.press("Escape");
	await page.getByTestId("dash-new-lead").click();
	await expect(page.getByTestId("new-lead-dialog")).toBeVisible();
	expect(await noPageOverflow(page)).toBe(true);
});

test("dashboard counts cap at 50+ (and N+) when the server has another page, never above what it returned", async ({
	page,
}) => {
	const f = await fixture();
	const now = Date.now();
	await mockTasks(page, "overdue", (r) =>
		json(r, 200, {
			data: Array.from({ length: 50 }, (_, i) => fakeTask(i, now - (i + 1) * HOUR)),
			next_cursor: randomUUID(),
		}),
	);
	await mockTasks(page, "today", (r) =>
		json(r, 200, {
			// the server returns overdue rows too; only the three upcoming ones count for "next 24 hours"
			data: [
				...Array.from({ length: 47 }, (_, i) => fakeTask(100 + i, now - (i + 1) * HOUR)),
				...[1, 2, 3].map((h) => fakeTask(200 + h, now + h * HOUR)),
			],
			next_cursor: randomUUID(),
		}),
	);
	await open(page, f, "en");
	await expect(page.getByTestId("kpi-overdue").locator(".sy-kpi__value")).toHaveText("50+");
	await expect(page.getByTestId("kpi-overdue")).toContainText("50 or more; open Tasks for the full list");
	await expect(page.getByTestId("kpi-next24h").locator(".sy-kpi__value")).toHaveText("3+");
	await expect(page.getByTestId("dash-followup")).toHaveCount(5);
	// no list is paged beyond page 1
	const cursors: string[] = [];
	page.on("request", (q) => {
		if (q.url().includes("cursor=")) cursors.push(q.url());
	});
	await page.reload();
	await expect(page.getByTestId("kpi-overdue")).toBeVisible();
	expect(cursors).toEqual([]);
});

test("dashboard empty states: zeros are exact, every empty widget names a next action, no card is filled", async ({
	page,
}) => {
	const f = await fixture();
	await open(page, f, "en");
	await expect(page.getByTestId("kpi-overdue").locator(".sy-kpi__value")).toHaveText("0");
	await expect(page.getByTestId("kpi-overdue")).toContainText("Nothing overdue");
	await expect(page.getByTestId("kpi-next24h")).toContainText("Nothing due soon");
	await expect(page.getByTestId("dash-followups")).toContainText("No follow-ups due. Add one to stay on track.");
	await expect(page.getByTestId("dash-marketing")).toContainText("No attribution results yet");
	await expect(page.getByTestId("dash-marketing")).toContainText("Results appear after a calculation run");
	await expect(page.getByTestId("dash-campaigns")).toContainText("No attribution results yet");
	await expect(page.getByTestId("kpi-revenue")).toContainText("No attribution results yet");
	await expect(filled(page)).toHaveCount(0);
	await page.getByTestId("dash-empty-add-task").click();
	await expect(page.getByTestId("new-task-dialog")).toBeVisible();
});

test("dashboard stale report (no published run) never earns the revenue emphasis", async ({
	page,
}) => {
	const f = await fixture();
	await page.route(REPORT_PATH, (r) => json(r, 200, reportBody({ run_id: null, as_of: null })));
	await open(page, f, "en");
	await expect(page.getByTestId("kpi-revenue")).toContainText(/1,400/);
	await expect(page.getByTestId("kpi-revenue")).toHaveAttribute("data-tone", "neutral");
	await expect(page.getByTestId("dash-meta")).toContainText("Not calculated yet");
	await expect(filled(page)).toHaveCount(0);
});

test("dashboard error: a failing widget group shows Retry and never blanks the others", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const lead = await makeLead(request, f, "Err");
	await makeTask(request, f, lead.contact_id, "Still listed", Date.now() - 2 * HOUR);
	let failing = true;
	await page.route(REPORT_PATH, (r) =>
		failing ? json(r, 500, { code: "INTERNAL" }) : json(r, 200, reportBody()),
	);
	await open(page, f, "en");
	await expect(page.getByTestId("kpi-revenue")).toContainText("Retry");
	await expect(page.getByTestId("dash-marketing").getByTestId("state-error")).toContainText(
		"Could not load this section. Try again.",
	);
	await expect(page.getByTestId("dash-campaigns").getByTestId("state-error")).toBeVisible();
	// tasks side is unaffected
	await expect(page.getByTestId("kpi-overdue").locator(".sy-kpi__value")).toHaveText("1");
	await expect(page.getByTestId("dash-followups")).toContainText("Still listed");
	failing = false;
	await page.getByTestId("dash-marketing").getByRole("button", { name: "Retry" }).click();
	await expect(page.getByTestId("kpi-revenue")).toContainText(/1,400/);
	await expect(page.getByTestId("dash-campaign-row").first()).toContainText("Alpha");
});

test("dashboard permission: 403 on reports leaves tasks working; 403 on tasks leaves marketing working", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const lead = await makeLead(request, f, "Perm");
	await makeTask(request, f, lead.contact_id, "Visible task", Date.now() - HOUR);
	await page.route(REPORT_PATH, (r) => json(r, 403, { code: "FORBIDDEN" }));
	await open(page, f, "en");
	await expect(page.getByTestId("kpi-revenue")).toContainText("You do not have access to marketing reports.");
	await expect(page.getByTestId("dash-marketing").getByTestId("state-forbidden")).toContainText(
		"You do not have access to marketing reports.",
	);
	await expect(page.getByTestId("dash-campaigns").getByTestId("state-forbidden")).toBeVisible();
	await expect(page.getByTestId("kpi-overdue").locator(".sy-kpi__value")).toHaveText("1");
	await expect(page.getByTestId("dash-followups")).toContainText("Visible task");

	await page.unroute(REPORT_PATH);
	await page.route(REPORT_PATH, (r) => json(r, 200, reportBody()));
	await mockTasks(page, "overdue", (r) => json(r, 403, { code: "FORBIDDEN" }));
	await mockTasks(page, "today", (r) => json(r, 403, { code: "FORBIDDEN" }));
	await page.reload();
	await expect(page.getByTestId("dashboard-view")).toBeVisible();
	await expect(page.getByTestId("kpi-overdue")).toContainText("You do not have access to tasks.");
	await expect(page.getByTestId("dash-followups").getByTestId("state-forbidden")).toBeVisible();
	await expect(page.getByTestId("kpi-revenue")).toContainText(/1,400/);
});

test("dashboard ar: Arabic copy, RTL, no page overflow at 1440 and 375, campaign cards on mobile", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const lead = await makeLead(request, f, "Ar");
	await makeTask(request, f, lead.contact_id, "مهمة متأخرة", Date.now() - 48 * HOUR);
	await page.route(REPORT_PATH, (r) => json(r, 200, reportBody()));
	await open(page, f, "ar", 1440);
	await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
	await expect(page.getByRole("heading", { level: 1 })).toHaveText("لوحة المتابعة");
	await expect(page.getByText("ما يحتاج إلى إجراء الآن وأداء الحملات")).toBeVisible();
	await expect(page.getByTestId("kpi-overdue")).toContainText("متابعات متأخرة");
	await expect(page.getByTestId("kpi-next24h")).toContainText("مستحقة خلال ٢٤ ساعة");
	await expect(page.getByTestId("kpi-revenue")).toContainText("الإيراد المنسوب");
	await expect(page.getByTestId("kpi-roas")).toContainText("العائد على الإنفاق الإعلاني");
	await expect(page.getByTestId("dash-followups")).toContainText("متابعات مطلوبة");
	await expect(page.getByTestId("dash-marketing")).toContainText("لمحة التسويق");
	await expect(page.getByTestId("dash-campaigns")).toContainText("أفضل الحملات");
	// Arabic digits per locale; no Latin comma/period pair detached at the start of the money string
	await expect(page.getByTestId("kpi-overdue").locator(".sy-kpi__value")).toHaveText("١");
	expect(await noPageOverflow(page)).toBe(true);

	await page.setViewportSize({ width: 375, height: 800 });
	await expect(page.getByTestId("dash-campaign-cards")).toBeVisible();
	await expect(page.getByTestId("dash-campaign-table")).toHaveCount(0);
	expect(await noPageOverflow(page)).toBe(true);
	await page.setViewportSize({ width: 375, height: 800 });
	const small = await page
		.locator(".sy-dash__actions .sy-btn")
		.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
	expect(Math.min(...small)).toBeGreaterThanOrEqual(44);
});

test("dashboard en 375: single column KPI grid 2x2 without page overflow", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const lead = await makeLead(request, f, "Mob");
	await makeTask(request, f, lead.contact_id, "A very long follow-up title that must wrap and never push the page sideways", Date.now() - HOUR);
	await page.route(REPORT_PATH, (r) => json(r, 200, reportBody()));
	await open(page, f, "en", 375);
	const boxes = await page
		.getByTestId("dash-kpis")
		.locator("[data-tone]")
		.evaluateAll((els) => els.map((e) => ({ x: Math.round(e.getBoundingClientRect().left), y: Math.round(e.getBoundingClientRect().top) })));
	expect(boxes).toHaveLength(4);
	expect(new Set(boxes.map((b) => b.x)).size).toBe(2); // two columns
	expect(new Set(boxes.map((b) => b.y)).size).toBe(2); // two rows
	expect(await noPageOverflow(page)).toBe(true);
});

test("the /app/ landing renders the dashboard, not the placeholder", async ({
	page,
}) => {
	const f = await fixture();
	await open(page, f, "en", 1440, "/app/");
	await expect(page.getByTestId("kpi-overdue")).toBeVisible();
	await expect(page.getByText("This screen is built in a later slice.")).toHaveCount(0);
	await expect(page.getByTestId("nav-dashboard")).toHaveAttribute("aria-current", "page");
});

for (const language of ["en", "ar"] as const)
	test(`leads ${language}: subtitle and Open/Qualified/Closed strip from the loaded list`, async ({
		page,
		request,
	}) => {
		const f = await fixture();
		const a = await makeLead(request, f, "One");
		await makeLead(request, f, "Two");
		const c = await makeLead(request, f, "Three");
		const d = await makeLead(request, f, "Four");
		await setLeadStatus(request, f, a, "qualified");
		await setLeadStatus(request, f, c, "closed");
		await setLeadStatus(request, f, d, "closed");
		await open(page, f, language, 1440, "/app/leads", "leads-view");
		const L = {
			en: ["Manage and qualify incoming leads", "Open", "Qualified", "Closed"],
			ar: ["إدارة العملاء المحتملين وتأهيلهم", "مفتوحة", "مؤهلة", "مغلقة"],
		}[language];
		const num = (n: number) => (language === "ar" ? String.fromCharCode(0x660 + n) : String(n));
		await expect(page.getByText(L[0] as string)).toBeVisible();
		await expect(page.getByTestId("leads-kpis").locator("[data-tone]")).toHaveCount(3);
		await expect(page.getByTestId("leads-kpi-open")).toContainText(L[1] as string);
		await expect(page.getByTestId("leads-kpi-open").locator(".sy-kpi__value")).toHaveText(num(1));
		await expect(page.getByTestId("leads-kpi-qualified").locator(".sy-kpi__value")).toHaveText(num(1));
		await expect(page.getByTestId("leads-kpi-qualified")).toHaveAttribute("data-tone", "navy");
		await expect(page.getByTestId("leads-kpi-closed").locator(".sy-kpi__value")).toHaveText(num(2));
		await expect(page.getByTestId("leads-kpi-open")).toHaveAttribute("data-tone", "neutral");
		// a filtered view says so
		await page.getByRole("tab").nth(1).click();
		await expect(page.getByTestId("leads-kpi-open")).toContainText(language === "en" ? "In this view" : "في هذا العرض");
	});

test("leads 375: the three strip cards share one row without page overflow; strip capped with N+ when pages remain", async ({
	page,
}) => {
	const f = await fixture();
	await page.route("**/v1/leads", (r) =>
		json(r, 200, {
			data: [
				{ id: randomUUID(), contact_id: randomUUID(), owner_id: null, title: "L1", source: "manual", source_evidence: "x", status: "open", version: 1, received_at: new Date().toISOString() },
				{ id: randomUUID(), contact_id: randomUUID(), owner_id: null, title: "L2", source: "manual", source_evidence: "x", status: "qualified", version: 1, received_at: new Date().toISOString() },
			],
			next_cursor: randomUUID(),
		}),
	);
	await open(page, f, "en", 375, "/app/leads", "leads-view");
	await expect(page.getByTestId("leads-kpi-open").locator(".sy-kpi__value")).toHaveText("1+");
	await expect(page.getByTestId("leads-kpi-closed").locator(".sy-kpi__value")).toHaveText("0+");
	await expect(page.getByTestId("leads-kpi-open")).toContainText("Loaded so far");
	const tops = await page
		.getByTestId("leads-kpis")
		.locator("[data-tone]")
		.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
	expect(new Set(tops).size).toBe(1);
	expect(await noPageOverflow(page)).toBe(true);
});
