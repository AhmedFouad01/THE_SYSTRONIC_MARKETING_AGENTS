import { useState } from "react";
import { useUiDir } from "../i18n/index.ts";
import {
	ComboBox as AriaComboBox,
	Input,
	Label,
	Button,
	Popover,
	ListBox,
	ListBoxItem,
	Text,
	FieldError,
} from "react-aria-components";
import { Icon } from "../icons/index.ts";
import type { SelectOption } from "./Select.tsx";
import {
	choiceTrigger,
	choicePopup,
	choiceItem,
	choiceFocus,
} from "./choices.ts";
export type ComboBoxProps = {
	label: string;
	options: readonly SelectOption[];
	value: string | null;
	onChange?: (e: {
		target: { value: string; name: string | undefined };
	}) => void;
	inputValue?: string;
	onInputChange?: (value: string) => void;
	name?: string;
	disabled?: boolean;
	readOnly?: boolean;
	required?: boolean;
	error?: string;
	hint?: string;
	"data-testid"?: string;
};
export function ComboBox({
	label,
	options,
	value,
	onChange,
	inputValue,
	onInputChange,
	name,
	disabled,
	readOnly,
	required,
	error,
	hint,
	"data-testid": testId,
}: ComboBoxProps) {
	const dir = useUiDir();
	const [text, setText] = useState(
		options.find((o) => o.value === value)?.label ?? "",
	);
	return (
		<AriaComboBox
			defaultItems={options}
			selectedKey={value}
			onSelectionChange={(key) =>
				onChange?.({ target: { value: key === null ? "" : String(key), name } })
			}
			inputValue={inputValue}
			onInputChange={(v) => {
				setText(v);
				onInputChange?.(v);
			}}
			name={name}
			isDisabled={disabled}
			isReadOnly={readOnly}
			isRequired={required}
			isInvalid={Boolean(error)}
			validationBehavior="aria"
			className="grid gap-4 min-w-0"
		>
			<Label className="text-data text-text font-[600]">
				{label}
				{required ? " *" : ""}
			</Label>
			<div className={`${choiceTrigger} h-[36px]`}>
				<Input
					data-testid={testId}
					dir={(inputValue ?? text).length ? "auto" : dir}
					className={`w-full min-w-0 border-0 bg-transparent text-text outline-none ${choiceFocus}`}
				/>
				<Button
					aria-label={label}
					className={`shrink-0 rounded-6 ${choiceFocus}`}
				>
					<Icon name="chevronDown" size={16} />
				</Button>
			</div>
			{hint ? (
				<Text slot="description" className="text-data text-text-3">
					{hint}
				</Text>
			) : null}
			{error ? (
				<FieldError className="text-data text-danger-fg">{error}</FieldError>
			) : null}
			<Popover placement="bottom start" className={choicePopup}>
				<ListBox<SelectOption> className="outline-none">
					{(option) => (
						<ListBoxItem
							id={option.value}
							textValue={option.label}
							isDisabled={option.disabled}
							className={choiceItem}
						>
							<bdi>{option.label}</bdi>
						</ListBoxItem>
					)}
				</ListBox>
			</Popover>
		</AriaComboBox>
	);
}
