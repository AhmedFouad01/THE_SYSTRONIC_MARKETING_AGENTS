import { spawnSync } from "node:child_process";
import { cp, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";
const bin = process.env.PG_BIN;
if (!bin) throw new Error("PG_BIN required");
const source = new URL(process.env.ADMIN_DATABASE_URL ?? "");
if (
	source.hostname !== "127.0.0.1" ||
	source.port !== "55432" ||
	source.pathname !== "/crm_m0"
)
	throw new Error("Synthetic local cluster only");
const originalDir = path.resolve(".local-postgres/data");
const backupDir = path.resolve(`backups/cold-${Date.now()}`);
const restoreDir = path.resolve(`.local-postgres/restore-${Date.now()}`);
await mkdir("backups", { recursive: true });
function control(dir: string, args: string[]) {
	const p = spawnSync(
		path.join(bin ?? "", "pg_ctl.exe"),
		["-D", dir, ...args],
		{ encoding: "utf8", windowsHide: true, timeout: 60000, stdio: "ignore" },
	);
	if (p.status !== 0) throw new Error(`pg_ctl failed: ${p.stderr}`);
}
const start = Date.now();
control(originalDir, ["-m", "fast", "-w", "stop"]);
try {
	await cp(originalDir, backupDir, {
		recursive: true,
		errorOnExist: true,
		force: false,
	});
} finally {
	control(originalDir, [
		"-l",
		".local-postgres/server.log",
		"-o",
		"-h 127.0.0.1 -p 55432",
		"-w",
		"start",
	]);
}
await cp(backupDir, restoreDir, {
	recursive: true,
	errorOnExist: true,
	force: false,
});
control(restoreDir, [
	"-l",
	".local-postgres/restore.log",
	"-o",
	"-h 127.0.0.1 -p 55433",
	"-w",
	"start",
]);
const elapsedMs = Date.now() - start;
const original = new pg.Client({ connectionString: source.href });
source.port = "55433";
const restored = new pg.Client({ connectionString: source.href });
await original.connect();
await restored.connect();
try {
	const { rows: tables } = await original.query(
		"SELECT tablename FROM pg_tables WHERE schemaname='crm' ORDER BY tablename",
	);
	for (const { tablename } of tables) {
		if (!/^[a-z_]+$/.test(tablename)) throw new Error("Unexpected table");
		const sql = `SELECT md5(coalesce(string_agg(row_to_json(x)::text,',' ORDER BY row_to_json(x)::text),'')) digest,count(*)::int count FROM crm.${tablename} x`;
		const a = (await original.query(sql)).rows[0],
			b = (await restored.query(sql)).rows[0];
		if (JSON.stringify(a) !== JSON.stringify(b))
			throw new Error(`Restore mismatch: ${tablename}`);
	}
	const runtime = new URL(process.env.DATABASE_URL ?? "");
	runtime.port = "55433";
	const probe = new pg.Client({ connectionString: runtime.href });
	await probe.connect();
	try {
		if ((await probe.query("SELECT * FROM crm.deal")).rowCount !== 0)
			throw new Error("Restored RLS failed closed check");
	} finally {
		await probe.end();
	}
	const result = {
		result: "PASS",
		tablesCompared: tables.length,
		elapsedMs,
		method:
			"Clean shutdown -> physical backup -> new cluster directory/port -> all CRM row digests/counts equal; runtime RLS fails closed",
		rpoRto: "Synthetic elapsed time only; no production RPO/RTO claim",
	};
	await writeFile(
		"backups/recovery-evidence.json",
		JSON.stringify(result, null, 2),
	);
	console.log(JSON.stringify(result));
} finally {
	await original.end();
	await restored.end();
	control(restoreDir, ["-m", "fast", "-w", "stop"]);
}
