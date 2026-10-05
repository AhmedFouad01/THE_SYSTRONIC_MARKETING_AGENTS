import { createHash, randomBytes, randomUUID } from "node:crypto";
import { type APIRequestContext, expect, type Page, test } from "@playwright/test";
import pg from "pg";
import { seed } from "../scripts/seed.js";
import { pickValue } from "./select-helper.js";

process.loadEnvFile(".env");

// Seeds a synthetic fixture plus one extra tenant-A member (role rep) with its own session so a non-merge,
// sensitive-read role can be exercised. Credentials stay in memory; never logged or asserted by value.
async function fixture() {
	const admin = new pg.Client({ connectionString: process.env.ADMIN_DATABASE_URL });
	await admin.connect();
	const f = await seed(admin);
	const rep = randomUUID();
	const repToken = randomBytes(32).toString("hex");
	await admin.query("INSERT INTO crm.principal VALUES($1,$2)", [rep, "Synthetic rep"]);
	await admin.query(
		"INSERT INTO crm.membership(tenant_id,id,principal_id,role) VALUES($1,$2,$3,'rep')",
		[f.ids.a, randomUUID(), rep],
	);
	await admin.query(
		"INSERT INTO crm.session(token_hash,principal_id,expires_at,mfa_verified) VALUES($1,$2,now()+interval '1 day',true)",
		[createHash("sha256").update(repToken).digest("hex"), rep],
	);
	await admin.end();
	return { ...f, rep, repToken };
}
type Fixture = Awaited<ReturnType<typeof fixture>>;

const headers = (f: Fixture, key = randomUUID()) => ({
	Authorization: `Bearer ${f.tokens.manager}`,
	"X-Tenant-ID": f.ids.a,
	"Idempotency-Key": key,
});

// Contacts are created only through the HTTP API.
async function makeContact(
	request: APIRequestContext,
	f: Fixture,
	name: string,
	opts: { email?: string; owner?: string } = {},
) {
	const command_id = randomUUID();
	const res = await request.post("/v1/contacts", {
		headers: headers(f, command_id),
		data: {
			command_id,
			display_name: name,
			...(opts.owner ? { owner_id: opts.owner } : {}),
			...(opts.email
				? { identifiers: [{ kind: "email", value: opts.email, provenance: "manual_entry" }] }
				: {}),
		},
	});
	expect(res.status()).toBe(201);
	return (await res.json()).data as { id: string; version: number };
}

async function connect(page: Page, token: string, tenant: string) {
	await page.locator("input[name=token]").fill(token);
	await page.locator("input[name=tenant]").fill(tenant);
	await page.getByTestId("connect-submit").click();
	await expect(page.getByTestId("actor")).toBeVisible();
}

const rows = (page: Page) => page.getByTestId("grid-row");
const rowOf = (page: Page, name: string) => rows(page).filter({ hasText: name });
const openRow = (page: Page, name: string) =>
	rowOf(page, name).click({ position: { x: 10, y: 10 } });
const detailTabs = (page: Page) => page.getByTestId("contact-detail").getByRole("tab");
const noPageOverflow = (page: Page) =>
	page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
const en = (page: Page) => page.addInitScript(() => localStorage.setItem("sy.locale", "en"));

for (const width of [360, 1280])
	for (const language of ["ar", "en"] as const)
		test(`contacts ${language} ${width}px: list, search, detail, tabs, no page overflow`, async ({
			page,
			request,
		}) => {
			const f = await fixture();
			await makeContact(request, f, "Alpha Contact", { email: `alpha-${randomUUID()}@example.test` });
			await makeContact(request, f, "Bravo Contact");
			const errors: string[] = [];
			page.on("pageerror", (e) => errors.push(e.message));
			await page.addInitScript((l) => localStorage.setItem("sy.locale", l), language);
			await page.setViewportSize({ width, height: 800 });
			await page.goto("/app/contacts");
			await connect(page, f.tokens.manager, f.ids.a);
			await expect(page.getByTestId("contacts-view")).toBeVisible();
			await expect(page.locator("html")).toHaveAttribute("dir", language === "ar" ? "rtl" : "ltr");
			await expect(rowOf(page, "Alpha Contact")).toHaveCount(1);
			await expect(rowOf(page, "Bravo Contact")).toHaveCount(1);

			await page.getByTestId("grid-search").fill("bravo");
			await expect(rowOf(page, "Bravo Contact")).toHaveCount(1);
			await expect(rowOf(page, "Alpha Contact")).toHaveCount(0);
			await page.getByTestId("grid-search").fill("");
			await expect(rowOf(page, "Alpha Contact")).toHaveCount(1);

			await openRow(page, "Alpha Contact");
			await expect(page.getByTestId("contact-detail-title")).toHaveText("Alpha Contact");
			// the manager reads the identifier; it is isolated LTR inside RTL text
			await expect(page.getByTestId("identifiers").locator("bdi[dir=ltr]")).toContainText("@example.test");
			expect(await noPageOverflow(page)).toBe(true);
			await detailTabs(page).nth(1).click();
			await expect(page.getByTestId("journey")).toBeVisible();
			expect(await noPageOverflow(page)).toBe(true);
			await detailTabs(page).nth(2).click();
			expect(await noPageOverflow(page)).toBe(true);
			expect(errors).toEqual([]);
		});

