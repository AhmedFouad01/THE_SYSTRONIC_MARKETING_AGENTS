import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { Icon, type IconName } from "../icons/index.ts";
import { Spinner } from "./Spinner.tsx";
import "./button.css";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
	variant?: ButtonVariant;
	size?: ButtonSize;
	/** loading: sets aria-busy + disabled and swaps the icon for a spinner (no double submit). */
	loading?: boolean;
	icon?: IconName;
	children?: ReactNode;
	ref?: Ref<HTMLButtonElement>;
};

export function Button({
	variant = "secondary",
	size = "md",
	loading = false,
	icon,
	children,
	className,
	disabled,
	type = "button",
	ref,
	...rest
}: ButtonProps) {
	return (
		<button
			{...rest}
			ref={ref}
			type={type}
			disabled={disabled || loading}
			aria-busy={loading || undefined}
			className={`sy-btn sy-btn--${variant} sy-btn--${size}${className ? ` ${className}` : ""}`}
		>
			{loading ? <Spinner size={16} /> : icon ? <Icon name={icon} size={size === "lg" ? 18 : 16} /> : null}
			{children !== undefined && children !== null ? <span className="sy-btn__label">{children}</span> : null}
		</button>
	);
}

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "aria-label"> & {
	/** Required accessible name (icon-only control). */
	"aria-label": string;
	icon: IconName;
	variant?: ButtonVariant;
	size?: ButtonSize;
	loading?: boolean;
	ref?: Ref<HTMLButtonElement>;
};

export function IconButton({
	icon,
	variant = "ghost",
	size = "md",
	loading = false,
	className,
	disabled,
	type = "button",
	ref,
	...rest
}: IconButtonProps) {
	return (
		<button
			{...rest}
			ref={ref}
			type={type}
			disabled={disabled || loading}
			aria-busy={loading || undefined}
			className={`sy-btn sy-btn--icon sy-btn--${variant} sy-btn--${size}${className ? ` ${className}` : ""}`}
		>
			{loading ? <Spinner size={16} /> : <Icon name={icon} size={18} />}
		</button>
	);
}
