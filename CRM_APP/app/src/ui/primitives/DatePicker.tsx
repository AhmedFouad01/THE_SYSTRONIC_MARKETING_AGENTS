import {
	type KeyboardEvent,
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	INTL_LOCALE,
	formatDate,
	formatDateTime,
	useI18n,
} from "../i18n/index.ts";
import { Icon } from "../icons/index.ts";
import { useOutsideDismiss } from "../overlays/useDismiss.ts";
import { Button } from "./Button.tsx";
import { FieldShell } from "./Field.tsx";
import { Select } from "./Select.tsx";
import "./date-picker.css";
import "./select.css";

export type DatePickerProps = {
	label: string;
	hint?: string;
	error?: string | undefined;
	required?: boolean;
	disabled?: boolean;
	className?: string;
	name?: string;
	/** date = day only (`YYYY-MM-DD`); datetime = day + time (`YYYY-MM-DDTHH:mm`, local, no zone). */
	mode?: "date" | "datetime";
	value: string;
	/** Same shape the native input used (`e.target.value`), so call sites stay unchanged. */
	onChange?: (e: {
		target: { value: string; name: string | undefined };
	}) => void;
	"data-testid"?: string;
};

type Ymd = { y: number; m: number; d: number };
type Parsed = Ymd & { hh: number; mm: number };

const DEFAULT_HOUR = 9;
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const WEEK_ROWS = [0, 1, 2, 3, 4, 5];
const pad = (n: number) => String(n).padStart(2, "0");

/** Strict parse of `YYYY-MM-DD[THH:mm]`; null when empty / malformed / not a real calendar day. */
export function parseLocalValue(v: string): Parsed | null {
	const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(v.trim());
	if (!m) return null;
	const y = Number(m[1]);
	const mo = Number(m[2]);
	const d = Number(m[3]);
	const hh = Number(m[4] ?? DEFAULT_HOUR);
	const mm = Number(m[5] ?? 0);
	const probe = new Date(y, mo - 1, d);
	if (
		probe.getFullYear() !== y ||
		probe.getMonth() !== mo - 1 ||
		probe.getDate() !== d
	)
		return null;
	if (hh > 23 || mm > 59) return null;
	return { y, m: mo, d, hh, mm };
}

export function formatLocalValue(p: Parsed, mode: "date" | "datetime"): string {
	const day = `${String(p.y).padStart(4, "0")}-${pad(p.m)}-${pad(p.d)}`;
	return mode === "date" ? day : `${day}T${pad(p.hh)}:${pad(p.mm)}`;
}

/** 0 = Sunday ... 6 = Saturday (Intl weekInfo reports 1 = Monday ... 7 = Sunday). */
function firstDayOfWeek(tag: string, ar: boolean): number {
	try {
		const loc = new Intl.Locale(tag) as Intl.Locale & {
			getWeekInfo?: () => { firstDay: number };
			weekInfo?: { firstDay: number };
		};
		const info = loc.getWeekInfo?.() ?? loc.weekInfo;
		if (info) return info.firstDay % 7;
	} catch {
		/* fall through */
	}
	return ar ? 6 : 1;
}

/**
 * Shared date field (UX-15): a Select-styled trigger that opens a month grid (+ hour/minute selects in datetime
 * mode). No native date input: the OS control renders "mm/dd/yyyy --:-- --" and ignores the app locale.
 * Grid keys: arrows move by day/week (mirrored in RTL), PageUp/PageDown by month, Home/End to the week edges,
 * Enter/Space picks, Escape closes (and does not reach an enclosing Dialog).
 */
