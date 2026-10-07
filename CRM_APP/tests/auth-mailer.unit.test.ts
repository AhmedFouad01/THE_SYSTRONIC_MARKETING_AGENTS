import { describe, expect, it } from "vitest";
import { authLink, createStubMailer } from "../src/auth/mailer.js";
describe("B5 Mailer stub", () => {
	it("uses configured host and fragment-only tokens for both message types", () => {
		for (const kind of ["invitation", "password-reset"] as const) {
			const link = new URL(
				authLink("https://crm.example.test", kind, "opaque-token-123"),
			);
			expect(link.origin).toBe("https://crm.example.test");
			expect(link.search).toBe("");
			expect(link.hash).toContain(
				kind === "invitation" ? "invitationId=" : "token=",
			);
		}
	});
	it.each([
		{ production: false, show: undefined, visible: false },
		{ production: false, show: "0", visible: false },
		{ production: false, show: "1", visible: true },
		{ production: true, show: "1", visible: false },
	])(
		"redacts recipients and only exposes links for explicit development opt-in: %j",
		async ({ production, show, visible }) => {
			const output: string[] = [],
				recipient = "Secret.Person@Example.test",
				link = "https://crm.example.test/app/reset#token=opaque-token";
			await createStubMailer({
				production,
				env: { CRM_MAIL_STUB_SHOW_LINK: show },
				log: (line) => output.push(line),
			}).send({ kind: "password-reset", recipient, link });
			const record = JSON.parse(output[0]);
			expect(record.recipient_hash).toMatch(/^[0-9a-f]{64}$/);
			expect(record.id).toMatch(/^[0-9a-f-]{36}$/);
			expect(output[0]).not.toContain(recipient);
			expect(record.link).toBe(visible ? link : undefined);
		},
	);
});
