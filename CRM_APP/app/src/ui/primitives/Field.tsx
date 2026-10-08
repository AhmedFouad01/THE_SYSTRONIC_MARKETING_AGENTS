import { Input as AriaInput, TextArea as AriaTextArea } from "react-aria-components";
import {
	type FormEvent,
	type InputHTMLAttributes,
	type ReactNode,
	type Ref,
	type TextareaHTMLAttributes,
	useId,
	useState,
} from "react";
import { useUiDir } from "../i18n/index.ts";
import "./field.css";

/** Value types whose content is always left-to-right (digits, @, +): the island stays LTR, aligned by CSS. */
const LTR_TYPES: ReadonlySet<string> = new Set(["email", "tel", "url", "number", "date", "datetime-local", "time"]);

/**
 * UI_R4_SPEC I: free text takes its direction from its first strong character (`dir="auto"`); an EMPTY field keeps the
 * UI direction (browsers resolve an empty dir=auto field as LTR, which would left-align the placeholder in Arabic).
 * Explicit `dir` from the caller always wins.
 */
function useValueDir(
	explicit: string | undefined,
	type: string | undefined,
	value: unknown,
	defaultValue: unknown,
): { dir: string; onInput: (e: FormEvent<{ value: string }>) => void } {
	const uiDir = useUiDir();
	const controlled = value !== undefined;
	const [typed, setTyped] = useState(String(defaultValue ?? "").length > 0);
	const hasText = controlled ? String(value).length > 0 : typed;
	const resolved = explicit ?? (type && LTR_TYPES.has(type) ? "ltr" : hasText ? "auto" : uiDir);
	return { dir: resolved, onInput: (e) => setTyped(e.currentTarget.value.length > 0) };
}

type Shared = {
	label: string;
	hint?: string;
	error?: string | undefined;
};

type ControlProps = {
	id: string;
	"aria-invalid": true | undefined;
	"aria-describedby": string | undefined;
};

export type FieldControlProps = ControlProps;

export function FieldShell({
	label,
	hint,
	error,
	required,
	className,
	children,
}: Shared & {
	required?: boolean | undefined;
	className?: string | undefined;
	children: (p: ControlProps) => ReactNode;
}) {
	const id = useId();
	const hintId = hint ? `${id}-hint` : undefined;
	const errId = error ? `${id}-err` : undefined;
	const describedBy = [hintId, errId].filter(Boolean).join(" ") || undefined;
	return (
		<div
			className={`sy-field${error ? " sy-field--error" : ""}${className ? ` ${className}` : ""}`}
		>
			<label className="sy-field__label" htmlFor={id}>
				{label}
				{required ? <span aria-hidden="true"> *</span> : null}
			</label>
			{children({
				id,
				"aria-invalid": error ? true : undefined,
				"aria-describedby": describedBy,
			})}
			{hint ? (
				<p className="sy-field__hint" id={hintId}>
					{hint}
				</p>
			) : null}
			{error ? (
				<p className="sy-field__error" id={errId}>
					{error}
				</p>
			) : null}
		</div>
	);
}

export type InputProps = Shared & InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> };
export function Input({
	label,
	hint,
	error,
	className,
	required,
	...rest
}: InputProps) {
	const bidi = useValueDir(rest.dir, rest.type, rest.value, rest.defaultValue);
	return (
		<FieldShell
			label={label}
			hint={hint ?? ""}
			error={error}
			required={required}
			className={className}
		>
			{(p) => (
				<AriaInput
					{...rest}
					{...p}
					dir={bidi.dir}
					onInput={(e) => {
						bidi.onInput(e);
						rest.onInput?.(e);
					}}
					required={required}
					className="sy-field__control"
				/>
			)}
		</FieldShell>
	);
}

export type TextareaProps = Shared &
	TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: Ref<HTMLTextAreaElement> };
export function Textarea({
	label,
	hint,
	error,
	className,
	required,
	...rest
}: TextareaProps) {
	const bidi = useValueDir(rest.dir, undefined, rest.value, rest.defaultValue);
	return (
		<FieldShell
			label={label}
			hint={hint ?? ""}
			error={error}
			required={required}
			className={className}
		>
			{(p) => (
				<AriaTextArea
					{...rest}
					{...p}
					dir={bidi.dir}
					onInput={(e) => {
						bidi.onInput(e);
						rest.onInput?.(e);
					}}
					required={required}
					className="sy-field__control sy-field__control--area"
				/>
			)}
		</FieldShell>
	);
}
