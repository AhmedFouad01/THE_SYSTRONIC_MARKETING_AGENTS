import { type ReactNode, useCallback, useMemo, useRef, useState } from "react";
import { useI18n } from "../i18n/index.ts";
import { Dialog } from "./Dialog.tsx";

/** Lets the edit form tell the preview panel it holds unsaved changes; every way out consults `request`. */
export type PreviewGuard = {
	setDirty: (dirty: boolean) => void;
	/** Runs `proceed` now, or after the user confirms discarding when the form is dirty. */
	request: (proceed: () => void) => void;
};

/** Owned by the screen (it also owns the open record id); render `dialog` once next to the other dialogs. */
export function usePreviewGuard(): { guard: PreviewGuard; dialog: ReactNode } {
	const { t } = useI18n();
	const dirty = useRef(false);
	const [pending, setPending] = useState<(() => void) | null>(null);
	const setDirty = useCallback((v: boolean) => {
		dirty.current = v;
	}, []);
	const request = useCallback((proceed: () => void) => {
		if (dirty.current) setPending(() => proceed);
		else proceed();
	}, []);
	const guard = useMemo(() => ({ setDirty, request }), [setDirty, request]);
	const dialog = (
		<Dialog
			open={pending !== null}
			onClose={() => setPending(null)}
			title={t("preview.discard.title")}
			description={t("preview.discard.body")}
			testId="preview-discard-dialog"
			confirm={{
				label: t("preview.discard.confirm"),
				onConfirm: () => {
					const go = pending;
					dirty.current = false;
					setPending(null);
					go?.();
				},
			}}
		/>
	);
	return { guard, dialog };
}
