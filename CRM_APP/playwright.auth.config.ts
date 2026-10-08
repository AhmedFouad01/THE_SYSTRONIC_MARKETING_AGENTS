import { defineConfig } from "@playwright/test";
// B7 contracts are mocked in the browser; this suite needs no database or API credentials.
export default defineConfig({
	testDir: "tests",
	testMatch: ["auth-ui.spec.ts"],
	workers: 1,
	use: { baseURL: "http://127.0.0.1:4418", browserName: "chromium" },
	webServer: {
		command: "npx vite preview app --host 127.0.0.1 --port 4418 --strictPort",
		url: "http://127.0.0.1:4418/app/",
		reuseExistingServer: false,
	},
});
