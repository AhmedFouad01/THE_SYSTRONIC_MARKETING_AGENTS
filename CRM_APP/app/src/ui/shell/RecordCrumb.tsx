import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/** The open record shown as the last breadcrumb (`CRM > Leads > <name>`); `back` returns to the list. */
export type RecordCrumb = { name: string; back: () => void };

export const RecordCrumbContext = createContext<((crumb: RecordCrumb | null) => void) | null>(null);

/**
 * Registers the open record in the shell breadcrumb while it is mounted/non-empty. The list crumb then becomes a link
 * that calls `back` (closes the record; the list keeps its filters because the view stays mounted).
 */
export function useRecordCrumb(name: string | null | undefined, back: () => void): void {
	const set = useContext(RecordCrumbContext);
	const backRef = useRef(back);
	backRef.current = back;
	useEffect(() => {
		if (!set || !name) return;
		set({ name, back: () => backRef.current() });
		return () => set(null);
	}, [set, name]);
}

/**
 * For master-detail lists that auto-open the first row on wide screens: the list crumb must really close the record,
 * so after `back()` auto-open is suppressed until the user picks a row again.
 */
export function useCrumbReturn(setActiveId: (id: string | null) => void): {
	back: () => void;
	suppressAutoOpen: boolean;
	onActiveChange: (id: string | null) => void;
} {
	const [suppressAutoOpen, setSuppress] = useState(false);
	const back = useCallback(() => {
		setSuppress(true);
		setActiveId(null);
	}, [setActiveId]);
	const onActiveChange = useCallback(
		(id: string | null) => {
			if (id !== null) setSuppress(false);
			setActiveId(id);
		},
		[setActiveId],
	);
	return { back, suppressAutoOpen, onActiveChange };
}
