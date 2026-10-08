import { Button as AriaButton } from "react-aria-components";
import { type KeyboardEvent, type ReactNode, useEffect, useId, useLayoutEffect, useRef } from "react";
import { useI18n } from "../i18n/index.ts";
import { Icon } from "../icons/index.ts";
import { useWideLayout } from "../primitives/useMediaQuery.ts";
import { Dialog } from "./Dialog.tsx";
import { isOutsideDismissIgnored, isTypingTarget, stepDirectionOfKey } from "./previewModel.ts";
import "./preview-motion.css";

export type PreviewNav = {
	/** null = no previous record (disabled). */
	onPrev: (() => void) | null;
	/** null = no next record (disabled). */
	onNext: (() => void) | null;
	/** "3 of 25" (already localised). */
	position?: string;
	/** The next page of records is loading. */
	busy?: boolean;
};

export type PreviewPanelProps = {
	/** Accessible name of the surface ("Lead details"). */
	label: string;
	/** Visible header text: the record name (single line, ellipsis). Defaults to `label`. */
	heading?: string;
	testId: string;
	onClose: () => void;
	/** Element that gets focus back on close (default: the element focused when the panel opened). */
	returnFocus?: () => HTMLElement | null;
	nav?: PreviewNav;
	children: ReactNode;
};

/**
 * Preview slide-over (UI R4 C, decision D7). From 1024px: non-modal overlay docked at the INLINE END (physical right in
 * EN, physical left in AR), below the topbar, table untouched; Esc / outside click close it, J/K or Alt+Up/Down step
 * through the rows. Below 1024px: a full-screen modal sheet from the physical right in both languages (Dialog `side`),
 * which also owns one history entry so the browser Back button closes it. Content follows the UI language direction.
 * Rendered inline (no portal); the slide animation ends at `transform: none`, so fixed-position Select/DatePicker/nested
 * dialogs inside are positioned against the viewport.
 */
export function PreviewPanel(props: PreviewPanelProps) {
	const wide = useWideLayout();
	return wide ? <DesktopPreview {...props} /> : <SheetPreview {...props} />;
}

/**
 * Exit animation without keeping the component mounted: when the surface unmounts, a non-interactive clone of its DOM
 * plays the exit keyframes and removes itself. (Layout-effect cleanups of a deleted subtree run before its DOM nodes
 * are detached, so the node can still be cloned.)
 */
function leaveGhost(node: HTMLElement | null) {
	if (node === null || !node.isConnected) return;
	const ghost = node.cloneNode(true) as HTMLElement;
	for (const el of [ghost, ...Array.from(ghost.querySelectorAll<HTMLElement>("*"))]) {
		el.removeAttribute("id");
		el.removeAttribute("data-testid");
		el.removeAttribute("role");
		el.removeAttribute("aria-labelledby");
	}
	ghost.classList.add("sy-ghost");
	ghost.setAttribute("aria-hidden", "true");
	ghost.setAttribute("inert", "");
	node.parentElement?.insertBefore(ghost, node.nextSibling);
	const done = () => ghost.remove();
	ghost.addEventListener("animationend", done, { once: true });
	setTimeout(done, 400);
}

// History entry owned by the open sheet (module state: survives the dev-only StrictMode remount of the effects).
let sheets = 0;
let entryPushed = false;

function SheetPreview({ label, heading, testId, onClose, children }: PreviewPanelProps) {
	const markerRef = useRef<HTMLSpanElement>(null);
	const live = useRef(onClose);
	useEffect(() => {
		live.current = onClose;
	});

	// One history entry while the sheet is open: Back / swipe-back closes the sheet and lands on the list. A layout effect,
	// so the entry is pushed before the screen writes `?preview=` into the (new) current URL.
	useLayoutEffect(() => {
		sheets += 1;
		if (!entryPushed) {
			history.pushState({ ...(history.state ?? {}), syPreviewSheet: true }, "", location.href);
			entryPushed = true;
		}
		const onPop = () => {
			if (!entryPushed) return;
			entryPushed = false; // the entry is already gone
			live.current();
		};
		window.addEventListener("popstate", onPop);
		return () => {
			sheets -= 1;
			window.removeEventListener("popstate", onPop);
			// Closed some other way (back button, row, route change): drop our entry so Back does not hit a stale one.
			setTimeout(() => {
				if (sheets === 0 && entryPushed && history.state?.syPreviewSheet === true) {
					entryPushed = false;
					history.back();
				}
			}, 0);
		};
	}, []);

	useLayoutEffect(() => {
		const marker = markerRef.current;
		return () => leaveGhost(marker?.closest<HTMLElement>(".sy-scrim") ?? null);
	}, []);

	return (
		<Dialog open onClose={onClose} title={heading ?? label} placement="side" dock="right" testId={testId}>
			<span ref={markerRef} hidden />
			{children}
		</Dialog>
	);
}

const MODAL_OPEN = '.sy-scrim,[role="menu"],[role="listbox"]';

