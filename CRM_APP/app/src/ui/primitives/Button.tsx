import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { Icon, type IconName } from "../icons/index.ts";
import { Spinner } from "./Spinner.tsx";
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";

const base = "inline-flex items-center justify-center gap-6 min-w-0 border border-solid rounded-8 font-[600] leading-[1] cursor-pointer whitespace-nowrap data-[focus-visible]:outline-2 data-[focus-visible]:outline-focus data-[focus-visible]:outline-offset-2 data-[disabled]:bg-disabled-bg data-[disabled]:text-text-disabled data-[disabled]:border-border data-[disabled]:cursor-not-allowed";
const variants: Record<ButtonVariant, string> = {
 primary: "border-transparent bg-primary text-primary-fg data-[hovered]:bg-primary-hover data-[pressed]:bg-primary-pressed",
 secondary: "bg-surface text-text border-border-strong data-[hovered]:bg-hover",
 ghost: "bg-transparent text-text border-transparent data-[hovered]:bg-hover",
 danger: "bg-danger-bg text-danger-fg border-danger-icon data-[hovered]:bg-danger-hover data-[pressed]:bg-danger-pressed",
 success: "bg-success-bg text-success-fg border-success-icon data-[hovered]:shadow-[inset_0_0_0_1px_var(--sy-success-icon)]",
};
const sizes: Record<ButtonSize, string> = { sm: "h-[32px] px-10 text-data", md: "h-[36px] px-12", lg: "h-[44px] px-16" };
const iconSizes: Record<ButtonSize, string> = { sm: "w-[32px]", md: "w-[36px]", lg: "w-[44px]" };

export type ButtonVariant =
	| "primary"
	| "secondary"
	| "ghost"
	| "danger"
	| "success";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = Omit<
	ButtonHTMLAttributes<HTMLButtonElement>,
	"children"
> & {
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
	onFocus,
	onBlur,
	...rest
}: ButtonProps) {
	return (
		<AriaButton
			{...rest}
			ref={ref}
			// RAC types focus as Element; its rendered button preserves our HTMLButtonElement event contract.
			onFocus={onFocus as AriaButtonProps["onFocus"]}
			onBlur={onBlur as AriaButtonProps["onBlur"]}
			type={type}
			isDisabled={disabled || loading}
			aria-busy={loading || undefined}
			className={`sy-btn sy-btn--${variant} sy-btn--${size} ${base} ${variants[variant]} ${sizes[size]}${loading ? " cursor-progress" : ""}${className ? ` ${className}` : ""}`}
		>
			{loading ? (
				<Spinner size={16} />
			) : icon ? (
				<Icon name={icon} size={size === "lg" ? 18 : 16} />
			) : null}
			{children !== undefined && children !== null ? (
				<span className="sy-btn__label">{children}</span>
			) : null}
		</AriaButton>
	);
}

export type IconButtonProps = Omit<
	ButtonHTMLAttributes<HTMLButtonElement>,
	"children" | "aria-label"
> & {
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
	onFocus,
	onBlur,
	...rest
}: IconButtonProps) {
	return (
		<AriaButton
			{...rest}
			ref={ref}
			// RAC types focus as Element; its rendered button preserves our HTMLButtonElement event contract.
			onFocus={onFocus as AriaButtonProps["onFocus"]}
			onBlur={onBlur as AriaButtonProps["onBlur"]}
			type={type}
			isDisabled={disabled || loading}
			aria-busy={loading || undefined}
			className={`sy-btn sy-btn--icon sy-btn--${variant} sy-btn--${size} ${base} ${variants[variant]} ${sizes[size]} ${iconSizes[size]} px-0${loading ? " cursor-progress" : ""}${className ? ` ${className}` : ""}`}
		>
			{loading ? <Spinner size={16} /> : <Icon name={icon} size={18} />}
		</AriaButton>
	);
}
