import { describe, expect, it, vi } from "vitest";
import { createApiClient, NotConnectedError } from "./client.ts";
import { ApiError, errorFromResponse, isForbidden, isVersionConflict } from "./errors.ts";

const CREDS = { token: "t-synthetic", tenantId: "tenant-1", grantId: "grant-1" };

function mockFetch(status: number, body: unknown) {
	return vi.fn(async (_url: string, _init?: RequestInit) => ({
		ok: status >= 200 && status < 300,
		status,
		json: async () => body,
	})) as unknown as typeof fetch & { mock: { calls: Array<[string, RequestInit]> } };
}

const hdr = (f: { mock: { calls: Array<[string, RequestInit]> } }, i: number) =>
	((f.mock.calls[i] as [string, RequestInit])[1].headers as Record<string, string>);

function client(f: typeof fetch, creds: typeof CREDS | null = CREDS, onUnauth?: () => void) {
	return createApiClient({
		getCredentials: () => creds,
		fetchImpl: f,
		newKey: () => "generated-key",
		...(onUnauth ? { onUnauthenticated: onUnauth } : {}),
	});
}

describe("api client headers", () => {
	it("GET sends Authorization, X-Tenant-ID, X-Grant-ID and no Idempotency-Key", async () => {
		const f = mockFetch(200, { data: [], next_cursor: null, request_id: "r1" });
		await client(f).get("contacts", { query: { cursor: "c-1", skip: undefined } });
		const [url, init] = f.mock.calls[0] as [string, RequestInit];
		expect(url).toBe("/v1/contacts?cursor=c-1");
		const h = init.headers as Record<string, string>;
		expect(h.Authorization).toBe("Bearer t-synthetic");
		expect(h["X-Tenant-ID"]).toBe("tenant-1");
		expect(h["X-Grant-ID"]).toBe("grant-1");
		expect(h["Idempotency-Key"]).toBeUndefined();
		expect(init.method).toBe("GET");
	});

	it("omits X-Grant-ID when no grant", async () => {
		const f = mockFetch(200, { data: {}, request_id: "r" });
		await client(f, { token: "t", tenantId: "x" } as typeof CREDS).get("session");
		const h = hdr(f, 0);
		expect("X-Grant-ID" in h).toBe(false);
	});

	it("POST and PATCH send Idempotency-Key (generated), JSON body and content-type", async () => {
		for (const method of ["post", "patch"] as const) {
			const f = mockFetch(200, { data: { id: "1" }, request_id: "r" });
			await client(f)[method]("leads", { a: 1 });
			const init = f.mock.calls[0]?.[1] as RequestInit;
			const h = init.headers as Record<string, string>;
			expect(h["Idempotency-Key"]).toBe("generated-key");
			expect(h["Content-Type"]).toBe("application/json");
			expect(init.body).toBe(JSON.stringify({ a: 1 }));
		}
	});

	it("reuses body.command_id, or an explicit key, for stable retries", async () => {
		const f = mockFetch(200, { data: {}, request_id: "r" });
		await client(f).post("deals", { command_id: "cmd-9" });
		expect(hdr(f, 0)["Idempotency-Key"]).toBe("cmd-9");
		await client(f).post("deals", { command_id: "cmd-9" }, { idempotencyKey: "explicit" });
		expect(hdr(f, 1)["Idempotency-Key"]).toBe("explicit");
	});

	it("throws NotConnectedError without credentials and does not call fetch", async () => {
		const f = mockFetch(200, {});
		await expect(client(f, null).get("session")).rejects.toBeInstanceOf(NotConnectedError);
		expect(f.mock.calls.length).toBe(0);
	});
});

