import { useEffect, useState } from "react";
import { navigate } from "../../router.ts";
import { AddTaskButton } from "../tasks/index.ts";
import { dealContextSearch } from "../deals/model.ts";
import { type CustomFields, CustomFieldsEdit, CustomFieldsRead, useCustomDraft, useCustomFields, withProperties } from "../properties/index.ts";
import { isApiError, isForbidden, isVersionConflict, useIsAdmin } from "../../api/index.ts";
import {
	Badge,
	Bdi,
	Button,
	EmptyState,
	ErrorState,
	ForbiddenState,
	Input,
	LoadingState,
	Ltr,
	type MessageKey,
	Popover,
	PreviewPanel,
	RecordEditFooter,
	RecordPanel,
	type RecordPreview,
	Select,
	sourceLabel,
	Tabs,
	useCursorList,
	useI18n,
	useToast,
} from "../../ui/index.ts";
import {
	fetchContact,
	fetchDuplicates,
	journeyFetcher,
	patchContact,
} from "./api.ts";
import {
	type Assignee,
	buildPatchBody,
	type Contact,
	type ContactRow,
	draftOf,
	type Duplicate,
	buildAddIdentifierBody,
	type IdentifierKind,
	identifierView,
	type JourneyEvent,
	journeyActionKey,
	sortJourney,
	validateIdentifier,
} from "./model.ts";

type EditError = null | "conflict" | "forbidden" | "other";
type TabId = "overview" | "journey" | "duplicates";

function ContactEditor({
	contact,
	assignees,
	cf,
	onUpdated,
	onDone,
}: {
	contact: ContactRow;
	assignees: readonly Assignee[];
	cf: CustomFields;
	onUpdated: (c: Contact) => void;
	onDone: () => void;
}) {
	const { t } = useI18n();
	const toast = useToast();
	const [draft, setDraft] = useState(() => draftOf(contact));
	const [saving, setSaving] = useState(false);
	const [reloading, setReloading] = useState(false);
	const [error, setError] = useState<EditError>(null);
	const [touched, setTouched] = useState(false);

	const custom = useCustomDraft(cf, "edit");
	const dirty = buildPatchBody(contact, draft, "x") !== null || custom.dirty;
	const ownerOptions =
		assignees.some((a) => a.id === contact.owner_id) || !contact.owner_id
			? assignees
			: [...assignees, { id: contact.owner_id, name: contact.ownerName }];

	const save = async () => {
		setTouched(true);
		if (draft.name.trim() === "") return;
		const c = custom.prepare();
		if (!c.ok) return;
		const id = crypto.randomUUID();
		const body = withProperties(buildPatchBody(contact, draft, id), c.patch, { commandId: id, version: contact.version });
		if (body === null) return;
		setSaving(true);
		setError(null);
		try {
			onUpdated(await patchContact(contact.id, body));
			toast.notify(t("contacts.edit.saved"), "success");
			onDone();
		} catch (e) {
			if (custom.fail(e)) return;
			setError(
				isVersionConflict(e)
					? "conflict"
					: isForbidden(e)
						? "forbidden"
						: "other",
			);
			if (!isVersionConflict(e) && !isForbidden(e))
				toast.notify(
					isApiError(e) && e.safeMessage
						? e.safeMessage
						: t("contacts.edit.failed"),
					"error",
				);
		} finally {
			setSaving(false);
		}
	};

	const reload = async () => {
		setReloading(true);
		try {
			onUpdated(await fetchContact(contact.id));
		} catch {
			toast.notify(t("contacts.edit.failed"), "error");
		} finally {
			setReloading(false);
		}
	};

	return (
		<form
			className="sy-contacts__form flex flex-col gap-10"
			onSubmit={(e) => {
				e.preventDefault();
				void save();
			}}
			noValidate
		>
			{error === "conflict" ? (
				<div
					className="sy-contacts__banner m-0 p-10 rounded-8 bg-info-bg text-info-fg [&_p]:m-0 [&_p]:mt-4 [&_p]:mb-8"
					role="alert"
					data-testid="contact-conflict"
				>
					<b>{t("contacts.conflict.title")}</b>
					<p>{t("contacts.conflict.body")}</p>
					<Button
						size="sm"
						variant="primary"
						loading={reloading}
						onClick={() => void reload()}
						data-testid="contact-reload"
					>
						{t("contacts.conflict.reload")}
					</Button>
				</div>
			) : null}
			{error === "forbidden" ? (
				<div data-testid="contact-forbidden">
					<ForbiddenState
						title={t("contacts.forbidden.title")}
						hint={t("contacts.forbidden.body")}
					/>
				</div>
			) : null}
			<Input
				label={t("contacts.field.name")}
				value={draft.name}
				maxLength={160}
				name="name"
				error={
					touched && draft.name.trim() === ""
						? t("contacts.edit.nameRequired")
						: undefined
				}
				onChange={(e) => {
					setTouched(false);
					setDraft({ ...draft, name: e.target.value });
				}}
			/>
			<Select
				label={t("contacts.field.owner")}
				value={draft.ownerId}
				onChange={(e) => setDraft({ ...draft, ownerId: e.target.value })}
				name="owner"
			>
				{contact.owner_id ? null : (
					<option value="">{t("common.unassigned")}</option>
				)}
				{ownerOptions.map((a) => (
					<option key={a.id} value={a.id}>
						{a.name}
					</option>
				))}
			</Select>
			<CustomFieldsEdit cf={cf} draft={custom} mode="edit" />
			<RecordEditFooter
				dirty={dirty}
				saving={saving}
				saveLabel={t("contacts.edit.save")}
				saveTestId="contact-save"
			/>
		</form>
	);
}

