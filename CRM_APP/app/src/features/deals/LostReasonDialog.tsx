import { useState } from "react";
import { Dialog, Textarea, useI18n } from "../../ui/index.ts";
import { MAX_REASON, type Stage, validateReason } from "./model.ts";

/**
 * Reason prompt for moves into a "lost" stage (client mirrors server LOSS_REASON_REQUIRED). Owns its draft
 * and validation; the parent closes it from `onConfirm`/`onCancel`. Mount per target (`key`) for a clean draft.
 */
export function LostReasonDialog({
	stage,
	busy = false,
	onCancel,
	onConfirm,
}: {
	stage: Stage | null;
	busy?: boolean;
	onCancel: () => void;
	onConfirm: (stage: Stage, reason: string) => void;
}) {
	const { t } = useI18n();
	const [reason, setReason] = useState("");
	const [issue, setIssue] = useState<string | null>(null);
	const confirm = () => {
		if (stage === null) return;
		const v = validateReason(stage, reason);
		if (v !== null) {
			setIssue(
				t(
					v === "reasonRequired"
						? "deals.lost.reasonRequired"
						: "deals.lost.reasonTooLong",
				),
			);
			return;
		}
		onConfirm(stage, reason);
		setReason("");
	};
	return (
		<Dialog
			open={stage !== null}
			onClose={() => {
				if (busy) return;
				setReason("");
				setIssue(null);
				onCancel();
			}}
			title={t("deals.lost.title")}
			description={t("deals.lost.body")}
			testId="lost-dialog"
			confirm={{
				label: t("deals.lost.confirm"),
				tone: "danger",
				loading: busy,
				onConfirm: confirm,
			}}
		>
			<Textarea
				label={t("deals.lost.reason")}
				name="reason"
				required
				value={reason}
				maxLength={MAX_REASON}
				error={issue ?? undefined}
				onChange={(e) => {
					setIssue(null);
					setReason(e.target.value);
				}}
			/>
		</Dialog>
	);
}
