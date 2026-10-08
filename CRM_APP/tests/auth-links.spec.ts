import { expect, type Page, test } from "@playwright/test";

const invitationId = "00000000-0000-4000-8000-000000000008";
const token = "abcdefghijklmnopqrstuvwx";
const password = "Synthetic-password-only!";
async function backend(page: Page, signed = false) {
	let authenticated = signed;
	let fail: string | null = null;
	const requests: Array<{
		path: string;
		body: unknown;
		headers: Record<string, string>;
	}> = [];
	await page.route("**/v1/**", async (route) => {
		const request = route.request();
		const path = new URL(request.url()).pathname;
		requests.push({
			path,
			body: request.postDataJSON(),
			headers: request.headers(),
		});
		let json: unknown = { status: true };
		let status = 200;
		if (path.endsWith("get-session"))
			json = authenticated ? { user: { id: "fixture-actor" } } : null;
		else if (path.endsWith("sign-in/email")) {
			authenticated = true;
			json = { user: { id: "fixture-actor" } };
		} else if (path.endsWith("sign-out")) authenticated = false;
		else if (fail) {
			status = fail === "AUTH_INVITATION_INVALID" ? 403 : 400;
			json = { code: fail, message: "UPSTREAM MUST STAY HIDDEN" };
		}
		await route.fulfill({ status, json });
	});
	return {
		requests,
		fail: (code: string | null) => {
			fail = code;
		},
	};
}
async function fill(page: Page, kind: "invite" | "reset", existing = false) {
	if (kind === "invite") {
		if (!existing) await page.locator('input[name="name"]').fill("اسم English");
		await page.locator('input[name="email"]').fill("اسم.English@example.test");
	}
	await page.locator('input[name="password"]').fill(password);
	if (!existing) await page.locator('input[name="confirm"]').fill(password);
}
function link(kind: "invite" | "reset") {
	return kind === "invite"
		? `/app/invite#invitationId=${invitationId}`
		: `/app/reset#token=${token}`;
}
async function safe(page: Page, api: Awaited<ReturnType<typeof backend>>) {
	expect(new URL(page.url()).hash).toBe("");
	expect(new URL(page.url()).search).toBe("");
	expect(
		await page.evaluate(() =>
			JSON.stringify({ ...localStorage, ...sessionStorage }),
		),
	).not.toMatch(
		/abcdefghijklmnopqrstuvwx|00000000-0000-4000-8000-000000000008|Synthetic-password|اسم.English/,
	);
	for (const request of api.requests) {
		expect(request.path).not.toContain(token);
		expect(request.path).not.toContain(invitationId);
		expect(request.headers.authorization).toBeUndefined();
		expect(request.headers.referer).toBeUndefined();
	}
	expect(
		api.requests.some(
			(r) =>
				r.path === "/v1/session" ||
				r.path === "/v1/auth/request-password-reset",
		),
	).toBe(false);
	await expect(page.locator("body")).not.toContainText("UPSTREAM");
}
for (const kind of ["invite", "reset"] as const)
	for (const locale of ["ar", "en"])
		for (const theme of ["light", "dark"])
			for (const width of [1440, 375]) {
				test(`link ${kind} ${locale} ${theme} ${width}`, async ({
					page,
				}, info) => {
					const api = await backend(page);
					const errors: string[] = [];
					page.on("pageerror", (e) => errors.push(e.message));
					await page.addInitScript(
						({ locale, theme }) => {
							localStorage.setItem("sy.locale", locale);
							localStorage.setItem("sy.theme", theme);
						},
						{ locale, theme },
					);
					await page.setViewportSize({ width, height: 1000 });
					await page.goto(link(kind));
					await expect(page.getByTestId(`${kind}-page`)).toBeVisible();
					await expect(page.locator("html")).toHaveAttribute(
						"dir",
						locale === "ar" ? "rtl" : "ltr",
					);
					await expect(page.locator("html")).toHaveAttribute(
						"data-theme",
						theme,
					);
					await page.getByTestId("link-submit").click();
					await expect(
						page.locator(
							`input[name="${kind === "invite" ? "name" : "password"}"]`,
						),
					).toBeFocused();
					await fill(page, kind);
					expect(
						await page.evaluate(
							() => document.documentElement.scrollWidth <= innerWidth,
						),
					).toBe(true);
					await page.screenshot({ path: info.outputPath("link.png") });
					await page.getByTestId("link-submit").click();
					await expect(page.getByTestId("link-success")).toBeVisible();
					await expect(page.getByTestId("link-success")).toBeFocused();
					await expect(page.getByTestId("link-submit")).toHaveCount(0);
					if (kind === "invite") {
						expect(
							api.requests
								.filter((r) => !r.path.endsWith("get-session"))
								.map((r) => r.path),
						).toEqual([
							"/v1/auth/sign-up/email",
							"/v1/auth/sign-in/email",
							"/v1/auth/organization/accept-invitation",
						]);
						expect(
							api.requests.find((r) => r.path.endsWith("accept-invitation"))
								?.body,
						).toEqual({ invitationId });
					} else {
						expect(api.requests.map((r) => r.path)).toEqual([
							"/v1/auth/reset-password",
						]);
						expect(api.requests[0]?.body).toEqual({
							token,
							newPassword: password,
						});
						await expect(
							page.getByTestId("reset-email-unavailable"),
						).toBeVisible();
					}
					await safe(page, api);
					expect(errors).toEqual([]);
					await page.reload();
					await expect(page.getByTestId("link-error")).toBeVisible();
				});
			}
