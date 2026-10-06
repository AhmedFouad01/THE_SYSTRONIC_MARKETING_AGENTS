import {
	Children,
	type ReactElement,
	type ReactNode,
	isValidElement,
	useCallback,
	useEffect,
	useId,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	type CSSProperties,
	type KeyboardEvent,
} from "react";
import { Icon } from "../icons/index.ts";
import { rovingIndex, typeaheadIndex } from "../overlays/nav.ts";
import { useOutsideDismiss } from "../overlays/useDismiss.ts";
import { FieldShell } from "./Field.tsx";
import "./select.css";

export type SelectOption = { value: string; label: string; disabled: boolean };

export type SelectProps = {
	label: string;
	hint?: string;
	error?: string | undefined;
	required?: boolean;
	disabled?: boolean;
	className?: string;
	name?: string;
	value: string;
	/** Same shape the native select used (`e.target.value`), so call sites stay unchanged. */
	onChange?: (e: {
		target: { value: string; name: string | undefined };
	}) => void;
	/** md = 36px (forms), sm = 32px (toolbars, pager). */
	size?: "sm" | "md";
	"data-testid"?: string;
	/** `<option value>` children (fragments/arrays/null allowed). */
	children?: ReactNode;
};

function textOf(node: ReactNode): string {
	if (node === null || node === undefined || typeof node === "boolean")
		return "";
	if (typeof node === "string" || typeof node === "number") return String(node);
	if (Array.isArray(node)) return node.map(textOf).join("");
	if (isValidElement(node))
		return textOf((node.props as { children?: ReactNode }).children);
	return "";
}

/** Flatten `<option>` children (through fragments/arrays) into plain option records. */
export function parseOptions(children: ReactNode): SelectOption[] {
	const out: SelectOption[] = [];
	const visit = (nodes: ReactNode) => {
		for (const child of Children.toArray(nodes)) {
			if (!isValidElement(child)) continue;
			const el = child as ReactElement<{
				value?: string | number;
				children?: ReactNode;
				disabled?: boolean;
			}>;
			if (el.type === "option") {
				const label = textOf(el.props.children);
				out.push({
					value: el.props.value === undefined ? label : String(el.props.value),
					label,
					disabled: el.props.disabled === true,
				});
			} else if (el.props.children !== undefined) {
				visit(el.props.children);
			}
		}
	};
	visit(children);
	return out;
}

type Placement = {
	/** Distance from the viewport edge on the trigger's inline-start side (left in LTR, right in RTL). */
	start: number;
	/** Trigger width: a minimum for the list (never the width), see select.css. */
	triggerW: number;
	rtl: boolean;
	top?: number;
	bottom?: number;
	maxHeight: number;
};

const GAP = 4;
const EDGE = 8;

function place(trigger: HTMLElement): Placement {
	const r = trigger.getBoundingClientRect();
	const below = window.innerHeight - r.bottom - EDGE;
	const above = r.top - EDGE;
	const flip = below < 200 && above > below;
	const maxHeight = Math.max(120, Math.min(280, (flip ? above : below) - GAP));
	const rtl = getComputedStyle(trigger).direction === "rtl";
	return {
		start: rtl ? document.documentElement.clientWidth - r.right : r.left,
		triggerW: r.width,
		rtl,
		maxHeight,
		...(flip
			? { bottom: window.innerHeight - r.top + GAP }
			: { top: r.bottom + GAP }),
	};
}

/**
 * Listbox select (replaces the OS select): button[role=combobox] + role=listbox popover. DOM focus stays on the
 * trigger (aria-activedescendant). Keys: Arrow/Home/End move, Enter/Space choose, Escape closes (and does not
 * reach an enclosing Dialog), Tab closes, printable keys typeahead. The chevron sits at the inline-end.
 */
