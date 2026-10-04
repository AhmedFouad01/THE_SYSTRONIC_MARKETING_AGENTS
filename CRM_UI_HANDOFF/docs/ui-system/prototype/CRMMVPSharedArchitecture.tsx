import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import "./CRMMVPSharedArchitecture.css";
type Mode = "light" | "dark";
const BRAND = {
  navy: "#181D36",
  magenta: "#FF003C",
  magentaDark: "#E50036"
} as const;
type CRMRoute = "Leads" | "Contacts" | "Deals";
type IconName = "inbox" | "tasks" | "contacts" | "leads" | "deals" | "route" | "reports" | "settings" | "search" | "plus" | "upload" | "mail" | "phone" | "check" | "close" | "dots" | "arrow";
type Tokens = {
  canvas: string;
  surface: string;
  surface2: string;
  surface3: string;
  border: string;
  borderStrong: string;
  text: string;
  text2: string;
  text3: string;
  textDisabled: string;
  selected: string;
  hover: string;
  focus: string;
  focusRing: string;
  iconMuted: string;
  primary: string;
  primaryFg: string;
  create: string;
  createFg: string;
  primaryHover: string;
  primaryPressed: string;
  createHover: string;
  createPressed: string;
  dangerHover: string;
  dangerPressed: string;
  disabledBg: string;
  infoBg: string;
  infoFg: string;
  successBg: string;
  successFg: string;
  warningBg: string;
  warningFg: string;
  dangerBg: string;
  dangerFg: string;
  nav: string;
};
const THEMES: Record<Mode, Tokens> = {
  light: {
    canvas: "#F3F5F7",
    surface: "#FFFFFF",
    surface2: "#F7F9FB",
    surface3: "#EEF2F6",
    border: "#DDE3EA",
    borderStrong: "#C9D1DB",
    text: "#181D36",
    text2: "#475467",
    text3: "#667085",
    textDisabled: "#98A2B3",
    selected: "#D8F4FA",
    hover: "#EEF2F6",
    focus: "#009FD4",
    focusRing: "rgba(0,159,212,.16)",
    iconMuted: "#667085",
    primary: "#181D36",
    primaryFg: "#FFFFFF",
    create: "#00BFA6",
    createFg: "#042F2A",
    primaryHover: "#242B49",
    primaryPressed: "#0D1020",
    createHover: "#00A991",
    createPressed: "#008C79",
    dangerHover: "#FFE0E8",
    dangerPressed: "#FFC9D6",
    disabledBg: "#F2F4F7",
    infoBg: "#EEF6FF",
    infoFg: "#1557A0",
    successBg: "#DDF7E8",
    successFg: "#087443",
    warningBg: "#FFF6E5",
    warningFg: "#915A00",
    dangerBg: "#FFF0F4",
    dangerFg: "#B0002C",
    nav: "#FBFCFD"
  },
  dark: {
    canvas: "#090D14",
    surface: "#111722",
    surface2: "#171E29",
    surface3: "#202936",
    border: "#2B3442",
    borderStrong: "#3B4656",
    text: "#F7F9FC",
    text2: "#C3CAD4",
    text3: "#98A2B3",
    textDisabled: "#667085",
    selected: "#0B3A47",
    hover: "#1D2632",
    focus: "#7DE2FF",
    focusRing: "rgba(125,226,255,.22)",
    iconMuted: "#98A2B3",
    primary: "#00BEF6",
    primaryFg: "#0D1020",
    create: "#00BFA6",
    createFg: "#042F2A",
    primaryHover: "#3FD3FC",
    primaryPressed: "#00A8DD",
    createHover: "#00A991",
    createPressed: "#008C79",
    dangerHover: "#4C1824",
    dangerPressed: "#5B1B2A",
    disabledBg: "#1A2230",
    infoBg: "#102A43",
    infoFg: "#9DCCFF",
    successBg: "#0D2D20",
    successFg: "#7CE5AA",
    warningBg: "#35290C",
    warningFg: "#FFD16A",
    dangerBg: "#3A121C",
    dangerFg: "#FF9CB0",
    nav: "#0D121B"
  }
};
type ThemeCtx = {
  mode: Mode;
  t: Tokens;
  toggle: () => void;
};
const TC = createContext<ThemeCtx | null>(null);
function ThemeProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [mode, setMode] = useState<Mode>("light");
  const value = useMemo(() => ({
    mode,
    t: THEMES[mode],
    toggle: () => setMode(m => m === "light" ? "dark" : "light")
  }), [mode]);
  return <TC.Provider value={value}>{children}</TC.Provider>;
}
function useTheme() {
  const v = useContext(TC);
  if (!v) throw new Error("ThemeProvider missing");
  return v;
}
type Locale = "en" | "ar";
type LocaleCtx = {
  locale: Locale;
  dir: "ltr" | "rtl";
  toggleLocale: () => void;
  copy: (en: string, ar: string) => string;
};
const LC = createContext<LocaleCtx | null>(null);
function LocaleProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [locale, setLocale] = useState<Locale>("en");
  const value = useMemo(() => ({
    locale,
    dir: locale === "ar" ? "rtl" as const : "ltr" as const,
    toggleLocale: () => setLocale(v => v === "en" ? "ar" : "en"),
    copy: (en: string, ar: string) => locale === "ar" ? ar : en
  }), [locale]);
  return <LC.Provider value={value}>{children}</LC.Provider>;
}
function useLocale() {
  const v = useContext(LC);
  if (!v) throw new Error("LocaleProvider missing");
  return v;
}
function Icon({
  name,
  size = 18
}: {
  name: IconName;
  size?: number;
}) {
  const {
    dir
  } = useLocale();
  const p = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const
  };
  let b: React.ReactNode;
  switch (name) {
    case "inbox":
      b = <><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M4 13h4l2 3h4l2-3h4" /></>;
      break;
    case "tasks":
      b = <><rect x="5" y="4" width="14" height="16" rx="2" /><path d="m8 9 1.5 1.5L12 8" /><path d="M14 9h2.5M8 15h8.5" /></>;
      break;
    case "contacts":
      b = <><circle cx="9" cy="9" r="3" /><path d="M4.5 19c.7-3 2.3-4.5 4.5-4.5s3.8 1.5 4.5 4.5" /><circle cx="16.5" cy="8" r="2" /></>;
      break;
    case "leads":
      b = <><circle cx="9" cy="9" r="3" /><path d="M4.5 19c.8-3.1 2.3-4.5 4.5-4.5" /><path d="M17 13v6M14 16h6" /></>;
      break;
    case "deals":
      b = <><rect x="3.5" y="7" width="17" height="12" rx="2" /><path d="M8 7V5h8v2M3.5 12h17" /></>;
      break;
    case "route":
      b = <><circle cx="6" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><path d="M8 6h4c3 0 4 2 4 4s-1 4-4 4H9c-2 0-3 1.5-3 3v1" /></>;
      break;
    case "reports":
      b = <><path d="M4 20V10h4v10M10 20V4h4v16M16 20v-7h4v7" /><path d="M3 20h18" /></>;
      break;
    case "settings":
      b = <><path d="M4 7h10M18 7h2M4 17h2M10 17h10M4 12h4M12 12h8" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /><circle cx="10" cy="12" r="2" /></>;
      break;
    case "search":
      b = <><circle cx="10.5" cy="10.5" r="5.5" /><path d="m15 15 5 5" /></>;
      break;
    case "plus":
      b = <><path d="M12 5v14M5 12h14" /></>;
      break;
    case "upload":
      b = <><path d="M12 16V5M8 9l4-4 4 4" /><path d="M5 15v4h14v-4" /></>;
      break;
    case "mail":
      b = <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>;
      break;
    case "phone":
      b = <path d="M7 4 4.5 6.5c1 5.5 7.5 12 13 13L20 17l-4-3-2 2c-2.7-1.4-4.6-3.3-6-6l2-2-3-4Z" />;
      break;
    case "check":
      b = <><circle cx="12" cy="12" r="8" /><path d="m8.5 12 2.2 2.2L16 9" /></>;
      break;
    case "close":
      b = <><circle cx="12" cy="12" r="8" /><path d="m9 9 6 6M15 9l-6 6" /></>;
      break;
    case "dots":
      b = <><circle cx="6" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="18" cy="12" r="1" /></>;
      break;
    case "arrow":
      b = <><path d="M5 12h14M14 7l5 5-5 5" /></>;
      break;
    default:
      b = <circle cx="12" cy="12" r="7" />;
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" style={name === "arrow" && dir === "rtl" ? {
    transform: "scaleX(-1)"
  } : undefined} {...p}>{b}</svg>;
}
function Panel({
  children,
  pad = 14
}: {
  children: React.ReactNode;
  pad?: number;
}) {
  const {
    t
  } = useTheme();
  return <section style={{
    background: t.surface,
    border: "1px solid " + t.border,
    borderRadius: 11,
    padding: pad
  }}>{children}</section>;
}
function Button({
  children,
  icon,
  intent = "secondary",
  onClick,
  disabled = false,
  loading = false,
  type = "button",
  ariaLabel,
  buttonRef
}: {
  children: React.ReactNode;
  icon?: IconName;
  intent?: "primary" | "secondary" | "create" | "danger";
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  ariaLabel?: string;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  const {
    t
  } = useTheme();
  const {
    copy
  } = useLocale();
  const cfg = intent === "primary" ? {
    bg: t.primary,
    fg: t.primaryFg,
    border: t.primary,
    hover: t.primaryHover,
    pressed: t.primaryPressed
  } : intent === "create" ? {
    bg: t.create,
    fg: t.createFg,
    border: t.create,
    hover: t.createHover,
    pressed: t.createPressed
  } : intent === "danger" ? {
    bg: t.dangerBg,
    fg: t.dangerFg,
    border: t.border,
    hover: t.dangerHover,
    pressed: t.dangerPressed
  } : {
    bg: t.surface,
    fg: t.text,
    border: t.borderStrong,
    hover: t.hover,
    pressed: t.surface3
  };
  const vars = {
    "--btn-hover": cfg.hover,
    "--btn-pressed": cfg.pressed
  } as React.CSSProperties;
  return <button ref={buttonRef} type={type} className="sy-btn sy-focusable" aria-label={ariaLabel} aria-busy={loading || undefined} disabled={disabled || loading} onClick={onClick} style={{
    ...vars,
    height: 36,
    border: "1px solid " + cfg.border,
    borderRadius: 8,
    background: disabled ? t.disabledBg : cfg.bg,
    color: disabled ? t.textDisabled : cfg.fg,
    padding: "0 11px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    fontFamily: "inherit",
    fontSize: 11,
    fontWeight: intent === "secondary" ? 600 : 750,
    cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled ? .72 : 1
  }}>{loading ? <span className="sy-spinner" aria-hidden="true" /> : icon && <Icon name={icon} size={14} />}<span>{loading ? copy("Working…", "جارٍ التنفيذ…") : children}</span></button>;
}
function Badge({
  children,
  tone = "neutral"
}: {
  children: React.ReactNode;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
}) {
  const {
    t
  } = useTheme();
  const s = tone === "info" ? [t.infoBg, t.infoFg] : tone === "success" ? [t.successBg, t.successFg] : tone === "warning" ? [t.warningBg, t.warningFg] : tone === "danger" ? [t.dangerBg, t.dangerFg] : [t.surface3, t.text2];
  return <span style={{
    display: "inline-flex",
    padding: "4px 8px",
    borderRadius: 999,
    background: s[0],
    color: s[1],
    fontSize: 10,
    fontWeight: 700
  }}>{children}</span>;
}
function Pair({
  label,
  value
}: {
  label: string;
  value: React.ReactNode;
}) {
  const {
    t
  } = useTheme();
  return <div><div style={{
      fontSize: 10,
      color: t.text3
    }}>{label}</div><div style={{
      fontSize: 12,
      fontWeight: 700,
      marginTop: 4
    }}>{value}</div></div>;
}
function MetricValue({
  children
}: {
  children: React.ReactNode;
}) {
  return <bdi dir="ltr" style={{
    unicodeBidi: "isolate",
    fontVariantNumeric: "tabular-nums"
  }}>{children}</bdi>;
}
function KpiWidget({
  label,
  value,
  variant = "neutral"
}: {
  label: string;
  value: React.ReactNode;
  variant?: "neutral" | "navy" | "magenta";
}) {
  const {
    t,
    mode
  } = useTheme();
  const cfg = variant === "navy" ? {
    bg: BRAND.navy,
    fg: "#FFFFFF",
    sub: "rgba(255,255,255,.72)",
    border: "transparent"
  } : variant === "magenta" ? {
    bg: mode === "light" ? BRAND.magenta : BRAND.magentaDark,
    fg: mode === "light" ? "#0D1020" : "#FFFFFF",
    sub: mode === "light" ? "rgba(13,16,32,.74)" : "rgba(255,255,255,.78)",
    border: "transparent"
  } : {
    bg: t.surface,
    fg: t.text,
    sub: t.text3,
    border: t.border
  };
  return <section className={"sy-kpi-card sy-kpi-" + variant} style={{
    background: cfg.bg,
    color: cfg.fg,
    border: "1px solid " + cfg.border,
    borderRadius: 11,
    padding: 14,
    minHeight: 76
  }}>
    <div style={{
      fontSize: 10,
      color: cfg.sub,
      fontWeight: 650
    }}>{label}</div>
    <div style={{
      fontSize: 20,
      fontWeight: 800,
      marginTop: 6,
      letterSpacing: "-.015em"
    }}>{value}</div>
  </section>;
}
function A11yStyles() {
  const css = ".sy-focusable:focus-visible{outline:2px solid var(--sy-focus);outline-offset:2px}.sy-btn:hover:not(:disabled){background:var(--btn-hover)!important}.sy-btn:active:not(:disabled){background:var(--btn-pressed)!important}.sy-nav:not([aria-current='page']):hover:not(:disabled){background:var(--sy-hover)!important}.sy-input:focus-visible{outline:2px solid var(--sy-focus);outline-offset:1px;border-color:var(--sy-focus)!important}.sy-tab:focus-visible,.sy-icon-btn:focus-visible,.sy-menu-item:focus-visible{outline:2px solid var(--sy-focus);outline-offset:2px}.sy-menu-item:hover{background:var(--sy-hover)!important}@keyframes sy-spin{to{transform:rotate(360deg)}}.sy-spinner{width:12px;height:12px;border-radius:999px;border:2px solid currentColor;border-right-color:transparent;animation:sy-spin .7s linear infinite}@media(prefers-reduced-motion:reduce){.sy-spinner{animation:none}*{scroll-behavior:auto!important;transition:none!important}}";
  return <style>{css}</style>;
}
function IconButton({
  label,
  icon,
  onClick,
  expanded,
  refEl
}: {
  label: string;
  icon: IconName;
  onClick?: () => void;
  expanded?: boolean;
  refEl?: React.RefObject<HTMLButtonElement | null>;
}) {
  const {
    t
  } = useTheme();
  return <button ref={refEl} type="button" className="sy-icon-btn" aria-label={label} aria-expanded={expanded} onClick={onClick} style={{
    width: 36,
    height: 36,
    border: "1px solid " + t.border,
    borderRadius: 8,
    background: t.surface,
    color: t.text2,
    display: "grid",
    placeItems: "center",
    cursor: "pointer"
  }}><Icon name={icon} size={16} /></button>;
}
function TextInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  error,
  disabled = false
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ariaLabel: string;
  error?: string;
  disabled?: boolean;
}) {
  const {
    t
  } = useTheme();
  const errId = ariaLabel.replace(/\s+/g, "-") + "-error";
  return <div style={{
    width: "100%"
  }}>
    <input className="sy-input" aria-label={ariaLabel} aria-invalid={!!error} aria-describedby={error ? errId : undefined} disabled={disabled} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{
      width: "100%",
      height: 36,
      boxSizing: "border-box",
      border: "1px solid " + (error ? t.dangerFg : t.borderStrong),
      borderRadius: 7,
      background: disabled ? t.disabledBg : t.surface,
      color: disabled ? t.textDisabled : t.text,
      padding: "0 10px",
      fontFamily: "inherit",
      fontSize: 12
    }} />
    {error && <div id={errId} role="alert" style={{
      fontSize: 10,
      color: t.dangerFg,
      marginTop: 4
    }}>{error}</div>}
  </div>;
}
function Tabs({
  items,
  active,
  onChange,
  label,
  labels
}: {
  items: string[];
  active: string;
  onChange: (v: string) => void;
  label: string;
  labels?: Record<string, string>;
}) {
  const {
    t
  } = useTheme();
  const {
    dir
  } = useLocale();
  const onKey = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    let next = i;
    if (e.key === "ArrowRight") next = dir === "rtl" ? (i - 1 + items.length) % items.length : (i + 1) % items.length;else if (e.key === "ArrowLeft") next = dir === "rtl" ? (i + 1) % items.length : (i - 1 + items.length) % items.length;else if (e.key === "Home") next = 0;else if (e.key === "End") next = items.length - 1;else return;
    e.preventDefault();
    onChange(items[next]);
    const parent = e.currentTarget.parentElement;
    (parent?.children[next] as HTMLElement | undefined)?.focus();
  };
  return <div role="tablist" aria-label={label} className="sy-tabs" style={{
    display: "flex",
    gap: 2,
    borderBottom: "1px solid " + t.border
  }}>
    {items.map((x, i) => <button key={x} role="tab" className="sy-tab" aria-selected={active === x} tabIndex={active === x ? 0 : -1} onClick={() => onChange(x)} onKeyDown={e => onKey(e, i)} style={{
      height: 38,
      border: 0,
      borderBottom: active === x ? "2px solid " + t.focus : "2px solid transparent",
      background: "transparent",
      color: active === x ? t.text : t.text3,
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: active === x ? 750 : 500,
      padding: "0 12px",
      cursor: "pointer"
    }}>{labels?.[x] ?? x}</button>)}
  </div>;
}
function EmptyState({
  title,
  body
}: {
  title: string;
  body: string;
}) {
  const {
    t
  } = useTheme();
  return <div role="status" style={{
    padding: "46px 20px",
    textAlign: "center"
  }}>
    <div style={{
      width: 42,
      height: 42,
      borderRadius: 10,
      background: t.surface3,
      display: "grid",
      placeItems: "center",
      margin: "0 auto",
      color: t.text3
    }}><Icon name="search" size={18} /></div>
    <div style={{
      marginTop: 10,
      fontWeight: 750
    }}>{title}</div><div style={{
      marginTop: 4,
      fontSize: 11,
      color: t.text3
    }}>{body}</div>
  </div>;
}
function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
  returnFocusRef
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  returnFocusRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  const {
    t
  } = useTheme();
  const {
    copy
  } = useLocale();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);
  if (!open) return null;
  const closeAndReturn = () => {
    onClose();
    setTimeout(() => returnFocusRef?.current?.focus(), 0);
  };
  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeAndReturn();
      return;
    }
    if (e.key === "Tab") {
      const a = cancelRef.current,
        b = confirmRef.current;
      if (!a || !b) return;
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault();
        b.focus();
      } else if (!e.shiftKey && document.activeElement === b) {
        e.preventDefault();
        a.focus();
      }
    }
  };
  return <div role="presentation" style={{
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    background: "rgba(9,13,20,.55)",
    display: "grid",
    placeItems: "center",
    padding: 20
  }}>
    <div role="dialog" aria-modal="true" aria-labelledby="sy-dialog-title" aria-describedby="sy-dialog-desc" onKeyDown={onKey} style={{
      width: 380,
      maxWidth: "100%",
      background: t.surface,
      color: t.text,
      border: "1px solid " + t.border,
      borderRadius: 12,
      padding: 18,
      boxShadow: "0 24px 70px rgba(0,0,0,.26)"
    }}>
      <div id="sy-dialog-title" style={{
        fontSize: 16,
        fontWeight: 800
      }}>{title}</div>
      <div id="sy-dialog-desc" style={{
        marginTop: 7,
        fontSize: 12,
        lineHeight: "18px",
        color: t.text2
      }}>{description}</div>
      <div style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 8,
        marginTop: 18
      }}>
        <button ref={cancelRef} className="sy-focusable" onClick={closeAndReturn} style={{
          height: 36,
          border: "1px solid " + t.borderStrong,
          borderRadius: 8,
          background: t.surface,
          color: t.text,
          padding: "0 12px",
          fontFamily: "inherit"
        }}>{copy("Cancel", "إلغاء")}</button>
        <button ref={confirmRef} className="sy-focusable" onClick={onConfirm} style={{
          height: 36,
          border: "1px solid " + t.dangerFg,
          borderRadius: 8,
          background: t.dangerFg,
          color: "#fff",
          padding: "0 12px",
          fontFamily: "inherit",
          fontWeight: 750
        }}>{confirmLabel}</button>
      </div>
    </div>
  </div>;
}
function MenuPopover({
  open,
  onClose,
  triggerRef,
  children
}: {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  children: React.ReactNode;
}) {
  const {
    t
  } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) (menuRef.current?.querySelector("button") as HTMLButtonElement | null)?.focus();
  }, [open]);
  if (!open) return null;
  const key = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const buttons = Array.from(menuRef.current?.querySelectorAll("button:not(:disabled)") || []) as HTMLButtonElement[];
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      triggerRef.current?.focus();
      return;
    }
    let next = current;
    if (e.key === "ArrowDown") next = current < 0 ? 0 : (current + 1) % buttons.length;else if (e.key === "ArrowUp") next = current < 0 ? buttons.length - 1 : (current - 1 + buttons.length) % buttons.length;else if (e.key === "Home") next = 0;else if (e.key === "End") next = buttons.length - 1;else return;
    e.preventDefault();
    buttons[next]?.focus();
  };
  return <div ref={menuRef} role="menu" onKeyDown={key} style={{
    position: "absolute",
    insetInlineEnd: 0,
    top: 42,
    width: 190,
    zIndex: 30,
    background: t.surface,
    border: "1px solid " + t.border,
    borderRadius: 9,
    padding: 6,
    boxShadow: "0 14px 34px rgba(0,0,0,.16)"
  }}>{children}</div>;
}
const NAV: Array<{
  key: string;
  en: string;
  ar: string;
  icon: IconName;
  route: CRMRoute | null;
}> = [{
  key: "Inbox",
  en: "Inbox",
  ar: "الوارد",
  icon: "inbox",
  route: null
}, {
  key: "Tasks",
  en: "My tasks",
  ar: "مهامي",
  icon: "tasks",
  route: null
}, {
  key: "Contacts",
  en: "Contacts",
  ar: "جهات الاتصال",
  icon: "contacts",
  route: "Contacts"
}, {
  key: "Leads",
  en: "Leads",
  ar: "العملاء المحتملون",
  icon: "leads",
  route: "Leads"
}, {
  key: "Deals",
  en: "Deals",
  ar: "الصفقات",
  icon: "deals",
  route: "Deals"
}, {
  key: "Pipeline",
  en: "Pipeline",
  ar: "مسار المبيعات",
  icon: "route",
  route: null
}, {
  key: "Journey",
  en: "Journey",
  ar: "رحلة العميل",
  icon: "route",
  route: null
}, {
  key: "Reports",
  en: "Reports",
  ar: "التقارير",
  icon: "reports",
  route: null
}, {
  key: "Settings",
  en: "Settings",
  ar: "الإعدادات",
  icon: "settings",
  route: null
}];
function AppShell({
  active,
  setRoute,
  children
}: {
  active: CRMRoute;
  setRoute: (r: CRMRoute) => void;
  children: React.ReactNode;
}) {
  const {
    mode,
    t,
    toggle
  } = useTheme();
  const {
    locale,
    dir,
    toggleLocale,
    copy
  } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const rootVars = {
    "--sy-focus": t.focus,
    "--sy-hover": t.hover
  } as React.CSSProperties;
  const activeLabel = active === "Leads" ? copy("Leads", "العملاء المحتملون") : active === "Contacts" ? copy("Contacts", "جهات الاتصال") : copy("Deals", "الصفقات");
  return <div className="sy-shell" dir={dir} lang={locale} style={{
    ...rootVars,
    minHeight: "100vh",
    background: t.canvas,
    color: t.text,
    fontFamily: locale === "ar" ? 'Cairo, Alexandria, "IBM Plex Sans Arabic", Arial, sans-serif' : "Inter,Arial,sans-serif",
    display: "grid",
    gridTemplateColumns: "228px minmax(0,1fr)",
    fontSize: 14
  }}>
    <aside className="sy-sidebar" style={{
      background: t.nav,
      borderInlineEnd: "1px solid " + t.border,
      padding: "18px 14px",
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh"
    }}>
      <div className="sy-brand" style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "2px 8px 14px"
      }}>
        <div style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          display: "grid",
          placeItems: "center",
          background: "#181D36",
          color: "#fff",
          fontWeight: 800,
          fontSize: 11
        }}>TS</div>
        <div className="sy-brand-copy"><div style={{
            fontWeight: 800,
            fontSize: 12
          }}>THE SYSTRONIC</div><div style={{
            fontSize: 11,
            color: t.text3,
            marginTop: 2
          }}>{copy("CRM Workspace", "مساحة عمل CRM")}</div></div>
      </div>


      <nav className="sy-primary-nav" aria-label={copy("Primary navigation", "التنقل الرئيسي")} style={{
        display: "grid",
        gap: 3,
        marginTop: 8
      }}>
        <div className="sy-nav-section-label" style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: ".12em",
          color: t.text3,
          padding: "8px 10px 5px"
        }}>CRM</div>
        {NAV.map(item => {
          const on = item.route === active;
          return <button key={item.key} className={"sy-nav sy-focusable " + (item.route ? "sy-route" : "sy-placeholder")} disabled={!item.route} onClick={() => item.route && setRoute(item.route)} aria-current={on ? "page" : undefined} style={{
            height: 38,
            border: 0,
            borderRadius: 8,
            background: on ? t.selected : "transparent",
            color: on ? t.text : t.text2,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 10px",
            fontFamily: "inherit",
            fontSize: 13,
            textAlign: "start",
            opacity: item.route ? 1 : .56,
            cursor: item.route ? "pointer" : "not-allowed"
          }}>
            <span style={{
              color: on ? t.focus : t.iconMuted,
              display: "grid"
            }}><Icon name={item.icon} size={17} /></span>
            <span className="sy-nav-label">{locale === "ar" ? item.ar : item.en}</span>
          </button>;
        })}
      </nav>


      <div className="sy-user-block" style={{
        marginTop: "auto",
        borderTop: "1px solid " + t.border,
        paddingTop: 14
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "0 8px"
        }}>
          <div style={{
            width: 30,
            height: 30,
            borderRadius: 999,
            background: t.surface3,
            display: "grid",
            placeItems: "center",
            fontWeight: 700,
            fontSize: 11
          }}>AF</div>
          <div className="sy-user-copy"><div style={{
              fontSize: 12,
              fontWeight: 700
            }}>Ahmed Fouad</div><div style={{
              fontSize: 10,
              color: t.text3
            }}>{copy("Admin", "مدير النظام")}</div></div>
        </div>
      </div>
    </aside>


    <main className="sy-main" style={{
      minWidth: 0
    }}>
      <header className="sy-topbar" style={{
        height: 62,
        background: t.surface,
        borderBottom: "1px solid " + t.border,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 22px"
      }}>
        <div style={{
          fontSize: 12,
          color: t.text3
        }}>CRM <span aria-hidden="true">{dir === "rtl" ? "‹" : "›"}</span> {activeLabel}</div>
        <div style={{
          position: "relative"
        }}>
          <IconButton refEl={triggerRef} label={copy("Workspace actions", "إجراءات مساحة العمل")} icon="dots" expanded={menuOpen} onClick={() => setMenuOpen(v => !v)} />
          <MenuPopover open={menuOpen} onClose={() => setMenuOpen(false)} triggerRef={triggerRef}>
            <button role="menuitem" className="sy-menu-item sy-focusable" onClick={() => {
              toggleLocale();
              setMenuOpen(false);
            }} style={{
              width: "100%",
              height: 34,
              border: 0,
              borderRadius: 6,
              background: "transparent",
              color: t.text,
              textAlign: "start",
              padding: "0 9px",
              fontFamily: "inherit",
              fontSize: 11
            }}>{locale === "ar" ? "English" : "العربية"}</button>
            <button role="menuitem" className="sy-menu-item sy-focusable" onClick={() => {
              toggle();
              setMenuOpen(false);
            }} style={{
              width: "100%",
              height: 34,
              border: 0,
              borderRadius: 6,
              background: "transparent",
              color: t.text,
              textAlign: "start",
              padding: "0 9px",
              fontFamily: "inherit",
              fontSize: 11
            }}>{copy("Switch to " + (mode === "dark" ? "Light" : "Dark") + " mode", mode === "dark" ? "الوضع الفاتح" : "الوضع الداكن")}</button>
            {active !== "Leads" && <button role="menuitem" className="sy-menu-item sy-focusable" onClick={() => {
              setRoute("Leads");
              setMenuOpen(false);
            }} style={{
              width: "100%",
              height: 34,
              border: 0,
              borderRadius: 6,
              background: "transparent",
              color: t.text,
              textAlign: "start",
              padding: "0 9px",
              fontFamily: "inherit",
              fontSize: 11
            }}>{copy("Back to Leads", "العودة للعملاء المحتملين")}</button>}
          </MenuPopover>
        </div>
      </header>
      {children}
    </main>
  </div>;
}
type LeadRecord = {
  id: string;
  name: string;
  company: string;
  stage: "New" | "Qualified" | "Proposal";
  owner: string;
  source: string;
  value: number;
  score: number;
  lastActivity: string;
  email: string;
  phone: string;
};
type LeadColumn = "lead" | "stage" | "owner" | "source" | "value" | "score" | "activity";
type SortKey = "name" | "stage" | "owner" | "source" | "value" | "score" | "lastActivity";
type SortDir = "asc" | "desc";
const LEADS: LeadRecord[] = [{
  id: "LD-1042",
  name: "Ahmed Fathy",
  company: "Nile Developments",
  stage: "Qualified",
  owner: "M. Hassan",
  source: "Meta",
  value: 145000,
  score: 86,
  lastActivity: "12 min ago",
  email: "ahmed@niledev.com",
  phone: "+20 10 2156 4300"
}, {
  id: "LD-1041",
  name: "Mariam Ali",
  company: "Orbit Interiors",
  stage: "Proposal",
  owner: "Sara A.",
  source: "Website",
  value: 310000,
  score: 92,
  lastActivity: "38 min ago",
  email: "mariam@orbit.co",
  phone: "+20 11 8842 2101"
}, {
  id: "LD-1039",
  name: "Omar Nabil",
  company: "Delta Group",
  stage: "New",
  owner: "Unassigned",
  source: "Referral",
  value: 92000,
  score: 61,
  lastActivity: "1h ago",
  email: "omar@delta-group.com",
  phone: "+20 12 9971 4012"
}, {
  id: "LD-1038",
  name: "Reem Adel",
  company: "Vertex Retail",
  stage: "Qualified",
  owner: "M. Hassan",
  source: "Direct",
  value: 225000,
  score: 79,
  lastActivity: "2h ago",
  email: "reem@vertexretail.com",
  phone: "+20 10 4367 0088"
}, {
  id: "LD-1036",
  name: "Karim Youssef",
  company: "Apex Hospitality",
  stage: "Proposal",
  owner: "Omar N.",
  source: "Meta",
  value: 418000,
  score: 95,
  lastActivity: "Yesterday",
  email: "karim@apexhospitality.com",
  phone: "+20 11 3096 7744"
}, {
  id: "LD-1033",
  name: "Laila Samir",
  company: "North Star",
  stage: "Qualified",
  owner: "Sara A.",
  source: "Website",
  value: 180000,
  score: 89,
  lastActivity: "Yesterday",
  email: "laila@northstar.eg",
  phone: "+20 12 1182 5533"
}, {
  id: "LD-1031",
  name: "Tarek Hany",
  company: "Urban Nest",
  stage: "New",
  owner: "Unassigned",
  source: "Meta",
  value: 76000,
  score: 58,
  lastActivity: "2d ago",
  email: "tarek@urbannest.eg",
  phone: "+20 10 5301 2100"
}, {
  id: "LD-1028",
  name: "Nour Magdy",
  company: "Core Systems",
  stage: "Qualified",
  owner: "M. Hassan",
  source: "Referral",
  value: 264000,
  score: 83,
  lastActivity: "2d ago",
  email: "nour@coresystems.io",
  phone: "+20 11 7540 3311"
}, {
  id: "LD-1025",
  name: "Youssef Emad",
  company: "Bridge Logistics",
  stage: "Proposal",
  owner: "Omar N.",
  source: "Website",
  value: 355000,
  score: 90,
  lastActivity: "3d ago",
  email: "youssef@bridge-logistics.com",
  phone: "+20 12 4208 1902"
}, {
  id: "LD-1022",
  name: "Salma Adel",
  company: "Vista Foods",
  stage: "New",
  owner: "Unassigned",
  source: "Direct",
  value: 110000,
  score: 67,
  lastActivity: "4d ago",
  email: "salma@vistafoods.com",
  phone: "+20 10 6604 8521"
}, {
  id: "LD-1019",
  name: "Hesham Khaled",
  company: "Prime Health",
  stage: "Qualified",
  owner: "M. Hassan",
  source: "Meta",
  value: 198000,
  score: 81,
  lastActivity: "5d ago",
  email: "hesham@primehealth.eg",
  phone: "+20 11 2045 9670"
}, {
  id: "LD-1015",
  name: "Dina Ashraf",
  company: "Everline",
  stage: "Proposal",
  owner: "Sara A.",
  source: "Referral",
  value: 287000,
  score: 88,
  lastActivity: "6d ago",
  email: "dina@everline.co",
  phone: "+20 12 7731 4410"
}];
const COLUMN_LABELS: Record<LeadColumn, string> = {
  lead: "Lead",
  stage: "Stage",
  owner: "Owner",
  source: "Source",
  value: "Value",
  score: "Score",
  activity: "Activity"
};
const COLUMN_SORT: Partial<Record<LeadColumn, SortKey>> = {
  lead: "name",
  stage: "stage",
  owner: "owner",
  source: "source",
  value: "value",
  score: "score",
  activity: "lastActivity"
};
function LeadStageBadge({
  stage
}: {
  stage: LeadRecord["stage"];
}) {
  return <Badge tone={stage === "Qualified" ? "success" : stage === "Proposal" ? "warning" : "info"}>{stage}</Badge>;
}
function LeadsView({
  openRecord,
  selectedLeadId,
  onSelectLead
}: {
  openRecord: (route: CRMRoute, id: string) => void;
  selectedLeadId: string;
  onSelectLead: (id: string) => void;
}) {
  const {
    t
  } = useTheme();
  const {
    locale,
    dir,
    copy
  } = useLocale();
  const [data, setData] = useState<LeadRecord[]>(LEADS);
  const [q, setQ] = useState("");
  const [view, setView] = useState("All leads");
  const [stageFilter, setStageFilter] = useState("All");
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [highScore, setHighScore] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const columnsTrigger = useRef<HTMLButtonElement>(null);
  const columnsPanel = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState<Record<LeadColumn, boolean>>({
    lead: true,
    stage: true,
    owner: true,
    source: true,
    value: true,
    score: true,
    activity: true
  });
  useEffect(() => {
    setPage(1);
  }, [q, view, stageFilter, ownerFilter, highScore, pageSize]);
  useEffect(() => {
    if (columnsOpen) (columnsPanel.current?.querySelector("input") as HTMLInputElement | null)?.focus();
  }, [columnsOpen]);
  const col = (key: LeadColumn) => ({
    lead: copy("Lead", "العميل المحتمل"),
    stage: copy("Stage", "المرحلة"),
    owner: copy("Owner", "المسؤول"),
    source: copy("Source", "المصدر"),
    value: copy("Value", "القيمة"),
    score: copy("Score", "التقييم"),
    activity: copy("Activity", "النشاط")
  } as Record<LeadColumn, string>)[key];
  const stageLabel = (s: LeadRecord["stage"]) => s === "New" ? copy("New", "جديد") : s === "Qualified" ? copy("Qualified", "مؤهل") : copy("Proposal", "عرض");
  const filtered = useMemo(() => {
    const rows = data.filter(l => {
      const hay = [l.name, l.company, l.email, l.source, l.stage, l.owner, l.id].join(" ").toLowerCase();
      const query = hay.includes(q.toLowerCase());
      const saved = view === "All leads" || view === "My leads" && l.owner === "M. Hassan" || view === "Unassigned" && l.owner === "Unassigned";
      const stage = stageFilter === "All" || l.stage === stageFilter;
      const owner = ownerFilter === "All" || l.owner === ownerFilter;
      const score = !highScore || l.score >= 85;
      return query && saved && stage && owner && score;
    });
    return [...rows].sort((x, y) => {
      const av = x[sortKey],
        bv = y[sortKey];
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, q, view, stageFilter, ownerFilter, highScore, sortKey, sortDir]);
  useEffect(() => {
    if (filtered.length && !filtered.some(x => x.id === selectedLeadId)) onSelectLead(filtered[0].id);
  }, [filtered, selectedLeadId, onSelectLead]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const selected = data.find(x => x.id === selectedLeadId) || pageRows[0] || data[0];
  const activeColumns = (Object.keys(visible) as LeadColumn[]).filter(k => visible[k]);
  const rowPad = density === "compact" ? "7px 10px" : "11px 10px";
  const toggleSort = (column: LeadColumn) => {
    const key = COLUMN_SORT[column];
    if (!key) return;
    if (sortKey === key) setSortDir(v => v === "asc" ? "desc" : "asc");else {
      setSortKey(key);
      setSortDir("asc");
    }
  };
  const sortState = (column: LeadColumn): "ascending" | "descending" | undefined => COLUMN_SORT[column] === sortKey ? sortDir === "asc" ? "ascending" : "descending" : undefined;
  const allPageSelected = pageRows.length > 0 && pageRows.every(r => selectedRows.has(r.id));
  const togglePage = () => setSelectedRows(prev => {
    const next = new Set(prev);
    if (allPageSelected) pageRows.forEach(r => next.delete(r.id));else pageRows.forEach(r => next.add(r.id));
    return next;
  });
  const toggleRow = (id: string) => setSelectedRows(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);else next.add(id);
    return next;
  });
  const assignToMe = () => {
    setData(rows => rows.map(r => selectedRows.has(r.id) ? {
      ...r,
      owner: "M. Hassan"
    } : r));
    setSelectedRows(new Set());
  };
  const clearFilters = () => {
    setStageFilter("All");
    setOwnerFilter("All");
    setHighScore(false);
  };
  const formatValue = (n: number) => new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(n) + " EGP";
  return <div className="sy-page" style={{
    padding: 22
  }}>
    <div className="sy-page-head" style={{
      display: "flex",
      justifyContent: "space-between",
      gap: 16
    }}>
      <div><h1 style={{
          fontSize: 28,
          margin: 0
        }}>{copy("Leads", "العملاء المحتملون")}</h1><p style={{
          margin: "6px 0 0",
          color: t.text2,
          fontSize: 13
        }}>{copy("Capture, qualify and convert incoming opportunities.", "استقبل العملاء المحتملين، قيّمهم وحوّلهم إلى فرص بيع.")}</p></div>
      <div className="sy-page-actions" style={{
        display: "flex",
        gap: 8
      }}><Button icon="upload" disabled ariaLabel={copy("Import — not available in this prototype", "الاستيراد — غير متاح في هذا النموذج")}>{copy("Import", "استيراد")}</Button><Button intent="create" icon="plus" disabled ariaLabel={copy("New lead — not available in this prototype", "عميل محتمل جديد — غير متاح في هذا النموذج")}>{copy("New lead", "عميل محتمل جديد")}</Button></div>
    </div>


    <div className="sy-kpi-grid" style={{
      marginTop: 18,
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 10
    }}>
      <KpiWidget label={copy("Open leads", "عملاء مفتوحون")} value={<MetricValue>128</MetricValue>} />
      <KpiWidget label={copy("Qualified", "مؤهلون")} value={<MetricValue>42</MetricValue>} variant="navy" />
      <KpiWidget label={copy("Pipeline value", "قيمة المسار")} value={<MetricValue>EGP 3.8M</MetricValue>} variant="magenta" />
      <KpiWidget label={copy("Avg. response", "متوسط الاستجابة")} value={<MetricValue>18m</MetricValue>} />
    </div>


    <div style={{
      marginTop: 14
    }}><Tabs items={["All leads", "My leads", "Unassigned"]} active={view} onChange={setView} label={copy("Saved lead views", "طرق عرض العملاء المحتملين")} labels={locale === "ar" ? {
        "All leads": "الكل",
        "My leads": "الخاصة بي",
        "Unassigned": "غير معيّن"
      } : undefined} /></div>


    <div className="sy-data-toolbar" style={{
      marginTop: 10,
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap"
    }}>
      <div className="sy-search-wrap" style={{
        width: 280
      }}><TextInput value={q} onChange={setQ} placeholder={copy("Search name, company, source…", "ابحث بالاسم أو الشركة أو المصدر…")} ariaLabel={copy("Search leads", "بحث العملاء المحتملين")} /></div>
      <Button onClick={() => setFiltersOpen(v => !v)}>{copy("Filters", "الفلاتر")}{stageFilter !== "All" || ownerFilter !== "All" || highScore ? copy(" · Active", " · مفعلة") : ""}</Button>
      <Button onClick={() => setDensity(v => v === "comfortable" ? "compact" : "comfortable")}>{density === "comfortable" ? copy("Compact density", "عرض مضغوط") : copy("Comfortable density", "عرض مريح")}</Button>
      <div style={{
        position: "relative"
      }}>
        <Button buttonRef={columnsTrigger} ariaLabel={copy("Choose visible columns", "اختيار الأعمدة الظاهرة")} onClick={() => setColumnsOpen(v => !v)}>{copy("Columns", "الأعمدة")} · {activeColumns.length}</Button>
        {columnsOpen && <div ref={columnsPanel} role="dialog" aria-label={copy("Choose visible columns", "اختيار الأعمدة الظاهرة")} onKeyDown={e => {
          if (e.key === "Escape") {
            e.preventDefault();
            setColumnsOpen(false);
            columnsTrigger.current?.focus();
          }
        }} style={{
          position: "absolute",
          insetInlineEnd: 0,
          top: 42,
          width: 210,
          zIndex: 30,
          background: t.surface,
          border: "1px solid " + t.border,
          borderRadius: 9,
          padding: 9,
          boxShadow: "0 14px 34px rgba(0,0,0,.16)"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 5
          }}><b style={{
              fontSize: 11
            }}>{copy("Visible columns", "الأعمدة الظاهرة")}</b><button className="sy-focusable" aria-label={copy("Close column chooser", "إغلاق اختيار الأعمدة")} onClick={() => {
              setColumnsOpen(false);
              columnsTrigger.current?.focus();
            }} style={{
              width: 28,
              height: 28,
              border: 0,
              borderRadius: 6,
              background: "transparent",
              color: t.text2,
              cursor: "pointer"
            }}>×</button></div>
          {(Object.keys(COLUMN_LABELS) as LeadColumn[]).map(column => <label key={column} style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            minHeight: 32,
            padding: "0 4px",
            fontSize: 11,
            color: t.text
          }}><input type="checkbox" checked={visible[column]} disabled={column === "lead"} onChange={e => setVisible(v => ({
              ...v,
              [column]: e.target.checked
            }))} /><span>{col(column)}</span></label>)}
        </div>}
      </div>
      <div className="sy-match-count" style={{
        marginInlineStart: "auto",
        fontSize: 11,
        color: t.text3
      }}>{filtered.length} {copy("matching leads", "نتيجة")}</div>
    </div>


    {filtersOpen && <div className="sy-filter-panel" style={{
      marginTop: 8,
      display: "grid",
      gridTemplateColumns: "180px 180px 1fr auto",
      gap: 8,
      alignItems: "end",
      padding: 11,
      border: "1px solid " + t.border,
      borderRadius: 9,
      background: t.surface
    }}>
      <label style={{
        fontSize: 10,
        color: t.text3
      }}>{copy("Stage", "المرحلة")}<select className="sy-input" aria-label={copy("Filter by stage", "فلترة حسب المرحلة")} value={stageFilter} onChange={e => setStageFilter(e.target.value)} style={{
          display: "block",
          width: "100%",
          height: 34,
          marginTop: 5,
          border: "1px solid " + t.borderStrong,
          borderRadius: 7,
          background: t.surface,
          color: t.text,
          padding: "0 8px",
          fontFamily: "inherit"
        }}>{["All", "New", "Qualified", "Proposal"].map(x => <option key={x} value={x}>{x === "All" ? copy("All", "الكل") : stageLabel(x as LeadRecord["stage"])}</option>)}</select></label>
      <label style={{
        fontSize: 10,
        color: t.text3
      }}>{copy("Owner", "المسؤول")}<select className="sy-input" aria-label={copy("Filter by owner", "فلترة حسب المسؤول")} value={ownerFilter} onChange={e => setOwnerFilter(e.target.value)} style={{
          display: "block",
          width: "100%",
          height: 34,
          marginTop: 5,
          border: "1px solid " + t.borderStrong,
          borderRadius: 7,
          background: t.surface,
          color: t.text,
          padding: "0 8px",
          fontFamily: "inherit"
        }}>{["All", "M. Hassan", "Sara A.", "Omar N.", "Unassigned"].map(x => <option key={x}>{x === "All" ? copy("All", "الكل") : x === "Unassigned" ? copy("Unassigned", "غير معيّن") : x}</option>)}</select></label>
      <label style={{
        height: 34,
        display: "flex",
        alignItems: "center",
        gap: 7,
        fontSize: 11,
        color: t.text2
      }}><input type="checkbox" checked={highScore} onChange={e => setHighScore(e.target.checked)} />{copy("Lead score ≥ 85", "التقييم ≥ 85")}</label>
      <Button onClick={clearFilters}>{copy("Clear filters", "مسح الفلاتر")}</Button>
    </div>}


    <div className="sy-data-layout" style={{
      marginTop: 12,
      display: "grid",
      gridTemplateColumns: "minmax(0,1fr) 350px",
      gap: 12,
      alignItems: "start"
    }}>
      <section aria-label={copy("Lead data grid", "جدول العملاء المحتملين")} style={{
        background: t.surface,
        border: "1px solid " + t.border,
        borderRadius: 11,
        overflow: "hidden",
        minWidth: 0
      }}>
        {selectedRows.size > 0 && <div role="status" style={{
          minHeight: density === "compact" ? 38 : 44,
          background: t.selected,
          color: t.text,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 11px",
          borderBottom: "1px solid " + t.border
        }}>
          <b style={{
            fontSize: 11
          }}>{selectedRows.size} {copy("selected", "محدد")}</b><Button onClick={assignToMe}>{copy("Assign to me", "إسناد إليّ")}</Button><Button onClick={() => setSelectedRows(new Set())}>{copy("Clear selection", "إلغاء التحديد")}</Button>
        </div>}
        <div className="sy-table-scroll" style={{
          overflowX: "auto"
        }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
            minWidth: 720
          }}>
            <caption style={{
              position: "absolute",
              width: 1,
              height: 1,
              overflow: "hidden",
              clip: "rect(0 0 0 0)"
            }}>{copy("Lead data workspace with sorting, selection, filters and pagination.", "جدول العملاء المحتملين مع الترتيب والتحديد والفلاتر والتنقل بين الصفحات.")}</caption>
            <colgroup><col style={{
                width: 42
              }} />{activeColumns.map(column => <col key={column} style={{
                width: column === "lead" ? "220px" : column === "score" ? "72px" : column === "activity" ? "92px" : "105px"
              }} />)}</colgroup>
            <thead><tr style={{
                background: t.surface2
              }}>
              <th scope="col" style={{
                  padding: "9px 10px",
                  borderBottom: "1px solid " + t.border,
                  textAlign: "center"
                }}><input type="checkbox" aria-label={copy("Select all leads on this page", "تحديد كل العملاء في هذه الصفحة")} checked={allPageSelected} onChange={togglePage} /></th>
              {activeColumns.map(column => <th key={column} scope="col" aria-sort={sortState(column)} style={{
                  padding: 0,
                  borderBottom: "1px solid " + t.border,
                  textAlign: "start",
                  fontSize: 10,
                  color: t.text3,
                  fontWeight: 800
                }}>
                <button className="sy-focusable" aria-label={copy("Sort by ", "ترتيب حسب ") + col(column)} onClick={() => toggleSort(column)} style={{
                    width: "100%",
                    minHeight: 36,
                    border: 0,
                    background: "transparent",
                    padding: "0 10px",
                    textAlign: "start",
                    color: "inherit",
                    font: "inherit",
                    fontWeight: 800,
                    cursor: "pointer"
                  }}>{col(column)} {COLUMN_SORT[column] && sortKey === COLUMN_SORT[column] ? sortDir === "asc" ? "↑" : "↓" : ""}</button>
              </th>)}
            </tr></thead>
            <tbody>{pageRows.map(row => {
                const detailSelected = row.id === selectedLeadId;
                const checked = selectedRows.has(row.id);
                return <tr key={row.id} style={{
                  background: detailSelected ? t.selected : t.surface
                }}>
                <td style={{
                    padding: rowPad,
                    borderBottom: "1px solid " + t.border,
                    textAlign: "center"
                  }}><input type="checkbox" aria-label={copy("Select ", "تحديد ") + row.name} checked={checked} onChange={() => toggleRow(row.id)} /></td>
                {activeColumns.map(column => <td key={column} style={{
                    padding: rowPad,
                    borderBottom: "1px solid " + t.border,
                    fontSize: 11,
                    color: t.text2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>
                  {column === "lead" ? <button className="sy-focusable" onClick={() => onSelectLead(row.id)} style={{
                      border: 0,
                      background: "transparent",
                      padding: 0,
                      textAlign: "start",
                      fontFamily: "inherit",
                      color: t.text,
                      cursor: "pointer",
                      maxWidth: "100%"
                    }}><b style={{
                        display: "block",
                        fontSize: 11
                      }}>{row.name}</b><span style={{
                        display: "block",
                        marginTop: 2,
                        fontSize: 9,
                        color: t.text3,
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}>{row.company} · {row.id}</span></button> : column === "stage" ? <Badge tone={row.stage === "Qualified" ? "success" : row.stage === "Proposal" ? "warning" : "info"}>{stageLabel(row.stage)}</Badge> : column === "owner" ? row.owner : column === "source" ? row.source : column === "value" ? <b style={{
                      color: t.text,
                      fontVariantNumeric: "tabular-nums"
                    }}>{formatValue(row.value)}</b> : column === "score" ? <span style={{
                      fontVariantNumeric: "tabular-nums",
                      fontWeight: 700,
                      color: row.score >= 85 ? t.successFg : t.text2
                    }}>{row.score}</span> : row.lastActivity}
                </td>)}
              </tr>;
              })}</tbody>
          </table>
          {pageRows.length === 0 && <EmptyState title={copy("No leads found", "لا توجد نتائج")} body={copy("Try another search, saved view, or filter combination.", "جرّب بحثًا أو عرضًا أو فلاتر مختلفة.")} />}
        </div>


        <div className="sy-pagination" style={{
          minHeight: density === "compact" ? 38 : 46,
          padding: density === "compact" ? "4px 10px" : "8px 10px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderTop: "1px solid " + t.border,
          fontSize: 10,
          color: t.text3
        }}>
          <span>{filtered.length === 0 ? "0" : (safePage - 1) * pageSize + 1 + "–" + Math.min(safePage * pageSize, filtered.length)} {copy("of", "من")} {filtered.length}</span>
          <label style={{
            marginInlineStart: 8
          }}>{copy("Rows", "صفوف")} <select className="sy-input" aria-label={copy("Rows per page", "عدد الصفوف في الصفحة")} value={pageSize} onChange={e => setPageSize(Number(e.target.value))} style={{
              marginInlineStart: 4,
              height: 28,
              border: "1px solid " + t.border,
              borderRadius: 6,
              background: t.surface,
              color: t.text,
              fontFamily: "inherit"
            }}><option value={5}>5</option><option value={8}>8</option><option value={12}>12</option></select></label>
          <div style={{
            marginInlineStart: "auto",
            display: "flex",
            gap: 4
          }}>
            <button className="sy-focusable" aria-label={copy("Previous page", "الصفحة السابقة")} disabled={safePage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} style={{
              width: 30,
              height: 30,
              border: "1px solid " + t.border,
              borderRadius: 6,
              background: t.surface,
              color: t.text2,
              opacity: safePage <= 1 ? .45 : 1
            }}>{dir === "rtl" ? "›" : "‹"}</button>
            {Array.from({
              length: totalPages
            }, (_, i) => i + 1).map(n => <button key={n} className="sy-focusable" aria-current={safePage === n ? "page" : undefined} onClick={() => setPage(n)} style={{
              width: 30,
              height: 30,
              border: "1px solid " + t.border,
              borderRadius: 6,
              background: safePage === n ? t.selected : t.surface,
              color: safePage === n ? t.focus : t.text2,
              fontWeight: safePage === n ? 800 : 500
            }}>{n}</button>)}
            <button className="sy-focusable" aria-label={copy("Next page", "الصفحة التالية")} disabled={safePage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} style={{
              width: 30,
              height: 30,
              border: "1px solid " + t.border,
              borderRadius: 6,
              background: t.surface,
              color: t.text2,
              opacity: safePage >= totalPages ? .45 : 1
            }}>{dir === "rtl" ? "‹" : "›"}</button>
          </div>
        </div>
      </section>


      <div className="sy-detail-panel"><Panel>
        <div style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8
          }}><div><div style={{
                fontSize: 15,
                fontWeight: 800
              }}>{selected.name}</div><div style={{
                fontSize: 11,
                color: t.text3,
                marginTop: 3
              }}>{selected.company} · {selected.id}</div></div><span style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "5px 9px",
              borderRadius: 999,
              background: selected.stage === "Qualified" ? t.successBg : selected.stage === "Proposal" ? t.warningBg : t.infoBg,
              color: selected.stage === "Qualified" ? t.successFg : selected.stage === "Proposal" ? t.warningFg : t.infoFg,
              fontSize: 10,
              fontWeight: 800
            }}>{stageLabel(selected.stage)}</span></div>
        <div className="sy-detail-actions" style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 7,
            marginTop: 13
          }}><Button icon="mail" disabled ariaLabel={copy("Email — not available in this prototype", "البريد — غير متاح في هذا النموذج")}>{copy("Email", "بريد")}</Button><Button icon="phone" disabled ariaLabel={copy("Call — not available in this prototype", "الاتصال — غير متاح في هذا النموذج")}>{copy("Call", "اتصال")}</Button></div>
        <div className="sy-detail-actions" style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 7,
            marginTop: 7
          }}><Button onClick={() => openRecord("Contacts", selected.id)}>{copy("Open contact", "فتح جهة الاتصال")}</Button><Button intent="primary" icon="arrow" onClick={() => openRecord("Deals", selected.id)}>{copy("Convert to deal", "تحويل لصفقة")}</Button></div>
        <div className="sy-pair-grid" style={{
            marginTop: 15,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10
          }}>
          <Pair label={copy("Lead score", "التقييم")} value={selected.score + "/100"} /><Pair label={copy("Owner", "المسؤول")} value={selected.owner} /><Pair label={copy("Source", "المصدر")} value={selected.source} /><Pair label={copy("Potential", "القيمة المتوقعة")} value={formatValue(selected.value)} /><Pair label={copy("Activity", "النشاط")} value={selected.lastActivity} /><Pair label={copy("Email", "البريد")} value={selected.email} />
        </div>
        <div style={{
            marginTop: 15,
            padding: 10,
            borderRadius: 8,
            background: t.infoBg,
            color: t.infoFg,
            fontSize: 10,
            lineHeight: "15px"
          }}>{copy("Master-detail selection stays independent from bulk selection.", "اختيار السجل للتفاصيل مستقل عن تحديد الصفوف للعمليات الجماعية.")}</div>
      </Panel></div>
    </div>
  </div>;
}
function ContactView({
  lead,
  go
}: {
  lead: LeadRecord;
  go: (r: CRMRoute) => void;
}) {
  const {
    t
  } = useTheme();
  const {
    locale,
    copy
  } = useLocale();
  const [tab, setTab] = useState("Overview");
  const initials = lead.name.split(" ").map(x => x[0]).slice(0, 2).join("");
  const labels = locale === "ar" ? {
    Overview: "نظرة عامة",
    Activity: "النشاط",
    Tasks: "المهام"
  } : undefined;
  return <div className="sy-page" style={{
    padding: 22
  }}>
    <Panel>
      <div className="sy-record-head" style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16
      }}>
        <div style={{
          display: "flex",
          gap: 14
        }}>
          <div style={{
            width: 58,
            height: 58,
            borderRadius: 999,
            background: t.surface3,
            display: "grid",
            placeItems: "center",
            fontWeight: 800
          }}>{initials}</div>
          <div><h1 style={{
              fontSize: 25,
              margin: 0
            }}>{lead.name}</h1><div style={{
              marginTop: 4,
              color: t.text2,
              fontSize: 13
            }}>{lead.company}</div><div style={{
              marginTop: 8,
              display: "flex",
              gap: 6,
              flexWrap: "wrap"
            }}><Badge tone="success">{copy("Active contact", "جهة اتصال نشطة")}</Badge><Badge tone="info">{copy("Lead score", "التقييم")} {lead.score}</Badge></div></div>
        </div>
        <div className="sy-page-actions" style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap"
        }}><Button icon="mail" disabled ariaLabel={copy("Email — not available in this prototype", "البريد — غير متاح في هذا النموذج")}>{copy("Email", "بريد")}</Button><Button icon="phone" disabled ariaLabel={copy("Call — not available in this prototype", "الاتصال — غير متاح في هذا النموذج")}>{copy("Call", "اتصال")}</Button><Button intent="create" icon="plus" onClick={() => go("Deals")}>{copy("New deal", "صفقة جديدة")}</Button></div>
      </div>
      <div className="sy-record-meta" style={{
        display: "grid",
        gridTemplateColumns: "repeat(5,1fr)",
        gap: 10,
        marginTop: 18,
        paddingTop: 15,
        borderTop: "1px solid " + t.border
      }}>
        <Pair label={copy("Email", "البريد")} value={lead.email} /><Pair label={copy("Phone", "الهاتف")} value={lead.phone} /><Pair label={copy("Owner", "المسؤول")} value={lead.owner} /><Pair label={copy("Source", "المصدر")} value={lead.source} /><Pair label={copy("Last activity", "آخر نشاط")} value={lead.lastActivity} />
      </div>
    </Panel>


    <div style={{
      marginTop: 14
    }}><Tabs items={["Overview", "Activity", "Tasks"]} active={tab} onChange={setTab} label={copy("Contact detail", "تفاصيل جهة الاتصال")} labels={labels} /></div>
    {tab === "Overview" && <div className="sy-two-col" style={{
      display: "grid",
      gridTemplateColumns: "1.15fr .85fr",
      gap: 12,
      marginTop: 12
    }}>
      <Panel><div style={{
          fontSize: 13,
          fontWeight: 800
        }}>{copy("Relationship summary", "ملخص العلاقة")}</div><div className="sy-pair-grid" style={{
          display: "grid",
          gridTemplateColumns: "repeat(2,1fr)",
          gap: 12,
          marginTop: 14
        }}>
        <Pair label={copy("Company", "الشركة")} value={lead.company} /><Pair label={copy("Lifecycle", "دورة العميل")} value={copy("Qualified opportunity", "فرصة مؤهلة")} /><Pair label={copy("Preferred channel", "القناة المفضلة")} value={copy("Phone", "الهاتف")} /><Pair label={copy("Open value", "القيمة المفتوحة")} value={<MetricValue>{new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG").format(lead.value) + " EGP"}</MetricValue>} /><Pair label={copy("Source", "المصدر")} value={lead.source} /><Pair label={copy("Lead ID", "رقم العميل")} value={lead.id} />
      </div></Panel>
      <Panel><div style={{
          fontSize: 13,
          fontWeight: 800
        }}>{copy("Next actions", "الإجراءات التالية")}</div>{[[copy("Follow up proposal", "متابعة العرض"), copy("Today, 3:30 PM", "اليوم، 3:30 م")], [copy("Confirm decision maker", "تأكيد صاحب القرار"), copy("Tomorrow", "غدًا")], [copy("Schedule review call", "جدولة مكالمة مراجعة"), copy("Thursday", "الخميس")]].map(([a, b], i) => <label key={a} style={{
          display: "grid",
          gridTemplateColumns: "20px 1fr",
          gap: 8,
          padding: "11px 0",
          borderTop: i ? "1px solid " + t.border : "none"
        }}><input type="checkbox" aria-label={a} /><span><b style={{
              fontSize: 11
            }}>{a}</b><small style={{
              display: "block",
              fontSize: 10,
              color: t.text3,
              marginTop: 3
            }}>{b}</small></span></label>)}</Panel>
    </div>}
    {tab === "Activity" && <Panel><div style={{
        fontSize: 13,
        fontWeight: 800
      }}>{copy("Recent activity", "النشاط الأخير")}</div>{[[copy("Call completed", "تمت المكالمة"), copy("12 min ago", "منذ 12 دقيقة")], [copy("Proposal sent", "تم إرسال العرض"), copy("Yesterday", "أمس")], [copy("Contact created", "تم إنشاء جهة الاتصال"), copy("3 days ago", "منذ 3 أيام")]].map(([a, b], i) => <div key={a} style={{
        padding: "11px 0",
        borderTop: i ? "1px solid " + t.border : "none"
      }}><b style={{
          fontSize: 11
        }}>{a}</b><div style={{
          fontSize: 10,
          color: t.text3,
          marginTop: 3
        }}>{b}</div></div>)}</Panel>}
    {tab === "Tasks" && <Panel><div style={{
        fontSize: 13,
        fontWeight: 800
      }}>{copy("Tasks", "المهام")}</div>{[[copy("Follow up proposal", "متابعة العرض"), copy("Today, 3:30 PM", "اليوم، 3:30 م")], [copy("Confirm decision maker", "تأكيد صاحب القرار"), copy("Tomorrow", "غدًا")], [copy("Schedule review call", "جدولة مكالمة مراجعة"), copy("Thursday", "الخميس")]].map(([a, b], i) => <label key={a} style={{
        display: "grid",
        gridTemplateColumns: "20px 1fr",
        gap: 8,
        padding: "11px 0",
        borderTop: i ? "1px solid " + t.border : "none"
      }}><input type="checkbox" aria-label={a} /><span><b style={{
            fontSize: 11
          }}>{a}</b><small style={{
            display: "block",
            fontSize: 10,
            color: t.text3,
            marginTop: 3
          }}>{b}</small></span></label>)}</Panel>}
  </div>;
}
function DealView({
  lead
}: {
  lead: LeadRecord;
}) {
  const {
    t
  } = useTheme();
  const {
    locale,
    copy
  } = useLocale();
  const [stage, setStage] = useState("Proposal");
  const [tab, setTab] = useState("Overview");
  const [lostOpen, setLostOpen] = useState(false);
  const [outcome, setOutcome] = useState<"open" | "won" | "lost">("open");
  const lostTrigger = useRef<HTMLButtonElement>(null);
  const stages = ["New", "Qualified", "Proposal", "Negotiation", "Won"];
  const stageText = (s: string) => ({
    New: copy("New", "جديد"),
    Qualified: copy("Qualified", "مؤهل"),
    Proposal: copy("Proposal", "عرض"),
    Negotiation: copy("Negotiation", "تفاوض"),
    Won: copy("Won", "مغلقة بنجاح")
  })[s] || s;
  const markWon = () => {
    setOutcome("won");
    setStage("Won");
  };
  const markLost = () => {
    setOutcome("lost");
    setLostOpen(false);
  };
  const labels = locale === "ar" ? {
    Overview: "نظرة عامة",
    Activity: "النشاط",
    Tasks: "المهام"
  } : undefined;
  const dealName = copy(lead.company + " Opportunity", "فرصة " + lead.company);
  return <div className="sy-page" style={{
    padding: 22
  }}>
    <div className="sy-page-head" style={{
      display: "flex",
      justifyContent: "space-between",
      gap: 16
    }}>
      <div><div style={{
          fontSize: 11,
          color: t.text3
        }}>DEAL · {lead.id.replace("LD", "DL")}</div><h1 style={{
          fontSize: 27,
          margin: "4px 0 0"
        }}>{dealName}</h1><div style={{
          marginTop: 6,
          fontSize: 13,
          color: t.text2
        }}>{lead.company} · {lead.name}</div>{outcome !== "open" && <div style={{
          marginTop: 7
        }}><Badge tone={outcome === "won" ? "success" : "danger"}>{outcome === "won" ? copy("Won", "مغلقة بنجاح") : copy("Lost", "مفقودة")}</Badge></div>}</div>
      <div className="sy-page-actions" style={{
        display: "flex",
        gap: 8
      }}><Button buttonRef={lostTrigger} intent="danger" icon="close" onClick={() => setLostOpen(true)} disabled={outcome !== "open"}>{copy("Mark lost", "إغلاق كمفقودة")}</Button><Button intent="create" icon="check" onClick={markWon} disabled={outcome !== "open"}>{copy("Mark won", "إغلاق كناجحة")}</Button></div>
    </div>


    <div style={{
      marginTop: 18
    }}><Panel><div className="sy-stage-grid" style={{
          display: "grid",
          gridTemplateColumns: "repeat(5,1fr)",
          gap: 8
        }}>{stages.map((s, i) => {
            const active = s === stage,
              done = stages.indexOf(stage) > i;
            return <button key={s} className="sy-focusable" disabled={outcome === "lost"} onClick={() => setStage(s)} style={{
              height: 38,
              border: "1px solid " + (active ? t.focus : t.border),
              borderRadius: 8,
              background: active ? t.selected : done ? t.successBg : t.surface2,
              color: active ? t.focus : done ? t.successFg : t.text2,
              fontFamily: "inherit",
              fontSize: 11,
              fontWeight: active || done ? 750 : 500,
              opacity: outcome === "lost" ? .55 : 1
            }}>{done ? "✓ " : ""}{stageText(s)}</button>;
          })}</div></Panel></div>


    <div className="sy-kpi-grid sy-deal-kpis" style={{
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 10,
      marginTop: 12
    }}>
      <Panel><Pair label={copy("Deal value", "قيمة الصفقة")} value={<MetricValue>{new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG").format(lead.value) + " EGP"}</MetricValue>} /></Panel>
      <Panel><Pair label={copy("Probability", "الاحتمالية")} value={<MetricValue>{lead.score + "%"}</MetricValue>} /></Panel>
      <Panel><Pair label={copy("Expected close", "الإغلاق المتوقع")} value={copy("10 Oct 2026", "10 أكتوبر 2026")} /></Panel>
      <Panel><Pair label={copy("Owner", "المسؤول")} value={lead.owner} /></Panel>
    </div>


    <div style={{
      marginTop: 14
    }}><Tabs items={["Overview", "Activity", "Tasks"]} active={tab} onChange={setTab} label={copy("Deal detail", "تفاصيل الصفقة")} labels={labels} /></div>
    {tab === "Overview" && <div className="sy-two-col" style={{
      display: "grid",
      gridTemplateColumns: "1.1fr .9fr",
      gap: 12,
      marginTop: 12
    }}>
      <Panel><div style={{
          fontSize: 13,
          fontWeight: 800
        }}>{copy("Deal context", "سياق الصفقة")}</div><div className="sy-pair-grid" style={{
          display: "grid",
          gridTemplateColumns: "repeat(2,1fr)",
          gap: 12,
          marginTop: 14
        }}>
        <Pair label={copy("Primary contact", "جهة الاتصال الرئيسية")} value={lead.name} /><Pair label={copy("Company", "الشركة")} value={lead.company} /><Pair label={copy("Source", "المصدر")} value={lead.source} /><Pair label={copy("Campaign", "الحملة")} value="Q4 Growth" /><Pair label={copy("Created", "تاريخ الإنشاء")} value={copy("28 Sep 2026", "28 سبتمبر 2026")} /><Pair label={copy("Last activity", "آخر نشاط")} value={lead.lastActivity} />
      </div></Panel>
      <Panel><div style={{
          fontSize: 13,
          fontWeight: 800
        }}>{copy("Next actions", "الإجراءات التالية")}</div>{[[copy("Decision call", "مكالمة القرار"), copy("Today, 3:30 PM", "اليوم، 3:30 م")], [copy("Update proposal", "تحديث العرض"), copy("Tomorrow", "غدًا")], [copy("Prepare contract", "تجهيز العقد"), copy("After approval", "بعد الموافقة")]].map(([a, b], i) => <label key={a} style={{
          display: "grid",
          gridTemplateColumns: "22px 1fr",
          gap: 8,
          padding: "11px 0",
          borderTop: i ? "1px solid " + t.border : "none"
        }}><input type="checkbox" aria-label={a} /><span><b style={{
              fontSize: 11
            }}>{a}</b><small style={{
              display: "block",
              fontSize: 10,
              color: t.text3,
              marginTop: 3
            }}>{b}</small></span></label>)}</Panel>
    </div>}
    {tab === "Activity" && <Panel><div style={{
        fontSize: 13,
        fontWeight: 800
      }}>{copy("Deal activity", "نشاط الصفقة")}</div>{[[copy("Call completed", "تمت المكالمة"), copy("12 min ago", "منذ 12 دقيقة")], [copy("Proposal opened", "تم فتح العرض"), copy("48 min ago", "منذ 48 دقيقة")], [copy("Proposal sent", "تم إرسال العرض"), copy("Yesterday", "أمس")], [copy("Deal created", "تم إنشاء الصفقة"), copy("4 days ago", "منذ 4 أيام")]].map(([a, b], i) => <div key={a} style={{
        padding: "11px 0",
        borderTop: i ? "1px solid " + t.border : "none"
      }}><b style={{
          fontSize: 11
        }}>{a}</b><div style={{
          fontSize: 10,
          color: t.text3,
          marginTop: 3
        }}>{b}</div></div>)}</Panel>}
    {tab === "Tasks" && <Panel><div style={{
        fontSize: 13,
        fontWeight: 800
      }}>{copy("Tasks", "المهام")}</div>{[[copy("Decision call", "مكالمة القرار"), copy("Today, 3:30 PM", "اليوم، 3:30 م")], [copy("Update commercial proposal", "تحديث العرض التجاري"), copy("Tomorrow", "غدًا")], [copy("Prepare contract draft", "تجهيز مسودة العقد"), copy("After approval", "بعد الموافقة")]].map(([a, b], i) => <label key={a} style={{
        display: "grid",
        gridTemplateColumns: "22px 1fr",
        gap: 8,
        padding: "11px 0",
        borderTop: i ? "1px solid " + t.border : "none"
      }}><input type="checkbox" aria-label={a} /><span><b style={{
            fontSize: 11
          }}>{a}</b><small style={{
            display: "block",
            fontSize: 10,
            color: t.text3,
            marginTop: 3
          }}>{b}</small></span></label>)}</Panel>}


    <ConfirmDialog open={lostOpen} title={copy("Mark deal as lost?", "إغلاق الصفقة كمفقودة؟")} description={copy("This closes the current opportunity as lost while preserving its activity history.", "سيتم إغلاق الفرصة الحالية كمفقودة مع الاحتفاظ بسجل النشاط.")} confirmLabel={copy("Mark lost", "إغلاق كمفقودة")} onConfirm={markLost} onClose={() => setLostOpen(false)} returnFocusRef={lostTrigger} />
  </div>;
}
function Workspace() {
  const [route, setRoute] = useState<CRMRoute>("Leads");
  const [selectedLeadId, setSelectedLeadId] = useState(LEADS[0].id);
  const lead = LEADS.find(x => x.id === selectedLeadId) || LEADS[0];
  const openRecord = (next: CRMRoute, id: string) => {
    setSelectedLeadId(id);
    setRoute(next);
  };
  return <AppShell active={route} setRoute={setRoute}>
    {route === "Leads" ? <LeadsView openRecord={openRecord} selectedLeadId={selectedLeadId} onSelectLead={setSelectedLeadId} /> : route === "Contacts" ? <ContactView lead={lead} go={setRoute} /> : <DealView lead={lead} />}
  </AppShell>;
}
export const CRMMVPSharedArchitecture = () => <LocaleProvider><ThemeProvider><Workspace /></ThemeProvider></LocaleProvider>;