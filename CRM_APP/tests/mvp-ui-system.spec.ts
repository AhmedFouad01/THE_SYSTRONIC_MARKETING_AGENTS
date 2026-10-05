import { expect, type Page, test } from "@playwright/test";
import pg from "pg";
import { seed } from "../scripts/seed.js";

process.loadEnvFile(".env");

// Shared UI system (UX batch 1b): PageHeader, Select, Dialog. Synthetic fixture; credentials never asserted by value.
async function fixture() {
	const admin = new pg.Client({ connectionString: process.env.ADMIN_DATABASE_URL });
	await admin.connect();
	const f = await seed(admin);
	await admin.end();
	return f;
}
type Fixture = Awaited<ReturnType<typeof fixture>>;

async function open(page: Page, f: Fixture, language: "en" | "ar", width: number, path = "/app/leads") {
	await page.addInitScript((l) => localStorage.setItem("sy.locale", l), language);
	await page.setViewportSize({ width, height: 900 });
	await page.goto(path);
	await page.locator("input[name=token]").fill(f.tokens.manager);
	await page.locator("input[name=tenant]").fill(f.ids.a);
	await page.getByTestId("connect-submit").click();
	await expect(page.getByTestId("actor")).toBeVisible();
}

test("PageHeader: h1 sits at the same position on every screen", async ({ page }) => {
	const f = await fixture();
	await open(page, f, "en", 1280, "/app/dashboard");
	const seen: Array<{ route: string; x: number; y: number; size: string }> = [];
	for (const key of ["dashboard", "leads", "contacts", "deals", "pipeline", "tasks", "reporting"]) {
		await page.getByTestId(`nav-${key}`).click();
		await expect(page.getByTestId(`nav-${key}`)).toHaveAttribute("aria-current", "page");
		const h1 = page.getByRole("heading", { level: 1 });
		await expect(h1).toHaveCount(1);
		await expect(h1).toBeVisible();
		const box = await h1.boundingBox();
		const size = await h1.evaluate((el) => getComputedStyle(el).fontSize);
		seen.push({ route: key, x: Math.round(box?.x ?? -1), y: Math.round(box?.y ?? -1), size });
	}
	expect(new Set(seen.map((s) => `${s.x},${s.y},${s.size}`)).size, JSON.stringify(seen)).toBe(1);
});

for (const language of ["en", "ar"] as const)
	test(`Select ${language}: listbox keyboard (arrows, Enter, Esc, typeahead), Esc keeps the dialog open`, async ({ page }) => {
		const f = await fixture();
		await open(page, f, language, 1280);
		await page.getByTestId("new-lead").click();
		const dialog = page.getByTestId("new-lead-dialog");
		await expect(dialog).toBeVisible();
		// no native <select> anywhere in the app
		await expect(page.locator("select")).toHaveCount(0);
		const trigger = dialog.getByRole("combobox");
		await expect(trigger).toHaveCount(1);
		await trigger.focus();
		await expect(trigger).toHaveAttribute("aria-expanded", "false");

		await page.keyboard.press("ArrowDown");
		await expect(trigger).toHaveAttribute("aria-expanded", "true");
		const list = page.getByRole("listbox");
		await expect(list).toBeVisible();
		const options = list.getByRole("option");
		const labels = (await options.allInnerTexts()).map((s) => s.trim());
		expect(labels.length).toBeGreaterThanOrEqual(2);
		await expect(options.nth(0)).toHaveAttribute("aria-selected", "true"); // current value starts highlighted
		const activeId = async () => trigger.getAttribute("aria-activedescendant");
		const firstId = await activeId();
		await page.keyboard.press("ArrowDown");
		expect(await activeId()).not.toBe(firstId);
		await page.keyboard.press("ArrowUp");
		expect(await activeId()).toBe(firstId);
		await page.keyboard.press("End");
		await expect(options.last()).toHaveAttribute("data-active", "true");
		await page.keyboard.press("Home");
		await expect(options.first()).toHaveAttribute("data-active", "true");

		// Escape closes only the listbox: the dialog stays and focus stays on the trigger
		await page.keyboard.press("Escape");
		await expect(list).toHaveCount(0);
		await expect(dialog).toBeVisible();
		await expect(trigger).toBeFocused();

		// typeahead: a first letter that is unique among the labels jumps to that option; Enter commits it
		const idx = labels.findIndex((l, i) => i > 0 && labels.filter((x) => x[0]?.toLowerCase() === l[0]?.toLowerCase()).length === 1);
		expect(idx, `labels: ${labels.join(" | ")}`).toBeGreaterThan(0);
		await page.keyboard.press("ArrowDown");
		await expect(list).toBeVisible();
		await page.keyboard.type((labels[idx] ?? "")[0] ?? "");
		await expect(options.nth(idx)).toHaveAttribute("data-active", "true");
		await page.keyboard.press("Enter");
		await expect(list).toHaveCount(0);
		await expect(trigger).toContainText(labels[idx] ?? "");

		// the chevron is at the inline-end: right edge in LTR, left edge in RTL
		const t = await trigger.boundingBox();
		const c = await trigger.locator(".sy-select__chevron").boundingBox();
		if (language === "ar") expect((c?.x ?? 0) - (t?.x ?? 0)).toBeLessThan(40);
		else expect((t?.x ?? 0) + (t?.width ?? 0) - ((c?.x ?? 0) + (c?.width ?? 0))).toBeLessThan(40);
	});

