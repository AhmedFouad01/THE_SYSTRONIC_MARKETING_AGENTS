import { createServer, type IncomingMessage } from "node:http";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
	type Context,
	Fault,
	pool,
	assertIdentifierConfiguration,
} from "./db.js";
import { crmRequest, type Body } from "./crm.js";
import { isSchema, schemaRequest } from "./schema.js";
import { IMPORT_BODY_LIMIT, importRequest, isImport } from "./import.js";
import { PAYLOAD_LIMIT as SCHEMA_PAYLOAD_LIMIT } from "./schemarules.js";
import { transition, type Command } from "./transition.js";
import {
	collect,
	collectionOrigin,
	isJourney,
	journeyRequest,
} from "./journey.js";
import {
	APP_ASSET_PREFIX,
	contentType,
	isAppRoute,
	resolveAsset,
} from "./static.js";
// Built client (vite outDir dist/app): ../dist/app when run from src/ (tsx), ../app from dist/src/.
const clientRoots = ["../dist/app", "../app"].map((p) =>
	fileURLToPath(new URL(p, import.meta.url)),
);
async function readClient(rel: (root: string) => string | null) {
	for (const root of clientRoots) {
		const file = rel(root);
		if (!file) return null;
		try {
			return { file, data: await readFile(file) };
		} catch {
			// try next candidate root
		}
	}
	return null;
}
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
				["/", "/foundation", "/reporting"].includes(req.url ?? "")
			) {
				res.setHeader("Content-Type", "text/html; charset=utf-8");
				res.end(
					await readFile(
						new URL(
							req.url === "/reporting"
								? "../web/reporting.html"
								: req.url === "/foundation"
									? "../web/foundation.html"
									: "../web/index.html",
							import.meta.url,
						),
						"utf8",
					),
				);
				return;
			}
			const rawPath = (req.url ?? "/").split(/[?#]/, 1)[0];
			if (
				req.method === "GET" &&
				(rawPath.startsWith(APP_ASSET_PREFIX) || isAppRoute(rawPath))
			) {
				const asset = rawPath.startsWith(APP_ASSET_PREFIX);
				if (!asset && !(req.headers.accept ?? "").includes("text/html"))
					throw new Fault(404, "NOT_FOUND");
				const found = await readClient((root) =>
					asset
						? resolveAsset(resolve(root, "assets"), rawPath)
						: resolve(root, "index.html"),
				);
				if (!found) throw new Fault(404, "NOT_FOUND");
				res.setHeader("Content-Type", contentType(found.file));
				if (asset)
					res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
				res.end(found.data);
				return;
			}
			const url = new URL(req.url ?? "/", "http://localhost");
			if (
				url.pathname === "/v1/collect/events" &&
				["OPTIONS", "POST"].includes(req.method ?? "")
			) {
				if (!(await collectionOrigin(req.headers.origin)))
					throw new Fault(403, "INVALID_SITE");
				res.setHeader(
					"Access-Control-Allow-Origin",
					req.headers.origin as string,
				);
				res.setHeader("Vary", "Origin");
				if (req.method === "OPTIONS") {
					res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
					res.setHeader(
						"Access-Control-Allow-Headers",
						"Content-Type, X-Site-Key",
					);
					res.statusCode = 204;
					res.end();
					return;
				}
			}
			if (req.method === "POST" && url.pathname === "/v1/collect/events") {
				let raw = "";
				for await (const chunk of req) {
					raw += chunk;
					if (Buffer.byteLength(raw) > 8192)
						throw new Fault(413, "PAYLOAD_TOO_LARGE");
				}
				let body: Body;
				try {
					body = JSON.parse(raw);
				} catch {
					throw new Fault(422, "VALIDATION_FAILED");
				}
				if (!body || typeof body !== "object" || Array.isArray(body))
					throw new Fault(422, "VALIDATION_FAILED");
				const data = await collect(
					req.headers["x-site-key"],
					req.headers.origin,
					body,
				);
				res.statusCode = 202;
				res.setHeader("Content-Type", "application/json");
				res.end(JSON.stringify({ data, request_id: requestId }));
				return;
			}
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
					const limit = isSchema(url.pathname)
						? SCHEMA_PAYLOAD_LIMIT
						: isImport(url.pathname)
							? IMPORT_BODY_LIMIT
							: 16384;
					// Buffers are concatenated before decoding: a multi-byte character (Arabic file name) may span two chunks.
					const parts: Buffer[] = [];
					let size = 0;
					for await (const chunk of req) {
						size += chunk.length;
						if (size > limit) throw new Fault(413, "PAYLOAD_TOO_LARGE");
						parts.push(chunk);
					}
					const raw = Buffer.concat(parts).toString("utf8");
					try {
						body = JSON.parse(raw);
					} catch {
						throw new Fault(422, "VALIDATION_FAILED");
					}
					if (!body || typeof body !== "object" || Array.isArray(body))
						throw new Fault(422, "VALIDATION_FAILED");
				}
				const response = isImport(url.pathname)
					? await importRequest(
							ctx,
							req.method ?? "GET",
							url.pathname,
							url.searchParams,
							body,
							key,
							requestId,
						)
					: isSchema(url.pathname)
					? await schemaRequest(
							ctx,
							req.method ?? "GET",
							url.pathname,
							url.searchParams,
							body,
							key,
							requestId,
						)
					: isJourney(url.pathname)
					? await journeyRequest(
							ctx,
							req.method ?? "GET",
							url.pathname,
							url.searchParams,
							body,
							requestId,
						)
					: await crmRequest(
							ctx,
							req.method ?? "GET",
							url.pathname,
							url.searchParams,
							body,
							key,
							requestId,
						);
				result = response.data;
				res.statusCode =
					"status" in response ? Number(response.status ?? 200) : 200;
				if ("next_cursor" in response)
					extra = { next_cursor: response.next_cursor };
				// P1A S4 list envelope: `has_more` always, `total_count` only when `include_total=1` was sent.
				if ("has_more" in response) extra = { ...extra, has_more: response.has_more };
				if ("total_count" in response)
					extra = { ...extra, total_count: response.total_count };
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
					...(error.details ? { errors: error.details } : {}),
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