test("existing account sign-in accepts without registration", async ({
	page,
}) => {
	const api = await backend(page);
	await page.goto(link("invite"));
	await page.getByTestId("invite-mode").click();
	await fill(page, "invite", true);
	await page.getByTestId("link-submit").click();
	await expect(page.getByTestId("link-success")).toBeVisible();
	expect(api.requests.some((r) => r.path.endsWith("sign-up/email"))).toBe(
		false,
	);
	await safe(page, api);
});
test("wrong signed actor sees localized denial and can switch to the invited account", async ({
	page,
}) => {
	const api = await backend(page, true);
	api.fail("AUTH_INVITATION_INVALID");
	await page.goto(link("invite"));
	await page.getByTestId("link-submit").click();
	await expect(page.getByTestId("link-error")).toBeVisible();
	await expect(page.getByTestId("link-error")).toBeFocused();
	await page.getByTestId("locale-toggle").click();
	await expect(page.getByTestId("link-error")).toContainText(
		"belongs to another email",
	);
	await page.getByTestId("invite-switch-account").click();
	api.fail(null);
	await fill(page, "invite", true);
	await page.getByTestId("link-submit").click();
	await expect(page.getByTestId("link-success")).toBeVisible();
	expect(api.requests.some((r) => r.path.endsWith("sign-up/email"))).toBe(
		false,
	);
	expect(api.requests.some((r) => r.path.endsWith("sign-out"))).toBe(true);
	await safe(page, api);
});
for (const kind of ["invite", "reset"] as const)
	for (const scenario of ["expired", "replayed"]) {
		test(`${kind} ${scenario} error`, async ({ page }) => {
			const api = await backend(page, kind === "invite");
			api.fail(
				kind === "invite" ? "AUTH_INVITATION_INVALID" : "AUTH_RESET_INVALID",
			);
			await page.goto(link(kind));
			if (kind === "reset") await fill(page, kind);
			await page.getByTestId("link-submit").click();
			await expect(page.getByTestId("link-error")).toBeVisible();
			await page.getByTestId("locale-toggle").click();
			await expect(page.getByTestId("link-error")).toContainText("expired");
			if (kind === "reset")
				await expect(page.locator('input[name="password"]')).toHaveCount(0);
			await safe(page, api);
		});
	}
test("password mismatch and server policy errors clear password without losing reset retry", async ({
	page,
}) => {
	const api = await backend(page);
	await page.goto(link("reset"));
	await fill(page, "reset");
	await page.locator('input[name="confirm"]').fill("Different-password!");
	await page.getByTestId("link-submit").click();
	await expect(page.locator('input[name="confirm"]')).toBeFocused();
	expect(api.requests).toHaveLength(0);
	await fill(page, "reset");
	api.fail("AUTH_PASSWORD_POLICY");
	await page.getByTestId("link-submit").click();
	await expect(page.getByTestId("link-error")).toBeVisible();
	await expect(page.locator('input[name="password"]')).toHaveValue("");
	await fill(page, "reset");
	api.fail(null);
	await page.getByTestId("link-submit").click();
	await expect(page.getByTestId("link-success")).toBeVisible();
	await safe(page, api);
});
test("query-only credentials rejected; cancel consumes memory capability", async ({
	page,
}) => {
	const api = await backend(page);
	await page.goto(`/app/reset?token=${token}`);
	await expect(page.getByTestId("link-error")).toBeVisible();
	expect(api.requests).toHaveLength(0);
	expect(new URL(page.url()).search).toBe("");
	await page.goto(link("reset"));
	await page.getByTestId("link-sign-in").click();
	await expect(page.getByTestId("sign-in-page")).toBeVisible();
	await page.goBack();
	await expect(page.getByTestId("link-error")).toBeVisible();
});

test("pending reset rejects duplicate submission", async ({ page }) => {
	await backend(page);
	let calls = 0;
	let release: () => void = () => {};
	const gate = new Promise<void>((resolve) => {
		release = resolve;
	});
	await page.route("**/v1/auth/reset-password", async (route) => {
		calls++;
		await gate;
		await route.fulfill({ json: { status: true } });
	});
	await page.goto(link("reset"));
	await fill(page, "reset");
	await page.getByTestId("link-submit").click();
	await expect.poll(() => calls).toBe(1);
	await expect(page.getByTestId("link-submit")).toBeDisabled();
	await page.evaluate(() =>
		document
			.querySelector("form")
			?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
	);
	release();
	await expect(page.getByTestId("link-success")).toBeVisible();
	expect(calls).toBe(1);
});

test("successful registration is not repeated after sign-in failure", async ({
	page,
}) => {
	const api = await backend(page);
	await page.route("**/v1/auth/sign-in/email", (route) =>
		route.fulfill({
			status: 401,
			json: {
				code: "AUTH_INVALID_CREDENTIALS",
				message: "UPSTREAM MUST STAY HIDDEN",
			},
		}),
	);
	await page.goto(link("invite"));
	await fill(page, "invite");
	await page.getByTestId("link-submit").click();
	await expect(page.getByTestId("link-error")).toBeVisible();
	await expect(page.locator('input[name="password"]')).toHaveValue("");
	await expect(page.locator('input[name="name"]')).toHaveCount(0);
	await page.unroute("**/v1/auth/sign-in/email");
	await fill(page, "invite", true);
	await page.getByTestId("link-submit").click();
	await expect(page.getByTestId("link-success")).toBeVisible();
	expect(
		api.requests.filter((r) => r.path.endsWith("sign-up/email")),
	).toHaveLength(1);
	await safe(page, api);
});
