import { useState } from "react";
import {
	normalizeEmail,
	normalizePhone,
} from "../../../../src/contactformat.ts";
import { Bdi, Input, useI18n, type MessageKey } from "../../ui/index.ts";
export type ContactFields = {
	email?: string | null;
	phone?: string | null;
	company?: string | null;
	job_title?: string | null;
	sensitive_masked?: boolean;
};
const LABELS: Record<string, MessageKey> = {
	email: "common.email",
	phone: "common.phone",
	company: "props.system.company",
	job_title: "props.system.job_title",
};
export function ContactChannels({ record }: { record: ContactFields }) {
	const { t } = useI18n();
	if (record.sensitive_masked !== false) return null;
	const email = record.email ? normalizeEmail(record.email) : null;
	const phone = record.phone ? normalizePhone(record.phone) : null;
	return (
		<span
			className="flex flex-wrap gap-8"
			data-testid="contact-channel-actions"
		>
			{email ? <a href={`mailto:${encodeURIComponent(email)}`}>{t("common.email")}</a> : null}
			{phone ? (
				<>
					<a href={`tel:${phone}`}>{t("common.phone")}</a>
					<a
						href={`https://wa.me/${phone.slice(1)}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						{t("contacts.whatsapp")}
					</a>
				</>
			) : null}
		</span>
	);
}
export function protectedFacts(
	record: ContactFields,
	business: boolean,
	t: (key: MessageKey) => string,
) {
	return (
		business ? ["email", "phone", "company", "job_title"] : ["email", "phone"]
	).map((field) => ({
		label: t(LABELS[field] as MessageKey),
		value: (
			<Bdi>
				{record.sensitive_masked !== false
					? t("contacts.fields.masked")
					: record[field as keyof ContactFields] || "—"}
			</Bdi>
		),
	}));
}
export function useContactFieldDraft(
	record: ContactFields & { version: number },
	business: boolean,
) {
	const keys = business
		? ["email", "phone", "company", "job_title"]
		: ["email", "phone"];
	const [draft, setDraft] = useState<Record<string, string>>(() =>
		Object.fromEntries(
			keys.map((k) => [k, String(record[k as keyof ContactFields] ?? "")]),
		),
	);
	const fields = keys.filter(
		(k) => draft[k] !== String(record[k as keyof ContactFields] ?? ""),
	);
	const errors = fields.filter((k) =>
		!draft[k]?.trim() ? false :
		k === "email"
			? !normalizeEmail(draft[k] ?? "")
			: k === "phone"
				? !normalizePhone(draft[k] ?? "")
				: (draft[k]?.length ?? 0) > 300,
	);
	return {
		draft,
		set: (key: string, value: string) =>
			setDraft((d) => ({ ...d, [key]: value })),
		keys,
		errors,
		dirty: fields.length > 0,
		patch: (base: Record<string, unknown> | null, command: string) =>
			fields.length
				? {
						...base,
						command_id: command,
						expected_version: record.version,
						...Object.fromEntries(
							fields.map((k) => [
								k,
								k === "email"
									? normalizeEmail(draft[k] ?? "")
									: k === "phone"
										? normalizePhone(draft[k] ?? "")
										: draft[k],
							]),
						),
					}
				: base,
	};
}
export function ContactFieldsEdit({
	fields,
	masked,
	disabled = masked,
}: {
	fields: ReturnType<typeof useContactFieldDraft>;
	masked: boolean;
	disabled?: boolean;
}) {
	const { t } = useI18n();
	return (
		<div className="flex flex-col gap-10">
			{fields.keys.map((k) => (
				<Input
					key={k}
					name={k}
					label={t(LABELS[k] as MessageKey)}
					type="text" inputMode={k === "phone" ? "tel" : k === "email" ? "email" : "text"}
					dir="auto"
					value={masked ? "" : (fields.draft[k] ?? "")}
					disabled={disabled || masked}
					placeholder={masked ? t("contacts.fields.masked") : undefined}
					error={
						fields.errors.includes(k) ? t("cf.err.INVALID_VALUE") : undefined
					}
					maxLength={k === "email" ? 254 : 300}
					onChange={(e) => fields.set(k, e.target.value)}
				/>
			))}
		</div>
	);
}