export function Select({
	label,
	hint,
	error,
	required,
	disabled,
	className,
	name,
	value,
	onChange,
	size = "md",
	children,
	"data-testid": testId,
}: SelectProps) {
	const listId = useId();
	const rootRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const typed = useRef<{
		buf: string;
		timer: ReturnType<typeof setTimeout> | null;
	}>({ buf: "", timer: null });
	const options = useMemo(() => parseOptions(children), [children]);
	const selectedIndex = options.findIndex((o) => o.value === value);
	const [open, setOpen] = useState(false);
	const [active, setActive] = useState(-1);
	const [pos, setPos] = useState<Placement | null>(null);

	const close = useCallback(() => setOpen(false), []);
	useOutsideDismiss(open, rootRef, close);

	const openAt = (index: number) => {
		if (disabled || !triggerRef.current) return;
		setPos(place(triggerRef.current));
		setActive(index >= 0 ? index : Math.max(selectedIndex, 0));
		setOpen(true);
	};

	// Close when the page scrolls/resizes under the fixed popover.
	useEffect(() => {
		if (!open) return;
		const onScroll = (e: Event) => {
			if (e.target instanceof Node && listRef.current?.contains(e.target))
				return;
			setOpen(false);
		};
		window.addEventListener("scroll", onScroll, true);
		window.addEventListener("resize", close);
		return () => {
			window.removeEventListener("scroll", onScroll, true);
			window.removeEventListener("resize", close);
		};
	}, [open, close]);

	// F1: the list is content-sized (min = trigger / 160px), anchored at the trigger's inline-start; clamp into the viewport.
	useLayoutEffect(() => {
		const el = listRef.current;
		if (!open || !pos || !el) return;
		const vw = document.documentElement.clientWidth;
		const r = el.getBoundingClientRect();
		let shift = 0;
		if (r.right > vw - EDGE) shift = vw - EDGE - r.right;
		if (r.left + shift < EDGE) shift = EDGE - r.left;
		if (shift !== 0) el.style.insetInlineStart = `${pos.start + (pos.rtl ? -shift : shift)}px`;
	}, [open, pos]);

	useEffect(() => {
		if (!open || active < 0) return;
		listRef.current?.children[active]?.scrollIntoView?.({ block: "nearest" });
	}, [open, active]);

	useEffect(
		() => () => {
			if (typed.current.timer) clearTimeout(typed.current.timer);
		},
		[],
	);

	const choose = (index: number) => {
		const opt = options[index];
		if (!opt || opt.disabled) return;
		setOpen(false);
		triggerRef.current?.focus();
		if (opt.value !== value) onChange?.({ target: { value: opt.value, name } });
	};

	const typeahead = (key: string): number | null => {
		const t = typed.current;
		if (t.timer) clearTimeout(t.timer);
		t.buf =
			t.buf !== "" && [...t.buf].every((c) => c === key) ? key : t.buf + key;
		t.timer = setTimeout(() => {
			t.buf = "";
		}, 700);
		return typeaheadIndex(
			t.buf,
			options.map((o) => o.label),
			open ? active : selectedIndex,
		);
	};

	const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
		if (disabled || e.ctrlKey || e.metaKey || e.altKey) return;
		const key = e.key;
		if (!open) {
			if (
				key === "ArrowDown" ||
				key === "ArrowUp" ||
				key === "Enter" ||
				key === " " ||
				key === "Home" ||
				key === "End"
			) {
				e.preventDefault();
				openAt(
					key === "Home"
						? 0
						: key === "End"
							? options.length - 1
							: selectedIndex,
				);
				return;
			}
			if (key.length === 1) {
				const hit = typeahead(key);
				if (hit !== null) {
					e.preventDefault();
					openAt(hit);
				}
			}
			return;
		}
		if (key === "Escape") {
			e.preventDefault();
			e.stopPropagation();
			setOpen(false);
			return;
		}
		if (key === "Tab") {
			setOpen(false);
			return;
		}
		if (key === "Enter" || key === " ") {
			e.preventDefault();
			if (active >= 0) choose(active);
			return;
		}
		const next = rovingIndex(key, active, options.length, false);
		if (next !== null) {
			e.preventDefault();
			setActive(next);
			return;
		}
		if (key.length === 1) {
			const hit = typeahead(key);
			if (hit !== null) {
				e.preventDefault();
				setActive(hit);
			}
		}
	};

	const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

	return (
		<FieldShell
			label={label}
			hint={hint ?? ""}
			error={error}
			required={required}
			className={className}
		>
			{(p) => (
				<div className="sy-select" ref={rootRef} data-size={size}>
					<button
						{...p}
						ref={triggerRef}
						type="button"
						role="combobox"
						aria-haspopup="listbox"
						aria-expanded={open}
						aria-controls={open ? listId : undefined}
						aria-activedescendant={
							open && active >= 0 ? `${listId}-o${active}` : undefined
						}
						aria-required={required || undefined}
						disabled={disabled}
						className="sy-select__trigger"
						data-testid={testId}
						data-name={name}
						data-value={value}
						onClick={() => (open ? setOpen(false) : openAt(-1))}
						onKeyDown={onKeyDown}
					>
						<span className="sy-select__value">
							{selected ? selected.label : " "}
						</span>
						<Icon name="chevronDown" size={16} className="sy-select__chevron" />
					</button>
					{open && pos ? (
						<div
							id={listId}
							ref={listRef}
							role="listbox"
							aria-label={label}
							className="sy-select__list"
							style={
								{
									insetInlineStart: pos.start,
									"--sy-trigger-w": `${pos.triggerW}px`,
									top: pos.top,
									bottom: pos.bottom,
									maxHeight: pos.maxHeight,
								} as CSSProperties
							}
						>
							{options.map((o, i) => (
								// biome-ignore lint/a11y/useKeyWithClickEvents: DOM focus stays on the combobox trigger, which owns all keys (aria-activedescendant)
								<div
									key={o.value}
									tabIndex={-1}
									id={`${listId}-o${i}`}
									role="option"
									aria-selected={i === selectedIndex}
									aria-disabled={o.disabled || undefined}
									className="sy-select__option"
									data-active={i === active ? "true" : undefined}
									data-value={o.value}
									onMouseDown={(e) => e.preventDefault()}
									onMouseEnter={() => setActive(i)}
									onClick={() => choose(i)}
								>
									<span className="sy-select__option-label">
										<bdi>{o.label}</bdi>
									</span>
									{i === selectedIndex ? <Icon name="check" size={14} /> : null}
								</div>
							))}
						</div>
					) : null}
				</div>
			)}
		</FieldShell>
	);
}
