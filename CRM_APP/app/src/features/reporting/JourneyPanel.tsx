import { useMemo, useState } from "react";
import { isApiError, isForbidden } from "../../api/index.ts";
import {
	Button,
	DataGrid,
	EmptyState,
	ForbiddenState,
	type GridColumn,
	type GridSample,
	Bdi,
	Select,
	useCursorList,
	useI18n,
} from "../../ui/index.ts";
import { fetchContactRefsPage } from "../tasks/api.ts";
import { fetchJourneyPage } from "./api.ts";
import { type JourneyEvent, sortChronological } from "./model.ts";
import { ContactLink, useReportFmt } from "./shared.tsx";

type ContactRef = { id: string; display_name: string };
const refId = (c: ContactRef) => c.id;
const eventId = (e: JourneyEvent) => e.id;

export function JourneyPanel({ resetKey }: { resetKey: string }) {
	const { t } = useI18n();
	const contacts = useCursorList<ContactRef>(fetchContactRefsPage, {
		getId: refId,
		resetKey,
	});
	const [contactId, setContactId] = useState("");

	if (contacts.status === "error" && isForbidden(contacts.error))
		return <ForbiddenState />;
	return (
		<div className="sy-rep__main">
			<Select
				label={t("rep.journey.contact")}
				value={contactId}
				onChange={(e) => setContactId(e.target.value)}
				data-testid="journey-contact"
				{...(contacts.status === "error"
					? { error: t("rep.journey.contactsFailed") }
					: {})}
			>
				<option value="">{t("rep.journey.pick")}</option>
				{contacts.items.map((c) => (
					<option key={c.id} value={c.id}>
						{c.display_name}
					</option>
				))}
			</Select>
			{contacts.sample ? (
				<div>
					<Button
						size="sm"
						loading={contacts.loadingMore}
						onClick={contacts.loadMore}
						disabled={contacts.atCap}
						data-testid="journey-more-contacts"
					>
						{t("rep.journey.more")}
					</Button>
				</div>
			) : null}
			{contactId ? (
				<ContactJourney key={`${contactId}|${resetKey}`} contactId={contactId} />
			) : (
				<EmptyState title={t("rep.journey.none")} />
			)}
		</div>
	);
}

function ContactJourney({ contactId }: { contactId: string }) {
	const { t } = useI18n();
	const f = useReportFmt();
	const fetchPage = useMemo(() => fetchJourneyPage(contactId), [contactId]);
	const list = useCursorList<JourneyEvent>(fetchPage, { getId: eventId });
	const rows = useMemo(() => sortChronological(list.items), [list.items]);

	const columns = useMemo<ReadonlyArray<GridColumn<JourneyEvent>>>(
		() => [
			{
				id: "event",
				header: t("rep.col.event"),
				value: (e) => f.label(e.name),
				sortable: true,
				hideable: false,
				cell: (e) => <b>{f.label(e.name)}</b>,
			},
			{
				id: "occurred",
				header: t("rep.col.occurred"),
				value: (e) => e.occurred_at,
				searchable: false,
				sortable: true,
				cell: (e) => <Bdi>{f.utc(e.occurred_at)}</Bdi>,
			},
			{
				id: "received",
				header: t("rep.col.received"),
				value: (e) => e.received_at,
				searchable: false,
				sortable: true,
				cell: (e) => <Bdi>{f.utc(e.received_at)}</Bdi>,
			},
			{
				id: "source",
				header: t("rep.col.source"),
				value: (e) => e.source ?? "",
				sortable: true,
			},
		],
		[t, f],
	);
	const sample: GridSample = {
		loaded: list.items.length,
		hasMore: list.sample,
		loadingMore: list.loadingMore,
		atCap: list.atCap,
		failed: list.moreError !== null,
		onLoadMore: list.loadMore,
	};
	return (
		<>
			<p>
				<ContactLink id={contactId} />
			</p>
			{list.status === "error" && isForbidden(list.error) ? (
				<ForbiddenState />
			) : (
				<DataGrid<JourneyEvent>
					gridId="report-journey"
					label={t("rep.grid.journey")}
					rows={rows}
					columns={columns}
					getRowId={eventId}
					status={list.status}
					onRetry={list.reload}
					requestId={isApiError(list.error) ? list.error.requestId : null}
					sample={sample}
					emptyTitle={t("rep.empty")}
				/>
			)}
		</>
	);
}
