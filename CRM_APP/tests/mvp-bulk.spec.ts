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

// UX-20 bulk actions, UX-21 dark primary, UX-22 RTL icon mirroring, UX-25 phone toolbar, UX-26 row selection.
// Credentials stay in memory; never logged or asserted by value.
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

async function makeLead(request: APIRequestContext, f: Fixture, title: string) {
	const command_id = randomUUID();
	const res = await request.post("/v1/leads", {
		headers: headers(f, command_id),
		data: {
			command_id,
			title,
			source_evidence: "synthetic",
			contact: { display_name: `Contact ${title}`, email: "ui-fixture@example.test" },
		},
	});
	expect(res.status()).toBe(201);
	return (await res.json()).data as { id: string; contact_id: string };
}

async function open(
	page: Page,
	f: Fixture,
	opts: { language?: "ar" | "en"; width?: number; theme?: "dark" | "light"; path: string; ready: string },
) {
	await page.setViewportSize({ width: opts.width ?? 1440, height: 900 });
	await page.addInitScript(
		([l, th]) => {
			localStorage.setItem("sy.locale", l as string);
			if (th) localStorage.setItem("sy.theme", th as string);
		},
		[opts.language ?? "en", opts.theme ?? ""],
	);
	await page.goto(opts.path);
	await page.locator("input[name=token]").fill(f.tokens.manager);
	await page.locator("input[name=tenant]").fill(f.ids.a);
	await page.getByTestId("connect-submit").click();
	await expect(page.getByTestId(opts.ready)).toBeVisible();
}

const rows = (page: Page) => page.getByTestId("grid-row");

test("leads bulk (UX-20): change status with one forced 409 reports a partial failure; bar overlays without pushing the table", async ({
	page,
	request,
}) => {
	const f = await fixture();
	await makeLead(request, f, "Alpha lead");
	await makeLead(request, f, "Bravo lead");
	const charlie = await makeLead(request, f, "Charlie lead");
	await open(page, f, { path: "/app/leads", ready: "leads-view" });
	await expect(rows(page)).toHaveCount(3);
	await page.route(`**/v1/leads/${charlie.id}`, (route) =>
		route.request().method() === "PATCH"
			? route.fulfill({
					status: 409,
					contentType: "application/json",
					body: JSON.stringify({ code: "VERSION_CONFLICT", safe_message: "stale", request_id: "r", retryable: false }),
				})
			: route.continue(),
	);
	const tableTop = () => page.getByTestId("grid-table").evaluate((e) => e.getBoundingClientRect().top);
	const toolbarBox = await page.locator(".sy-grid__toolbar").boundingBox();
	const before = await tableTop();
	for (const name of ["Alpha lead", "Bravo lead", "Charlie lead"])
		await page.getByRole("checkbox", { name: `Select row ${name}` }).check();
	const bar = page.getByTestId("grid-batch");
	await expect(bar).toContainText("3 selected");
	// no layout push: same table top, and the bar sits exactly over the toolbar slot
	expect(await tableTop()).toBe(before);
	const barBox = await bar.boundingBox();
	expect(Math.round(barBox?.height ?? 0)).toBe(Math.round(toolbarBox?.height ?? -1));
	expect(Math.round(barBox?.y ?? 0)).toBe(Math.round(toolbarBox?.y ?? -1));
	for (const id of ["bulk-assign", "bulk-status", "bulk-add-task"]) await expect(page.getByTestId(id)).toBeVisible();
	// no delete endpoint exists: no fake Delete action
	await expect(bar.getByRole("button", { name: /delete/i })).toHaveCount(0);

	await page.getByTestId("bulk-status").click();
	const dialog = page.getByTestId("bulk-status-dialog");
	await expect(dialog).toBeVisible();
	await pickLabel(dialog.getByRole("combobox", { name: "New status" }), "Qualified");
	await page.getByTestId("dialog-confirm").click();
	await expect(page.locator('[role="alert"] [data-testid="toast"]')).toContainText("2 updated, 1 failed");
	const status = (title: string) => rows(page).filter({ hasText: title });
	await expect(status("Alpha lead")).toContainText("Qualified");
	await expect(status("Bravo lead")).toContainText("Qualified");
	await expect(status("Charlie lead")).toContainText("Open");
});

