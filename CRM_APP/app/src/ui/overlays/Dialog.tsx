import {
	type ReactNode,
	type RefObject,
	useEffect,
	useId,
	useRef,
} from "react";
import {
	ModalOverlay,
	Modal,
	Dialog as AriaDialog,
} from "react-aria-components";
import { useI18n } from "../i18n/index.ts";
import { Icon } from "../icons/index.ts";
import { Button } from "../primitives/Button.tsx";
import { focusablesIn } from "./nav.ts";
import "./overlays.css";
export type DialogConfirm = {
	label: string;
	onConfirm: () => void;
	/** danger = destructive consequence (default for confirm); primary = neutral confirmation. */
	tone?: "danger" | "primary";
	loading?: boolean;
};

export type DialogProps = {
	open: boolean;
	onClose: () => void;
	title: string;
	description?: string;
	children?: ReactNode;
	/** Confirm variant: Cancel + confirm footer; Cancel receives the initial focus (safe default). */
	confirm?: DialogConfirm;
	/** Custom footer (ignored when `confirm` is set). */
	footer?: ReactNode;
	/** Defaults to the element that had focus when the dialog opened. */
	returnFocusRef?: RefObject<HTMLElement | null>;
	initialFocusRef?: RefObject<HTMLElement | null>;
	testId?: string;
	/** center = modal card (default); sheet = bottom sheet; side = full-screen record sheet sliding from inline-end, with a back button. */
	placement?: "center" | "sheet" | "side";
	/** side only: `right` slides in from the PHYSICAL right edge in every language (preview sheet); default follows the inline-end edge. */
	dock?: "inline-end" | "right";
};

/** RAC owns modal containment, nested dismissal, scroll lock and default focus return. */
export function Dialog(props: DialogProps) {
	if (!props.open) return null;
	const placement = props.placement ?? "center";
	const dock = props.dock ?? "inline-end";
	return (
		<ModalOverlay
			isOpen
			onOpenChange={(open) => {
				if (!open) props.onClose();
			}}
			isDismissable={false}
			className="sy-scrim"
			data-placement={placement}
			data-dock={placement === "side" ? dock : undefined}
		>
			<Modal
				className={`w-full max-w-full max-h-full outline-none ${placement === "center" ? "flex justify-center" : ""} ${placement === "side" ? "h-full" : ""}`}
			>
				<DialogContent {...props} />
			</Modal>
		</ModalOverlay>
	);
}
function DialogContent({
	onClose,
	title,
	description,
	children,
	confirm,
	footer,
	initialFocusRef,
	returnFocusRef,
	testId,
	placement = "center",
}: DialogProps) {
	const { t } = useI18n();
	const id = useId();
	const rootRef = useRef<HTMLElement>(null);
	const cancelRef = useRef<HTMLButtonElement>(null);
	useEffect(() => {
		const target =
			initialFocusRef?.current ??
			cancelRef.current ??
			rootRef.current?.querySelector<HTMLElement>("[data-autofocus]") ??
			(rootRef.current ? focusablesIn(rootRef.current)[0] : null);
		target?.focus();
		return () => {
			if (returnFocusRef)
				requestAnimationFrame(() => returnFocusRef.current?.focus());
		};
	}, [initialFocusRef, returnFocusRef]);
	return (
		<AriaDialog
			ref={rootRef}
			render={(domProps) => <section {...domProps} role="dialog" aria-modal="true" />}
			aria-labelledby={`${id}-title`}
			aria-describedby={description ? `${id}-desc` : undefined}
			className="sy-dialog outline-none"
			data-variant={confirm ? "confirm" : "default"}
			data-testid={testId}
		>
			{placement === "side" ? (
				<div className="sy-dialog__sidehead">
					<button
						type="button"
						className="sy-dialog__back"
						onClick={onClose}
						data-testid="sheet-back"
					>
						<Icon
							name="chevronRight"
							size={18}
							mirrorInRtl={false}
							className="sy-back-icon"
						/>
						{t("record.back")}
					</button>
					<h2 id={`${id}-title`} className="sy-dialog__sidetitle">
						{title}
					</h2>
				</div>
			) : (
				<h2 id={`${id}-title`} className="sy-dialog__title">
					{title}
				</h2>
			)}
			{description ? (
				<p id={`${id}-desc`} className="sy-dialog__desc">
					{description}
				</p>
			) : null}
			{children ? <div className="sy-dialog__body">{children}</div> : null}
			{confirm ? (
				<div className="sy-dialog__footer">
					<Button ref={cancelRef} onClick={onClose} data-testid="dialog-cancel">
						{t("common.cancel")}
					</Button>
					<Button
						variant={confirm.tone === "primary" ? "primary" : "danger"}
						loading={confirm.loading ?? false}
						onClick={confirm.onConfirm}
						data-testid="dialog-confirm"
					>
						{confirm.label}
					</Button>
				</div>
			) : footer ? (
				<div className="sy-dialog__footer">{footer}</div>
			) : null}
		</AriaDialog>
	);
}