function DesktopPreview({ label, heading, testId, onClose, returnFocus, nav, children }: PreviewPanelProps) {
	const { t } = useI18n();
	const id = useId();
	const rootRef = useRef<HTMLDivElement>(null);
	const headingRef = useRef<HTMLHeadingElement>(null);
	const live = useRef({ onClose, nav, returnFocus });
	useEffect(() => {
		live.current = { onClose, nav, returnFocus };
	});

	useLayoutEffect(() => {
		const node = rootRef.current;
		return () => leaveGhost(node);
	}, []);

	// Focus the heading on open (not on record swaps), mark the page (toast offset), return focus on close.
	useEffect(() => {
		const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		headingRef.current?.focus({ preventScroll: true });
		document.documentElement.setAttribute("data-preview-open", "");
		return () => {
			document.documentElement.removeAttribute("data-preview-open");
			const back = live.current.returnFocus?.() ?? opener;
			if (back?.isConnected) back.focus({ preventScroll: true });
		};
	}, []);

	useEffect(() => {
		const modalOpen = () => document.querySelector(MODAL_OPEN) !== null;
		const onPointerDown = (e: PointerEvent) => {
			const target = e.target instanceof Element ? e.target : null;
			if (target === null || rootRef.current?.contains(target)) return;
			if (isOutsideDismissIgnored(target) || modalOpen()) return;
			live.current.onClose();
		};
		const onKey = (e: globalThis.KeyboardEvent) => {
			if (e.defaultPrevented || modalOpen()) return;
			const target = e.target instanceof HTMLElement ? e.target : null;
			if (e.key === "Escape") {
				// Inside the panel the panel handles it itself; from the page only a row (or nothing) has focus.
				if (target && (target === document.body || target.closest("tr[data-row-id]"))) live.current.onClose();
				return;
			}
			const dir = stepDirectionOfKey(e);
			if (dir === null || isTypingTarget(target)) return;
			const go = dir === "prev" ? live.current.nav?.onPrev : live.current.nav?.onNext;
			if (go) {
				e.preventDefault();
				go();
			}
		};
		document.addEventListener("pointerdown", onPointerDown, true);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("pointerdown", onPointerDown, true);
			document.removeEventListener("keydown", onKey);
		};
	}, []);

	const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		// Select, DatePicker, a nested dialog and the edit form's own Esc stop propagation before this point.
		if (e.key === "Escape" && !e.defaultPrevented) {
			e.preventDefault();
			e.stopPropagation();
			onClose();
		}
	};

	const shown = heading ?? label;
	return (
		<div
			ref={rootRef}
			role="dialog"
			aria-modal="false"
			aria-label={label}
			className="sy-preview fixed top-topbar-h end-0 bottom-0 z-[var(--sy-z-panel)] flex flex-col w-preview-w max-w-[100vw] border-s border-solid border-border bg-surface text-text shadow-panel rtl:shadow-panel-rtl outline-none"
			data-testid={testId}
			onKeyDown={onKeyDown}
		>
			<div className="sy-preview__head flex flex-none items-center gap-4 min-h-[56px] ps-16 pe-10 border-b border-solid border-border bg-surface">
				<h2 id={`${id}-title`} ref={headingRef} tabIndex={-1} className="sy-preview__title flex-1 min-w-0 m-0 overflow-hidden text-text-3 text-data font-[600] text-ellipsis whitespace-nowrap outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-1 focus-visible:rounded-6" title={shown}>
					<bdi dir="auto">{shown}</bdi>
				</h2>
				{nav ? (
					<>
						{nav.position ? (
							<span className="sy-preview__pos flex-none me-4 text-text-3 text-[12px] tabular-nums" data-testid="preview-position" aria-live="polite">
								{nav.busy ? t("preview.loadingMore") : nav.position}
							</span>
						) : null}
						<AriaButton
							type="button"
							className="sy-preview__btn grid flex-none place-items-center w-[32px] h-[32px] border-0 rounded-8 bg-transparent text-text-2 cursor-pointer data-[hovered]:bg-hover data-[hovered]:text-text data-[disabled]:text-text-disabled data-[disabled]:cursor-not-allowed data-[focus-visible]:outline-2 data-[focus-visible]:outline-focus data-[focus-visible]:outline-offset-1"
							aria-label={t("preview.prev")}
							render={(domProps) => <button {...domProps} title={t("preview.prev")} />}
							isDisabled={nav.onPrev === null}
							onClick={() => nav.onPrev?.()}
							data-testid="preview-prev"
						>
							<Icon name="chevronUp" size={18} />
						</AriaButton>
						<AriaButton
							type="button"
							className="sy-preview__btn grid flex-none place-items-center w-[32px] h-[32px] border-0 rounded-8 bg-transparent text-text-2 cursor-pointer data-[hovered]:bg-hover data-[hovered]:text-text data-[disabled]:text-text-disabled data-[disabled]:cursor-not-allowed data-[focus-visible]:outline-2 data-[focus-visible]:outline-focus data-[focus-visible]:outline-offset-1"
							aria-label={t("preview.next")}
							render={(domProps) => <button {...domProps} title={t("preview.next")} />}
							isDisabled={nav.onNext === null || nav.busy === true}
							onClick={() => nav.onNext?.()}
							data-testid="preview-next"
						>
							<Icon name="chevronDown" size={18} />
						</AriaButton>
					</>
				) : null}
				<AriaButton
					type="button"
					className="sy-preview__btn grid flex-none place-items-center w-[32px] h-[32px] border-0 rounded-8 bg-transparent text-text-2 cursor-pointer data-[hovered]:bg-hover data-[hovered]:text-text data-[disabled]:text-text-disabled data-[disabled]:cursor-not-allowed data-[focus-visible]:outline-2 data-[focus-visible]:outline-focus data-[focus-visible]:outline-offset-1"
					aria-label={t("preview.close")}
					render={(domProps) => <button {...domProps} title={t("preview.close")} />}
					onClick={onClose}
					data-testid="preview-close"
				>
					<Icon name="close" size={18} />
				</AriaButton>
			</div>
			<div className="sy-preview__body flex-1 min-h-0 p-16 overflow-y-auto overflow-x-hidden">{children as ReactNode}</div>
		</div>
	);
}
