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
