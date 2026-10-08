import { expect, type Page, test } from "@playwright/test";

const tenant = "00000000-0000-4000-8000-000000000001";
const actor = "00000000-0000-4000-8000-000000000002";
const manager = "00000000-0000-4000-8000-000000000003";
const member = "00000000-0000-4000-8000-000000000004";
const invitation = "00000000-0000-4000-8000-000000000005";
const token = "abcdefghijklmnopqrstuvwx";
type Role = "manager" | "rep" | "reader";
async function backend(page: Page, role: Role = "manager", grant = false) {
	let actorRole = role;
	let activeMember = true;
	let abortWrite = false;
	let listFailure = false;
	let blockWrites = false;
	const members = [
		{
			id: manager,
			userId: actor,
			role: "manager" as Role,
			user: { id: actor, name: "مدير English", email: "manager@example.test" },
		},
		{
			id: member,
			userId: "other",
			role: "rep" as Role,
			user: { id: "other", name: "اسم English", email: "rep@example.test" },
		},
	];
	const invites = [
		{
			id: invitation,
			email: "Invited.اسم@example.test",
			role: "reader" as Role,
			status: "pending",
		},
	];
	const requests: Array<{
		path: string;
		method: string;
		body: Record<string, unknown> | null;
		headers: Record<string, string>;
	}> = [];
	await page.addInitScript(
		({ actor, tenant, grant }) => {
			sessionStorage.setItem(
				"sy.workspaces",
				JSON.stringify({
					actor,
					contexts: [
						{
							tenantId: tenant,
							...(grant
								? { grantId: "00000000-0000-4000-8000-000000000006" }
								: {}),
						},
					],
				}),
			);
			Object.defineProperty(navigator, "clipboard", {
				configurable: true,
				value: {
					writeText: async (value: string) => {
						(window as unknown as { copied: string }).copied = value;
					},
				},
			});
		},
		{ actor, tenant, grant },
	);
	await page.route("**/v1/**", async (route) => {
		const request = route.request();
		const url = new URL(request.url());
		const path = url.pathname;
		const method = request.method();
		const body = request.postDataJSON() as Record<string, unknown> | null;
		requests.push({ path, method, body, headers: request.headers() });
		let json: unknown = { data: [], request_id: "fixture" };
		let status = 200;
		if (path === "/v1/auth/get-session") json = { user: { id: actor } };
		else if (path === "/v1/session") {
			if (!activeMember) {
				status = 403;
				json = { code: "FORBIDDEN" };
			} else
				json = {
					data: {
						actor,
						configure: actorRole === "manager",
						merge: actorRole === "manager",
						audit: false,
						schema_read: false,
					},
				};
		} else if (path.startsWith("/v1/users") || path.startsWith("/v1/invites")) {
			if (
				actorRole !== "manager" ||
				grant ||
				(blockWrites && method !== "GET")
			) {
				status = 403;
				json = { code: "FORBIDDEN", message: "UPSTREAM MUST STAY HIDDEN" };
			} else if (!request.headers()["idempotency-key"] && method !== "GET") {
				status = 422;
				json = { code: "VALIDATION_FAILED" };
			} else if (method === "GET") {
				if (listFailure) {
					status = 503;
					json = { code: "AUTH_UNAVAILABLE" };
				} else
					json = {
						data:
							path === "/v1/users"
								? {
										members: members.slice(
											Number(url.searchParams.get("offset") ?? 0),
											Number(url.searchParams.get("offset") ?? 0) + 100,
										),
										total: members.length,
									}
								: invites,
					};
			} else if (path === "/v1/invites" && method === "POST") {
				const created = {
					id: "00000000-0000-4000-8000-000000000007",
					email: String(body?.email),
					role: body?.role as Role,
					status: "pending",
				};
				invites.push(created);
				status = 201;
				json = {
					data: {
						invitation: created,
						link: `${url.origin}/app/invite#invitationId=${created.id}`,
					},
				};
			} else if (path.endsWith("/reset-password"))
				json = {
					data: {
						status: true,
						link: `${url.origin}/app/reset#token=${token}`,
					},
				};
			else if (path.startsWith("/v1/invites/")) {
				const target = invites.find((i) => path.endsWith(i.id));
				if (target) target.status = "canceled";
				json = { data: { status: true } };
			} else {
				const target = members.find((m) => path.endsWith(m.id));
				if (
					target?.role === "manager" &&
					members.filter((m) => m.role === "manager").length === 1 &&
					(method === "DELETE" || body?.role !== "manager")
				) {
					status = 409;
					json = {
						code: "LAST_MANAGER_REQUIRED",
						message: "UPSTREAM MUST STAY HIDDEN",
					};
				} else if (target) {
					if (method === "PATCH") {
						target.role = body?.role as Role;
						if (target.userId === actor) actorRole = target.role;
					} else {
						if (target.userId === actor) activeMember = false;
						members.splice(members.indexOf(target), 1);
					}
					json = { data: { status: true } };
				}
			}
			if (abortWrite && method !== "GET") {
				abortWrite = false;
				await route.abort("failed");
				return;
			}
		}
		await route.fulfill({ status, json });
	});
	return {
		requests,
		members,
		abortNext: () => {
			abortWrite = true;
		},
		failLists: (value: boolean) => {
			listFailure = value;
		},
		block: () => {
			blockWrites = true;
		},
		demote: () => {
			actorRole = "rep";
		},
	};
}
async function safe(page: Page) {
	expect(
		await page.evaluate(() =>
			JSON.stringify({ ...localStorage, ...sessionStorage }),
		),
	).not.toMatch(
		/abcdefghijklmnopqrstuvwx|invitationId|rep@example|manager@example/,
	);
	expect(new URL(page.url()).search).toBe("");
	expect(new URL(page.url()).hash).toBe("");
	await expect(page.locator("body")).not.toContainText("UPSTREAM");
}
async function choose(page: Page, id: string, label: string) {
	await page.getByTestId(id).click();
	await page.getByRole("option", { name: label, exact: true }).click();
}
for (const locale of ["ar", "en"])
	for (const theme of ["light", "dark"])
		for (const width of [1440, 375]) {
			test(`manager users ${locale} ${theme} ${width}`, async ({
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
				await page.goto("/app/settings/users");
				await expect(page.getByTestId("users-members")).toBeVisible();
				await expect(page.locator("html")).toHaveAttribute(
					"dir",
					locale === "ar" ? "rtl" : "ltr",
				);
				await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
				expect(
					await page.evaluate(
						() => document.documentElement.scrollWidth <= innerWidth,
					),
				).toBe(true);
				await page.screenshot({ path: info.outputPath("users.png") });
				await page.getByTestId("users-invite-submit").click();
				await expect(page.locator('input[name="invite-email"]')).toBeFocused();
				await page
					.locator('input[name="invite-email"]')
					.fill("اسم.New@example.test");
				await page.getByTestId("users-invite-submit").click();
				await expect(page.getByTestId("users-copy-panel")).toBeVisible();
				await page.getByTestId("users-copy").click();
				await expect(page.getByTestId("users-copied")).toBeVisible();
				expect(
					await page.evaluate(
						() => (window as unknown as { copied: string }).copied,
					),
				).toContain("/app/invite#invitationId=");
				expect(
					api.requests.filter(
						(r) => r.method === "POST" && r.path === "/v1/invites",
					),
				).toHaveLength(1);
				await page.getByTestId("users-clear-link").click();
				await expect(page.getByTestId("users-copy-panel")).toHaveCount(0);
				await page.getByTestId(`user-reset-${member}`).click();
				await expect(page.locator('input[name="copy-link"]')).toHaveValue(
					new RegExp(`/app/reset#token=${token}`),
				);
				await safe(page);
				expect(errors).toEqual([]);
				for (const r of api.requests.filter(
					(r) =>
						r.path.startsWith("/v1/users") || r.path.startsWith("/v1/invites"),
				)) {
					expect(r.headers["x-tenant-id"]).toBe(tenant);
					expect(r.headers.authorization).toBeUndefined();
				}
				await page.reload();
				await expect(page.getByTestId("users-members")).toBeVisible();
				await expect(page.getByTestId("users-copy-panel")).toHaveCount(0);
			});
		}
for (const role of ["rep", "reader"] as const)
	test(`${role} sees no controls and direct API remains forbidden`, async ({
		page,
	}) => {
		const api = await backend(page, role);
		await page.goto("/app/settings/users");
		await expect(page.getByTestId("users-denied")).toBeVisible();
		await expect(page.getByTestId("nav-users")).toHaveCount(0);
		await expect(page.getByTestId("users-invite-submit")).toHaveCount(0);
		expect(
			api.requests.filter(
				(r) =>
					r.path.startsWith("/v1/users") || r.path.startsWith("/v1/invites"),
			),
		).toHaveLength(0);
		const statuses = await page.evaluate(
			async ({ tenant, member }) => {
				const results = [];
				for (const [path, method, body] of [
					["/v1/users", "GET", undefined],
					["/v1/invites", "POST", { email: "new@example.test", role: "rep" }],
					[`/v1/users/${member}`, "PATCH", { role: "manager" }],
					[`/v1/users/${member}`, "DELETE", {}],
					[`/v1/users/${member}/reset-password`, "POST", {}],
				] as const) {
					results.push(
						(
							await fetch(path, {
								method,
								credentials: "same-origin",
								headers: {
									"X-Tenant-ID": tenant,
									"Content-Type": "application/json",
									"Idempotency-Key": crypto.randomUUID(),
								},
								...(body ? { body: JSON.stringify(body) } : {}),
							})
						).status,
					);
				}
				return results;
			},
			{ tenant, member },
		);
		expect(statuses).toEqual([403, 403, 403, 403, 403]);
		await safe(page);
	});
test("agency grant does not expose direct manager controls", async ({
	page,
}) => {
	await backend(page, "manager", true);
	await page.goto("/app/settings/users");
	await expect(page.getByTestId("users-denied")).toBeVisible();
	await expect(page.getByTestId("nav-users")).toHaveCount(0);
});
test("role changes reconcile server state; last manager demotion and removal stay 409", async ({
	page,
}) => {
	const api = await backend(page);
	await page.addInitScript(() => localStorage.setItem("sy.locale", "en"));
	await page.goto("/app/settings/users");
	await choose(page, `user-role-${member}`, "Viewer");
	await page.getByTestId(`user-save-${member}`).click();
	await expect(page.getByTestId(`user-role-${member}`)).toContainText("Viewer");
	await expect(page.getByTestId(`user-save-${member}`)).toBeDisabled();
	await choose(page, `user-role-${manager}`, "Sales rep");
	await page.getByTestId(`user-save-${manager}`).click();
	await expect(page.getByTestId("users-error")).toHaveText(
		"A workspace must keep at least one active manager.",
	);
	await expect(page.getByTestId(`user-role-${manager}`)).toContainText(
		"Manager",
	);
	await page.getByTestId(`user-deactivate-${manager}`).click();
	await expect(page.getByTestId("dialog-cancel")).toBeFocused();
	await page.getByTestId("dialog-confirm").click();
	await expect(page.getByTestId("users-error")).toHaveText(
		"A workspace must keep at least one active manager.",
	);
	await expect(page.getByTestId(`user-${manager}`)).toBeVisible();
	const writes = api.requests.filter(
		(r) => r.method === "PATCH" || r.method === "DELETE",
	);
	expect(writes).toHaveLength(3);
	await safe(page);
});
test("deactivation and invite cancellation reconcile; cancel initially has focus", async ({
	page,
}) => {
	const api = await backend(page);
	await page.goto("/app/settings/users");
	await page.getByTestId(`user-deactivate-${member}`).click();
	await expect(page.getByTestId("dialog-cancel")).toBeFocused();
	await page.getByTestId("dialog-cancel").click();
	expect(api.requests.some((r) => r.method === "DELETE")).toBe(false);
	await page.getByTestId(`user-deactivate-${member}`).click();
	await page.getByTestId("dialog-confirm").click();
	await expect(page.getByTestId(`user-${member}`)).toHaveCount(0);
	await page.getByTestId(`invite-cancel-${invitation}`).click();
	await page.getByTestId("dialog-confirm").click();
	await expect(page.getByTestId(`invite-cancel-${invitation}`)).toHaveCount(0);
	expect(api.requests.filter((r) => r.method === "DELETE")).toHaveLength(2);
});
test("uncertain invite mutation reconciles before any manual retry", async ({
	page,
}) => {
	const api = await backend(page);
	await page.goto("/app/settings/users");
	await page.locator('input[name="invite-email"]').fill("new@example.test");
	api.abortNext();
	await page.getByTestId("users-invite-submit").click();
	await expect(page.getByTestId("users-error")).toBeVisible();
	await expect(
		page.getByTestId("invite-00000000-0000-4000-8000-000000000007"),
	).toBeVisible();
	expect(
		api.requests.filter((r) => r.method === "POST" && r.path === "/v1/invites"),
	).toHaveLength(1);
	await expect(page.getByTestId("users-copy-panel")).toHaveCount(0);
});
test("failed reconciliation disables mutations until a successful explicit refresh", async ({
	page,
}) => {
	const api = await backend(page);
	await page.goto("/app/settings/users");
	await page.locator('input[name="invite-email"]').fill("new@example.test");
	api.failLists(true);
	await page.getByTestId("users-invite-submit").click();
	await expect(page.getByTestId("users-error")).toBeVisible();
	await expect(page.getByTestId("users-invite-submit")).toBeDisabled();
	await expect(page.getByTestId("users-copy-panel")).toHaveCount(0);
	api.failLists(false);
	await page.getByTestId("users-refresh").click();
	await expect(page.getByTestId("users-invite-submit")).toBeEnabled();
	expect(
		api.requests.filter((r) => r.method === "POST" && r.path === "/v1/invites"),
	).toHaveLength(1);
});
test("server denial clears stale manager data and actions", async ({
	page,
}) => {
	const api = await backend(page);
	await page.goto("/app/settings/users");
	await expect(page.getByTestId("users-members")).toBeVisible();
	api.demote();
	await page.getByTestId(`user-reset-${member}`).click();
	await expect(page.getByTestId("users-denied")).toBeVisible();
	await expect(page.getByTestId("nav-users")).toHaveCount(0);
	await expect(page.getByTestId("users-members")).toHaveCount(0);
	await expect(page.getByTestId("users-copy-panel")).toHaveCount(0);
});
test("members pagination follows total and exact accepted query keys", async ({
	page,
}) => {
	const api = await backend(page);
	for (let i = 0; i < 100; i++)
		api.members.push({ ...api.members[1], id: `synthetic-${i}` });
	await page.goto("/app/settings/users");
	await page.getByTestId("users-next").click();
	await expect(page.getByTestId("users-previous")).toBeEnabled();
	await expect(page.getByTestId("users-next")).toBeDisabled();
	await page.getByTestId("users-previous").click();
	await expect(page.getByTestId(`user-${manager}`)).toBeVisible();
});

test("self demotion refreshes actor capabilities and clears admin controls", async ({
	page,
}) => {
	const api = await backend(page);
	api.members[1].role = "manager";
	await page.addInitScript(() => localStorage.setItem("sy.locale", "en"));
	await page.goto("/app/settings/users");
	await choose(page, `user-role-${manager}`, "Sales rep");
	await page.getByTestId(`user-save-${manager}`).click();
	await expect(page.getByTestId("users-denied")).toBeVisible();
	await expect(page.getByTestId("nav-users")).toHaveCount(0);
	expect(
		api.requests.filter((r) => r.path === "/v1/session").length,
	).toBeGreaterThan(1);
	await safe(page);
});
test("self deactivation removes workspace access on the next bootstrap request", async ({
	page,
}) => {
	const api = await backend(page);
	api.members[1].role = "manager";
	await page.goto("/app/settings/users");
	await page.getByTestId(`user-deactivate-${manager}`).click();
	await page.getByTestId("dialog-confirm").click();
	await expect(page.getByTestId("sign-in-page")).toBeVisible();
	await expect(page.getByTestId("users-members")).toHaveCount(0);
	expect(
		api.requests.filter((r) => r.path === "/v1/session").length,
	).toBeGreaterThan(1);
	await safe(page);
});

test("unavailable clipboard leaves the generated link selectable", async ({
	page,
}) => {
	await backend(page);
	await page.addInitScript(() => localStorage.setItem("sy.locale", "en"));
	await page.goto("/app/settings/users");
	await page.getByTestId(`user-reset-${member}`).click();
	await expect(page.getByTestId("users-copy-panel")).toBeVisible();
	await page.evaluate(() =>
		Object.defineProperty(navigator, "clipboard", { value: undefined }),
	);
	await page.getByTestId("users-copy").click();
	await expect(page.locator('input[name="copy-link"]')).toBeFocused();
	await expect(page.getByTestId("users-copy-panel")).toContainText(
		"Copy is unavailable",
	);
	await safe(page);
});