export function DatePicker({
	label,
	hint,
	error,
	mode = "datetime",
	className,
	required,
	name,
	value,
	onChange,
	disabled,
	"data-testid": testId,
}: DatePickerProps) {
	const { locale, dir, t } = useI18n();
	const tag = INTL_LOCALE[locale];
	const gridId = useId();
	const rootRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);
	const parsed = useMemo(() => parseLocalValue(value), [value]);
	const [open, setOpen] = useState(false);
	const [view, setView] = useState<{ y: number; m: number }>(() => {
		const n = new Date();
		return parsed
			? { y: parsed.y, m: parsed.m }
			: { y: n.getFullYear(), m: n.getMonth() + 1 };
	});
	const [focusDay, setFocusDay] = useState<Ymd>(() => {
		const n = new Date();
		return (
			parsed ?? { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate() }
		);
	});
	const [pos, setPos] = useState<{
		left: number;
		top?: number;
		bottom?: number;
	} | null>(null);

	const close = useCallback(() => setOpen(false), []);
	useOutsideDismiss(open, rootRef, close);

	const openPanel = () => {
		if (disabled || !triggerRef.current) return;
		const n = new Date();
		const base: Ymd = parsed ?? {
			y: n.getFullYear(),
			m: n.getMonth() + 1,
			d: n.getDate(),
		};
		setView({ y: base.y, m: base.m });
		setFocusDay(base);
		const r = triggerRef.current.getBoundingClientRect();
		const below = window.innerHeight - r.bottom;
		const flip = below < 380 && r.top > below;
		const left = Math.max(8, Math.min(r.left, window.innerWidth - 288 - 8));
		setPos(
			flip
				? { left, bottom: window.innerHeight - r.top + 4 }
				: { left, top: r.bottom + 4 },
		);
		setOpen(true);
	};

	// Close when the page scrolls/resizes under the fixed panel.
	useEffect(() => {
		if (!open) return;
		const onScroll = (e: Event) => {
			if (e.target instanceof Node && panelRef.current?.contains(e.target))
				return;
			setOpen(false);
		};
		window.addEventListener("scroll", onScroll, true);
		window.addEventListener("resize", close);
		return () => {
			window.removeEventListener("scroll", onScroll, true);
			window.removeEventListener("resize", close);
		};
	}, [open, close]);

	// Focus the roving day button when the panel opens or the focused day changes.
	// biome-ignore lint/correctness/useExhaustiveDependencies: focusDay/view identify the button to focus
	useEffect(() => {
		if (!open) return;
		panelRef.current
			?.querySelector<HTMLButtonElement>('button[data-roving="true"]')
			?.focus();
	}, [open, focusDay, view]);

	const weekStart = firstDayOfWeek(tag, locale === "ar");
	const monthTitle = new Intl.DateTimeFormat(tag, {
		month: "long",
		year: "numeric",
	}).format(new Date(view.y, view.m - 1, 1));
	const weekdays = useMemo(() => {
		const narrow = new Intl.DateTimeFormat(tag, { weekday: "narrow" });
		const long = new Intl.DateTimeFormat(tag, { weekday: "long" });
		return Array.from({ length: 7 }, (_, i) => {
			const ref = new Date(2023, 0, 1 + ((weekStart + i) % 7)); // 2023-01-01 is a Sunday
			return { narrow: narrow.format(ref), long: long.format(ref) };
		});
	}, [tag, weekStart]);
	const numeral = useMemo(
		() => new Intl.NumberFormat(tag, { useGrouping: false }),
		[tag],
	);
	const dayLabel = useMemo(
		() =>
			new Intl.DateTimeFormat(tag, {
				weekday: "long",
				day: "numeric",
				month: "long",
				year: "numeric",
			}),
		[tag],
	);

	const cells = useMemo(() => {
		const first = new Date(view.y, view.m - 1, 1);
		const lead = (first.getDay() - weekStart + 7) % 7;
		return Array.from({ length: 42 }, (_, i) => {
			const dt = new Date(view.y, view.m - 1, 1 - lead + i);
			return {
				y: dt.getFullYear(),
				m: dt.getMonth() + 1,
				d: dt.getDate(),
				outside: dt.getMonth() !== view.m - 1,
			};
		});
	}, [view, weekStart]);

	const emit = (next: Parsed) =>
		onChange?.({ target: { value: formatLocalValue(next, mode), name } });
	const pickDay = (c: Ymd) => {
		emit({ ...c, hh: parsed?.hh ?? DEFAULT_HOUR, mm: parsed?.mm ?? 0 });
		if (mode === "date") {
			setOpen(false);
			triggerRef.current?.focus();
		} else setFocusDay(c);
	};
	const moveFocus = (to: Date) => {
		const next = { y: to.getFullYear(), m: to.getMonth() + 1, d: to.getDate() };
		setFocusDay(next);
		setView({ y: next.y, m: next.m });
	};
	const shiftMonth = (delta: number) => {
		const to = new Date(view.y, view.m - 1 + delta, 1);
		setView({ y: to.getFullYear(), m: to.getMonth() + 1 });
		const last = new Date(to.getFullYear(), to.getMonth() + 1, 0).getDate();
		setFocusDay({
			y: to.getFullYear(),
			m: to.getMonth() + 1,
			d: Math.min(focusDay.d, last),
		});
	};

	const onGridKey = (e: KeyboardEvent<HTMLDivElement>) => {
		if (e.ctrlKey || e.metaKey || e.altKey) return;
		const cur = new Date(focusDay.y, focusDay.m - 1, focusDay.d);
		const h = dir === "rtl" ? -1 : 1;
		const by = (days: number) =>
			new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + days);
		const col = (cur.getDay() - weekStart + 7) % 7;
		const target: Date | "prev" | "next" | null =
			e.key === "ArrowRight"
				? by(h)
				: e.key === "ArrowLeft"
					? by(-h)
					: e.key === "ArrowDown"
						? by(7)
						: e.key === "ArrowUp"
							? by(-7)
							: e.key === "Home"
								? by(-col)
								: e.key === "End"
									? by(6 - col)
									: e.key === "PageDown"
										? "next"
										: e.key === "PageUp"
											? "prev"
											: null;
		if (target === null) return;
		e.preventDefault();
		if (target === "next") shiftMonth(1);
		else if (target === "prev") shiftMonth(-1);
		else moveFocus(target);
	};
	const onPanelKey = (e: KeyboardEvent<HTMLDivElement>) => {
		if (e.key !== "Escape" || !open) return;
		e.preventDefault();
		e.stopPropagation();
		setOpen(false);
		triggerRef.current?.focus();
	};

	const today = new Date();
	const isToday = (c: Ymd) =>
		c.y === today.getFullYear() &&
		c.m === today.getMonth() + 1 &&
		c.d === today.getDate();
	const shown = parsed
		? mode === "date"
			? formatDate(new Date(parsed.y, parsed.m - 1, parsed.d), locale)
			: formatDateTime(
					new Date(parsed.y, parsed.m - 1, parsed.d, parsed.hh, parsed.mm),
					locale,
				)
		: "";
	const minuteOptions = useMemo(() => {
		const base = Array.from({ length: 12 }, (_, i) => i * 5);
		return parsed && !base.includes(parsed.mm)
			? [...base, parsed.mm].sort((a, b) => a - b)
			: base;
	}, [parsed]);
	const two = (n: number) =>
		pad(n).replace(/\d/g, (x) => numeral.format(Number(x)));
	const current = (): Parsed =>
		parsed ?? { ...focusDay, hh: DEFAULT_HOUR, mm: 0 };

	return (
		<FieldShell
			label={label}
			hint={hint ?? ""}
			error={error}
			required={required}
			className={className}
		>
			{(p) => (
				// biome-ignore lint/a11y/noStaticElementInteractions: Escape handler for the whole picker
				<div className="sy-date" ref={rootRef} onKeyDown={onPanelKey}>
					<button
						{...p}
						ref={triggerRef}
						type="button"
						role="combobox"
						aria-haspopup="dialog"
						aria-expanded={open}
						aria-controls={open ? gridId : undefined}
						aria-required={required || undefined}
						disabled={disabled}
						className="sy-select__trigger sy-date__trigger"
						data-testid={testId}
						data-name={name}
						data-value={value}
						onClick={() => (open ? setOpen(false) : openPanel())}
						onKeyDown={(e) => {
							if (
								!open &&
								(e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")
							) {
								e.preventDefault();
								openPanel();
							}
						}}
					>
						<span className="sy-select__value">
							{shown ? (
								<bdi>{shown}</bdi>
							) : (
								<span className="sy-date__placeholder">
									{t(
										mode === "date" ? "datepicker.pickDate" : "datepicker.pick",
									)}
								</span>
							)}
						</span>
						<Icon name="calendar" size={16} className="sy-select__chevron" />
					</button>
					{open && pos ? (
						<div
							id={gridId}
							ref={panelRef}
							role="dialog"
							aria-label={label}
							className="sy-date__panel"
							style={{ left: pos.left, top: pos.top, bottom: pos.bottom }}
						>
							<div className="sy-date__head">
								<button
									type="button"
									className="sy-date__nav sy-date__nav--prev"
									aria-label={t("datepicker.prev")}
									onClick={() => shiftMonth(-1)}
								>
									<Icon name="chevronRight" size={16} />
								</button>
								<span className="sy-date__title" aria-live="polite">
									{monthTitle}
								</span>
								<button
									type="button"
									className="sy-date__nav"
									aria-label={t("datepicker.next")}
									data-testid="date-next"
									onClick={() => shiftMonth(1)}
								>
									<Icon name="chevronRight" size={16} />
								</button>
							</div>
							<table
								className="sy-date__grid"
								aria-label={monthTitle}
								onKeyDown={onGridKey}
							>
								<thead>
									<tr className="sy-date__row">
										{weekdays.map((w) => (
											<th
												key={w.long}
												scope="col"
												abbr={w.long}
												aria-label={w.long}
												className="sy-date__dow"
											>
												{w.narrow}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{WEEK_ROWS.map((r) => (
										<tr
											key={`${view.y}-${view.m}-${r}`}
											className="sy-date__row"
										>
											{cells.slice(r * 7, r * 7 + 7).map((c) => {
												const selected =
													parsed !== null &&
													parsed.y === c.y &&
													parsed.m === c.m &&
													parsed.d === c.d;
												const roving =
													focusDay.y === c.y &&
													focusDay.m === c.m &&
													focusDay.d === c.d;
												return (
													<td
														key={`${c.y}-${c.m}-${c.d}`}
														className="sy-date__cell"
													>
														<button
															type="button"
															tabIndex={roving ? 0 : -1}
															data-roving={roving ? "true" : undefined}
															data-day={`${c.y}-${pad(c.m)}-${pad(c.d)}`}
															data-outside={c.outside || undefined}
															data-today={isToday(c) || undefined}
															aria-pressed={selected}
															aria-current={isToday(c) ? "date" : undefined}
															aria-label={dayLabel.format(
																new Date(c.y, c.m - 1, c.d),
															)}
															className="sy-date__day"
															onClick={() => pickDay(c)}
														>
															{numeral.format(c.d)}
														</button>
													</td>
												);
											})}
										</tr>
									))}
								</tbody>
							</table>
							{mode === "datetime" ? (
								<div className="sy-date__time">
									<Select
										label={t("datepicker.hour")}
										value={String(parsed?.hh ?? DEFAULT_HOUR)}
										size="sm"
										data-testid="date-hour"
										onChange={(e) =>
											emit({ ...current(), hh: Number(e.target.value) })
										}
									>
										{HOURS.map((h) => (
											<option key={h} value={String(h)}>
												{two(h)}
											</option>
										))}
									</Select>
									<Select
										label={t("datepicker.minute")}
										value={String(parsed?.mm ?? 0)}
										size="sm"
										data-testid="date-minute"
										onChange={(e) =>
											emit({ ...current(), mm: Number(e.target.value) })
										}
									>
										{minuteOptions.map((m) => (
											<option key={m} value={String(m)}>
												{two(m)}
											</option>
										))}
									</Select>
									<Button
										size="sm"
										variant="primary"
										onClick={() => {
											setOpen(false);
											triggerRef.current?.focus();
										}}
										data-testid="date-done"
									>
										{t("datepicker.done")}
									</Button>
								</div>
							) : null}
						</div>
					) : null}
				</div>
			)}
		</FieldShell>
	);
}
