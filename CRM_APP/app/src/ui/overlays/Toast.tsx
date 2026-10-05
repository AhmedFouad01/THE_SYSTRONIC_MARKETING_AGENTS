import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { useI18n } from "../i18n/index.ts";
import { Icon, type IconName } from "../icons/index.ts";
import "./overlays.css";

export type ToastTone = "info" | "success" | "warning" | "error";
export type ToastItem = { id: number; tone: ToastTone; message: string };
export type ToastAction = { type: "push"; toast: ToastItem } | { type: "dismiss"; id: number };

export const MAX_TOASTS = 4;

/** Pure list model: newest last, bounded (oldest dropped). */
export function toastReducer(state: readonly ToastItem[], action: ToastAction): readonly ToastItem[] {
	if (action.type === "push") return [...state, action.toast].slice(-MAX_TOASTS);
	return state.filter((t) => t.id !== action.id);
}

/** Errors stay until dismissed (the user must be able to read and act on them); the rest auto-dismiss. */
export function toastTimeoutMs(tone: ToastTone): number | null {
	return tone === "error" ? null : tone === "warning" ? 8000 : 5000;
}

const ICON: Record<ToastTone, IconName> = { info: "info", success: "success", warning: "warning", error: "critical" };

type ToastApi = { notify: (message: string, tone?: ToastTone) => void; dismiss: (id: number) => void };
const Ctx = createContext<ToastApi | null>(null);

function ToastView({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
	const { t } = useI18n();
	useEffect(() => {
		const ms = toastTimeoutMs(toast.tone);
		if (ms === null) return;
		const h = setTimeout(() => onDismiss(toast.id), ms);
		return () => clearTimeout(h);
	}, [toast.id, toast.tone, onDismiss]);
	return (
		<div className="sy-toast" data-tone={toast.tone} data-testid="toast">
			<Icon name={ICON[toast.tone]} size={18} />
			<span className="sy-toast__msg">{toast.message}</span>
			<button type="button" className="sy-toast__close" aria-label={t("common.close")} onClick={() => onDismiss(toast.id)}>
				<Icon name="close" size={14} />
			</button>
		</div>
	);
}

/** Two always-mounted live regions: polite for status messages, assertive for errors (regions must exist before content is injected). */
export function ToastProvider({ children }: { children: ReactNode }) {
	const { t } = useI18n();
	const [toasts, dispatch] = useReducer(toastReducer, []);
	const seq = useRef(0);
	const notify = useCallback((message: string, tone: ToastTone = "info") => {
		seq.current += 1;
		dispatch({ type: "push", toast: { id: seq.current, tone, message } });
	}, []);
	const dismiss = useCallback((id: number) => dispatch({ type: "dismiss", id }), []);
	const api = useMemo(() => ({ notify, dismiss }), [notify, dismiss]);
	return (
		<Ctx.Provider value={api}>
			{children}
			<section className="sy-toasts" aria-label={t("toast.region")}>
				<div role="status" aria-live="polite" aria-atomic="false" className="sy-toasts__region">
					{toasts
						.filter((x) => x.tone !== "error")
						.map((x) => (
							<ToastView key={x.id} toast={x} onDismiss={dismiss} />
						))}
				</div>
				<div role="alert" aria-live="assertive" aria-atomic="false" className="sy-toasts__region">
					{toasts
						.filter((x) => x.tone === "error")
						.map((x) => (
							<ToastView key={x.id} toast={x} onDismiss={dismiss} />
						))}
				</div>
			</section>
		</Ctx.Provider>
	);
}

export function useToast(): ToastApi {
	const v = useContext(Ctx);
	if (!v) throw new Error("ToastProvider missing");
	return v;
}
