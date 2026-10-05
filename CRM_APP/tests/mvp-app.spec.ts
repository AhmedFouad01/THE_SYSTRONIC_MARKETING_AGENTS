import { randomUUID } from "node:crypto";
import { expect, type Page, test } from "@playwright/test";
import pg from "pg";
import { seed } from "../scripts/seed.js";

process.loadEnvFile(".env");

// Seeds a synthetic fixture (same approach as m1-ui.spec.ts). Credentials stay in memory; never logged or asserted by value.
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

async function connect(page: Page, f: Fixture) {
	await page.locator("input[name=token]").fill(f.tokens.manager);
	await page.locator("input[name=tenant]").fill(f.ids.a);
	await page.getByTestId("connect-submit").click();
	await expect(page.getByTestId("actor")).toBeVisible();
}

const NAV_KEYS = [
	"dashboard",
	"leads",
	"contacts",
	"deals",
	"pipeline",
	"tasks",
	"reporting",
];

for (const width of [360, 1280])
	for (const language of ["ar", "en"] as const)
		test(`app shell ${language} ${width}px: connect, actor, nav, disabled items, layout`, async ({
			page,
			request,
		}) => {
			const f = await fixture();
			const errors: string[] = [];
			page.on("pageerror", (e) => errors.push(e.message));
			await page.addInitScript(
				(l) => localStorage.setItem("sy.locale", l),
				language,
			);
			await page.setViewportSize({ width, height: 800 });
			await page.goto("/app/");
			await expect(page.locator("html")).toHaveAttribute(
				"dir",
				language === "ar" ? "rtl" : "ltr",
			);
			await connect(page, f);

			// actor comes from GET /v1/session
			const session = await request.get("/v1/session", {
				headers: {
					Authorization: `Bearer ${f.tokens.manager}`,
					"X-Tenant-ID": f.ids.a,
				},
			});
			const actor: string = (await session.json()).data.actor;
			await expect(page.getByTestId("actor")).toBeVisible();
			await expect(page.getByTestId("actor")).not.toContainText(actor.slice(0, 8));

			// credentials live in sessionStorage only
			const where = await page.evaluate(() => ({
				session: sessionStorage.getItem("sy.session") !== null,
				local: Object.keys(localStorage).filter(
					(k) => k !== "sy.locale" && k !== "sy.theme",
				),
			}));
			expect(where.session).toBe(true);
			expect(where.local).toEqual([]);

			// landmarks
			await expect(page.getByRole("navigation")).toHaveCount(1);
			await expect(page.getByRole("banner")).toHaveCount(1);
			await expect(page.getByRole("main")).toHaveCount(1);

			// nav works, aria-current follows
			for (const key of NAV_KEYS.slice(1)) {
				await page.getByTestId(`nav-${key}`).click();
				await expect(page.getByTestId(`nav-${key}`)).toHaveAttribute(
					"aria-current",
					"page",
				);
				// /leads (S4), /contacts (S5), /deals (S6) and /pipeline (S7) are real workspaces; the other routes are still placeholders
				if (key === "leads")
					await expect(page.getByTestId("leads-view")).toBeVisible();
				else if (key === "contacts")
					await expect(page.getByTestId("contacts-view")).toBeVisible();
				else if (key === "pipeline")
					await expect(page.getByTestId("pipeline-view")).toBeVisible();
				else if (key === "deals")
					await expect(page.getByTestId("deals-view")).toBeVisible();
				else if (key === "tasks")
					await expect(page.getByTestId("tasks-view")).toBeVisible();
				else if (key === "reporting")
					await expect(page.getByTestId("reporting-view")).toBeVisible();
				else
					await expect(page.getByTestId("route")).toHaveText(`/${key}`);
			}

			// Email/Call/Import: disabled + explicit "not in MVP" label (hidden on the mobile bar by design)
			for (const key of ["email", "call", "import"]) {
				const item = page.getByTestId(`nav-${key}`);
				await expect(item).toBeDisabled();
				if (width > 720)
					await expect(item).toContainText(
						language === "ar" ? "خارج النسخة الأولى" : "Not in MVP",
					);
			}

			const overflow = await page.evaluate(
				() => document.documentElement.scrollWidth <= innerWidth,
			);
			expect(overflow).toBe(true);
			const navBox = await page.locator(".sy-sidebar").boundingBox();
			if (width <= 720) {
				// bottom nav pinned to the viewport bottom, spanning the width
				expect((navBox?.y ?? 0) + (navBox?.height ?? 0)).toBeGreaterThanOrEqual(
					799,
				);
				expect((navBox?.width ?? 0) >= width - 1).toBe(true);
				await expect(page.getByTestId("nav-email")).toBeHidden();
			} else {
				// condition-based: layout (fonts/scrollbar) may still be settling right after connect
				await expect
					.poll(async () => {
						const b = await page.locator(".sy-sidebar").boundingBox();
						return b?.x === 0 || (b?.x ?? 0) + (b?.width ?? 0) >= width - 1;
					})
					.toBe(true);
				await expect(page.getByTestId("nav-email")).toBeVisible();
			}

			// disconnect returns to the gate and clears the session
			await page.getByTestId("workspace-actions").click();
			await page.getByTestId("disconnect").click();
			await expect(page.locator("input[name=token]")).toBeVisible();
			expect(
				await page.evaluate(() => sessionStorage.getItem("sy.session")),
			).toBeNull();
			expect(errors).toEqual([]);
		});

