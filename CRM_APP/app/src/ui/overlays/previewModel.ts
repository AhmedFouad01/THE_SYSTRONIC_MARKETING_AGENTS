// Pure helpers of the preview slide-over (UI R4 C). No DOM access beyond what is passed in, no React.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Open record id from `?preview=<uuid>`; the legacy `?select=<uuid>` hand-offs are accepted as an alias. */
export function parsePreview(search: string): string | null {
	const q = new URLSearchParams(search);
	for (const key of ["preview", "select"]) {
		const v = q.get(key);
		if (v !== null && UUID.test(v)) return v;
	}
	return null;
}

/** `search` with the preview id written (or removed when null); the legacy `select` param is always dropped. */
export function withPreview(search: string, id: string | null): string {
	const q = new URLSearchParams(search);
	q.delete("select");
	if (id === null) q.delete("preview");
	else q.set("preview", id);
	const s = q.toString();
	return s === "" ? "" : `?${s}`;
}

export type PreviewStep = {
	/** 0-based index of the open record among the loaded rows, -1 when it is not among them. */
	index: number;
	total: number;
	prevId: string | null;
	nextId: string | null;
	/** The open record is the last loaded one but the server has more: Next must load a page first. */
	needsMore: boolean;
};

/** Prev/Next over the loaded rows in grid order (no wrap). */
export function previewStep(ids: readonly string[], currentId: string | null, hasMore: boolean): PreviewStep {
	const index = currentId === null ? -1 : ids.indexOf(currentId);
	if (index < 0) return { index: -1, total: ids.length, prevId: null, nextId: null, needsMore: false };
	const last = index === ids.length - 1;
	return {
		index,
		total: ids.length,
		prevId: index > 0 ? (ids[index - 1] ?? null) : null,
		nextId: last ? null : (ids[index + 1] ?? null),
		needsMore: last && hasMore,
	};
}

type Closest = { closest: (selector: string) => unknown };

/**
 * Pointer targets that must NOT dismiss the non-modal panel: anything inside a dialog/scrim (nested dialogs keep their
 * own dismissal), a Select/menu/popover list, and grid rows (a row click swaps the record instead of closing).
 */
export const OUTSIDE_IGNORE_SELECTOR =
	'.sy-scrim,[role="dialog"],[role="listbox"],[role="menu"],.sy-popover,.sy-menu,tr[data-row-id]';

export function isOutsideDismissIgnored(target: Closest | null): boolean {
	return target !== null && target.closest(OUTSIDE_IGNORE_SELECTOR) !== null;
}

type Typing = { tagName?: string; isContentEditable?: boolean };

/** Single-key shortcuts (J/K) must never fire while the user types. */
export function isTypingTarget(el: Typing | null): boolean {
	if (el === null) return false;
	if (el.isContentEditable) return true;
	const tag = (el.tagName ?? "").toUpperCase();
	return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export type StepDirection = "prev" | "next";

/** J/K (physical keys, so the Arabic layout works) or Alt+ArrowUp/ArrowDown. Null = not a navigation key. */
export function stepDirectionOfKey(e: { code: string; key: string; altKey: boolean; ctrlKey: boolean; metaKey: boolean }): StepDirection | null {
	if (e.ctrlKey || e.metaKey) return null;
	if (e.altKey) return e.key === "ArrowUp" ? "prev" : e.key === "ArrowDown" ? "next" : null;
	return e.code === "KeyK" ? "prev" : e.code === "KeyJ" ? "next" : null;
}
