import { type KeyboardEvent, type ReactNode, useId, useRef } from "react";
import { useI18n } from "../i18n/index.ts";
import "./tabs.css";

export type TabItem = {
	id: string;
	label: ReactNode;
	panel?: ReactNode;
	disabled?: boolean;
};

/**
 * Pure keyboard model (WAI-ARIA tabs, automatic activation). Returns the index to focus, or null when
 * the key is not handled. In RTL the horizontal arrows are reversed so "next" follows the visual direction.
 */
export function nextTabIndex(
	key: string,
	current: number,
	count: number,
	dir: "ltr" | "rtl",
	disabled: readonly boolean[] = [],
): number | null {
	if (count <= 0) return null;
	const step = (from: number, delta: 1 | -1): number => {
		let i = from;
		for (let n = 0; n < count; n++) {
			i = (i + delta + count) % count;
			if (!disabled[i]) return i;
		}
		return from;
	};
	const forward = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
	const back = dir === "rtl" ? "ArrowRight" : "ArrowLeft";
	if (key === forward) return step(current, 1);
	if (key === back) return step(current, -1);
	if (key === "Home") return disabled[0] ? step(0, 1) : 0;
	if (key === "End")
		return disabled[count - 1] ? step(count - 1, -1) : count - 1;
	return null;
}

export type TabsProps = {
	tabs: readonly TabItem[];
	value: string;
	onChange: (id: string) => void;
	/** Accessible name of the tablist. */
	label: string;
};

export function Tabs({ tabs, value, onChange, label }: TabsProps) {
	const { dir } = useI18n();
	const base = useId();
	const refs = useRef<Array<HTMLButtonElement | null>>([]);
	const active = Math.max(
		0,
		tabs.findIndex((t) => t.id === value),
	);

	const onKeyDown = (e: KeyboardEvent, index: number) => {
		const next = nextTabIndex(
			e.key,
			index,
			tabs.length,
			dir,
			tabs.map((t) => Boolean(t.disabled)),
		);
		if (next === null) return;
		e.preventDefault();
		const target = tabs[next];
		if (!target) return;
		onChange(target.id);
		refs.current[next]?.focus();
	};

	const current = tabs[active];
	return (
		<div className="sy-tabs-wrap">
			<div className="sy-tabs" role="tablist" aria-label={label}>
				{tabs.map((t, i) => (
					<button
						key={t.id}
						ref={(el) => {
							refs.current[i] = el;
						}}
						type="button"
						role="tab"
						id={`${base}-tab-${t.id}`}
						aria-selected={i === active}
						aria-controls={`${base}-panel-${t.id}`}
						tabIndex={i === active ? 0 : -1}
						disabled={t.disabled}
						className="sy-tab"
						onClick={() => onChange(t.id)}
						onKeyDown={(e) => onKeyDown(e, i)}
					>
						{t.label}
					</button>
				))}
			</div>
			{current ? (
				<div
					role="tabpanel"
					id={`${base}-panel-${current.id}`}
					aria-labelledby={`${base}-tab-${current.id}`}
					// biome-ignore lint/a11y/noNoninteractiveTabindex: WAI-ARIA tabs pattern - panel without focusable content must be reachable
					tabIndex={0}
					className="sy-tabpanel"
				>
					{current.panel}
				</div>
			) : null}
		</div>
	);
}
