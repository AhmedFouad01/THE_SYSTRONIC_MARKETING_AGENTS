import { randomUUID } from "node:crypto";
import { type APIRequestContext, expect, type Page, test } from "@playwright/test";
import pg from "pg";
import { seed } from "../scripts/seed.js";

process.loadEnvFile(".env");

// UI_R4_SPEC batch 1: F1 Select sizing, F2 focus, E brand/breadcrumb links, D Save always visible, B owner caption +
// technical details gate, A page frame tokens, I bidi quick wins. Synthetic fixture per test.
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
		data: { command_id, title, source_evidence: "synthetic", contact: { display_name: `Contact ${title.slice(0, 12)}` } },
	});
	expect(res.status()).toBe(201);
	return (await res.json()).data as { id: string; contact_id: string };
}

async function makeContact(request: APIRequestContext, f: Fixture, name: string) {
	const command_id = randomUUID();
	const res = await request.post("/v1/contacts", {
		headers: headers(f, command_id),
		data: { command_id, display_name: name },
	});
	expect(res.status()).toBe(201);
}

async function open(page: Page, f: Fixture, language: "ar" | "en", path: string, role: "manager" | "reader" = "manager") {
	await page.addInitScript((l) => localStorage.setItem("sy.locale", l), language);
	await page.goto(path);
	await page.locator("input[name=token]").fill(f.tokens[role]);
	await page.locator("input[name=tenant]").fill(f.ids.a);
	await page.getByTestId("connect-submit").click();
	await expect(page.getByTestId("actor")).toBeVisible();
}

const rows = (page: Page) => page.getByTestId("grid-row");

// F1 --------------------------------------------------------------------------------------------------------------
for (const lang of ["en", "ar"] as const) {
	for (const narrow of [false, true]) {
		test(`F1 Select list is >=160px, single-line options, anchored to the trigger inline-start (${lang}${narrow ? ", 60px trigger" : ""})`, async ({
			page,
			request,
		}) => {
			const f = await fixture();
			await makeContact(request, f, "Alpha One");
			await page.setViewportSize({ width: 1440, height: 900 });
			await open(page, f, lang, "/app/contacts");
			await expect(rows(page).filter({ hasText: "Alpha One" })).toHaveCount(1);
			await page.getByTestId("grid-filters").click();
			const trigger = page.locator(".sy-grid__filters .sy-select__trigger").first();
			if (narrow) await trigger.evaluate((el) => ((el.closest(".sy-select") as HTMLElement).style.width = "60px"));
			const tbox = await trigger.boundingBox();
			if (narrow) expect(tbox?.width ?? 0).toBeLessThanOrEqual(61);
			await trigger.click();
			const list = page.getByRole("listbox");
			await expect(list).toBeVisible();
			const lbox = await list.boundingBox();
			expect(lbox?.width ?? 0).toBeGreaterThanOrEqual(160 - 1);
			for (const o of await list.getByRole("option").all()) {
				const m = await o.evaluate((el) => {
					const label = el.querySelector(".sy-select__option-label") as HTMLElement;
					return {
						h: el.getBoundingClientRect().height,
						ws: getComputedStyle(label).whiteSpace,
						fits: label.scrollWidth <= label.clientWidth + 1,
					};
				});
				expect(m.ws).toBe("nowrap");
				expect(m.h).toBeLessThan(44); // one line (36px option)
				expect(m.fits).toBe(true);
			}
			// anchored at the trigger's inline-start: left edge in EN, right edge in AR
			if (lang === "en") expect(Math.abs((lbox?.x ?? 0) - (tbox?.x ?? 0))).toBeLessThanOrEqual(2);
			else
				expect(Math.abs((lbox?.x ?? 0) + (lbox?.width ?? 0) - ((tbox?.x ?? 0) + (tbox?.width ?? 0)))).toBeLessThanOrEqual(2);
			expect((lbox?.x ?? 0) + (lbox?.width ?? 0)).toBeLessThanOrEqual(1440 - 8 + 1);
			expect(lbox?.x ?? 0).toBeGreaterThanOrEqual(8 - 1);
		});
	}
}

