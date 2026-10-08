import { Bdi, INTL_LOCALE, StatusPill, useI18n } from "../../ui/index.ts";
import { dayDiff, type DueBucket, overdueDays } from "./model.ts";

/** Due instant (Intl, medium date + short time), a relative day hint, and an overdue badge. */
export function DueLabel({
	dueAt,
	bucket,
	now,
	compact = false,
}: {
	dueAt: string | null;
	bucket: DueBucket;
	now: Date;
	/** Grid cell: short date + overdue chip on one line (UX-17). */
	compact?: boolean;
}) {
	const { t, locale, formatDateTime, formatDate, formatNumber } = useI18n();
	if (dueAt === null || Number.isNaN(Date.parse(dueAt)))
		return <span className="sy-tasks__muted m-0 mt-4 text-text-3">{t("tasks.noDue")}</span>;
	const due = new Date(dueAt);
	const late = bucket === "overdue" ? overdueDays(due, now) : 0;
	const lateLabel =
		late >= 1 ? t("tasks.overdueDays", { days: formatNumber(late) }) : t("tasks.overdue");
	if (compact)
		return (
			<span className="sy-tasks__due sy-tasks__due--compact inline-flex flex-wrap items-center gap-6 flex-nowrap! whitespace-nowrap" title={formatDateTime(due)}>
				<Bdi>{formatDate(due, { month: "short", day: "numeric" })}</Bdi>
				{bucket === "overdue" ? (
					<span data-testid="overdue-badge">
						<StatusPill tone="danger">{lateLabel}</StatusPill>
					</span>
				) : null}
			</span>
		);
	const relative = new Intl.RelativeTimeFormat(INTL_LOCALE[locale], {
		numeric: "auto",
	}).format(dayDiff(due, now), "day");
	return (
		<span className="sy-tasks__due inline-flex flex-wrap items-center gap-6">
			<span>
				<Bdi>{formatDateTime(due)}</Bdi>
			</span>
			<span className="sy-tasks__muted m-0 mt-4 text-text-3">{relative}</span>
			{bucket === "overdue" ? (
				<span data-testid="overdue-badge">
					<StatusPill tone="danger">{t("tasks.overdue")}</StatusPill>
				</span>
			) : null}
		</span>
	);
}
