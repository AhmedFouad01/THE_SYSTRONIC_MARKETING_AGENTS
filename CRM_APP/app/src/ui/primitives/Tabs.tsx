import type { ReactNode } from "react";
import {
	Tabs as AriaTabs,
	TabList,
	Tab,
	TabPanel,
} from "react-aria-components";
import { choiceFocus } from "./choices.ts";
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
	return (
		<AriaTabs
			selectedKey={value}
			onSelectionChange={(key) => onChange(String(key))}
			keyboardActivation="automatic"
			className="sy-tabs-wrap min-w-0"
		>
			<TabList
				aria-label={label}
				className="sy-tabs flex gap-4 p-4 border-b border-border overflow-x-auto max-[640px]:[scrollbar-width:none] max-[640px]:[mask-image:linear-gradient(to_right,transparent,var(--sy-surface)_12px,var(--sy-surface)_calc(100%_-_28px),transparent)] rtl:max-[640px]:[mask-image:linear-gradient(to_left,transparent,var(--sy-surface)_12px,var(--sy-surface)_calc(100%_-_28px),transparent)]"
			>
				{tabs.map((t) => (
					<Tab
						key={t.id}
						id={t.id}
						isDisabled={t.disabled}
						className={`sy-tab flex shrink-0 items-center justify-center h-[38px] px-12 border-0 border-b-2 border-transparent bg-transparent text-text-2 font-[600] cursor-pointer data-[hovered]:bg-hover data-[selected]:text-text data-[selected]:border-focus data-[disabled]:text-text-disabled data-[disabled]:cursor-not-allowed ${choiceFocus}`}
					>
						{t.label}
					</Tab>
				))}
			</TabList>
			{tabs.map((t) => (
				<TabPanel
					key={t.id}
					id={t.id}
					className={`sy-tabpanel pt-12 ${choiceFocus}`}
				>
					{t.panel}
				</TabPanel>
			))}
		</AriaTabs>
	);
}
