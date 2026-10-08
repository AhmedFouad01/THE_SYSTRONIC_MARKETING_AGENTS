// P1b B4 UI: custom fields as list columns, typed filter rows and sort on the column header (Leads, Contacts, Deals, Tasks).
// One hook per list screen; it feeds the existing DataGrid (extra columns, ServerSpec sort map, `extra` filter nodes, `props=`) and
// returns the toolbar/filter-panel pieces the grid hosts through its `extension` prop. Plain in-house controls, no new dependency.
import { Button as AriaButton } from "react-aria-components";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isForbidden, sessionStore, useSession } from "../../api/index.ts";
import {
	BidiText,
	Button,
	DatePicker,
	Checkbox,
	type GridColumn,
	type GridExtension,
	IconButton,
	Icon,
	Input,
	type MessageKey,
	Popover,
	safeLocalStorage,
	Select,
	type ServerCond,
	type ServerNode,
	type ServerSpec,
	useI18n,
} from "../../ui/index.ts";
import { fetchAssignees } from "../leads/api.ts";
import { fetchRecordSchema } from "./api.ts";
import { ReadValueView, useReadCtx } from "./CustomFields.tsx";
import {
	cfId,
	columnsKey,
	type FilterDraft,
	isSortable,
	listable,
	listChoices,
	MAX_COLUMNS,
	MAX_FILTERS,
	newDraft,
	type Op,
	opsOf,
	parseShown,
	propsParam,
	shapeOf,
	toCondition,
	toConditions,
	toggleShown,
} from "./customColumns.ts";
import { type ObjectKey, pickLabel, type PropertyDef } from "./model.ts";
import { type ReadCtx, readValue } from "./values.ts";
import "./properties-kit.css";

export type CustomColumns<T> = {
	/** Sort map + the screen's own spec: custom keys sort by their own name. */
	spec: ServerSpec;
	/** Conditions of the complete filter rows (AND-ed with the screen's own). */
	extra: readonly ServerNode[];
	/** `props=` value (shown custom keys) or undefined. */
	props: string | undefined;
	columns: ReadonlyArray<GridColumn<T>>;
	/** undefined = nothing to offer (no schema.read, no custom fields, still loading): the grid is unchanged. */
	extension: GridExtension | undefined;
};

type Opts<T> = {
	object: ObjectKey;
	gridId: string;
	baseSpec: ServerSpec;
	/** The row's custom values (list `properties`). */
	getProps: (row: T) => Record<string, unknown>;
};

/** `properties` of a list row (the server returns only the requested keys), `{}` when absent. */
export function rowProps(row: object): Record<string, unknown> {
	const p = (row as { properties?: unknown }).properties;
	return typeof p === "object" && p !== null && !Array.isArray(p) ? (p as Record<string, unknown>) : {};
}

const isolate = (s: string) => `⁨${s}⁩`;

