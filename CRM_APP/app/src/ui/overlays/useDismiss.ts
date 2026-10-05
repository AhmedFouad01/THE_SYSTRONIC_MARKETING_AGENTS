import { type RefObject, useEffect } from "react";

/** Close on pointer-down outside `rootRef`. Focus is not moved (the user clicked elsewhere on purpose). */
export function useOutsideDismiss(open: boolean, rootRef: RefObject<HTMLElement | null>, onClose: () => void): void {
	useEffect(() => {
		if (!open) return;
		const handler = (e: PointerEvent) => {
			if (rootRef.current && e.target instanceof Node && !rootRef.current.contains(e.target)) onClose();
		};
		document.addEventListener("pointerdown", handler, true);
		return () => document.removeEventListener("pointerdown", handler, true);
	}, [open, rootRef, onClose]);
}
