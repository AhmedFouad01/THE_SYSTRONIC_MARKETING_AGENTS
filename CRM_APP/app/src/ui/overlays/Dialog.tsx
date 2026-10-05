import { type KeyboardEvent, type ReactNode, type RefObject, useEffect, useId, useRef } from "react";
import { useI18n } from "../i18n/index.ts";
import { Button } from "../primitives/Button.tsx";
import { focusablesIn, lockScroll, trapIndex } from "./nav.ts";
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
	/** center = modal card (default); sheet = bottom sheet. */
	placement?: "center" | "sheet";
};

/**
 * Modal dialog (COMPONENT_CONTRACTS Dialog): aria-modal, labelled, initial focus, Tab trap, Esc closes,
 * focus returns to the opener, body scroll locked while open. Rendered inline (position: fixed), no portal.
 */
export function Dialog({
	open,
	onClose,
	title,
	description,
	children,
	confirm,
	footer,
	returnFocusRef,
	initialFocusRef,
	testId,
	placement = "center",
}: DialogProps) {
	const { t } = useI18n();
	const id = useId();
	const rootRef = useRef<HTMLDivElement>(null);
	const cancelRef = useRef<HTMLButtonElement>(null);
	const onCloseRef = useRef(onClose);
	useEffect(() => {
		onCloseRef.current = onClose;
	});

	useEffect(() => {
		if (!open) return;
		const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		const unlock = lockScroll();
		const root = rootRef.current;
		const target =
			initialFocusRef?.current ??
			cancelRef.current ??
			root?.querySelector<HTMLElement>("[data-autofocus]") ??
			(root ? focusablesIn(root)[0] : null) ??
			root;
		target?.focus();
		return () => {
			unlock();
			const back = returnFocusRef?.current ?? opener;
			if (back?.isConnected) back.focus();
		};
	}, [open, initialFocusRef, returnFocusRef]);

	if (!open) return null;

	const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		if (e.key === "Escape") {
			e.preventDefault();
			e.stopPropagation();
			onCloseRef.current();
			return;
		}
		if (e.key !== "Tab" || !rootRef.current) return;
		const items = focusablesIn(rootRef.current);
		const next = trapIndex(e.shiftKey, items.indexOf(document.activeElement as HTMLElement), items.length);
		if (next === null) {
			if (items.length === 0) e.preventDefault(); // nothing focusable: keep focus on the dialog itself
			return;
		}
		e.preventDefault();
		items[next]?.focus();
	};

	return (
		<div className="sy-scrim" role="presentation" data-placement={placement}>
			<div
				ref={rootRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby={`${id}-title`}
				aria-describedby={description ? `${id}-desc` : undefined}
				tabIndex={-1}
				className="sy-dialog"
				data-variant={confirm ? "confirm" : "default"}
				data-testid={testId}
				onKeyDown={onKeyDown}
			>
				<h2 id={`${id}-title`} className="sy-dialog__title">
					{title}
				</h2>
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
			</div>
		</div>
	);
}