// F2 --------------------------------------------------------------------------------------------------------------
test("F2 no outline on the grid container after a mouse click; keyboard shows the row ring", async ({ page, request }) => {
	const f = await fixture();
	await makeLead(request, f, "Focus one");
	await makeLead(request, f, "Focus two");
	await page.setViewportSize({ width: 1440, height: 900 });
	await open(page, f, "en", "/app/leads");
	await expect(rows(page)).toHaveCount(2);
	await rows(page).first().click({ position: { x: 4, y: 4 } });
	const scroller = await page.locator(".sy-grid__scroll").evaluate((n) => ({
		style: getComputedStyle(n).outlineStyle,
		active: document.activeElement === n,
	}));
	expect(scroller.style).toBe("none");
	expect(scroller.active).toBe(false);
	expect(await page.getByTestId("grid-table").evaluate((n) => getComputedStyle(n).outlineStyle)).toBe("none");
	await rows(page).first().focus();
	await page.keyboard.press("ArrowDown");
	const ring = await page.evaluate(() => {
		const el = document.activeElement as HTMLElement;
		const cs = getComputedStyle(el);
		return { tag: el.tagName, style: cs.outlineStyle, width: Number.parseFloat(cs.outlineWidth), match: el.matches(":focus-visible") };
	});
	expect(ring.tag).toBe("TR");
	expect(ring.match).toBe(true);
	expect(ring.style).toBe("solid");
	expect(ring.width).toBeGreaterThanOrEqual(2);
});

// E ---------------------------------------------------------------------------------------------------------------
test("E brand and CRM crumb navigate to the Dashboard; the list crumb on a record returns to the filtered list", async ({
	page,
	request,
}) => {
	const f = await fixture();
	await makeLead(request, f, "Crumb alpha");
	await makeLead(request, f, "Crumb beta");
	await page.setViewportSize({ width: 1440, height: 900 });
	await open(page, f, "en", "/app/leads");
	await expect(rows(page)).toHaveCount(2);
	await page.getByTestId("brand-link").click();
	await expect(page).toHaveURL(/\/app\/dashboard$/);
	await page.getByTestId("nav-contacts").click();
	await expect(page).toHaveURL(/\/app\/contacts$/);
	await page.getByTestId("breadcrumb-crm").click();
	await expect(page).toHaveURL(/\/app\/dashboard$/);
	await page.getByTestId("nav-leads").click();
	await expect(rows(page)).toHaveCount(2);
	await page.getByTestId("grid-search").fill("alpha");
	await expect(rows(page)).toHaveCount(1);
	await rows(page).first().click();
	await expect(page.getByTestId("lead-detail")).toBeVisible();
	await expect(page.getByTestId("breadcrumb-current")).toHaveText("Crumb alpha");
	await page.getByTestId("breadcrumb-list").click();
	await expect(page.getByTestId("lead-detail")).toHaveCount(0);
	// Wide layouts auto-open the first row; closing via the crumb must stay closed (regression: it re-selected).
	await page.waitForTimeout(500);
	await expect(page.getByTestId("lead-detail")).toHaveCount(0);
	await expect(rows(page).first()).not.toHaveAttribute("aria-current", "true");
	await expect(page).toHaveURL(/\/app\/leads/);
	await expect(page.getByTestId("grid-search")).toHaveValue("alpha");
	await expect(rows(page)).toHaveCount(1);
	await expect(page.getByTestId("breadcrumb-current")).toHaveText("Leads");
});

// D ---------------------------------------------------------------------------------------------------------------
test("D edit mode always shows Save (disabled until dirty) and Cancel", async ({ page, request }) => {
	const f = await fixture();
	await makeLead(request, f, "Edit me");
	await page.setViewportSize({ width: 1440, height: 900 });
	await open(page, f, "en", "/app/leads");
	await rows(page).first().click();
	await page.getByTestId("record-edit").click();
	const save = page.getByTestId("lead-save");
	await expect(save).toBeVisible();
	await expect(save).toBeDisabled();
	await expect(save).toHaveAttribute("title", "No changes");
	await expect(page.getByTestId("record-edit-cancel")).toBeVisible();
	await page.locator("input[name=title]").fill("Edit me v2");
	await expect(save).toBeEnabled();
	await page.locator("input[name=title]").fill("Edit me");
	await expect(save).toBeDisabled();
	await page.getByTestId("record-edit-cancel").click();
	await expect(page.getByTestId("record-editor")).toHaveCount(0);
});

