import { useEffect, useRef, useState } from "react";
import { useSession } from "../../api/index.ts";
import {
	BidiText,
	Badge,
	Button,
	Dialog,
	EmptyState,
	ErrorState,
	ForbiddenState,
	IconButton,
	Icon,
	type MessageKey,
	PageHeader,
	SkeletonRows,
	Tabs,
	useI18n,
	useToast,
} from "../../ui/index.ts";
import { archiveProperty, orderProperties } from "./api.ts";
import { Check, MoveButtons } from "./controls.tsx";
import { GroupsDialog } from "./GroupsDialog.tsx";
import { useSchema } from "./hooks.ts";
import { ManageOptionsDialog } from "./ManageOptionsDialog.tsx";
import {
	classifyWriteError,
	countKey,
	groupProperties,
	isSelectType,
	moveProperty,
	OBJECTS,
	type ObjectKey,
	type ObjectSchema,
	pickLabel,
	type PropertyDef,
	type WriteErrorKind,
} from "./model.ts";
import { PropertyDialog } from "./PropertyDialog.tsx";
import { useCommand } from "./useCommand.ts";
import "./properties.css";

type Dialogs = { kind: "create" } | { kind: "edit"; key: string } | { kind: "options"; key: string } | { kind: "groups" } | { kind: "archive"; key: string } | null;

const PAGE_ERRORS: Record<WriteErrorKind, MessageKey> = {
	validation: "props.err.validation",
	conflict: "props.conflict",
	exists: "props.err.exists",
	forbidden: "props.err.forbidden",
	network: "props.err.network",
	limit: "props.err.limit",
	notEmpty: "props.err.notEmpty",
	system: "props.err.system",
	other: "props.err.other",
};

function PropertyRow({
	p,
	index,
	count,
	manage,
	busy,
	onEdit,
	onOptions,
	onArchive,
	onMove,
}: {
	p: PropertyDef;
	index: number;
	count: number;
	manage: boolean;
	busy: boolean;
	onEdit: () => void;
	onOptions: () => void;
	onArchive: () => void;
	onMove: (dir: -1 | 1) => void;
}) {
	const { t, locale } = useI18n();
	const name = pickLabel(p.label, locale, p.key);
	return (
		<li className={`sy-props__row${p.archived ? " sy-props__row--archived" : ""}`} data-testid="property-row" data-key={p.key}>
			<div className="sy-props__main">
				<span className="sy-props__name" data-testid="property-label">
					<BidiText>{name}</BidiText>
				</span>
				<code className="sy-props__code sy-ltr" data-testid="property-key">
					{p.key}
				</code>
			</div>
			<span className="sy-props__type" data-testid="property-type">
				{t(`props.type.${p.type}` as MessageKey)}
			</span>
			<span className="sy-props__badges">
				{p.is_system ? <Badge tone="info">{t("props.badge.system")}</Badge> : null}
				{p.archived ? <Badge tone="warning">{t("props.badge.archived")}</Badge> : null}
				{p.required ? <Badge>{t("props.badge.required")}</Badge> : null}
				{p.read_only ? <Badge>{t("props.badge.readOnly")}</Badge> : null}
				{p.sensitive ? <Badge tone="danger">{t("props.badge.sensitive")}</Badge> : null}
			</span>
			{manage && !p.archived ? (
				<span className="sy-props__actions">
					{isSelectType(p.type) ? (
						<Button size="sm" data-testid="property-options" aria-label={`${t("props.action.options")}: ${name}`} onClick={onOptions}>
							{t("props.action.options")}
						</Button>
					) : (
						<span />
					)}
					<MoveButtons
						idPrefix={`prop-${p.key}`}
						upLabel={t("props.action.up")}
						downLabel={t("props.action.down")}
						disableUp={index === 0}
						disableDown={index === count - 1}
						busy={busy}
						onUp={() => onMove(-1)}
						onDown={() => onMove(1)}
					/>
					<Button size="sm" icon="edit" data-testid="property-edit" aria-label={`${t("props.action.edit")}: ${name}`} onClick={onEdit}>
						{t("props.action.edit")}
					</Button>
					{p.is_system ? (
						<span />
					) : (
						<IconButton icon="delete" size="sm" aria-label={`${t("props.action.archive")}: ${name}`} data-testid="property-archive" onClick={onArchive} />
					)}
				</span>
			) : null}
		</li>
	);
}