function JourneyList({ contactId }: { contactId: string }) {
	const { t, formatDateTime } = useI18n();
	const list = useCursorList<JourneyEvent>(journeyFetcher(contactId), {
		getId: (e) => e.id,
		resetKey: contactId,
	});
	if (list.status === "loading") return <LoadingState />;
	if (list.status === "error")
		return (
			<ErrorState
				title={t("contacts.journey.failed")}
				onRetry={list.reload}
			/>
		);
	if (list.items.length === 0)
		return <EmptyState title={t("contacts.journey.empty")} />;
	return (
		<div data-testid="journey">
			<ol className="sy-contacts__list list-none m-0 p-0 flex flex-col gap-8">
				{sortJourney(list.items).map((e) => {
					const key = journeyActionKey(e.name);
					return (
						<li
							key={e.id}
							className="sy-contacts__item flex flex-wrap justify-between items-center gap-8 py-6 border-b border-solid border-border min-w-0 [overflow-wrap:anywhere]"
							data-testid="journey-item"
						>
							<span>
								{key ? (
									t(`contacts.journey.${key}` as MessageKey)
								) : (
									<Ltr>{e.name}</Ltr>
								)}
							</span>
							<span className="sy-contacts__when text-text-3">
								<Bdi>{formatDateTime(e.occurred_at)}</Bdi>
							</span>
						</li>
					);
				})}
			</ol>
			{list.sample ? (
				<Button
					size="sm"
					loading={list.loadingMore}
					disabled={list.atCap}
					onClick={list.loadMore}
					data-testid="journey-more"
				>
					{t("grid.loadMore")}
				</Button>
			) : null}
		</div>
	);
}

type DupState =
	| { s: "loading" }
	| { s: "forbidden" }
	| { s: "error" }
	| { s: "ready"; items: Duplicate[] };

function DuplicatesList({
	contact,
	canMerge,
	onMerge,
}: {
	contact: ContactRow;
	canMerge: boolean;
	onMerge: (d: Duplicate) => void;
}) {
	const { t } = useI18n();
	const [state, setState] = useState<DupState>({ s: "loading" });
	// biome-ignore lint/correctness/useExhaustiveDependencies: refetched when the contact changes version (e.g. after a merge)
	useEffect(() => {
		const ctrl = new AbortController();
		setState({ s: "loading" });
		fetchDuplicates(contact.id, ctrl.signal)
			.then((items) => setState({ s: "ready", items }))
			.catch((e: unknown) => {
				if (e instanceof DOMException) return;
				setState(isForbidden(e) ? { s: "forbidden" } : { s: "error" });
			});
		return () => ctrl.abort();
	}, [contact.id, contact.version]);

	if (state.s === "loading") return <LoadingState />;
	if (state.s === "forbidden")
		return (
			<ForbiddenState
				title={t("contacts.dup.forbiddenTitle")}
				hint={t("contacts.dup.forbiddenHint")}
			/>
		);
	if (state.s === "error")
		return <ErrorState title={t("contacts.dup.failed")} />;
	if (state.items.length === 0)
		return <EmptyState title={t("contacts.dup.empty")} />;
	return (
		<div data-testid="duplicates">
			<p className="sy-contacts__muted m-0 mt-4 text-text-3">{t("contacts.dup.hint")}</p>
			{canMerge ? null : (
				<p
					className="sy-contacts__muted m-0 mt-4 text-text-3"
					id="merge-blocked"
					data-testid="merge-blocked"
				>
					{t("contacts.dup.mergeBlocked")}
				</p>
			)}
			<ul className="sy-contacts__list list-none m-0 p-0 flex flex-col gap-8">
				{state.items.map((d) => (
					<li
						key={d.id}
						className="sy-contacts__item flex flex-wrap justify-between items-center gap-8 py-6 border-b border-solid border-border min-w-0 [overflow-wrap:anywhere]"
						data-testid="duplicate-item"
					>
						<span>
							<b>
								<Bdi>{d.display_name}</Bdi>
							</b>
						</span>
						<Button
							size="sm"
							variant="primary"
							disabled={!canMerge}
							aria-describedby={canMerge ? undefined : "merge-blocked"}
							onClick={() => onMerge(d)}
							data-testid="duplicate-merge"
						>
							{t("contacts.dup.merge")}
						</Button>
					</li>
				))}
			</ul>
		</div>
	);
}

