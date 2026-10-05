import { type FocusEvent, type KeyboardEvent, type ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";
import type { IconName } from "../icons/index.ts";
import { Button } from "../primitives/Button.tsx";
import { focusablesIn } from "./nav.ts";
import { useOutsideDismiss } from "./useDismiss.ts";
import "./overlays.css";

export type PopoverProps = {
	/** Visible trigger text. */
	triggerLabel: ReactNode;
	/** Accessible name of the trigger and of the panel. */
	label: string;
	icon?: IconName;
	/** Panel content; a function receives `close` so a form can dismiss the panel after success. */
	children: ReactNode | ((close: () => void) => ReactNode);
	testId?: string;
};

/** Non-modal popover panel (e.g. column chooser): focus enters it, Escape/outside/focus-leave closes, focus returns to the trigger on Escape. */
export function Popover({ triggerLabel, label, icon, children, testId }: PopoverProps) {
	const [open, setOpen] = useState(false);
	const id = useId();
	const rootRef = useRef<HTMLDivElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const dismiss = useCallback(() => setOpen(false), []);
	useOutsideDismiss(open, rootRef, dismiss);

	useEffect(() => {
		if (open && panelRef.current) (focusablesIn(panelRef.current)[0] ?? panelRef.current).focus();
	}, [open]);

	const onKeyDown = (e: KeyboardEvent) => {
		if (e.key !== "Escape") return;
		e.preventDefault();
		e.stopPropagation();
		setOpen(false);
		triggerRef.current?.focus();
	};
	const onBlur = (e: FocusEvent) => {
		const next = e.relatedTarget;
		if (next instanceof Node && rootRef.current && !rootRef.current.contains(next)) setOpen(false);
	};

	return (
		<div className="sy-menu-wrap" ref={rootRef}>
			<Button
				ref={triggerRef}
				size="sm"
				{...(icon ? { icon } : {})}
				aria-label={label}
				aria-haspopup="dialog"
				aria-expanded={open}
				aria-controls={open ? `${id}-panel` : undefined}
				data-testid={testId}
				onClick={() => setOpen((v) => !v)}
			>
				{triggerLabel}
			</Button>
			{open ? (
				<div
					id={`${id}-panel`}
					ref={panelRef}
					role="dialog"
					aria-label={label}
					tabIndex={-1}
					className="sy-popover"
					onKeyDown={onKeyDown}
					onBlur={onBlur}
				>
					{typeof children === "function" ? children(dismiss) : children}
				</div>
			) : null}
		</div>
	);
}
