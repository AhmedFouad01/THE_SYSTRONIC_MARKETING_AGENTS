// P1b B3 UI: custom fields on records (Leads, Contacts, Deals, Tasks). One read section, one edit section (used inside each
// record's existing edit form and create dialog), and the two hooks that feed them. Plain in-house controls, no new dependency.
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { isApiError, isForbidden, useSession } from "../../api/index.ts";
import {
	BidiText,
	DatePicker,
	formatMoneyMinor,
	Input,
	type MessageKey,
	Money,
	Select,
	Textarea,
	useI18n,
} from "../../ui/index.ts";
import { fetchAssignees } from "../leads/api.ts";
import { fetchRecordProperties, fetchRecordSchema, type RecordPath } from "./api.ts";
import {
	COLOR_VAR,
	type ObjectKey,
	type ObjectSchema,
	type OptionColor,
	pickLabel,
	type PropertyDef,
	type PropertyGroupView,
} from "./model.ts";
import {
	buildProperties,
	choicesFor,
	createGroups,
	customGroups,
	type Draft,
	type Drafts,
	draftFromValue,
	flatten,
	type Issue,
	type ReadCtx,
	type ReadValue,
	readValue,
	serverIssueSuffix,
	serverPropertyIssues,
	type Values,
	visibleInRead,
} from "./values.ts";
import "./custom-fields.css";

// ---- data -----------------------------------------------------------------------------------------------------------

export type CustomFields = {
	/** off = the caller has no schema.read (nothing is shown); loading / ready / error otherwise. */
	status: "off" | "loading" | "ready" | "error";
	schema: ObjectSchema | null;
	values: Values;
	/** true when the values belong to the record's current version (an edit form must not start from older values). */
	current: boolean;
	users: ReadonlyMap<string, string>;
};

const OFF: CustomFields = { status: "off", schema: null, values: {}, current: false, users: new Map() };

/**
 * Schema of `object` + (when `id` is given) the record's custom values, fetched by id (list rows do not carry them).
 * Values refetch whenever the record's `version` changes; the previous values stay on screen meanwhile.
 * Create dialogs pass `id = null`: schema only.
 */
export function useCustomFields(object: ObjectKey, path: RecordPath, id: string | null, version: number | null): CustomFields {
	const session = useSession();
	const allowed = session.info?.schema_read !== false;
	const [schema, setSchema] = useState<{ status: "loading" | "ready" | "error" | "off"; schema: ObjectSchema | null }>({
		status: "loading",
		schema: null,
	});
	useEffect(() => {
		if (!allowed) return;
		const c = new AbortController();
		setSchema({ status: "loading", schema: null });
		fetchRecordSchema(object, c.signal)
			.then((s) => setSchema({ status: "ready", schema: s }))
			.catch((e: unknown) => {
				if (c.signal.aborted) return;
				setSchema({ status: isForbidden(e) ? "off" : "error", schema: null });
			});
		return () => c.abort();
	}, [object, allowed]);

	const [vals, setVals] = useState<{ id: string; version: number | null; values: Values } | "error" | null>(null);
	// biome-ignore lint/correctness/useExhaustiveDependencies: `version` is the refetch trigger (a save / reload bumps it)
	useEffect(() => {
		if (!allowed || id === null) return;
		const c = new AbortController();
		fetchRecordProperties(path, id, c.signal)
			.then((r) => setVals({ id, version: r.version, values: r.properties }))
			.catch((e: unknown) => {
				if (!c.signal.aborted) setVals(isForbidden(e) ? null : "error");
			});
		return () => c.abort();
	}, [path, id, version, allowed]);

	const needsUsers = useMemo(
		() => schema.schema?.properties.some((p) => p.type === "user" && !p.is_system && !p.archived) ?? false,
		[schema.schema],
	);
	const [users, setUsers] = useState<ReadonlyMap<string, string>>(new Map());
	useEffect(() => {
		if (!needsUsers) return;
		const c = new AbortController();
		fetchAssignees(c.signal)
			.then((l) => setUsers(new Map(l.map((a) => [a.id, a.name]))))
			.catch(() => undefined); // names are cosmetic: an unknown id renders as "Team member"
		return () => c.abort();
	}, [needsUsers]);

	return useMemo((): CustomFields => {
		if (!allowed || schema.status === "off") return OFF;
		if (schema.status === "error" || vals === "error") return { ...OFF, status: "error" };
		if (schema.status === "loading") return { ...OFF, status: "loading" };
		if (id === null) return { status: "ready", schema: schema.schema, values: {}, current: true, users };
		const mine = vals !== null && vals.id === id ? vals : null;
		if (mine === null) return { ...OFF, status: "loading" };
		return { status: "ready", schema: schema.schema, values: mine.values, current: mine.version === null || mine.version === version, users };
	}, [allowed, schema, vals, id, version, users]);
}

