import { createHash, randomUUID } from "node:crypto";
export type MailMessage = {
	kind: "invitation" | "password-reset";
	recipient: string;
	link: string;
};
export interface Mailer {
	send(message: MailMessage): Promise<void>;
}
export function authLink(
	origin: string,
	kind: MailMessage["kind"],
	value: string,
): string {
	const url = new URL(
		kind === "invitation" ? "/app/invite" : "/app/reset",
		origin,
	);
	url.hash = new URLSearchParams(
		kind === "invitation" ? { invitationId: value } : { token: value },
	).toString();
	return url.toString();
}
/** Stub has no transport. Only an explicit development opt-in may print a link. */
export function createStubMailer(options: {
	production: boolean;
	env?: NodeJS.ProcessEnv;
	log?: (line: string) => void;
}): Mailer {
	const env = options.env ?? process.env;
	const log = options.log ?? ((line) => console.info(line));
	return {
		async send(message) {
			const record: Record<string, string> = {
				event: "mail_stub",
				id: randomUUID(),
				kind: message.kind,
				recipient_hash: createHash("sha256")
					.update(message.recipient.trim().toLowerCase())
					.digest("hex"),
			};
			if (!options.production && env.CRM_MAIL_STUB_SHOW_LINK === "1")
				record.link = message.link;
			log(JSON.stringify(record));
		},
	};
}