for (const language of ["en", "ar"] as const)
	test(`contacts ${language}: detail tabs keyboard (arrows follow direction, Home/End)`, async ({
		page,
		request,
	}) => {
		const f = await fixture();
		await makeContact(request, f, "Keyboard Contact");
		await page.addInitScript((l) => localStorage.setItem("sy.locale", l), language);
		await page.goto("/app/contacts");
		await connect(page, f.tokens.manager, f.ids.a);
		await openRow(page, "Keyboard Contact");
		const tabs = detailTabs(page);
		await expect(tabs).toHaveCount(3);
		const forward = language === "ar" ? "ArrowLeft" : "ArrowRight";
		const back = language === "ar" ? "ArrowRight" : "ArrowLeft";
		await tabs.nth(0).focus();
		await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
		await page.keyboard.press(forward);
		await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
		await expect(tabs.nth(1)).toBeFocused();
		await expect(page.getByTestId("journey")).toBeVisible();
		await page.keyboard.press(forward);
		await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "true");
		await page.keyboard.press(back);
		await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
		await page.keyboard.press("Home");
		await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
		await page.keyboard.press("End");
		await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "true");
	});

test("contacts en: detail edit, simulated version conflict, reload and retry, add identifier", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const c = await makeContact(request, f, "Original Name");
	await en(page);
	await page.goto("/app/contacts");
	await connect(page, f.tokens.manager, f.ids.a);
	await openRow(page, "Original Name");
	await expect(page.getByTestId("contact-detail-title")).toHaveText("Original Name");
	await expect(page.getByTestId("contact-version")).toHaveText("0");
	await expect(page.getByTestId("identifiers-hidden")).toBeVisible();

	// another actor edits first: the UI still holds version 0
	const command_id = randomUUID();
	const other = await request.patch(`/v1/contacts/${c.id}`, {
		headers: headers(f, command_id),
		data: { command_id, expected_version: 0, display_name: "Changed elsewhere" },
	});
	expect(other.status()).toBe(200);

	const detail = page.getByTestId("contact-detail");
	await page.getByTestId("record-edit").click();
	await detail.getByLabel("Name").fill("Edited locally");
	await page.getByTestId("contact-save").click();
	await expect(page.getByTestId("contact-conflict")).toContainText("changed by someone else");
	await page.getByTestId("contact-reload").click();
	await expect(page.getByTestId("contact-detail-title")).toHaveText("Changed elsewhere");
	await expect(page.getByTestId("contact-version")).toHaveText("1");
	await expect(page.getByTestId("contact-conflict")).toHaveCount(0);

	// client validation, then a real save adding an email identifier
	await pickValue(detail.getByLabel("Add identifier"), "email");
	await detail.getByLabel("Identifier value").fill("nope");
	await page.getByTestId("contact-save").click();
	await expect(detail.getByText("Enter a valid email address.")).toBeVisible();
	await detail.getByLabel("Name").fill("Edited twice");
	await detail.getByLabel("Identifier value").fill("edited@example.test");
	await page.getByTestId("contact-save").click();
	await expect(page.getByTestId("toast").filter({ hasText: "Contact updated." })).toBeVisible();
	await expect(page.getByTestId("contact-detail-title")).toHaveText("Edited twice");
	await expect(page.getByTestId("contact-version")).toHaveText("2");
	await expect(page.getByTestId("identifiers")).toContainText("edited@example.test");
	await expect(rowOf(page, "Edited twice")).toHaveCount(1);
});

test("contacts en: journey tab renders the contact timeline", async ({ page, request }) => {
	const f = await fixture();
	const c = await makeContact(request, f, "Journey Contact");
	const command_id = randomUUID();
	await request.patch(`/v1/contacts/${c.id}`, {
		headers: headers(f, command_id),
		data: { command_id, expected_version: 0, display_name: "Journey Contact" },
	});
	await en(page);
	await page.goto("/app/contacts");
	await connect(page, f.tokens.manager, f.ids.a);
	await openRow(page, "Journey Contact");
	await page.getByRole("tab", { name: "Journey" }).click();
	const items = page.getByTestId("journey-item");
	await expect(items.first()).toContainText("Contact created");
	await expect(items.nth(1)).toContainText("Contact updated");
});

