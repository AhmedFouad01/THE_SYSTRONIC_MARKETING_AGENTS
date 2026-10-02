import { createServer, type IncomingMessage } from "node:http";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import {
	type Context,
	Fault,
	pool,
	assertIdentifierConfiguration,
} from "./db.js";
import { crmRequest, type Body } from "./crm.js";
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
			if (
				req.method === "GET" &&
				["/", "/foundation"].includes(req.url ?? "")
			) {
				res.setHeader("Content-Type", "text/html; charset=utf-8");
				res.end(
					await readFile(
						new URL(
							req.url === "/foundation"
								? "../web/foundation.html"
								: "../web/index.html",
							import.meta.url,
						),
						"utf8",
					),
				);
				return;
			}
			const url = new URL(req.url ?? "/", "http://localhost");
			const ctx = context(req);
			const match = /^\/v1\/deals\/([0-9a-f-]+)\/transitions$/i.exec(
				url.pathname,
			);
			let result: unknown;
			let extra = {};
			if (req.method === "POST" && match && uuid.test(match[1])) {
				const key = req.headers["idempotency-key"];
				if (typeof key !== "string" || !key.length || key.length > 128)
					throw new Fault(422, "VALIDATION_FAILED");
				result = await transition(
					ctx,
					match[1],
					await command(req),
					key,
					requestId,
				);
			} else {
				let body: Body = {};
				let key = "";
				if (req.method !== "GET") {
					const header = req.headers["idempotency-key"];
					if (
						typeof header !== "string" ||
						!header.length ||
						header.length > 128
					)
						throw new Fault(422, "VALIDATION_FAILED");
					key = header;
					let raw = "";
					for await (const chunk of req) {
						raw += chunk;
						if (Buffer.byteLength(raw) > 16384)
							throw new Fault(413, "PAYLOAD_TOO_LARGE");
					}
					try {
						body = JSON.parse(raw);
					} catch {
						throw new Fault(422, "VALIDATION_FAILED");
					}
					if (!body || typeof body !== "object" || Array.isArray(body))
						throw new Fault(422, "VALIDATION_FAILED");
				}
				const response = await crmRequest(
					ctx,
					req.method ?? "GET",
					url.pathname,
					url.searchParams,
					body,
					key,
					requestId,
				);
				result = response.data;
				res.statusCode = response.status ?? 200;
				if ("next_cursor" in response)
					extra = { next_cursor: response.next_cursor };
			}
			res.setHeader("Content-Type", "application/json");
			res.end(
				JSON.stringify({ data: result, ...extra, request_id: requestId }),
			);
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
	try {
		await assertIdentifierConfiguration();
	} catch {
		console.error("PROTECTED_KEY_UNAVAILABLE");
		await pool.end();
		process.exit(1);
	}
	const app = server().listen(Number(process.env.PORT ?? 4317), "127.0.0.1");
	process.on("SIGTERM", () =>
		app.close(() => {
			void pool.end();
		}),
	);
}
