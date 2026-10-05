import type { ReactNode } from "react";

/**
 * Bidi isolate for user-entered text and mixed content (names, titles, formatted dates/counts) so it cannot
 * reorder surrounding RTL/LTR text. `<bdi>` resolves its own direction from the first strong character.
 */
export function Bdi({ children }: { children: ReactNode }) {
	return <bdi>{children}</bdi>;
}
