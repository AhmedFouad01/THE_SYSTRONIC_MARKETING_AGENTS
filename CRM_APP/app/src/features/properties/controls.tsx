import { useId, useRef } from "react";
import { IconButton, type MessageKey, useI18n } from "../../ui/index.ts";
import { COLOR_VAR, type OptionColor } from "./model.ts";

/** Plain labelled checkbox (the page has no checkbox primitive; the grid's selection boxes are native too). */
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
	return (
		<label className={`sy-props__check${disabled ? " sy-props__check--disabled" : ""}`}>
			<input
				type="checkbox"
				checked={checked}
				disabled={disabled}
				data-testid={testId}
				onChange={(e) => onChange(e.target.checked)}
			/>
			<span>{label}</span>
		</label>
	);
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
	const name = useId();
	const items = ["", ...colors];
	const refs = useRef<Array<HTMLInputElement | null>>([]);
	return (
		<fieldset className="sy-props__colors" data-testid={testId}>
			<legend className="sy-props__legend">{label}</legend>
			<div className="sy-props__swatches" role="radiogroup" aria-label={label}>
				{items.map((c, i) => {
					const text = c === "" ? t("props.opt.colorNone") : t(`props.color.${c}` as MessageKey);
					return (
						<label key={c || "none"} className="sy-props__swatch" title={text}>
							<input
								ref={(el) => {
									refs.current[i] = el;
								}}
								type="radio"
								name={name}
								value={c}
								checked={value === c}
								aria-label={text}
								data-testid={`color-${c || "none"}`}
								onChange={() => onChange(c)}
							/>
							<span
								className={`sy-props__dot${c === "" ? " sy-props__dot--none" : ""}`}
								style={c === "" ? undefined : { background: COLOR_VAR[c as OptionColor] }}
								aria-hidden="true"
							/>
						</label>
					);
				})}
			</div>
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
