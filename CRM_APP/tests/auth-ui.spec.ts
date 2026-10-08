import { expect, test, type Page } from "@playwright/test";
const tenant = "00000000-0000-4000-8000-000000000001";
const actor = "00000000-0000-4000-8000-000000000002";
async function backend(page: Page) {
	let authenticated = false;
	let failure: string | null = null;
	const requests: Array<{
		path: string;
		headers: Record<string, string>;
		body: unknown;
	}> = [];
	await page.route("**/v1/**", async (route) => {
		const request = route.request();
		const path = new URL(request.url()).pathname;
		requests.push({
			path,
			headers: request.headers(),
			body: request.postDataJSON(),
		});
		let json: unknown = { data: [], request_id: "fixture" };
		let status = 200;
		if (path === "/v1/auth/get-session")
			json = authenticated ? { user: { id: actor } } : null;
		else if (path === "/v1/auth/sign-in/email") {
			if (failure) {
				status = failure === "AUTH_RATE_LIMITED" ? 429 : 401;
				json = { code: failure, message: "UPSTREAM MUST STAY HIDDEN" };
			} else {
				authenticated = true;
				json = { user: { id: actor } };
			}
		} else if (path === "/v1/auth/sign-out") {
			authenticated = false;
			json = { success: true };
		} else if (path === "/v1/session") {
			status = authenticated ? 200 : 401;
			json = authenticated
				? { data: { actor, configure: false, merge: false, audit: false } }
				: { code: "UNAUTHENTICATED" };
		}
		if (!path.startsWith("/v1/auth/") && !authenticated) {
			status = 401;
			json = { code: "UNAUTHENTICATED" };
		}
		await route.fulfill({ status, json });
	});
	return {
		requests,
		fail: (code: string | null) => {
			failure = code;
		},
		expire: () => {
			authenticated = false;
		},
		active: () => {
			authenticated = true;
		},
	};
}
async function fill(page: Page) {
	await page.locator('input[name="email"]').fill("اسم.English@example.test");
	await page.locator('input[name="password"]').fill("Synthetic-password-only!");
	await page.locator('input[name="workspace"]').fill(tenant);
}
for (const locale of ["ar", "en"])
	for (const theme of ["light", "dark"])
		for (const width of [1440, 375]) {
			test(`cookie sign-in ${locale} ${theme} ${width}`, async ({
				page,
			}, testInfo) => {
				const api = await backend(page);
				const errors: string[] = [];
				page.on("pageerror", (error) => errors.push(error.message));
				await page.addInitScript(
					({ locale, theme }) => {
						localStorage.setItem("sy.locale", locale);
						localStorage.setItem("sy.theme", theme);
					},
					{ locale, theme },
				);
				await page.setViewportSize({ width, height: 900 });
				await page.goto("/app/leads");
				await expect(page.getByTestId("sign-in-page")).toBeVisible();
				await expect(page.locator("html")).toHaveAttribute(
					"dir",
					locale === "ar" ? "rtl" : "ltr",
				);
				await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
				await page.getByTestId("sign-in-submit").click();
				await expect(page.locator('input[name="email"]')).toBeFocused();
				await fill(page);
				await expect(page.locator('input[name="email"]')).toHaveAttribute(
					"dir",
					"ltr",
				);
				expect(
					await page.evaluate(
						() => document.documentElement.scrollWidth <= innerWidth,
					),
				).toBe(true);
				await page.screenshot({ path: testInfo.outputPath("sign-in.png") });
				await page.getByTestId("sign-in-submit").click();
				await expect(page.getByTestId("actor")).toBeVisible();
				expect(
					api.requests.find((r) => r.path === "/v1/session")?.headers[
						"x-tenant-id"
					],
				).toBe(tenant);
				for (const request of api.requests)
					expect(request.headers.authorization).toBeUndefined();
				expect(
					await page.evaluate(() => sessionStorage.getItem("sy.session")),
				).toBeNull();
				expect(
					await page.evaluate(() =>
						JSON.stringify({ ...sessionStorage, ...localStorage }),
					),
				).not.toMatch(/Synthetic-password|اسم.English|"token"/);
				await page.reload();
				await expect(page.getByTestId("actor")).toBeVisible();
				await page.getByTestId("workspace-actions").click();
				await page.getByTestId("disconnect").click();
				await expect(page.getByTestId("sign-in-page")).toBeVisible();
				expect(api.requests.some((r) => r.path === "/v1/auth/sign-out")).toBe(
					true,
				);
				expect(errors).toEqual([]);
			});
		}
test("stable errors, password clearing and locale/theme actions", async ({
	page,
}) => {
	const api = await backend(page);
	await page.goto("/app/");
	await fill(page);
	api.fail("AUTH_INVALID_CREDENTIALS");
	await page.getByTestId("sign-in-submit").click();
	await expect(page.getByTestId("sign-in-error")).toHaveText(
		"البريد الإلكتروني أو كلمة المرور غير صحيحة.",
	);
	await expect(page.locator('input[name="password"]')).toHaveValue("");
	await page.getByTestId("locale-toggle").click();
	await expect(page.getByTestId("sign-in-error")).toHaveText(
		"The email or password is not correct.",
	);
	await page.getByTestId("theme-toggle").click();
	await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
	await fill(page);
	api.fail("AUTH_RATE_LIMITED");
	await page.getByTestId("sign-in-submit").click();
	await expect(page.getByTestId("sign-in-error")).toHaveText(
		"Too many requests. Try again in a moment.",
	);
	await expect(page.locator("body")).not.toContainText("UPSTREAM");
	await expect(page.locator('input[name="token"]')).toHaveCount(0);
});
test("business 401 returns to sign-in with no stored credentials", async ({
	page,
}) => {
	const api = await backend(page);
	await page.goto("/app/leads");
	await fill(page);
	await page.getByTestId("sign-in-submit").click();
	await expect(page.getByTestId("actor")).toBeVisible();
	api.expire();
	await page.getByTestId("nav-contacts").click();
	await expect(page.getByTestId("sign-in-page")).toBeVisible();
	expect(
		await page.evaluate(() => sessionStorage.getItem("sy.session")),
	).toBeNull();
});
test("bootstrap rejects another actor's remembered context", async ({
	page,
}) => {
	const api = await backend(page);
	api.active();
	await page.addInitScript(() =>
		sessionStorage.setItem(
			"sy.workspaces",
			JSON.stringify({
				actor: "other",
				contexts: [{ tenantId: "00000000-0000-4000-8000-000000000001" }],
			}),
		),
	);
	await page.goto("/app/");
	await expect(page.getByTestId("sign-in-page")).toBeVisible();
	await expect(page.getByTestId("sign-in-submit")).toBeEnabled();
	expect(api.requests.some((r) => r.path === "/v1/session")).toBe(false);
});
