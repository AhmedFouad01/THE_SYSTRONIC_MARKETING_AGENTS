import { href, navigate } from "../../router.ts";
import { type TaskRow, relatedTarget } from "./model.ts";

/** Link to the related deal/contact via `?select=` (the destination screen opens that record's detail). */
export function RelatedLink({
	row,
}: {
	row: Pick<TaskRow, "relatedKind" | "relatedId" | "relatedName">;
}) {
	const target = relatedTarget(row);
	if (target === null) return <span className="sy-tasks__muted m-0 mt-4 text-text-3">—</span>;
	return (
		<a
			className="sy-tasks__link text-text no-underline hover:text-interactive focus-visible:text-interactive"
			href={href(target.route) + target.search}
			data-testid="task-related"
			onClick={(e) => {
				e.preventDefault();
				navigate(target.route, target.search);
			}}
		>
			<bdi>{row.relatedName}</bdi>
		</a>
	);
}