export function useCustomColumns<T>(o: Opts<T>): CustomColumns<T> {
	const { t, tx, locale, formatNumber } = useI18n();
	const session = useSession();
	const actor = session.info?.actor ?? null;
	const tenantId = sessionStore.getCredentials()?.tenantId ?? "";
	const allowed = session.info?.schema_read !== false;

	const [defs, setDefs] = useState<readonly PropertyDef[]>([]);
	useEffect(() => {
		setDefs([]);
		if (!allowed) return;
		const c = new AbortController();
		fetchRecordSchema(o.object, c.signal)
			.then((s) => setDefs(listable(s.properties)))
			.catch((e: unknown) => {
				if (!c.signal.aborted && !isForbidden(e)) setDefs([]);
			});
		return () => c.abort();
	}, [o.object, allowed]);
	const byKey = useMemo(() => new Map(defs.map((p) => [p.key, p])), [defs]);

	// ---- shown columns: remembered per tenant + actor + grid (same storage family as saved views) ----
	const storeKey = actor && tenantId ? columnsKey(tenantId, actor, o.gridId) : null;
	const readStored = useCallback((k: string | null) => {
		try {
			return k ? parseShown(safeLocalStorage()?.getItem(k) ?? null) : [];
		} catch {
			return [];
		}
	}, []);
	const [shown, setShown] = useState<string[]>(() => readStored(storeKey));
	const loadedFor = useRef(storeKey);
	useEffect(() => {
		if (loadedFor.current === storeKey) return;
		loadedFor.current = storeKey;
		setShown(readStored(storeKey));
	}, [storeKey, readStored]);
	const toggle = useCallback(
		(key: string) =>
			setShown((prev) => {
				const next = toggleShown(prev, key);
				try {
					if (storeKey) safeLocalStorage()?.setItem(storeKey, JSON.stringify(next));
				} catch {
					// best effort: the selection still applies for this visit
				}
				return next;
			}),
		[storeKey],
	);

	// ---- users (for `user` fields: column values and the filter picker) ----
	const needsUsers = defs.some((p) => p.type === "user");
	const [users, setUsers] = useState<ReadonlyMap<string, string>>(new Map());
	useEffect(() => {
		if (!needsUsers) return;
		const c = new AbortController();
		fetchAssignees(c.signal)
			.then((l) => setUsers(new Map(l.map((a) => [a.id, a.name]))))
			.catch(() => undefined);
		return () => c.abort();
	}, [needsUsers]);
	const ctx = useReadCtx(users);

	// ---- filter rows (state only: a new visit starts unfiltered) ----
	const [drafts, setDrafts] = useState<FilterDraft[]>([]);
	const seq = useRef(0);
	const addDraft = useCallback(() => {
		const first = defs[0];
		if (!first) return;
		seq.current += 1;
		const id = `f${seq.current}`;
		setDrafts((d) => (d.length >= MAX_FILTERS ? d : [...d, newDraft(first, id)]));
	}, [defs]);
	const patchDraft = useCallback(
		(id: string, patch: Partial<FilterDraft>) => setDrafts((d) => d.map((x) => (x.id === id ? { ...x, ...patch } : x))),
		[],
	);
	const removeDraft = useCallback((id: string) => setDrafts((d) => d.filter((x) => x.id !== id)), []);
	const changeField = useCallback(
		(id: string, key: string) => {
			const p = byKey.get(key);
			if (p) setDrafts((d) => d.map((x) => (x.id === id ? { ...newDraft(p, id) } : x)));
		},
		[byKey],
	);

	const conds = useMemo(() => toConditions(byKey, drafts), [byKey, drafts]);
	const shownDefs = useMemo(() => defs.filter((p) => shown.includes(p.key)), [defs, shown]);

	const baseSpec = o.baseSpec;
	const spec = useMemo<ServerSpec>(() => {
		const sort = { ...baseSpec.sort };
		for (const p of shownDefs) if (isSortable(p)) sort[cfId(p.key)] = p.key;
		return { ...baseSpec, sort };
	}, [baseSpec, shownDefs]);
	const props = useMemo(() => propsParam(shown, byKey), [shown, byKey]);

	const getProps = o.getProps;
	const columns = useMemo<ReadonlyArray<GridColumn<T>>>(
		() =>
			shownDefs.map((p): GridColumn<T> => {
				const label = pickLabel(p.label, locale, p.key);
				return {
					id: cfId(p.key),
					header: isolate(label),
					value: (r) => {
						const v = getProps(r)[p.key];
						return typeof v === "string" || typeof v === "number" || typeof v === "boolean" ? v : null;
					},
					sortable: isSortable(p),
					searchable: false,
					width: "176px",
					mobile: "meta",
					cell: (r) => <CellValue p={p} label={label} raw={getProps(r)[p.key]} ctx={ctx} />,
					titleText: (r) => textOf(p, getProps(r)[p.key], ctx),
				};
			}),
		[shownDefs, locale, getProps, ctx],
	);

	const extension = useMemo<GridExtension | undefined>(() => {
		if (defs.length === 0) return undefined;
		const list = (
			<ColumnList defs={defs} shown={shown} onToggle={toggle} />
		);
		return {
			columnPicker: (
				<Popover
					label={t("cc.pickerLabel")}
					triggerLabel={tx("cc.pickerTrigger", { count: formatNumber(shownDefs.length) })}
					testId="cc-picker"
				>
					{list}
				</Popover>
			),
			columnList: list,
			filterPanel: (
				<FilterRows
					defs={defs}
					drafts={drafts}
					users={users}
					ctx={ctx}
					onAdd={addDraft}
					onPatch={patchDraft}
					onField={changeField}
					onRemove={removeDraft}
				/>
			),
			filterCount: conds.length,
			chips: <Chips defs={byKey} drafts={drafts} ctx={ctx} users={users} onRemove={removeDraft} />,
			onClear: () => setDrafts([]),
		};
	}, [defs, shown, shownDefs.length, drafts, users, ctx, conds.length, byKey, t, tx, formatNumber, toggle, addDraft, patchDraft, changeField, removeDraft]);

	return { spec, extra: conds, props, columns, extension };
}

