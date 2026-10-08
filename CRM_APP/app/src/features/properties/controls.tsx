import { Radio, RadioGroup } from "react-aria-components";
import { Checkbox, IconButton, type MessageKey, useI18n } from "../../ui/index.ts";
import { COLOR_VAR, type OptionColor } from "./model.ts";

/** Controlled property flag using the shared accessible choice primitive. */
export function Check({
	label,
	checked,
	onChange,
	disabled,
	testId,
}: {
	label: string;
	checked: boolean;
	onChange: (v: boolean) => void;
	disabled?: boolean;
	testId?: string;
}) {
	return <Checkbox label={label} checked={checked} disabled={disabled} data-testid={testId} onChange={onChange} />;
}

/** The fixed 8-colour palette as a radio group (+ "no colour"). Colour is never the only cue: every swatch has its name. */
export function ColorPicker({
	value,
	colors,
	onChange,
	label,
	testId,
}: {
	value: string;
	colors: readonly OptionColor[];
	onChange: (v: string) => void;
	label: string;
	testId?: string;
}) {
	const { t } = useI18n();
	const items = ["", ...colors];
	return (
		<fieldset className="sy-props__colors" data-testid={testId}>
			<legend className="sy-props__legend">{label}</legend>
			<RadioGroup className="sy-props__swatches" aria-label={label} value={value} onChange={onChange}>
				{items.map((c) => {
					const text = c === "" ? t("props.opt.colorNone") : t(`props.color.${c}` as MessageKey);
					return (
						<Radio key={c || "none"} value={c} className="sy-props__swatch" aria-label={text} data-testid={`color-${c || "none"}`}>
							<span
								title={text}
								className={`sy-props__dot${c === "" ? " sy-props__dot--none" : ""}`}
								style={c === "" ? undefined : { background: COLOR_VAR[c as OptionColor] }}
								aria-hidden="true"
							/>
						</Radio>
					);
				})}
			</RadioGroup>
		</fieldset>
	);
}

export function ColorDot({ color }: { color: string | null }) {
	if (!color || !(color in COLOR_VAR)) return null;
	return <span className="sy-props__dot sy-props__dot--sm" style={{ background: COLOR_VAR[color as OptionColor] }} aria-hidden="true" />;
}

/** Up/down pair (the keyboard and touch alternative to drag). */
export function MoveButtons({
	onUp,
	onDown,
	upLabel,
	downLabel,
	disableUp,
	disableDown,
	busy,
	idPrefix,
}: {
	onUp: () => void;
	onDown: () => void;
	upLabel: string;
	downLabel: string;
	disableUp: boolean;
	disableDown: boolean;
	busy?: boolean;
	idPrefix: string;
}) {
	return (
		<span className="sy-props__move">
			<IconButton
				icon="chevronUp"
				size="sm"
				aria-label={upLabel}
				disabled={disableUp || busy}
				data-testid={`${idPrefix}-up`}
				data-focus-id={`${idPrefix}-up`}
				onClick={onUp}
			/>
			<IconButton
				icon="chevronDown"
				size="sm"
				aria-label={downLabel}
				disabled={disableDown || busy}
				data-testid={`${idPrefix}-down`}
				data-focus-id={`${idPrefix}-down`}
				onClick={onDown}
			/>
		</span>
	);
}
