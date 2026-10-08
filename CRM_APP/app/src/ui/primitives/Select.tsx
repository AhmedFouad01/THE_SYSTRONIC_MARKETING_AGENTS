import {
	Children,
	type ReactElement,
	type ReactNode,
	isValidElement,
	useMemo,
} from "react";
import {
	Button as AriaButton,
	Select as AriaSelect,
	SelectValue,
	Popover,
	ListBox,
	ListBoxItem,
} from "react-aria-components";
import { Icon } from "../icons/index.ts";
import { FieldShell } from "./Field.tsx";
import { choiceTrigger, choicePopup, choiceItem } from "./choices.ts";
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
	onChange?: (e: {
		target: { value: string; name: string | undefined };
	}) => void;
	size?: "sm" | "md";
	"data-testid"?: string;
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

/** Preserve the native value/event contract; RAC owns collection, keyboard and focus. */
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
	const options = useMemo(() => parseOptions(children), [children]);
	return (
		<FieldShell
			label={label}
			hint={hint ?? ""}
			error={error}
			required={required}
			className={className}
		>
			{(p) => (
				<AriaSelect
					aria-label={label}
					name={name}
					value={value}
					onChange={(key) => {
						if (key !== null && String(key) !== value)
							onChange?.({ target: { value: String(key), name } });
					}}
					isDisabled={disabled}
					isRequired={required}
					isInvalid={Boolean(error)}
					validationBehavior="aria"
					className="sy-select min-w-0"
				>
					<AriaButton
						{...p}
						render={(domProps) => (
							<button
								{...domProps}
								role="combobox"
								aria-label={label}
								aria-labelledby={undefined}
								aria-expanded={domProps["aria-expanded"] ?? false}
							/>
						)}
						data-testid={testId}
						data-name={name}
						data-value={value}
						className={`${choiceTrigger} ${size === "sm" ? "h-[32px]" : "h-[36px]"}`}
					>
						<SelectValue className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
							{({ selectedText }) => <bdi>{selectedText || " "}</bdi>}
						</SelectValue>
						<Icon
							name="chevronDown"
							size={16}
							className="shrink-0 text-icon-muted"
						/>
					</AriaButton>
					<Popover placement="bottom start" className={choicePopup}>
						<ListBox
							aria-label={label}
							items={options}
							className="outline-none"
						>
							{(option) => (
								<ListBoxItem
									id={option.value}
									textValue={option.label}
									isDisabled={option.disabled}
									data-value={option.value}
									className={choiceItem}
								>
									{({ isSelected }) => (
										<>
											<span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
												<bdi>{option.label}</bdi>
											</span>
											{isSelected ? <Icon name="check" size={14} /> : null}
										</>
									)}
								</ListBoxItem>
							)}
						</ListBox>
					</Popover>
				</AriaSelect>
			)}
		</FieldShell>
	);
}
