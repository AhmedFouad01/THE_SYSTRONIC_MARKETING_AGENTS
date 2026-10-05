import { defineConfig } from "@playwright/test";
export default defineConfig({
	testDir: "tests",
	testMatch: [
		"ui.spec.ts",
		"m1-ui.spec.ts",
		"m2-ui.spec.ts",
		"mvp-shell.spec.ts",
		"mvp-app.spec.ts",
		"mvp-leads.spec.ts",
	],
	workers: 1,
	use: { baseURL: "http://127.0.0.1:4317", browserName: "chromium" },
	webServer: {
		command: "npm run api",
		url: "http://127.0.0.1:4317",
		reuseExistingServer: false,
	},
});
