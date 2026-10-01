import pg from "pg";
const db = new pg.Client({
	host: "127.0.0.1",
	port: 55432,
	user: "postgres",
	password: process.env.PGPASSWORD,
	database: "postgres",
});
await db.connect();
try {
	await db.query("CREATE DATABASE crm_m0");
} finally {
	await db.end();
}
