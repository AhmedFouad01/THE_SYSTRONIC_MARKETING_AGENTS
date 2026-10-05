import { INTL_LOCALE, StatusPill, useI18n } from "../../ui/index.ts";
import { dayDiff, type DueBucket } from "./model.ts";

/** Due instant (Intl, medium date + short time), a relative day hint, and an overdue badge. */
export function DueLabel({
	dueAt,
	bucket,
	now,
}: {
	dueAt: string | null;
	bucket: DueBucket;
	now: Date;
}) {
	const { t, locale, formatDate } = useI18n();
	if (dueAt === null || Number.isNaN(Date.parse(dueAt)))
		return <span className="sy-tasks__muted">{t("tasks.noDue")}</span>;
	const due = new Date(dueAt);
	const relative = new Intl.RelativeTimeFormat(INTL_LOCALE[locale], {
		numeric: "auto",
	}).format(dayDiff(due, now), "day");
	return (
		<span className="sy-tasks__due">
			<span>
				{formatDate(due, { dateStyle: "medium", timeStyle: "short" })}
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
