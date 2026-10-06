import {
	type InputHTMLAttributes,
	type ReactNode,
	type TextareaHTMLAttributes,
	useId,
} from "react";
import "./field.css";

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

export type InputProps = Shared & InputHTMLAttributes<HTMLInputElement>;
export function Input({
	label,
	hint,
	error,
	className,
	required,
	...rest
}: InputProps) {
	return (
		<FieldShell
			label={label}
			hint={hint ?? ""}
			error={error}
			required={required}
			className={className}
		>
			{(p) => (
				<input
					{...rest}
					{...p}
					required={required}
					className="sy-field__control"
				/>
			)}
		</FieldShell>
	);
}

export type TextareaProps = Shared &
	TextareaHTMLAttributes<HTMLTextAreaElement>;
export function Textarea({
	label,
	hint,
	error,
	className,
	required,
	...rest
}: TextareaProps) {
	return (
		<FieldShell
			label={label}
			hint={hint ?? ""}
			error={error}
			required={required}
			className={className}
		>
			{(p) => (
				<textarea
					{...rest}
					{...p}
					required={required}
					className="sy-field__control sy-field__control--area"
				/>
			)}
		</FieldShell>
	);
}