// ---- cells ---------------------------------------------------------------------------------------------------------------

function textOf(p: PropertyDef, raw: unknown, ctx: ReadCtx): string | undefined {
	const v = readValue(p, raw, ctx);
	switch (v.kind) {
		case "empty":
			return undefined;
		case "chips":
			return v.chips.map((c) => c.label).join(", ");
		default:
			return v.text;
	}
}

function CellValue({ p, label, raw, ctx }: { p: PropertyDef; label: string; raw: unknown; ctx: ReadCtx }) {
	const v = readValue(p, raw, ctx);
	const empty = v.kind === "empty";
	return (
		<span className={`sy-cc__cell${empty ? " sy-cc__cell--empty" : ""}`} data-testid={`cc-cell-${p.key}`}>
			<span className="sy-cc__mlabel" aria-hidden="true">
				<bdi>{label}</bdi>
				{": "}
			</span>
			{empty ? <span className="sy-cf__empty">—</span> : <ReadValueView v={v} />}
		</span>
	);
}

// ---- column picker -------------------------------------------------------------------------------------------------------

function ColumnList({ defs, shown, onToggle }: { defs: readonly PropertyDef[]; shown: readonly string[]; onToggle: (key: string) => void }) {
	const { t, locale, formatNumber } = useI18n();
	const full = shown.length >= MAX_COLUMNS;
	return (
		<div className="sy-cc__cols" data-testid="cc-columns">
			<b className="sy-grid__poptitle">{t("cc.title")}</b>
			{defs.map((p) => {
				const on = shown.includes(p.key);
				return (
					<Checkbox key={p.key} checked={on} disabled={!on && full} data-testid={`cc-col-${p.key}`} onChange={() => onToggle(p.key)} label={<BidiText>{pickLabel(p.label, locale, p.key)}</BidiText>} />
				);
			})}
			{full ? <p className="sy-cc__hint">{t("cc.limit", { max: formatNumber(MAX_COLUMNS) })}</p> : null}
		</div>
	);
}

// ---- filter rows ---------------------------------------------------------------------------------------------------------

type RowApi = {
	onPatch: (id: string, patch: Partial<FilterDraft>) => void;
	onField: (id: string, key: string) => void;
	onRemove: (id: string) => void;
};

function FilterRows({
	defs,
	drafts,
	users,
	ctx,
	onAdd,
	...api
}: { defs: readonly PropertyDef[]; drafts: readonly FilterDraft[]; users: ReadonlyMap<string, string>; ctx: ReadCtx; onAdd: () => void } & RowApi) {
	const { t } = useI18n();
	return (
		<div className="sy-cc__filters" data-testid="cc-filters">
			{drafts.map((d) => {
				const p = defs.find((x) => x.key === d.key);
				return p ? <FilterRow key={d.id} def={p} defs={defs} draft={d} users={users} ctx={ctx} {...api} /> : null;
			})}
			<div>
				<Button size="sm" icon="plus" onClick={onAdd} disabled={drafts.length >= MAX_FILTERS} data-testid="cc-add-filter">
					{t("cc.addFilter")}
				</Button>
			</div>
		</div>
	);
}

