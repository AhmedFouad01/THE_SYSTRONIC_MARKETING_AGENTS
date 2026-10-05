import type { InputHTMLAttributes } from "react";
import { FieldShell } from "./Field.tsx";
import "./select.css";

export type DatePickerProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & {
	label: string;
	hint?: string;
	error?: string | undefined;
	/** date = day only; datetime = day + time (local). */
	mode?: "date" | "datetime";
};

/**
 * Shared date field. Wraps the browser's native date(-time) input (accessible, keyboard- and touch-friendly,
 * locale-aware picker) restyled to the Select box: 36px, token border/radius, always LTR digits. A custom
 * calendar grid is intentionally not built (large surface, no MVP need); swap the body here if one is added.
 */
export function DatePicker({ label, hint, error, mode = "datetime", className, required, ...rest }: DatePickerProps) {
	return (
		<FieldShell label={label} hint={hint ?? ""} error={error} required={required} className={className}>
			{(p) => (
				<input
					dir="ltr"
					{...rest}
					{...p}
					required={required}
					type={mode === "date" ? "date" : "datetime-local"}
					className="sy-field__control sy-date"
				/>
			)}
		</FieldShell>
	);
}