test("leads bulk (UX-20): one dialog creates one task per selected lead's contact", async ({ page, request }) => {
	const f = await fixture();
	const a = await makeLead(request, f, "Alpha lead");
	const b = await makeLead(request, f, "Bravo lead");
	await makeLead(request, f, "Charlie lead");
	await open(page, f, { path: "/app/leads", ready: "leads-view" });
	await expect(rows(page)).toHaveCount(3);
	for (const name of ["Alpha lead", "Bravo lead"])
		await page.getByRole("checkbox", { name: `Select row ${name}` }).check();
	await page.getByTestId("bulk-add-task").click();
	const dialog = page.getByTestId("bulk-task-dialog");
	await dialog.getByLabel("Title").fill("Call back");
	const d = new Date(Date.now() + 3 * 86_400_000);
	const pad = (n: number) => String(n).padStart(2, "0");
	await pickDay(dialog.getByLabel("Due"), `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T09:00`);
	await page.getByTestId("bulk-task-submit").click();
	await expect(page.locator('[data-testid="toast"]').first()).toContainText("2 tasks created");
	const res = await request.get("/v1/tasks", { headers: headers(f) });
	const tasks = (await res.json()).data as Array<{ title: string; contact_id: string }>;
	const made = tasks.filter((t) => t.title === "Call back");
	expect(made).toHaveLength(2);
	expect(new Set(made.map((t) => t.contact_id))).toEqual(new Set([a.contact_id, b.contact_id]));
});

// ---- deals: bulk move only when the whole selection can take the edge ----
async function makePipeline(request: APIRequestContext, f: Fixture) {
	const command_id = randomUUID();
	const res = await request.post("/v1/pipelines", {
		headers: headers(f, command_id),
		data: {
			command_id,
			name: "Bulk flow",
			stages: [{ name: "New" }, { name: "Qualified" }, { name: "Won", outcome: "won" }, { name: "Lost", outcome: "lost" }],
			transitions: [[0, 1], [0, 3], [1, 2], [1, 3]],
		},
	});
	expect(res.status()).toBe(201);
	const id = (await res.json()).data.id as string;
	const list = (await (await request.get("/v1/pipelines", { headers: headers(f) })).json()).data as Array<{
		id: string;
		stages: Array<{ id: string; name: string }>;
	}>;
	const p = list.find((x) => x.id === id);
	if (!p) throw new Error("pipeline not listed");
	return p;
}

test("deals bulk (UX-20): Move stage is offered only when the selection shares an allowed edge; moves every row", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const p = await makePipeline(request, f);
	const stage = (n: string) => p.stages.find((s) => s.name === n)?.id;
	const mk = async (title: string, stageName: string) => {
		const lead = await makeLead(request, f, `L ${title}`);
		let command_id = randomUUID();
		const res = await request.post("/v1/deals", {
			headers: headers(f, command_id),
			data: { command_id, contact_id: lead.contact_id, pipeline_id: p.id, stage_id: stage("New"), title, amount_minor: 1000, currency: "EGP" },
		});
		expect(res.status()).toBe(201);
		const d = (await res.json()).data as { id: string; version: number };
		if (stageName !== "New") {
			command_id = randomUUID();
			const t = await request.post(`/v1/deals/${d.id}/transitions`, {
				headers: headers(f, command_id),
				data: { command_id, to_stage_id: stage(stageName), expected_version: d.version, reason: "" },
			});
			expect(t.status()).toBeLessThan(300);
		}
	};
	await mk("Deal A", "New");
	await mk("Deal B", "New");
	await mk("Deal C", "Qualified");
	await open(page, f, { path: "/app/deals", ready: "deals-view" });
	await expect(rows(page).filter({ hasText: /Deal [ABC]/ })).toHaveCount(3);
	const pick = (n: string) => page.getByRole("checkbox", { name: `Select row ${n}` });

	// mixed stages (New + Qualified) share no allowed non-lost edge: not offered, Assign still is
	await pick("Deal A").check();
	await pick("Deal C").check();
	await expect(page.getByTestId("bulk-assign")).toBeVisible();
	await expect(page.getByTestId("bulk-move-stage")).toHaveCount(0);
	await pick("Deal C").uncheck();
	await pick("Deal B").check();
	await expect(page.getByTestId("bulk-move-stage")).toBeVisible();
	await page.getByTestId("bulk-move-stage").click();
	const dialog = page.getByTestId("bulk-move-dialog");
	await pickLabel(dialog.getByRole("combobox", { name: "New stage" }), "Qualified");
	await page.getByTestId("dialog-confirm").click();
	await expect(page.locator('[data-testid="toast"]').first()).toContainText("2 updated");
	await expect(rows(page).filter({ hasText: "Deal A" })).toContainText("Qualified");
	await expect(rows(page).filter({ hasText: "Deal B" })).toContainText("Qualified");
});

