import type { Locator } from "@playwright/test";

// The app's Select is a listbox popover (button[role=combobox] + role=option items), not a native <select>.
async function open(trigger: Locator) {
	await trigger.click();
	const list = trigger.page().getByRole("listbox");
	await list.waitFor();
	return list;
}

/** Choose the option whose visible label is `label`. */
export async function pickLabel(trigger: Locator, label: string) {
	const list = await open(trigger);
	await list.getByRole("option", { name: label, exact: true }).click();
}

/** Choose the option whose value is `value` (empty string = the blank/"All" option). */
export async function pickValue(trigger: Locator, value: string) {
	const list = await open(trigger);
	await list.locator(`[role=option][data-value="${value}"]`).click();
}

/** Pick a day (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm`) in the app DatePicker (button[role=combobox] + month grid). */
export async function pickDay(trigger: Locator, value: string) {
	const page = trigger.page();
	await trigger.click();
	const panel = page.locator(".sy-date__panel");
	await panel.waitFor();
	const day = panel.locator(`[data-day="${value.slice(0, 10)}"]:not([data-outside])`);
	for (let i = 0; i < 14 && (await day.count()) === 0; i++) await panel.getByTestId("date-next").click();
	await day.click();
	const done = panel.getByTestId("date-done");
	if (await done.count()) await done.click();
}
