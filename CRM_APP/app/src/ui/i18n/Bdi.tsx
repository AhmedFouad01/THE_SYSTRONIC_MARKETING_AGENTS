import type { ReactNode } from "react";

/**
 * Bidi isolate for user-entered text and mixed content (names, titles, formatted dates/counts) so it cannot
 * reorder surrounding RTL/LTR text. `<bdi>` resolves its own direction from the first strong character.
 */
export function Bdi({ children }: { children: ReactNode }) {
	return <bdi>{children}</bdi>;
}

/**
 * Single-line truncating text for user-entered / mixed Arabic-Latin strings (UX-R2-02). `dir="auto"` gives the
 * element the direction of its own first strong character, so the clip + ellipsis fall on the END of the logical
 * string (a Latin title in the Arabic UI loses its tail, not its head). Alignment still follows the UI direction
 * (the outer `.sy-bidi-wrap` keeps the UI direction with `text-align: start`; the value is a shrink-wrapped inline-block
 * inside it) so a column does not zig-zag, whatever the value's own direction; an overflowing line is clipped with an ellipsis
 * at the end of the value's own direction. `wrap` lets a title use several lines instead of truncating. Pass the user value ALONE (a string):
 * never concatenate it with UI text; put the UI text in a sibling element or use an ICU placeholder.
 */
export function BidiText({
	children,
	className,
	title,
	wrap,
}: {
	children: ReactNode;
	className?: string;
	title?: string;
	wrap?: boolean;
}) {
	return (
		<span className="sy-bidi-wrap">
			<span
				dir="auto"
				className={`sy-bidi-text${wrap ? " sy-bidi-text--wrap" : ""}${className ? ` ${className}` : ""}`}
				title={title}
			>
				{children}
			</span>
		</span>
	);
}
