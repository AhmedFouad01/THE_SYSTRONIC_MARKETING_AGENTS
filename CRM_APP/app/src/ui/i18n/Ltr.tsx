import type { ReactNode } from "react";

// Unicode isolates for plain-text contexts (title/aria-label/clipboard) where markup is not available.
export const LRI = "⁦";
export const PDI = "⁩";

export function ltrIsolate(text: string): string {
	return `${LRI}${text}${PDI}`;
}

/**
 * Keeps bidi-sensitive values (IDs, emails, phones, money, percentages) stable inside RTL text
 * (RTL_RESPONSIVE: "wrapped in LTR/isolate semantics"). Renders <bdi dir="ltr">.
 */
export function Ltr({ children }: { children: ReactNode }) {
	return (
		<bdi dir="ltr" className="sy-ltr">
			{children}
		</bdi>
	);
}
