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
 * (see .sy-bidi-text) so a column does not zig-zag; an overflowing line falls back to the start edge.
 */
export function BidiText({
	children,
	className,
	title,
}: {
	children: ReactNode;
	className?: string;
	title?: string;
}) {
	return (
		<span dir="auto" className={`sy-bidi-text${className ? ` ${className}` : ""}`} title={title}>
			{children}
		</span>
	);
}
