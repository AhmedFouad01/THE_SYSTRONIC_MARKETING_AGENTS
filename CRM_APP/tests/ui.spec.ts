import { test, expect } from "@playwright/test";
for (const width of [360, 1280])
	for (const language of ["en", "ar"])
		test(`${language} rendering at ${width}px`, async ({ page }) => {
			await page.setViewportSize({ width, height: 800 });
			await page.goto("/foundation");
			if (language === "ar")
				await page.getByRole("button", { name: "العربية" }).click();
			await expect(page.locator("html")).toHaveAttribute("lang", language);
			await expect(page.locator("html")).toHaveAttribute(
				"dir",
				language === "ar" ? "rtl" : "ltr",
			);
			await expect(page.getByRole("heading")).toHaveText(
				language === "ar" ? "تغيير مرحلة الصفقة" : "Deal transition",
			);
			await expect(page.locator("#submit")).toBeVisible();
			expect(
				await page.evaluate(
					() => document.documentElement.scrollWidth <= innerWidth,
				),
			).toBe(true);
			const columns = await page
				.locator(".fields")
				.evaluate(
					(e) => getComputedStyle(e).gridTemplateColumns.split(" ").length,
				);
			expect(columns).toBe(width === 360 ? 1 : 2);
			await page.locator("#token").focus();
			await page.keyboard.press("Tab");
			await expect(page.locator("#tenant")).toBeFocused();
			await page.screenshot({
				path: `test-results/${language}-${width}.png`,
				fullPage: true,
			});
		});
