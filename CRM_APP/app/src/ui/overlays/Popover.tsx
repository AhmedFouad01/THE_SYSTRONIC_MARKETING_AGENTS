import type { ReactNode } from "react";
import {
	DialogTrigger,
	Popover as AriaPopover,
	Dialog as AriaDialog,
} from "react-aria-components";
import type { IconName } from "../icons/index.ts";
import { Button } from "../primitives/Button.tsx";
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

export function Popover({
	triggerLabel,
	label,
	icon,
	children,
	testId,
}: PopoverProps) {
	return (
		<DialogTrigger>
			<Button
				size="sm"
				{...(icon ? { icon } : {})}
				aria-label={label}
				data-testid={testId}
			>
				{triggerLabel}
			</Button>
			<AriaPopover
				isNonModal
				placement="bottom end"
				offset={6}
				className="z-[1200] min-w-[190px] max-w-[calc(100vw_-_16px)] max-h-[var(--available-height)] overflow-auto p-6 border border-solid border-border rounded-10 bg-surface shadow-menu"
			>
				<AriaDialog aria-label={label} className="outline-none">
					{({ close }) =>
						typeof children === "function" ? children(close) : children
					}
				</AriaDialog>
			</AriaPopover>
		</DialogTrigger>
	);
}