// ---- draft ----------------------------------------------------------------------------------------------------------

export type CustomDraft = {
	groups: PropertyGroupView[];
	/** Effective input value per key (user edits over the stored value). */
	drafts: Drafts;
	set: (key: string, d: Draft) => void;
	/** Client-side issues, shown after the first save attempt. */
	issues: Record<string, Issue>;
	/** First server code per key of the last rejected save (cleared per key when it is edited). */
	server: Record<string, string>;
	/** Something to save (or a draft the user changed that is not valid yet). */
	dirty: boolean;
	/** Edit forms wait for the values of the record's current version; create forms for the schema. */
	ready: boolean;
	/** Validates; `ok` false = stay on the form. `patch` is the partial `properties` map to send. */
	prepare: () => { ok: boolean; patch: Values };
	/** Maps a 422 `properties.<key>` error to its field; true when at least one field took it (otherwise handle the error as before). */
	fail: (e: unknown) => boolean;
};

export function useCustomDraft(cf: CustomFields, mode: "edit" | "create"): CustomDraft {
	const { locale } = useI18n();
	const groups = useMemo(
		() => (cf.schema === null ? [] : (mode === "create" ? createGroups : customGroups)(cf.schema, locale)),
		[cf.schema, locale, mode],
	);
	const defs = useMemo(() => flatten(groups), [groups]);
	const [over, setOver] = useState<Drafts>({});
	const [show, setShow] = useState(false);
	const [server, setServer] = useState<Record<string, string>>({});
	const base = mode === "edit" ? cf.values : {};
	const drafts = useMemo(
		() => Object.fromEntries(defs.map((p) => [p.key, over[p.key] ?? draftFromValue(p, base[p.key])])) as Drafts,
		[defs, over, base],
	);
	const built = useMemo(() => buildProperties(defs, base, drafts, mode), [defs, base, drafts, mode]);
	const ready = cf.status === "ready" && cf.current;
	return {
		groups,
		drafts,
		set: (key, d) => {
			setOver((o) => ({ ...o, [key]: d }));
			setServer((s) => {
				if (s[key] === undefined) return s;
				const { [key]: _gone, ...rest } = s;
				return rest;
			});
		},
		issues: show ? built.issues : {},
		server,
		dirty: ready && (Object.keys(built.patch).length > 0 || Object.keys(built.issues).length > 0),
		ready,
		prepare: () => {
			setShow(true);
			setServer({});
			return { ok: Object.keys(built.issues).length === 0, patch: built.patch };
		},
		fail: (e) => {
			if (!isApiError(e) || e.status !== 422) return false;
			const { byKey } = serverPropertyIssues(e.issues);
			const mine = Object.fromEntries(Object.entries(byKey).filter(([k]) => defs.some((p) => p.key === k)));
			if (Object.keys(mine).length === 0) return false;
			setServer(mine);
			return true;
		},
	};
}

// ---- read ----------------------------------------------------------------------------------------------------------