/** "+ Add" popover: one phone/email per submit, saved immediately (PATCH) instead of an always-open form (UX-19). */
function AddIdentifier({
	contact,
	onUpdated,
}: {
	contact: ContactRow;
	onUpdated: (c: Contact) => void;
}) {
	const { t } = useI18n();
	const toast = useToast();
	return (
		<Popover
			icon="plus"
			triggerLabel={t("contacts.id.add")}
			label={t("contacts.id.addLabel")}
			testId="identifier-add"
		>
			{(close) => (
				<AddIdentifierForm
					contact={contact}
					onSaved={(c) => {
						onUpdated(c);
						toast.notify(t("contacts.id.added"), "success");
						close();
					}}
				/>
			)}
		</Popover>
	);
}

function AddIdentifierForm({
	contact,
	onSaved,
}: {
	contact: ContactRow;
	onSaved: (c: Contact) => void;
}) {
	const { t } = useI18n();
	const [kind, setKind] = useState<IdentifierKind>("phone");
	const [value, setValue] = useState("");
	const [touched, setTouched] = useState(false);
	const [saving, setSaving] = useState(false);
	const [failed, setFailed] = useState<null | "conflict" | "other">(null);
	const issue = validateIdentifier(kind, value);
	const submit = async () => {
		setTouched(true);
		const body = buildAddIdentifierBody(contact, kind, value, crypto.randomUUID());
		if (body === null) return;
		setSaving(true);
		setFailed(null);
		try {
			onSaved(await patchContact(contact.id, body));
		} catch (e) {
			setFailed(isVersionConflict(e) ? "conflict" : "other");
		} finally {
			setSaving(false);
		}
	};
	return (
		<form
			className="sy-contacts__form flex flex-col gap-10"
			noValidate
			onSubmit={(e) => {
				e.preventDefault();
				void submit();
			}}
		>
			<Select
				label={t("contacts.field.idKind")}
				value={kind}
				onChange={(e) => setKind(e.target.value as IdentifierKind)}
				name="idKind"
			>
				<option value="phone">{t("common.phone")}</option>
				<option value="email">{t("common.email")}</option>
			</Select>
			<Input
				label={t("contacts.field.idValue")}
				value={value}
				dir="ltr"
				name="idValue"
				error={
					touched && (issue || value.trim() === "")
						? t(kind === "phone" ? "contacts.issue.phone" : "contacts.issue.email")
						: failed === "other"
							? t("contacts.id.failed")
							: failed === "conflict"
								? t("contacts.conflict.title")
								: undefined
				}
				onChange={(e) => {
					setTouched(false);
					setFailed(null);
					setValue(e.target.value);
				}}
			/>
			<Button type="submit" variant="primary" size="sm" loading={saving} data-testid="identifier-add-submit">
				{t("contacts.id.submit")}
			</Button>
		</form>
	);
}

