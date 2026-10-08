import { describe, expect, it, vi } from "vitest";
import { readAuthLink } from "./link.ts";

describe("fragment link capture", () => {
	const invitationId = "00000000-0000-4000-8000-000000000001";
	it.each([
		["/app/invite", `#invitationId=${invitationId}`, "invite", invitationId],
		[
			"/app/reset/",
			"#token=abcdefghijklmnopqrstuvwx",
			"reset",
			"abcdefghijklmnopqrstuvwx",
		],
	])(
		"clears fragment/query before returning a memory-only capability",
		(pathname, hash, kind, secret) => {
			const replaceState = vi.fn();
			const link = readAuthLink(
				{ pathname, hash, search: "?context=ignored" },
				{ replaceState },
			);
			expect(replaceState).toHaveBeenCalledExactlyOnceWith(null, "", pathname);
			expect(link).toEqual({ kind, secret });
		},
	);
	it.each([
		"",
		"#token=short",
		"#token=abcdefghijklmnopqrstuvwx&token=abcdefghijklmnopqrstuvwx",
		"#token=abcdefghijklmnopqrstuvwx&other=value",
		"#token=%3Cscript%3E",
	])("rejects missing/malformed/ambiguous secrets: %s", (hash) => {
		expect(
			readAuthLink(
				{
					pathname: "/app/reset",
					hash,
					search: "?token=abcdefghijklmnopqrstuvwx",
				},
				{ replaceState: vi.fn() },
			),
		).toEqual({ kind: "reset", secret: null });
	});
	it("leaves ordinary routes unchanged", () => {
		const replaceState = vi.fn();
		expect(
			readAuthLink(
				{ pathname: "/app/leads", hash: "#other", search: "" },
				{ replaceState },
			),
		).toBeNull();
		expect(replaceState).not.toHaveBeenCalled();
	});
});
