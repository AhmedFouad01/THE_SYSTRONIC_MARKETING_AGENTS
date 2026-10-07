import { Button, IconButton, Input, type MessageKey, useI18n } from "../../ui/index.ts";
import { ColorPicker, MoveButtons } from "./controls.tsx";
import { type DraftErrors, issueMessageKey, moveItem, type OptionColor, type OptionDraft, OPTIONS_MAX } from "./model.ts";

/** Draft options of a property being CREATED: add, rename (EN + AR), colour, move up/down, remove. Values are derived on submit. */
export function OptionsEditor({
	options,
	colors,
	onChange,
	errors,
	serverRows,
	listError,
}: {
	options: OptionDraft[];
	colors: readonly OptionColor[];
	onChange: (next: OptionDraft[]) => void;
	errors: DraftErrors["option"];
	serverRows: Record<number, string>;
	listError?: string | undefined;
}) {
	const { t, formatCount } = useI18n();
	const patch = (id: string, p: Partial<OptionDraft>) => onChange(options.map((o) => (o.id === id ? { ...o, ...p } : o)));
	const issueText = (o: OptionDraft, i: number): string | undefined => {
		const c = errors[o.id];
		if (c) return t(`props.issue.${c}` as MessageKey);
		const s = serverRows[i];
		return s ? t(issueMessageKey(s)) : undefined;
	};
	return (
		<fieldset className="sy-props__options" data-testid="options-editor">
			<legend className="sy-props__legend">{t("props.opt.title")}</legend>
			<p className="sy-props__muted">{t("props.opt.hint")}</p>
			{listError ? (
				<p className="sy-field__error" role="alert">
					{listError}
				</p>
			) : null}
			{options.length === 0 ? <p className="sy-props__muted">{t("props.opt.empty")}</p> : null}
			<ol className="sy-props__optlist">
				{options.map((o, i) => (
					<li key={o.id} className="sy-props__opt" data-testid="option-row">
						<span className="sy-props__optno">{t("props.opt.rowLabel", { index: formatCount(i + 1) })}</span>
						<div className="sy-form-row">
							<Input
								label={t("props.opt.labelEn")}
								value={o.en}
								maxLength={80}
								data-testid="option-en"
								error={issueText(o, i)}
								onChange={(e) => patch(o.id, { en: e.target.value })}
							/>
							<Input
								label={t("props.opt.labelAr")}
								value={o.ar}
								maxLength={80}
								data-testid="option-ar"
								onChange={(e) => patch(o.id, { ar: e.target.value })}
							/>
						</div>
						<ColorPicker
							label={t("props.opt.color")}
							colors={colors}
							value={o.color}
							onChange={(color) => patch(o.id, { color })}
						/>
						<div className="sy-props__optactions">
							<MoveButtons
								idPrefix={`option-${i}`}
								upLabel={t("props.opt.up")}
								downLabel={t("props.opt.down")}
								disableUp={i === 0}
								disableDown={i === options.length - 1}
								onUp={() => onChange(moveItem(options, i, -1) ?? options)}
								onDown={() => onChange(moveItem(options, i, 1) ?? options)}
							/>
							<IconButton
								icon="delete"
								size="sm"
								aria-label={t("props.opt.remove")}
								data-testid="option-remove"
								onClick={() => onChange(options.filter((x) => x.id !== o.id))}
							/>
						</div>
					</li>
				))}
			</ol>
			<Button
				icon="plus"
				disabled={options.length >= OPTIONS_MAX}
				data-testid="option-add"
				onClick={() => onChange([...options, { id: crypto.randomUUID(), en: "", ar: "", color: "" }])}
			>
				{t("props.opt.add")}
			</Button>
		</fieldset>
	);
}
