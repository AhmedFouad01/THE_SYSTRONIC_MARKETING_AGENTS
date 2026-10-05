import type { ReactNode } from "react";
import { useI18n } from "./I18nProvider.tsx";

/**
 * A finished money string (Intl currency style) as ONE isolate in the locale's own direction (UX-R2-05).
 * Forcing LTR on an Arabic currency string ("٢٩٦٬٩٠٠ ج.م.") detaches the trailing period of the symbol and shows it
 * first; the isolate must keep the string's native direction. Latin locales stay LTR.
 */
export function Money({ children }: { children: ReactNode }) {
	const { dir } = useI18n();
	return (
		<bdi dir={dir} className="sy-money">
			{children}
		</bdi>
	);
}