/** Keyed by contact id by the parent: tab and fetched identifiers reset when another contact is selected. */
function ContactBody({
	contact,
	canMerge,
	onMerge,
	onUpdated,
}: {
	contact: ContactRow;
	canMerge: boolean;
	onMerge: (d: Duplicate) => void;
	onUpdated: (c: Contact) => void;
}) {
	const { t } = useI18n();
	const [tab, setTab] = useState<TabId>("overview");
	const [full, setFull] = useState<Contact | null>(null);
	const [failed, setFailed] = useState(false);
	// biome-ignore lint/correctness/useExhaustiveDependencies: identifiers are re-read when the version changes
	useEffect(() => {
		let live = true;
		fetchContact(contact.id)
			.then((c) => {
				if (live) {
					setFull(c);
					setFailed(false);
				}
			})
			.catch(() => {
				if (live) setFailed(true);
			});
		return () => {
			live = false;
		};
	}, [contact.id, contact.version]);

	const ids = identifierView(full ?? contact);
	const overview = (
		<div>
			<section aria-label={t("contacts.identifiers.title")}>
				<div className="sy-contacts__section-head flex items-center justify-between gap-8 [&_h3]:m-0">
					<h3 className="sy-contacts__muted m-0 mt-4 text-text-3">
						{t("contacts.identifiers.title")}
					</h3>
					<AddIdentifier contact={contact} onUpdated={onUpdated} />
				</div>
				{failed ? (
					<p role="status">{t("contacts.detail.failed")}</p>
				) : full === null ? null : ids.state === "visible" ? (
					<ul className="sy-contacts__list list-none m-0 p-0 flex flex-col gap-8" data-testid="identifiers">
						{ids.items.map((i) => (
							<li key={i.id} className="sy-contacts__item flex flex-wrap justify-between items-center gap-8 py-6 border-b border-solid border-border min-w-0 [overflow-wrap:anywhere]">
								<Badge tone="neutral">
									{t(i.kind === "phone" ? "common.phone" : "common.email")}
								</Badge>
								<Ltr>{i.value}</Ltr>
							</li>
						))}
					</ul>
				) : (
					<div data-testid="identifiers-hidden">
						<p>{t("contacts.identifiers.hidden")}</p>
						<p className="sy-contacts__muted m-0 mt-4 text-text-3">
							{t("contacts.identifiers.hiddenHint")}
						</p>
					</div>
				)}
			</section>
		</div>
	);
	return (
		<Tabs
			label={t("contacts.tabs")}
			value={tab}
			onChange={(id) => setTab(id as TabId)}
			tabs={[
				{ id: "overview", label: t("contacts.tab.overview"), panel: overview },
				{
					id: "journey",
					label: t("contacts.tab.journey"),
					panel: <JourneyList contactId={contact.id} />,
				},
				{
					id: "duplicates",
					label: t("contacts.tab.duplicates"),
					panel: (
						<DuplicatesList
							contact={contact}
							canMerge={canMerge}
							onMerge={onMerge}
						/>
					),
				},
			]}
		/>
	);
}

export function ContactDetail({
	contact,
	state,
	epoch,
	assignees,
	canMerge,
	onUpdated,
	onMerge,
	onClose,
	preview,
}: {
	contact: ContactRow | null;
	/** Why there is no record yet: still fetching by id, or the id does not exist / is not visible. */
	state: "loading" | "missing";
	/** Bumped by a merge: the panel body remounts (overview tab, fresh identifiers) without re-opening the slide-over. */
	epoch: number;
	assignees: readonly Assignee[];
	canMerge: boolean;
	onUpdated: (c: Contact) => void;
	onMerge: (d: Duplicate) => void;
	onClose: () => void;
	preview: RecordPreview;
}) {
	const { t } = useI18n();
	const isAdmin = useIsAdmin();
	const cf = useCustomFields("contact", "contacts", contact?.id ?? null, contact?.version ?? null);
	if (contact === null)
		return (
			<PreviewPanel
				label={t("contacts.detail.title")}
				testId="contact-detail"
				onClose={onClose}
				{...(preview.returnFocus ? { returnFocus: preview.returnFocus } : {})}
			>
				<p className="sy-record__muted" role="status" data-testid={`contact-detail-${state}`}>
					{state === "loading" ? t("preview.loading") : t("preview.missing")}
				</p>
			</PreviewPanel>
		);
	return (
		<RecordPanel
			label={t("contacts.detail.title")}
			testId="contact-detail"
			recordKey={`${contact.id}:${epoch}`}
			heading={contact.display_name}
			preview={preview}
			title={<Bdi>{contact.display_name}</Bdi>}
			titleTestId="contact-detail-title"
			subtitle={contact.ownerName}
			onClose={onClose}
			actions={
				<>
					<Button
						size="sm"
						variant="primary"
						icon="deals"
						data-testid="contact-create-deal"
						onClick={() =>
							navigate(
								"/deals",
								dealContextSearch({
									contactId: contact.id,
									leadId: null,
									dealId: null,
								}),
							)
						}
					>
						{t("deals.action.create")}
					</Button>
					<AddTaskButton
						contactId={contact.id}
						dealId={null}
						label={contact.display_name}
					/>
				</>
			}
			facts={[
				{ label: t("common.owner"), value: <Bdi>{contact.ownerName}</Bdi> },
				{ label: t("common.source"), value: sourceLabel(contact.source, t) },
			]}
			editor={(done) => (
				<ContactEditor
					key={`${contact.id}:${contact.version}`}
					contact={contact}
					assignees={assignees}
					cf={cf}
					onUpdated={onUpdated}
					onDone={done}
				/>
			)}
			details={
				isAdmin
					? [
				{ label: t("contacts.detail.id"), value: contact.id, copyable: true },
				{
					label: t("contacts.detail.version"),
					value: contact.version,
					testId: "contact-version",
				},
					]
					: undefined
			}
		>
			<CustomFieldsRead cf={cf} />
			<ContactBody
				key={contact.id}
				contact={contact}
				canMerge={canMerge}
				onMerge={onMerge}
				onUpdated={onUpdated}
			/>
		</RecordPanel>
	);
}
