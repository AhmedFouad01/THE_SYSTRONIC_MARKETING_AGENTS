import React from "react";
type Mode = "light" | "dark";
const brand = {
  navy: "#181D36",
  cyan: "#00BEF6",
  cyanDark: "#007EA9",
  red: "#FF003C",
  magentaDark: "#E50036",
  teal: "#00BFA6",
  violet: "#7067CF"
};
const theme = {
  light: {
    canvas: "#F3F5F7",
    surface: "#FFFFFF",
    surface2: "#F7F9FB",
    surface3: "#EEF2F6",
    raised: "#FFFFFF",
    hover: "#EEF2F6",
    selected: "#D8F4FA",
    disabled: "#F2F4F7",
    border: "#DDE3EA",
    borderStrong: "#C9D1DB",
    divider: "#E8ECF1",
    text: "#181D36",
    text2: "#475467",
    text3: "#667085",
    textDisabled: "#98A2B3",
    icon: "#344054",
    icon2: "#667085",
    primary: "#181D36",
    primaryFg: "#FFFFFF",
    primaryHover: "#242B49",
    primaryPressed: "#0D1020",
    create: "#00BFA6",
    createFg: "#042F2A",
    createHover: "#00A991",
    createPressed: "#008C79",
    interactive: "#007EA9",
    focus: "#009FD4",
    infoBg: "#EEF6FF",
    infoFg: "#1557A0",
    infoIcon: "#3B82F6",
    successBg: "#DDF7E8",
    successFg: "#087443",
    successIcon: "#16B364",
    warningBg: "#FFF6E5",
    warningFg: "#915A00",
    warningIcon: "#F5A524",
    dangerBg: "#FFF0F4",
    dangerFg: "#B0002C",
    dangerIcon: "#FF315C",
    dangerHover: "#FFE0E8",
    dangerPressed: "#FFC9D6",
    dangerFieldBg: "#FFF7F9",
    focusRing: "rgba(0,159,212,.16)",
    shadow: "0 8px 26px rgba(16,24,40,.08)",
    chart: ["#181D36", "#009FD4", "#7067CF", "#159A93", "#4B67D1", "#9B5DA8", "#4BB8C5", "#708196"]
  },
  dark: {
    canvas: "#090D14",
    surface: "#111722",
    surface2: "#171E29",
    surface3: "#202936",
    raised: "#1C2532",
    hover: "#1D2632",
    selected: "#0B3A47",
    disabled: "#202936",
    border: "#2B3442",
    borderStrong: "#3B4656",
    divider: "#202936",
    text: "#F7F9FC",
    text2: "#C3CAD4",
    text3: "#98A2B3",
    textDisabled: "#667085",
    icon: "#D0D5DD",
    icon2: "#98A2B3",
    primary: "#00BEF6",
    primaryFg: "#0D1020",
    primaryHover: "#3FD3FC",
    primaryPressed: "#00A8DD",
    create: "#00BFA6",
    createFg: "#042F2A",
    createHover: "#00A991",
    createPressed: "#008C79",
    interactive: "#7DE2FF",
    focus: "#7DE2FF",
    infoBg: "#102A43",
    infoFg: "#9DCCFF",
    infoIcon: "#3B82F6",
    successBg: "#0D2D20",
    successFg: "#7CE5AA",
    successIcon: "#16B364",
    warningBg: "#35290C",
    warningFg: "#FFD16A",
    warningIcon: "#F5A524",
    dangerBg: "#3A121C",
    dangerFg: "#FF9CB0",
    dangerIcon: "#FF315C",
    dangerHover: "#4C1824",
    dangerPressed: "#5B1B2A",
    dangerFieldBg: "#241319",
    focusRing: "rgba(125,226,255,.22)",
    shadow: "0 12px 30px rgba(0,0,0,.28)",
    chart: ["#7DE2FF", "#00BEF6", "#9B8AFB", "#5EEAD4", "#7C9BFF", "#C084FC", "#67E8F9", "#94A3B8"]
  }
};
const tokenRows = [["bg.canvas", "#F3F5F7", "#090D14", "Application canvas"], ["bg.surface", "#FFFFFF", "#111722", "Cards, panels, widgets"], ["bg.subtle", "#F7F9FB", "#171E29", "Nested regions"], ["bg.hover", "#EEF2F6", "#1D2632", "Hover state"], ["bg.selected", "#D8F4FA", "#0B3A47", "Selected / active state"], ["text.primary", "#181D36", "#F7F9FC", "Main content"], ["text.secondary", "#475467", "#C3CAD4", "Supporting content"], ["text.tertiary", "#667085", "#98A2B3", "Metadata / captions"], ["icon.primary", "#344054", "#D0D5DD", "Default icon"], ["icon.secondary", "#667085", "#98A2B3", "Secondary icon"], ["border.default", "#DDE3EA", "#2B3442", "Neutral boundaries"], ["action.primary", "#181D36", "#00BEF6", "Authority / confirm"], ["action.primary.hover", "#242B49", "#3FD3FC", "Primary hover"], ["action.primary.pressed", "#0D1020", "#00A8DD", "Primary pressed"], ["action.create", "#00BFA6", "#00BFA6", "Create / add"], ["action.create.hover", "#00A991", "#00A991", "Create hover"], ["action.create.pressed", "#008C79", "#008C79", "Create pressed"], ["status.info.surface", "#EEF6FF", "#102A43", "Informational surface"], ["status.success.surface", "#DDF7E8", "#0D2D20", "Positive surface"], ["status.warning.surface", "#FFF6E5", "#35290C", "Attention surface"], ["status.critical.surface", "#FFF0F4", "#3A121C", "Critical surface"], ["focus.ring", "#009FD4", "#7DE2FF", "Keyboard focus only"]];
function LogoMark({
  dark = false,
  large = false
}: {
  dark?: boolean;
  large?: boolean;
}) {
  const navy = dark ? "#F7F9FC" : brand.navy;
  const size = large ? 126 : 52;
  return <svg width={size} height={size} viewBox="0 0 120 120" aria-label="The Systronic mark">
    <path d="M18 42 L47 32 L56 12 L86 4 L76 27 L105 15 L78 43 L57 49 L50 68 L92 52 L63 84 L51 113 L48 82 L18 94 L35 62 L13 71 L27 47 Z" fill={navy} />
    <path d="M18 42 L47 32 L56 12 L86 4" stroke={brand.cyan} strokeWidth="1.6" fill="none" />
    <path d="M105 15 L78 43 L57 49 L50 68 L92 52 L63 84 L51 113" stroke={brand.red} strokeWidth="1.6" fill="none" />
  </svg>;
}
function LogoLockup({
  dark = false
}: {
  dark?: boolean;
}) {
  const fg = dark ? "#F7F9FC" : brand.navy;
  return <div style={{
    display: "flex",
    alignItems: "center",
    gap: 16
  }}>
    <LogoMark dark={dark} />
    <div>
      <div style={{
        fontFamily: "Inter, sans-serif",
        fontSize: 26,
        lineHeight: "30px",
        fontWeight: 800,
        fontStyle: "italic",
        color: fg,
        letterSpacing: "-.04em"
      }}>THE SYSTRONIC</div>
      <div style={{
        marginTop: 5,
        fontSize: 9,
        letterSpacing: ".31em",
        color: dark ? "#C3CAD4" : "#475467"
      }}>BUSINESS SOLUTIONS</div>
    </div>
  </div>;
}
function BoardFrame({
  number,
  title,
  subtitle,
  span = 3,
  children,
  minH = 560
}: {
  number: string;
  title: string;
  subtitle?: string;
  span?: number;
  children: React.ReactNode;
  minH?: number;
}) {
  return <section style={{
    gridColumn: "span " + span,
    minHeight: minH,
    background: "#FFFFFF",
    border: "1px solid #D9DEE6",
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: "0 1px 2px rgba(16,24,40,.04)"
  }}>
    <div style={{
      padding: "18px 20px 15px",
      borderBottom: "1px solid #E8ECF1",
      display: "flex",
      gap: 12,
      alignItems: "flex-start"
    }}>
      <div style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        background: brand.navy,
        color: "#fff",
        display: "grid",
        placeItems: "center",
        fontSize: 10,
        fontWeight: 800
      }}>{number}</div>
      <div><div style={{
          fontSize: 16,
          lineHeight: "22px",
          fontWeight: 750,
          color: brand.navy
        }}>{title}</div>{subtitle && <div style={{
          marginTop: 3,
          fontSize: 10,
          lineHeight: "16px",
          color: "#667085"
        }}>{subtitle}</div>}</div>
    </div>
    <div style={{
      padding: 18
    }}>{children}</div>
  </section>;
}
function ModeLabel({
  mode
}: {
  mode: Mode;
}) {
  return <div style={{
    display: "inline-flex",
    padding: "4px 8px",
    borderRadius: 6,
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: ".08em",
    background: mode === "light" ? "#EEF2F6" : "#202936",
    color: mode === "light" ? "#475467" : "#C3CAD4"
  }}>{mode.toUpperCase()}</div>;
}
function Swatch({
  color,
  label,
  usage
}: {
  color: string;
  label: string;
  usage?: string;
}) {
  return <div style={{
    display: "grid",
    gridTemplateColumns: "28px 1fr",
    gap: 9,
    alignItems: "center"
  }}>
    <span style={{
      width: 28,
      height: 28,
      borderRadius: 8,
      background: color,
      boxShadow: "inset 0 0 0 1px rgba(0,0,0,.06)"
    }} />
    <div><div style={{
        fontSize: 10,
        fontWeight: 700,
        color: "#181D36"
      }}>{label}</div>{usage && <div style={{
        marginTop: 1,
        fontSize: 8,
        color: "#667085"
      }}>{usage}</div>}</div>
  </div>;
}
function TokenTable() {
  return <div style={{
    border: "1px solid #DDE3EA",
    borderRadius: 10,
    overflow: "hidden"
  }}>
    <div style={{
      display: "grid",
      gridTemplateColumns: "1.1fr .75fr .75fr 1.4fr",
      background: "#F7F9FB",
      padding: "8px 10px",
      fontSize: 8,
      fontWeight: 800,
      color: "#667085",
      textTransform: "uppercase",
      letterSpacing: ".06em"
    }}><span>Token</span><span>Light</span><span>Dark</span><span>Usage</span></div>
    {tokenRows.map((r, i) => <div key={r[0]} style={{
      display: "grid",
      gridTemplateColumns: "1.1fr .75fr .75fr 1.4fr",
      padding: "8px 10px",
      borderTop: "1px solid #E8ECF1",
      background: i % 2 ? "#FBFCFD" : "#fff",
      fontSize: 9
    }}>
      <code style={{
        fontWeight: 700,
        color: "#181D36"
      }}>{r[0]}</code>
      <span style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        color: "#475467"
      }}><i style={{
          width: 10,
          height: 10,
          borderRadius: 3,
          background: r[1]
        }} />{r[1]}</span>
      <span style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        color: "#475467"
      }}><i style={{
          width: 10,
          height: 10,
          borderRadius: 3,
          background: r[2]
        }} />{r[2]}</span>
      <span style={{
        color: "#667085"
      }}>{r[3]}</span>
    </div>)}
  </div>;
}
function SemanticCard({
  label,
  bg,
  fg,
  icon,
  note
}: {
  label: string;
  bg: string;
  fg: string;
  icon: string;
  note: string;
}) {
  return <div style={{
    borderRadius: 10,
    background: bg,
    color: fg,
    padding: 11,
    minHeight: 82
  }}>
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8
    }}><span style={{
        width: 22,
        height: 22,
        borderRadius: 7,
        background: icon,
        color: "#fff",
        display: "grid",
        placeItems: "center",
        fontSize: 10,
        fontWeight: 800
      }}>•</span><b style={{
        fontSize: 10
      }}>{label}</b></div>
    <div style={{
      marginTop: 8,
      fontSize: 8,
      lineHeight: "13px",
      opacity: .82
    }}>{note}</div>
  </div>;
}
function TypeSample({
  family,
  role,
  sample,
  size,
  weight = 600
}: {
  family: string;
  role: string;
  sample: string;
  size: number;
  weight?: number;
}) {
  return <div style={{
    display: "grid",
    gridTemplateColumns: "110px 1fr",
    gap: 10,
    alignItems: "baseline",
    padding: "7px 0",
    borderTop: "1px solid #EEF1F4"
  }}>
    <div><div style={{
        fontSize: 8,
        fontWeight: 800,
        color: "#667085"
      }}>{role}</div><div style={{
        fontSize: 7,
        color: "#98A2B3"
      }}>{size}px · {weight}</div></div>
    <div style={{
      fontFamily: family,
      fontSize: size,
      lineHeight: 1.28,
      fontWeight: weight,
      color: "#181D36"
    }}>{sample}</div>
  </div>;
}
function ButtonCase({
  mode,
  label,
  bg,
  fg,
  border = "transparent",
  opacity = 1,
  ring = false
}: {
  mode: Mode;
  label: string;
  bg: string;
  fg: string;
  border?: string;
  opacity?: number;
  ring?: boolean;
}) {
  const ringColor = mode === "light" ? "rgba(0,159,212,.18)" : "rgba(125,226,255,.22)";
  return <button style={{
    height: 34,
    minWidth: 106,
    padding: "0 12px",
    borderRadius: 7,
    border: "1px solid " + border,
    background: bg,
    color: fg,
    opacity,
    fontSize: 10,
    fontWeight: 700,
    boxShadow: ring ? "0 0 0 3px " + ringColor : "none"
  }}>{label}</button>;
}
function ButtonsMatrix() {
  const states = ["Default", "Hover", "Pressed", "Focus", "Disabled"];
  const intents = [["Primary", brand.navy, "#fff", "#2A3350", "#0D1020"], ["Create", brand.teal, "#fff", "#009C88", "#007D6D"], ["Secondary", "#fff", brand.navy, "#F2F4F7", "#E8ECF1"], ["Ghost", "transparent", "#475467", "#F2F4F7", "#E8ECF1"], ["Destructive", "#FFF0F4", "#B0002C", "#FFE0E8", "#FFD0DC"]] as const;
  return <div style={{
    display: "grid",
    gridTemplateColumns: "100px repeat(5,1fr)",
    gap: 8,
    alignItems: "center"
  }}>
    <div />{states.map(s => <div key={s} style={{
      fontSize: 8,
      fontWeight: 800,
      color: "#667085"
    }}>{s}</div>)}
    {intents.map(row => <React.Fragment key={row[0]}>
      <div style={{
        fontSize: 9,
        fontWeight: 800,
        color: "#181D36"
      }}>{row[0]}</div>
      {states.map((s, i) => <ButtonCase key={s} mode="light" label={row[0]} bg={i === 1 ? row[3] : i === 2 ? row[4] : row[1]} fg={i === 2 && row[0] === "Secondary" ? "#181D36" : row[2]} border={row[0] === "Secondary" && i < 3 ? "#DDE3EA" : "transparent"} opacity={i === 4 ? .38 : 1} ring={i === 3} />)}
    </React.Fragment>)}
  </div>;
}
function InputSample({
  mode,
  label,
  state,
  value = "Search contacts…"
}: {
  mode: Mode;
  label: string;
  state: string;
  value?: string;
}) {
  const t = theme[mode];
  const error = state === "Error",
    disabled = state === "Disabled",
    focused = state === "Focus";
  const ringColor = t.focusRing;
  return <div>
    <div style={{
      fontSize: 8,
      fontWeight: 700,
      color: t.text2,
      marginBottom: 5
    }}>{label}</div>
    <div style={{
      height: 34,
      borderRadius: 7,
      border: "1px solid " + t.borderStrong,
      background: disabled ? t.disabled : error ? t.dangerFieldBg : t.surface,
      color: disabled ? t.textDisabled : t.text2,
      display: "flex",
      alignItems: "center",
      padding: "0 9px",
      fontSize: 9,
      boxShadow: focused ? "0 0 0 3px " + ringColor : "none"
    }}>{value}</div>
    {error && <div style={{
      marginTop: 4,
      fontSize: 7,
      color: t.dangerFg
    }}>This field is required.</div>}
  </div>;
}
function MiniAppShell({
  mode
}: {
  mode: Mode;
}) {
  const t = theme[mode],
    nav: Array<[string, SysIconName]> = [["Inbox", "inbox"], ["My tasks", "tasks"], ["Contacts", "contacts"], ["Leads", "leads"], ["Deals", "deals"], ["Pipeline", "route"], ["Reports", "report"]];
  return <div style={{
    background: t.canvas,
    border: "1px solid " + t.border,
    borderRadius: 12,
    padding: 8,
    height: 390,
    color: t.text
  }}>
    <div style={{
      display: "grid",
      gridTemplateColumns: "150px 1fr",
      height: "100%",
      overflow: "hidden",
      borderRadius: 9,
      background: t.surface
    }}>
      <aside style={{
        borderRight: "1px solid " + t.border,
        padding: 9
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 7
        }}><div style={{
            width: 24,
            height: 24,
            borderRadius: 7,
            background: t.primary,
            color: t.primaryFg,
            display: "grid",
            placeItems: "center",
            fontSize: 8,
            fontWeight: 800
          }}>TS</div><div><div style={{
              fontSize: 8,
              fontWeight: 800
            }}>THE SYSTRONIC</div><div style={{
              fontSize: 6,
              color: t.text3
            }}>CRM Workspace</div></div></div>
        <button type="button" aria-label="Open search" style={{
          marginTop: 10,
          width: "100%",
          height: 30,
          border: "1px solid " + t.border,
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          padding: "0 8px",
          background: t.surface,
          color: t.text3,
          fontSize: 7,
          fontFamily: "inherit",
          textAlign: "left"
        }}><SysIcon name="search" size={14} /><span style={{
            marginLeft: 6
          }}>Search</span></button>
        <div style={{
          marginTop: 10,
          display: "grid",
          gap: 2
        }}>{nav.map(([n, icon], i) => <button type="button" key={n} aria-current={i === 3 ? "page" : undefined} style={{
            width: "100%",
            height: 29,
            border: 0,
            borderRadius: 6,
            background: i === 3 ? t.selected : "transparent",
            color: i === 3 ? t.text : t.text2,
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "0 8px",
            fontSize: 8,
            fontFamily: "inherit",
            textAlign: "left"
          }}><span style={{
              color: i === 3 ? t.interactive : t.icon2,
              display: "grid",
              placeItems: "center"
            }}><SysIcon name={icon} size={14} /></span>{n}</button>)}</div>
      </aside>
      <main>
        <div style={{
          height: 36,
          borderBottom: "1px solid " + t.divider,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 10px",
          fontSize: 7,
          color: t.text3
        }}><span>CRM › Leads</span><span>AF</span></div>
        <div style={{
          padding: 12
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between"
          }}><div><div style={{
                fontSize: 14,
                fontWeight: 750
              }}>Leads</div><div style={{
                fontSize: 7,
                color: t.text2,
                marginTop: 2
              }}>Capture, qualify and convert.</div></div><div style={{
              display: "flex",
              gap: 5
            }}><button style={{
                height: 26,
                padding: "0 8px",
                border: "1px solid " + t.border,
                borderRadius: 6,
                background: t.surface,
                color: t.text,
                fontSize: 7
              }}><span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4
                }}><SysIcon name="upload" size={12} />Import</span></button><button style={{
                height: 26,
                padding: "0 8px",
                border: 0,
                borderRadius: 6,
                background: t.create,
                color: t.createFg,
                fontSize: 7,
                fontWeight: 700
              }}><span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4
                }}><SysIcon name="plus" size={12} />New lead</span></button></div></div>
          <div style={{
            marginTop: 10,
            display: "flex",
            gap: 4
          }} role="tablist" aria-label="Lead views">{["All leads", "My leads", "Unassigned"].map((x, i) => <button type="button" role="tab" aria-selected={i === 0} key={x} style={{
              padding: "6px 7px",
              border: 0,
              borderRadius: 6,
              background: i === 0 ? t.selected : "transparent",
              fontSize: 7,
              fontFamily: "inherit",
              color: i === 0 ? t.text : t.text2
            }}>{x}</button>)}</div>
          <div style={{
            marginTop: 9,
            border: "1px solid " + t.border,
            borderRadius: 7,
            overflow: "hidden"
          }}>{["Ahmed Fouad", "Al Noor Co.", "Mariam Ali", "Delta Group"].map((x, i) => <div key={x} style={{
              display: "grid",
              gridTemplateColumns: "1.3fr .8fr .8fr",
              padding: "8px 9px",
              borderTop: i ? "1px solid " + t.divider : "none",
              background: i === 0 ? t.selected : t.surface,
              fontSize: 7
            }}><b>{x}</b><span style={{
                color: t.text2
              }}>{["Qualified", "New", "Proposal", "Won"][i]}</span><span>EGP {145 + i * 55}K</span></div>)}</div>
        </div>
      </main>
    </div>
  </div>;
}
function SelectionStates({
  mode
}: {
  mode: Mode;
}) {
  const t = theme[mode];
  return <div style={{
    background: t.canvas,
    borderRadius: 10,
    padding: 12,
    color: t.text
  }}>
    <ModeLabel mode={mode} />
    <div style={{
      marginTop: 12,
      display: "grid",
      gap: 12
    }}>
      <div style={{
        display: "flex",
        gap: 16,
        fontSize: 9,
        color: t.text2
      }}><label><input type="checkbox" defaultChecked style={{
            accentColor: t.interactive
          }} /> Checkbox</label><label><input type="radio" defaultChecked style={{
            accentColor: t.interactive
          }} /> Radio</label></div>
      <div style={{
        display: "flex",
        gap: 8,
        alignItems: "center"
      }}><span style={{
          width: 34,
          height: 19,
          borderRadius: 99,
          background: t.create,
          position: "relative"
        }}><i style={{
            position: "absolute",
            top: 2,
            right: 2,
            width: 15,
            height: 15,
            borderRadius: 99,
            background: "#fff"
          }} /></span><span style={{
          fontSize: 9,
          color: t.text2
        }}>Toggle on</span></div>
      <div style={{
        display: "inline-flex",
        width: "fit-content",
        padding: 3,
        borderRadius: 7,
        background: t.surface3
      }}>{["Table", "Pipeline", "Activity"].map((x, i) => <span key={x} style={{
          padding: "6px 8px",
          borderRadius: 5,
          background: i === 0 ? t.selected : "transparent",
          fontSize: 8,
          color: i === 0 ? t.text : t.text2
        }}>{x}</span>)}</div>
      <div style={{
        display: "flex",
        gap: 6,
        flexWrap: "wrap"
      }}>{["Cairo", "Qualified", "High value"].map(x => <span key={x} style={{
          padding: "5px 7px",
          borderRadius: 6,
          background: t.selected,
          color: t.text,
          fontSize: 8
        }}>{x} ×</span>)}</div>
    </div>
  </div>;
}
function FeedbackGrid({
  mode
}: {
  mode: Mode;
}) {
  const t = theme[mode];
  const items = [["Info", t.infoBg, t.infoFg, t.infoIcon], ["Success", t.successBg, t.successFg, t.successIcon], ["Warning", t.warningBg, t.warningFg, t.warningIcon], ["Critical", t.dangerBg, t.dangerFg, t.dangerIcon]];
  return <div style={{
    background: t.canvas,
    borderRadius: 10,
    padding: 12,
    color: t.text
  }}>
    <ModeLabel mode={mode} />
    <div style={{
      marginTop: 10,
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8
    }}>{items.map(i => <div key={i[0]} style={{
        padding: 10,
        borderRadius: 9,
        background: i[1]
      }}><div style={{
          display: "flex",
          gap: 7,
          alignItems: "center"
        }}><span style={{
            width: 18,
            height: 18,
            borderRadius: 6,
            background: i[3],
            display: "grid",
            placeItems: "center",
            color: "#fff",
            fontSize: 8
          }}>•</span><b style={{
            fontSize: 9,
            color: i[2]
          }}>{i[0]}</b></div><div style={{
          marginTop: 5,
          fontSize: 7,
          color: i[2],
          opacity: .82
        }}>Full tinted surface + neutral structure.</div></div>)}</div>
  </div>;
}
function OverlaySamples() {
  const t = theme.light;
  return <div style={{
    display: "grid",
    gridTemplateColumns: "1.1fr .8fr .75fr",
    gap: 10
  }}>
    <div style={{
      minHeight: 220,
      background: "#E9EDF2",
      borderRadius: 10,
      padding: 20,
      display: "grid",
      placeItems: "center"
    }}>
      <div style={{
        width: 250,
        background: t.surface,
        border: "1px solid " + t.border,
        borderRadius: 12,
        padding: 14,
        boxShadow: t.shadow
      }}>
        <div style={{
          fontSize: 11,
          fontWeight: 750
        }}>Create saved view</div><div style={{
          marginTop: 3,
          fontSize: 8,
          color: t.text2
        }}>Name this filter + column configuration.</div><div style={{
          marginTop: 12,
          height: 32,
          border: "1px solid " + t.borderStrong,
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          padding: "0 9px",
          fontSize: 8,
          color: t.text3
        }}>High-value qualified leads</div><div style={{
          marginTop: 12,
          display: "flex",
          justifyContent: "flex-end",
          gap: 6
        }}><ButtonCase mode="light" label="Cancel" bg="#fff" fg={t.text} border={t.border} /><ButtonCase mode="light" label="Save" bg={brand.navy} fg="#fff" /></div>
      </div>
    </div>
    <div style={{
      minHeight: 220,
      background: t.surface2,
      borderRadius: 10,
      padding: 12
    }}><div style={{
        height: "100%",
        borderLeft: "1px solid " + t.border,
        background: t.surface,
        padding: 12,
        borderRadius: 10
      }}><div style={{
          fontSize: 10,
          fontWeight: 750
        }}>Lead details</div>{["Owner", "Stage", "Value"].map(x => <div key={x} style={{
          marginTop: 10
        }}><div style={{
            fontSize: 7,
            color: t.text2,
            marginBottom: 4
          }}>{x}</div><div style={{
            height: 30,
            border: "1px solid " + t.borderStrong,
            borderRadius: 7
          }} /></div>)}</div></div>
    <div style={{
      minHeight: 220,
      background: t.surface2,
      borderRadius: 10,
      padding: 16
    }}><div style={{
        background: t.surface,
        border: "1px solid " + t.border,
        borderRadius: 10,
        padding: 9,
        boxShadow: t.shadow
      }}><div style={{
          fontSize: 9,
          fontWeight: 750
        }}>Quick actions</div>{["Add task", "Assign owner", "Convert to deal"].map(x => <div key={x} style={{
          padding: "8px 6px",
          fontSize: 8,
          color: t.text2
        }}>{x}</div>)}</div><div style={{
        marginTop: 10,
        background: brand.navy,
        color: "#fff",
        padding: "7px 9px",
        borderRadius: 7,
        fontSize: 7
      }}>Tooltip — short contextual help</div></div>
  </div>;
}
function TableSample({
  mode
}: {
  mode: Mode;
}) {
  const t = theme[mode];
  const rows = [["Ahmed Fouad", "Qualified", "M. Hassan", "EGP 145K"], ["Al Noor Co.", "New", "Sara A.", "EGP 92K"], ["Mariam Ali", "Proposal", "M. Hassan", "EGP 310K"], ["Delta Group", "Won", "Omar N.", "EGP 225K"]];
  return <div style={{
    background: t.canvas,
    borderRadius: 10,
    padding: 10,
    color: t.text
  }}>
    <ModeLabel mode={mode} />
    <div style={{
      marginTop: 9,
      border: "1px solid " + t.border,
      borderRadius: 8,
      overflow: "hidden"
    }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1.25fr .8fr .8fr .8fr",
        padding: "8px 9px",
        background: t.surface2,
        color: t.text3,
        fontSize: 7,
        fontWeight: 800,
        textTransform: "uppercase"
      }}><span>Lead</span><span>Stage</span><span>Owner</span><span>Value</span></div>
      {rows.map((r, i) => <div key={r[0]} style={{
        display: "grid",
        gridTemplateColumns: "1.25fr .8fr .8fr .8fr",
        padding: "9px",
        borderTop: "1px solid " + t.divider,
        background: i === 0 ? t.selected : t.surface,
        fontSize: 8
      }}><b>{r[0]}</b><span>{r[1]}</span><span style={{
          color: t.text2
        }}>{r[2]}</span><b>{r[3]}</b></div>)}
    </div>
  </div>;
}
function KpiCard({
  mode,
  label,
  value,
  delta,
  variant = "neutral"
}: {
  mode: Mode;
  label: string;
  value: string;
  delta: string;
  variant?: "neutral" | "navy" | "magenta";
}) {
  const t = theme[mode];
  const cfg = variant === "navy" ? {
    bg: brand.navy,
    fg: "#FFFFFF",
    sub: "rgba(255,255,255,.72)",
    delta: "#FFFFFF",
    border: "transparent"
  } : variant === "magenta" ? {
    bg: mode === "light" ? brand.red : brand.magentaDark,
    fg: mode === "light" ? "#0D1020" : "#FFFFFF",
    sub: mode === "light" ? "rgba(13,16,32,.74)" : "rgba(255,255,255,.78)",
    delta: mode === "light" ? "#0D1020" : "#FFFFFF",
    border: "transparent"
  } : {
    bg: t.surface,
    fg: t.text,
    sub: t.text3,
    delta: t.successFg,
    border: t.border
  };
  return <div style={{
    background: cfg.bg,
    border: "1px solid " + cfg.border,
    borderRadius: 10,
    padding: 11,
    color: cfg.fg
  }}>
    <div style={{
      fontSize: 8,
      color: cfg.sub
    }}>{label}</div>
    <div dir="ltr" style={{
      marginTop: 5,
      fontSize: 18,
      fontWeight: 750,
      fontVariantNumeric: "tabular-nums",
      unicodeBidi: "isolate"
    }}>{value}</div>
    <div style={{
      marginTop: 5,
      fontSize: 8,
      color: cfg.delta,
      fontWeight: 700
    }}>{delta}</div>
  </div>;
}
function Trend({
  mode
}: {
  mode: Mode;
}) {
  const t = theme[mode];
  return <svg viewBox="0 0 320 100" style={{
    width: "100%",
    height: 110
  }}>{[22, 50, 78].map(y => <line key={y} x1="10" x2="308" y1={y} y2={y} stroke={t.divider} />)}<path d="M12 78 C55 72 80 60 112 63 C150 65 165 45 195 48 C230 51 248 29 306 20" fill="none" stroke={t.chart[0]} strokeWidth="3" /><path d="M12 86 C55 80 80 73 112 74 C150 76 165 66 195 63 C230 60 248 48 306 40" fill="none" stroke={t.chart[1]} strokeWidth="2" strokeDasharray="6 5" /></svg>;
}
function DataVizBoard() {
  const t = theme.light;
  return <div style={{
    display: "grid",
    gridTemplateColumns: "1.1fr 1fr .85fr",
    gap: 10
  }}>
    <div style={{
      background: t.surface2,
      borderRadius: 9,
      padding: 10
    }}><div style={{
        fontSize: 9,
        fontWeight: 750
      }}>Trend</div><Trend mode="light" /></div>
    <div style={{
      background: t.surface2,
      borderRadius: 9,
      padding: 10
    }}><div style={{
        fontSize: 9,
        fontWeight: 750
      }}>Comparison</div><div style={{
        marginTop: 10,
        display: "grid",
        gap: 8
      }}>{[["Meta", 88], ["Web", 72], ["Referral", 54], ["Direct", 42]].map((r, i) => <div key={r[0]} style={{
          display: "grid",
          gridTemplateColumns: "50px 1fr 22px",
          gap: 5,
          fontSize: 7,
          alignItems: "center"
        }}><span>{r[0]}</span><div style={{
            height: 7,
            borderRadius: 99,
            background: "#E5E9EF"
          }}><div style={{
              height: "100%",
              width: r[1] + "%",
              borderRadius: 99,
              background: t.chart[i]
            }} /></div><span>{r[1]}</span></div>)}</div></div>
    <div style={{
      background: t.surface2,
      borderRadius: 9,
      padding: 10
    }}><div style={{
        fontSize: 9,
        fontWeight: 750
      }}>Heatmap</div><div style={{
        marginTop: 10,
        display: "grid",
        gridTemplateColumns: "repeat(5,1fr)",
        gap: 4
      }}>{[1, 2, 3, 4, 2, 2, 3, 4, 5, 3, 1, 2, 4, 6, 4, 2, 4, 5, 6, 5].map((v, i) => <div key={i} style={{
          height: 24,
          borderRadius: 4,
          background: ["#EFFBFF", "#D9F7FF", "#B4EEFF", "#7DE2FF", "#3FD3FC", "#00BEF6", "#009FD4"][v]
        }} />)}</div></div>
  </div>;
}
function ReportingBoard() {
  const t = theme.light;
  return <div style={{
    background: t.canvas,
    borderRadius: 12,
    padding: 10
  }}>
    <div style={{
      display: "flex",
      gap: 6,
      alignItems: "center"
    }}>{["Last 30 days", "All sources", "All owners"].map(x => <span key={x} style={{
        padding: "6px 8px",
        border: "1px solid " + t.border,
        borderRadius: 6,
        background: t.surface,
        fontSize: 7,
        color: t.text2
      }}>{x}</span>)}<span style={{
        marginLeft: "auto",
        padding: "6px 8px",
        borderRadius: 6,
        background: t.primary,
        color: t.primaryFg,
        fontSize: 7,
        fontWeight: 700
      }}>Export</span></div>
    <div style={{
      marginTop: 8,
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 6
    }}>{[["Revenue", "EGP 1.24M"], ["Won", "72"], ["Conversion", "17.8%"], ["SLA", "82%"]].map(x => <div key={x[0]} style={{
        background: t.surface,
        border: "1px solid " + t.border,
        borderRadius: 8,
        padding: 8
      }}><div style={{
          fontSize: 6,
          color: t.text3
        }}>{x[0]}</div><div style={{
          marginTop: 4,
          fontSize: 11,
          fontWeight: 750
        }}>{x[1]}</div></div>)}</div>
    <div style={{
      marginTop: 8,
      display: "grid",
      gridTemplateColumns: "1.25fr .75fr",
      gap: 7
    }}><div style={{
        background: t.surface,
        border: "1px solid " + t.border,
        borderRadius: 8,
        padding: 8
      }}><Trend mode="light" /></div><div style={{
        background: t.warningBg,
        borderRadius: 8,
        padding: 9,
        color: t.warningFg,
        fontSize: 7,
        lineHeight: "12px"
      }}><b>Insight</b><br />Revenue +12.4%. Referral and larger deals contributed most.</div></div>
  </div>;
}
function SemanticPalette({
  mode
}: {
  mode: Mode;
}) {
  const t = theme[mode];
  const items = [["Information", t.infoBg, t.infoFg, t.infoIcon, "Neutral context / system information"], ["Success", t.successBg, t.successFg, t.successIcon, "Completed / favorable outcome"], ["Warning", t.warningBg, t.warningFg, t.warningIcon, "Attention before failure"], ["Critical", t.dangerBg, t.dangerFg, t.dangerIcon, "Error / destructive outcome"]];
  return <div style={{
    background: t.canvas,
    borderRadius: 10,
    padding: 10,
    color: t.text
  }}>
    <ModeLabel mode={mode} />
    <div style={{
      marginTop: 9,
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 7
    }}>
      {items.map(i => <SemanticCard key={i[0]} label={i[0]} bg={i[1]} fg={i[2]} icon={i[3]} note={i[4]} />)}
    </div>
  </div>;
}
function TypographyMode({
  mode
}: {
  mode: Mode;
}) {
  const t = theme[mode];
  return <div style={{
    background: t.canvas,
    borderRadius: 10,
    padding: 11,
    color: t.text
  }}>
    <ModeLabel mode={mode} />
    <div style={{
      marginTop: 10,
      display: "grid",
      gridTemplateColumns: "100px 1fr",
      gap: 8,
      alignItems: "baseline"
    }}>
      {[["Page title", "28 / 36", "Pipeline performance", 28, 700, "Inter, sans-serif"], ["Section title", "20 / 28", "Revenue overview", 20, 600, "Inter, sans-serif"], ["Body", "14 / 22", "Supporting interface copy", 14, 400, "Inter, sans-serif"], ["Arabic title", "20 / 30", "نظرة عامة على الأداء", 20, 600, "Alexandria, Cairo, sans-serif"], ["Arabic body", "14 / 24", "متابعة العملاء والصفقات والمهام", 14, 400, "Cairo, sans-serif"], ["Arabic data", "13 / 20", "الإيرادات ١٬٢٨٤٬٥٠٠", 13, 500, "IBM Plex Sans Arabic, Cairo, sans-serif"]].map((x, i) => <React.Fragment key={String(x[0])}>
        <div style={{
          padding: "7px 0",
          borderTop: i ? "1px solid " + t.divider : "none"
        }}><b style={{
            fontSize: 8,
            color: t.text2
          }}>{x[0]}</b><div style={{
            fontSize: 7,
            color: t.text3
          }}>{x[1]}</div></div>
        <div dir={String(x[0]).startsWith("Arabic") ? "rtl" : "ltr"} style={{
          padding: "7px 0",
          borderTop: i ? "1px solid " + t.divider : "none",
          fontFamily: String(x[5]),
          fontSize: Number(x[3]),
          fontWeight: Number(x[4]),
          color: t.text
        }}>{x[2]}</div>
      </React.Fragment>)}
    </div>
  </div>;
}
function ButtonsMatrixMode({
  mode
}: {
  mode: Mode;
}) {
  const t = theme[mode];
  const states = ["Default", "Hover", "Pressed", "Focus", "Disabled"];
  const intents = [{
    name: "Primary",
    base: t.primary,
    fg: t.primaryFg,
    hover: t.primaryHover,
    pressed: t.primaryPressed,
    border: "transparent"
  }, {
    name: "Create",
    base: t.create,
    fg: t.createFg,
    hover: t.createHover,
    pressed: t.createPressed,
    border: "transparent"
  }, {
    name: "Secondary",
    base: t.surface,
    fg: t.text,
    hover: t.hover,
    pressed: t.surface3,
    border: t.border
  }, {
    name: "Ghost",
    base: "transparent",
    fg: t.text2,
    hover: t.hover,
    pressed: t.surface3,
    border: "transparent"
  }, {
    name: "Destructive",
    base: t.dangerBg,
    fg: t.dangerFg,
    hover: t.dangerHover,
    pressed: t.dangerPressed,
    border: "transparent"
  }];
  return <div style={{
    background: t.canvas,
    borderRadius: 10,
    padding: 10,
    color: t.text
  }}>
    <ModeLabel mode={mode} />
    <div style={{
      marginTop: 10,
      display: "grid",
      gridTemplateColumns: "82px repeat(5,1fr)",
      gap: 6,
      alignItems: "center"
    }}>
      <div />{states.map(s => <div key={s} style={{
        fontSize: 7,
        fontWeight: 800,
        color: t.text3
      }}>{s}</div>)}
      {intents.map(row => <React.Fragment key={row.name}>
        <b style={{
          fontSize: 8
        }}>{row.name}</b>
        {states.map((s, i) => {
          const bg = i === 1 ? row.hover : i === 2 ? row.pressed : row.base;
          const ring = i === 3;
          const disabled = i === 4;
          return <button key={s} style={{
            height: 30,
            borderRadius: 6,
            border: "1px solid " + row.border,
            background: bg,
            color: row.fg,
            opacity: disabled ? .36 : 1,
            fontSize: 7,
            fontWeight: 700,
            boxShadow: ring ? "0 0 0 3px " + t.focusRing : "none"
          }}>{row.name}</button>;
        })}
      </React.Fragment>)}
    </div>
    <div style={{
      marginTop: 10,
      display: "flex",
      gap: 6,
      alignItems: "center"
    }}>
      {[28, 34, 40].map((h, i) => <button key={h} style={{
        height: h,
        padding: "0 " + (8 + i * 2) + "px",
        border: 0,
        borderRadius: 6 + i,
        background: t.primary,
        color: t.primaryFg,
        fontSize: 7 + i
      }}>Size {i + 1}</button>)}
      <button style={{
        width: 34,
        height: 34,
        border: 0,
        borderRadius: 7,
        background: t.create,
        color: t.createFg,
        fontSize: 15
      }}>+</button>
      <button style={{
        width: 34,
        height: 34,
        border: "1px solid " + t.border,
        borderRadius: 7,
        background: t.surface,
        color: t.text2
      }}>•••</button>
    </div>
  </div>;
}
function InputsMode({
  mode
}: {
  mode: Mode;
}) {
  const t = theme[mode];
  return <div style={{
    background: t.canvas,
    borderRadius: 10,
    padding: 11,
    color: t.text
  }}>
    <ModeLabel mode={mode} />
    <div style={{
      marginTop: 10,
      display: "grid",
      gridTemplateColumns: "repeat(5,1fr)",
      gap: 7
    }}>
      <InputSample mode={mode} label="Default" state="Default" />
      <InputSample mode={mode} label="Focus" state="Focus" />
      <InputSample mode={mode} label="Filled" state="Filled" value="Ahmed Fouad" />
      <InputSample mode={mode} label="Error" state="Error" />
      <InputSample mode={mode} label="Disabled" state="Disabled" />
    </div>
    <div style={{
      marginTop: 10,
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 7
    }}>
      {[["Select", "Qualified ⌄"], ["Multi-select", "Meta · Web · +2"], ["Date range", "01 Oct — 31 Oct"], ["Currency", "EGP 145,000.00"]].map(x => <div key={x[0]}><div style={{
          fontSize: 7,
          fontWeight: 700,
          color: t.text2,
          marginBottom: 4
        }}>{x[0]}</div><div style={{
          height: 32,
          border: "1px solid " + t.borderStrong,
          borderRadius: 7,
          background: t.surface,
          color: t.text,
          display: "flex",
          alignItems: "center",
          padding: "0 8px",
          fontSize: 8
        }}>{x[1]}</div></div>)}
    </div>
    <div style={{
      marginTop: 9,
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 7
    }}>
      <div style={{
        minHeight: 58,
        border: "1px solid " + t.borderStrong,
        borderRadius: 7,
        background: t.surface,
        color: t.text2,
        padding: 8,
        fontSize: 8
      }}>Textarea · Follow up after proposal review.</div>
      <div style={{
        minHeight: 58,
        border: "1px dashed " + t.borderStrong,
        borderRadius: 7,
        background: t.surface,
        color: t.text3,
        display: "grid",
        placeItems: "center",
        fontSize: 8
      }}>Upload / Dropzone</div>
    </div>
  </div>;
}
function OverlaysMode({
  mode
}: {
  mode: Mode;
}) {
  const t = theme[mode];
  return <div style={{
    background: t.canvas,
    borderRadius: 10,
    padding: 10,
    color: t.text
  }}>
    <ModeLabel mode={mode} />
    <div style={{
      marginTop: 9,
      display: "grid",
      gridTemplateColumns: "1.2fr .85fr .8fr",
      gap: 8
    }}>
      <div style={{
        minHeight: 170,
        background: mode === "light" ? "#E9EDF2" : "#070A10",
        borderRadius: 9,
        padding: 14,
        display: "grid",
        placeItems: "center"
      }}>
        <div style={{
          width: 210,
          background: t.raised,
          border: "1px solid " + t.border,
          borderRadius: 10,
          padding: 11,
          boxShadow: t.shadow
        }}>
          <b style={{
            fontSize: 9
          }}>Create saved view</b><div style={{
            marginTop: 4,
            fontSize: 7,
            color: t.text2
          }}>Name this filter configuration.</div><div style={{
            marginTop: 9,
            height: 28,
            border: "1px solid " + t.borderStrong,
            borderRadius: 6,
            background: t.surface
          }} /><div style={{
            marginTop: 9,
            display: "flex",
            justifyContent: "flex-end",
            gap: 5
          }}><button style={{
              height: 27,
              border: "1px solid " + t.border,
              borderRadius: 6,
              background: t.surface,
              color: t.text,
              fontSize: 7
            }}>Cancel</button><button style={{
              height: 27,
              border: 0,
              borderRadius: 6,
              background: t.primary,
              color: t.primaryFg,
              fontSize: 7
            }}>Save</button></div>
        </div>
      </div>
      <div style={{
        minHeight: 170,
        background: t.surface2,
        borderRadius: 9,
        padding: 9
      }}><div style={{
          height: "100%",
          background: t.surface,
          borderRadius: 8,
          padding: 9,
          boxShadow: t.shadow
        }}><b style={{
            fontSize: 8
          }}>Drawer</b>{["Owner", "Stage", "Value"].map(x => <div key={x} style={{
            marginTop: 8
          }}><div style={{
              fontSize: 6,
              color: t.text3
            }}>{x}</div><div style={{
              marginTop: 3,
              height: 25,
              border: "1px solid " + t.borderStrong,
              borderRadius: 6
            }} /></div>)}</div></div>
      <div style={{
        minHeight: 170,
        background: t.surface2,
        borderRadius: 9,
        padding: 9
      }}><div style={{
          background: t.raised,
          border: "1px solid " + t.border,
          borderRadius: 8,
          padding: 8,
          boxShadow: t.shadow
        }}><b style={{
            fontSize: 8
          }}>Popover</b>{["Add task", "Assign owner", "Convert"].map(x => <div key={x} style={{
            padding: "7px 4px",
            fontSize: 7,
            color: t.text2
          }}>{x}</div>)}</div><div style={{
          marginTop: 8,
          padding: "6px 8px",
          borderRadius: 6,
          background: t.primary,
          color: t.primaryFg,
          fontSize: 6
        }}>Tooltip · contextual help</div></div>
    </div>
  </div>;
}
function WidgetsMode({
  mode
}: {
  mode: Mode;
}) {
  const t = theme[mode];
  return <div style={{
    background: t.canvas,
    borderRadius: 10,
    padding: 10,
    color: t.text
  }}>
    <ModeLabel mode={mode} />
    <div style={{
      marginTop: 9,
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 7
    }}>
      <KpiCard mode={mode} label="Revenue" value="EGP 1.24M" delta="+12.4%" variant="magenta" />
      <KpiCard mode={mode} label="Qualified" value="42" delta="+8.1%" variant="navy" />
      <KpiCard mode={mode} label="Open leads" value="128" delta="+4.8%" />
      <KpiCard mode={mode} label="Avg. response" value="18m" delta="-6.2%" />
    </div>
    <div style={{
      marginTop: 7,
      display: "grid",
      gridTemplateColumns: "1.2fr .8fr",
      gap: 7
    }}>
      <div style={{
        background: t.surface,
        border: "1px solid " + t.border,
        borderRadius: 8,
        padding: 8
      }}><b style={{
          fontSize: 8
        }}>Trend widget</b><Trend mode={mode} /></div>
      <div style={{
        background: t.surface,
        border: "1px solid " + t.border,
        borderRadius: 8,
        padding: 8
      }}><b style={{
          fontSize: 8
        }}>Action list</b>{["Follow-up due", "Meeting today", "Proposal sent"].map((x, i) => <div key={x} style={{
          padding: "7px 0",
          borderTop: i ? "1px solid " + t.divider : "none",
          fontSize: 7,
          color: t.text2
        }}>{x}</div>)}</div>
    </div>
  </div>;
}
function DataVizMode({
  mode
}: {
  mode: Mode;
}) {
  const t = theme[mode];
  return <div style={{
    background: t.canvas,
    borderRadius: 10,
    padding: 10,
    color: t.text
  }}>
    <ModeLabel mode={mode} />
    <div style={{
      marginTop: 9,
      display: "grid",
      gridTemplateColumns: "1.1fr 1fr .85fr",
      gap: 7
    }}>
      <div style={{
        background: t.surface,
        border: "1px solid " + t.border,
        borderRadius: 8,
        padding: 8
      }}><b style={{
          fontSize: 8
        }}>Trend / overlap</b><Trend mode={mode} /></div>
      <div style={{
        background: t.surface,
        border: "1px solid " + t.border,
        borderRadius: 8,
        padding: 8
      }}><b style={{
          fontSize: 8
        }}>Comparison</b><div style={{
          marginTop: 8,
          display: "grid",
          gap: 6
        }}>{[["Meta", 88], ["Web", 72], ["Referral", 54], ["Direct", 42]].map((r, i) => <div key={String(r[0])} style={{
            display: "grid",
            gridTemplateColumns: "42px 1fr 20px",
            gap: 4,
            alignItems: "center",
            fontSize: 6
          }}><span>{r[0]}</span><div style={{
              height: 6,
              borderRadius: 99,
              background: t.surface3
            }}><div style={{
                height: "100%",
                width: r[1] + "%",
                borderRadius: 99,
                background: t.chart[i]
              }} /></div><span>{r[1]}</span></div>)}</div></div>
      <div style={{
        background: t.surface,
        border: "1px solid " + t.border,
        borderRadius: 8,
        padding: 8
      }}><b style={{
          fontSize: 8
        }}>Categorical palette</b><div style={{
          marginTop: 9,
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 4
        }}>{t.chart.map((c, i) => <span key={i} style={{
            height: 22,
            borderRadius: 5,
            background: c
          }} />)}</div></div>
    </div>
    <div style={{
      marginTop: 7,
      fontSize: 7,
      color: t.text2
    }}>Categorical = identity · sequential = magnitude · diverging = deviation · previous/forecast use line style + opacity, not random color.</div>
  </div>;
}
function ReportingMode({
  mode
}: {
  mode: Mode;
}) {
  const t = theme[mode];
  return <div style={{
    background: t.canvas,
    borderRadius: 10,
    padding: 10,
    color: t.text
  }}>
    <ModeLabel mode={mode} />
    <div style={{
      marginTop: 9,
      display: "flex",
      gap: 5,
      alignItems: "center"
    }}>{["Last 30 days", "All sources", "All owners"].map(x => <span key={x} style={{
        padding: "5px 7px",
        border: "1px solid " + t.border,
        borderRadius: 6,
        background: t.surface,
        fontSize: 6,
        color: t.text2
      }}>{x}</span>)}<span style={{
        marginLeft: "auto",
        padding: "5px 7px",
        borderRadius: 6,
        background: t.primary,
        color: t.primaryFg,
        fontSize: 6,
        fontWeight: 700
      }}>Export</span></div>
    <div style={{
      marginTop: 7,
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 5
    }}>{[["Revenue", "EGP 1.24M"], ["Won", "72"], ["Conversion", "17.8%"], ["SLA", "82%"]].map(x => <div key={x[0]} style={{
        background: t.surface,
        border: "1px solid " + t.border,
        borderRadius: 7,
        padding: 7
      }}><div style={{
          fontSize: 6,
          color: t.text3
        }}>{x[0]}</div><b style={{
          display: "block",
          marginTop: 3,
          fontSize: 10
        }}>{x[1]}</b></div>)}</div>
    <div style={{
      marginTop: 7,
      display: "grid",
      gridTemplateColumns: "1.25fr .75fr",
      gap: 6
    }}><div style={{
        background: t.surface,
        border: "1px solid " + t.border,
        borderRadius: 7,
        padding: 6
      }}><Trend mode={mode} /></div><div style={{
        background: t.warningBg,
        borderRadius: 7,
        padding: 7,
        color: t.warningFg,
        fontSize: 6,
        lineHeight: "11px"
      }}><b>Insight</b><br />Revenue +12.4%. Referral and larger deals contributed most.</div></div>
  </div>;
}
function ViewManagementMode({
  mode
}: {
  mode: Mode;
}) {
  const t = theme[mode];
  return <div style={{
    background: t.canvas,
    borderRadius: 10,
    padding: 10,
    color: t.text
  }}>
    <ModeLabel mode={mode} />
    <div style={{
      marginTop: 9,
      display: "grid",
      gridTemplateColumns: "1.2fr .8fr",
      gap: 7
    }}>
      <div style={{
        background: t.surface,
        border: "1px solid " + t.border,
        borderRadius: 8,
        padding: 8
      }}><b style={{
          fontSize: 8
        }}>Filter builder</b>{[["Stage", "is", "Qualified"], ["Value", ">", "EGP 100K"], ["Activity", "before", "7 days"]].map((r, i) => <div key={i} style={{
          marginTop: 6,
          display: "grid",
          gridTemplateColumns: "1fr .7fr 1.2fr",
          gap: 4
        }}>{r.map(x => <span key={x} style={{
            padding: "5px 6px",
            borderRadius: 5,
            background: t.surface2,
            fontSize: 6,
            color: t.text2
          }}>{x}</span>)}</div>)}</div>
      <div style={{
        background: t.surface,
        border: "1px solid " + t.border,
        borderRadius: 8,
        padding: 8
      }}><b style={{
          fontSize: 8
        }}>Saved views</b>{["All leads", "My qualified", "High value"].map((x, i) => <div key={x} style={{
          marginTop: 5,
          padding: "6px 7px",
          borderRadius: 5,
          background: i === 1 ? t.selected : "transparent",
          fontSize: 6,
          color: t.text2
        }}>{x}</div>)}</div>
    </div>
    <div style={{
      marginTop: 7,
      display: "flex",
      gap: 4,
      alignItems: "center"
    }}>{["‹", "1", "2", "3", "4", "›"].map((x, i) => <span key={i} style={{
        width: 24,
        height: 24,
        borderRadius: 5,
        background: x === "2" ? t.selected : t.surface,
        display: "grid",
        placeItems: "center",
        fontSize: 6,
        border: "1px solid " + t.border
      }}>{x}</span>)}<span style={{
        marginLeft: 6,
        fontSize: 6,
        color: t.text3
      }}>25 / page · 1–25 of 284</span></div>
  </div>;
}
function SystemStatesMode({
  mode
}: {
  mode: Mode;
}) {
  const t = theme[mode];
  return <div style={{
    background: t.canvas,
    borderRadius: 10,
    padding: 10,
    color: t.text
  }}>
    <ModeLabel mode={mode} />
    <div style={{
      marginTop: 9,
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 7
    }}>
      <div style={{
        padding: 8,
        borderRadius: 7,
        background: t.surface
      }}><b style={{
          fontSize: 7
        }}>Loading</b><div style={{
          marginTop: 6,
          display: "grid",
          gap: 4
        }}>{[90, 70, 82].map((w, i) => <i key={i} style={{
            height: 7,
            width: w + "%",
            borderRadius: 4,
            background: t.surface3
          }} />)}</div></div>
      <div style={{
        padding: 8,
        borderRadius: 7,
        background: t.surface
      }}><b style={{
          fontSize: 7
        }}>Empty</b><div style={{
          marginTop: 4,
          fontSize: 6,
          color: t.text3
        }}>No data yet · Create first item</div></div>
      <div style={{
        padding: 8,
        borderRadius: 7,
        background: t.dangerBg,
        color: t.dangerFg
      }}><b style={{
          fontSize: 7
        }}>Error</b><div style={{
          marginTop: 4,
          fontSize: 6
        }}>Unable to load · Retry</div></div>
      <div style={{
        padding: 8,
        borderRadius: 7,
        background: t.infoBg,
        color: t.infoFg
      }}><b style={{
          fontSize: 7
        }}>Restricted</b><div style={{
          marginTop: 4,
          fontSize: 6
        }}>Request permission</div></div>
    </div>
  </div>;
}
type SysIconName = "home" | "inbox" | "tasks" | "contacts" | "leads" | "deals" | "route" | "report" | "settings" | "plus" | "edit" | "delete" | "copy" | "upload" | "download" | "filter" | "more" | "mail" | "phone" | "message" | "bell" | "calendar" | "clock" | "automation" | "advance" | "play" | "pause" | "external" | "drill" | "success" | "warning" | "info" | "critical" | "trend" | "bars" | "pie" | "table" | "growth" | "target" | "lock" | "shield" | "key" | "database" | "search";
function SysIcon({
  name,
  size = 18,
  stroke = 2,
  color = "currentColor"
}: {
  name: SysIconName;
  size?: number;
  stroke?: number;
  color?: string;
}) {
  const common = {
    fill: "none",
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const
  };
  let body: React.ReactNode;
  switch (name) {
    case "home":
      body = <><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10.5V20h13v-9.5" /><path d="M9 20v-6h6v6" /></>;
      break;
    case "inbox":
      body = <><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M4 13h4l2 3h4l2-3h4" /></>;
      break;
    case "tasks":
      body = <><rect x="5" y="4" width="14" height="16" rx="2" /><path d="m8 9 1.5 1.5L12 8" /><path d="M14 9h2.5M8 15h8.5" /></>;
      break;
    case "contacts":
      body = <><circle cx="9" cy="9" r="3" /><path d="M4.5 19c.7-3 2.3-4.5 4.5-4.5s3.8 1.5 4.5 4.5" /><circle cx="16.5" cy="8" r="2" /><path d="M14.5 14.5c2.6 0 4.4 1.2 5 3.5" /></>;
      break;
    case "leads":
      body = <><circle cx="9" cy="9" r="3" /><path d="M4.5 19c.8-3.1 2.3-4.5 4.5-4.5 1.7 0 3 1 3.8 2.7" /><path d="M17 13v6M14 16h6" /></>;
      break;
    case "deals":
      body = <><rect x="3.5" y="7" width="17" height="12" rx="2" /><path d="M8 7V5h8v2M3.5 12h17M10 12v2h4v-2" /></>;
      break;
    case "route":
      body = <><circle cx="6" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><path d="M8 6h4c3 0 4 2 4 4s-1 4-4 4H9c-2 0-3 1.5-3 3v1" /></>;
      break;
    case "report":
    case "bars":
      body = <><path d="M4 20V10h4v10M10 20V4h4v16M16 20v-7h4v7" /><path d="M3 20h18" /></>;
      break;
    case "settings":
      body = <><path d="M4 7h10M18 7h2M4 17h2M10 17h10M4 12h4M12 12h8" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /><circle cx="10" cy="12" r="2" /></>;
      break;
    case "plus":
      body = <><path d="M12 5v14M5 12h14" /></>;
      break;
    case "edit":
      body = <><path d="m5 19 3.5-.8L19 7.7 16.3 5 5.8 15.5 5 19Z" /><path d="m14.8 6.5 2.7 2.7" /></>;
      break;
    case "delete":
      body = <><path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13M10 10v6M14 10v6" /></>;
      break;
    case "copy":
      body = <><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V5H5v11h3" /></>;
      break;
    case "upload":
      body = <><path d="M12 16V5M8 9l4-4 4 4" /><path d="M5 15v4h14v-4" /></>;
      break;
    case "download":
      body = <><path d="M12 5v11M8 12l4 4 4-4" /><path d="M5 19h14" /></>;
      break;
    case "filter":
      body = <><path d="M4 6h16l-6 7v5l-4 2v-7L4 6Z" /></>;
      break;
    case "more":
      body = <><circle cx="6" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="18" cy="12" r="1" /></>;
      break;
    case "mail":
      body = <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>;
      break;
    case "phone":
      body = <><path d="M7 4 4.5 6.5c1 5.5 7.5 12 13 13L20 17l-4-3-2 2c-2.7-1.4-4.6-3.3-6-6l2-2-3-4Z" /></>;
      break;
    case "message":
      body = <><path d="M4 5h16v12H9l-5 3V5Z" /></>;
      break;
    case "bell":
      body = <><path d="M6 17h12l-1.5-2V10a4.5 4.5 0 0 0-9 0v5L6 17Z" /><path d="M10 20h4" /></>;
      break;
    case "calendar":
      body = <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 9h16" /></>;
      break;
    case "clock":
      body = <><circle cx="12" cy="12" r="8" /><path d="M12 8v5l3 2" /></>;
      break;
    case "automation":
      body = <><path d="M4 7h4c5 0 5 10 10 10h2" /><path d="m17 14 3 3-3 3" /><path d="M4 17h4c2.2 0 3.3-1.8 4.2-3.6" /><path d="M16 7h4M17 4l3 3-3 3" /></>;
      break;
    case "advance":
      body = <><path d="M5 12h14M14 7l5 5-5 5" /></>;
      break;
    case "play":
      body = <><circle cx="12" cy="12" r="8" /><path d="m10 8 6 4-6 4V8Z" /></>;
      break;
    case "pause":
      body = <><circle cx="12" cy="12" r="8" /><path d="M10 9v6M14 9v6" /></>;
      break;
    case "external":
      body = <><path d="M13 5h6v6M19 5l-8 8" /><path d="M10 6H5v13h13v-5" /></>;
      break;
    case "drill":
      body = <><path d="m9 6 6 6-6 6" /></>;
      break;
    case "success":
      body = <><circle cx="12" cy="12" r="8" /><path d="m8.5 12 2.2 2.2L16 9" /></>;
      break;
    case "warning":
      body = <><path d="M12 4 21 20H3L12 4Z" /><path d="M12 9v5M12 17h.01" /></>;
      break;
    case "info":
      body = <><circle cx="12" cy="12" r="8" /><path d="M12 11v5M12 8h.01" /></>;
      break;
    case "critical":
      body = <><circle cx="12" cy="12" r="8" /><path d="m9 9 6 6M15 9l-6 6" /></>;
      break;
    case "trend":
      body = <><path d="M4 18V6M4 18h16" /><path d="m7 15 4-4 3 2 5-6" /></>;
      break;
    case "pie":
      body = <><path d="M12 4a8 8 0 1 0 8 8h-8V4Z" /><path d="M14 4.3A8 8 0 0 1 19.7 10H14V4.3Z" /></>;
      break;
    case "table":
      body = <><rect x="4" y="5" width="16" height="14" rx="1" /><path d="M4 10h16M9 5v14M15 5v14" /></>;
      break;
    case "growth":
      body = <><path d="M4 17 9 12l4 3 7-8" /><path d="M15 7h5v5" /></>;
      break;
    case "target":
      body = <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" /></>;
      break;
    case "lock":
      body = <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>;
      break;
    case "shield":
      body = <><path d="M12 3 19 6v6c0 4-2.6 7-7 9-4.4-2-7-5-7-9V6l7-3Z" /><path d="m9 12 2 2 4-4" /></>;
      break;
    case "key":
      body = <><circle cx="8" cy="12" r="4" /><path d="M12 12h8M17 12v3M20 12v2" /></>;
      break;
    case "database":
      body = <><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" /></>;
      break;
    case "search":
      body = <><circle cx="10.5" cy="10.5" r="5.5" /><path d="m15 15 5 5" /></>;
      break;
    default:
      body = <circle cx="12" cy="12" r="7" />;
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" {...common}>{body}</svg>;
}
const iconGroups: Array<{
  title: string;
  note: string;
  items: Array<[string, string, SysIconName]>;
}> = [{
  title: "Navigation & CRM objects",
  note: "Stable objects and destinations keep one metaphor across the product.",
  items: [["Home", "home", "home"], ["Inbox", "inbox", "inbox"], ["Tasks", "list-check", "tasks"], ["Contacts", "address-book", "contacts"], ["Leads", "user-plus", "leads"], ["Deals", "briefcase", "deals"], ["Pipeline / Journey", "route", "route"], ["Reports", "chart-bar", "report"], ["Settings", "adjustments-horizontal", "settings"]]
}, {
  title: "Core actions",
  note: "Verb actions are literal; destructive meaning never changes by context.",
  items: [["Create / Add", "plus", "plus"], ["Edit", "pencil", "edit"], ["Delete", "trash", "delete"], ["Duplicate", "copy", "copy"], ["Import / Upload", "upload", "upload"], ["Export / Download", "download", "download"], ["Filter", "filter", "filter"], ["More", "dots", "more"]]
}, {
  title: "Communication & time",
  note: "Labels stay visible in primary workflows; icon-only is reserved for familiar utilities.",
  items: [["Email", "mail", "mail"], ["Call", "phone", "phone"], ["Message", "message-circle", "message"], ["Notification", "bell", "bell"], ["Schedule", "calendar", "calendar"], ["Time / SLA", "clock", "clock"]]
}, {
  title: "Workflow & automation",
  note: "Execution and movement symbols do not double as business-status symbols.",
  items: [["Automation", "arrows-shuffle", "automation"], ["Advance", "arrow-right", "advance"], ["Run", "player-play", "play"], ["Pause", "player-pause", "pause"], ["Open externally", "external-link", "external"], ["Drill in", "chevron-right", "drill"]]
}, {
  title: "Status & feedback",
  note: "Every status combines icon + label; color only reinforces meaning.",
  items: [["Success", "circle-check", "success"], ["Warning", "alert-triangle", "warning"], ["Information", "info-circle", "info"], ["Critical / failed", "circle-x", "critical"]]
}, {
  title: "Reporting & analysis",
  note: "Chart icons identify views; metrics do not get decorative chart icons.",
  items: [["Trend", "chart-line", "trend"], ["Comparison", "chart-bar", "bars"], ["Composition", "chart-pie", "pie"], ["Table", "table", "table"], ["Growth", "trending-up", "growth"], ["Target", "target", "target"]]
}, {
  title: "Security & system",
  note: "Capabilities and resources remain literal; permission states also use text.",
  items: [["Locked", "lock", "lock"], ["Security", "shield-check", "shield"], ["Credential / key", "key", "key"], ["Database", "database", "database"], ["Search", "search", "search"], ["Settings", "adjustments-horizontal", "settings"]]
}];
function IconTile({
  mode,
  label,
  name,
  icon
}: {
  mode: Mode;
  label: string;
  name: string;
  icon: SysIconName;
}) {
  const t = theme[mode];
  return <div style={{
    minHeight: 70,
    border: "1px solid " + t.border,
    borderRadius: 9,
    background: t.surface,
    padding: 8,
    display: "grid",
    gridTemplateColumns: "30px 1fr",
    gap: 7,
    alignItems: "center",
    color: t.text
  }}>
    <span style={{
      width: 30,
      height: 30,
      borderRadius: 8,
      display: "grid",
      placeItems: "center",
      background: t.surface2,
      color: t.icon
    }}><SysIcon name={icon} size={18} /></span>
    <div><div style={{
        fontSize: 8,
        fontWeight: 750
      }}>{label}</div><code style={{
        display: "block",
        marginTop: 3,
        fontSize: 6,
        color: t.text3
      }}>{name}</code></div>
  </div>;
}
function IconStateStrip({
  mode
}: {
  mode: Mode;
}) {
  const t = theme[mode];
  const samples: Array<[string, SysIconName]> = [["Default", "mail"], ["Hover", "mail"], ["Selected", "mail"], ["Disabled", "mail"], ["Destructive", "delete"]];
  return <div style={{
    background: t.canvas,
    borderRadius: 10,
    padding: 10,
    color: t.text
  }}>
    <ModeLabel mode={mode} />
    <div style={{
      marginTop: 9,
      display: "grid",
      gridTemplateColumns: "repeat(5,1fr)",
      gap: 7
    }}>
      {samples.map(([label, icon], i) => {
        const destructive = i === 4,
          selected = i === 2,
          disabled = i === 3,
          hover = i === 1;
        return <div key={label} style={{
          textAlign: "center"
        }}>
          <div style={{
            width: 44,
            height: 44,
            margin: "0 auto",
            borderRadius: 8,
            display: "grid",
            placeItems: "center",
            background: selected ? t.selected : hover ? t.hover : t.surface,
            color: destructive ? t.dangerFg : disabled ? t.textDisabled : selected ? t.interactive : t.icon,
            opacity: disabled ? .55 : 1,
            border: "1px solid " + (hover || selected ? t.borderStrong : t.border)
          }}><SysIcon name={icon} size={18} /></div>
          <div style={{
            marginTop: 5,
            fontSize: 6,
            color: t.text3
          }}>{label}</div>
        </div>;
      })}
    </div>
  </div>;
}
function IconSizingLab() {
  return <div style={{
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: 8
  }}>
    {[["16px", "Dense tables / inline", 16], ["18px", "Default navigation", 18], ["20px", "Prominent controls", 20], ["24px", "Empty states / feature cue", 24]].map(([size, use, n]) => <div key={String(size)} style={{
      border: "1px solid #DDE3EA",
      borderRadius: 9,
      padding: 10,
      background: "#fff"
    }}>
      <div style={{
        height: 42,
        display: "grid",
        placeItems: "center",
        color: brand.navy
      }}><SysIcon name="target" size={Number(n)} /></div><b style={{
        fontSize: 8
      }}>{size}</b><div style={{
        marginTop: 3,
        fontSize: 6,
        color: "#667085"
      }}>{use}</div>
    </div>)}
  </div>;
}
function IconUsageExamples() {
  const t = theme.light;
  return <div style={{
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 8
  }}>
    <div style={{
      padding: 10,
      borderRadius: 9,
      background: "#F7F9FB"
    }}><div style={{
        fontSize: 8,
        fontWeight: 800
      }}>Labelled navigation</div><div style={{
        marginTop: 8,
        display: "grid",
        gap: 4
      }}>{[["contacts", "Contacts"], ["leads", "Leads"], ["deals", "Deals"]].map(([icon, label], i) => <div key={label} style={{
          height: 30,
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "0 8px",
          background: i === 1 ? t.selected : "transparent",
          fontSize: 7,
          color: t.text
        }}><SysIcon name={icon as SysIconName} size={16} /><span>{label}</span></div>)}</div></div>
    <div style={{
      padding: 10,
      borderRadius: 9,
      background: "#F7F9FB"
    }}><div style={{
        fontSize: 8,
        fontWeight: 800
      }}>Icon-only utility</div><div style={{
        marginTop: 12,
        display: "flex",
        gap: 8
      }}>{(["search", "filter", "more"] as SysIconName[]).map(icon => <button type="button" key={icon} aria-label={icon === "search" ? "Search" : icon === "filter" ? "Filter" : "More actions"} title={icon === "search" ? "Search" : icon === "filter" ? "Filter" : "More actions"} style={{
          width: 44,
          height: 44,
          border: "1px solid " + t.border,
          borderRadius: 8,
          background: t.surface,
          display: "grid",
          placeItems: "center",
          color: t.icon
        }}><SysIcon name={icon} size={18} /></button>)}</div><div style={{
        marginTop: 8,
        fontSize: 6,
        lineHeight: "11px",
        color: t.text3
      }}>Requires accessible label; tooltip appears on hover/focus.</div></div>
    <div style={{
      padding: 10,
      borderRadius: 9,
      background: "#F7F9FB"
    }}><div style={{
        fontSize: 8,
        fontWeight: 800
      }}>Status = icon + label</div><div style={{
        marginTop: 8,
        display: "grid",
        gap: 6
      }}>{[["success", "Qualified", t.successBg, t.successFg], ["warning", "Needs attention", t.warningBg, t.warningFg], ["critical", "Failed", t.dangerBg, t.dangerFg]].map(([icon, label, bg, fg]) => <div key={label} style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 8px",
          borderRadius: 7,
          background: String(bg),
          color: String(fg),
          fontSize: 7,
          fontWeight: 650
        }}><SysIcon name={icon as SysIconName} size={14} />{label}</div>)}</div></div>
  </div>;
}
function IconographySystem() {
  return <div style={{
    display: "grid",
    gap: 12
  }}>
    <div style={{
      display: "grid",
      gridTemplateColumns: "1.05fr .95fr",
      gap: 10
    }}>
      <div style={{
        padding: 12,
        borderRadius: 10,
        background: "#F7F9FB"
      }}><div style={{
          fontSize: 9,
          fontWeight: 800
        }}>SYSTEM CONTRACT</div><div style={{
          marginTop: 8,
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 7
        }}>{[["Reference library", "Tabler Icons", "Canonical metaphor vocabulary"], ["Runtime layer", "Systronic Icon Wrapper", "Components never import a library directly"], ["Base geometry", "24×24", "2px round caps + joins"], ["Default UI size", "18px", "16px dense · 20–24px prominent"], ["Color", "currentColor", "Theme token driven"], ["Touch target", "44px+", "Interactive icon action"], ["Metaphor", "Literal", "One canonical function"], ["RTL direction", "Logical / mirrored", "Directional arrows mirror; object icons do not"]].map(x => <div key={x[0]} style={{
            padding: 9,
            borderRadius: 8,
            background: "#fff",
            border: "1px solid #E8ECF1"
          }}><b style={{
              fontSize: 7
            }}>{x[0]}</b><div style={{
              marginTop: 3,
              fontSize: 9,
              fontWeight: 750,
              color: brand.navy
            }}>{x[1]}</div><div style={{
              marginTop: 2,
              fontSize: 6,
              color: "#667085"
            }}>{x[2]}</div></div>)}</div></div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8
      }}><IconStateStrip mode="light" /><IconStateStrip mode="dark" /></div>
    </div>


    <div><div style={{
        fontSize: 9,
        fontWeight: 800,
        marginBottom: 7
      }}>SIZE & OPTICAL SCALE</div><IconSizingLab /></div>


    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 10
    }}>
      {iconGroups.map(group => <div key={group.title} style={{
        border: "1px solid #DDE3EA",
        borderRadius: 11,
        padding: 10,
        background: "#FBFCFD"
      }}>
        <div style={{
          fontSize: 9,
          fontWeight: 800
        }}>{group.title}</div><div style={{
          marginTop: 3,
          minHeight: 25,
          fontSize: 6,
          lineHeight: "10px",
          color: "#667085"
        }}>{group.note}</div>
        <div style={{
          marginTop: 8,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 6
        }}>{group.items.map(([label, name, icon]) => <IconTile key={label} mode="light" label={label} name={name} icon={icon} />)}</div>
      </div>)}
    </div>


    <div style={{
      display: "grid",
      gridTemplateColumns: "1.25fr .75fr",
      gap: 10
    }}>
      <div><div style={{
          fontSize: 9,
          fontWeight: 800,
          marginBottom: 7
        }}>USAGE PATTERNS</div><IconUsageExamples /></div>
      <div style={{
        padding: 11,
        borderRadius: 10,
        background: "#F7F9FB"
      }}><div style={{
          fontSize: 9,
          fontWeight: 800
        }}>DO / DON'T</div><div style={{
          marginTop: 8,
          display: "grid",
          gap: 7,
          fontSize: 7,
          lineHeight: "12px",
          color: "#475467"
        }}>
        <div style={{
            padding: 8,
            borderRadius: 7,
            background: "#EAFBF2",
            color: "#087443"
          }}><b>DO</b> · Pair unfamiliar icons with text labels and keep the same metaphor everywhere.</div>
        <div style={{
            padding: 8,
            borderRadius: 7,
            background: "#EAFBF2",
            color: "#087443"
          }}><b>DO</b> · Express hover/selected mainly through the control background; icon color remains semantic.</div>
        <div style={{
            padding: 8,
            borderRadius: 7,
            background: "#EAFBF2",
            color: "#087443"
          }}><b>DO</b> · Mirror directional arrows and disclosure flow in RTL; keep literal object icons unchanged.</div>
        <div style={{
            padding: 8,
            borderRadius: 7,
            background: "#FFF0F4",
            color: "#B0002C"
          }}><b>DON'T</b> · Invent decorative symbols when a familiar metaphor exists.</div>
        <div style={{
            padding: 8,
            borderRadius: 7,
            background: "#FFF0F4",
            color: "#B0002C"
          }}><b>DON'T</b> · Use color alone for status or mix visual icon languages.</div>
        <div style={{
            padding: 8,
            borderRadius: 7,
            background: "#FFF0F4",
            color: "#B0002C"
          }}><b>DON'T</b> · Mirror non-directional object icons such as phone, lock, user, database, or status symbols.</div>
      </div></div>
    </div>
  </div>;
}
const interactionRows = [["Default", "Resting state", "Neutral surface · neutral icon/text", "No implied selection"], ["Hover", "Pointer intent", "Subtle surface change", "Never the only affordance"], ["Focus visible", "Keyboard focus", "2px-equivalent focus perimeter · ≥3:1 delta", "Focus ≠ selected"], ["Pressed", "Activation in progress", "Short-lived stronger state", "Returns to next state on release"], ["Selected", "Persistent choice", "Selected surface + semantic icon/text", "May coexist with focus"], ["Disabled", "Unavailable", "Reduced emphasis + no action", "Explain reason when material"], ["Loading", "Async action", "Keep label context + progress state", "Prevent duplicate submission"]] as const;
function InteractionStateMatrix({
  mode
}: {
  mode: Mode;
}) {
  const t = theme[mode];
  return <div style={{
    background: t.canvas,
    borderRadius: 10,
    padding: 10,
    color: t.text
  }}>
    <ModeLabel mode={mode} />
    <div style={{
      marginTop: 9,
      display: "grid",
      gridTemplateColumns: "repeat(7,1fr)",
      gap: 7
    }}>
      {interactionRows.map(([state, purpose,, rule], i) => {
        const bg = state === "Hover" ? t.hover : state === "Selected" ? t.selected : state === "Disabled" ? t.disabled : state === "Loading" ? t.surface2 : t.surface;
        const fg = state === "Disabled" ? t.textDisabled : state === "Selected" ? t.interactive : t.text;
        const focus = state === "Focus visible";
        const pressed = state === "Pressed";
        return <div key={state} style={{
          minHeight: 118,
          borderRadius: 8,
          padding: 9,
          background: bg,
          color: fg,
          border: "1px solid " + (focus ? t.focus : t.borderStrong),
          boxShadow: focus ? "0 0 0 2px " + t.focusRing : pressed ? "inset 0 1px 3px rgba(0,0,0,.18)" : "none",
          opacity: state === "Disabled" ? .58 : 1
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 6
          }}>
            {state === "Loading" ? <span style={{
              width: 13,
              height: 13,
              borderRadius: 99,
              border: "2px solid " + t.borderStrong,
              borderTopColor: t.interactive
            }} /> : <SysIcon name={state === "Selected" ? "success" : state === "Disabled" ? "lock" : state === "Pressed" ? "advance" : "target"} size={14} />}
            <b style={{
              fontSize: 7
            }}>{state}</b>
          </div>
          <div style={{
            marginTop: 7,
            fontSize: 6,
            lineHeight: "10px",
            color: state === "Disabled" ? t.textDisabled : t.text2
          }}>{purpose}</div>
          <div style={{
            marginTop: 8,
            fontSize: 6,
            lineHeight: "10px",
            color: state === "Selected" ? t.interactive : t.text3
          }}>{rule}</div>
        </div>;
      })}
    </div>
  </div>;
}
function KeyboardContract() {
  const rows = [["Button", "Enter / Space", "Activate action", "Native button preferred"], ["Link", "Enter", "Navigate", "No Space activation"], ["Tabs", "← / → · Home / End", "Move active tab", "Tab enters/leaves tablist"], ["Menu / listbox", "↑ / ↓ · Enter · Esc", "Move / choose / close", "Roving focus inside widget"], ["Dialog", "Tab / Shift+Tab · Esc", "Trap focus / close", "Return focus to trigger"], ["Tooltip", "Hover or focus · Esc", "Show / dismiss", "Tooltip never takes focus"], ["Data grid", "Arrow keys · Home / End", "Cell/row navigation", "Only when grid is truly interactive"], ["Command palette", "⌘K / Ctrl+K · ↑ / ↓ · Enter · Esc", "Open / navigate / execute / close", "Shortcut is discoverable"]];
  return <div style={{
    border: "1px solid #DDE3EA",
    borderRadius: 10,
    overflow: "hidden"
  }}>
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1.15fr 1.25fr 1.5fr",
      padding: "8px 10px",
      background: "#F7F9FB",
      fontSize: 7,
      fontWeight: 800,
      color: "#667085",
      textTransform: "uppercase"
    }}><span>Pattern</span><span>Keys</span><span>Behavior</span><span>Rule</span></div>
    {rows.map((r, i) => <div key={r[0]} style={{
      display: "grid",
      gridTemplateColumns: "1fr 1.15fr 1.25fr 1.5fr",
      padding: "9px 10px",
      borderTop: "1px solid #E8ECF1",
      background: i % 2 ? "#FBFCFD" : "#fff",
      fontSize: 7,
      color: "#475467"
    }}>
      <b style={{
        color: "#181D36"
      }}>{r[0]}</b><code>{r[1]}</code><span>{r[2]}</span><span>{r[3]}</span>
    </div>)}
  </div>;
}
function OverlayBehaviorContract() {
  const items = [["Modal dialog", "Initial focus enters dialog", "Tab cycle remains inside", "Esc closes", "Focus returns to trigger"], ["Drawer", "Focus enters first meaningful control", "Background remains unavailable when modal", "Esc closes", "Restore previous focus"], ["Popover / menu", "Trigger retains relationship", "Arrow keys within menu/listbox", "Esc closes", "Return to trigger"], ["Tooltip", "Trigger keeps focus", "Appears on hover + keyboard focus", "Esc dismisses", "No interactive content inside tooltip"]];
  return <div style={{
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: 8
  }}>
    {items.map(([title, ...rules]) => <div key={title} style={{
      border: "1px solid #DDE3EA",
      borderRadius: 9,
      padding: 10,
      background: "#fff"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6
      }}><SysIcon name={title.startsWith("Tooltip") ? "info" : "drill"} size={14} /><b style={{
          fontSize: 8
        }}>{title}</b></div>
      <div style={{
        marginTop: 8,
        display: "grid",
        gap: 5
      }}>{rules.map(rule => <div key={rule} style={{
          fontSize: 6,
          lineHeight: "10px",
          color: "#667085",
          display: "flex",
          gap: 5
        }}><span style={{
            color: brand.teal
          }}>•</span><span>{rule}</span></div>)}</div>
    </div>)}
  </div>;
}
function AsyncDestructiveContract() {
  return <div style={{
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 9
  }}>
    <div style={{
      border: "1px solid #DDE3EA",
      borderRadius: 10,
      padding: 11,
      background: "#FBFCFD"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6
      }}><SysIcon name="play" size={15} /><b style={{
          fontSize: 8
        }}>Async / loading actions</b></div>
      <div style={{
        marginTop: 9,
        display: "grid",
        gridTemplateColumns: "repeat(3,1fr)",
        gap: 7
      }}>
        <button style={{
          height: 34,
          border: 0,
          borderRadius: 7,
          background: brand.navy,
          color: "#fff",
          fontSize: 7
        }}>Save changes</button>
        <button aria-busy="true" style={{
          height: 34,
          border: 0,
          borderRadius: 7,
          background: brand.navy,
          color: "#fff",
          fontSize: 7,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6
        }}><span style={{
            width: 11,
            height: 11,
            borderRadius: 99,
            border: "2px solid rgba(255,255,255,.35)",
            borderTopColor: "#fff"
          }} />Saving…</button>
        <button disabled style={{
          height: 34,
          border: "1px solid #DDE3EA",
          borderRadius: 7,
          background: "#F2F4F7",
          color: "#98A2B3",
          fontSize: 7
        }}>Saved</button>
      </div>
      <div style={{
        marginTop: 8,
        fontSize: 6,
        lineHeight: "11px",
        color: "#667085"
      }}>Keep action context visible, set busy state, block duplicate execution, and announce completion/error where needed.</div>
    </div>
    <div style={{
      border: "1px solid #DDE3EA",
      borderRadius: 10,
      padding: 11,
      background: "#FBFCFD"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        color: "#B0002C"
      }}><SysIcon name="delete" size={15} /><b style={{
          fontSize: 8
        }}>Destructive actions</b></div>
      <div style={{
        marginTop: 9,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 7
      }}>
        <button style={{
          height: 34,
          border: "1px solid #DDE3EA",
          borderRadius: 7,
          background: "#fff",
          color: "#B0002C",
          fontSize: 7
        }}>Delete lead</button>
        <button style={{
          height: 34,
          border: 0,
          borderRadius: 7,
          background: "#B0002C",
          color: "#fff",
          fontSize: 7
        }}>Confirm delete</button>
      </div>
      <div style={{
        marginTop: 8,
        fontSize: 6,
        lineHeight: "11px",
        color: "#667085"
      }}>Use confirmation when impact is costly or irreversible. State the object and consequence explicitly; never rely on red alone.</div>
    </div>
  </div>;
}
function SelectionVsFocus() {
  const t = theme.light;
  return <div style={{
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8
  }}>
    <div style={{
      border: "1px solid " + t.border,
      borderRadius: 9,
      padding: 10,
      background: t.surface
    }}>
      <div style={{
        fontSize: 8,
        fontWeight: 800
      }}>Focus only</div>
      <div style={{
        marginTop: 9,
        height: 38,
        border: "1px solid " + t.focus,
        borderRadius: 7,
        boxShadow: "0 0 0 2px " + t.focusRing,
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "0 9px",
        fontSize: 7
      }}><SysIcon name="contacts" size={15} />Contacts</div>
      <div style={{
        marginTop: 7,
        fontSize: 6,
        color: t.text3
      }}>Keyboard location. It does not imply the item is selected.</div>
    </div>
    <div style={{
      border: "1px solid " + t.border,
      borderRadius: 9,
      padding: 10,
      background: t.surface
    }}>
      <div style={{
        fontSize: 8,
        fontWeight: 800
      }}>Selected + focus</div>
      <div style={{
        marginTop: 9,
        height: 38,
        border: "1px solid " + t.focus,
        borderRadius: 7,
        boxShadow: "0 0 0 2px " + t.focusRing,
        background: t.selected,
        color: t.interactive,
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "0 9px",
        fontSize: 7,
        fontWeight: 700
      }}><SysIcon name="leads" size={15} />Leads</div>
      <div style={{
        marginTop: 7,
        fontSize: 6,
        color: t.text3
      }}>Persistent selection remains visible independently from keyboard focus.</div>
    </div>
  </div>;
}
function InteractionSemanticsSystem() {
  return <div style={{
    display: "grid",
    gap: 12
  }}>
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10
    }}><InteractionStateMatrix mode="light" /><InteractionStateMatrix mode="dark" /></div>
    <div style={{
      display: "grid",
      gridTemplateColumns: "1.25fr .75fr",
      gap: 10
    }}>
      <div><div style={{
          fontSize: 9,
          fontWeight: 800,
          marginBottom: 7
        }}>KEYBOARD CONTRACT</div><KeyboardContract /></div>
      <div><div style={{
          fontSize: 9,
          fontWeight: 800,
          marginBottom: 7
        }}>FOCUS ≠ SELECTION</div><SelectionVsFocus /></div>
    </div>
    <div><div style={{
        fontSize: 9,
        fontWeight: 800,
        marginBottom: 7
      }}>OVERLAY & FOCUS MANAGEMENT</div><OverlayBehaviorContract /></div>
    <div><div style={{
        fontSize: 9,
        fontWeight: 800,
        marginBottom: 7
      }}>ASYNC + DESTRUCTIVE SAFETY</div><AsyncDestructiveContract /></div>
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(5,1fr)",
      gap: 8
    }}>
      {[["Focus visibility", "Never remove focus outline without an equivalent visible replacement."], ["Focus contrast", "Aim for a 2px-equivalent perimeter with ≥3:1 focused/unfocused contrast."], ["Pointer target", "Interactive icon target stays 44px+ when space allows."], ["Motion", "Respect reduced-motion; movement explains state, never delays work."], ["RTL", "Mirror directional flow, not literal object/status icons."]].map(([a, b]) => <div key={a} style={{
        padding: 10,
        borderRadius: 9,
        background: "#F7F9FB",
        border: "1px solid #E8ECF1"
      }}><b style={{
          fontSize: 7
        }}>{a}</b><div style={{
          marginTop: 5,
          fontSize: 6,
          lineHeight: "10px",
          color: "#667085"
        }}>{b}</div></div>)}
    </div>
  </div>;
}
export const SystronicCoreControlsNavigation = () => {
  return <div style={{
    minHeight: "100vh",
    background: "#E9EDF2",
    color: "#181D36",
    fontFamily: "Inter, system-ui, sans-serif",
    padding: 28,
    overflow: "auto"
  }}>
    <div style={{
      width: 7200,
      minHeight: 2580
    }}>
      <header style={{
        height: 104,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 30,
        padding: "0 6px 20px"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 18
        }}><LogoMark large /><div><div style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: ".18em",
              color: brand.cyanDark
            }}>THE SYSTRONIC · DESIGN SYSTEM WALL</div><h1 style={{
              margin: "5px 0 0",
              fontSize: 32,
              lineHeight: "38px",
              fontWeight: 800,
              letterSpacing: "-.03em"
            }}>Dynamic UI Theme — Full Component Showcase</h1><div style={{
              marginTop: 4,
              fontSize: 11,
              color: "#667085"
            }}>Everything is visible. No tabs, no nested lists, no hidden variants. Light and dark cases appear side-by-side.</div></div></div>
        <div style={{
          display: "flex",
          gap: 8
        }}><span style={{
            padding: "7px 10px",
            borderRadius: 7,
            background: "#fff",
            fontSize: 9,
            fontWeight: 700
          }}>UI FOUNDATION v0.1</span><span style={{
            padding: "7px 10px",
            borderRadius: 7,
            background: brand.navy,
            color: "#fff",
            fontSize: 9,
            fontWeight: 700
          }}>CANONICAL</span></div>
      </header>


      <main style={{
        display: "grid",
        gridTemplateColumns: "repeat(12,1fr)",
        gap: 18,
        alignItems: "start"
      }}>
        <BoardFrame number="00" title="Branding" subtitle="Primary lockups, symbol and visual signature" span={2} minH={520}>
          <div style={{
            display: "grid",
            gap: 16
          }}>
            <div style={{
              padding: 16,
              borderRadius: 12,
              background: "#fff",
              border: "1px solid #E8ECF1"
            }}><LogoLockup /></div>
            <div style={{
              padding: 16,
              borderRadius: 12,
              background: "#0F141C"
            }}><LogoLockup dark /></div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2,1fr)",
              gap: 8
            }}>
              <Swatch color={brand.navy} label="Navy" usage="Authority" /><Swatch color={brand.cyan} label="Cyan" usage="Interaction" /><Swatch color={brand.teal} label="Teal" usage="Create" /><Swatch color={brand.red} label="Red" usage="Signature / critical" />
            </div>
            <div style={{
              padding: 11,
              borderRadius: 9,
              background: "#F7F9FB",
              fontSize: 8,
              lineHeight: "14px",
              color: "#475467"
            }}><b>Brand character:</b> Clean · Formal · Minimal · Organized · Systematic · Obvious · Premium.</div>
          </div>
        </BoardFrame>


        <BoardFrame number="01" title="Global Color System" subtitle="Primitive values map into global semantic UI roles. Components consume tokens, never raw brand shades." span={4} minH={520}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1.5fr .8fr",
            gap: 14
          }}>
            <TokenTable />
            <div style={{
              display: "grid",
              gap: 8
            }}>
              <SemanticPalette mode="light" />
              <SemanticPalette mode="dark" />
              <div style={{
                padding: 9,
                borderRadius: 8,
                background: "#F7F9FB",
                fontSize: 8,
                color: "#475467"
              }}><b>Rule:</b> no decorative colored strokes. Use fill + icon + text. Focus ring is the only functional exception.</div>
            </div>
          </div>
        </BoardFrame>


        <BoardFrame number="02" title="Typography" subtitle="Global type roles remain stable across light/dark and business configurations." span={2} minH={520}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10
          }}>
            <TypographyMode mode="light" /><TypographyMode mode="dark" />
          </div>
        </BoardFrame>


        <BoardFrame number="03" title="App Shell" subtitle="The complete shell appears in both modes. Same structure, different theme values." span={4} minH={520}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12
          }}><div><ModeLabel mode="light" /><div style={{
                marginTop: 7
              }}><MiniAppShell mode="light" /></div></div><div><ModeLabel mode="dark" /><div style={{
                marginTop: 7
              }}><MiniAppShell mode="dark" /></div></div></div>
        </BoardFrame>


        <BoardFrame number="04" title="Buttons" subtitle="Every intent and interaction state shown together. No click-through variants." span={4} minH={600}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10
          }}>
            <ButtonsMatrixMode mode="light" /><ButtonsMatrixMode mode="dark" />
          </div>
        </BoardFrame>


        <BoardFrame number="05" title="Inputs & Fields" subtitle="Default, focus, filled, error, disabled and Arabic cases visible at once." span={4} minH={600}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10
          }}>
            <InputsMode mode="light" /><InputsMode mode="dark" />
          </div>
        </BoardFrame>


        <BoardFrame number="06" title="Selection Controls" subtitle="Checkbox, radio, toggle, segmented and chips in both modes." span={2} minH={560}><SelectionStates mode="light" /><div style={{
            marginTop: 10
          }}><SelectionStates mode="dark" /></div></BoardFrame>


        <BoardFrame number="07" title="Feedback & Status" subtitle="Semantic surfaces use matched saturation/brightness and neutral structure." span={3} minH={560}><FeedbackGrid mode="light" /><div style={{
            marginTop: 10
          }}><FeedbackGrid mode="dark" /></div></BoardFrame>


        <BoardFrame number="08" title="Overlays" subtitle="Modal, drawer, popover and tooltip shown as visible patterns." span={4} minH={500}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10
          }}>
            <OverlaysMode mode="light" /><OverlaysMode mode="dark" />
          </div>
        </BoardFrame>


        <BoardFrame number="09" title="Tables" subtitle="Dense business tables, selected rows, status cells and mode parity." span={3} minH={520}><TableSample mode="light" /><div style={{
            marginTop: 10
          }}><TableSample mode="dark" /></div></BoardFrame>


        <BoardFrame number="10" title="Widgets & Dashboard Blocks" subtitle="Reusable KPI, trend, list, activity and progress frames." span={4} minH={500}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10
          }}>
            <WidgetsMode mode="light" /><WidgetsMode mode="dark" />
          </div>
        </BoardFrame>


        <BoardFrame number="11" title="Data Visualization" subtitle="Comparison, trends, overlap, heatmaps and theme-driven data color roles." span={4} minH={500}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10
          }}>
            <DataVizMode mode="light" /><DataVizMode mode="dark" />
          </div>
        </BoardFrame>


        <BoardFrame number="12" title="Reporting Composition" subtitle="Filters, KPI summary, analysis region, narrative and export." span={4} minH={500}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10
          }}>
            <ReportingMode mode="light" /><ReportingMode mode="dark" />
          </div>
        </BoardFrame>


        <BoardFrame number="13" title="View & Data Management" subtitle="Filters, saved views, columns, pagination and density patterns." span={4} minH={440}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10
          }}>
            <ViewManagementMode mode="light" /><ViewManagementMode mode="dark" />
          </div>
        </BoardFrame>


        <BoardFrame number="14" title="System States" subtitle="Loading, empty, error and permission-restricted states are mandatory." span={3} minH={440}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10
          }}>
            <SystemStatesMode mode="light" /><SystemStatesMode mode="dark" />
          </div>
        </BoardFrame>


        <BoardFrame number="15" title="Iconography & Functional Symbols" subtitle="Canonical functional mapping using one icon language. Meanings stay stable across businesses and themes." span={12} minH={980}>
          <IconographySystem />
        </BoardFrame>
      
        <BoardFrame number="16" title="Interaction Semantics & Accessibility" subtitle="Canonical behavior contract for focus, selection, keyboard, overlays, async actions, destructive safety and RTL." span={12} minH={1180}>
          <InteractionSemanticsSystem />
        </BoardFrame>
      </main>
    </div>
  </div>;
};