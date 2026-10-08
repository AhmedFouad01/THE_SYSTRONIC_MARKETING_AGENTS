import type { ReactNode, Ref } from "react";
import { Checkbox as AriaCheckbox } from "react-aria-components";
import { Icon } from "../icons/index.ts";
import { choiceFocus } from "./choices.ts";
export type CheckboxProps = {
	label: ReactNode;
	checked: boolean;
	onChange?: (checked: boolean) => void;
	indeterminate?: boolean;
	disabled?: boolean;
	readOnly?: boolean;
	required?: boolean;
	invalid?: boolean;
	name?: string;
	value?: string;
	inputRef?: Ref<HTMLInputElement>;
	"data-testid"?: string;
};
export function Checkbox({
	label,
	checked,
	onChange,
	indeterminate,
	disabled,
	readOnly,
	required,
	invalid,
	...rest
}: CheckboxProps) {
	return (
		<AriaCheckbox
			{...rest}
			isSelected={checked}
			onChange={onChange}
			isIndeterminate={indeterminate}
			isDisabled={disabled}
			isReadOnly={readOnly}
			isRequired={required}
			isInvalid={invalid}
			validationBehavior="aria"
			className={`inline-flex items-center gap-8 min-w-0 rounded-6 text-text text-data cursor-pointer data-[disabled]:text-text-disabled data-[disabled]:cursor-not-allowed ${choiceFocus}`}
		>
			{({ isSelected, isIndeterminate }) => (
				<>
					<span
						aria-hidden="true"
						className={`inline-flex items-center justify-center shrink-0 w-[16px] h-[16px] border border-solid rounded-[3px] ${isSelected || isIndeterminate ? "bg-primary text-primary-fg border-primary" : "bg-surface border-border-strong"}`}
					>
						{isIndeterminate ? (
							"−"
						) : isSelected ? (
							<Icon name="check" size={12} />
						) : null}
					</span>
					<bdi>{label}</bdi>
				</>
			)}
		</AriaCheckbox>
	);
}