export function ReadValueView({ v }: { v: ReadValue }) {
	const { t } = useI18n();
	switch (v.kind) {
		case "empty":
			return <span className="sy-cf__empty">{t("cf.empty")}</span>;
		case "plain":
			return <BidiText wrap>{v.text}</BidiText>;
		case "multiline":
			return (
				<span className="sy-cf__multiline">
					{v.text}
				</span>
			);
		case "num":
			return <bdi>{v.text}</bdi>;
		case "money":
			return <Money>{v.text}</Money>;
		case "link":
			return (
				<a
					className="sy-cf__link"
					href={v.href}
					dir="ltr"
					{...(v.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
				>
					{v.text}
				</a>
			);
		case "chips":
			return (
				<ul className="sy-cf__chips">
					{v.chips.map((c) => (
						<li key={c.value} className="sy-cf__chip" data-testid="cf-chip" data-color={c.color ?? undefined}>
							{c.color && c.color in COLOR_VAR ? (
								<span className="sy-cf__dot" style={{ background: COLOR_VAR[c.color as OptionColor] }} aria-hidden="true" />
							) : null}
							<bdi>{c.archived ? t("cf.archived", { label: c.label }) : c.label}</bdi>
						</li>
					))}
				</ul>
			);
	}
}

export function useReadCtx(users: ReadonlyMap<string, string>): ReadCtx {
	const { t, locale, formatNumber, formatDate, formatDateTime } = useI18n();
	return useMemo(
		(): ReadCtx => ({
			locale,
			number: (n: number) => formatNumber(n, { maximumFractionDigits: 6 }),
			moneyMinor: (minor: number, currency: string) => formatMoneyMinor(minor, locale, currency),
			date: (d: Date) => formatDate(d),
			dateTime: (iso: string) => formatDateTime(iso),
			yes: t("cf.yes"),
			no: t("cf.no"),
			userName: (id: string) => users.get(id) ?? t("common.unknownUser"),
		}),
		[t, locale, formatNumber, formatDate, formatDateTime, users],
	);
}

function Heading({ children, id }: { children: ReactNode; id?: string }) {
	return (
		<h3 className="sy-cf__group-title" id={id}>
			{children}
		</h3>
	);
}

/** Read view for the record panel: "Custom fields", grouped, each value formatted for its type. Renders nothing when there is nothing to show. */
export function CustomFieldsRead({ cf }: { cf: CustomFields }) {
	const { t, locale } = useI18n();
	const ctx = useReadCtx(cf.users);
	if (cf.status === "off") return null;
	if (cf.status === "loading")
		return (
			<p className="sy-record__muted" role="status" data-testid="cf-loading">
				{t("cf.loading")}
			</p>
		);
	if (cf.status === "error")
		return (
			<p className="sy-record__muted" role="status" data-testid="cf-error">
				{t("cf.failed")}
			</p>
		);
	const groups = customGroups(cf.schema as ObjectSchema, locale)
		.map((g) => ({ ...g, properties: g.properties.filter((p) => visibleInRead(p, cf.values)) }))
		.filter((g) => g.properties.length > 0);
	if (groups.length === 0) return null;
	return (
		<section className="sy-cf" aria-label={t("cf.title")} data-testid="cf-read">
			<h3 className="sy-cf__title">{t("cf.title")}</h3>
			{groups.map((g) => (
				<div key={g.group.key} className="sy-cf__group" data-testid="cf-group" data-group={g.group.key}>
					<Heading>
						<BidiText>{pickLabel(g.group.label, locale, g.group.key)}</BidiText>
					</Heading>
					<dl className="sy-record__facts sy-cf__facts">
						{g.properties.map((p) => {
							const v = readValue(p, cf.values[p.key], ctx);
							return (
								<div
									key={p.key}
									className={`sy-record__fact${v.kind === "multiline" || v.kind === "chips" ? " sy-cf__fact--wide" : ""}`}
									data-testid={`cf-fact-${p.key}`}
								>
									<dt>
										<BidiText>{pickLabel(p.label, locale, p.key)}</BidiText>
									</dt>
									<dd data-testid={`cf-value-${p.key}`}>
										<ReadValueView v={v} />
									</dd>
								</div>
							);
						})}
					</dl>
				</div>
			))}
		</section>
	);
}

// ---- edit ----------------------------------------------------------------------------------------------------------

function issueText(
	issue: Issue,
	t: (k: MessageKey, v?: Record<string, string | number>) => string,
	fmt: (n: number) => string,
): string {
	const vars: Record<string, string | number> = {};
	if (issue.min !== undefined) vars.min = fmt(issue.min);
	if (issue.max !== undefined) vars.max = fmt(issue.max);
	if (issue.currency !== undefined) vars.currency = issue.currency;
	return t(`cf.err.${issue.code}` as MessageKey, vars);
}

function FieldFrame({
	p,
	label,
	error,
	hint,
	children,
}: {
	p: PropertyDef;
	label: string;
	error: string | undefined;
	hint?: string | undefined;
	children: ReactNode;
}) {
	const { t } = useI18n();
	return (
		<fieldset className={`sy-field sy-cf__set${error ? " sy-field--error" : ""}`}>
			<legend className="sy-field__label">
				<bdi>{label}</bdi>
				{p.required ? <span aria-hidden="true"> *</span> : null}
				{p.sensitive ? <span className="sy-cf__tag">{t("cf.sensitive")}</span> : null}
			</legend>
			{children}
			{hint ? <p className="sy-field__hint">{hint}</p> : null}
			{error ? (
				<p className="sy-field__error" role="alert">
					{error}
				</p>
			) : null}
		</fieldset>
	);
}

function FieldInput({
	p,
	value,
	onChange,
	error,
	users,
}: {
	p: PropertyDef;
	value: Draft;
	onChange: (d: Draft) => void;
	error: string | undefined;
	users: ReadonlyMap<string, string>;
}) {
	const { t, locale } = useI18n();
	const label = pickLabel(p.label, locale, p.key);
	const name = `cf_${p.key}`;
	const testId = `cf-input-${p.key}`;
	const text = typeof value === "string" ? value : "";
	const common = { label, name, error, required: p.required, "data-testid": testId };
	switch (p.type) {
		case "long_text":
			return (
				<Textarea
					{...common}
					value={text}
					rows={4}
					{...(p.validation.max_length !== undefined ? { maxLength: p.validation.max_length } : {})}
					onChange={(e) => onChange(e.target.value)}
				/>
			);
		case "number":
			return <Input {...common} type="text" inputMode="decimal" dir="ltr" value={text} onChange={(e) => onChange(e.target.value)} />;
		case "currency":
			return (
				<Input
					{...common}
					type="text"
					inputMode="decimal"
					dir="ltr"
					hint={t("cf.hint.currency", { currency: p.currency ?? "EGP" })}
					value={text}
					onChange={(e) => onChange(e.target.value)}
				/>
			);
		case "date":
		case "datetime":
			return (
				<DatePicker
					label={label}
					name={name}
					error={error}
					required={p.required}
					mode={p.type}
					value={text}
					data-testid={testId}
					onChange={(e) => onChange(e.target.value)}
				/>
			);
		case "single_select": {
			const choices = choicesFor(p, value);
			if (p.display === "radio")
				return (
					<FieldFrame p={p} label={label} error={error}>
						<div className="sy-cf__options" role="radiogroup" aria-label={label}>
							{(p.required ? choices : [{ value: "", label: {}, color: null, position: -1, archived: false }, ...choices]).map((o) => (
								<label key={o.value || "none"} className="sy-cf__check">
									<input type="radio" name={name} checked={text === o.value} onChange={() => onChange(o.value)} data-testid={`${testId}-${o.value || "none"}`} />
									<span>
										<bdi>
											{o.value === ""
												? t("cf.none")
												: o.archived
													? t("cf.archived", { label: pickLabel(o.label, locale, o.value) })
													: pickLabel(o.label, locale, o.value)}
										</bdi>
									</span>
								</label>
							))}
						</div>
					</FieldFrame>
				);
			return (
				<Select {...common} value={text} onChange={(e) => onChange(e.target.value)}>
					<option value="">{t("cf.pick")}</option>
					{choices.map((o) => (
						<option key={o.value} value={o.value}>
							{o.archived ? t("cf.archived", { label: pickLabel(o.label, locale, o.value) }) : pickLabel(o.label, locale, o.value)}
						</option>
					))}
				</Select>
			);
		}
		case "multi_select": {
			const picked = Array.isArray(value) ? value : [];
			const choices = choicesFor(p, value);
			return (
				<FieldFrame p={p} label={label} error={error}>
					<div className="sy-cf__options" data-testid={testId}>
						{choices.map((o) => (
							<label key={o.value} className="sy-cf__check">
								<input
									type="checkbox"
									checked={picked.includes(o.value)}
									data-testid={`${testId}-${o.value}`}
									onChange={(e) => onChange(e.target.checked ? [...picked, o.value] : picked.filter((x) => x !== o.value))}
								/>
								<span>
									<bdi>{o.archived ? t("cf.archived", { label: pickLabel(o.label, locale, o.value) }) : pickLabel(o.label, locale, o.value)}</bdi>
								</span>
							</label>
						))}
					</div>
				</FieldFrame>
			);
		}
		case "checkbox":
			return (
				<FieldFrame p={p} label={label} error={error}>
					<label className="sy-cf__check">
						<input type="checkbox" checked={value === true} data-testid={testId} onChange={(e) => onChange(e.target.checked)} />
						<span>{t("cf.yes")}</span>
					</label>
				</FieldFrame>
			);
		case "user": {
			const list = [...users].map(([id, n]) => ({ id, name: n }));
			if (text !== "" && !users.has(text)) list.push({ id: text, name: t("common.unknownUser") });
			return (
				<Select {...common} value={text} onChange={(e) => onChange(e.target.value)}>
					<option value="">{t("cf.none")}</option>
					{list.map((u) => (
						<option key={u.id} value={u.id}>
							{u.name}
						</option>
					))}
				</Select>
			);
		}
		default:
			return <Input {...common} value={text} {...(p.validation.max_length !== undefined ? { maxLength: p.validation.max_length } : {})} onChange={(e) => onChange(e.target.value)} />;
	}
}

/**
 * Edit section: put it inside the record's form (before the footer) or the create dialog. read_only properties show their
 * value (never an input); sensitive ones appear only when the schema returned them; server errors land on the right field.
 */
export function CustomFieldsEdit({ cf, draft, mode }: { cf: CustomFields; draft: CustomDraft; mode: "edit" | "create" }) {
	const { t, locale, formatNumber } = useI18n();
	const ctx = useReadCtx(cf.users);
	const fmt = (n: number) => formatNumber(n, { maximumFractionDigits: 6 });
	if (cf.status === "off") return null;
	if (cf.status === "loading" || (mode === "edit" && cf.status === "ready" && !cf.current))
		return (
			<p className="sy-record__muted" role="status" data-testid="cf-loading">
				{t("cf.loading")}
			</p>
		);
	if (cf.status === "error")
		return (
			<p className="sy-record__muted" role="status" data-testid="cf-error">
				{t("cf.failed")}
			</p>
		);
	if (draft.groups.length === 0) return null;
	const errorOf = (p: PropertyDef): string | undefined => {
		const s = draft.server[p.key];
		if (s !== undefined) return t(`cf.err.${serverIssueSuffix(s)}` as MessageKey);
		const i = draft.issues[p.key];
		return i ? issueText(i, t, fmt) : undefined;
	};
	const anyServer = Object.keys(draft.server).length > 0;
	return (
		<section className="sy-cf sy-cf--edit" aria-label={t("cf.title")} data-testid="cf-edit">
			<h3 className="sy-cf__title">{t("cf.title")}</h3>
			{anyServer ? (
				<p className="sy-cf__banner" role="alert" data-testid="cf-banner">
					{t("cf.err.banner")}
				</p>
			) : null}
			{draft.groups.map((g) => (
				<div key={g.group.key} className="sy-cf__group" data-testid="cf-group" data-group={g.group.key}>
					{mode === "edit" ? (
						<Heading>
							<BidiText>{pickLabel(g.group.label, locale, g.group.key)}</BidiText>
						</Heading>
					) : null}
					<div className="sy-cf__fields">
						{g.properties.map((p) =>
							p.read_only ? (
								<div key={p.key} className="sy-field sy-cf__ro" data-testid={`cf-field-${p.key}`}>
									<span className="sy-field__label">
										<bdi>{pickLabel(p.label, locale, p.key)}</bdi>
										<span className="sy-cf__tag">{t("cf.readOnly")}</span>
									</span>
									<div className="sy-cf__rovalue" data-testid={`cf-readonly-${p.key}`}>
										<ReadValueView v={readValue(p, cf.values[p.key], ctx)} />
									</div>
								</div>
							) : (
								<div key={p.key} className="sy-cf__field" data-testid={`cf-field-${p.key}`}>
									<FieldInput
										p={p}
										value={draft.drafts[p.key] ?? draftFromValue(p, undefined)}
										onChange={(d) => draft.set(p.key, d)}
										error={errorOf(p)}
										users={cf.users}
									/>
								</div>
							),
						)}
					</div>
				</div>
			))}
		</section>
	);
}
