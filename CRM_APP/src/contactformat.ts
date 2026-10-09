// biome-ignore lint/suspicious/noControlCharactersInRegex: reject controls and bidi overrides in channels/action URLs
const UNSAFE = /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u;
/** Shared server/client contact-field normalization. Empty input is handled by each form's optional-field rules. */
export const foldContactDigits = (raw: string): string =>
	raw.replace(/[٠-٩۰-۹]/g, (c) =>
		String(
			c.charCodeAt(0) >= 0x06f0
				? c.charCodeAt(0) - 0x06f0
				: c.charCodeAt(0) - 0x0660,
		),
	);
export function normalizeEmail(raw: string): string | null {
	const value = raw.normalize("NFC").trim().toLowerCase();
	return value.length <= 254 &&
		/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) &&
		!UNSAFE.test(value)
		? value
		: null;
}
export function normalizePhone(
	raw: string,
	country: string | null = "+20",
): string | null {
	let value = foldContactDigits(raw.trim()).replace(/[\s().-]/g, "");
	if (value.startsWith("00")) value = `+${value.slice(2)}`;
	if (!value.startsWith("+")) {
		const cc = country?.replace(/^\+/, "");
		if (cc && /^0[1-9]\d*$/.test(value)) value = `+${cc}${value.slice(1)}`;
		else if (cc && value.startsWith(cc)) value = `+${value}`;
		else if (cc && /^\d{7,14}$/.test(value)) value = `+${cc}${value}`;
		else return null;
	}
	return /^\+[1-9]\d{6,14}$/.test(value) ? value : null;
}
export function normalizeUrl(raw: string): string | null {
	if (
		raw.length > 2000 ||
		(/\s/u.test(raw.trim()) || UNSAFE.test(raw))
	)
		return null;
	try {
		const value = new URL(raw.trim());
		return ["http:", "https:"].includes(value.protocol) &&
			value.hostname &&
			!value.username &&
			!value.password
			? value.href
			: null;
	} catch {
		return null;
	}
}