// ---- UX-25: phone toolbar is one row; filters open in a sheet ----
test("375 (UX-25): toolbar is one row and Filters/Columns/Density open in a sheet", async ({ page, request }) => {
	const f = await fixture();
	await makeLead(request, f, "Alpha lead");
	await open(page, f, { width: 375, path: "/app/leads", ready: "leads-view" });
	await expect(rows(page)).toHaveCount(1);
	const search = await page.getByTestId("grid-search").locator("xpath=ancestor::div[contains(@class,'sy-grid__searchbox')]").boundingBox();
	const filters = await page.getByTestId("grid-filters").boundingBox();
	const toolbar = await page.locator(".sy-grid__toolbar").boundingBox();
	expect(Math.abs((search?.y ?? 0) - (filters?.y ?? 99))).toBeLessThanOrEqual(1);
	expect(toolbar?.height ?? 999).toBeLessThanOrEqual(40);
	await expect(page.getByTestId("grid-columns")).toHaveCount(0);
	await expect(page.getByTestId("grid-density")).toHaveCount(0);
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

	await page.getByTestId("grid-filters").click();
	const sheet = page.getByTestId("grid-sheet");
	await expect(sheet).toBeVisible();
	await expect(sheet.getByRole("combobox", { name: "Owner" })).toBeVisible();
	await expect(sheet).toContainText("Visible columns");
	await expect(sheet.getByRole("button", { name: "Compact density" })).toBeVisible();
	await page.getByTestId("grid-sheet-done").click();
	await expect(sheet).toHaveCount(0);
});

// ---- UX-21: dark primary is the DESIGN_TOKENS pair, driven by the token (not hard-coded) ----
test("dark (UX-21): primary button background/foreground equal the --sy-primary/--sy-primary-fg token pair", async ({
	page,
	request,
}) => {
	const f = await fixture();
	await makeLead(request, f, "Alpha lead");
	await open(page, f, { theme: "dark", path: "/app/leads", ready: "leads-view" });
	await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
	const probe = await page.evaluate(() => {
		const btn = document.querySelector('[data-testid="new-lead"]') as HTMLElement;
		const el = document.createElement("i");
		el.style.cssText = "background:var(--sy-primary);color:var(--sy-primary-fg)";
		document.body.append(el);
		const tok = getComputedStyle(el);
		const out = {
			bg: getComputedStyle(btn).backgroundColor,
			fg: getComputedStyle(btn).color,
			tokBg: tok.backgroundColor,
			tokFg: tok.color,
		};
		el.remove();
		return out;
	});
	expect(probe.bg).toBe(probe.tokBg);
	expect(probe.fg).toBe(probe.tokFg);
	// DESIGN_TOKENS "Key Dark semantic values": primary #00BEF6 on primaryFg #0D1020 (the navy half of the pair)
	expect(probe.bg).toBe("rgb(0, 190, 246)");
	expect(probe.fg).toBe("rgb(13, 16, 32)");
	// the Save-view control has no standing outline (outline only on :focus-visible)
	const outline = await page.getByTestId("grid-save-view").evaluate((e) => {
		const c = getComputedStyle(e);
		return c.outlineStyle === "none" || c.outlineWidth === "0px";
	});
	expect(outline).toBe(true);
});

