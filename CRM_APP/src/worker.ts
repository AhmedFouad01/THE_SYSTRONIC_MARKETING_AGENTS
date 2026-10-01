import { pathToFileURL } from "node:url";
import { pool, type Context } from "./db.js";
import { workOne } from "./jobs.js";
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
	const contexts: Context[] = JSON.parse(process.env.WORKER_CONTEXTS ?? "[]");
	if (!contexts.length) throw new Error("WORKER_CONTEXTS required");
	let stop = false;
	process.on("SIGTERM", () => {
		stop = true;
	});
	process.on("SIGINT", () => {
		stop = true;
	});
	do {
		for (const ctx of contexts) await workOne(ctx);
		if (!process.argv.includes("--once"))
			await new Promise((r) => setTimeout(r, 500));
	} while (!stop && !process.argv.includes("--once"));
	await pool.end();
}
