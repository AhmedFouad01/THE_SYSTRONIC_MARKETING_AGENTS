import { spawnSync } from "node:child_process";
// Existing fixture suites explicitly opt into Bearer UI. Cookie UI uses its own mock harness.
const mode = process.argv[2];
if (mode !== "dev" && mode !== "cookie")
	throw new Error("Expected dev or cookie UI mode");
const npm = process.env.npm_execpath;
if (!npm)
	throw new Error("Run through npm run test:ui or npm run test:ui:auth");
const env = { ...process.env, VITE_DEV_BEARER: mode === "dev" ? "1" : "0" };
function run(args: string[]) {
	const result = spawnSync(process.execPath, [npm as string, ...args], {
		env,
		stdio: "inherit",
	});
	if (result.error || result.status !== 0) process.exit(result.status ?? 1);
}
run(["run", "app:build"]);
run([
	"exec",
	"--",
	"playwright",
	"test",
	...(mode === "cookie" ? ["--config", "playwright.auth.config.ts"] : []),
]);