const opKey = (op: Op, p: PropertyDef): MessageKey => {
	const dated = p.type === "date" || p.type === "datetime";
	return (dated && (op === "gt" || op === "gte" || op === "lt" || op === "lte") ? `cc.op.${op}.date` : `cc.op.${op}`) as MessageKey;
};

function FilterRow({
	def,
	defs,
	draft,
	users,
	onPatch,
	onField,
	onRemove,
}: { def: PropertyDef; defs: readonly PropertyDef[]; draft: FilterDraft; users: ReadonlyMap<string, string>; ctx: ReadCtx } & RowApi) {
	const { t, locale } = useI18n();
	const shape = shapeOf(draft.op);
	return (
		<div className="sy-cc__row" data-testid="cc-filter-row" data-field={def.key}>
			<Select label={t("cc.field")} size="sm" value={draft.key} data-testid="cc-field" onChange={(e) => onField(draft.id, e.target.value)}>
				{defs.map((p) => (
					<option key={p.key} value={p.key}>
						{pickLabel(p.label, locale, p.key)}
					</option>
				))}
			</Select>
			<Select
				label={t("cc.operator")}
				size="sm"
				value={draft.op}
				data-testid="cc-op"
				onChange={(e) => onPatch(draft.id, { op: e.target.value as Op, a: draft.a, b: "", list: [] })}
			>
				{opsOf(def).map((op) => (
					<option key={op} value={op}>
						{t(opKey(op, def))}
					</option>
				))}
			</Select>
			{shape === "none" ? null : shape === "list" ? (
				<ListControl def={def} draft={draft} onPatch={onPatch} />
			) : shape === "bool" ? (
				<Select label={t("cc.value")} size="sm" value={draft.a} data-testid="cc-value" onChange={(e) => onPatch(draft.id, { a: e.target.value })}>
					<option value="true">{t("cf.yes")}</option>
					<option value="false">{t("cf.no")}</option>
				</Select>
			) : shape === "two" ? (
				<>
					<ValueControl def={def} users={users} label={t("cc.from")} value={draft.a} testId="cc-value" onChange={(a) => onPatch(draft.id, { a })} />
					<ValueControl def={def} users={users} label={t("cc.to")} value={draft.b} testId="cc-value-to" onChange={(b) => onPatch(draft.id, { b })} />
				</>
			) : (
				<ValueControl def={def} users={users} label={t("cc.value")} value={draft.a} testId="cc-value" onChange={(a) => onPatch(draft.id, { a })} />
			)}
			<IconButton
				icon="close"
				size="sm"
				aria-label={t("cc.removeFilter")}
				onClick={() => onRemove(draft.id)}
				data-testid="cc-remove-filter"
			/>
		</div>
	);
}

function ValueControl({
	def,
	users,
	label,
	value,
	testId,
	onChange,
}: { def: PropertyDef; users: ReadonlyMap<string, string>; label: string; value: string; testId: string; onChange: (v: string) => void }) {
	const { t, locale } = useI18n();
	switch (def.type) {
		case "date":
		case "datetime":
			return (
				<DatePicker
					label={label}
					mode={def.type}
					value={value}
					data-testid={testId}
					onChange={(e) => onChange(e.target.value)}
				/>
			);
		case "single_select":
			return (
				<Select label={label} size="sm" value={value} data-testid={testId} onChange={(e) => onChange(e.target.value)}>
					<option value="">{t("cc.pick")}</option>
					{def.options
						.filter((o) => !o.archived)
						.sort((a, b) => a.position - b.position)
						.map((o) => (
							<option key={o.value} value={o.value}>
								{pickLabel(o.label, locale, o.value)}
							</option>
						))}
				</Select>
			);
		case "user":
			return (
				<Select label={label} size="sm" value={value} data-testid={testId} onChange={(e) => onChange(e.target.value)}>
					<option value="">{t("cc.pick")}</option>
					{[...users].map(([id, name]) => (
						<option key={id} value={id}>
							{name}
						</option>
					))}
				</Select>
			);
		case "number":
		case "currency":
			return (
				<Input
					label={label}
					type="text"
					inputMode="decimal"
					dir="ltr"
					value={value}
					data-testid={testId}
					onChange={(e) => onChange(e.target.value)}
				/>
			);
		default:
			return <Input label={label} type="text" value={value} maxLength={100} data-testid={testId} onChange={(e) => onChange(e.target.value)} />;
	}
}

