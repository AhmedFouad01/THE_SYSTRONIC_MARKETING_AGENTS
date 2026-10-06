import { randomUUID } from "node:crypto";
import { type APIRequestContext, expect, type Page, test } from "@playwright/test";
import pg from "pg";
import { seed } from "../scripts/seed.js";
import { pickLabel } from "./select-helper.js";

process.loadEnvFile(".env");

// UX re-audit r3 regressions (R2-05, R3-01..R3-07). Each check observes RENDERED geometry/text, not just markup.
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

async function makeLead(request: APIRequestContext, f: Fixture, title: string, contact = `Contact ${title}`) {
	const command_id = randomUUID();
	const res = await request.post("/v1/leads", {
		headers: headers(f, command_id),
		data: { command_id, title, source_evidence: "synthetic", contact: { display_name: contact } },
	});
	expect(res.status()).toBe(201);
	return (await res.json()).data as { id: string; contact_id: string };
}

async function makeTask(request: APIRequestContext, f: Fixture, contactId: string, title: string, dueMs: number) {
	const command_id = randomUUID();
	const res = await request.post("/v1/tasks", {
		headers: headers(f, command_id),
		data: { command_id, title, contact_id: contactId, due_at: new Date(dueMs).toISOString() },
	});
	expect(res.status()).toBe(201);
}

/** A 5-stage pipeline with one deal moved to its 3rd stage (stepper has to scroll on a phone). */
async function makeStepperDeal(request: APIRequestContext, f: Fixture, title: string) {
	const lead = await makeLead(request, f, `L ${title}`);
	let command_id = randomUUID();
	const pr = await request.post("/v1/pipelines", {
		headers: headers(f, command_id),
		data: {
			command_id,
			name: "Sales flow",
			stages: [
				{ name: "New" },
				{ name: "Qualified" },
				{ name: "Proposal" },
				{ name: "Negotiation" },
				{ name: "Won", outcome: "won" },
			],
			transitions: [
				[0, 1],
				[1, 2],
				[2, 3],
				[3, 4],
			],
		},
	});
	expect(pr.status()).toBe(201);
	const pid = (await pr.json()).data.id as string;
	const list = (await (await request.get("/v1/pipelines", { headers: headers(f) })).json()).data as Array<{
		id: string;
		stages: Array<{ id: string; name: string }>;
	}>;
	const stages = list.find((p) => p.id === pid)?.stages ?? [];
	const stage = (n: string) => stages.find((s) => s.name === n)?.id;
	command_id = randomUUID();
	const res = await request.post("/v1/deals", {
		headers: headers(f, command_id),
		data: {
			command_id,
			contact_id: lead.contact_id,
			pipeline_id: pid,
			stage_id: stage("New"),
			title,
			amount_minor: 19814000,
			currency: "EGP",
		},
	});
	expect(res.status()).toBe(201);
	const deal = (await res.json()).data as { id: string; version: number };
	let version = deal.version;
	for (const to of ["Qualified", "Proposal", "Negotiation"]) {
		command_id = randomUUID();
		const t = await request.post(`/v1/deals/${deal.id}/transitions`, {
			headers: headers(f, command_id),
			data: { command_id, to_stage_id: stage(to), expected_version: version, reason: "" },
		});
		expect(t.status()).toBeLessThan(300);
		version++;
	}
	return deal.id;
}

async function open(page: Page, f: Fixture, language: "ar" | "en", path: string) {
	await page.addInitScript((l) => localStorage.setItem("sy.locale", l), language);
	await page.goto(path);
	await page.locator("input[name=token]").fill(f.tokens.manager);
	await page.locator("input[name=tenant]").fill(f.ids.a);
	await page.getByTestId("connect-submit").click();
	await expect(page.getByTestId("actor")).toBeVisible();
}

const DAY = 24 * 3_600_000;
const noPageOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

test("R2-05 AR money: ONE isolate, no stray period at the visual edge, in grid, deal record and pipeline", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const dealId = await makeStepperDeal(request, f, "Money deal");
	await page.setViewportSize({ width: 1440, height: 900 });
	await open(page, f, "ar", "/app/deals");
	const money = page.locator("tbody bdi.sy-money").filter({ hasText: "١٩٨" }).first();
	await expect(money).toBeVisible();
	const text = ((await money.textContent()) ?? "").replace(/[‎‏ \s]/g, "");
	expect(text).toMatch(/^[٠-٩٬٫]+ج\.م$/);
	// the rendered glyph run ends with the letter "م": nothing "." sits at the far visual edge of the amount
	const edge = await money.evaluate((node) => {
		const t = node.firstChild as Text;
		const rect = (i: number) => {
			const r = document.createRange();
			r.setStart(t, i);
			r.setEnd(t, i + 1);
			return r.getBoundingClientRect();
		};
		const visible = [...t.data].map((ch, i) => ({ ch, i })).filter((x) => /\S/.test(x.ch) && !/[‎‏]/.test(x.ch));
		const leftmost = visible.reduce((a, b) => (rect(a.i).left <= rect(b.i).left ? a : b));
		return leftmost.ch;
	});
	expect(edge).toBe("م");
	await page.goto(`/app/deals?select=${dealId}`);
	await expect(page.getByTestId("deal-stepper")).toBeVisible();
	const stat = page.locator("bdi.sy-money").first();
	await expect(stat).toContainText("ج.م");
	expect(((await stat.textContent()) ?? "").replace(/[‎‏ \s]/g, "")).toMatch(/^[٠-٩٬٫]+ج\.م$/);
	await page.screenshot({ path: "audits/2026-10-05/shots-r3-fix/test-ar-deal-record.png" });
	await page.getByTestId("nav-pipeline").click();
	// the board opens on whichever pipeline sorts first; choose the one that holds this deal, deterministically
	await pickLabel(page.getByTestId("pipeline-select"), "Sales flow");
	await expect(page.locator("bdi.sy-money").filter({ hasText: "١٩٨" }).first()).toBeVisible();
	await page.waitForTimeout(300);
	await page.screenshot({ path: "audits/2026-10-05/shots-r3-fix/test-ar-pipeline.png" });
});