// ---- UX-22: only directional icons mirror in RTL ----
test("rtl (UX-22): in AR only directional icons carry the mirror transform; search/filter/plus stay literal", async ({
	page,
	request,
}) => {
	const f = await fixture();
	await makeLead(request, f, "Alpha lead");
	await open(page, f, { language: "ar", path: "/app/leads", ready: "leads-view" });
	await expect(rows(page)).toHaveCount(1);
	const sample = () =>
		page.evaluate(() =>
			[...document.querySelectorAll("svg.sy-icon")].map((s) => ({
				icon: s.getAttribute("data-icon") ?? "",
				flipped: getComputedStyle(s).transform !== "none",
			})),
		);
	const all = await sample();
	expect(all.length).toBeGreaterThan(3);
	const DIRECTIONAL = new Set(["advance", "drill", "chevronRight"]);
	for (const i of all) if (i.flipped) expect(DIRECTIONAL.has(i.icon), `flipped non-directional icon ${i.icon}`).toBe(true);
	for (const name of ["search", "filter", "plus"]) {
		const found = all.filter((i) => i.icon === name);
		expect(found.length, name).toBeGreaterThan(0);
		for (const i of found) expect(i.flipped, name).toBe(false);
	}
	// the Convert-to-deal arrow (advance) mirrors; select a row to open the lead detail
	await rows(page).first().click();
	await expect(page.getByTestId("lead-detail")).toBeVisible();
	const detail = await sample();
	const adv = detail.filter((i) => i.icon === "advance");
	for (const i of adv) expect(i.flipped).toBe(true);
	for (const i of detail) if (i.flipped) expect(DIRECTIONAL.has(i.icon), i.icon).toBe(true);
});

// ---- UX-26: whole-row click, aria-selected, focus ring distinct from the selected fill ----
test("rows (UX-26): clicking anywhere on a row selects it (aria-selected); keyboard focus ring differs from the selected fill", async ({
	page,
	request,
}) => {
	const f = await fixture();
	await makeLead(request, f, "Alpha lead");
	await makeLead(request, f, "Bravo lead");
	await open(page, f, { width: 1440, path: "/app/leads", ready: "leads-view" });
	await expect(rows(page)).toHaveCount(2);
	// click a non-checkbox cell (the Created column), not the first-column link/checkbox
	const first = rows(page).first();
	const second = rows(page).nth(1);
	await first.locator("td").last().click();
	await expect(first).toHaveAttribute("aria-selected", "true");
	await expect(first).toHaveAttribute("aria-current", "true");
	await expect(second).toHaveAttribute("aria-selected", "false");
	const style = (row: ReturnType<typeof rows>) =>
		row.evaluate((e) => {
			const c = getComputedStyle(e);
			return { bg: c.backgroundColor, outlineStyle: c.outlineStyle, outlineWidth: c.outlineWidth };
		});
	const selected = await style(first);
	expect(selected.bg).not.toBe("rgba(0, 0, 0, 0)");
	expect(selected.outlineStyle === "none" || selected.outlineWidth === "0px").toBe(true);
	// keyboard focus on the other (unselected) row: 2px ring, and a fill that is not the selected fill
	await second.focus();
	await page.keyboard.press("Shift+Tab");
	await page.keyboard.press("Tab");
	await expect(second).toBeFocused();
	const focused = await style(second);
	expect(focused.outlineStyle).toBe("solid");
	expect(focused.outlineWidth).toBe("2px");
	expect(focused.bg).not.toBe(selected.bg);
});

// ---- Leads KPI strip words equal the status pill words (both languages) ----
for (const language of ["en", "ar"] as const)
	test(`leads (${language}): KPI strip labels equal the status pill labels`, async ({ page, request }) => {
		const f = await fixture();
		await makeLead(request, f, "Alpha lead");
		await open(page, f, { language, path: "/app/leads", ready: "leads-view" });
		await expect(rows(page)).toHaveCount(1);
		const pill = (await rows(page).first().locator(".sy-badge").first().innerText()).trim();
		const label = (await page.getByTestId("leads-kpi-open").locator(".sy-kpi__label").innerText()).trim();
		expect(label).toBe(pill);
	});
