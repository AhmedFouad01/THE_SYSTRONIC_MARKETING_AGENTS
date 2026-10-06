import { useEffect, useState } from "react";
import { Dialog, Select, useI18n } from "../ui/index.ts";

/** Small "pick one value and apply it to the N selected rows" dialog (Change status, Move stage). */
export function BulkChoiceDialog({
	open,
	onClose,
	title,
	label,
	options,
	count,
	onConfirm,
	testId,
}: {
	open: boolean;
	onClose: () => void;
	title: string;
	label: string;
	options: ReadonlyArray<{ value: string; label: string }>;
	count: number;
	onConfirm: (value: string) => void;
	testId: string;
}) {
	const { t, formatNumber } = useI18n();
	const [value, setValue] = useState("");
	useEffect(() => {
		if (open) setValue("");
	}, [open]);
	return (
		<Dialog
			open={open}
			onClose={onClose}
			title={title}
			description={t("bulk.dialogCount", { count: formatNumber(count) })}
			testId={testId}
			confirm={{
				label: t("bulk.apply"),
				tone: "primary",
				onConfirm: () => {
					if (value !== "") onConfirm(value);
				},
			}}
		>
			<Select
				label={label}
				value={value}
				onChange={(e) => setValue(e.target.value)}
				data-testid={`${testId}-select`}
			>
				<option value="">{t("common.choose")}</option>
				{options.map((o) => (
					<option key={o.value} value={o.value}>
						{o.label}
					</option>
				))}
			</Select>
		</Dialog>
	);
}