test("R3-03 / R2-07 AR zero is a readable 0 (not the bare dot); longer numbers keep Arabic-Indic digits", async ({
	page,
	request,
}) => {
	const f = await fixture();
	await makeLead(request, f, "Only lead");
	await page.setViewportSize({ width: 1440, height: 900 });
	await open(page, f, "ar", "/app/leads");
	await expect(page.getByTestId("leads-view")).toBeVisible();
	const kpiText = await page.locator(".sy-leads__kpis .sy-kpi__value").allTextContents();
	expect(kpiText.length).toBeGreaterThanOrEqual(3);
	expect(kpiText.some((v) => v.trim() === "0")).toBe(true);
	for (const v of kpiText) expect(v).not.toBe("٠");
	await expect(page.locator(".sy-leads__kpis .sy-kpi__value").first()).toHaveText("١");
	await page.screenshot({ path: "audits/2026-10-05/shots-r3-fix/test-ar-leads-zero.png" });
	await page.getByTestId("nav-reporting").click();
	await expect(page.getByTestId("reporting-view")).toBeVisible();
	await page.getByTestId("report-days").fill("30");
	// helper sentence: Arabic-Indic digits, no parenthesis + final period that reorders into ".(365)"
	const hint = page.locator(".sy-rep__days .sy-field__hint");
	await expect(hint).toBeVisible();
	const hintText = (await hint.textContent()) ?? "";
	expect(hintText).toContain("٣٦٥");
	expect(hintText).not.toMatch(/[()0-9]/);
	await expect(page.locator(".sy-kpi__value").filter({ hasText: /^٠$/ })).toHaveCount(0);
	await page.screenshot({ path: "audits/2026-10-05/shots-r3-fix/test-ar-reporting.png" });
});

test("R3-05 AR 375 bottom nav: five short labels, none overlapping or clipped", async ({ page, request }) => {
	const f = await fixture();
	await makeLead(request, f, "Nav lead");
	await page.setViewportSize({ width: 375, height: 780 });
	await open(page, f, "ar", "/app/leads");
	const labels = page.locator(".sy-bottomnav .sy-nav__label");
	await expect(labels).toHaveCount(5);
	expect(await labels.allTextContents()).toEqual(["العملاء", "جهات", "صفقات", "مهامي", "المزيد"]);
	const geometry = await page.locator(".sy-bottomnav .sy-nav").evaluateAll((tabs) =>
		tabs.map((tab) => {
			const t = tab.getBoundingClientRect();
			const l = (tab.querySelector(".sy-nav__label") as HTMLElement).getBoundingClientRect();
			const label = tab.querySelector(".sy-nav__label") as HTMLElement;
			return {
				left: t.left,
				right: t.right,
				labelLeft: l.left,
				labelRight: l.right,
				clipped: label.scrollWidth > label.clientWidth + 1,
			};
		}),
	);
	const byLeft = [...geometry].sort((a, b) => a.left - b.left);
	for (const g of geometry) {
		expect(g.clipped).toBe(false);
		expect(g.labelLeft).toBeGreaterThanOrEqual(g.left - 0.5);
		expect(g.labelRight).toBeLessThanOrEqual(g.right + 0.5);
	}
	for (let i = 1; i < byLeft.length; i++) expect(byLeft[i - 1].right).toBeLessThanOrEqual(byLeft[i].left + 0.5);
	expect(await noPageOverflow(page)).toBe(true);
	await page.screenshot({ path: "audits/2026-10-05/shots-r3-fix/test-ar-375-nav.png" });
});

