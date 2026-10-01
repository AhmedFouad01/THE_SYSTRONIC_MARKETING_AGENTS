import { createServer, type IncomingMessage } from "node:http";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { authorize, type Context, Fault, pool, transaction } from "./db.js";
import { transition, type Command } from "./transition.js";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function context(req: IncomingMessage): Context {
	const tenant = req.headers["x-tenant-id"],
		grant = req.headers["x-grant-id"];
	if (
		typeof tenant !== "string" ||
		!uuid.test(tenant) ||
		(grant !== undefined && (typeof grant !== "string" || !uuid.test(grant)))
	)
		throw new Fault(422, "VALIDATION_FAILED");
	return {
		tenant,
		token: req.headers.authorization?.replace(/^Bearer /, "") ?? "",
		grant,
	};
}
async function command(req: IncomingMessage): Promise<Command> {
	let body = "";
	for await (const chunk of req) {
		body += chunk;
		if (Buffer.byteLength(body) > 4096)
			throw new Fault(413, "PAYLOAD_TOO_LARGE");
	}
	let c: Command;
	try {
		c = JSON.parse(body);
	} catch {
		throw new Fault(422, "VALIDATION_FAILED");
	}
	if (
		!c ||
		typeof c !== "object" ||
		Object.keys(c).some(
			(k) =>
				!["to_stage_id", "expected_version", "command_id", "reason"].includes(
					k,
				),
		) ||
		!uuid.test(c.to_stage_id) ||
		!uuid.test(c.command_id) ||
		!Number.isInteger(c.expected_version) ||
		c.expected_version < 0 ||
		typeof c.reason !== "string" ||
		c.reason.length > 500
	)
		throw new Fault(422, "VALIDATION_FAILED");
	return c;
}
export function server() {
	return createServer(async (req, res) => {
		const requestId = randomUUID();
		res.setHeader("X-Request-ID", requestId);
		res.setHeader("Cache-Control", "no-store");
		res.setHeader("X-Content-Type-Options", "nosniff");
		try {
			if (req.method === "GET" && req.url === "/") {
				res.setHeader("Content-Type", "text/html; charset=utf-8");
				res.end(
					await readFile(new URL("../web/index.html", import.meta.url), "utf8"),
				);
				return;
			}
			const match = /^\/v1\/deals\/([0-9a-f-]+)(\/transitions)?$/i.exec(
				req.url ?? "",
			);
			if (!match || !uuid.test(match[1])) throw new Fault(404, "NOT_FOUND");
			const ctx = context(req);
			let result: unknown;
			if (req.method === "POST" && match[2]) {
				const key = req.headers["idempotency-key"];
				if (typeof key !== "string" || key.length < 1 || key.length > 128)
					throw new Fault(422, "VALIDATION_FAILED");
				result = await transition(
					ctx,
					match[1],
					await command(req),
					key,
					requestId,
				);
			} else if (req.method === "GET" && !match[2])
				result = await transaction(ctx, async (db) => {
					await authorize(db, "crm.read", match[1], ctx.grant);
					const {
						rows: [deal],
					} = await db.query(
						"SELECT id,stage_id,version FROM crm.deal WHERE tenant_id=$1 AND id=$2",
						[ctx.tenant, match[1]],
					);
					if (!deal) throw new Fault(404, "NOT_FOUND");
					return deal;
				});
			else throw new Fault(404, "NOT_FOUND");
			res.setHeader("Content-Type", "application/json");
			res.end(JSON.stringify({ data: result, request_id: requestId }));
		} catch (e) {
			const error = e instanceof Fault ? e : new Fault(500, "INTERNAL_ERROR");
			res.statusCode = error.status;
			res.setHeader("Content-Type", "application/json");
			res.end(
				JSON.stringify({
					code: error.code,
					safe_message: error.code,
					request_id: requestId,
					retryable: error.status >= 500,
				}),
			);
		}
	});
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
	const app = server().listen(Number(process.env.PORT ?? 4317), "127.0.0.1");
	process.on("SIGTERM", () =>
		app.close(() => {
			void pool.end();
		}),
	);
}
