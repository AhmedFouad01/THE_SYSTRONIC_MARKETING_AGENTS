import { Bdi, INTL_LOCALE, StatusPill, useI18n } from "../../ui/index.ts";
import { dayDiff, type DueBucket } from "./model.ts";

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
	const { t, locale, formatDateTime, formatDate } = useI18n();
	if (dueAt === null || Number.isNaN(Date.parse(dueAt)))
		return <span className="sy-tasks__muted">{t("tasks.noDue")}</span>;
	const due = new Date(dueAt);
	if (compact)
		return (
			<span className="sy-tasks__due sy-tasks__due--compact" title={formatDateTime(due)}>
				<Bdi>{formatDate(due, { month: "short", day: "numeric" })}</Bdi>
				{bucket === "overdue" ? (
					<span data-testid="overdue-badge">
						<StatusPill tone="danger">{t("tasks.overdue")}</StatusPill>
					</span>
				) : null}
			</span>
		);
	const relative = new Intl.RelativeTimeFormat(INTL_LOCALE[locale], {
		numeric: "auto",
	}).format(dayDiff(due, now), "day");
	return (
		<span className="sy-tasks__due">
			<span>
				<Bdi>{formatDateTime(due)}</Bdi>
			</span>
			<span className="sy-tasks__muted">{relative}</span>
			{bucket === "overdue" ? (
				<span data-testid="overdue-badge">
					<StatusPill tone="danger">{t("tasks.overdue")}</StatusPill>
				</span>
			) : null}
		</span>
	);
}