function ListControl({ def, draft, onPatch }: { def: PropertyDef; draft: FilterDraft; onPatch: RowApi["onPatch"] }) {
	const { t, locale } = useI18n();
	const label = (value: string) => {
		const o = def.options.find((x) => x.value === value);
		return o ? pickLabel(o.label, locale, o.value) : value;
	};
	return (
		<fieldset className="sy-cc__list" data-testid="cc-list">
			<legend className="sy-field__label">{t("cc.value")}</legend>
			{listChoices(def)
				.filter((c) => !c.archived || draft.list.includes(c.value))
				.map((c) => (
					<Checkbox key={c.value} checked={draft.list.includes(c.value)} data-testid={`cc-opt-${c.value}`} onChange={(checked) => onPatch(draft.id, {list: checked ? [...draft.list, c.value] : draft.list.filter((v) => v !== c.value)})} label={<BidiText>{label(c.value)}</BidiText>} />
				))}
		</fieldset>
	);
}

// ---- active filter chips -------------------------------------------------------------------------------------------------

function chipValue(p: PropertyDef, c: ServerCond, ctx: ReadCtx, users: ReadonlyMap<string, string>, sep: string): string {
	const one = (v: unknown): string => {
		if (typeof v === "boolean") return v ? ctx.yes : ctx.no;
		if (p.type === "user") return typeof v === "string" ? (users.get(v) ?? v) : "";
		if (p.type === "text" || p.type === "long_text") return String(v);
		return textOf(p, v, ctx) ?? String(v);
	};
	if (c.v === undefined) return "";
	if (Array.isArray(c.v)) return c.v.map(one).join(c.op === "between" ? " – " : sep);
	return one(c.v);
}

function Chips({
	defs,
	drafts,
	ctx,
	users,
	onRemove,
}: { defs: ReadonlyMap<string, PropertyDef>; drafts: readonly FilterDraft[]; ctx: ReadCtx; users: ReadonlyMap<string, string>; onRemove: (id: string) => void }) {
	const { t, locale } = useI18n();
	const items: ReactNode[] = [];
	for (const d of drafts) {
		const p = defs.get(d.key);
		const c = p ? toCondition(p, d) : null;
		if (!p || c === null) continue;
		const label = pickLabel(p.label, locale, p.key);
		const op = t(opKey(d.op, p));
		const value = chipValue(p, c, ctx, users, t("cc.sep"));
		const name = `${isolate(label)} ${op} ${value ? isolate(value) : ""}`.trim();
		items.push(
			<li key={d.id} data-testid="cc-chip">
				<span className="sy-grid__chip sy-grid__chip--static">
					<bdi>{label}</bdi> <span>{op}</span>
					{value ? (
						<>
							{" "}
							<bdi>{value}</bdi>
						</>
					) : null}
					<AriaButton
						type="button"
						className="sy-grid__chipx"
						aria-label={t("grid.removeFilter", { name })}
						onClick={() => onRemove(d.id)}
					>
						<Icon name="close" size={12} />
					</AriaButton>
				</span>
			</li>,
		);
	}
	return <>{items}</>;
}
