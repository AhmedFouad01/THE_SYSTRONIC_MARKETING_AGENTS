import { defineConfig } from "vitest/config";

// Non-DB unit tests only: client modules + pure server helpers. DB/UI suites keep their own runners.
export default defineConfig({
	test: {
		include: ["app/src/**/*.test.{ts,tsx}", "tests/**/*.unit.test.ts"],
	},
});