function Body({
	object,
	schema,
	manage,
	reload,
}: {
	object: ObjectKey;
	schema: ObjectSchema;
	manage: boolean;
	reload: () => Promise<void>;
}) {
	const { t, locale, dir, formatCount } = useI18n();
	const toast = useToast();
	const command = useCommand();
	const [query, setQuery] = useState("");
	const [showArchived, setShowArchived] = useState(false);
	const [dialog, setDialog] = useState<Dialogs>(null);
	const [busy, setBusy] = useState(false);
	const [notice, setNotice] = useState<WriteErrorKind | null>(null);
	const focusAfter = useRef<string | null>(null);
	const groups = groupProperties(schema, { query, showArchived, locale });
	const current = (key: string) => schema.properties.find((p) => p.key === key);

	// after a reorder the moved row keeps keyboard focus on the same arrow (or the other one at the edge)
	// biome-ignore lint/correctness/useExhaustiveDependencies: runs after every schema refresh
	useEffect(() => {
		const id = focusAfter.current;
		if (!id) return;
		focusAfter.current = null;
		const root = document.querySelector("[data-testid=properties-list]");
		const el = root?.querySelector<HTMLButtonElement>(`[data-focus-id="${id}"]:not(:disabled)`) ?? root?.querySelector<HTMLButtonElement>(`[data-focus-id="${id.endsWith("-up") ? id.replace(/-up$/, "-down") : id.replace(/-down$/, "-up")}"]:not(:disabled)`);
		el?.focus();
	}, [schema]);

	const doReload = async () => {
		setNotice(null);
		setDialog(null);
		await reload();
	};
	const saved = (kind: "created" | "updated") => async () => {
		setDialog(null);
		await reload();
		toast.notify(t(kind === "created" ? "props.toast.created" : "props.toast.updated"), "success");
	};
	const move = async (p: PropertyDef, dir: -1 | 1) => {
		const keys = moveProperty(schema, p.key, dir);
		if (!keys) return;
		setBusy(true);
		setNotice(null);
		focusAfter.current = `prop-${p.key}-${dir < 0 ? "up" : "down"}`;
		try {
			await orderProperties(object, command("order", { keys, expected_schema_rev: schema.schema_rev }));
			await reload();
		} catch (e) {
			setNotice(classifyWriteError(e));
		} finally {
			setBusy(false);
		}
	};
	const archive = async (p: PropertyDef) => {
		setBusy(true);
		try {
			await archiveProperty(object, p.key, command(`arch:${p.key}`, { expected_version: p.version }));
			setDialog(null);
			await reload();
			toast.notify(t("props.toast.archived"), "success");
		} catch (e) {
			setDialog(null);
			setNotice(classifyWriteError(e));
		} finally {
			setBusy(false);
		}
	};

	const total = groups.reduce((n, g) => n + g.properties.length, 0);
	const editing = dialog?.kind === "edit" ? current(dialog.key) : undefined;
	const archiving = dialog?.kind === "archive" ? current(dialog.key) : undefined;

	return (
		<div className="sy-props__body">
			<div className="sy-props__toolbar">
				<div className="sy-grid__searchbox sy-props__search">
					<Icon name="search" size={16} />
					<input
						type="search"
						name="q"
						dir={query ? "auto" : dir}
						className="sy-grid__search"
						aria-label={t("props.search")}
						placeholder={t("grid.searchPlaceholder")}
						value={query}
						data-testid="props-search"
						onChange={(e) => setQuery(e.target.value)}
					/>
				</div>
				<Check label={t("props.showArchived")} checked={showArchived} onChange={setShowArchived} testId="show-archived" />
			</div>
			{notice ? (
				<div className="sy-props__banner" role="alert" data-testid="props-notice">
					<p>{t(PAGE_ERRORS[notice])}</p>
					{notice === "conflict" ? (
						<Button onClick={() => void doReload()} data-testid="props-reload">
							{t("props.reload")}
						</Button>
					) : null}
				</div>
			) : null}
			{!manage ? (
				<p className="sy-props__note" data-testid="props-readonly-note">
					{t("props.readOnlyNote")}
				</p>
			) : null}
			{manage ? (
				<div className="sy-props__tools">
					<Button variant="primary" icon="plus" data-testid="property-new" onClick={() => setDialog({ kind: "create" })}>
						{t("props.new")}
					</Button>
					<Button data-testid="groups-manage" onClick={() => setDialog({ kind: "groups" })}>
						{t("props.manageGroups")}
					</Button>
				</div>
			) : null}
			<div data-testid="properties-list">
				{total === 0 && query.trim() !== "" ? <EmptyState title={t("props.empty")} /> : null}
				{groups.map(({ group, properties }) => (
					<section key={group.key} className="sy-props__group" aria-label={pickLabel(group.label, locale, group.key)} data-testid="property-group">
						<h2 className="sy-props__grouphead">
							<BidiText>{pickLabel(group.label, locale, group.key)}</BidiText>
							<span className="sy-props__count">{t(countKey(properties.length, locale), { count: formatCount(properties.length) })}</span>
						</h2>
						{properties.length === 0 ? (
							<p className="sy-props__muted">{t("props.emptyGroup")}</p>
						) : (
							<ul className="sy-props__rows">
								{properties.map((p, i) => (
									<PropertyRow
										key={p.key}
										p={p}
										index={i}
										count={properties.length}
										manage={manage}
										busy={busy || query.trim() !== ""}
										onEdit={() => setDialog({ kind: "edit", key: p.key })}
										onOptions={() => setDialog({ kind: "options", key: p.key })}
										onArchive={() => setDialog({ kind: "archive", key: p.key })}
										onMove={(dir) => void move(p, dir)}
									/>
								))}
							</ul>
						)}
					</section>
				))}
			</div>
			{dialog?.kind === "create" ? (
				<PropertyDialog object={object} schema={schema} onClose={() => setDialog(null)} onSaved={saved("created")} onConflict={() => void doReload()} />
			) : null}
			{editing ? (
				<PropertyDialog
					object={object}
					schema={schema}
					property={editing}
					onClose={() => setDialog(null)}
					onSaved={saved("updated")}
					onConflict={() => void doReload()}
				/>
			) : null}
			{dialog?.kind === "options" ? (
				<ManageOptionsDialog object={object} schema={schema} propertyKey={dialog.key} onClose={() => setDialog(null)} reload={reload} onConflict={() => void doReload()} />
			) : null}
			{dialog?.kind === "groups" ? (
				<GroupsDialog object={object} schema={schema} onClose={() => setDialog(null)} reload={reload} onConflict={() => void doReload()} />
			) : null}
			<Dialog
				open={archiving !== undefined}
				onClose={() => setDialog(null)}
				title={t("props.archive.title")}
				description={t("props.archive.body")}
				testId="archive-dialog"
				confirm={{ label: t("props.archive.confirm"), loading: busy, onConfirm: () => archiving && void archive(archiving) }}
			>
				{archiving ? (
					<p>
						<BidiText>{pickLabel(archiving.label, locale, archiving.key)}</BidiText>
					</p>
				) : null}
			</Dialog>
		</div>
	);
}

/** Settings > Properties (P1b B2). Everyone with schema.read sees it; the write controls need property.manage (session `configure` = manager). */
export function PropertiesView() {
	const { t } = useI18n();
	const session = useSession();
	const manage = session.info?.property_manage ?? session.info?.configure === true;
	const [object, setObject] = useState<ObjectKey>("contact");
	const { state, reload } = useSchema(object);

	let content: React.ReactNode;
	if (state.status === "loading") content = <SkeletonRows count={5} />;
	else if (state.status === "forbidden") content = <ForbiddenState />;
	else if (state.status === "error") content = <ErrorState title={t("props.loadError")} onRetry={() => void reload()} />;
	else content = <Body key={object} object={object} schema={state.schema} manage={manage} reload={reload} />;

	return (
		<div className="sy-props" data-testid="properties-page">
			<PageHeader title={t("props.title")} subtitle={t("props.subtitle")} titleTestId="props-title" />
			<Tabs
				label={t("props.objects")}
				value={object}
				onChange={(id) => setObject(id as ObjectKey)}
				tabs={OBJECTS.map((o) => ({ id: o, label: t(`props.obj.${o}` as MessageKey), ...(o === object ? { panel: content } : {}) }))}
			/>
		</div>
	);
}
