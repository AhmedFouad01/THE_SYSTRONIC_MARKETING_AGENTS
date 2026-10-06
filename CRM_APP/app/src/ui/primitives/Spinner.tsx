import "./spinner.css";

/** Decorative by default; pass `label` when the spinner is the only status cue. */
export function Spinner({
	size = 18,
	label,
}: {
	size?: number;
	label?: string;
}) {
	const style = { width: size, height: size };
	return label ? (
		<span
			className="sy-spinner"
			style={style}
			role="status"
			aria-label={label}
		/>
	) : (
		<span className="sy-spinner" style={style} aria-hidden="true" />
	);
}