test("R3-01 dashboard follow-ups name records that are not on page 1, and never say 'Unknown record'", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const lead = await makeLead(request, f, "Far lead", "Far Away Person");
	await makeTask(request, f, lead.contact_id, "Call the far contact", Date.now() - 2 * DAY);
	// simulate "outside the loaded page": the page-1 list endpoints come back empty, by-id reads stay real
	await page.route(/\/v1\/(contacts|deals)(\?.*)?$/, async (route) => {
		if (route.request().method() !== "GET") return route.continue();
		const r = await route.fetch();
		const body = await r.json();
		body.data = [];
		return route.fulfill({ response: r, json: body });
	});
	await open(page, f, "en", "/app/dashboard");
	const rows = page.getByTestId("dash-followup");
	await expect(rows).toHaveCount(1);
	await expect(rows.first()).toContainText("Far Away Person");
	await expect(page.getByTestId("dash-followups")).not.toContainText(/Unknown record|سجل غير معروف/);
	await page.screenshot({ path: "audits/2026-10-05/shots-r3-fix/test-en-dashboard-followups.png" });
});

test("R3-01 dashboard: an unreadable related record shows no caption instead of 'Unknown record'", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const lead = await makeLead(request, f, "Hidden lead", "Hidden Person");
	await makeTask(request, f, lead.contact_id, "Call hidden", Date.now() - DAY);
	await page.route(/\/v1\/contacts(\?.*)?$/, async (route) => {
		const r = await route.fetch();
		const body = await r.json();
		body.data = [];
		return route.fulfill({ response: r, json: body });
	});
	await page.route(/\/v1\/contacts\/[0-9a-f-]{36}$/, (route) =>
		route.fulfill({
			status: 404,
			contentType: "application/json",
			body: JSON.stringify({ code: "NOT_FOUND", safe_message: "missing", request_id: "r", retryable: false }),
		}),
	);
	await open(page, f, "ar", "/app/dashboard");
	const rows = page.getByTestId("dash-followup");
	await expect(rows).toHaveCount(1);
	await expect(rows.first()).toContainText("Call hidden");
	await expect(page.getByTestId("dash-followups")).not.toContainText(/Unknown record|سجل غير معروف/);
	await expect(rows.first().getByTestId("task-related")).toHaveCount(0);
});

test("R3-04 / R3-06 en 375: bulk bar keeps every action on screen; task status tabs all visible", async ({
	page,
	request,
}) => {
	const f = await fixture();
	for (const n of ["Alpha lead", "Bravo lead", "Charlie lead"]) await makeLead(request, f, n);
	await page.setViewportSize({ width: 375, height: 780 });
	await open(page, f, "en", "/app/leads");
	await expect(page.getByTestId("grid-row")).toHaveCount(3);
	for (const n of ["Alpha lead", "Bravo lead", "Charlie lead"])
		await page.getByRole("checkbox", { name: `Select row ${n}` }).check();
	const bar = page.getByTestId("grid-batch");
	await expect(bar).toContainText("3 selected");
	for (const id of ["bulk-assign", "bulk-status", "bulk-add-task", "grid-batch-clear"]) {
		const b = await page.getByTestId(id).boundingBox();
		expect(b, id).not.toBeNull();
		expect((b?.x ?? -1) >= 0 && (b?.x ?? 0) + (b?.width ?? 0) <= 375, `${id} inside the viewport`).toBe(true);
	}
	expect(await bar.evaluate((n) => n.scrollWidth <= n.clientWidth + 1)).toBe(true);
	expect(await noPageOverflow(page)).toBe(true);
	await page.screenshot({ path: "audits/2026-10-05/shots-r3-fix/test-en-375-bulk.png" });

	await page.goto("/app/tasks");
	await expect(page.getByTestId("tasks-view")).toBeVisible();
	const tabs = page.locator(".sy-tabs");
	// the row scrolls on a phone and says so: edge fade is applied, and the last tab can be reached
	expect(await tabs.evaluate((n) => getComputedStyle(n).maskImage)).not.toBe("none");
	const done = page.getByRole("tab", { name: "Done" });
	await done.scrollIntoViewIfNeeded();
	const d = await done.boundingBox();
	expect((d?.x ?? -1) >= 0 && (d?.x ?? 0) + (d?.width ?? 0) <= 375).toBe(true);
	await page.screenshot({ path: "audits/2026-10-05/shots-r3-fix/test-en-375-tasks.png" });
});

test("R3-02 en 375: the current stage of the deal stepper is fully visible", async ({ page, request }) => {
	const f = await fixture();
	const dealId = await makeStepperDeal(request, f, "Stepper deal");
	await page.setViewportSize({ width: 375, height: 780 });
	await open(page, f, "en", `/app/deals?select=${dealId}`);
	const stepper = page.getByTestId("deal-stepper");
	await expect(stepper).toBeVisible();
	await expect(page.getByTestId("deal-step")).toHaveCount(5);
	await expect
		.poll(async () => {
			const s = await stepper.boundingBox();
			const c = await page.locator('[data-testid="deal-step"][aria-current="step"]').boundingBox();
			return !!s && !!c && c.x >= s.x - 0.5 && c.x + c.width <= s.x + s.width + 0.5;
		})
		.toBe(true);
	expect(await noPageOverflow(page)).toBe(true);
	await page.waitForTimeout(600); // let the record sheet finish its slide-in before the evidence shot
	await page.screenshot({ path: "audits/2026-10-05/shots-r3-fix/test-en-375-stepper.png" });
});
