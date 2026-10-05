import { type KeyboardEvent, useCallback, useEffect, useId, useRef, useState } from "react";
import { Icon, type IconName } from "../icons/index.ts";
import { IconButton } from "../primitives/Button.tsx";
import { rovingIndex, typeaheadIndex } from "./nav.ts";
import { useOutsideDismiss } from "./useDismiss.ts";
import "./overlays.css";

export type MenuItem = {
	id: string;
	label: string;
	onSelect: () => void;
	icon?: IconName;
	disabled?: boolean;
	testId?: string;
	/** Language of the label when it differs from the UI language (e.g. the language switcher). */
	lang?: string;
};

export type MenuButtonProps = {
	/** Accessible name of the trigger. */
	label: string;
	items: readonly MenuItem[];
	icon?: IconName;
	testId?: string;
};

/**
 * Menu button (COMPONENT_CONTRACTS Menu): focus enters the menu, Up/Down/Home/End (wrapping), typeahead,
 * Escape closes and returns focus to the trigger. The panel is anchored with logical properties, so it
 * opens toward the start edge in both LTR and RTL.
 */
export function MenuButton({ label, items, icon = "dots", testId }: MenuButtonProps) {
	const [open, setOpen] = useState(false);
	const [entry, setEntry] = useState<"first" | "last">("first");
	const id = useId();
	const rootRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
	const typed = useRef({ text: "", at: 0 });

	const enabled = useCallback(
		() => itemRefs.current.filter((el): el is HTMLButtonElement => el !== null && !el.disabled),
		[],
	);
	const close = useCallback((returnFocus: boolean) => {
		setOpen(false);
		if (returnFocus) triggerRef.current?.focus();
	}, []);
	const dismiss = useCallback(() => setOpen(false), []);
	useOutsideDismiss(open, rootRef, dismiss);

	useEffect(() => {
		if (!open) return;
		const list = enabled();
		(entry === "last" ? list[list.length - 1] : list[0])?.focus();
	}, [open, entry, enabled]);

	const onTriggerKey = (e: KeyboardEvent) => {
		if (e.key === "ArrowDown" || e.key === "ArrowUp") {
			e.preventDefault();
			setEntry(e.key === "ArrowUp" ? "last" : "first");
			setOpen(true);
		}
	};

	const onMenuKey = (e: KeyboardEvent) => {
		if (e.key === "Escape") {
			e.preventDefault();
			e.stopPropagation();
			close(true);
			return;
		}
		if (e.key === "Tab") {
			setOpen(false); // focus continues naturally from the trigger side
			return;
		}
		const list = enabled();
		const current = list.indexOf(document.activeElement as HTMLButtonElement);
		let next = rovingIndex(e.key, current, list.length);
		if (next === null && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
			const now = Date.now();
			typed.current = { text: now - typed.current.at < 700 ? typed.current.text + e.key : e.key, at: now };
			next = typeaheadIndex(
				typed.current.text,
				list.map((el) => el.textContent ?? ""),
				current,
			);
		}
		if (next === null) return;
		e.preventDefault();
		list[next]?.focus();
	};

	return (
		<div className="sy-menu-wrap" ref={rootRef}>
			<IconButton
				ref={triggerRef}
				icon={icon}
				aria-label={label}
				aria-haspopup="menu"
				aria-expanded={open}
				aria-controls={open ? `${id}-menu` : undefined}
				size="sm"
				data-testid={testId}
				onClick={() => {
					setEntry("first");
					setOpen((v) => !v);
				}}
				onKeyDown={onTriggerKey}
			/>
			{open ? (
				<div id={`${id}-menu`} role="menu" aria-label={label} className="sy-menu" tabIndex={-1} onKeyDown={onMenuKey}>
					{items.map((item, i) => (
						<button
							key={item.id}
							ref={(el) => {
								itemRefs.current[i] = el;
							}}
							type="button"
							role="menuitem"
							tabIndex={-1}
							disabled={item.disabled}
							lang={item.lang}
							data-testid={item.testId}
							className="sy-menu__item"
							onClick={() => {
								close(true); // focus first: a dialog opened by onSelect must capture the trigger as its opener
								item.onSelect();
							}}
						>
							{item.icon ? <Icon name={item.icon} size={16} /> : null}
							<span>{item.label}</span>
						</button>
					))}
				</div>
			) : null}
		</div>
	);
}