test("connect gate: bad token shows an error and stores nothing; empty fields are flagged", async ({
	page,
}) => {
	const f = await fixture();
	await page.addInitScript(() => localStorage.setItem("sy.locale", "en"));
	await page.goto("/app/leads");
	await page.getByTestId("connect-submit").click();
	await expect(page.locator("input[name=token]")).toHaveAttribute(
		"aria-invalid",
		"true",
	);
	await page.locator("input[name=token]").fill(randomUUID());
	await page.locator("input[name=tenant]").fill(f.ids.a);
	await page.getByTestId("connect-submit").click();
	await expect(page.getByTestId("connect-error")).toBeVisible();
	expect(
		await page.evaluate(() => sessionStorage.getItem("sy.session")),
	).toBeNull();
	await expect(page.getByRole("navigation")).toHaveCount(0);
});

test("session survives reload within the tab and 401 on restore returns to the gate", async ({
	page,
}) => {
	const f = await fixture();
	await page.goto("/app/dashboard");
	await connect(page, f);
	await page.reload();
	await expect(page.getByTestId("actor")).toBeVisible();
	await expect(page.getByTestId("route")).toHaveText("/dashboard");
	await page.evaluate(() =>
		sessionStorage.setItem(
			"sy.session",
			JSON.stringify({ token: "stale", tenantId: "stale" }),
		),
	);
	await page.reload();
	await expect(page.locator("input[name=token]")).toBeVisible();
	await expect(page.getByTestId("connect-error")).toBeVisible();
});

test("keyboard: skip-link first, activates main; nav links show a visible focus ring", async ({
	page,
}) => {
	const f = await fixture();
	await page.addInitScript(() => localStorage.setItem("sy.locale", "en"));
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto("/app/");
	await connect(page, f);
	await page.reload(); // session restores from sessionStorage; focus starts at the document
	await expect(page.getByTestId("actor")).toBeVisible();
	await page.keyboard.press("Tab");
	const skip = page.locator(".sy-skip");
	await expect(skip).toBeFocused();
	expect(await skip.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe(
		"solid",
	);
	await page.keyboard.press("Enter");
	await expect(page.locator("#sy-main")).toBeFocused();

	await page.reload();
	await expect(page.getByTestId("actor")).toBeVisible();
	await page.keyboard.press("Tab");
	await page.keyboard.press("Tab");
	const first = page.getByTestId("nav-dashboard");
	await expect(first).toBeFocused();
	const ring = await first.evaluate((el) => {
		const s = getComputedStyle(el);
		return {
			style: s.outlineStyle,
			width: s.outlineWidth,
			color: s.outlineColor,
		};
	});
	expect(ring).toEqual({
		style: "solid",
		width: "2px",
		color: "rgb(0, 159, 212)",
	});
	await page.keyboard.press("Tab");
	await expect(page.getByTestId("nav-leads")).toBeFocused();
	await page.keyboard.press("Enter");
	await expect(page).toHaveURL(/\/app\/leads$/);
});
