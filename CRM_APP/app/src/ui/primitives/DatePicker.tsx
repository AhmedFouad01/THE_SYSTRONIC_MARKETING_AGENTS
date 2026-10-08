import { useMemo, useState } from "react";
import { CalendarDate, GregorianCalendar } from "@internationalized/date";
import {
	Button as AriaButton,
	Calendar,
	CalendarCell,
	CalendarGrid,
	CalendarGridBody,
	CalendarGridHeader,
	CalendarHeaderCell,
	Dialog,
	DialogTrigger,
	Heading,
	Popover,
} from "react-aria-components";
import {
	INTL_LOCALE,
	formatDate,
	formatDateTime,
	useI18n,
} from "../i18n/index.ts";
import { Icon } from "../icons/index.ts";
import { Button } from "./Button.tsx";
import { FieldShell } from "./Field.tsx";
import { Select } from "./Select.tsx";
import { choiceFocus, choiceTrigger } from "./choices.ts";

export type DatePickerProps = {
	label: string;
	hint?: string;
	error?: string | undefined;
	required?: boolean;
	disabled?: boolean;
	readOnly?: boolean;
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
const pad = (n: number) => String(n).padStart(2, "0");

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

// Gregorian date-only objects avoid timezone conversion at the calendar/wire boundary.
const gregorian = () => new GregorianCalendar();
const calendarControl = `grid place-items-center w-[32px] h-[32px] border-0 rounded-8 bg-transparent text-text-2 cursor-pointer data-[hovered]:bg-hover data-[disabled]:text-text-disabled ${choiceFocus}`;

/** Preserve the trigger and local ISO/event contract; RAC owns the grid, dismissal and focus return. */
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
	readOnly,
	"data-testid": testId,
}: DatePickerProps) {
	const { locale, dir, t } = useI18n();
	const parsed = useMemo(() => parseLocalValue(value), [value]);
	const [open, setOpen] = useState(false);
	const now = new Date();
	const current: Parsed = parsed ?? {
		y: now.getFullYear(),
		m: now.getMonth() + 1,
		d: now.getDate(),
		hh: DEFAULT_HOUR,
		mm: 0,
	};
	const selected = parsed
		? new CalendarDate(parsed.y, parsed.m, parsed.d)
		: null;
	const numeral = new Intl.NumberFormat(INTL_LOCALE[locale], {
		minimumIntegerDigits: 2,
		useGrouping: false,
	});
	const minutes = Array.from({ length: 12 }, (_, i) => i * 5);
	if (!minutes.includes(current.mm)) minutes.push(current.mm);
	minutes.sort((a, b) => a - b);
	const shown = parsed
		? mode === "date"
			? formatDate(new Date(parsed.y, parsed.m - 1, parsed.d), locale)
			: formatDateTime(
					new Date(parsed.y, parsed.m - 1, parsed.d, parsed.hh, parsed.mm),
					locale,
				)
		: "";
	const emit = (next: Parsed) => {
		if (!disabled && !readOnly)
			onChange?.({ target: { value: formatLocalValue(next, mode), name } });
	};
	return (
		<FieldShell
			label={label}
			hint={hint ?? ""}
			error={error}
			required={required}
			className={className}
		>
			{(p) => (
				<DialogTrigger
					isOpen={open && !disabled && !readOnly}
					onOpenChange={setOpen}
				>
					<AriaButton
						{...p}
						name={name}
						type="button"
						render={(domProps) => (
							<button
								{...domProps}
								{...p}
								role="combobox"
								aria-expanded={open && !disabled && !readOnly}
								aria-haspopup="dialog"
								aria-required={required || undefined}
								aria-readonly={readOnly || undefined}
							/>
						)}
						aria-label={label}
						aria-required={required || undefined}
						aria-readonly={readOnly || undefined}
						isDisabled={disabled}
						onPress={() => {
							if (readOnly) setOpen(false);
						}}
						data-testid={testId}
						data-name={name}
						data-value={value}
						onKeyDown={(e) => {
							if (e.key === "ArrowDown" && !readOnly && !disabled) {
								e.preventDefault();
								setOpen(true);
							}
						}}
						className={`sy-date__trigger ${choiceTrigger} h-control-h text-data!`}
					>
						<bdi
							className={`flex-1 min-w-0 truncate${shown ? "" : " text-text-3"}`}
						>
							{shown ||
								t(mode === "date" ? "datepicker.pickDate" : "datepicker.pick")}
						</bdi>
						<Icon name="calendar" size={16} />
					</AriaButton>
					<Popover
						placement="bottom start"
						offset={4}
						className="sy-date__panel z-[1200] box-border w-[288px] max-w-[calc(100vw_-_16px)] max-h-[var(--available-height)] overflow-y-auto p-10 border border-solid border-border rounded-10 bg-surface text-text shadow-menu"
						dir={dir}
					>
						<Dialog aria-label={label} className="outline-none">
							<Calendar
								aria-label={label}
								value={selected}
								createCalendar={gregorian}
								autoFocus
								isInvalid={Boolean(error)}
								onChange={(day) => {
									emit({ ...current, y: day.year, m: day.month, d: day.day });
									if (mode === "date") setOpen(false);
								}}
								className="flex flex-col gap-8"
							>
								<header className="flex items-center justify-between gap-8">
									<AriaButton
										slot="previous"
										aria-label={t("datepicker.prev")}
										className={calendarControl}
									>
										<span className="inline-flex -scale-x-100">
											<Icon name="chevronRight" size={16} />
										</span>
									</AriaButton>
									<Heading className="m-0 text-data! font-[600] text-text" />
									<AriaButton
										slot="next"
										aria-label={t("datepicker.next")}
										data-testid="date-next"
										className={calendarControl}
									>
										<Icon name="chevronRight" size={16} />
									</AriaButton>
								</header>
								<CalendarGrid
									className="w-full border-separate border-spacing-[2px]"
									weekdayStyle="narrow"
								>
									<CalendarGridHeader>
										{(day) => (
											<CalendarHeaderCell className="h-[28px] text-[11px] font-[600] text-text-3">
												{day}
											</CalendarHeaderCell>
										)}
									</CalendarGridHeader>
									<CalendarGridBody>
										{(day) => (
											<CalendarCell
												date={day}
												data-day={day.toString()}
												className={({ isOutsideMonth }) =>
													`grid place-items-center h-[34px] border border-solid border-transparent rounded-8 text-data text-text cursor-pointer data-[hovered]:bg-hover data-[selected]:bg-primary data-[selected]:text-primary-fg data-[selected]:font-[600] data-[today]:border-border-strong data-[disabled]:text-text-disabled data-[unavailable]:text-text-disabled data-[outside-month]:text-text-disabled ${choiceFocus}${isOutsideMonth ? " sy-date__outside" : ""}`
												}
												render={(domProps, state) => (
													<div
														{...domProps}
														data-outside={state.isOutsideMonth || undefined}
													/>
												)}
											/>
										)}
									</CalendarGridBody>
								</CalendarGrid>
							</Calendar>
							{mode === "datetime" ? (
								<div className="grid grid-cols-[1fr_1fr_auto] items-end gap-8 pt-8 mt-8 border-t border-solid border-divider">
									<Select
										label={t("datepicker.hour")}
										value={String(current.hh)}
										size="sm"
										data-testid="date-hour"
										onChange={(e) =>
											emit({ ...current, hh: Number(e.target.value) })
										}
									>
										{HOURS.map((h) => (
											<option key={h} value={String(h)}>
												{numeral.format(h)}
											</option>
										))}
									</Select>
									<Select
										label={t("datepicker.minute")}
										value={String(current.mm)}
										size="sm"
										data-testid="date-minute"
										onChange={(e) =>
											emit({ ...current, mm: Number(e.target.value) })
										}
									>
										{minutes.map((m) => (
											<option key={m} value={String(m)}>
												{numeral.format(m)}
											</option>
										))}
									</Select>
									<Button
										size="sm"
										variant="primary"
										onClick={() => setOpen(false)}
										data-testid="date-done"
									>
										{t("datepicker.done")}
									</Button>
								</div>
							) : null}
						</Dialog>
					</Popover>
				</DialogTrigger>
			)}
		</FieldShell>
	);
}
