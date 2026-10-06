import { randomUUID } from "node:crypto";
import { type APIRequestContext, expect, type Locator, type Page, test } from "@playwright/test";
import pg from "pg";
import { seed } from "../scripts/seed.js";

process.loadEnvFile(".env");

// UI_R4_SPEC I: USER CONTENT direction is decided per value from its first strong character, independent of the UI
// direction; the value sits in its own isolated element and aligns to the UI start (right in AR, left in EN).
async function fixture() {
	const admin = new pg.Client({ connectionString: process.env.ADMIN_DATABASE_URL });
	await admin.connect();
	const f = await seed(admin);
	await admin.end();
	return f;
}
type Fixture = Awaited<ReturnType<typeof fixture>>;

async function makeLead(request: APIRequestContext, f: Fixture, title: string, contact: string) {
	const command_id = randomUUID();
	const res = await request.post("/v1/leads", {
		headers: {
			Authorization: `Bearer ${f.tokens.manager}`,
			"X-Tenant-ID": f.ids.a,
			"Idempotency-Key": command_id,
		},
		data: { command_id, title, source_evidence: "synthetic", contact: { display_name: contact } },
	});
	expect(res.status()).toBe(201);
}

// Latin-first value with Arabic inside (resolves LTR) and Arabic-first value with Latin inside (resolves RTL).
const LATIN_FIRST = { title: "Acme شركة النور للتجارة", contact: "Contact شركة النور - طلب عرض سعر" };
const ARABIC_FIRST = { title: "شركة النور Orange Egypt", contact: "عميل VIP - شركة Orange" };

/** Direction of the value element and where its text actually sits inside it (short values: no overflow). */
async function measure(el: Locator) {
	return el.evaluate((node) => {
		const box = (node.closest("td, .sy-record") ?? (node.parentElement as HTMLElement)).getBoundingClientRect(); // the cell / title block
		const range = document.createRange();
		range.selectNodeContents(node);
		const text = range.getBoundingClientRect();
		return {
			dir: getComputedStyle(node).direction,
			attr: node.getAttribute("dir"),
			gapStart: Math.round(text.left - box.left),
			gapEnd: Math.round(box.right - text.right),
		};
	});
}

for (const language of ["en", "ar"] as const)
	test(`mixed user content ${language}: each value resolves its own direction and aligns to the UI start, in the grid and in the preview panel`, async ({
		page,
		request,
	}: {
		page: Page;
		request: APIRequestContext;
	}) => {
		const f = await fixture();
		await makeLead(request, f, LATIN_FIRST.title, LATIN_FIRST.contact);
		await makeLead(request, f, ARABIC_FIRST.title, ARABIC_FIRST.contact);
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.addInitScript((l) => localStorage.setItem("sy.locale", l), language);
		await page.goto("/app/leads");
		await page.locator("input[name=token]").fill(f.tokens.manager);
		await page.locator("input[name=tenant]").fill(f.ids.a);
		await page.getByTestId("connect-submit").click();
		await expect(page.getByTestId("grid-row")).toHaveCount(2);
		await expect(page.locator("html")).toHaveAttribute("dir", language === "ar" ? "rtl" : "ltr");

		// UI start edge: text hugs the start side of its block (the other side carries the free space)
		const atUiStart = (m: { gapStart: number; gapEnd: number }) =>
			language === "ar" ? m.gapEnd <= 12 && m.gapStart > m.gapEnd + 20 : m.gapStart <= 12 && m.gapEnd > m.gapStart + 20;

		for (const [sample, expected] of [
			[LATIN_FIRST, "ltr"],
			[ARABIC_FIRST, "rtl"],
		] as const) {
			const row = page.getByTestId("grid-row").filter({ hasText: sample.title.split(" ")[0] === "Acme" ? "Acme" : "Orange Egypt" });
			// grid cell: lead name + contact caption (identity cell) and the Contact column
			const name = row.locator(".sy-cell-id__name .sy-bidi-text");
			const m = await measure(name);
			expect(m.attr).toBe("auto");
			expect(m.dir).toBe(expected);
			expect(atUiStart(m), JSON.stringify(m)).toBe(true);
			const caption = row.locator(".sy-cell-id__caption .sy-bidi-text");
			expect((await measure(caption)).dir).toBe(expected === "ltr" ? "ltr" : "rtl");
			expect(atUiStart(await measure(caption))).toBe(true);

			// preview panel: title (wraps) and contact subtitle (single line, full value in title)
			await name.click();
			const panel = page.getByTestId("lead-detail");
			await expect(panel).toBeVisible();
			await page.waitForTimeout(300);
			const title = panel.locator(".sy-record__title .sy-bidi-text");
			const mt = await measure(title);
			expect(mt.attr).toBe("auto");
			expect(mt.dir).toBe(expected);
			// the (wrapping) title may fill its block: only the START side must be flush
			expect(language === "ar" ? mt.gapEnd <= 12 : mt.gapStart <= 12, JSON.stringify(mt)).toBe(true);
			const sub = panel.locator(".sy-record__subtitle .sy-bidi-text");
			const ms = await measure(sub);
			expect(ms.dir).toBe(expected === "ltr" ? "ltr" : "rtl"); // contact value of the same sample resolves the same way
			expect(atUiStart(ms), JSON.stringify(ms)).toBe(true);
			await expect(sub).toHaveAttribute("title", sample.contact);
			// one line: no orphaned last word
			expect(await sub.evaluate((n) => n.getBoundingClientRect().height < 40)).toBe(true);
			// the user value is never glued to UI text: the subtitle element holds exactly the value
			await expect(sub).toHaveText(sample.contact);
			await panel.getByTestId("preview-close").click();
			await expect(panel).toHaveCount(0);
		}
	});
