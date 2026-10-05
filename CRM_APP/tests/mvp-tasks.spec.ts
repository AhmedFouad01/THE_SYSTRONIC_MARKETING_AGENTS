import { randomUUID } from "node:crypto";
import {
	type APIRequestContext,
	expect,
	type Page,
	test,
} from "@playwright/test";
import pg from "pg";
import { seed } from "../scripts/seed.js";
import { pickDay, pickLabel } from "./select-helper.js";

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
	return (await res.json()).data as { id: string; version: number };
}

async function completeViaApi(
	request: APIRequestContext,
	f: Fixture,
	t: { id: string; version: number },
) {
	const command_id = randomUUID();
	const res = await request.patch(`/v1/tasks/${t.id}`, {
		headers: headers(f, command_id),
		data: { command_id, expected_version: t.version, status: "completed" },
	});
	expect(res.status()).toBe(200);
}

async function makeDeal(request: APIRequestContext, f: Fixture, title: string) {
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
			amount_minor: 1000,
			currency: "EGP",
		},
	});
	expect(res.status()).toBe(201);
	return {
		...((await res.json()).data as { id: string }),
		contact_id: lead.contact_id,
	};
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
	path = "/app/tasks",
) => {
	await page.addInitScript(
		(l) => localStorage.setItem("sy.locale", l),
		language,
	);
	await page.goto(path);
	await connect(page, f.tokens.manager, f.ids.a);
};

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** A moment later today (local) that is safely in the future, falling back to "now + 1 minute" near midnight. */
function laterToday(): number {
	const now = new Date();
	const end = new Date(now);
	end.setHours(23, 59, 0, 0);
	return now.getTime() + Math.max(60_000, (end.getTime() - now.getTime()) / 2);
}
/** Local `YYYY-MM-DDTHH:mm` for the datetime-local input, `days` from now at 09:00. */
function inputIn(days: number): string {
	const d = new Date(Date.now() + days * DAY);
	const p = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T09:00`;
}

test("tasks en: list, due tabs, overdue badge, no-date tab empty, owner filter and search", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const lead = await makeLead(request, f, "Tabs");
	await makeTask(
		request,
		f,
		lead.contact_id,
		"Overdue task",
		Date.now() - 2 * DAY,
	);
	await makeTask(request, f, lead.contact_id, "Today task", laterToday());
	await makeTask(
		request,
		f,
		lead.contact_id,
		"Upcoming task",
		Date.now() + 3 * DAY,
	);
	const done = await makeTask(
		request,
		f,
		lead.contact_id,
		"Done task",
		Date.now() + DAY,
	);
	await completeViaApi(request, f, done);
	await open(page, f, "en");
	await expect(page.getByTestId("tasks-view")).toBeVisible();

	await expect(rows(page)).toHaveCount(3); // Open = everything not done
	await expect(rows(page).first()).toContainText("Overdue task"); // default sort: due ascending
	await expect(
		rows(page).filter({ hasText: "Overdue task" }).getByTestId("overdue-badge"),
	).toBeVisible();

	const tab = async (name: string, expected: string[]) => {
		await page.getByRole("tab", { name, exact: true }).click();
		await expect(rows(page)).toHaveCount(expected.length);
		for (const title of expected)
			await expect(rows(page).filter({ hasText: title })).toHaveCount(1);
	};
	await tab("Overdue", ["Overdue task"]);
	await tab("Today", ["Today task"]);
	await tab("Upcoming", ["Upcoming task"]);
	await tab("No date", []); // API requires due_at, so undated tasks cannot exist yet
	await tab("Done", ["Done task"]);
	await expect(rows(page).first().getByTestId("task-related")).toContainText(
		"Contact Tabs",
	);

	await tab("Open", ["Overdue task", "Today task", "Upcoming task"]);
	await page.getByTestId("grid-search").fill("upcoming");
	await expect(rows(page)).toHaveCount(1);
	await page.getByTestId("grid-search").fill("");
	await expect(rows(page)).toHaveCount(3);
	await rows(page)
		.filter({ hasText: "Today task" })
		.click({ position: { x: 10, y: 10 } });
	await expect(page.getByTestId("task-detail-title")).toHaveText("Today task");
	// UX-17: the Source column is hidden by default and Columns restores it. An unknown origin ("Not recorded") adds no
	// information, so the record's fact grid omits the Source row instead of showing it.
	await expect(page.getByRole("columnheader", { name: "Source" })).toHaveCount(
		0,
	);
	await expect(page.getByTestId("record-facts")).not.toContainText("Source");
	await expect(page.getByTestId("record-facts")).not.toContainText(
		"Not recorded",
	);
	await page.getByTestId("grid-columns").click();
	await page.getByRole("checkbox", { name: "Source" }).check();
	await expect(page.getByTestId("task-source").first()).toHaveAttribute(
		"data-source",
		"unknown",
	);
});

test("tasks en: Add task from deal detail keeps the relation; related link returns to the deal", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const deal = await makeDeal(request, f, "Relation deal");
	await open(page, f, "en", "/app/deals");
	await rows(page)
		.filter({ hasText: "Relation deal" })
		.click({ position: { x: 10, y: 10 } });
	// The deal record page offers Add task in its Tasks tab.
	await page.getByRole("tab", { name: "Tasks" }).click();
	await page.getByTestId("add-task").click();
	const dialog = page.getByTestId("new-task-dialog");
	await expect(dialog).toBeVisible();
	await expect(page.getByTestId("new-task-related")).toContainText(
		"Relation deal",
	);
	await page.getByTestId("new-task-submit").click();
	await expect(dialog.getByText("This field is required.")).toHaveCount(2);
	await dialog.getByLabel("Title").fill("Send proposal");
	await pickDay(dialog.getByLabel("Due"), inputIn(2));
	await page.getByTestId("new-task-submit").click();
	await expect(dialog).toHaveCount(0);
	await expect(
		page.getByTestId("toast").filter({ hasText: "Task created." }),
	).toBeVisible();
	await expect(page.getByTestId("deal-task")).toContainText("Send proposal");

	const list = (
		await (await request.get("/v1/tasks", { headers: headers(f) })).json()
	).data as Array<{
		title: string;
		deal_id: string;
		contact_id: string;
		owner_id: string;
	}>;
	expect(list).toHaveLength(1);
	expect(list[0]).toMatchObject({
		title: "Send proposal",
		deal_id: deal.id,
		contact_id: deal.contact_id,
		owner_id: f.ids.manager,
	});

	await page.goto("/app/tasks");
	await expect(rows(page)).toHaveCount(1);
	// UX-R2-01: the grid's Related column drops out beside the open record, whose subtitle carries the same link.
	await page.locator('[data-testid="task-related"]:visible').first().click();
	await expect(page.getByTestId("deal-detail-title")).toHaveText(
		"Relation deal",
	);
});

test("tasks en: Add task is offered on lead and contact detail, prefilled", async ({
	page,
	request,
}) => {
	const f = await fixture();
	await makeLead(request, f, "Ctx");
	await open(page, f, "en", "/app/leads");
	await rows(page)
		.first()
		.click({ position: { x: 10, y: 10 } });
	await page.getByTestId("add-task").click();
	await expect(page.getByTestId("new-task-related")).toContainText(
		"Contact Ctx",
	);
	await page.keyboard.press("Escape");
	await page.goto("/app/contacts");
	await rows(page)
		.first()
		.click({ position: { x: 10, y: 10 } });
	await page.getByTestId("add-task").click();
	await expect(page.getByTestId("new-task-related")).toContainText(
		"Contact Ctx",
	);
});

test("tasks en: create from the Tasks screen needs a contact; complete from row and detail, edit, 409 conflict", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const lead = await makeLead(request, f, "Flow");
	const t1 = await makeTask(
		request,
		f,
		lead.contact_id,
		"Row task",
		Date.now() + DAY,
	);
	await makeTask(request, f, lead.contact_id, "Detail task", Date.now() + DAY);
	await open(page, f, "en");
	await expect(rows(page)).toHaveCount(2);

	// create: contact is required here (no context)
	await page.getByTestId("new-task").click();
	const dialog = page.getByTestId("new-task-dialog");
	await dialog.getByLabel("Title").fill("Fresh task");
	await pickDay(dialog.getByLabel("Due"), inputIn(4));
	await page.getByTestId("new-task-submit").click();
	await expect(dialog.getByText("This field is required.")).toHaveCount(1);
	await pickLabel(dialog.getByLabel("Contact"), "Contact Flow");
	await page.getByTestId("new-task-submit").click();
	await expect(dialog).toHaveCount(0);
	await expect(rows(page)).toHaveCount(3);
	await expect(page.getByTestId("task-detail-title")).toHaveText("Fresh task");

	// complete from the row: it leaves Open and appears in Done
	await rows(page)
		.filter({ hasText: "Row task" })
		.getByRole("button", { name: "Complete task Row task" })
		.click();
	await expect(rows(page)).toHaveCount(2);
	await page.getByRole("tab", { name: "Done", exact: true }).click();
	await expect(rows(page)).toHaveCount(1);
	await expect(rows(page).first()).toContainText("Row task");
	const after = await (
		await request.get(`/v1/tasks/${t1.id}`, { headers: headers(f) })
	).json();
	expect(after.data).toMatchObject({
		status: "completed",
		version: t1.version + 1,
	});
	await expect(
		rows(page)
			.first()
			.getByRole("button", { name: /Complete task/ }),
	).toHaveCount(0);

	// edit + complete from the detail panel
	await page.getByRole("tab", { name: "Open", exact: true }).click();
	await rows(page)
		.filter({ hasText: "Detail task" })
		.click({ position: { x: 10, y: 10 } });
	const detail = page.getByTestId("task-detail");
	await page.getByTestId("record-edit").click();
	await detail.getByLabel("Title").fill("Detail task renamed");
	await page.getByTestId("task-save").click();
	await expect(page.getByTestId("task-detail-title")).toHaveText(
		"Detail task renamed",
	);

	// forced stale write: 409 -> banner, reload recovers
	await page.getByTestId("record-edit").click();
	await detail.getByLabel("Title").fill("Stale rename");
	let forced = true;
	await page.route("**/v1/tasks/*", (route) => {
		if (forced && route.request().method() === "PATCH") {
			forced = false;
			return route.fulfill({
				status: 409,
				contentType: "application/json",
				body: JSON.stringify({
					code: "VERSION_CONFLICT",
					safe_message: "stale",
					request_id: "r",
					retryable: false,
				}),
			});
		}
		return route.continue();
	});
	await page.getByTestId("task-save").click();
	await expect(page.getByTestId("task-conflict")).toBeVisible();
	await page.getByTestId("task-reload").click();
	await expect(page.getByTestId("task-conflict")).toHaveCount(0);
	await page.unroute("**/v1/tasks/*");
	await page.getByTestId("record-edit-cancel").click();
	await page.getByTestId("task-complete").click();
	await expect(page.getByTestId("task-detail-status")).toContainText("Done");
	await expect(page.getByTestId("task-complete")).toHaveCount(0);
});

test("tasks en: bulk complete with one forced 409 reports partial failure", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const lead = await makeLead(request, f, "Bulk");
	await makeTask(request, f, lead.contact_id, "Alpha task", Date.now() + DAY);
	await makeTask(
		request,
		f,
		lead.contact_id,
		"Bravo task",
		Date.now() + 2 * DAY,
	);
	const charlie = await makeTask(
		request,
		f,
		lead.contact_id,
		"Charlie task",
		Date.now() + 3 * DAY,
	);
	await open(page, f, "en");
	await expect(rows(page)).toHaveCount(3);
	await page.route(`**/v1/tasks/${charlie.id}`, (route) =>
		route.request().method() === "PATCH"
			? route.fulfill({
					status: 409,
					contentType: "application/json",
					body: JSON.stringify({
						code: "VERSION_CONFLICT",
						safe_message: "stale",
						request_id: "r",
						retryable: false,
					}),
				})
			: route.continue(),
	);
	for (const name of ["Alpha task", "Bravo task", "Charlie task"])
		await page.getByRole("checkbox", { name: `Select row ${name}` }).check();
	await expect(page.getByTestId("grid-batch")).toContainText("3 selected");
	await page.getByTestId("bulk-complete").click();
	await expect(
		page.locator('[role="alert"] [data-testid="toast"]'),
	).toContainText("2 completed, 1 failed");
	await page.unroute(`**/v1/tasks/${charlie.id}`);
	await expect(rows(page)).toHaveCount(1); // Charlie stays open (reloaded)
	await expect(rows(page).first()).toContainText("Charlie task");
	await page.getByRole("tab", { name: "Done", exact: true }).click();
	await expect(rows(page)).toHaveCount(2);
});

for (const width of [360, 1280])
	for (const language of ["ar", "en"] as const)
		test(`tasks ${language} ${width}px: list, tabs, detail, dialog, no page overflow`, async ({
			page,
			request,
		}) => {
			const f = await fixture();
			const lead = await makeLead(request, f, "Layout");
			await makeTask(
				request,
				f,
				lead.contact_id,
				"Alpha task",
				Date.now() - DAY,
			);
			await makeTask(
				request,
				f,
				lead.contact_id,
				"Bravo task",
				Date.now() + DAY,
			);
			const errors: string[] = [];
			page.on("pageerror", (e) => errors.push(e.message));
			await page.setViewportSize({ width, height: 800 });
			await open(page, f, language);
			await expect(page.getByTestId("tasks-view")).toBeVisible();
			await expect(page.locator("html")).toHaveAttribute(
				"dir",
				language === "ar" ? "rtl" : "ltr",
			);
			await expect(rows(page)).toHaveCount(2);
			expect(await noPageOverflow(page)).toBe(true);
			await rows(page)
				.filter({ hasText: "Alpha task" })
				.click({ position: { x: 10, y: 10 } });
			await expect(page.getByTestId("task-detail-title")).toHaveText(
				"Alpha task",
			);
			await expect(page.getByTestId("overdue-badge").first()).toBeVisible();
			expect(await noPageOverflow(page)).toBe(true);
			if (width < 1024) {
				await page.getByTestId("sheet-back").click();
				await expect(page.getByTestId("task-detail")).toHaveCount(0);
			}
			const opener = page.getByTestId("new-task");
			await opener.click();
			await expect(page.getByRole("dialog")).toBeVisible();
			expect(await noPageOverflow(page)).toBe(true);
			await page.keyboard.press("Escape");
			await expect(page.getByRole("dialog")).toHaveCount(0);
			await expect(opener).toBeFocused();
			expect(errors).toEqual([]);
		});

// DEFERRED: automation-generated task badge. The API exposes no source/automation marker on tasks, and
// automation runs are not readable via /v1; the model honours `source`/`automation_run_id` once the API adds them
// (covered by the taskSource unit test).

test("tasks en: Overdue/Today tabs use the server ?due= filter; due cell, links and rows follow UX-17", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const lead = await makeLead(request, f, "Due");
	await makeTask(request, f, lead.contact_id, "Late task", Date.now() - 3 * DAY);
	await makeTask(request, f, lead.contact_id, "Today task", laterToday());
	await makeTask(request, f, lead.contact_id, "Later task", Date.now() + 3 * DAY);
	const taskUrls: string[] = [];
	page.on("request", (r) => {
		const u = new URL(r.url());
		if (u.pathname === "/v1/tasks") taskUrls.push(u.search);
	});
	await page.setViewportSize({ width: 1920, height: 1000 }); // wide enough that the Related column is not collapsed
	await open(page, f, "en");
	await expect(rows(page)).toHaveCount(3);
	expect(taskUrls.some((q) => q.includes("due="))).toBe(false); // Open = plain list

	// Overdue: the chip carries the whole-day count, the date is short (no clock time), rows are 48px
	const late = rows(page).filter({ hasText: "Late task" });
	await expect(late.getByTestId("overdue-badge")).toHaveText(/Overdue [23]d/);
	await expect(late).not.toContainText(/\d{1,2}:\d{2}/);
	const box = await late.boundingBox();
	expect(Math.round(box?.height ?? 0)).toBe(48);

	// related link: plain text at rest (no underline), primary colour on hover
	const link = late.getByTestId("task-related");
	await expect(link).toHaveCSS("text-decoration-line", "none");
	const rest = await link.evaluate((el) => getComputedStyle(el).color);
	await link.hover();
	await expect.poll(() => link.evaluate((el) => getComputedStyle(el).color)).not.toBe(rest);

	await page.getByRole("tab", { name: "Overdue", exact: true }).click();
	await expect(rows(page)).toHaveCount(1);
	await expect(rows(page).first()).toContainText("Late task");
	await expect.poll(() => taskUrls.some((q) => q.includes("due=overdue"))).toBe(true);
	await page.getByRole("tab", { name: "Today", exact: true }).click();
	await expect(rows(page)).toHaveCount(1);
	await expect(rows(page).first()).toContainText("Today task"); // the server's today set also holds overdue; the tab filters it
	await expect.poll(() => taskUrls.some((q) => q.includes("due=today"))).toBe(true);
	expect(await noPageOverflow(page)).toBe(true);
});