describe("api client envelope and errors", () => {
	it("parses { data, next_cursor, request_id }", async () => {
		const f = mockFetch(200, { data: [{ id: 1 }], next_cursor: "n", request_id: "req-7" });
		const r = await client(f).get<Array<{ id: number }>>("leads");
		expect(r).toEqual({ data: [{ id: 1 }], nextCursor: "n", requestId: "req-7", hasMore: null, total: null });
	});

	it("maps the error envelope into ApiError", async () => {
		const f = mockFetch(500, { code: "INTERNAL", safe_message: "boom", request_id: "req-1", retryable: true });
		const e = await client(f)
			.get("leads")
			.catch((x: unknown) => x);
		expect(e).toBeInstanceOf(ApiError);
		const err = e as ApiError;
		expect(err).toMatchObject({
			status: 500,
			code: "INTERNAL",
			safeMessage: "boom",
			requestId: "req-1",
			retryable: true,
			kind: "http",
		});
	});

	it("distinguishes 403, 409 version conflict, other 409 and 401", () => {
		const e403 = errorFromResponse(403, { code: "FORBIDDEN", safe_message: "", request_id: "r", retryable: false });
		const e409v = errorFromResponse(409, { code: "VERSION_CONFLICT", safe_message: "", request_id: "r", retryable: false });
		const e409o = errorFromResponse(409, { code: "IDEMPOTENCY_CONFLICT", safe_message: "", request_id: "r", retryable: false });
		const e401 = errorFromResponse(401, { code: "UNAUTHENTICATED" });
		expect(e403.kind).toBe("forbidden");
		expect(isForbidden(e403)).toBe(true);
		expect(isVersionConflict(e403)).toBe(false);
		expect(e409v.kind).toBe("version_conflict");
		expect(isVersionConflict(e409v)).toBe(true);
		expect(e409o.kind).toBe("conflict");
		expect(isVersionConflict(e409o)).toBe(false);
		expect(e401.kind).toBe("unauthenticated");
	});

	it("tolerates a malformed error body", () => {
		const e = errorFromResponse(502, "<html>");
		expect(e).toMatchObject({ code: "HTTP_502", requestId: null, retryable: false, kind: "http" });
	});

	it("network failure and non-JSON body become kind=network", async () => {
		const boom = vi.fn(async () => {
			throw new TypeError("failed");
		}) as unknown as typeof fetch;
		const e1 = (await client(boom)
			.get("x")
			.catch((x: unknown) => x)) as ApiError;
		expect(e1.kind).toBe("network");
		const bad = vi.fn(async () => ({
			ok: true,
			status: 200,
			json: async () => {
				throw new SyntaxError("bad json");
			},
		})) as unknown as typeof fetch;
		const e2 = (await client(bad)
			.get("x")
			.catch((x: unknown) => x)) as ApiError;
		expect(e2.kind).toBe("network");
	});

	it("401 fires onUnauthenticated for stored credentials but not for explicit ones", async () => {
		const hook = vi.fn();
		const f = mockFetch(401, { code: "UNAUTHENTICATED", safe_message: "", request_id: "r", retryable: false });
		await client(f, CREDS, hook)
			.get("leads")
			.catch(() => undefined);
		expect(hook).toHaveBeenCalledTimes(1);
		await client(f, CREDS, hook)
			.get("session", { credentials: CREDS })
			.catch(() => undefined);
		expect(hook).toHaveBeenCalledTimes(1);
	});

	it("never puts the token on an error", async () => {
		const f = mockFetch(403, { code: "FORBIDDEN", safe_message: "no", request_id: "r", retryable: false });
		const e = (await client(f)
			.get("leads")
			.catch((x: unknown) => x)) as ApiError;
		expect(JSON.stringify({ ...e, message: e.message })).not.toContain("t-synthetic");
	});
});


describe("numeric pagination envelope", () => {
	it("retains explicit next_after without changing endpoints that omit it", async () => {
		for (const after of [null, 200]) { const result = await client(mockFetch(200, { data: [], next_after: after })).get("imports/id/rows"); expect(result.nextAfter).toBe(after); }
		expect(await client(mockFetch(200, { data: [] })).get("contacts")).not.toHaveProperty("nextAfter");
		expect((await client(mockFetch(200, { data: [], next_after: -1 })).get("imports/id/rows")).nextAfter).toBeUndefined();
	});
});
