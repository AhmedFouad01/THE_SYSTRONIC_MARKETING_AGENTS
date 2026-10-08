import {
	MenuTrigger,
	Menu as AriaMenu,
	MenuItem as AriaMenuItem,
	Popover,
} from "react-aria-components";
import { Icon, type IconName } from "../icons/index.ts";
import { IconButton } from "../primitives/Button.tsx";
import { choiceFocus } from "../primitives/choices.ts";
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

export function MenuButton({
	label,
	items,
	icon = "dots",
	testId,
}: MenuButtonProps) {
	return (
		<MenuTrigger>
			<IconButton
				icon={icon}
				aria-label={label}
				aria-haspopup="menu"
				size="sm"
				data-testid={testId}
			/>
			<Popover
				placement="bottom end"
				offset={6}
				className="z-[1200] min-w-[190px] max-w-[calc(100vw_-_16px)] max-h-[var(--available-height)] overflow-y-auto p-6 border border-solid border-border rounded-10 bg-surface shadow-menu"
			>
				<AriaMenu
					aria-label={label}
					className="outline-none"
					disabledKeys={items.filter((i) => i.disabled).map((i) => i.id)}
				>
					{items.map((item) => (
						<AriaMenuItem
							key={item.id}
							id={item.id}
							textValue={item.label}
							onAction={item.onSelect}
							isDisabled={item.disabled}
							data-testid={item.testId}
							lang={item.lang}
							className={`flex items-center gap-8 w-full min-h-[34px] px-10 rounded-8 bg-transparent text-text text-data text-start cursor-pointer data-[focused]:bg-hover data-[disabled]:text-text-disabled data-[disabled]:cursor-not-allowed ${choiceFocus}`}
						>
							{item.icon ? <Icon name={item.icon} size={16} /> : null}
							<bdi>{item.label}</bdi>
						</AriaMenuItem>
					))}
				</AriaMenu>
			</Popover>
		</MenuTrigger>
	);
}
