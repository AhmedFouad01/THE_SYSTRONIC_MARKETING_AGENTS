import { Focusable, Tooltip, TooltipTrigger } from "react-aria-components";
import { useI18n } from "../i18n/I18nProvider.tsx";
import { ltrIsolate } from "../i18n/Ltr.tsx";

export const isUuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);

/** Technical identifiers are accessible on hover/focus; record binding and existing copy actions retain the value. */
export function Identity({ value, label }: { value: string; label?: string }) {
 const { t } = useI18n();
 return <TooltipTrigger delay={300}>
  <Focusable>
  {/* biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard users need focus to inspect this technical identifier tooltip */}
  <span tabIndex={0} title={ltrIsolate(value)} className="min-w-0 [overflow-wrap:anywhere] focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"><bdi>{label?.trim() || t("common.recordId")}</bdi></span></Focusable>
  <Tooltip placement="top" className="z-[1200] max-w-[min(360px,calc(100vw_-_16px))] rounded-8 border border-solid border-border bg-raised px-10 py-8 text-data text-text shadow-menu [overflow-wrap:anywhere]"><bdi dir="ltr">{value}</bdi></Tooltip>
 </TooltipTrigger>;
}