for (const language of ["en", "ar"] as const)
	test(`Dialog ${language}: scrim, elevation, size, focus trap, end-aligned footer with primary last`, async ({ page }) => {
		const f = await fixture();
		await open(page, f, language, 1280);
		const opener = page.getByTestId("new-lead");
		await opener.click();
		const dialog = page.getByTestId("new-lead-dialog");
		await expect(dialog).toBeVisible();

		const look = await dialog.evaluate((el) => {
			const s = getComputedStyle(el);
			const scrim = getComputedStyle(el.parentElement as HTMLElement);
			return {
				radius: s.borderTopLeftRadius,
				padding: s.paddingTop,
				shadow: s.boxShadow,
				width: el.getBoundingClientRect().width,
				scrimBg: scrim.backgroundColor,
				scrimPos: scrim.position,
			};
		});
		expect(look.radius).toBe("12px");
		expect(look.padding).toBe("24px");
		expect(look.shadow).not.toBe("none");
		expect(look.width).toBeLessThanOrEqual(480);
		expect(look.scrimPos).toBe("fixed");
		expect(look.scrimBg).not.toMatch(/rgba\(0, 0, 0, 0\)|transparent/);

		// focus trap: Tab/Shift+Tab never leave the dialog
		const inside = () => dialog.evaluate((el) => el.contains(document.activeElement));
		for (let i = 0; i < 16; i++) {
			await page.keyboard.press("Tab");
			expect(await inside(), `Tab #${i + 1}`).toBe(true);
		}
		for (let i = 0; i < 4; i++) {
			await page.keyboard.press("Shift+Tab");
			expect(await inside(), `Shift+Tab #${i + 1}`).toBe(true);
		}

		// Phone + Email share a row at >= 640px
		const phone = await dialog.locator("input[name=phone]").boundingBox();
		const email = await dialog.locator("input[name=email]").boundingBox();
		expect(Math.abs((phone?.y ?? 0) - (email?.y ?? 99))).toBeLessThan(2);
		expect(Math.abs((phone?.x ?? 0) - (email?.x ?? 0))).toBeGreaterThan(100);

		// footer: primary is the last button and sits at the inline-end (right in LTR, left in RTL)
		const buttons = dialog.locator(".sy-dialog__footer button");
		const cancel = await buttons.first().boundingBox();
		const primary = await buttons.last().boundingBox();
		if (language === "ar") expect(primary?.x ?? 0).toBeLessThan(cancel?.x ?? 0);
		else expect(primary?.x ?? 0).toBeGreaterThan(cancel?.x ?? 0);

		// Esc closes and focus returns to the opener
		await page.keyboard.press("Escape");
		await expect(dialog).toHaveCount(0);
		await expect(opener).toBeFocused();
	});

test("Dialog: Phone and Email stack on a 375px viewport", async ({ page }) => {
	const f = await fixture();
	await open(page, f, "en", 375);
	await page.getByTestId("new-lead").click();
	const dialog = page.getByTestId("new-lead-dialog");
	await expect(dialog).toBeVisible();
	const phone = await dialog.locator("input[name=phone]").boundingBox();
	const email = await dialog.locator("input[name=email]").boundingBox();
	expect(Math.abs((phone?.x ?? 0) - (email?.x ?? 99))).toBeLessThan(2);
	expect(email?.y ?? 0).toBeGreaterThan(phone?.y ?? 0);
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
