// Pure keyboard/focus models shared by Menu, Dialog and the data-grid (unit-tested, no DOM).

/** Vertical roving focus. current -1 = nothing focused yet. Returns the index to focus or null (key not handled). */
export function rovingIndex(key: string, current: number, count: number, wrap = true): number | null {
	if (count <= 0) return null;
	const last = count - 1;
	if (key === "Home") return 0;
	if (key === "End") return last;
	if (key === "ArrowDown") {
		if (current < 0) return 0;
		return current >= last ? (wrap ? 0 : last) : current + 1;
	}
	if (key === "ArrowUp") {
		if (current < 0) return last;
		return current <= 0 ? (wrap ? last : 0) : current - 1;
	}
	return null;
}

/** Tab trap inside a modal. Returns the index to move focus to, or null to let the browser move focus normally. */
export function trapIndex(shift: boolean, active: number, count: number): number | null {
	if (count <= 0) return null;
	if (active < 0) return shift ? count - 1 : 0; // focus is outside the dialog: pull it in
	if (!shift && active === count - 1) return 0;
	if (shift && active === 0) return count - 1;
	return null;
}

/** Typeahead: next label starting with `buffer` after `current` (wrapping). A repeated single char cycles. */
export function typeaheadIndex(buffer: string, labels: readonly string[], current: number): number | null {
	const q = buffer.trim().toLowerCase();
	if (!q || labels.length === 0) return null;
	const start = q.length === 1 ? current + 1 : Math.max(current, 0);
	for (let n = 0; n < labels.length; n++) {
		const i = (start + n) % labels.length;
		if (labels[i]?.toLowerCase().startsWith(q)) return i;
	}
	return null;
}

export const FOCUSABLE =
	'a[href],button:not(:disabled),input:not(:disabled):not([type="hidden"]),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])';

export function focusablesIn(root: HTMLElement): HTMLElement[] {
	return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.getAttribute("aria-hidden") !== "true");
}

// Scroll lock is reference-counted so stacked dialogs restore the original value exactly once.
let locks = 0;
let saved = "";
export function lockScroll(): () => void {
	if (locks === 0) {
		saved = document.body.style.overflow;
		document.body.style.overflow = "hidden";
	}
	locks += 1;
	let released = false;
	return () => {
		if (released) return;
		released = true;
		locks -= 1;
		if (locks === 0) document.body.style.overflow = saved;
	};
}