test("contacts en: duplicates, merge preview, stale 409 then confirmed merge", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const email = `dup-${randomUUID()}@example.test`;
	const target = await makeContact(request, f, "Target Person", { email });
	const source = await makeContact(request, f, "Source Person", { email });
	await en(page);
	await page.goto("/app/contacts");
	await connect(page, f.tokens.manager, f.ids.a);
	await openRow(page, "Target Person");
	await page.getByRole("tab", { name: "Duplicates" }).click();
	const dup = page.getByTestId("duplicate-item");
	await expect(dup).toHaveCount(1);
	await expect(dup).toContainText("Source Person");

	// preview dialog: field-by-field result, affected counts; Esc closes without merging
	const opener = page.getByTestId("duplicate-merge");
	await opener.click();
	const preview = page.getByTestId("merge-preview-dialog");
	await expect(preview).toBeVisible();
	const fields = page.getByTestId("merge-fields");
	await expect(fields.getByRole("row", { name: /Name/ })).toContainText("Source Person");
	await expect(fields.getByRole("row", { name: /Name/ })).toContainText("Target Person");
	await expect(page.getByTestId("merge-affected")).toContainText("0 leads");
	await expect(preview).toContainText("display_name: target retained");
	await page.keyboard.press("Escape");
	await expect(preview).toHaveCount(0);
	await expect(opener).toBeFocused();
	await expect(rowOf(page, "Source Person")).toHaveCount(1);

	// confirm dialog; a stale preview (409) is reported and keeps the dialog open
	await opener.click();
	await page.getByTestId("merge-continue").click();
	const confirm = page.getByTestId("merge-confirm-dialog");
	await expect(confirm).toBeVisible();
	await page.route("**/v1/contacts/merges", (route) =>
		route.fulfill({
			status: 409,
			contentType: "application/json",
			body: JSON.stringify({ code: "VERSION_CONFLICT", safe_message: "stale", request_id: "r", retryable: false }),
		}),
	);
	await confirm.getByRole("button", { name: "Merge contacts" }).click();
	await expect(page.getByTestId("merge-error")).toContainText("changed since the preview");
	await page.unroute("**/v1/contacts/merges");

	// real merge: toast, source row gone, target version bumped, journey records the merge
	await confirm.getByRole("button", { name: "Merge contacts" }).click();
	await expect(page.getByTestId("toast").filter({ hasText: "Contacts merged." })).toBeVisible();
	await expect(confirm).toHaveCount(0);
	await expect(rowOf(page, "Source Person")).toHaveCount(0);
	await expect(rowOf(page, "Target Person")).toHaveCount(1);
	await expect(page.getByTestId("contact-version")).toHaveText("1");
	await expect(page.getByTestId("identifiers").locator("li")).toHaveCount(2);
	const after = await request.get(`/v1/contacts/${source.id}`, { headers: headers(f) });
	expect((await after.json()).data.merged_into_id).toBe(target.id);
	await page.getByRole("tab", { name: "Journey" }).click();
	await expect(page.getByTestId("journey")).toContainText("Another contact was merged in");
});

test("contacts en: rep (no merge permission) sees merge disabled with a reason", async ({
	page,
	request,
}) => {
	const f = await fixture();
	const email = `rep-${randomUUID()}@example.test`;
	await makeContact(request, f, "Rep Own One", { email, owner: f.rep });
	await makeContact(request, f, "Rep Own Two", { email, owner: f.rep });
	await en(page);
	await page.goto("/app/contacts");
	await connect(page, f.repToken, f.ids.a);
	await openRow(page, "Rep Own One");
	await page.getByRole("tab", { name: "Duplicates" }).click();
	await expect(page.getByTestId("duplicate-item")).toHaveCount(1);
	await expect(page.getByTestId("duplicate-merge")).toBeDisabled();
	await expect(page.getByTestId("merge-blocked")).toContainText("merge permission");
});

test("contacts en: reader sees redacted identifiers, restricted duplicates and a 403 on edit", async ({
	page,
	request,
}) => {
	const f = await fixture();
	await makeContact(request, f, "Readable Person", { email: `r-${randomUUID()}@example.test` });
	await en(page);
	await page.goto("/app/contacts");
	await connect(page, f.tokens.reader, f.ids.a);
	await openRow(page, "Readable Person");
	await expect(page.getByTestId("identifiers-hidden")).toBeVisible();
	await page.getByTestId("record-edit").click();
	await page.getByTestId("contact-detail").getByLabel("Name").fill("Reader edit");
	await page.getByTestId("contact-save").click();
	await expect(page.getByTestId("contact-forbidden")).toContainText("You cannot edit this contact");
	await page.getByTestId("record-edit-cancel").click();
	await page.getByRole("tab", { name: "Duplicates" }).click();
	await expect(page.getByTestId("state-forbidden")).toContainText("Duplicates are restricted");
	await expect(page.getByTestId("duplicate-merge")).toHaveCount(0);
});