// B ---------------------------------------------------------------------------------------------------------------
test("B no owner caption under contact names; Technical details only for admin", async ({ browser, request }) => {
	const f = await fixture();
	await makeContact(request, f, "Caption Test");
	for (const role of ["manager", "reader"] as const) {
		const ctx = await browser.newContext({ baseURL: test.info().project.use.baseURL ?? "http://127.0.0.1:4317" });
		const page = await ctx.newPage();
		await page.setViewportSize({ width: 1440, height: 900 });
		await open(page, f, "en", "/app/contacts", role);
		const row = rows(page).filter({ hasText: "Caption Test" });
		await expect(row).toHaveCount(1);
		await expect(page.locator(".sy-cell-id__caption")).toHaveCount(0);
		await row.click();
		await expect(page.getByTestId("contact-detail")).toBeVisible();
		if (role === "manager") {
			const details = page.getByTestId("record-details");
			await expect(details).toHaveCount(1);
			expect(await details.evaluate((d) => (d as HTMLDetailsElement).open)).toBe(false);
			await expect(details.locator("summary")).toHaveText("Technical details");
			await expect(page.getByTestId("contact-version")).toBeAttached();
		} else {
			await expect(page.getByTestId("record-details")).toHaveCount(0);
			await expect(page.getByTestId("contact-version")).toHaveCount(0);
		}
		await ctx.close();
	}
});

// A ---------------------------------------------------------------------------------------------------------------
test("A page frame tokens: gutters 24/16/12, topbar 56, content max 1440", async ({ page, request }) => {
	const f = await fixture();
	await makeLead(request, f, "Frame");
	await open(page, f, "en", "/app/leads");
	for (const [w, gutter] of [
		[1440, 24],
		[1000, 16],
		[600, 12],
	] as const) {
		await page.setViewportSize({ width: w, height: 900 });
		const m = await page.evaluate(() => ({
			pad: Number.parseFloat(getComputedStyle(document.querySelector(".sy-main") as Element).paddingLeft),
			top: document.querySelector(".sy-topbar")?.getBoundingClientRect().height ?? 0,
			max: document.querySelector(".sy-page")?.getBoundingClientRect().width ?? 0,
		}));
		expect(m.pad).toBe(gutter);
		expect(m.top).toBe(56);
		expect(m.max).toBeLessThanOrEqual(1440);
	}
	await page.setViewportSize({ width: 2200, height: 900 });
	await expect
		.poll(() => page.evaluate(() => document.querySelector(".sy-page")?.getBoundingClientRect().width ?? 0))
		.toBe(1440);
});

// I ---------------------------------------------------------------------------------------------------------------
const MIXED = [
	"اجتماع مع Ahmed Corp غداً",
	"عميل VIP - شركة Orange Egypt",
	"Meeting with أحمد الشريف tomorrow",
	'(Q4) خطة المبيعات - "Phase 2"؟',
];
for (const lang of ["en", "ar"] as const) {
	test(`I mixed text typed into a lead title stays isolated in input, grid, preview, breadcrumb and toast (${lang})`, async ({
		page,
		request,
	}) => {
		const f = await fixture();
		await makeLead(request, f, "Seed title");
		await page.setViewportSize({ width: 1440, height: 900 });
		await open(page, f, lang, "/app/leads");
		await rows(page).first().click();
		for (const s of MIXED) {
			await page.getByTestId("record-edit").click();
			const input = page.locator("input[name=title]");
			await input.fill(s);
			await expect(input).toHaveAttribute("dir", "auto");
			await page.getByTestId("lead-save").click();
			await expect(page.getByTestId("record-editor")).toHaveCount(0);
			await expect(page.getByTestId("lead-detail").locator(".sy-record__title bdi[dir=auto]")).toHaveText(s);
			await expect(page.locator(".sy-cell-id__name .sy-bidi-text[dir=auto]").first()).toHaveText(s);
			await expect(page.getByTestId("breadcrumb-current").locator("bdi[dir=auto]")).toHaveText(s);
			await expect(page.getByTestId("toast").locator(".sy-toast__msg bdi[dir=auto]").last()).toBeVisible();
		}
		// the resolved direction follows the first strong character, independent of the UI language
		const last = MIXED[MIXED.length - 1] ?? "";
		const dir = await page.locator(".sy-cell-id__name .sy-bidi-text").first().evaluate((e) => getComputedStyle(e).direction);
		const firstStrong = last.match(/[A-Za-z؀-ۿ]/)?.[0] ?? "";
		expect(dir).toBe(/[؀-ۿ]/.test(firstStrong) ? "rtl" : "ltr");
	});
}
